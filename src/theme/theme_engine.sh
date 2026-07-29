#!/usr/bin/env bash
# Theme Engine for Vanilla Chat TUI
# Manages loading and applying ice cream flavor themes

set -euo pipefail

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
THEMES_DIR="$PROJECT_ROOT/themes"

# Source JSON utilities
source "$PROJECT_ROOT/src/lib/json_utils.sh"

# Global variable to store current theme
CURRENT_THEME=""

# List all available themes
# Returns: Array of theme names (one per line)
list_themes() {
    local theme_files=("$THEMES_DIR"/*.json)
    
    if [[ ! -e "${theme_files[0]}" ]]; then
        echo "Error: No theme files found in $THEMES_DIR" >&2
        return 1
    fi
    
    for theme_file in "${theme_files[@]}"; do
        basename "$theme_file" .json
    done | sort
}

# Load a theme by name
# Args: $1 - theme name (e.g., "vanilla", "chocolate")
# Returns: 0 on success, 1 on failure
# Sets CURRENT_THEME to the theme name
load_theme() {
    local theme_name="$1"
    local theme_file="$THEMES_DIR/${theme_name}.json"
    
    if [[ ! -f "$theme_file" ]]; then
        echo "Error: Theme '$theme_name' not found at $theme_file" >&2
        return 1
    fi
    
    # Validate theme file is valid JSON
    if ! jq empty "$theme_file" 2>/dev/null; then
        echo "Error: Theme file '$theme_file' is not valid JSON" >&2
        return 1
    fi
    
    # Validate theme has all required fields
    local required_fields=(
        ".name"
        ".colors.primary"
        ".colors.secondary"
        ".colors.background"
        ".colors.text"
        ".colors.userMessage"
        ".colors.assistantMessage"
        ".colors.border"
        ".colors.statusBar"
    )
    
    for field in "${required_fields[@]}"; do
        if ! jq -e "$field" "$theme_file" >/dev/null 2>&1; then
            echo "Error: Theme '$theme_name' missing required field: $field" >&2
            return 1
        fi
    done
    
    CURRENT_THEME="$theme_name"
    return 0
}

# Get a specific color from the current theme
# Args: $1 - color key (e.g., "primary", "background", "userMessage")
# Returns: Hex color code (e.g., "#FFF8DC")
get_theme_color() {
    local color_key="$1"
    local theme_file="$THEMES_DIR/${CURRENT_THEME}.json"
    
    if [[ -z "$CURRENT_THEME" ]]; then
        echo "Error: No theme loaded" >&2
        return 1
    fi
    
    if [[ ! -f "$theme_file" ]]; then
        echo "Error: Theme file not found: $theme_file" >&2
        return 1
    fi
    
    local color
    color=$(jq -r ".colors.${color_key}" "$theme_file" 2>/dev/null)
    
    if [[ -z "$color" || "$color" == "null" ]]; then
        echo "Error: Color '$color_key' not found in theme '$CURRENT_THEME'" >&2
        return 1
    fi
    
    echo "$color"
}

# Get all theme colors as a JSON object
# Returns: JSON object with all color fields
get_theme_colors() {
    local theme_file="$THEMES_DIR/${CURRENT_THEME}.json"
    
    if [[ -z "$CURRENT_THEME" ]]; then
        echo "Error: No theme loaded" >&2
        return 1
    fi
    
    if [[ ! -f "$theme_file" ]]; then
        echo "Error: Theme file not found: $theme_file" >&2
        return 1
    fi
    
    jq -r '.colors' "$theme_file"
}

# Get theme metadata (name, displayName, description)
# Returns: JSON object with theme metadata
get_theme_metadata() {
    local theme_file="$THEMES_DIR/${CURRENT_THEME}.json"
    
    if [[ -z "$CURRENT_THEME" ]]; then
        echo "Error: No theme loaded" >&2
        return 1
    fi
    
    if [[ ! -f "$theme_file" ]]; then
        echo "Error: Theme file not found: $theme_file" >&2
        return 1
    fi
    
    jq -r '{name, displayName, description}' "$theme_file"
}

# Convert hex color to ANSI 256-color code
# Args: $1 - hex color (e.g., "#FFF8DC" or "FFF8DC")
# Returns: ANSI 256-color code (0-255)
hex_to_ansi256() {
    local hex="$1"
    
    # Remove # prefix if present
    hex="${hex#\#}"
    
    # Extract RGB components
    local r=$((16#${hex:0:2}))
    local g=$((16#${hex:2:2}))
    local b=$((16#${hex:4:2}))
    
    # Convert to 256-color palette
    # Use 216-color cube (16-231) for most colors
    # Formula: 16 + 36*r + 6*g + b where r,g,b are 0-5
    local r6=$(( (r * 6) / 256 ))
    local g6=$(( (g * 6) / 256 ))
    local b6=$(( (b * 6) / 256 ))
    
    local color_code=$((16 + 36 * r6 + 6 * g6 + b6))
    echo "$color_code"
}

# Apply ANSI color to text
# Args: $1 - text, $2 - foreground color code, $3 - background color code (optional)
# Returns: Text with ANSI color codes
apply_ansi_color() {
    local text="$1"
    local fg_code="$2"
    local bg_code="${3:-}"
    
    if [[ -n "$bg_code" ]]; then
        echo -e "\033[38;5;${fg_code}m\033[48;5;${bg_code}m${text}\033[0m"
    else
        echo -e "\033[38;5;${fg_code}m${text}\033[0m"
    fi
}

# Apply theme color to text by color key
# Args: $1 - text, $2 - color key (e.g., "primary", "text")
# Returns: Text with theme color applied
apply_theme_color() {
    local text="$1"
    local color_key="$2"
    
    local hex_color
    hex_color=$(get_theme_color "$color_key")
    
    if [[ $? -ne 0 ]]; then
        echo "$text"
        return 1
    fi
    
    local ansi_code
    ansi_code=$(hex_to_ansi256 "$hex_color")
    
    apply_ansi_color "$text" "$ansi_code"
}

# Get current theme name
# Returns: Current theme name or empty string if none loaded
get_current_theme() {
    echo "$CURRENT_THEME"
}

# Check if a theme exists
# Args: $1 - theme name
# Returns: 0 if exists, 1 if not
theme_exists() {
    local theme_name="$1"
    local theme_file="$THEMES_DIR/${theme_name}.json"
    
    [[ -f "$theme_file" ]]
}

# Export functions for use in other scripts
export -f list_themes
export -f load_theme
export -f get_theme_color
export -f get_theme_colors
export -f get_theme_metadata
export -f hex_to_ansi256
export -f apply_ansi_color
export -f apply_theme_color
export -f get_current_theme
export -f theme_exists
