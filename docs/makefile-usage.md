
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
| `make open-room` | Open a browser tab with a new GUID-based room (for testing)                 |
| `make clean`     | Delete `node_modules`, `dist`, and lockfiles                                |
| `make rebuild`   | Clean, reinstall, and rebuild the frontend                                  |

---

## Example Workflows

### ▶ Using the Rust Backend (recommended)

```bash
make ws         # Start WebSocket server (Yjs sync)
make run        # Start Rust backend (in rust-server/)
make serve      # Start frontend at http://localhost:8080
```

You may run each in a separate terminal, or background processes with `&`.

### ▶ Using the Go Backend (legacy)

```bash
make ws         # Start WebSocket server
make run-go     # Start Go backend (main.go)
make serve      # Start frontend
```

---

## Open a Random Room

This opens a unique GUID-based room in your browser (useful for isolated sessions):

```bash
make open-room
```

It launches a tab like:

```
http://localhost:8080/?room=3ec0ae92-189d-4ff5-8df3-c41ec1ff7dc7
```

---

## Notes

- `make run` and `make run-rust` are equivalent. Rust is now the preferred backend.
- Ports `8080` and `1234` must be free; use `make restart` or `make stop` if needed.
- This setup assumes:
  - Frontend is served by Vite
  - WebSocket server is used for collaborative sync
  - Backend handles save/load/export
- The backend must run on `localhost:3000` by default for the frontend to work properly.

