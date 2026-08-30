/**
 * Centralized error handling utilities
 * Provides user-friendly error messages with actionable guidance
 * You need to do a rewrite. This code is extremely messy
 */

class AppError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = this.constructor.name;
    this.userMessage = options.userMessage || message;
    this.action = options.action || null;
    this.statusCode = options.statusCode || 500;
    this.recoverable = options.recoverable !== false;
    this.details = options.details || null;
  }

  toJSON() {
    return {
      error: this.userMessage,
      action: this.action,
      recoverable: this.recoverable,
      details: this.details,
    };
  }
}

class NetworkError extends AppError {
  constructor(message, options = {}) {
    super(message, {
      userMessage: options.userMessage || 'Network connection failed',
      action: options.action || 'Check your internet connection and try again',
      statusCode: 503,
      recoverable: true,
      ...options,
    });
  }
}

class ProviderError extends AppError {
  constructor(provider, message, options = {}) {
    super(message, {
      userMessage: options.userMessage || `${provider} is not responding`,
      statusCode: 503,
      recoverable: true,
      ...options,
    });
    this.provider = provider;
  }
}

class ValidationError extends AppError {
  constructor(message, options = {}) {
    super(message, {
      userMessage: options.userMessage || 'Invalid input',
      statusCode: 400,
      recoverable: true,
      ...options,
    });
  }
}

class ResourceNotFoundError extends AppError {
  constructor(resource, options = {}) {
    super(`${resource} not found`, {
      userMessage: options.userMessage || `${resource} not found`,
      action: options.action || 'The requested item may have been deleted or never existed',
      statusCode: 404,
      recoverable: false,
      ...options,
    });
  }
}

class FileError extends AppError {
  constructor(message, options = {}) {
    super(message, {
      userMessage: options.userMessage || 'File operation failed',
      statusCode: options.statusCode || 400,
      recoverable: options.recoverable !== false,
      ...options,
    });
  }
}

/**
 * Error message templates with clear user guidance
 */
const ErrorMessages = {
  // Provider errors
  OLLAMA_CONNECTION_FAILED: {
    userMessage: 'Cannot connect to Ollama',
    action: 'Make sure Ollama is running on your machine. Run "ollama serve" in your terminal, or start the Ollama app if installed.',
    recoverable: true,
  },
  
  OLLAMA_NO_MODELS: {
    userMessage: 'No Ollama models found',
    action: 'Install a model first. Run "ollama pull llama2" or "ollama pull mistral" in your terminal.',
    recoverable: true,
  },

  OLLAMA_TIMEOUT: {
    userMessage: 'Ollama took too long to respond',
    action: 'The model might be loading. Wait a moment and try again. For large models, the first response can take 30-60 seconds.',
    recoverable: true,
  },

  OPENAI_INVALID_KEY: {
    userMessage: 'OpenAI API key is invalid',
    action: 'Check your API key in config/default.json. Get a valid key from platform.openai.com/api-keys',
    recoverable: true,
  },

  OPENAI_RATE_LIMIT: {
    userMessage: 'OpenAI rate limit exceeded',
    action: 'You\'ve made too many requests. Wait a minute and try again, or upgrade your OpenAI plan.',
    recoverable: true,
  },

  OPENAI_QUOTA_EXCEEDED: {
    userMessage: 'OpenAI quota exceeded',
    action: 'Your OpenAI account has reached its usage limit. Add credits at platform.openai.com/account/billing',
    recoverable: false,
  },

  PROVIDER_NOT_CONFIGURED: {
    userMessage: 'AI provider not configured',
    action: 'Configure your AI provider in config/default.json. Set up either Ollama (local) or OpenAI (cloud).',
    recoverable: true,
  },

  // File upload errors
  FILE_TOO_LARGE: (sizeLimit) => ({
    userMessage: `File is too large`,
    action: `Maximum file size is ${sizeLimit}MB. Compress or resize your file and try again.`,
    recoverable: true,
  }),

  FILE_TYPE_UNSUPPORTED: (type) => ({
    userMessage: 'File type not supported',
    action: `${type} files are not allowed. Supported types: images (PNG, JPG, GIF, WebP), documents (PDF, TXT, MD), and code files.`,
    recoverable: true,
  }),

  FILE_UPLOAD_FAILED: {
    userMessage: 'File upload failed',
    action: 'Check that the file is not corrupted and try again. If the problem persists, try a different file.',
    recoverable: true,
  },

  // Storage errors
  CONVERSATION_NOT_FOUND: {
    userMessage: 'Conversation not found',
    action: 'This conversation may have been deleted. Start a new chat or select a different conversation.',
    recoverable: false,
  },

  STORAGE_WRITE_FAILED: {
    userMessage: 'Failed to save data',
    action: 'Check that you have write permissions for the data folder and sufficient disk space.',
    recoverable: true,
  },

  STORAGE_READ_FAILED: {
    userMessage: 'Failed to load data',
    action: 'The conversation file may be corrupted. Try another conversation or start a new one.',
    recoverable: true,
  },

  // Network errors
  NETWORK_TIMEOUT: {
    userMessage: 'Request timed out',
    action: 'The server took too long to respond. Check your connection and try again.',
    recoverable: true,
  },

  NETWORK_OFFLINE: {
    userMessage: 'You appear to be offline',
    action: 'Check your internet connection and try again.',
    recoverable: true,
  },

  SERVER_UNAVAILABLE: {
    userMessage: 'Server is not responding',
    action: 'The application server may be down. Make sure the server is running and try again.',
    recoverable: true,
  },

  // Model/streaming errors
  MODEL_NOT_FOUND: (model) => ({
    userMessage: `Model "${model}" not found`,
    action: `This model is not available. Check the model picker to see available models.`,
    recoverable: true,
  }),

  STREAM_INTERRUPTED: {
    userMessage: 'Response interrupted',
    action: 'The connection was lost during streaming. You can try regenerating the response.',
    recoverable: true,
  },

  NO_RESPONSE_RECEIVED: {
    userMessage: 'No response from model',
    action: 'The model did not generate any output. Try a different prompt or model.',
    recoverable: true,
  },

  // System errors
  SYSTEM_ERROR: {
    userMessage: 'An unexpected error occurred',
    action: 'Something went wrong. Try refreshing the page. If the problem persists, check the console for details.',
    recoverable: true,
  },

  MICROPHONE_DENIED: {
    userMessage: 'Microphone access denied',
    action: 'Grant microphone permissions in your browser settings (usually in the address bar), then try again.',
    recoverable: true,
  },

  MICROPHONE_NOT_FOUND: {
    userMessage: 'No microphone detected',
    action: 'Connect a microphone and refresh the page, or check your audio input settings.',
    recoverable: true,
  },

  DICTATION_FAILED: {
    userMessage: 'Speech recognition failed',
    action: 'Try again or type your message instead. Make sure you\'re speaking clearly into the microphone.',
    recoverable: true,
  },
};

/**
 * Parse error from various sources into user-friendly format
 */
function parseError(error, context = {}) {
  // Already an AppError
  if (error instanceof AppError) {
    return error;
  }

  const message = error?.message || String(error);
  const lowerMessage = message.toLowerCase();

  // Network errors
  if (error?.name === 'AbortError') {
    return new AppError(message, { ...ErrorMessages.STREAM_INTERRUPTED, ...context });
  }

  if (lowerMessage.includes('timeout') || lowerMessage.includes('timed out')) {
    if (context.provider === 'ollama') {
      return new ProviderError('Ollama', message, { ...ErrorMessages.OLLAMA_TIMEOUT, ...context });
    }
    return new NetworkError(message, { ...ErrorMessages.NETWORK_TIMEOUT, ...context });
  }

  if (lowerMessage.includes('connection') || lowerMessage.includes('econnrefused') || lowerMessage.includes('fetch failed')) {
    if (context.provider === 'ollama') {
      return new ProviderError('Ollama', message, { ...ErrorMessages.OLLAMA_CONNECTION_FAILED, ...context });
    }
    return new NetworkError(message, { ...ErrorMessages.SERVER_UNAVAILABLE, ...context });
  }

  // OpenAI specific errors
  if (lowerMessage.includes('invalid') && lowerMessage.includes('api') && lowerMessage.includes('key')) {
    return new ProviderError('OpenAI', message, { ...ErrorMessages.OPENAI_INVALID_KEY, ...context });
  }

  if (lowerMessage.includes('rate limit')) {
    return new ProviderError('OpenAI', message, { ...ErrorMessages.OPENAI_RATE_LIMIT, ...context });
  }

  if (lowerMessage.includes('quota') || lowerMessage.includes('insufficient')) {
    return new ProviderError('OpenAI', message, { ...ErrorMessages.OPENAI_QUOTA_EXCEEDED, ...context });
  }

  // Ollama specific errors
  if (lowerMessage.includes('ollama') && (lowerMessage.includes('not found') || lowerMessage.includes('no models'))) {
    return new ProviderError('Ollama', message, { ...ErrorMessages.OLLAMA_NO_MODELS, ...context });
  }

  // File errors
  if (lowerMessage.includes('file too large') || lowerMessage.includes('limit_file_size')) {
    const sizeMatch = message.match(/(\d+)MB/);
    const size = sizeMatch ? sizeMatch[1] : '10';
    return new FileError(message, { ...ErrorMessages.FILE_TOO_LARGE(size), statusCode: 413, ...context });
  }

  if (lowerMessage.includes('unsupported file type')) {
    const typeMatch = message.match(/type[:\s]+([^\s]+)/i);
    const type = typeMatch ? typeMatch[1] : 'This';
    return new FileError(message, { ...ErrorMessages.FILE_TYPE_UNSUPPORTED(type), statusCode: 415, ...context });
  }

  // Storage errors
  if (lowerMessage.includes('not found')) {
    if (context.resource === 'conversation') {
      return new ResourceNotFoundError('Conversation', { ...ErrorMessages.CONVERSATION_NOT_FOUND, ...context });
    }
    return new ResourceNotFoundError(context.resource || 'Resource', context);
  }

  // Microphone errors
  if (error?.name === 'NotAllowedError' || lowerMessage.includes('permission denied')) {
    return new AppError(message, { ...ErrorMessages.MICROPHONE_DENIED, statusCode: 403, ...context });
  }

  if (error?.name === 'NotFoundError' && context.feature === 'dictation') {
    return new AppError(message, { ...ErrorMessages.MICROPHONE_NOT_FOUND, statusCode: 404, ...context });
  }

  // Model errors
  if (lowerMessage.includes('model') && lowerMessage.includes('not found')) {
    const modelMatch = message.match(/['""]([^'""]+)['""]|model[:\s]+([^\s]+)/i);
    const model = modelMatch ? (modelMatch[1] || modelMatch[2]) : 'Unknown';
    return new AppError(message, { ...ErrorMessages.MODEL_NOT_FOUND(model), statusCode: 404, ...context });
  }

  // Generic status code handling
  const statusMatch = message.match(/(\d{3})/);
  if (statusMatch) {
    const status = parseInt(statusMatch[1]);
    if (status === 404) {
      return new ResourceNotFoundError(context.resource || 'Resource', { userMessage: message, ...context });
    }
    if (status === 401 || status === 403) {
      return new AppError(message, {
        userMessage: 'Authentication failed',
        action: 'Check your API credentials in config/default.json',
        statusCode: status,
        ...context,
      });
    }
    if (status >= 500) {
      return new AppError(message, {
        userMessage: 'Server error',
        action: 'The server encountered an error. Try again in a moment.',
        statusCode: status,
        ...context,
      });
    }
  }

  // Default fallback
  return new AppError(message, {
    ...ErrorMessages.SYSTEM_ERROR,
    details: message,
    statusCode: context.statusCode || 500,
    ...context,
  });
}

/**
 * Format error for logging (includes technical details)
 */
function formatErrorForLog(error, context = {}) {
  const parsed = parseError(error, context);
  return {
    timestamp: new Date().toISOString(),
    name: parsed.name,
    message: parsed.message,
    userMessage: parsed.userMessage,
    action: parsed.action,
    statusCode: parsed.statusCode,
    context,
    stack: error?.stack,
  };
}

/**
 * Format error for client response (user-friendly only)
 */
function formatErrorForClient(error, context = {}) {
  const parsed = parseError(error, context);
  return {
    error: parsed.userMessage,
    action: parsed.action,
    recoverable: parsed.recoverable,
    details: parsed.details,
  };
}

module.exports = {
  AppError,
  NetworkError,
  ProviderError,
  ValidationError,
  ResourceNotFoundError,
  FileError,
  ErrorMessages,
  parseError,
  formatErrorForLog,
  formatErrorForClient,
};
