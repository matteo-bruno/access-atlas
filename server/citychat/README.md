# CityChat (beta)

A chat tab (`/citychat`) that answers questions about the Atlas's layers,
cities and places **from the published data**. A language model decides what
to ask; the figures come from tools that run the viewer's own code over
`public/data/`, and every number in an answer is checked against what those
tools returned.

```
browser ──NDJSON──▶ web server  /atlas/api/citychat  (proxy)
                        │
                        ▼
                server/citychat/server.mjs   localhost:3100
                · system prompt: rules + the site's own copy   knowledge.mjs
                · tools over public/data/                      tools.mjs
                · figure check on every answer                 numbers.mjs
                        │  provider adapter                    llm/
                        ▼
                Gemini API · any OpenAI-compatible server (vLLM, llama.cpp, Ollama, …)
```

The static site does not depend on it. A build only talks to the service when
it is built with `VITE_CITYCHAT=1` (or `VITE_CITYCHAT_URL=<url>`, for a service
on another host); otherwise the tab says CityChat is not enabled and makes no
request. With the flag on and the service down, it says the service is
unreachable. Nothing else on the site changes either way. `npm run dev` is
always on.

## Running it locally

```bash
export GEMINI_API_KEY=…          # https://aistudio.google.com/apikey
npm run citychat                 # the service, on 127.0.0.1:3100
npm run dev                      # Vite proxies /api/citychat to it
```

Against a build: `VITE_CITYCHAT=1 npm run build`, then
`CITYCHAT_PREVIEW=1 npm run preview` (preview only proxies when asked, so the
browser suites see no service rather than a 500).

`npm run test:citychat` checks the tools against the published summaries, the
figure check, the chat loop and both provider adapters, with no network and
no key.

## Choosing the model

Everything is environment variables; no code changes to switch.

| Variable | Default | |
| --- | --- | --- |
| `CITYCHAT_PROVIDER` | `gemini` | `gemini` or `openai` (any OpenAI-compatible API) |
| `CITYCHAT_MODEL` | `auto` (Gemini) | comma-separated models, most preferred first; see [Fallback](#fallback-when-a-model-will-not-answer) |
| `CITYCHAT_API_KEY` | | also read from `GEMINI_API_KEY` |
| `CITYCHAT_BASE_URL` | Gemini's | required for `openai` |
| `CITYCHAT_TEMPERATURE` | `0.3` | |
| `CITYCHAT_TIMEOUT_MS` | `45000` | per model call; a timeout moves on to the next model |
| `CITYCHAT_PORT` / `CITYCHAT_HOST` | `3100` / `127.0.0.1` | |
| `CITYCHAT_DATA_DIR` | `public/data` | the data to answer from |
| `CITYCHAT_RATE_MAX` | `30` | questions per IP per 10 minutes |
| `CITYCHAT_MAX_CONCURRENT` | `4` | answers in flight at once |
| `CITYCHAT_TRUST_PROXY` | on | read the client IP from `X-Forwarded-For`; set `0` if nothing proxies |
| `CITYCHAT_ALLOW_ORIGIN` | | CORS origin, only if the page is served from another host |

Examples:

```bash
# Gemini (default): every Flash model the key can call, newest first
GEMINI_API_KEY=… npm run citychat

# Gemini with a fixed order, e.g. to keep answers stable in production
CITYCHAT_MODEL=gemini-3.8-flash,gemini-3-flash,gemini-2.5-flash GEMINI_API_KEY=… npm run citychat

# A local model on vLLM
vllm serve Qwen/Qwen3-30B-A3B-Instruct-2507 --enable-auto-tool-choice --tool-call-parser hermes
CITYCHAT_PROVIDER=openai CITYCHAT_BASE_URL=http://127.0.0.1:8000/v1 \
CITYCHAT_MODEL=Qwen/Qwen3-30B-A3B-Instruct-2507 npm run citychat

# Ollama (CPU is fine for trying it; slow for a public service)
CITYCHAT_PROVIDER=openai CITYCHAT_BASE_URL=http://127.0.0.1:11434/v1 CITYCHAT_MODEL=qwen3:8b npm run citychat

# llama.cpp
llama-server -m model.gguf --jinja --port 8080
CITYCHAT_PROVIDER=openai CITYCHAT_BASE_URL=http://127.0.0.1:8080/v1 CITYCHAT_MODEL=local npm run citychat

# Hosted OpenAI-compatible APIs: OpenAI, Mistral, DeepSeek, OpenRouter, Groq
CITYCHAT_PROVIDER=openai CITYCHAT_BASE_URL=https://api.deepseek.com/v1 CITYCHAT_MODEL=deepseek-chat CITYCHAT_API_KEY=… npm run citychat
```

What matters in a model, in order: **reliable tool calling** (a model that
answers from memory is the failure this design exists to prevent), **Italian**
as well as English, then speed. Reasoning models work but are slow for this;
their `<think>` blocks are stripped. Before switching models, ask the same set
of questions per persona and read the answers against the tool trace the page
shows under each one.

A third API protocol (Anthropic's, say) is one more file in `llm/` implementing
`complete({ system, messages, tools })`; `llm/index.mjs` describes the format.

## Fallback: when a model will not answer

The free tier of Gemini runs out per model and per minute, models get
overloaded, and names are retired. So `CITYCHAT_MODEL` is a list, and a turn
that fails on one model is run again on the next (`llm/chain.mjs`):

| The model answers | What happens |
| --- | --- |
| 429 (quota) | next model; this one rests for the delay Google states (`retryDelay`), else a minute |
| 404 (no such model) | next model; rests six hours |
| 403 (not open to this key or tier) | next model; rests thirty minutes |
| 5xx, timeout, unreadable answer | next model; rests thirty seconds |
| 400 (malformed request) | no fallback: every model would refuse the same request |

A resting model goes to the back of the list rather than out of it, so when
everything is resting the chain is still tried in order. If every model
fails, the page says so, and says "over quota, try again in a minute" when
that is the reason for all of them.

The turn starts over on the next model rather than continuing: a Gemini
turn carries that model's thought signatures, which another model refuses.
The tools are deterministic and cheap, so the cost is a second or two. The
page clears the tool calls it was showing and says which model is taking
over; every answer names the model that gave it, and the log line records
the fallbacks.

**`auto`** asks the API which models the key can call (`GET /models`, cached
for six hours) and keeps the plain Flash ones: newest version first, a stable
release before its preview, every full Flash before any Flash-Lite. Aliases,
dated snapshots and the image, audio, TTS and live variants are left out. It
can be mixed with names: `gemini-2.5-flash,auto` tries that one first and
then everything else. If the list cannot be fetched, the last good one is
used, or Google's `gemini-flash-latest` alias if there never was one.

The same list works for `CITYCHAT_PROVIDER=openai`, over the models one
server offers (`qwen3:14b,qwen3:8b` on Ollama). Falling back from Gemini to a
local model would need a list that mixes providers; the chain supports it,
the environment variables do not yet.

## What the model can call

| Tool | Returns |
| --- | --- |
| `list_cities` | published cities, their ids and layers |
| `city_overview` | every layer's headline figures for one city |
| `layer_detail` | 15-minute medians per category and mode, CityChrone by hour, CDI opportunities, P.O.V. thresholds |
| `rank_cells` | the highest or lowest populated cells on a measure, with coordinates |
| `cell_at` | everything for the cell at a coordinate, and where it stands in its city |
| `compare_cities` | the compare rows for `cardep` and `pov` |

They are computed with `grid.js` and `adapters.js`, so the chat and the map
cannot disagree; `test:citychat` checks them against the importers' summary
files for Milan, Rome and Zurich. Results carrying a `mapUrl` become "show on
map" buttons: `/atlas/<city>?layer=…&cell=<h3>` selects that cell and frames
the ground around it.

## The figure check, and its limit

`numbers.mjs` extracts every number from an answer (both locales' separators,
`m:ss` times, "1.2 million") and looks for it, at the precision written, among
the tool results, the site copy and the conversation. Anything left over is
sent back once for correction; what survives is shown to the reader as
possibly wrong.

It matches values, not meanings. A rounded figure that happens to equal a
different figure in the results passes. It catches invented and misremembered
numbers, which is the common failure, and does not prove each figure is
attributed correctly. The prompt's rules and the visible tool trace do the
rest.

## Deploying next to the static site

The service needs a checkout of this repo (it imports `src/data/` and
`scripts/lib/`) with `npm ci` run, Node 20+, and the published data.

`/etc/systemd/system/citychat.service`:

```ini
[Unit]
Description=CityChat (Accessibility Atlas)
After=network-online.target

[Service]
WorkingDirectory=/opt/access-atlas
ExecStart=/usr/bin/node server/citychat/server.mjs
EnvironmentFile=/etc/citychat.env
Environment=CITYCHAT_DATA_DIR=/var/www/whatif/atlas/data
User=citychat
Restart=on-failure
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

`/etc/citychat.env` (mode 600, never in the repo): `GEMINI_API_KEY=…`.

Apache, in the `:443` vhost, **outside** the `<Directory>` block that holds the
SPA rewrite (ProxyPass is resolved before it):

```apache
ProxyPass        /atlas/api/citychat http://127.0.0.1:3100/api/citychat flushpackets=on
ProxyPassReverse /atlas/api/citychat http://127.0.0.1:3100/api/citychat
```

Then build the site with the tab switched on:
`VITE_CITYCHAT=1 scripts/deploy.sh` (the script passes the environment to the
build).

`flushpackets=on` lets the tool calls reach the page as they happen. Check it
with `curl https://whatif.sonycsl.it/atlas/api/citychat/health`, which must
answer JSON: an HTML page there is the SPA fallback, meaning the proxy is not
in place.

`scripts/deploy.sh` does not touch the service; after a data update, restart
it (`systemctl restart citychat`) so its cache reads the new files.

## Privacy

Questions and answers are not logged; the service logs one line per request
with the provider, persona, city, tools called, token counts, outcome and
time. They are, however, sent to the model provider. On Gemini's free tier
Google may use prompts to improve its products; use a paid tier, or a local
model, before opening this to the public. The page tells readers not to
include personal information.
