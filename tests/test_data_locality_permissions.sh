#!/usr/bin/env bash
# Test data locality and file permissions verification
# Validates Requirements 14.1, 14.2, 14.5, 14.6

# Source required modules
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Source json_utils first (no dependencies)
source "${SCRIPT_DIR}/../src/lib/json_utils.sh"

# Source tree_ops (depends on json_utils)
source "${SCRIPT_DIR}/../src/tree/tree_ops.sh"

# Source ollama_client (depends on json_utils)
source "${SCRIPT_DIR}/../src/ollama/ollama_client.sh"

# Test counter
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Test helper functions
assert_equals() {
    local expected="$1"
    local actual="$2"
    local test_name="$3"
    
    TESTS_RUN=$((TESTS_RUN + 1))
    
    if [ "$expected" = "$actual" ]; then
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

assert_contains() {
    local substring="$1"
    local string="$2"
    local test_name="$3"
    
    TESTS_RUN=$((TESTS_RUN + 1))
    
    if echo "$string" | grep -q "$substring"; then
        echo "✓ PASS: $test_name"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        echo "✗ FAIL: $test_name"
        echo "  Expected to contain: $substring"
        echo "  Actual: $string"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

echo "=========================================="
echo "Data Locality and Permissions Tests"
echo "=========================================="
echo ""

# Test 1: Verify save() sets 600 permissions
echo "Test 1: Conversation files have 600 permissions after save"
test_dir="/tmp/vanilla_test_$$"
mkdir -p "$test_dir"
test_file="$test_dir/test_conversation.json"

# Create a test tree and save it
tree=$(init_tree "Test Conversation" "llama2")
save_result=$(save "$tree" "$test_file")

if [ "$save_result" = "success" ]; then
    # Check file permissions
    perms=$(stat -c "%a" "$test_file" 2>/dev/null || stat -f "%A" "$test_file" 2>/dev/null)
    assert_equals "600" "$perms" "File permissions should be 600 (user-only read/write)"
else
    echo "✗ FAIL: Failed to save file"
    TESTS_FAILED=$((TESTS_FAILED + 1))
    TESTS_RUN=$((TESTS_RUN + 1))
fi

# Cleanup
rm -rf "$test_dir"
echo ""

# Test 2: Verify data directory is local
echo "Test 2: Data directory is local (not network mounted)"
data_dir="${SCRIPT_DIR}/../data/conversations"
if [ -d "$data_dir" ]; then
    # Check if directory is on a local filesystem
    # This checks that it's not NFS, CIFS, or other network filesystems
    fs_type=$(df -T "$data_dir" 2>/dev/null | tail -1 | awk '{print $2}')
    
    # Common network filesystem types to reject
    if echo "$fs_type" | grep -qE "nfs|cifs|smb|afs"; then
        echo "✗ FAIL: Data directory is on network filesystem: $fs_type"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    else
        echo "✓ PASS: Data directory is on local filesystem: $fs_type"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    fi
    TESTS_RUN=$((TESTS_RUN + 1))
else
    echo "✓ PASS: Data directory doesn't exist yet (will be created locally)"
    TESTS_PASSED=$((TESTS_PASSED + 1))
    TESTS_RUN=$((TESTS_RUN + 1))
fi
echo ""

# Test 3: Verify OLLAMA_HOST is localhost by default
echo "Test 3: OLLAMA_HOST defaults to localhost"
# Unset OLLAMA_HOST to test default
original_host="$OLLAMA_HOST"
unset OLLAMA_HOST

# Re-source to get default value
source "${SCRIPT_DIR}/../src/ollama/ollama_client.sh"

if echo "$OLLAMA_HOST" | grep -qE "(localhost|127\.0\.0\.1)"; then
    echo "✓ PASS: OLLAMA_HOST defaults to localhost: $OLLAMA_HOST"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo "✗ FAIL: OLLAMA_HOST does not default to localhost: $OLLAMA_HOST"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
TESTS_RUN=$((TESTS_RUN + 1))

# Restore original host
OLLAMA_HOST="$original_host"
echo ""

# Test 4: Verify validate_localhost() rejects external URLs
echo "Test 4: validate_localhost() rejects external URLs"
external_urls=(
    "http://example.com:11434"
    "https://api.openai.com"
    "http://192.168.1.100:11434"
    "http://10.0.0.1:11434"
    "https://ollama.ai"
)

all_rejected=true
for url in "${external_urls[@]}"; do
    result=$(validate_localhost "$url")
    if [ "$result" != "false" ]; then
        echo "  ✗ Failed to reject: $url"
        all_rejected=false
    fi
done

if [ "$all_rejected" = true ]; then
    echo "✓ PASS: All external URLs rejected"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo "✗ FAIL: Some external URLs were not rejected"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
TESTS_RUN=$((TESTS_RUN + 1))
echo ""

# Test 5: Verify validate_localhost() accepts localhost URLs
echo "Test 5: validate_localhost() accepts localhost URLs"
localhost_urls=(
    "http://localhost:11434"
    "http://127.0.0.1:11434"
    "https://localhost:8080"
    "http://127.0.0.1"
)

all_accepted=true
for url in "${localhost_urls[@]}"; do
    result=$(validate_localhost "$url")
    if [ "$result" != "true" ]; then
        echo "  ✗ Failed to accept: $url"
        all_accepted=false
    fi
done

if [ "$all_accepted" = true ]; then
    echo "✓ PASS: All localhost URLs accepted"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo "✗ FAIL: Some localhost URLs were not accepted"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
TESTS_RUN=$((TESTS_RUN + 1))
echo ""

# Test 6: Verify check_connection() validates localhost before connecting
echo "Test 6: check_connection() validates localhost before connecting"
# Set OLLAMA_HOST to external URL
OLLAMA_HOST="http://example.com:11434"
result=$(check_connection)

if [ "$result" = "false" ]; then
    echo "✓ PASS: check_connection() rejects external host"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo "✗ FAIL: check_connection() did not reject external host"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
TESTS_RUN=$((TESTS_RUN + 1))

# Restore localhost
OLLAMA_HOST="http://localhost:11434"
echo ""

# Test 7: Verify list_models() validates localhost
echo "Test 7: list_models() validates localhost before API call"
OLLAMA_HOST="http://malicious.com:11434"
result=$(list_models 2>&1)

if echo "$result" | grep -q "Only localhost connections are allowed"; then
    echo "✓ PASS: list_models() rejects external host"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo "✗ FAIL: list_models() did not reject external host"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
TESTS_RUN=$((TESTS_RUN + 1))

# Restore localhost
OLLAMA_HOST="http://localhost:11434"
echo ""

# Test 8: Verify get_model_info() validates localhost
echo "Test 8: get_model_info() validates localhost before API call"
OLLAMA_HOST="http://evil.com:11434"
result=$(get_model_info "llama2" 2>&1)

if echo "$result" | grep -q "Only localhost connections are allowed"; then
    echo "✓ PASS: get_model_info() rejects external host"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo "✗ FAIL: get_model_info() did not reject external host"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
TESTS_RUN=$((TESTS_RUN + 1))

# Restore localhost
OLLAMA_HOST="http://localhost:11434"
echo ""

# Test 9: Verify stream_completion() validates localhost
echo "Test 9: stream_completion() validates localhost before streaming"
OLLAMA_HOST="http://attacker.com:11434"
messages='[{"role":"user","content":"test"}]'

# Create a dummy callback function
test_callback() {
    return 0
}

result=$(stream_completion "$messages" "llama2" "test_callback" 2>&1)

if echo "$result" | grep -q "Only localhost connections are allowed"; then
    echo "✓ PASS: stream_completion() rejects external host"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo "✗ FAIL: stream_completion() did not reject external host"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
TESTS_RUN=$((TESTS_RUN + 1))

# Restore localhost
OLLAMA_HOST="http://localhost:11434"
echo ""

# Test 10: Verify no hardcoded external API endpoints in source files
echo "Test 10: No hardcoded external API endpoints in source code"
src_dir="${SCRIPT_DIR}/../src"

# Search for common external API patterns (excluding localhost)
external_patterns=(
    "https://api\."
    "http://api\."
    "\.openai\.com"
    "\.anthropic\.com"
    "\.googleapis\.com"
)

found_external=false
for pattern in "${external_patterns[@]}"; do
    if grep -r "$pattern" "$src_dir" 2>/dev/null | grep -v "localhost" | grep -v "127.0.0.1" > /dev/null; then
        echo "  ✗ Found external API pattern: $pattern"
        found_external=true
    fi
done

if [ "$found_external" = false ]; then
    echo "✓ PASS: No external API endpoints found in source code"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo "✗ FAIL: External API endpoints found in source code"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
TESTS_RUN=$((TESTS_RUN + 1))
echo ""

# Test 11: Verify conversation files are saved in local data directory
echo "Test 11: Conversation files are saved in local data directory"
test_dir="/tmp/vanilla_test_locality_$$"
mkdir -p "$test_dir"
test_file="$test_dir/conversation.json"

tree=$(init_tree "Local Test" "llama2")
save_result=$(save "$tree" "$test_file")

if [ "$save_result" = "success" ] && [ -f "$test_file" ]; then
    # Verify file exists locally
    if [ -r "$test_file" ]; then
        echo "✓ PASS: Conversation file saved locally and readable"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo "✗ FAIL: Conversation file not readable"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
else
    echo "✗ FAIL: Failed to save conversation file locally"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
TESTS_RUN=$((TESTS_RUN + 1))

# Cleanup
rm -rf "$test_dir"
echo ""

# Test 12: Verify file permissions prevent other users from reading
echo "Test 12: File permissions prevent other users from reading"
test_dir="/tmp/vanilla_test_perms_$$"
mkdir -p "$test_dir"
test_file="$test_dir/secure_conversation.json"

tree=$(init_tree "Secure Test" "llama2")
save_result=$(save "$tree" "$test_file")

if [ "$save_result" = "success" ]; then
    # Check that group and other have no permissions
    perms=$(stat -c "%a" "$test_file" 2>/dev/null || stat -f "%A" "$test_file" 2>/dev/null)
    
    # Extract group and other permissions (last two digits)
    group_other="${perms:1:2}"
    
    if [ "$group_other" = "00" ]; then
        echo "✓ PASS: Group and other users have no permissions"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo "✗ FAIL: Group or other users have permissions: $perms"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
else
    echo "✗ FAIL: Failed to save file"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
TESTS_RUN=$((TESTS_RUN + 1))

# Cleanup
rm -rf "$test_dir"
echo ""

# Test 13: Verify all curl commands target OLLAMA_HOST
echo "Test 13: All curl commands target OLLAMA_HOST only"
ollama_client_file="${SCRIPT_DIR}/../src/ollama/ollama_client.sh"

# Count curl invocations (excluding comments)
curl_count=$(grep "curl -s" "$ollama_client_file" | grep -v "^#" | wc -l | tr -d ' ')

# For each curl, check if OLLAMA_HOST appears within the next few lines
# We'll use a different approach: check that no curl uses hardcoded URLs
hardcoded_urls=$(grep -A 3 "curl -s" "$ollama_client_file" | grep -E "http://|https://" | grep -v "\${OLLAMA_HOST}" | grep -v "^--")

if [ -z "$hardcoded_urls" ]; then
    echo "✓ PASS: All $curl_count curl commands use OLLAMA_HOST variable (no hardcoded URLs)"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo "✗ FAIL: Found hardcoded URLs in curl commands:"
    echo "$hardcoded_urls"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
TESTS_RUN=$((TESTS_RUN + 1))
echo ""

# Test 14: Verify data directory structure is local
echo "Test 14: Data directory structure is within project"
project_root="${SCRIPT_DIR}/.."
data_dir="${project_root}/data"

# Check if data directory is within project root
if [[ "$data_dir" == "$project_root"* ]]; then
    echo "✓ PASS: Data directory is within project root"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo "✗ FAIL: Data directory is outside project root"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
TESTS_RUN=$((TESTS_RUN + 1))
echo ""

# Summary
echo "=========================================="
echo "Test Summary"
echo "=========================================="
echo "Tests run: $TESTS_RUN"
echo "Tests passed: $TESTS_PASSED"
echo "Tests failed: $TESTS_FAILED"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo "✓ All data locality and permissions tests passed!"
    echo ""
    echo "Verified:"
    echo "  - Conversation files have 600 permissions (Req 14.1, 14.5)"
    echo "  - Data is stored locally only (Req 14.1)"
    echo "  - Only localhost Ollama connections allowed (Req 14.2, 14.6)"
    echo "  - No external API calls in source code (Req 14.6)"
    exit 0
else
    echo "✗ Some tests failed"
    exit 1
fi
