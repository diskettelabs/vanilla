# Vanilla Chat

A simple web chat interface for local AI models via [Ollama](https://ollama.ai), with 14 ice cream-themed color schemes.

## Quick Start

```bash
npm start
```

Open `http://localhost:3000` in your browser. Make sure Ollama is running (`ollama serve`).

## Features

- **Real-time streaming** — responses appear token-by-token via SSE
- **Conversation management** — create, switch, and delete chat sessions
- **Model selection** — pick any model available in your local Ollama
- **14 ice cream themes** — vanilla, chocolate, strawberry, mint, lemon, lime, peach, plum, raspberry, lavender, dragonfruit, dreamsicle, blue-moon, monochrome
- **Privacy** — all data stays local, nothing leaves your machine

## Requirements

- [Node.js](https://nodejs.org) 18+
- [Ollama](https://ollama.ai) running locally(if using the cli)

## Project Structure

```
vanilla-sh/
├── server.js             Express server entry point
├── src/
│   ├── ollama.js         Ollama API client
│   ├── storage.js        File-based conversation persistence
│   └── routes.js         API route definitions
├── public/
│   └── index.html        Single-page web UI
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
| `GET /api/models` | List available Ollama models |
| `GET /api/conversations` | List saved conversations |
| `POST /api/conversations` | Create a new conversation |
| `GET /api/conversations/:id` | Get conversation messages |
| `DELETE /api/conversations/:id` | Delete a conversation |
| `POST /api/chat/stream` | Send message and stream response (SSE) |
