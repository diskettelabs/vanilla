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

## Features

- **Real-time streaming** — responses appear token-by-token via SSE
- **Multi-provider** — Ollama, LM Studio, OpenAI, Anthropic, HuggingFace, Gemini, and the Aider / Goose / OpenCode CLIs
- **Compare models** — run the same prompt against multiple models side by side
- **Conversation management** — create, switch, rename, regenerate, export (Markdown/JSON/HTML), and delete chats
- **HuggingFace installer** — search GGUF models and import them into Ollama from the UI
- **Custom system prompts** — global default plus per-conversation override
- **Auto-naming** — smart chat titles generated locally via Ollama
- **Themes** — 14 ice cream color schemes (vanilla, strawberry, mint, lemon, lime, peach, plum, raspberry, lavender, dragonfruit, dreamsicle, blue-moon, chocolate, monochrome)
- **Settings UI** — organized sections (Account, AI Model, Providers & API keys, Chat, UI, Preferences) with pickers for theme, density, text size, accent, and assistant logo position
- **Voice input** — browser-based dictation (VOSK, on-device)
- **File uploads** — attach images and files with OCR/image understanding
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
├── themes/               14 ice cream color themes
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
| `POST /api/chat/stream` | Send a message and stream the response (SSE) |
| `POST /api/chat/stop/:conversationId` | Stop an in-progress stream |
| `POST /api/chat/compare` | Run a prompt against multiple models |
| `GET /api/search` | Search conversations |
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
