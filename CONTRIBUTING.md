# Contributing to Vanilla Chat

Thanks for wanting to help! Vanilla Chat is a small, privacy-first web chat UI for local and cloud AI models. It is intentionally uncomplicated: a plain Express server plus a vanilla-JS frontend, no build step. Read this guide before you touch code.

## Project overview

- **Backend** — Node.js + Express (`server.js` boots it, `src/` holds the logic).
- **Frontend** — a single-page app in `public/`: `index.html` (markup), `styles.css` (styling), `app.js` (all UI logic). No frameworks, no bundler.
- **Providers** — adapters in `src/providers/` for Ollama, LM Studio, OpenAI, Anthropic, HuggingFace, Gemini, and the Aider / Goose / OpenCode CLIs.
- **Desktop** — `gelectron/` is the main wrapper (Rust shell with a bundled Ollama runtime); `electron/` is a legacy Electron wrapper. Neither is needed for web development.
- **Themes** — JSON files in `themes/` that override colors, accent, logo, mascot, strings, and CSS. Full authoring docs: `themes/themes.html` (served at `/themes/themes.html`).
- **Data** — conversations are stored as JSON files in `data/conversations/` (gitignored).

## Getting started

Requirements: Node.js 18+, and Ollama (or LM Studio) running locally if you want to test with real models.

**Simplest setup — run the installer script.** `./run-this-furst.sh` clones and builds the Gelectron desktop shell and `gelectron-ollama` runtime, installs all app dependencies, and launches Vanilla Chat for you. Options: `--run` install then launch, `--no-build` reuse an existing Gelectron binary, `--help` for details.

Manual setup:

```bash
npm install
npm start
```

Open `http://localhost:2051`. Run `npm start -- -g` to launch the Gelectron desktop build, or `npm start -- -e` for Electron. `npm run dev` runs the server with `node --watch` so it restarts on file changes.

## Project structure

```
vanilla-sh/
├── server.js             Express app + static file serving
├── start.js              Launcher: web / Gelectron (-g) / Electron (-e)
├── config/default.json   Server config (port, providers, timeouts)
├── src/
│   ├── routes.js         All API routes (register(app))
│   ├── search.js         Web search (DuckDuckGo default, Brave optional)
│   ├── storage.js        Conversation persistence
│   ├── upload.js         File upload / OCR handling
│   ├── titles.js         Auto-naming conversations
│   ├── system.js         CPU / RAM / GPU stats
│   ├── huggingface.js    GGUF model search + install into Ollama
│   ├── providers/        Provider adapters (see list above)
│   └── errors.js
├── public/
│   ├── index.html        SPA markup
│   ├── app.js            All UI logic
│   ├── styles.css        All styling (CSS custom properties for theming)
│   └── assets/ music/    Static assets
├── themes/               Theme JSON files + themes.html docs
├── gelectron/            Gelectron desktop wrapper (main.js, splash.html)
├── electron/             Legacy Electron wrapper
└── docs/                 Historical design/task notes (not user docs)
```

## How it works

### Request flow

1. The browser POSTs to `POST /api/chat/stream` with `{ messages, provider, model, search, searchBackend, searchApiKey, ... }`.
2. `src/routes.js` builds the provider request and streams the response back as Server-Sent Events (`text/event-stream`).
3. If `search` is true and there is a user message, `src/search.js` searches the web first and injects a system context block with citations before the last user message.
4. The frontend in `public/app.js` appends tokens to the active assistant message as they arrive.

### Theming

Themes are applied client-side: `applyTheme()` in `public/app.js` maps `colors.*` keys onto CSS custom properties (`--bg`, `--text`, `--surface`, `--accent`, …), swaps the logo/mascot SVGs, and injects any raw CSS into a `<style id="theme-styles">` tag. `GET /api/themes` lists what's available. To add a theme, drop a `.json` file in `themes/` and follow the schema in `themes/themes.html`.

### Important gotchas

- `GET /api/search` is the **in-app conversation search** — the web-search test endpoint is `GET /api/websearch` instead. Don't collide with existing route names.
- The mascot's eye-scan is the `.mascot-gaze` class on the eyes `<g>` in the SVG strings (`public/app.js` `MASCOT_SVG()`, plus the inline SVGs in `public/index.html`). The animation itself is `@keyframes mascot-gaze` in `public/styles.css`.
- Settings are persisted from `applySettings()` in `public/app.js` under `vanilla-*` keys in `localStorage`. There is no separate `saveSettings()` function.

## Code style

- **Vanilla everything.** No new frameworks, no bundler, no CSS preprocessor. Match the existing patterns in the file you're editing.
- **No comments unless they earn their keep.** The codebase favors clear naming over comment noise.
- **Colors via CSS custom properties.** Prefer `var(--token, fallback)` over hardcoded hex so themes keep working. When a surface needs theming, add a variable to `:root` in `styles.css` and map it in `applyTheme()`.
- **Server errors** — log with `console.error` (gelectron writes stderr to the log file); `console.log` goes to a pipe and is invisible in the desktop log.
- **Keep it small.** One focused change per PR.

## Verifying your changes

```bash
node --check public/app.js      # syntax-check the UI bundle
node --check src/routes.js      # or any other file you touched
```

- The dev server serves `public/`, `themes/`, and `ui/` straight from disk, so frontend edits are live after a refresh. Changes to `src/*.js` require a server restart (or `npm run dev` with `--watch`).
- Smoke-test with curl, e.g. `curl http://localhost:2051/api/health`, and hit `/api/websearch?q=…` to check the web-search path.
- If you changed streaming behavior, test with a local model (Ollama) and confirm the response streams token-by-token.

## Git workflow

- Create a branch for your change: `git checkout -b fix/your-change` or `git checkout -b feature/your-change`.
- Commit messages in this repo are short and lowercase, e.g. `fixed`, `update`, `made the app compile`. Match that tone.
- Open a PR against the main branch and describe what changed and why.

## Troubleshooting

- **Port 2051 already in use / serving stale content** — a previously installed `VanillaChat.app` may have grabbed the port. Find the listener with `lsof -nP -iTCP:2051 -sTCP:LISTEN` and kill it (or the stale copy) before starting the dev server.
- **Logs** — the Gelectron desktop app writes stderr to the log file, not stdout. Search it for provider/search errors.
- **Search returns nothing** — DuckDuckGo is the default backend and needs no key; Brave requires a `braveApiKey`. Failures are non-fatal and logged, so the chat still answers.
