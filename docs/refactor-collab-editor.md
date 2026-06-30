
# Collab Editor Refactor Plan

**Date Generated:** 2025-07-05

---

## ✅ Refactor Goals

- Migrate `editor.js` logic into `src/` folder
- Modularize key functionality (setup, UI, export, utils)
- Prepare for PromiseGrid compatibility (CRDT, CBOR)
- Improve readability and maintainability
- Reduce file size by splitting large file into smaller modules

---

## 📁 Directory Structure (After Refactor)

```
collab-editor/
├── index.html
├── style.css
├── README.md
├── TODO.md
├── package.json
├── vite.config.js
├── service-worker.js
├── public/
│   └── favicon.ico
├── src/
│   ├── main.js
│   ├── setup/
│   │   ├── editorSetup.js
│   │   ├── yjsSetup.js
│   │   └── userSetup.js
│   ├── ui/
│   │   ├── remoteCursorPlugin.js
│   │   ├── cursorWidget.js
│   │   ├── logging.js
│   │   ├── typingIndicator.js
│   │   └── userList.js
│   ├── export/
│   │   └── handlers.js
│   └── utils/
│       └── timeUtils.js
├── docs/
│   └── refactor-plan.md (this file)
```

---

## 🔧 Refactor Checklist

### `src/setup/`
- [ ] `editorSetup.js` – Initialize CodeMirror + extensions
- [ ] `yjsSetup.js` – Setup Y.Doc, provider, IndexedDB, awareness
- [ ] `userSetup.js` – User input events, localStorage, awareness updates

### `src/ui/`
- [ ] `remoteCursorPlugin.js` – Remote cursor ViewPlugin
- [ ] `cursorWidget.js` – Render remote cursor DOM elements
- [ ] `logging.js` – Awareness join/leave log
- [ ] `typingIndicator.js` – Show "user is typing" messages
- [ ] `userList.js` – Build user list in sidebar

### `src/export/`
- [ ] `handlers.js` – Export to .txt, .json, .yjs, .snapshot.json

### `src/utils/`
- [ ] `timeUtils.js` – `formatTime`, `relativeTime`

---

## 🚀 Main Entry Point (`src/main.js`)

```js
import { setupEditor } from './setup/editorSetup.js';
import { setupYjs } from './setup/yjsSetup.js';
import { setupUserControls } from './setup/userSetup.js';
import { setupExportHandlers } from './export/handlers.js';

window.addEventListener("DOMContentLoaded", async () => {
  const { ydoc, provider, ytext } = setupYjs();
  const view = setupEditor(ydoc, provider, ytext);
  setupUserControls(provider);
  setupExportHandlers(ydoc, ytext, view);
});
```

---

## 📝 README Notice Snippet

```markdown
## Refactor In Progress 🚧

This project is currently being modularized for maintainability.

### Goals:
- Move editor logic to `src/` modules
- Support PromiseGrid integration
- Use CBOR + Yjs CRDTs
- Cleanup UI and export systems

New entry point: `src/main.js`
```

---

## 🔮 Future Expansion Ideas

- `plugins/markdownSupport.js` – PromiseGrid standard doc export
- `network/gridSync.js` – PromiseGrid sync layer
- `plugins/securityHooks.js` – Signature verification per edit
