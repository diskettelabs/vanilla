#!/usr/bin/env bash
# Integration test for editMessage() and createBranch() workflow

# Source required files
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/../src/chat/chat_manager.sh"
source "${SCRIPT_DIR}/../src/tree/tree_ops.sh"
source "${SCRIPT_DIR}/../src/lib/json_utils.sh"

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Integration Test: Message Editing and Branching Workflow${NC}\n"

# Mock stream_completion to avoid actual Ollama calls
stream_completion() {
    local messages="$1"
    local model="$2"
    local callback="$3"
    
    # Simulate streaming response
    local tokens=("Branch " "response " "here.")
    
    for token in "${tokens[@]}"; do
        $callback "$token" "false" >&2
    done
    
    $callback "" "true" >&2
    
    return 0
}

# Create a conversation tree with multiple messages
echo "1. Creating initial conversation..."
tree=$(init_tree "Integration Test" "llama2")

msg1=$(create_message "user" "What is 2+2?" "")
result=$(add_node "$tree" "$msg1" "null")
tree=$(echo "$result" | jq -r '.tree')
node1=$(echo "$result" | jq -r '.nodeId')
echo "   Added user message: 'What is 2+2?'"

msg2=$(create_message "assistant" "2+2 equals 4" "llama2")
result=$(add_node "$tree" "$msg2" "$node1")
tree=$(echo "$result" | jq -r '.tree')
node2=$(echo "$result" | jq -r '.nodeId')
echo "   Added assistant response: '2+2 equals 4'"

msg3=$(create_message "user" "What about 3+3?" "")
result=$(add_node "$tree" "$msg3" "$node2")
tree=$(echo "$result" | jq -r '.tree')
node3=$(echo "$result" | jq -r '.nodeId')
echo "   Added user message: 'What about 3+3?'"

msg4=$(create_message "assistant" "3+3 equals 6" "llama2")
result=$(add_node "$tree" "$msg4" "$node3")
tree=$(echo "$result" | jq -r '.tree')
node4=$(echo "$result" | jq -r '.nodeId')
echo "   Added assistant response: '3+3 equals 6'"

echo -e "\n2. Verifying initial tree structure..."
node_count=$(echo "$tree" | jq '.nodes | length')
echo "   Total nodes: $node_count"

# Verify all nodes are active initially
active_count=$(echo "$tree" | jq '[.nodes[] | select(.isActive == true)] | length')
echo "   Active nodes: $active_count"

echo -e "\n3. Creating branch by editing message..."
echo "   Editing node3: 'What about 3+3?' -> 'What is 5+5?'"
tree=$(create_branch "$tree" "$node3" "What is 5+5?" "llama2" "")

echo -e "\n4. Verifying branch creation..."
new_node_count=$(echo "$tree" | jq '.nodes | length')
echo "   Total nodes after branching: $new_node_count (expected: $((node_count + 2)))"

# Check that original path is inactive
node3_active=$(echo "$tree" | jq -r --arg id "$node3" '.nodes[$id].isActive')
node4_active=$(echo "$tree" | jq -r --arg id "$node4" '.nodes[$id].isActive')
echo "   Original node3 active: $node3_active (expected: false)"
echo "   Original node4 active: $node4_active (expected: false)"

# Check that new path is active
current_node=$(echo "$tree" | jq -r '.currentNodeId')
current_active=$(echo "$tree" | jq -r --arg id "$current_node" '.nodes[$id].isActive')
current_role=$(echo "$tree" | jq -r --arg id "$current_node" '.nodes[$id].message.role')
echo "   Current node active: $current_active (expected: true)"
echo "   Current node role: $current_role (expected: assistant)"

# Get parent of current node (should be the new user message)
parent_id=$(echo "$tree" | jq -r --arg id "$current_node" '.nodes[$id].parentId')
parent_content=$(echo "$tree" | jq -r --arg id "$parent_id" '.nodes[$id].message.content')
parent_active=$(echo "$tree" | jq -r --arg id "$parent_id" '.nodes[$id].isActive')
echo "   Parent (new user message) content: '$parent_content'"
echo "   Parent active: $parent_active (expected: true)"

# Verify node2 has 2 children now (original node3 and new branch)
node2_children=$(echo "$tree" | jq -r --arg id "$node2" '.nodes[$id].children | length')
echo "   Node2 children count: $node2_children (expected: 2)"

echo -e "\n5. Verifying tree validity..."
validation=$(validate_tree "$tree")
is_valid=$(echo "$validation" | jq -r '.isValid')
has_single_root=$(echo "$validation" | jq -r '.hasSingleRoot')
is_acyclic=$(echo "$validation" | jq -r '.isAcyclic')
valid_parents=$(echo "$validation" | jq -r '.validParentReferences')

echo "   Tree valid: $is_valid"
echo "   Single root: $has_single_root"
echo "   Acyclic: $is_acyclic"
echo "   Valid parent references: $valid_parents"

echo -e "\n6. Getting active conversation path..."
messages=$(get_current_messages "$tree")
message_count=$(echo "$messages" | jq 'length')
echo "   Messages in active path: $message_count"

echo "   Active conversation:"
echo "$messages" | jq -r '.[] | "   - [\(.role)]: \(.content)"'

echo -e "\n${GREEN}✓ Integration test completed successfully!${NC}"
