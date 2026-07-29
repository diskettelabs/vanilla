#!/usr/bin/env bash
# Logo rendering for Vanilla Chat TUI
# Generates ASCII art ice cream scoop with theme colors

set -euo pipefail

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Source theme engine
source "$PROJECT_ROOT/src/theme/theme_engine.sh"

# Generate ASCII art logo with theme colors
# Returns: Colored ASCII art logo string
generateLogo() {
    local theme_color_key="${1:-primary}"
    
    # Get the theme's primary color
    local hex_color
    hex_color=$(get_theme_color "$theme_color_key")
    
    if [[ $? -ne 0 ]]; then
        echo "Error: Failed to get theme color" >&2
        return 1
    fi
    
    # Convert hex to ANSI 256-color code
    local ansi_code
    ansi_code=$(hex_to_ansi256 "$hex_color")
    
    # ASCII art ice cream scoop
    local logo_lines=(
        "    .-=*#%%%%#*=-.         "
        "  :+%@@@%#*++*#%@@@%+:     "
        " :#@@#=.          .=#@@#:  "
        "+@@*.                .*@@+ "
        "+@@+      -=:   -=.     +@@+"
        ".@@%      .@@#  -@@*      %@@."
        ":@@#      .@@#  -@@*      #@@:"
        "#@@:      *%=  .##-     :@@#  "
        "-%@@=                    =@@%-"
        "-@@#.                      .#@@-"
        "-@@*     .*%+      +%*.     *@@-"
        "=%@@#**#@@@@@#**#@@@@@#**#@@%= "
        " -*#%%#+: -+#%%#+- :+#%%#*-   "
    )
    
    # Apply color to each line and output
    for line in "${logo_lines[@]}"; do
        apply_ansi_color "$line" "$ansi_code"
    done
}

# Display logo with current theme
# Returns: 0 on success, 1 on failure
displayLogo() {
    if [[ -z "$(get_current_theme)" ]]; then
        echo "Error: No theme loaded. Load a theme first." >&2
        return 1
    fi
    
    generateLogo "primary"
}

# Export functions
export -f generateLogo
export -f displayLogo

