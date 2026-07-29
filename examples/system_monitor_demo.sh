#!/usr/bin/env bash
# Demo script for system monitor functionality

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Source the system monitor
source "${PROJECT_ROOT}/src/monitor/system_monitor.sh"

echo "==================================="
echo "System Monitor Demo"
echo "==================================="
echo ""

# Show current CPU and RAM usage
echo "Current System Metrics:"
echo "----------------------"
cpu=$(getCPUUsage)
ram=$(getRAMUsage)
echo "CPU Usage: ${cpu}%"
echo "RAM Usage: ${ram}%"
echo ""

# Start monitoring in background
echo "Starting background monitoring (1-second intervals)..."
monitor_pid=$(startMonitoring 1)
echo "Monitor PID: $monitor_pid"
echo ""

# Display metrics for 5 seconds
echo "Displaying metrics for 5 seconds:"
echo "--------------------------------"
for i in {1..5}; do
    sleep 1
    metrics=$(getMetrics)
    cpu_val=$(echo "$metrics" | jq -r '.cpu' 2>/dev/null || echo "N/A")
    ram_val=$(echo "$metrics" | jq -r '.ram' 2>/dev/null || echo "N/A")
    echo "[$i] CPU: ${cpu_val}% | RAM: ${ram_val}%"
done
echo ""

# Stop monitoring
echo "Stopping monitor..."
stopMonitoring
echo "Monitor stopped."
echo ""

echo "==================================="
echo "Demo complete!"
echo "==================================="
