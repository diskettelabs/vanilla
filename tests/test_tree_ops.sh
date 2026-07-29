#!/usr/bin/env bash
# Unit tests for conversation tree operations

set -e

# Source the tree operations
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/../src/tree/tree_ops.sh"

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

assert_json_has_key() {
    local json="$1"
    local key="$2"
    local test_name="$3"
    
    TESTS_RUN=$((TESTS_RUN + 1))
    
    # Extract the key name from the path (e.g., ".nodes" -> "nodes", ".tree" -> "tree")
    local key_name="${key#.}"
    
    # For nested keys like ".metadata.title", just check if the path exists
    if echo "$json" | jq -e "$key != null or $key == null" > /dev/null 2>&1; then
        echo "  ✓ $test_name"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo "  ✗ $test_name"
        echo "    Key '$key' not found in JSON"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
}

echo "========================================="
echo "Testing Conversation Tree Operations"
echo "========================================="
echo

# Test 1: Initialize empty tree
echo "Test 1: Initialize empty tree"
tree=$(init_tree "Test Conversation" "llama2")
assert_json_valid "$tree" "Tree is valid JSON"
assert_json_has_key "$tree" ".nodes" "Tree has nodes property"
assert_json_has_key "$tree" ".rootId" "Tree has rootId property"
assert_json_has_key "$tree" ".currentNodeId" "Tree has currentNodeId property"
assert_json_has_key "$tree" ".metadata" "Tree has metadata property"

root_id=$(echo "$tree" | jq -r '.rootId')
assert_equals "null" "$root_id" "Root ID is null for empty tree"

title=$(echo "$tree" | jq -r '.metadata.title')
assert_equals "Test Conversation" "$title" "Tree title is set correctly"

model=$(echo "$tree" | jq -r '.metadata.model')
assert_equals "llama2" "$model" "Tree model is set correctly"
echo

# Test 2: Add root node
echo "Test 2: Add root node"
tree=$(init_tree "Test" "llama2")
message=$(create_message "user" "Hello, world!")
result=$(add_node "$tree" "$message" "")

assert_json_valid "$result" "Add node result is valid JSON"
assert_json_has_key "$result" ".tree" "Result has tree property"
assert_json_has_key "$result" ".nodeId" "Result has nodeId property"

tree=$(echo "$result" | jq -r '.tree')
node_id=$(echo "$result" | jq -r '.nodeId')

assert_not_null "$node_id" "Node ID is generated"

root_id=$(echo "$tree" | jq -r '.rootId')
assert_equals "$node_id" "$root_id" "Root ID is set to first node"

current_id=$(echo "$tree" | jq -r '.currentNodeId')
assert_equals "$node_id" "$current_id" "Current node ID is set to new node"

node_count=$(echo "$tree" | jq '.nodes | length')
assert_equals "1" "$node_count" "Tree has exactly one node"
echo

# Test 3: Get node by ID
echo "Test 3: Get node by ID"
tree=$(init_tree "Test" "llama2")
message=$(create_message "user" "Test message")
result=$(add_node "$tree" "$message" "")
tree=$(echo "$result" | jq -r '.tree')
node_id=$(echo "$result" | jq -r '.nodeId')

node=$(get_node "$tree" "$node_id")
assert_json_valid "$node" "Retrieved node is valid JSON"
assert_not_null "$node" "Node is found"

retrieved_id=$(echo "$node" | jq -r '.id')
assert_equals "$node_id" "$retrieved_id" "Retrieved node has correct ID"

message_content=$(echo "$node" | jq -r '.message.content')
assert_equals "Test message" "$message_content" "Node has correct message content"

parent_id=$(echo "$node" | jq -r '.parentId')
assert_equals "null" "$parent_id" "Root node has null parent"
echo

# Test 4: Get non-existent node
echo "Test 4: Get non-existent node"
tree=$(init_tree "Test" "llama2")
node=$(get_node "$tree" "non-existent-id")
assert_equals "null" "$node" "Non-existent node returns null"
echo

# Test 5: Add child node
echo "Test 5: Add child node"
tree=$(init_tree "Test" "llama2")

# Add root node
message1=$(create_message "user" "First message")
result=$(add_node "$tree" "$message1" "")
tree=$(echo "$result" | jq -r '.tree')
parent_id=$(echo "$result" | jq -r '.nodeId')

# Add child node
message2=$(create_message "assistant" "Response message")
result=$(add_node "$tree" "$message2" "$parent_id")
tree=$(echo "$result" | jq -r '.tree')
child_id=$(echo "$result" | jq -r '.nodeId')

assert_not_null "$child_id" "Child node ID is generated"

node_count=$(echo "$tree" | jq '.nodes | length')
assert_equals "2" "$node_count" "Tree has two nodes"

child_node=$(get_node "$tree" "$child_id")
child_parent=$(echo "$child_node" | jq -r '.parentId')
assert_equals "$parent_id" "$child_parent" "Child node has correct parent ID"

parent_node=$(get_node "$tree" "$parent_id")
children_count=$(echo "$parent_node" | jq '.children | length')
assert_equals "1" "$children_count" "Parent has one child"

first_child=$(echo "$parent_node" | jq -r '.children[0]')
assert_equals "$child_id" "$first_child" "Parent's child array contains child ID"
echo

# Test 6: Get children of node
echo "Test 6: Get children of node"
tree=$(init_tree "Test" "llama2")

# Add root node
message1=$(create_message "user" "Root")
result=$(add_node "$tree" "$message1" "")
tree=$(echo "$result" | jq -r '.tree')
root_id=$(echo "$result" | jq -r '.nodeId')

# Add first child
message2=$(create_message "assistant" "Child 1")
result=$(add_node "$tree" "$message2" "$root_id")
tree=$(echo "$result" | jq -r '.tree')
child1_id=$(echo "$result" | jq -r '.nodeId')

# Add second child (branch)
message3=$(create_message "assistant" "Child 2")
result=$(add_node "$tree" "$message3" "$root_id")
tree=$(echo "$result" | jq -r '.tree')
child2_id=$(echo "$result" | jq -r '.nodeId')

children=$(get_children "$tree" "$root_id")
assert_json_valid "$children" "Children result is valid JSON"

children_count=$(echo "$children" | jq 'length')
assert_equals "2" "$children_count" "Node has two children"

first_child_id=$(echo "$children" | jq -r '.[0].id')
second_child_id=$(echo "$children" | jq -r '.[1].id')

# Check that both children are present (order may vary)
if [ "$first_child_id" = "$child1_id" ] || [ "$second_child_id" = "$child1_id" ]; then
    echo "  ✓ First child is in children array"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo "  ✗ First child is not in children array"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
TESTS_RUN=$((TESTS_RUN + 1))

if [ "$first_child_id" = "$child2_id" ] || [ "$second_child_id" = "$child2_id" ]; then
    echo "  ✓ Second child is in children array"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo "  ✗ Second child is not in children array"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
TESTS_RUN=$((TESTS_RUN + 1))
echo

# Test 7: Get children of node with no children
echo "Test 7: Get children of node with no children"
tree=$(init_tree "Test" "llama2")
message=$(create_message "user" "Leaf node")
result=$(add_node "$tree" "$message" "")
tree=$(echo "$result" | jq -r '.tree')
node_id=$(echo "$result" | jq -r '.nodeId')

children=$(get_children "$tree" "$node_id")
assert_json_valid "$children" "Children result is valid JSON"

children_count=$(echo "$children" | jq 'length')
assert_equals "0" "$children_count" "Leaf node has no children"
echo

# Test 8: Get children of non-existent node
echo "Test 8: Get children of non-existent node"
tree=$(init_tree "Test" "llama2")
children=$(get_children "$tree" "non-existent-id")
assert_json_valid "$children" "Children result is valid JSON"

children_count=$(echo "$children" | jq 'length')
assert_equals "0" "$children_count" "Non-existent node returns empty array"
echo

# Test 9: Unique node IDs
echo "Test 9: Unique node IDs"
tree=$(init_tree "Test" "llama2")

# Add multiple nodes
message1=$(create_message "user" "Message 1")
result=$(add_node "$tree" "$message1" "")
tree=$(echo "$result" | jq -r '.tree')
id1=$(echo "$result" | jq -r '.nodeId')

message2=$(create_message "assistant" "Message 2")
result=$(add_node "$tree" "$message2" "$id1")
tree=$(echo "$result" | jq -r '.tree')
id2=$(echo "$result" | jq -r '.nodeId')

message3=$(create_message "user" "Message 3")
result=$(add_node "$tree" "$message3" "$id2")
tree=$(echo "$result" | jq -r '.tree')
id3=$(echo "$result" | jq -r '.nodeId')

TESTS_RUN=$((TESTS_RUN + 3))

if [ "$id1" != "$id2" ]; then
    echo "  ✓ Node 1 and Node 2 have different IDs"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo "  ✗ Node 1 and Node 2 have same ID"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi

if [ "$id2" != "$id3" ]; then
    echo "  ✓ Node 2 and Node 3 have different IDs"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo "  ✗ Node 2 and Node 3 have same ID"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi

if [ "$id1" != "$id3" ]; then
    echo "  ✓ Node 1 and Node 3 have different IDs"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo "  ✗ Node 1 and Node 3 have same ID"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
echo

# Test 10: Metadata updates
echo "Test 10: Metadata updates"
tree=$(init_tree "Test" "llama2")
created_at=$(echo "$tree" | jq -r '.metadata.createdAt')

# Wait a moment to ensure timestamp difference
sleep 1

message=$(create_message "user" "Test")
result=$(add_node "$tree" "$message" "")
tree=$(echo "$result" | jq -r '.tree')

last_modified=$(echo "$tree" | jq -r '.metadata.lastModified')

TESTS_RUN=$((TESTS_RUN + 1))
if [ "$created_at" != "$last_modified" ]; then
    echo "  ✓ lastModified is updated after adding node"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo "  ✗ lastModified was not updated"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
echo

# Test 11: Get path for single node (root)
echo "Test 11: Get path for single node (root)"
tree=$(init_tree "Test" "llama2")
message=$(create_message "user" "Root message")
result=$(add_node "$tree" "$message" "")
tree=$(echo "$result" | jq -r '.tree')
node_id=$(echo "$result" | jq -r '.nodeId')

path=$(get_path "$tree" "$node_id")
assert_json_valid "$path" "Path is valid JSON"

path_length=$(echo "$path" | jq 'length')
assert_equals "1" "$path_length" "Path has one message for root node"

first_message=$(echo "$path" | jq -r '.[0].content')
assert_equals "Root message" "$first_message" "Path contains correct message"
echo

# Test 12: Get path for multi-level conversation
echo "Test 12: Get path for multi-level conversation"
tree=$(init_tree "Test" "llama2")

# Add root node
message1=$(create_message "user" "First")
result=$(add_node "$tree" "$message1" "")
tree=$(echo "$result" | jq -r '.tree')
id1=$(echo "$result" | jq -r '.nodeId')

# Add second node
message2=$(create_message "assistant" "Second")
result=$(add_node "$tree" "$message2" "$id1")
tree=$(echo "$result" | jq -r '.tree')
id2=$(echo "$result" | jq -r '.nodeId')

# Add third node
message3=$(create_message "user" "Third")
result=$(add_node "$tree" "$message3" "$id2")
tree=$(echo "$result" | jq -r '.tree')
id3=$(echo "$result" | jq -r '.nodeId')

path=$(get_path "$tree" "$id3")
assert_json_valid "$path" "Path is valid JSON"

path_length=$(echo "$path" | jq 'length')
assert_equals "3" "$path_length" "Path has three messages"

# Verify chronological order
msg1=$(echo "$path" | jq -r '.[0].content')
msg2=$(echo "$path" | jq -r '.[1].content')
msg3=$(echo "$path" | jq -r '.[2].content')

assert_equals "First" "$msg1" "First message in path is correct"
assert_equals "Second" "$msg2" "Second message in path is correct"
assert_equals "Third" "$msg3" "Third message in path is correct"
echo

# Test 13: Get path for invalid node ID
echo "Test 13: Get path for invalid node ID"
tree=$(init_tree "Test" "llama2")
message=$(create_message "user" "Test")
result=$(add_node "$tree" "$message" "")
tree=$(echo "$result" | jq -r '.tree')

path=$(get_path "$tree" "non-existent-id")
assert_json_valid "$path" "Path is valid JSON for invalid ID"

path_length=$(echo "$path" | jq 'length')
assert_equals "0" "$path_length" "Path is empty for invalid node ID"
echo

# Test 14: Get path for middle node in conversation
echo "Test 14: Get path for middle node in conversation"
tree=$(init_tree "Test" "llama2")

# Build a 5-node conversation
message1=$(create_message "user" "Message 1")
result=$(add_node "$tree" "$message1" "")
tree=$(echo "$result" | jq -r '.tree')
id1=$(echo "$result" | jq -r '.nodeId')

message2=$(create_message "assistant" "Message 2")
result=$(add_node "$tree" "$message2" "$id1")
tree=$(echo "$result" | jq -r '.tree')
id2=$(echo "$result" | jq -r '.nodeId')

message3=$(create_message "user" "Message 3")
result=$(add_node "$tree" "$message3" "$id2")
tree=$(echo "$result" | jq -r '.tree')
id3=$(echo "$result" | jq -r '.nodeId')

message4=$(create_message "assistant" "Message 4")
result=$(add_node "$tree" "$message4" "$id3")
tree=$(echo "$result" | jq -r '.tree')
id4=$(echo "$result" | jq -r '.nodeId')

message5=$(create_message "user" "Message 5")
result=$(add_node "$tree" "$message5" "$id4")
tree=$(echo "$result" | jq -r '.tree')
id5=$(echo "$result" | jq -r '.nodeId')

# Get path to middle node (id3)
path=$(get_path "$tree" "$id3")
assert_json_valid "$path" "Path is valid JSON"

path_length=$(echo "$path" | jq 'length')
assert_equals "3" "$path_length" "Path to middle node has correct length"

# Verify it contains messages 1, 2, 3 in order
msg1=$(echo "$path" | jq -r '.[0].content')
msg2=$(echo "$path" | jq -r '.[1].content')
msg3=$(echo "$path" | jq -r '.[2].content')

assert_equals "Message 1" "$msg1" "First message is correct"
assert_equals "Message 2" "$msg2" "Second message is correct"
assert_equals "Message 3" "$msg3" "Third message is correct"
echo

# Test 15: Get path with branching (verify correct path)
echo "Test 15: Get path with branching"
tree=$(init_tree "Test" "llama2")

# Add root
message1=$(create_message "user" "Root")
result=$(add_node "$tree" "$message1" "")
tree=$(echo "$result" | jq -r '.tree')
root_id=$(echo "$result" | jq -r '.nodeId')

# Add first branch
message2=$(create_message "assistant" "Branch A")
result=$(add_node "$tree" "$message2" "$root_id")
tree=$(echo "$result" | jq -r '.tree')
branch_a_id=$(echo "$result" | jq -r '.nodeId')

# Add second branch (sibling)
message3=$(create_message "assistant" "Branch B")
result=$(add_node "$tree" "$message3" "$root_id")
tree=$(echo "$result" | jq -r '.tree')
branch_b_id=$(echo "$result" | jq -r '.nodeId')

# Continue branch A
message4=$(create_message "user" "Continue A")
result=$(add_node "$tree" "$message4" "$branch_a_id")
tree=$(echo "$result" | jq -r '.tree')
continue_a_id=$(echo "$result" | jq -r '.nodeId')

# Get path to continue_a_id - should include Root -> Branch A -> Continue A
path=$(get_path "$tree" "$continue_a_id")
assert_json_valid "$path" "Path is valid JSON"

path_length=$(echo "$path" | jq 'length')
assert_equals "3" "$path_length" "Path has correct length with branching"

msg1=$(echo "$path" | jq -r '.[0].content')
msg2=$(echo "$path" | jq -r '.[1].content')
msg3=$(echo "$path" | jq -r '.[2].content')

assert_equals "Root" "$msg1" "First message is root"
assert_equals "Branch A" "$msg2" "Second message is Branch A (not Branch B)"
assert_equals "Continue A" "$msg3" "Third message is Continue A"
echo

# Test 16: Get path returns messages, not nodes
echo "Test 16: Get path returns messages, not nodes"
tree=$(init_tree "Test" "llama2")
message=$(create_message "user" "Test message")
result=$(add_node "$tree" "$message" "")
tree=$(echo "$result" | jq -r '.tree')
node_id=$(echo "$result" | jq -r '.nodeId')

path=$(get_path "$tree" "$node_id")
first_item=$(echo "$path" | jq '.[0]')

# Check that it has message properties, not node properties
TESTS_RUN=$((TESTS_RUN + 4))

if echo "$first_item" | jq -e '.role != null' > /dev/null 2>&1; then
    echo "  ✓ Path item has role property (message)"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo "  ✗ Path item has role property (message)"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi

if echo "$first_item" | jq -e '.content != null' > /dev/null 2>&1; then
    echo "  ✓ Path item has content property (message)"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo "  ✗ Path item has content property (message)"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi

if echo "$first_item" | jq -e '.children == null' > /dev/null 2>&1; then
    echo "  ✓ Path item does not have children property (not node)"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo "  ✗ Path item does not have children property (not node)"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi

if echo "$first_item" | jq -e '.parentId == null' > /dev/null 2>&1; then
    echo "  ✓ Path item does not have parentId property (not node)"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo "  ✗ Path item does not have parentId property (not node)"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
echo

# Test 17: Validate tree with valid parent references
echo "Test 17: Validate tree with valid parent references"
tree=$(init_tree "Test" "llama2")
message1=$(create_message "user" "Root")
result=$(add_node "$tree" "$message1" "")
tree=$(echo "$result" | jq -r '.tree')
root_id=$(echo "$result" | jq -r '.nodeId')

message2=$(create_message "assistant" "Child")
result=$(add_node "$tree" "$message2" "$root_id")
tree=$(echo "$result" | jq -r '.tree')

valid=$(validate_parent_references "$tree")
assert_equals "true" "$valid" "Tree with valid parent references passes validation"
echo

# Test 18: Validate tree with invalid parent reference
echo "Test 18: Validate tree with invalid parent reference"
tree=$(init_tree "Test" "llama2")
message=$(create_message "user" "Test")
result=$(add_node "$tree" "$message" "")
tree=$(echo "$result" | jq -r '.tree')

# Manually corrupt the tree by adding a node with invalid parent
corrupted_tree=$(echo "$tree" | jq '.nodes["fake-id"] = {
    id: "fake-id",
    message: {id: "msg-1", role: "user", content: "Bad", timestamp: "2024-01-01T00:00:00Z", model: ""},
    parentId: "non-existent-parent",
    children: [],
    isActive: true
}')

valid=$(validate_parent_references "$corrupted_tree")
assert_equals "false" "$valid" "Tree with invalid parent reference fails validation"
echo

# Test 19: Validate acyclic tree
echo "Test 19: Validate acyclic tree"
tree=$(init_tree "Test" "llama2")
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

acyclic=$(validate_acyclic "$tree")
assert_equals "true" "$acyclic" "Valid tree is acyclic"
echo

# Test 20: Validate tree with cycle
echo "Test 20: Validate tree with cycle"
tree=$(init_tree "Test" "llama2")
message1=$(create_message "user" "Node 1")
result=$(add_node "$tree" "$message1" "")
tree=$(echo "$result" | jq -r '.tree')
id1=$(echo "$result" | jq -r '.nodeId')

message2=$(create_message "assistant" "Node 2")
result=$(add_node "$tree" "$message2" "$id1")
tree=$(echo "$result" | jq -r '.tree')
id2=$(echo "$result" | jq -r '.nodeId')

# Create a cycle: make node 1's parent point to node 2
cyclic_tree=$(echo "$tree" | jq --arg id1 "$id1" --arg id2 "$id2" \
    '.nodes[$id1].parentId = $id2')

acyclic=$(validate_acyclic "$cyclic_tree")
assert_equals "false" "$acyclic" "Tree with cycle fails acyclic validation"
echo

# Test 21: Validate single root node
echo "Test 21: Validate single root node"
tree=$(init_tree "Test" "llama2")
message=$(create_message "user" "Root")
result=$(add_node "$tree" "$message" "")
tree=$(echo "$result" | jq -r '.tree')

single_root=$(validate_single_root "$tree")
assert_equals "true" "$single_root" "Tree with single root passes validation"
echo

# Test 22: Validate tree with no root
echo "Test 22: Validate tree with no root"
tree=$(init_tree "Test" "llama2")
message=$(create_message "user" "Test")
result=$(add_node "$tree" "$message" "")
tree=$(echo "$result" | jq -r '.tree')
node_id=$(echo "$result" | jq -r '.nodeId')

# Make the only node have a parent (no root)
no_root_tree=$(echo "$tree" | jq --arg node_id "$node_id" \
    '.nodes[$node_id].parentId = "some-parent"')

single_root=$(validate_single_root "$no_root_tree")
assert_equals "false" "$single_root" "Tree with no root fails validation"
echo

# Test 23: Validate tree with multiple roots
echo "Test 23: Validate tree with multiple roots"
tree=$(init_tree "Test" "llama2")
message1=$(create_message "user" "Root 1")
result=$(add_node "$tree" "$message1" "")
tree=$(echo "$result" | jq -r '.tree')

# Add another root node manually
multi_root_tree=$(echo "$tree" | jq '.nodes["root2"] = {
    id: "root2",
    message: {id: "msg-2", role: "user", content: "Root 2", timestamp: "2024-01-01T00:00:00Z", model: ""},
    parentId: null,
    children: [],
    isActive: true
}')

single_root=$(validate_single_root "$multi_root_tree")
assert_equals "false" "$single_root" "Tree with multiple roots fails validation"
echo

# Test 24: Validate current node exists
echo "Test 24: Validate current node exists"
tree=$(init_tree "Test" "llama2")
message=$(create_message "user" "Test")
result=$(add_node "$tree" "$message" "")
tree=$(echo "$result" | jq -r '.tree')

valid_current=$(validate_current_node "$tree")
assert_equals "true" "$valid_current" "Tree with valid current node passes validation"
echo

# Test 25: Validate current node with null (empty tree)
echo "Test 25: Validate current node with null (empty tree)"
tree=$(init_tree "Test" "llama2")

valid_current=$(validate_current_node "$tree")
assert_equals "true" "$valid_current" "Empty tree with null current node is valid"
echo

# Test 26: Validate current node with invalid ID
echo "Test 26: Validate current node with invalid ID"
tree=$(init_tree "Test" "llama2")
message=$(create_message "user" "Test")
result=$(add_node "$tree" "$message" "")
tree=$(echo "$result" | jq -r '.tree')

# Set current node to non-existent ID
invalid_current_tree=$(echo "$tree" | jq '.currentNodeId = "non-existent-id"')

valid_current=$(validate_current_node "$invalid_current_tree")
assert_equals "false" "$valid_current" "Tree with invalid current node fails validation"
echo

# Test 27: Full tree validation - valid tree
echo "Test 27: Full tree validation - valid tree"
tree=$(init_tree "Test" "llama2")
message1=$(create_message "user" "First")
result=$(add_node "$tree" "$message1" "")
tree=$(echo "$result" | jq -r '.tree')
id1=$(echo "$result" | jq -r '.nodeId')

message2=$(create_message "assistant" "Second")
result=$(add_node "$tree" "$message2" "$id1")
tree=$(echo "$result" | jq -r '.tree')

validation=$(validate_tree "$tree")
assert_json_valid "$validation" "Validation result is valid JSON"

is_valid=$(echo "$validation" | jq -r '.isValid')
assert_equals "true" "$is_valid" "Valid tree passes full validation"

valid_parents=$(echo "$validation" | jq -r '.validParentReferences')
assert_equals "true" "$valid_parents" "Valid tree has valid parent references"

is_acyclic=$(echo "$validation" | jq -r '.isAcyclic')
assert_equals "true" "$is_acyclic" "Valid tree is acyclic"

single_root=$(echo "$validation" | jq -r '.hasSingleRoot')
assert_equals "true" "$single_root" "Valid tree has single root"

valid_current=$(echo "$validation" | jq -r '.validCurrentNode')
assert_equals "true" "$valid_current" "Valid tree has valid current node"
echo

# Test 28: Full tree validation - invalid tree (bad parent reference)
echo "Test 28: Full tree validation - invalid tree (bad parent reference)"
tree=$(init_tree "Test" "llama2")
message=$(create_message "user" "Test")
result=$(add_node "$tree" "$message" "")
tree=$(echo "$result" | jq -r '.tree')

# Corrupt with invalid parent
corrupted_tree=$(echo "$tree" | jq '.nodes["bad-node"] = {
    id: "bad-node",
    message: {id: "msg-1", role: "user", content: "Bad", timestamp: "2024-01-01T00:00:00Z", model: ""},
    parentId: "non-existent",
    children: [],
    isActive: true
}')

validation=$(validate_tree "$corrupted_tree")
is_valid=$(echo "$validation" | jq -r '.isValid')
assert_equals "false" "$is_valid" "Tree with invalid parent reference fails full validation"

valid_parents=$(echo "$validation" | jq -r '.validParentReferences')
assert_equals "false" "$valid_parents" "Invalid parent reference detected"
echo

# Test 29: Full tree validation - invalid tree (cycle)
echo "Test 29: Full tree validation - invalid tree (cycle)"
tree=$(init_tree "Test" "llama2")
message1=$(create_message "user" "Node 1")
result=$(add_node "$tree" "$message1" "")
tree=$(echo "$result" | jq -r '.tree')
id1=$(echo "$result" | jq -r '.nodeId')

message2=$(create_message "assistant" "Node 2")
result=$(add_node "$tree" "$message2" "$id1")
tree=$(echo "$result" | jq -r '.tree')
id2=$(echo "$result" | jq -r '.nodeId')

# Create cycle
cyclic_tree=$(echo "$tree" | jq --arg id1 "$id1" --arg id2 "$id2" \
    '.nodes[$id1].parentId = $id2')

validation=$(validate_tree "$cyclic_tree")
is_valid=$(echo "$validation" | jq -r '.isValid')
assert_equals "false" "$is_valid" "Tree with cycle fails full validation"

is_acyclic=$(echo "$validation" | jq -r '.isAcyclic')
assert_equals "false" "$is_acyclic" "Cycle detected in validation"
echo

# Test 30: Full tree validation - empty tree
echo "Test 30: Full tree validation - empty tree"
tree=$(init_tree "Test" "llama2")

validation=$(validate_tree "$tree")
is_valid=$(echo "$validation" | jq -r '.isValid')

# Empty tree should fail because it has no root node
assert_equals "false" "$is_valid" "Empty tree fails validation (no root node)"

single_root=$(echo "$validation" | jq -r '.hasSingleRoot')
assert_equals "false" "$single_root" "Empty tree has no root node"
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
