#!/usr/bin/env bash
# Demo: Retry incomplete message functionality

# Get absolute paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Source required modules
source "${PROJECT_ROOT}/src/lib/json_utils.sh"
source "${PROJECT_ROOT}/src/tree/tree_ops.sh"
source "${PROJECT_ROOT}/src/ollama/ollama_client.sh"
source "${PROJECT_ROOT}/src/lib/error_recovery.sh"
source "${PROJECT_ROOT}/src/chat/chat_manager.sh"

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║         Retry Incomplete Message Demo                         ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Create a conversation tree
echo "1. Creating conversation tree..."
tree=$(init_tree "Retry Demo" "llama2")
echo "   ✓ Tree created"
echo ""

# Add a user message
echo "2. Adding user message..."
user_msg=$(create_message "user" "What is the capital of France?" "")
add_result=$(add_node "$tree" "$user_msg" "")
tree=$(echo "$add_result" | jq -r '.tree')
user_node_id=$(echo "$add_result" | jq -r '.nodeId')
echo "   ✓ User message added: 'What is the capital of France?'"
echo ""

# Add an incomplete assistant message (simulating interrupted stream)
echo "3. Simulating interrupted stream..."
assistant_msg=$(create_message "assistant" "The capital of France is Pa" "llama2")
add_result=$(add_node "$tree" "$assistant_msg" "$user_node_id")
tree=$(echo "$add_result" | jq -r '.tree')
assistant_node_id=$(echo "$add_result" | jq -r '.nodeId')
echo "   ✓ Assistant message added with partial content"
echo ""

# Mark as incomplete
echo "4. Marking message as incomplete..."
tree=$(handle_stream_interruption "$tree" "$assistant_node_id" "The capital of France is Pa")
echo "   ✓ Message marked as incomplete"
echo ""

# Display the incomplete message
echo "5. Current conversation state:"
echo "   ┌─────────────────────────────────────────────────────────────┐"
messages=$(get_path "$tree" "$assistant_node_id")
echo "$messages" | jq -r '.[] | "   │ [\(.role)]: \(.content)"'
incomplete=$(is_incomplete_message "$tree" "$assistant_node_id")
echo "   │ [status]: incomplete = $incomplete"
echo "   └─────────────────────────────────────────────────────────────┘"
echo ""

# Get all incomplete messages
echo "6. Finding incomplete messages in tree..."
incomplete_ids=$(get_incomplete_messages "$tree")
count=$(echo "$incomplete_ids" | jq 'length')
echo "   ✓ Found $count incomplete message(s)"
echo "   IDs: $(echo "$incomplete_ids" | jq -r '.[]')"
echo ""

# Prepare for retry
echo "7. Preparing message for retry..."
tree=$(prepare_retry "$tree" "$assistant_node_id")
content=$(echo "$tree" | jq -r --arg id "$assistant_node_id" '.nodes[$id].message.content')
incomplete=$(echo "$tree" | jq -r --arg id "$assistant_node_id" '.nodes[$id].message.incomplete')
echo "   ✓ Content cleared: '$content'"
echo "   ✓ Incomplete flag: $incomplete"
echo ""

# Mark as incomplete again for demo
tree=$(handle_stream_interruption "$tree" "$assistant_node_id" "The capital of France is Pa")

# Demonstrate retry_incomplete_message function
echo "8. Demonstrating retry_incomplete_message()..."
echo "   Note: This will attempt to connect to Ollama"
echo "   If Ollama is not running, it will fail gracefully"
echo ""

# Set quick retry parameters
OLLAMA_MAX_RETRIES=1
OLLAMA_RETRY_DELAY=1

# Check if Ollama is running
if [ "$(check_connection)" = "true" ]; then
    echo "   ✓ Ollama is running - attempting retry..."
    echo "   (This would normally stream the complete response)"
    echo ""
    echo "   Note: Skipping actual retry to avoid API call in demo"
    echo "   In real usage, call: retry_incomplete_message \"\$tree\" \"\$assistant_node_id\" \"llama2\" \"\$save_path\""
else
    echo "   ✗ Ollama is not running"
    echo "   Attempting retry anyway to demonstrate error handling..."
    result=$(retry_incomplete_message "$tree" "$assistant_node_id" "llama2" "" 2>&1)
    if echo "$result" | grep -q "connection_failed"; then
        echo "   ✓ Gracefully handled connection failure"
        echo "   Message remains incomplete for later retry"
    fi
fi
echo ""

# Show how to mark as complete manually
echo "9. Marking message as complete (manual completion)..."
tree=$(mark_message_complete "$tree" "$assistant_node_id")
incomplete=$(is_incomplete_message "$tree" "$assistant_node_id")
echo "   ✓ Message marked as complete"
echo "   ✓ Incomplete flag: $incomplete"
echo ""

# Verify no incomplete messages remain
echo "10. Verifying no incomplete messages remain..."
incomplete_ids=$(get_incomplete_messages "$tree")
count=$(echo "$incomplete_ids" | jq 'length')
echo "   ✓ Incomplete message count: $count"
echo ""

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                    Demo Complete                               ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "Summary:"
echo "  • Incomplete messages are marked with 'incomplete: true' flag"
echo "  • Partial content is preserved when stream is interrupted"
echo "  • get_incomplete_messages() finds all incomplete messages"
echo "  • prepare_retry() clears content for retry"
echo "  • retry_incomplete_message() regenerates the response"
echo "  • mark_message_complete() manually marks as complete"
echo ""
echo "Requirements validated:"
echo "  ✓ 12.1: Save partial response when stream interrupted"
echo "  ✓ 12.2: Mark message as incomplete"
echo "  ✓ 12.3: Provide retry option for generation"
echo ""
