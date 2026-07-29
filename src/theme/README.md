# Theme Engine

The Theme Engine manages the 14 ice cream flavor themes for Vanilla Chat TUI. It provides functions for loading themes, accessing color values, and applying colors to terminal text.

## Features

- **14 Ice Cream Flavors**: vanilla, chocolate, strawberry, lavender, plum, mint, dreamsicle, lemon, lime, blue moon, dragonfruit, peach, raspberry, and monochrome
- **Complete Color Schemes**: Each theme includes 8 color fields (primary, secondary, background, text, userMessage, assistantMessage, border, statusBar)
- **ANSI Color Support**: Automatic conversion from hex colors to ANSI 256-color codes
- **Theme Validation**: Ensures all themes have required fields and valid JSON structure
- **Easy Integration**: Simple API for loading and applying themes

## Usage

### Source the Theme Engine

```bash
source src/theme/theme_engine.sh
```

### List Available Themes

```bash
# Get all theme names
themes=$(list_themes)
echo "$themes"
# Output:
# blue-moon
# chocolate
# dragonfruit
# ...
```

### Load a Theme

```bash
# Load a theme by name
load_theme "vanilla"

# Check current theme
current=$(get_current_theme)
echo "Current theme: $current"
```

### Get Theme Colors

```bash
# Get a specific color
primary=$(get_theme_color "primary")
echo "Primary color: $primary"  # Output: #FFF8DC

# Get all colors as JSON
colors=$(get_theme_colors)
echo "$colors" | jq '.'

# Get theme metadata
metadata=$(get_theme_metadata)
echo "$metadata" | jq '.'
```

### Apply Colors to Text

```bash
# Apply theme color to text
colored_text=$(apply_theme_color "Hello World" "primary")
echo "$colored_text"

# Convert hex to ANSI 256-color code
ansi_code=$(hex_to_ansi256 "#FF0000")
echo "ANSI code: $ansi_code"

# Apply ANSI color directly
colored=$(apply_ansi_color "Text" "196")  # Red
echo "$colored"
```

### Check Theme Existence

```bash
if theme_exists "vanilla"; then
    echo "Vanilla theme exists"
fi
```

## API Reference

### Functions

#### `list_themes()`
Lists all available theme names (one per line).

**Returns:** Theme names sorted alphabetically

#### `load_theme(theme_name)`
Loads a theme by name and sets it as the current theme.

**Parameters:**
- `theme_name`: Name of the theme (e.g., "vanilla", "chocolate")

**Returns:** 0 on success, 1 on failure

#### `get_current_theme()`
Gets the name of the currently loaded theme.

**Returns:** Current theme name or empty string if none loaded

#### `get_theme_color(color_key)`
Gets a specific color value from the current theme.

**Parameters:**
- `color_key`: Color field name (primary, secondary, background, text, userMessage, assistantMessage, border, statusBar)

**Returns:** Hex color code (e.g., "#FFF8DC")

#### `get_theme_colors()`
Gets all color values from the current theme as JSON.

**Returns:** JSON object with all color fields

#### `get_theme_metadata()`
Gets theme metadata (name, displayName, description) as JSON.

**Returns:** JSON object with metadata fields

#### `hex_to_ansi256(hex_color)`
Converts a hex color to ANSI 256-color code.

**Parameters:**
- `hex_color`: Hex color with or without # prefix (e.g., "#FF0000" or "FF0000")

**Returns:** ANSI 256-color code (0-255)

#### `apply_ansi_color(text, fg_code, [bg_code])`
Applies ANSI color codes to text.

**Parameters:**
- `text`: Text to colorize
- `fg_code`: Foreground color code (0-255)
- `bg_code`: Optional background color code (0-255)

**Returns:** Text with ANSI color codes

#### `apply_theme_color(text, color_key)`
Applies a theme color to text.

**Parameters:**
- `text`: Text to colorize
- `color_key`: Color field name from theme

**Returns:** Text with theme color applied

#### `theme_exists(theme_name)`
Checks if a theme exists.

**Parameters:**
- `theme_name`: Name of the theme

**Returns:** 0 if exists, 1 if not

## Theme Structure

Each theme is defined in a JSON file with the following structure:

```json
{
  "name": "vanilla",
  "displayName": "Vanilla",
  "description": "Classic cream and beige tones",
  "colors": {
    "primary": "#FFF8DC",
    "secondary": "#F5DEB3",
    "background": "#FFFAF0",
    "text": "#4A4A4A",
    "userMessage": "#FFE4B5",
    "assistantMessage": "#FAEBD7",
    "border": "#DEB887",
    "statusBar": "#F5DEB3"
  }
}
```

### Required Fields

- `name`: Theme identifier (kebab-case)
- `displayName`: Human-readable theme name
- `description`: Brief description of the theme
- `colors.primary`: Primary accent color
- `colors.secondary`: Secondary accent color
- `colors.background`: Background color
- `colors.text`: Default text color
- `colors.userMessage`: User message background color
- `colors.assistantMessage`: Assistant message background color
- `colors.border`: Border and separator color
- `colors.statusBar`: Status bar background color

## Examples

See `examples/theme_demo.sh` for a complete demonstration of theme engine functionality.

## Testing

Run the test suite:

```bash
./tests/test_theme_engine.sh
```

The test suite validates:
- Theme listing and loading
- Color retrieval and validation
- Hex to ANSI conversion
- Theme existence checks
- All 14 themes can be loaded successfully
- All color fields are accessible

## Requirements Validated

This implementation validates the following requirements:

- **Requirement 4.1**: Provides exactly 14 ice cream flavor themes
- **Requirement 4.2**: Each theme includes all 8 required color fields
- **Requirement 4.3**: Supports theme loading and application
