# Grokker WASM Integration

## Overview

The Grokker WASM integration enables AI-powered capabilities directly in the browser by leveraging WebAssembly to bridge JavaScript and Go. This document explains the architecture, implementation details, and integration points of the Grokker WASM module.

## Architecture

The Grokker WASM integration follows a layered architecture:

1. **UI Layer** - JavaScript components that provide user interface elements
2. **Bridge Layer** - WebAssembly module compiled from Go code
3. **Service Layer** - Go implementation of AI services
4. **API Layer** - External API communication with AI providers

```
┌─────────────────┐
│   UI Layer      │ 
│  (JavaScript)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Bridge Layer   │ 
│     (WASM)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Service Layer  │ 
│      (Go)       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   API Layer     │
│  (LLM Services) │
└─────────────────┘
```

## Implementation

### WASM Compilation

The Go code is compiled to WebAssembly using the following command in the Makefile:

```makefile
grokker-wasm:
	cd v3/wasm && GOOS=js GOARCH=wasm go build -o ../../dist/grokker.wasm .
	cp "$(shell go env GOROOT)/misc/wasm/wasm_exec.js" dist/

grokker-wasm-prod:
	cd v3/wasm && GOOS=js GOARCH=wasm go build -ldflags="-s -w" -o ../../dist/grokker.wasm .
	cp "$(shell go env GOROOT)/misc/wasm/wasm_exec.js" dist/
	gzip -9 -k dist/grokker.wasm
```

This creates a compressed WebAssembly binary with the Go implementation and copies the required JavaScript support file.

### JavaScript Integration

The WASM module exposes functions to JavaScript through the `js.Global().Set()` mechanism:

```go
js.Global().Set("generateCommitMessage", js.FuncOf(generateCommitMessage))
```

These functions can then be called from JavaScript as if they were native functions.

### Go Implementation

The core functionality is implemented in Go, which provides:

1. Type safety and strong error handling
2. Efficient memory management
3. Concurrent processing capabilities
4. Access to the Go ecosystem of packages

### Promise-Based API

The WASM module implements a Promise-based API to provide asynchronous functionality that integrates well with modern JavaScript:

```go
// Create and return a Promise
promiseConstructor := js.Global().Get("Promise")
return promiseConstructor.New(handler)
```

This allows JavaScript code to use async/await patterns when interacting with the WASM module.

## Model Support

Grokker WASM is designed to support multiple language models (LLMs):

- Currently configured to use GPT-4 by default
- Architecture supports easy addition of new models
- Model selection is passed through the API
- Fallback mechanisms ensure reliability

The model mapping is handled in code:

```go
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
```

## Error Handling

The integration implements robust error handling:

1. Parameter validation before API calls
2. Structured error responses with error codes
3. Detailed error messages for debugging
4. Graceful degradation with fallback mechanisms

Errors are communicated back to JavaScript through the Promise rejection mechanism:

```go
func rejectWithError(reject js.Value, code, message, details string) {
    errorObj := map[string]interface{}{
        "error":   message,
        "code":    code,
        "details": details,
    }
    reject.Invoke(mapToJSObject(errorObj))
}
```

## Security Considerations

The WASM integration implements several security measures:

1. API keys are never stored in browser storage
2. Input validation to prevent injection attacks
3. CORS-compatible API communication
4. Memory isolation through WebAssembly sandbox

## Future Extensibility

The architecture is designed for future expansion:

1. Additional AI capabilities beyond commit messages
2. Support for more LLMs as they become available
3. Enhanced prompt engineering capabilities
4. Offline capabilities with local models

## Integration Points

### HTML Integration

The WASM file is loaded in the HTML:

```html
<script src="dist/wasm_exec.js"></script>
```

### JavaScript Integration

JavaScript code can call the WASM functions directly:

```javascript
const result = await window.generateCommitMessage({
    content: content,
    apiKey: apiKey,
    model: "grokker" // Or other model identifiers
});
```

## Conclusion

The Grokker WASM integration provides a powerful, flexible system for integrating AI capabilities directly into web applications. By leveraging WebAssembly, it combines the performance and type safety of Go with the accessibility and reach of web technologies.
