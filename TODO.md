
# Collaborative Editor TODO

## Completed

### User Setup and Awareness

- [x] Prompt for username and assign persistent color
- [x] Display correct username and room in the toolbar
- [x] Share cursor position using provider.awareness
- [x] Show typing indicators live in the UI
- [x] Reflect live updates to name and color
- [x] Remove users from UI on disconnect
- [x] Display user count in the toolbar

### Core Collaboration

- [x] Basic collaborative editing with Yjs and CodeMirror
- [x] Auto-save document to the /save endpoint
- [x] Load existing document from the /load endpoint

### Offline Support

- [x] Use y-indexeddb for local persistence
- [x] Sync with server on reconnect
- [x] Test and confirm offline editing behavior
- [x] Add service worker to cache HTML/CSS/JS for full offline access

---

## In Progress and Next Steps

### Editor Usability"

- [ ] Add basic formatting toolbar (bold, italic, etc.)
- [ ] Add keyboard shortcuts (e.g., Ctrl+B for bold)
- [x] Add placeholder text when the document is empty

### User Awareness Enhancements

- [x] Show user cursors with unique colors
- [x] Show list of active users with optional avatars
- [x] Add room join/leave notifications

### Data Handling and Persistence

- [ ] Confirm that the /save endpoint writes updates to disk
- [ ] Add document versioning or revision history
- [x] Add export option (e.g., download as .txt or .json)

### Room and Session Management

- [x] Make room name dynamic (via prompt or URL)
- [ ] Allow user to switch or select different rooms

### UI and Design Improvements
- [x] Improve overall UI design and layout
- [x] User Logging 
- [x] Show awareness metadata on cursor hover (e.g., name, color)

### Documentation

- [x] Create user guide at docs/user-guide.md
- [x] Create project README with install and usage instructions

## Rust Backend Integration

- [x] Move backend logic from Go to Rust
- [x] Support `/load` and `/save` endpoints in Rust
- [x] Implement file-based persistence for Yjs documents
- [ ] Validate file writes and error handling
- [ ] Add `/export` endpoint to serve Markdown (from `.yjs`)
- [ ] Support document versioning via filename or embedded metadata
- [ ] Confirm cross-origin and CORS headers work for frontend integration
- [ ] Test offline edits syncing with Rust backend
- [ ] Add basic logging to the Rust server
- [ ] Add command-line config for port and storage path (optional)

---

## Optional Advanced Features






### Shared Yjs Types

- [ ] Use Y.Array or Y.Map for shared structured data
- [ ] Observe changes using .observe and .observeDeep
- [ ] Handle nested types like Y.Array inside Y.Map
- [ ] Test encoding for JSON and binary formats
- [ ] Use ydoc.transact for grouped mutations
- [ ] Understand transaction lifecycle events

### Managing Multiple Documents

- [ ] Use Y.Map or Y.Array to hold multiple documents
- [ ] Support adding/removing documents dynamically
- [ ] Include metadata such as title and timestamps
- [ ] Build a minimal multi-document interface

### Server and Backend Scalability

- [ ] Store Yjs updates in a full backend database
- [ ] Add Redis sync using y-redis
- [ ] Learn to build a custom provider with y-protocols/awareness

### Developer Workflow

- [ ] Separate development and production builds
- [ ] Add automated unit or DOM tests
- [x] Validate document integrity before saving

### UI and Experience Improvements

- [ ] Improve mobile responsiveness
- [ ] Add a connection status indicator (e.g., "connected", "saving", etc.)
- [ ] Add dark mode toggle
- [ ] Display last saved timestamp

### Code and Config Cleanup

- [x] Replace hardcoded values with config (e.g., WebSocket URL, room)
- [x] Modularize editor.js into separate concerns
- [ ] Add error handling for fetch, save, and load failures

---

