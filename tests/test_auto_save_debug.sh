#!/usr/bin/env bash
# Debug script to find the hanging issue

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/../src/tree/auto_save.sh"

TEST_DIR=$(mktemp -d)

cleanup() {
    echo "Cleanup called"
    stop_auto_save 2>/dev/null || true
    # Kill any remaining background processes
    jobs -p | xargs kill 2>/dev/null || true
    rm -rf "$TEST_DIR"
}

trap cleanup EXIT

echo "Test 1: Creating tree"
tree=$(init_tree "Test" "llama2")
echo "Tree created"

echo "Test 2: Writing tree to file"
tree_ref_file="$TEST_DIR/tree_ref.json"
save_path="$TEST_DIR/auto_save.json"
echo "$tree" > "$tree_ref_file"
echo "Tree written"

echo "Test 3: Starting auto-save"
set -x
pid=$(start_auto_save "$tree_ref_file" "$save_path" 2)
set +x
echo "Auto-save started with PID: $pid"

echo "Test 4: Checking if process is running"
if kill -0 "$pid" 2>/dev/null; then
    echo "Process is running"
else
    echo "Process is NOT running"
fi

echo "Test 5: Stopping auto-save"
stop_auto_save
echo "Auto-save stopped"

echo "Test 6: Checking if process stopped"
sleep 0.5
if kill -0 "$pid" 2>/dev/null; then
    echo "Process is STILL running (BAD)"
else
    echo "Process stopped (GOOD)"
fi

echo "All tests completed successfully"
