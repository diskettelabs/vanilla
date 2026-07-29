#!/usr/bin/env bash
# Vanilla Chat - Simplified version with better UX
# A working chat interface without the TUI complexity

set -euo pipefail

# Get the directory where this script is located
MAIN_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Source required components
source "$MAIN_SCRIPT_DIR/src/lib/json_utils.sh"
source "$MAIN_SCRIPT_DIR/src/tree/tree_ops.sh"
source "$MAIN_SCRIPT_DIR/src/tree/auto_save.sh"
source "$MAIN_SCRIPT_DIR/src/ollama/ollama_client.sh"
source "$MAIN_SCRIPT_DIR/src/theme/theme_engine.sh"
source "$MAIN_SCRIPT_DIR/src/chat/chat_manager.sh"

# Application state
APP_STATE=""
CONVERSATION_FILE=""
SELECTED_MODEL="llama2"
SELECTED_THEME="vanilla"

# Display usage
usage() {
    cat << EOF
Vanilla Chat - Terminal chat interface for Ollama

Usage: $0 [OPTIONS]

Options:
    -t, --theme THEME       Select theme (default: vanilla)
    -m, --model MODEL       Select Ollama model (default: auto-detect)
    -c, --conversation FILE Load conversation from file
    -l, --list-models       List available Ollama models
    -h, --help              Show this help message

EOF
}

# List available models
list_models() {
    echo "Available Ollama models:"
    curl -s http://localhost:11434/api/tags 2>/dev/null | jq -r '.models[].name' 2>/dev/null || echo "  (Could not connect to Ollama)"
}

# Auto-detect a model
auto_detect_model() {
    local models
    models=$(curl -s http://localhost:11434/api/tags 2>/dev/null | jq -r '.models[].name' 2>/dev/null)
    
    if [[ -n "$models" ]]; then
        # Return the first model
        echo "$models" | head -1
    else
        echo "llama2"  # Fallback
    fi
}

# Parse arguments
parse_args() {
    local auto_model=true
    
    while [[ $# -gt 0 ]]; do
        case "$1" in
            -t|--theme)
                SELECTED_THEME="$2"
                shift 2
                ;;
            -m|--model)
                SELECTED_MODEL="$2"
                auto_model=false
                shift 2
                ;;
            -c|--conversation)
                CONVERSATION_FILE="$2"
                shift 2
                ;;
            -l|--list-models)
                list_models
                exit 0
                ;;
            -h|--help)
                usage
                exit 0
                ;;
            *)
                echo "Error: Unknown option: $1" >&2
                usage
                exit 1
                ;;
        esac
    done
    
    # Auto-detect model if not specified
    if [[ "$auto_model" == "true" ]]; then
        SELECTED_MODEL=$(auto_detect_model)
    fi
    
    export SELECTED_THEME
    export SELECTED_MODEL
}

# Initialize
initialize_app() {
    # Load theme
    if ! load_theme "$SELECTED_THEME" >/dev/null 2>&1; then
        echo "Warning: Could not load theme '$SELECTED_THEME', using defaults" >&2
    fi
    
    # Initialize or load conversation tree
    if [[ -n "$CONVERSATION_FILE" ]] && [[ -f "$CONVERSATION_FILE" ]]; then
        APP_STATE=$(load_tree "$CONVERSATION_FILE")
        if [[ $? -ne 0 ]]; then
            echo "Error loading conversation, creating new one" >&2
            APP_STATE=$(create_tree)
            CONVERSATION_FILE="$MAIN_SCRIPT_DIR/data/conversations/conversation-$(date +%s).json"
        fi
    else
        APP_STATE=$(create_tree)
        if [[ -z "$CONVERSATION_FILE" ]]; then
            mkdir -p "$MAIN_SCRIPT_DIR/data/conversations"
            CONVERSATION_FILE="$MAIN_SCRIPT_DIR/data/conversations/conversation-$(date +%s).json"
        fi
    fi
    
    # Start auto-save
    start_auto_save "$CONVERSATION_FILE" 30 >/dev/null 2>&1
}

# Display a message
display_message() {
    local role="$1"
    local content="$2"
    local timestamp="$3"
    
    # Extract time from timestamp
    local display_time
    if [[ "$timestamp" =~ ([0-9]{2}):([0-9]{2}):([0-9]{2}) ]]; then
        display_time="${BASH_REMATCH[1]}:${BASH_REMATCH[2]}:${BASH_REMATCH[3]}"
    else
        display_time=$(date +%H:%M:%S)
    fi
    
    # Color codes
    local color_reset="\033[0m"
    local color_user="\033[1;36m"      # Cyan
    local color_assistant="\033[1;35m" # Magenta
    local color_system="\033[1;33m"    # Yellow
    local color_time="\033[0;37m"      # Gray
    
    local role_color="$color_system"
    local role_name="System"
    
    if [[ "$role" == "user" ]]; then
        role_color="$color_user"
        role_name="You"
    elif [[ "$role" == "assistant" ]]; then
        role_color="$color_assistant"
        role_name="Assistant"
    fi
    
    echo ""
    echo -e "${color_time}[$display_time]${color_reset} ${role_color}${role_name}:${color_reset}"
    echo -e "$content"
    echo ""
}

# Display conversation history
display_history() {
    local messages
    messages=$(get_current_messages "$APP_STATE")
    
    if [[ -n "$messages" ]] && [[ "$messages" != "[]" ]]; then
        echo "$messages" | jq -c '.[]' | while IFS= read -r msg; do
            local role=$(echo "$msg" | jq -r '.role')
            local content=$(echo "$msg" | jq -r '.content')
            local timestamp=$(echo "$msg" | jq -r '.timestamp')
            
            display_message "$role" "$content" "$timestamp"
        done
    fi
}

# Main chat loop
chat_loop() {
    clear
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║                    Vanilla Chat                            ║"
    echo "║  Theme: $SELECTED_THEME | Model: $SELECTED_MODEL"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo ""
    
    # Display history
    display_history
    
    echo "Commands: /quit to exit, /clear to clear, /model to switch model, /help for help"
    echo "────────────────────────────────────────────────────────────────"
    echo ""
    
    while true; do
        # Prompt for input
        echo -n "> "
        read -r user_input
        
        # Handle commands
        if [[ "$user_input" == "/quit" ]] || [[ "$user_input" == "/exit" ]]; then
            break
        elif [[ "$user_input" == "/clear" ]]; then
            clear
            display_history
            continue
        elif [[ "$user_input" == "/model" ]]; then
            echo ""
            echo "Available models:"
            local models
            models=$(curl -s http://localhost:11434/api/tags 2>/dev/null | jq -r '.models[].name' 2>/dev/null)
            if [[ -n "$models" ]]; then
                echo "$models" | nl
                echo ""
                echo -n "Select model number (or press Enter to keep current): "
                read -r model_choice
                if [[ -n "$model_choice" ]] && [[ "$model_choice" =~ ^[0-9]+$ ]]; then
                    local new_model
                    new_model=$(echo "$models" | sed -n "${model_choice}p")
                    if [[ -n "$new_model" ]]; then
                        SELECTED_MODEL="$new_model"
                        echo "Switched to model: $SELECTED_MODEL"
                    fi
                fi
            else
                echo "  (Could not connect to Ollama)"
            fi
            echo ""
            continue
        elif [[ "$user_input" == "/help" ]]; then
            echo ""
            echo "Commands:"
            echo "  /quit, /exit  - Exit the chat"
            echo "  /clear        - Clear screen and redisplay history"
            echo "  /model        - Switch to a different model"
            echo "  /help         - Show this help"
            echo ""
            continue
        elif [[ -z "$user_input" ]]; then
            continue
        fi
        
        # Send message
        echo ""
        echo -e "\033[1;35mAssistant:\033[0m"
        
        # Add user message to tree
        local user_message
        user_message=$(create_message "user" "$user_input" "")
        local current_node_id
        current_node_id=$(echo "$APP_STATE" | jq -r '.currentNodeId')
        local add_result
        add_result=$(add_node "$APP_STATE" "$user_message" "$current_node_id")
        APP_STATE=$(echo "$add_result" | jq -r '.tree')
        local user_node_id
        user_node_id=$(echo "$add_result" | jq -r '.nodeId')
        
        # Get conversation history
        local messages
        messages=$(get_path "$APP_STATE" "$user_node_id")
        
        # Create assistant message node
        local assistant_message
        assistant_message=$(create_message "assistant" "" "$SELECTED_MODEL")
        add_result=$(add_node "$APP_STATE" "$assistant_message" "$user_node_id")
        APP_STATE=$(echo "$add_result" | jq -r '.tree')
        local assistant_node_id
        assistant_node_id=$(echo "$add_result" | jq -r '.nodeId')
        
        # Stream response from Ollama
        local response_text=""
        local temp_file=$(mktemp)
        
        # Build the messages array for Ollama
        local ollama_messages="["
        local first=true
        echo "$messages" | jq -c '.[]' | while IFS= read -r msg; do
            if [[ "$first" == "false" ]]; then
                echo -n "," >> "$temp_file"
            fi
            first=false
            local role=$(echo "$msg" | jq -r '.role')
            local content=$(echo "$msg" | jq -r '.content')
            echo -n "{\"role\":\"$role\",\"content\":\"$content\"}" >> "$temp_file"
        done
        ollama_messages=$(cat "$temp_file")"]"
        rm -f "$temp_file"
        
        # Stream from Ollama and capture response
        local response_file=$(mktemp)
        curl -s http://localhost:11434/api/chat -d "{
            \"model\": \"$SELECTED_MODEL\",
            \"messages\": $ollama_messages,
            \"stream\": true
        }" 2>/dev/null | while IFS= read -r line; do
            if [[ -n "$line" ]]; then
                local token=$(echo "$line" | jq -r '.message.content // empty' 2>/dev/null)
                if [[ -n "$token" ]]; then
                    printf "%s" "$token"
                    echo -n "$token" >> "$response_file"
                fi
            fi
        done
        
        response_text=$(cat "$response_file" 2>/dev/null || echo "")
        rm -f "$response_file"
        
        # Update the assistant message with the response
        if [[ -n "$response_text" ]]; then
            APP_STATE=$(echo "$APP_STATE" | jq \
                --arg node_id "$assistant_node_id" \
                --arg content "$response_text" \
                '.nodes[$node_id].message.content = $content')
        fi
        
        # Save the conversation
        if [[ -n "$CONVERSATION_FILE" ]]; then
            save_tree "$APP_STATE" "$CONVERSATION_FILE" >/dev/null 2>&1 || true
        fi
        
        echo ""
        echo ""
    done
}

# Cleanup
cleanup_app() {
    stop_auto_save 2>/dev/null || true
    
    if [[ -n "$APP_STATE" ]] && [[ -n "$CONVERSATION_FILE" ]]; then
        save_tree "$APP_STATE" "$CONVERSATION_FILE" >/dev/null 2>&1 || true
    fi
    
    echo ""
    echo "Goodbye!"
}

trap cleanup_app EXIT INT TERM

# Main
main() {
    # Ensure terminal is in a good state
    if command -v stty &> /dev/null; then
        stty echo icanon 2>/dev/null || true
    fi
    
    parse_args "$@"
    
    # Check Ollama
    if ! check_connection >/dev/null 2>&1; then
        echo "Warning: Cannot connect to Ollama service" >&2
        echo "Make sure Ollama is running: ollama serve" >&2
        echo ""
    fi
    
    initialize_app
    chat_loop
}

main "$@"
