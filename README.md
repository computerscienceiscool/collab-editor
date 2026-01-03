
# Collaborative Text Editor (Automerge-Based + PromiseGrid)

This is a collaborative text editor demo based on [Automerge CRDT](https://automerge.org/) with **PromiseGrid protocol integration**.  
It enables multiple users to edit shared text documents in real-time using WebSocket and local IndexedDB persistence, while also generating real PromiseGrid CBOR messages for decentralized computing demonstration.

This demo has been extended with additional features that are useful to teams, including user presence, logging, export options, document awareness, and **genuine PromiseGrid protocol messaging**.

---

## Features
### Core Collaboration
- Real-time collaborative editing
- Shared cursors and user awareness
- Custom usernames and color indicators
- Document sharing via URL (e.g., `?doc=automerge:abc123...`)
- Typing indicators and presence tracking
- Toggleable user activity log
- Offline support with automatic syncing (via IndexedDB)

### Document Style Menu System
- **Complete menu bar**: File, Edit, Format, Tools, View, and Help menus
- **Over 30 menu features**: Many implemented features and several planned for future releases. Much of this is a work-in-progress.
- **Opt-in keyboard shortcuts**: Only basic editing shortcuts (Ctrl+C, Ctrl+V, Ctrl+X) enabled by default, with 20+ additional shortcuts available through Help → Keyboard Shortcuts menu
- **Keyboard shortcut customization**: Full preferences system allowing users to enable/disable and customize any of 51 keyboard shortcuts with conflict detection and localStorage persistence
- **Smart export options**: All exports use document title for filename generation
- **Side-by-side markdown preview**: Real-time markdown rendering that automatically updates as you type, with Ctrl+M toggle
- **Professional interface**: Clean, modern design matching a traditional document editor aesthetic
- **Menu integration**: Seamlessly connects to existing WASM and collaboration features

### WASM-Powered Text Processing
- **Document compression**: 98% compression ratio using Rust WASM
- **Smart text formatting**: Auto-clean whitespace, headers, and code blocks
- **Markdown formatting buttons**: Bold, italic, underline with smart toggle
- **Live document statistics**: Real-time word count, character count, reading time
- **Client-side processing**: All text operations run in browser with near-native speed
- **Search**: Search functionality that highlights matches in the document

### PromiseGrid Protocol Integration
- **Real CBOR message generation**: Creates authentic PromiseGrid messages with official 'grid' tag (0x67726964)
- **Live protocol demonstration**: Every formatting action generates PromiseGrid messages
- **Decentralized messaging**: Protocol-compliant messages for distributed computing
- **Content-addressable data**: Document edits as PromiseGrid promises and capabilities
- **Export functionality**: Save documents as PromiseGrid CBOR files
- **Console logging**: Real-time display of PromiseGrid message creation

### Backend Support
- Optional Go or Rust backend support:
  - Go backend: Simple in-memory collaboration for legacy support
  - Rust backend: Fast document persistence, UUID-based room support, Markdown export
  - Menu system integration: All export formats accessible through File menu
  - Client-side processing: Most menu operations happen in browser without backend dependency

### Export Options
- Plain text
- CodeMirror state (JSON)
- PromiseGrid CBOR (protocol-compliant messages)
- Yjs snapshot (binary `.ysnap`)
- Yjs update (JSON array)

### GitHub Integration
- **Direct repository commits**: Commit documents directly from the editor
- **Pull from GitHub**: Import existing files from your repositories
- **Automatic co-author attribution**: All collaborators credited in commits
- **Token-based authentication**: Secure GitHub Personal Access Token integration
- **Repository management**: Browse and select from your GitHub repositories
- **File preview**: Preview files before pulling them into the editor
- **Commit history**: Track commits with links to view on GitHub
- **Settings persistence**: GitHub configuration saved locally
- **Menu integration**: Access via File menu or keyboard shortcuts (Ctrl+Alt+G)
- **Multi-user workflow**: Real-time collaboration with GitHub version control


## PromiseGrid Integration Highlights

This editor demonstrates **real PromiseGrid protocol implementation** through:

### Live Message Generation
Every user action creates authentic PromiseGrid CBOR messages:
```
 PromiseGrid CBOR message created: 193 bytes
 Created PromiseGrid message for bold edit
```

### Protocol Compliance
- **Official CBOR tag**: 0x67726964 ('grid')
- **Message structure**: Protocol hash + payload with message type and data
- **Capability-based design**: Ready for decentralized permission systems
- **Content-addressable**: Following PromiseGrid's storage model

### Message Types
- `document_edit` - Text formatting and editing operations
- `document_stats` - Live document statistics updates  
- `export` - Document export operations

See [docs/promisegrid-integration.md](docs/promisegrid-integration.md) for complete technical details.

---

## Getting Started

To launch the editor, open the application in your browser:

```
http://localhost:8080/
```

This creates a new document and updates the URL with a shareable document ID:

```
http://localhost:8080/?doc=automerge:2VJnuVxuBCphkYpucWZKziogaFBb
```

To collaborate, share the full URL with others. Anyone with the URL can edit the same document in real-time.

To create a new document, visit `http://localhost:8080/` without any parameters.

---

## How to Run

1. Clone the repository:

   ```bash
   git clone <your-repo-url>
   cd collab-editor
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Build WASM module (includes PromiseGrid functions):

   ```bash
   make wasm
   ```

4. Start the WebSocket server:

   ```bash
   make ws
   ```

5. In a separate terminal, start the dev server:

   ```bash
   make serve
   ```

6. Optional: Start the Rust backend:

   ```bash
   make run
   ```

7. Open your browser and visit:

   ```
   http://localhost:8080/
   ```

   A new document will be created automatically. Share the URL to collaborate.

8. **Check browser console** to see PromiseGrid messages being generated in real-time!

---

## Testing PromiseGrid Integration

Once running, you can verify PromiseGrid functionality:

1. **Open browser console** to see initialization messages
2. **Type and format text** - each action creates PromiseGrid messages  
3. **Export as PromiseGrid CBOR** from the dropdown menu
4. **Console testing**: Use exposed functions like `window.createPromiseGridMessage()`

Expected console output:
```
 PromiseGrid CBOR message created: 193 bytes
 PromiseGrid Message: { "protocol_hash": "QmPromiseGridProtocolV1", ... }
 Created PromiseGrid message for bold edit
```

---

## Makefile Usage

For advanced use and automation, see [docs/makefile-usage.md](docs/makefile-usage.md) for how to run the Go and Rust servers using `make`.

Key commands:
- `make wasm` - Build Rust WASM module with PromiseGrid functions
- `make dev-all` - Start complete development stack
- `make ws` - Start WebSocket server for collaboration
- `make serve` - Start frontend development server

---

## User Guide

Please see the [User Guide](docs/user-guide.md) for detailed usage instructions, UI explanations, and feature descriptions.

For information about document URLs and sharing, see [docs/user-docs.md](docs/user-docs.md).

---

## Tech Stack

### Core Technologies
- Automerge - Collaborative editing with CRDTs
- Automerge Repo - Repository system with networking and storage adapters
- CodeMirror 6 - Advanced text editing
- WebSocket - Real-time synchronization
- IndexedDB - Local document persistence
- Vanilla JS / HTML / CSS - Frontend

### Advanced Features
- **Rust WebAssembly (WASM)** - High-performance text processing + PromiseGrid protocol
- **PromiseGrid CBOR** - Decentralized computing messages
- **serde_cbor** - Protocol-compliant message encoding
- Go (optional backend for legacy and service compatibility)
- Rust (new backend for high-performance persistence and exports)

---

## Folder Structure

- `src/`: All core JavaScript logic
- `src/setup/`: Initialization modules (Automerge, editor, user)
- `src/export/`: Export handlers including PromiseGrid CBOR
- `src/wasm/`: WebAssembly integration and initialization
- `rust-wasm/`: Rust code compiled to WebAssembly (includes PromiseGrid functions)
- `rust-server/`: Rust backend server code
- `docs/`: Markdown documentation (includes user guide and other files)

---

## Documentation

### Core Documentation
- [User Guide](docs/user-guide.md) — How to use the editor and its features 
- [Document URLs](docs/user-docs.md) — How document IDs work and how to share documents
- [Github Integration](docs/github-integration.md) — How to connect to GitHub repositories
- [Formatting Spec](docs/formatting-spec.md) — Planned document structure and export formats
- [Rust Developer Notes](docs/rust-developer-notes.md) — Architecture and data flow for the Rust backend (for Go developers)
- [docs/makefile-usage.md](docs/makefile-usage.md) — How to use the Makefile for building and running the Rust or Go server
- [docs/project.md](docs/project.md) — Latest project overview and architecture 
- [docs/rust-wasm-features.md](docs/rust-wasm-features.md) — Features implemented in the Rust for WebAssembly 
- [docs/promisegrid-integration.md](docs/promisegrid-integration.md) — Complete PromiseGrid protocol implementation details, CBOR message structure, and integration guide
- [docs/editor-menu.md](docs/editor-menu.md) — Full list of menu features and keyboard shortcuts
- [docs/keyboard-preferences.md](docs/keyboard-preferences.md) — Complete guide to customizing keyboard shortcuts
- [docs/menu-development.md](docs/menu-development.md) — How to extend and add new menu features
- [docs/grokker-wasm.md](docs/grokker-wasm.md) — Grokker integration details for advanced text analysis (WASM-based) of commit messages
- [docs/diff-view.md](docs/diff-view.md) — How the diff view feature works 

---

## PromiseGrid Protocol Status

**Current Implementation**:  Functional CBOR message creation with official 'grid' tag  
**Integration Level**: Live message generation during collaborative editing  
**Protocol Compliance**: Authentic PromiseGrid message structure and encoding  
**Next Steps**: Network communication and decentralized node messaging  

This project demonstrates **real PromiseGrid protocol implementation** suitable for decentralized computing research and development.

---

## Contributions

This is a living demo extended for internal team use and PromiseGrid protocol research. Pull requests and suggestions are welcome, especially for advancing the decentralized computing capabilities.
