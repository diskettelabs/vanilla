#!/usr/bin/env bash
# Test suite for theme engine

set -euo pipefail

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Source the test setup
source "$SCRIPT_DIR/test_setup.sh"

# Source the theme engine
source "$PROJECT_ROOT/src/theme/theme_engine.sh"

# Test counter
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Test helper functions
run_test() {
    local test_name="$1"
    local test_func="$2"
    
    TESTS_RUN=$((TESTS_RUN + 1))
    echo "Running: $test_name"
    
    if $test_func; then
        TESTS_PASSED=$((TESTS_PASSED + 1))
        echo "  ✓ PASSED"
    else
        TESTS_FAILED=$((TESTS_FAILED + 1))
        echo "  ✗ FAILED"
    fi
    echo
}

# Test 1: List all themes
test_list_themes() {
    local themes
    themes=$(list_themes)
    
    # Should have exactly 14 themes
    local count
    count=$(echo "$themes" | wc -l | tr -d ' ')
    
    if [[ "$count" -ne 14 ]]; then
        echo "  Expected 14 themes, got $count"
        return 1
    fi
    
    # Check for specific themes
    local expected_themes=(
        "blue-moon"
        "chocolate"
        "dragonfruit"
        "dreamsicle"
        "lavender"
        "lemon"
        "lime"
        "mint"
        "monochrome"
        "peach"
        "plum"
        "raspberry"
        "strawberry"
        "vanilla"
    )
    
    for theme in "${expected_themes[@]}"; do
        if ! echo "$themes" | grep -q "^${theme}$"; then
            echo "  Missing theme: $theme"
            return 1
        fi
    done
    
    return 0
}

# Test 2: Load a valid theme
test_load_valid_theme() {
    if ! load_theme "vanilla"; then
        echo "  Failed to load vanilla theme"
        return 1
    fi
    
    local current
    current=$(get_current_theme)
    
    if [[ "$current" != "vanilla" ]]; then
        echo "  Expected current theme to be 'vanilla', got '$current'"
        return 1
    fi
    
    return 0
}

# Test 3: Load invalid theme
test_load_invalid_theme() {
    # Should fail for non-existent theme
    if load_theme "nonexistent" 2>/dev/null; then
        echo "  Should have failed to load non-existent theme"
        return 1
    fi
    
    return 0
}

# Test 4: Get theme color
test_get_theme_color() {
    load_theme "vanilla" >/dev/null 2>&1
    
    local primary
    primary=$(get_theme_color "primary")
    
    if [[ -z "$primary" ]]; then
        echo "  Failed to get primary color"
        return 1
    fi
    
    # Should be a hex color
    if [[ ! "$primary" =~ ^#[0-9A-Fa-f]{6}$ ]]; then
        echo "  Invalid hex color format: $primary"
        return 1
    fi
    
    return 0
}

# Test 5: Get all theme colors
test_get_theme_colors() {
    load_theme "chocolate" >/dev/null 2>&1
    
    local colors
    colors=$(get_theme_colors)
    
    # Should be valid JSON
    if ! echo "$colors" | jq empty 2>/dev/null; then
        echo "  Colors output is not valid JSON"
        return 1
    fi
    
    # Should have all required fields
    local required_fields=(
        "primary"
        "secondary"
        "background"
        "text"
        "userMessage"
        "assistantMessage"
        "border"
        "statusBar"
    )
    
    for field in "${required_fields[@]}"; do
        if ! echo "$colors" | jq -e ".${field}" >/dev/null 2>&1; then
            echo "  Missing color field: $field"
            return 1
        fi
    done
    
    return 0
}

# Test 6: Get theme metadata
test_get_theme_metadata() {
    load_theme "strawberry" >/dev/null 2>&1
    
    local metadata
    metadata=$(get_theme_metadata)
    
    # Should be valid JSON
    if ! echo "$metadata" | jq empty 2>/dev/null; then
        echo "  Metadata output is not valid JSON"
        return 1
    fi
    
    # Should have name, displayName, description
    local name
    name=$(echo "$metadata" | jq -r '.name')
    
    if [[ "$name" != "strawberry" ]]; then
        echo "  Expected name 'strawberry', got '$name'"
        return 1
    fi
    
    return 0
}

# Test 7: Hex to ANSI conversion
test_hex_to_ansi256() {
    # Test white
    local white
    white=$(hex_to_ansi256 "#FFFFFF")
    
    if [[ -z "$white" ]]; then
        echo "  Failed to convert white"
        return 1
    fi
    
    # Test black
    local black
    black=$(hex_to_ansi256 "#000000")
    
    if [[ -z "$black" ]]; then
        echo "  Failed to convert black"
        return 1
    fi
    
    # Test without # prefix
    local color
    color=$(hex_to_ansi256 "FF0000")
    
    if [[ -z "$color" ]]; then
        echo "  Failed to convert color without # prefix"
        return 1
    fi
    
    return 0
}

# Test 8: Theme exists check
test_theme_exists() {
    if ! theme_exists "vanilla"; then
        echo "  vanilla theme should exist"
        return 1
    fi
    
    if theme_exists "nonexistent"; then
        echo "  nonexistent theme should not exist"
        return 1
    fi
    
    return 0
}

# Test 9: Load all themes
test_load_all_themes() {
    local themes
    themes=$(list_themes)
    
    while IFS= read -r theme; do
        if ! load_theme "$theme" >/dev/null 2>&1; then
            echo "  Failed to load theme: $theme"
            return 1
        fi
        
        # Verify all color fields are accessible
        local colors=(
            "primary"
            "secondary"
            "background"
            "text"
            "userMessage"
            "assistantMessage"
            "border"
            "statusBar"
        )
        
        for color in "${colors[@]}"; do
            if ! get_theme_color "$color" >/dev/null 2>&1; then
                echo "  Failed to get color '$color' from theme '$theme'"
                return 1
            fi
        done
    done <<< "$themes"
    
    return 0
}

# Test 10: Apply theme color to text
test_apply_theme_color() {
    load_theme "vanilla" >/dev/null 2>&1
    
    local colored_text
    colored_text=$(apply_theme_color "Hello World" "primary")
    
    if [[ -z "$colored_text" ]]; then
        echo "  Failed to apply theme color"
        return 1
    fi
    
    # Should contain ANSI escape codes
    if [[ ! "$colored_text" =~ $'\033' ]]; then
        echo "  Colored text should contain ANSI escape codes"
        return 1
    fi
    
    return 0
}

# Run all tests
echo "========================================"
echo "Theme Engine Test Suite"
echo "========================================"
echo

run_test "Test 1: List all themes" test_list_themes
run_test "Test 2: Load valid theme" test_load_valid_theme
run_test "Test 3: Load invalid theme" test_load_invalid_theme
run_test "Test 4: Get theme color" test_get_theme_color
run_test "Test 5: Get all theme colors" test_get_theme_colors
run_test "Test 6: Get theme metadata" test_get_theme_metadata
run_test "Test 7: Hex to ANSI conversion" test_hex_to_ansi256
run_test "Test 8: Theme exists check" test_theme_exists
run_test "Test 9: Load all themes" test_load_all_themes
run_test "Test 10: Apply theme color to text" test_apply_theme_color

# Print summary
echo "========================================"
echo "Test Summary"
echo "========================================"
echo "Tests run:    $TESTS_RUN"
echo "Tests passed: $TESTS_PASSED"
echo "Tests failed: $TESTS_FAILED"
echo

if [[ $TESTS_FAILED -eq 0 ]]; then
    echo "✓ All tests passed!"
    exit 0
else
    echo "✗ Some tests failed"
    exit 1
fi
