#!/usr/bin/env bash
# Test script to verify project setup

set -e

echo "Testing Vanilla Chat TUI Setup..."
echo

# Test 1: Check directory structure
echo "✓ Checking directory structure..."
for dir in src/lib src/tree src/ollama src/tui src/theme src/monitor data/models data/conversations themes config; do
    if [ -d "$dir" ]; then
        echo "  ✓ $dir exists"
    else
        echo "  ✗ $dir missing"
        exit 1
    fi
done
echo

# Test 2: Check required files
echo "✓ Checking required files..."
for file in src/lib/json_utils.sh src/lib/logger.sh README.md .gitignore config/default.conf; do
    if [ -f "$file" ]; then
        echo "  ✓ $file exists"
    else
        echo "  ✗ $file missing"
        exit 1
    fi
done
echo

# Test 3: Check theme files (all 14 flavors)
echo "✓ Checking theme files..."
themes=(vanilla chocolate strawberry lavender plum mint dreamsicle lemon lime blue-moon dragonfruit peach raspberry monochrome)
for theme in "${themes[@]}"; do
    if [ -f "themes/${theme}.json" ]; then
        echo "  ✓ themes/${theme}.json exists"
    else
        echo "  ✗ themes/${theme}.json missing"
        exit 1
    fi
done
echo

# Test 4: Check data model files
echo "✓ Checking data model files..."
for model in message node conversation_tree; do
    if [ -f "data/models/${model}.json" ]; then
        echo "  ✓ data/models/${model}.json exists"
    else
        echo "  ✗ data/models/${model}.json missing"
        exit 1
    fi
done
echo

# Test 5: Verify JSON utilities can be sourced
echo "✓ Testing JSON utilities..."
source src/lib/json_utils.sh
echo "  ✓ json_utils.sh sourced successfully"

# Test UUID generation
uuid=$(generate_uuid)
if [[ $uuid =~ ^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$ ]]; then
    echo "  ✓ UUID generation works: $uuid"
else
    echo "  ✗ UUID generation failed"
    exit 1
fi

# Test timestamp generation
timestamp=$(get_timestamp)
echo "  ✓ Timestamp generation works: $timestamp"

# Test message creation
message=$(create_message "user" "Hello, world!")
if echo "$message" | jq -e '.id and .role and .content and .timestamp' > /dev/null 2>&1; then
    echo "  ✓ Message creation works"
else
    echo "  ✗ Message creation failed"
    exit 1
fi

# Test empty tree creation
tree=$(create_empty_tree "Test Conversation" "llama2")
if echo "$tree" | jq -e '.nodes and .metadata' > /dev/null 2>&1; then
    echo "  ✓ Empty tree creation works"
else
    echo "  ✗ Empty tree creation failed"
    exit 1
fi
echo

# Test 6: Verify logger can be sourced
echo "✓ Testing logger..."
source src/lib/logger.sh
echo "  ✓ logger.sh sourced successfully"
log_info "Test log message"
echo "  ✓ Logging works"
echo

# Test 7: Verify theme JSON files are valid
echo "✓ Validating theme JSON files..."
for theme_file in themes/*.json; do
    if jq empty "$theme_file" 2>/dev/null; then
        echo "  ✓ $(basename "$theme_file") is valid JSON"
    else
        echo "  ✗ $(basename "$theme_file") is invalid JSON"
        exit 1
    fi
done
echo

# Test 8: Verify data model JSON files are valid
echo "✓ Validating data model JSON files..."
for model_file in data/models/*.json; do
    if jq empty "$model_file" 2>/dev/null; then
        echo "  ✓ $(basename "$model_file") is valid JSON"
    else
        echo "  ✗ $(basename "$model_file") is invalid JSON"
        exit 1
    fi
done
echo

echo "========================================="
echo "All setup tests passed! ✓"
echo "========================================="
echo
echo "Project structure is ready for development."
echo "Next steps:"
echo "  1. Implement conversation tree operations (Task 2)"
echo "  2. Implement tree path traversal (Task 3)"
echo "  3. Continue with remaining tasks"
