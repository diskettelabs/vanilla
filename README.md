# Vanilla Chat TUI

A minimalist terminal-based chat interface for interacting with local AI models via Ollama.

## Features

- 🍦 14 ice cream-themed color schemes
- 🌳 Conversation tree with branching support
- ⚡ Real-time streaming responses
- 📊 System resource monitoring (CPU/RAM)
- 🎨 ASCII art ice cream logo
- 💾 Automatic conversation persistence
- 🔒 Local-only, privacy-focused

## Requirements

- Bash 4.0+
- jq (JSON processor)
- curl
- Ollama (running locally)

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd vanilla-chat-tui

# Make scripts executable
chmod +x src/**/*.sh

# Check dependencies
./src/lib/logger.sh
```

## Project Structure

```
vanilla-chat-tui/
├── src/
│   ├── lib/              # Core libraries
│   │   ├── json_utils.sh # JSON manipulation utilities
│   │   └── logger.sh     # Logging and error handling
│   ├── tree/             # Conversation tree operations
│   ├── ollama/           # Ollama API client
│   ├── tui/              # Terminal UI components
│   ├── theme/            # Theme engine
│   └── monitor/          # System monitoring
├── data/
│   ├── models/           # JSON data models
│   └── conversations/    # Saved conversations
├── themes/               # Ice cream flavor themes
└── README.md
```

## Usage

```bash
# Start the chat interface
./vanilla-chat

# With specific theme
./vanilla-chat --theme chocolate

# With specific model
./vanilla-chat --model llama2
```

## Themes

Available ice cream flavors:
- vanilla, chocolate, strawberry, lavender, plum
- mint, dreamsicle, lemon, lime, blue moon
- dragonfruit, peach, raspberry, monochrome

## Development

See `.kiro/specs/vanilla-chat-tui/` for detailed requirements, design, and implementation tasks.

## License

MIT
