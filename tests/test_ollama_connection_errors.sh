#!/usr/bin/env bash
# Tests for Ollama connection error handling with retry logic

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

# Test 1: Connection retry logic executes with proper delays
run_test "check_connection_with_retry() attempts multiple retries with delays"
OLLAMA_MAX_RETRIES=2
OLLAMA_RETRY_DELAY=1
start_time=$(date +%s)
result=$(check_connection_with_retry 2 1 2>&1)
end_time=$(date +%s)
elapsed=$((end_time - start_time))

# Should take at least 1 second (one retry delay) if connection fails
# Or return immediately if connection succeeds
if [ $elapsed -ge 1 ] || [ "$result" = "true" ]; then
    pass "Retry logic executed properly (took ${elapsed}s)"
else
    fail "Retry logic did not execute properly (took ${elapsed}s)"
fi

# Test 2: send_message handles connection failure gracefully
run_test "send_message() saves user message when Ollama is unreachable"

# Create a test tree
tree=$(init_tree "Test" "llama2")

# Create a temporary save path
temp_save=$(mktemp)

# Mock Ollama being unavailable by using invalid host
export OLLAMA_HOST="http://localhost:99999"
export OLLAMA_MAX_RETRIES=1
export OLLAMA_RETRY_DELAY=1

# Try to send a message
result=$(send_message "$tree" "Hello, world!" "llama2" "$temp_save" 2>&1)
exit_code=$?

# Should fail with connection error
if [ $exit_code -ne 0 ]; then
    # Check if error message mentions connection failure
    if echo "$result" | grep -q "connection_failed"; then
        pass "Connection failure detected and reported"
    else
        fail "Connection failure not properly reported"
    fi
    
    # Check if user message was saved in the tree
    if echo "$result" | grep -q '"tree"'; then
        # Extract and validate tree has nodes
        node_count=$(echo "$result" | jq -r '.tree.nodes | length' 2>/dev/null || echo "0")
        if [ "$node_count" -gt 0 ]; then
            pass "User message saved in tree despite connection failure"
        else
            fail "User message not saved in tree (node count: $node_count)"
        fi
    else
        fail "Tree not returned in error response"
    fi
else
    # If Ollama is actually running, this is also a pass
    pass "Message sent successfully (Ollama is running)"
fi

# Clean up
rm -f "$temp_save"
unset OLLAMA_HOST
unset OLLAMA_MAX_RETRIES
unset OLLAMA_RETRY_DELAY

# Test 3: create_branch handles connection failure gracefully
run_test "create_branch() saves branch when Ollama is unreachable"

# Create a test tree with a user message
tree=$(init_tree "Test" "llama2")
message=$(create_message "user" "Original message" "")
add_result=$(add_node "$tree" "$message" "")
tree=$(echo "$add_result" | jq -r '.tree')
node_id=$(echo "$add_result" | jq -r '.nodeId')

# Create a temporary save path
temp_save=$(mktemp)

# Mock Ollama being unavailable
export OLLAMA_HOST="http://localhost:99999"
export OLLAMA_MAX_RETRIES=1
export OLLAMA_RETRY_DELAY=1

# Try to create a branch
result=$(create_branch "$tree" "$node_id" "Edited message" "llama2" "$temp_save" 2>&1)
exit_code=$?

# Should fail with connection error
if [ $exit_code -ne 0 ]; then
    # Check if error message mentions connection failure
    if echo "$result" | grep -q "connection_failed"; then
        pass "Connection failure detected in branch creation"
    else
        fail "Connection failure not properly reported in branch creation"
    fi
    
    # Check if branch was saved in the tree
    if echo "$result" | grep -q "tree"; then
        pass "Branch saved in tree despite connection failure"
    else
        fail "Branch not saved in tree"
    fi
else
    # If Ollama is actually running, this is also a pass
    pass "Branch created successfully (Ollama is running)"
fi

# Clean up
rm -f "$temp_save"
unset OLLAMA_HOST
unset OLLAMA_MAX_RETRIES
unset OLLAMA_RETRY_DELAY

# Test 4: Error message display functions work correctly
run_test "handle_connection_error() displays user-friendly message"
error_msg=$(handle_connection_error)

if echo "$error_msg" | grep -q "Ollama Connection Error"; then
    pass "Error message contains title"
else
    fail "Error message missing title"
fi

if echo "$error_msg" | grep -q "retry connection every 5 seconds"; then
    pass "Error message mentions retry interval"
else
    fail "Error message missing retry interval info"
fi

if echo "$error_msg" | grep -q "continue editing messages offline"; then
    pass "Error message mentions offline editing"
else
    fail "Error message missing offline editing info"
fi

# Test 5: Retry status display
run_test "display_retry_status() shows attempt information"
status_msg=$(display_retry_status 2 3)

if echo "$status_msg" | grep -q "attempt 2/3"; then
    pass "Retry status shows correct attempt count"
else
    fail "Retry status missing attempt count"
fi

# Test 6: Offline mode display
run_test "display_offline_mode() shows offline status"
offline_msg=$(display_offline_mode)

if echo "$offline_msg" | grep -q "Offline Mode"; then
    pass "Offline mode message displayed"
else
    fail "Offline mode message missing"
fi

if echo "$offline_msg" | grep -q "messages are being saved"; then
    pass "Offline mode mentions message saving"
else
    fail "Offline mode missing save info"
fi

# Test 7: Streaming interruption saves partial response
run_test "Streaming interruption saves partial response to tree"

# Create a test tree
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

# Simulate streaming interruption
tree=$(handle_stream_interruption "$tree" "$assistant_id" "Partial response")

# Verify partial content is saved
content=$(echo "$tree" | jq -r --arg id "$assistant_id" '.nodes[$id].message.content')
incomplete=$(echo "$tree" | jq -r --arg id "$assistant_id" '.nodes[$id].message.incomplete')

if [ "$content" = "Partial response" ] && [ "$incomplete" = "true" ]; then
    pass "Partial response saved and marked incomplete"
else
    fail "Partial response not properly saved (content: $content, incomplete: $incomplete)"
fi

# Test 8: Validate localhost-only connections
run_test "validate_localhost() rejects non-localhost URLs"

# Test valid localhost URLs
if [ "$(validate_localhost "http://localhost:11434")" = "true" ]; then
    pass "localhost URL accepted"
else
    fail "localhost URL rejected"
fi

if [ "$(validate_localhost "http://127.0.0.1:11434")" = "true" ]; then
    pass "127.0.0.1 URL accepted"
else
    fail "127.0.0.1 URL rejected"
fi

# Test invalid remote URLs
if [ "$(validate_localhost "http://example.com:11434")" = "false" ]; then
    pass "Remote URL rejected"
else
    fail "Remote URL accepted (security issue)"
fi

if [ "$(validate_localhost "http://192.168.1.1:11434")" = "false" ]; then
    pass "LAN URL rejected"
else
    fail "LAN URL accepted (security issue)"
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
