# Collaborative Editor TODO List

## Completed

* Prompt for username and assign persistent color
* Display correct username and room in the toolbar
* Basic collaborative editing using Yjs + CodeMirror
* Auto-save document to `/save` endpoint
* Load existing document from `/load`

---

## Next Priorities

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
