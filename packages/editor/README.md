# @collab-editor/editor

Browser-based collaborative text editor built on Automerge CRDTs and CodeMirror 6.

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

Opens at http://localhost:8080

## Build

```bash
npm run build
```

## Architecture

The package follows a modular architecture with single-responsibility classes:

- **AutomergeSync** (`src/automerge-sync.js`) - Manages Automerge repository and document synchronization
- **AutomergeBinding** (`src/codemirror-binding.js`) - Bridges CodeMirror state with Automerge document
- **createEditor** (`src/editor.js`) - Creates CodeMirror editor with collaborative extensions
- **main.js** - Application entry point that orchestrates all components

## Key Features

- Real-time collaborative editing via Automerge CRDTs
- Remote cursors and user presence via `@collab-editor/awareness`
- Character-level sync using `Automerge.splice()` for optimal merging
- Offline support with IndexedDB persistence
- GitHub integration for commits and pulls
- WASM-powered text processing (Rust + Go)
- Markdown preview with scroll sync
- 51 customizable keyboard shortcuts

## Protocol Compatibility

This package maintains protocol compatibility with:
- [vimbeam](https://github.com/computerscienceiscool/vimbeam) - Neovim collaborative editing
- `@collab-editor/awareness` - Shared awareness protocol

Document structure: `{ content: "", metadata: { created: timestamp, version: 1 } }`

## WASM Dependencies

The editor uses three WASM modules:
- **Rust WASM** (`rust-wasm/`) - Compression, formatting, search, PromiseGrid CBOR
- **Go Diff WASM** (`dist/diff.wasm`) - Side-by-side diff viewer
- **Go Grokker WASM** (`dist/grokker.wasm`) - AI commit message generation

Build WASM from the root collab-editor directory:
```bash
make wasm         # Rust WASM
make diff-wasm    # Go diff viewer
make grokker-wasm # Go AI commit messages
```

## Exports

```javascript
// Main entry point
import '@collab-editor/editor'

// Individual components for embedding
import { AutomergeSync } from '@collab-editor/editor/sync'
import { AutomergeBinding, isRemoteChange } from '@collab-editor/editor/binding'
import { createEditor, setupEditorWithBinding } from '@collab-editor/editor/editor'
```
