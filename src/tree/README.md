# Conversation Tree Operations

This module provides functions for managing conversation trees in the Vanilla Chat TUI application. A conversation tree stores messages as nodes with parent-child relationships to support branching conversations.

## Functions

### `init_tree [title] [model]`

Initialize an empty conversation tree with metadata.

**Parameters:**
- `title` (optional): Title of the conversation (default: "Untitled Conversation")
- `model` (optional): Default AI model for the conversation (default: "llama2")

**Returns:** JSON string representing an empty conversation tree

**Example:**
```bash
tree=$(init_tree "My Conversation" "llama2")
```

### `add_node <tree_json> <message_json> <parent_id>`

Add a new node to the conversation tree.

**Parameters:**
- `tree_json`: JSON string of the conversation tree
- `message_json`: JSON string of the message to add (created with `create_message`)
- `parent_id`: ID of the parent node, or empty string for root node

**Returns:** JSON object with two properties:
- `tree`: Updated conversation tree
- `nodeId`: ID of the newly created node

**Example:**
```bash
message=$(create_message "user" "Hello!")
result=$(add_node "$tree" "$message" "")
tree=$(echo "$result" | jq -r '.tree')
node_id=$(echo "$result" | jq -r '.nodeId')
```

### `get_node <tree_json> <node_id>`

Retrieve a specific node from the conversation tree.

**Parameters:**
- `tree_json`: JSON string of the conversation tree
- `node_id`: ID of the node to retrieve

**Returns:** JSON object representing the node, or `null` if not found

**Example:**
```bash
node=$(get_node "$tree" "$node_id")
content=$(echo "$node" | jq -r '.message.content')
```

### `get_children <tree_json> <node_id>`

Get all child nodes of a specific node.

**Parameters:**
- `tree_json`: JSON string of the conversation tree
- `node_id`: ID of the parent node

**Returns:** JSON array of child node objects (empty array if no children or node not found)

**Example:**
```bash
children=$(get_children "$tree" "$node_id")
child_count=$(echo "$children" | jq 'length')
```

### `get_path <tree_json> <node_id>`

Retrieve the complete conversation history from root to a specific node.

**Parameters:**
- `tree_json`: JSON string of the conversation tree
- `node_id`: ID of the target node

**Returns:** JSON array of message objects in chronological order (root to node), or empty array if node not found

**Example:**
```bash
# Get conversation history up to current node
path=$(get_path "$tree" "$current_node_id")

# Display the conversation
echo "$path" | jq -r '.[] | "\(.role): \(.content)"'

# Count messages in path
message_count=$(echo "$path" | jq 'length')
```

**Edge Cases:**
- Returns empty array `[]` for invalid/non-existent node IDs
- Returns single-element array for root node
- Returns messages only (not full node objects)
- Handles branching correctly (follows parent chain only)

## Data Structures

### Conversation Tree

```json
{
  "nodes": {
    "node-id-1": { /* node object */ },
    "node-id-2": { /* node object */ }
  },
  "rootId": "node-id-1",
  "currentNodeId": "node-id-2",
  "metadata": {
    "createdAt": "2024-01-01T00:00:00Z",
    "lastModified": "2024-01-01T00:00:00Z",
    "title": "My Conversation",
    "model": "llama2"
  }
}
```

### Node

```json
{
  "id": "unique-node-id",
  "message": {
    "id": "unique-message-id",
    "role": "user",
    "content": "Hello!",
    "timestamp": "2024-01-01T00:00:00Z",
    "model": ""
  },
  "parentId": "parent-node-id",
  "children": ["child-id-1", "child-id-2"],
  "isActive": true
}
```

## Usage Example

```bash
#!/usr/bin/env bash
source src/tree/tree_ops.sh

# Initialize tree
tree=$(init_tree "My Chat" "llama2")

# Add root message
msg1=$(create_message "user" "What is 2+2?")
result=$(add_node "$tree" "$msg1" "")
tree=$(echo "$result" | jq -r '.tree')
root_id=$(echo "$result" | jq -r '.nodeId')

# Add response
msg2=$(create_message "assistant" "2+2 equals 4." "llama2")
result=$(add_node "$tree" "$msg2" "$root_id")
tree=$(echo "$result" | jq -r '.tree')
response_id=$(echo "$result" | jq -r '.nodeId')

# Get conversation history
path=$(get_path "$tree" "$response_id")
echo "Conversation history:"
echo "$path" | jq -r '.[] | "\(.role): \(.content)"'

# Get children of root
children=$(get_children "$tree" "$root_id")
echo "Root has $(echo "$children" | jq 'length') child(ren)"

# Create a branch (alternate response)
msg3=$(create_message "assistant" "The answer is 4." "llama2")
result=$(add_node "$tree" "$msg3" "$root_id")
tree=$(echo "$result" | jq -r '.tree')

# Now root has 2 children (branching)
children=$(get_children "$tree" "$root_id")
echo "Root now has $(echo "$children" | jq 'length') child(ren)"
```

## Requirements Satisfied

This implementation satisfies the following requirements from the spec:

- **Requirement 2.1**: Stores messages as nodes with parent-child relationships
- **Requirement 2.2**: Maintains a single root node with no parent
- **Requirement 2.3**: Assigns unique identifiers to each node
- **Requirement 2.4**: Supports retrieving conversation paths in chronological order (via `get_path`)
- **Requirement 2.5**: Prevents circular references (tree structure)
- **Requirement 2.6**: Tracks active path through isActive flag
- **Requirement 8.3**: Provides conversation history for Ollama API context (via `get_path`)

## Testing

Run the test suite:

```bash
./tests/test_tree_ops.sh
```

Run the demos:

```bash
./examples/tree_demo.sh
./examples/getpath_demo.sh
```

## Dependencies

- `jq`: JSON processor (required)
- `src/lib/json_utils.sh`: JSON utility functions
