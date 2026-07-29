#!/usr/bin/env bash
# Demo script for displayMessage function
# Shows how to format and display messages with role, content, and timestamp

set -euo pipefail

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Source required modules
source "$PROJECT_ROOT/src/tui/screen.sh"

echo "=========================================="
echo "Display Message Demo"
echo "=========================================="
echo ""

# Load a theme for colored output
echo "Loading vanilla theme..."
load_theme "vanilla"
echo ""

# Demo 1: User message
echo "Demo 1: User message"
echo "--------------------"
user_msg=$(displayMessage "user" "What is the capital of France?" "2024-01-15T10:30:45Z" "false")
echo -e "$user_msg"
echo ""

# Demo 2: Assistant message
echo "Demo 2: Assistant message"
echo "-------------------------"
assistant_msg=$(displayMessage "assistant" "The capital of France is Paris. It is known for the Eiffel Tower and rich cultural heritage." "2024-01-15T10:30:50Z" "false")
echo -e "$assistant_msg"
echo ""

# Demo 3: Incomplete message (streaming)
echo "Demo 3: Incomplete message (streaming)"
echo "--------------------------------------"
incomplete_msg=$(displayMessage "assistant" "I'm still thinking about..." "2024-01-15T10:31:00Z" "true")
echo -e "$incomplete_msg"
echo ""

# Demo 4: System message
echo "Demo 4: System message"
echo "----------------------"
system_msg=$(displayMessage "system" "Connection established to Ollama" "2024-01-15T10:29:00Z" "false")
echo -e "$system_msg"
echo ""

# Demo 5: Conversation with multiple messages
echo "Demo 5: Full conversation"
echo "-------------------------"
clearMessages

msg1=$(displayMessage "user" "Tell me a joke" "2024-01-15T10:32:00Z" "false")
addMessageToDisplay "$msg1"

msg2=$(displayMessage "assistant" "Why did the programmer quit his job? Because he didn't get arrays!" "2024-01-15T10:32:05Z" "false")
addMessageToDisplay "$msg2"

msg3=$(displayMessage "user" "That's terrible! Give me another one." "2024-01-15T10:32:15Z" "false")
addMessageToDisplay "$msg3"

msg4=$(displayMessage "assistant" "Why do programmers prefer dark mode? Because light attracts bugs!" "2024-01-15T10:32:20Z" "false")
addMessageToDisplay "$msg4"

echo "Message history (${#MESSAGE_HISTORY[@]} messages):"
for msg in "${MESSAGE_HISTORY[@]}"; do
    echo -e "$msg"
    echo ""
done

# Demo 6: Different themes
echo "Demo 6: Theme variations"
echo "------------------------"
themes=("chocolate" "strawberry" "mint" "lavender")

for theme in "${themes[@]}"; do
    echo "Theme: $theme"
    load_theme "$theme" 2>/dev/null || continue
    themed_msg=$(displayMessage "user" "This message uses the $theme theme" "2024-01-15T10:33:00Z" "false")
    echo -e "$themed_msg"
    echo ""
done

echo "=========================================="
echo "Demo complete!"
echo "=========================================="
