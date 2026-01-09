# TODO 001 - Document message flow

Create a short doc describing end-to-end message flow between:

- Browser editor (CodeMirror) ↔ Automerge doc (`@automerge/automerge-repo` sync)
- Awareness/presence channel (cursor/typing)
- Neovim plugin bridge (`nvim` ↔ `nvim/node-helper` ↔ awareness + Automerge sync)

Deliverable: add a new doc (suggested: `docs/message-flow.md`) covering:

- Which WebSockets exist (sync vs awareness) and what each carries
- Message shapes/examples (including cursor/selection semantics like `selection.anchor`)
- Where messages are sent/handled in code (key files + entry points)
- Common failure modes (e.g., “unknown message type: cursor” mismatches)

Done when the doc exists and is linked from README or a docs index.

