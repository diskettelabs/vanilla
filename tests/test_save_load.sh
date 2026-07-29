#!/usr/bin/env bash
# Unit tests for conversation tree save/load operations

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
        echo "    Expected to contain: $needle"
        echo "    Actual: $haystack"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
}

assert_file_exists() {
    local filepath="$1"
    local test_name="$2"
    
    TESTS_RUN=$((TESTS_RUN + 1))
    
    if [ -f "$filepath" ]; then
        echo "  ✓ $test_name"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo "  ✗ $test_name"
        echo "    File does not exist: $filepath"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
}

assert_file_permissions() {
    local filepath="$1"
    local expected_perms="$2"
    local test_name="$3"
    
    TESTS_RUN=$((TESTS_RUN + 1))
    
    if [ -f "$filepath" ]; then
        local actual_perms=$(stat -c "%a" "$filepath" 2>/dev/null || stat -f "%A" "$filepath" 2>/dev/null)
        if [ "$actual_perms" = "$expected_perms" ]; then
            echo "  ✓ $test_name"
            TESTS_PASSED=$((TESTS_PASSED + 1))
        else
            echo "  ✗ $test_name"
            echo "    Expected permissions: $expected_perms"
            echo "    Actual permissions: $actual_perms"
            TESTS_FAILED=$((TESTS_FAILED + 1))
        fi
    else
        echo "  ✗ $test_name"
        echo "    File does not exist: $filepath"
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

# Create temporary directory for test files
TEST_DIR=$(mktemp -d)
trap "rm -rf $TEST_DIR" EXIT

echo "========================================="
echo "Testing Save/Load Operations"
echo "========================================="
echo "Test directory: $TEST_DIR"
echo

# Test 1: Save empty tree
echo "Test 1: Save empty tree"
tree=$(init_tree "Test Conversation" "llama2")
message=$(create_message "user" "Hello")
result=$(add_node "$tree" "$message" "")
tree=$(echo "$result" | jq -r '.tree')

filepath="${TEST_DIR}/test1.json"
save_result=$(save "$tree" "$filepath")

assert_equals "success" "$save_result" "Save returns success"
assert_file_exists "$filepath" "File is created"
assert_file_permissions "$filepath" "600" "File has 600 permissions"
echo

# Test 2: Load saved tree
echo "Test 2: Load saved tree"
loaded_tree=$(load "$filepath")

assert_json_valid "$loaded_tree" "Loaded tree is valid JSON"

# Compare key properties
original_title=$(echo "$tree" | jq -r '.metadata.title')
loaded_title=$(echo "$loaded_tree" | jq -r '.metadata.title')
assert_equals "$original_title" "$loaded_title" "Title is preserved"

original_model=$(echo "$tree" | jq -r '.metadata.model')
loaded_model=$(echo "$loaded_tree" | jq -r '.metadata.model')
assert_equals "$original_model" "$loaded_model" "Model is preserved"

original_node_count=$(echo "$tree" | jq '.nodes | length')
loaded_node_count=$(echo "$loaded_tree" | jq '.nodes | length')
assert_equals "$original_node_count" "$loaded_node_count" "Node count is preserved"
echo

# Test 3: Save and load multi-node tree
echo "Test 3: Save and load multi-node tree"
tree=$(init_tree "Multi-node Test" "llama2")

# Add multiple nodes
message1=$(create_message "user" "First message")
result=$(add_node "$tree" "$message1" "")
tree=$(echo "$result" | jq -r '.tree')
id1=$(echo "$result" | jq -r '.nodeId')

message2=$(create_message "assistant" "Second message")
result=$(add_node "$tree" "$message2" "$id1")
tree=$(echo "$result" | jq -r '.tree')
id2=$(echo "$result" | jq -r '.nodeId')

message3=$(create_message "user" "Third message")
result=$(add_node "$tree" "$message3" "$id2")
tree=$(echo "$result" | jq -r '.tree')

filepath="${TEST_DIR}/test3.json"
save_result=$(save "$tree" "$filepath")
assert_equals "success" "$save_result" "Multi-node tree saves successfully"

loaded_tree=$(load "$filepath")
assert_json_valid "$loaded_tree" "Loaded multi-node tree is valid JSON"

original_node_count=$(echo "$tree" | jq '.nodes | length')
loaded_node_count=$(echo "$loaded_tree" | jq '.nodes | length')
assert_equals "$original_node_count" "$loaded_node_count" "All nodes are preserved"

# Verify specific node content
original_content=$(echo "$tree" | jq -r --arg id "$id2" '.nodes[$id].message.content')
loaded_content=$(echo "$loaded_tree" | jq -r --arg id "$id2" '.nodes[$id].message.content')
assert_equals "$original_content" "$loaded_content" "Node content is preserved"
echo

# Test 4: Save and load tree with branches
echo "Test 4: Save and load tree with branches"
tree=$(init_tree "Branch Test" "llama2")

# Create root
message1=$(create_message "user" "Root")
result=$(add_node "$tree" "$message1" "")
tree=$(echo "$result" | jq -r '.tree')
root_id=$(echo "$result" | jq -r '.nodeId')

# Create first branch
message2=$(create_message "assistant" "Branch A")
result=$(add_node "$tree" "$message2" "$root_id")
tree=$(echo "$result" | jq -r '.tree')
branch_a_id=$(echo "$result" | jq -r '.nodeId')

# Create second branch
message3=$(create_message "assistant" "Branch B")
result=$(add_node "$tree" "$message3" "$root_id")
tree=$(echo "$result" | jq -r '.tree')
branch_b_id=$(echo "$result" | jq -r '.nodeId')

filepath="${TEST_DIR}/test4.json"
save_result=$(save "$tree" "$filepath")
assert_equals "success" "$save_result" "Branched tree saves successfully"

loaded_tree=$(load "$filepath")

# Verify branches are preserved
original_children=$(echo "$tree" | jq -r --arg id "$root_id" '.nodes[$id].children | length')
loaded_children=$(echo "$loaded_tree" | jq -r --arg id "$root_id" '.nodes[$id].children | length')
assert_equals "$original_children" "$loaded_children" "Branch structure is preserved"

# Verify both branches exist
branch_a_exists=$(echo "$loaded_tree" | jq -r --arg id "$branch_a_id" '.nodes[$id] != null')
branch_b_exists=$(echo "$loaded_tree" | jq -r --arg id "$branch_b_id" '.nodes[$id] != null')
assert_equals "true" "$branch_a_exists" "Branch A is preserved"
assert_equals "true" "$branch_b_exists" "Branch B is preserved"
echo

# Test 5: Save with empty tree parameter
echo "Test 5: Save with empty tree parameter"
filepath="${TEST_DIR}/test5.json"
save_result=$(save "" "$filepath" || true)

assert_contains "$save_result" "error" "Empty tree returns error"
echo

# Test 6: Save with empty filepath
echo "Test 6: Save with empty filepath"
tree=$(init_tree "Test" "llama2")
save_result=$(save "$tree" "" || true)

assert_contains "$save_result" "error" "Empty filepath returns error"
echo

# Test 7: Load non-existent file
echo "Test 7: Load non-existent file"
load_result=$(load "${TEST_DIR}/non-existent.json" || true)

assert_contains "$load_result" "error" "Non-existent file returns error"
echo

# Test 8: Load with empty filepath
echo "Test 8: Load with empty filepath"
load_result=$(load "" || true)

assert_contains "$load_result" "error" "Empty filepath returns error"
echo

# Test 9: Load invalid JSON file
echo "Test 9: Load invalid JSON file"
filepath="${TEST_DIR}/invalid.json"
echo "This is not valid JSON" > "$filepath"

load_result=$(load "$filepath" || true)
assert_contains "$load_result" "error" "Invalid JSON returns error"
echo

# Test 10: Load file with invalid tree structure
echo "Test 10: Load file with invalid tree structure"
filepath="${TEST_DIR}/invalid_tree.json"
# Create a JSON file that is valid JSON but invalid tree (no root)
echo '{"nodes": {}, "rootId": null, "currentNodeId": null, "metadata": {"createdAt": "2024-01-01T00:00:00Z", "lastModified": "2024-01-01T00:00:00Z", "title": "Test", "model": "llama2"}}' > "$filepath"

load_result=$(load "$filepath" || true)
assert_contains "$load_result" "error" "Invalid tree structure returns error"
echo

# Test 11: Save creates directory if it doesn't exist
echo "Test 11: Save creates directory if it doesn't exist"
tree=$(init_tree "Test" "llama2")
message=$(create_message "user" "Test")
result=$(add_node "$tree" "$message" "")
tree=$(echo "$result" | jq -r '.tree')

filepath="${TEST_DIR}/subdir/nested/test11.json"
save_result=$(save "$tree" "$filepath")

assert_equals "success" "$save_result" "Save creates nested directories"
assert_file_exists "$filepath" "File is created in nested directory"
echo

# Test 12: Serialization round-trip preserves all metadata
echo "Test 12: Serialization round-trip preserves all metadata"
tree=$(init_tree "Metadata Test" "gpt-4")
message=$(create_message "user" "Test message")
result=$(add_node "$tree" "$message" "")
tree=$(echo "$result" | jq -r '.tree')

filepath="${TEST_DIR}/test12.json"
save "$tree" "$filepath" > /dev/null
loaded_tree=$(load "$filepath")

# Check all metadata fields
original_created=$(echo "$tree" | jq -r '.metadata.createdAt')
loaded_created=$(echo "$loaded_tree" | jq -r '.metadata.createdAt')
assert_equals "$original_created" "$loaded_created" "createdAt is preserved"

original_modified=$(echo "$tree" | jq -r '.metadata.lastModified')
loaded_modified=$(echo "$loaded_tree" | jq -r '.metadata.lastModified')
assert_equals "$original_modified" "$loaded_modified" "lastModified is preserved"

original_title=$(echo "$tree" | jq -r '.metadata.title')
loaded_title=$(echo "$loaded_tree" | jq -r '.metadata.title')
assert_equals "$original_title" "$loaded_title" "title is preserved"

original_model=$(echo "$tree" | jq -r '.metadata.model')
loaded_model=$(echo "$loaded_tree" | jq -r '.metadata.model')
assert_equals "$original_model" "$loaded_model" "model is preserved"
echo

# Test 13: Serialization round-trip preserves node relationships
echo "Test 13: Serialization round-trip preserves node relationships"
tree=$(init_tree "Relationship Test" "llama2")

message1=$(create_message "user" "Parent")
result=$(add_node "$tree" "$message1" "")
tree=$(echo "$result" | jq -r '.tree')
parent_id=$(echo "$result" | jq -r '.nodeId')

message2=$(create_message "assistant" "Child")
result=$(add_node "$tree" "$message2" "$parent_id")
tree=$(echo "$result" | jq -r '.tree')
child_id=$(echo "$result" | jq -r '.nodeId')

filepath="${TEST_DIR}/test13.json"
save "$tree" "$filepath" > /dev/null
loaded_tree=$(load "$filepath")

# Verify parent-child relationship
loaded_child_parent=$(echo "$loaded_tree" | jq -r --arg id "$child_id" '.nodes[$id].parentId')
assert_equals "$parent_id" "$loaded_child_parent" "Child's parent reference is preserved"

loaded_parent_children=$(echo "$loaded_tree" | jq -r --arg id "$parent_id" '.nodes[$id].children[0]')
assert_equals "$child_id" "$loaded_parent_children" "Parent's children array is preserved"
echo

# Test 14: Serialization round-trip preserves message properties
echo "Test 14: Serialization round-trip preserves message properties"
tree=$(init_tree "Message Test" "llama2")
message=$(create_message "user" "Test content with special chars: @#$%")
result=$(add_node "$tree" "$message" "")
tree=$(echo "$result" | jq -r '.tree')
node_id=$(echo "$result" | jq -r '.nodeId')

filepath="${TEST_DIR}/test14.json"
save "$tree" "$filepath" > /dev/null
loaded_tree=$(load "$filepath")

# Verify all message properties
original_role=$(echo "$tree" | jq -r --arg id "$node_id" '.nodes[$id].message.role')
loaded_role=$(echo "$loaded_tree" | jq -r --arg id "$node_id" '.nodes[$id].message.role')
assert_equals "$original_role" "$loaded_role" "Message role is preserved"

original_content=$(echo "$tree" | jq -r --arg id "$node_id" '.nodes[$id].message.content')
loaded_content=$(echo "$loaded_tree" | jq -r --arg id "$node_id" '.nodes[$id].message.content')
assert_equals "$original_content" "$loaded_content" "Message content is preserved"

original_timestamp=$(echo "$tree" | jq -r --arg id "$node_id" '.nodes[$id].message.timestamp')
loaded_timestamp=$(echo "$loaded_tree" | jq -r --arg id "$node_id" '.nodes[$id].message.timestamp')
assert_equals "$original_timestamp" "$loaded_timestamp" "Message timestamp is preserved"
echo

# Test 15: Serialization round-trip preserves currentNodeId
echo "Test 15: Serialization round-trip preserves currentNodeId"
tree=$(init_tree "Current Node Test" "llama2")

message1=$(create_message "user" "First")
result=$(add_node "$tree" "$message1" "")
tree=$(echo "$result" | jq -r '.tree')
id1=$(echo "$result" | jq -r '.nodeId')

message2=$(create_message "assistant" "Second")
result=$(add_node "$tree" "$message2" "$id1")
tree=$(echo "$result" | jq -r '.tree')
id2=$(echo "$result" | jq -r '.nodeId')

filepath="${TEST_DIR}/test15.json"
save "$tree" "$filepath" > /dev/null
loaded_tree=$(load "$filepath")

original_current=$(echo "$tree" | jq -r '.currentNodeId')
loaded_current=$(echo "$loaded_tree" | jq -r '.currentNodeId')
assert_equals "$original_current" "$loaded_current" "currentNodeId is preserved"
assert_equals "$id2" "$loaded_current" "currentNodeId points to last added node"
echo

# Test 16: Serialization round-trip preserves rootId
echo "Test 16: Serialization round-trip preserves rootId"
tree=$(init_tree "Root Test" "llama2")
message=$(create_message "user" "Root message")
result=$(add_node "$tree" "$message" "")
tree=$(echo "$result" | jq -r '.tree')
root_id=$(echo "$result" | jq -r '.nodeId')

filepath="${TEST_DIR}/test16.json"
save "$tree" "$filepath" > /dev/null
loaded_tree=$(load "$filepath")

original_root=$(echo "$tree" | jq -r '.rootId')
loaded_root=$(echo "$loaded_tree" | jq -r '.rootId')
assert_equals "$original_root" "$loaded_root" "rootId is preserved"
assert_equals "$root_id" "$loaded_root" "rootId points to root node"
echo

# Test 17: Loaded tree passes validation
echo "Test 17: Loaded tree passes validation"
tree=$(init_tree "Validation Test" "llama2")

message1=$(create_message "user" "First")
result=$(add_node "$tree" "$message1" "")
tree=$(echo "$result" | jq -r '.tree')
id1=$(echo "$result" | jq -r '.nodeId')

message2=$(create_message "assistant" "Second")
result=$(add_node "$tree" "$message2" "$id1")
tree=$(echo "$result" | jq -r '.tree')

filepath="${TEST_DIR}/test17.json"
save "$tree" "$filepath" > /dev/null
loaded_tree=$(load "$filepath")

validation=$(validate_tree "$loaded_tree")
is_valid=$(echo "$validation" | jq -r '.isValid')
assert_equals "true" "$is_valid" "Loaded tree passes validation"

valid_parents=$(echo "$validation" | jq -r '.validParentReferences')
assert_equals "true" "$valid_parents" "Loaded tree has valid parent references"

is_acyclic=$(echo "$validation" | jq -r '.isAcyclic')
assert_equals "true" "$is_acyclic" "Loaded tree is acyclic"

single_root=$(echo "$validation" | jq -r '.hasSingleRoot')
assert_equals "true" "$single_root" "Loaded tree has single root"
echo

# Test 18: Save overwrites existing file
echo "Test 18: Save overwrites existing file"
tree1=$(init_tree "First Version" "llama2")
message1=$(create_message "user" "First")
result=$(add_node "$tree1" "$message1" "")
tree1=$(echo "$result" | jq -r '.tree')

filepath="${TEST_DIR}/test18.json"
save "$tree1" "$filepath" > /dev/null

# Save different tree to same file
tree2=$(init_tree "Second Version" "gpt-4")
message2=$(create_message "user" "Second")
result=$(add_node "$tree2" "$message2" "")
tree2=$(echo "$result" | jq -r '.tree')

save_result=$(save "$tree2" "$filepath")
assert_equals "success" "$save_result" "Overwrite succeeds"

loaded_tree=$(load "$filepath")
loaded_title=$(echo "$loaded_tree" | jq -r '.metadata.title')
assert_equals "Second Version" "$loaded_title" "File is overwritten with new content"
echo

# Test 19: File permissions remain 600 after overwrite
echo "Test 19: File permissions remain 600 after overwrite"
tree1=$(init_tree "Test" "llama2")
message=$(create_message "user" "Test")
result=$(add_node "$tree1" "$message" "")
tree1=$(echo "$result" | jq -r '.tree')

filepath="${TEST_DIR}/test19.json"
save "$tree1" "$filepath" > /dev/null

# Overwrite
save "$tree1" "$filepath" > /dev/null

assert_file_permissions "$filepath" "600" "Permissions remain 600 after overwrite"
echo

# Test 20: Large tree serialization
echo "Test 20: Large tree serialization"
tree=$(init_tree "Large Tree Test" "llama2")

# Create a conversation with 20 nodes
parent_id=""
for i in {1..20}; do
    role=$( [ $((i % 2)) -eq 1 ] && echo "user" || echo "assistant" )
    message=$(create_message "$role" "Message $i")
    result=$(add_node "$tree" "$message" "$parent_id")
    tree=$(echo "$result" | jq -r '.tree')
    parent_id=$(echo "$result" | jq -r '.nodeId')
done

filepath="${TEST_DIR}/test20.json"
save_result=$(save "$tree" "$filepath")
assert_equals "success" "$save_result" "Large tree saves successfully"

loaded_tree=$(load "$filepath")
original_count=$(echo "$tree" | jq '.nodes | length')
loaded_count=$(echo "$loaded_tree" | jq '.nodes | length')
assert_equals "$original_count" "$loaded_count" "All 20 nodes are preserved"
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
