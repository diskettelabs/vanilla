#!/usr/bin/env bash
# Unit tests for main application loop orchestration

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Source the main script functions (but don't run main)
# We'll source individual components instead to test integration
source "$PROJECT_ROOT/src/tui/screen.sh"
source "$PROJECT_ROOT/src/chat/chat_manager.sh"
source "$PROJECT_ROOT/src/tree/tree_ops.sh"
source "$PROJECT_ROOT/src/theme/theme_engine.sh"
source "$PROJECT_ROOT/src/monitor/system_monitor.sh"

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
    
    if [[ "$expected" == "$actual" ]]; then
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

assert_not_empty() {
    local value="$1"
    local test_name="$2"
    
    TESTS_RUN=$((TESTS_RUN + 1))
    
    if [[ -n "$value" ]]; then
        echo "✓ PASS: $test_name"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        echo "✗ FAIL: $test_name"
        echo "  Value is empty"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

assert_success() {
    local exit_code="$1"
    local test_name="$2"
    
    TESTS_RUN=$((TESTS_RUN + 1))
    
    if [[ $exit_code -eq 0 ]]; then
        echo "✓ PASS: $test_name"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        echo "✗ FAIL: $test_name"
        echo "  Exit code: $exit_code"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

# Test 1: Theme initialization
test_theme_initialization() {
    echo "Test 1: Theme initialization"
    
    # Load vanilla theme
    load_theme "vanilla"
    local exit_code=$?
    assert_success $exit_code "Theme loads successfully"
    
    # Verify theme is loaded
    local current_theme=$(get_current_theme)
    assert_equals "vanilla" "$current_theme" "Current theme is set correctly"
    
    # Get theme colors
    local primary_color=$(get_theme_color "primary")
    assert_not_empty "$primary_color" "Primary color is available"
}

# Test 2: System monitor initialization
test_system_monitor_initialization() {
    echo ""
    echo "Test 2: System monitor initialization"
    
    # Start monitoring
    local monitor_pid=$(startMonitoring 1)
    assert_not_empty "$monitor_pid" "System monitor starts successfully"
    
    # Wait a moment for metrics to be collected
    sleep 2
    
    # Get metrics
    local metrics=$(getMetrics)
    assert_not_empty "$metrics" "Metrics are available"
    
    # Verify metrics have expected fields
    local cpu=$(echo "$metrics" | jq -r '.cpu')
    local ram=$(echo "$metrics" | jq -r '.ram')
    assert_not_empty "$cpu" "CPU metric is available"
    assert_not_empty "$ram" "RAM metric is available"
    
    # Stop monitoring
    stopMonitoring
}

# Test 3: Conversation tree initialization
test_conversation_tree_initialization() {
    echo ""
    echo "Test 3: Conversation tree initialization"
    
    # Create new tree
    local tree=$(create_tree)
    assert_not_empty "$tree" "Tree is created"
    
    # Verify tree structure
    local root_id=$(echo "$tree" | jq -r '.rootId')
    assert_not_empty "$root_id" "Root ID is set"
    
    local current_node_id=$(echo "$tree" | jq -r '.currentNodeId')
    assert_equals "$root_id" "$current_node_id" "Current node is root"
    
    # Validate tree
    local is_valid=$(validate_tree "$tree")
    assert_equals "true" "$is_valid" "Tree is valid"
}

# Test 4: Component integration
test_component_integration() {
    echo ""
    echo "Test 4: Component integration"
    
    # Load theme
    load_theme "chocolate"
    local theme=$(get_current_theme)
    assert_equals "chocolate" "$theme" "Theme loads for integration test"
    
    # Create tree
    local tree=$(create_tree)
    assert_not_empty "$tree" "Tree creates for integration test"
    
    # Get theme color and apply to text
    local primary=$(get_theme_color "primary")
    assert_not_empty "$primary" "Primary color available for integration"
    
    # Convert to ANSI
    local ansi_code=$(hex_to_ansi256 "$primary")
    assert_not_empty "$ansi_code" "ANSI code conversion works"
}

# Test 5: Main script exists and is executable
test_main_script_exists() {
    echo ""
    echo "Test 5: Main script exists and is executable"
    
    if [[ -f "$PROJECT_ROOT/vanilla-chat.sh" ]]; then
        echo "✓ PASS: Main script exists"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo "✗ FAIL: Main script does not exist"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
    TESTS_RUN=$((TESTS_RUN + 1))
    
    if [[ -x "$PROJECT_ROOT/vanilla-chat.sh" ]]; then
        echo "✓ PASS: Main script is executable"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo "✗ FAIL: Main script is not executable"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
    TESTS_RUN=$((TESTS_RUN + 1))
}

# Test 6: Main script help option
test_main_script_help() {
    echo ""
    echo "Test 6: Main script help option"
    
    # Test help flag
    local help_output=$("$PROJECT_ROOT/vanilla-chat.sh" --help 2>&1)
    
    if echo "$help_output" | grep -q "Vanilla Chat TUI"; then
        echo "✓ PASS: Help output contains application name"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo "✗ FAIL: Help output missing application name"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
    TESTS_RUN=$((TESTS_RUN + 1))
    
    if echo "$help_output" | grep -q "Usage:"; then
        echo "✓ PASS: Help output contains usage information"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo "✗ FAIL: Help output missing usage information"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
    TESTS_RUN=$((TESTS_RUN + 1))
}

# Test 7: Main script list themes option
test_main_script_list_themes() {
    echo ""
    echo "Test 7: Main script list themes option"
    
    # Test list themes flag
    local themes_output=$("$PROJECT_ROOT/vanilla-chat.sh" --list-themes 2>&1)
    
    if echo "$themes_output" | grep -q "vanilla"; then
        echo "✓ PASS: List themes includes vanilla"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo "✗ FAIL: List themes missing vanilla"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
    TESTS_RUN=$((TESTS_RUN + 1))
    
    if echo "$themes_output" | grep -q "chocolate"; then
        echo "✓ PASS: List themes includes chocolate"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo "✗ FAIL: List themes missing chocolate"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
    TESTS_RUN=$((TESTS_RUN + 1))
}

# Run all tests
echo "=========================================="
echo "Main Loop Orchestration Tests"
echo "=========================================="

test_theme_initialization
test_system_monitor_initialization
test_conversation_tree_initialization
test_component_integration
test_main_script_exists
test_main_script_help
test_main_script_list_themes

# Print summary
echo ""
echo "=========================================="
echo "Test Summary"
echo "=========================================="
echo "Tests run: $TESTS_RUN"
echo "Tests passed: $TESTS_PASSED"
echo "Tests failed: $TESTS_FAILED"
echo "=========================================="

# Exit with appropriate code
if [[ $TESTS_FAILED -eq 0 ]]; then
    echo "✓ All tests passed!"
    exit 0
else
    echo "✗ Some tests failed"
    exit 1
fi
