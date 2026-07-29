#!/usr/bin/env bash
# Integration tests for main application loop
# Tests non-interactive functionality

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Test counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Test helper functions
pass() {
    local test_name="$1"
    echo "✓ PASS: $test_name"
    TESTS_PASSED=$((TESTS_PASSED + 1))
    TESTS_RUN=$((TESTS_RUN + 1))
}

fail() {
    local test_name="$1"
    local reason="$2"
    echo "✗ FAIL: $test_name"
    echo "  Reason: $reason"
    TESTS_FAILED=$((TESTS_FAILED + 1))
    TESTS_RUN=$((TESTS_RUN + 1))
}

# Test 1: Main script exists and is executable
test_main_script_exists() {
    echo "Test 1: Main script exists and is executable"
    
    if [[ -f "$PROJECT_ROOT/vanilla-chat.sh" ]]; then
        pass "Main script exists"
    else
        fail "Main script exists" "File not found"
        return
    fi
    
    if [[ -x "$PROJECT_ROOT/vanilla-chat.sh" ]]; then
        pass "Main script is executable"
    else
        fail "Main script is executable" "File is not executable"
    fi
}

# Test 2: Help option works
test_help_option() {
    echo ""
    echo "Test 2: Help option works"
    
    local output
    output=$(bash "$PROJECT_ROOT/vanilla-chat.sh" --help 2>&1)
    
    if echo "$output" | grep -q "Vanilla Chat TUI"; then
        pass "Help contains application name"
    else
        fail "Help contains application name" "Missing 'Vanilla Chat TUI'"
    fi
    
    if echo "$output" | grep -q "Usage:"; then
        pass "Help contains usage section"
    else
        fail "Help contains usage section" "Missing 'Usage:'"
    fi
    
    if echo "$output" | grep -q "Options:"; then
        pass "Help contains options section"
    else
        fail "Help contains options section" "Missing 'Options:'"
    fi
    
    if echo "$output" | grep -q "Examples:"; then
        pass "Help contains examples section"
    else
        fail "Help contains examples section" "Missing 'Examples:'"
    fi
}

# Test 3: List themes option works
test_list_themes_option() {
    echo ""
    echo "Test 3: List themes option works"
    
    local output
    output=$(bash "$PROJECT_ROOT/vanilla-chat.sh" --list-themes 2>&1)
    
    if echo "$output" | grep -q "vanilla"; then
        pass "List themes includes vanilla"
    else
        fail "List themes includes vanilla" "Missing 'vanilla' theme"
    fi
    
    if echo "$output" | grep -q "chocolate"; then
        pass "List themes includes chocolate"
    else
        fail "List themes includes chocolate" "Missing 'chocolate' theme"
    fi
    
    if echo "$output" | grep -q "strawberry"; then
        pass "List themes includes strawberry"
    else
        fail "List themes includes strawberry" "Missing 'strawberry' theme"
    fi
    
    # Count themes (should be 14)
    local theme_count
    theme_count=$(echo "$output" | grep -v "Available themes:" | grep -v "Goodbye" | grep -c "^[a-z]" || true)
    
    if [[ $theme_count -eq 14 ]]; then
        pass "List themes shows all 14 themes"
    else
        fail "List themes shows all 14 themes" "Found $theme_count themes, expected 14"
    fi
}

# Test 4: Invalid theme error handling
test_invalid_theme() {
    echo ""
    echo "Test 4: Invalid theme error handling"
    
    local output
    output=$(bash "$PROJECT_ROOT/vanilla-chat.sh" --theme nonexistent 2>&1 || true)
    
    if echo "$output" | grep -q "Error.*not found"; then
        pass "Invalid theme shows error message"
    else
        fail "Invalid theme shows error message" "No error message for invalid theme"
    fi
}

# Test 5: All required components are present
test_required_components() {
    echo ""
    echo "Test 5: All required components are present"
    
    local components=(
        "src/tui/screen.sh"
        "src/tui/logo.sh"
        "src/chat/chat_manager.sh"
        "src/tree/tree_ops.sh"
        "src/tree/auto_save.sh"
        "src/theme/theme_engine.sh"
        "src/monitor/system_monitor.sh"
        "src/ollama/ollama_client.sh"
        "src/lib/json_utils.sh"
    )
    
    for component in "${components[@]}"; do
        if [[ -f "$PROJECT_ROOT/$component" ]]; then
            pass "Component exists: $component"
        else
            fail "Component exists: $component" "File not found"
        fi
    done
}

# Test 6: Conversation directory can be created
test_conversation_directory() {
    echo ""
    echo "Test 6: Conversation directory structure"
    
    if [[ -d "$PROJECT_ROOT/data/conversations" ]]; then
        pass "Conversations directory exists"
    else
        fail "Conversations directory exists" "Directory not found"
    fi
}

# Test 7: Theme files are present
test_theme_files() {
    echo ""
    echo "Test 7: Theme files are present"
    
    local themes=(
        "vanilla"
        "chocolate"
        "strawberry"
        "lavender"
        "plum"
        "mint"
        "dreamsicle"
        "lemon"
        "lime"
        "blue-moon"
        "dragonfruit"
        "peach"
        "raspberry"
        "monochrome"
    )
    
    for theme in "${themes[@]}"; do
        if [[ -f "$PROJECT_ROOT/themes/${theme}.json" ]]; then
            pass "Theme file exists: ${theme}.json"
        else
            fail "Theme file exists: ${theme}.json" "File not found"
        fi
    done
}

# Run all tests
echo "=========================================="
echo "Main Loop Integration Tests"
echo "=========================================="

test_main_script_exists
test_help_option
test_list_themes_option
test_invalid_theme
test_required_components
test_conversation_directory
test_theme_files

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
