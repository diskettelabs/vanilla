#!/usr/bin/env bash
# Unit tests for branch selector and switching

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

assert_not_equals() {
    local not_expected="$1"
    local actual="$2"
    local test_name="$3"
    
    TESTS_RUN=$((TESTS_RUN + 1))
    
    if [ "$not_expected" != "$actual" ]; then
        echo "  ✓ $test_name"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo "  ✗ $test_name"
        echo "    Should not equal: $not_expected"
        echo "    Actual: $actual"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
}

echo "========================================="
echo "Testing Branch Selector and Switching"
echo "========================================="
echo

# Test 1: get_branches returns empty array for node with no children
echo "Test 1: get_branches returns empty array for node with no children"
tree=$(init_tree "Test" "llama2")

# Add a single message
message=$(create_message "user" "Single message")
result=$(add_node "$tree" "$message" "")
tree=$(echo "$result" | jq -r '.tree')
node_id=$(echo "$result" | jq -r '.nodeId')

branches=$(get_branches "$tree" "$node_id")
assert_json_valid "$branches" "Branches are valid JSON"

branch_count=$(echo "$branches" | jq 'length')
assert_equals "0" "$branch_count" "No branches for node with no children"
echo

# Test 2: get_branches returns all children of a node
echo "Test 2: get_branches returns all children of a node"
tree=$(init_tree "Test" "llama2")

# Create root message
message1=$(create_message "user" "Root")
result=$(add_node "$tree" "$message1" "")
tree=$(echo "$result" | jq -r '.tree')
root_id=$(echo "$result" | jq -r '.nodeId')

# Create two branches from root
message2=$(create_message "assistant" "Branch A")
result=$(add_node "$tree" "$message2" "$root_id")
tree=$(echo "$result" | jq -r '.tree')
branch_a_id=$(echo "$result" | jq -r '.nodeId')

message3=$(create_message "assistant" "Branch B")
result=$(add_node "$tree" "$message3" "$root_id")
tree=$(echo "$result" | jq -r '.tree')
branch_b_id=$(echo "$result" | jq -r '.nodeId')

# Get branches from root
branches=$(get_branches "$tree" "$root_id")
assert_json_valid "$branches" "Branches are valid JSON"

branch_count=$(echo "$branches" | jq 'length')
assert_equals "2" "$branch_count" "Two branches returned"

# Verify branch contents
branch_a_content=$(echo "$branches" | jq -r '.[0].content')
branch_b_content=$(echo "$branches" | jq -r '.[1].content')

assert_equals "Branch A" "$branch_a_content" "First branch has correct content"
assert_equals "Branch B" "$branch_b_content" "Second branch has correct content"
echo

# Test 3: get_branches includes branch metadata
echo "Test 3: get_branches includes branch metadata"
tree=$(init_tree "Test" "llama2")

# Create root and branch
message1=$(create_message "user" "Root")
result=$(add_node "$tree" "$message1" "")
tree=$(echo "$result" | jq -r '.tree')
root_id=$(echo "$result" | jq -r '.nodeId')

message2=$(create_message "assistant" "Branch")
result=$(add_node "$tree" "$message2" "$root_id")
tree=$(echo "$result" | jq -r '.tree')

branches=$(get_branches "$tree" "$root_id")
first_branch=$(echo "$branches" | jq '.[0]')

# Check for required properties
TESTS_RUN=$((TESTS_RUN + 5))

if echo "$first_branch" | jq -e '.id != null' > /dev/null 2>&1; then
    echo "  ✓ Branch has id property"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo "  ✗ Branch missing id property"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi

if echo "$first_branch" | jq -e '.content != null' > /dev/null 2>&1; then
    echo "  ✓ Branch has content property"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo "  ✗ Branch missing content property"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi

if echo "$first_branch" | jq -e '.timestamp != null' > /dev/null 2>&1; then
    echo "  ✓ Branch has timestamp property"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo "  ✗ Branch missing timestamp property"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi

if echo "$first_branch" | jq -e '.role != null' > /dev/null 2>&1; then
    echo "  ✓ Branch has role property"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo "  ✗ Branch missing role property"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi

if echo "$first_branch" | jq -e '.isActive != null' > /dev/null 2>&1; then
    echo "  ✓ Branch has isActive property"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo "  ✗ Branch missing isActive property"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
echo

# Test 4: switch_branch changes currentNodeId
echo "Test 4: switch_branch changes currentNodeId"
tree=$(init_tree "Test" "llama2")

# Create root and two branches
message1=$(create_message "user" "Root")
result=$(add_node "$tree" "$message1" "")
tree=$(echo "$result" | jq -r '.tree')
root_id=$(echo "$result" | jq -r '.nodeId')

message2=$(create_message "assistant" "Branch A")
result=$(add_node "$tree" "$message2" "$root_id")
tree=$(echo "$result" | jq -r '.tree')
branch_a_id=$(echo "$result" | jq -r '.nodeId')

message3=$(create_message "assistant" "Branch B")
result=$(add_node "$tree" "$message3" "$root_id")
tree=$(echo "$result" | jq -r '.tree')
branch_b_id=$(echo "$result" | jq -r '.nodeId')

# Current node should be Branch B (last added)
current_before=$(echo "$tree" | jq -r '.currentNodeId')
assert_equals "$branch_b_id" "$current_before" "Current node is Branch B before switch"

# Switch to Branch A
tree=$(switch_branch "$tree" "$branch_a_id")
current_after=$(echo "$tree" | jq -r '.currentNodeId')
assert_equals "$branch_a_id" "$current_after" "Current node is Branch A after switch"
echo

# Test 5: switch_branch activates the selected branch path
echo "Test 5: switch_branch activates the selected branch path"
tree=$(init_tree "Test" "llama2")

# Create root and two branches
message1=$(create_message "user" "Root")
result=$(add_node "$tree" "$message1" "")
tree=$(echo "$result" | jq -r '.tree')
root_id=$(echo "$result" | jq -r '.nodeId')

message2=$(create_message "assistant" "Branch A")
result=$(add_node "$tree" "$message2" "$root_id")
tree=$(echo "$result" | jq -r '.tree')
branch_a_id=$(echo "$result" | jq -r '.nodeId')

message3=$(create_message "assistant" "Branch B")
result=$(add_node "$tree" "$message3" "$root_id")
tree=$(echo "$result" | jq -r '.tree')
branch_b_id=$(echo "$result" | jq -r '.nodeId')

# Switch to Branch A
tree=$(switch_branch "$tree" "$branch_a_id")

# Check that Branch A is active
branch_a_active=$(echo "$tree" | jq -r --arg id "$branch_a_id" '.nodes[$id].isActive')
assert_equals "true" "$branch_a_active" "Branch A is active after switch"

# Check that Branch B is inactive
branch_b_active=$(echo "$tree" | jq -r --arg id "$branch_b_id" '.nodes[$id].isActive')
assert_equals "false" "$branch_b_active" "Branch B is inactive after switch"
echo

# Test 6: switch_branch deactivates sibling branches
echo "Test 6: switch_branch deactivates sibling branches"
tree=$(init_tree "Test" "llama2")

# Create root and three branches
message1=$(create_message "user" "Root")
result=$(add_node "$tree" "$message1" "")
tree=$(echo "$result" | jq -r '.tree')
root_id=$(echo "$result" | jq -r '.nodeId')

message2=$(create_message "assistant" "Branch A")
result=$(add_node "$tree" "$message2" "$root_id")
tree=$(echo "$result" | jq -r '.tree')
branch_a_id=$(echo "$result" | jq -r '.nodeId')

message3=$(create_message "assistant" "Branch B")
result=$(add_node "$tree" "$message3" "$root_id")
tree=$(echo "$result" | jq -r '.tree')
branch_b_id=$(echo "$result" | jq -r '.nodeId')

message4=$(create_message "assistant" "Branch C")
result=$(add_node "$tree" "$message4" "$root_id")
tree=$(echo "$result" | jq -r '.tree')
branch_c_id=$(echo "$result" | jq -r '.nodeId')

# Switch to Branch A
tree=$(switch_branch "$tree" "$branch_a_id")

# All siblings should be inactive except Branch A
branch_a_active=$(echo "$tree" | jq -r --arg id "$branch_a_id" '.nodes[$id].isActive')
branch_b_active=$(echo "$tree" | jq -r --arg id "$branch_b_id" '.nodes[$id].isActive')
branch_c_active=$(echo "$tree" | jq -r --arg id "$branch_c_id" '.nodes[$id].isActive')

assert_equals "true" "$branch_a_active" "Branch A is active"
assert_equals "false" "$branch_b_active" "Branch B is inactive"
assert_equals "false" "$branch_c_active" "Branch C is inactive"
echo

# Test 7: switch_branch updates active path to selected branch
echo "Test 7: switch_branch updates active path to selected branch"
tree=$(init_tree "Test" "llama2")

# Create root and two branches
message1=$(create_message "user" "Root")
result=$(add_node "$tree" "$message1" "")
tree=$(echo "$result" | jq -r '.tree')
root_id=$(echo "$result" | jq -r '.nodeId')

message2=$(create_message "assistant" "Branch A")
result=$(add_node "$tree" "$message2" "$root_id")
tree=$(echo "$result" | jq -r '.tree')
branch_a_id=$(echo "$result" | jq -r '.nodeId')

message3=$(create_message "assistant" "Branch B")
result=$(add_node "$tree" "$message3" "$root_id")
tree=$(echo "$result" | jq -r '.tree')
branch_b_id=$(echo "$result" | jq -r '.nodeId')

# Switch to Branch A
tree=$(switch_branch "$tree" "$branch_a_id")

# Get current messages (should be Root -> Branch A)
messages=$(get_current_messages "$tree")
message_count=$(echo "$messages" | jq 'length')

assert_equals "2" "$message_count" "Active path has 2 messages"

msg1=$(echo "$messages" | jq -r '.[0].content')
msg2=$(echo "$messages" | jq -r '.[1].content')

assert_equals "Root" "$msg1" "First message is root"
assert_equals "Branch A" "$msg2" "Second message is Branch A"
echo

# Test 8: switch_branch returns error for invalid node ID
echo "Test 8: switch_branch returns error for invalid node ID"
tree=$(init_tree "Test" "llama2")

# Try to switch to non-existent node (capture both stdout and stderr)
# Temporarily disable exit on error for this test
set +e
result=$(switch_branch "$tree" "invalid-id" 2>&1)
exit_code=$?
set -e

# Check if error is returned
if echo "$result" | jq -e '.error' > /dev/null 2>&1; then
    echo "  ✓ Error returned for invalid node ID"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo "  ✗ No error returned for invalid node ID"
    echo "    Result: $result"
    echo "    Exit code: $exit_code"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
TESTS_RUN=$((TESTS_RUN + 1))
echo

# Test 9: switch_branch with nested branches
echo "Test 9: switch_branch with nested branches"
tree=$(init_tree "Test" "llama2")

# Create a deeper tree: Root -> A -> A1, A2
message1=$(create_message "user" "Root")
result=$(add_node "$tree" "$message1" "")
tree=$(echo "$result" | jq -r '.tree')
root_id=$(echo "$result" | jq -r '.nodeId')

message2=$(create_message "assistant" "A")
result=$(add_node "$tree" "$message2" "$root_id")
tree=$(echo "$result" | jq -r '.tree')
a_id=$(echo "$result" | jq -r '.nodeId')

message3=$(create_message "user" "A1")
result=$(add_node "$tree" "$message3" "$a_id")
tree=$(echo "$result" | jq -r '.tree')
a1_id=$(echo "$result" | jq -r '.nodeId')

message4=$(create_message "user" "A2")
result=$(add_node "$tree" "$message4" "$a_id")
tree=$(echo "$result" | jq -r '.tree')
a2_id=$(echo "$result" | jq -r '.nodeId')

# Switch to A1
tree=$(switch_branch "$tree" "$a1_id")

# Get current messages (should be Root -> A -> A1)
messages=$(get_current_messages "$tree")
message_count=$(echo "$messages" | jq 'length')

assert_equals "3" "$message_count" "Active path has 3 messages"

msg1=$(echo "$messages" | jq -r '.[0].content')
msg2=$(echo "$messages" | jq -r '.[1].content')
msg3=$(echo "$messages" | jq -r '.[2].content')

assert_equals "Root" "$msg1" "First message is Root"
assert_equals "A" "$msg2" "Second message is A"
assert_equals "A1" "$msg3" "Third message is A1"
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
