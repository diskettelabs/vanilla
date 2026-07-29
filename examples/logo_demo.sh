#!/usr/bin/env bash
# Demo script for logo rendering with different themes

set -euo pipefail

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Source the logo module
source "$PROJECT_ROOT/src/tui/logo.sh"

echo "========================================="
echo "Vanilla Chat TUI - Logo Demo"
echo "========================================="
echo ""

# Get all available themes
themes=($(list_themes))

echo "Displaying logo with all ${#themes[@]} themes:"
echo ""

for theme in "${themes[@]}"; do
    echo "--- Theme: $theme ---"
    
    # Load the theme
    if load_theme "$theme"; then
        # Display the logo
        displayLogo
        echo ""
    else
        echo "Error: Failed to load theme '$theme'"
        echo ""
    fi
done

echo "========================================="
echo "Demo complete!"
echo "========================================="

