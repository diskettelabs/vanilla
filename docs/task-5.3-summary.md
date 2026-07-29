# Task 5.3 Summary: Auto-Save Functionality

## Overview
Implemented auto-save functionality for the conversation tree, enabling automatic periodic saves and save-after-message-completion to ensure data persistence without user intervention.

## Implementation

### Module: `src/tree/auto_save.sh`

A new module providing comprehensive auto-save capabilities with background process management and error handling.

#### Key Functions

##### `start_auto_save(tree_ref_file, save_path, [interval])`
Starts a background process that automatically saves the conversation tree at regular intervals.

**Parameters:**
- `tree_ref_file`: Path to file containing current tree state (updated by application)
- `save_path`: Path where conversation should be saved
- `interval`: Optional save interval in seconds (default: 30)

**Returns:** Process ID (PID) of the background auto-save process

**Features:**
- Creates background process using subshell
- Reads tree state from reference file
- Saves automatically at specified intervals
- Handles missing or empty reference files gracefully
- Stops any existing auto-save process before starting new one
- Silent operation (errors logged but don't interrupt)

**Error Handling:**
- Validates required parameters
- Continues running even if reference file temporarily missing
- Skips save if tree data is empty
- Handles save failures gracefully without crashing

##### `stop_auto_save()`
Stops the currently running auto-save background process.

**Features:**
- Terminates background process cleanly
- Clears global state variables
- Safe to call even when no process is running
- No error output if process already stopped

##### `save_after_message(tree_json, save_path)`
Saves the conversation tree immediately after a message is completed.

**Parameters:**
- `tree_json`: The conversation tree to save
- `save_path`: Path where conversation should be saved

**Returns:** "success" or error message

**Features:**
- Validates input parameters
- Uses existing `save()` function from tree_ops.sh
- Returns clear success/error status
- Writes errors to stderr

**Error Handling:**
- Empty tree parameter
- Empty save_path parameter
- Propagates save errors from underlying save() function

##### `is_auto_save_running()`
Checks if the auto-save background process is currently running.

**Returns:** "true" if running, "false" otherwise

**Features:**
- Verifies process is actually alive (not just PID stored)
- Cleans up stale PID if process died
- Safe to call at any time

##### `get_auto_save_status()`
Returns detailed status information about auto-save.

**Returns:** JSON object with status information

**JSON Structure:**
```json
{
  "enabled": true/false,
  "running": true/false,
  "pid": "process_id",
  "interval": 30
}
```

##### `shutdown_auto_save(tree_json, save_path)`
Performs graceful shutdown of auto-save with final save.

**Parameters:**
- `tree_json`: The conversation tree to save
- `save_path`: Path where conversation should be saved

**Features:**
- Stops background process
- Performs final save before shutdown
- Ensures no data loss on application exit
- Silent operation

## Architecture

### Background Process Design

The auto-save uses a background subshell process that:
1. Runs in an infinite loop
2. Sleeps for the specified interval
3. Reads tree state from reference file
4. Saves to disk
5. Repeats

This design allows:
- Non-blocking operation (doesn't interfere with main application)
- Easy start/stop control via PID
- Graceful handling of missing/empty data
- Independent operation from main application flow

### State Management

Global variables track auto-save state:
- `AUTO_SAVE_PID`: Process ID of background process
- `AUTO_SAVE_ENABLED`: Boolean flag for enabled state
- `AUTO_SAVE_INTERVAL`: Default interval (30 seconds)

### Integration Pattern

The module is designed to integrate with the chat manager:

```bash
# On application start
tree_ref_file="/tmp/current_tree.json"
save_path="data/conversations/current.json"
start_auto_save "$tree_ref_file" "$save_path" 30

# After each message completion
save_after_message "$tree" "$save_path"

# Update tree ref file for auto-save
echo "$tree" > "$tree_ref_file"

# On application exit
shutdown_auto_save "$tree" "$save_path"
```

## Requirements Satisfied

✅ **Requirement 8.5**: Application auto-saves conversation every 30 seconds
- Background process saves at configurable intervals (default 30s)
- Continues running throughout application lifetime
- Handles errors gracefully without interrupting

✅ **Requirement 8.6**: Application saves conversation after each completed message
- `save_after_message()` function provides immediate save
- Returns success/error status for error handling
- Integrates with existing save() function

## Error Handling

### Graceful Degradation
- Auto-save continues running even if individual saves fail
- Missing reference file doesn't crash the process
- Empty tree data is skipped silently
- Process can be stopped and restarted without issues

### Error Scenarios Handled
1. **Missing reference file**: Process continues, waits for file to appear
2. **Empty tree data**: Skips save, continues monitoring
3. **Save failure**: Logged but doesn't stop auto-save process
4. **Process already running**: Stops old process before starting new one
5. **No process running**: stop_auto_save() succeeds silently

## Testing

### Test Coverage
Created comprehensive test suite in `tests/test_auto_save.sh` with 17 tests covering:

1. **Basic Operations**
   - save_after_message with valid tree
   - save_after_message with empty tree
   - save_after_message with empty save_path

2. **Background Process Management**
   - start_auto_save creates background process
   - start_auto_save with empty parameters
   - stop_auto_save stops the process
   - stop_auto_save when no process running
   - Multiple start_auto_save calls

3. **Auto-Save Behavior**
   - Auto-save actually saves periodically
   - Auto-save updates when tree changes
   - Auto-save handles non-existent tree ref file
   - Custom interval is respected

4. **Status and Monitoring**
   - is_auto_save_running returns correct status
   - get_auto_save_status returns valid JSON

5. **Shutdown**
   - shutdown_auto_save performs final save

6. **Security**
   - File permissions are set correctly (600)

### Demo Script
Created `examples/auto_save_demo.sh` demonstrating:
- Save after message completion
- Auto-save background process
- Status monitoring
- Graceful shutdown with final save

## Usage Examples

### Example 1: Basic Auto-Save Setup
```bash
source src/tree/auto_save.sh

# Create tree
tree=$(init_tree "My Conversation" "llama2")

# Set up auto-save
tree_ref_file="/tmp/tree_ref.json"
save_path="data/conversations/my_conversation.json"

echo "$tree" > "$tree_ref_file"
pid=$(start_auto_save "$tree_ref_file" "$save_path" 30)

echo "Auto-save started with PID: $pid"
```

### Example 2: Save After Message
```bash
# User sends message
message=$(create_message "user" "Hello!")
result=$(add_node "$tree" "$message" "")
tree=$(echo "$result" | jq -r '.tree')

# Save immediately
save_after_message "$tree" "$save_path"

# Update ref file for auto-save
echo "$tree" > "$tree_ref_file"
```

### Example 3: Check Status
```bash
# Check if running
if [ "$(is_auto_save_running)" = "true" ]; then
    echo "Auto-save is active"
fi

# Get detailed status
status=$(get_auto_save_status)
echo "$status" | jq '.'
```

### Example 4: Graceful Shutdown
```bash
# On application exit
shutdown_auto_save "$tree" "$save_path"
```

## Performance Considerations

### Background Process Overhead
- Minimal CPU usage (sleeps between saves)
- Only active during save operations
- No impact on main application performance

### Save Frequency
- Default 30-second interval balances data safety and performance
- Configurable interval allows tuning for specific needs
- Immediate save after messages ensures no data loss

### File I/O
- Reads reference file only when needed
- Writes to disk at controlled intervals
- Uses existing save() function (already optimized)

## Security

### File Permissions
- All saved files have 600 permissions (user-only read/write)
- Inherited from underlying save() function
- Protects conversation data from other users

### Process Isolation
- Background process runs in subshell
- No access to parent process variables
- Clean separation of concerns

## Integration Points

### With Tree Operations
- Uses `save()` and `load()` from tree_ops.sh
- Compatible with all tree manipulation functions
- No modifications to existing tree structure

### With Chat Manager (Future)
- Chat manager will call `save_after_message()` after each response
- Chat manager will update tree reference file
- Chat manager will call `shutdown_auto_save()` on exit

### With TUI (Future)
- TUI can display auto-save status
- TUI can show last save time
- TUI can indicate save errors to user

## Future Enhancements

Possible improvements for future iterations:
1. **Save queue**: Queue saves to avoid concurrent writes
2. **Incremental saves**: Only save changed nodes
3. **Backup rotation**: Keep multiple backup versions
4. **Save notifications**: Callback when save completes
5. **Error recovery**: Retry failed saves with backoff
6. **Compression**: Compress saved files to save space

## Files Modified/Created

### Created
- `src/tree/auto_save.sh` - Auto-save module implementation
- `tests/test_auto_save.sh` - Comprehensive test suite
- `tests/test_auto_save_simple.sh` - Simplified test suite
- `examples/auto_save_demo.sh` - Demo script
- `docs/task-5.3-summary.md` - This documentation

### Dependencies
- `src/tree/tree_ops.sh` - Uses save() and load() functions
- `src/lib/json_utils.sh` - Uses JSON utilities (via tree_ops.sh)

## Conclusion

Task 5.3 successfully implements auto-save functionality that:
- Automatically saves conversations every 30 seconds (configurable)
- Saves immediately after message completion
- Handles errors gracefully without data loss
- Provides clean API for integration with chat manager
- Maintains security with proper file permissions
- Operates efficiently in the background

The implementation is production-ready and fully satisfies requirements 8.5 and 8.6.
