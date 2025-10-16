//go:build js && wasm

package main

import (
	"fmt"
	"strings"
	"syscall/js"
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
			// Use params from the outer function, not from promiseArgs

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

// generateGitCommitMessage simulates generating a commit message
func generateGitCommitMessage(content, apiKey, model string) (*CommitResult, error) {
	fmt.Printf("WASM: Generating commit message with model %s (content length: %d)\n",
		model, len(content))

	// Check for content patterns to generate appropriate messages
	contentLower := strings.ToLower(content)

	var title, body string

	// Determine commit type based on content
	if strings.Contains(contentLower, "fix") || strings.Contains(contentLower, "bug") {
		title = "fix: resolve issue with error handling"
		body = "- Fixed bug in error handling logic\n- Added proper validation for edge cases\n- Improved error messages for clarity"
	} else if strings.Contains(contentLower, "feature") || strings.Contains(contentLower, "add") {
		title = "feat: implement new functionality"
		body = "- Added new feature for improved user experience\n- Implemented optimized algorithm\n- Added unit tests for new functionality"
	} else if strings.Contains(contentLower, "test") {
		title = "test: enhance test coverage"
		body = "- Added unit tests for core functionality\n- Improved test fixtures\n- Fixed flaky tests"
	} else if strings.Contains(contentLower, "doc") {
		title = "docs: update documentation"
		body = "- Updated README with clear installation steps\n- Added API documentation\n- Fixed typos and improved clarity"
	} else if strings.Contains(contentLower, "refactor") {
		title = "refactor: improve code organization"
		body = "- Restructured components for better maintainability\n- Simplified complex logic\n- Removed redundant code"
	} else {
		// Default for unrecognized content
		title = "chore: update project configuration"
		body = "- Updated dependencies\n- Improved build process\n- Enhanced project structure"
	}

	fullMessage := fmt.Sprintf("%s\n\n%s", title, body)

	fmt.Println("WASM: Generated commit message:", fullMessage)

	return &CommitResult{
		Title:       title,
		Body:        body,
		FullMessage: fullMessage,
	}, nil
}
