#!/usr/bin/env bash
# Tests for tree corruption handling (Task 17.3)

# Get absolute paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Source required modules in correct order
source "${PROJECT_ROOT}/src/lib/json_utils.sh"
source "${PROJECT_ROOT}/src/tree/tree_ops.sh"
source "${PROJECT_ROOT}/src/lib/error_recovery.sh"

# Test counter
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Test helper functions
pass() {
    echo "  ✓ $1"
    TESTS_PASSED=$((TESTS_PASSED + 1))
}

fail() {
    echo "  ✗ $1"
    TESTS_FAILED=$((TESTS_FAILED + 1))
}

run_test() {
    echo "Running: $1"
    TESTS_RUN=$((TESTS_RUN + 1))
}

# Create temporary directory for test files
TEST_DIR=$(mktemp -d)
trap "rm -rf $TEST_DIR" EXIT

# Test 1: Detect corrupted file with invalid JSON
run_test "handle_tree_corruption() detects invalid JSON"
temp_file="${TEST_DIR}/invalid_json.json"
echo '{"nodes": {, "invalid": }' > "$temp_file"

result=$(handle_tree_corruption "$temp_file")
error=$(echo "$result" | jq -r '.error')
backup_created=$(echo "$result" | jq -r '.backupCreated')

if [ "$error" = "invalid JSON structure" ] && [ "$backup_created" = "true" ]; then
    pass "Invalid JSON detected and backup created"
else
    fail "Invalid JSON not properly detected (error: $error, backup: $backup_created)"
fi

# Test 2: Detect empty file
run_test "handle_tree_corruption() detects empty file"
temp_file="${TEST_DIR}/empty.json"
touch "$temp_file"

result=$(handle_tree_corruption "$temp_file")
error=$(echo "$result" | jq -r '.error')
can_recover=$(echo "$result" | jq -r '.canRecover')

if [ "$error" = "file is empty or unreadable" ] && [ "$can_recover" = "false" ]; then
    pass "Empty file detected"
else
    fail "Empty file not properly detected"
fi

# Test 3: Salvage valid nodes from corrupted tree
run_test "handle_tree_corruption() salvages valid nodes"
# Create a valid tree first
tree=$(init_tree "Test" "llama2")
message=$(create_message "user" "Hello" "")
add_result=$(add_node "$tree" "$message" "")
tree=$(echo "$add_result" | jq -r '.tree')

# Write to file and then corrupt it by removing rootId
temp_file="${TEST_DIR}/corrupted_tree.json"
echo "$tree" | jq 'del(.rootId)' > "$temp_file"

result=$(handle_tree_corruption "$temp_file")
can_recover=$(echo "$result" | jq -r '.canRecover')
salvaged_count=$(echo "$result" | jq -r '.salvagedNodeCount // 0')

if [ "$can_recover" = "true" ] && [ "$salvaged_count" -gt 0 ]; then
    pass "Valid nodes salvaged (count: $salvaged_count)"
else
    fail "Failed to salvage valid nodes"
fi

# Test 4: Create backup of corrupted file
run_test "handle_tree_corruption() creates backup"
temp_file="${TEST_DIR}/backup_test.json"
echo '{"nodes": {}}' > "$temp_file"

result=$(handle_tree_corruption "$temp_file")
backup_path=$(echo "$result" | jq -r '.backupPath')
backup_created=$(echo "$result" | jq -r '.backupCreated')

if [ "$backup_created" = "true" ] && [ -f "$backup_path" ]; then
    pass "Backup created at $backup_path"
else
    fail "Backup not created"
fi

# Test 5: load() creates backup on corruption
run_test "load() creates backup when tree is corrupted"
temp_file="${TEST_DIR}/load_corrupt.json"
echo '{"nodes": {}, "rootId": "nonexistent"}' > "$temp_file"

result=$(load "$temp_file" 2>&1)
if echo "$result" | grep -q "error"; then
    # Check if backup was created
    backup_count=$(ls -1 "${temp_file}.corrupted."* 2>/dev/null | wc -l)
    if [ "$backup_count" -gt 0 ]; then
        pass "Backup created by load() for corrupted tree"
    else
        fail "No backup created by load()"
    fi
else
    fail "Corrupted tree loaded without error"
fi

# Test 6: load() succeeds with valid tree
run_test "load() succeeds with valid tree"
temp_file="${TEST_DIR}/valid_tree.json"
tree=$(init_tree "Valid Test" "llama2")
message=$(create_message "user" "Test message" "")
add_result=$(add_node "$tree" "$message" "")
tree=$(echo "$add_result" | jq -r '.tree')
echo "$tree" > "$temp_file"

loaded_tree=$(load "$temp_file")
if ! echo "$loaded_tree" | grep -q "^error:"; then
    title=$(echo "$loaded_tree" | jq -r '.metadata.title')
    if [ "$title" = "Valid Test" ]; then
        pass "Valid tree loaded successfully"
    else
        fail "Tree loaded but data incorrect"
    fi
else
    fail "Failed to load valid tree: $loaded_tree"
fi

# Test 7: load_with_recovery() provides recovery options
run_test "load_with_recovery() provides recovery information"
temp_file="${TEST_DIR}/recovery_test.json"
echo '{"nodes": {}, "rootId": null}' > "$temp_file"

result=$(load_with_recovery "$temp_file")
success=$(echo "$result" | jq -r '.success')
needs_recovery=$(echo "$result" | jq -r '.needsRecovery')

if [ "$success" = "false" ] && [ "$needs_recovery" = "true" ]; then
    pass "Recovery information provided"
else
    fail "Recovery information not provided correctly"
fi

# Test 8: Salvage tree with multiple nodes
run_test "salvage_tree() recovers multiple nodes"
# Create a tree with multiple messages
tree=$(init_tree "Multi-node Test" "llama2")
message1=$(create_message "user" "First message" "")
add_result=$(add_node "$tree" "$message1" "")
tree=$(echo "$add_result" | jq -r '.tree')
node1_id=$(echo "$add_result" | jq -r '.nodeId')

message2=$(create_message "assistant" "First response" "llama2")
add_result=$(add_node "$tree" "$message2" "$node1_id")
tree=$(echo "$add_result" | jq -r '.tree')

# Corrupt by removing currentNodeId
corrupted_tree=$(echo "$tree" | jq 'del(.currentNodeId)')

salvaged=$(salvage_tree "$corrupted_tree")
if ! echo "$salvaged" | grep -q "^error:"; then
    node_count=$(echo "$salvaged" | jq '.nodes | length')
    if [ "$node_count" -ge 2 ]; then
        pass "Multiple nodes salvaged (count: $node_count)"
    else
        fail "Not all nodes salvaged (count: $node_count)"
    fi
else
    fail "Failed to salvage multi-node tree"
fi

# Test 9: Display corruption message formatting
run_test "display_corruption_message() formats output correctly"
temp_file="${TEST_DIR}/display_test.json"
echo '{"invalid": "json"' > "$temp_file"

result=$(handle_tree_corruption "$temp_file")
message=$(display_corruption_message "$result")

if echo "$message" | grep -q "Conversation File Corrupted" && \
   echo "$message" | grep -q "Recovery options"; then
    pass "Corruption message formatted correctly"
else
    fail "Corruption message not formatted correctly"
fi

# Test 10: Validate and repair tree with missing fields
run_test "validate_and_repair_tree() repairs missing fields"
# Create a tree with missing currentNodeId
tree=$(init_tree "Repair Test" "llama2")
message=$(create_message "user" "Test" "")
add_result=$(add_node "$tree" "$message" "")
tree=$(echo "$add_result" | jq -r '.tree')

# Remove currentNodeId
broken_tree=$(echo "$tree" | jq 'del(.currentNodeId)')

repaired=$(validate_and_repair_tree "$broken_tree" 2>/dev/null)
has_current=$(echo "$repaired" | jq -e '.currentNodeId' >/dev/null 2>&1 && echo "true" || echo "false")

if [ "$has_current" = "true" ]; then
    pass "Tree repaired with missing currentNodeId"
else
    fail "Tree not repaired"
fi

# Test 11: Handle tree with missing metadata
run_test "validate_and_repair_tree() adds missing metadata"
tree=$(init_tree "Metadata Test" "llama2")
message=$(create_message "user" "Test" "")
add_result=$(add_node "$tree" "$message" "")
tree=$(echo "$add_result" | jq -r '.tree')

# Remove metadata
broken_tree=$(echo "$tree" | jq 'del(.metadata)')

repaired=$(validate_and_repair_tree "$broken_tree" 2>/dev/null)
has_metadata=$(echo "$repaired" | jq -e '.metadata' >/dev/null 2>&1 && echo "true" || echo "false")

if [ "$has_metadata" = "true" ]; then
    title=$(echo "$repaired" | jq -r '.metadata.title')
    if [ "$title" = "Recovered Conversation" ]; then
        pass "Metadata added with default values"
    else
        fail "Metadata added but incorrect values"
    fi
else
    fail "Metadata not added"
fi

# Test 12: Unsalvageable tree returns error
run_test "salvage_tree() returns error for unsalvageable tree"
# Create a tree with no valid nodes
broken_tree='{"nodes": {}, "rootId": null}'

result=$(salvage_tree "$broken_tree" 2>&1)
if echo "$result" | grep -q "^error:"; then
    pass "Unsalvageable tree detected"
else
    fail "Unsalvageable tree not detected"
fi

# Print summary
echo ""
echo "================================"
echo "Test Summary"
echo "================================"
echo "Tests run:    $TESTS_RUN"
echo "Tests passed: $TESTS_PASSED"
echo "Tests failed: $TESTS_FAILED"
echo "================================"

if [ $TESTS_FAILED -eq 0 ]; then
    echo "✓ All tests passed!"
    exit 0
else
    echo "✗ Some tests failed"
    exit 1
fi
