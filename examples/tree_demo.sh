#!/usr/bin/env bash
# Demo script showing conversation tree operations

set -e

# Source the tree operations
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/../src/tree/tree_ops.sh"

echo "========================================="
echo "Conversation Tree Demo"
echo "========================================="
echo

# Step 1: Initialize empty tree
echo "Step 1: Initialize empty tree"
tree=$(init_tree "My First Conversation" "llama2")
echo "Created tree with title: $(echo "$tree" | jq -r '.metadata.title')"
echo "Root ID: $(echo "$tree" | jq -r '.rootId')"
echo

# Step 2: Add root node (first user message)
echo "Step 2: Add root node (first user message)"
message1=$(create_message "user" "Hello! What is the capital of France?")
result=$(add_node "$tree" "$message1" "")
tree=$(echo "$result" | jq -r '.tree')
node1_id=$(echo "$result" | jq -r '.nodeId')
echo "Added user message with ID: $node1_id"
echo "Root ID is now: $(echo "$tree" | jq -r '.rootId')"
echo "Tree has $(echo "$tree" | jq '.nodes | length') node(s)"
echo

# Step 3: Add assistant response
echo "Step 3: Add assistant response"
message2=$(create_message "assistant" "The capital of France is Paris." "llama2")
result=$(add_node "$tree" "$message2" "$node1_id")
tree=$(echo "$result" | jq -r '.tree')
node2_id=$(echo "$result" | jq -r '.nodeId')
echo "Added assistant message with ID: $node2_id"
echo "Tree has $(echo "$tree" | jq '.nodes | length') node(s)"
echo

# Step 4: Add another user message
echo "Step 4: Add another user message"
message3=$(create_message "user" "What about Germany?")
result=$(add_node "$tree" "$message3" "$node2_id")
tree=$(echo "$result" | jq -r '.tree')
node3_id=$(echo "$result" | jq -r '.nodeId')
echo "Added user message with ID: $node3_id"
echo "Tree has $(echo "$tree" | jq '.nodes | length') node(s)"
echo

# Step 5: Get a specific node
echo "Step 5: Get a specific node"
node=$(get_node "$tree" "$node1_id")
echo "Retrieved node $node1_id:"
echo "  Role: $(echo "$node" | jq -r '.message.role')"
echo "  Content: $(echo "$node" | jq -r '.message.content')"
echo "  Parent ID: $(echo "$node" | jq -r '.parentId')"
echo "  Children: $(echo "$node" | jq -r '.children | length')"
echo

# Step 6: Get children of root node
echo "Step 6: Get children of root node"
children=$(get_children "$tree" "$node1_id")
echo "Root node has $(echo "$children" | jq 'length') child(ren)"
if [ "$(echo "$children" | jq 'length')" -gt 0 ]; then
    echo "First child:"
    echo "  Role: $(echo "$children" | jq -r '.[0].message.role')"
    echo "  Content: $(echo "$children" | jq -r '.[0].message.content')"
fi
echo

# Step 7: Create a branch (add alternate response to first user message)
echo "Step 7: Create a branch (add alternate response to first user message)"
message4=$(create_message "assistant" "Paris is the capital and largest city of France." "llama2")
result=$(add_node "$tree" "$message4" "$node1_id")
tree=$(echo "$result" | jq -r '.tree')
node4_id=$(echo "$result" | jq -r '.nodeId')
echo "Added alternate assistant message with ID: $node4_id"
echo "Tree has $(echo "$tree" | jq '.nodes | length') node(s)"
echo

# Step 8: Show that root now has two children (branching)
echo "Step 8: Show branching structure"
children=$(get_children "$tree" "$node1_id")
echo "Root node now has $(echo "$children" | jq 'length') child(ren) (branching!)"
echo "Branch 1: $(echo "$children" | jq -r '.[0].message.content')"
echo "Branch 2: $(echo "$children" | jq -r '.[1].message.content')"
echo

# Step 9: Display tree structure
echo "Step 9: Display tree structure"
echo "Tree metadata:"
echo "  Title: $(echo "$tree" | jq -r '.metadata.title')"
echo "  Model: $(echo "$tree" | jq -r '.metadata.model')"
echo "  Created: $(echo "$tree" | jq -r '.metadata.createdAt')"
echo "  Last Modified: $(echo "$tree" | jq -r '.metadata.lastModified')"
echo "  Root ID: $(echo "$tree" | jq -r '.rootId')"
echo "  Current Node ID: $(echo "$tree" | jq -r '.currentNodeId')"
echo "  Total Nodes: $(echo "$tree" | jq '.nodes | length')"
echo

echo "========================================="
echo "Demo Complete!"
echo "========================================="
echo
echo "The conversation tree now contains:"
echo "  - 1 user message (root)"
echo "  - 2 assistant responses (branches)"
echo "  - 1 follow-up user message"
echo
echo "This demonstrates the core tree operations:"
echo "  ✓ init_tree() - Create empty tree"
echo "  ✓ add_node() - Add nodes with unique IDs"
echo "  ✓ get_node() - Retrieve specific nodes"
echo "  ✓ get_children() - Get child nodes"
echo "  ✓ Branching support - Multiple children per node"
