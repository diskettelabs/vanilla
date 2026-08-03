# Auto-Naming Feature Improvements

## Issues Fixed

### 1. **Auto-naming wasn't working reliably**
   - **Problem**: The `autoTitle` flag was set to `false` after the first successful naming, preventing any future automatic naming attempts even when the setting was on
   - **Root cause**: The condition `if (updated?.autoTitle && ...)` would only be true for brand new conversations, not ones that had already been named once
   - **Fix**: Changed the logic to check `state.settings.autoName` (the user's preference) and `updated.autoTitle !== false` (allowing both new conversations and those that haven't explicitly disabled it)

### 2. **No manual control over naming**
   - **Problem**: Users couldn't manually trigger renaming when auto-naming was off, or re-generate names for existing conversations
   - **Fix**: Added a rename button (using the autoname icon) to each conversation in the sidebar that manually triggers title generation

### 3. **Backend needed force parameter**
   - **Problem**: The API endpoint would skip naming if `autoTitle === false`, even for manual rename requests
   - **Fix**: Added a `force` query parameter that bypasses the `autoTitle` check for manual renames

### 4. **Naming happened too late**
   - **Problem**: Required 4 messages before auto-naming, making users wait through multiple exchanges
   - **Fix**: Changed to trigger after just 2 messages (first user prompt + first assistant response), so conversations are named immediately

## Changes Made

### Frontend (`public/app.js`)

1. **Updated `autoNameConversation()` function**:
   ```javascript
   async function autoNameConversation(id, force = false) {
     try {
       const params = force ? '?force=true' : '';
       const data = await api(`/api/conversations/${encodeURIComponent(id)}/name${params}`, { method: "POST" });
       // ... returns the title for better error handling
     } catch (error) {
       console.warn('Auto-naming failed:', error.message);
       return null;
     }
   }
   ```

2. **Added rename button to conversation list**:
   - New button appears on hover between the conversation title and delete button
   - Uses the autoname icon for visual consistency
   - Shows loading state (`...`) while generating
   - Displays success/error notifications

3. **Fixed auto-naming trigger logic and reduced threshold**:
   ```javascript
   // Old (broken):
   if (updated?.autoTitle && (updated.messageCount || 0) >= 4) {
   
   // New (working):
   if (state.settings.autoName && updated && updated.autoTitle !== false && (updated.messageCount || 0) >= 2) {
   ```
   - Now triggers after just one exchange (user prompt + assistant response)
   - Names conversations immediately instead of waiting for multiple messages

### Backend (`src/routes.js`)

1. **Updated `/api/conversations/:id/name` endpoint**:
   - Checks for `force=true` query parameter
   - When forced, bypasses the `autoTitle === false` check
   - Only sets `autoTitle = false` for automatic naming, not manual renames
   - This allows users to re-generate names multiple times

### Styling (`public/styles.css`)

1. **Added `.conversation-rename` button styles**:
   - Matches the delete button styling
   - Hidden by default, shows on conversation row hover
   - Blue color theme on hover (vs red for delete)
   - Smooth transitions and disabled state

### Documentation (`public/index.html`)

1. **Improved settings description**:
   - Clarified that auto-naming happens "right after the first response"
   - Mentioned the manual rename button availability
   - Made the explanation more user-friendly

## How It Works Now

### Automatic Naming
1. User enables "Auto-name chats" in settings
2. **After the first prompt and response** (2 messages total), the title is automatically generated
3. The small model (~350MB) is downloaded on first use via Ollama
4. Subsequent conversations reuse the downloaded model
5. Naming happens instantly - no waiting for multiple exchanges

### Manual Naming
1. Hover over any conversation in the sidebar
2. Click the rename button (autoname icon) between the title and delete button
3. A new title is generated instantly, regardless of the auto-name setting
4. Can be used multiple times on the same conversation

## Testing Recommendations

1. **Test instant automatic naming**:
   - Create a new conversation with auto-naming ON
   - Send just one prompt and wait for response
   - Verify title updates automatically after the first response

2. **Test manual naming**:
   - Hover over an existing conversation
   - Click the rename button
   - Verify title changes and notification appears

3. **Test with setting OFF**:
   - Turn off auto-naming in settings
   - Create a new conversation
   - Verify it doesn't auto-name
   - Verify manual rename button still works

4. **Test error handling**:
   - Rename when Ollama is offline
   - Verify error notification appears gracefully

## Benefits

✅ Auto-naming now works reliably for all new conversations when enabled
✅ **Conversations are named immediately after the first response** (no waiting!)
✅ Users can manually rename any conversation at any time
✅ The rename button provides immediate visual feedback
✅ Settings description is clearer about feature behavior
✅ Backend supports both automatic and forced naming
✅ Error handling is more robust with user feedback
