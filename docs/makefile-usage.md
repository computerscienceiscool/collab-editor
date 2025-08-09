
# Makefile Reference for Collaborative Editor

This document explains how to use the Makefile to install dependencies, run development services, and manage the collaborative editor project.

---

## Available Commands

| Command          | Description                                                                 |
|------------------|-----------------------------------------------------------------------------|
| `make install`   | Install all frontend dependencies using npm                                 |
| `make build`     | Build the frontend using Vite                                               |
| `make serve`     | Start the Vite development server at `http://localhost:8080`                |
| `make ws`        | Start the Yjs WebSocket server at `ws://localhost:1234`                     |
| `make run`       | Run the **Rust** backend (`cd rust-server && cargo run`)                   |
| `make run-go`    | Run the **Go** backend (`go run main.go`)                                  |
| `make run-rust`  | Same as `make run`, starts Rust backend                                     |
| `make restart`   | Kill any process occupying frontend or websocket ports                      |
| `make all`       | Install, build, restart, and run WebSocket + Rust backend                   |
| `make start`     | Restart and run frontend + websocket server (no backend)                    |
| `make stop`      | Kill any process on frontend or WebSocket ports                             |
| `make open-room` | Open a browser tab with a new UUID-based room (for testing)                 |
| `make clean`     | Delete `node_modules`, `dist`, and lockfiles                                |
| `make rebuild`   | Clean, reinstall, and rebuild the frontend                                  |

---

## WASM Development Commands

| Command            | Description                                                               |
|--------------------|---------------------------------------------------------------------------|
| `make wasm`        | Build Rust WASM module (includes PromiseGrid protocol functions)         |
| `make wasm-clean`  | Clean WASM build artifacts                                                |
| `make wasm-rebuild`| Clean rebuild of WASM module                                              |

The WASM module includes both text processing functions and PromiseGrid protocol integration. After running `make wasm`, the browser console will show PromiseGrid test messages during initialization.

---

## Example Workflows

### ▶ Using the Rust Backend (recommended)

```bash
make wasm       # Build WASM module with PromiseGrid functions
make ws         # Start WebSocket server (Yjs sync)
make run        # Start Rust backend (in rust-server/)
make serve      # Start frontend at http://localhost:8080
```

You may run each in a separate terminal, or background processes with `&`.

### ▶ Using the Go Backend (legacy)

```bash
make wasm       # Build WASM module
make ws         # Start WebSocket server
make run-go     # Start Go backend (main.go)
make serve      # Start frontend
```

### ▶ Full Development Stack

```bash
make dev-all    # Start everything: WebSocket + Rust backend + frontend + open browser
```

This command automatically:
1. Stops any existing processes on development ports
2. Starts WebSocket server and Rust backend in background
3. Starts frontend development server
4. Opens a browser tab with a new UUID room

---

## Testing PromiseGrid Integration

After starting the development environment, you can verify PromiseGrid functionality:

### Console Output Verification
1. Open browser developer tools (F12)
2. Look for initialization messages:
   ```
   PromiseGrid CBOR message created: 193 bytes
   PromiseGrid Message: { "protocol_hash": "QmPromiseGridProtocolV1", ... }
   ```

### Live Message Testing
1. **Type text** and apply formatting (Bold, Italic, Format buttons)
2. **Check console** for PromiseGrid message creation:
   ```
   Created PromiseGrid message for bold edit
   ```

### Export Testing
1. **Select "PromiseGrid CBOR (.cbor)"** from export dropdown
2. **Click Save** to download protocol-compliant CBOR file
3. **Check console** for export confirmation messages

---

## Open a Random Room

This opens a unique UUID-based room in your browser (useful for isolated sessions):

```bash
make open-room
```

It launches a tab like:

```
http://localhost:8080/?room=3ec0ae92-189d-4ff5-8df3-c41ec1ff7dc7
```

---

## Development Notes

### WASM Module Build Process
The `make wasm` command runs:
```bash
cd rust-wasm && wasm-pack build --target web --out-dir pkg
```

This generates:
- `pkg/rust_wasm.js` - JavaScript bindings for text processing and PromiseGrid functions
- `pkg/rust_wasm_bg.wasm` - WebAssembly binary with compiled Rust code
- `pkg/rust_wasm.d.ts` - TypeScript definitions

### PromiseGrid Dependencies
The WASM build includes these Rust crates for PromiseGrid integration:
- `serde` - Data structure serialization
- `serde_cbor` - CBOR encoding for PromiseGrid protocol
- `serde_json` - JSON serialization for debugging

### Console Output Changes
With PromiseGrid integration, console output now includes:
- **Initialization**: PromiseGrid CBOR test messages on page load
- **Live messaging**: Protocol message creation during editing
- **Export confirmation**: CBOR file generation messages

---

## Notes

- `make run` and `make run-rust` are equivalent. Rust is now the preferred backend.
- Ports `8080` and `1234` must be free; use `make restart` or `make stop` if needed.
- **WASM module must be built** before starting development servers for full functionality.
- This setup assumes:
  - Frontend is served by Vite
  - WebSocket server is used for collaborative sync
  - Backend handles save/load/export
  - **WASM module provides text processing and PromiseGrid protocol functions**
- The backend must run on `localhost:3000` by default for the frontend to work properly.
- **PromiseGrid messages are visible in browser console** during all formatting operations.

