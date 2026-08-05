# Contributing to Vanilla Chat

<p align="center">
  <img src="./logo.png" alt="Vanilla Chat logo" width="140">
</p>

> Thanks for wanting to help! Vanilla Chat is a small, privacy-first web chat UI for local
> and cloud AI models. It stays deliberately uncomplicated — an Express server plus a
> vanilla-JS frontend, **no build step**, no frameworks.

---

## Contents

- [Quick start](#quick-start)
- [Getting started](#getting-started)
- [Project overview](#project-overview)
- [Design notes](#design-notes)
- [Project structure](#project-structure)
- [How it works](#how-it-works)
- [How we code](#how-we-code)
- [Verifying your changes](#verifying-your-changes)
- [Git workflow](#git-workflow)
- [Troubleshooting](#troubleshooting)

---

## Quick start

```
./run-this-furst.sh
```

That's it. The script clones and builds the **Gelectron** desktop shell and the
**gelectron-ollama** runtime, installs all app dependencies, and launches Vanilla Chat.
Useful flags:

| Flag | What it does |
| --- | --- |
| `--run` | Install, then launch the app |
| `--no-build` | Reuse an existing Gelectron binary (skips the Rust build) |
| `--help` | Show the full option list |

Prefer the web build? See [Getting started](#getting-started) below.

## Getting started

Requirements:

- [Node.js](https://nodejs.org) 18+
- `npm` (comes with Node)
- `cargo` (Rust) only if you build Gelectron yourself — or pass `--no-build`
- Ollama or LM Studio running locally if you want to test with real models

Manual setup:

```bash
npm install
npm start
```

Open `http://localhost:2051` in your browser.

| Command | What it does |
| --- | --- |
| `npm start` | Run the web server |
| `npm start -- -g` | Launch the Gelectron desktop build |
| `npm start -- -e` | Launch the Electron desktop build |
| `npm run dev` | Run the server with `node --watch` (auto-restart on changes) |
| `npm run build` | Build the desktop app into `dist/VanillaChat.app` |

## Project overview

| Layer | Tech | Where |
| --- | --- | --- |
| Backend | Node.js + Express | `server.js`, `src/` |
| Frontend | Vanilla JS + CSS (no build step) | `public/` |
| Providers | Adapters per service | `src/providers/` |
| Desktop | Gelectron (Rust shell) / Electron (legacy) | `gelectron/`, `electron/` |
| Themes | JSON files + authoring docs | `themes/` |
| Data | JSON conversation files (gitignored) | `data/conversations/` |

## Design notes

These are the decisions that shape the code. Read them before touching a new area — the structure exists because of them.

- **The web build is the source of truth; the desktop shell is just a wrapper.** The whole app runs from `node server.js` and works in a plain browser. Gelectron/Electron add the window, splash screen, and update checking — nothing else. New features should be testable in the browser first.
- **No build step, no frameworks, no frontend npm deps.** `public/` is served straight off disk. The frontend is one file per concern: `index.html`, `app.js` (all UI logic), `styles.css`. This is deliberate — contributors never run a bundler, and diffs stay reviewable.
- **One wire protocol for every provider.** OpenAI, Anthropic, Gemini, Ollama, LM Studio, and the CLI providers all funnel through the same Server-Sent Events shape (`data: { "type": "token" | "tool_call" | "tool_result" | "tool_error" | "error" | "done", ... }\n\n`). The frontend only knows how to render this one protocol (`handleSsePart`), so adding a provider never touches the UI.
- **Providers are adapters.** Each lives in `src/providers/`, extends `Provider` (`src/providers/base.js`), and implements `hasConfiguredKey()`, `listModels()`, and `chatStream(messages, model, onToken, onDone, onError)`. New providers are registered in `src/providers/index.js` and configured under `CONFIG.providers`.
- **Settings live in the browser only.** Everything is read from and written back to `localStorage` under `vanilla-*` keys by `applySettings()` in `public/app.js`. There is no server-side settings store and no separate `saveSettings()` — the pattern is: change the toggle → update `state.settings` → call `applySettings()`.
- **Data is flat JSON on disk.** Conversations are individual JSON files in `data/conversations/` (gitignored), managed by `src/storage.js`. No database.
- **Privacy-first by default.** No telemetry or phone-home. DuckDuckGo is the default search backend because it needs no key. External calls happen only for the providers, search, and update feed the user enables.
- **Theming is CSS custom properties.** `applyTheme()` maps theme JSON `colors.*` onto `var(--bg)`, `--surface`, `--accent`, and so on. Hardcoding hex in new UI breaks themes — always use a variable, and register new ones in `:root` plus `applyTheme()`.
- **Errors are user-facing contracts.** APIs return `{ error, action, recoverable }` via `formatErrorForClient` (`src/errors.js`); the frontend `api()` helper turns that into an `Error` with `.action` and `.recoverable`, so the UI can show a "what to do" line instead of a stack trace.
- **Desktop-only features must degrade gracefully in the web build.** The update system is the template: `src/updater.js` only touches `require('electron')` when running in a packaged app (`isGelectronContext()`), so plain `node server.js` never downloads an Electron binary and the `/api/update/*` routes simply report `supported: false`. Follow the same guard pattern for new desktop integrations.
- **UI feedback is sound-aware.** Sounds come from `Sounds` (`public/sounds.js`, Web Audio only) and are gated through `Sounds.setEnabled()`. New feedback moments should use `Sounds.*`, not inline audio.

## Project structure

```
vanilla-sh/
├── server.js             Express app + static file serving
├── start.js              Launcher: web / Gelectron (-g) / Electron (-e)
├── run-this-furst.sh     One-shot installer (Gelectron + gelectron-ollama)
├── config/default.json   Server config (port, providers, timeouts)
├── src/
│   ├── routes.js         All API routes (register(app))
│   ├── search.js         Web search (DuckDuckGo default, Brave optional)
│   ├── storage.js        Conversation persistence
│   ├── upload.js         File upload / OCR handling
│   ├── titles.js         Auto-naming conversations
│   ├── system.js         CPU / RAM / GPU stats
│   ├── huggingface.js    GGUF model search + install into Ollama
│   ├── ollama.js         Ollama helpers (models, install)
│   ├── tools.js          Tool-calling loop (workspace search/web/file tools)
│   ├── workspace.js      Sandboxed file access under data/workspace/
│   ├── updater.js        Desktop app auto-update wrapper (web-safe)
│   ├── uninstall.js      Clean uninstall helpers
│   ├── lifecycle.js      Startup/shutdown hooks
│   ├── providers/        Provider adapters
│   └── errors.js
├── public/
│   ├── index.html        SPA markup
│   ├── app.js            All UI logic
│   ├── styles.css        All styling (CSS custom properties for theming)
│   ├── sounds.js         Web Audio UI sounds
│   ├── settings-ui.js    Settings helpers
│   └── assets/ music/    Static assets
├── themes/               JSON themes + themes.html authoring guide
├── gelectron/            Gelectron desktop wrapper (main.js, splash.html)
├── electron/             Legacy Electron wrapper
└── docs/                 Historical design/task notes
```

## How it works

### Request flow

1. The browser POSTs to `POST /api/chat/stream` with `{ messages, provider, model, search, searchBackend, searchApiKey, ... }`.
2. `src/routes.js` builds the provider request and streams the response back as Server-Sent Events (`text/event-stream`).
3. If `search` is true and there is a user message, `src/search.js` searches the web first and injects a system context block with citations before the last user message.
4. `public/app.js` appends tokens to the active assistant message as they arrive.

### Web search

- DuckDuckGo is the default backend (no key needed); Brave requires a `braveApiKey`.
- Search failures are non-fatal and logged via `console.error` — the chat still answers.
- `GET /api/search` is the **in-app conversation search**; the web-search test endpoint is `GET /api/websearch?q=&backend=&key=`. Don't collide with existing route names.
- The composer has a `data-tool="search"` pill that toggles it, synced with the Settings switch.

### Theming

Themes are applied client-side in `applyTheme()` (`public/app.js`): `colors.*` keys map onto CSS custom properties (`--bg`, `--text`, `--surface`, `--accent`, …), the logo/mascot SVGs are swapped, and raw CSS can be injected into a `<style id="theme-styles">`. `GET /api/themes` lists what's available.

To add a theme, drop a `.json` file in `themes/` following the schema in **`/themes/themes.html`**. Remember the SVG rules: provide a full inline `<svg>`, no `class` on the root (the app injects it), include a `viewBox`.

### Settings, toggles & sounds

- Settings is a tabbed modal (General / AI Model / Chat / Appearance / Shortcuts / Data & Privacy). The modal uses a fixed `height: min(85vh, 680px)` so it doesn't resize between tabs; the content pane scrolls.
- Settings persist from `applySettings()` (`public/app.js`) under `vanilla-*` keys in `localStorage`. There is no separate `saveSettings()` function.
- Toggle switches (`.toggle-input`) each have a `change` listener, plus one delegated listener that plays `Sounds.toggle()` — registered before the per-toggle handlers so a flick is heard even while muting.
- UI sounds come from `Sounds` (`public/sounds.js`) — Web Audio only, no audio files. The "Play UI sound effects" switch gates everything via `Sounds.setEnabled()`.

## How we code

**Frontend (`public/app.js`)**

- DOM references live in one `els = { ... }` map at the top of the file — add new elements there instead of scattering `document.querySelector` calls. App state lives in `state = { ... }`.
- Use the `api(path, { timeoutMs })` wrapper for all fetches — it normalizes errors, adds timeouts, and turns network failures into friendly messages. Don't hand-roll `fetch` + error handling.
- Wire UI with `data-*` attributes and event delegation (see the document-level click/keydown handlers), not inline `onclick`.
- Toggle switches are `.toggle-input` checkboxes with a `change` listener; the delegated sound listener is registered before per-toggle handlers so a flick is heard even while muting.
- Group related functions under section comments like `// ─── App updates ─────────`; otherwise keep comments rare.
- Keep functions small and named by their job: `renderConversationList`, `streamChat`, `handleSsePart` — one job per function.

**Backend (`src/`, `server.js`)**

- All routes are registered inside `register(app)` in `src/routes.js` — one place to see the whole API. Route handlers stay thin; real logic lives in the focused modules (`storage`, `search`, `tools`, `updater`, `workspace`, …), which export plain functions.
- `server.js` is thin: it boots the app, calls `register(app)`, and serves static dirs.
- Log with `console.error` — under Gelectron, stderr is what lands in the log file; `console.log` goes to a pipe and is invisible in the desktop log. Keep lines consistent with `formatErrorForLog(e, { endpoint })`.
- Never throw raw errors at the client. Use `formatErrorForClient` / `parseError` and set a sensible HTTP status.
- Config lives in `config/default.json`, read once as `CONFIG`. New knobs (timeouts, hosts, feed URLs) go there; env vars can override them (e.g. `VANILLA_UPDATE_FEED`).
- Keep chat resilient: search, model-list, and provider hiccups are non-fatal — the user should still be able to talk.

**Streaming protocol (SSE)**

- `Content-Type: text/event-stream`; each event is one JSON line: `data: { ... }\n\n`.
- Event types: `token` (append to the active assistant message), `tool_call`, `tool_result`, `tool_error`, `error`, `done` (`done` may carry `interrupted: true` when the user stops).
- The client buffers partial lines and feeds complete parts to `handleSsePart()`. Keep each write self-contained so a dropped connection doesn't corrupt the message.

**Other conventions**

- Vanilla everything. No new frameworks, bundlers, or CSS preprocessors. Match the patterns in the file you're editing.
- No comments unless they earn their keep. Clear naming beats comment noise.
- Colors via CSS custom properties (`var(--token, fallback)`), never hardcoded hex.
- CSS class names are kebab-case; JS uses camelCase; localStorage keys are `vanilla-*`.
- Keep it small. One focused change per PR.

## Verifying your changes

```bash
node --check public/app.js   # syntax-check the UI bundle
node --check src/routes.js   # or any other file you touched
```

- The dev server serves `public/`, `themes/`, and `ui/` straight from disk, so frontend edits are live after a hard refresh. Changes to `src/*.js` require a server restart — or use `npm run dev` (`node --watch`).
- Smoke-test with curl, e.g. `curl http://localhost:2051/api/health` and `curl 'http://localhost:2051/api/websearch?q=test'`.
- If you changed streaming behavior, test with a local model (Ollama) and confirm the response streams token-by-token.
- If you changed the settings modal, check all six tabs for consistent height and internal scrolling.

## Git workflow

1. Create a branch: `git checkout -b fix/your-change` or `git checkout -b feature/your-change`.
2. Commit messages in this repo are short and lowercase — `fixed`, `update`, `made the app compile`. Match that tone.
3. Open a PR against the main branch and describe what changed and why.

## Troubleshooting

- **Port 2051 already in use / serving stale content** — a previously installed `VanillaChat.app` may have grabbed the port. Find it with `lsof -nP -iTCP:2051 -sTCP:LISTEN`, kill the stale copy, then start the dev server.
- **Logs** — Gelectron writes stderr to the log file, not stdout. Search it for provider/search errors.
- **Search returns nothing** — DuckDuckGo needs no key; Brave requires a `braveApiKey` in Settings → Chat. Failures are logged, never fatal.
