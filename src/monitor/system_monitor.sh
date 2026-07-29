#!/usr/bin/env bash
# System resource monitoring for CPU and RAM metrics

# Source required utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "${SCRIPT_DIR}/../lib/logger.sh" ]; then
    source "${SCRIPT_DIR}/../lib/logger.sh"
else
    # Fallback: define minimal logging functions if logger not available
    log_info() { echo "[INFO] $1" >&2; }
    log_warn() { echo "[WARN] $1" >&2; }
    log_error() { echo "[ERROR] $1" >&2; }
fi

# Global variables for monitoring state
MONITOR_PID=""
MONITOR_INTERVAL=1
METRICS_FILE="${TMPDIR:-/tmp}/vanilla-chat-metrics.$$"

# Get CPU usage as a percentage (0.0-100.0)
# Usage: getCPUUsage
# Returns: CPU usage percentage or "N/A" if unavailable
getCPUUsage() {
    local cpu_usage="N/A"
    
    # Detect platform
    local platform=$(uname -s)
    
    case "$platform" in
        Darwin)
            # macOS: Use top command with batch mode
            # Get CPU idle percentage and calculate usage
            local idle=$(top -l 2 -n 0 -F -s 0 2>/dev/null | \
                grep "CPU usage" | tail -1 | \
                awk '{print $7}' | sed 's/%//')
            
            if [ -n "$idle" ] && [ "$idle" != "" ]; then
                # Calculate usage from idle (usage = 100 - idle)
                cpu_usage=$(echo "100 - $idle" | bc 2>/dev/null)
                
                # Validate result is a number
                if ! [[ "$cpu_usage" =~ ^[0-9]+\.?[0-9]*$ ]]; then
                    cpu_usage="N/A"
                fi
            fi
            ;;
            
        Linux)
            # Linux: Use top or mpstat if available
            if command -v mpstat &> /dev/null; then
                local idle=$(mpstat 1 1 2>/dev/null | awk '/Average/ {print $NF}')
                if [ -n "$idle" ]; then
                    cpu_usage=$(echo "100 - $idle" | bc 2>/dev/null)
                    if ! [[ "$cpu_usage" =~ ^[0-9]+\.?[0-9]*$ ]]; then
                        cpu_usage="N/A"
                    fi
                fi
            else
                # Fallback to top
                local idle=$(top -bn2 -d 0.5 2>/dev/null | \
                    grep "Cpu(s)" | tail -1 | \
                    awk '{print $8}' | sed 's/%id,//')
                
                if [ -n "$idle" ]; then
                    cpu_usage=$(echo "100 - $idle" | bc 2>/dev/null)
                    if ! [[ "$cpu_usage" =~ ^[0-9]+\.?[0-9]*$ ]]; then
                        cpu_usage="N/A"
                    fi
                fi
            fi
            ;;
            
        *)
            log_warn "Unsupported platform for CPU monitoring: $platform"
            cpu_usage="N/A"
            ;;
    esac
    
    echo "$cpu_usage"
}

# Get RAM usage as a percentage (0.0-100.0)
# Usage: getRAMUsage
# Returns: RAM usage percentage or "N/A" if unavailable
getRAMUsage() {
    local ram_usage="N/A"
    
    # Detect platform
    local platform=$(uname -s)
    
    case "$platform" in
        Darwin)
            # macOS: Use vm_stat command
            if command -v vm_stat &> /dev/null; then
                # Get page size and memory statistics
                local page_size=$(vm_stat 2>/dev/null | grep "page size" | awk '{print $8}')
                
                if [ -z "$page_size" ]; then
                    # Default page size for macOS
                    page_size=4096
                fi
                
                # Get memory statistics
                local vm_output=$(vm_stat 2>/dev/null)
                
                if [ -n "$vm_output" ]; then
                    # Extract page counts (remove trailing dots and convert to numbers)
                    local pages_free=$(echo "$vm_output" | grep "Pages free" | awk '{print $3}' | sed 's/\.//')
                    local pages_active=$(echo "$vm_output" | grep "Pages active" | awk '{print $3}' | sed 's/\.//')
                    local pages_inactive=$(echo "$vm_output" | grep "Pages inactive" | awk '{print $3}' | sed 's/\.//')
                    local pages_speculative=$(echo "$vm_output" | grep "Pages speculative" | awk '{print $3}' | sed 's/\.//')
                    local pages_wired=$(echo "$vm_output" | grep "Pages wired down" | awk '{print $4}' | sed 's/\.//')
                    local pages_compressed=$(echo "$vm_output" | grep "Pages occupied by compressor" | awk '{print $5}' | sed 's/\.//')
                    
                    # Validate we got numbers
                    if [ -n "$pages_free" ] && [ -n "$pages_active" ] && [ -n "$pages_wired" ]; then
                        # Calculate total and used memory in bytes
                        # Total = free + active + inactive + speculative + wired + compressed
                        local total_pages=$((pages_free + pages_active + pages_inactive + pages_speculative + pages_wired + pages_compressed))
                        
                        # Used = active + wired + compressed
                        local used_pages=$((pages_active + pages_wired + pages_compressed))
                        
                        # Calculate percentage
                        if [ "$total_pages" -gt 0 ]; then
                            ram_usage=$(echo "scale=1; ($used_pages * 100.0) / $total_pages" | bc 2>/dev/null)
                            
                            # Validate result
                            if ! [[ "$ram_usage" =~ ^[0-9]+\.?[0-9]*$ ]]; then
                                ram_usage="N/A"
                            fi
                        fi
                    fi
                fi
            fi
            ;;
            
        Linux)
            # Linux: Use free command
            if command -v free &> /dev/null; then
                local mem_info=$(free -m 2>/dev/null | grep "Mem:")
                
                if [ -n "$mem_info" ]; then
                    local total=$(echo "$mem_info" | awk '{print $2}')
                    local used=$(echo "$mem_info" | awk '{print $3}')
                    
                    if [ -n "$total" ] && [ "$total" -gt 0 ]; then
                        ram_usage=$(echo "scale=1; ($used * 100.0) / $total" | bc 2>/dev/null)
                        
                        if ! [[ "$ram_usage" =~ ^[0-9]+\.?[0-9]*$ ]]; then
                            ram_usage="N/A"
                        fi
                    fi
                fi
            fi
            ;;
            
        *)
            log_warn "Unsupported platform for RAM monitoring: $platform"
            ram_usage="N/A"
            ;;
    esac
    
    echo "$ram_usage"
}

# Background monitoring loop
# This function runs in a separate process and updates metrics file
_monitor_loop() {
    local interval="$1"
    local metrics_file="$2"
    
    while true; do
        local cpu=$(getCPUUsage)
        local ram=$(getRAMUsage)
        local timestamp=$(date +%s)
        
        # Write metrics to file atomically
        echo "{\"cpu\":\"$cpu\",\"ram\":\"$ram\",\"timestamp\":$timestamp}" > "${metrics_file}.tmp"
        mv "${metrics_file}.tmp" "$metrics_file"
        
        sleep "$interval"
    done
}

# Start background monitoring process
# Usage: startMonitoring [interval]
# Returns: PID of monitoring process
startMonitoring() {
    local interval="${1:-$MONITOR_INTERVAL}"
    
    # Stop existing monitor if running
    if [ -n "$MONITOR_PID" ] && kill -0 "$MONITOR_PID" 2>/dev/null; then
        log_info "Stopping existing monitor process: $MONITOR_PID"
        stopMonitoring
    fi
    
    # Create metrics file
    touch "$METRICS_FILE"
    chmod 600 "$METRICS_FILE"
    
    # Start monitoring loop in background
    _monitor_loop "$interval" "$METRICS_FILE" &
    MONITOR_PID=$!
    
    log_info "Started system monitor with PID: $MONITOR_PID (interval: ${interval}s)"
    
    echo "$MONITOR_PID"
}

# Stop background monitoring process
# Usage: stopMonitoring
stopMonitoring() {
    if [ -n "$MONITOR_PID" ]; then
        if kill -0 "$MONITOR_PID" 2>/dev/null; then
            kill "$MONITOR_PID" 2>/dev/null
            log_info "Stopped system monitor: $MONITOR_PID"
        fi
        MONITOR_PID=""
    fi
    
    # Clean up metrics file
    if [ -f "$METRICS_FILE" ]; then
        rm -f "$METRICS_FILE"
    fi
}

# Get current metrics from the monitoring process
# Usage: getMetrics
# Returns: JSON object with cpu and ram values
getMetrics() {
    if [ ! -f "$METRICS_FILE" ]; then
        echo '{"cpu":"N/A","ram":"N/A"}'
        return
    fi
    
    # Read metrics file
    local metrics=$(cat "$METRICS_FILE" 2>/dev/null)
    
    if [ -z "$metrics" ]; then
        echo '{"cpu":"N/A","ram":"N/A"}'
        return
    fi
    
    echo "$metrics"
}

# Cleanup on exit
cleanup_monitor() {
    stopMonitoring
}

# Register cleanup handler
trap cleanup_monitor EXIT INT TERM
