# Auto-Save Module

## Overview

The auto-save module provides automatic conversation tree persistence with two key features:
1. **Periodic auto-save**: Background process that saves every 30 seconds (configurable)
2. **Save after message**: Immediate save after each completed message

## Quick Start

```bash
# Source the module
source src/tree/auto_save.sh

# Create a conversation tree
tree=$(init_tree "My Conversation" "llama2")

# Set up auto-save
tree_ref_file="/tmp/tree_ref.json"
save_path="data/conversations/my_conversation.json"

echo "$tree" > "$tree_ref_file"
pid=$(start_auto_save "$tree_ref_file" "$save_path" 30)

# After each message, save immediately
save_after_message "$tree" "$save_path"

# Update ref file for auto-save
echo "$tree" > "$tree_ref_file"

# On exit, shutdown gracefully
shutdown_auto_save "$tree" "$save_path"
```

## API Reference

### start_auto_save(tree_ref_file, save_path, [interval])

Starts a background process that automatically saves the conversation tree.

**Parameters:**
- `tree_ref_file` (string): Path to file containing current tree state
- `save_path` (string): Path where conversation should be saved
- `interval` (number, optional): Save interval in seconds (default: 30)

**Returns:** Process ID (PID) of the background process

**Example:**
```bash
pid=$(start_auto_save "/tmp/tree.json" "data/conversation.json" 30)
echo "Auto-save started with PID: $pid"
```

### stop_auto_save()

Stops the currently running auto-save background process.

**Example:**
```bash
stop_auto_save
```

### save_after_message(tree_json, save_path)

Saves the conversation tree immediately after a message is completed.

**Parameters:**
- `tree_json` (string): The conversation tree JSON
- `save_path` (string): Path where conversation should be saved

**Returns:** "success" or error message

**Example:**
```bash
result=$(save_after_message "$tree" "data/conversation.json")
if [ "$result" = "success" ]; then
    echo "Saved successfully"
fi
```

### is_auto_save_running()

Checks if the auto-save background process is currently running.

**Returns:** "true" or "false"

**Example:**
```bash
if [ "$(is_auto_save_running)" = "true" ]; then
    echo "Auto-save is active"
fi
```

### get_auto_save_status()

Returns detailed status information about auto-save.

**Returns:** JSON object with status information

**JSON Structure:**
```json
{
  "enabled": true,
  "running": true,
  "pid": "12345",
  "interval": 30
}
```

**Example:**
```bash
status=$(get_auto_save_status)
echo "$status" | jq '.'
```

### shutdown_auto_save(tree_json, save_path)

Performs graceful shutdown of auto-save with a final save.

**Parameters:**
- `tree_json` (string): The conversation tree JSON
- `save_path` (string): Path where conversation should be saved

**Example:**
```bash
shutdown_auto_save "$tree" "data/conversation.json"
```

## Architecture

### Background Process

The auto-save uses a background subshell that:
1. Runs in an infinite loop
2. Sleeps for the specified interval
3. Reads tree state from reference file
4. Saves to disk
5. Repeats

This design ensures:
- Non-blocking operation
- Easy start/stop control
- Graceful error handling
- Independent from main application

### Reference File Pattern

The module uses a "reference file" pattern:
- Main application writes current tree to reference file
- Background process reads from reference file
- Decouples auto-save from main application state
- Allows atomic updates

## Error Handling

The module handles errors gracefully:

- **Missing reference file**: Process continues, waits for file
- **Empty tree data**: Skips save, continues monitoring
- **Save failure**: Logged but doesn't stop process
- **Process already running**: Stops old process first
- **No process running**: stop_auto_save() succeeds silently

## Security

- All saved files have 600 permissions (user-only read/write)
- Background process runs in isolated subshell
- No external dependencies beyond jq

## Performance

- Minimal CPU usage (sleeps between saves)
- Only active during save operations
- No impact on main application
- Configurable interval for tuning

## Integration Example

```bash
#!/usr/bin/env bash
# Example chat application with auto-save

source src/tree/auto_save.sh

# Initialize
tree=$(init_tree "Chat Session" "llama2")
tree_ref="/tmp/chat_tree.json"
save_path="data/conversations/session.json"

# Start auto-save
echo "$tree" > "$tree_ref"
start_auto_save "$tree_ref" "$save_path" 30

# Main chat loop
while true; do
    # Get user input
    read -p "You: " user_input
    
    # Add user message
    message=$(create_message "user" "$user_input")
    result=$(add_node "$tree" "$message" "")
    tree=$(echo "$result" | jq -r '.tree')
    
    # Save after user message
    save_after_message "$tree" "$save_path"
    echo "$tree" > "$tree_ref"
    
    # Get AI response (simulated)
    ai_response="AI response here"
    
    # Add assistant message
    message=$(create_message "assistant" "$ai_response")
    result=$(add_node "$tree" "$message" "")
    tree=$(echo "$result" | jq -r '.tree')
    
    # Save after assistant message
    save_after_message "$tree" "$save_path"
    echo "$tree" > "$tree_ref"
    
    echo "Assistant: $ai_response"
done

# Cleanup on exit
trap "shutdown_auto_save '$tree' '$save_path'" EXIT
```

## Testing

Run the test suite:
```bash
./tests/test_auto_save.sh
```

Run the integration test:
```bash
./tests/test_auto_save_integration.sh
```

Run the demo:
```bash
./examples/auto_save_demo.sh
```

## Requirements Satisfied

- ✅ **Requirement 8.5**: Auto-save every 30 seconds
- ✅ **Requirement 8.6**: Save after each completed message
- ✅ **Requirement 8.7**: File permissions 600 (via tree_ops.sh)

## Dependencies

- `src/tree/tree_ops.sh` - Tree operations (save/load)
- `src/lib/json_utils.sh` - JSON utilities
- `jq` - JSON processor

## Future Enhancements

Possible improvements:
- Save queue to avoid concurrent writes
- Incremental saves (only changed nodes)
- Backup rotation
- Save notifications/callbacks
- Error recovery with retry logic
- Compression for saved files
