# Collaborative Text Editor (Yjs-Based + PromiseGrid)

This is a collaborative text editor demo based on the [Yjs collaborative editing framework](https://docs.yjs.dev/getting-started/a-collaborative-editor) with **PromiseGrid protocol integration**.  
It enables multiple users to edit shared text documents in real-time using WebSocket and local IndexedDB persistence, while also generating real PromiseGrid CBOR messages for decentralized computing demonstration.

This demo has been extended with additional features that are useful to teams, including user presence, logging, export options, document awareness, and **genuine PromiseGrid protocol messaging**.

---

## Features
### Core Collaboration
- Real-time collaborative editing
- Shared cursors and user awareness
- Custom usernames and color indicators
- Room-based collaboration via URL (e.g., `?room=my-team`)
- UUID-based room creation (see `docs/guid-rooms.md`)
- Typing indicators and presence tracking
- Toggleable user activity log
- Offline support with automatic syncing (via IndexedDB)

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

### Export Options
- Plain text
- CodeMirror state (JSON)
- **PromiseGrid CBOR** (protocol-compliant messages)
- Yjs snapshot (binary `.ysnap`)
- Yjs update (JSON array)

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
   http://localhost:8080/?room=my-room
   ```

   Replace `my-room` with any custom room name. If none is provided, a UUID will be generated.

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

For information about UUID-based rooms, see [docs/uuid-rooms.md](docs/uuid-rooms.md).

---

## Tech Stack

### Core Technologies
- Yjs - Collaborative editing with CRDTs
- y-websocket - Real-time synchronization
- y-indexeddb - Offline persistence
- CodeMirror 6 - Advanced text editing
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
- `src/setup/`: Initialization modules (Yjs, editor, user)
- `src/export/`: Export handlers including PromiseGrid CBOR
- `src/wasm/`: WebAssembly integration and initialization
- `src/export/`: Export handlers including PromiseGrid CBOR
- `rust-wasm/`: Rust code compiled to WebAssembly (includes PromiseGrid functions)
- `rust-server/`: Rust backend server code
- `docs/`: Markdown documentation (includes user guide and other files)

---

## Documentation

### Core Documentation
- [User Guide](docs/user-guide.md) — How to use the editor and its features (7/26/25)
- [UUID-Based Rooms](docs/uuid-rooms.md) — How room names are generated using UUIDs
- [Formatting Spec](docs/formatting-spec.md) — Planned document structure and export formats
- [Rust Developer Notes](docs/rust-developer-notes.md) — Architecture and data flow for the Rust backend (for Go developers)
- [docs/makefile-usage.md](docs/makefile-usage.md) — How to use the Makefile for building and running the Rust or Go server
- [docs/project.md](docs/project.md) — Latest project overview and architecture (7/26/25)
- [docs/rust-wasm-features.md](docs/rust-wasm-features.md) — Features implemented in the Rust for WebAssembly (7/26/25)
- **[docs/promisegrid-integration.md](docs/promisegrid-integration.md)** — Complete PromiseGrid protocol implementation details, CBOR message structure, and integration guide

---

## PromiseGrid Protocol Status

**Current Implementation**:  Functional CBOR message creation with official 'grid' tag  
**Integration Level**: Live message generation during collaborative editing  
**Protocol Compliance**: Authentic PromiseGrid message structure and encoding  
**Next Steps**: Network communication and decentralized node messaging  

This project demonstrates **real PromiseGrid protocol implementation** suitable for decentralized computing research and development.

### PromiseGrid Integration
- **[docs/promisegrid-integration.md](docs/promisegrid-integration.md)** — Complete PromiseGrid protocol implementation details, CBOR message structure, and integration guide

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
