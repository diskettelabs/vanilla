#!/usr/bin/env bash
# Demo script for TUI screen rendering
# Shows the complete chat interface with logo, messages, status bar, and input

set -euo pipefail

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Source required modules
source "$PROJECT_ROOT/src/tui/screen.sh"

# Demo function
run_demo() {
    echo "Starting Vanilla Chat TUI Screen Demo..."
    echo "This will demonstrate the screen layout and rendering."
    echo ""
    echo "Press Enter to continue..."
    read -r
    
    # Load a theme
    echo "Loading vanilla theme..."
    load_theme "vanilla"
    
    # Start system monitor
    echo "Starting system monitor..."
    startMonitoring 1
    
    # Initialize the screen
    echo "Initializing screen..."
    sleep 1
    initialize
    
    # Add some sample messages
    addMessageToDisplay "user: Hello! Can you help me with something?"
    addMessageToDisplay "assistant: Of course! I'd be happy to help. What do you need assistance with?"
    addMessageToDisplay "user: I'm trying to understand how conversation trees work."
    addMessageToDisplay "assistant: Great question! A conversation tree is a data structure that stores messages as nodes with parent-child relationships. This allows for branching conversations where you can edit previous messages and explore alternate paths."
    addMessageToDisplay "user: That's interesting! Can you give me an example?"
    addMessageToDisplay "assistant: Sure! Imagine you ask 'What's the weather?' and I respond 'It's sunny.' If you then edit your question to 'What's the temperature?', that creates a new branch. Both conversation paths are preserved in the tree structure."
    
    # Set input buffer
    updateInputBuffer "Tell me more about branching..."
    
    # Render the screen
    render
    
    # Keep the demo running for a bit to show live updates
    for i in {1..10}; do
        sleep 1
        render  # Re-render to update system metrics
    done
    
    # Demo scrolling
    echo -ne "\n\nDemo: Scrolling up..."
    sleep 2
    scrollUp 2
    sleep 2
    
    echo -ne "\n\nDemo: Scrolling down..."
    sleep 2
    scrollDown 1
    sleep 2
    
    # Add a new message
    addMessageToDisplay "user: This is a new message added dynamically!"
    render
    sleep 3
    
    # Clean up
    cleanup
    stopMonitoring
    
    echo ""
    echo "Demo complete!"
    echo ""
    echo "The screen module provides:"
    echo "  ✓ Terminal initialization and cleanup"
    echo "  ✓ ASCII logo rendering with theme colors"
    echo "  ✓ Message history display with scrolling"
    echo "  ✓ Status bar with CPU/RAM metrics"
    echo "  ✓ Input area for user messages"
    echo "  ✓ Terminal resize handling"
    echo ""
}

# Run the demo
run_demo
