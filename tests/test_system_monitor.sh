#!/usr/bin/env bash
# Test system monitor functionality

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Source the system monitor
source "${PROJECT_ROOT}/src/monitor/system_monitor.sh"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Test helper functions
test_start() {
    echo -e "\n${YELLOW}Testing: $1${NC}"
    TESTS_RUN=$((TESTS_RUN + 1))
}

test_pass() {
    echo -e "${GREEN}✓ PASS${NC}: $1"
    TESTS_PASSED=$((TESTS_PASSED + 1))
}

test_fail() {
    echo -e "${RED}✗ FAIL${NC}: $1"
    TESTS_FAILED=$((TESTS_FAILED + 1))
}

# Test 1: getCPUUsage returns valid value or N/A
test_start "getCPUUsage returns valid value or N/A"
cpu=$(getCPUUsage)
if [ "$cpu" = "N/A" ]; then
    test_pass "CPU usage returned N/A (metrics unavailable)"
elif [[ "$cpu" =~ ^[0-9]+\.?[0-9]*$ ]]; then
    # Check if value is in valid range
    if (( $(echo "$cpu >= 0.0" | bc -l) )) && (( $(echo "$cpu <= 100.0" | bc -l) )); then
        test_pass "CPU usage is valid: ${cpu}%"
    else
        test_fail "CPU usage out of range: ${cpu}%"
    fi
else
    test_fail "CPU usage is not a valid number: $cpu"
fi

# Test 2: getRAMUsage returns valid value or N/A
test_start "getRAMUsage returns valid value or N/A"
ram=$(getRAMUsage)
if [ "$ram" = "N/A" ]; then
    test_pass "RAM usage returned N/A (metrics unavailable)"
elif [[ "$ram" =~ ^[0-9]+\.?[0-9]*$ ]]; then
    # Check if value is in valid range
    if (( $(echo "$ram >= 0.0" | bc -l) )) && (( $(echo "$ram <= 100.0" | bc -l) )); then
        test_pass "RAM usage is valid: ${ram}%"
    else
        test_fail "RAM usage out of range: ${ram}%"
    fi
else
    test_fail "RAM usage is not a valid number: $ram"
fi

# Test 3: Start monitoring process
test_start "startMonitoring creates background process"
monitor_pid=$(startMonitoring 1)
sleep 0.5  # Give it time to start

if [ -n "$monitor_pid" ] && kill -0 "$monitor_pid" 2>/dev/null; then
    test_pass "Monitor process started with PID: $monitor_pid"
else
    test_fail "Monitor process failed to start"
fi

# Test 4: Metrics file is created
test_start "Metrics file is created"
if [ -f "$METRICS_FILE" ]; then
    test_pass "Metrics file exists: $METRICS_FILE"
else
    test_fail "Metrics file not found: $METRICS_FILE"
fi

# Test 5: Wait for metrics to be written
test_start "Metrics are written to file"
sleep 2  # Wait for at least one update cycle

metrics=$(getMetrics)
if [ -n "$metrics" ]; then
    cpu_val=$(echo "$metrics" | jq -r '.cpu')
    ram_val=$(echo "$metrics" | jq -r '.ram')
    
    if [ -n "$cpu_val" ] && [ -n "$ram_val" ]; then
        test_pass "Metrics retrieved: CPU=$cpu_val, RAM=$ram_val"
    else
        test_fail "Metrics incomplete: $metrics"
    fi
else
    test_fail "No metrics retrieved"
fi

# Test 6: Metrics update over time
test_start "Metrics update over time"
first_metrics=$(getMetrics)
first_timestamp=$(echo "$first_metrics" | jq -r '.timestamp')

sleep 2  # Wait for another update

second_metrics=$(getMetrics)
second_timestamp=$(echo "$second_metrics" | jq -r '.timestamp')

if [ "$second_timestamp" -gt "$first_timestamp" ]; then
    test_pass "Metrics timestamp updated: $first_timestamp -> $second_timestamp"
else
    test_fail "Metrics not updating: $first_timestamp -> $second_timestamp"
fi

# Test 7: Stop monitoring process
test_start "stopMonitoring terminates background process"
stopMonitoring
sleep 0.5

if [ -n "$monitor_pid" ] && kill -0 "$monitor_pid" 2>/dev/null; then
    test_fail "Monitor process still running: $monitor_pid"
else
    test_pass "Monitor process stopped successfully"
fi

# Test 8: Metrics file is cleaned up
test_start "Metrics file is cleaned up after stopping"
if [ ! -f "$METRICS_FILE" ]; then
    test_pass "Metrics file removed"
else
    test_fail "Metrics file still exists: $METRICS_FILE"
fi

# Test 9: Graceful handling when metrics unavailable
test_start "getMetrics returns N/A when file doesn't exist"
metrics=$(getMetrics)
cpu_val=$(echo "$metrics" | jq -r '.cpu')
ram_val=$(echo "$metrics" | jq -r '.ram')

if [ "$cpu_val" = "N/A" ] && [ "$ram_val" = "N/A" ]; then
    test_pass "Returns N/A when metrics unavailable"
else
    test_fail "Should return N/A but got: $metrics"
fi

# Test 10: Restart monitoring after stop
test_start "Can restart monitoring after stopping"
new_pid=$(startMonitoring 1)
sleep 1

if [ -n "$new_pid" ] && kill -0 "$new_pid" 2>/dev/null; then
    test_pass "Monitor restarted with new PID: $new_pid"
    stopMonitoring
else
    test_fail "Failed to restart monitor"
fi

# Summary
echo -e "\n${YELLOW}========================================${NC}"
echo -e "${YELLOW}Test Summary${NC}"
echo -e "${YELLOW}========================================${NC}"
echo -e "Total tests run: $TESTS_RUN"
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "\n${GREEN}All tests passed!${NC}"
    exit 0
else
    echo -e "\n${RED}Some tests failed!${NC}"
    exit 1
fi
