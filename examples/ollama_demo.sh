#!/usr/bin/env bash
# Demo script for Ollama client integration

# Source the Ollama client
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/../src/ollama/ollama_client.sh"

echo "========================================="
echo "Ollama Client Demo"
echo "========================================="
echo ""

# Check connection
echo "1. Checking Ollama connection..."
if [ "$(check_connection)" = "true" ]; then
    echo "   ✓ Connected to Ollama service"
else
    echo "   ✗ Cannot connect to Ollama service"
    echo "   Please ensure Ollama is running: ollama serve"
    exit 1
fi
echo ""

# List available models
echo "2. Listing available models..."
models_result=$(list_models)

if echo "$models_result" | jq -e '.error' > /dev/null 2>&1; then
    echo "   ✗ Error: $(echo "$models_result" | jq -r '.error')"
    exit 1
else
    model_count=$(echo "$models_result" | jq '.models | length')
    echo "   ✓ Found $model_count model(s):"
    
    echo "$models_result" | jq -r '.models[] | "     - \(.name)"'
fi
echo ""

# Get info for first available model
echo "3. Getting model information..."
first_model=$(echo "$models_result" | jq -r '.models[0].name // empty')

if [ -n "$first_model" ]; then
    echo "   Querying info for: $first_model"
    model_info=$(get_model_info "$first_model")
    
    if echo "$model_info" | jq -e '.error' > /dev/null 2>&1; then
        echo "   ✗ Error: $(echo "$model_info" | jq -r '.error')"
    else
        echo "   ✓ Model details retrieved"
        echo "     Format: $(echo "$model_info" | jq -r '.details.format // "N/A"')"
        echo "     Family: $(echo "$model_info" | jq -r '.details.family // "N/A"')"
    fi
else
    echo "   ✗ No models available"
fi
echo ""

# Demo streaming completion
echo "4. Testing streaming completion..."
if [ -n "$first_model" ]; then
    echo "   Using model: $first_model"
    echo "   Prompt: 'Say hello in 5 words or less'"
    echo ""
    echo "   Response: "
    
    # Create a callback function to display tokens
    demo_callback() {
        local token="$1"
        local done="$2"
        
        if [ "$done" = "true" ]; then
            echo ""
            echo ""
            echo "   ✓ Streaming completed"
        else
            # Print token without newline
            printf "%s" "$token"
        fi
    }
    
    # Create messages array
    messages=$(jq -n '[{role: "user", content: "Say hello in 5 words or less"}]')
    
    # Start streaming
    echo -n "   "
    stream_completion "$messages" "$first_model" "demo_callback"
    
    if [ $? -eq 0 ]; then
        echo "   ✓ Stream completed successfully"
    else
        echo "   ✗ Stream failed"
    fi
else
    echo "   ✗ No models available for streaming test"
fi
echo ""

echo "========================================="
echo "Demo completed!"
echo "========================================="
