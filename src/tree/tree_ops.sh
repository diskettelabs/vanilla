#!/usr/bin/env bash
# Conversation tree operations for node management

# Source required utilities
_TREE_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${_TREE_SCRIPT_DIR}/../lib/json_utils.sh"

# Load configuration
CONFIG_FILE="${_TREE_SCRIPT_DIR}/../../config/default.conf"
if [ -f "$CONFIG_FILE" ]; then
    source "$CONFIG_FILE"
fi

# Default max tree size if not set in config
MAX_TREE_SIZE="${MAX_TREE_SIZE:-10000}"

# Validate node ID format (must be valid UUID or alphanumeric string)
# Usage: validate_node_id <node_id>
# Returns: "true" if valid, "false" otherwise
validate_node_id() {
    local node_id="$1"
    
    # Check if empty or null
    if [ -z "$node_id" ] || [ "$node_id" = "null" ]; then
        echo "false"
        return 0
    fi
    
    # Check for valid UUID format (8-4-4-4-12 hex digits) or alphanumeric string
    # Allow UUIDs and simple alphanumeric IDs
    if echo "$node_id" | grep -qE '^[a-zA-Z0-9_-]+$'; then
        echo "true"
        return 0
    else
        echo "false"
        return 0
    fi
}

# Check if tree size is within limits
# Usage: check_tree_size <tree_json>
# Returns: "true" if within limits, "false" if exceeds MAX_TREE_SIZE
check_tree_size() {
    local tree="$1"
    
    if [ -z "$tree" ]; then
        echo "true"
        return 0
    fi
    
    # Count number of nodes in the tree
    local node_count=$(echo "$tree" | jq '.nodes | length')
    
    if [ -z "$node_count" ]; then
        echo "true"
        return 0
    fi
    
    # Check against maximum
    if [ "$node_count" -ge "$MAX_TREE_SIZE" ]; then
        echo "false"
        return 0
    else
        echo "true"
        return 0
    fi
}

# Get current tree size (number of nodes)
# Usage: get_tree_size <tree_json>
# Returns: Number of nodes in the tree
get_tree_size() {
    local tree="$1"
    
    if [ -z "$tree" ]; then
        echo "0"
        return 0
    fi
    
    local node_count=$(echo "$tree" | jq '.nodes | length')
    echo "${node_count:-0}"
}

# Initialize an empty conversation tree with a root node
# Usage: init_tree [title] [model]
# Returns: JSON string of the conversation tree
init_tree() {
    local title="${1:-Untitled Conversation}"
    local model="${2:-llama2}"
    
    # Create empty tree structure
    local tree=$(create_empty_tree "$title" "$model")
    
    echo "$tree"
}

# Add a node to the conversation tree
# Usage: add_node <tree_json> <message_json> <parent_id>
# Returns: JSON object with updated tree and new node ID
add_node() {
    local tree="$1"
    local message_json="$2"
    local parent_id="$3"
    
    # Check tree size limit before adding
    if [ "$(check_tree_size "$tree")" != "true" ]; then
        echo '{"error": "tree size limit exceeded"}' >&2
        return 1
    fi
    
    # Validate parent_id if provided
    if [ -n "$parent_id" ] && [ "$parent_id" != "null" ]; then
        if [ "$(validate_node_id "$parent_id")" != "true" ]; then
            echo '{"error": "invalid parent_id format"}' >&2
            return 1
        fi
        
        # Verify parent node exists
        local parent_node=$(get_node "$tree" "$parent_id")
        if [ "$parent_node" = "null" ]; then
            echo '{"error": "parent node does not exist"}' >&2
            return 1
        fi
    fi
    
    # Generate unique ID for the new node
    local node_id=$(generate_uuid)
    
    # Validate generated node ID
    if [ "$(validate_node_id "$node_id")" != "true" ]; then
        echo '{"error": "failed to generate valid node_id"}' >&2
        return 1
    fi
    
    # Create the node
    local node=$(create_node "$message_json" "$parent_id")
    
    # Update node with the generated ID
    node=$(echo "$node" | jq --arg id "$node_id" '.id = $id')
    
    # Add node to the tree's nodes map
    tree=$(echo "$tree" | jq --argjson node "$node" --arg node_id "$node_id" \
        '.nodes[$node_id] = $node')
    
    # If parent_id is not empty/null, add this node to parent's children array
    if [ -n "$parent_id" ] && [ "$parent_id" != "null" ]; then
        tree=$(echo "$tree" | jq --arg parent_id "$parent_id" --arg node_id "$node_id" \
            '.nodes[$parent_id].children += [$node_id]')
    else
        # This is the root node, set rootId
        tree=$(echo "$tree" | jq --arg node_id "$node_id" '.rootId = $node_id')
    fi
    
    # Update currentNodeId to the new node
    tree=$(echo "$tree" | jq --arg node_id "$node_id" '.currentNodeId = $node_id')
    
    # Update lastModified timestamp
    local timestamp=$(get_timestamp)
    tree=$(echo "$tree" | jq --arg timestamp "$timestamp" \
        '.metadata.lastModified = $timestamp')
    
    # Return both the updated tree and the new node ID
    jq -n \
        --argjson tree "$tree" \
        --arg nodeId "$node_id" \
        '{tree: $tree, nodeId: $nodeId}'
}

# Get a node from the conversation tree by ID
# Usage: get_node <tree_json> <node_id>
# Returns: JSON object of the node, or null if not found
get_node() {
    local tree="$1"
    local node_id="$2"
    
    # Validate node_id format
    if [ "$(validate_node_id "$node_id")" != "true" ]; then
        echo "null"
        return 0
    fi
    
    echo "$tree" | jq --arg node_id "$node_id" '.nodes[$node_id] // null'
}

# Get all children of a node
# Usage: get_children <tree_json> <node_id>
# Returns: JSON array of child node objects
get_children() {
    local tree="$1"
    local node_id="$2"
    
    # Validate node_id format
    if [ "$(validate_node_id "$node_id")" != "true" ]; then
        echo "[]"
        return 0
    fi
    
    # Get the node
    local node=$(get_node "$tree" "$node_id")
    
    if [ "$node" = "null" ]; then
        echo "[]"
        return
    fi
    
    # Get the children IDs
    local child_ids=$(echo "$node" | jq -r '.children[]')
    
    # Build array of child nodes
    local children="[]"
    for child_id in $child_ids; do
        # Validate each child ID
        if [ "$(validate_node_id "$child_id")" != "true" ]; then
            continue
        fi
        
        local child_node=$(get_node "$tree" "$child_id")
        if [ "$child_node" != "null" ]; then
            children=$(echo "$children" | jq --argjson child "$child_node" '. += [$child]')
        fi
    done
    
    echo "$children"
}

# Get the path from root to a specific node
# Usage: get_path <tree_json> <node_id>
# Returns: JSON array of messages in chronological order (root to node)
get_path() {
    local tree="$1"
    local node_id="$2"
    
    # Validate node_id format
    if [ "$(validate_node_id "$node_id")" != "true" ]; then
        echo "[]"
        return 0
    fi
    
    # Handle invalid node ID
    local node=$(get_node "$tree" "$node_id")
    if [ "$node" = "null" ]; then
        echo "[]"
        return
    fi
    
    # Build path by traversing from node to root
    local path="[]"
    local current_id="$node_id"
    local visited_count=0
    local max_depth=1000  # Prevent infinite loops
    
    while [ -n "$current_id" ] && [ "$current_id" != "null" ] && [ $visited_count -lt $max_depth ]; do
        # Validate current node ID
        if [ "$(validate_node_id "$current_id")" != "true" ]; then
            break
        fi
        
        local current_node=$(get_node "$tree" "$current_id")
        
        # If node doesn't exist, break (shouldn't happen in valid tree)
        if [ "$current_node" = "null" ]; then
            break
        fi
        
        # Get the message from the node
        local message=$(echo "$current_node" | jq '.message')
        
        # Prepend message to path (to maintain chronological order)
        path=$(echo "$path" | jq --argjson msg "$message" '[$msg] + .')
        
        # Move to parent
        current_id=$(echo "$current_node" | jq -r '.parentId')
        visited_count=$((visited_count + 1))
    done
    
    echo "$path"
}

# Validate that all parent references point to existing nodes
# Usage: validate_parent_references <tree_json>
# Returns: "true" if valid, "false" otherwise
validate_parent_references() {
    local tree="$1"
    
    # Get all node IDs
    local node_ids=$(echo "$tree" | jq -r '.nodes | keys[]')
    
    # Check each node's parent reference
    for node_id in $node_ids; do
        local node=$(get_node "$tree" "$node_id")
        local parent_id=$(echo "$node" | jq -r '.parentId')
        
        # If parent is not null, verify it exists
        if [ -n "$parent_id" ] && [ "$parent_id" != "null" ]; then
            local parent_node=$(get_node "$tree" "$parent_id")
            if [ "$parent_node" = "null" ]; then
                echo "false"
                return
            fi
        fi
    done
    
    echo "true"
}

# Validate that the tree is acyclic (no circular references)
# Usage: validate_acyclic <tree_json>
# Returns: "true" if acyclic, "false" if cycle detected
validate_acyclic() {
    local tree="$1"
    
    # Get all node IDs
    local node_ids=$(echo "$tree" | jq -r '.nodes | keys[]')
    
    # For each node, traverse to root and check for cycles
    for node_id in $node_ids; do
        local visited=""
        local current_id="$node_id"
        
        # Traverse from node to root
        while [ -n "$current_id" ] && [ "$current_id" != "null" ]; do
            # Check if we've visited this node before (cycle detected)
            if echo "$visited" | grep -q "^${current_id}$"; then
                echo "false"
                return
            fi
            
            # Mark as visited
            visited="${visited}${current_id}"$'\n'
            
            # Get parent
            local node=$(get_node "$tree" "$current_id")
            if [ "$node" = "null" ]; then
                break
            fi
            current_id=$(echo "$node" | jq -r '.parentId')
        done
    done
    
    echo "true"
}

# Validate that exactly one root node exists
# Usage: validate_single_root <tree_json>
# Returns: "true" if exactly one root exists, "false" otherwise
validate_single_root() {
    local tree="$1"
    
    # Get all node IDs
    local node_ids=$(echo "$tree" | jq -r '.nodes | keys[]')
    
    # Count nodes with null parent (root nodes)
    local root_count=0
    for node_id in $node_ids; do
        local node=$(get_node "$tree" "$node_id")
        local parent_id=$(echo "$node" | jq -r '.parentId')
        
        if [ "$parent_id" = "null" ]; then
            root_count=$((root_count + 1))
        fi
    done
    
    # Verify exactly one root
    if [ "$root_count" -eq 1 ]; then
        echo "true"
    else
        echo "false"
    fi
}

# Validate that the current node ID is valid
# Usage: validate_current_node <tree_json>
# Returns: "true" if current node exists or is null, "false" otherwise
validate_current_node() {
    local tree="$1"
    
    local current_id=$(echo "$tree" | jq -r '.currentNodeId')
    
    # If current node is null, it's valid (empty tree)
    if [ "$current_id" = "null" ]; then
        echo "true"
        return
    fi
    
    # Check if current node exists
    local node=$(get_node "$tree" "$current_id")
    if [ "$node" = "null" ]; then
        echo "false"
    else
        echo "true"
    fi
}

# Validate the entire conversation tree
# Usage: validate_tree <tree_json>
# Returns: JSON object with validation results
validate_tree() {
    local tree="$1"
    
    # Run all validation checks
    local valid_parents=$(validate_parent_references "$tree")
    local is_acyclic=$(validate_acyclic "$tree")
    local single_root=$(validate_single_root "$tree")
    local valid_current=$(validate_current_node "$tree")
    
    # Determine overall validity
    local is_valid="true"
    if [ "$valid_parents" != "true" ] || [ "$is_acyclic" != "true" ] || \
       [ "$single_root" != "true" ] || [ "$valid_current" != "true" ]; then
        is_valid="false"
    fi
    
    # Return validation results as JSON
    jq -n \
        --arg is_valid "$is_valid" \
        --arg valid_parents "$valid_parents" \
        --arg is_acyclic "$is_acyclic" \
        --arg single_root "$single_root" \
        --arg valid_current "$valid_current" \
        '{
            isValid: ($is_valid == "true"),
            validParentReferences: ($valid_parents == "true"),
            isAcyclic: ($is_acyclic == "true"),
            hasSingleRoot: ($single_root == "true"),
            validCurrentNode: ($valid_current == "true")
        }'
}

# Save conversation tree to a JSON file
# Usage: save <tree_json> <filepath>
# Returns: "success" or "error" message
save() {
    local tree="$1"
    local filepath="$2"
    
    # Validate inputs
    if [ -z "$tree" ]; then
        echo "error: tree is empty"
        return 1
    fi
    
    if [ -z "$filepath" ]; then
        echo "error: filepath is empty"
        return 1
    fi
    
    # Validate JSON structure
    if ! validate_json "$tree"; then
        echo "error: invalid JSON structure"
        return 1
    fi
    
    # Create directory if it doesn't exist
    local dir=$(dirname "$filepath")
    if [ ! -d "$dir" ]; then
        mkdir -p "$dir" || {
            echo "error: failed to create directory $dir"
            return 1
        }
    fi
    
    # Write JSON to file
    echo "$tree" | jq '.' > "$filepath" || {
        echo "error: failed to write to file $filepath"
        return 1
    }
    
    # Set file permissions to 600 (user-only read/write)
    chmod 600 "$filepath" || {
        echo "error: failed to set file permissions"
        return 1
    }
    
    echo "success"
    return 0
}

# Load conversation tree from a JSON file
# Usage: load <filepath>
# Returns: JSON string of the conversation tree, or error message
load() {
    local filepath="$1"
    
    # Validate input
    if [ -z "$filepath" ]; then
        echo "error: filepath is empty"
        return 1
    fi
    
    # Check if file exists
    if [ ! -f "$filepath" ]; then
        echo "error: file does not exist: $filepath"
        return 1
    fi
    
    # Check if file is readable
    if [ ! -r "$filepath" ]; then
        echo "error: file is not readable: $filepath"
        return 1
    fi
    
    # Read and validate JSON
    local tree=$(cat "$filepath")
    
    if [ -z "$tree" ]; then
        # File is empty - create backup and return error
        local backup_path="${filepath}.corrupted.$(date +%Y%m%d_%H%M%S)"
        cp "$filepath" "$backup_path" 2>/dev/null
        echo "error: file is empty (backup created at $backup_path)"
        return 1
    fi
    
    # Validate JSON structure
    if ! validate_json "$tree"; then
        # Invalid JSON - create backup and return error
        local backup_path="${filepath}.corrupted.$(date +%Y%m%d_%H%M%S)"
        cp "$filepath" "$backup_path" 2>/dev/null
        echo "error: invalid JSON in file (backup created at $backup_path)"
        return 1
    fi
    
    # Validate tree structure
    local validation=$(validate_tree "$tree")
    local is_valid=$(echo "$validation" | jq -r '.isValid')
    
    if [ "$is_valid" != "true" ]; then
        # Tree is corrupted - create backup and return error
        local backup_path="${filepath}.corrupted.$(date +%Y%m%d_%H%M%S)"
        cp "$filepath" "$backup_path" 2>/dev/null
        echo "error: invalid tree structure (backup created at $backup_path)"
        return 1
    fi
    
    # Return the tree
    echo "$tree"
    return 0
}

# Attempt to salvage valid nodes from a corrupted tree
# Usage: salvage_tree <tree_json>
# Returns: Salvaged tree JSON or error message
salvage_tree() {
    local tree="$1"
    
    if [ -z "$tree" ]; then
        echo "error: tree is empty"
        return 1
    fi
    
    # Try to extract nodes map
    local nodes=$(echo "$tree" | jq -r '.nodes // {}' 2>/dev/null)
    
    if [ -z "$nodes" ] || [ "$nodes" = "{}" ]; then
        echo "error: no nodes found to salvage"
        return 1
    fi
    
    # Find a valid root node (node with null parent)
    local root_id=$(echo "$tree" | jq -r '
        .nodes | to_entries[] | 
        select(.value.parentId == null) | 
        .key' 2>/dev/null | head -n 1)
    
    if [ -z "$root_id" ] || [ "$root_id" = "null" ]; then
        echo "error: no valid root node found"
        return 1
    fi
    
    # Build a new tree with only reachable nodes from root
    local salvaged_tree=$(echo "$tree" | jq \
        --arg root_id "$root_id" \
        '{
            nodes: .nodes,
            rootId: $root_id,
            currentNodeId: $root_id,
            metadata: (.metadata // {
                createdAt: (now | todate),
                lastModified: (now | todate),
                title: "Salvaged Conversation",
                model: "llama2"
            })
        }')
    
    # Validate the salvaged tree
    local validation=$(validate_tree "$salvaged_tree")
    local is_valid=$(echo "$validation" | jq -r '.isValid')
    
    if [ "$is_valid" = "true" ]; then
        echo "$salvaged_tree"
        return 0
    else
        echo "error: salvaged tree is still invalid"
        return 1
    fi
}

# Validate role alternation in a conversation path
# Usage: validate_role_alternation <tree_json> <node_id>
# Returns: "true" if roles alternate correctly, "false" otherwise
validate_role_alternation() {
    local tree="$1"
    local node_id="$2"
    
    if [ -z "$tree" ] || [ -z "$node_id" ]; then
        echo "false"
        return 0
    fi
    
    # Get the node
    local node=$(get_node "$tree" "$node_id")
    if [ "$node" = "null" ]; then
        echo "false"
        return 0
    fi
    
    # Get parent ID
    local parent_id=$(echo "$node" | jq -r '.parentId')
    
    # If this is root node (no parent), it should be user or system message
    if [ "$parent_id" = "null" ] || [ -z "$parent_id" ]; then
        local role=$(echo "$node" | jq -r '.message.role')
        if [ "$role" = "user" ] || [ "$role" = "system" ]; then
            echo "true"
            return 0
        else
            echo "false"
            return 0
        fi
    fi
    
    # Get parent node
    local parent_node=$(get_node "$tree" "$parent_id")
    if [ "$parent_node" = "null" ]; then
        echo "false"
        return 0
    fi
    
    # Get roles
    local node_role=$(echo "$node" | jq -r '.message.role')
    local parent_role=$(echo "$parent_node" | jq -r '.message.role')
    
    # Roles must differ
    if [ "$node_role" != "$parent_role" ]; then
        echo "true"
        return 0
    else
        echo "false"
        return 0
    fi
}

# Validate role alternation for entire tree
# Usage: validate_tree_role_alternation <tree_json>
# Returns: "true" if all paths have correct role alternation, "false" otherwise
validate_tree_role_alternation() {
    local tree="$1"
    
    if [ -z "$tree" ]; then
        echo "false"
        return 0
    fi
    
    # Get all node IDs
    local node_ids=$(echo "$tree" | jq -r '.nodes | keys[]')
    
    # Check each node for role alternation
    for node_id in $node_ids; do
        local is_valid=$(validate_role_alternation "$tree" "$node_id")
        if [ "$is_valid" != "true" ]; then
            echo "false"
            return 0
        fi
    done
    
    echo "true"
    return 0
}

# Alias for backward compatibility
create_tree() {
    init_tree "$@"
}

# Alias for save function
save_tree() {
    save "$@"
}

# Alias for load function
load_tree() {
    load "$@"
}
