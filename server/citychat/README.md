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
| `CITYCHAT_MODEL` | `gemini-flash-latest` | model name as the provider knows it |
| `CITYCHAT_API_KEY` | | also read from `GEMINI_API_KEY` |
| `CITYCHAT_BASE_URL` | Gemini's | required for `openai` |
| `CITYCHAT_TEMPERATURE` | `0.3` | |
| `CITYCHAT_TIMEOUT_MS` | `60000` | per model call |
| `CITYCHAT_PORT` / `CITYCHAT_HOST` | `3100` / `127.0.0.1` | |
| `CITYCHAT_DATA_DIR` | `public/data` | the data to answer from |
| `CITYCHAT_RATE_MAX` | `30` | questions per IP per 10 minutes |
| `CITYCHAT_MAX_CONCURRENT` | `4` | answers in flight at once |
| `CITYCHAT_TRUST_PROXY` | on | read the client IP from `X-Forwarded-For`; set `0` if nothing proxies |
| `CITYCHAT_ALLOW_ORIGIN` | | CORS origin, only if the page is served from another host |

Examples:

```bash
# Gemini (default). Pin a dated model in production so answers do not change under you.
CITYCHAT_MODEL=gemini-2.5-flash GEMINI_API_KEY=… npm run citychat

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
