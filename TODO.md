# Collaborative Editor TODO List

## Completed

* Prompt for username and assign persistent color
* Display correct username and room in the toolbar
* Basic collaborative editing using Yjs + CodeMirror
* Auto-save document to `/save` endpoint
* Load existing document from `/load`

---
## 📌 Yjs Tutorial Progress – Remaining Tasks

### 🔜 Awareness & Presence (Partial)
- [ ] **Cursor Sharing:** Add cursor position sharing across users using `provider.awareness` with `cursor` field.
- [ ] **Live Typing Indicators:** Show which users are currently typing (based on awareness change).
- [ ] **User Update Handling:** Reflect changes when users update their name or color live (already stored but not shown in real-time UI changes).
- [ ] **User Disconnects:** Indicate when a user disconnects (e.g. fade or remove from UI when their awareness state clears).

---

### 🔜 Offline Support
- [ ] **Add y-indexeddb:** Use `y-indexeddb` to persist the Yjs document locally in the browser.
- [ ] **Sync on Reconnect:** Ensure it merges with server changes once the client reconnects.
- [ ] **Test Offline Behavior:** Simulate offline editing and re-syncing to verify behavior.

---

### 🛠️ Shared Types (Advanced - Optional)
- [ ] **Experiment with Y.Map/Y.Array:** Integrate additional `Y.Map` or `Y.Array` shared types for richer collaboration features.
- [ ] **Display Structured Data:** Display structured shared state (e.g. list of todos, metadata) in a UI panel.

---

### 📦 Future Exploration (Optional Tutorials)
- [ ] **Central Database Persistence:** Store Yjs updates in a persistent backend (beyond simple `/save` endpoint).
- [ ] **Redis + y-redis:** Investigate scalability using `y-redis` and a Redis server.
- [ ] **Custom Provider:** Learn how to create a custom network provider using `y-protocols/awareness`.

---

---

## 📦 Yjs Tutorial: Offline Support & Shared Types

### 🔌 Offline Support with `y-indexeddb`
- [ ] **Install & Import:** Add the `y-indexeddb` package and import `IndexeddbPersistence`.
- [ ] **Initialize Persistence:** Create a new `IndexeddbPersistence(roomName, ydoc)` instance.
- [ ] **Confirm Integration:** Log `"initial content loaded"` using `.once('synced')` to verify loading from local IndexedDB.
- [ ] **Dual Provider Setup:** Ensure `WebsocketProvider` and `IndexeddbPersistence` both operate on the same Y.Doc.
- [ ] **Simulate Offline Mode:** Reload the page without the WebSocket server and verify content loads from the local store.
- [ ] **Optionally Add Service Worker:** Add a service worker to cache the HTML/CSS/JS for full offline access.

---

### 🧠 Shared Types: Y.Array, Y.Map, and Nested Structures
- [ ] **Basic Use of Y.Array:** Add a `Y.Array` to your document and perform basic inserts.
- [ ] **Observe Changes:** Use `.observe` and `.observeDeep` to listen to delta changes.
- [ ] **Nested Types:** Insert nested Yjs types (e.g., Y.Array inside another Y.Array) and add observers accordingly.
- [ ] **Test JSON Encoding:** Try inserting JSON-encodable values and `Uint8Array`s.
- [ ] **Understand Limitations:**
  - [ ] Avoid re-inserting integrated shared types (causes errors).
  - [ ] Avoid modifying objects retrieved from shared types (can desync).
- [ ] **Transactions:**
  - [ ] Wrap multiple mutations in `ydoc.transact()` to reduce event firing and optimize syncing.
  - [ ] Confirm event handler call order:
    - `beforeTransaction`
    - `beforeObserverCalls`
    - type `.observe(...)`
    - `.observeDeep(...)`
    - `afterTransaction`
    - `ydoc.on('update', ...)`

---

### 🗂️ Managing Multiple Documents in Shared Types (Advanced)
- [ ] **Create Multi-Doc Model:** Use a Y.Map or Y.Array to store multiple documents' metadata and content.
- [ ] **Support Live Document List:** Allow adding/removing docs dynamically.
- [ ] **Enhance with Metadata:** Use nested shared types for each document (e.g., name, created-at, content).
- [ ] **Extend to Simulated File System:** Consider a minimal multi-file editor architecture.

---

**Recommended Next Step:** Add `y-indexeddb` to enable offline document syncing and test browser reload behavior.


---
## Other Priorities

### 1. Editor Usability Improvements

* [ ] Add basic formatting toolbar (bold, italic, etc.)
* [ ] Add keyboard shortcuts (e.g., Ctrl+B for bold)
* [ ] Add placeholder text when document is empty
* [ ] Show typing indicators per user (currently just placeholder in HTML)

### 2. User Awareness Enhancements

* [ ] Add cursor awareness (e.g., show other users’ cursors with their names/colors)
* [ ] Show list of active users dynamically, possibly with avatars
* [ ] Display user count in toolbar

### 3. Data Handling & Persistence

* [ ] Confirm `/save` endpoint is writing updates to disk
* [ ] Add versioning or revision history to saved docs
* [ ] Add export option: Download as `.txt` or `.json`

### 4. Room/Session Management

* [ ] Make room name dynamic (prompt user or from URL)
* [ ] Display room join/leave notifications
* [ ] Allow selecting/joining different rooms

### 5. UI/UX Improvements

* [ ] Improve mobile responsiveness
* [ ] Add status indicator (e.g., "connected", "saving...", "saved")
* [ ] Add dark mode toggle
* [ ] Display last saved timestamp

### 6. Developer Workflow

* [ ] Separate dev and prod builds (`frontend/index.html` vs `public/index.html`)
* [ ] Add automated testing (even just DOM/unit smoke tests)
* [ ] Validate document structure before saving (Yjs update integrity)

### 7. Polish & Cleanup

* [ ] Replace hardcoded values with config (e.g., WebSocket URL, room)
* [ ] Modularize `editor.js` (split UI, networking, editor setup)
* [ ] Add error handling/logging around fetch/save/load failures
 



**Next Recommended Focus:** `Offline Support` using `y-indexeddb`

