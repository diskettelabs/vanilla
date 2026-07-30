# Vanilla Chat — Specification

## 1. Overview

Vanilla Chat is a dual-interface conversational AI application for local models via [Ollama](https://ollama.ai). It provides both a **Web UI** (Node.js/Express) and a **Bash TUI**, sharing theme files and conceptual data models.

## 2. Architecture

```
┌─────────────────────────────┐     ┌─────────────────────────────┐
│       Web UI (v2.0.0)       │     │       Bash TUI              │
│  Node.js / Express / SSE    │     │  Pure Bash / curl / jq      │
│  server.js                  │     │  vanilla-chat.sh            │
│  src/routes.js              │     │  src/*.sh (modular)         │
│  src/storage.js             │     │                              │
│  src/ollama.js              │     │  src/ollama/ollama_client.sh│
│  public/index.html          │     │  src/tui/*.sh               │
│                             │     │  src/theme/*.sh             │
├─────────────────────────────┤     ├─────────────────────────────┤
│  config/default.json        │     │  config/default.conf        │
│  data/conversations/*.json  │     │  ~/.local/share/vanilla-chat/│
│  themes/*.json              │     │  themes/*.json              │
└─────────────────────────────┘     └─────────────────────────────┘
                    │                           │
                    └──────────┬────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │     Ollama API      │
                    │   http://localhost:11434/api  │
                    └─────────────────────┘
```

Both interfaces communicate with the same local Ollama instance. The Web UI uses SSE for token streaming; the TUI uses callback-based streaming to stdout.

## 3. Components

### 3.1 Web UI Server (`server.js`)

- Express server, port 3000 (configurable)
- Static file serving for `public/` and `themes/`
- JSON body parsing
- Registers API routes from `src/routes.js`

### 3.2 API Routes (`src/routes.js`)

| Endpoint | Method | Description |
|---|---|---|
| `/api/health` | GET | Returns `{"status":"ok"}` |
| `/api/models` | GET | Lists models from Ollama (`/api/tags`) |
| `/api/conversations` | GET | Lists all saved conversations |
| `/api/conversations` | POST | Creates a new conversation |
| `/api/conversations/:id` | GET | Gets a single conversation |
| `/api/conversations/:id` | DELETE | Deletes a conversation |
| `/api/chat/stream` | POST | SSE streaming chat completion |

**SSE Stream Format (`POST /api/chat/stream`):**

```
data: {"type":"token","content":"Hello"}

data: {"type":"token","content":" world"}

data: {"type":"done","content":""}

data: {"type":"error","content":"message"}
```

Each line is a complete JSON object prefixed with `data: ` and terminated by `\n\n`.

### 3.3 Storage (`src/storage.js`)

File-based persistence in `data/conversations/`:
- `init()` — ensure directory exists
- `list()` — return sorted conversation summaries
- `create(title, model)` — new UUID-named conversation file
- `get(id)` — read conversation by UUID
- `update(conv)` — write with updated timestamp
- `remove(id)` — delete file
- `addMessage(id, role, content, model?)` — append message

### 3.4 Ollama Client (`src/ollama.js`)

Pure Node.js HTTP client using `node:http`:
- `listModels()` — `GET /api/tags`, returns `[{name, size}]`
- `chatStream(messages, model, onToken, onDone, onError)` — `POST /api/chat` with `stream: true`, parses NDJSON, calls `onToken` per token

### 3.5 Bash TUI Modules

| Module | File | Purpose |
|---|---|---|
| JSON Utilities | `src/lib/json_utils.sh` | UUID gen, timestamps, JSON construction |
| Logger | `src/lib/logger.sh` | 5-level logging (DEBUG/INFO/WARN/ERROR/FATAL) |
| Tree Operations | `src/tree/tree_ops.sh` | Conversation tree CRUD, path traversal |
| Auto-save | `src/tree/auto_save.sh` | Background periodic saves |
| Ollama Client | `src/ollama/ollama_client.sh` | Connection check, model list, streaming |
| Theme Engine | `src/theme/theme_engine.sh` | Load themes, hex-to-ANSI256 conversion |
| System Monitor | `src/monitor/system_monitor.sh` | CPU/RAM monitoring |
| Logo | `src/tui/logo.sh` | ASCII art ice cream scoop |
| Screen/TUI | `src/tui/screen.sh` | Terminal rendering, input handling |
| Chat Manager | `src/chat/chat_manager.sh` | Message send, branch, retry |
| Error Recovery | `src/lib/error_recovery.sh` | Connection errors, stream recovery, tree repair |

## 4. Data Models

### 4.1 Conversation (Web UI — flat model)

```json
{
  "id": "uuid-v4",
  "title": "string",
  "model": "string",
  "messages": [
    {
      "id": "uuid-v4",
      "role": "user|assistant",
      "content": "string",
      "timestamp": "ISO-8601",
      "model": "string (optional)"
    }
  ],
  "createdAt": "ISO-8601",
  "updatedAt": "ISO-8601"
}
```

### 4.2 Conversation Tree (TUI — branching model)

**Message:**
```json
{
  "id": "uuid-v4",
  "role": "user|assistant|system",
  "content": "string",
  "timestamp": "ISO-8601",
  "model": "string (optional)"
}
```

**Node:**
```json
{
  "id": "uuid-v4",
  "message": { "Message" },
  "parentId": "uuid-v4|null",
  "children": ["uuid-v4"],
  "isActive": true
}
```

**ConversationTree:**
```json
{
  "nodes": { "uuid": { "Node" } },
  "rootId": "uuid-v4|null",
  "currentNodeId": "uuid-v4|null",
  "metadata": {
    "createdAt": "ISO-8601",
    "lastModified": "ISO-8601",
    "title": "string",
    "model": "string"
  }
}
```

### 4.3 Relationships

- `rootId` references the first node in the conversation
- `currentNodeId` tracks the active leaf (for branching)
- `parentId` on each node links to its predecessor
- `children` array holds all child branches from this node
- `isActive` marks the active path from root to current leaf

## 5. Theme System

14 flavors, each defined in `themes/<flavor>.json`:

```json
{
  "name": "vanilla",
  "colors": {
    "primary": "#FFF8DC",
    "secondary": "#F5DEB3",
    "background": "#FFFAF0",
    "text": "#4A4A4A",
    "userMessage": "#FFE4B5",
    "assistantMessage": "#FAEBD7",
    "border": "#DEB887",
    "statusBar": "#F5DEB3"
  }
}
```

**Available flavors:** vanilla, chocolate, strawberry, mint, lemon, lime, peach, plum, raspberry, lavender, dragonfruit, dreamsicle, blue-moon, monochrome.

**Web UI:** Applied via CSS custom properties injected by JavaScript.

**TUI:** Converted to ANSI 256-color escape codes via hex-to-ANSI256 mapping.

## 6. Configuration

### 6.1 Web UI (`config/default.json`)

```json
{
  "port": 3000,
  "ollama": {
    "host": "http://localhost:11434",
    "requestTimeout": 30000
  },
  "storage": {
    "dir": "./data/conversations"
  }
}
```

### 6.2 Bash TUI (`config/default.conf`)

```bash
DEFAULT_THEME="vanilla"
DEFAULT_MODEL="llama2"
OLLAMA_API_URL="http://localhost:11434"
AUTO_SAVE_INTERVAL=30
LOG_LEVEL="INFO"
DATA_DIR="${HOME}/.local/share/vanilla-chat-tui"
MAX_TREE_SIZE=10000
STREAM_LATENCY_TARGET=50
MONITOR_INTERVAL=1000
INPUT_TIMEOUT=100
TARGET_FPS=60
```

## 7. Security

| Concern | Mitigation |
|---|---|
| Input injection | Strip control characters, backticks, limit 100KB |
| Ollama local-only | Validate host resolves to localhost |
| File permissions | Data files stored with 600 (owner rw only) |
| Path traversal | Validate conversation ID is UUID format |
| XSS (Web UI) | Content rendered via `textContent`, not `innerHTML` |

## 8. Error Handling

### 8.1 Connection Errors (Ollama unreachable)
- 3 retry attempts with 5-second exponential backoff
- User-visible error message with retry prompt
- Graceful degradation (offline mode with cached conversations)

### 8.2 Stream Interruptions
- Partial content flagged with `incomplete: true` on message
- Resume capability using last received token position
- Configurable stream latency target (50ms default)

### 8.3 Tree Corruption
- Automatic backup on each save (`.backup` suffix)
- Corruption detection via structural validation
- Salvage operation extracts intact nodes
- Fallback to most recent valid backup

### 8.4 File System Errors
- Directory creation on init (mkdir -p)
- Write failures return specific error codes
- Read failures fall back to empty state

## 9. Requirements

- Node.js 18+ (Web UI)
- Ollama running locally on port 11434
- Bash 4.0+ (TUI)
- `jq`, `curl` (TUI dependencies)
- Unix-like environment (Linux/macOS)

## 10. Performance Targets

| Metric | Target |
|---|---|
| First token latency | < 1s after request |
| Inter-token latency | < 50ms (streaming) |
| UI framerate | 60 FPS (TUI) |
| Input responsiveness | < 100ms |
| Memory per conversation | < 10MB |
| Max conversation nodes | 10,000 |
| Auto-save overhead | < 100ms per save |
