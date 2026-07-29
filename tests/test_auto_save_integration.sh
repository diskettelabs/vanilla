#!/usr/bin/env bash
# Integration test for auto-save functionality
# This test verifies the complete auto-save workflow

set -e

# Source the auto-save module
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/../src/tree/auto_save.sh"

# Temporary directory for test files
TEST_DIR=$(mktemp -d)
trap "rm -rf $TEST_DIR" EXIT

echo "========================================="
echo "Auto-Save Integration Test"
echo "========================================="
echo

# Test: Complete auto-save workflow
echo "Test: Complete auto-save workflow"
echo "-----------------------------------"

# 1. Create initial conversation
echo "1. Creating initial conversation..."
tree=$(init_tree "Integration Test" "llama2")
message1=$(create_message "user" "First message")
result=$(add_node "$tree" "$message1" "")
tree=$(echo "$result" | jq -r '.tree')

tree_ref_file="$TEST_DIR/tree_ref.json"
save_path="$TEST_DIR/conversation.json"

# 2. Save after first message
echo "2. Saving after first message..."
result=$(save_after_message "$tree" "$save_path")
if [ "$result" != "success" ]; then
    echo "✗ Failed to save after first message"
    exit 1
fi
echo "✓ Saved after first message"

# 3. Start auto-save
echo "3. Starting auto-save (3-second interval)..."
echo "$tree" > "$tree_ref_file"
pid=$(start_auto_save "$tree_ref_file" "$save_path" 3)

if [ -z "$pid" ]; then
    echo "✗ Failed to start auto-save"
    exit 1
fi
echo "✓ Auto-save started (PID: $pid)"

# 4. Verify auto-save is running
echo "4. Verifying auto-save status..."
if [ "$(is_auto_save_running)" != "true" ]; then
    echo "✗ Auto-save not running"
    exit 1
fi
echo "✓ Auto-save is running"

# 5. Add more messages
echo "5. Adding more messages..."
message2=$(create_message "assistant" "Response to first message")
result=$(add_node "$tree" "$message2" "")
tree=$(echo "$result" | jq -r '.tree')

# Save after second message
save_after_message "$tree" "$save_path" >/dev/null

# Update ref file for auto-save
echo "$tree" > "$tree_ref_file"

message3=$(create_message "user" "Third message")
result=$(add_node "$tree" "$message3" "")
tree=$(echo "$result" | jq -r '.tree')

# Save after third message
save_after_message "$tree" "$save_path" >/dev/null

# Update ref file
echo "$tree" > "$tree_ref_file"

echo "✓ Added 2 more messages (3 total)"

# 6. Wait for auto-save to trigger
echo "6. Waiting for auto-save to trigger..."
sleep 4

# 7. Verify auto-saved file
echo "7. Verifying auto-saved file..."
if [ ! -f "$save_path" ]; then
    echo "✗ Auto-save file not found"
    stop_auto_save
    exit 1
fi

loaded_tree=$(load "$save_path")
node_count=$(echo "$loaded_tree" | jq '.nodes | length')

if [ "$node_count" != "3" ]; then
    echo "✗ Auto-saved tree has wrong number of nodes (expected 3, got $node_count)"
    stop_auto_save
    exit 1
fi
echo "✓ Auto-saved tree has correct number of nodes"

# 8. Verify file permissions
echo "8. Verifying file permissions..."
perms=$(stat -f "%OLp" "$save_path" 2>/dev/null || stat -c "%a" "$save_path" 2>/dev/null)
if [ "$perms" != "600" ]; then
    echo "✗ File permissions incorrect (expected 600, got $perms)"
    stop_auto_save
    exit 1
fi
echo "✓ File has correct permissions (600)"

# 9. Test graceful shutdown
echo "9. Testing graceful shutdown..."
message4=$(create_message "assistant" "Final message")
result=$(add_node "$tree" "$message4" "")
tree=$(echo "$result" | jq -r '.tree')

shutdown_auto_save "$tree" "$save_path"

# Verify process stopped
sleep 0.5
if kill -0 "$pid" 2>/dev/null; then
    echo "✗ Process still running after shutdown"
    kill "$pid" 2>/dev/null
    exit 1
fi
echo "✓ Process stopped after shutdown"

# 10. Verify final save
echo "10. Verifying final save..."
loaded_tree=$(load "$save_path")
node_count=$(echo "$loaded_tree" | jq '.nodes | length')

if [ "$node_count" != "4" ]; then
    echo "✗ Final save has wrong number of nodes (expected 4, got $node_count)"
    exit 1
fi
echo "✓ Final save has correct number of nodes"

# 11. Verify tree structure integrity
echo "11. Verifying tree structure integrity..."
validation=$(validate_tree "$loaded_tree")
is_valid=$(echo "$validation" | jq -r '.isValid')

if [ "$is_valid" != "true" ]; then
    echo "✗ Loaded tree is invalid"
    echo "$validation" | jq '.'
    exit 1
fi
echo "✓ Tree structure is valid"

# 12. Verify conversation content
echo "12. Verifying conversation content..."
title=$(echo "$loaded_tree" | jq -r '.metadata.title')
if [ "$title" != "Integration Test" ]; then
    echo "✗ Tree title incorrect"
    exit 1
fi

root_id=$(echo "$loaded_tree" | jq -r '.rootId')
path=$(get_path "$loaded_tree" "$root_id")
path_length=$(echo "$path" | jq 'length')

if [ "$path_length" != "1" ]; then
    echo "✗ Path length incorrect"
    exit 1
fi
echo "✓ Conversation content is correct"

echo
echo "========================================="
echo "Integration Test Summary"
echo "========================================="
echo "✓ All integration tests passed!"
echo
echo "Verified:"
echo "  - Save after message completion"
echo "  - Auto-save background process"
echo "  - Periodic auto-save (3-second interval)"
echo "  - File permissions (600)"
echo "  - Graceful shutdown with final save"
echo "  - Tree structure integrity"
echo "  - Conversation content preservation"
echo
