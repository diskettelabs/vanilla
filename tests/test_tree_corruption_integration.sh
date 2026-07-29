#!/usr/bin/env bash
# Integration test for tree corruption handling in real-world scenarios

# Get absolute paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Source required modules
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

# Create temporary directory
TEST_DIR=$(mktemp -d)
trap "rm -rf $TEST_DIR" EXIT

# Integration Test 1: Complete save/load/corrupt/recover cycle
run_test "Complete conversation lifecycle with corruption recovery"

# Step 1: Create and save a conversation
conversation_file="${TEST_DIR}/conversation.json"
tree=$(init_tree "My Conversation" "llama2")

# Add several messages
message1=$(create_message "user" "Hello, how are you?" "")
add_result=$(add_node "$tree" "$message1" "")
tree=$(echo "$add_result" | jq -r '.tree')
node1_id=$(echo "$add_result" | jq -r '.nodeId')

message2=$(create_message "assistant" "I'm doing well, thank you!" "llama2")
add_result=$(add_node "$tree" "$message2" "$node1_id")
tree=$(echo "$add_result" | jq -r '.tree')
node2_id=$(echo "$add_result" | jq -r '.nodeId')

message3=$(create_message "user" "What's the weather like?" "")
add_result=$(add_node "$tree" "$message3" "$node2_id")
tree=$(echo "$add_result" | jq -r '.tree')

# Save the conversation
save_result=$(save "$tree" "$conversation_file")
if [ "$save_result" = "success" ]; then
    pass "Conversation saved successfully"
else
    fail "Failed to save conversation"
fi

# Step 2: Verify it loads correctly
loaded_tree=$(load "$conversation_file")
if ! echo "$loaded_tree" | grep -q "^error:"; then
    node_count=$(echo "$loaded_tree" | jq '.nodes | length')
    if [ "$node_count" -eq 3 ]; then
        pass "Conversation loaded with all 3 messages"
    else
        fail "Loaded conversation has wrong node count: $node_count"
    fi
else
    fail "Failed to load conversation"
fi

# Step 3: Simulate corruption (remove all nodes but keep rootId)
echo "$tree" | jq '.nodes = {}' > "$conversation_file"

# Step 4: Attempt to load corrupted file
loaded_tree=$(load "$conversation_file" 2>&1)
if echo "$loaded_tree" | grep -q "^error:"; then
    if echo "$loaded_tree" | grep -q "backup created"; then
        pass "Corrupted file detected and backup created"
    else
        fail "Backup not created for corrupted file"
    fi
else
    fail "Corrupted file loaded without error"
fi

# Step 5: Use recovery function
recovery_result=$(load_with_recovery "$conversation_file")
needs_recovery=$(echo "$recovery_result" | jq -r '.needsRecovery')
can_recover=$(echo "$recovery_result" | jq -r '.canRecover')

if [ "$needs_recovery" = "true" ]; then
    pass "Recovery needed flag set correctly"
    
    # With no nodes, recovery won't be possible
    if [ "$can_recover" = "false" ]; then
        pass "Correctly identified unsalvageable corruption (no nodes)"
    else
        fail "Should not be able to recover with no nodes"
    fi
else
    fail "Recovery needed flag not set"
fi

# Integration Test 2: Partial corruption with data loss
run_test "Partial corruption with some data loss"

partial_file="${TEST_DIR}/partial.json"
# Create a tree with invalid node references
corrupted_tree=$(echo "$tree" | jq '.nodes["fake-id"] = {
    "id": "fake-id",
    "message": {"role": "user", "content": "Invalid"},
    "parentId": "nonexistent-parent",
    "children": [],
    "isActive": true
}')
echo "$corrupted_tree" > "$partial_file"

# Try to load
loaded=$(load "$partial_file" 2>&1)
if echo "$loaded" | grep -q "^error:"; then
    pass "Detected tree with invalid references"
    
    # Check backup was created
    backup_count=$(ls -1 "${partial_file}.corrupted."* 2>/dev/null | wc -l)
    if [ "$backup_count" -gt 0 ]; then
        pass "Backup created for partially corrupted tree"
    else
        fail "No backup created"
    fi
else
    fail "Invalid references not detected"
fi

# Integration Test 3: Multiple corruption attempts
run_test "Multiple corruption recovery attempts"

multi_file="${TEST_DIR}/multi.json"
echo "$tree" > "$multi_file"

# First corruption
echo "$tree" | jq 'del(.rootId)' > "$multi_file"
result1=$(handle_tree_corruption "$multi_file")
backup1=$(echo "$result1" | jq -r '.backupPath')

# Small delay to ensure different timestamp
sleep 1

# Second corruption (different type)
echo "$tree" | jq 'del(.metadata)' > "$multi_file"
result2=$(handle_tree_corruption "$multi_file")
backup2=$(echo "$result2" | jq -r '.backupPath')

# Verify different backups created
if [ "$backup1" != "$backup2" ]; then
    if [ -f "$backup1" ] || [ -f "$backup2" ]; then
        pass "Multiple backups created with unique timestamps"
    else
        fail "Backups not found: $backup1, $backup2"
    fi
else
    fail "Backup collision: $backup1 == $backup2"
fi

# Integration Test 4: Recovery with automatic repair
run_test "Automatic repair of minor corruption"

choice_file="${TEST_DIR}/choice.json"
# Create a corruption that CAN be auto-repaired - remove rootId but keep nodes
# The validate_and_repair_tree function will fix this automatically
echo "$tree" | jq 'del(.rootId) | del(.currentNodeId)' > "$choice_file"

# Try to load - should succeed with automatic repair
recovery=$(load_with_recovery "$choice_file")
success=$(echo "$recovery" | jq -r '.success')
needs_recovery=$(echo "$recovery" | jq -r '.needsRecovery')

if [ "$success" = "true" ] && [ "$needs_recovery" = "false" ]; then
    pass "Minor corruption auto-repaired successfully"
    
    # Verify the repaired tree is valid
    repaired_tree=$(echo "$recovery" | jq -r '.tree')
    has_root=$(echo "$repaired_tree" | jq -e '.rootId' >/dev/null 2>&1 && echo "true" || echo "false")
    has_current=$(echo "$repaired_tree" | jq -e '.currentNodeId' >/dev/null 2>&1 && echo "true" || echo "false")
    
    if [ "$has_root" = "true" ] && [ "$has_current" = "true" ]; then
        pass "Repaired tree has all required fields"
    else
        fail "Repaired tree missing fields"
    fi
else
    fail "Auto-repair failed for minor corruption"
fi

# Integration Test 5: Graceful degradation
run_test "Graceful degradation with completely corrupted file"

bad_file="${TEST_DIR}/completely_bad.json"
echo "This is not JSON at all!" > "$bad_file"

recovery=$(load_with_recovery "$bad_file")
success=$(echo "$recovery" | jq -r '.success')
options=$(echo "$recovery" | jq -r '.options[]')

if [ "$success" = "false" ]; then
    pass "Completely corrupted file rejected"
    
    if echo "$options" | grep -q "create_new"; then
        pass "Create new conversation option provided"
        
        # Simulate creating new conversation
        new_tree=$(init_tree "New Conversation" "llama2")
        new_file="${TEST_DIR}/new.json"
        save_result=$(save "$new_tree" "$new_file")
        
        if [ "$save_result" = "success" ]; then
            pass "New conversation created successfully"
        else
            fail "Failed to create new conversation"
        fi
    else
        fail "Create new option not provided"
    fi
else
    fail "Completely corrupted file not rejected"
fi

# Print summary
echo ""
echo "================================"
echo "Integration Test Summary"
echo "================================"
echo "Tests run:    $TESTS_RUN"
echo "Tests passed: $TESTS_PASSED"
echo "Tests failed: $TESTS_FAILED"
echo "================================"

if [ $TESTS_FAILED -eq 0 ]; then
    echo "✓ All integration tests passed!"
    exit 0
else
    echo "✗ Some integration tests failed"
    exit 1
fi
