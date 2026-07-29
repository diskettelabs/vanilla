# System Monitor

System resource monitoring for CPU and RAM metrics in the Vanilla Chat TUI.

## Overview

The system monitor provides real-time CPU and RAM usage metrics for display in the TUI status bar. It supports both macOS (Darwin) and Linux platforms with graceful fallback to "N/A" when metrics are unavailable.

## Features

- **Cross-platform support**: Works on macOS (using `vm_stat` and `top`) and Linux (using `free` and `top`/`mpstat`)
- **Background monitoring**: Runs as a separate process with configurable update intervals
- **Graceful degradation**: Returns "N/A" when metrics cannot be retrieved
- **Atomic updates**: Metrics are written atomically to prevent race conditions
- **Clean shutdown**: Properly cleans up background processes and temporary files

## Functions

### `getCPUUsage()`

Get current CPU usage as a percentage (0.0-100.0).

**Returns**: CPU usage percentage or "N/A" if unavailable

**Example**:
```bash
cpu=$(getCPUUsage)
echo "CPU: ${cpu}%"
# Output: CPU: 25.3%
```

**Platform-specific implementation**:
- **macOS**: Uses `top -l 2` to get CPU idle percentage, then calculates usage
- **Linux**: Uses `mpstat` if available, otherwise falls back to `top`

### `getRAMUsage()`

Get current RAM usage as a percentage (0.0-100.0).

**Returns**: RAM usage percentage or "N/A" if unavailable

**Example**:
```bash
ram=$(getRAMUsage)
echo "RAM: ${ram}%"
# Output: RAM: 63.7%
```

**Platform-specific implementation**:
- **macOS**: Uses `vm_stat` to get memory page statistics and calculates usage
  - Used memory = active pages + wired pages + compressed pages
  - Total memory = free + active + inactive + speculative + wired + compressed
- **Linux**: Uses `free -m` to get memory statistics

### `startMonitoring([interval])`

Start background monitoring process that updates metrics at regular intervals.

**Parameters**:
- `interval` (optional): Update interval in seconds (default: 1)

**Returns**: PID of the monitoring process

**Example**:
```bash
monitor_pid=$(startMonitoring 1)
echo "Monitor started with PID: $monitor_pid"
```

**Behavior**:
- Creates a background process that continuously updates metrics
- Writes metrics to a temporary file atomically
- Automatically stops any existing monitor before starting a new one
- Registers cleanup handlers for proper shutdown

### `stopMonitoring()`

Stop the background monitoring process and clean up resources.

**Example**:
```bash
stopMonitoring
echo "Monitor stopped"
```

**Behavior**:
- Terminates the background monitoring process
- Removes temporary metrics file
- Safe to call even if no monitor is running

### `getMetrics()`

Get the latest metrics from the background monitoring process.

**Returns**: JSON object with `cpu`, `ram`, and `timestamp` fields

**Example**:
```bash
metrics=$(getMetrics)
cpu=$(echo "$metrics" | jq -r '.cpu')
ram=$(echo "$metrics" | jq -r '.ram')
echo "CPU: ${cpu}%, RAM: ${ram}%"
# Output: CPU: 25.3%, RAM: 63.7%
```

**Returns when unavailable**:
```json
{"cpu":"N/A","ram":"N/A"}
```

## Usage Example

```bash
#!/usr/bin/env bash

# Source the system monitor
source "src/monitor/system_monitor.sh"

# Get instant metrics
echo "Current CPU: $(getCPUUsage)%"
echo "Current RAM: $(getRAMUsage)%"

# Start background monitoring
monitor_pid=$(startMonitoring 1)

# Display metrics for 5 seconds
for i in {1..5}; do
    sleep 1
    metrics=$(getMetrics)
    cpu=$(echo "$metrics" | jq -r '.cpu')
    ram=$(echo "$metrics" | jq -r '.ram')
    echo "[$i] CPU: ${cpu}% | RAM: ${ram}%"
done

# Stop monitoring
stopMonitoring
```

## Requirements

### Required Dependencies
- `bash` (version 4.0+)
- `jq` (for JSON parsing)
- `bc` (for floating-point calculations)

### Platform-specific Dependencies

**macOS**:
- `vm_stat` (included in macOS)
- `top` (included in macOS)

**Linux**:
- `free` (usually included)
- `top` (usually included)
- `mpstat` (optional, from `sysstat` package)

## Error Handling

The system monitor handles errors gracefully:

1. **Unsupported platform**: Returns "N/A" for metrics
2. **Missing commands**: Falls back to alternative methods or returns "N/A"
3. **Invalid data**: Validates numeric results and returns "N/A" on failure
4. **Process failures**: Logs errors but continues operation

## Implementation Details

### macOS CPU Calculation

```bash
# Get CPU idle percentage from top
idle=$(top -l 2 -n 0 -F -s 0 | grep "CPU usage" | tail -1 | awk '{print $7}')

# Calculate usage (100 - idle)
cpu_usage=$(echo "100 - $idle" | bc)
```

### macOS RAM Calculation

```bash
# Get memory page statistics from vm_stat
pages_active=$(vm_stat | grep "Pages active" | awk '{print $3}')
pages_wired=$(vm_stat | grep "Pages wired down" | awk '{print $4}')
pages_compressed=$(vm_stat | grep "Pages occupied by compressor" | awk '{print $5}')

# Calculate used memory
used_pages=$((pages_active + pages_wired + pages_compressed))

# Calculate percentage
ram_usage=$(echo "scale=1; ($used_pages * 100.0) / $total_pages" | bc)
```

### Background Monitoring Loop

The monitoring loop runs in a separate process:

```bash
while true; do
    cpu=$(getCPUUsage)
    ram=$(getRAMUsage)
    timestamp=$(date +%s)
    
    # Write atomically (tmp file + move)
    echo "{\"cpu\":\"$cpu\",\"ram\":\"$ram\",\"timestamp\":$timestamp}" > "${metrics_file}.tmp"
    mv "${metrics_file}.tmp" "$metrics_file"
    
    sleep "$interval"
done
```

## Testing

Run the test suite:

```bash
./tests/test_system_monitor.sh
```

Run the demo:

```bash
./examples/system_monitor_demo.sh
```

## Requirements Validation

This implementation satisfies the following requirements:

- **Requirement 6.1**: CPU usage collected as percentage (0.0-100.0) ✓
- **Requirement 6.2**: RAM usage collected as percentage (0.0-100.0) ✓
- **Requirement 6.3**: Metrics updated at 1-second intervals ✓
- **Requirement 6.5**: Displays "N/A" for unavailable metrics ✓
- **Requirement 6.6**: Application continues operating when monitoring fails ✓

## Performance

- **CPU overhead**: < 1% (as per Requirement 13.6)
- **Update frequency**: 1 second (configurable)
- **Memory usage**: Minimal (single background process + small temp file)

## Security

- Metrics file permissions: 600 (user-only read/write)
- No external network calls
- All data stays local
- Proper cleanup on exit

## Troubleshooting

### Metrics show "N/A"

1. Check if required commands are available:
   ```bash
   # macOS
   which vm_stat top
   
   # Linux
   which free top
   ```

2. Check if commands have proper permissions

3. Verify platform is supported:
   ```bash
   uname -s  # Should show "Darwin" or "Linux"
   ```

### Background process not starting

1. Check if `$TMPDIR` is writable
2. Verify no permission issues with process creation
3. Check system logs for errors

### Metrics not updating

1. Verify background process is running:
   ```bash
   ps aux | grep _monitor_loop
   ```

2. Check if metrics file exists and is being updated:
   ```bash
   ls -la /tmp/vanilla-chat-metrics.*
   ```

3. Ensure sufficient system resources for background process
