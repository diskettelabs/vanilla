#!/usr/bin/env bash
# Chat manager for orchestrating conversation flow

# Source required utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/../lib/json_utils.sh"
source "${SCRIPT_DIR}/../tree/tree_ops.sh"
source "${SCRIPT_DIR}/../tree/auto_save.sh"
source "${SCRIPT_DIR}/../ollama/ollama_client.sh"

# Global state for streaming
STREAMING_NODE_ID=""
STREAMING_TREE=""
STREAMING_CONTENT=""

# Token callback function for streaming responses
# Usage: stream_token_callback <token> <done>
stream_token_callback() {
    local token="$1"
    local done="$2"
    
    if [ "$done" = "true" ]; then
        # Streaming complete - update the node with final content
        if [ -n "$STREAMING_NODE_ID" ] && [ -n "$STREAMING_TREE" ]; then
            # Update the assistant message node with complete content
            STREAMING_TREE=$(echo "$STREAMING_TREE" | jq \
                --arg node_id "$STREAMING_NODE_ID" \
                --arg content "$STREAMING_CONTENT" \
                '.nodes[$node_id].message.content = $content')
        fi
        return 0
    fi
    
    # Accumulate token
    STREAMING_CONTENT="${STREAMING_CONTENT}${token}"
    
    # Display token immediately (write to stdout for <50ms latency)
    printf "%s" "$token"
}

# Send a message and get AI response
# Usage: send_message <tree_json> <text> <model> <save_path>
# Returns: JSON object with updated tree
send_message() {
    local tree="$1"
    local text="$2"
    local model="${3:-llama2}"
    local save_path="$4"
    
    # Validate inputs
    if [ -z "$tree" ]; then
        echo '{"error": "tree is required"}' >&2
        return 1
    fi
    
    if [ -z "$text" ]; then
        echo '{"error": "text is required"}' >&2
        return 1
    fi
    
    # Sanitize user input
    text=$(sanitize_input "$text")
    
    if [ -z "$text" ]; then
        echo '{"error": "text is empty after sanitization"}' >&2
        return 1
    fi
    
    # Check Ollama connection with retry logic
    if [ "$(check_connection_with_retry)" != "true" ]; then
        # Connection failed - save user message but don't attempt streaming
        # This allows offline editing
        
        # Get current node ID
        local current_node_id=$(echo "$tree" | jq -r '.currentNodeId')
        
        # Validate role alternation
        if [ -n "$current_node_id" ] && [ "$current_node_id" != "null" ]; then
            local current_node=$(get_node "$tree" "$current_node_id")
            local current_role=$(echo "$current_node" | jq -r '.message.role')
            
            if [ "$current_role" = "user" ]; then
                echo '{"error": "cannot add user message after user message - role alternation violated"}' >&2
                return 1
            fi
        fi
        
        # Create and save user message
        local user_message=$(create_message "user" "$text" "")
        local add_result=$(add_node "$tree" "$user_message" "$current_node_id")
        tree=$(echo "$add_result" | jq -r '.tree')
        
        # Save tree if path provided
        if [ -n "$save_path" ]; then
            save_after_message "$tree" "$save_path" >/dev/null 2>&1
        fi
        
        # Return error with updated tree containing user message
        echo '{"error": "connection_failed", "tree": '"$tree"', "message": "Cannot connect to Ollama service. Your message has been saved. The application will retry connection automatically."}' >&2
        return 1
    fi
    
    # Get current node ID
    local current_node_id=$(echo "$tree" | jq -r '.currentNodeId')
    
    # Validate that we can add a user message here (role alternation check)
    if [ -n "$current_node_id" ] && [ "$current_node_id" != "null" ]; then
        local current_node=$(get_node "$tree" "$current_node_id")
        local current_role=$(echo "$current_node" | jq -r '.message.role')
        
        # Current node should be assistant or system, not user
        if [ "$current_role" = "user" ]; then
            echo '{"error": "cannot add user message after user message - role alternation violated"}' >&2
            return 1
        fi
    fi
    
    # Create user message
    local user_message=$(create_message "user" "$text" "")
    
    # Add user message node to tree
    local add_result=$(add_node "$tree" "$user_message" "$current_node_id")
    tree=$(echo "$add_result" | jq -r '.tree')
    local user_node_id=$(echo "$add_result" | jq -r '.nodeId')
    
    # Validate role alternation after adding user message
    if [ "$(validate_role_alternation "$tree" "$user_node_id")" != "true" ]; then
        echo '{"error": "role alternation validation failed after adding user message"}' >&2
        return 1
    fi
    
    # Get conversation history (path from root to current node)
    local messages=$(get_path "$tree" "$user_node_id")
    
    # Create empty assistant message node
    local assistant_message=$(create_message "assistant" "" "$model")
    
    # Add assistant message node to tree
    add_result=$(add_node "$tree" "$assistant_message" "$user_node_id")
    tree=$(echo "$add_result" | jq -r '.tree')
    local assistant_node_id=$(echo "$add_result" | jq -r '.nodeId')
    
    # Validate role alternation after adding assistant message
    if [ "$(validate_role_alternation "$tree" "$assistant_node_id")" != "true" ]; then
        echo '{"error": "role alternation validation failed after adding assistant message"}' >&2
        return 1
    fi
    
    # Set up streaming state
    STREAMING_NODE_ID="$assistant_node_id"
    STREAMING_TREE="$tree"
    STREAMING_CONTENT=""
    
    # Start streaming completion
    stream_completion "$messages" "$model" "stream_token_callback"
    local stream_exit_code=$?
    
    # Get updated tree from streaming state
    tree="$STREAMING_TREE"
    
    # Handle streaming interruption - save partial response
    if [ $stream_exit_code -ne 0 ]; then
        # Mark message as incomplete if we have partial content
        if [ -n "$STREAMING_CONTENT" ]; then
            tree=$(echo "$tree" | jq \
                --arg node_id "$assistant_node_id" \
                '.nodes[$node_id].message.incomplete = true')
            
            # Save tree with partial response
            if [ -n "$save_path" ]; then
                save_after_message "$tree" "$save_path" >/dev/null 2>&1
            fi
        fi
        
        # Clear streaming state
        STREAMING_NODE_ID=""
        STREAMING_TREE=""
        STREAMING_CONTENT=""
        
        echo "$tree"
        return 1
    fi
    
    # Clear streaming state
    STREAMING_NODE_ID=""
    STREAMING_TREE=""
    STREAMING_CONTENT=""
    
    # Trigger auto-save after completion
    if [ -n "$save_path" ]; then
        save_after_message "$tree" "$save_path" >/dev/null 2>&1
    fi
    
    # Return updated tree
    echo "$tree"
    return 0
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

# Get current messages (active path from root to current node)
# Usage: get_current_messages <tree_json>
# Returns: JSON array of messages in chronological order
get_current_messages() {
    local tree="$1"
    
    if [ -z "$tree" ]; then
        echo "[]"
        return 1
    fi
    
    local current_node_id=$(echo "$tree" | jq -r '.currentNodeId')
    
    if [ "$current_node_id" = "null" ] || [ -z "$current_node_id" ]; then
        echo "[]"
        return 0
    fi
    
    # Get path from root to current node
    get_path "$tree" "$current_node_id"
}

# Mark a path as inactive (from node to all descendants)
# Usage: deactivate_path <tree_json> <node_id>
# Returns: Updated tree JSON
deactivate_path() {
    local tree="$1"
    local node_id="$2"
    
    if [ -z "$tree" ] || [ -z "$node_id" ]; then
        echo "$tree"
        return 1
    fi
    
    # Mark the node as inactive
    tree=$(echo "$tree" | jq --arg node_id "$node_id" \
        '.nodes[$node_id].isActive = false')
    
    # Recursively mark all descendants as inactive
    local children=$(echo "$tree" | jq -r --arg node_id "$node_id" \
        '.nodes[$node_id].children[]? // empty')
    
    for child_id in $children; do
        tree=$(deactivate_path "$tree" "$child_id")
    done
    
    echo "$tree"
}

# Mark a path as active (from root to node)
# Usage: activate_path <tree_json> <node_id>
# Returns: Updated tree JSON
activate_path() {
    local tree="$1"
    local node_id="$2"
    
    if [ -z "$tree" ] || [ -z "$node_id" ]; then
        echo "$tree"
        return 1
    fi
    
    # Build path from node to root
    local path_ids=()
    local current_id="$node_id"
    
    while [ -n "$current_id" ] && [ "$current_id" != "null" ]; do
        path_ids+=("$current_id")
        current_id=$(echo "$tree" | jq -r --arg id "$current_id" \
            '.nodes[$id].parentId // null')
    done
    
    # Mark all nodes in path as active
    for id in "${path_ids[@]}"; do
        tree=$(echo "$tree" | jq --arg id "$id" \
            '.nodes[$id].isActive = true')
    done
    
    echo "$tree"
}

# Create a branch from a message by editing it
# Usage: create_branch <tree_json> <node_id> <new_text> <model> <save_path>
# Returns: Updated tree JSON
create_branch() {
    local tree="$1"
    local node_id="$2"
    local new_text="$3"
    local model="${4:-llama2}"
    local save_path="$5"
    
    # Validate inputs
    if [ -z "$tree" ]; then
        echo '{"error": "tree is required"}' >&2
        return 1
    fi
    
    if [ -z "$node_id" ]; then
        echo '{"error": "node_id is required"}' >&2
        return 1
    fi
    
    if [ -z "$new_text" ]; then
        echo '{"error": "new_text is required"}' >&2
        return 1
    fi
    
    # Get the node to branch from
    local original_node=$(get_node "$tree" "$node_id")
    
    if [ "$original_node" = "null" ]; then
        echo '{"error": "node not found"}' >&2
        return 1
    fi
    
    # Verify it's a user message
    local role=$(echo "$original_node" | jq -r '.message.role')
    if [ "$role" != "user" ]; then
        echo '{"error": "can only edit user messages"}' >&2
        return 1
    fi
    
    # Get parent ID
    local parent_id=$(echo "$original_node" | jq -r '.parentId')
    
    # Sanitize new text
    new_text=$(sanitize_input "$new_text")
    
    if [ -z "$new_text" ]; then
        echo '{"error": "new_text is empty after sanitization"}' >&2
        return 1
    fi
    
    # Create new message with edited content
    local edited_message=$(create_message "user" "$new_text" "")
    
    # Add as sibling to original node (same parent)
    local add_result=$(add_node "$tree" "$edited_message" "$parent_id")
    tree=$(echo "$add_result" | jq -r '.tree')
    local new_node_id=$(echo "$add_result" | jq -r '.nodeId')
    
    # Validate role alternation for the new branch node
    if [ "$(validate_role_alternation "$tree" "$new_node_id")" != "true" ]; then
        echo '{"error": "role alternation validation failed for branch node"}' >&2
        return 1
    fi
    
    # Mark original path as inactive (from original node onwards)
    tree=$(deactivate_path "$tree" "$node_id")
    
    # Mark new branch as active (from root to new node)
    tree=$(activate_path "$tree" "$new_node_id")
    
    # Get conversation history up to branch point
    local messages=$(get_path "$tree" "$new_node_id")
    
    # Create empty assistant message node
    local assistant_message=$(create_message "assistant" "" "$model")
    
    # Add assistant message node to tree
    add_result=$(add_node "$tree" "$assistant_message" "$new_node_id")
    tree=$(echo "$add_result" | jq -r '.tree')
    local assistant_node_id=$(echo "$add_result" | jq -r '.nodeId')
    
    # Validate role alternation for the assistant message
    if [ "$(validate_role_alternation "$tree" "$assistant_node_id")" != "true" ]; then
        echo '{"error": "role alternation validation failed for assistant message in branch"}' >&2
        return 1
    fi
    
    # Check Ollama connection with retry logic before streaming
    if [ "$(check_connection_with_retry)" != "true" ]; then
        # Connection failed - save branch but don't attempt streaming
        # This allows offline editing
        
        # Save tree if path provided
        if [ -n "$save_path" ]; then
            save_after_message "$tree" "$save_path" >/dev/null 2>&1
        fi
        
        # Return error with updated tree containing branch
        echo '{"error": "connection_failed", "tree": '"$tree"', "message": "Cannot connect to Ollama service. Your branch has been saved. The application will retry connection automatically."}' >&2
        return 1
    fi
    
    # Set up streaming state
    STREAMING_NODE_ID="$assistant_node_id"
    STREAMING_TREE="$tree"
    STREAMING_CONTENT=""
    
    # Start streaming completion
    stream_completion "$messages" "$model" "stream_token_callback"
    local stream_exit_code=$?
    
    # Get updated tree from streaming state
    tree="$STREAMING_TREE"
    
    # Handle streaming interruption - save partial response
    if [ $stream_exit_code -ne 0 ]; then
        # Mark message as incomplete if we have partial content
        if [ -n "$STREAMING_CONTENT" ]; then
            tree=$(echo "$tree" | jq \
                --arg node_id "$assistant_node_id" \
                '.nodes[$node_id].message.incomplete = true')
            
            # Save tree with partial response
            if [ -n "$save_path" ]; then
                save_after_message "$tree" "$save_path" >/dev/null 2>&1
            fi
        fi
        
        # Clear streaming state
        STREAMING_NODE_ID=""
        STREAMING_TREE=""
        STREAMING_CONTENT=""
        
        echo "$tree"
        return 1
    fi
    
    # Clear streaming state
    STREAMING_NODE_ID=""
    STREAMING_TREE=""
    STREAMING_CONTENT=""
    
    # Trigger auto-save after completion
    if [ -n "$save_path" ]; then
        save_after_message "$tree" "$save_path" >/dev/null 2>&1
    fi
    
    # Return updated tree
    echo "$tree"
    return 0
}

# Edit a message and create a new branch
# Usage: edit_message <tree_json> <node_id> <editor_command> <model> <save_path>
# Returns: Updated tree JSON
edit_message() {
    local tree="$1"
    local node_id="$2"
    local editor_command="${3:-${EDITOR:-vi}}"
    local model="${4:-llama2}"
    local save_path="$5"
    
    # Validate inputs
    if [ -z "$tree" ]; then
        echo '{"error": "tree is required"}' >&2
        return 1
    fi
    
    if [ -z "$node_id" ]; then
        echo '{"error": "node_id is required"}' >&2
        return 1
    fi
    
    # Get the node to edit
    local node=$(get_node "$tree" "$node_id")
    
    if [ "$node" = "null" ]; then
        echo '{"error": "node not found"}' >&2
        return 1
    fi
    
    # Get the message content
    local content=$(echo "$node" | jq -r '.message.content')
    
    # Create a temporary file with the message content
    local temp_file=$(mktemp)
    echo "$content" > "$temp_file"
    
    # Open editor with the content
    $editor_command "$temp_file"
    
    # Read the edited content
    local new_text=$(cat "$temp_file")
    
    # Clean up temp file
    rm -f "$temp_file"
    
    # If content unchanged, return original tree
    if [ "$new_text" = "$content" ]; then
        echo "$tree"
        return 0
    fi
    
    # Create branch with edited content
    create_branch "$tree" "$node_id" "$new_text" "$model" "$save_path"
}

# Get branches from a node (returns all children as branch options)
# Usage: get_branches <tree_json> <node_id>
# Returns: JSON array of branch objects with id, content, and timestamp
get_branches() {
    local tree="$1"
    local node_id="$2"
    
    # Validate inputs
    if [ -z "$tree" ]; then
        echo "[]"
        return 1
    fi
    
    if [ -z "$node_id" ]; then
        echo "[]"
        return 1
    fi
    
    # Get the node
    local node=$(get_node "$tree" "$node_id")
    
    if [ "$node" = "null" ]; then
        echo "[]"
        return 1
    fi
    
    # Get children nodes
    local children=$(get_children "$tree" "$node_id")
    
    # Transform children into branch objects with relevant info
    local branches=$(echo "$children" | jq '[.[] | {
        id: .id,
        content: .message.content,
        timestamp: .message.timestamp,
        role: .message.role,
        isActive: .isActive
    }]')
    
    echo "$branches"
}

# Switch to a different branch (change active path)
# Usage: switch_branch <tree_json> <branch_node_id>
# Returns: Updated tree JSON with new active path
switch_branch() {
    local tree="$1"
    local branch_node_id="$2"
    
    # Validate inputs
    if [ -z "$tree" ]; then
        echo '{"error": "tree is required"}' >&2
        return 1
    fi
    
    if [ -z "$branch_node_id" ]; then
        echo '{"error": "branch_node_id is required"}' >&2
        return 1
    fi
    
    # Verify the branch node exists
    local branch_node=$(get_node "$tree" "$branch_node_id")
    
    if [ "$branch_node" = "null" ]; then
        echo '{"error": "branch node not found"}' >&2
        return 1
    fi
    
    # Get the parent of the branch node to deactivate sibling branches
    local parent_id=$(echo "$branch_node" | jq -r '.parentId')
    
    if [ -n "$parent_id" ] && [ "$parent_id" != "null" ]; then
        # Get all children of the parent (all sibling branches)
        local siblings=$(get_children "$tree" "$parent_id")
        local sibling_ids=$(echo "$siblings" | jq -r '.[].id')
        
        # Deactivate all sibling branches
        for sibling_id in $sibling_ids; do
            tree=$(deactivate_path "$tree" "$sibling_id")
        done
    fi
    
    # Activate the selected branch path
    tree=$(activate_path "$tree" "$branch_node_id")
    
    # Update currentNodeId to the selected branch
    tree=$(echo "$tree" | jq --arg node_id "$branch_node_id" \
        '.currentNodeId = $node_id')
    
    # Return updated tree
    echo "$tree"
    return 0
}

# Retry generation for an incomplete message
# Usage: retry_incomplete_message <tree_json> <node_id> <model> <save_path>
# Returns: Updated tree JSON with regenerated content
retry_incomplete_message() {
    local tree="$1"
    local node_id="$2"
    local model="${3:-llama2}"
    local save_path="$4"
    
    # Validate inputs
    if [ -z "$tree" ]; then
        echo '{"error": "tree is required"}' >&2
        return 1
    fi
    
    if [ -z "$node_id" ]; then
        echo '{"error": "node_id is required"}' >&2
        return 1
    fi
    
    # Get the node
    local node=$(get_node "$tree" "$node_id")
    
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
    
    # Check if message is marked as incomplete
    local is_incomplete=$(echo "$node" | jq -r '.message.incomplete // false')
    if [ "$is_incomplete" != "true" ]; then
        echo '{"error": "message is not marked as incomplete"}' >&2
        return 1
    fi
    
    # Get parent node to retrieve conversation history
    local parent_id=$(echo "$node" | jq -r '.parentId')
    if [ -z "$parent_id" ] || [ "$parent_id" = "null" ]; then
        echo '{"error": "assistant message must have a parent"}' >&2
        return 1
    fi
    
    # Get conversation history up to parent (before this assistant message)
    local messages=$(get_path "$tree" "$parent_id")
    
    # Clear the incomplete flag and content
    tree=$(echo "$tree" | jq \
        --arg node_id "$node_id" \
        '.nodes[$node_id].message.content = "" |
         .nodes[$node_id].message.incomplete = false')
    
    # Check Ollama connection with retry logic before streaming
    if [ "$(check_connection_with_retry)" != "true" ]; then
        # Connection failed - keep message as incomplete
        tree=$(echo "$tree" | jq \
            --arg node_id "$node_id" \
            '.nodes[$node_id].message.incomplete = true')
        
        # Save tree if path provided
        if [ -n "$save_path" ]; then
            save_after_message "$tree" "$save_path" >/dev/null 2>&1
        fi
        
        # Return error with updated tree
        echo '{"error": "connection_failed", "tree": '"$tree"', "message": "Cannot connect to Ollama service. The application will retry connection automatically."}' >&2
        return 1
    fi
    
    # Set up streaming state
    STREAMING_NODE_ID="$node_id"
    STREAMING_TREE="$tree"
    STREAMING_CONTENT=""
    
    # Start streaming completion
    stream_completion "$messages" "$model" "stream_token_callback"
    local stream_exit_code=$?
    
    # Get updated tree from streaming state
    tree="$STREAMING_TREE"
    
    # Handle streaming interruption - save partial response
    if [ $stream_exit_code -ne 0 ]; then
        # Mark message as incomplete if we have partial content
        if [ -n "$STREAMING_CONTENT" ]; then
            tree=$(echo "$tree" | jq \
                --arg node_id "$node_id" \
                '.nodes[$node_id].message.incomplete = true')
            
            # Save tree with partial response
            if [ -n "$save_path" ]; then
                save_after_message "$tree" "$save_path" >/dev/null 2>&1
            fi
        fi
        
        # Clear streaming state
        STREAMING_NODE_ID=""
        STREAMING_TREE=""
        STREAMING_CONTENT=""
        
        echo "$tree"
        return 1
    fi
    
    # Clear streaming state
    STREAMING_NODE_ID=""
    STREAMING_TREE=""
    STREAMING_CONTENT=""
    
    # Trigger auto-save after completion
    if [ -n "$save_path" ]; then
        save_after_message "$tree" "$save_path" >/dev/null 2>&1
    fi
    
    # Return updated tree
    echo "$tree"
    return 0
}
