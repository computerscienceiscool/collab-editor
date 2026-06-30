
# Refactor Plan: Collaborative Editor for PromiseGrid

**Project**: `collab-editor`  
**Date**: 2025-07-05  
**Purpose**: Modularize the existing monolithic `editor.js` into a clean `src/` structure using ES modules, supporting long-term maintainability, extensibility, and integration with PromiseGrid.

---

## 🧩 Why Refactor?

The current implementation contains over 700 lines in a single file, making it difficult to:

- Maintain and debug
- Extend features (e.g. Markdown export, permissions)
- Support PromiseGrid integration (e.g. CBOR transport, plugin persistence)
- Enable clean testing and mocking

---

## 📁 Target Folder Structure

```
collab-editor/
├── src/
│   ├── app.js                  # Entry point, initializes the full app
│   ├── state/
│   │   └── awareness.js        # Awareness setup, state tracking
│   ├── core/
│   │   ├── editor.js           # EditorView + EditorState configuration
│   │   └── cursor-plugin.js    # Remote cursor decorations (ViewPlugin)
│   ├── model/
│   │   ├── doc.js              # Yjs document + persistence config
│   │   └── log.js              # Logging of joins/leaves, Y.Array logic
│   ├── ui/
│   │   ├── dom.js              # DOM access utilities, input listeners
│   │   └── typing-indicator.js# Typing indicator rendering
│   └── export/
│       └── export.js          # Save/export functions (.txt, .json, .ysnap)
├── docs/
│   ├── refactor-collab-editor.md   # Daily checklist
│   └── refactor-plan.md           # ← THIS FILE
├── public/
│   └── index.html
├── styles/
│   └── main.css
├── README.md
└── vite.config.js / webpack.config.js
```

---

## ✅ Goals

- Convert `editor.js` to a modular ES6 project
- Move all features into isolated files by concern (awareness, CRDT, UI, export)
- Add a central `app.js` to initialize all parts
- Preserve current functionality (IndexedDB, WebSocket, Export)
- Make PromiseGrid integration easy (CBOR-ready, plugin hooks)

---

## 🔐 Security, Permissions, and Future Concerns

- Support future cryptographic signing of changes
- Allow for read-only vs. write access modes
- Design for plugin persistence (GridStore, IPFS)
- Document awareness and CRDT signatures per PromiseGrid spec

---

## 🔄 Import/Export Strategy

Each file will use ES module format:

```js
// example: from src/core/editor.js
import { yCollab } from 'y-codemirror.next'
import { remoteCursorPlugin } from './cursor-plugin.js'
```

A central `app.js` will wire everything together:

```js
import { setupEditor } from './core/editor.js'
import { initAwareness } from './state/awareness.js'
...
setupEditor(...)
```

---

## 🧪 Testing and Stability

We will:

- Test each module standalone (via logging or unit test)
- Add a `debugMode` flag in `app.js` to optionally log state
- Only replace the current `editor.js` when the new version works

---

## 📝 Refactor Checklist (Condensed)

- [ ] Create `src/` structure above
- [ ] Move Yjs document + IndexedDB to `model/doc.js`
- [ ] Move awareness setup to `state/awareness.js`
- [ ] Move user list / typing indicator to `ui/`
- [ ] Move export functions to `export/export.js`
- [ ] Move CursorWidget + ViewPlugin to `core/cursor-plugin.js`
- [ ] Move EditorView logic to `core/editor.js`
- [ ] Create `app.js` to initialize everything
- [ ] Delete old `editor.js` only after full working validation

---

## 🔄 Future Integrations with PromiseGrid

- Replace WebSocket provider with PromiseGrid sync layer
- Use CBOR instead of JSON when exporting updates
- Support DAG-style persistence via plugins
- Add authenticated user state to awareness fields

---

**Maintainer**: JJ  
**Shared with**: SteveGT, PromiseGrid Team

---
