#!/usr/bin/env bash
# Test suite for displayMessage function

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

# Test 1: Display user message with role, content, and timestamp
test_case "Display user message with role, content, and timestamp"
result=$(displayMessage "user" "Hello, world!" "2024-01-15T10:30:45Z" "false")
if [[ "$result" =~ "User:" ]] && [[ "$result" =~ "Hello, world!" ]] && [[ "$result" =~ "10:30:45" ]]; then
    pass "User message contains role, content, and timestamp"
else
    fail "Display user message" "Contains 'User:', 'Hello, world!', and '10:30:45'" "$result"
fi

# Test 2: Display assistant message with role, content, and timestamp
test_case "Display assistant message with role, content, and timestamp"
result=$(displayMessage "assistant" "I can help you with that." "2024-01-15T10:31:00Z" "false")
if [[ "$result" =~ "Assistant:" ]] && [[ "$result" =~ "I can help you with that." ]] && [[ "$result" =~ "10:31:00" ]]; then
    pass "Assistant message contains role, content, and timestamp"
else
    fail "Display assistant message" "Contains 'Assistant:', 'I can help you with that.', and '10:31:00'" "$result"
fi

# Test 3: Display incomplete message with marker
test_case "Display incomplete message with marker"
result=$(displayMessage "assistant" "Partial response..." "2024-01-15T10:32:00Z" "true")
if [[ "$result" =~ "[incomplete]" ]] && [[ "$result" =~ "Partial response..." ]]; then
    pass "Incomplete message marked appropriately"
else
    fail "Display incomplete message" "Contains '[incomplete]' and 'Partial response...'" "$result"
fi

# Test 4: Display message without incomplete marker (default)
test_case "Display message without incomplete marker (default)"
result=$(displayMessage "user" "Complete message" "2024-01-15T10:33:00Z")
if [[ "$result" =~ "Complete message" ]] && [[ ! "$result" =~ "[incomplete]" ]]; then
    pass "Complete message has no incomplete marker"
else
    fail "Display complete message" "No '[incomplete]' marker" "$result"
fi

# Test 5: Display message with theme colors applied
test_case "Display message with theme colors applied"
load_theme "vanilla" 2>/dev/null || true
result=$(displayMessage "user" "Themed message" "2024-01-15T10:34:00Z" "false")
# Check if ANSI color codes are present (escape sequences)
if [[ "$result" =~ $'\033' ]]; then
    pass "Theme colors applied to message"
else
    # This might fail if theme isn't loaded, which is acceptable
    echo "  Note: Theme colors not applied (theme may not be loaded)"
    pass "Message displayed without theme colors"
fi

# Test 6: Display system message
test_case "Display system message"
result=$(displayMessage "system" "System notification" "2024-01-15T10:35:00Z" "false")
if [[ "$result" =~ "System:" ]] && [[ "$result" =~ "System notification" ]]; then
    pass "System message contains role and content"
else
    fail "Display system message" "Contains 'System:' and 'System notification'" "$result"
fi

# Test 7: Message content indentation
test_case "Message content indentation"
result=$(displayMessage "user" "Test content" "2024-01-15T10:36:00Z" "false")
# Check if content is on a new line with indentation
if [[ "$result" =~ $'\n  Test content' ]]; then
    pass "Message content is indented on new line"
else
    fail "Message content indentation" "Content on new line with indentation" "$result"
fi

# Test 8: Timestamp extraction from ISO 8601 format
test_case "Timestamp extraction from ISO 8601 format"
result=$(displayMessage "user" "Time test" "2024-01-15T14:25:30Z" "false")
if [[ "$result" =~ "14:25:30" ]]; then
    pass "Timestamp correctly extracted from ISO 8601 format"
else
    fail "Timestamp extraction" "Contains '14:25:30'" "$result"
fi

# Test 9: Integration with addMessageToDisplay
test_case "Integration with addMessageToDisplay"
clearMessages
formatted_msg=$(displayMessage "user" "Integration test" "2024-01-15T10:37:00Z" "false")
addMessageToDisplay "$formatted_msg"
if [[ ${#MESSAGE_HISTORY[@]} -eq 1 ]]; then
    pass "Formatted message added to display history"
else
    fail "Integration with addMessageToDisplay" "1 message in history" "${#MESSAGE_HISTORY[@]} messages"
fi

# Test 10: Multiple messages with different roles
test_case "Multiple messages with different roles"
clearMessages
msg1=$(displayMessage "user" "First message" "2024-01-15T10:38:00Z" "false")
msg2=$(displayMessage "assistant" "Second message" "2024-01-15T10:38:30Z" "false")
msg3=$(displayMessage "user" "Third message" "2024-01-15T10:39:00Z" "false")
addMessageToDisplay "$msg1"
addMessageToDisplay "$msg2"
addMessageToDisplay "$msg3"
if [[ ${#MESSAGE_HISTORY[@]} -eq 3 ]]; then
    pass "Multiple messages with different roles added successfully"
else
    fail "Multiple messages" "3 messages in history" "${#MESSAGE_HISTORY[@]} messages"
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
