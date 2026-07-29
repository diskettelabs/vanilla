#!/usr/bin/env bash
# Demo script for theme engine functionality

set -euo pipefail

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Source the theme engine
source "$PROJECT_ROOT/src/theme/theme_engine.sh"

echo "========================================"
echo "Vanilla Chat TUI - Theme Engine Demo"
echo "========================================"
echo

# List all available themes
echo "Available themes:"
echo "----------------"
list_themes
echo

# Demo each theme
echo "Theme Showcase:"
echo "----------------"
echo

themes=$(list_themes)
while IFS= read -r theme; do
    # Load the theme
    load_theme "$theme" >/dev/null 2>&1
    
    # Get theme metadata
    display_name=$(get_theme_metadata | jq -r '.displayName')
    description=$(get_theme_metadata | jq -r '.description')
    
    # Get primary color
    primary=$(get_theme_color "primary")
    
    # Display theme info with colored text
    echo "Theme: $display_name"
    echo "  Description: $description"
    echo "  Primary Color: $primary"
    
    # Show sample text in theme colors
    echo -n "  Sample: "
    apply_theme_color "User message" "userMessage"
    echo -n " | "
    apply_theme_color "Assistant message" "assistantMessage"
    echo
    echo
done <<< "$themes"

# Interactive theme selector
echo "========================================"
echo "Interactive Theme Test"
echo "========================================"
echo

# Load vanilla theme
load_theme "vanilla" >/dev/null 2>&1
echo "Current theme: $(get_current_theme)"
echo

# Display a sample conversation with theme colors
echo "Sample Conversation:"
echo "-------------------"
echo

apply_theme_color "User: What is the capital of France?" "userMessage"
echo
apply_theme_color "Assistant: The capital of France is Paris." "assistantMessage"
echo
echo

# Show all color fields for current theme
echo "Current Theme Colors:"
echo "--------------------"
get_theme_colors | jq '.'
echo

echo "========================================"
echo "Demo Complete!"
echo "========================================"
