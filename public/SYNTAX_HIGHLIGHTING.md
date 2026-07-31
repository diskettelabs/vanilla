# Syntax Highlighting Feature

The Vanilla Chat application now includes **code syntax highlighting** and **language awareness** powered by [Prism.js](https://prismjs.com).

## Features

### 1. Automatic Language Detection
The system automatically detects programming languages in code blocks, even if not explicitly specified:

- **JSON** - Detects valid JSON structures
- **HTML/XML** - Recognizes markup patterns
- **JavaScript/TypeScript** - Identifies modern JS/TS syntax
- **Python** - Detects Python keywords and patterns
- **Bash/Shell** - Recognizes shell commands and shebangs
- **CSS/SCSS** - Identifies style declarations
- **SQL** - Detects database queries
- And many more languages via Prism's autoloader

### 2. Explicit Language Declaration
You can explicitly declare the language in markdown code blocks:

\```javascript
function greet(name) {
  console.log(`Hello, ${name}!`);
}
\```

\```python
def greet(name):
    print(f"Hello, {name}!")
\```

\```bash
#!/bin/bash
echo "Hello, World!"
\```

### 3. Language Aliases
The system supports common language aliases:
- `js` → `javascript`
- `ts` → `typescript`
- `py` → `python`
- `sh`, `shell`, `zsh` → `bash`
- `yml` → `yaml`
- And more...

### 4. Line Numbers
Code blocks automatically include line numbers for better reference.

### 5. Theme Integration
The syntax highlighting theme is customized to match the Vanilla UI dark code blocks with carefully selected colors for different token types:
- **Comments**: Muted gray
- **Strings**: Green
- **Numbers/Constants**: Orange
- **Keywords**: Purple
- **Functions**: Blue
- **Variables**: Yellow

### 6. Copy Code Button
The existing "Copy" button works seamlessly with highlighted code.

## Technical Details

### Libraries Used
- **Prism.js v1.29.0** - Core syntax highlighting
- **Prism Autoloader** - Automatically loads language grammars as needed
- **Prism Line Numbers Plugin** - Adds line numbers to code blocks

### CDN Links
All libraries are loaded from CDNJS for reliability and performance.

### How It Works
1. Markdown code blocks are parsed as usual
2. Language is detected from declaration or auto-detected from code patterns
3. The appropriate Prism language class is applied
4. Prism.highlightElement() is called to apply syntax highlighting
5. Custom CSS ensures the theme matches the Vanilla UI design

## Performance
- Languages are loaded on-demand via the autoloader
- Highlighting only occurs once per code block
- No impact on streaming message rendering
- Minimal bundle size increase (CDN-hosted)

## Browser Compatibility
Works in all modern browsers that support ES6+ and CSS custom properties.
