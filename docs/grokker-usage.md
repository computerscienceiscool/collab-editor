# Grokker Usage in Collaborative Editor

This document details how code and components from stevegt's Grokker project have been integrated into the Collaborative Editor application.

## Overview

The Collaborative Editor uses Grokker's Go-based WebAssembly implementation to provide AI-powered commit message generation. This integration enhances the editor's GitHub functionality by allowing users to automatically generate meaningful commit messages based on document content.

## Files Used from Grokker Repository

The following files were directly used from the Grokker repository:

### Core Go Modules

| File | Usage in Collaborative Editor |
|------|-------------------------------|
| `v3/client/client.go` | Used unmodified as the fundamental data structure definitions for chat messages and results. Defines `ChatMsg` and `Results` types that form the foundation of the communication protocol. |
| `v3/client/go.mod` | Used as-is to define the module structure for the client package. |
| `v3/openai/openai.go` | Used with minor modifications to handle API communication with OpenAI. Implements the `CompleteChat` function that sends requests to the OpenAI API. |
| `v3/openai/go.mod` | Used with the same dependencies to maintain compatibility with the original Grokker implementation. |
| `v3/wasm/main.go` | Used as the core WebAssembly implementation, with adaptations to specifically handle commit message generation. This file contains the JS-exported `generateCommitMessage` function. |
| `v3/wasm/go.mod` | Used to maintain the same module dependencies and relationships as the original Grokker implementation. |

### JavaScript Bridge

| File | Usage in Collaborative Editor |
|------|-------------------------------|
| `wasm_exec.js` | Copied from Go's standard library (as directed in Grokker's Makefile) to provide the necessary JavaScript-side support for running Go-compiled WebAssembly. |

## Integration Points

The Grokker WASM functionality was integrated with the Collaborative Editor through the following custom components:

### JavaScript Integration

| File | Purpose |
|------|---------|
| `src/github/githubCommitDialog.js` | Provides the UI for commit message generation, contains the code that calls the WASM-exported functions and handles the results. |
| `src/github/githubService.js` | Manages GitHub settings including the Grokker API key, and provides service methods for GitHub operations. |
| `src/github/githubMenuIntegration.js` | Adds GitHub-related menu items to the application, including the option to commit with AI-generated messages. |
| `src/ui/githubDialog.js` | Implements the settings dialog for configuring GitHub and Grokker integration. |

### Build Integration

The Collaborative Editor's Makefile includes the following targets that are based on Grokker's build process:

```makefile
grokker-wasm:
	cd v3/wasm && GOOS=js GOARCH=wasm go build -o ../../dist/grokker.wasm .
	cp "$(shell go env GOROOT)/misc/wasm/wasm_exec.js" dist/

grokker-wasm-prod:
	cd v3/wasm && GOOS=js GOARCH=wasm go build -ldflags="-s -w" -o ../../dist/grokker.wasm .
	cp "$(shell go env GOROOT)/misc/wasm/wasm_exec.js" dist/
	gzip -9 -k dist/grokker.wasm
```

These targets compile the Go code to WebAssembly and copy the necessary JavaScript support file.

## Technical Implementation

### How Grokker's Code is Used

1. **WebAssembly Export**: The `v3/wasm/main.go` file exports the `generateCommitMessage` function to JavaScript using `js.Global().Set("generateCommitMessage", js.FuncOf(generateCommitMessage))`.

2. **JavaScript Bridge**: The `githubCommitDialog.js` file calls this exported function:

```javascript
const result = await window.generateCommitMessage({
    content: this.documentContent,
    apiKey: githubService.settings.grokkerApiKey,
    model: "grokker"
});
```

3. **API Communication**: The `generateGitCommitMessage` function in `v3/wasm/main.go` communicates with the OpenAI API to generate the commit message.

4. **Result Processing**: The `parseCommitMessage` function processes the response from the API into a structured format with title and body.

### Modifications to Grokker's Code

The primary modifications to Grokker's code were:

1. **Focused Functionality**: The implementation was focused specifically on commit message generation rather than general chat completions.

2. **UI Integration**: Added integration with the Collaborative Editor's UI components and GitHub workflow.

3. **Fallback Mechanisms**: Enhanced fallback mechanisms to ensure reliability even when the API or WASM functionality is unavailable.

## Deployment

The Grokker WebAssembly module is compiled during the build process and loaded in the application's HTML:

```html
<script src="dist/wasm_exec.js"></script>
```

The compiled WebAssembly binary (`grokker.wasm`) is loaded at runtime and makes the `generateCommitMessage` function available to JavaScript.

## Configuration

Users can configure the Grokker integration through the GitHub settings dialog:

1. **API Key**: Users must provide an API key for Grokker to use.
2. **Toggle**: Users can enable/disable AI-generated commit messages via a checkbox.
3. **Validation**: The application validates the API key before saving it.

## Conclusion

The Collaborative Editor effectively leverages stevegt's Grokker implementation to provide AI-powered commit message generation. The integration maintains the original code structure while adapting it to the specific needs of the application. The Go-based WebAssembly approach provides efficient, type-safe interaction with AI APIs directly from the browser.
