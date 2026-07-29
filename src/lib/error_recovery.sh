#!/usr/bin/env bash
# Error recovery utilities for handling various failure scenarios

# Source required utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/json_utils.sh"

# Check if a message is marked as incomplete
# Usage: is_incomplete_message <tree_json> <node_id>
# Returns: "true" if incomplete, "false" otherwise
is_incomplete_message() {
    local tree="$1"
    local node_id="$2"
    
    if [ -z "$tree" ] || [ -z "$node_id" ]; then
        echo "false"
        return 0
    fi
    
    local incomplete=$(echo "$tree" | jq -r \
        --arg node_id "$node_id" \
        '.nodes[$node_id].message.incomplete // false')
    
    echo "$incomplete"
}

# Get all incomplete messages in a tree
# Usage: get_incomplete_messages <tree_json>
# Returns: JSON array of incomplete message node IDs
get_incomplete_messages() {
    local tree="$1"
    
    if [ -z "$tree" ]; then
        echo "[]"
        return 0
    fi
    
    local incomplete_ids=$(echo "$tree" | jq -r '
        [.nodes | to_entries[] | 
         select(.value.message.incomplete == true) | 
         .key]')
    
    echo "$incomplete_ids"
}

# Mark a message as complete
# Usage: mark_message_complete <tree_json> <node_id>
# Returns: Updated tree JSON
mark_message_complete() {
    local tree="$1"
    local node_id="$2"
    
    if [ -z "$tree" ] || [ -z "$node_id" ]; then
        echo "$tree"
        return 1
    fi
    
    tree=$(echo "$tree" | jq \
        --arg node_id "$node_id" \
        '.nodes[$node_id].message.incomplete = false')
    
    echo "$tree"
}

# Prepare a message for retry by clearing content and incomplete flag
# Usage: prepare_retry <tree_json> <node_id>
# Returns: Updated tree JSON with cleared content
prepare_retry() {
    local tree="$1"
    local node_id="$2"
    
    if [ -z "$tree" ] || [ -z "$node_id" ]; then
        echo '{"error": "tree and node_id are required"}' >&2
        return 1
    fi
    
    # Get the node
    local node=$(echo "$tree" | jq -r \
        --arg node_id "$node_id" \
        '.nodes[$node_id]')
    
    if [ "$node" = "null" ]; then
        echo '{"error": "node not found"}' >&2
        return 1
    fi
    
    # Verify it's an assistant message
    local role=$(echo "$node" | jq -r '.message.role')
    if [ "$role" != "assistant" ]; then
        echo '{"error": "can only retry assistant messages"}' >&2
        return 1
    fi
    
    # Clear the incomplete flag and content
    tree=$(echo "$tree" | jq \
        --arg node_id "$node_id" \
        '.nodes[$node_id].message.content = "" |
         .nodes[$node_id].message.incomplete = false')
    
    echo "$tree"
    return 0
}

# Load conversation with corruption handling
# Usage: load_with_recovery <filepath>
# Returns: JSON object with tree or recovery information
load_with_recovery() {
    local filepath="$1"
    
    if [ -z "$filepath" ]; then
        echo '{"error": "filepath is required", "success": false}'
        return 1
    fi
    
    # Check if file exists
    if [ ! -f "$filepath" ]; then
        echo '{"error": "file does not exist", "success": false}'
        return 1
    fi
    
    # Check if file is readable
    if [ ! -r "$filepath" ]; then
        echo '{"error": "file is not readable", "success": false}'
        return 1
    fi
    
    # Read file content
    local tree=$(cat "$filepath" 2>/dev/null)
    
    if [ -z "$tree" ]; then
        # File is empty - handle corruption
        local recovery_result=$(handle_tree_corruption "$filepath")
        echo "$recovery_result" | jq '. + {success: false, needsRecovery: true}'
        return 1
    fi
    
    # Validate JSON structure
    if ! validate_json "$tree" 2>/dev/null; then
        # Invalid JSON - handle corruption
        local recovery_result=$(handle_tree_corruption "$filepath")
        echo "$recovery_result" | jq '. + {success: false, needsRecovery: true}'
        return 1
    fi
    
    # Try to repair minor issues first
    local repaired_tree=$(validate_and_repair_tree "$tree" 2>/dev/null)
    if [ $? -eq 0 ] && [ -n "$repaired_tree" ] && ! echo "$repaired_tree" | grep -q "^error:"; then
        # Repair succeeded - validate the repaired tree
        local validation=$(validate_tree "$repaired_tree" 2>/dev/null)
        local is_valid=$(echo "$validation" | jq -r '.isValid')
        
        if [ "$is_valid" = "true" ]; then
            # Repaired tree is valid - return it
            jq -n \
                --argjson tree "$repaired_tree" \
                '{
                    success: true,
                    needsRecovery: false,
                    tree: $tree,
                    wasRepaired: true
                }'
            return 0
        fi
    fi
    
    # Validate tree structure (repair didn't work or wasn't needed)
    local validation=$(validate_tree "$tree" 2>/dev/null)
    local is_valid=$(echo "$validation" | jq -r '.isValid')
    
    if [ "$is_valid" != "true" ]; then
        # Tree structure is invalid - handle corruption
        local recovery_result=$(handle_tree_corruption "$filepath")
        echo "$recovery_result" | jq '. + {success: false, needsRecovery: true}'
        return 1
    fi
    
    # Tree is valid - return it
    jq -n \
        --argjson tree "$tree" \
        '{
            success: true,
            needsRecovery: false,
            tree: $tree
        }'
    return 0
}

# Legacy alias for backward compatibility
retry_message() {
    prepare_retry "$@"
}

# Handle Ollama connection error with user-friendly message
# Usage: handle_connection_error
# Returns: Error message string
handle_connection_error() {
    cat <<EOF
╔════════════════════════════════════════════════════════════════╗
║                   Ollama Connection Error                      ║
╔════════════════════════════════════════════════════════════════╝

Cannot connect to Ollama service.

Possible solutions:
  1. Check if Ollama is running: ollama serve
  2. Verify Ollama is installed: ollama --version
  3. Check if port 11434 is accessible

The application will retry connection every 5 seconds.
You can continue editing messages offline.

Your messages are being saved automatically.

╚════════════════════════════════════════════════════════════════╝
EOF
}

# Display connection retry status
# Usage: display_retry_status <attempt> <max_attempts>
# Returns: Status message string
display_retry_status() {
    local attempt="${1:-1}"
    local max_attempts="${2:-3}"
    
    echo "⟳ Attempting to connect to Ollama... (attempt $attempt/$max_attempts)"
}

# Display offline mode message
# Usage: display_offline_mode
# Returns: Status message string
display_offline_mode() {
    cat <<EOF
⚠ Offline Mode: Ollama service is unreachable
  • Your messages are being saved
  • Connection will be retried automatically
  • You can continue editing
EOF
}

# Handle streaming interruption
# Usage: handle_stream_interruption <tree_json> <node_id> <partial_content>
# Returns: Updated tree JSON with partial content saved
handle_stream_interruption() {
    local tree="$1"
    local node_id="$2"
    local partial_content="$3"
    
    if [ -z "$tree" ] || [ -z "$node_id" ]; then
        echo "$tree"
        return 1
    fi
    
    # Save partial content and mark as incomplete
    tree=$(echo "$tree" | jq \
        --arg node_id "$node_id" \
        --arg content "$partial_content" \
        '.nodes[$node_id].message.content = $content |
         .nodes[$node_id].message.incomplete = true')
    
    echo "$tree"
}

# Handle tree corruption with recovery options
# Usage: handle_tree_corruption <filepath>
# Returns: JSON object with recovery status and options
handle_tree_corruption() {
    local filepath="$1"
    
    if [ -z "$filepath" ]; then
        echo '{"error": "filepath is required", "canRecover": false}'
        return 1
    fi
    
    # Check if file exists
    if [ ! -f "$filepath" ]; then
        echo '{"error": "file does not exist", "canRecover": false}'
        return 1
    fi
    
    # Create backup
    local backup_path="${filepath}.corrupted.$(date +%Y%m%d_%H%M%S)"
    local backup_created="false"
    if cp "$filepath" "$backup_path" 2>/dev/null; then
        backup_created="true"
    fi
    
    # Try to read the file
    local tree=$(cat "$filepath" 2>/dev/null)
    
    if [ -z "$tree" ]; then
        jq -n \
            --arg backup "$backup_path" \
            --arg backup_created "$backup_created" \
            '{
                error: "file is empty or unreadable",
                backupPath: $backup,
                backupCreated: ($backup_created == "true"),
                canRecover: false,
                options: ["create_new"]
            }'
        return 1
    fi
    
    # Validate JSON structure
    if ! validate_json "$tree" 2>/dev/null; then
        jq -n \
            --arg backup "$backup_path" \
            --arg backup_created "$backup_created" \
            '{
                error: "invalid JSON structure",
                backupPath: $backup,
                backupCreated: ($backup_created == "true"),
                canRecover: false,
                options: ["create_new"]
            }'
        return 1
    fi
    
    # Try to salvage valid nodes
    local salvaged=$(salvage_tree "$tree" 2>/dev/null)
    local salvage_success="false"
    
    if [ $? -eq 0 ] && ! echo "$salvaged" | grep -q "^error:"; then
        # Salvage succeeded
        salvage_success="true"
        
        # Count salvaged nodes
        local node_count=$(echo "$salvaged" | jq '.nodes | length')
        
        jq -n \
            --arg backup "$backup_path" \
            --arg backup_created "$backup_created" \
            --argjson salvaged "$salvaged" \
            --arg node_count "$node_count" \
            '{
                error: null,
                backupPath: $backup,
                backupCreated: ($backup_created == "true"),
                canRecover: true,
                salvagedTree: $salvaged,
                salvagedNodeCount: ($node_count | tonumber),
                options: ["use_salvaged", "create_new"]
            }'
        return 0
    else
        # Salvage failed
        jq -n \
            --arg backup "$backup_path" \
            --arg backup_created "$backup_created" \
            --arg salvage_error "$salvaged" \
            '{
                error: "could not salvage valid nodes",
                salvageError: $salvage_error,
                backupPath: $backup,
                backupCreated: ($backup_created == "true"),
                canRecover: false,
                options: ["create_new"]
            }'
        return 1
    fi
}

# Display corruption error message to user
# Usage: display_corruption_message <recovery_result_json>
# Returns: Formatted error message string
display_corruption_message() {
    local recovery_result="$1"
    
    if [ -z "$recovery_result" ]; then
        echo "Error: No recovery information available"
        return 1
    fi
    
    local can_recover=$(echo "$recovery_result" | jq -r '.canRecover')
    local backup_path=$(echo "$recovery_result" | jq -r '.backupPath')
    local backup_created=$(echo "$recovery_result" | jq -r '.backupCreated')
    local error_msg=$(echo "$recovery_result" | jq -r '.error // "unknown error"')
    
    cat <<EOF
╔════════════════════════════════════════════════════════════════╗
║              Conversation File Corrupted                       ║
╔════════════════════════════════════════════════════════════════╝

Error: $error_msg

EOF
    
    if [ "$backup_created" = "true" ]; then
        echo "✓ Backup created at: $backup_path"
        echo ""
    fi
    
    if [ "$can_recover" = "true" ]; then
        local node_count=$(echo "$recovery_result" | jq -r '.salvagedNodeCount // 0')
        cat <<EOF
✓ Salvaged $node_count message(s) from corrupted file

Recovery options:
  1. Use salvaged conversation (may be incomplete)
  2. Create new conversation
  3. Manually restore from backup

EOF
    else
        cat <<EOF
✗ Could not salvage any messages from corrupted file

Recovery options:
  1. Create new conversation
  2. Manually restore from backup

EOF
    fi
    
    echo "╚════════════════════════════════════════════════════════════════╝"
}

# Validate and repair tree if possible
# Usage: validate_and_repair_tree <tree_json>
# Returns: Repaired tree JSON or error
validate_and_repair_tree() {
    local tree="$1"
    
    if [ -z "$tree" ]; then
        echo "error: tree is empty"
        return 1
    fi
    
    # Check if tree has required fields
    local has_nodes=$(echo "$tree" | jq -e '.nodes' >/dev/null 2>&1 && echo "true" || echo "false")
    local has_root=$(echo "$tree" | jq -e '.rootId' >/dev/null 2>&1 && echo "true" || echo "false")
    
    if [ "$has_nodes" != "true" ]; then
        echo "error: tree missing nodes field"
        return 1
    fi
    
    if [ "$has_root" != "true" ]; then
        # Try to find a root node
        local root_id=$(echo "$tree" | jq -r '
            .nodes | to_entries[] | 
            select(.value.parentId == null) | 
            .key' 2>/dev/null | head -n 1)
        
        if [ -n "$root_id" ] && [ "$root_id" != "null" ]; then
            tree=$(echo "$tree" | jq --arg root_id "$root_id" '.rootId = $root_id')
        else
            echo "error: cannot find root node"
            return 1
        fi
    fi
    
    # Ensure currentNodeId is set
    local has_current=$(echo "$tree" | jq -e '.currentNodeId' >/dev/null 2>&1 && echo "true" || echo "false")
    if [ "$has_current" != "true" ]; then
        local root_id=$(echo "$tree" | jq -r '.rootId')
        tree=$(echo "$tree" | jq --arg root_id "$root_id" '.currentNodeId = $root_id')
    fi
    
    # Ensure metadata exists
    local has_metadata=$(echo "$tree" | jq -e '.metadata' >/dev/null 2>&1 && echo "true" || echo "false")
    if [ "$has_metadata" != "true" ]; then
        tree=$(echo "$tree" | jq '.metadata = {
            createdAt: (now | todate),
            lastModified: (now | todate),
            title: "Recovered Conversation",
            model: "llama2"
        }')
    fi
    
    echo "$tree"
    return 0
}
