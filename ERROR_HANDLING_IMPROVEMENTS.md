# Error Handling Improvements

## Overview

Comprehensive error handling system has been implemented across the entire application, replacing console logging with user-friendly notifications and actionable guidance. Errors are now caught, categorized, and presented with clear descriptions of what went wrong and specific steps to fix the issue.

## Key Improvements

### 1. Centralized Error Handling (`src/errors.js`)

Created a robust error classification system with:

- **AppError classes**: Base error types (NetworkError, ProviderError, ValidationError, ResourceNotFoundError, FileError)
- **Error message templates**: Pre-defined user-friendly messages for common scenarios
- **Error parsing**: Intelligent detection and enhancement of errors from various sources
- **Formatting utilities**: Separate formats for logging (technical) and client responses (user-friendly)

### 2. Client-Side Improvements (`public/app.js`)

#### Enhanced API Function
- Extracts structured error information from server responses (error, action, recoverable status)
- Enriches timeout and network errors with user guidance
- Preserves error context for better error display

#### New Error Display System
- **showAssistantError()**: Enhanced error display in chat with:
  - Warning icon and clear error message
  - Actionable guidance section
  - "Try Again" button for recoverable errors (auto-retries with retry mechanism)
  
- **showNotification()**: Toast notifications system with:
  - Error, warning, success, and info variants
  - Auto-dismiss with configurable duration
  - Slide-in animation from top-right
  - Mobile-responsive

#### Retry Mechanism
- `retryLastMessage()`: Automatically retries the last user message after an error
- Removes failed assistant response and re-sends the request
- Works seamlessly with streaming responses

#### Error Handling Coverage
- **Dictation errors**: Microphone permissions, device not found, model download failures
- **File uploads**: Progress tracking with detailed error feedback
- **Model loading**: Clear messaging when providers are unavailable
- **Streaming**: Network interruptions, timeout handling
- **All API calls**: Consistent error extraction and display

### 3. Server-Side Improvements (`src/routes.js`)

#### Structured Error Responses
All endpoints now return:
```json
{
  "error": "User-friendly error message",
  "action": "What the user should do to fix it",
  "recoverable": true/false
}
```

#### Error Logging
- Structured error logs with context (endpoint, parameters, provider, model)
- Technical details for debugging while keeping user messages clean
- Uses `formatErrorForLog()` for consistent logging format

#### Endpoint Coverage
- `/api/upload`: File type, size limit, processing failures
- `/api/models`: Provider connection, authentication, model availability
- `/api/chat/stream`: Streaming errors with SSE event error propagation
- `/api/conversations/*`: Storage errors, not found handling
- `/api/vosk-model`: Download failures with network guidance

### 4. Provider-Specific Error Handling

#### Ollama Provider (`src/providers/ollama.js`)

**Error Types:**
- **Connection refused**: "Make sure Ollama is running. Run 'ollama serve' in your terminal"
- **Model not found**: "Install this model by running 'ollama pull [model]' in your terminal"
- **Timeout**: "The model might be loading. Wait a moment and try again. For large models, first response can take 30-60s"
- **No models**: "Install a model first. Run 'ollama pull llama2' or 'ollama pull mistral'"
- **Memory errors**: "The model ran out of memory. Try a smaller model or restart Ollama"

#### OpenAI Provider (`src/providers/openai.js`)

**Error Types:**
- **Invalid API key**: "Check your API key in config/default.json. Get a key from platform.openai.com/api-keys"
- **Rate limit**: "You've made too many requests. Wait a minute or upgrade your plan"
- **Quota exceeded**: "Add credits at platform.openai.com/account/billing"
- **Model not available**: "Choose a different model from the picker"
- **Server errors**: "OpenAI is experiencing issues. Wait a moment and try again"

### 5. File Upload Error Handling (`src/upload.js`)

**Detailed error messages for:**
- Unsupported file types with list of allowed formats
- Size limits per category (image: 5MB, text: 2MB, pdf: 10MB)
- Image processing failures with recovery guidance
- Directory creation errors
- File write errors (disk space, permissions)

### 6. UI/UX Improvements (`public/styles.css`)

#### Error Message Styling
- Red-tinted background with border for visibility
- Clear visual hierarchy (title → message → action)
- Retry button with hover/active states

#### Toast Notifications
- Color-coded by type (error: red, warning: orange, success: green, info: blue)
- Smooth slide-in/out animations
- Mobile-responsive (full width on small screens)
- Icon indicators for quick recognition

## Error Categories

### Recoverable Errors
Errors that users can fix themselves:
- Network/connection issues → "Check your internet connection"
- Ollama not running → "Run 'ollama serve'"
- Missing models → "Run 'ollama pull [model]'"
- Rate limits → "Wait a minute and try again"
- File too large → "Compress or resize your file"

### Non-Recoverable Errors
Errors requiring external action or configuration:
- Quota exceeded → "Add credits to your account"
- Conversation deleted → "Start a new chat"
- Invalid file type → "Use a supported file format"

## Console Logging

**Removed:**
- `console.log()` for routine operations
- `console.warn()` for expected issues
- `console.error()` without user notification

**Kept:**
- Server-side structured error logging with context
- Remains in console but never shown raw to users

## User Experience

### Before
- Generic error messages: "Connection failed", "Request failed"
- Console-only errors that users never saw
- No guidance on how to fix issues
- No retry mechanism

### After
- Specific error messages: "Cannot connect to Ollama"
- Clear actionable guidance: "Make sure Ollama is running. Run 'ollama serve' in your terminal"
- Visual error indicators in the UI
- One-click retry for recoverable errors
- Toast notifications for quick feedback

## Tech-Savvy User Considerations

While users are tech-savvy, the improvements provide:
- **Terminal commands**: Exact commands to run (not just "install Ollama")
- **Configuration paths**: Specific file locations (config/default.json)
- **API endpoints**: Direct links to relevant pages (platform.openai.com/api-keys)
- **Technical context**: Enough detail to debug but not overwhelming
- **Recovery options**: Multiple ways to resolve issues when possible

## Testing Recommendations

1. **Ollama errors**: Stop Ollama and try to chat → should see clear "run ollama serve" message
2. **Model errors**: Select non-existent model → should see "ollama pull" command
3. **Upload errors**: Upload 20MB file → should see size limit message with exact limit
4. **Network errors**: Disconnect internet → should see network error with recovery steps
5. **OpenAI errors**: Use invalid API key → should see key configuration guidance
6. **Retry mechanism**: Trigger any recoverable error → should see working "Try Again" button

## Files Modified

1. `src/errors.js` - New centralized error handling utility
2. `public/app.js` - Enhanced client error handling and notifications
3. `public/styles.css` - Error message and notification styles
4. `src/routes.js` - Structured error responses across all endpoints
5. `src/providers/ollama.js` - Provider-specific error messages
6. `src/providers/openai.js` - Provider-specific error messages
7. `src/upload.js` - File upload error handling

## Migration Notes

- No breaking changes to API contracts
- Error responses include additional fields (`action`, `recoverable`) but maintain backward compatibility
- Console logs replaced with structured logging on server-side
- All user-facing errors now go through proper notification system
