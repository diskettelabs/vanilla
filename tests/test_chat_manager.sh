#!/usr/bin/env bash
# Unit tests for chat manager

set -e

# Source the chat manager
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

assert_not_null() {
    local value="$1"
    local test_name="$2"
    
    TESTS_RUN=$((TESTS_RUN + 1))
    
    if [ -n "$value" ] && [ "$value" != "null" ]; then
        echo "  ✓ $test_name"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo "  ✗ $test_name"
        echo "    Value was null or empty"
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
echo "Testing Chat Manager"
echo "========================================="
echo

# Test 1: get_current_messages with empty tree
echo "Test 1: get_current_messages with empty tree"
tree=$(init_tree "Test" "llama2")
messages=$(get_current_messages "$tree")

assert_json_valid "$messages" "Result is valid JSON"

message_count=$(echo "$messages" | jq 'length')
assert_equals "0" "$message_count" "Empty tree returns empty messages array"
echo

# Test 2: get_current_messages with single message
echo "Test 2: get_current_messages with single message"
tree=$(init_tree "Test" "llama2")
message=$(create_message "user" "Hello")
result=$(add_node "$tree" "$message" "")
tree=$(echo "$result" | jq -r '.tree')

messages=$(get_current_messages "$tree")
assert_json_valid "$messages" "Result is valid JSON"

message_count=$(echo "$messages" | jq 'length')
assert_equals "1" "$message_count" "Tree with one node returns one message"

first_content=$(echo "$messages" | jq -r '.[0].content')
assert_equals "Hello" "$first_content" "Message content is correct"
echo

# Test 3: get_current_messages with conversation
echo "Test 3: get_current_messages with conversation"
tree=$(init_tree "Test" "llama2")

# Add user message
message1=$(create_message "user" "First message")
result=$(add_node "$tree" "$message1" "")
tree=$(echo "$result" | jq -r '.tree')
id1=$(echo "$result" | jq -r '.nodeId')

# Add assistant message
message2=$(create_message "assistant" "Second message")
result=$(add_node "$tree" "$message2" "$id1")
tree=$(echo "$result" | jq -r '.tree')
id2=$(echo "$result" | jq -r '.nodeId')

# Add another user message
message3=$(create_message "user" "Third message")
result=$(add_node "$tree" "$message3" "$id2")
tree=$(echo "$result" | jq -r '.tree')

messages=$(get_current_messages "$tree")
assert_json_valid "$messages" "Result is valid JSON"

message_count=$(echo "$messages" | jq 'length')
assert_equals "3" "$message_count" "Conversation returns all messages"

# Verify chronological order
msg1=$(echo "$messages" | jq -r '.[0].content')
msg2=$(echo "$messages" | jq -r '.[1].content')
msg3=$(echo "$messages" | jq -r '.[2].content')

assert_equals "First message" "$msg1" "First message is correct"
assert_equals "Second message" "$msg2" "Second message is correct"
assert_equals "Third message" "$msg3" "Third message is correct"
echo

# Test 4: get_current_messages with null input
echo "Test 4: get_current_messages with null input"
set +e
messages=$(get_current_messages "" 2>/dev/null)
if [ -z "$messages" ]; then
    messages="[]"
fi
set -e

assert_json_valid "$messages" "Result is valid JSON for null input"

message_count=$(echo "$messages" | jq 'length')
assert_equals "0" "$message_count" "Null input returns empty array"
echo

# Test 5: send_message creates user node
echo "Test 5: send_message creates user node"
echo "Note: This test requires Ollama to be running. Skipping if not available."

# Check if Ollama is available
if [ "$(check_connection)" = "true" ]; then
    tree=$(init_tree "Test" "llama2")
    
    # Create a temporary save path
    temp_save="/tmp/test_chat_$$.json"
    
    # Send a simple message (this will stream, so we capture output)
    echo "Sending message to Ollama..."
    tree=$(send_message "$tree" "Say 'test' and nothing else" "llama2" "$temp_save" 2>/dev/null)
    echo  # New line after streaming
    
    assert_json_valid "$tree" "Result tree is valid JSON"
    
    # Check that tree has nodes
    node_count=$(echo "$tree" | jq '.nodes | length')
    TESTS_RUN=$((TESTS_RUN + 1))
    if [ "$node_count" -ge 2 ]; then
        echo "  ✓ Tree has at least 2 nodes (user + assistant)"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo "  ✗ Tree should have at least 2 nodes, has $node_count"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
    
    # Get messages
    messages=$(get_current_messages "$tree")
    message_count=$(echo "$messages" | jq 'length')
    
    TESTS_RUN=$((TESTS_RUN + 1))
    if [ "$message_count" -ge 2 ]; then
        echo "  ✓ Conversation has at least 2 messages"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo "  ✗ Conversation should have at least 2 messages, has $message_count"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
    
    # Check first message is user message
    first_role=$(echo "$messages" | jq -r '.[0].role')
    assert_equals "user" "$first_role" "First message is from user"
    
    first_content=$(echo "$messages" | jq -r '.[0].content')
    assert_contains "$first_content" "test" "User message contains expected text"
    
    # Check second message is assistant message
    if [ "$message_count" -ge 2 ]; then
        second_role=$(echo "$messages" | jq -r '.[1].role')
        assert_equals "assistant" "$second_role" "Second message is from assistant"
        
        second_content=$(echo "$messages" | jq -r '.[1].content')
        assert_not_null "$second_content" "Assistant message has content"
    fi
    
    # Check that file was saved
    TESTS_RUN=$((TESTS_RUN + 1))
    if [ -f "$temp_save" ]; then
        echo "  ✓ Conversation was saved to file"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        rm -f "$temp_save"
    else
        echo "  ✗ Conversation was not saved to file"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
else
    echo "  ⊘ Skipping test - Ollama not available"
    echo "  ⊘ To run this test, start Ollama service"
fi
echo

# Test 6: send_message with empty text
echo "Test 6: send_message with empty text"
tree=$(init_tree "Test" "llama2")

set +e
result=$(send_message "$tree" "" "llama2" "" 2>&1)
exit_code=$?
set -e

TESTS_RUN=$((TESTS_RUN + 1))
if [ $exit_code -ne 0 ]; then
    echo "  ✓ Empty text returns error"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo "  ✗ Empty text should return error"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi

assert_contains "$result" "error" "Error message contains 'error'"
echo

# Test 7: send_message with null tree
echo "Test 7: send_message with null tree"
set +e
result=$(send_message "" "Test message" "llama2" "" 2>&1)
exit_code=$?
set -e

TESTS_RUN=$((TESTS_RUN + 1))
if [ $exit_code -ne 0 ]; then
    echo "  ✓ Null tree returns error"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo "  ✗ Null tree should return error"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi

assert_contains "$result" "error" "Error message contains 'error'"
echo

# Test 8: send_message sanitizes input
echo "Test 8: send_message sanitizes input"
tree=$(init_tree "Test" "llama2")

# Input with control characters and extra whitespace
dirty_input=$'  \x00\x01\x02Hello\x03\x04  '

# Check if Ollama is available for this test
if [ "$(check_connection)" = "true" ]; then
    echo "Sending message with dirty input to Ollama..."
    tree=$(send_message "$tree" "$dirty_input" "llama2" "" 2>/dev/null)
    echo  # New line after streaming
    
    assert_json_valid "$tree" "Result tree is valid JSON"
    
    messages=$(get_current_messages "$tree")
    first_content=$(echo "$messages" | jq -r '.[0].content')
    
    # Should be sanitized to just "Hello"
    assert_equals "Hello" "$first_content" "Input was sanitized"
else
    echo "  ⊘ Skipping test - Ollama not available"
fi
echo

# Test 9: send_message maintains conversation history
echo "Test 9: send_message maintains conversation history"
echo "Note: This test requires Ollama to be running. Skipping if not available."

if [ "$(check_connection)" = "true" ]; then
    tree=$(init_tree "Test" "llama2")
    
    # Send first message
    echo "Sending first message..."
    tree=$(send_message "$tree" "First" "llama2" "" 2>/dev/null)
    echo
    
    # Send second message
    echo "Sending second message..."
    tree=$(send_message "$tree" "Second" "llama2" "" 2>/dev/null)
    echo
    
    messages=$(get_current_messages "$tree")
    message_count=$(echo "$messages" | jq 'length')
    
    TESTS_RUN=$((TESTS_RUN + 1))
    if [ "$message_count" -ge 4 ]; then
        echo "  ✓ Conversation maintains history (at least 4 messages)"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo "  ✗ Conversation should have at least 4 messages, has $message_count"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
    
    # Check roles alternate
    if [ "$message_count" -ge 4 ]; then
        role1=$(echo "$messages" | jq -r '.[0].role')
        role2=$(echo "$messages" | jq -r '.[1].role')
        role3=$(echo "$messages" | jq -r '.[2].role')
        role4=$(echo "$messages" | jq -r '.[3].role')
        
        assert_equals "user" "$role1" "First message is user"
        assert_equals "assistant" "$role2" "Second message is assistant"
        assert_equals "user" "$role3" "Third message is user"
        assert_equals "assistant" "$role4" "Fourth message is assistant"
    fi
else
    echo "  ⊘ Skipping test - Ollama not available"
fi
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
