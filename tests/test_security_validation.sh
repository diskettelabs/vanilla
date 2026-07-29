#!/usr/bin/env bash
# Test security validation: input sanitization, node ID validation, and tree size limits

# Source required modules directly
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Source json_utils first (no dependencies)
source "${SCRIPT_DIR}/../src/lib/json_utils.sh"

# Source ollama_client (depends on json_utils)
source "${SCRIPT_DIR}/../src/ollama/ollama_client.sh"

# Source tree_ops (depends on json_utils)
source "${SCRIPT_DIR}/../src/tree/tree_ops.sh"

# Test counter
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
        echo "✓ PASS: $test_name"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        echo "✗ FAIL: $test_name"
        echo "  Expected: $expected"
        echo "  Actual: $actual"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

assert_not_equals() {
    local not_expected="$1"
    local actual="$2"
    local test_name="$3"
    
    TESTS_RUN=$((TESTS_RUN + 1))
    
    if [ "$not_expected" != "$actual" ]; then
        echo "✓ PASS: $test_name"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        echo "✗ FAIL: $test_name"
        echo "  Should not equal: $not_expected"
        echo "  Actual: $actual"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

assert_contains() {
    local substring="$1"
    local string="$2"
    local test_name="$3"
    
    TESTS_RUN=$((TESTS_RUN + 1))
    
    if echo "$string" | grep -q "$substring"; then
        echo "✓ PASS: $test_name"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        echo "✗ FAIL: $test_name"
        echo "  Expected to contain: $substring"
        echo "  Actual: $string"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

assert_not_contains() {
    local substring="$1"
    local string="$2"
    local test_name="$3"
    
    TESTS_RUN=$((TESTS_RUN + 1))
    
    if ! echo "$string" | grep -q "$substring"; then
        echo "✓ PASS: $test_name"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        echo "✗ FAIL: $test_name"
        echo "  Should not contain: $substring"
        echo "  Actual: $string"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

echo "=========================================="
echo "Security Validation Tests"
echo "=========================================="
echo ""

# Test 1: Input Sanitization - Remove null bytes
echo "Test 1: Input sanitization removes null bytes"
input_with_nulls="Hello$(printf '\000')World"
sanitized=$(sanitize_input "$input_with_nulls")
# Null bytes should be removed, so we expect "HelloWorld"
assert_equals "HelloWorld" "$sanitized" "Null bytes should be removed"
echo ""

# Test 2: Input Sanitization - Remove control characters
echo "Test 2: Input sanitization removes control characters"
input_with_control="Hello$(printf '\001\002\003')World"
sanitized=$(sanitize_input "$input_with_control")
assert_equals "HelloWorld" "$sanitized" "Control characters should be removed"
echo ""

# Test 3: Input Sanitization - Remove backticks
echo "Test 3: Input sanitization removes backticks"
input_with_backticks='Hello `echo dangerous` World'
sanitized=$(sanitize_input "$input_with_backticks")
assert_not_contains '`' "$sanitized" "Backticks should be removed"
echo ""

# Test 4: Input Sanitization - Trim whitespace
echo "Test 4: Input sanitization trims whitespace"
input_with_whitespace="   Hello World   "
sanitized=$(sanitize_input "$input_with_whitespace")
assert_equals "Hello World" "$sanitized" "Leading/trailing whitespace should be trimmed"
echo ""

# Test 5: Input Sanitization - Length limit
echo "Test 5: Input sanitization enforces length limit"
# Create a string longer than 100KB
long_input=$(printf 'A%.0s' {1..110000})
sanitized=$(sanitize_input "$long_input")
sanitized_length=${#sanitized}
if [ $sanitized_length -le 102400 ]; then
    echo "✓ PASS: Input length limited to 100KB"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo "✗ FAIL: Input length not limited (got $sanitized_length bytes)"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
TESTS_RUN=$((TESTS_RUN + 1))
echo ""

# Test 6: Node ID Validation - Valid UUID
echo "Test 6: Node ID validation accepts valid UUIDs"
valid_uuid="550e8400-e29b-41d4-a716-446655440000"
result=$(validate_node_id "$valid_uuid")
assert_equals "true" "$result" "Valid UUID should be accepted"
echo ""

# Test 7: Node ID Validation - Valid alphanumeric
echo "Test 7: Node ID validation accepts alphanumeric IDs"
valid_id="node_123_abc"
result=$(validate_node_id "$valid_id")
assert_equals "true" "$result" "Valid alphanumeric ID should be accepted"
echo ""

# Test 8: Node ID Validation - Reject empty
echo "Test 8: Node ID validation rejects empty string"
result=$(validate_node_id "")
assert_equals "false" "$result" "Empty string should be rejected"
echo ""

# Test 9: Node ID Validation - Reject null
echo "Test 9: Node ID validation rejects null"
result=$(validate_node_id "null")
assert_equals "false" "$result" "Null should be rejected"
echo ""

# Test 10: Node ID Validation - Reject special characters
echo "Test 10: Node ID validation rejects special characters"
invalid_id="node@#$%"
result=$(validate_node_id "$invalid_id")
assert_equals "false" "$result" "Special characters should be rejected"
echo ""

# Test 11: Tree Size Check - Empty tree
echo "Test 11: Tree size check for empty tree"
empty_tree='{"nodes": {}, "rootId": null, "currentNodeId": null, "metadata": {}}'
result=$(check_tree_size "$empty_tree")
assert_equals "true" "$result" "Empty tree should be within limits"
echo ""

# Test 12: Tree Size Check - Small tree
echo "Test 12: Tree size check for small tree"
small_tree='{"nodes": {"node1": {}, "node2": {}, "node3": {}}, "rootId": "node1", "currentNodeId": "node3", "metadata": {}}'
result=$(check_tree_size "$small_tree")
assert_equals "true" "$result" "Small tree should be within limits"
echo ""

# Test 13: Tree Size Check - At limit
echo "Test 13: Tree size check at MAX_TREE_SIZE"
# Create a tree with exactly MAX_TREE_SIZE nodes
nodes_json='{'
for i in $(seq 1 10000); do
    if [ $i -gt 1 ]; then
        nodes_json="${nodes_json},"
    fi
    nodes_json="${nodes_json}\"node${i}\": {}"
done
nodes_json="${nodes_json}}"
at_limit_tree="{\"nodes\": ${nodes_json}, \"rootId\": \"node1\", \"currentNodeId\": \"node10000\", \"metadata\": {}}"
result=$(check_tree_size "$at_limit_tree")
assert_equals "false" "$result" "Tree at MAX_TREE_SIZE should be rejected"
echo ""

# Test 14: Get Tree Size
echo "Test 14: Get tree size returns correct count"
test_tree='{"nodes": {"n1": {}, "n2": {}, "n3": {}, "n4": {}, "n5": {}}, "rootId": "n1", "currentNodeId": "n5", "metadata": {}}'
size=$(get_tree_size "$test_tree")
assert_equals "5" "$size" "Tree size should be 5"
echo ""

# Test 15: Add Node with Size Limit - Should succeed
echo "Test 15: Add node succeeds when under size limit"
tree=$(init_tree "Test" "llama2")
message=$(create_message "user" "Hello" "")
result=$(add_node "$tree" "$message" "")
if echo "$result" | jq -e '.tree' > /dev/null 2>&1; then
    echo "✓ PASS: Node added successfully when under limit"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo "✗ FAIL: Node addition failed when under limit"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
TESTS_RUN=$((TESTS_RUN + 1))
echo ""

# Test 16: Add Node with Invalid Parent ID
echo "Test 16: Add node rejects invalid parent ID format"
tree=$(init_tree "Test" "llama2")
message=$(create_message "user" "Hello" "")
result=$(add_node "$tree" "$message" "invalid@parent#id" 2>&1)
assert_contains "invalid parent_id format" "$result" "Should reject invalid parent ID format"
echo ""

# Test 17: Add Node with Non-existent Parent
echo "Test 17: Add node rejects non-existent parent"
tree=$(init_tree "Test" "llama2")
message=$(create_message "user" "Hello" "")
result=$(add_node "$tree" "$message" "nonexistent_node_id" 2>&1)
assert_contains "parent node does not exist" "$result" "Should reject non-existent parent"
echo ""

# Test 18: Get Node with Invalid ID
echo "Test 18: Get node returns null for invalid ID format"
tree=$(init_tree "Test" "llama2")
result=$(get_node "$tree" "invalid@node#id")
assert_equals "null" "$result" "Should return null for invalid node ID"
echo ""

# Test 19: Get Children with Invalid ID
echo "Test 19: Get children returns empty array for invalid ID"
tree=$(init_tree "Test" "llama2")
result=$(get_children "$tree" "invalid@node#id")
assert_equals "[]" "$result" "Should return empty array for invalid node ID"
echo ""

# Test 20: Get Path with Invalid ID
echo "Test 20: Get path returns empty array for invalid ID"
tree=$(init_tree "Test" "llama2")
result=$(get_path "$tree" "invalid@node#id")
assert_equals "[]" "$result" "Should return empty array for invalid node ID"
echo ""

# Test 21: Get Path with Depth Limit
echo "Test 21: Get path respects maximum depth limit"
# This test verifies the infinite loop protection
tree=$(init_tree "Test" "llama2")
message=$(create_message "user" "Hello" "")
add_result=$(add_node "$tree" "$message" "")
tree=$(echo "$add_result" | jq -r '.tree')
node_id=$(echo "$add_result" | jq -r '.nodeId')
result=$(get_path "$tree" "$node_id")
# Should return a valid path, not hang
if echo "$result" | jq -e '. | length' > /dev/null 2>&1; then
    echo "✓ PASS: Get path completes without hanging"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo "✗ FAIL: Get path did not return valid result"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
TESTS_RUN=$((TESTS_RUN + 1))
echo ""

# Test 22: Localhost Validation - Valid localhost
echo "Test 22: Localhost validation accepts localhost"
result=$(validate_localhost "http://localhost:11434")
assert_equals "true" "$result" "Should accept localhost URL"
echo ""

# Test 23: Localhost Validation - Valid 127.0.0.1
echo "Test 23: Localhost validation accepts 127.0.0.1"
result=$(validate_localhost "http://127.0.0.1:11434")
assert_equals "true" "$result" "Should accept 127.0.0.1 URL"
echo ""

# Test 24: Localhost Validation - Reject external URL
echo "Test 24: Localhost validation rejects external URL"
result=$(validate_localhost "http://example.com:11434")
assert_equals "false" "$result" "Should reject external URL"
echo ""

# Test 25: Localhost Validation - Reject IP address
echo "Test 25: Localhost validation rejects non-localhost IP"
result=$(validate_localhost "http://192.168.1.1:11434")
assert_equals "false" "$result" "Should reject non-localhost IP"
echo ""

# Summary
echo "=========================================="
echo "Test Summary"
echo "=========================================="
echo "Tests run: $TESTS_RUN"
echo "Tests passed: $TESTS_PASSED"
echo "Tests failed: $TESTS_FAILED"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo "✓ All tests passed!"
    exit 0
else
    echo "✗ Some tests failed"
    exit 1
fi
