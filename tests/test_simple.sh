#!/usr/bin/env bash

echo "Step 1: Sourcing auto_save.sh"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/../src/tree/auto_save.sh"
echo "Step 1 complete"

echo "Step 2: Creating test directory"
TEST_DIR=$(mktemp -d)
echo "Test dir: $TEST_DIR"

echo "Step 3: Creating tree"
tree=$(init_tree "Test" "llama2")
echo "Tree: ${tree:0:50}..."

echo "Step 4: Writing to file"
echo "$tree" > "$TEST_DIR/tree.json"
echo "File written"

echo "Step 5: Calling start_auto_save function"
echo "About to call start_auto_save..."

# Try calling it directly without capturing output
start_auto_save "$TEST_DIR/tree.json" "$TEST_DIR/save.json" 2 &
wait_pid=$!

echo "Waiting for start_auto_save to complete..."
wait $wait_pid
echo "start_auto_save completed"

echo "Step 6: Cleanup"
rm -rf "$TEST_DIR"
echo "Done"
