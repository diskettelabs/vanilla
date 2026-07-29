#!/usr/bin/env bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/../src/tree/auto_save.sh"

TEST_DIR=$(mktemp -d)
trap "rm -rf $TEST_DIR" EXIT

tree=$(init_tree "Test" "llama2")
echo "$tree" > "$TEST_DIR/tree.json"

echo "Starting auto-save..."
pid=$(start_auto_save "$TEST_DIR/tree.json" "$TEST_DIR/save.json" 2)
echo "PID: $pid"

echo "Checking if running..."
ps -p $pid
echo "Process is running"

echo "Calling stop_auto_save..."
stop_auto_save
echo "stop_auto_save returned"

echo "Waiting 0.5 seconds..."
sleep 0.5

echo "Checking if still running..."
if ps -p $pid >/dev/null 2>&1; then
    echo "Process $pid is STILL RUNNING"
    echo "Process details:"
    ps -f -p $pid
    
    echo "Trying manual kill..."
    kill -9 $pid
    sleep 0.2
    
    if ps -p $pid >/dev/null 2>&1; then
        echo "Process STILL running after kill -9!"
    else
        echo "Process killed by manual kill -9"
    fi
else
    echo "Process $pid has stopped"
fi
