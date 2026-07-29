#!/usr/bin/env bash
# Demonstration of getPath() function

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/../src/tree/tree_ops.sh"

echo "========================================="
echo "getPath() Function Demonstration"
echo "========================================="
echo

# Create a conversation tree
echo "Creating a conversation tree..."
tree=$(init_tree "Demo Conversation" "llama2")

# Add root message
echo "Adding root message: 'Hello, AI!'"
message1=$(create_message "user" "Hello, AI!")
result=$(add_node "$tree" "$message1" "")
tree=$(echo "$result" | jq -r '.tree')
id1=$(echo "$result" | jq -r '.nodeId')

# Add assistant response
echo "Adding assistant response: 'Hello! How can I help you?'"
message2=$(create_message "assistant" "Hello! How can I help you?")
result=$(add_node "$tree" "$message2" "$id1")
tree=$(echo "$result" | jq -r '.tree')
id2=$(echo "$result" | jq -r '.nodeId')

# Add user follow-up
echo "Adding user follow-up: 'Tell me about trees.'"
message3=$(create_message "user" "Tell me about trees.")
result=$(add_node "$tree" "$message3" "$id2")
tree=$(echo "$result" | jq -r '.tree')
id3=$(echo "$result" | jq -r '.nodeId')

# Add assistant response
echo "Adding assistant response: 'Trees are data structures...'"
message4=$(create_message "assistant" "Trees are data structures with nodes and edges.")
result=$(add_node "$tree" "$message4" "$id3")
tree=$(echo "$result" | jq -r '.tree')
id4=$(echo "$result" | jq -r '.nodeId')

echo
echo "========================================="
echo "Retrieving conversation history"
echo "========================================="
echo

# Get path to the last message
path=$(get_path "$tree" "$id4")

echo "Full conversation path (root to current):"
echo "$path" | jq -r '.[] | "\(.role): \(.content)"'

echo
echo "========================================="
echo "Retrieving partial conversation"
echo "========================================="
echo

# Get path to middle of conversation
path_partial=$(get_path "$tree" "$id2")

echo "Conversation up to second message:"
echo "$path_partial" | jq -r '.[] | "\(.role): \(.content)"'

echo
echo "========================================="
echo "Edge case: Invalid node ID"
echo "========================================="
echo

# Test with invalid node ID
path_invalid=$(get_path "$tree" "invalid-id-12345")
count=$(echo "$path_invalid" | jq 'length')

echo "Path for invalid node ID: $count messages (should be 0)"

echo
echo "========================================="
echo "Edge case: Root node only"
echo "========================================="
echo

# Get path for just the root
path_root=$(get_path "$tree" "$id1")
count_root=$(echo "$path_root" | jq 'length')

echo "Path for root node: $count_root message(s)"
echo "$path_root" | jq -r '.[] | "\(.role): \(.content)"'

echo
echo "Demo complete!"
