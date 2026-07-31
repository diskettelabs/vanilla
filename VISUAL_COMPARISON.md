# Visual Comparison: Before and After

## Before: Hidden Upload Flow

```
┌─────────────────────────────────────────────────────┐
│  Omnibar (Expanded)                                 │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Type your message here...                         │
│                                                     │
│  [add] [tools]                              [→]    │
│                                                     │
└─────────────────────────────────────────────────────┘

Problems:
❌ Hidden file input (no visual feedback)
❌ Upload starts immediately (no preview)
❌ Can't see what you're uploading
❌ No way to cancel before upload
❌ Generic "add" button (unclear purpose)
❌ File details only visible after upload
```

## After: Integrated Upload with Preview

```
┌─────────────────────────────────────────────────────┐
│  Omnibar (Expanded with Attachment)                 │
├─────────────────────────────────────────────────────┤
│  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓    │
│  ┃  ┌────┐                                   ┃    │
│  ┃  │ 🖼️ │  vacation-photo.jpg         ✕   ┃    │
│  ┃  └────┘  2.3 MB                          ┃    │
│  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛    │
│                                                     │
│  Check out this photo from my trip!                │
│                                                     │
│  [attach file] [tools]                      [→]    │
│                                                     │
└─────────────────────────────────────────────────────┘

Benefits:
✅ Beautiful thumbnail preview
✅ Clear file information (name, size)
✅ Easy remove button (×)
✅ Can add message before sending
✅ Clear "attach file" button
✅ Auto-expands on file selection
```

## Feature Comparison Table

| Feature                    | Before | After |
|----------------------------|--------|-------|
| Thumbnail Preview          | ❌     | ✅    |
| File Info Display          | ❌     | ✅    |
| Cancel Before Upload       | ❌     | ✅    |
| Add Message with File      | ⚠️     | ✅    |
| Clear Visual Feedback      | ❌     | ✅    |
| Integrated Design          | ❌     | ✅    |
| Auto-expand on Selection   | ❌     | ✅    |
| Image Thumbnails           | ❌     | ✅    |
| File Type Badges           | ⚠️     | ✅    |
| Smooth Animations          | ❌     | ✅    |
| Mobile Friendly            | ⚠️     | ✅    |

## Step-by-Step Comparison

### Before: 5 Clicks, No Preview
```
1. Click "add" button
2. Select file in picker
3. [Upload starts immediately - no preview!]
4. Wait for progress bar
5. Message sent automatically
```

### After: 4 Clicks, Full Control
```
1. Click "attach file" button
2. Select file in picker
3. [Preview appears - see thumbnail & info!]
4. [Optional: Add message]
5. Click send when ready
```

## Real-World Examples

### Example 1: Uploading an Image

**Before:**
```
[add button clicked]
[file picker: vacation.jpg selected]
━━━━━━━━━━░░░░░░ 65% Uploading...
[Upload complete, appears in chat]
```
*Problem: What if that was the wrong file?*

**After:**
```
[attach file clicked]
[file picker: vacation.jpg selected]

Preview Shows:
┌────────────────────────────────┐
│ [📷 Thumbnail]                │
│ vacation.jpg                   │
│ 2.3 MB                        │
│                            [×] │
└────────────────────────────────┘

✓ Correct file! Click send
✗ Wrong file? Click × and try again
```

### Example 2: Uploading a Document

**Before:**
```
[Generic upload, no preview]
Upload: important-contract.pdf
```
*Can't verify it's the right document!*

**After:**
```
Preview Shows:
┌────────────────────────────────┐
│ [PDF Badge]                    │
│ important-contract.pdf         │
│ 1.2 MB                        │
│                            [×] │
└────────────────────────────────┘

✓ Can verify filename before sending
✓ Can see file size
✓ Can add context message
```

## Animation Flow

### Entry Animation
```
1. File selected
2. Omnibar expands (170ms ease)
3. Preview slides down (180ms ease)
4. Fade in from opacity 0 → 1
5. Translate from -4px → 0px
```

### Exit Animation
```
1. Remove button (×) clicked
2. Instant removal (no fade out)
3. Omnibar stays expanded
4. Ready for new file or typing
```

## Color Palette

### Attachment Preview
- **Background**: `#fafafa` (light gray)
- **Border**: `#e5e5e4` (subtle)
- **Thumbnail BG**: `#e9e9e8` (neutral)
- **Text**: `#2a2a2a` (dark gray)
- **Size**: `#888` (muted)
- **Remove hover**: `rgba(0, 0, 0, 0.08)`

### Maintains App Consistency
- Uses existing `--panel` and `--line` variables
- Matches message bubble styling
- Consistent with overall design system

## Responsive Behavior

### Desktop (> 840px)
```
┌────────────────────────────────────────┐
│ [📷 Thumb]  filename.jpg  size    [×]  │
└────────────────────────────────────────┘
     48px       flexible       icon
```

### Mobile (< 840px)
```
┌──────────────────────────┐
│ [📷]  file..  MB    [×]  │
└──────────────────────────┘
  48px  truncate  size  x
```

## Accessibility Improvements

### Before:
- Hidden input (confusing for screen readers)
- No feedback on file selection
- Unclear purpose of "add" button

### After:
- Clear "attach file" label
- File info announced to screen readers
- Remove button has aria-label
- Keyboard accessible
- Focus management
