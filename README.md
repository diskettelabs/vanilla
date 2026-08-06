# Vanilla Chat

<p align="center">
  <img src="./logo.png" alt="Vanilla Chat logo" width="140">
</p>

A simple, privacy-first web chat interface for local and cloud AI models — Ollama, LM Studio, OpenAI, Anthropic, HuggingFace, and Gemini — plus direct integration with the Aider, Goose, and OpenCode CLIs. Comes with 14 ice cream-themed color schemes.

## Quick Start

```bash
npm start
```

Open `http://localhost:2051` in your browser.

- **Local models** — make sure Ollama is running (`ollama serve`), or start the LM Studio local server (Developer tab → Local Server → Start Server).
- **Cloud models** — pick a provider in Settings → AI Model and paste your API key.
- **Desktop app** — `npm start -- -g` launches the Gelectron desktop build (bundled Ollama runtime); `npm start -- -e` launches the Electron build (system Ollama).
- **Auto-install everything** — `./run-this-furst.sh` clones and builds Gelectron + gelectron-ollama, installs dependencies, and runs the app. Options: `--run` (install then launch), `--no-build` (reuse an existing Gelectron binary).

## Features

- **Real-time streaming** — responses appear token-by-token via SSE
- **Web search** — toggle it in the composer or Settings; your question is searched (DuckDuckGo by default, optional Brave API key) and cited results are injected into the response
- **Multi-provider** — Ollama, LM Studio, OpenAI, Anthropic, HuggingFace, Gemini, and the Aider / Goose / OpenCode CLIs
- **Compare models** — run the same prompt against multiple models side by side
- **Conversation management** — create, switch, rename, regenerate, export (Markdown/JSON/HTML), and delete chats
- **HuggingFace installer** — search GGUF models and import them into Ollama from the UI
- **Custom system prompts** — global default plus per-conversation override
- **Auto-naming** — smart chat titles generated locally via Ollama
- **Themes** — 14 ice cream color schemes (vanilla, strawberry, mint, lemon, lime, peach, plum, raspberry, lavender, dragonfruit, dreamsicle, blue-moon, chocolate, monochrome) plus custom JSON themes that can replace colors, accent, logo, mascot, app name, and CSS. Authoring guide: `/themes/themes.html`
- **Settings UI** — organized tabs (General, AI Model, Chat, Appearance, Shortcuts, Data & Privacy) with pickers for theme, density, text size, accent, and assistant logo position
- **Voice input** — browser-based dictation (VOSK, on-device)
- **File uploads** — attach images and files with OCR/image understanding
- **Sound effects** — optional UI sounds (Web Audio, no audio files)
- **Privacy** — all data stays local, nothing leaves your machine unless you use a cloud provider

## Requirements

- [Node.js](https://nodejs.org) 18+
- For local models: [Ollama](https://ollama.ai) and/or [LM Studio](https://lmstudio.ai) running locally
- For CLI tools: Aider, Goose, or OpenCode installed and on your PATH
- For cloud providers: an API key from the respective service

## Settings

Open Settings (⌘+,) — the UI is organized into sections:

- **Account** — your display name
- **AI Model** — provider and model selection, HuggingFace model installer
- **Providers & API keys** — enable optional providers/tools (LM Studio, Aider, Goose, OpenCode) and manage keys; LM Studio includes a connection check
- **Chat** — global custom system prompt
- **UI** — theme, density, text size, message accent, and **assistant logo position** (beside text or above text)
- **Keyboard shortcuts** / **Preferences** / **Export** / **Uninstall**

## Project Structure

```
vanilla-sh/
├── server.js             Express server entry point
├── start.js              Launcher (web, Gelectron, Electron)
├── src/
│   ├── routes.js         API route definitions
│   ├── storage.js        File-based conversation persistence
│   ├── upload.js         File/OCR upload handling
│   ├── titles.js         Auto-naming titles
│   ├── system.js         System stats (CPU/RAM/GPU)
│   ├── providers/        Provider adapters
│   │   ├── ollama.js     Ollama
│   │   ├── lmstudio.js   LM Studio (OpenAI-compatible, local)
│   │   ├── openai.js     OpenAI + base OpenAI-compatible client
│   │   ├── anthropic.js  Anthropic Claude
│   │   ├── huggingface.js HuggingFace Inference
│   │   ├── gemini.js     Google Gemini
│   │   ├── cli.js        CLI tool base
│   │   ├── aider.js      Aider CLI
│   │   ├── goose.js      Goose CLI
│   │   └── opencode.js   OpenCode CLI
│   └── ...
├── public/
│   ├── index.html        Single-page web UI
│   ├── app.js            UI logic
│   └── styles.css
├── gelectron/            Gelectron desktop wrapper (bundled Ollama)
├── electron/             Electron desktop wrapper
├── themes/               JSON color themes + themes.html authoring guide
├── docs/                 Historical design/task notes
├── CONTRIBUTING.md       Contributor guide
├── data/
│   └── conversations/    Saved conversations (JSON)
└── config/
    └── default.json      Server configuration
```

## API

| Endpoint | Description |
|---|---|
| `GET /api/health` | Health check |
| `GET /api/providers` | List configured providers |
| `GET /api/models?provider=…` | List available models for a provider |
| `GET /api/system/stats` | CPU/RAM/GPU usage stats |
| `GET /api/conversations` | List saved conversations |
| `POST /api/conversations` | Create a new conversation |
| `GET /api/conversations/:id` | Get conversation messages |
| `DELETE /api/conversations/:id` | Delete a conversation |
| `POST /api/conversations/import` | Import conversations from Markdown/JSON |
| `POST /api/conversations/:id/name` | Rename a conversation |
| `POST /api/conversations/:id/regenerate` | Regenerate the last response |
| `POST /api/conversations/:id/erase-last-response` | Erase the last response |
| `POST /api/chat/stream` | Send a message and stream the response (SSE); optional `search` / `searchBackend` / `searchApiKey` fields enable web-search injection |
| `POST /api/chat/stop/:conversationId` | Stop an in-progress stream |
| `POST /api/chat/compare` | Run a prompt against multiple models |
| `POST /api/chat/compare-stop/:id` | Stop an in-progress comparison |
| `GET /api/search` | Search conversations |
| `GET /api/websearch?q=&backend=&key=` | Web search (duckduckgo or brave) — test endpoint |
| `GET /api/themes` | List available JSON themes |
| `GET /api/vosk-model` | VOSK dictation model download |
| `GET /api/names/prewarm` | Preload the auto-naming model |
| `GET /api/hf/search` | Search HuggingFace GGUF models |
| `GET /api/hf/repo` | Inspect a HuggingFace repo |
| `POST /api/hf/install` | Download a GGUF model into Ollama |
| `POST /api/upload` | Upload a file (image/audio/document) |
| `POST /api/uninstall` | Uninstall the app |

## Configuration

Server settings live in `config/default.json`:

- `port` — server port (default `2051`)
- `defaultProvider` — default provider (default `ollama`)
- `providers` — per-provider settings such as `host`, `baseUrl`, `apiKey`, `defaultModel`, and `requestTimeout`. Cloud API keys can also be entered in the app UI and are stored locally in your browser.

## Fonts

The fonts used in this project are subject to their respective licenses. Please consult the font files included in the repository or their upstream sources for specific license details and attribution requirements.
