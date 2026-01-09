# Repository Guidelines

## Project Structure & Module Organization
- `src/` is the browser app (Automerge + CodeMirror) bundled by Vite.
- `public/` holds static assets; `dist/` is Vite build output (ignored).
- `rust-server/` is the Rust backend (`cargo run`) started via `make run`.
- `rust-wasm/` contains Rust WASM built with `wasm-pack` (outputs to `rust-wasm/pkg/`).
- `main.go` is an optional Go backend; other Go tools/prototypes live in `go-diff/` and `v3/`.
- `nvim/` contains the Neovim plugin and helper binaries.
- `tests/` contains Playwright suites; `docs/` contains architecture and usage documentation.
- `x/` (if present) is reserved for experimental prototypes.

## Build, Test, and Development Commands
- Install JS dependencies: `make install` (runs `npm install`).
- Build WASM: `make wasm` (Rust) or `make wasm-all` (all modules).
- Run locally (recommended): `make dev-all` (sync server + awareness + Rust backend + Vite).
- Run services individually: `make serve` (http://localhost:8080), `make ws` (ws://localhost:1234), `make run` (http://localhost:3000).
- Run tests: `make test` (unit + Rust + Go) or `npm test`; for e2e: `npm run test:e2e`.

## Coding Style & Naming Conventions
- JavaScript: use `npm run format` (Prettier) and `npm run lint` (ESLint).
- Go: run `gofmt` on all `.go` files; keep package names short and lower-case.
- Rust: use `cargo fmt` and keep changes small and focused.

## Testing Guidelines
- Unit tests: Vitest under `src/` (`npm run test:unit`).
- Browser/integration tests: Playwright under `tests/` (`npm run test:integration`, `npm run test:e2e`).
- Go tests use the standard `testing` package (`*_test.go`); table-driven patterns are preferred where helpful.
- Coverage: run `npm run test:coverage`; add/extend tests alongside new features.
- Keep tests deterministic; avoid network calls unless explicitly required.

## TODO Tracking
- Track work in `TODO/` with an index at `TODO/TODO.md`.
- Number TODOs `001`, `002`, …; don’t renumber; sort the index by priority; mark completion by appending `DONE` after the number.

## Commit & Pull Request Guidelines
- Commit subjects are short and imperative; history commonly uses optional prefixes like `docs:`/`chore:` (e.g., `docs: Remove Yjs references...`, `Fix ...`).
- Prefer one logical change per PR, include test commands run, and link relevant issues/docs (screenshots for UI changes).
- `make commit` runs `grok commit` to generate a message and pushes to the current branch—review the output before using.

## Local State & Generated Files
- Don’t commit local state or generated artifacts (see `.gitignore`), including `.grok`, `.aidda/`, `node_modules/`, `dist/`, `rust-wasm/pkg/`, and `rust-server/target/`.
