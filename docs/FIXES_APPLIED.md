# Fixes Applied

## Issues Fixed

### 1. ✅ Attachment Preview Disappears When Typing
**Problem**: The attachment preview was hiding when you started typing because the omnibar was collapsing.

**Solution**: Modified `resizePrompt()` to keep the omnibar expanded when there's a pending attachment:

```javascript
function resizePrompt({ forceExpanded = false } = {}) {
  const compactHeight = 36;
  const hasAttachment = state.pendingAttachment !== null; // ← Added
  const shouldExpand = forceExpanded || hasAttachment || els.promptInput.value.includes("\n") || els.promptInput.scrollHeight > compactHeight + 3;
  // ... rest of function
}
```

### 2. ✅ Omnibar Collapses When Removing Attachment
**Problem**: When clicking the × button to remove an attachment, the omnibar would collapse unexpectedly.

**Solution**: Added `resizePrompt()` call to `clearAttachment()`:

```javascript
function clearAttachment() {
  state.pendingAttachment = null;
  renderAttachmentPreview();
  resizePrompt(); // ← Added - checks if omnibar should collapse
}
```

## Testing Checklist

### File Upload Flow
1. ✅ Open http://localhost:3000
2. ✅ Click + button to expand omnibar
3. ✅ Click "attach file"
4. ✅ Select an image file
5. ✅ Verify thumbnail preview appears
6. ✅ **Start typing** - preview should stay visible
7. ✅ Continue typing - omnibar stays expanded
8. ✅ Click × to remove - preview disappears smoothly
9. ✅ Select file again
10. ✅ Add message and click send
11. ✅ Verify upload progress appears
12. ✅ Verify file appears in message thread

### Expected Behavior

#### With Attachment:
```
┌─────────────────────────────────────┐
│ ┌───────────────────────────────┐   │
│ │ [🖼️] photo.jpg  2.3 MB   [×] │   │  ← Stays visible
│ └───────────────────────────────┘   │
│                                     │
│ Typing here...                      │  ← Can type freely
│                                     │
│ [attach file] [tools]          [→] │
└─────────────────────────────────────┘
```

#### After Typing (No Attachment):
```
┌─────────────────────────────────────┐
│ Here's my message!                  │
│                                     │
│ [attach file] [tools]          [→] │
└─────────────────────────────────────┘
```

#### After Removing Attachment:
- If textarea has content → stays expanded
- If textarea is empty → collapses to compact mode

## Why Upload Might Fail

If uploads are still failing, check:

1. **Server is running**: `lsof -i :3000`
2. **Upload directory exists**: `ls -la data/uploads/`
3. **Permissions**: `chmod 755 data/uploads/`
4. **File size**: Check if file exceeds limits
5. **Browser console**: Look for error messages
6. **Server logs**: `tail -f /tmp/vanilla-server.log`

## Debug Upload Issues

### Check Server Logs
```bash
tail -f /tmp/vanilla-server.log
```

### Test Upload Directly
```bash
curl -X POST http://localhost:3000/api/upload \
  -F "file=@/path/to/test-image.jpg"
```

### Expected Response
```json
{
  "url": "/uploads/1234567890-abcdef-test-image.jpg",
  "name": "test-image.jpg",
  "size": 123456,
  "type": "image/jpeg"
}
```

## Changes Summary

### Modified Files
1. **public/app.js**
   - `resizePrompt()` - Added hasAttachment check
   - `clearAttachment()` - Added resizePrompt() call

### No Changes Needed
- HTML structure is correct
- CSS is correct
- Upload logic is correct
- Server endpoint is correct

## Common Issues

### Issue: Preview Still Disappears
**Cause**: Browser cache
**Fix**: Hard refresh (Cmd+Shift+R or Ctrl+Shift+R)

### Issue: Upload Fails Immediately  
**Cause**: File input might be cleared
**Fix**: Verify `state.pendingAttachment.file` exists

### Issue: Progress Bar Doesn't Show
**Cause**: `createUploadProgress()` not called
**Fix**: Check `handleAttachmentUpload()` is being called

### Issue: File Appears But Chat Doesn't Respond
**Cause**: AI provider issue
**Fix**: Check Ollama is running: `ollama list`

## Server Restart

If you made changes, restart the server:
```bash
pkill -f "node server.js"
cd /Users/owen/Documents/GitHub/vanilla-sh
node server.js
```

Or use the dev watcher:
```bash
npm run dev
```

## Success Indicators

✅ Attachment preview shows thumbnail
✅ Preview stays visible while typing
✅ Omnibar stays expanded with attachment
✅ × button removes attachment cleanly
✅ Upload shows progress bar
✅ File appears in message thread
✅ AI responds to message with file

## Next Steps

If issues persist:
1. Open browser DevTools (F12)
2. Go to Console tab
3. Try uploading a file
4. Copy any error messages
5. Check Network tab for failed requests
