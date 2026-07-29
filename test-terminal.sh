#!/usr/bin/env bash
# Test terminal input

echo "Terminal diagnostic test"
echo "========================"
echo ""

# Check stty settings
echo "Current terminal settings:"
stty -a
echo ""

# Test basic input
echo "Type something and press Enter:"
read -r test_input
echo "You typed: $test_input"
echo ""

# Test character-by-character input
echo "Type a single character (no Enter needed):"
read -n 1 -s char
echo ""
echo "You typed: $char"
echo ""

echo "Test complete!"
