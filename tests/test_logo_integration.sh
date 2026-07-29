#!/usr/bin/env bash
# Integration test for logo with theme switching

set -o pipefail

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Source the logo module
source "$PROJECT_ROOT/src/tui/logo.sh"

echo "Integration Test: Logo with Theme Switching"
echo "============================================"
echo ""

# Test 1: Logo renders on application start with default theme
echo "Test 1: Logo renders on application start"
if load_theme "vanilla"; then
    logo=$(displayLogo)
    if [[ -n "$logo" ]]; then
        echo "✓ Logo renders successfully on start"
    else
        echo "✗ Logo failed to render on start"
        exit 1
    fi
else
    echo "✗ Failed to load default theme"
    exit 1
fi
echo ""

# Test 2: Logo updates when theme changes
echo "Test 2: Logo updates when theme changes"
initial_logo=$(displayLogo)

# Switch to a different theme
if load_theme "chocolate"; then
    updated_logo=$(displayLogo)
    
    # Verify the logos are different (different colors)
    if [[ "$initial_logo" != "$updated_logo" ]]; then
        echo "✓ Logo updated after theme change"
    else
        echo "✗ Logo did not update after theme change"
        exit 1
    fi
else
    echo "✗ Failed to load new theme"
    exit 1
fi
echo ""

# Test 3: Logo structure remains consistent across theme changes
echo "Test 3: Logo structure remains consistent"
# Strip ANSI codes to compare structure
strip_ansi() {
    echo "$1" | sed 's/\x1b\[[0-9;]*m//g'
}

load_theme "vanilla"
logo1=$(displayLogo)
structure1=$(strip_ansi "$logo1")

load_theme "dragonfruit"
logo2=$(displayLogo)
structure2=$(strip_ansi "$logo2")

if [[ "$structure1" == "$structure2" ]]; then
    echo "✓ Logo structure is consistent across themes"
else
    echo "✗ Logo structure changed across themes"
    exit 1
fi
echo ""

# Test 4: Logo contains required elements
echo "Test 4: Logo contains required elements"
load_theme "vanilla"
logo=$(displayLogo)
plain_logo=$(strip_ansi "$logo")

has_eyes=false
has_top_curve=false
has_bottom_curve=false

if echo "$plain_logo" | grep -q "( o )"; then
    has_eyes=true
fi

if echo "$plain_logo" | grep -q "___________"; then
    has_top_curve=true
fi

if echo "$plain_logo" | grep -q "_____________"; then
    has_bottom_curve=true
fi

if $has_eyes && $has_top_curve && $has_bottom_curve; then
    echo "✓ Logo contains all required elements (eyes, rounded top, rounded bottom)"
else
    echo "✗ Logo missing required elements"
    echo "  Eyes: $has_eyes"
    echo "  Top curve: $has_top_curve"
    echo "  Bottom curve: $has_bottom_curve"
    exit 1
fi
echo ""

# Test 5: Logo uses theme's primary color
echo "Test 5: Logo uses theme's primary color"
load_theme "vanilla"
primary_color=$(get_theme_color "primary")
ansi_code=$(hex_to_ansi256 "$primary_color")
logo=$(displayLogo)

if echo "$logo" | grep -q "38;5;${ansi_code}"; then
    echo "✓ Logo uses theme's primary color (ANSI code: $ansi_code)"
else
    echo "✗ Logo does not use theme's primary color"
    exit 1
fi
echo ""

# Test 6: Multiple theme switches
echo "Test 6: Multiple theme switches work correctly"
themes=("vanilla" "chocolate" "strawberry" "mint" "lavender")
previous_logo=""

for theme in "${themes[@]}"; do
    load_theme "$theme"
    current_logo=$(displayLogo)
    
    if [[ -z "$current_logo" ]]; then
        echo "✗ Logo failed to render for theme: $theme"
        exit 1
    fi
    
    if [[ -n "$previous_logo" ]] && [[ "$current_logo" == "$previous_logo" ]]; then
        echo "✗ Logo did not change for theme: $theme"
        exit 1
    fi
    
    previous_logo="$current_logo"
done

echo "✓ Multiple theme switches work correctly"
echo ""

echo "============================================"
echo "All integration tests passed! ✓"
echo "============================================"

