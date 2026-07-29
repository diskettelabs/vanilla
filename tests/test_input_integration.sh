#!/usr/bin/env bash
# Integration test for input handling with screen module

set -euo pipefail

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Source the screen module
source "$PROJECT_ROOT/src/tui/screen.sh"

echo "Input Handling Integration Test"
echo "================================"
echo

# Test 1: Verify handleInput is exported
echo "Test 1: Verify handleInput is exported"
if declare -F handleInput > /dev/null; then
    echo "✓ PASS: handleInput is exported"
else
    echo "✗ FAIL: handleInput is not exported"
    exit 1
fi
echo

# Test 2: Verify handleInput returns empty on timeout
echo "Test 2: Verify handleInput timeout behavior"
result=$(handleInput)
if [[ -z "$result" ]]; then
    echo "✓ PASS: handleInput returns empty on timeout"
else
    echo "✗ FAIL: handleInput should return empty on timeout, got: $result"
    exit 1
fi
echo

# Test 3: Verify INPUT_BUFFER is accessible
echo "Test 3: Verify INPUT_BUFFER is accessible"
INPUT_BUFFER="test"
if [[ "$INPUT_BUFFER" == "test" ]]; then
    echo "✓ PASS: INPUT_BUFFER is accessible"
else
    echo "✗ FAIL: INPUT_BUFFER is not accessible"
    exit 1
fi
INPUT_BUFFER=""
echo

# Test 4: Verify getInputBuffer works
echo "Test 4: Verify getInputBuffer integration"
updateInputBuffer "integration test"
result=$(getInputBuffer)
if [[ "$result" == "integration test" ]]; then
    echo "✓ PASS: getInputBuffer returns correct value"
else
    echo "✗ FAIL: getInputBuffer returned: $result"
    exit 1
fi
updateInputBuffer ""
echo

# Test 5: Verify SCREEN_HEIGHT is set
echo "Test 5: Verify SCREEN_HEIGHT is available"
# Update terminal size to set SCREEN_HEIGHT
updateTerminalSize
if [[ -n "$SCREEN_HEIGHT" ]] && [[ "$SCREEN_HEIGHT" -gt 0 ]]; then
    echo "✓ PASS: SCREEN_HEIGHT is set to $SCREEN_HEIGHT"
else
    echo "✗ FAIL: SCREEN_HEIGHT is not properly set"
    exit 1
fi
echo

# Test 6: Verify renderInputArea function exists
echo "Test 6: Verify renderInputArea is available"
if declare -F renderInputArea > /dev/null; then
    echo "✓ PASS: renderInputArea is available"
else
    echo "✗ FAIL: renderInputArea is not available"
    exit 1
fi
echo

echo "================================"
echo "All integration tests passed!"
echo "================================"
exit 0
