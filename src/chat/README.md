# Chat Manager

The chat manager orchestrates conversation flow between the TUI layer, conversation tree, and Ollama client.

## Functions

### send_message()

Sends a user message and streams the AI response.

**Usage:**
```bash
send_message <tree_json> <text> <model> <save_path>
```

**Parameters:**
- `tree_json`: Current conversation tree state (JSON string)
- `text`: User message text
- `model`: AI model name (default: "llama2")
- `save_path`: Path to save conversation after completion (optional)

**Returns:**
- Updated conversation tree (JSON string)

**Behavior:**
1. Creates a user message node in the conversation tree
2. Retrieves conversation history (path from root to current node)
3. Sends conversation history to Ollama client
4. Displays streaming tokens with <50ms latency
5. Creates assistant message node when streaming completes
6. Triggers auto-save after completion (if save_path provided)

**Example:**
```bash
tree=$(init_tree "My Chat" "llama2")
tree=$(send_message "$tree" "Hello, how are you?" "llama2" "data/conversations/chat.json")
```

### get_current_messages()

Retrieves messages on the active conversation path.

**Usage:**
```bash
get_current_messages <tree_json>
```

**Parameters:**
- `tree_json`: Current conversation tree state (JSON string)

**Returns:**
- JSON array of messages from root to current node in chronological order

**Example:**
```bash
messages=$(get_current_messages "$tree")
echo "$messages" | jq '.[] | "\(.role): \(.content)"'
```

## Implementation Details

### Streaming

The chat manager uses a callback-based streaming approach:

1. `stream_token_callback()` is called for each token received from Ollama
2. Tokens are immediately written to stdout for low-latency display (<50ms)
3. Tokens are accumulated in `STREAMING_CONTENT` global variable
4. When streaming completes, the assistant message node is updated with full content

### Auto-Save

After each completed message, the conversation tree is automatically saved to disk if a `save_path` is provided. This ensures conversation history is preserved.

### Input Sanitization

User input is sanitized using `sanitize_input()` from the Ollama client before being sent to the AI model. This removes control characters and trims whitespace.

## Requirements Validated

- **1.1**: Creates user message node in conversation tree
- **1.2**: Sends conversation history to Ollama client
- **1.3**: Displays streaming tokens with <50ms latency
- **1.4**: Creates assistant message node when complete
- **8.6**: Triggers auto-save after completion
