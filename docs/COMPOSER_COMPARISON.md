# Composer UI Comparison

## Before (Compact/Expanded Toggle)

### Compact State
```
┌────────────────────────────────────────────────┐
│  [+]  │ what's up?                    │  [→]  │
└────────────────────────────────────────────────┘
```
- Small pill-shaped input
- Plus button to expand
- No tools visible
- Single-line appearance

### Expanded State
```
┌────────────────────────────────────────────────┐
│                                                │
│  what's up?                                    │
│  (multi-line textarea)                         │
│                                                │
│  [attach file] [tools]                   [→]  │
└────────────────────────────────────────────────┘
```
- Rounded rectangle
- Tools appear at bottom
- Multi-line input visible
- Plus button hidden

## After (Always Expanded)

### Current State (Only One)
```
┌────────────────────────────────────────────────┐
│                                                │
│  what's up?                                    │
│  (multi-line textarea)                         │
│                                                │
│  [attach file] [🎤 dictate] [tools]      [→]  │
└────────────────────────────────────────────────┘
```
- Always expanded
- All tools always visible
- Dictation button added
- Consistent appearance
- No mode switching

### Recording State
```
┌────────────────────────────────────────────────┐
│                                                │
│  what's up?                                    │
│  (multi-line textarea)                         │
│                                                │
│  [attach file] [🔴 listening...] [tools]  [→]  │
└────────────────────────────────────────────────┘
```
- Red pulsing dictation button
- Label changes to "listening..."
- Live transcription updates textarea

## Key Differences

| Feature | Before | After |
|---------|--------|-------|
| Layout | Dynamic (compact/expanded) | Static (always expanded) |
| Tools visibility | Hidden until expanded | Always visible |
| Plus button | Yes | No (removed) |
| Dictation | No | Yes |
| User clicks to expand | Required | Not needed |
| Visual consistency | Changes shape | Consistent shape |
| Animation | Expand/collapse transition | None |

## Benefits of New Approach

1. **Simpler UX**: No hidden states to discover
2. **Faster workflow**: Tools immediately accessible
3. **Voice input**: New capability added
4. **Predictable**: Always looks the same
5. **Less code**: Removed state management complexity
6. **Better mobile**: More touch-friendly targets always visible

## Space Usage

- **Before**: Saves vertical space when compact
- **After**: Uses more space but provides better functionality

The trade-off prioritizes functionality and user experience over minimal space usage.
