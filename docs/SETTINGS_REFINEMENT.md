# Settings UI Refinement

## Overview
The Settings UI has been refined to enhance UX, remove unnecessary animations, and add support for custom AI system prompts.

## Changes Made

### 1. **Visual Design Improvements**

#### Better Visual Hierarchy
- Section headings are now styled with uppercase text, increased letter-spacing, and muted color
- Clearer separation between sections with improved dividers
- Better spacing and padding throughout

#### Enhanced Form Controls
- All inputs, selects, and textareas now have consistent styling
- Increased border width (1.5px) for better visibility
- Focus states with subtle shadow for better accessibility
- Custom select dropdown with arrow indicator
- Textareas with proper resize behavior

#### Improved Layout
- Two-column grid for appearance settings (auto-fit, responsive)
- Better label structure with clear hierarchy
- Help text styled appropriately under labels
- Footer section for meta information

### 2. **Removed Unnecessary Animations**

#### Hover Effects Cleaned Up
- Removed `transform: translateY(-1px)` from setup button hover
- Removed `transform` transition from image hover (kept subtle shadow)
- Removed unused transform transition from attachment remove button
- Kept only necessary opacity/background transitions for interactive feedback

#### Motion Still Present Where Useful
- Model picker dropdown animation (opening/closing - functional)
- Setup button arrow shift (provides direction feedback)
- General opacity/background changes (subtle, not distracting)

### 3. **Custom System Prompt Feature**

#### Frontend (HTML)
- Added textarea input for custom prompt in AI Model section
- Added visual "Active" badge when custom prompt is set
- Reorganized settings into logical sections:
  - Account
  - AI Model (with custom prompt)
  - Appearance
  - Preferences

#### Frontend (JavaScript)
- Added `customPrompt` to state.settings
- Added `customPromptInput` and `customPromptBadge` to element references
- Implemented localStorage persistence for custom prompt
- Added input handler to update settings on change
- Badge visibility toggles based on whether prompt has content
- Custom prompt is sent with every chat request

#### Backend (routes.js)
- Updated `/api/chat/stream` endpoint to accept `customPrompt` parameter
- Logic to prepend custom system message to conversation:
  - If no system message exists, prepend custom prompt
  - If system message exists, replace with custom prompt
  - Only applied when custom prompt is provided and non-empty

### 4. **UX Improvements**

#### Simplified Sidebar Toggle
- Changed from select dropdown to checkbox ("Open sidebar by default")
- More intuitive and takes less space
- Immediately clear what the setting does

#### Better Form Feedback
- Focus states with color change and subtle shadow
- Proper cursor states (pointer for clickable elements)
- User-select disabled on checkbox labels

#### Improved Readability
- Better font sizing hierarchy (14px help text, 15px labels)
- Improved color contrast for muted text
- Cleaner code blocks with proper styling

## Technical Details

### Files Modified
1. `/public/index.html` - Settings modal structure
2. `/public/styles.css` - Settings styling and animation removal
3. `/public/app.js` - Settings state management and event handling
4. `/src/routes.js` - Backend support for custom prompts

### New CSS Classes
- `.settings-label` - Consistent label styling
- `.label-text` - Label text styling
- `.label-row` - Flexbox for label with badge
- `.label-help` - Help text styling
- `.custom-prompt-badge` - "Active" indicator
- `.settings-input` - Text input styling
- `.settings-select` - Select dropdown styling
- `.settings-textarea` - Textarea styling
- `.settings-footer` - Footer section
- `.settings-note` - Informational text
- `.settings-link-button` - Text-style button
- `.settings-grid-2col` - Two-column responsive grid

### Settings Storage
All settings are persisted in localStorage with the `vanilla-` prefix:
- `vanilla-custom-prompt` - User's custom system prompt

## How Custom Prompts Work

1. User enters custom prompt in Settings
2. Prompt is saved to localStorage on input
3. Badge appears next to "Custom system prompt" label when active
4. When sending a message, the custom prompt is included in the request
5. Backend prepends the custom prompt as a system message
6. AI responds according to the custom instructions

## Design Philosophy

The refinements follow these principles:
- **Clarity over decoration** - Focus on clear communication
- **Purposeful motion** - Animations only where they aid understanding
- **Consistent patterns** - Similar controls behave similarly
- **Progressive disclosure** - Advanced options don't clutter basic use
- **Immediate feedback** - Changes take effect right away

## Testing Checklist

- [x] Custom prompt persists across page reloads
- [x] Badge shows/hides correctly
- [x] All settings save and restore properly
- [x] Sidebar checkbox works correctly
- [x] No unnecessary hover animations remain
- [x] Form controls have proper focus states
- [x] Responsive layout works on smaller screens
- [x] Custom prompt is sent to backend
- [x] Backend prepends system message correctly
