# Rust Developer Notes for Collaborative Editor

This document explains the Rust components of the collaborative editor project for team members who are familiar with Go but new to Rust. It outlines the purpose, structure, and data flow of the Rust backend used in this project.

---

## Purpose of the Rust Backend

The Rust server replaces the original Go backend. It is responsible for:

- Serving the HTTP API (e.g., `/load`, `/save`)
- Reading/writing document data to disk
- Supporting future JSON and Markdown export features
- Eventually managing file versioning and GUID naming

---

## Comparison: Go vs Rust in This Project

| Feature                  | Go                          | Rust                           |
|--------------------------|-----------------------------|--------------------------------|
| Main HTTP framework      | net/http                    | actix-web                      |
| HTTP routing             | Mux-style handlers          | Actix App + route macros       |
| JSON parsing             | encoding/json               | serde + serde_json             |
| File I/O                 | ioutil / os                 | std::fs                        |
| Concurrency model        | goroutines                  | async/await (tokio runtime)    |
| Error handling           | Multiple return + `error`   | `Result<T, E>` + `?` operator  |

---

## Rust Project Layout

```
rust-server/
├── Cargo.toml           # Dependencies and metadata
└── src/
    └── main.rs          # Server entry point
```

---

## Data Flow

When a browser hits `/load`:

1. `main.rs` routes the request to `handlers::load_document`.
2. `load_document` calls `storage::load_from_file`.
3. File contents are read from disk (e.g. `docs/doc.yjs`) and returned.
4. Response is serialized to JSON and sent back to the client.

When the browser sends a `POST` to `/save`:

1. `main.rs` routes to `handlers::save_document`.
2. The payload is deserialized into a `Document` model.
3. The document is written to disk via `storage::save_to_file`.
4. The server returns HTTP 200 on success.

---

## Notes for Go Developers

- `actix_web::App` is like `http.ServeMux`.
- `serde::Deserialize` is like Go structs with JSON tags.
- The Rust `?` operator is similar to Go's early `return err`.
- `tokio` provides async support—similar to goroutines, but explicitly declared.

---

## Next Steps (Rust Backend)

- [ ] Add Markdown export to `/export`
- [ ] Support UUID-based filenames on save/load
- [ ] Add `/health` endpoint
- [ ] Return revision metadata in responses

---

This file is meant to help Go developers get up to speed on the Rust components.
