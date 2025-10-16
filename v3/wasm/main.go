//go:build js && wasm

package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"syscall/js"
	"time"
)

// CommitResult represents the structure returned from generateCommitMessage
type CommitResult struct {
	Title       string `json:"title"`
	Body        string `json:"body"`
	FullMessage string `json:"fullMessage"`
}

func main() {
	c := make(chan struct{})

	// Register the JavaScript function
	js.Global().Set("generateCommitMessage", js.FuncOf(generateCommitMessage))

	fmt.Println("Commit Message WASM initialized")
	<-c // Keep running
}

// generateCommitMessage creates a git commit message from file changes
func generateCommitMessage(this js.Value, args []js.Value) interface{} {
	// Check if parameters were passed
	if len(args) < 1 {
		// Handle error case with no parameters
		errorObj := map[string]interface{}{
			"error":   "No parameters provided",
			"code":    "INVALID_INPUT",
			"details": "",
		}
		return mapToJSObject(errorObj)
	}

	// Store the parameters from the outer function
	params := args[0]

	// Create a Promise that Go will fulfill
	handler := js.FuncOf(func(this js.Value, promiseArgs []js.Value) interface{} {
		resolve := promiseArgs[0]
		reject := promiseArgs[1]

		// Run in goroutine to avoid blocking
		go func() {
			// Extract required fields
			content := getStringParam(params, "content")
			apiKey := getStringParam(params, "apiKey")
			model := getStringParam(params, "model")

			// Validate inputs
			if err := validateInputs(content, apiKey, model); err != nil {
				rejectWithError(reject, "INVALID_INPUT", err.Error(), "")
				return
			}

			// Generate commit message
			result, err := generateGitCommitMessage(content, apiKey, model)
			if err != nil {
				rejectWithError(reject, "API_ERROR", "Failed to generate commit message", err.Error())
				return
			}

			// Return result as JavaScript object
			resolve.Invoke(resultToJSObject(result))
		}()

		return nil
	})

	// Create and return a Promise
	promiseConstructor := js.Global().Get("Promise")
	return promiseConstructor.New(handler)
}

// generateGitCommitMessage generates a commit message for the given content
func generateGitCommitMessage(content, apiKey, model string) (*CommitResult, error) {
	fmt.Printf("WASM: Generating commit message (content length: %d)\n", len(content))

	// Use a predefined API endpoint for commit message generation
	apiEndpoint := "https://api.openai.com/v1/chat/completions"

	// Create a request body
	requestBody := map[string]interface{}{
		"model": getModelName(model),
		"messages": []map[string]string{
			{
				"role": "system",
				"content": `You are an expert at generating git commit messages in the Conventional Commits format.
Analyze the code changes and generate a concise, descriptive commit message.
First line should be a summary in format: type(scope): brief description
Use types like feat, fix, docs, style, refactor, perf, test, build, ci, or chore.
The body should contain bullet points explaining the changes in more detail.`,
			},
			{
				"role":    "user",
				"content": fmt.Sprintf("Generate a commit message for these changes:\n\n%s", content),
			},
		},
		"temperature": 0.7,
		"max_tokens":  500,
	}

	// Convert request to JSON
	jsonBody, err := json.Marshal(requestBody)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	// Create HTTP request
	req, err := http.NewRequest("POST", apiEndpoint, bytes.NewBuffer(jsonBody))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	// Set headers
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", apiKey))

	// Send request
	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()

	// Check for errors
	if resp.StatusCode != http.StatusOK {
		var errorResponse map[string]interface{}
		if err := json.NewDecoder(resp.Body).Decode(&errorResponse); err != nil {
			return nil, fmt.Errorf("API error (status %d): %s", resp.StatusCode, "unknown error")
		}
		return nil, fmt.Errorf("API error (status %d): %v", resp.StatusCode, errorResponse)
	}

	// Parse response
	var response struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	// Extract content
	if len(response.Choices) == 0 {
		return nil, fmt.Errorf("no response content")
	}

	commitMessage := response.Choices[0].Message.Content

	// Extract title and body
	title, body := parseCommitMessage(commitMessage)

	return &CommitResult{
		Title:       title,
		Body:        body,
		FullMessage: commitMessage,
	}, nil
}

// getModelName converts user-friendly model names to API model names
func getModelName(model string) string {
	// Default to GPT-4 if not specified or if "grokker" is specified
	if model == "" || model == "grokker" {
		return "gpt-4"
	}

	// Map of common model name aliases
	modelMap := map[string]string{
		"gpt-3.5": "gpt-3.5-turbo",
		"gpt3":    "gpt-3.5-turbo",
		"gpt4":    "gpt-4",
		"4":       "gpt-4",
		"3":       "gpt-3.5-turbo",
	}

	if apiModel, ok := modelMap[strings.ToLower(model)]; ok {
		return apiModel
	}

	// If not in map, return as-is
	return model
}

// parseCommitMessage extracts title and body from a git commit message
func parseCommitMessage(message string) (string, string) {
	lines := strings.Split(message, "\n")

	// The first non-empty line should be the title
	title := ""
	bodyStartIndex := 0

	for i, line := range lines {
		trimmed := strings.TrimSpace(line)
		if title == "" && trimmed != "" {
			title = trimmed
			bodyStartIndex = i + 1
			continue
		}
	}

	// Skip empty lines between title and body
	for bodyStartIndex < len(lines) && strings.TrimSpace(lines[bodyStartIndex]) == "" {
		bodyStartIndex++
	}

	// The rest is the body
	body := strings.TrimSpace(strings.Join(lines[bodyStartIndex:], "\n"))

	// If no proper title/body structure was found, handle it
	if title == "" {
		title = "docs: update content"
		body = message
	}

	return title, body
}

// Helper functions
func getStringParam(obj js.Value, key string) string {
	val := obj.Get(key)
	if val.IsUndefined() || val.IsNull() {
		return ""
	}
	return val.String()
}

func validateInputs(content, apiKey, model string) error {
	if content == "" {
		return fmt.Errorf("content is required")
	}
	if apiKey == "" {
		return fmt.Errorf("apiKey is required")
	}
	// Model validation is optional, a default will be used
	return nil
}

func rejectWithError(reject js.Value, code, message, details string) {
	errorObj := map[string]interface{}{
		"error":   message,
		"code":    code,
		"details": details,
	}
	reject.Invoke(mapToJSObject(errorObj))
}

func resultToJSObject(result *CommitResult) js.Value {
	obj := map[string]interface{}{
		"title":       result.Title,
		"body":        result.Body,
		"fullMessage": result.FullMessage,
	}
	return mapToJSObject(obj)
}

func mapToJSObject(m map[string]interface{}) js.Value {
	obj := js.Global().Get("Object").New()
	for k, v := range m {
		obj.Set(k, v)
	}
	return obj
}
