# Architecture Overview

This document explains the technical architecture of the collaborative text editor, focusing on how the components work together. It is intended for developers and LLMs who need to understand the system to make changes.

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Browser (Client)                        │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  CodeMirror │  │  Automerge  │  │   WASM (Rust)       │  │
│  │   Editor    │◄─┤   Handle    │  │   Text Processing   │  │
│  │             │  │             │  │   PromiseGrid CBOR  │  │
│  └─────────────┘  └──────┬──────┘  └─────────────────────┘  │
│                          │                                   │
│                   ┌──────┴──────┐                            │
│                   │  Automerge  │                            │
│                   │    Repo     │                            │
│                   └──────┬──────┘                            │
│                          │                                   │
│         ┌────────────────┼────────────────┐                  │
│         │                │                │                  │
│         ▼                ▼                ▼                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │  WebSocket  │  │  IndexedDB  │  │  WebSocket  │          │
│  │  Adapter    │  │   Storage   │  │  Awareness  │          │
│  │  (Sync)     │  │   Adapter   │  │  (Custom)   │          │
│  └──────┬──────┘  └─────────────┘  └──────┬──────┘          │
└─────────┼─────────────────────────────────┼─────────────────┘
          │                                 │
          ▼                                 ▼
   ┌─────────────┐                   ┌─────────────┐
   │  Automerge  │                   │  Awareness  │
   │ Sync Server │                   │   Server    │
   │  Port 1234  │                   │  Port 1235  │
   └─────────────┘                   └─────────────┘
```

---

## Core Components

### 1. Automerge Repository (`src/setup/automergeSetup.js`)

The Automerge Repo is the central hub for document management.

```javascript
import { Repo } from '@automerge/automerge-repo';
import { BrowserWebSocketClientAdapter } from '@automerge/automerge-repo-network-websocket';
import { IndexedDBStorageAdapter } from '@automerge/automerge-repo-storage-indexeddb';

const repo = new Repo({
  network: [new BrowserWebSocketClientAdapter('ws://localhost:1234')],
  storage: new IndexedDBStorageAdapter('automerge'),
});
```

**Key concepts:**
- **Repo**: Manages all documents, handles sync and storage
- **Network Adapter**: Connects to sync server for real-time collaboration
- **Storage Adapter**: Persists documents to IndexedDB

### 2. Document Handle

A handle is a reference to a specific Automerge document.

```javascript
// Creating a new document
const handle = repo.create();
handle.change(d => {
  d.content = "";  // Initialize with empty string
});

// Loading an existing document
const handle = await repo.find(documentId);  // Note: returns Promise!
```

**Critical API details:**
- `repo.create()` - Returns handle synchronously
- `repo.find(id)` - Returns **Promise** that resolves to handle (must await!)
- `handle.doc()` - Get current document state
- `handle.change(callback)` - Modify document
- `handle.documentId` - The unique document identifier

### 3. Document Structure

Documents are simple JavaScript objects:

```javascript
{
  content: "The document text content here..."
}
```

**Text operations use `Automerge.updateText()`:**
```javascript
import { updateText } from '@automerge/automerge';

handle.change(d => {
  updateText(d, ['content'], newText);
});
```

---

## URL Scheme

### Document URLs

```
http://localhost:8080/?doc=P8ikUBLFpvXuVSCVWyiBec9U54Y
```

- **No parameter**: Creates new document, URL updates with new ID
- **`?doc=ID`**: Loads existing document with that ID

### URL Parsing (`src/app.js`)

```javascript
const urlParams = new URLSearchParams(window.location.search);
const docParam = urlParams.get('doc');

if (docParam) {
  // Load existing document
  handle = await repo.find(docParam);
} else {
  // Create new document
  handle = repo.create();
  // Update URL
  window.history.replaceState(null, '', `?doc=${handle.documentId}`);
}
```

---

## Global Variables

These are exposed on `window` for debugging and cross-module access:

| Global | Type | Description |
|--------|------|-------------|
| `window.automergeRepo` | Repo | The Automerge repository instance |
| `window.automergeHandle` | DocHandle | Handle to current document |
| `window.editorView` | EditorView | CodeMirror editor instance |
| `window.awareness` | Object | Custom awareness state manager |

**Usage in browser console:**
```javascript
// Get current document
const doc = window.automergeHandle.doc();
console.log(doc.content);

// Get document ID
console.log(window.automergeHandle.documentId);

// Check available methods on handle
Object.getOwnPropertyNames(Object.getPrototypeOf(window.automergeHandle));
```

---

## Editor Integration (`src/setup/editorSetup.js`)

### Editor → Automerge (Local Changes)

```javascript
EditorView.updateListener.of((update) => {
  if (update.docChanged && !isRemoteChange) {
    const newText = update.state.doc.toString();
    handle.change(d => {
      updateText(d, ['content'], newText);
    });
  }
});
```

### Automerge → Editor (Remote Changes)

```javascript
handle.on('change', ({ doc }) => {
  const remoteText = doc.content || '';
  const currentText = view.state.doc.toString();
  
  if (remoteText !== currentText) {
    isRemoteChange = true;
    view.dispatch({
      changes: {
        from: 0,
        to: currentText.length,
        insert: remoteText
      }
    });
    isRemoteChange = false;
  }
});
```

**Important:** The `isRemoteChange` flag prevents infinite loops where a remote change triggers a local change event.

---

## Networking

### Port Configuration

| Port | Service | Protocol | Purpose |
|------|---------|----------|---------|
| 1234 | Automerge Sync Server | CBOR (binary) | Document synchronization |
| 1235 | Awareness Server | JSON (text) | User presence, cursors, typing |
| 3000 | Rust Backend | HTTP | Optional persistence, exports |
| 8080 | Vite Dev Server | HTTP | Frontend development |

### Sync Server (Port 1234)

Official Automerge sync server:
```bash
npx @automerge/automerge-repo-sync-server
```

- Uses CBOR binary protocol
- Handles document sync between all connected clients
- Stateless relay (documents stored in client IndexedDB)

### Awareness Server (Port 1235)

Custom WebSocket relay (`awareness-server.js`):
```javascript
// Simple broadcast to all clients
ws.on('message', (message) => {
  clients.forEach(client => {
    if (client !== ws && client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
});
```

- Uses JSON text protocol
- Broadcasts user presence info (name, color, cursor, typing state)
- Separate from sync because protocols are incompatible

---

## Storage

### IndexedDB Structure

- **Database name**: `automerge`
- **Object store**: `documents`
- **Content**: Automerge binary document data

### Persistence Flow

1. User makes edit
2. Automerge creates change operation
3. Change synced to server (port 1234)
4. Change saved to IndexedDB (automatic via storage adapter)
5. On page reload, document loads from IndexedDB first, then syncs

---

## WASM Integration (`src/wasm/initWasm.js`)

Rust-compiled WebAssembly provides:
- Text formatting (bold, italic, underline toggles)
- Document statistics (word count, reading time)
- Document compression
- PromiseGrid CBOR message creation

```javascript
import init, {
  toggle_bold,
  toggle_italic,
  calculate_document_stats,
  create_promisegrid_edit_message
} from '../rust-wasm/pkg/rust_wasm.js';

await init();  // Initialize WASM module
```

---

## Data Flow Examples

### Creating a New Document

```
1. User visits http://localhost:8080/
2. app.js: No ?doc= param detected
3. automergeSetup.js: repo.create() creates new document
4. automergeSetup.js: handle.change() initializes content = ""
5. app.js: URL updated to ?doc=ABC123...
6. editorSetup.js: CodeMirror initialized with empty content
7. IndexedDB: Document saved automatically
8. Sync server: Document announced to network
```

### Loading Existing Document

```
1. User visits http://localhost:8080/?doc=ABC123
2. app.js: ?doc=ABC123 param detected
3. automergeSetup.js: await repo.find("ABC123")
4. Automerge: Checks IndexedDB first, then sync server
5. handle.doc() returns document content
6. editorSetup.js: CodeMirror initialized with content
7. User sees document
```

### Collaborative Edit

```
User A types "Hello"
    │
    ▼
CodeMirror fires update event
    │
    ▼
editorSetup.js: handle.change() with new text
    │
    ▼
Automerge creates operation
    │
    ├──────────────────────────┐
    ▼                          ▼
IndexedDB save            WebSocket send
                               │
                               ▼
                        Sync Server (1234)
                               │
                               ▼
                        Broadcast to User B
                               │
                               ▼
                        User B's Automerge receives
                               │
                               ▼
                        handle.on('change') fires
                               │
                               ▼
                        CodeMirror updates
                               │
                               ▼
                        User B sees "Hello"
```

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `src/app.js` | Main initialization, URL parsing, orchestration |
| `src/setup/automergeSetup.js` | Automerge repo, handle, awareness setup |
| `src/setup/editorSetup.js` | CodeMirror ↔ Automerge integration |
| `src/setup/userSetup.js` | User name/color management |
| `src/export/handlers.js` | Export functionality (txt, json, cbor, etc.) |
| `src/wasm/initWasm.js` | WASM module initialization |
| `src/ui/userList.js` | Active users display |
| `src/ui/typingIndicator.js` | Typing status display |
| `awareness-server.js` | Custom WebSocket server for user presence |
| `index.html` | Main UI, MenuSystem class, inline scripts |

---

## Common Patterns

### Checking Document Ready

```javascript
// Wait for document to be ready after repo.find()
const handle = await repo.find(documentId);
await handle.whenReady();
const doc = handle.doc();
```

### Safe Document Access

```javascript
const doc = window.automergeHandle?.doc();
if (!doc) {
  console.error('Document not loaded');
  return;
}
const content = doc.content || '';
```

### Exporting Document Binary

```javascript
import { save } from '@automerge/automerge';

const doc = window.automergeHandle.doc();
const binary = save(doc);  // Returns Uint8Array
```

---

## Troubleshooting

### Document Not Loading

1. Check sync server running: `lsof -i:1234`
2. Check browser console for WebSocket errors
3. Verify document ID in URL is correct
4. Check IndexedDB in DevTools → Application → IndexedDB → automerge

### Changes Not Syncing

1. Verify both users have same document URL
2. Check sync server logs
3. Look for `isRemoteChange` flag issues in editorSetup.js
4. Confirm WebSocket connected in Network tab

### Handle Methods Not Available

If `handle.whenReady is not a function`:
- You may have the wrong object type
- `repo.find()` returns a Promise - make sure you `await` it

---

## Version Information

- **Automerge**: @automerge/automerge 2.x
- **Automerge Repo**: @automerge/automerge-repo
- **CodeMirror**: 6.x
- **Vite**: Build tooling
- **Node.js**: 14+

---

## Related Documentation

- [user-docs.md](docs/user-docs.md) - Document URLs and sharing
- [promisegrid-collab-editor.md](docs/promisegrid-collab-editor.md) - PromiseGrid integration details
- [project.md](docs/project.md) - Project overview
- [makefile-usage.md](docs/makefile-usage.md) - Development commands
