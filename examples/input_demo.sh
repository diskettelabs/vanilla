#!/usr/bin/env bash
# Demo of input handling functionality
# This demonstrates the handleInput() function with keyboard interaction

set -euo pipefail

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Source dependencies
source "$PROJECT_ROOT/src/tui/screen.sh"

echo "Input Handling Demo"
echo "==================="
echo
echo "This demo shows the handleInput() function in action."
echo
echo "Instructions:"
echo "  - Type characters to see them accumulate in the input buffer"
echo "  - Press Backspace to delete characters"
echo "  - Press Enter to submit (only works with non-empty input)"
echo "  - Press Ctrl+C to exit"
echo
echo "Starting in 2 seconds..."
sleep 2

# Initialize the screen
if ! initialize; then
    echo "Failed to initialize screen"
    exit 1
fi

# Load a theme for better visuals
if [[ -f "$PROJECT_ROOT/themes/vanilla.json" ]]; then
    load_theme "vanilla" 2>/dev/null || true
fi

# Main loop
MESSAGE_COUNT=0
RUNNING=true

while $RUNNING; do
    # Render the screen
    render
    
    # Handle input
    event=$(handleInput)
    
    # Process events
    if [[ -n "$event" ]]; then
        # Parse the event type
        event_type=$(echo "$event" | jq -r '.type' 2>/dev/null || echo "")
        
        if [[ "$event_type" == "submit" ]]; then
            # Get the message from the event
            message=$(echo "$event" | jq -r '.message' 2>/dev/null || echo "")
            
            if [[ -n "$message" ]]; then
                MESSAGE_COUNT=$((MESSAGE_COUNT + 1))
                
                # Create a timestamp
                timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
                
                # Display the user message
                formatted_message=$(displayMessage "user" "$message" "$timestamp")
                addMessageToDisplay "$formatted_message"
                
                # Simulate an assistant response
                response="You said: $message (Message #$MESSAGE_COUNT)"
                response_timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
                formatted_response=$(displayMessage "assistant" "$response" "$response_timestamp")
                addMessageToDisplay "$formatted_response"
                
                # Re-render to show the new messages
                render
            fi
        fi
    fi
    
    # Small sleep to prevent CPU spinning
    sleep 0.01
done

# Cleanup is handled by the trap
exit 0
