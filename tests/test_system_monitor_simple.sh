#!/usr/bin/env bash
# Simple test for system monitor functionality

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Source the system monitor
source "${PROJECT_ROOT}/src/monitor/system_monitor.sh"

echo "=== System Monitor Simple Test ==="
echo ""

# Test 1: Get CPU usage
echo "Test 1: getCPUUsage"
cpu=$(getCPUUsage)
echo "  Result: $cpu"
if [ "$cpu" = "N/A" ]; then
    echo "  Status: ⚠️  CPU metrics unavailable (this is acceptable)"
elif [[ "$cpu" =~ ^[0-9]+\.?[0-9]*$ ]]; then
    echo "  Status: ✓ Valid CPU percentage"
else
    echo "  Status: ✗ Invalid CPU value"
    exit 1
fi
echo ""

# Test 2: Get RAM usage
echo "Test 2: getRAMUsage"
ram=$(getRAMUsage)
echo "  Result: $ram"
if [ "$ram" = "N/A" ]; then
    echo "  Status: ⚠️  RAM metrics unavailable (this is acceptable)"
elif [[ "$ram" =~ ^[0-9]+\.?[0-9]*$ ]]; then
    echo "  Status: ✓ Valid RAM percentage"
else
    echo "  Status: ✗ Invalid RAM value"
    exit 1
fi
echo ""

# Test 3: Start monitoring
echo "Test 3: startMonitoring"
monitor_pid=$(startMonitoring 1)
echo "  Monitor PID: $monitor_pid"
sleep 2  # Wait for metrics to be collected

# Test 4: Get metrics
echo ""
echo "Test 4: getMetrics"
metrics=$(getMetrics)
echo "  Metrics: $metrics"

cpu_val=$(echo "$metrics" | jq -r '.cpu' 2>/dev/null)
ram_val=$(echo "$metrics" | jq -r '.ram' 2>/dev/null)

echo "  CPU: $cpu_val"
echo "  RAM: $ram_val"

if [ -n "$cpu_val" ] && [ -n "$ram_val" ]; then
    echo "  Status: ✓ Metrics retrieved successfully"
else
    echo "  Status: ✗ Failed to retrieve metrics"
    stopMonitoring
    exit 1
fi
echo ""

# Test 5: Stop monitoring
echo "Test 5: stopMonitoring"
stopMonitoring
sleep 1

if kill -0 "$monitor_pid" 2>/dev/null; then
    echo "  Status: ✗ Monitor still running"
    exit 1
else
    echo "  Status: ✓ Monitor stopped successfully"
fi
echo ""

echo "=== All tests passed! ==="
exit 0
