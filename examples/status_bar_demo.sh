#!/usr/bin/env bash
# Demo showing how system monitor integrates with a status bar

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Source the system monitor
source "${PROJECT_ROOT}/src/monitor/system_monitor.sh"

# ANSI color codes
BOLD='\033[1m'
DIM='\033[2m'
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to render a status bar
render_status_bar() {
    local cpu="$1"
    local ram="$2"
    local width=80
    
    # Format metrics
    local cpu_display="${cpu}%"
    local ram_display="${ram}%"
    
    # Handle N/A values
    if [ "$cpu" = "N/A" ]; then
        cpu_display="N/A"
    fi
    if [ "$ram" = "N/A" ]; then
        ram_display="N/A"
    fi
    
    # Build status bar
    local status_text="CPU: ${cpu_display} | RAM: ${ram_display}"
    local padding=$((width - ${#status_text} - 2))
    
    # Print status bar
    echo -ne "${DIM}┌"
    printf '─%.0s' $(seq 1 $width)
    echo -e "┐${NC}"
    
    echo -ne "${DIM}│${NC} ${CYAN}${BOLD}Vanilla Chat TUI${NC}"
    printf ' %.0s' $(seq 1 $((width - 16)))
    echo -e "${DIM}│${NC}"
    
    echo -ne "${DIM}├"
    printf '─%.0s' $(seq 1 $width)
    echo -e "┤${NC}"
    
    echo -ne "${DIM}│${NC} ${GREEN}${status_text}${NC}"
    printf ' %.0s' $(seq 1 $padding)
    echo -e "${DIM}│${NC}"
    
    echo -ne "${DIM}└"
    printf '─%.0s' $(seq 1 $width)
    echo -e "┘${NC}"
}

# Clear screen
clear

echo -e "${YELLOW}${BOLD}Status Bar Integration Demo${NC}"
echo -e "${DIM}Showing how system monitor integrates with TUI status bar${NC}"
echo ""

# Start monitoring
echo "Starting system monitor..."
monitor_pid=$(startMonitoring 1)
echo "Monitor PID: $monitor_pid"
echo ""

# Display status bar for 10 seconds
echo "Displaying live status bar (updates every second):"
echo ""

for i in {1..10}; do
    # Get current metrics
    metrics=$(getMetrics)
    cpu=$(echo "$metrics" | jq -r '.cpu' 2>/dev/null || echo "N/A")
    ram=$(echo "$metrics" | jq -r '.ram' 2>/dev/null || echo "N/A")
    
    # Move cursor up to overwrite previous status bar
    if [ $i -gt 1 ]; then
        tput cuu 6  # Move up 6 lines
    fi
    
    # Render status bar
    render_status_bar "$cpu" "$ram"
    
    # Wait 1 second
    sleep 1
done

echo ""
echo "Stopping monitor..."
stopMonitoring

echo ""
echo -e "${GREEN}Demo complete!${NC}"
echo ""
echo "This demonstrates how the system monitor would be integrated"
echo "into the TUI status bar, updating metrics every second."
