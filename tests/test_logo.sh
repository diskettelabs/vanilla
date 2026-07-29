#!/usr/bin/env bash
# Test suite for logo rendering

set -o pipefail

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Source the logo module
source "$PROJECT_ROOT/src/tui/logo.sh"

# Test counter
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Test helper functions
pass() {
    echo "✓ $1"
    TESTS_PASSED=$((TESTS_PASSED + 1))
}

fail() {
    echo "✗ $1"
    TESTS_FAILED=$((TESTS_FAILED + 1))
}

run_test() {
    TESTS_RUN=$((TESTS_RUN + 1))
    echo ""
    echo "Test $TESTS_RUN: $1"
}

# Test 1: generateLogo returns output with loaded theme
run_test "generateLogo returns output with loaded theme"
if load_theme "vanilla"; then
    output=$(generateLogo "primary")
    if [[ -n "$output" ]]; then
        pass "generateLogo produces output"
    else
        fail "generateLogo produces no output"
    fi
else
    fail "Failed to load vanilla theme"
fi

# Test 2: generateLogo output contains expected ASCII art structure
run_test "generateLogo output contains expected ASCII art structure"
output=$(generateLogo "primary")
line_count=$(echo "$output" | wc -l | tr -d ' ')
if [[ $line_count -eq 10 ]]; then
    pass "Logo has correct number of lines (10)"
else
    fail "Logo has $line_count lines, expected 10"
fi

# Test 3: generateLogo output contains eyes
run_test "generateLogo output contains eyes"
output=$(generateLogo "primary")
if echo "$output" | grep -q "( o )"; then
    pass "Logo contains eyes '( o )'"
else
    fail "Logo does not contain eyes"
fi

# Test 4: generateLogo output contains ANSI color codes
run_test "generateLogo output contains ANSI color codes"
output=$(generateLogo "primary")
if echo "$output" | grep -q $'\033\[38;5;'; then
    pass "Logo contains ANSI color codes"
else
    fail "Logo does not contain ANSI color codes"
fi

# Test 5: generateLogo works with different themes
run_test "generateLogo works with different themes"
themes=("chocolate" "strawberry" "mint")
all_passed=true
for theme in "${themes[@]}"; do
    if load_theme "$theme"; then
        output=$(generateLogo "primary")
        if [[ -z "$output" ]]; then
            all_passed=false
            break
        fi
    else
        all_passed=false
        break
    fi
done

if $all_passed; then
    pass "generateLogo works with multiple themes"
else
    fail "generateLogo failed with some themes"
fi

# Test 6: displayLogo requires loaded theme
run_test "displayLogo requires loaded theme"
# Clear current theme by setting to empty
CURRENT_THEME=""
if displayLogo 2>/dev/null; then
    fail "displayLogo should fail without loaded theme"
else
    pass "displayLogo correctly fails without loaded theme"
fi

# Test 7: displayLogo works with loaded theme
run_test "displayLogo works with loaded theme"
if load_theme "vanilla"; then
    output=$(displayLogo)
    if [[ -n "$output" ]]; then
        pass "displayLogo produces output with loaded theme"
    else
        fail "displayLogo produces no output"
    fi
else
    fail "Failed to load vanilla theme"
fi

# Test 8: Logo updates when theme changes
run_test "Logo updates when theme changes"
load_theme "vanilla"
output1=$(generateLogo "primary")
load_theme "chocolate"
output2=$(generateLogo "primary")

# The outputs should be different (different color codes)
if [[ "$output1" != "$output2" ]]; then
    pass "Logo changes when theme changes"
else
    fail "Logo does not change when theme changes"
fi

# Test 9: Logo structure remains consistent across themes
run_test "Logo structure remains consistent across themes"
load_theme "vanilla"
output1=$(generateLogo "primary")
# Strip ANSI codes to compare structure
structure1=$(echo "$output1" | sed 's/\x1b\[[0-9;]*m//g')

load_theme "dragonfruit"
output2=$(generateLogo "primary")
structure2=$(echo "$output2" | sed 's/\x1b\[[0-9;]*m//g')

if [[ "$structure1" == "$structure2" ]]; then
    pass "Logo structure is consistent across themes"
else
    fail "Logo structure differs across themes"
fi

# Test 10: Logo contains rounded top and bottom
run_test "Logo contains rounded top and bottom"
load_theme "vanilla"
output=$(generateLogo "primary")
# Strip ANSI codes
plain_output=$(echo "$output" | sed 's/\x1b\[[0-9;]*m//g')

if echo "$plain_output" | grep -q "___________" && \
   echo "$plain_output" | grep -q "_____________"; then
    pass "Logo contains rounded top and bottom curves"
else
    fail "Logo missing rounded curves"
fi

# Summary
echo ""
echo "================================"
echo "Test Summary"
echo "================================"
echo "Tests run: $TESTS_RUN"
echo "Tests passed: $TESTS_PASSED"
echo "Tests failed: $TESTS_FAILED"
echo ""

if [[ $TESTS_FAILED -eq 0 ]]; then
    echo "All tests passed! ✓"
    exit 0
else
    echo "Some tests failed. ✗"
    exit 1
fi

