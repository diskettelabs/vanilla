#!/usr/bin/env bash
# Logging and error handling framework

# Prevent multiple sourcing
if [[ -n "${LOGGER_SH_LOADED:-}" ]]; then
    return 0
fi
LOGGER_SH_LOADED=1

# Log levels
declare -r LOG_LEVEL_DEBUG=0
declare -r LOG_LEVEL_INFO=1
declare -r LOG_LEVEL_WARN=2
declare -r LOG_LEVEL_ERROR=3
declare -r LOG_LEVEL_FATAL=4

# Current log level (default: INFO)
LOG_LEVEL=${LOG_LEVEL:-$LOG_LEVEL_INFO}

# Log file location
LOG_DIR="${HOME}/.local/share/vanilla-chat-tui/logs"
LOG_FILE="${LOG_DIR}/vanilla-chat.log"

# Initialize logging
init_logging() {
    mkdir -p "$LOG_DIR"
    touch "$LOG_FILE"
    chmod 600 "$LOG_FILE"
}

# Get timestamp for log entries
log_timestamp() {
    date +"%Y-%m-%d %H:%M:%S"
}

# Internal log function
_log() {
    local level="$1"
    local level_num="$2"
    local message="$3"
    
    if [ "$level_num" -ge "$LOG_LEVEL" ]; then
        local timestamp=$(log_timestamp)
        echo "[$timestamp] [$level] $message" >> "$LOG_FILE"
        
        # Also print to stderr for WARN, ERROR, FATAL
        if [ "$level_num" -ge "$LOG_LEVEL_WARN" ]; then
            echo "[$level] $message" >&2
        fi
    fi
}

# Log debug message
log_debug() {
    _log "DEBUG" "$LOG_LEVEL_DEBUG" "$1"
}

# Log info message
log_info() {
    _log "INFO" "$LOG_LEVEL_INFO" "$1"
}

# Log warning message
log_warn() {
    _log "WARN" "$LOG_LEVEL_WARN" "$1"
}

# Log error message
log_error() {
    _log "ERROR" "$LOG_LEVEL_ERROR" "$1"
}

# Log fatal error and exit
log_fatal() {
    _log "FATAL" "$LOG_LEVEL_FATAL" "$1"
    exit 1
}

# Error handler for unexpected errors
error_handler() {
    local line_num="$1"
    local bash_lineno="$2"
    local command="$3"
    local error_code="$4"
    
    log_error "Error on line $line_num: Command '$command' exited with code $error_code"
}

# Set up error trapping
setup_error_handling() {
    set -eE
    trap 'error_handler ${LINENO} ${BASH_LINENO} "$BASH_COMMAND" $?' ERR
}

# Disable error trapping (for expected errors)
disable_error_handling() {
    set +eE
    trap - ERR
}

# Re-enable error trapping
enable_error_handling() {
    setup_error_handling
}

# Validate required dependencies
check_dependencies() {
    local missing_deps=()
    
    if ! command -v jq &> /dev/null; then
        missing_deps+=("jq")
    fi
    
    if ! command -v curl &> /dev/null; then
        missing_deps+=("curl")
    fi
    
    if [ ${#missing_deps[@]} -gt 0 ]; then
        log_fatal "Missing required dependencies: ${missing_deps[*]}"
    fi
}

# Initialize logging on source
init_logging
