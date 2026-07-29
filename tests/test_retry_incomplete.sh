#!/usr/bin/env bash
# Tests for retry incomplete message functionality

# Get absolute paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Source required modules in correct order
source "${PROJECT_ROOT}/src/lib/json_utils.sh"
source "${PROJECT_ROOT}/src/tree/tree_ops.sh"
source "${PROJECT_ROOT}/src/ollama/ollama_client.sh"
source "${PROJECT_ROOT}/src/lib/error_recovery.sh"
source "${PROJECT_ROOT}/src/chat/chat_manager.sh"

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

# Test 1: Verify incomplete message can be identified
run_test "Incomplete message is properly marked"
tree=$(init_tree "Test" "llama2")
message=$(create_message "user" "Hello" "")
add_result=$(add_node "$tree" "$message" "")
tree=$(echo "$add_result" | jq -r '.tree')
node_id=$(echo "$add_result" | jq -r '.nodeId')

# Add assistant message with partial content
assistant_msg=$(create_message "assistant" "Partial response" "llama2")
add_result=$(add_node "$tree" "$assistant_msg" "$node_id")
tree=$(echo "$add_result" | jq -r '.tree')
assistant_id=$(echo "$add_result" | jq -r '.nodeId')

# Mark as incomplete
tree=$(handle_stream_interruption "$tree" "$assistant_id" "Partial response")
incomplete=$(is_incomplete_message "$tree" "$assistant_id")

if [ "$incomplete" = "true" ]; then
    pass "Message marked as incomplete"
else
    fail "Message not marked as incomplete"
fi

# Test 2: Verify prepare_retry clears content and incomplete flag
run_test "prepare_retry() clears content and incomplete flag"
tree_before="$tree"
tree=$(prepare_retry "$tree" "$assistant_id")
exit_code=$?

content=$(echo "$tree" | jq -r --arg id "$assistant_id" '.nodes[$id].message.content')
incomplete=$(echo "$tree" | jq -r --arg id "$assistant_id" '.nodes[$id].message.incomplete')

if [ $exit_code -eq 0 ] && [ "$content" = "" ] && [ "$incomplete" = "false" ]; then
    pass "Content cleared and incomplete flag removed"
else
    fail "Failed to prepare retry (exit: $exit_code, content: '$content', incomplete: $incomplete)"
fi

# Test 3: Verify retry_incomplete_message validates node exists
run_test "retry_incomplete_message() validates node exists"
tree=$(init_tree "Test" "llama2")
result=$(retry_incomplete_message "$tree" "nonexistent_id" "llama2" "" 2>&1)

if echo "$result" | grep -q "node not found"; then
    pass "Correctly rejects nonexistent node"
else
    fail "Should reject nonexistent node"
fi

# Test 4: Verify retry_incomplete_message validates assistant role
run_test "retry_incomplete_message() validates assistant role"
tree=$(init_tree "Test" "llama2")
message=$(create_message "user" "Hello" "")
add_result=$(add_node "$tree" "$message" "")
tree=$(echo "$add_result" | jq -r '.tree')
user_id=$(echo "$add_result" | jq -r '.nodeId')

result=$(retry_incomplete_message "$tree" "$user_id" "llama2" "" 2>&1)

if echo "$result" | grep -q "can only retry assistant messages"; then
    pass "Correctly rejects user message"
else
    fail "Should reject user message"
fi

# Test 5: Verify retry_incomplete_message validates incomplete flag
run_test "retry_incomplete_message() validates incomplete flag"
tree=$(init_tree "Test" "llama2")
message=$(create_message "user" "Hello" "")
add_result=$(add_node "$tree" "$message" "")
tree=$(echo "$add_result" | jq -r '.tree')
node_id=$(echo "$add_result" | jq -r '.nodeId')

# Add complete assistant message (not incomplete)
assistant_msg=$(create_message "assistant" "Complete response" "llama2")
add_result=$(add_node "$tree" "$assistant_msg" "$node_id")
tree=$(echo "$add_result" | jq -r '.tree')
assistant_id=$(echo "$add_result" | jq -r '.nodeId')

result=$(retry_incomplete_message "$tree" "$assistant_id" "llama2" "" 2>&1)

if echo "$result" | grep -q "not marked as incomplete"; then
    pass "Correctly rejects complete message"
else
    fail "Should reject complete message"
fi

# Test 6: Verify retry_incomplete_message handles connection failure
run_test "retry_incomplete_message() handles connection failure gracefully"
tree=$(init_tree "Test" "llama2")
message=$(create_message "user" "Hello" "")
add_result=$(add_node "$tree" "$message" "")
tree=$(echo "$add_result" | jq -r '.tree')
node_id=$(echo "$add_result" | jq -r '.nodeId')

# Add incomplete assistant message
assistant_msg=$(create_message "assistant" "Partial" "llama2")
add_result=$(add_node "$tree" "$assistant_msg" "$node_id")
tree=$(echo "$add_result" | jq -r '.tree')
assistant_id=$(echo "$add_result" | jq -r '.nodeId')

# Mark as incomplete
tree=$(handle_stream_interruption "$tree" "$assistant_id" "Partial")

# Set retry parameters to fail quickly
OLLAMA_MAX_RETRIES=1
OLLAMA_RETRY_DELAY=1

# Try to retry (will fail if Ollama not running)
result=$(retry_incomplete_message "$tree" "$assistant_id" "llama2" "" 2>&1)
exit_code=$?

# Should either succeed (if Ollama running) or fail gracefully with connection error
if [ $exit_code -ne 0 ]; then
    if echo "$result" | grep -q "connection_failed"; then
        pass "Handled connection failure gracefully"
    else
        fail "Should handle connection failure gracefully"
    fi
else
    # If Ollama is running, the retry should succeed
    pass "Retry succeeded (Ollama is running)"
fi

# Test 7: Verify get_incomplete_messages returns all incomplete messages
run_test "get_incomplete_messages() returns all incomplete messages"
tree=$(init_tree "Test" "llama2")

# Add first user message
message1=$(create_message "user" "First" "")
add_result=$(add_node "$tree" "$message1" "")
tree=$(echo "$add_result" | jq -r '.tree')
node1=$(echo "$add_result" | jq -r '.nodeId')

# Add first incomplete assistant message
assistant1=$(create_message "assistant" "Partial 1" "llama2")
add_result=$(add_node "$tree" "$assistant1" "$node1")
tree=$(echo "$add_result" | jq -r '.tree')
assistant1_id=$(echo "$add_result" | jq -r '.nodeId')
tree=$(handle_stream_interruption "$tree" "$assistant1_id" "Partial 1")

# Add second user message
message2=$(create_message "user" "Second" "")
add_result=$(add_node "$tree" "$message2" "$assistant1_id")
tree=$(echo "$add_result" | jq -r '.tree')
node2=$(echo "$add_result" | jq -r '.nodeId')

# Add second incomplete assistant message
assistant2=$(create_message "assistant" "Partial 2" "llama2")
add_result=$(add_node "$tree" "$assistant2" "$node2")
tree=$(echo "$add_result" | jq -r '.tree')
assistant2_id=$(echo "$add_result" | jq -r '.nodeId')
tree=$(handle_stream_interruption "$tree" "$assistant2_id" "Partial 2")

# Get all incomplete messages
incomplete_ids=$(get_incomplete_messages "$tree")
count=$(echo "$incomplete_ids" | jq 'length')

if [ "$count" -eq 2 ]; then
    pass "Found 2 incomplete messages"
else
    fail "Expected 2 incomplete messages, found $count"
fi

# Test 8: Verify mark_message_complete removes incomplete flag
run_test "mark_message_complete() removes incomplete flag"
tree=$(mark_message_complete "$tree" "$assistant1_id")
incomplete=$(is_incomplete_message "$tree" "$assistant1_id")

if [ "$incomplete" = "false" ]; then
    pass "Incomplete flag removed"
else
    fail "Incomplete flag not removed"
fi

# Verify count decreased
incomplete_ids=$(get_incomplete_messages "$tree")
count=$(echo "$incomplete_ids" | jq 'length')

if [ "$count" -eq 1 ]; then
    pass "Incomplete message count decreased to 1"
else
    fail "Expected 1 incomplete message, found $count"
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
