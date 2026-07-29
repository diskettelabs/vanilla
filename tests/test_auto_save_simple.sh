#!/usr/bin/env bash
# Simple test for auto-save functionality

# Source the auto-save module
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/../src/tree/auto_save.sh"

# Temporary directory for test files
TEST_DIR=$(mktemp -d)
trap "rm -rf $TEST_DIR" EXIT

echo "Testing auto-save functionality..."
echo

# Test 1: save_after_message
echo "Test 1: save_after_message"
tree=$(init_tree "Test Conversation" "llama2")
message=$(create_message "user" "Hello")
result=$(add_node "$tree" "$message" "")
tree=$(echo "$result" | jq -r '.tree')

save_path="$TEST_DIR/test1.json"
result=$(save_after_message "$tree" "$save_path")

if [ "$result" = "success" ] && [ -f "$save_path" ]; then
    echo "✓ save_after_message works"
else
    echo "✗ save_after_message failed"
    exit 1
fi
echo

# Test 2: start_auto_save
echo "Test 2: start_auto_save"
tree=$(init_tree "Auto-save Test" "llama2")
tree_ref_file="$TEST_DIR/tree_ref.json"
save_path="$TEST_DIR/auto_save.json"

echo "$tree" > "$tree_ref_file"

pid=$(start_auto_save "$tree_ref_file" "$save_path" 2)

if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
    echo "✓ start_auto_save creates background process"
else
    echo "✗ start_auto_save failed"
    exit 1
fi

# Wait for auto-save
sleep 3

if [ -f "$save_path" ]; then
    echo "✓ Auto-save creates file"
else
    echo "✗ Auto-save did not create file"
    stop_auto_save
    exit 1
fi

stop_auto_save
echo

# Test 3: stop_auto_save
echo "Test 3: stop_auto_save"
tree=$(init_tree "Stop Test" "llama2")
tree_ref_file="$TEST_DIR/tree_ref2.json"
save_path="$TEST_DIR/auto_save2.json"

echo "$tree" > "$tree_ref_file"
pid=$(start_auto_save "$tree_ref_file" "$save_path" 30)

stop_auto_save

sleep 0.5

if ! kill -0 "$pid" 2>/dev/null; then
    echo "✓ stop_auto_save stops the process"
else
    echo "✗ stop_auto_save failed to stop process"
    kill "$pid" 2>/dev/null
    exit 1
fi
echo

# Test 4: is_auto_save_running
echo "Test 4: is_auto_save_running"
AUTO_SAVE_PID=""
result=$(is_auto_save_running)

if [ "$result" = "false" ]; then
    echo "✓ is_auto_save_running returns false when not running"
else
    echo "✗ is_auto_save_running incorrect"
    exit 1
fi

tree=$(init_tree "Status Test" "llama2")
tree_ref_file="$TEST_DIR/tree_ref3.json"
save_path="$TEST_DIR/auto_save3.json"
echo "$tree" > "$tree_ref_file"

pid=$(start_auto_save "$tree_ref_file" "$save_path" 30)
result=$(is_auto_save_running)

if [ "$result" = "true" ]; then
    echo "✓ is_auto_save_running returns true when running"
else
    echo "✗ is_auto_save_running incorrect"
    stop_auto_save
    exit 1
fi

stop_auto_save
echo

# Test 5: get_auto_save_status
echo "Test 5: get_auto_save_status"
tree=$(init_tree "Status JSON Test" "llama2")
tree_ref_file="$TEST_DIR/tree_ref4.json"
save_path="$TEST_DIR/auto_save4.json"
echo "$tree" > "$tree_ref_file"

pid=$(start_auto_save "$tree_ref_file" "$save_path" 30)
status=$(get_auto_save_status)

if echo "$status" | jq empty 2>/dev/null; then
    echo "✓ get_auto_save_status returns valid JSON"
else
    echo "✗ get_auto_save_status invalid JSON"
    stop_auto_save
    exit 1
fi

enabled=$(echo "$status" | jq -r '.enabled')
if [ "$enabled" = "true" ]; then
    echo "✓ Status shows enabled=true"
else
    echo "✗ Status enabled incorrect"
    stop_auto_save
    exit 1
fi

stop_auto_save
echo

echo "All tests passed! ✓"
