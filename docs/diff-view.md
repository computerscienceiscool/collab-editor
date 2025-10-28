# Diff View Feature

> **⚠️ This feature is a WIP and has not been fully tested**

The Collaborative Text Editor includes a powerful diff viewer that allows you to compare different versions of your document and visualize changes in real-time.

## Overview

The diff viewer is powered by WebAssembly (WASM) using Go's `diffmatchpatch` library, providing GitHub-style diff visualization with both side-by-side and unified diff views.

## Features

- **Side-by-Side Diff View**: GitHub-style comparison showing old and new versions side by side
- **Unified Diff View**: Git-style unified diff format
- **Real-time Statistics**: Live counts of additions, deletions, and total changes
- **Multiple View Modes**: Switch between different visualization formats
- **WASM Performance**: Fast diff computation using compiled Go code

## Accessing the Diff Viewer

### Via Menu
1. Go to **View** → **View Diffs**
2. The diff viewer dialog will open with a comparison of your current document

### Keyboard Shortcut
Currently accessed through the menu system (keyboard shortcuts can be customized in preferences).

## Technical Implementation

### WebAssembly Module
The diff functionality is implemented in Go and compiled to WebAssembly:

```go
// Core functions exposed to JavaScript
- generateSideBySideDiff(oldText, newText, oldLabel, newLabel)
- generateUnifiedDiff(oldText, newText) 
- generateDiffStats(oldText, newText)
```

### Building the WASM Module
To build the diff WASM module:

```bash
make diff-wasm
```

This compiles `go-diff/main.go` to `dist/diff.wasm`.

## Diff View Modes

### Side-by-Side View
- **Left Panel**: Original version with line numbers
- **Right Panel**: Modified version with line numbers
- **Color Coding**:
  - Red background: Deleted lines
  - Green background: Added lines
  - White background: Unchanged lines
  - Gray background: Empty space for alignment

### Unified View
- Standard Git-style unified diff format
- Shows changes in context with surrounding lines
- Uses `+` for additions and `-` for deletions

## Statistics Panel

The diff viewer displays real-time statistics:
- **Additions**: Number of lines added
- **Deletions**: Number of lines removed
- **Total Changes**: Sum of additions and deletions

## Code Structure

### Go WASM Module (`go-diff/main.go`)
```go
// Main diff engine using diffmatchpatch
var dmp *diffmatchpatch.DiffMatchPatch

// JavaScript exports
js.Global().Set("generateSideBySideDiff", js.FuncOf(generateSideBySideDiff))
js.Global().Set("generateUnifiedDiff", js.FuncOf(generateUnifiedDiff))
js.Global().Set("generateDiffStats", js.FuncOf(generateDiffStats))
```

### JavaScript Integration (`src/wasm/diffWasm.js`)
```javascript
// Initialize WASM module
export async function initDiffWasm() {
  const go = new Go();
  const result = await WebAssembly.instantiateStreaming(
    fetch('dist/diff.wasm'),
    go.importObject
  );
  go.run(result.instance);
}
```

### Menu Integration
The diff viewer is integrated into the menu system and can be triggered via:
```javascript
case 'view-diffs':
  this.handleViewDiffs();
  break;
```

## Styling

The diff viewer uses GitHub-inspired styling defined in `style.css`:

```css
.diff-viewer {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
  line-height: 1.4;
}

.diff-line-deleted {
  background: #ffebe9;
  color: #82071e;
}

.diff-line-added {
  background: #dafbe1;
  color: #116329;
}
```

## Error Handling

### WASM Not Available
If the WASM module fails to load:
```javascript
if (typeof window.generateSideBySideDiff !== 'function') {
  alert('Diff viewer not available. Run: make diff-wasm');
  return;
}
```

### Fallback Behavior
- Shows error message with instructions to build WASM
- Provides raw text comparison as fallback
- Graceful degradation when WebAssembly is not supported

## Performance Considerations

- **WASM Speed**: Diff computation happens in compiled WebAssembly for optimal performance
- **Large Documents**: Handles large documents efficiently using streaming diff algorithms
- **Memory Usage**: Optimized memory usage through Go's garbage collection
- **Lazy Loading**: WASM module loads on demand to reduce initial page load time

## Browser Compatibility

- **Modern Browsers**: Full support in Chrome, Firefox, Safari, Edge
- **WebAssembly Support**: Requires browsers with WASM support (95%+ of modern browsers)
- **Fallback**: Graceful degradation for unsupported browsers

## Configuration

### Dependencies
```go
// go.mod
require github.com/sergi/go-diff v1.4.0
```

### Build Requirements
- Go 1.22.1 or later
- WebAssembly support
- Make build system

## Troubleshooting

### Common Issues

**"Diff viewer not available" error:**
```bash
# Build the WASM module
make diff-wasm

# Ensure files are present
ls dist/diff.wasm
ls dist/wasm_exec.js
```

**WASM fails to load:**
- Check browser console for CORS errors
- Ensure server serves `.wasm` files with correct MIME type
- Verify WebAssembly is enabled in browser

**Performance issues:**
- Large documents may take time to process
- Consider chunking very large diffs
- Monitor browser memory usage

## Future Enhancements

- **Version History Integration**: Compare against saved document versions
- **Real-time Collaboration Diffs**: Show changes from other users in real-time
- **Advanced Diff Algorithms**: Word-level and character-level diff options
- **Export Options**: Save diff views as HTML or images
- **Syntax Highlighting**: Language-aware diff highlighting
- **Inline Editing**: Edit directly within diff view
- **Merge Conflicts**: Visual merge conflict resolution

## API Reference

### JavaScript Functions

#### `generateSideBySideDiff(oldText, newText, oldLabel, newLabel)`
Generates HTML for side-by-side diff view.

**Parameters:**
- `oldText`: Original text content
- `newText`: Modified text content  
- `oldLabel`: Label for old version (e.g., "Previous")
- `newLabel`: Label for new version (e.g., "Current")

**Returns:** HTML string for side-by-side diff

#### `generateUnifiedDiff(oldText, newText)`
Generates unified diff format.

**Parameters:**
- `oldText`: Original text content
- `newText`: Modified text content

**Returns:** Unified diff string

#### `generateDiffStats(oldText, newText)`
Calculates diff statistics.

**Parameters:**
- `oldText`: Original text content
- `newText`: Modified text content

**Returns:** Object with `additions`, `deletions`, and `total` counts

