# Running Vanilla Chat TUI

## Quick Start

```bash
# 1. Make sure Ollama is running (in a separate terminal)
ollama serve

# 2. Run the application
./vanilla-chat.sh
```

## What to Expect

When you run `./vanilla-chat.sh`, the application will:

1. **Clear the terminal** - This is normal! It's a full-screen TUI application
2. **Display the ASCII logo** at the top
3. **Show a status bar** at the bottom with CPU/RAM metrics
4. **Show an input prompt** (`>`) at the very bottom
5. **Wait for your input** - The cursor will be at the input prompt

## How to Use

- **Type your message** at the `>` prompt
- **Press Enter** to send the message to the AI
- **Wait for response** - The AI will stream its response in real-time
- **Press Ctrl+C or Ctrl+D** to quit

## Keyboard Shortcuts

- `Ctrl+T` - Switch themes
- `Ctrl+B` - Navigate conversation branches
- `Ctrl+C` or `Ctrl+D` - Quit application

## Command Line Options

```bash
# Start with a specific theme
./vanilla-chat.sh -t chocolate

# Start with a specific model
./vanilla-chat.sh -m llama2

# Load an existing conversation
./vanilla-chat.sh -c data/conversations/my-chat.json

# List available themes
./vanilla-chat.sh --list-themes

# Show help
./vanilla-chat.sh --help
```

## Available Themes

Run `./vanilla-chat.sh --list-themes` to see all available themes:
- vanilla (default)
- chocolate
- strawberry
- mint
- lemon
- lime
- peach
- plum
- raspberry
- lavender
- dragonfruit
- dreamsicle
- blue-moon
- monochrome

## Troubleshooting

### "Cannot connect to Ollama service"

Make sure Ollama is running:
```bash
ollama serve
```

### Terminal appears to hang

This is normal! The application is waiting for your input. Just start typing and press Enter.

### Screen looks garbled

Try resizing your terminal window. The application will automatically adjust.

### Want to see what's happening

The application runs in full-screen mode. If you want to see debug output, you can redirect stderr:
```bash
./vanilla-chat.sh 2> debug.log
```

Then in another terminal:
```bash
tail -f debug.log
```

## Data Storage

- Conversations are auto-saved to `data/conversations/`
- Auto-save runs every 30 seconds
- Conversations are also saved when you quit (Ctrl+C)

## System Requirements

- Bash 4.0 or later
- jq (JSON processor)
- curl (for Ollama API calls)
- Ollama running locally on port 11434
- Terminal with ANSI color support
