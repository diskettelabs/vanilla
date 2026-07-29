#!/usr/bin/env bash
# Demo script for conversation tree save/load functionality

set -e

# Source the tree operations
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/../src/tree/tree_ops.sh"

# Load configuration
CONFIG_FILE="${SCRIPT_DIR}/../config/default.conf"
if [ -f "$CONFIG_FILE" ]; then
    source "$CONFIG_FILE"
else
    # Use defaults if config file not found
    CONVERSATION_DIR="${HOME}/.local/share/vanilla-chat-tui/conversations"
fi

echo "========================================="
echo "Conversation Tree Save/Load Demo"
echo "========================================="
echo

# Create a sample conversation tree
echo "1. Creating a sample conversation tree..."
tree=$(init_tree "Demo Conversation" "llama2")

# Add some messages
echo "2. Adding messages to the tree..."
message1=$(create_message "user" "Hello! Can you help me with bash scripting?")
result=$(add_node "$tree" "$message1" "")
tree=$(echo "$result" | jq -r '.tree')
id1=$(echo "$result" | jq -r '.nodeId')

message2=$(create_message "assistant" "Of course! I'd be happy to help you with bash scripting. What would you like to know?")
result=$(add_node "$tree" "$message2" "$id1")
tree=$(echo "$result" | jq -r '.tree')
id2=$(echo "$result" | jq -r '.nodeId')

message3=$(create_message "user" "How do I iterate over files in a directory?")
result=$(add_node "$tree" "$message3" "$id2")
tree=$(echo "$result" | jq -r '.tree')
id3=$(echo "$result" | jq -r '.nodeId')

message4=$(create_message "assistant" "You can use a for loop like this: for file in /path/to/dir/*; do echo \$file; done")
result=$(add_node "$tree" "$message4" "$id3")
tree=$(echo "$result" | jq -r '.tree')

echo "   Created conversation with 4 messages"
echo

# Display the conversation
echo "3. Current conversation:"
path=$(get_path "$tree" "$(echo "$tree" | jq -r '.currentNodeId')")
echo "$path" | jq -r '.[] | "   [\(.role)]: \(.content)"'
echo

# Save the tree
echo "4. Saving conversation to file..."
# Ensure conversation directory exists
mkdir -p "$CONVERSATION_DIR"
filepath="${CONVERSATION_DIR}/demo_conversation.json"

save_result=$(save "$tree" "$filepath")
if [ "$save_result" = "success" ]; then
    echo "   ✓ Saved to: $filepath"
    
    # Check file permissions
    perms=$(stat -c "%a" "$filepath" 2>/dev/null || stat -f "%A" "$filepath" 2>/dev/null)
    echo "   ✓ File permissions: $perms (user-only read/write)"
else
    echo "   ✗ Save failed: $save_result"
    exit 1
fi
echo

# Load the tree
echo "5. Loading conversation from file..."
loaded_tree=$(load "$filepath")

if [ $? -eq 0 ]; then
    echo "   ✓ Loaded successfully"
    
    # Verify the loaded tree
    validation=$(validate_tree "$loaded_tree")
    is_valid=$(echo "$validation" | jq -r '.isValid')
    
    if [ "$is_valid" = "true" ]; then
        echo "   ✓ Loaded tree is valid"
    else
        echo "   ✗ Loaded tree is invalid"
        exit 1
    fi
else
    echo "   ✗ Load failed"
    exit 1
fi
echo

# Compare original and loaded trees
echo "6. Verifying data integrity..."
original_count=$(echo "$tree" | jq '.nodes | length')
loaded_count=$(echo "$loaded_tree" | jq '.nodes | length')

if [ "$original_count" = "$loaded_count" ]; then
    echo "   ✓ Node count matches: $original_count nodes"
else
    echo "   ✗ Node count mismatch: original=$original_count, loaded=$loaded_count"
    exit 1
fi

original_title=$(echo "$tree" | jq -r '.metadata.title')
loaded_title=$(echo "$loaded_tree" | jq -r '.metadata.title')

if [ "$original_title" = "$loaded_title" ]; then
    echo "   ✓ Title matches: $original_title"
else
    echo "   ✗ Title mismatch"
    exit 1
fi

original_current=$(echo "$tree" | jq -r '.currentNodeId')
loaded_current=$(echo "$loaded_tree" | jq -r '.currentNodeId')

if [ "$original_current" = "$loaded_current" ]; then
    echo "   ✓ Current node ID matches"
else
    echo "   ✗ Current node ID mismatch"
    exit 1
fi
echo

# Display loaded conversation
echo "7. Loaded conversation:"
loaded_path=$(get_path "$loaded_tree" "$(echo "$loaded_tree" | jq -r '.currentNodeId')")
echo "$loaded_path" | jq -r '.[] | "   [\(.role)]: \(.content)"'
echo

echo "========================================="
echo "Demo completed successfully!"
echo "========================================="
echo
echo "The conversation has been saved to:"
echo "  $filepath"
echo
echo "You can inspect the file with:"
echo "  cat $filepath | jq '.'"
echo
