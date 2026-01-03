# Collaborative Text Editor (Automerge-Based + PromiseGrid)

This is a collaborative text editor demo migrating from Yjs to [Automerge CRDT](https://automerge.org/) with **PromiseGrid protocol integration**.  
It enables multiple users to edit shared text documents in real-time using WebSocket and local IndexedDB persistence, while also generating real PromiseGrid CBOR messages for decentralized computing demonstration.

This demo has been extended with additional features that are useful to teams, including user presence, logging, export options, document awareness, and **genuine PromiseGrid protocol messaging**.

---

## Recent Changes

### Migration from Yjs to Automerge (January 2026)
The editor has been migrated from Yjs to Automerge CRDT for improved conflict-free replication and alignment with PromiseGrid's decentralized architecture.

**Key Changes:**
- **CRDT Library**: Migrated from Yjs to Automerge 2.2.8 / Automerge Repo 2.5.1
- **Room-Based Collaboration**: Implemented registry document system for room name to document ID mapping
- **Storage**: Uses IndexedDB for local persistence via `@automerge/automerge-repo-storage-indexeddb`
- **Network Sync**: WebSocket sync on port 1234 (CBOR protocol), awareness on port 1235 (JSON protocol)
- **Text Operations**: All text modifications use `Automerge.updateText()` for proper CRDT merging

**Breaking Changes:**
- Room URLs remain the same (`?room=name`), but underlying document IDs are now Automerge format
- Old Yjs IndexedDB databases are no longer used (documents stored in new `automerge` database)

**Architecture Documentation:**
- See `docs/promisegrid-collab-editor.md` for complete Automerge architecture
- See `docs/registry.md` for room mapping implementation details
- See `docs/room-mapping.md` for deterministic document ID strategy

---

## Features
### Core Collaboration
- Real-time collaborative editing with Automerge CRDT
- Shared cursors and user awareness
- Custom usernames and color indicators
- Room-based collaboration via URL (e.g., `?room=my-team`)
- UUID-based room creation
- Typing indicators and presence tracking
- Toggleable user activity log
- Offline support with automatic syncing (via IndexedDB)
- Conflict-free merging of concurrent edits

### Document Style Menu System
- **Complete menu bar**: File, Edit, Format, Tools, View, and Help menus
- **Over 30 menu features**: Many implemented features and several planned for future releases
- **Opt-in keyboard shortcuts**: Only basic editing shortcuts (Ctrl+C, Ctrl+V, Ctrl+X) enabled by default, with 20+ additional shortcuts available
- **Keyboard shortcut customization**: Full preferences system with conflict detection and localStorage persistence
- **Smart export options**: All exports use document title for filename generation
- **Side-by-side markdown preview**: Real-time markdown rendering with Ctrl+M toggle
- **Professional interface**: Clean, modern design matching a traditional document editor

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
- Automerge snapshot (binary)
- Automerge document export

### GitHub Integration
- **Direct repository commits**: Commit documents directly from the editor
- **Pull from GitHub**: Import existing files from your repositories
- **Automatic co-author attribution**: All collaborators credited in commits
- **Token-based authentication**: Secure GitHub Personal Access Token integration
- **Repository management**: Browse and select from your GitHub repositories
- **Settings persistence**: GitHub configuration saved locally
- **Multi-user workflow**: Real-time collaboration with GitHub version control

---

## Getting Started

To launch the editor, open the application in your browser. You can specify a custom room in the URL like this:

```
http://localhost:8080/?room=your-room-name
```

This creates or joins a shared editing space named `your-room-name`.

If no room is specified, a globally unique room name (UUID) will be generated automatically. You can share the resulting URL with others to collaborate in the same document.

Example:
```
http://localhost:8080/?room=b51f0dd8-bc93-4a3d-a0e5-417a8ac812c4
```

---

## How to Run

1. Clone the repository:

   ```bash
   git clone https://github.com/your-org/collab-editor.git
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

4. Start all services:

   ```bash
   make dev-all
   ```

   This starts:
   - Automerge sync server (port 1234)
   - Awareness server (port 1235)
   - Rust backend (port 3000)
   - Vite dev server (port 8080)

5. Open your browser and visit:

   ```
   http://localhost:8080/?room=my-room
   ```

6. **Check browser console** to see PromiseGrid messages and Automerge sync logs!

---

## Makefile Usage

For advanced use and automation, see [docs/makefile-usage.md](docs/makefile-usage.md).

Key commands:
- `make dev-all` - Start complete development stack (sync, awareness, backend, frontend)
- `make stop` - Stop all running services
- `make wasm` - Build Rust WASM module with PromiseGrid functions
- `make ws` - Start Automerge sync server (port 1234)
- `make awareness` - Start awareness server (port 1235)
- `make serve` - Start frontend development server (port 8080)
- `make run` - Start Rust backend (port 3000)

---

## Tech Stack

### Core Technologies
- **Automerge 2.2.8** - Conflict-free replicated data type (CRDT) for collaborative editing
- **Automerge Repo 2.5.1** - Repository system with networking and storage adapters
- **CodeMirror 6** - Advanced text editing component
- **WebSocket** - Real-time synchronization (CBOR protocol on port 1234)
- **IndexedDB** - Local document persistence
- **Vanilla JS / HTML / CSS** - Frontend

### Advanced Features
- **Rust WebAssembly (WASM)** - High-performance text processing + PromiseGrid protocol
- **PromiseGrid CBOR** - Decentralized computing messages
- **serde_cbor** - Protocol-compliant message encoding
- Go (optional backend for legacy compatibility)
- Rust (backend for high-performance persistence)

---

## Folder Structure

- `src/`: All core JavaScript logic
- `src/setup/`: Initialization modules (Automerge, editor, user, registry)
- `src/export/`: Export handlers including PromiseGrid CBOR
- `src/wasm/`: WebAssembly integration and initialization
- `rust-wasm/`: Rust code compiled to WebAssembly (includes PromiseGrid functions)
- `rust-server/`: Rust backend server code
- `docs/`: Markdown documentation

---

## Documentation

### Core Documentation
- [User Guide](docs/user-guide.md) — How to use the editor and its features
- [PromiseGrid Collab Editor](docs/promisegrid-collab-editor.md) — Automerge architecture and integration
- [Registry System](docs/registry.md) — Room-based document mapping implementation
- [Room Mapping Strategy](docs/room-mapping.md) — Deterministic document ID generation
- [GitHub Integration](docs/github-integration.md) — How to connect to GitHub repositories
- [Formatting Spec](docs/formatting-spec.md) — Planned document structure and export formats
- [Makefile Usage](docs/makefile-usage.md) — How to use the Makefile for building and running servers
- [PromiseGrid Integration](docs/promisegrid-integration.md) — Complete PromiseGrid protocol implementation details
- [Editor Menu](docs/editor-menu.md) — Full list of menu features and keyboard shortcuts
- [Keyboard Preferences](docs/keyboard-preferences.md) — Complete guide to customizing keyboard shortcuts

---

## Troubleshooting

### Document Content Not Persisting After Refresh

**Symptom**: You type content in the editor, but when you refresh the page, the content disappears and the document is empty.

**Status**: Known issue under active investigation (as of January 2026).

**What We Know**:
- Documents ARE being saved to IndexedDB (visible in Chrome DevTools > Application > IndexedDB > automerge > documents)
- Registry system works correctly (room names map to consistent document IDs across refreshes)
- Document IDs remain the same before and after refresh
- Storage adapter is properly configured (`IndexedDBStorageAdapter`)
- The issue appears to be timing-related: documents load from storage but show as "not ready" when accessed

**Root Cause**: When `repo.find()` loads a document from IndexedDB on page refresh, the returned `DocHandle` shows "DocHandle is not ready" errors when trying to access `handle.doc()`. This suggests the document is loading asynchronously but the handle is being accessed before load completes.

**Attempted Fixes**:
1. Added 500ms wait after loading existing documents
2. Used `repo.import()` with deterministic IDs for registry
3. Verified storage adapter configuration
4. Confirmed document binary exists in IndexedDB

**Current Workaround**: None. Content does not persist across page refreshes.

**Next Steps to Try**:
1. Increase wait time in `automergeSetup.js` from 500ms to 2000ms
2. Use `repo.find()` with progress monitoring via `findWithProgress()`
3. Listen for storage subsystem events before accessing document
4. Test with BroadcastChannel adapter (local-only) to isolate network vs storage issues

**Debug Commands**:
```javascript
// Check if storage adapter exists
window.automergeRepo.storageSubsystem

// Check document in IndexedDB
const req = indexedDB.open('automerge');
req.onsuccess = (e) => {
  const db = e.target.result;
  const tx = db.transaction('documents', 'readonly');
  console.log('Documents:', tx.objectStore('documents'));
};

// View registry
window.debugRegistry()

// Check document ID consistency
console.log('Current doc ID:', window.automergeHandle.documentId)
```

### Sync Server Errors: Invalid AutomergeUrl

**Symptom**: Terminal shows errors like `Invalid AutomergeUrl: 'automerge:automerge:...'` (double prefix)

**Cause**: The registry document ID generation returns just the hash, but `repo.find()` expects the full `automerge:` prefixed URL. This causes a mismatch where the client sends the wrong format to the sync server.

**Fix**: In `registry.js`, ensure:
- `generateRegistryId()` returns just the base58 hash
- Store `const REGISTRY_DOC_ID = \`automerge:${hash}\`` for use with `repo.find()`
- Use just the hash with `repo.import({ docId: hash })`

### Port Conflicts (EADDRINUSE)

**Symptom**: `make dev-all` fails with "address already in use" errors

**Solution**:
```bash
# Kill all services
lsof -ti:1234 | xargs kill -9  # Sync server
lsof -ti:1235 | xargs kill -9  # Awareness server
lsof -ti:3000 | xargs kill -9  # Rust backend
lsof -ti:8080 | xargs kill -9  # Vite dev server

# Or use make stop (if it works)
make stop

# Then restart
make dev-all
```

### CBOR vs JSON Protocol Mixing

**Issue**: Automerge sync (port 1234) uses CBOR binary protocol. Awareness (port 1235) uses JSON text protocol. They cannot share the same port.

**Verification**: Check `src/config.js` - ports should be:
- Automerge sync: 1234
- Awareness: 1235

### Text Not Syncing Between Tabs

**Check**:
1. Are both tabs using the same room name?
2. Is the sync server running? (`make ws` or check port 1234)
3. Check browser console for WebSocket connection messages
4. Verify `window.debugRegistry()` shows the same document ID in both tabs

---

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

## PromiseGrid Protocol Status

**Current Implementation**: Functional CBOR message creation with official 'grid' tag  
**Integration Level**: Live message generation during collaborative editing  
**Protocol Compliance**: Authentic PromiseGrid message structure and encoding  
**CRDT Layer**: Automerge for conflict-free replication  
**Next Steps**: 
- Resolve document persistence issues
- Integrate with PromiseBase for content-addressable storage
- Network communication with decentralized nodes

This project demonstrates **real PromiseGrid protocol implementation** suitable for decentralized computing research and development.

---

## Contributions

This is a living demo extended for internal team use and PromiseGrid protocol research. Pull requests and suggestions are welcome, especially for advancing the decentralized computing capabilities and resolving the document persistence issues.

---

