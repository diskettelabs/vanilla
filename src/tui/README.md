# TUI Module

Terminal User Interface components for Vanilla Chat TUI.

## Components

### Logo (`logo.sh`)

Renders the ASCII art ice cream scoop logo with theme-based coloring.

#### Features

- ASCII art ice cream scoop with two eyes
- Dynamic coloring based on current theme
- Updates automatically when theme changes
- Based on the scoop SVG design with rounded top and two oval eyes

#### Functions

##### `generateLogo([color_key])`

Generates the ASCII art logo with the specified theme color.

**Parameters:**
- `color_key` (optional): Theme color key to use (default: "primary")

**Returns:**
- Colored ASCII art logo string with ANSI color codes

**Example:**
```bash
source src/tui/logo.sh
load_theme "vanilla"
generateLogo "primary"
```

##### `displayLogo()`

Displays the logo using the current theme's primary color.

**Returns:**
- 0 on success, 1 if no theme is loaded

**Example:**
```bash
source src/tui/logo.sh
load_theme "chocolate"
displayLogo
```

#### Logo Design

The logo is a 10-line ASCII art representation of an ice cream scoop:

```
     ___________     
   /             \   
  /               \  
 /                 \ 
|                   |
|   ( o )   ( o )   |
|                   |
 \                 / 
  \               /  
   \_____________/   
```

Features:
- Rounded top curve (lines 1-4)
- Two oval eyes on line 6: `( o )   ( o )`
- Rounded bottom curve (lines 8-10)
- Symmetrical design
- 21 characters wide

#### Requirements Validation

This implementation validates the following requirements:

- **Requirement 5.1**: ASCII art logo depicting an ice cream scoop with two eyes ✓
- **Requirement 5.2**: Logo rendered using current theme's primary color ✓
- **Requirement 5.3**: Logo colors update when theme changes ✓
- **Requirement 5.4**: Logo based on scoop SVG design with rounded top and two oval eyes ✓

#### Testing

Run the test suite:

```bash
./tests/test_logo.sh
```

Run the demo:

```bash
./examples/logo_demo.sh
```

#### Dependencies

- `src/theme/theme_engine.sh` - Theme management and color application
- `src/lib/json_utils.sh` - JSON parsing (via theme_engine)

### Screen (`screen.sh`)

Manages the complete terminal screen layout and rendering for the chat interface.

#### Features

- Terminal initialization and cleanup
- Full-screen chat interface rendering
- ASCII logo display at top
- Scrollable message history area
- Status bar with CPU/RAM metrics
- Input area for user messages
- Terminal resize handling
- ANSI color support with theme integration

#### Functions

##### `initialize()`

Initializes the terminal for TUI rendering. Sets up terminal state, clears screen, hides cursor, and configures signal handlers.

**Returns:**
- 0 on success, 1 on failure

**Example:**
```bash
source src/tui/screen.sh
load_theme "vanilla"
initialize
```

##### `cleanup()`

Cleans up terminal state on exit. Restores cursor visibility, clears screen, and restores terminal settings.

**Example:**
```bash
cleanup  # Called automatically on EXIT, INT, TERM signals
```

##### `render()`

Renders the complete chat interface including logo, message history, status bar, and input area.

**Returns:**
- 0 on success, 1 if not initialized

**Example:**
```bash
initialize
render
```

##### `addMessageToDisplay(message)`

Adds a formatted message to the display history and auto-scrolls to bottom.

**Parameters:**
- `message`: Formatted message string to display

**Example:**
```bash
addMessageToDisplay "user: Hello, world!"
addMessageToDisplay "assistant: Hi there!"
render
```

##### `clearMessages()`

Clears all messages from the display history and resets scroll position.

**Example:**
```bash
clearMessages
render
```

##### `scrollUp([lines])`

Scrolls the message history up to show older messages.

**Parameters:**
- `lines` (optional): Number of lines to scroll (default: 1)

**Example:**
```bash
scrollUp 5  # Scroll up 5 lines
```

##### `scrollDown([lines])`

Scrolls the message history down to show newer messages.

**Parameters:**
- `lines` (optional): Number of lines to scroll (default: 1)

**Example:**
```bash
scrollDown 3  # Scroll down 3 lines
```

##### `updateInputBuffer(text)`

Updates the input buffer with new text.

**Parameters:**
- `text`: New input buffer content

**Example:**
```bash
updateInputBuffer "Hello, world!"
render
```

##### `getInputBuffer()`

Gets the current input buffer content.

**Returns:**
- Current input buffer string

**Example:**
```bash
current_input=$(getInputBuffer)
echo "User typed: $current_input"
```

##### `updateTerminalSize()`

Updates the terminal dimensions by reading current terminal size.

**Example:**
```bash
updateTerminalSize
echo "Terminal is ${SCREEN_WIDTH}x${SCREEN_HEIGHT}"
```

##### `handleResize()`

Handles terminal resize events. Called automatically via WINCH signal.

#### Screen Layout

The screen is divided into the following sections:

```
┌─────────────────────────────────────┐
│         ASCII Logo (10 lines)       │
├─────────────────────────────────────┤
│                                     │
│     Message History (scrollable)    │
│                                     │
│                                     │
├─────────────────────────────────────┤
│  Status Bar: CPU: 25% | RAM: 60%   │
├─────────────────────────────────────┤
│  > Input area for user messages     │
└─────────────────────────────────────┘
```

- **Logo**: 10 lines at the top with theme-colored ASCII art
- **Separator**: 1 line border between sections
- **Message History**: Scrollable area showing conversation
- **Status Bar**: 1 line showing CPU and RAM metrics
- **Input Area**: 1 line for user input with prompt

#### Requirements Validation

This implementation validates the following requirements:

- **Requirement 1.6**: Scrollable message history view ✓
- **Requirement 6.4**: CPU/RAM display in status bar ✓

#### Testing

Run the test suite:

```bash
./tests/test_screen.sh
```

Run the demo:

```bash
./examples/screen_demo.sh
```

#### Dependencies

- `src/theme/theme_engine.sh` - Theme colors and application
- `src/monitor/system_monitor.sh` - CPU/RAM metrics
- `src/tui/logo.sh` - ASCII logo rendering
- `jq` - JSON parsing for metrics

