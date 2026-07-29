#!/usr/bin/env bash
# JSON utility functions for conversation tree manipulation

# Check if jq is available
if ! command -v jq &> /dev/null; then
    echo "Error: jq is required but not installed. Please install jq." >&2
    exit 1
fi

# Generate a unique UUID v4
generate_uuid() {
    if command -v uuidgen &> /dev/null; then
        uuidgen | tr '[:upper:]' '[:lower:]'
    else
        # Fallback: generate pseudo-UUID using /dev/urandom
        cat /proc/sys/kernel/random/uuid 2>/dev/null || \
        printf '%08x-%04x-%04x-%04x-%012x' \
            $RANDOM$RANDOM $RANDOM $RANDOM $RANDOM $RANDOM$RANDOM$RANDOM
    fi
}

# Get current timestamp in ISO 8601 format
get_timestamp() {
    date -u +"%Y-%m-%dT%H:%M:%SZ"
}

# Create a message object
# Usage: create_message <role> <content> [model]
create_message() {
    local role="$1"
    local content="$2"
    local model="${3:-}"
    local id=$(generate_uuid)
    local timestamp=$(get_timestamp)
    
    jq -n \
        --arg id "$id" \
        --arg role "$role" \
        --arg content "$content" \
        --arg timestamp "$timestamp" \
        --arg model "$model" \
        '{
            id: $id,
            role: $role,
            content: $content,
            timestamp: $timestamp,
            model: $model
        }'
}

# Create a node object
# Usage: create_node <message_json> <parent_id>
create_node() {
    local message_json="$1"
    local parent_id="$2"
    local id=$(generate_uuid)
    
    jq -n \
        --arg id "$id" \
        --argjson message "$message_json" \
        --arg parent_id "$parent_id" \
        '{
            id: $id,
            message: $message,
            parentId: ($parent_id | if . == "" then null else . end),
            children: [],
            isActive: true
        }'
}

# Create an empty conversation tree
# Usage: create_empty_tree [title] [model]
create_empty_tree() {
    local title="${1:-Untitled Conversation}"
    local model="${2:-llama2}"
    local created_at=$(get_timestamp)
    
    jq -n \
        --arg title "$title" \
        --arg model "$model" \
        --arg created_at "$created_at" \
        '{
            nodes: {},
            rootId: null,
            currentNodeId: null,
            metadata: {
                createdAt: $created_at,
                lastModified: $created_at,
                title: $title,
                model: $model
            }
        }'
}

# Get a value from JSON using jq path
# Usage: json_get <json> <path>
json_get() {
    local json="$1"
    local path="$2"
    echo "$json" | jq -r "$path"
}

# Set a value in JSON using jq
# Usage: json_set <json> <path> <value>
json_set() {
    local json="$1"
    local path="$2"
    local value="$3"
    echo "$json" | jq --arg val "$value" "$path = \$val"
}

# Add an element to a JSON array
# Usage: json_array_append <json> <path> <element>
json_array_append() {
    local json="$1"
    local path="$2"
    local element="$3"
    echo "$json" | jq --arg elem "$element" "$path += [\$elem]"
}

# Check if a key exists in JSON
# Usage: json_has_key <json> <path>
json_has_key() {
    local json="$1"
    local path="$2"
    local result=$(echo "$json" | jq -e "$path" > /dev/null 2>&1 && echo "true" || echo "false")
    echo "$result"
}

# Validate JSON structure
# Usage: validate_json <json>
validate_json() {
    local json="$1"
    echo "$json" | jq empty > /dev/null 2>&1
    return $?
}

# Pretty print JSON
# Usage: json_pretty <json>
json_pretty() {
    local json="$1"
    echo "$json" | jq '.'
}

# Compact JSON (remove whitespace)
# Usage: json_compact <json>
json_compact() {
    local json="$1"
    echo "$json" | jq -c '.'
}
