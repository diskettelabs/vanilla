#!/usr/bin/env bash
# Simple test to verify the app can start

echo "Testing Vanilla Chat TUI startup..."
echo ""

# Check if Ollama is running
echo "1. Checking Ollama connection..."
if curl -s http://localhost:11434/api/tags >/dev/null 2>&1; then
    echo "   ✓ Ollama is running"
else
    echo "   ✗ Ollama is NOT running"
    echo "   Start it with: ollama serve"
    echo ""
fi

# Check if script is executable
echo "2. Checking if vanilla-chat.sh is executable..."
if [ -x ./vanilla-chat.sh ]; then
    echo "   ✓ Script is executable"
else
    echo "   ✗ Script is not executable"
    echo "   Fix with: chmod +x vanilla-chat.sh"
fi

# Test help command
echo "3. Testing help command..."
if ./vanilla-chat.sh --help >/dev/null 2>&1; then
    echo "   ✓ Help command works"
else
    echo "   ✗ Help command failed"
fi

# Test list themes
echo "4. Testing list themes..."
if ./vanilla-chat.sh --list-themes >/dev/null 2>&1; then
    echo "   ✓ List themes works"
else
    echo "   ✗ List themes failed"
fi

echo ""
echo "The application clears the terminal when it starts - this is normal!"
echo "It's a full-screen TUI application."
echo ""
echo "To run it:"
echo "  1. Make sure Ollama is running: ollama serve"
echo "  2. Run: ./vanilla-chat.sh"
echo "  3. Type your message and press Enter"
echo "  4. Press Ctrl+C to quit"
