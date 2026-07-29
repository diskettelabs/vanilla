#!/usr/bin/env bash
# Auto-save functionality for conversation tree persistence

# Source required utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/tree_ops.sh"

# Global variables for auto-save state
AUTO_SAVE_PID=""
AUTO_SAVE_INTERVAL=30  # seconds
AUTO_SAVE_ENABLED=false

# Start auto-save background process
# Usage: start_auto_save <tree_ref_file> <save_path> [interval]
# Parameters:
#   tree_ref_file: Path to file containing current tree state
#   save_path: Path where conversation should be saved
#   interval: Optional save interval in seconds (default: 30)
start_auto_save() {
    local tree_ref_file="$1"
    local save_path="$2"
    local interval="${3:-$AUTO_SAVE_INTERVAL}"
    
    # Validate inputs
    if [ -z "$tree_ref_file" ]; then
        echo "start_auto_save: tree_ref_file is required" >&2
        return 1
    fi
    
    if [ -z "$save_path" ]; then
        echo "start_auto_save: save_path is required" >&2
        return 1
    fi
    
    # Stop existing auto-save if running
    if [ -n "$AUTO_SAVE_PID" ]; then
        stop_auto_save
    fi
    
    # Start background process with proper detachment
    (
        while true; do
            sleep "$interval"
            
            # Check if tree ref file exists
            if [ ! -f "$tree_ref_file" ]; then
                continue
            fi
            
            # Read current tree state
            local tree=$(cat "$tree_ref_file" 2>/dev/null)
            
            if [ -z "$tree" ]; then
                continue
            fi
            
            # Attempt to save
            save "$tree" "$save_path" >/dev/null 2>&1
        done
    ) >/dev/null 2>&1 </dev/null &
    
    AUTO_SAVE_PID=$!
    AUTO_SAVE_ENABLED=true
    
    # Disown the process so it doesn't block command substitution
    disown $AUTO_SAVE_PID 2>/dev/null || true
    
    echo "$AUTO_SAVE_PID"
}

# Stop auto-save background process
# Usage: stop_auto_save
stop_auto_save() {
    if [ -z "$AUTO_SAVE_PID" ]; then
        return 0
    fi
    
    # Kill the process and all its children
    # First try process group kill
    kill -- -"$AUTO_SAVE_PID" 2>/dev/null || true
    
    # Also kill the specific PID
    kill "$AUTO_SAVE_PID" 2>/dev/null || true
    
    # Kill any child processes (like sleep)
    pkill -P "$AUTO_SAVE_PID" 2>/dev/null || true
    
    # Wait a moment
    sleep 0.3
    
    # Force kill if still running
    kill -KILL -- -"$AUTO_SAVE_PID" 2>/dev/null || true
    kill -KILL "$AUTO_SAVE_PID" 2>/dev/null || true
    pkill -KILL -P "$AUTO_SAVE_PID" 2>/dev/null || true
    
    AUTO_SAVE_PID=""
    AUTO_SAVE_ENABLED=false
}

# Save after message completion
# Usage: save_after_message <tree_json> <save_path>
# Returns: "success" or error message
save_after_message() {
    local tree="$1"
    local save_path="$2"
    
    # Validate inputs
    if [ -z "$tree" ]; then
        echo "error: tree is empty" >&2
        return 1
    fi
    
    if [ -z "$save_path" ]; then
        echo "error: save_path is empty" >&2
        return 1
    fi
    
    # Attempt to save
    local result=$(save "$tree" "$save_path" 2>&1)
    local exit_code=$?
    
    if [ $exit_code -eq 0 ]; then
        echo "success"
        return 0
    else
        echo "$result" >&2
        return 1
    fi
}

# Check if auto-save is running
# Usage: is_auto_save_running
# Returns: "true" or "false"
is_auto_save_running() {
    if [ -z "$AUTO_SAVE_PID" ]; then
        echo "false"
        return 1
    fi
    
    # Check if process is still alive
    if kill -0 "$AUTO_SAVE_PID" 2>/dev/null; then
        echo "true"
        return 0
    else
        # Process died, clean up
        AUTO_SAVE_PID=""
        AUTO_SAVE_ENABLED=false
        echo "false"
        return 1
    fi
}

# Get auto-save status
# Usage: get_auto_save_status
# Returns: JSON object with status information
get_auto_save_status() {
    local is_running=$(is_auto_save_running)
    
    jq -n \
        --arg enabled "$AUTO_SAVE_ENABLED" \
        --arg running "$is_running" \
        --arg pid "$AUTO_SAVE_PID" \
        --arg interval "$AUTO_SAVE_INTERVAL" \
        '{
            enabled: ($enabled == "true"),
            running: ($running == "true"),
            pid: $pid,
            interval: ($interval | tonumber)
        }'
}

# Graceful shutdown - stop auto-save and perform final save
# Usage: shutdown_auto_save <tree_json> <save_path>
shutdown_auto_save() {
    local tree="$1"
    local save_path="$2"
    
    # Stop background process
    stop_auto_save
    
    # Perform final save if tree provided
    if [ -n "$tree" ] && [ -n "$save_path" ]; then
        save_after_message "$tree" "$save_path" >/dev/null 2>&1
    fi
}

