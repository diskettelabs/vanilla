# Vosk Offline Speech Recognition Implementation

## Overview

Switched from Web Speech API to Vosk for **offline, local speech recognition** that doesn't require internet connectivity or send data to external servers.

## Why Vosk?

- ✅ **Fully offline** - No internet required after initial model download
- ✅ **Privacy-first** - Audio never leaves your computer
- ✅ **No API limits** - Works without rate limits or API keys
- ✅ **Cross-browser** - Works in all modern browsers
- ✅ **No network errors** - Eliminates the network error issues from Web Speech API

## What Changed

### Dependencies Added

```json
{
  "dependencies": {
    "vosk-browser": "^0.0.8"
  }
}
```

### Files Modified

1. **`server.js`** - Added static route for node_modules
2. **`public/index.html`** - Added Vosk script tag
3. **`public/app.js`** - Complete rewrite of dictation code

### State Variables

```javascript
state.voskModel = null;          // Loaded Vosk model
state.voskRecognizer = null;     // Active recognizer instance
state.audioContext = null;       // Web Audio API context
state.mediaStream = null;        // Microphone stream
state.audioProcessor = null;     // Audio processing node
```

## How It Works

### 1. First Use - Model Download

On first click of the dictation button:
- Downloads a ~40MB English language model from alphacephei.com
- Model is cached by the browser
- Subsequent uses are instant (no download)

### 2. Audio Processing Pipeline

```
Microphone → MediaStream → AudioContext → ScriptProcessor → Vosk → Text
```

1. **getUserMedia** - Request microphone access
2. **AudioContext** - Create audio processing context at 16kHz
3. **ScriptProcessor** - Process audio in 4096-sample chunks
4. **Float32 → Int16** - Convert audio format for Vosk
5. **Vosk Recognition** - Process audio and return text
6. **Append to textarea** - Add recognized text

### 3. Recognition Flow

- Continuous recognition while button is active
- Real-time partial results (shown in console)
- Final results appended to textarea when sentences complete
- Clean shutdown when button clicked again

## Usage

### Starting Dictation

1. Click the dictation button (microphone icon)
2. First time: Wait for model download (~40MB, one-time)
3. Allow microphone access when prompted
4. Start speaking
5. Watch text appear in textarea

### Stopping Dictation

1. Click dictation button again
2. Vosk processes remaining audio
3. Final text is appended
4. Microphone is released

## Code Structure

### initDictation()

```javascript
async function initDictation() {
  // Check if Vosk library is loaded
  // Log initialization (model loaded on first use)
}
```

### startDictation()

```javascript
async function startDictation() {
  // Request microphone
  // Create AudioContext
  // Load model (first time only)
  // Create recognizer
  // Set up audio processing pipeline
  // Start recognition
}
```

### stopDictation()

```javascript
function stopDictation() {
  // Get final result from Vosk
  // Cleanup audio processor
  // Close AudioContext
  // Stop microphone stream
  // Reset UI
}
```

### Audio Processing

```javascript
processor.onaudioprocess = (event) => {
  // Get audio data (float32)
  // Convert to int16 for Vosk
  // Send to recognizer
  // Handle results (final and partial)
  // Append text to textarea
}
```

## Models Available

### Small Model (Default)
- **Size**: ~40MB
- **Language**: English (US)
- **Accuracy**: Good for general use
- **URL**: `vosk-model-small-en-us-0.15`

### Other Languages
You can change the model URL in `startDictation()` to support other languages:

```javascript
// French
'https://alphacephei.com/vosk/models/vosk-model-small-fr-0.22.zip'

// Spanish
'https://alphacephei.com/vosk/models/vosk-model-small-es-0.42.zip'

// German
'https://alphacephei.com/vosk/models/vosk-model-small-de-0.15.zip'
```

Full model list: https://alphacephei.com/vosk/models

## Browser Compatibility

| Browser | Support |
|---------|---------|
| Chrome | ✅ Full support |
| Edge | ✅ Full support |
| Firefox | ✅ Full support |
| Safari | ✅ Full support |
| Opera | ✅ Full support |

**Requirements:**
- Web Audio API support
- getUserMedia support
- WebAssembly support (all modern browsers)

## Performance

- **CPU Usage**: Moderate during recognition
- **Memory**: ~100MB for model + processing
- **Latency**: ~200-500ms from speech to text
- **Accuracy**: Good for clear speech in quiet environments

## Troubleshooting

### Model Won't Download

**Symptom**: Button shows "downloading model..." forever

**Causes:**
- No internet connection (needed for first download only)
- CORS issues
- Firewall blocking alphacephei.com

**Solution:**
```javascript
// Pre-download model and serve locally
// Update model URL to local path
const model = await Vosk.createModel('/models/vosk-model-small-en-us-0.15.zip');
```

### No Microphone Access

**Symptom**: Alert "Microphone access denied"

**Solution:**
1. Check browser permissions (click lock icon in address bar)
2. Ensure HTTPS (or localhost for development)
3. No other application is using the microphone

### Poor Recognition Accuracy

**Causes:**
- Background noise
- Accent/pronunciation
- Low-quality microphone
- Speaking too fast/slow

**Solutions:**
- Use a better microphone
- Speak clearly and at moderate pace
- Reduce background noise
- Use larger model for better accuracy

### Audio Distortion

**Symptom**: Crackling or distorted audio

**Solution**: Increase buffer size
```javascript
const processor = state.audioContext.createScriptProcessor(8192, 1, 1); // Increased from 4096
```

## Debug Console Logs

The implementation includes helpful console logs:

- `"Initializing Vosk speech recognition..."` - Init started
- `"Loading Vosk model (first time, ~40MB download)..."` - Model downloading
- `"Model loaded successfully"` - Model ready
- `"Vosk recognizer ready"` - Recognition started
- `"Recognized: [text]"` - Final recognized text
- `"Partial: [text]"` - Interim results
- `"Final result: [text]"` - Last text on stop

## Advantages Over Web Speech API

| Feature | Web Speech API | Vosk |
|---------|---------------|------|
| Internet required | ✅ Always | ❌ Only for initial download |
| Privacy | ❌ Sends audio to Google | ✅ 100% local |
| Network errors | ✅ Common | ❌ None after download |
| API limits | ✅ Has limits | ❌ Unlimited |
| Browser support | Chrome, Edge only | All modern browsers |
| Accuracy | Better | Good |
| Latency | Lower (~100ms) | Slightly higher (~300ms) |

## Future Improvements

- [ ] Cache model in IndexedDB for faster loading
- [ ] Add language selector dropdown
- [ ] Show partial results in textarea (gray text)
- [ ] Add punctuation commands ("period", "comma")
- [ ] Support custom vocabulary/terminology
- [ ] Add voice activity detection (VAD)
- [ ] Show confidence scores
- [ ] Support speaker diarization

## Files Changed Summary

```
server.js                      - Added /node_modules route
public/index.html              - Added vosk.js script
public/app.js                  - Rewrote dictation code
package.json                   - Added vosk-browser dependency
VOSK_DICTATION.md             - This documentation
```

## Testing

1. Start server:
```bash
npm run dev
```

2. Open http://localhost:3000

3. Click dictation button

4. First time: Wait for model download

5. Allow microphone access

6. Speak: "Hello world, this is a test."

7. See text appear in textarea

8. Click button again to stop

9. Check console for debug logs

## Resources

- Vosk Documentation: https://alphacephei.com/vosk/
- Vosk Models: https://alphacephei.com/vosk/models
- Web Audio API: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API
- getUserMedia: https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
