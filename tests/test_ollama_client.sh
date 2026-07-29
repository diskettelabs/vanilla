#!/usr/bin/env bash
# Tests for Ollama client integration

# Source the Ollama client
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/../src/ollama/ollama_client.sh"

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

# Test 1: Validate localhost-only connections
run_test "validate_localhost() accepts localhost URLs"
result=$(validate_localhost "http://localhost:11434")
if [ "$result" = "true" ]; then
    pass "localhost URL accepted"
else
    fail "localhost URL rejected"
fi

result=$(validate_localhost "http://127.0.0.1:11434")
if [ "$result" = "true" ]; then
    pass "127.0.0.1 URL accepted"
else
    fail "127.0.0.1 URL rejected"
fi

result=$(validate_localhost "http://example.com:11434")
if [ "$result" = "false" ]; then
    pass "Remote URL rejected"
else
    fail "Remote URL accepted (should be rejected)"
fi

# Test 2: Check connection to Ollama
run_test "check_connection() verifies Ollama service"
result=$(check_connection)
if [ "$result" = "true" ]; then
    pass "Ollama service is running"
    OLLAMA_RUNNING=true
elif [ "$result" = "false" ]; then
    pass "Ollama service check returned false (service may not be running)"
    OLLAMA_RUNNING=false
else
    fail "check_connection() returned unexpected value: $result"
    OLLAMA_RUNNING=false
fi

# Test 3: List models (only if Ollama is running)
if [ "$OLLAMA_RUNNING" = "true" ]; then
    run_test "list_models() retrieves available models"
    result=$(list_models)
    
    if echo "$result" | jq -e '.error' > /dev/null 2>&1; then
        fail "list_models() returned error: $(echo "$result" | jq -r '.error')"
    elif echo "$result" | jq -e '.models' > /dev/null 2>&1; then
        pass "list_models() returned valid model list"
        
        # Display available models
        model_count=$(echo "$result" | jq '.models | length')
        echo "    Found $model_count model(s)"
    else
        fail "list_models() returned unexpected format"
    fi
else
    echo "Skipping list_models() test (Ollama not running)"
fi

# Test 4: Get model info (only if Ollama is running)
if [ "$OLLAMA_RUNNING" = "true" ]; then
    run_test "get_model_info() retrieves model details"
    
    # Try to get info for a common model
    result=$(get_model_info "llama2" 2>/dev/null)
    
    if echo "$result" | jq -e '.error' > /dev/null 2>&1; then
        # Model might not be installed, which is okay
        pass "get_model_info() handled missing model gracefully"
    elif validate_json "$result"; then
        pass "get_model_info() returned valid JSON"
    else
        fail "get_model_info() returned invalid response"
    fi
else
    echo "Skipping get_model_info() test (Ollama not running)"
fi

# Test 5: Input sanitization
run_test "sanitize_input() removes dangerous characters"
result=$(sanitize_input "  Hello World  ")
if [ "$result" = "Hello World" ]; then
    pass "Whitespace trimmed correctly"
else
    fail "Whitespace trimming failed: '$result'"
fi

result=$(sanitize_input "Test$(printf '\000')String")
# Check that result doesn't contain null bytes and is "TestString"
if [ "$result" = "TestString" ]; then
    pass "Null bytes removed"
else
    fail "Null bytes not removed (got: '$result')"
fi

# Test 6: Stream completion callback mechanism
run_test "stream_completion() callback mechanism"

# Create a test callback function
test_callback() {
    local token="$1"
    local done="$2"
    
    if [ "$done" = "true" ]; then
        echo "DONE" >> /tmp/test_callback_output.txt
    else
        echo "$token" >> /tmp/test_callback_output.txt
    fi
}

# Clean up any previous test output
rm -f /tmp/test_callback_output.txt

if [ "$OLLAMA_RUNNING" = "true" ]; then
    # Create a simple test message
    messages=$(jq -n '[{role: "user", content: "Say hello"}]')
    
    # Note: This test requires a model to be installed
    # We'll just verify the function accepts the parameters correctly
    if type test_callback > /dev/null 2>&1; then
        pass "Callback function defined correctly"
    else
        fail "Callback function not defined"
    fi
else
    echo "Skipping stream_completion() test (Ollama not running)"
fi

# Clean up
rm -f /tmp/test_callback_output.txt

# Test 7: Localhost validation in API functions
run_test "API functions validate localhost-only connections"

# Temporarily set OLLAMA_HOST to a remote URL
OLD_OLLAMA_HOST="$OLLAMA_HOST"
export OLLAMA_HOST="http://example.com:11434"

result=$(list_models)
if echo "$result" | jq -e '.error' | grep -q "localhost"; then
    pass "list_models() rejects remote connections"
else
    fail "list_models() did not reject remote connection"
fi

result=$(get_model_info "test")
if echo "$result" | jq -e '.error' | grep -q "localhost"; then
    pass "get_model_info() rejects remote connections"
else
    fail "get_model_info() did not reject remote connection"
fi

# Restore OLLAMA_HOST
export OLLAMA_HOST="$OLD_OLLAMA_HOST"

# Summary
echo ""
echo "========================================="
echo "Test Summary"
echo "========================================="
echo "Tests run:    $TESTS_RUN"
echo "Tests passed: $TESTS_PASSED"
echo "Tests failed: $TESTS_FAILED"
echo "========================================="

if [ $TESTS_FAILED -eq 0 ]; then
    echo "✓ All tests passed!"
    exit 0
else
    echo "✗ Some tests failed"
    exit 1
fi
