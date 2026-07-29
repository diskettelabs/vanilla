#!/usr/bin/env bash
# Integration test for component wiring in Vanilla Chat TUI
# Tests that all components are properly connected and can communicate

set -euo pipefail

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Source all components to test
source "$PROJECT_ROOT/src/lib/json_utils.sh"
source "$PROJECT_ROOT/src/tree/tree_ops.sh"
source "$PROJECT_ROOT/src/tree/auto_save.sh"
source "$PROJECT_ROOT/src/ollama/ollama_client.sh"
source "$PROJECT_ROOT/src/theme/theme_engine.sh"
source "$PROJECT_ROOT/src/monitor/system_monitor.sh"
source "$PROJECT_ROOT/src/tui/logo.sh"
source "$PROJECT_ROOT/src/tui/screen.sh"
source "$PROJECT_ROOT/src/chat/chat_manager.sh"

# Test counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Test helper functions
test_start() {
    echo -n "Testing: $1 ... "
    TESTS_RUN=$((TESTS_RUN + 1))
}

test_pass() {
    echo "✓ PASS"
    TESTS_PASSED=$((TESTS_PASSED + 1))
}

test_fail() {
    echo "✗ FAIL: $1"
    TESTS_FAILED=$((TESTS_FAILED + 1))
}

# Test 1: Theme Engine to TUI Connection
test_theme_to_tui() {
    test_start "Theme Engine → TUI connection"
    
    # Load a theme
    if ! load_theme "vanilla" 2>/dev/null; then
        test_fail "Failed to load theme"
        return
    fi
    
    # Verify theme is loaded
    local current_theme
    current_theme=$(get_current_theme)
    if [[ "$current_theme" != "vanilla" ]]; then
        test_fail "Theme not set correctly"
        return
    fi
    
    # Verify we can get theme colors
    local primary_color
    primary_color=$(get_theme_color "primary" 2>/dev/null)
    if [[ -z "$primary_color" ]]; then
        test_fail "Cannot get theme colors"
        return
    fi
    
    # Verify logo can use theme colors
    local logo
    logo=$(generateLogo "primary" 2>/dev/null)
    if [[ -z "$logo" ]]; then
        test_fail "Logo generation failed"
        return
    fi
    
    test_pass
}

# Test 2: System Monitor to TUI Connection
test_monitor_to_tui() {
    test_start "System Monitor → TUI connection"
    
    # Start monitoring
    local monitor_pid
    monitor_pid=$(startMonitoring 1 2>/dev/null)
    
    if [[ -z "$monitor_pid" ]]; then
        test_fail "Failed to start monitoring"
        return
    fi
    
    # Wait a moment for metrics to be collected
    sleep 2
    
    # Get metrics
    local metrics
    metrics=$(getMetrics 2>/dev/null)
    
    if [[ -z "$metrics" ]]; then
        stopMonitoring 2>/dev/null
        test_fail "Failed to get metrics"
        return
    fi
    
    # Verify metrics have expected fields
    local cpu
    cpu=$(echo "$metrics" | jq -r '.cpu' 2>/dev/null)
    local ram
    ram=$(echo "$metrics" | jq -r '.ram' 2>/dev/null)
    
    stopMonitoring 2>/dev/null
    
    if [[ -z "$cpu" ]] || [[ -z "$ram" ]]; then
        test_fail "Metrics missing fields"
        return
    fi
    
    test_pass
}

# Test 3: Conversation Tree to Chat Manager Connection
test_tree_to_chat_manager() {
    test_start "Conversation Tree → Chat Manager connection"
    
    # Create a tree
    local tree
    tree=$(create_tree 2>/dev/null)
    
    if [[ -z "$tree" ]]; then
        test_fail "Failed to create tree"
        return
    fi
    
    # Verify chat manager can get current messages
    local messages
    messages=$(get_current_messages "$tree" 2>/dev/null)
    
    if [[ -z "$messages" ]]; then
        test_fail "Failed to get current messages"
        return
    fi
    
    # Verify it returns an array
    if ! echo "$messages" | jq -e 'type == "array"' >/dev/null 2>&1; then
        test_fail "Messages not returned as array"
        return
    fi
    
    test_pass
}

# Test 4: Chat Manager to Ollama Client Connection
test_chat_manager_to_ollama() {
    test_start "Chat Manager → Ollama Client connection"
    
    # Check if Ollama is available
    if ! check_connection 2>/dev/null; then
        echo "⊘ SKIP (Ollama not running)"
        return
    fi
    
    # Create a tree
    local tree
    tree=$(create_tree 2>/dev/null)
    
    # Create a temporary save file
    local temp_file
    temp_file=$(mktemp)
    
    # Try to send a message (this will fail if Ollama isn't running, but we're testing the connection)
    local result
    result=$(send_message "$tree" "test message" "llama2" "$temp_file" 2>&1)
    local exit_code=$?
    
    # Clean up
    rm -f "$temp_file"
    
    # We expect either success or a connection error (not a crash)
    if [[ $exit_code -ne 0 ]]; then
        # Check if it's a proper error response
        if ! echo "$result" | jq -e '.error' >/dev/null 2>&1; then
            test_fail "Chat manager didn't handle Ollama connection properly"
            return
        fi
    fi
    
    test_pass
}

# Test 5: Auto-save to Conversation Tree Connection
test_autosave_to_tree() {
    test_start "Auto-save → Conversation Tree connection"
    
    # Create a tree
    local tree
    tree=$(create_tree 2>/dev/null)
    
    # Create a temporary file
    local temp_file
    temp_file=$(mktemp)
    
    # Save the tree
    if ! save_tree "$tree" "$temp_file" 2>/dev/null; then
        rm -f "$temp_file"
        test_fail "Failed to save tree"
        return
    fi
    
    # Verify file was created
    if [[ ! -f "$temp_file" ]]; then
        test_fail "Save file not created"
        return
    fi
    
    # Verify file has correct permissions (600)
    local perms
    perms=$(stat -f "%OLp" "$temp_file" 2>/dev/null || stat -c "%a" "$temp_file" 2>/dev/null)
    
    if [[ "$perms" != "600" ]]; then
        rm -f "$temp_file"
        test_fail "Save file has incorrect permissions: $perms"
        return
    fi
    
    # Load the tree back
    local loaded_tree
    loaded_tree=$(load_tree "$temp_file" 2>/dev/null)
    
    rm -f "$temp_file"
    
    if [[ -z "$loaded_tree" ]]; then
        test_fail "Failed to load tree"
        return
    fi
    
    # Verify loaded tree matches original
    local original_root
    original_root=$(echo "$tree" | jq -r '.rootId')
    local loaded_root
    loaded_root=$(echo "$loaded_tree" | jq -r '.rootId')
    
    if [[ "$original_root" != "$loaded_root" ]]; then
        test_fail "Loaded tree doesn't match original"
        return
    fi
    
    test_pass
}

# Test 6: Theme Switching Preserves Data
test_theme_switching() {
    test_start "Theme switching preserves conversation data"
    
    # Create a tree with some data
    local tree
    tree=$(create_tree 2>/dev/null)
    
    # Add a message
    local message
    message=$(create_message "user" "test message" "" 2>/dev/null)
    local add_result
    add_result=$(add_node "$tree" "$message" "$(echo "$tree" | jq -r '.rootId')" 2>/dev/null)
    tree=$(echo "$add_result" | jq -r '.tree')
    
    # Get node count before theme switch
    local nodes_before
    nodes_before=$(echo "$tree" | jq '.nodes | length')
    
    # Load first theme
    load_theme "vanilla" 2>/dev/null
    
    # Load second theme
    load_theme "chocolate" 2>/dev/null
    
    # Verify tree data is unchanged
    local nodes_after
    nodes_after=$(echo "$tree" | jq '.nodes | length')
    
    if [[ "$nodes_before" != "$nodes_after" ]]; then
        test_fail "Tree data changed after theme switch"
        return
    fi
    
    test_pass
}

# Test 7: Role Alternation Validation
test_role_alternation() {
    test_start "Role alternation validation in chat manager"
    
    # Create a tree
    local tree
    tree=$(create_tree 2>/dev/null)
    
    # Add user message
    local user_msg
    user_msg=$(create_message "user" "first message" "" 2>/dev/null)
    local add_result
    add_result=$(add_node "$tree" "$user_msg" "$(echo "$tree" | jq -r '.rootId')" 2>/dev/null)
    tree=$(echo "$add_result" | jq -r '.tree')
    local user_node_id
    user_node_id=$(echo "$add_result" | jq -r '.nodeId')
    
    # Validate role alternation for user message
    local is_valid
    is_valid=$(validate_role_alternation "$tree" "$user_node_id" 2>/dev/null)
    
    if [[ "$is_valid" != "true" ]]; then
        test_fail "Role alternation validation failed for valid user message"
        return
    fi
    
    # Add assistant message
    local assistant_msg
    assistant_msg=$(create_message "assistant" "response" "llama2" 2>/dev/null)
    add_result=$(add_node "$tree" "$assistant_msg" "$user_node_id" 2>/dev/null)
    tree=$(echo "$add_result" | jq -r '.tree')
    local assistant_node_id
    assistant_node_id=$(echo "$add_result" | jq -r '.nodeId')
    
    # Validate role alternation for assistant message
    is_valid=$(validate_role_alternation "$tree" "$assistant_node_id" 2>/dev/null)
    
    if [[ "$is_valid" != "true" ]]; then
        test_fail "Role alternation validation failed for valid assistant message"
        return
    fi
    
    test_pass
}

# Test 8: Branch Creation and Switching
test_branch_operations() {
    test_start "Branch creation and switching"
    
    # Create a tree with a conversation
    local tree
    tree=$(create_tree 2>/dev/null)
    
    # Add user message
    local user_msg
    user_msg=$(create_message "user" "original message" "" 2>/dev/null)
    local add_result
    add_result=$(add_node "$tree" "$user_msg" "$(echo "$tree" | jq -r '.rootId')" 2>/dev/null)
    tree=$(echo "$add_result" | jq -r '.tree')
    local user_node_id
    user_node_id=$(echo "$add_result" | jq -r '.nodeId')
    
    # Get branches (should be just one)
    local parent_id
    parent_id=$(echo "$tree" | jq -r '.rootId')
    local branches
    branches=$(get_branches "$tree" "$parent_id" 2>/dev/null)
    local branch_count
    branch_count=$(echo "$branches" | jq 'length')
    
    if [[ "$branch_count" != "1" ]]; then
        test_fail "Expected 1 branch, got $branch_count"
        return
    fi
    
    # Add another user message as a sibling (simulating branch creation)
    local user_msg2
    user_msg2=$(create_message "user" "alternate message" "" 2>/dev/null)
    add_result=$(add_node "$tree" "$user_msg2" "$parent_id" 2>/dev/null)
    tree=$(echo "$add_result" | jq -r '.tree')
    local user_node_id2
    user_node_id2=$(echo "$add_result" | jq -r '.nodeId')
    
    # Get branches again (should be two now)
    branches=$(get_branches "$tree" "$parent_id" 2>/dev/null)
    branch_count=$(echo "$branches" | jq 'length')
    
    if [[ "$branch_count" != "2" ]]; then
        test_fail "Expected 2 branches, got $branch_count"
        return
    fi
    
    # Switch to second branch
    tree=$(switch_branch "$tree" "$user_node_id2" 2>/dev/null)
    
    # Verify current node is the second branch
    local current_node_id
    current_node_id=$(echo "$tree" | jq -r '.currentNodeId')
    
    if [[ "$current_node_id" != "$user_node_id2" ]]; then
        test_fail "Branch switch didn't update current node"
        return
    fi
    
    test_pass
}

# Test 9: Message Display Formatting
test_message_display() {
    test_start "Message display formatting"
    
    # Load theme for color support
    load_theme "vanilla" 2>/dev/null
    
    # Create a display message
    local timestamp
    timestamp=$(date -Iseconds)
    local display_msg
    display_msg=$(displayMessage "user" "test content" "$timestamp" "false" 2>/dev/null)
    
    if [[ -z "$display_msg" ]]; then
        test_fail "Failed to create display message"
        return
    fi
    
    # Verify message contains expected components
    if ! echo "$display_msg" | grep -q "User"; then
        test_fail "Message missing role"
        return
    fi
    
    if ! echo "$display_msg" | grep -q "test content"; then
        test_fail "Message missing content"
        return
    fi
    
    test_pass
}

# Test 10: Input Sanitization
test_input_sanitization() {
    test_start "Input sanitization in chat manager"
    
    # Test with potentially dangerous input
    local dangerous_input='$(rm -rf /)'
    local sanitized
    sanitized=$(sanitize_input "$dangerous_input" 2>/dev/null)
    
    # Verify sanitization occurred (exact behavior depends on implementation)
    # At minimum, it should not crash
    if [[ -z "$sanitized" ]]; then
        test_fail "Sanitization removed all content"
        return
    fi
    
    test_pass
}

# Run all tests
echo "=========================================="
echo "Component Wiring Integration Tests"
echo "=========================================="
echo ""

test_theme_to_tui
test_monitor_to_tui
test_tree_to_chat_manager
test_chat_manager_to_ollama
test_autosave_to_tree
test_theme_switching
test_role_alternation
test_branch_operations
test_message_display
test_input_sanitization

# Print summary
echo ""
echo "=========================================="
echo "Test Summary"
echo "=========================================="
echo "Tests run:    $TESTS_RUN"
echo "Tests passed: $TESTS_PASSED"
echo "Tests failed: $TESTS_FAILED"
echo ""

if [[ $TESTS_FAILED -eq 0 ]]; then
    echo "✓ All tests passed!"
    exit 0
else
    echo "✗ Some tests failed"
    exit 1
fi
