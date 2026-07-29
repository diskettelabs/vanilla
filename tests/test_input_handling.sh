#!/usr/bin/env bash
# Test input handling functionality

set -euo pipefail

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Source the screen module
source "$PROJECT_ROOT/src/tui/screen.sh"

# Test counter
TESTS_RUN=0
TESTS_PASSED=0

# Test helper functions
assert_equals() {
    local expected="$1"
    local actual="$2"
    local test_name="$3"
    
    TESTS_RUN=$((TESTS_RUN + 1))
    
    if [[ "$expected" == "$actual" ]]; then
        echo "✓ PASS: $test_name"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo "✗ FAIL: $test_name"
        echo "  Expected: $expected"
        echo "  Actual:   $actual"
    fi
}

assert_contains() {
    local haystack="$1"
    local needle="$2"
    local test_name="$3"
    
    TESTS_RUN=$((TESTS_RUN + 1))
    
    if [[ "$haystack" == *"$needle"* ]]; then
        echo "✓ PASS: $test_name"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo "✗ FAIL: $test_name"
        echo "  Expected to contain: $needle"
        echo "  Actual:   $haystack"
    fi
}

assert_empty() {
    local actual="$1"
    local test_name="$2"
    
    TESTS_RUN=$((TESTS_RUN + 1))
    
    if [[ -z "$actual" ]]; then
        echo "✓ PASS: $test_name"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo "✗ FAIL: $test_name"
        echo "  Expected empty string"
        echo "  Actual:   $actual"
    fi
}

echo "Testing Input Handling Functions"
echo "================================="
echo

# Test 1: updateInputBuffer and getInputBuffer
echo "Test 1: Input buffer management"
updateInputBuffer "Hello World"
result=$(getInputBuffer)
assert_equals "Hello World" "$result" "updateInputBuffer and getInputBuffer"
echo

# Test 2: Clear input buffer
echo "Test 2: Clear input buffer"
updateInputBuffer ""
result=$(getInputBuffer)
assert_equals "" "$result" "Clear input buffer"
echo

# Test 3: Input buffer accumulation (simulated)
echo "Test 3: Input buffer accumulation"
updateInputBuffer ""
updateInputBuffer "H"
updateInputBuffer "He"
updateInputBuffer "Hel"
result=$(getInputBuffer)
assert_equals "Hel" "$result" "Input buffer accumulation"
echo

# Test 4: Non-empty input buffer state
echo "Test 4: Non-empty input buffer check"
updateInputBuffer "test message"
result=$(getInputBuffer)
if [[ -n "$result" ]]; then
    echo "✓ PASS: Non-empty input buffer detected"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo "✗ FAIL: Non-empty input buffer not detected"
fi
TESTS_RUN=$((TESTS_RUN + 1))
echo

# Test 5: Empty input buffer state
echo "Test 5: Empty input buffer check"
updateInputBuffer ""
result=$(getInputBuffer)
if [[ -z "$result" ]]; then
    echo "✓ PASS: Empty input buffer detected"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo "✗ FAIL: Empty input buffer not detected (got: '$result')"
fi
TESTS_RUN=$((TESTS_RUN + 1))
echo

# Test 6: handleInput function exists
echo "Test 6: handleInput function exists"
if declare -f handleInput > /dev/null; then
    echo "✓ PASS: handleInput function is defined"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo "✗ FAIL: handleInput function is not defined"
fi
TESTS_RUN=$((TESTS_RUN + 1))
echo

# Test 7: handleInput returns empty on timeout (no input)
echo "Test 7: handleInput timeout behavior"
# This test will timeout after 100ms with no input
result=$(handleInput)
assert_empty "$result" "handleInput returns empty on timeout"
echo

# Note: Interactive tests for actual keyboard input would require
# a more sophisticated test harness with input simulation.
# The following tests document expected behavior:

echo "Expected Behavior (not automatically tested):"
echo "---------------------------------------------"
echo "1. Typing 'hello' should accumulate characters in INPUT_BUFFER"
echo "2. Pressing backspace should remove last character"
echo "3. Pressing Enter with non-empty buffer should return submit event"
echo "4. Pressing Enter with empty buffer should return empty string"
echo "5. Delete key should remove character at cursor"
echo "6. Arrow keys should be handled (currently ignored)"
echo

# Summary
echo "================================="
echo "Test Summary"
echo "================================="
echo "Tests run:    $TESTS_RUN"
echo "Tests passed: $TESTS_PASSED"
echo "Tests failed: $((TESTS_RUN - TESTS_PASSED))"
echo

if [[ $TESTS_PASSED -eq $TESTS_RUN ]]; then
    echo "✓ All tests passed!"
    exit 0
else
    echo "✗ Some tests failed"
    exit 1
fi
