package openai

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"

	"github.com/stevegt/collab-editor/v3/client"
)

// Global variable to store the API key
var apiKey string

// SetAPIKey sets the API key for OpenAI requests
func SetAPIKey(key string) {
	apiKey = key
}

// CompleteChat sends a chat completion request to OpenAI
// This matches your current signature without changing it
func CompleteChat(model string, messages []client.ChatMsg) (client.Results, error) {
	if apiKey == "" {
		return client.Results{}, fmt.Errorf("API key not set, use SetAPIKey first")
	}

	// Create the API request
	requestBody, err := json.Marshal(map[string]interface{}{
		"model":       model,
		"messages":    formatMessages(messages),
		"temperature": 0.7,
		"max_tokens":  500,
	})
	if err != nil {
		return client.Results{}, fmt.Errorf("failed to marshal request: %w", err)
	}

	// Create HTTP request
	req, err := http.NewRequest("POST", "https://api.openai.com/v1/chat/completions", bytes.NewBuffer(requestBody))
	if err != nil {
		return client.Results{}, fmt.Errorf("failed to create request: %w", err)
	}

	// Set headers
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", apiKey))

	// Send request
	httpClient := &http.Client{}
	resp, err := httpClient.Do(req)
	if err != nil {
		return client.Results{}, fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	// Read response
	respBody, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return client.Results{}, fmt.Errorf("failed to read response: %w", err)
	}

	// Check status
	if resp.StatusCode != http.StatusOK {
		return client.Results{}, fmt.Errorf("API error %d: %s", resp.StatusCode, respBody)
	}

	// Parse response
	var response struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
	}

	if err := json.Unmarshal(respBody, &response); err != nil {
		return client.Results{}, fmt.Errorf("failed to unmarshal response: %w", err)
	}

	// Check if we got a valid response
	if len(response.Choices) == 0 {
		return client.Results{}, fmt.Errorf("no completions returned")
	}

	// Return the content
	return client.Results{
		Body:      response.Choices[0].Message.Content,
		Citations: []string{}, // No citations in this implementation
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
