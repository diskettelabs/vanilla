# Ollama Client

This module provides integration with the local Ollama API for AI model interactions.

## Features

- **Localhost-only connections**: All API calls are validated to ensure they only connect to localhost
- **Connection checking**: Verify Ollama service availability
- **Model management**: List available models and get detailed model information
- **Streaming completions**: Real-time token-by-token response streaming with callbacks
- **Input sanitization**: Automatic sanitization of user input before sending to Ollama
- **Stream cancellation**: Ability to cancel in-progress streaming requests

## Functions

### `validate_localhost <url>`

Validates that a URL is localhost-only.

**Parameters:**
- `url`: The URL to validate

**Returns:**
- `"true"` if the URL is localhost or 127.0.0.1
- `"false"` otherwise

**Example:**
```bash
if [ "$(validate_localhost "$OLLAMA_HOST")" = "true" ]; then
    echo "Valid localhost URL"
fi
```

### `check_connection`

Checks if the Ollama service is running and accessible.

**Returns:**
- `"true"` if connected successfully
- `"false"` if connection failed

**Example:**
```bash
if [ "$(check_connection)" = "true" ]; then
    echo "Ollama is running"
else
    echo "Ollama is not accessible"
fi
```

### `list_models`

Lists all available models from the Ollama service.

**Returns:**
- JSON object with models array on success
- JSON object with error field on failure

**Example:**
```bash
models=$(list_models)
if echo "$models" | jq -e '.error' > /dev/null; then
    echo "Error: $(echo "$models" | jq -r '.error')"
else
    echo "$models" | jq -r '.models[] | .name'
fi
```

### `get_model_info <model_name>`

Gets detailed information about a specific model.

**Parameters:**
- `model_name`: Name of the model to query

**Returns:**
- JSON object with model details on success
- JSON object with error field on failure

**Example:**
```bash
info=$(get_model_info "llama2")
if echo "$info" | jq -e '.error' > /dev/null; then
    echo "Error: $(echo "$info" | jq -r '.error')"
else
    echo "Format: $(echo "$info" | jq -r '.details.format')"
fi
```

### `sanitize_input <text>`

Sanitizes user input by removing dangerous characters.

**Parameters:**
- `text`: The text to sanitize

**Returns:**
- Sanitized text with null bytes and control characters removed, whitespace trimmed

**Example:**
```bash
clean_text=$(sanitize_input "$user_input")
```

### `stream_completion <messages_json> <model> <callback_function>`

Streams a completion from Ollama with real-time token delivery via callback.

**Parameters:**
- `messages_json`: JSON array of message objects with `role` and `content` fields
- `model`: Name of the model to use
- `callback_function`: Name of the callback function to receive tokens

**Callback Function Signature:**
```bash
callback_function <token> <done>
```
- `token`: The token/content received (empty when done=true)
- `done`: "true" when streaming is complete, "false" otherwise

**Returns:**
- Exit code 0 on success
- Exit code 1 on error

**Example:**
```bash
# Define callback function
my_callback() {
    local token="$1"
    local done="$2"
    
    if [ "$done" = "true" ]; then
        echo ""
        echo "Streaming complete!"
    else
        printf "%s" "$token"
    fi
}

# Create messages
messages=$(jq -n '[{role: "user", content: "Hello!"}]')

# Start streaming
stream_completion "$messages" "llama2" "my_callback"
```

### `cancel_stream`

Cancels an in-progress streaming request.

**Returns:**
- Exit code 0 on success
- Exit code 1 if no stream to cancel or cancellation failed

**Example:**
```bash
if cancel_stream; then
    echo "Stream cancelled"
else
    echo "No active stream"
fi
```

## Configuration

The Ollama client uses the `OLLAMA_HOST` environment variable to determine the API endpoint:

```bash
export OLLAMA_HOST="http://localhost:11434"  # Default
```

**Security Note:** Only localhost URLs are accepted. Any attempt to connect to a remote host will be rejected.

## Requirements

- Bash 4.0+
- curl
- jq
- Ollama service running locally

## Testing

Run the test suite:

```bash
bash tests/test_ollama_client.sh
```

## Demo

See the demo script for usage examples:

```bash
bash examples/ollama_demo.sh
```

## Security

- **Localhost-only**: All connections are validated to ensure they only target localhost
- **Input sanitization**: User input is automatically sanitized before being sent to Ollama
- **No external connections**: The client will never connect to remote Ollama instances

## Error Handling

All functions handle errors gracefully:

- Connection failures return error JSON objects
- Invalid inputs are validated and rejected
- Streaming errors are reported via stderr
- Failed operations return non-zero exit codes

## Integration

To use the Ollama client in your scripts:

```bash
# Source the client
source "src/ollama/ollama_client.sh"

# Check connection
if [ "$(check_connection)" != "true" ]; then
    echo "Ollama not available"
    exit 1
fi

# Use the client functions
models=$(list_models)
# ... rest of your code
```
