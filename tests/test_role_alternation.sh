#!/usr/bin/env bash
# Unit tests for role alternation validation

set -e

# Source the required modules
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/../src/chat/chat_manager.sh"

# Test counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

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

assert_contains() {
    local haystack="$1"
    local needle="$2"
    local test_name="$3"
    
    TESTS_RUN=$((TESTS_RUN + 1))
    
    if echo "$haystack" | grep -q "$needle"; then
        echo "  ✓ $test_name"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo "  ✗ $test_name"
        echo "    '$needle' not found in '$haystack'"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
}

echo "========================================="
echo "Testing Role Alternation Validation"
echo "========================================="
echo

# Test 1: Root node with user role is valid
echo "Test 1: Root node with user role is valid"
tree=$(init_tree "Test" "llama2")
message=$(create_message "user" "Hello")
result=$(add_node "$tree" "$message" "")
tree=$(echo "$result" | jq -r '.tree')
node_id=$(echo "$result" | jq -r '.nodeId')

is_valid=$(validate_role_alternation "$tree" "$node_id")
assert_equals "true" "$is_valid" "Root node with user role is valid"
echo

# Test 2: User message followed by assistant message is valid
echo "Test 2: User message followed by assistant message is valid"
tree=$(init_tree "Test" "llama2")

# Add user message
user_msg=$(create_message "user" "Hello")
result=$(add_node "$tree" "$user_msg" "")
tree=$(echo "$result" | jq -r '.tree')
user_id=$(echo "$result" | jq -r '.nodeId')

# Add assistant message
assistant_msg=$(create_message "assistant" "Hi there")
result=$(add_node "$tree" "$assistant_msg" "$user_id")
tree=$(echo "$result" | jq -r '.tree')
assistant_id=$(echo "$result" | jq -r '.nodeId')

is_valid=$(validate_role_alternation "$tree" "$assistant_id")
assert_equals "true" "$is_valid" "Assistant message after user message is valid"
echo

# Test 3: Assistant message followed by user message is valid
echo "Test 3: Assistant message followed by user message is valid"
tree=$(init_tree "Test" "llama2")

# Add user message
user_msg=$(create_message "user" "Hello")
result=$(add_node "$tree" "$user_msg" "")
tree=$(echo "$result" | jq -r '.tree')
user_id=$(echo "$result" | jq -r '.nodeId')

# Add assistant message
assistant_msg=$(create_message "assistant" "Hi there")
result=$(add_node "$tree" "$assistant_msg" "$user_id")
tree=$(echo "$result" | jq -r '.tree')
assistant_id=$(echo "$result" | jq -r '.nodeId')

# Add another user message
user_msg2=$(create_message "user" "How are you?")
result=$(add_node "$tree" "$user_msg2" "$assistant_id")
tree=$(echo "$result" | jq -r '.tree')
user_id2=$(echo "$result" | jq -r '.nodeId')

is_valid=$(validate_role_alternation "$tree" "$user_id2")
assert_equals "true" "$is_valid" "User message after assistant message is valid"
echo

# Test 4: Validate entire tree with proper alternation
echo "Test 4: Validate entire tree with proper alternation"
tree=$(init_tree "Test" "llama2")

# Build a conversation with proper alternation
user_msg=$(create_message "user" "Hello")
result=$(add_node "$tree" "$user_msg" "")
tree=$(echo "$result" | jq -r '.tree')
user_id=$(echo "$result" | jq -r '.nodeId')

assistant_msg=$(create_message "assistant" "Hi")
result=$(add_node "$tree" "$assistant_msg" "$user_id")
tree=$(echo "$result" | jq -r '.tree')
assistant_id=$(echo "$result" | jq -r '.nodeId')

user_msg2=$(create_message "user" "Bye")
result=$(add_node "$tree" "$user_msg2" "$assistant_id")
tree=$(echo "$result" | jq -r '.tree')

is_valid=$(validate_tree_role_alternation "$tree")
assert_equals "true" "$is_valid" "Entire tree with proper alternation is valid"
echo

# Test 5: Root node with assistant role is invalid
echo "Test 5: Root node with assistant role is invalid"
tree=$(init_tree "Test" "llama2")
message=$(create_message "assistant" "Hello")
result=$(add_node "$tree" "$message" "")
tree=$(echo "$result" | jq -r '.tree')
node_id=$(echo "$result" | jq -r '.nodeId')

is_valid=$(validate_role_alternation "$tree" "$node_id")
assert_equals "false" "$is_valid" "Root node with assistant role is invalid"
echo

# Test 6: send_message validates role alternation
echo "Test 6: send_message validates role alternation"
tree=$(init_tree "Test" "llama2")

# Add a user message directly (bypassing send_message)
user_msg=$(create_message "user" "First")
result=$(add_node "$tree" "$user_msg" "")
tree=$(echo "$result" | jq -r '.tree')

# Try to send another user message (should fail)
set +e
result=$(send_message "$tree" "Second" "llama2" "" 2>&1)
exit_code=$?
set -e

TESTS_RUN=$((TESTS_RUN + 1))
if [ $exit_code -ne 0 ]; then
    echo "  ✓ send_message rejects consecutive user messages"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo "  ✗ send_message should reject consecutive user messages"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi

assert_contains "$result" "role alternation" "Error message mentions role alternation"
echo

# Test 7: create_branch validates role alternation
echo "Test 7: create_branch validates role alternation"
tree=$(init_tree "Test" "llama2")

# Add user message
user_msg=$(create_message "user" "Hello")
result=$(add_node "$tree" "$user_msg" "")
tree=$(echo "$result" | jq -r '.tree')
user_id=$(echo "$result" | jq -r '.nodeId')

# Add assistant message
assistant_msg=$(create_message "assistant" "Hi")
result=$(add_node "$tree" "$assistant_msg" "$user_id")
tree=$(echo "$result" | jq -r '.tree')
assistant_id=$(echo "$result" | jq -r '.nodeId')

# Try to create a branch from user message (should work since it creates user message from the edited node's parent)
# Note: This will fail if Ollama is not running, but we're testing role alternation validation, not Ollama
set +e
result=$(create_branch "$tree" "$user_id" "Edited hello" "llama2" "" 2>&1)
exit_code=$?
set -e

TESTS_RUN=$((TESTS_RUN + 1))
# Check if it's an Ollama connection error (which is acceptable for this test)
if echo "$result" | grep -q "Cannot connect to Ollama"; then
    # Ollama not available, but check if the tree structure was created correctly before the Ollama call
    # Extract the tree from the result if it's there
    if echo "$result" | jq -e '.nodes' >/dev/null 2>&1; then
        result_tree="$result"
        # Check role alternation in the created tree
        is_valid=$(validate_tree_role_alternation "$result_tree")
        if [ "$is_valid" = "true" ]; then
            echo "  ✓ create_branch creates valid role alternation (Ollama not available for response)"
            TESTS_PASSED=$((TESTS_PASSED + 1))
        else
            echo "  ✗ create_branch should create valid role alternation"
            TESTS_FAILED=$((TESTS_FAILED + 1))
        fi
    else
        echo "  ⊘ Skipping test - Ollama not available and tree not returned"
    fi
elif [ $exit_code -eq 0 ]; then
    echo "  ✓ create_branch succeeds with valid role alternation"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo "  ✗ create_branch should succeed with valid role alternation"
    echo "    Error: $result"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
echo

# Test 8: Validate alternation in branched conversation
echo "Test 8: Validate alternation in branched conversation"
tree=$(init_tree "Test" "llama2")

# Build main path
user_msg=$(create_message "user" "Hello")
result=$(add_node "$tree" "$user_msg" "")
tree=$(echo "$result" | jq -r '.tree')
user_id=$(echo "$result" | jq -r '.nodeId')

assistant_msg=$(create_message "assistant" "Hi")
result=$(add_node "$tree" "$assistant_msg" "$user_id")
tree=$(echo "$result" | jq -r '.tree')
assistant_id=$(echo "$result" | jq -r '.nodeId')

# Create a branch (adds sibling to user_id with same parent)
user_msg2=$(create_message "user" "Goodbye")
result=$(add_node "$tree" "$user_msg2" "")  # Same parent as user_id (which is root/empty)
tree=$(echo "$result" | jq -r '.tree')
branch_id=$(echo "$result" | jq -r '.nodeId')

# Validate the entire tree
is_valid=$(validate_tree_role_alternation "$tree")
assert_equals "true" "$is_valid" "Branched tree maintains role alternation"
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
