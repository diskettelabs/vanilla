#!/usr/bin/env bash
# Vanilla Chat TUI - Main Application Entry Point
# A minimalist terminal-based chat interface for local AI models via Ollama

set -euo pipefail

# Get the directory where this script is located
MAIN_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Source all required components
source "$MAIN_SCRIPT_DIR/src/lib/json_utils.sh"
source "$MAIN_SCRIPT_DIR/src/tree/tree_ops.sh"
source "$MAIN_SCRIPT_DIR/src/tree/auto_save.sh"
source "$MAIN_SCRIPT_DIR/src/ollama/ollama_client.sh"
source "$MAIN_SCRIPT_DIR/src/theme/theme_engine.sh"
source "$MAIN_SCRIPT_DIR/src/monitor/system_monitor.sh"
source "$MAIN_SCRIPT_DIR/src/tui/logo.sh"
source "$MAIN_SCRIPT_DIR/src/tui/screen.sh"
source "$MAIN_SCRIPT_DIR/src/chat/chat_manager.sh"

# Application state
APP_STATE=""
CONVERSATION_FILE=""
SELECTED_MODEL="llama2"
LAST_METRICS_UPDATE=0
METRICS_UPDATE_INTERVAL=1

# Display usage information
usage() {
    cat << EOF
Vanilla Chat TUI - Terminal-based chat interface for Ollama

Usage: $0 [OPTIONS]

Options:
    -t, --theme THEME       Select theme (default: vanilla)
    -m, --model MODEL       Select Ollama model (default: llama2)
    -c, --conversation FILE Load conversation from file
    -l, --list-themes       List available themes
    -h, --help              Show this help message

Available themes:
$(list_themes | sed 's/^/    /')

Examples:
    $0                              # Start with default settings
    $0 -t chocolate -m llama2       # Start with chocolate theme
    $0 -c my-chat.json              # Load existing conversation

EOF
}

# Parse command line arguments
parse_args() {
    local theme="vanilla"
    local model="llama2"
    local conversation=""
    
    while [[ $# -gt 0 ]]; do
        case "$1" in
            -t|--theme)
                theme="$2"
                shift 2
                ;;
            -m|--model)
                model="$2"
                shift 2
                ;;
            -c|--conversation)
                conversation="$2"
                shift 2
                ;;
            -l|--list-themes)
                echo "Available themes:"
                list_themes
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
    
    # Validate theme exists
    if ! theme_exists "$theme"; then
        echo "Error: Theme '$theme' not found" >&2
        echo "Available themes:" >&2
        list_themes >&2
        exit 1
    fi
    
    # Export selections
    export SELECTED_THEME="$theme"
    export SELECTED_MODEL="$model"
    export CONVERSATION_FILE="$conversation"
}

# Initialize application state
initialize_app() {
    # Load theme first (required for TUI rendering)
    if ! load_theme "$SELECTED_THEME"; then
        echo "Error: Failed to load theme '$SELECTED_THEME'" >&2
        exit 1
    fi
    
    # Initialize or load conversation tree
    if [[ -n "$CONVERSATION_FILE" ]] && [[ -f "$CONVERSATION_FILE" ]]; then
        # Load existing conversation
        APP_STATE=$(load_tree "$CONVERSATION_FILE")
        
        if [[ $? -ne 0 ]]; then
            echo "Error: Failed to load conversation from '$CONVERSATION_FILE'" >&2
            echo "Would you like to create a new conversation? (y/n)" >&2
            read -r response
            if [[ "$response" =~ ^[Yy]$ ]]; then
                APP_STATE=$(create_tree)
                CONVERSATION_FILE="$MAIN_SCRIPT_DIR/data/conversations/conversation-$(date +%s).json"
            else
                exit 1
            fi
        fi
    else
        # Create new conversation
        APP_STATE=$(create_tree)
        
        # Generate conversation file path if not specified
        if [[ -z "$CONVERSATION_FILE" ]]; then
            mkdir -p "$MAIN_SCRIPT_DIR/data/conversations"
            CONVERSATION_FILE="$MAIN_SCRIPT_DIR/data/conversations/conversation-$(date +%s).json"
        fi
    fi
    
    # Validate tree structure
    if ! validate_tree "$APP_STATE" >/dev/null 2>&1; then
        echo "Error: Conversation tree is invalid or corrupted" >&2
        echo "Would you like to create a new conversation? (y/n)" >&2
        read -r response
        if [[ "$response" =~ ^[Yy]$ ]]; then
            # Backup corrupted file if it exists
            if [[ -f "$CONVERSATION_FILE" ]]; then
                local backup_file="${CONVERSATION_FILE}.backup-$(date +%s)"
                cp "$CONVERSATION_FILE" "$backup_file"
                echo "Corrupted conversation backed up to: $backup_file" >&2
            fi
            
            APP_STATE=$(create_tree)
        else
            exit 1
        fi
    fi
    
    # Initialize TUI (connects to theme engine)
    if ! initialize; then
        echo "Error: Failed to initialize TUI" >&2
        exit 1
    fi
    
    # Start system monitor (connects to TUI via status bar)
    startMonitoring 1 >/dev/null 2>&1
    
    # Start auto-save background process (connects to conversation tree)
    start_auto_save "$CONVERSATION_FILE" 30 >/dev/null 2>&1
    
    # Load existing messages into display if conversation has history
    local messages
    messages=$(get_current_messages "$APP_STATE")
    
    if [[ -n "$messages" ]] && [[ "$messages" != "[]" ]]; then
        echo "$messages" | jq -c '.[]' | while IFS= read -r msg; do
            local role
            role=$(echo "$msg" | jq -r '.role')
            local content
            content=$(echo "$msg" | jq -r '.content')
            local timestamp
            timestamp=$(echo "$msg" | jq -r '.timestamp')
            local is_incomplete
            is_incomplete=$(echo "$msg" | jq -r '.incomplete // false')
            
            local display_msg
            display_msg=$(displayMessage "$role" "$content" "$timestamp" "$is_incomplete")
            addMessageToDisplay "$display_msg"
        done
    fi
    
    # Display welcome message
    local welcome_msg
    welcome_msg=$(displayMessage "system" "Welcome to Vanilla Chat! Theme: $SELECTED_THEME | Model: $SELECTED_MODEL" "$(date -Iseconds)")
    addMessageToDisplay "$welcome_msg"
}

# Process input events from TUI
process_input_event() {
    local event="$1"
    
    if [[ -z "$event" ]]; then
        return 0
    fi
    
    # Parse event type
    local event_type
    event_type=$(echo "$event" | jq -r '.type' 2>/dev/null)
    
    case "$event_type" in
        "submit")
            # User submitted a message
            local message
            message=$(echo "$event" | jq -r '.message' 2>/dev/null)
            
            if [[ -n "$message" ]]; then
                handle_message_submit "$message"
            fi
            ;;
        
        "theme_switch")
            # User requested theme switch
            handle_theme_switch
            ;;
        
        "branch_nav")
            # User requested branch navigation
            handle_branch_navigation
            ;;
        
        "quit")
            # User requested quit
            return 1
            ;;
        
        *)
            # Unknown event type, ignore
            ;;
    esac
    
    return 0
}

# Handle message submission
handle_message_submit() {
    local message="$1"
    
    # Display user message immediately
    local user_msg
    user_msg=$(displayMessage "user" "$message" "$(date -Iseconds)")
    addMessageToDisplay "$user_msg"
    render
    
    # Display "Assistant is typing..." placeholder
    local typing_msg
    typing_msg=$(displayMessage "assistant" "..." "$(date -Iseconds)")
    addMessageToDisplay "$typing_msg"
    render
    
    # Send message and get response (streaming tokens will be printed to stdout)
    # Capture both stdout and the tree result
    local temp_output
    temp_output=$(mktemp)
    local new_tree
    new_tree=$(send_message "$APP_STATE" "$message" "$SELECTED_MODEL" "$CONVERSATION_FILE" 2>&1 | tee "$temp_output")
    local send_exit_code=$?
    
    # Remove the typing placeholder
    unset 'MESSAGE_HISTORY[-1]'
    
    if [[ $send_exit_code -eq 0 ]]; then
        # Success - update app state
        APP_STATE="$new_tree"
        
        # Display complete assistant response
        local current_node_id
        current_node_id=$(echo "$APP_STATE" | jq -r '.currentNodeId')
        local assistant_node
        assistant_node=$(get_node "$APP_STATE" "$current_node_id")
        local assistant_content
        assistant_content=$(echo "$assistant_node" | jq -r '.message.content')
        local is_incomplete
        is_incomplete=$(echo "$assistant_node" | jq -r '.message.incomplete // false')
        
        local assistant_msg
        assistant_msg=$(displayMessage "assistant" "$assistant_content" "$(date -Iseconds)" "$is_incomplete")
        addMessageToDisplay "$assistant_msg"
    else
        # Error occurred - check if it's a connection error
        if echo "$new_tree" | jq -e '.error == "connection_failed"' >/dev/null 2>&1; then
            # Connection failed but user message was saved
            local error_msg
            error_msg=$(echo "$new_tree" | jq -r '.message')
            APP_STATE=$(echo "$new_tree" | jq -r '.tree')
            
            # Display error message
            local error_display
            error_display=$(displayMessage "system" "$error_msg" "$(date -Iseconds)")
            addMessageToDisplay "$error_display"
        else
            # Other error - try to extract tree if available
            if echo "$new_tree" | jq -e '.tree' >/dev/null 2>&1; then
                APP_STATE=$(echo "$new_tree" | jq -r '.tree')
                
                # Check if there's a partial response to display
                local current_node_id
                current_node_id=$(echo "$APP_STATE" | jq -r '.currentNodeId')
                if [[ -n "$current_node_id" ]] && [[ "$current_node_id" != "null" ]]; then
                    local assistant_node
                    assistant_node=$(get_node "$APP_STATE" "$current_node_id")
                    local assistant_content
                    assistant_content=$(echo "$assistant_node" | jq -r '.message.content')
                    
                    if [[ -n "$assistant_content" ]] && [[ "$assistant_content" != "" ]]; then
                        # Display partial response
                        local assistant_msg
                        assistant_msg=$(displayMessage "assistant" "$assistant_content" "$(date -Iseconds)" "true")
                        addMessageToDisplay "$assistant_msg"
                    fi
                fi
            fi
            
            # Display error message
            local error_display
            error_display=$(displayMessage "system" "Error: Streaming interrupted. Partial response saved." "$(date -Iseconds)")
            addMessageToDisplay "$error_display"
        fi
    fi
    
    # Clean up temp file
    rm -f "$temp_output"
    
    render
}

# Handle theme switching
handle_theme_switch() {
    # Get list of themes
    local themes
    mapfile -t themes < <(list_themes)
    
    # Find current theme index
    local current_index=0
    for i in "${!themes[@]}"; do
        if [[ "${themes[$i]}" == "$SELECTED_THEME" ]]; then
            current_index=$i
            break
        fi
    done
    
    # Switch to next theme
    local next_index=$(( (current_index + 1) % ${#themes[@]} ))
    local next_theme="${themes[$next_index]}"
    
    # Load new theme
    if load_theme "$next_theme"; then
        SELECTED_THEME="$next_theme"
        
        # Display theme change message
        local theme_msg
        theme_msg=$(displayMessage "system" "Theme changed to: $next_theme" "$(date -Iseconds)")
        addMessageToDisplay "$theme_msg"
        
        render
    fi
}

# Handle branch navigation
handle_branch_navigation() {
    # Get current node
    local current_node_id
    current_node_id=$(echo "$APP_STATE" | jq -r '.currentNodeId')
    
    if [[ -z "$current_node_id" ]] || [[ "$current_node_id" == "null" ]]; then
        local msg
        msg=$(displayMessage "system" "No conversation to navigate" "$(date -Iseconds)")
        addMessageToDisplay "$msg"
        render
        return 0
    fi
    
    # Get current node's parent to find sibling branches
    local current_node
    current_node=$(get_node "$APP_STATE" "$current_node_id")
    local parent_id
    parent_id=$(echo "$current_node" | jq -r '.parentId')
    
    if [[ -z "$parent_id" ]] || [[ "$parent_id" == "null" ]]; then
        # At root, no branches to navigate
        local msg
        msg=$(displayMessage "system" "No branches available at root" "$(date -Iseconds)")
        addMessageToDisplay "$msg"
        render
        return 0
    fi
    
    # Get branches from parent
    local branches
    branches=$(get_branches "$APP_STATE" "$parent_id")
    local branch_count
    branch_count=$(echo "$branches" | jq 'length')
    
    if [[ "$branch_count" -le 1 ]]; then
        # No alternate branches
        local msg
        msg=$(displayMessage "system" "No alternate branches available" "$(date -Iseconds)")
        addMessageToDisplay "$msg"
        render
        return 0
    fi
    
    # Show branch selector (this will handle its own rendering)
    local selected_branch_id
    selected_branch_id=$(showBranchSelector "$branches")
    
    if [[ -n "$selected_branch_id" ]] && [[ "$selected_branch_id" != "null" ]] && [[ "$selected_branch_id" != "" ]]; then
        # Switch to selected branch
        APP_STATE=$(switch_branch "$APP_STATE" "$selected_branch_id")
        
        # Save the updated tree
        if [[ -n "$CONVERSATION_FILE" ]]; then
            save_tree "$APP_STATE" "$CONVERSATION_FILE" 2>/dev/null || true
        fi
        
        # Reload messages for new branch
        clearMessages
        local messages
        messages=$(get_current_messages "$APP_STATE")
        
        # Display all messages in the branch
        if [[ -n "$messages" ]] && [[ "$messages" != "[]" ]]; then
            echo "$messages" | jq -c '.[]' | while IFS= read -r msg; do
                local role
                role=$(echo "$msg" | jq -r '.role')
                local content
                content=$(echo "$msg" | jq -r '.content')
                local timestamp
                timestamp=$(echo "$msg" | jq -r '.timestamp')
                local is_incomplete
                is_incomplete=$(echo "$msg" | jq -r '.incomplete // false')
                
                local display_msg
                display_msg=$(displayMessage "$role" "$content" "$timestamp" "$is_incomplete")
                addMessageToDisplay "$display_msg"
            done
        fi
        
        # Display success message
        local msg
        msg=$(displayMessage "system" "Switched to alternate branch" "$(date -Iseconds)")
        addMessageToDisplay "$msg"
    fi
    
    # Always re-render after branch selector (whether selected or cancelled)
    render
}

# Main application loop
runMainLoop() {
    local last_metrics_update=$(date +%s)
    local needs_render=true
    
    # Initial render
    render
    
    # Main event loop
    while true; do
        # Check if we need to update metrics (every 5 seconds instead of 1)
        local current_time=$(date +%s)
        if [[ $((current_time - last_metrics_update)) -ge 5 ]]; then
            last_metrics_update=$current_time
            # Only update status bar, don't trigger full render
            renderStatusBar $((SCREEN_HEIGHT - 2))
        fi
        
        # Handle user input with 100ms timeout
        local input_event
        input_event=$(handleInput)
        
        if [[ -n "$input_event" ]]; then
            # Process the input event
            if ! process_input_event "$input_event"; then
                # User requested quit
                break
            fi
            # Input was processed, trigger render if needed
            needs_render=true
        fi
        
        # Only render if something changed
        if [[ "$needs_render" == "true" ]]; then
            # Don't render on every input, just update input area
            needs_render=false
        fi
        
        # Small sleep to prevent CPU spinning
        sleep 0.05 || true
    done
}

# Cleanup on exit
cleanup_app() {
    # Stop system monitor
    stopMonitoring 2>/dev/null || true
    
    # Stop auto-save
    stop_auto_save 2>/dev/null || true
    
    # Save final state
    if [[ -n "$APP_STATE" ]] && [[ -n "$CONVERSATION_FILE" ]]; then
        save_tree "$APP_STATE" "$CONVERSATION_FILE" >/dev/null 2>&1 || true
    fi
    
    # Cleanup TUI
    cleanup 2>/dev/null || true
    
    echo "Goodbye!"
}

# Register cleanup handler
trap cleanup_app EXIT INT TERM

# Main entry point
main() {
    # Parse command line arguments
    parse_args "$@"
    
    # Check Ollama connection (warn but don't fail)
    if ! check_connection >/dev/null 2>&1; then
        echo "Warning: Cannot connect to Ollama service" >&2
        echo "The application will start, but you won't be able to send messages until Ollama is running." >&2
        echo "Press Enter to continue..." >&2
        read -r
    fi
    
    # Initialize application
    initialize_app
    
    # Run main loop
    runMainLoop
}

# Run main function
main "$@"
