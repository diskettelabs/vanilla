# Vanilla Chat TUI - Quick Start Guide

A minimalist terminal-based chat interface for local AI models via Ollama.

## Prerequisites

1. **Ollama** must be installed and running locally
   ```bash
   # Install Ollama (macOS)
   brew install ollama
   
   # Start Ollama service
   ollama serve
   
   # Pull a model (in another terminal)
   ollama pull llama2
   ```

2. **Required tools**:
   - `bash` (version 4.0+)
   - `jq` (JSON processor)
   - `curl` (HTTP client)

## Installation

```bash
# Clone or download the repository
cd vanilla-sh

# Make the main script executable
chmod +x vanilla-chat.sh

# Run the application
./vanilla-chat.sh
```

## Basic Usage

### Starting the Application

```bash
# Default settings (vanilla theme, llama2 model)
./vanilla-chat.sh

# With specific theme
./vanilla-chat.sh --theme chocolate

# With specific model
./vanilla-chat.sh --model llama3

# Load existing conversation
./vanilla-chat.sh --conversation data/conversations/my-chat.json
```

### Keyboard Controls

| Key | Action |
|-----|--------|
| **Type** | Enter your message |
| **Enter** | Send message (when input is non-empty) |
| **Backspace** | Delete character |
| **Ctrl+T** | Switch theme (cycles through 14 flavors) |
| **Ctrl+B** | Navigate conversation branches |
| **Ctrl+C** or **Ctrl+D** | Quit application |

## Features

### 🍦 14 Ice Cream Themes

Choose from 14 delicious color schemes:
- vanilla, chocolate, strawberry
- lavender, plum, mint
- dreamsicle, lemon, lime
- blue-moon, dragonfruit, peach
- raspberry, monochrome

```bash
# List all themes
./vanilla-chat.sh --list-themes

# Start with a theme
./vanilla-chat.sh --theme dragonfruit
```

### 🌳 Conversation Branching

Edit any previous message to explore alternate conversation paths:

1. Press **Ctrl+B** to open branch selector
2. Use arrow keys to select a branch
3. Press **Enter** to switch to that branch

### 📊 System Monitoring

Real-time CPU and RAM usage displayed in the status bar.

### 💾 Auto-Save

Conversations are automatically saved:
- Every 30 seconds
- After each completed message
- On application exit

Saved to: `data/conversations/conversation-<timestamp>.json`

### 🔒 Privacy & Security

- All data stored locally only
- No external API calls (except localhost Ollama)
- Conversation files have 600 permissions (user-only)
- Input sanitization for safety

## Troubleshooting

### "Cannot connect to Ollama service"

1. Check if Ollama is running:
   ```bash
   curl http://localhost:11434/api/tags
   ```

2. Start Ollama if not running:
   ```bash
   ollama serve
   ```

3. Verify model is available:
   ```bash
   ollama list
   ```

### "Theme not found"

List available themes:
```bash
./vanilla-chat.sh --list-themes
```

Use exact theme name (lowercase, with hyphens):
```bash
./vanilla-chat.sh --theme blue-moon
```

### Terminal Display Issues

- Ensure terminal supports 256 colors
- Minimum terminal size: 80x24
- Try resizing terminal window

### Missing Dependencies

Install required tools:

```bash
# macOS
brew install jq curl

# Ubuntu/Debian
sudo apt-get install jq curl

# Fedora/RHEL
sudo dnf install jq curl
```

## Examples

### Basic Chat Session

```bash
# Start the application
./vanilla-chat.sh

# Type your message
> Hello, how are you?

# AI responds with streaming tokens
# Continue the conversation...
```

### Theme Switching

```bash
# Start with vanilla theme
./vanilla-chat.sh

# Press Ctrl+T to cycle through themes
# Theme changes immediately without losing conversation
```

### Branch Navigation

```bash
# Have a conversation
> What is the capital of France?
# AI: Paris

# Press Ctrl+B to see branches
# Edit a previous message to create new branch
# Explore alternate conversation paths
```

### Loading Previous Conversation

```bash
# List saved conversations
ls data/conversations/

# Load a specific conversation
./vanilla-chat.sh --conversation data/conversations/conversation-1234567890.json
```

## Tips

1. **Use descriptive prompts** for better AI responses
2. **Switch themes** to match your mood or reduce eye strain
3. **Create branches** to explore different conversation directions
4. **Monitor system resources** in the status bar during heavy AI processing
5. **Save important conversations** by copying the JSON file

## Getting Help

```bash
# Show help message
./vanilla-chat.sh --help

# List available themes
./vanilla-chat.sh --list-themes
```

## Project Structure

```
vanilla-sh/
├── vanilla-chat.sh          # Main application
├── src/                     # Source components
│   ├── chat/               # Chat management
│   ├── lib/                # Utilities
│   ├── monitor/            # System monitoring
│   ├── ollama/             # Ollama client
│   ├── theme/              # Theme engine
│   ├── tree/               # Conversation tree
│   └── tui/                # Terminal UI
├── themes/                  # 14 theme definitions
├── data/conversations/      # Saved conversations
└── tests/                   # Test suites
```

## Contributing

See the main README.md for development information.

## License

See LICENSE file for details.

---

Enjoy your conversations with Vanilla Chat TUI! 🍦
