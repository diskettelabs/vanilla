#!/usr/bin/env bash
# Demo: Message editing and branching functionality

# Source required files
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/../src/chat/chat_manager.sh"
source "${SCRIPT_DIR}/../src/tree/tree_ops.sh"
source "${SCRIPT_DIR}/../src/lib/json_utils.sh"

# Color codes for output
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  Message Editing and Branching Demo                       ║${NC}"
echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo ""

# Mock stream_completion to avoid actual Ollama calls
stream_completion() {
    local messages="$1"
    local model="$2"
    local callback="$3"
    
    # Get the last user message to generate contextual response
    local last_msg=$(echo "$messages" | jq -r '.[-1].content')
    
    # Generate a simple response based on the question
    local response="This is a simulated response to: '$last_msg'"
    
    # Simulate streaming
    for word in $response; do
        $callback "$word " "false" >&2
        sleep 0.05
    done
    
    $callback "" "true" >&2
    return 0
}

# Step 1: Create initial conversation
echo -e "${YELLOW}Step 1: Creating initial conversation${NC}"
tree=$(init_tree "Demo Conversation" "llama2")

msg1=$(create_message "user" "What is the capital of France?" "")
result=$(add_node "$tree" "$msg1" "null")
tree=$(echo "$result" | jq -r '.tree')
node1=$(echo "$result" | jq -r '.nodeId')
echo -e "  ${GREEN}✓${NC} Added: What is the capital of France?"

msg2=$(create_message "assistant" "The capital of France is Paris." "llama2")
result=$(add_node "$tree" "$msg2" "$node1")
tree=$(echo "$result" | jq -r '.tree')
node2=$(echo "$result" | jq -r '.nodeId')
echo -e "  ${GREEN}✓${NC} Response: The capital of France is Paris."

msg3=$(create_message "user" "What about Germany?" "")
result=$(add_node "$tree" "$msg3" "$node2")
tree=$(echo "$result" | jq -r '.tree')
node3=$(echo "$result" | jq -r '.nodeId')
echo -e "  ${GREEN}✓${NC} Added: What about Germany?"

msg4=$(create_message "assistant" "The capital of Germany is Berlin." "llama2")
result=$(add_node "$tree" "$msg4" "$node3")
tree=$(echo "$result" | jq -r '.tree')
node4=$(echo "$result" | jq -r '.nodeId')
echo -e "  ${GREEN}✓${NC} Response: The capital of Germany is Berlin."

echo ""
echo -e "${MAGENTA}Current conversation path:${NC}"
get_current_messages "$tree" | jq -r '.[] | "  [\(.role)]: \(.content)"'

# Step 2: Create a branch by editing a message
echo ""
echo -e "${YELLOW}Step 2: Creating a branch by editing message${NC}"
echo -e "  Editing: 'What about Germany?' → 'What about Italy?'"
echo -n "  Generating new response: "

tree=$(create_branch "$tree" "$node3" "What about Italy?" "llama2" "")
echo ""
echo -e "  ${GREEN}✓${NC} Branch created successfully!"

# Step 3: Show the new active path
echo ""
echo -e "${MAGENTA}New active conversation path:${NC}"
get_current_messages "$tree" | jq -r '.[] | "  [\(.role)]: \(.content)"'

# Step 4: Show tree structure
echo ""
echo -e "${YELLOW}Step 3: Tree structure analysis${NC}"
node_count=$(echo "$tree" | jq '.nodes | length')
echo -e "  Total nodes: ${GREEN}$node_count${NC}"

active_count=$(echo "$tree" | jq '[.nodes[] | select(.isActive == true)] | length')
inactive_count=$(echo "$tree" | jq '[.nodes[] | select(.isActive == false)] | length')
echo -e "  Active nodes: ${GREEN}$active_count${NC}"
echo -e "  Inactive nodes: ${YELLOW}$inactive_count${NC}"

# Step 5: Validate tree
echo ""
echo -e "${YELLOW}Step 4: Tree validation${NC}"
validation=$(validate_tree "$tree")
is_valid=$(echo "$validation" | jq -r '.isValid')
has_single_root=$(echo "$validation" | jq -r '.hasSingleRoot')
is_acyclic=$(echo "$validation" | jq -r '.isAcyclic')

if [ "$is_valid" = "true" ]; then
    echo -e "  ${GREEN}✓${NC} Tree is valid"
    echo -e "  ${GREEN}✓${NC} Single root: $has_single_root"
    echo -e "  ${GREEN}✓${NC} Acyclic: $is_acyclic"
else
    echo -e "  ${RED}✗${NC} Tree validation failed"
fi

# Step 6: Show branching point
echo ""
echo -e "${YELLOW}Step 5: Branching point details${NC}"
children=$(echo "$tree" | jq -r --arg id "$node2" '.nodes[$id].children | length')
echo -e "  Node after 'Paris' response has ${GREEN}$children${NC} children (branches)"

echo ""
echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  Demo completed successfully!                              ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
