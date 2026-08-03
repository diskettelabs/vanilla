# Vanilla Chat — Specification

> **Version:** 2.1.0 — Added provider abstraction, stop/interrupt, erase-last-response, regenerate

## 1. Overview

Vanilla Chat is a dual-interface conversational AI application with a pluggable provider architecture. It provides both a **Web UI** (Node.js/Express) and a **Bash TUI**, sharing theme files and conceptual data models.

The Web UI supports multiple backends through a unified provider abstraction:
- **Ollama** (local models via HTTP API)
- **OpenAI-compatible** (GPT-4o, GPT-4o-mini, etc.)
- **Anthropic Claude** (Claude 3.5 Haiku, Sonnet, etc.)
- **CLI tools** (OpenCode, Aider, Goose) via subprocess spawning

The Bash TUI connects directly to Ollama only.

## 2. Architecture

```
┌──────────────────────────────────┐     ┌─────────────────────────────┐
│  Web UI (v2.1.0)                 │     │       Bash TUI              │
│  Node.js / Express / SSE         │     │  Pure Bash / curl / jq      │
│  server.js                       │     │  vanilla-chat.sh            │
│  src/routes.js                   │     │  src/*.sh (modular)         │
│  src/storage.js                  │     │                              │
│  src/providers/ (abstraction)    │     │  src/ollama/ollama_client.sh│
│  public/index.html               │     │  src/tui/*.sh               │
│                                  │     │  src/theme/*.sh             │
├──────────────────────────────────┤     ├─────────────────────────────┤
│  config/default.json             │     │  config/default.conf        │
│  data/conversations/*.md         │     │  ~/.local/share/vanilla-chat/│
│  themes/*.json                   │     │  themes/*.json              │
└──────────────┬───────────────────┘     └──────────────┬──────────────┘
               │                                        │
               └────────────┬───────────────────────────┘
                            │
              ┌─────────────▼──────────────────────────┐
              │        Provider Abstraction             │
              │  ┌────────┐ ┌────────┐ ┌────────────┐  │
              │  │ Ollama │ │ OpenAI │ │ Anthropic  │  │
              │  ├────────┤ ├────────┤ ├────────────┤  │
              │  │OpenCode│ │ Aider  │ │  Goose     │  │
              │  └────────┘ └────────┘ └────────────┘  │
              └─────────────────────────────────────────┘
```

The Web UI communicates with any registered provider through a unified abstraction layer. Each provider implements `chatStream()`, `listModels()`, and `listChatModels()`. Multiple providers can be configured simultaneously and selected at conversation creation via the provider dropdown in the sidebar.

## 2.1 Active Stream Management

The server maintains a `Map<conversationId, AbortController>` (`activeStreams`) in `routes.js`. When a streaming request begins:
1. An `AbortController` is created and stored in the map keyed by `conversationId`
2. The controller's `signal` is passed to the provider's `chatStream()`
3. On natural completion or error, the entry is deleted from the map
4. A `POST /api/chat/stop/:conversationId` request calls `controller.abort()`, which triggers the provider's abort handler (HTTP `req.destroy()` or `child.kill('SIGTERM')`)
5. Partial content is saved to the conversation with `[interrupted]` appended

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
| `/api/providers` | GET | Lists registered providers with labels |
| `/api/models` | GET | Lists models for a given provider (`?provider=ollama`) |
| `/api/conversations` | GET | Lists all saved conversations |
| `/api/conversations` | POST | Creates a new conversation |
| `/api/conversations/:id` | GET | Gets a single conversation |
| `/api/conversations/:id` | DELETE | Deletes a conversation |
| `/api/conversations/:id/erase-last-response` | POST | Removes the most recent assistant message |
| `/api/conversations/:id/regenerate` | POST | Replaces last user message and removes last assistant |
| `/api/chat/stream` | POST | SSE streaming chat completion |
| `/api/system/stats` | GET | CPU/GPU/NPU/RAM usage and pressure stats |
| `/api/search` | GET | Full-text search across all conversations (`?q=term`) |
| `/api/chat/stop/:conversationId` | POST | Aborts an active streaming response |
| `/api/upload` | POST | Upload a file (multipart/form-data, field `file`); returns `{url,name,size,type}` |
| `/api/tools` | GET | List available tool definitions (name, description, input_schema) |
| `/api/tools/execute` | POST | Execute a tool call `{name, arguments}`; returns `{result, name}` |

**SSE Stream Request Body (`POST /api/chat/stream`):**

```json
{
  "conversationId": "uuid-v4",
  "message": "string",
  "model": "string (optional, defaults to conversation's model)",
  "provider": "string (optional, defaults to conversation's provider or config default)"
}
```

**SSE Stream Response Format:**

```
data: {"type":"token","content":"Hello"}

data: {"type":"token","content":" world"}

data: {"type":"done","content":"","interrupted":false}

data: {"type":"error","error":"message"}
```

Each line is a complete JSON object prefixed with `data: ` and terminated by `\n\n`. The `interrupted` field on `done` is `true` when the stream was stopped by the user via the stop endpoint.

**`POST /api/chat/stop/:conversationId`** — Aborts the active stream for a conversation. The stream's error handler saves any partial content with `[interrupted]` appended. The SSE stream receives a `{"type":"done","interrupted":true}` event.

**`POST /api/conversations/:id/erase-last-response`** — Scans messages from the end backward and removes the first `assistant` message found. Returns the updated conversation.

**`POST /api/conversations/:id/regenerate`** — Accepts `{"message":"..."}` in the body. Replaces the last user message content with the new text and removes the most recent assistant message. The frontend can then resend using the standard stream endpoint.

**`GET /api/system/stats`** — System resource usage and pressure metrics.

Response format:
```json
{
  "cpu": {
    "model": "Apple M4",
    "cores": 10,
    "architecture": "arm64",
    "usagePercent": 21.5,
    "pressure": "low",
    "loadAverage": [2.45, 2.32, 2.45]
  },
  "memory": {
    "physical": { "usedGB": 15.9, "totalGB": 16.0 },
    "pressurePercent": 44,
    "pressure": "low"
  },
  "gpu": [
    {
      "name": "Apple M4",
      "chipset": "Apple",
      "vramTotalGB": 0,
      "metalFamily": "Metal 3",
      "usagePercent": null,
      "pressure": "low"
    }
  ],
  "npu": {
    "available": true,
    "name": "Apple Neural Engine",
    "usagePercent": null,
    "pressure": "low"
  }
}
```

- **Pressure levels:** `low` (< 60%), `normal` (60-80%), `high` (80-90%), `extreme` (> 90%)
- **CPU:** Usage calculated by sampling idle/total ticks. Fallback uses `top` (macOS) or `/proc/stat` (Linux).
- **Memory `physical`:** Raw OS memory from `os.totalmem()` / `os.freemem()`. On macOS, cached file pages appear as "used" here.
- **Memory `pressurePercent`:** On macOS, derived from `memory_pressure` tool (active memory under pressure). On other platforms, mirrors physical usage.
- **GPU:** Detected via `system_profiler SPDisplaysDataType` (macOS). `usagePercent` is `null` because GPU utilization requires privileged access (`powermetrics`).
- **NPU:** Apple Neural Engine detected via CPU model string check. `usagePercent` is `null` without root.
- **Implementation:** `src/system.js` — platform-specific commands via `execSync` with fallbacks to pure `os` module calculations.

**`GET /api/tools`** — Returns an array of tool definitions:
```json
[
  {
    "name": "web_search",
    "description": "Search the web for current information...",
    "input_schema": {
      "type": "object",
      "properties": {
        "query": { "type": "string", "description": "The search query" }
      },
      "required": ["query"]
    }
  }
]
```

**`POST /api/tools/execute`** — Execute a tool call. Accepts `{"name":"web_search","arguments":{"query":"..."}}`. Returns `{"result":"...","name":"web_search"}`. The server handles execution (DuckDuckGo HTML scraping for web_search, URL fetch for web_fetch).

**Tool calling in chat stream:** The streaming endpoint (`POST /api/chat/stream`) automatically injects tool definitions as a system message before the conversation history. The model can request tool use by emitting a `<TOOL_CALL>{"name":"...","arguments":{...}}</TOOL_CALL>` block in its response. The server detects this, executes the tool, sends the result back to the model, and continues the conversation loop (max 5 iterations). SSE events:

| Event | Fields | Description |
|---|---|---|
| `tool_call` | `name`, `arguments` | Model requested a tool execution |
| `tool_result` | `name`, `result` | Tool execution completed |
| `tool_error` | `name`, `error` | Tool execution failed |

The frontend renders tool calls as collapsible cards showing the tool name, arguments, and result with a spinner during execution.

**`POST /api/upload`** — Upload a file (multipart/form-data, field name `file`).

File type restrictions and size limits enforced server-side:

| Category | MIME Types | Size Limit | Post-Processing |
|---|---|---|---|
| Image | `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/avif` | 5 MB | Compressed via `sharp` (resize to max 1920px, JPEG quality 80) |
| Text/doc | `text/*`, `.md`, `.csv`, `.yaml`, `.yml`, `.json`, `.log`, `.xml`, source code extensions | 2 MB | Stored as-is |
| PDF | `application/pdf` | 10 MB | Stored as-is |

Files outside these types are rejected with HTTP 415. Size overages return HTTP 413. Files are stored in `data/uploads/` with unique filenames (`<timestamp>-<random>-<safename>`). The `/uploads/` path is served statically.

Response (HTTP 201):
```json
{
  "url": "/uploads/1712345678-a1b2c3-myimage.jpg",
  "name": "myimage.jpg",
  "size": 123456,
  "type": "image/jpeg"
}
```

**`GET /api/search?q=<term>`** — Full-text search across all conversations. Supports both exact substring matching and fuzzy character-order matching (e.g., `banna` matches `bananas`).

Response format:
```json
[
  {
    "id": "uuid-v4",
    "title": "Conversation Title",
    "matches": [
      { "type": "title" },
      {
        "type": "content",
        "messageId": "uuid-v4",
        "role": "user",
        "term": "bananas",
        "snippet": "…another good source of potassium is bananas, which contain around 422mg of…"
      }
    ]
  }
]
```

- `type: "title"` — the conversation title matched the query (no snippet needed)
- `type: "content"` — a message body matched
- `term` — only present for **exact matches**; omitted for fuzzy matches so the client can do its own highlighting
- `snippet` — ~8 words of context on each side of the match, with `…` indicating truncation
- Maximum 4 content matches per conversation (title match counts separately)

### 3.3 Storage (`src/storage.js`)

File-based persistence in `data/conversations/` using human-readable **markdown files** (`.md`):

**Markdown file format:**
```markdown
# Conversation Title

- **ID:** uuid-v4
- **Model:** llama2
- **Provider:** ollama
- **Created:** 2026-07-30T04:20:09.943Z
- **Updated:** 2026-07-30T04:20:16.570Z

---

## user `uuid-v4` @ 2026-07-30T04:20:11.644Z

Hello, how are you?

## assistant `uuid-v4` @ 2026-07-30T04:20:16.570Z model:qwen2.5:1.5b

I'm doing well, thank you!
```

- First line `# title` sets the conversation title
- Metadata block uses `- **Key:** value` list items
- `---` separates metadata from messages
- Each message starts with `## role \`id\` @ timestamp` (optional `model:name` suffix)
- Message content follows until the next `##` header or end of file

**Backward compatibility:** Existing `.json` files are automatically migrated to `.md` on first read via `get()`. The `list()` function reads both `.json` and `.md` files simultaneously.

**Search algorithm (`search(query)`):**
- For each conversation, checks title and all message bodies
- **Exact match:** case-insensitive substring search (`indexOf`)
- **Fuzzy match:** character-order matching — all query characters must appear in order in the target text (e.g., `banna` → `bananas` because b,a,n,n,a all appear in order). Finds the tightest span containing all matching characters.
- **Snippet extraction:** locates the matching word, then takes ~8 words of context on each side. Truncated edges are prefixed/suffixed with `…`.
- Returns up to 4 content matches per conversation; title matches are always included.

**Methods:**
- `init()` — ensure directory exists
- `list()` — return sorted conversation summaries (reads both `.json` and `.md`)
- `create(title, model, provider?)` — new UUID-named conversation file (optional provider)
- `get(id)` — read conversation by UUID (migrates from `.json` to `.md` if needed)
- `update(conv)` — write with updated timestamp
- `remove(id)` — delete file (both `.json` and `.md` variants)
- `addMessage(id, role, content, model?)` — append message
- `eraseLastAssistant(id)` — remove the most recent assistant message from conversation
- `replaceLastUserMessage(id, content)` — replace the most recent user message's content
- `search(query)` — full-text search with fuzzy matching; returns `[{id, title, matches}]`

### 3.4 Provider Abstraction (`src/providers/`)

```
src/providers/
├── index.js        — Registry, factory, provider list
├── base.js         — Abstract base class
├── ollama.js       — Ollama (local HTTP API)
├── openai.js       — OpenAI-compatible API (GPT, etc.)
├── anthropic.js    — Anthropic Claude API
├── cli.js          — Base CLI provider (spawns subprocess)
├── opencode.js     — OpenCode CLI integration
├── aider.js        — Aider CLI integration
└── goose.js        — Goose CLI integration
```

All providers implement the same interface:

| Method | Signature | Description |
|---|---|---|
| `listModels()` | `async () => string[]` | Return available model identifiers |
| `listChatModels()` | `async () => string[]` | Return chat-capable model names |
| `chatStream()` | `async (messages, model, onToken, onDone, onError, {signal}) => void` | Stream tokens via callbacks, abort via AbortSignal |

**Stream abort:** Each provider respects an optional `AbortSignal` from an `AbortController`. When the signal fires, the provider destroys its underlying connection (HTTP `req.destroy()` or `child.kill()`) and calls `onError(new Error('Stream aborted by user'))`.

**Provider registration** happens at startup in `src/providers/index.js`. The config file maps provider names to their configuration objects.

**Ollama (`src/providers/ollama.js`):**
- Local HTTP client to `http://localhost:11434`
- Lists models via `GET /api/tags`
- Streams via `POST /api/chat` with `stream: true`, NDJSON parsing
- Supports abort signal

**OpenAI-compatible (`src/providers/openai.js`):**
- HTTPS client to any OpenAI-compatible API base URL
- Default: `https://api.openai.com/v1`
- Uses `Authorization: Bearer <apiKey>` header
- Streams via `POST /chat/completions` with SSE parsing (`data: ...` / `[DONE]`)
- Supports default model config

**Anthropic (`src/providers/anthropic.js`):**
- HTTPS client to `https://api.anthropic.com/v1`
- Uses `x-api-key` header
- Streams via `POST /messages` with SSE parsing
- Separates system messages from chat messages per Anthropic API spec

**CLI Providers (`src/providers/cli.js`, `opencode.js`, `aider.js`, `goose.js`):**
- Spawn a subprocess via `child_process.spawn()`
- Pipe prompt text as the message argument
- Stream subprocess stdout/stderr output as tokens
- Kill process on abort signal

### 3.5 Frontend UI (`public/index.html`)

Single-page web application with the following interactive elements:

| Element | Purpose |
|---|---|
| Conversation list | Sidebar with clickable conversation items, active state highlight |
| Provider selector | Dropdown listing all registered providers; changing it reloads the model list |
| Model selector | Dropdown populated by `GET /api/models?provider=<name>` |
| Theme selector | Dropdown of 14 ice cream themes, applies CSS custom properties |
| Message display | Chat area with user/assistant message bubbles, auto-scroll |
| Send button | Sends message via SSE stream |
| **Stop button** | Visible only during streaming; calls `POST /api/chat/stop/:id` |
| **Erase button** | Appears on hover over the last assistant message; calls `POST /api/conversations/:id/erase-last-response` |
| **Edit & Resend button** | Appears on hover over the last user message; fills the input with that message's content for editing |
| **Search input** | Sidebar search bar with 200ms debounce; calls `GET /api/search?q=...` |
| **Search results** | Replaces conversation list while searching; shows title + up to 4 snippets per result with matched terms highlighted |

**Tool calls:**
- The model is prompted with tool definitions at the start of each message exchange
- When the model emits `<TOOL_CALL>{"name":"...","arguments":{...}}</TOOL_CALL>`, the server executes the tool
- The frontend renders collapsible cards with tool name, arguments (expandable), and result
- A spinner shows during execution; errors are displayed in red
- Text before and after tool calls is rendered as normal message content
- Tool calls are serialized in the conversation history as intermediate messages

**File upload:**
- 📎 button in the input area opens a file picker (accepts images, PDFs, text/docs, source code)
- Drag-and-drop onto the messages area to upload
- Multiple files can be uploaded simultaneously
- Progress bar appears above the stats bar during upload
- Upload progress tracks per-file via `XMLHttpRequest.upload.onprogress`
- Images are inserted as `![name](url)` markdown into the input; other files as `[name](url)` links
- Server enforces size limits (5MB images, 2MB text, 10MB PDFs) and auto-compresses images via sharp

**System stats bar:**
- A thin bar between messages and the input area showing live CPU, RAM, GPU, and NPU metrics
- Polls `GET /api/system/stats` every 5 seconds
- Each stat has a colored dot indicating pressure level (green=low, yellow=normal, orange=high, red=extreme)
- Hovering shows a tooltip with detailed info (model, cores, load average, VRAM, etc.)
- GPU/NPU usagePercent shows `—` when unavailable (requires root); GPU shows model name instead

**Search UI behavior:**
- Typing in the search bar triggers `GET /api/search?q=<term>` after a 200ms debounce
- Results replace the conversation list; clicking a result navigates to that conversation
- Snippets with a `term` field use exact substring highlighting (`<mark>`)
- Snippets without a `term` (fuzzy matches) are highlighted client-side using the same character-order fuzzy matching algorithm as the server
- Escape key or the ✕ button clears the search and restores the conversation list
- `loadConversations()` is suppressed while a search query is active to avoid flickering

**Streaming lifecycle on the frontend:**
1. User clicks Send → `streaming = true`, send/input disabled, stop button shown
2. SSE reader reads tokens and appends to the assistant message container
3. On `done` → `streaming = false`, re-enable send, hide stop, reload conversation
4. On `error` → show error message in the assistant div
5. Stop button → `POST /api/chat/stop/:id`, sets `aborted = true`, stream ends with `interrupted` flag

### 3.6 Bash TUI Modules

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
  "provider": "string (optional)",
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

The `provider` field stores the provider name used when the conversation was created, allowing the frontend to re-select the correct provider when loading a saved conversation. Conversations are persisted as markdown (`.md`) files in `data/conversations/`.

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
  "defaultProvider": "ollama",
  "providers": {
    "ollama": {
      "host": "http://localhost:11434",
      "requestTimeout": 30000
    },
    "openai": {
      "apiKey": "",
      "baseUrl": "https://api.openai.com/v1",
      "requestTimeout": 60000,
      "defaultModel": "gpt-4o-mini"
    },
    "anthropic": {
      "apiKey": "",
      "baseUrl": "https://api.anthropic.com/v1",
      "requestTimeout": 60000,
      "defaultModel": "claude-3-5-haiku-latest"
    },
    "opencode": {
      "command": "opencode",
      "defaultModel": "default"
    },
    "aider": {
      "command": "aider",
      "defaultModel": "claude-3-5-sonnet-20241022"
    },
    "goose": {
      "command": "goose",
      "defaultModel": "default"
    }
  },
  "storage": {
    "dir": "./data/conversations"
  }
}
```

Each provider entry is passed as the config object to the provider constructor. API keys can be set via environment variables (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`) or in the config file.

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
| API key leakage | Keys stored in config file or env vars, never exposed to frontend |
| File permissions | Data files stored with 600 (owner rw only) |
| Path traversal | Validate conversation ID is UUID format |
| XSS (Web UI) | Content rendered via `textContent`, not `innerHTML` |
| CLI provider safety | Subprocess spawned with `shell: true` but prompt sanitized before passing |

## 8. Error Handling

### 8.1 Connection Errors (Ollama unreachable)
- 3 retry attempts with 5-second exponential backoff
- User-visible error message with retry prompt
- Graceful degradation (offline mode with cached conversations)

### 8.2 Stream Interruptions
- User-initiated abort via `POST /api/chat/stop/:id` destroys the underlying HTTP request or kills the subprocess
- Partial content saved with `[interrupted]` appended
- SSE stream receives `{"type":"done","interrupted":true}` — the frontend displays an "Interrupted" note
- Configurable stream latency target (50ms default for Ollama provider)

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
- Ollama running locally on port 11434 (for Ollama provider)
- OpenAI API key (for OpenAI provider)
- Anthropic API key (for Anthropic provider)
- OpenCode CLI installed (for OpenCode provider)
- Aider CLI installed (for Aider provider)
- Goose CLI installed (for Goose provider)
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
