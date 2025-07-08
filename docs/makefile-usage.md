
# Makefile Reference for Collaborative Editor

This document explains the available `make` targets used to run and manage the collaborative editor project.

---

## Available Commands

| Command         | Description                                                  |
|----------------|--------------------------------------------------------------|
| `make dev`     | Start the frontend dev server using Vite (`localhost:8080`)  |
| `make ws`      | Launch the Yjs WebSocket server on port `1234`               |
| `make rust`    | Run the Rust backend server (`rust-server/`)                 |
| `make go`      | Run the legacy Go backend (`main.go`)                        |

> The frontend expects a backend to be running on `localhost:3000`.

---

## Example Workflows

### Using the Rust Backend

```bash
make ws        # Start WebSocket server
make rust      # Start Rust backend server
make dev       # Start frontend
```

### Using the Go Backend

```bash
make ws        # Start WebSocket server
make go        # Start Go backend server
make dev       # Start frontend
```

---

## Notes

- You may run the commands in separate terminals or background them with `&`.
- The Rust backend is preferred going forward, but the Go version is kept for compatibility.

---

