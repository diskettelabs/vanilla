# Dictation Feature Fix

## Issues Fixed

### 1. Dictation Stopping Immediately
**Problem**: The speech recognition would start and immediately stop, even with microphone permissions granted.

**Root Cause**: The `onend` event was firing and the restart logic was causing issues. The `isRecording` flag needed to be set before calling `start()`, and a small delay was needed before restarting.

**Solution**:
- Set `state.isRecording = true` BEFORE calling `recognition.start()`
- Added a 100ms delay in the `onend` handler before restarting
- Added better error handling for 'no-speech' errors (don't stop on those)
- Improved transcript handling to properly append text

### 2. Icon Update
**Problem**: Requested to use `dictate.svg` icon instead of inline SVG.

**Solution**:
- Changed from inline SVG to `<img src="./assets/dictate.svg">`
- Updated CSS to handle the active state with proper filter for white icon
- Removed SVG-specific CSS rules

## Changes Made

### JavaScript (`public/app.js`)

**Before**:
```javascript
state.recognition.onstart = () => {
    state.isRecording = true;
    // ...
};

state.recognition.onend = () => {
    if (state.isRecording) {
        try {
            state.recognition.start();
        } catch (e) {
            stopDictation();
        }
    }
};

function startDictation() {
    try {
        state.recognition.start();
    } catch (e) {
        console.error('Could not start speech recognition:', e);
    }
}
```

**After**:
```javascript
state.recognition.onstart = () => {
    console.log('Dictation started');
    state.isRecording = true;
    // ...
};

state.recognition.onend = () => {
    console.log('Recognition ended, isRecording:', state.isRecording);
    if (state.isRecording) {
        try {
            setTimeout(() => {
                if (state.isRecording) {
                    state.recognition.start();
                }
            }, 100);
        } catch (e) {
            console.error('Could not restart recognition:', e);
            stopDictation();
        }
    }
};

state.recognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error);
    // Don't stop on 'no-speech' error, just continue
    if (event.error !== 'no-speech') {
        stopDictation();
    }
};

function startDictation() {
    state.isRecording = true;  // Set BEFORE calling start()
    try {
        state.recognition.start();
    } catch (e) {
        console.error('Could not start speech recognition:', e);
        state.isRecording = false;
    }
}
```

### HTML (`public/index.html`)

**Before**:
```html
<button id="dictationButton" class="pill-tool" type="button">
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="..." stroke="currentColor"/>
  </svg>
  <span id="dictationLabel">dictate</span>
</button>
```

**After**:
```html
<button id="dictationButton" class="pill-tool" type="button">
  <img src="./assets/dictate.svg" alt="">
  <span id="dictationLabel">dictate</span>
</button>
```

### CSS (`public/styles.css`)

**Before**:
```css
.pill-tool svg {
  width: 18px;
  height: 18px;
  opacity: 0.45;
  stroke: currentColor;
}

.pill-tool[data-active="true"] svg {
  opacity: 1;
}
```

**After**:
```css
.pill-tool[data-active="true"] {
  background: #ff4444;
  color: white;
  border-color: #ff4444;
  animation: pulse-recording 1.5s ease-in-out infinite;
}

.pill-tool[data-active="true"] img {
  opacity: 1;
  filter: brightness(0) invert(1);  /* Makes icon white when active */
}
```

## How It Works Now

1. **User clicks dictation button**
   - `startDictation()` sets `state.isRecording = true` first
   - Then calls `recognition.start()`

2. **Recognition starts**
   - `onstart` event confirms recording state
   - Button turns red and pulses
   - Label changes to "listening..."

3. **User speaks**
   - `onresult` event fires continuously
   - Text is appended to textarea
   - Textarea resizes automatically

4. **Recognition ends naturally** (pause in speech)
   - `onend` event fires
   - Waits 100ms
   - Checks if still recording
   - Restarts automatically

5. **User clicks button to stop**
   - `stopDictation()` sets `state.isRecording = false`
   - `onend` fires but doesn't restart
   - Button returns to normal state

## Testing Instructions

1. Start the dev server: `npm run dev`
2. Open in Chrome (best support)
3. Click the dictation button
4. Allow microphone access when prompted
5. Speak clearly
6. Watch text appear in real-time
7. Click button again to stop
8. Verify text is preserved

## Debug Logging

Added console logs to help diagnose issues:
- `'Dictation started'` - Recognition started successfully
- `'Recognition ended, isRecording: X'` - Shows if it should restart
- `'Stopping dictation'` - Manual stop triggered

Open browser console (F12) to see these logs.

## Browser Compatibility

✅ **Chrome/Edge**: Full support, works perfectly
✅ **Safari**: Full support
❌ **Firefox**: Not supported (button hidden automatically)

## Known Behaviors

- **Auto-pause**: Recognition pauses after ~10 seconds of silence
- **Auto-restart**: Automatically restarts after pause
- **No-speech error**: Ignored, continues listening
- **Network error**: Stops dictation
- **Permission denied**: Stops dictation

## Files Modified

1. `public/app.js` - Fixed restart logic and flag timing
2. `public/index.html` - Changed to use dictate.svg
3. `public/styles.css` - Updated icon filter for active state
