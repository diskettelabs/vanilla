#!/usr/bin/env bash
# Tests for editMessage() and createBranch() functions

# Source required files
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/../src/chat/chat_manager.sh"
source "${SCRIPT_DIR}/../src/tree/tree_ops.sh"
source "${SCRIPT_DIR}/../src/lib/json_utils.sh"

# Test counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test helper functions
pass() {
    echo -e "${GREEN}✓ PASS${NC}: $1"
    TESTS_PASSED=$((TESTS_PASSED + 1))
}

fail() {
    echo -e "${RED}✗ FAIL${NC}: $1"
    TESTS_FAILED=$((TESTS_FAILED + 1))
}

run_test() {
    echo -e "\n${YELLOW}TEST${NC}: $1"
    TESTS_RUN=$((TESTS_RUN + 1))
}

# Mock stream_completion to avoid actual Ollama calls
stream_completion() {
    local messages="$1"
    local model="$2"
    local callback="$3"
    
    # Simulate streaming response
    local tokens=("This " "is " "a " "test " "response.")
    
    # Redirect stdout to stderr to avoid contaminating JSON output
    for token in "${tokens[@]}"; do
        $callback "$token" "false" >&2
    done
    
    # Signal completion
    $callback "" "true" >&2
    
    return 0
}

# Test 1: deactivate_path marks node and descendants as inactive
run_test "deactivate_path() marks node and descendants as inactive"
tree=$(init_tree "Test" "llama2")
msg1=$(create_message "user" "Hello" "")
result=$(add_node "$tree" "$msg1" "null")
tree=$(echo "$result" | jq -r '.tree')
node1=$(echo "$result" | jq -r '.nodeId')

msg2=$(create_message "assistant" "Hi there" "llama2")
result=$(add_node "$tree" "$msg2" "$node1")
tree=$(echo "$result" | jq -r '.tree')
node2=$(echo "$result" | jq -r '.nodeId')

msg3=$(create_message "user" "How are you?" "")
result=$(add_node "$tree" "$msg3" "$node2")
tree=$(echo "$result" | jq -r '.tree')
node3=$(echo "$result" | jq -r '.nodeId')

# Deactivate from node2
tree=$(deactivate_path "$tree" "$node2")

# Check node2 is inactive
is_active=$(echo "$tree" | jq -r --arg id "$node2" '.nodes[$id].isActive')
if [ "$is_active" = "false" ]; then
    pass "Node2 marked as inactive"
else
    fail "Node2 should be inactive but is: $is_active"
fi

# Check node3 (descendant) is also inactive
is_active=$(echo "$tree" | jq -r --arg id "$node3" '.nodes[$id].isActive')
if [ "$is_active" = "false" ]; then
    pass "Node3 (descendant) marked as inactive"
else
    fail "Node3 should be inactive but is: $is_active"
fi

# Check node1 (parent) is still active
is_active=$(echo "$tree" | jq -r --arg id "$node1" '.nodes[$id].isActive')
if [ "$is_active" = "true" ]; then
    pass "Node1 (parent) remains active"
else
    fail "Node1 should be active but is: $is_active"
fi

# Test 2: activate_path marks path from root to node as active
run_test "activate_path() marks path from root to node as active"
tree=$(init_tree "Test" "llama2")
msg1=$(create_message "user" "Hello" "")
result=$(add_node "$tree" "$msg1" "null")
tree=$(echo "$result" | jq -r '.tree')
node1=$(echo "$result" | jq -r '.nodeId')

msg2=$(create_message "assistant" "Hi" "llama2")
result=$(add_node "$tree" "$msg2" "$node1")
tree=$(echo "$result" | jq -r '.tree')
node2=$(echo "$result" | jq -r '.nodeId')

# Deactivate all nodes first
tree=$(echo "$tree" | jq '.nodes |= map_values(.isActive = false)')

# Activate path to node2
tree=$(activate_path "$tree" "$node2")

# Check node1 is active
is_active=$(echo "$tree" | jq -r --arg id "$node1" '.nodes[$id].isActive')
if [ "$is_active" = "true" ]; then
    pass "Node1 (in path) marked as active"
else
    fail "Node1 should be active but is: $is_active"
fi

# Check node2 is active
is_active=$(echo "$tree" | jq -r --arg id "$node2" '.nodes[$id].isActive')
if [ "$is_active" = "true" ]; then
    pass "Node2 (target) marked as active"
else
    fail "Node2 should be active but is: $is_active"
fi

# Test 3: create_branch creates new branch from parent
run_test "create_branch() creates new branch from parent of edited message"
tree=$(init_tree "Test" "llama2")
msg1=$(create_message "user" "First message" "")
result=$(add_node "$tree" "$msg1" "null")
tree=$(echo "$result" | jq -r '.tree')
node1=$(echo "$result" | jq -r '.nodeId')

msg2=$(create_message "assistant" "First response" "llama2")
result=$(add_node "$tree" "$msg2" "$node1")
tree=$(echo "$result" | jq -r '.tree')
node2=$(echo "$result" | jq -r '.nodeId')

msg3=$(create_message "user" "Original message" "")
result=$(add_node "$tree" "$msg3" "$node2")
tree=$(echo "$result" | jq -r '.tree')
node3=$(echo "$result" | jq -r '.nodeId')

msg4=$(create_message "assistant" "Response to original" "llama2")
result=$(add_node "$tree" "$msg4" "$node3")
tree=$(echo "$result" | jq -r '.tree')
node4=$(echo "$result" | jq -r '.nodeId')

# Get parent of node3 (should be node2)
parent_id=$(echo "$tree" | jq -r --arg id "$node3" '.nodes[$id].parentId')

# Count nodes before branching
node_count_before=$(echo "$tree" | jq '.nodes | length')

# Create branch from node3
tree=$(create_branch "$tree" "$node3" "Edited message" "llama2" "")

# Count nodes after branching (should have +2: new user message + new assistant response)
node_count_after=$(echo "$tree" | jq '.nodes | length')
expected=$((node_count_before + 2))

if [ "$node_count_after" -eq "$expected" ]; then
    pass "New branch created with 2 new nodes (user + assistant)"
else
    fail "Expected $expected nodes, got: $node_count_after"
fi

# Verify the new user message is a sibling of the original (both have same parent)
children=$(echo "$tree" | jq -r --arg id "$parent_id" '.nodes[$id].children | length')
if [ "$children" -eq 2 ]; then
    pass "New branch created as sibling (same parent has 2 children)"
else
    fail "Expected 2 children of parent, got: $children"
fi

# Test 4: create_branch marks original path as inactive
run_test "create_branch() marks original path as inactive"
tree=$(init_tree "Test" "llama2")
msg1=$(create_message "user" "Original" "")
result=$(add_node "$tree" "$msg1" "null")
tree=$(echo "$result" | jq -r '.tree')
node1=$(echo "$result" | jq -r '.nodeId')

msg2=$(create_message "assistant" "Response" "llama2")
result=$(add_node "$tree" "$msg2" "$node1")
tree=$(echo "$result" | jq -r '.tree')
node2=$(echo "$result" | jq -r '.nodeId')

# Create branch from node1
tree=$(create_branch "$tree" "$node1" "Edited" "llama2" "")

# Check original node1 is inactive
is_active=$(echo "$tree" | jq -r --arg id "$node1" '.nodes[$id].isActive')
if [ "$is_active" = "false" ]; then
    pass "Original node marked as inactive"
else
    fail "Original node should be inactive but is: $is_active"
fi

# Check original node2 (descendant) is inactive
is_active=$(echo "$tree" | jq -r --arg id "$node2" '.nodes[$id].isActive')
if [ "$is_active" = "false" ]; then
    pass "Original descendant marked as inactive"
else
    fail "Original descendant should be inactive but is: $is_active"
fi

# Test 5: create_branch marks new path as active
run_test "create_branch() marks new path as active"
tree=$(init_tree "Test" "llama2")
msg1=$(create_message "user" "Original" "")
result=$(add_node "$tree" "$msg1" "null")
tree=$(echo "$result" | jq -r '.tree')
node1=$(echo "$result" | jq -r '.nodeId')

# Create branch
tree=$(create_branch "$tree" "$node1" "Edited" "llama2" "")

# Get the new branch node (should be current node after branching)
current_node=$(echo "$tree" | jq -r '.currentNodeId')

# Check new branch is active
is_active=$(echo "$tree" | jq -r --arg id "$current_node" '.nodes[$id].isActive')
if [ "$is_active" = "true" ]; then
    pass "New branch marked as active"
else
    fail "New branch should be active but is: $is_active"
fi

# Test 6: create_branch generates AI response
run_test "create_branch() generates AI response for edited message"
tree=$(init_tree "Test" "llama2")
msg1=$(create_message "user" "Original" "")
result=$(add_node "$tree" "$msg1" "null")
tree=$(echo "$result" | jq -r '.tree')
node1=$(echo "$result" | jq -r '.nodeId')

# Count nodes before branching
node_count_before=$(echo "$tree" | jq '.nodes | length')

# Create branch
tree=$(create_branch "$tree" "$node1" "Edited" "llama2" "")

# Count nodes after branching (should have +2: edited user message + assistant response)
node_count_after=$(echo "$tree" | jq '.nodes | length')
expected=$((node_count_before + 2))

if [ "$node_count_after" -eq "$expected" ]; then
    pass "AI response node created (node count increased by 2)"
else
    fail "Expected $expected nodes, got: $node_count_after"
fi

# Check that the last added node is an assistant message
current_node=$(echo "$tree" | jq -r '.currentNodeId')
role=$(echo "$tree" | jq -r --arg id "$current_node" '.nodes[$id].message.role')
if [ "$role" = "assistant" ]; then
    pass "AI response has assistant role"
else
    fail "Expected assistant role, got: $role"
fi

# Test 7: create_branch validates node exists
run_test "create_branch() returns error for non-existent node"
tree=$(init_tree "Test" "llama2")
result=$(create_branch "$tree" "invalid-node-id" "New text" "llama2" "" 2>&1)

if echo "$result" | grep -q "error"; then
    pass "Error returned for non-existent node"
else
    fail "Should return error for non-existent node"
fi

# Test 8: create_branch validates user message role
run_test "create_branch() returns error for non-user message"
tree=$(init_tree "Test" "llama2")
msg1=$(create_message "user" "User message" "")
result=$(add_node "$tree" "$msg1" "null")
tree=$(echo "$result" | jq -r '.tree')
node1=$(echo "$result" | jq -r '.nodeId')

msg2=$(create_message "assistant" "Assistant message" "llama2")
result=$(add_node "$tree" "$msg2" "$node1")
tree=$(echo "$result" | jq -r '.tree')
node2=$(echo "$result" | jq -r '.nodeId')

# Try to branch from assistant message
result=$(create_branch "$tree" "$node2" "New text" "llama2" "" 2>&1)

if echo "$result" | grep -q "can only edit user messages"; then
    pass "Error returned for non-user message"
else
    fail "Should return error for non-user message"
fi

# Test 9: create_branch sanitizes input
run_test "create_branch() sanitizes new text input"
tree=$(init_tree "Test" "llama2")
msg1=$(create_message "user" "Original" "")
result=$(add_node "$tree" "$msg1" "null")
tree=$(echo "$result" | jq -r '.tree')
node1=$(echo "$result" | jq -r '.nodeId')

# Create branch with text that needs sanitization (extra whitespace)
tree=$(create_branch "$tree" "$node1" "  Edited with spaces  " "llama2" "")

# Get the new user message content
current_node=$(echo "$tree" | jq -r '.currentNodeId')
# Go back one node to get the user message (current is assistant)
parent_id=$(echo "$tree" | jq -r --arg id "$current_node" '.nodes[$id].parentId')
content=$(echo "$tree" | jq -r --arg id "$parent_id" '.nodes[$id].message.content')

if [ "$content" = "Edited with spaces" ]; then
    pass "Input sanitized (whitespace trimmed)"
else
    fail "Expected 'Edited with spaces', got: '$content'"
fi

# Test 10: create_branch updates currentNodeId
run_test "create_branch() updates currentNodeId to new assistant message"
tree=$(init_tree "Test" "llama2")
msg1=$(create_message "user" "Original" "")
result=$(add_node "$tree" "$msg1" "null")
tree=$(echo "$result" | jq -r '.tree')
node1=$(echo "$result" | jq -r '.nodeId')

# Create branch
tree=$(create_branch "$tree" "$node1" "Edited" "llama2" "")

# Get current node
current_node=$(echo "$tree" | jq -r '.currentNodeId')

# Verify it's an assistant message
role=$(echo "$tree" | jq -r --arg id "$current_node" '.nodes[$id].message.role')
if [ "$role" = "assistant" ]; then
    pass "currentNodeId points to new assistant message"
else
    fail "currentNodeId should point to assistant message, got role: $role"
fi

# Print summary
echo ""
echo "================================"
echo "Test Summary"
echo "================================"
echo "Tests run: $TESTS_RUN"
echo -e "${GREEN}Tests passed: $TESTS_PASSED${NC}"
if [ $TESTS_FAILED -gt 0 ]; then
    echo -e "${RED}Tests failed: $TESTS_FAILED${NC}"
else
    echo -e "${GREEN}Tests failed: $TESTS_FAILED${NC}"
fi
echo "================================"

# Exit with failure if any tests failed
if [ $TESTS_FAILED -gt 0 ]; then
    exit 1
else
    exit 0
fi
