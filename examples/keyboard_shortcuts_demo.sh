#!/usr/bin/env bash
# Demo for keyboard shortcuts functionality
# Shows how Ctrl+T, Ctrl+B, Ctrl+C, and Ctrl+D work

set -euo pipefail

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Source dependencies
source "$PROJECT_ROOT/src/tui/screen.sh"
source "$PROJECT_ROOT/src/theme/theme_engine.sh"

# Initialize terminal
echo "Keyboard Shortcuts Demo"
echo "======================="
echo
echo "This demo shows the keyboard shortcuts for Vanilla Chat TUI:"
echo
echo "  Ctrl+T - Switch theme"
echo "  Ctrl+B - Navigate branches"
echo "  Ctrl+C - Quit application"
echo "  Ctrl+D - Quit application"
echo
echo "Press any key to start the demo (or Ctrl+C to exit)..."
read -n 1 -s

# Load a theme for visual feedback
load_theme "vanilla" 2>/dev/null || true

# Initialize the TUI
initialize

# Add some sample messages
addMessageToDisplay "$(displayMessage "user" "Hello, this is a test message" "2024-01-01T12:00:00")"
addMessageToDisplay "$(displayMessage "assistant" "This is a response from the assistant" "2024-01-01T12:00:05")"

# Main demo loop
echo
echo "Demo is running. Try the keyboard shortcuts:"
echo
echo "  Type some text and press Enter to submit"
echo "  Press Ctrl+T to trigger theme switch event"
echo "  Press Ctrl+B to trigger branch navigation event"
echo "  Press Ctrl+C or Ctrl+D to quit"
echo

running=true
while $running; do
    # Render the screen
    render
    
    # Handle input
    event=$(handleInput)
    
    if [[ -n "$event" ]]; then
        # Parse event type
        event_type=$(echo "$event" | jq -r '.type' 2>/dev/null || echo "")
        
        case "$event_type" in
            "submit")
                message=$(echo "$event" | jq -r '.message' 2>/dev/null || echo "")
                addMessageToDisplay "$(displayMessage "user" "$message" "$(date -u +%Y-%m-%dT%H:%M:%S)")"
                addMessageToDisplay "$(displayMessage "assistant" "Echo: $message" "$(date -u +%Y-%m-%dT%H:%M:%S)")"
                ;;
            "theme_switch")
                # Show feedback that Ctrl+T was pressed
                addMessageToDisplay "$(displayMessage "assistant" "[Ctrl+T pressed - Theme switch triggered]" "$(date -u +%Y-%m-%dT%H:%M:%S)")"
                ;;
            "branch_nav")
                # Show feedback that Ctrl+B was pressed
                addMessageToDisplay "$(displayMessage "assistant" "[Ctrl+B pressed - Branch navigation triggered]" "$(date -u +%Y-%m-%dT%H:%M:%S)")"
                ;;
            "quit")
                key=$(echo "$event" | jq -r '.key' 2>/dev/null || echo "")
                addMessageToDisplay "$(displayMessage "assistant" "[${key} pressed - Quitting...]" "$(date -u +%Y-%m-%dT%H:%M:%S)")"
                render
                sleep 1
                running=false
                ;;
        esac
    fi
done

# Cleanup
cleanup

echo
echo "Demo finished!"
echo
