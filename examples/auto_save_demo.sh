#!/usr/bin/env bash
# Demo script for auto-save functionality

# Source the auto-save module
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/../src/tree/auto_save.sh"

echo "========================================="
echo "Auto-Save Functionality Demo"
echo "========================================="
echo

# Create a temporary directory for demo
DEMO_DIR=$(mktemp -d)
echo "Demo directory: $DEMO_DIR"
echo

# Demo 1: Save after message completion
echo "Demo 1: Save after message completion"
echo "--------------------------------------"
tree=$(init_tree "Demo Conversation" "llama2")
message=$(create_message "user" "What is the meaning of life?")
result=$(add_node "$tree" "$message" "")
tree=$(echo "$result" | jq -r '.tree')

save_path="$DEMO_DIR/conversation.json"
result=$(save_after_message "$tree" "$save_path")

echo "Save result: $result"
echo "File created: $save_path"
echo "File permissions: $(stat -f "%OLp" "$save_path" 2>/dev/null || stat -c "%a" "$save_path" 2>/dev/null)"
echo

# Demo 2: Auto-save background process
echo "Demo 2: Auto-save background process"
echo "--------------------------------------"
tree=$(init_tree "Auto-save Demo" "llama2")
tree_ref_file="$DEMO_DIR/tree_ref.json"
auto_save_path="$DEMO_DIR/auto_save.json"

# Write initial tree
echo "$tree" > "$tree_ref_file"

# Start auto-save with 5-second interval
echo "Starting auto-save with 5-second interval..."
pid=$(start_auto_save "$tree_ref_file" "$auto_save_path" 5)
echo "Auto-save PID: $pid"
echo

# Check status
status=$(get_auto_save_status)
echo "Auto-save status:"
echo "$status" | jq '.'
echo

# Simulate adding messages
echo "Simulating conversation updates..."
for i in {1..3}; do
    echo "  Adding message $i..."
    message=$(create_message "user" "Message $i")
    result=$(add_node "$tree" "$message" "")
    tree=$(echo "$result" | jq -r '.tree')
    
    # Update tree ref file
    echo "$tree" > "$tree_ref_file"
    
    # Also save after message
    save_after_message "$tree" "$save_path" >/dev/null
    
    sleep 1
done

echo "Waiting for auto-save to trigger (5 seconds)..."
sleep 6

if [ -f "$auto_save_path" ]; then
    echo "✓ Auto-save file created: $auto_save_path"
    loaded_tree=$(load "$auto_save_path")
    node_count=$(echo "$loaded_tree" | jq '.nodes | length')
    echo "  Nodes in auto-saved tree: $node_count"
else
    echo "✗ Auto-save file not created"
fi
echo

# Demo 3: Graceful shutdown
echo "Demo 3: Graceful shutdown"
echo "--------------------------------------"
echo "Performing graceful shutdown with final save..."
shutdown_auto_save "$tree" "$save_path"

# Verify process stopped
if ! kill -0 "$pid" 2>/dev/null; then
    echo "✓ Auto-save process stopped"
else
    echo "✗ Auto-save process still running"
fi

# Verify final save
if [ -f "$save_path" ]; then
    loaded_tree=$(load "$save_path")
    node_count=$(echo "$loaded_tree" | jq '.nodes | length')
    echo "✓ Final save completed"
    echo "  Nodes in final save: $node_count"
fi
echo

echo "========================================="
echo "Demo Complete"
echo "========================================="
echo "Demo files are in: $DEMO_DIR"
echo "To clean up: rm -rf $DEMO_DIR"
