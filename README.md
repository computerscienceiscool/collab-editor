# Collaborative Text Editor (Yjs-Based)

This is a collaborative text editor demo based on the [Yjs collaborative editing framework](https://docs.yjs.dev/getting-started/a-collaborative-editor).  
It enables multiple users to edit shared text documents in real-time using WebSocket and local IndexedDB persistence.

This demo has been extended with additional features that are useful to teams, including user presence, logging, export options, and document awareness.

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

### Backend Support
- Optional Go or Rust backend support:
  - Go backend: Simple in-memory collaboration for legacy support
  - Rust backend: Fast document persistence, UUID-based room support, Markdown export

### Export Options
- Plain text
- CodeMirror state (JSON)
- Yjs snapshot (binary `.ysnap`)
- Yjs update (JSON array)

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

3. Start the WebSocket server:

   ```bash
   npx y-websocket-server --port 1234
   ```

4. In a separate terminal, start the dev server:

   ```bash
   npm run dev
   ```

5. Start the Rust backend:

   ```bash
   cd rust-server
   cargo run
   ```

6. Open your browser and visit:

   ```
   http://localhost:8080/?room=my-room
   ```

   Replace `my-room` with any custom room name. If none is provided, a UUID will be generated.

---

## Makefile Usage

For advanced use and automation, see [docs/makefile-usage.md](docs/makefile-usage.md) for how to run the Go and Rust servers using `make`.

---

## User Guide

Please see the [User Guide](docs/user-guide.md) for detailed usage instructions, UI explanations, and feature descriptions.

For information about UUID-based rooms, see [docs/guid-rooms.md](docs/guid-rooms.md).

---

## Tech Stack

- Yjs
- y-websocket
- y-indexeddb
- CodeMirror 6
- Vanilla JS / HTML / CSS
- Rust WebAssembly (WASM) - Client-side text processing
- Go (optional backend for legacy and service compatibility)
- Rust (new backend for high-performance persistence and exports)

---

## Folder Structure

- `src/`: All core JavaScript logic
- `src/setup/`: Initialization modules (Yjs, editor, user)
- `src/ui/`: UI utilities (logging, presence, typing)
- `src/wasm/`: WebAssembly integration and initialization
- `rust-wasm/`: Rust code compiled to WebAssembly
- `rust-server/`: Rust backend server code
- `docs/`: Markdown documentation (includes user guide and other files)

---

## Documentation

- [User Guide](docs/user-guide.md) — How to use the editor
- [UUID-Based Rooms](docs/uuid-rooms.md) — How room names are generated using UUIDs
- [Formatting Spec](docs/formatting-spec.md) — Planned document structure and export formats
- [Rust Developer Notes](docs/rust-developer-notes.md) — Architecture and data flow for the Rust backend (for Go developers)
- [docs/makefile-usage.md](docs/makefile-usage.md) — How to use the Makefile for building and running the Rust or Go server
- [docs/project.md](docs/project.md) — Latest project overview and architecture 
- [docs/rust-wasm-features.md](docs/rust-wasm-features.md) — Features implemented in the Rust for WebAssembly (7/19/25)

---

## Contributions

This is a living demo extended for internal team use. Pull requests and suggestions are welcome.
