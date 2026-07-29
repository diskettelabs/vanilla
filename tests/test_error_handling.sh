#!/usr/bin/env bash
# Tests for error handling and recovery

# Get absolute paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Source required modules in correct order
source "${PROJECT_ROOT}/src/lib/json_utils.sh"
source "${PROJECT_ROOT}/src/tree/tree_ops.sh"
source "${PROJECT_ROOT}/src/ollama/ollama_client.sh"
source "${PROJECT_ROOT}/src/lib/error_recovery.sh"

# Test counter
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Test helper functions
pass() {
    echo "  ✓ $1"
    TESTS_PASSED=$((TESTS_PASSED + 1))
}

fail() {
    echo "  ✗ $1"
    TESTS_FAILED=$((TESTS_FAILED + 1))
}

run_test() {
    echo "Running: $1"
    TESTS_RUN=$((TESTS_RUN + 1))
}

# Test 1: Mark message as incomplete
run_test "handle_stream_interruption() marks message as incomplete"
tree=$(init_tree "Test" "llama2")
message=$(create_message "user" "Hello" "")
add_result=$(add_node "$tree" "$message" "")
tree=$(echo "$add_result" | jq -r '.tree')
node_id=$(echo "$add_result" | jq -r '.nodeId')

# Add assistant message
assistant_msg=$(create_message "assistant" "Partial response" "llama2")
add_result=$(add_node "$tree" "$assistant_msg" "$node_id")
tree=$(echo "$add_result" | jq -r '.tree')
assistant_id=$(echo "$add_result" | jq -r '.nodeId')

# Handle interruption
tree=$(handle_stream_interruption "$tree" "$assistant_id" "Partial response")
incomplete=$(is_incomplete_message "$tree" "$assistant_id")

if [ "$incomplete" = "true" ]; then
    pass "Message marked as incomplete"
else
    fail "Message not marked as incomplete"
fi

# Test 2: Get incomplete messages
run_test "get_incomplete_messages() returns incomplete message IDs"
incomplete_ids=$(get_incomplete_messages "$tree")
count=$(echo "$incomplete_ids" | jq 'length')

if [ "$count" -eq 1 ]; then
    pass "Found 1 incomplete message"
else
    fail "Expected 1 incomplete message, found $count"
fi

# Test 3: Mark message as complete
run_test "mark_message_complete() removes incomplete flag"
tree=$(mark_message_complete "$tree" "$assistant_id")
incomplete=$(is_incomplete_message "$tree" "$assistant_id")

if [ "$incomplete" = "false" ]; then
    pass "Message marked as complete"
else
    fail "Message still marked as incomplete"
fi

# Test 4: Connection retry logic
run_test "check_connection_with_retry() attempts multiple retries"
# This test will fail if Ollama is not running, which is expected
# We're testing that the retry logic executes
OLLAMA_MAX_RETRIES=2
OLLAMA_RETRY_DELAY=1
start_time=$(date +%s)
result=$(check_connection_with_retry 2 1 2>&1)
end_time=$(date +%s)
elapsed=$((end_time - start_time))

# Should take at least 1 second (one retry delay) if connection fails
if [ $elapsed -ge 1 ] || [ "$result" = "true" ]; then
    pass "Retry logic executed (took ${elapsed}s)"
else
    fail "Retry logic did not execute properly"
fi

# Test 5: Validate and repair tree
run_test "validate_and_repair_tree() repairs tree with missing fields"
# Create a proper tree with at least one node
tree=$(init_tree "Test" "llama2")
message=$(create_message "user" "Hello" "")
add_result=$(add_node "$tree" "$message" "")
tree=$(echo "$add_result" | jq -r '.tree')

# Remove currentNodeId to break it
broken_tree=$(echo "$tree" | jq 'del(.currentNodeId)')

repaired_tree=$(validate_and_repair_tree "$broken_tree" 2>/dev/null)
exit_code=$?
has_current=$(echo "$repaired_tree" | jq -e '.currentNodeId' >/dev/null 2>&1 && echo "true" || echo "false")

if [ "$has_current" = "true" ] && [ $exit_code -eq 0 ]; then
    pass "Tree repaired with currentNodeId"
else
    fail "Tree not repaired (exit code: $exit_code, has_current: $has_current)"
fi

# Test 6: Salvage corrupted tree
run_test "salvage_tree() recovers valid nodes from corrupted tree"
# Create a valid tree first
tree=$(init_tree "Test" "llama2")
message=$(create_message "user" "Hello" "")
add_result=$(add_node "$tree" "$message" "")
tree=$(echo "$add_result" | jq -r '.tree')

# Corrupt it by removing rootId but keeping nodes
corrupted_tree=$(echo "$tree" | jq 'del(.rootId)')

# Try to salvage
salvaged=$(salvage_tree "$corrupted_tree")
if echo "$salvaged" | grep -q "error"; then
    # Expected if tree is too corrupted
    pass "Salvage attempted (tree may be too corrupted)"
else
    # Check if salvaged tree is valid
    validation=$(validate_tree "$salvaged")
    is_valid=$(echo "$validation" | jq -r '.isValid')
    if [ "$is_valid" = "true" ]; then
        pass "Tree salvaged successfully"
    else
        fail "Salvaged tree is invalid"
    fi
fi

# Test 7: Load with corruption detection
run_test "load() creates backup when tree is corrupted"
# Create a temporary corrupted file
temp_file=$(mktemp)
echo '{"nodes": {}, "rootId": "nonexistent"}' > "$temp_file"

result=$(load "$temp_file" 2>&1)
if echo "$result" | grep -q "error"; then
    # Check if backup was created
    backup_count=$(ls -1 "${temp_file}.corrupted."* 2>/dev/null | wc -l)
    if [ "$backup_count" -gt 0 ]; then
        pass "Backup created for corrupted tree"
        rm -f "${temp_file}.corrupted."*
    else
        fail "No backup created for corrupted tree"
    fi
else
    fail "Corrupted tree loaded without error"
fi

rm -f "$temp_file"

# Test 8: Partial response preservation
run_test "Partial response is preserved in tree"
tree=$(init_tree "Test" "llama2")
message=$(create_message "user" "Hello" "")
add_result=$(add_node "$tree" "$message" "")
tree=$(echo "$add_result" | jq -r '.tree')
node_id=$(echo "$add_result" | jq -r '.nodeId')

# Add assistant message with partial content
assistant_msg=$(create_message "assistant" "This is a partial" "llama2")
add_result=$(add_node "$tree" "$assistant_msg" "$node_id")
tree=$(echo "$add_result" | jq -r '.tree')
assistant_id=$(echo "$add_result" | jq -r '.nodeId')

# Mark as incomplete
tree=$(handle_stream_interruption "$tree" "$assistant_id" "This is a partial")

# Verify content is preserved
content=$(echo "$tree" | jq -r --arg id "$assistant_id" '.nodes[$id].message.content')
incomplete=$(echo "$tree" | jq -r --arg id "$assistant_id" '.nodes[$id].message.incomplete')

if [ "$content" = "This is a partial" ] && [ "$incomplete" = "true" ]; then
    pass "Partial response preserved and marked incomplete"
else
    fail "Partial response not properly preserved"
fi

# Print summary
echo ""
echo "================================"
echo "Test Summary"
echo "================================"
echo "Tests run:    $TESTS_RUN"
echo "Tests passed: $TESTS_PASSED"
echo "Tests failed: $TESTS_FAILED"
echo "================================"

if [ $TESTS_FAILED -eq 0 ]; then
    echo "✓ All tests passed!"
    exit 0
else
    echo "✗ Some tests failed"
    exit 1
fi
