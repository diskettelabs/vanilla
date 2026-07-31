# Syntax Highlighting Fixes

## Issues Fixed

### 1. Code Font Size Too Large
**Problem:** Code blocks were displaying at 14px, which felt too large relative to the surrounding text.

**Solution:** Reduced font size from 14px to 13px for better readability and consistency.

```css
/* Before */
font-size: 14px;

/* After */
font-size: 13px;
```

### 2. Streaming Code Block Display Issue
**Problem:** During streaming, incomplete code blocks would show as plain text like "python [code...]" before being formatted into a proper code box once the closing ``` was received.

**Solution:** Modified the `renderMarkdown()` function to render incomplete code blocks (during streaming) as code boxes immediately, rather than waiting for completion.

```javascript
// Now during streaming, even incomplete code fences are rendered as code boxes
if (streaming && i === fenceParts.length - 1) {
  // Still render as code box, not plain text
  const detectedLang = detectLanguage(lang, code);
  const langClass = detectedLang ? `language-${detectedLang}` : "";
  const langDisplay = detectedLang || lang || "code";
  chunks.push(`<div class="code-box">...</div>`);
}
```

**Result:** Code appears in proper code boxes from the first token, maintaining consistent formatting throughout streaming.

### 3. Font Stack Improvement
**Problem:** Using "SFMono-Regular" which is specific to macOS. Needed better cross-platform monospace font support.

**Solution:** Updated font stack to use system-provided monospace fonts with better fallbacks:

```css
font-family: ui-monospace, "Cascadia Code", "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;
```

**Font Priority:**
1. `ui-monospace` - System UI monospace (modern browsers)
2. `Cascadia Code` - Windows Terminal default
3. `SF Mono` - macOS system monospace
4. `Menlo` - macOS fallback
5. `Consolas` - Windows fallback
6. `Liberation Mono` - Linux fallback
7. `monospace` - Generic fallback

### 4. Consistent Inline Code Styling
**Problem:** Inline code (`code`) had slightly smaller font size (0.86em) compared to code blocks.

**Solution:** Adjusted inline code to 0.88em and ensured all code elements use the same font stack.

## Files Modified

### `/public/app.js`
- Updated `renderMarkdown()` to render incomplete code blocks as proper code boxes during streaming
- Removed the conditional that would render incomplete fences as plain paragraphs

### `/public/styles.css`
- Reduced `.code-box code` font-size: `14px` → `13px`
- Updated font-family for all code elements to use comprehensive system font stack
- Adjusted inline code font-size: `0.86em` → `0.88em`
- Applied consistent font stack to `.assistant-body code` and `.muted-note code`

## Visual Improvements

### Before:
- Code streaming as: `python [code content]` → jumps to formatted box
- Font felt oversized
- Font inconsistency across platforms

### After:
- Code streaming immediately in formatted code box
- Consistent, readable font size (13px)
- System-appropriate monospace fonts on all platforms
- Smooth streaming experience without layout shifts

## Testing Checklist

- [x] Code blocks render immediately during streaming
- [x] No "plain text" flash before formatting
- [x] Font size feels balanced with surrounding text
- [x] Monospace font displays correctly on macOS
- [x] Font stack provides good fallbacks
- [x] Inline code matches code block styling
- [x] Line numbers remain aligned
- [x] Copy button still works correctly
- [x] Syntax highlighting applies correctly during streaming

## Platform-Specific Font Results

| Platform | Primary Font Used | Appearance |
|----------|------------------|------------|
| macOS | SF Mono | Native, crisp |
| Windows | Cascadia Code / Consolas | Clean, modern |
| Linux | Liberation Mono | Readable, standard |
| Other | System monospace | Fallback |

All platforms now display code with appropriate system fonts that feel native and readable.
