#!/usr/bin/env bash
# Unit tests for auto-save functionality

set -e

# Source the auto-save module
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/../src/tree/auto_save.sh"

# Test counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Temporary directory for test files
TEST_DIR=$(mktemp -d)

# Track all background PIDs for cleanup
BACKGROUND_PIDS=()

# Cleanup function
cleanup() {
    # Kill all tracked background processes
    for pid in "${BACKGROUND_PIDS[@]}"; do
        kill "$pid" 2>/dev/null || true
    done
    
    # Also try to stop auto-save
    stop_auto_save 2>/dev/null || true
    
    # Remove temp directory
    rm -rf "$TEST_DIR"
}

trap cleanup EXIT

# Test helper functions
assert_equals() {
    local expected="$1"
    local actual="$2"
    local test_name="$3"
    
    TESTS_RUN=$((TESTS_RUN + 1))
    
    if [ "$expected" = "$actual" ]; then
        echo "  ✓ $test_name"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo "  ✗ $test_name"
        echo "    Expected: $expected"
        echo "    Actual: $actual"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
}

assert_file_exists() {
    local filepath="$1"
    local test_name="$2"
    
    TESTS_RUN=$((TESTS_RUN + 1))
    
    if [ -f "$filepath" ]; then
        echo "  ✓ $test_name"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo "  ✗ $test_name"
        echo "    File does not exist: $filepath"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
}

assert_file_not_exists() {
    local filepath="$1"
    local test_name="$2"
    
    TESTS_RUN=$((TESTS_RUN + 1))
    
    if [ ! -f "$filepath" ]; then
        echo "  ✓ $test_name"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo "  ✗ $test_name"
        echo "    File exists but should not: $filepath"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
}

assert_process_running() {
    local pid="$1"
    local test_name="$2"
    
    TESTS_RUN=$((TESTS_RUN + 1))
    
    if kill -0 "$pid" 2>/dev/null; then
        echo "  ✓ $test_name"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo "  ✗ $test_name"
        echo "    Process $pid is not running"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
}

assert_process_not_running() {
    local pid="$1"
    local test_name="$2"
    
    TESTS_RUN=$((TESTS_RUN + 1))
    
    if ! kill -0 "$pid" 2>/dev/null; then
        echo "  ✓ $test_name"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo "  ✗ $test_name"
        echo "    Process $pid is still running"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
}

assert_json_valid() {
    local json="$1"
    local test_name="$2"
    
    TESTS_RUN=$((TESTS_RUN + 1))
    
    if echo "$json" | jq empty 2>/dev/null; then
        echo "  ✓ $test_name"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo "  ✗ $test_name"
        echo "    Invalid JSON"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
}

echo "========================================="
echo "Testing Auto-Save Functionality"
echo "========================================="
echo

# Test 1: save_after_message with valid tree
echo "Test 1: save_after_message with valid tree"
tree=$(init_tree "Test Conversation" "llama2")
message=$(create_message "user" "Hello")
result=$(add_node "$tree" "$message" "")
tree=$(echo "$result" | jq -r '.tree')

save_path="$TEST_DIR/test1.json"
result=$(save_after_message "$tree" "$save_path")

assert_equals "success" "$result" "Save after message returns success"
assert_file_exists "$save_path" "Save file created"

# Verify saved content
loaded_tree=$(load "$save_path")
title=$(echo "$loaded_tree" | jq -r '.metadata.title')
assert_equals "Test Conversation" "$title" "Saved tree has correct title"
echo

# Test 2: save_after_message with empty tree
echo "Test 2: save_after_message with empty tree"
save_path="$TEST_DIR/test2.json"
set +e
result=$(save_after_message "" "$save_path" 2>&1)
exit_code=$?
set -e

TESTS_RUN=$((TESTS_RUN + 1))
if [ $exit_code -ne 0 ] && echo "$result" | grep -q "error: tree is empty"; then
    echo "  ✓ Empty tree returns error"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo "  ✗ Empty tree returns error"
    echo "    Got: $result (exit code: $exit_code)"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi

assert_file_not_exists "$save_path" "No file created for empty tree"
echo

# Test 3: save_after_message with empty save_path
echo "Test 3: save_after_message with empty save_path"
tree=$(init_tree "Test" "llama2")
set +e
result=$(save_after_message "$tree" "" 2>&1)
exit_code=$?
set -e

TESTS_RUN=$((TESTS_RUN + 1))
if [ $exit_code -ne 0 ] && echo "$result" | grep -q "error: save_path is empty"; then
    echo "  ✓ Empty save_path returns error"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo "  ✗ Empty save_path returns error"
    echo "    Got: $result (exit code: $exit_code)"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
echo

# Test 4: start_auto_save creates background process
echo "Test 4: start_auto_save creates background process"
tree=$(init_tree "Auto-save Test" "llama2")
tree_ref_file="$TEST_DIR/tree_ref.json"
save_path="$TEST_DIR/auto_save.json"

# Write tree to ref file
echo "$tree" > "$tree_ref_file"

# Start auto-save with short interval for testing
pid=$(start_auto_save "$tree_ref_file" "$save_path" 2)

TESTS_RUN=$((TESTS_RUN + 1))
if [ -n "$pid" ]; then
    echo "  ✓ start_auto_save returns PID"
    TESTS_PASSED=$((TESTS_PASSED + 1))
    BACKGROUND_PIDS+=("$pid")
else
    echo "  ✗ start_auto_save returns PID"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi

if [ -n "$pid" ]; then
    assert_process_running "$pid" "Auto-save process is running"
fi

# Clean up immediately
stop_auto_save
sleep 0.2
echo

# Test 5: start_auto_save with empty tree_ref_file
echo "Test 5: start_auto_save with empty tree_ref_file"
set +e
result=$(start_auto_save "" "$TEST_DIR/test5.json" 2>&1)
exit_code=$?
set -e

TESTS_RUN=$((TESTS_RUN + 1))
if [ $exit_code -ne 0 ]; then
    echo "  ✓ Empty tree_ref_file returns error"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo "  ✗ Empty tree_ref_file returns error"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
echo

# Test 6: start_auto_save with empty save_path
echo "Test 6: start_auto_save with empty save_path"
set +e
result=$(start_auto_save "$TEST_DIR/tree.json" "" 2>&1)
exit_code=$?
set -e

TESTS_RUN=$((TESTS_RUN + 1))
if [ $exit_code -ne 0 ]; then
    echo "  ✓ Empty save_path returns error"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo "  ✗ Empty save_path returns error"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
echo

# Test 7: stop_auto_save stops the process
echo "Test 7: stop_auto_save stops the process"
tree=$(init_tree "Stop Test" "llama2")
tree_ref_file="$TEST_DIR/tree_ref2.json"
save_path="$TEST_DIR/auto_save2.json"

echo "$tree" > "$tree_ref_file"
pid=$(start_auto_save "$tree_ref_file" "$save_path" 2)
BACKGROUND_PIDS+=("$pid")

# Verify process is running
assert_process_running "$pid" "Process running before stop"

# Stop auto-save
stop_auto_save

# Wait longer for process to fully terminate
sleep 1.5

assert_process_not_running "$pid" "Process stopped after stop_auto_save"
echo

# Test 8: stop_auto_save when no process running
echo "Test 8: stop_auto_save when no process running"
# Ensure no process is running
AUTO_SAVE_PID=""

set +e
result=$(stop_auto_save 2>&1)
exit_code=$?
set -e

TESTS_RUN=$((TESTS_RUN + 1))
if [ $exit_code -eq 0 ]; then
    echo "  ✓ stop_auto_save succeeds when no process running"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo "  ✗ stop_auto_save succeeds when no process running"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
echo

# Test 9: Auto-save actually saves periodically
echo "Test 9: Auto-save actually saves periodically"
tree=$(init_tree "Periodic Save Test" "llama2")
message=$(create_message "user" "Test message")
result=$(add_node "$tree" "$message" "")
tree=$(echo "$result" | jq -r '.tree')

tree_ref_file="$TEST_DIR/tree_ref3.json"
save_path="$TEST_DIR/auto_save3.json"

echo "$tree" > "$tree_ref_file"

# Start auto-save with 1-second interval for faster testing
pid=$(start_auto_save "$tree_ref_file" "$save_path" 1)
BACKGROUND_PIDS+=("$pid")

# Wait for first save (1 second + small buffer)
sleep 1.5

# Check if file was created
assert_file_exists "$save_path" "Auto-save created file after interval"

# Verify content
if [ -f "$save_path" ]; then
    loaded_tree=$(load "$save_path")
    title=$(echo "$loaded_tree" | jq -r '.metadata.title')
    assert_equals "Periodic Save Test" "$title" "Auto-saved tree has correct content"
fi

# Clean up
stop_auto_save
echo

# Test 10: Auto-save updates when tree changes
echo "Test 10: Auto-save updates when tree changes"
tree=$(init_tree "Update Test" "llama2")
tree_ref_file="$TEST_DIR/tree_ref4.json"
save_path="$TEST_DIR/auto_save4.json"

echo "$tree" > "$tree_ref_file"

# Start auto-save with 1-second interval for faster testing
pid=$(start_auto_save "$tree_ref_file" "$save_path" 1)
BACKGROUND_PIDS+=("$pid")

# Wait for first save
sleep 1.5

# Update tree
message=$(create_message "user" "New message")
result=$(add_node "$tree" "$message" "")
tree=$(echo "$result" | jq -r '.tree')
echo "$tree" > "$tree_ref_file"

# Wait for second save
sleep 1.5

# Verify updated content
if [ -f "$save_path" ]; then
    loaded_tree=$(load "$save_path")
    node_count=$(echo "$loaded_tree" | jq '.nodes | length')
    assert_equals "1" "$node_count" "Auto-saved tree reflects updates"
fi

# Clean up
stop_auto_save
echo

# Test 11: is_auto_save_running returns correct status
echo "Test 11: is_auto_save_running returns correct status"

# No process running
AUTO_SAVE_PID=""
result=$(is_auto_save_running)
assert_equals "false" "$result" "Returns false when no process running"

# Start process
tree=$(init_tree "Status Test" "llama2")
tree_ref_file="$TEST_DIR/tree_ref5.json"
save_path="$TEST_DIR/auto_save5.json"
echo "$tree" > "$tree_ref_file"

pid=$(start_auto_save "$tree_ref_file" "$save_path" 30)
BACKGROUND_PIDS+=("$pid")

result=$(is_auto_save_running)
assert_equals "true" "$result" "Returns true when process running"

# Stop process
stop_auto_save

result=$(is_auto_save_running)
assert_equals "false" "$result" "Returns false after stopping"
echo

# Test 12: get_auto_save_status returns valid JSON
echo "Test 12: get_auto_save_status returns valid JSON"

# Start auto-save
tree=$(init_tree "Status JSON Test" "llama2")
tree_ref_file="$TEST_DIR/tree_ref6.json"
save_path="$TEST_DIR/auto_save6.json"
echo "$tree" > "$tree_ref_file"

pid=$(start_auto_save "$tree_ref_file" "$save_path" 30)
BACKGROUND_PIDS+=("$pid")

status=$(get_auto_save_status)
assert_json_valid "$status" "Status is valid JSON"

enabled=$(echo "$status" | jq -r '.enabled')
assert_equals "true" "$enabled" "Status shows enabled=true"

running=$(echo "$status" | jq -r '.running')
assert_equals "true" "$running" "Status shows running=true"

interval=$(echo "$status" | jq -r '.interval')
assert_equals "30" "$interval" "Status shows correct interval"

# Clean up
stop_auto_save
echo

# Test 13: shutdown_auto_save performs final save
echo "Test 13: shutdown_auto_save performs final save"
tree=$(init_tree "Shutdown Test" "llama2")
message=$(create_message "user" "Final message")
result=$(add_node "$tree" "$message" "")
tree=$(echo "$result" | jq -r '.tree')

tree_ref_file="$TEST_DIR/tree_ref7.json"
save_path="$TEST_DIR/auto_save7.json"
echo "$tree" > "$tree_ref_file"

# Start auto-save
pid=$(start_auto_save "$tree_ref_file" "$save_path" 30)
BACKGROUND_PIDS+=("$pid")

# Shutdown with final save
shutdown_auto_save "$tree" "$save_path"

# Wait a moment for cleanup
sleep 0.5

# Verify process stopped
assert_process_not_running "$pid" "Process stopped after shutdown"

# Verify final save occurred
assert_file_exists "$save_path" "Final save file created"

if [ -f "$save_path" ]; then
    loaded_tree=$(load "$save_path")
    node_count=$(echo "$loaded_tree" | jq '.nodes | length')
    assert_equals "1" "$node_count" "Final save has correct content"
fi
echo

# Test 14: Multiple start_auto_save calls stop previous process
echo "Test 14: Multiple start_auto_save calls stop previous process"
tree=$(init_tree "Multiple Start Test" "llama2")
tree_ref_file="$TEST_DIR/tree_ref8.json"
save_path="$TEST_DIR/auto_save8.json"
echo "$tree" > "$tree_ref_file"

# Start first auto-save
pid1=$(start_auto_save "$tree_ref_file" "$save_path" 30)
BACKGROUND_PIDS+=("$pid1")

# Start second auto-save (should stop first)
pid2=$(start_auto_save "$tree_ref_file" "$save_path" 30)
BACKGROUND_PIDS+=("$pid2")

# Wait a moment
sleep 0.5

# First process should be stopped
assert_process_not_running "$pid1" "First process stopped when second started"

# Second process should be running
assert_process_running "$pid2" "Second process is running"

# Clean up
stop_auto_save
echo

# Test 15: Auto-save handles non-existent tree ref file gracefully
echo "Test 15: Auto-save handles non-existent tree ref file gracefully"
tree_ref_file="$TEST_DIR/nonexistent.json"
save_path="$TEST_DIR/auto_save9.json"

# Start auto-save with non-existent ref file and 1-second interval
pid=$(start_auto_save "$tree_ref_file" "$save_path" 1)
BACKGROUND_PIDS+=("$pid")

# Wait for interval
sleep 1.5

# Process should still be running (just skipping saves)
assert_process_running "$pid" "Process continues despite missing ref file"

# File should not be created
assert_file_not_exists "$save_path" "No save file created for missing ref"

# Clean up
stop_auto_save
echo

# Test 16: File permissions are set correctly
echo "Test 16: File permissions are set correctly"
tree=$(init_tree "Permissions Test" "llama2")
save_path="$TEST_DIR/test_permissions.json"

result=$(save_after_message "$tree" "$save_path")

if [ -f "$save_path" ]; then
    perms=$(stat -f "%OLp" "$save_path" 2>/dev/null || stat -c "%a" "$save_path" 2>/dev/null)
    assert_equals "600" "$perms" "File has 600 permissions"
else
    TESTS_RUN=$((TESTS_RUN + 1))
    echo "  ✗ File has 600 permissions"
    echo "    File was not created"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
echo

# Test 17: Custom interval is respected
echo "Test 17: Custom interval is respected"
tree=$(init_tree "Custom Interval Test" "llama2")
tree_ref_file="$TEST_DIR/tree_ref10.json"
save_path="$TEST_DIR/auto_save10.json"
echo "$tree" > "$tree_ref_file"

# Start with 3-second interval
pid=$(start_auto_save "$tree_ref_file" "$save_path" 3)
BACKGROUND_PIDS+=("$pid")

# Wait 1.5 seconds (should not save yet)
sleep 1.5
assert_file_not_exists "$save_path" "File not created before interval"

# Wait 2 more seconds (total 3.5, should have saved)
sleep 2
assert_file_exists "$save_path" "File created after custom interval"

# Clean up
stop_auto_save
echo

# Print summary
echo "========================================="
echo "Test Summary"
echo "========================================="
echo "Tests run: $TESTS_RUN"
echo "Tests passed: $TESTS_PASSED"
echo "Tests failed: $TESTS_FAILED"
echo

if [ $TESTS_FAILED -eq 0 ]; then
    echo "All tests passed! ✓"
    exit 0
else
    echo "Some tests failed! ✗"
    exit 1
fi
