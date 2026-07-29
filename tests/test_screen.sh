#!/usr/bin/env bash
# Test suite for TUI screen module

set -euo pipefail

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Source the module to test
source "$PROJECT_ROOT/src/tui/screen.sh"

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
    echo "  Expected: $2"
    echo "  Got: $3"
    TESTS_FAILED=$((TESTS_FAILED + 1))
}

test_case() {
    echo ""
    echo "Test: $1"
    TESTS_RUN=$((TESTS_RUN + 1))
}

# Test 1: Terminal size detection
test_case "Terminal size detection"
updateTerminalSize
if [[ $SCREEN_WIDTH -gt 0 ]] && [[ $SCREEN_HEIGHT -gt 0 ]]; then
    pass "Terminal size detected: ${SCREEN_WIDTH}x${SCREEN_HEIGHT}"
else
    fail "Terminal size detection" "width>0 and height>0" "width=$SCREEN_WIDTH height=$SCREEN_HEIGHT"
fi

# Test 2: Input buffer management
test_case "Input buffer management"
updateInputBuffer "test message"
result=$(getInputBuffer)
if [[ "$result" == "test message" ]]; then
    pass "Input buffer stores and retrieves text"
else
    fail "Input buffer management" "test message" "$result"
fi

# Test 3: Message history management
test_case "Message history management"
clearMessages
addMessageToDisplay "Message 1"
addMessageToDisplay "Message 2"
addMessageToDisplay "Message 3"
if [[ ${#MESSAGE_HISTORY[@]} -eq 3 ]]; then
    pass "Message history stores multiple messages"
else
    fail "Message history management" "3 messages" "${#MESSAGE_HISTORY[@]} messages"
fi

# Test 4: Clear messages
test_case "Clear messages"
clearMessages
if [[ ${#MESSAGE_HISTORY[@]} -eq 0 ]]; then
    pass "Message history cleared"
else
    fail "Clear messages" "0 messages" "${#MESSAGE_HISTORY[@]} messages"
fi

# Test 5: Scroll position management
test_case "Scroll position management"
clearMessages
for i in {1..20}; do
    addMessageToDisplay "Message $i"
done
initial_scroll=$SCROLL_POSITION
# Debug output
echo "  Initial scroll: $initial_scroll"
scrollUp 5
after_up=$SCROLL_POSITION
echo "  After scrollUp 5: $after_up"
scrollDown 3
after_down=$SCROLL_POSITION
echo "  After scrollDown 3: $after_down"

if [[ $after_up -lt $initial_scroll ]] && [[ $after_down -gt $after_up ]] && [[ $after_down -le $initial_scroll ]]; then
    pass "Scroll position updates correctly"
else
    fail "Scroll position management" "scroll_up < initial && scroll_down > scroll_up" "initial=$initial_scroll up=$after_up down=$after_down"
fi

# Test 6: Scroll bounds checking
test_case "Scroll bounds checking"
clearMessages
addMessageToDisplay "Single message"
SCROLL_POSITION=0
scrollUp 10  # Try to scroll past top
if [[ $SCROLL_POSITION -eq 0 ]]; then
    pass "Scroll position bounded at top"
else
    fail "Scroll bounds checking" "0" "$SCROLL_POSITION"
fi

# Test 7: ANSI escape codes defined
test_case "ANSI escape codes defined"
if [[ -n "$CLEAR_SCREEN" ]] && [[ -n "$HIDE_CURSOR" ]] && [[ -n "$SHOW_CURSOR" ]]; then
    pass "ANSI escape codes are defined"
else
    fail "ANSI escape codes defined" "non-empty strings" "some codes are empty"
fi

# Test 8: Theme integration
test_case "Theme integration"
# Load a theme first
load_theme "vanilla" 2>/dev/null || true
current_theme=$(get_current_theme)
if [[ -n "$current_theme" ]]; then
    pass "Theme loaded for screen rendering: $current_theme"
else
    fail "Theme integration" "theme loaded" "no theme"
fi

# Summary
echo ""
echo "================================"
echo "Test Summary"
echo "================================"
echo "Tests run: $TESTS_RUN"
echo "Passed: $TESTS_PASSED"
echo "Failed: $TESTS_FAILED"
echo ""

if [[ $TESTS_FAILED -eq 0 ]]; then
    echo "✓ All tests passed!"
    exit 0
else
    echo "✗ Some tests failed"
    exit 1
fi
