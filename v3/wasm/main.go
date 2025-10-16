//go:build js && wasm

package main

import (
	"fmt"
	"strings"
	"syscall/js"

	"github.com/stevegt/collab-editor/v3/client"
	"github.com/stevegt/collab-editor/v3/openai"
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

	fmt.Println("Grokker WASM initialized")
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

			// Generate commit message using the actual openai client
			result, err := generateGitCommitMessageWithGrokker(content, apiKey, model)
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

	if model == "" {
		return fmt.Errorf("model is required")
	}

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

// generateGitCommitMessageWithGrokker uses the actual grokker functionality via the OpenAI client
func generateGitCommitMessageWithGrokker(content, apiKey, model string) (*CommitResult, error) {
	fmt.Printf("WASM: Generating commit message with model %s (content length: %d)\n",
		model, len(content))

	// Set the API key for the OpenAI client
	openai.SetAPIKey(apiKey)

	// Create a prompt for generating a commit message
	prompt := fmt.Sprintf(
		"Generate a git commit message for this content using conventional commit format. "+
			"Provide a concise title line (type: description) and bullet point details. "+
			"Content: %s", content)

	// Create messages for the API
	messages := []client.ChatMsg{
		{Role: client.RoleSystem, Content: "You are a helpful assistant that generates git commit messages."},
		{Role: client.RoleUser, Content: prompt},
	}

	// Call the OpenAI client
	result, err := openai.CompleteChat(model, messages)
	if err != nil {
		fmt.Printf("WASM: Error from OpenAI: %v\n", err)
		return nil, fmt.Errorf("failed to generate commit message: %w", err)
	}

	// Get the commit message from the result.Body field
	commitMessage := result.Body
	fmt.Printf("WASM: Got commit message: %s\n", commitMessage)

	// Extract title and body from the generated message
	title, body := parseCommitMessage(commitMessage)

	// Create full message
	fullMessage := fmt.Sprintf("%s\n\n%s", title, body)

	return &CommitResult{
		Title:       title,
		Body:        body,
		FullMessage: fullMessage,
	}, nil
}

// parseCommitMessage extracts title and body from a generated message
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
