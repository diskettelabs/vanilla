#!/usr/bin/env bash
# Demo script for tree corruption handling (Task 17.3)

# Get absolute paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Source required modules
source "${PROJECT_ROOT}/src/lib/json_utils.sh"
source "${PROJECT_ROOT}/src/tree/tree_ops.sh"
source "${PROJECT_ROOT}/src/lib/error_recovery.sh"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║        Tree Corruption Handling Demo (Task 17.3)              ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Create temporary directory for demo
DEMO_DIR=$(mktemp -d)
trap "rm -rf $DEMO_DIR" EXIT

echo -e "${GREEN}Step 1: Creating a valid conversation tree${NC}"
echo "----------------------------------------"
tree=$(init_tree "Demo Conversation" "llama2")
message1=$(create_message "user" "What is the weather like?" "")
add_result=$(add_node "$tree" "$message1" "")
tree=$(echo "$add_result" | jq -r '.tree')
node1_id=$(echo "$add_result" | jq -r '.nodeId')

message2=$(create_message "assistant" "I can help you check the weather." "llama2")
add_result=$(add_node "$tree" "$message2" "$node1_id")
tree=$(echo "$add_result" | jq -r '.tree')

echo "Created conversation with 2 messages"
echo ""

# Scenario 1: Invalid JSON
echo -e "${YELLOW}Scenario 1: Invalid JSON in file${NC}"
echo "----------------------------------------"
invalid_file="${DEMO_DIR}/invalid.json"
echo '{"nodes": {, "invalid": }' > "$invalid_file"
echo "Created file with invalid JSON"

result=$(handle_tree_corruption "$invalid_file")
echo ""
display_corruption_message "$result"
echo ""

# Scenario 2: Missing rootId (salvageable)
echo -e "${YELLOW}Scenario 2: Missing rootId (salvageable)${NC}"
echo "----------------------------------------"
corrupted_file="${DEMO_DIR}/missing_root.json"
echo "$tree" | jq 'del(.rootId)' > "$corrupted_file"
echo "Created file with missing rootId"

result=$(handle_tree_corruption "$corrupted_file")
can_recover=$(echo "$result" | jq -r '.canRecover')
salvaged_count=$(echo "$result" | jq -r '.salvagedNodeCount // 0')

echo ""
if [ "$can_recover" = "true" ]; then
    echo -e "${GREEN}✓ Successfully salvaged $salvaged_count message(s)${NC}"
    display_corruption_message "$result"
else
    echo -e "${RED}✗ Could not salvage messages${NC}"
fi
echo ""

# Scenario 3: Empty file
echo -e "${YELLOW}Scenario 3: Empty file${NC}"
echo "----------------------------------------"
empty_file="${DEMO_DIR}/empty.json"
touch "$empty_file"
echo "Created empty file"

result=$(handle_tree_corruption "$empty_file")
echo ""
display_corruption_message "$result"
echo ""

# Scenario 4: Load with recovery
echo -e "${YELLOW}Scenario 4: Load with automatic recovery${NC}"
echo "----------------------------------------"
recovery_file="${DEMO_DIR}/auto_recovery.json"
echo '{"nodes": {}, "rootId": "nonexistent"}' > "$recovery_file"
echo "Created file with invalid tree structure"

result=$(load_with_recovery "$recovery_file")
success=$(echo "$result" | jq -r '.success')
needs_recovery=$(echo "$result" | jq -r '.needsRecovery')

echo ""
if [ "$success" = "false" ] && [ "$needs_recovery" = "true" ]; then
    echo -e "${YELLOW}⚠ File needs recovery${NC}"
    echo "Recovery information:"
    echo "$result" | jq '{
        canRecover: .canRecover,
        backupCreated: .backupCreated,
        options: .options
    }'
else
    echo -e "${GREEN}✓ File loaded successfully${NC}"
fi
echo ""

# Scenario 5: Successful load
echo -e "${YELLOW}Scenario 5: Loading valid tree${NC}"
echo "----------------------------------------"
valid_file="${DEMO_DIR}/valid.json"
save_result=$(save "$tree" "$valid_file")
echo "Saved valid tree to file"

loaded_tree=$(load "$valid_file")
if ! echo "$loaded_tree" | grep -q "^error:"; then
    echo -e "${GREEN}✓ Tree loaded successfully${NC}"
    title=$(echo "$loaded_tree" | jq -r '.metadata.title')
    node_count=$(echo "$loaded_tree" | jq '.nodes | length')
    echo "  Title: $title"
    echo "  Nodes: $node_count"
else
    echo -e "${RED}✗ Failed to load tree${NC}"
fi
echo ""

# Scenario 6: Validate and repair
echo -e "${YELLOW}Scenario 6: Validate and repair tree${NC}"
echo "----------------------------------------"
broken_tree=$(echo "$tree" | jq 'del(.currentNodeId)')
echo "Created tree with missing currentNodeId"

repaired=$(validate_and_repair_tree "$broken_tree" 2>/dev/null)
has_current=$(echo "$repaired" | jq -e '.currentNodeId' >/dev/null 2>&1 && echo "true" || echo "false")

if [ "$has_current" = "true" ]; then
    echo -e "${GREEN}✓ Tree repaired successfully${NC}"
    current_id=$(echo "$repaired" | jq -r '.currentNodeId')
    echo "  Restored currentNodeId: $current_id"
else
    echo -e "${RED}✗ Could not repair tree${NC}"
fi
echo ""

# Summary
echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                      Demo Summary                              ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Tree corruption handling features demonstrated:"
echo "  ✓ Detection of corrupted conversation files"
echo "  ✓ Automatic backup creation"
echo "  ✓ Salvaging valid nodes from corrupted files"
echo "  ✓ User-friendly error messages"
echo "  ✓ Recovery options for different corruption types"
echo "  ✓ Validation and repair of tree structures"
echo ""
echo "All backups created during this demo are in: $DEMO_DIR"
echo "Backup files:"
ls -1 "${DEMO_DIR}"/*.corrupted.* 2>/dev/null | while read backup; do
    echo "  - $(basename "$backup")"
done
echo ""
