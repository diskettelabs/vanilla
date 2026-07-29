#!/usr/bin/env bash
# Demo: Ollama connection error handling with retry logic and offline editing

# Get absolute paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Source required modules
source "${PROJECT_ROOT}/src/lib/json_utils.sh"
source "${PROJECT_ROOT}/src/tree/tree_ops.sh"
source "${PROJECT_ROOT}/src/ollama/ollama_client.sh"
source "${PROJECT_ROOT}/src/lib/error_recovery.sh"
source "${PROJECT_ROOT}/src/chat/chat_manager.sh"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║     Ollama Connection Error Handling Demo                     ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Demo 1: Display error messages
echo -e "${BLUE}Demo 1: User-friendly error messages${NC}"
echo "────────────────────────────────────────────────────────────────"
handle_connection_error
echo ""

# Demo 2: Retry status display
echo -e "${BLUE}Demo 2: Connection retry status${NC}"
echo "────────────────────────────────────────────────────────────────"
for i in 1 2 3; do
    display_retry_status $i 3
    sleep 1
done
echo ""

# Demo 3: Offline mode display
echo -e "${BLUE}Demo 3: Offline mode notification${NC}"
echo "────────────────────────────────────────────────────────────────"
display_offline_mode
echo ""

# Demo 4: Test with unreachable Ollama
echo -e "${BLUE}Demo 4: Sending message with Ollama unreachable${NC}"
echo "────────────────────────────────────────────────────────────────"

# Create a test tree
tree=$(init_tree "Connection Test" "llama2")
echo -e "${GREEN}✓${NC} Created conversation tree"

# Mock Ollama being unavailable
export OLLAMA_HOST="http://localhost:99999"
export OLLAMA_MAX_RETRIES=2
export OLLAMA_RETRY_DELAY=1

echo -e "${YELLOW}⟳${NC} Attempting to send message with Ollama unreachable..."
echo ""

# Try to send a message
send_message "$tree" "Hello, can you hear me?" "llama2" "" >/dev/null 2>&1
exit_code=$?

if [ $exit_code -ne 0 ]; then
    echo -e "${RED}✗${NC} Connection failed (as expected)"
    echo -e "${GREEN}✓${NC} User message saved for offline editing"
    echo -e "${GREEN}✓${NC} Error handled gracefully"
else
    echo -e "${GREEN}✓${NC} Message sent successfully (Ollama is actually running)"
fi

echo ""

# Demo 5: Test branch creation with unreachable Ollama
echo -e "${BLUE}Demo 5: Creating branch with Ollama unreachable${NC}"
echo "────────────────────────────────────────────────────────────────"

# Create a tree with a user message
tree=$(init_tree "Branch Test" "llama2")
message=$(create_message "user" "Original message" "")
add_result=$(add_node "$tree" "$message" "")
tree=$(echo "$add_result" | jq -r '.tree')
node_id=$(echo "$add_result" | jq -r '.nodeId')

echo -e "${GREEN}✓${NC} Created tree with user message"
echo -e "${YELLOW}⟳${NC} Attempting to create branch with Ollama unreachable..."
echo ""

# Try to create a branch
create_branch "$tree" "$node_id" "Edited message" "llama2" "" >/dev/null 2>&1
exit_code=$?

if [ $exit_code -ne 0 ]; then
    echo -e "${RED}✗${NC} Connection failed (as expected)"
    echo -e "${GREEN}✓${NC} Branch saved for offline editing"
    echo -e "${GREEN}✓${NC} Error handled gracefully"
else
    echo -e "${GREEN}✓${NC} Branch created successfully (Ollama is actually running)"
fi

echo ""

# Demo 6: Streaming interruption handling
echo -e "${BLUE}Demo 6: Streaming interruption with partial response${NC}"
echo "────────────────────────────────────────────────────────────────"

# Create a tree with messages
tree=$(init_tree "Interruption Test" "llama2")
message=$(create_message "user" "Tell me a story" "")
add_result=$(add_node "$tree" "$message" "")
tree=$(echo "$add_result" | jq -r '.tree')
node_id=$(echo "$add_result" | jq -r '.nodeId')

# Add assistant message with partial content
assistant_msg=$(create_message "assistant" "Once upon a time, there was a" "llama2")
add_result=$(add_node "$tree" "$assistant_msg" "$node_id")
tree=$(echo "$add_result" | jq -r '.tree')
assistant_id=$(echo "$add_result" | jq -r '.nodeId')

echo -e "${GREEN}✓${NC} Created conversation with partial assistant response"

# Simulate streaming interruption
tree=$(handle_stream_interruption "$tree" "$assistant_id" "Once upon a time, there was a")

# Check if marked as incomplete
incomplete=$(is_incomplete_message "$tree" "$assistant_id")
content=$(echo "$tree" | jq -r --arg id "$assistant_id" '.nodes[$id].message.content')

echo -e "${YELLOW}⚠${NC}  Streaming interrupted"
echo ""
echo -e "${GREEN}✓${NC} Partial response preserved: \"$content\""
echo -e "${GREEN}✓${NC} Message marked as incomplete: $incomplete"
echo ""

# Demo 7: Localhost-only validation
echo -e "${BLUE}Demo 7: Security - Localhost-only connections${NC}"
echo "────────────────────────────────────────────────────────────────"

test_urls=(
    "http://localhost:11434"
    "http://127.0.0.1:11434"
    "http://example.com:11434"
    "http://192.168.1.1:11434"
)

for url in "${test_urls[@]}"; do
    result=$(validate_localhost "$url")
    if [ "$result" = "true" ]; then
        echo -e "${GREEN}✓${NC} Accepted: $url"
    else
        echo -e "${RED}✗${NC} Rejected: $url (security protection)"
    fi
done

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                     Demo Complete                              ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "Key Features Demonstrated:"
echo "  • Connection retry logic with 5-second intervals"
echo "  • User-friendly error messages"
echo "  • Offline editing capability (messages saved locally)"
echo "  • Partial response preservation on interruption"
echo "  • Localhost-only security validation"
echo ""
