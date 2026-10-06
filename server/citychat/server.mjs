#!/usr/bin/env node
// CityChat's HTTP service.
//
//   GEMINI_API_KEY=… npm run citychat
//
// One endpoint, POST /api/citychat, answering as NDJSON: one JSON event per
// line (tool calls as they happen, then the answer), so the page can show
// which data the answer is being built from while it waits. GET
// /api/citychat/health says which model is configured.
//
// It listens on localhost only. In production the web server proxies
// /atlas/api/citychat to it (README, "CityChat"); in development Vite does.
// The static site keeps working without it: the CityChat tab says the
// service is unreachable, and every other page is untouched.
//
// No dependencies beyond the repo's own: node:http, fetch, and the same
// data code the viewer runs.
//
// Privacy: questions and answers are not logged. The log line per request
// carries the provider, the tools called, token counts and the time taken.

import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { providerFromEnv } from './llm/index.mjs';
import { ProviderError } from './llm/http.mjs';
import { createDataStore, createTools } from './tools.mjs';
import { runChat } from './chat.mjs';
import { LANGUAGES, PERSONA_IDS } from './knowledge.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const env = process.env;

const PORT = Number(env.CITYCHAT_PORT || 3100);
const HOST = env.CITYCHAT_HOST || '127.0.0.1';
const DATA_DIR = path.resolve(env.CITYCHAT_DATA_DIR || path.join(ROOT, 'public', 'data'));
const ALLOW_ORIGIN = env.CITYCHAT_ALLOW_ORIGIN || '';
const TRUST_PROXY = env.CITYCHAT_TRUST_PROXY !== '0';

// Limits. A public endpoint in front of a paid API, or of one GPU, needs them.
const MAX_QUESTION = 1500;
const MAX_MESSAGES = 20;
const MAX_BODY = 64 * 1024;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX = Number(env.CITYCHAT_RATE_MAX || 30);
const MAX_CONCURRENT = Number(env.CITYCHAT_MAX_CONCURRENT || 4);
const HEARTBEAT_MS = 10 * 1000;

// A chain of models, tried in order (llm/chain.mjs).
const provider = providerFromEnv(env);
const runTool = createTools(createDataStore(DATA_DIR));

const hits = new Map(); // ip → timestamps within the window
let inFlight = 0;

function rateLimited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (recent.length >= RATE_MAX) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  return false;
}
setInterval(() => {
  const now = Date.now();
  for (const [ip, times] of hits) if (!times.some((t) => now - t < RATE_WINDOW_MS)) hits.delete(ip);
}, RATE_WINDOW_MS).unref();

function clientIp(req) {
  const forwarded = TRUST_PROXY ? String(req.headers['x-forwarded-for'] ?? '').split(',')[0].trim() : '';
  return forwarded || req.socket.remoteAddress || 'unknown';
}

function sendJSON(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(body));
}

async function readBody(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY) throw Object.assign(new Error('too large'), { status: 413 });
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}

/** The request, cleaned to what the chat loop accepts, or an error code. */
function validate(body) {
  const messages = Array.isArray(body?.messages) ? body.messages : null;
  if (!messages?.length) return { error: 'no_messages' };
  if (messages.length > MAX_MESSAGES) return { error: 'too_long' };
  const clean = [];
  for (const m of messages) {
    if (!['user', 'assistant'].includes(m?.role) || typeof m.text !== 'string') return { error: 'bad_message' };
    const text = m.text.trim().slice(0, m.role === 'user' ? MAX_QUESTION : 6000);
    if (!text) continue;
    // Two turns from the same side in a row (a question whose answer failed,
    // then the next one) become one: not every API accepts them apart.
    const last = clean.at(-1);
    if (last?.role === m.role) last.text += `\n\n${text}`;
    else clean.push({ role: m.role, text });
  }
  if (clean.at(-1)?.role !== 'user') return { error: 'bad_message' };
  // A conversation must start with the user for every provider.
  while (clean[0]?.role === 'assistant') clean.shift();
  return {
    messages: clean,
    persona: PERSONA_IDS.includes(body.persona) ? body.persona : undefined,
    city: typeof body.city === 'string' && /^[a-z0-9-]{1,40}$/.test(body.city) ? body.city : undefined,
    lang: Object.hasOwn(LANGUAGES, body.lang) ? body.lang : 'en',
  };
}

async function handleChat(req, res) {
  const ip = clientIp(req);
  if (rateLimited(ip)) return sendJSON(res, 429, { error: 'rate_limited' });
  if (inFlight >= MAX_CONCURRENT) return sendJSON(res, 503, { error: 'busy' });

  let body;
  try {
    body = await readBody(req);
  } catch (error) {
    return sendJSON(res, error.status ?? 400, { error: 'bad_request' });
  }
  const input = validate(body);
  if (input.error) return sendJSON(res, 400, { error: input.error });

  inFlight++;
  const started = Date.now();
  const tools = [];
  let usage = null;
  let outcome = 'ok';
  let answeredBy = null;
  let fallbacks = [];
  // NDJSON: the content type is what the page checks first, because under the
  // SPA fallback a wrong URL answers index.html with a 200.
  res.writeHead(200, {
    'Content-Type': 'application/x-ndjson; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Accel-Buffering': 'no',
  });
  const send = (event) => res.write(`${JSON.stringify(event)}\n`);
  let closed = false;
  res.on('close', () => {
    closed = true;
  });
  // A line every few seconds whatever the model is doing, so no proxy on the
  // way (Apache's ProxyTimeout, a load balancer's idle timeout) takes a long
  // silence for a dead connection. The page ignores it.
  const heartbeat = setInterval(() => {
    if (!closed) send({ type: 'ping' });
  }, HEARTBEAT_MS);

  try {
    for await (const event of runChat({ provider, runTool, ...input })) {
      if (event.type === 'tool') tools.push(event.name);
      if (event.type === 'answer') {
        usage = event.usage;
        answeredBy = event.model;
        fallbacks = event.fallbacks ?? [];
        if (event.unverified.length) outcome = 'unverified';
        delete event.usage;
        delete event.fallbacks;
      }
      if (event.type === 'error') outcome = event.code;
      if (closed) break;
      send(event);
    }
  } catch (error) {
    outcome = error instanceof ProviderError ? `provider:${error.status ?? 'error'}` : 'error';
    if (error.failures) fallbacks = error.failures;
    console.error('[citychat]', error.message, error.detail ?? '');
    // "Every model is over quota" is its own message: it passes if you wait.
    const code = error.quota ? 'quota' : error instanceof ProviderError ? 'provider' : 'server';
    if (!closed) send({ type: 'error', code });
  } finally {
    clearInterval(heartbeat);
    inFlight--;
    res.end();
    console.log(
      JSON.stringify({
        t: new Date().toISOString(),
        model: answeredBy,
        fallbacks: fallbacks.map((f) => `${f.model}:${f.status ?? (f.started ? 'stalled' : 'no-answer')}`),
        persona: input.persona ?? null,
        city: input.city ?? null,
        turns: input.messages.length,
        tools,
        usage,
        outcome,
        ms: Date.now() - started,
      }),
    );
  }
}

const server = http.createServer(async (req, res) => {
  if (ALLOW_ORIGIN) {
    res.setHeader('Access-Control-Allow-Origin', ALLOW_ORIGIN);
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Vary', 'Origin');
  }
  // Mounted wherever the proxy puts it: only the tail of the path matters.
  const { pathname } = new URL(req.url, 'http://localhost');
  const route = pathname.replace(/\/+$/, '').split('/api/citychat')[1];
  if (route === undefined) return sendJSON(res, 404, { error: 'not_found' });
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }
  if (route === '/health' && req.method === 'GET') {
    // Resolving the chain here is what turns `auto` into model names (cached
    // for hours), so the page can say which model it will be talking to.
    await provider.candidates().catch(() => null);
    return sendJSON(res, 200, { ok: true, provider: provider.name });
  }
  if (route === '' && req.method === 'POST') return handleChat(req, res);
  return sendJSON(res, 405, { error: 'method_not_allowed' });
});

server.listen(PORT, HOST, () => {
  console.log(`[citychat] ${provider.name} on http://${HOST}:${PORT}/api/citychat, data from ${DATA_DIR}`);
});
