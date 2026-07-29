#!/usr/bin/env bash
# Demo script for branch selector and switching functionality

# Source required modules
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/../src/chat/chat_manager.sh"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo "========================================="
echo "Branch Selector Demo"
echo "========================================="
echo

# Create a conversation tree
echo -e "${CYAN}Creating conversation tree...${NC}"
tree=$(init_tree "Branch Demo" "llama2")
echo

# Add a user message
echo -e "${BLUE}User:${NC} Tell me about the weather"
message=$(create_message "user" "Tell me about the weather")
result=$(add_node "$tree" "$message" "")
tree=$(echo "$result" | jq -r '.tree')
user_msg_id=$(echo "$result" | jq -r '.nodeId')
echo

# Simulate creating multiple response branches
echo -e "${CYAN}Creating multiple response branches...${NC}"
echo

# Branch 1: Formal response
echo -e "${GREEN}Assistant (Branch 1):${NC} The weather today is partly cloudy with a high of 72°F."
message=$(create_message "assistant" "The weather today is partly cloudy with a high of 72°F.")
result=$(add_node "$tree" "$message" "$user_msg_id")
tree=$(echo "$result" | jq -r '.tree')
branch1_id=$(echo "$result" | jq -r '.nodeId')

# Branch 2: Casual response
echo -e "${GREEN}Assistant (Branch 2):${NC} It's pretty nice out! Sunny with some clouds."
message=$(create_message "assistant" "It's pretty nice out! Sunny with some clouds.")
result=$(add_node "$tree" "$message" "$user_msg_id")
tree=$(echo "$result" | jq -r '.tree')
branch2_id=$(echo "$result" | jq -r '.nodeId')

# Branch 3: Detailed response
echo -e "${GREEN}Assistant (Branch 3):${NC} Current conditions: 68°F, partly cloudy. High: 72°F, Low: 58°F. Humidity: 65%. Wind: 5 mph NW."
message=$(create_message "assistant" "Current conditions: 68°F, partly cloudy. High: 72°F, Low: 58°F. Humidity: 65%. Wind: 5 mph NW.")
result=$(add_node "$tree" "$message" "$user_msg_id")
tree=$(echo "$result" | jq -r '.tree')
branch3_id=$(echo "$result" | jq -r '.nodeId')
echo

# Get branches
echo -e "${CYAN}Getting available branches...${NC}"
branches=$(get_branches "$tree" "$user_msg_id")
branch_count=$(echo "$branches" | jq 'length')
echo -e "Found ${YELLOW}$branch_count${NC} branches"
echo

# Display branches
echo -e "${CYAN}Available response branches:${NC}"
for ((i=0; i<branch_count; i++)); do
    content=$(echo "$branches" | jq -r ".[$i].content")
    branch_id=$(echo "$branches" | jq -r ".[$i].id")
    is_active=$(echo "$branches" | jq -r ".[$i].isActive")
    
    # Truncate long content
    if [ ${#content} -gt 70 ]; then
        content="${content:0:67}..."
    fi
    
    active_marker=""
    if [ "$is_active" = "true" ]; then
        active_marker=" ${GREEN}[ACTIVE]${NC}"
    fi
    
    echo -e "  $((i+1)). $content$active_marker"
done
echo

# Show current conversation path
echo -e "${CYAN}Current conversation path:${NC}"
messages=$(get_current_messages "$tree")
for ((i=0; i<$(echo "$messages" | jq 'length'); i++)); do
    role=$(echo "$messages" | jq -r ".[$i].role")
    content=$(echo "$messages" | jq -r ".[$i].content")
    
    if [ "$role" = "user" ]; then
        echo -e "  ${BLUE}[User]${NC} $content"
    else
        echo -e "  ${GREEN}[Assistant]${NC} $content"
    fi
done
echo

# Switch to branch 1
echo -e "${CYAN}Switching to Branch 1 (formal response)...${NC}"
tree=$(switch_branch "$tree" "$branch1_id")
echo

echo -e "${CYAN}Current conversation path after switch:${NC}"
messages=$(get_current_messages "$tree")
for ((i=0; i<$(echo "$messages" | jq 'length'); i++)); do
    role=$(echo "$messages" | jq -r ".[$i].role")
    content=$(echo "$messages" | jq -r ".[$i].content")
    
    if [ "$role" = "user" ]; then
        echo -e "  ${BLUE}[User]${NC} $content"
    else
        echo -e "  ${GREEN}[Assistant]${NC} $content"
    fi
done
echo

# Switch to branch 2
echo -e "${CYAN}Switching to Branch 2 (casual response)...${NC}"
tree=$(switch_branch "$tree" "$branch2_id")
echo

echo -e "${CYAN}Current conversation path after switch:${NC}"
messages=$(get_current_messages "$tree")
for ((i=0; i<$(echo "$messages" | jq 'length'); i++)); do
    role=$(echo "$messages" | jq -r ".[$i].role")
    content=$(echo "$messages" | jq -r ".[$i].content")
    
    if [ "$role" = "user" ]; then
        echo -e "  ${BLUE}[User]${NC} $content"
    else
        echo -e "  ${GREEN}[Assistant]${NC} $content"
    fi
done
echo

# Verify branch states
echo -e "${CYAN}Branch status:${NC}"
branch1_active=$(echo "$tree" | jq -r --arg id "$branch1_id" '.nodes[$id].isActive')
branch2_active=$(echo "$tree" | jq -r --arg id "$branch2_id" '.nodes[$id].isActive')
branch3_active=$(echo "$tree" | jq -r --arg id "$branch3_id" '.nodes[$id].isActive')

echo -e "  Branch 1: $([ "$branch1_active" = "true" ] && echo -e "${GREEN}ACTIVE${NC}" || echo -e "${YELLOW}inactive${NC}")"
echo -e "  Branch 2: $([ "$branch2_active" = "true" ] && echo -e "${GREEN}ACTIVE${NC}" || echo -e "${YELLOW}inactive${NC}")"
echo -e "  Branch 3: $([ "$branch3_active" = "true" ] && echo -e "${GREEN}ACTIVE${NC}" || echo -e "${YELLOW}inactive${NC}")"
echo

echo "========================================="
echo -e "${GREEN}Demo Complete!${NC}"
echo "========================================="
echo
echo "Key Functions Demonstrated:"
echo "  • get_branches() - Retrieve all branches from a node"
echo "  • switch_branch() - Switch active path to a different branch"
echo "  • get_current_messages() - Get messages in active path"
echo
echo "Use Cases:"
echo "  • Compare different AI responses"
echo "  • Explore alternate conversation paths"
echo "  • Navigate between conversation branches"
