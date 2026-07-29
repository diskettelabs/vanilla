#!/usr/bin/env bash
# Ollama API client for interacting with local Ollama service

# Source required utilities
_OLLAMA_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${_OLLAMA_SCRIPT_DIR}/../lib/json_utils.sh"

# Default Ollama API endpoint (localhost only)
OLLAMA_HOST="${OLLAMA_HOST:-http://localhost:11434}"

# Retry configuration
OLLAMA_MAX_RETRIES="${OLLAMA_MAX_RETRIES:-3}"
OLLAMA_RETRY_DELAY="${OLLAMA_RETRY_DELAY:-5}"

# Validate that the Ollama host is localhost only
# Usage: validate_localhost <url>
# Returns: "true" if localhost, "false" otherwise
validate_localhost() {
    local url="$1"
    
    # Check if URL contains localhost or 127.0.0.1
    if echo "$url" | grep -qE "(localhost|127\.0\.0\.1)"; then
        echo "true"
    else
        echo "false"
    fi
}

# Check if Ollama service is running and accessible
# Usage: check_connection
# Returns: "true" if connected, "false" otherwise
check_connection() {
    # Validate localhost-only connection
    if [ "$(validate_localhost "$OLLAMA_HOST")" != "true" ]; then
        echo "false"
        return 1
    fi
    
    # Try to connect to Ollama API
    local response=$(curl -s -o /dev/null -w "%{http_code}" \
        --connect-timeout 2 \
        --max-time 5 \
        "${OLLAMA_HOST}/api/tags" 2>/dev/null)
    
    if [ "$response" = "200" ]; then
        echo "true"
        return 0
    else
        echo "false"
        return 1
    fi
}

# Check connection with retry logic
# Usage: check_connection_with_retry [max_retries] [retry_delay]
# Returns: "true" if connected, "false" otherwise
check_connection_with_retry() {
    local max_retries="${1:-$OLLAMA_MAX_RETRIES}"
    local retry_delay="${2:-$OLLAMA_RETRY_DELAY}"
    local attempt=1
    
    while [ $attempt -le $max_retries ]; do
        if [ "$(check_connection)" = "true" ]; then
            echo "true"
            return 0
        fi
        
        if [ $attempt -lt $max_retries ]; then
            # Send retry message to stderr so it doesn't interfere with JSON output
            >&2 echo "Connection attempt $attempt failed, retrying in ${retry_delay}s..."
            sleep "$retry_delay"
        fi
        
        attempt=$((attempt + 1))
    done
    
    echo "false"
    return 1
}

# List available models from Ollama
# Usage: list_models
# Returns: JSON array of model information
list_models() {
    # Validate localhost-only connection
    if [ "$(validate_localhost "$OLLAMA_HOST")" != "true" ]; then
        echo '{"error": "Only localhost connections are allowed"}'
        return 1
    fi
    
    # Check connection first
    if [ "$(check_connection)" != "true" ]; then
        echo '{"error": "Cannot connect to Ollama service"}'
        return 1
    fi
    
    # Query Ollama API for models
    local response=$(curl -s \
        --connect-timeout 5 \
        --max-time 10 \
        "${OLLAMA_HOST}/api/tags" 2>/dev/null)
    
    if [ $? -ne 0 ] || [ -z "$response" ]; then
        echo '{"error": "Failed to retrieve models"}'
        return 1
    fi
    
    # Validate JSON response
    if ! validate_json "$response"; then
        echo '{"error": "Invalid JSON response from Ollama"}'
        return 1
    fi
    
    echo "$response"
    return 0
}

# Get information about a specific model
# Usage: get_model_info <model_name>
# Returns: JSON object with model details
get_model_info() {
    local model_name="$1"
    
    if [ -z "$model_name" ]; then
        echo '{"error": "Model name is required"}'
        return 1
    fi
    
    # Validate localhost-only connection
    if [ "$(validate_localhost "$OLLAMA_HOST")" != "true" ]; then
        echo '{"error": "Only localhost connections are allowed"}'
        return 1
    fi
    
    # Check connection first
    if [ "$(check_connection)" != "true" ]; then
        echo '{"error": "Cannot connect to Ollama service"}'
        return 1
    fi
    
    # Query Ollama API for model info
    local request_body=$(jq -n --arg name "$model_name" '{name: $name}')
    
    local response=$(curl -s \
        --connect-timeout 5 \
        --max-time 10 \
        -X POST \
        -H "Content-Type: application/json" \
        -d "$request_body" \
        "${OLLAMA_HOST}/api/show" 2>/dev/null)
    
    if [ $? -ne 0 ] || [ -z "$response" ]; then
        echo '{"error": "Failed to retrieve model information"}'
        return 1
    fi
    
    # Validate JSON response
    if ! validate_json "$response"; then
        echo '{"error": "Invalid JSON response from Ollama"}'
        return 1
    fi
    
    echo "$response"
    return 0
}

# Sanitize user input before sending to Ollama
# Usage: sanitize_input <text>
# Returns: Sanitized text
sanitize_input() {
    local text="$1"
    
    # Remove null bytes and other control characters (except newlines and tabs)
    text=$(printf '%s' "$text" | tr -d '\000-\010\013-\037')
    
    # Remove any potential command injection characters
    # Escape backticks, dollar signs in command substitution context
    text=$(printf '%s' "$text" | sed 's/`//g')
    
    # Limit input length to prevent DoS (max 100KB)
    local max_length=102400
    if [ ${#text} -gt $max_length ]; then
        text="${text:0:$max_length}"
    fi
    
    # Trim leading/trailing whitespace
    text=$(echo "$text" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')
    
    echo "$text"
}

# Stream completion from Ollama with token callbacks
# Usage: stream_completion <messages_json> <model> <callback_function>
# Returns: 0 on success, 1 on error
stream_completion() {
    local messages_json="$1"
    local model="$2"
    local callback_function="$3"
    
    # Validate inputs
    if [ -z "$messages_json" ]; then
        echo "error: messages_json is required" >&2
        return 1
    fi
    
    if [ -z "$model" ]; then
        echo "error: model is required" >&2
        return 1
    fi
    
    if [ -z "$callback_function" ]; then
        echo "error: callback_function is required" >&2
        return 1
    fi
    
    # Validate localhost-only connection
    if [ "$(validate_localhost "$OLLAMA_HOST")" != "true" ]; then
        echo "error: Only localhost connections are allowed" >&2
        return 1
    fi
    
    # Check connection first
    if [ "$(check_connection)" != "true" ]; then
        echo "error: Cannot connect to Ollama service" >&2
        return 1
    fi
    
    # Validate JSON structure
    if ! validate_json "$messages_json"; then
        echo "error: Invalid messages JSON" >&2
        return 1
    fi
    
    # Build request body
    local request_body=$(jq -n \
        --arg model "$model" \
        --argjson messages "$messages_json" \
        '{
            model: $model,
            messages: $messages,
            stream: true
        }')
    
    # Create a temporary file for the stream PID
    local pid_file="/tmp/ollama_stream_$$.pid"
    
    # Start streaming request in background
    (
        curl -s -N \
            --connect-timeout 10 \
            --max-time 0 \
            -X POST \
            -H "Content-Type: application/json" \
            -d "$request_body" \
            "${OLLAMA_HOST}/api/chat" 2>/dev/null | \
        while IFS= read -r line; do
            # Skip empty lines
            if [ -z "$line" ]; then
                continue
            fi
            
            # Validate JSON line
            if ! validate_json "$line"; then
                continue
            fi
            
            # Check if this is the final message
            local done=$(echo "$line" | jq -r '.done // false')
            
            if [ "$done" = "true" ]; then
                # Call callback with completion signal
                "$callback_function" "" "true"
                break
            fi
            
            # Extract the token/content
            local token=$(echo "$line" | jq -r '.message.content // ""')
            
            # Call the callback function with the token
            if [ -n "$token" ]; then
                "$callback_function" "$token" "false"
            fi
        done
    ) &
    
    # Save the background process PID
    local stream_pid=$!
    echo "$stream_pid" > "$pid_file"
    
    # Wait for the background process to complete
    wait "$stream_pid"
    local exit_code=$?
    
    # Clean up PID file
    rm -f "$pid_file"
    
    return $exit_code
}

# Cancel an in-progress stream
# Usage: cancel_stream
# Returns: 0 on success, 1 if no stream to cancel
cancel_stream() {
    local pid_file="/tmp/ollama_stream_$$.pid"
    
    if [ ! -f "$pid_file" ]; then
        echo "error: No active stream to cancel" >&2
        return 1
    fi
    
    local stream_pid=$(cat "$pid_file")
    
    if [ -z "$stream_pid" ]; then
        echo "error: Invalid stream PID" >&2
        rm -f "$pid_file"
        return 1
    fi
    
    # Kill the stream process
    if kill "$stream_pid" 2>/dev/null; then
        rm -f "$pid_file"
        return 0
    else
        echo "error: Failed to cancel stream (PID: $stream_pid)" >&2
        rm -f "$pid_file"
        return 1
    fi
}

