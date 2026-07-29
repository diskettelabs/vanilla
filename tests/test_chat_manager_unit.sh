#!/usr/bin/env bash
# Unit tests for chat manager (no Ollama required)

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
echo "Testing Chat Manager (Unit Tests)"
echo "========================================="
echo

# Test 1: get_current_messages returns messages in chronological order
echo "Test 1: get_current_messages returns messages in chronological order"
tree=$(init_tree "Test" "llama2")

# Build a conversation manually
message1=$(create_message "user" "First")
result=$(add_node "$tree" "$message1" "")
tree=$(echo "$result" | jq -r '.tree')
id1=$(echo "$result" | jq -r '.nodeId')

message2=$(create_message "assistant" "Second")
result=$(add_node "$tree" "$message2" "$id1")
tree=$(echo "$result" | jq -r '.tree')
id2=$(echo "$result" | jq -r '.nodeId')

message3=$(create_message "user" "Third")
result=$(add_node "$tree" "$message3" "$id2")
tree=$(echo "$result" | jq -r '.tree')

messages=$(get_current_messages "$tree")
assert_json_valid "$messages" "Messages are valid JSON"

# Check order
msg1=$(echo "$messages" | jq -r '.[0].content')
msg2=$(echo "$messages" | jq -r '.[1].content')
msg3=$(echo "$messages" | jq -r '.[2].content')

assert_equals "First" "$msg1" "First message is in correct position"
assert_equals "Second" "$msg2" "Second message is in correct position"
assert_equals "Third" "$msg3" "Third message is in correct position"
echo

# Test 2: get_current_messages returns only active path
echo "Test 2: get_current_messages returns only active path"
tree=$(init_tree "Test" "llama2")

# Create root
message1=$(create_message "user" "Root")
result=$(add_node "$tree" "$message1" "")
tree=$(echo "$result" | jq -r '.tree')
root_id=$(echo "$result" | jq -r '.nodeId')

# Create branch A
message2=$(create_message "assistant" "Branch A")
result=$(add_node "$tree" "$message2" "$root_id")
tree=$(echo "$result" | jq -r '.tree')
branch_a_id=$(echo "$result" | jq -r '.nodeId')

# Create branch B (this becomes current)
message3=$(create_message "assistant" "Branch B")
result=$(add_node "$tree" "$message3" "$root_id")
tree=$(echo "$result" | jq -r '.tree')
branch_b_id=$(echo "$result" | jq -r '.nodeId')

# Current path should be Root -> Branch B
messages=$(get_current_messages "$tree")
message_count=$(echo "$messages" | jq 'length')

assert_equals "2" "$message_count" "Active path has 2 messages"

msg1=$(echo "$messages" | jq -r '.[0].content')
msg2=$(echo "$messages" | jq -r '.[1].content')

assert_equals "Root" "$msg1" "First message is root"
assert_equals "Branch B" "$msg2" "Second message is Branch B (current branch)"
echo

# Test 3: Conversation history includes all messages from root to current
echo "Test 3: Conversation history includes all messages from root to current"
tree=$(init_tree "Test" "llama2")

# Build a 5-message conversation
for i in 1 2 3 4 5; do
    role=$( [ $((i % 2)) -eq 1 ] && echo "user" || echo "assistant" )
    message=$(create_message "$role" "Message $i")
    
    current_id=$(echo "$tree" | jq -r '.currentNodeId')
    result=$(add_node "$tree" "$message" "$current_id")
    tree=$(echo "$result" | jq -r '.tree')
done

messages=$(get_current_messages "$tree")
message_count=$(echo "$messages" | jq 'length')

assert_equals "5" "$message_count" "All 5 messages are in history"

# Verify all messages are present
for i in 1 2 3 4 5; do
    content=$(echo "$messages" | jq -r ".[$((i-1))].content")
    assert_equals "Message $i" "$content" "Message $i is present"
done
echo

# Test 4: Role alternation in conversation
echo "Test 4: Role alternation in conversation"
tree=$(init_tree "Test" "llama2")

# Build conversation with alternating roles
message1=$(create_message "user" "User 1")
result=$(add_node "$tree" "$message1" "")
tree=$(echo "$result" | jq -r '.tree')
id1=$(echo "$result" | jq -r '.nodeId')

message2=$(create_message "assistant" "Assistant 1")
result=$(add_node "$tree" "$message2" "$id1")
tree=$(echo "$result" | jq -r '.tree')
id2=$(echo "$result" | jq -r '.nodeId')

message3=$(create_message "user" "User 2")
result=$(add_node "$tree" "$message3" "$id2")
tree=$(echo "$result" | jq -r '.tree')
id3=$(echo "$result" | jq -r '.nodeId')

message4=$(create_message "assistant" "Assistant 2")
result=$(add_node "$tree" "$message4" "$id3")
tree=$(echo "$result" | jq -r '.tree')

messages=$(get_current_messages "$tree")

# Check roles alternate
role1=$(echo "$messages" | jq -r '.[0].role')
role2=$(echo "$messages" | jq -r '.[1].role')
role3=$(echo "$messages" | jq -r '.[2].role')
role4=$(echo "$messages" | jq -r '.[3].role')

assert_equals "user" "$role1" "First role is user"
assert_equals "assistant" "$role2" "Second role is assistant"
assert_equals "user" "$role3" "Third role is user"
assert_equals "assistant" "$role4" "Fourth role is assistant"
echo

# Test 5: Messages have required properties
echo "Test 5: Messages have required properties"
tree=$(init_tree "Test" "llama2")
message=$(create_message "user" "Test message")
result=$(add_node "$tree" "$message" "")
tree=$(echo "$result" | jq -r '.tree')

messages=$(get_current_messages "$tree")
first_message=$(echo "$messages" | jq '.[0]')

# Check for required properties
TESTS_RUN=$((TESTS_RUN + 5))

if echo "$first_message" | jq -e '.id != null' > /dev/null 2>&1; then
    echo "  ✓ Message has id property"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo "  ✗ Message missing id property"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi

if echo "$first_message" | jq -e '.role != null' > /dev/null 2>&1; then
    echo "  ✓ Message has role property"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo "  ✗ Message missing role property"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi

if echo "$first_message" | jq -e '.content != null' > /dev/null 2>&1; then
    echo "  ✓ Message has content property"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo "  ✗ Message missing content property"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi

if echo "$first_message" | jq -e '.timestamp != null' > /dev/null 2>&1; then
    echo "  ✓ Message has timestamp property"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo "  ✗ Message missing timestamp property"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi

if echo "$first_message" | jq -e '.model != null' > /dev/null 2>&1; then
    echo "  ✓ Message has model property"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo "  ✗ Message missing model property"
    TESTS_FAILED=$((TESTS_FAILED + 1))
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
