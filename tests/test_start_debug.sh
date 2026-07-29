#!/usr/bin/env bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Inline the start_auto_save function with debugging
start_auto_save_debug() {
    local tree_ref_file="$1"
    local save_path="$2"
    local interval="$3"
    
    echo "DEBUG: Starting background process..."
    
    (
        echo "DEBUG: Inside subshell, PID=$$"
        while true; do
            sleep "$interval"
            echo "DEBUG: Sleep completed" >> /tmp/autosave_debug.log
        done
    ) >/dev/null 2>&1 </dev/null &
    
    local bg_pid=$!
    echo "DEBUG: Background PID captured: $bg_pid"
    echo "DEBUG: Current shell PID: $$"
    
    disown $bg_pid 2>/dev/null || true
    echo "DEBUG: Process disowned"
    
    echo "$bg_pid"
}

TEST_DIR=$(mktemp -d)
trap "rm -rf $TEST_DIR" EXIT

echo "$TEST_DIR/tree.json"
echo "{}" > "$TEST_DIR/tree.json"

echo "Calling start_auto_save_debug..."
pid=$(start_auto_save_debug "$TEST_DIR/tree.json" "$TEST_DIR/save.json" 2)
echo "Returned PID: $pid"
echo "Current script PID: $$"

echo "Checking process..."
ps -f -p $pid

echo "Killing..."
kill -9 $pid 2>/dev/null || echo "Kill failed"

sleep 0.5

if ps -p $pid >/dev/null 2>&1; then
    echo "Still running"
else
    echo "Stopped"
fi
