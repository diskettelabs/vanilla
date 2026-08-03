# CORS Fix for Vosk Model Download

## Problem

The alphacephei.com server doesn't send CORS headers, so browsers block direct fetch requests:

```
Access to fetch at 'https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip' 
from origin 'http://127.0.0.1:3000' has been blocked by CORS policy: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## Solution

Create a proxy endpoint on our server that:
1. Downloads the model from alphacephei.com (server-to-server, no CORS)
2. Streams it to the browser with proper CORS headers
3. Caches it for 1 year to avoid repeated downloads

## Implementation

### Backend (src/routes.js)

Added a new endpoint `/api/vosk-model` that:
- Fetches the model from alphacephei.com using Node's `https` module
- Adds CORS headers (`Access-Control-Allow-Origin: *`)
- Adds caching headers (`Cache-Control: public, max-age=31536000`)
- Streams the response directly to the client

```javascript
app.get('/api/vosk-model', (req, res) => {
  const modelUrl = 'https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip';
  
  https.get(modelUrl, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, {
      'Content-Type': 'application/zip',
      'Content-Length': proxyRes.headers['content-length'],
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=31536000',
    });
    
    proxyRes.pipe(res);
  }).on('error', (err) => {
    res.status(500).json({ error: 'Failed to download model' });
  });
});
```

### Frontend (public/app.js)

Changed the model URL from external to our proxy:

**Before:**
```javascript
const model = await Vosk.createModel('https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip');
```

**After:**
```javascript
const model = await Vosk.createModel('/api/vosk-model');
```

## Benefits

✅ **No CORS errors** - Server-side download bypasses CORS  
✅ **Transparent to user** - Works exactly the same from user perspective  
✅ **Cached** - Browser caches the model for 1 year  
✅ **Streamable** - Uses pipe() for efficient memory usage  
✅ **Same origin** - No cross-origin security issues  

## Testing

1. **Restart server:**
   ```bash
   npm run dev
   ```

2. **Clear browser cache** (to test fresh download)

3. **Open browser:**
   ```
   http://localhost:3000
   ```

4. **Click dictation button**

5. **Check console** - Should see:
   ```
   Loading Vosk model (first time, ~40MB download)...
   Model loaded successfully
   ```

6. **Check Network tab** - Should see request to `/api/vosk-model` (not alphacephei.com)

## Files Changed

```
✅ src/routes.js       - Added /api/vosk-model proxy endpoint
✅ public/app.js        - Changed model URL to use proxy
```

## How It Works

```
┌─────────┐         ┌─────────────┐         ┌──────────────────┐
│ Browser │────────▶│ Your Server │────────▶│ alphacephei.com  │
│         │◀────────│   (proxy)   │◀────────│  (Vosk models)   │
└─────────┘         └─────────────┘         └──────────────────┘
   ^                      |
   |                      |
   └──────────────────────┘
    With CORS headers
```

1. Browser requests `/api/vosk-model` from your server (same origin, no CORS)
2. Your server downloads from alphacephei.com (server-to-server, no CORS restrictions)
3. Your server adds CORS headers and streams to browser
4. Browser receives model with proper headers

## Performance

- **First download**: ~30-60 seconds (40MB)
- **Subsequent uses**: Instant (cached by browser)
- **Memory**: Streaming keeps server memory low
- **Bandwidth**: Only downloaded once per browser

## Alternative Approaches

### Option 1: Download model to server
Pre-download the model and serve it locally:

```bash
cd public
mkdir models
wget https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip
unzip vosk-model-small-en-us-0.15.zip
```

Then use: `await Vosk.createModel('/models/vosk-model-small-en-us-0.15')`

**Pros:** No external dependency, faster  
**Cons:** Increases repo size, requires manual updates

### Option 2: Use different model host
Some model hosts have CORS enabled. Check Vosk documentation for alternatives.

## Troubleshooting

### Model still won't download

**Check server logs:**
```
Proxying Vosk model download...
```

If you see errors, the server can't reach alphacephei.com:
- Check firewall
- Check internet connection
- Try manual wget to test

### Download is slow

The model is 40MB. On slow connections:
- First download takes time
- Show progress indicator (future enhancement)
- Consider pre-downloading model to server

### Model works but accuracy is poor

- Try larger model (change URL in routes.js)
- Example: `vosk-model-en-us-0.22` (1.8GB, much better accuracy)
- Trade-off: size vs accuracy

## Next Steps

Consider:
- [ ] Add download progress bar
- [ ] Pre-download model during npm install
- [ ] Support multiple language models
- [ ] Add model selector in UI
