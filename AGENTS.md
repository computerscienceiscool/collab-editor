# Repository Guidelines

## Project Structure & Module Organization
- `src/` is the browser app (Automerge + CodeMirror) bundled by Vite.
- `public/` holds static assets; `dist/` is Vite build output (ignored).
- `rust-server/` is the Rust backend (`cargo run`) started via `make run`.
- `rust-wasm/` contains Rust WASM built with `wasm-pack` (outputs to `rust-wasm/pkg/`).
- `main.go` is an optional Go backend; other Go tools/prototypes live in `go-diff/` and `v3/`.
- Neovim plugin moved to separate repo: [github.com/computerscienceiscool/vimbeam](https://github.com/computerscienceiscool/vimbeam)
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
- Preferred: track work in `TODO/` with an index at `TODO/TODO.md` (number `001`, `002`, …; don’t renumber; sort by priority).
- Mark completion with checkboxes (e.g., `- [ ] 005 - ...` → `- [x] 005 - ...`).
- Legacy: root `TODO.md` exists for historical reference; update `TODO/TODO.md` going forward.

## Commit & Pull Request Guidelines
- Commit after major milestones and when tests pass.
- Staging: add files explicitly (e.g., `git add AGENTS.md src/app.js`), not `git add .` / `git add -A`.
- Messages: short, imperative, and capitalized; history sometimes uses prefixes like `docs:`/`chore:`.
- Bodies: include a small section per changed file with bullet summaries; use multiple `-m` flags or `git commit -F -` (avoid literal `\\n` escapes).
- PRs: concise summary, test commands run, linked issues/docs; include before/after notes or example output for behavior/UI changes (screenshots for UI work).
- `make commit` runs `grok commit | git commit -F -` and pushes to the current branch—review before using.

## Agent-Specific Instructions
- A chat message containing only `commit` means: add and commit all changes with an `AGENTS.md`-compliant message (using `git diff` to summarize).

## Local State & Generated Files
- Don’t commit local state or generated artifacts (see `.gitignore`), including `.grok`, `.aidda/`, `node_modules/`, `dist/`, `rust-wasm/pkg/`, and `rust-server/target/`.
