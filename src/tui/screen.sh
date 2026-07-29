#!/usr/bin/env bash
# Screen layout and rendering functions for Vanilla Chat TUI
# Handles terminal initialization, main interface rendering, scrolling, and status bar

set -euo pipefail

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Source dependencies
source "$PROJECT_ROOT/src/theme/theme_engine.sh"
source "$PROJECT_ROOT/src/monitor/system_monitor.sh"
source "$PROJECT_ROOT/src/tui/logo.sh"

# Global state variables
SCREEN_WIDTH=0
SCREEN_HEIGHT=0
SCROLL_POSITION=0
MESSAGE_HISTORY=()
INPUT_BUFFER=""
IS_INITIALIZED=false
RENDER_NEXT_ROW=0

# ANSI escape codes
ESC=$'\033'
CLEAR_SCREEN="${ESC}[2J"
HIDE_CURSOR="${ESC}[?25l"
SHOW_CURSOR="${ESC}[?25h"
MOVE_HOME="${ESC}[H"
CLEAR_LINE="${ESC}[2K"
SAVE_CURSOR="${ESC}[s"
RESTORE_CURSOR="${ESC}[u"

# Initialize terminal for TUI rendering
# Sets up terminal state, clears screen, hides cursor
# Returns: 0 on success, 1 on failure
initialize() {
    # Check if terminal supports required features
    if [[ ! -t 1 ]]; then
        echo "Error: Not running in a terminal" >&2
        return 1
    fi
    
    # Get terminal dimensions
    updateTerminalSize
    
    # Set up terminal
    echo -ne "$CLEAR_SCREEN"
    echo -ne "$HIDE_CURSOR"
    echo -ne "$MOVE_HOME"
    
    # Disable line buffering for immediate input
    if command -v stty &> /dev/null; then
        stty -echo -icanon time 0 min 0 2>/dev/null || true
    fi
    
    # Set up signal handlers for cleanup
    trap cleanup EXIT INT TERM
    trap handleResize WINCH
    
    IS_INITIALIZED=true
    return 0
}

# Clean up terminal state on exit
# Restores cursor, echo, and canonical mode
cleanup() {
    # Always restore terminal, even if not initialized
    echo -ne "$SHOW_CURSOR" 2>/dev/null || true
    
    # Restore terminal settings
    if command -v stty &> /dev/null; then
        stty echo icanon 2>/dev/null || true
    fi
    
    if [[ "$IS_INITIALIZED" == "true" ]]; then
        echo -ne "$CLEAR_SCREEN"
        echo -ne "$MOVE_HOME"
        IS_INITIALIZED=false
    fi
}

# Update terminal dimensions
# Reads current terminal size and updates global variables
updateTerminalSize() {
    if command -v tput &> /dev/null; then
        SCREEN_WIDTH=$(tput cols 2>/dev/null || echo 80)
        SCREEN_HEIGHT=$(tput lines 2>/dev/null || echo 24)
    else
        # Fallback to stty
        local size
        size=$(stty size 2>/dev/null || echo "24 80")
        SCREEN_HEIGHT=$(echo "$size" | awk '{print $1}')
        SCREEN_WIDTH=$(echo "$size" | awk '{print $2}')
    fi
}

# Handle terminal resize events
# Updates dimensions and triggers re-render
handleResize() {
    updateTerminalSize
    render
}

# Move cursor to specific position
# Args: $1 - row (1-indexed), $2 - column (1-indexed)
moveCursor() {
    local row="$1"
    local col="$2"
    echo -ne "${ESC}[${row};${col}H"
}

# Render the complete chat interface
# Displays logo, message history, status bar, and input area
render() {
    if [[ "$IS_INITIALIZED" != "true" ]]; then
        return 1
    fi
    
    # Clear screen
    echo -ne "$CLEAR_SCREEN"
    echo -ne "$MOVE_HOME"
    
    local current_row=1
    
    # Render logo at the top
    renderLogo "$current_row"
    current_row=$RENDER_NEXT_ROW
    
    # Add separator line
    current_row=$((current_row + 1))
    moveCursor "$current_row" 1
    renderSeparator
    current_row=$((current_row + 1))
    
    # Calculate available space for message history
    # Reserve space for: logo (10 lines) + separator (1) + status bar (1) + input area (3)
    local message_area_height=$((SCREEN_HEIGHT - 15))
    if [[ $message_area_height -lt 5 ]]; then
        message_area_height=5
    fi
    
    # Render message history
    renderMessageHistory "$current_row" "$message_area_height"
    current_row=$RENDER_NEXT_ROW
    
    # Render status bar at bottom
    local status_bar_row=$((SCREEN_HEIGHT - 2))
    renderStatusBar "$status_bar_row"
    
    # Render input area at very bottom
    local input_row=$((SCREEN_HEIGHT - 1))
    renderInputArea "$input_row"
}

# Render the ASCII logo
# Args: $1 - starting row
# Returns: next available row
renderLogo() {
    local start_row="$1"
    local row="$start_row"
    
    # Generate logo with current theme
    local logo_lines
    if [[ -n "$(get_current_theme)" ]]; then
        # Capture logo output line by line
        while IFS= read -r line; do
            moveCursor "$row" 1
            echo -ne "$CLEAR_LINE"
            # Center the logo (logo is 21 chars wide)
            local padding=$(( (SCREEN_WIDTH - 21) / 2 ))
            if [[ $padding -gt 0 ]]; then
                printf "%${padding}s" ""
            fi
            echo -ne "$line"
            row=$((row + 1))
        done < <(generateLogo "primary")
    else
        # No theme loaded, show plain logo
        moveCursor "$row" 1
        echo "No theme loaded"
        row=$((row + 1))
    fi
    
    RENDER_NEXT_ROW=$row
}

# Render a separator line
renderSeparator() {
    local sep_char="─"
    local separator=""
    for ((i=0; i<SCREEN_WIDTH; i++)); do
        separator="${separator}${sep_char}"
    done
    
    if [[ -n "$(get_current_theme)" ]]; then
        local border_color
        border_color=$(get_theme_color "border" 2>/dev/null || echo "")
        if [[ -n "$border_color" ]]; then
            local ansi_code
            ansi_code=$(hex_to_ansi256 "$border_color")
            echo -ne "$(apply_ansi_color "$separator" "$ansi_code")"
        else
            echo -ne "$separator"
        fi
    else
        echo -ne "$separator"
    fi
}

# Render message history with scrolling support
# Args: $1 - starting row, $2 - available height
# Returns: next available row
renderMessageHistory() {
    local start_row="$1"
    local available_height="$2"
    local row="$start_row"
    
    # Calculate which messages to display based on scroll position
    local total_messages="${#MESSAGE_HISTORY[@]}"
    
    # Render messages, handling multi-line content
    local lines_rendered=0
    for ((i=0; i<total_messages && lines_rendered<available_height; i++)); do
        # Get message and split into lines
        local message="${MESSAGE_HISTORY[$i]}"
        
        # Split message into lines (bash 3.2 compatible)
        local IFS=$'\n'
        local -a message_lines
        message_lines=($(echo -e "$message"))
        
        # Render each line of the message
        local line
        for line in "${message_lines[@]}"; do
            if [[ $lines_rendered -ge $available_height ]]; then
                break
            fi
            
            moveCursor "$row" 1
            echo -ne "$CLEAR_LINE"
            echo -ne "$line"
            
            row=$((row + 1))
            lines_rendered=$((lines_rendered + 1))
        done
        
        # Add blank line between messages if there's space
        if [[ $lines_rendered -lt $available_height ]]; then
            moveCursor "$row" 1
            echo -ne "$CLEAR_LINE"
            row=$((row + 1))
            lines_rendered=$((lines_rendered + 1))
        fi
    done
    
    # Clear remaining lines in message area
    while [[ $row -lt $((start_row + available_height)) ]]; do
        moveCursor "$row" 1
        echo -ne "$CLEAR_LINE"
        row=$((row + 1))
    done
    
    RENDER_NEXT_ROW=$row
}

# Render status bar with CPU/RAM metrics
# Args: $1 - row position
renderStatusBar() {
    local row="$1"
    
    moveCursor "$row" 1
    echo -ne "$CLEAR_LINE"
    
    # Get system metrics
    local metrics
    metrics=$(getMetrics 2>/dev/null || echo '{"cpu":"N/A","ram":"N/A"}')
    
    local cpu
    local ram
    cpu=$(echo "$metrics" | jq -r '.cpu' 2>/dev/null || echo "N/A")
    ram=$(echo "$metrics" | jq -r '.ram' 2>/dev/null || echo "N/A")
    
    # Format CPU and RAM values
    local cpu_display="CPU: ${cpu}"
    local ram_display="RAM: ${ram}"
    
    if [[ "$cpu" != "N/A" ]]; then
        cpu_display="CPU: ${cpu}%"
    fi
    
    if [[ "$ram" != "N/A" ]]; then
        ram_display="RAM: ${ram}%"
    fi
    
    # Build status bar content
    local status_text="  ${cpu_display}  |  ${ram_display}  "
    
    # Apply theme colors if available
    if [[ -n "$(get_current_theme)" ]]; then
        local status_color
        status_color=$(get_theme_color "statusBar" 2>/dev/null || echo "")
        if [[ -n "$status_color" ]]; then
            local ansi_code
            ansi_code=$(hex_to_ansi256 "$status_color")
            
            # Create full-width status bar with background color
            local padding=$((SCREEN_WIDTH - ${#status_text}))
            local padded_text="${status_text}"
            if [[ $padding -gt 0 ]]; then
                printf -v padded_text "%-${SCREEN_WIDTH}s" "$status_text"
            fi
            
            echo -ne "$(apply_ansi_color "$padded_text" "$ansi_code")"
        else
            echo -ne "$status_text"
        fi
    else
        echo -ne "$status_text"
    fi
}

# Render input area with prompt
# Args: $1 - row position
renderInputArea() {
    local row="$1"
    
    moveCursor "$row" 1
    echo -ne "$CLEAR_LINE"
    
    # Display prompt and input buffer
    local prompt="> "
    echo -ne "$prompt$INPUT_BUFFER"
    
    # Position cursor at end of input
    local cursor_col=$((${#prompt} + ${#INPUT_BUFFER} + 1))
    moveCursor "$row" "$cursor_col"
}

# Scroll message history up (show older messages)
# Args: $1 - number of lines to scroll (default: 1)
scrollUp() {
    local lines="${1:-1}"
    
    if [[ $SCROLL_POSITION -gt 0 ]]; then
        SCROLL_POSITION=$((SCROLL_POSITION - lines))
        if [[ $SCROLL_POSITION -lt 0 ]]; then
            SCROLL_POSITION=0
        fi
        # Only render if initialized
        if [[ "$IS_INITIALIZED" == "true" ]]; then
            render
        fi
    fi
}

# Scroll message history down (show newer messages)
# Args: $1 - number of lines to scroll (default: 1)
scrollDown() {
    local lines="${1:-1}"
    local max_scroll=$((${#MESSAGE_HISTORY[@]} - 1))
    
    if [[ $SCROLL_POSITION -lt $max_scroll ]]; then
        SCROLL_POSITION=$((SCROLL_POSITION + lines))
        if [[ $SCROLL_POSITION -gt $max_scroll ]]; then
            SCROLL_POSITION=$max_scroll
        fi
        # Only render if initialized
        if [[ "$IS_INITIALIZED" == "true" ]]; then
            render
        fi
    fi
}

# Display a message with role, content, and timestamp
# Args: $1 - role (user or assistant)
#       $2 - content (message text)
#       $3 - timestamp (ISO 8601 format)
#       $4 - is_incomplete (optional, "true" if message is incomplete)
# Returns: formatted message string
displayMessage() {
    local role="$1"
    local content="$2"
    local timestamp="$3"
    local is_incomplete="${4:-false}"
    
    # Format timestamp for display (extract time portion)
    local display_time
    if [[ "$timestamp" =~ ([0-9]{2}):([0-9]{2}):([0-9]{2}) ]]; then
        display_time="${BASH_REMATCH[1]}:${BASH_REMATCH[2]}:${BASH_REMATCH[3]}"
    else
        # Fallback if timestamp doesn't match expected format
        display_time="$timestamp"
    fi
    
    # Determine role display and color
    local role_display
    local role_color_key
    
    if [[ "$role" == "user" ]]; then
        role_display="User"
        role_color_key="userMessage"
    elif [[ "$role" == "assistant" ]]; then
        role_display="Assistant"
        role_color_key="assistantMessage"
    else
        role_display="System"
        role_color_key="text"
    fi
    
    # Add incomplete marker if needed
    local incomplete_marker=""
    if [[ "$is_incomplete" == "true" ]]; then
        incomplete_marker=" [incomplete]"
    fi
    
    # Format the message header with visual separator
    local header="┌─ [${display_time}] ${role_display}${incomplete_marker}"
    
    # Apply theme colors if available
    local formatted_message
    if [[ -n "$(get_current_theme)" ]]; then
        local role_color
        role_color=$(get_theme_color "$role_color_key" 2>/dev/null || echo "")
        
        if [[ -n "$role_color" ]]; then
            local ansi_code
            ansi_code=$(hex_to_ansi256 "$role_color")
            formatted_message="$(apply_ansi_color "$header" "$ansi_code")"
        else
            formatted_message="$header"
        fi
    else
        formatted_message="$header"
    fi
    
    # Add content with box drawing and indentation
    # Word wrap content to fit screen width (leave room for "│ " prefix and margins)
    local max_width=$((SCREEN_WIDTH - 4))
    if [[ $max_width -lt 40 ]]; then
        max_width=40  # Minimum width
    fi
    
    # Simple word wrapping
    local wrapped_content=""
    local current_line=""
    for word in $content; do
        if [[ ${#current_line} -eq 0 ]]; then
            current_line="$word"
        elif [[ $((${#current_line} + ${#word} + 1)) -le $max_width ]]; then
            current_line="$current_line $word"
        else
            wrapped_content="${wrapped_content}│ ${current_line}\n"
            current_line="$word"
        fi
    done
    
    # Add the last line
    if [[ -n "$current_line" ]]; then
        wrapped_content="${wrapped_content}│ ${current_line}\n"
    fi
    
    formatted_message="${formatted_message}\n${wrapped_content}└─"
    
    echo -e "$formatted_message"
}

# Add a message to the display history
# Args: $1 - formatted message string
addMessageToDisplay() {
    local message="$1"
    MESSAGE_HISTORY+=("$message")
    
    # Auto-scroll to bottom when new message added
    local max_scroll=$((${#MESSAGE_HISTORY[@]} - 1))
    if [[ $max_scroll -lt 0 ]]; then
        max_scroll=0
    fi
    SCROLL_POSITION=$max_scroll
}

# Clear all messages from display
clearMessages() {
    MESSAGE_HISTORY=()
    SCROLL_POSITION=0
}

# Update input buffer
# Args: $1 - new input buffer content
updateInputBuffer() {
    INPUT_BUFFER="$1"
}

# Get current input buffer
getInputBuffer() {
    echo "$INPUT_BUFFER"
}

# Show branch selector UI for multiple branches
# Args: $1 - JSON array of branch objects
# Returns: selected branch ID or empty string if cancelled
showBranchSelector() {
    local branches="$1"
    
    # Validate input
    if [ -z "$branches" ]; then
        echo ""
        return 1
    fi
    
    # Count branches
    local branch_count=$(echo "$branches" | jq 'length')
    
    if [ "$branch_count" -eq 0 ]; then
        echo ""
        return 1
    fi
    
    # If only one branch, return it automatically
    if [ "$branch_count" -eq 1 ]; then
        echo "$branches" | jq -r '.[0].id'
        return 0
    fi
    
    # Save current cursor position
    echo -ne "$SAVE_CURSOR"
    
    # Clear screen and show branch selector
    echo -ne "$CLEAR_SCREEN"
    echo -ne "$MOVE_HOME"
    
    # Display header
    echo "Select a branch (use arrow keys, Enter to select, Esc to cancel):"
    echo ""
    
    # Display branches with numbering
    local selected_index=0
    local display_branches=()
    
    for ((i=0; i<branch_count; i++)); do
        local branch=$(echo "$branches" | jq -r ".[$i]")
        local content=$(echo "$branch" | jq -r '.content')
        local timestamp=$(echo "$branch" | jq -r '.timestamp')
        local is_active=$(echo "$branch" | jq -r '.isActive')
        
        # Truncate content if too long
        if [ ${#content} -gt 60 ]; then
            content="${content:0:57}..."
        fi
        
        # Format timestamp
        local display_time=""
        if [[ "$timestamp" =~ ([0-9]{2}):([0-9]{2}):([0-9]{2}) ]]; then
            display_time="${BASH_REMATCH[1]}:${BASH_REMATCH[2]}"
        fi
        
        # Add active marker
        local active_marker=""
        if [ "$is_active" = "true" ]; then
            active_marker=" [active]"
        fi
        
        display_branches+=("[$display_time] $content$active_marker")
    done
    
    # Interactive selection loop
    while true; do
        # Display all branches
        for ((i=0; i<branch_count; i++)); do
            moveCursor $((i + 3)) 1
            echo -ne "$CLEAR_LINE"
            
            if [ $i -eq $selected_index ]; then
                # Highlight selected branch
                echo -ne "> ${display_branches[$i]}"
            else
                echo -ne "  ${display_branches[$i]}"
            fi
        done
        
        # Read input
        local key
        if IFS= read -rsn1 key 2>/dev/null; then
            case "$key" in
                $'\x1b')
                    # Escape sequence
                    local seq1 seq2
                    if IFS= read -rsn1 -t 0.01 seq1 2>/dev/null; then
                        if [[ "$seq1" == "[" ]]; then
                            if IFS= read -rsn1 -t 0.01 seq2 2>/dev/null; then
                                case "$seq2" in
                                    "A")
                                        # Up arrow
                                        if [ $selected_index -gt 0 ]; then
                                            selected_index=$((selected_index - 1))
                                        fi
                                        ;;
                                    "B")
                                        # Down arrow
                                        if [ $selected_index -lt $((branch_count - 1)) ]; then
                                            selected_index=$((selected_index + 1))
                                        fi
                                        ;;
                                esac
                            fi
                        else
                            # Escape key pressed (no sequence following)
                            echo -ne "$RESTORE_CURSOR"
                            echo ""
                            return 1
                        fi
                    else
                        # Escape key pressed
                        echo -ne "$RESTORE_CURSOR"
                        echo ""
                        return 1
                    fi
                    ;;
                $'\n'|$'\r')
                    # Enter key - select current branch
                    local selected_id=$(echo "$branches" | jq -r ".[$selected_index].id")
                    echo -ne "$RESTORE_CURSOR"
                    echo "$selected_id"
                    return 0
                    ;;
                $'\x03'|$'\x04')
                    # Ctrl+C or Ctrl+D - cancel
                    echo -ne "$RESTORE_CURSOR"
                    echo ""
                    return 1
                    ;;
            esac
        fi
    done
}

# Handle keyboard input with timeout
# Reads keyboard input, processes special keys, and returns events
# Returns: JSON event object or empty string if no event
# Event types: "submit" (Enter pressed with non-empty input)
#             "theme_switch" (Ctrl+T pressed)
#             "branch_nav" (Ctrl+B pressed)
#             "quit" (Ctrl+C or Ctrl+D pressed)
handleInput() {
    # Read with 100ms timeout (0.1 seconds) for responsiveness
    local char
    local event=""
    
    # Read a single character with timeout
    # -t 0.1 = 100ms timeout
    # -n 1 = read 1 character
    # -s = silent (don't echo)
    if IFS= read -t 0.1 -n 1 -s char 2>/dev/null; then
        # Check for special keys
        case "$char" in
            $'\x03')
                # Ctrl+C - quit application
                event="{\"type\":\"quit\",\"key\":\"ctrl_c\"}"
                ;;
            $'\x04')
                # Ctrl+D - quit application
                event="{\"type\":\"quit\",\"key\":\"ctrl_d\"}"
                ;;
            $'\x14')
                # Ctrl+T - theme switching
                event="{\"type\":\"theme_switch\"}"
                ;;
            $'\x02')
                # Ctrl+B - branch navigation
                event="{\"type\":\"branch_nav\"}"
                ;;
            $'\x7f'|$'\x08')
                # Backspace (0x7f or 0x08)
                if [[ ${#INPUT_BUFFER} -gt 0 ]]; then
                    INPUT_BUFFER="${INPUT_BUFFER:0:${#INPUT_BUFFER}-1}"
                    renderInputArea $((SCREEN_HEIGHT - 1))
                fi
                ;;
            $'\x1b')
                # Escape sequence (arrow keys, delete, etc.)
                # Read the next two characters to identify the sequence
                local seq1 seq2
                if IFS= read -t 0.01 -n 1 -s seq1 2>/dev/null; then
                    if [[ "$seq1" == "[" ]]; then
                        if IFS= read -t 0.01 -n 1 -s seq2 2>/dev/null; then
                            case "$seq2" in
                                "D")
                                    # Left arrow - move cursor left (not implemented yet)
                                    # For now, just ignore
                                    ;;
                                "C")
                                    # Right arrow - move cursor right (not implemented yet)
                                    # For now, just ignore
                                    ;;
                                "3")
                                    # Delete key (ESC[3~)
                                    # Read the trailing ~
                                    IFS= read -t 0.01 -n 1 -s 2>/dev/null
                                    # Delete at cursor position (for now, same as backspace)
                                    if [[ ${#INPUT_BUFFER} -gt 0 ]]; then
                                        INPUT_BUFFER="${INPUT_BUFFER:0:${#INPUT_BUFFER}-1}"
                                        renderInputArea $((SCREEN_HEIGHT - 1))
                                    fi
                                    ;;
                            esac
                        fi
                    fi
                fi
                ;;
            $'\n'|$'\r')
                # Enter key - submit message if non-empty
                if [[ -n "$INPUT_BUFFER" ]]; then
                    # Create submit event with the message content
                    local message="$INPUT_BUFFER"
                    INPUT_BUFFER=""
                    renderInputArea $((SCREEN_HEIGHT - 1))
                    
                    # Return event as JSON
                    event="{\"type\":\"submit\",\"message\":\"$message\"}"
                fi
                ;;
            *)
                # Regular character - append to buffer
                # Filter out control characters except printable ones
                if [[ "$char" =~ [[:print:]] ]]; then
                    INPUT_BUFFER="${INPUT_BUFFER}${char}"
                    renderInputArea $((SCREEN_HEIGHT - 1))
                fi
                ;;
        esac
    fi
    
    # Return event (empty string if no event)
    echo "$event"
}

# Export functions
export -f initialize
export -f cleanup
export -f render
export -f renderLogo
export -f renderSeparator
export -f renderMessageHistory
export -f renderStatusBar
export -f renderInputArea
export -f scrollUp
export -f scrollDown
export -f displayMessage
export -f addMessageToDisplay
export -f clearMessages
export -f updateInputBuffer
export -f getInputBuffer
export -f handleInput
export -f updateTerminalSize
export -f handleResize
