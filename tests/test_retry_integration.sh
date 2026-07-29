#!/usr/bin/env bash
# Integration test for retry incomplete message with actual streaming

# Get absolute paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Source required modules
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

# Check if Ollama is running
echo "Checking Ollama connection..."
if [ "$(check_connection)" != "true" ]; then
    echo "⚠ Ollama is not running. Skipping integration tests."
    echo "To run these tests, start Ollama with: ollama serve"
    exit 0
fi
echo "✓ Ollama is running"
echo ""

# Test 1: Simulate interrupted stream and retry
run_test "Simulate interrupted stream and retry with actual Ollama"

# Create conversation
tree=$(init_tree "Integration Test" "llama2")
user_msg=$(create_message "user" "Say 'Hello World' and nothing else" "")
add_result=$(add_node "$tree" "$user_msg" "")
tree=$(echo "$add_result" | jq -r '.tree')
user_id=$(echo "$add_result" | jq -r '.nodeId')

# Add incomplete assistant message
assistant_msg=$(create_message "assistant" "Hel" "llama2")
add_result=$(add_node "$tree" "$assistant_msg" "$user_id")
tree=$(echo "$add_result" | jq -r '.tree')
assistant_id=$(echo "$add_result" | jq -r '.nodeId')

# Mark as incomplete
tree=$(handle_stream_interruption "$tree" "$assistant_id" "Hel")

# Verify it's incomplete
incomplete=$(is_incomplete_message "$tree" "$assistant_id")
if [ "$incomplete" = "true" ]; then
    pass "Message marked as incomplete"
else
    fail "Message not marked as incomplete"
fi

# Create temp file for saving
temp_file=$(mktemp)

# Retry the message
echo "  Retrying generation with Ollama..."
tree=$(retry_incomplete_message "$tree" "$assistant_id" "llama2" "$temp_file" 2>/dev/null)
retry_exit=$?

if [ $retry_exit -eq 0 ]; then
    # Check if message is now complete
    incomplete=$(is_incomplete_message "$tree" "$assistant_id")
    content=$(echo "$tree" | jq -r --arg id "$assistant_id" '.nodes[$id].message.content')
    
    if [ "$incomplete" = "false" ] && [ -n "$content" ]; then
        pass "Message successfully regenerated (content: '${content:0:50}...')"
    else
        fail "Message not properly regenerated (incomplete: $incomplete, content length: ${#content})"
    fi
else
    fail "Retry failed with exit code $retry_exit"
fi

# Clean up
rm -f "$temp_file"

# Test 2: Verify retry validates incomplete flag
run_test "Retry validates incomplete flag on complete messages"

# Create a complete message
tree=$(init_tree "Test" "llama2")
user_msg=$(create_message "user" "Test" "")
add_result=$(add_node "$tree" "$user_msg" "")
tree=$(echo "$add_result" | jq -r '.tree')
user_id=$(echo "$add_result" | jq -r '.nodeId')

assistant_msg=$(create_message "assistant" "Complete response" "llama2")
add_result=$(add_node "$tree" "$assistant_msg" "$user_id")
tree=$(echo "$add_result" | jq -r '.tree')
assistant_id=$(echo "$add_result" | jq -r '.nodeId')

# Try to retry (should fail)
result=$(retry_incomplete_message "$tree" "$assistant_id" "llama2" "" 2>&1)

if echo "$result" | grep -q "not marked as incomplete"; then
    pass "Correctly rejects complete message"
else
    fail "Should reject complete message"
fi

# Test 3: Verify multiple incomplete messages can be tracked
run_test "Track multiple incomplete messages"

tree=$(init_tree "Test" "llama2")

# First conversation branch
msg1=$(create_message "user" "First" "")
add_result=$(add_node "$tree" "$msg1" "")
tree=$(echo "$add_result" | jq -r '.tree')
node1=$(echo "$add_result" | jq -r '.nodeId')

assistant1=$(create_message "assistant" "Partial 1" "llama2")
add_result=$(add_node "$tree" "$assistant1" "$node1")
tree=$(echo "$add_result" | jq -r '.tree')
assistant1_id=$(echo "$add_result" | jq -r '.nodeId')
tree=$(handle_stream_interruption "$tree" "$assistant1_id" "Partial 1")

# Second conversation branch
msg2=$(create_message "user" "Second" "")
add_result=$(add_node "$tree" "$msg2" "$assistant1_id")
tree=$(echo "$add_result" | jq -r '.tree')
node2=$(echo "$add_result" | jq -r '.nodeId')

assistant2=$(create_message "assistant" "Partial 2" "llama2")
add_result=$(add_node "$tree" "$assistant2" "$node2")
tree=$(echo "$add_result" | jq -r '.tree')
assistant2_id=$(echo "$add_result" | jq -r '.nodeId')
tree=$(handle_stream_interruption "$tree" "$assistant2_id" "Partial 2")

# Get incomplete messages
incomplete_ids=$(get_incomplete_messages "$tree")
count=$(echo "$incomplete_ids" | jq 'length')

if [ "$count" -eq 2 ]; then
    pass "Tracked 2 incomplete messages"
else
    fail "Expected 2 incomplete messages, found $count"
fi

# Retry first incomplete message
echo "  Retrying first incomplete message..."
tree=$(retry_incomplete_message "$tree" "$assistant1_id" "llama2" "" 2>/dev/null)
retry_exit=$?

if [ $retry_exit -eq 0 ]; then
    # Check count decreased
    incomplete_ids=$(get_incomplete_messages "$tree")
    count=$(echo "$incomplete_ids" | jq 'length')
    
    if [ "$count" -eq 1 ]; then
        pass "Incomplete count decreased to 1 after retry"
    else
        fail "Expected 1 incomplete message after retry, found $count"
    fi
else
    fail "First retry failed"
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
    echo "✓ All integration tests passed!"
    exit 0
else
    echo "✗ Some integration tests failed"
    exit 1
fi
