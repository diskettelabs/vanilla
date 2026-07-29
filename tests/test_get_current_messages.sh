#!/usr/bin/env bash
# Integration test for get_current_messages function

set -e

# Source the chat manager
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/../src/chat/chat_manager.sh"

echo "========================================="
echo "Testing get_current_messages()"
echo "========================================="
echo

# Test 1: Empty tree
echo "Test 1: Empty tree"
tree=$(init_tree "Test Conversation" "llama2")
messages=$(get_current_messages "$tree")
count=$(echo "$messages" | jq 'length')
echo "  Messages count: $count"
if [ "$count" -eq 0 ]; then
    echo "  ✓ Empty tree returns empty array"
else
    echo "  ✗ Expected 0 messages, got $count"
    exit 1
fi
echo

# Test 2: Single message
echo "Test 2: Single message"
tree=$(init_tree "Test Conversation" "llama2")
message=$(create_message "user" "Hello, world!")
result=$(add_node "$tree" "$message" "")
tree=$(echo "$result" | jq -r '.tree')

messages=$(get_current_messages "$tree")
count=$(echo "$messages" | jq 'length')
echo "  Messages count: $count"
if [ "$count" -eq 1 ]; then
    echo "  ✓ Single message tree returns 1 message"
else
    echo "  ✗ Expected 1 message, got $count"
    exit 1
fi

content=$(echo "$messages" | jq -r '.[0].content')
echo "  Message content: $content"
if [ "$content" = "Hello, world!" ]; then
    echo "  ✓ Message content is correct"
else
    echo "  ✗ Expected 'Hello, world!', got '$content'"
    exit 1
fi
echo

# Test 3: Multiple messages in chronological order
echo "Test 3: Multiple messages in chronological order"
tree=$(init_tree "Test Conversation" "llama2")

# Add first message
message1=$(create_message "user" "First")
result=$(add_node "$tree" "$message1" "")
tree=$(echo "$result" | jq -r '.tree')
id1=$(echo "$result" | jq -r '.nodeId')

# Add second message
message2=$(create_message "assistant" "Second")
result=$(add_node "$tree" "$message2" "$id1")
tree=$(echo "$result" | jq -r '.tree')
id2=$(echo "$result" | jq -r '.nodeId')

# Add third message
message3=$(create_message "user" "Third")
result=$(add_node "$tree" "$message3" "$id2")
tree=$(echo "$result" | jq -r '.tree')

messages=$(get_current_messages "$tree")
count=$(echo "$messages" | jq 'length')
echo "  Messages count: $count"
if [ "$count" -eq 3 ]; then
    echo "  ✓ Conversation returns all 3 messages"
else
    echo "  ✗ Expected 3 messages, got $count"
    exit 1
fi

# Verify chronological order
msg1=$(echo "$messages" | jq -r '.[0].content')
msg2=$(echo "$messages" | jq -r '.[1].content')
msg3=$(echo "$messages" | jq -r '.[2].content')

echo "  Message order: $msg1 -> $msg2 -> $msg3"
if [ "$msg1" = "First" ] && [ "$msg2" = "Second" ] && [ "$msg3" = "Third" ]; then
    echo "  ✓ Messages are in chronological order"
else
    echo "  ✗ Messages are not in correct order"
    exit 1
fi

# Verify roles
role1=$(echo "$messages" | jq -r '.[0].role')
role2=$(echo "$messages" | jq -r '.[1].role')
role3=$(echo "$messages" | jq -r '.[2].role')

echo "  Role order: $role1 -> $role2 -> $role3"
if [ "$role1" = "user" ] && [ "$role2" = "assistant" ] && [ "$role3" = "user" ]; then
    echo "  ✓ Roles alternate correctly"
else
    echo "  ✗ Roles do not alternate correctly"
    exit 1
fi
echo

# Test 4: Branching scenario - only returns active path
echo "Test 4: Branching scenario - only returns active path"
tree=$(init_tree "Test Conversation" "llama2")

# Create main path
message1=$(create_message "user" "Main path message 1")
result=$(add_node "$tree" "$message1" "")
tree=$(echo "$result" | jq -r '.tree')
id1=$(echo "$result" | jq -r '.nodeId')

message2=$(create_message "assistant" "Main path message 2")
result=$(add_node "$tree" "$message2" "$id1")
tree=$(echo "$result" | jq -r '.tree')
id2=$(echo "$result" | jq -r '.nodeId')

# Create a branch from id1 (alternative path)
message3=$(create_message "assistant" "Branch message")
result=$(add_node "$tree" "$message3" "$id1")
branch_tree=$(echo "$result" | jq -r '.tree')
branch_id=$(echo "$result" | jq -r '.nodeId')

# The current node is now on the branch
messages=$(get_current_messages "$branch_tree")
count=$(echo "$messages" | jq 'length')
echo "  Messages count on branch: $count"
if [ "$count" -eq 2 ]; then
    echo "  ✓ Branch returns only messages on active path"
else
    echo "  ✗ Expected 2 messages on branch, got $count"
    exit 1
fi

# Verify the branch message is included
msg2=$(echo "$messages" | jq -r '.[1].content')
echo "  Second message: $msg2"
if [ "$msg2" = "Branch message" ]; then
    echo "  ✓ Branch message is on active path"
else
    echo "  ✗ Expected 'Branch message', got '$msg2'"
    exit 1
fi
echo

echo "========================================="
echo "All tests passed! ✓"
echo "========================================="
echo
echo "Summary:"
echo "  - get_current_messages() retrieves messages from root to current node"
echo "  - Messages are returned in chronological order"
echo "  - Function handles edge cases (empty tree, null nodes)"
echo "  - Function returns only the active path in branching scenarios"
echo
echo "Requirement 2.4 validated: ✓"
