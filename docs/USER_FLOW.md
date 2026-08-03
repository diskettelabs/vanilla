# File Upload User Flow

## New Upload Experience

### Step 1: Access File Upload
**Two ways to attach files:**

#### Option A: From Collapsed Omnibar
1. Click the `+` button on the left side of the omnibar
2. Omnibar expands to show tools
3. Click "attach file" pill button

#### Option B: From Expanded Omnibar
1. Click `+` button (omnibar already expanded from typing)
2. Opens file picker directly

### Step 2: Select File
1. Native file picker opens
2. Supports: images (jpg, png, gif, webp, avif), text (txt, md, csv, json), documents (pdf)
3. Select your file

### Step 3: Preview Appears
**Immediately after selection:**

#### For Images:
```
┌─────────────────────────────────────────┐
│ [📷 Thumbnail] My Image.jpg        [×]  │
│                 125.3 KB                │
└─────────────────────────────────────────┘
```
- Actual image thumbnail (48x48px)
- File name (truncated if long)
- File size in KB/MB
- Remove button (X)

#### For Other Files:
```
┌─────────────────────────────────────────┐
│ [PDF]  Document.pdf                [×]  │
│        1.2 MB                           │
└─────────────────────────────────────────┘
```
- File type badge (PDF, TXT, JSON, etc.)
- File name (truncated if long)
- File size in KB/MB
- Remove button (X)

### Step 4: Add Optional Message
- Type in the textarea below the preview
- OR leave empty to send file only
- Preview stays visible while typing

### Step 5: Send or Cancel

#### To Send:
1. Click submit button (paper plane icon)
2. Progress bar appears with percentage
3. File uploads with your message
4. Preview clears automatically
5. File appears in chat with download link

#### To Cancel:
1. Click `×` button on the attachment preview
2. Preview disappears instantly
3. Can select a different file or continue typing

## UI States

### State 1: No Attachment (Default)
```
┌──────────────────────────────────────────┐
│ [+]  what's up?                     [→] │
└──────────────────────────────────────────┘
```

### State 2: Omnibar Expanded (No Attachment)
```
┌────────────────────────────────────────────┐
│ what's up?                                 │
│                                            │
│ [attach file] [tools]                 [→] │
└────────────────────────────────────────────┘
```

### State 3: With Attachment Preview
```
┌────────────────────────────────────────────┐
│ ┌────────────────────────────────────┐     │
│ │ [🖼️] image.jpg  2.3 MB         [×]│     │
│ └────────────────────────────────────┘     │
│                                            │
│ what's up?                                 │
│                                            │
│ [attach file] [tools]                 [→] │
└────────────────────────────────────────────┘
```

### State 4: Uploading
```
┌────────────────────────────────────────────┐
│ ━━━━━━━━━━━━━━━━░░░░░░░  67%              │
│ Uploading image.jpg                        │
└────────────────────────────────────────────┘
```

### State 5: In Message Thread
```
┌────────────────────────────────────────────┐
│ YOU: Here's the file you asked for        │
│                                            │
│ ┌──────────────────────────────────┐       │
│ │ [IMG] image.jpg                  │       │
│ │       image/jpeg — 2.3 MB        │       │
│ └──────────────────────────────────┘       │
└────────────────────────────────────────────┘
```

## Keyboard Shortcuts

- `Click +` → Opens file picker (when omnibar expanded)
- `Escape` → Doesn't close preview (use × button instead)
- `Enter` → Sends message with attachment (if enabled)
- `Shift+Enter` → New line in message

## Error Handling

### File Too Large
- Progress bar turns red
- Error message displays: "image file exceeds 5MB limit"
- Preview remains (can try different file)

### Unsupported Type
- Error message: "Unsupported file type: application/exe"
- File input clears
- Can select different file

### Upload Failed
- Progress bar turns red
- Error message: "Upload failed"
- Can retry same file or choose new one

## Mobile Experience

On mobile devices:
- Touch `+` to expand
- Touch "attach file" 
- Native mobile file picker opens
- Thumbnail preview adapts to smaller screen
- Remove button stays accessible
- Works with camera photos

## Accessibility

- All buttons have `aria-label` attributes
- Keyboard navigable
- Screen reader friendly
- Focus management on modal close
- Proper ARIA roles for dynamic content

## Tips

1. **Preview before sending** - Check the file is correct
2. **Add context** - Include a message explaining the file
3. **Remove mistakes** - Easy to click × and try again
4. **Send file-only** - Message is optional
5. **See file info** - Name and size clearly displayed
