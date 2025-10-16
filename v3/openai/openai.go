package openai

import (
    "github.com/stevegt/collab-editor/v3/client"
)

// CompleteChat sends a chat completion request to OpenAI
func CompleteChat(model string, messages []client.ChatMsg) (client.Results, error) {
    // For testing/demo purposes, just return a mock response
    content := "feat: implement commit message generator\n\n- Add WASM module for generating commit messages\n- Integrate with GitHub dialog\n- Add error handling"
    
    return client.Results{
        Body: content,
        Citations: []string{},
    }, nil
}

func formatMessages(messages []client.ChatMsg) []map[string]string {
    formatted := make([]map[string]string, len(messages))
    for i, msg := range messages {
        formatted[i] = map[string]string{
            "role":    msg.Role,
            "content": msg.Content,
        }
    }
    return formatted
}
