# Retry Incomplete Messages - Developer Guide

## Overview

This module provides functionality for handling streaming interruptions and retrying incomplete AI responses in the Vanilla Chat TUI.

## Quick Start

```bash
# Source required modules
source "src/lib/error_recovery.sh"
source "src/chat/chat_manager.sh"

# Check if a message is incomplete
if [ "$(is_incomplete_message "$tree" "$node_id")" = "true" ]; then
    # Retry the incomplete message
    tree=$(retry_incomplete_message "$tree" "$node_id" "llama2" "$save_path")
fi
```

## Core Functions

### retry_incomplete_message()

Regenerates an incomplete assistant message by streaming a new response from Ollama.

**Usage:**
```bash
retry_incomplete_message <tree_json> <node_id> <model> <save_path>
```

**Parameters:**
- `tree_json` - The conversation tree JSON
- `node_id` - ID of the incomplete assistant message node
- `model` - AI model to use (default: "llama2")
- `save_path` - Optional path to save tree after completion

**Returns:**
- Updated tree JSON on success
- Error JSON on failure (with tree if available)

**Exit Codes:**
- `0` - Success (message regenerated)
- `1` - Failure (connection error, validation error, or re-interruption)

**Example:**
```bash
tree=$(retry_incomplete_message "$tree" "$assistant_node_id" "llama2" "data/conversations/chat.json")
if [ $? -eq 0 ]; then
    echo "Message successfully regenerated"
else
    echo "Retry failed - message remains incomplete"
fi
```

### is_incomplete_message()

Checks if a message is marked as incomplete.

**Usage:**
```bash
is_incomplete_message <tree_json> <node_id>
```

**Returns:**
- `"true"` if message is incomplete
- `"false"` if message is complete or node not found

**Example:**
```bash
if [ "$(is_incomplete_message "$tree" "$node_id")" = "true" ]; then
    echo "Message is incomplete"
fi
```

### get_incomplete_messages()

Finds all incomplete messages in a conversation tree.

**Usage:**
```bash
get_incomplete_messages <tree_json>
```

**Returns:**
- JSON array of node IDs for incomplete messages
- Empty array `[]` if no incomplete messages

**Example:**
```bash
incomplete_ids=$(get_incomplete_messages "$tree")
count=$(echo "$incomplete_ids" | jq 'length')
echo "Found $count incomplete messages"

# Iterate over incomplete messages
echo "$incomplete_ids" | jq -r '.[]' | while read node_id; do
    echo "Incomplete message: $node_id"
done
```

### mark_message_complete()

Manually marks a message as complete without regenerating content.

**Usage:**
```bash
mark_message_complete <tree_json> <node_id>
```

**Returns:**
- Updated tree JSON with incomplete flag removed

**Example:**
```bash
# User manually edited the partial content and wants to keep it
tree=$(mark_message_complete "$tree" "$node_id")
```

### prepare_retry()

Clears message content and incomplete flag in preparation for retry.

**Usage:**
```bash
prepare_retry <tree_json> <node_id>
```

**Returns:**
- Updated tree JSON with cleared content and incomplete flag

**Example:**
```bash
# Prepare message for manual regeneration
tree=$(prepare_retry "$tree" "$node_id")
# ... custom regeneration logic ...
```

### handle_stream_interruption()

Saves partial content and marks message as incomplete when streaming is interrupted.

**Usage:**
```bash
handle_stream_interruption <tree_json> <node_id> <partial_content>
```

**Returns:**
- Updated tree JSON with partial content saved and incomplete flag set

**Example:**
```bash
# Called automatically by chat_manager when stream fails
tree=$(handle_stream_interruption "$tree" "$assistant_node_id" "$STREAMING_CONTENT")
```

## Workflow Examples

### Example 1: Automatic Retry After Interruption

```bash
# Send message (may be interrupted)
tree=$(send_message "$tree" "What is AI?" "llama2" "$save_path")
send_exit=$?

if [ $send_exit -ne 0 ]; then
    # Get the last assistant message (will be incomplete)
    current_node_id=$(echo "$tree" | jq -r '.currentNodeId')
    
    if [ "$(is_incomplete_message "$tree" "$current_node_id")" = "true" ]; then
        echo "Stream was interrupted. Retrying..."
        tree=$(retry_incomplete_message "$tree" "$current_node_id" "llama2" "$save_path")
    fi
fi
```

### Example 2: Batch Retry All Incomplete Messages

```bash
# Find all incomplete messages
incomplete_ids=$(get_incomplete_messages "$tree")
count=$(echo "$incomplete_ids" | jq 'length')

if [ "$count" -gt 0 ]; then
    echo "Found $count incomplete messages. Retrying all..."
    
    echo "$incomplete_ids" | jq -r '.[]' | while read node_id; do
        echo "Retrying message: $node_id"
        tree=$(retry_incomplete_message "$tree" "$node_id" "llama2" "$save_path")
        
        if [ $? -eq 0 ]; then
            echo "  ✓ Success"
        else
            echo "  ✗ Failed"
        fi
    done
fi
```

### Example 3: User-Initiated Retry

```bash
# Display incomplete messages to user
incomplete_ids=$(get_incomplete_messages "$tree")

if [ "$(echo "$incomplete_ids" | jq 'length')" -gt 0 ]; then
    echo "Incomplete messages found:"
    echo "$incomplete_ids" | jq -r '.[]' | while read node_id; do
        content=$(echo "$tree" | jq -r --arg id "$node_id" '.nodes[$id].message.content')
        echo "  - $node_id: ${content:0:50}..."
    done
    
    # Prompt user
    read -p "Retry incomplete messages? (y/n) " answer
    
    if [ "$answer" = "y" ]; then
        echo "$incomplete_ids" | jq -r '.[]' | while read node_id; do
            tree=$(retry_incomplete_message "$tree" "$node_id" "llama2" "$save_path")
        done
    fi
fi
```

### Example 4: Conditional Retry with Timeout

```bash
# Set quick retry parameters
OLLAMA_MAX_RETRIES=2
OLLAMA_RETRY_DELAY=3

# Attempt retry with timeout
timeout 30 bash -c "
    tree=\$(retry_incomplete_message '$tree' '$node_id' 'llama2' '$save_path')
    echo \"\$tree\"
"

if [ $? -eq 124 ]; then
    echo "Retry timed out after 30 seconds"
else
    echo "Retry completed"
fi
```

## Error Handling

### Connection Errors

When Ollama is unreachable, `retry_incomplete_message()` will:
1. Attempt connection with retry logic (configurable)
2. Return error with tree containing incomplete message
3. Keep message marked as incomplete for later retry

```bash
tree=$(retry_incomplete_message "$tree" "$node_id" "llama2" "$save_path" 2>&1)
exit_code=$?

if [ $exit_code -ne 0 ]; then
    if echo "$tree" | grep -q "connection_failed"; then
        echo "Ollama is not available. Message remains incomplete."
        # Extract tree from error response
        tree=$(echo "$tree" | jq -r '.tree // empty')
    fi
fi
```

### Re-interruption

If a retry is interrupted, the function will:
1. Save new partial content
2. Mark message as incomplete again
3. Return updated tree with exit code 1

```bash
tree=$(retry_incomplete_message "$tree" "$node_id" "llama2" "$save_path")

if [ $? -ne 0 ]; then
    # Check if still incomplete
    if [ "$(is_incomplete_message "$tree" "$node_id")" = "true" ]; then
        echo "Retry was interrupted. Can retry again later."
    fi
fi
```

### Validation Errors

The function validates:
- Node exists in tree
- Node is an assistant message
- Message is marked as incomplete
- Node has a parent (for conversation history)

```bash
tree=$(retry_incomplete_message "$tree" "$node_id" "llama2" "$save_path" 2>&1)

if [ $? -ne 0 ]; then
    if echo "$tree" | grep -q "node not found"; then
        echo "Error: Invalid node ID"
    elif echo "$tree" | grep -q "can only retry assistant messages"; then
        echo "Error: Can only retry assistant messages"
    elif echo "$tree" | grep -q "not marked as incomplete"; then
        echo "Error: Message is already complete"
    fi
fi
```

## Configuration

### Retry Parameters

Configure Ollama connection retry behavior:

```bash
# Maximum retry attempts (default: 3)
export OLLAMA_MAX_RETRIES=5

# Delay between retries in seconds (default: 5)
export OLLAMA_RETRY_DELAY=10
```

### Ollama Host

Configure Ollama API endpoint (must be localhost):

```bash
# Default: http://localhost:11434
export OLLAMA_HOST="http://localhost:11434"
```

## Testing

Run the test suites:

```bash
# Unit tests
bash tests/test_retry_incomplete.sh

# Integration tests (requires Ollama)
bash tests/test_retry_integration.sh

# All error handling tests
bash tests/test_error_handling.sh
```

Run the demo:

```bash
bash examples/retry_incomplete_demo.sh
```

## Requirements Validated

This implementation validates the following requirements:

- **Requirement 12.1**: Save partial response when stream interrupted
- **Requirement 12.2**: Mark message as incomplete
- **Requirement 12.3**: Provide retry option for generation

## See Also

- `src/chat/chat_manager.sh` - Chat orchestration with streaming
- `src/ollama/ollama_client.sh` - Ollama API client
- `src/tree/tree_ops.sh` - Conversation tree operations
- `docs/task-17.2-summary.md` - Implementation summary
