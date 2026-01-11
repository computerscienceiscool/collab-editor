# TODO Index

Rules:
- Use 3-digit IDs (`001`, `002`, ...); do not renumber. 
- Sort this file by priority, not number.
- Mark completion with checkboxes (`- [ ] 005 - ...` → `- [x] 005 - ...`).

This list was migrated from the legacy `TODO.md` at the repo root; some items reference older Yjs-based work.

## High
- [ ] 005 - Rust backend: Add `/export` endpoint to serve Markdown (from `.yjs`)
- [ ] 004 - Rust backend: Validate file writes and error handling
- [ ] 007 - Rust backend: Confirm cross-origin and CORS headers work for frontend integration
- [ ] 029 - Neovim: Offline editing test failed (browser froze when editing while offline)

## Medium
- [ ] 003 - Allow user to switch/select different rooms/documents
- [ ] 006 - Rust backend: Support document versioning via filename or embedded metadata
- [ ] 008 - Rust backend: Test offline edits syncing with Rust backend
- [ ] 009 - Rust backend: Add basic logging
- [ ] 010 - Rust backend: Add command-line config for port and storage path (optional)
- [ ] 028 - Add error handling for fetch, save, and load failures
- [ ] 024 - Improve mobile responsiveness
- [x] 026 - Add dark mode toggle
- [ ] 070 - Investigate awareness position RangeError (`TODO/070-awareness-rangeerror.md`)
- [x] 073 - Neovim: Show browser usernames next to remote cursor in Neovim
- [x] 077 - Fix search functionality in browser and Neovim plugin; add coverage
- [ ] 078 - Add Neovim plugin tests for cursor and Automerge sync flows
- [ ] 079 - Dark mode: activity log background still white (text is white)
- [x] 079 - Dark mode: user activity log uses light background
- [x] 080 - Dark mode: diff viewer/raw diff panes use light backgrounds
- [x] 081 - Dark mode: editor gutter/line numbers stay light
- [x] 082 - Dark mode: keyboard shortcuts dialog background stays light
- [x] 083 - Dark mode: markdown preview background stays light

## Low (Legacy / Backlog)
- [ ] 012 - Legacy (Yjs): Observe changes using `.observe` and `.observeDeep`
- [ ] 013 - Legacy (Yjs): Handle nested types like `Y.Array` inside `Y.Map`
- [ ] 014 - Legacy (Yjs): Test encoding for JSON and binary formats
- [ ] 015 - Legacy (Yjs): Use `ydoc.transact` for grouped mutations
- [ ] 016 - Legacy (Yjs): Understand transaction lifecycle events
- [ ] 017 - Legacy: Use `Y.Map` or `Y.Array` to hold multiple documents
- [ ] 018 - Legacy: Support adding/removing documents dynamically
- [ ] 019 - Legacy: Include metadata such as title and timestamps
- [ ] 020 - Legacy: Build a minimal multi-document interface
- [ ] 021 - Legacy (Yjs): Store Yjs updates in a full backend database
- [ ] 022 - Legacy (Yjs): Add Redis sync using `y-redis`
- [ ] 023 - Legacy (Yjs): Learn to build a custom provider with `y-protocols/awareness`

## Done
- [x] 002 - Fix cursor message flow and "Unknown message type: cursor" (`TODO/002-fix-cursor-message-flow.md`)
- [x] 001 - Document message flow (`TODO/001-message-flow-doc.md`)
- [x] 030 - Neovim: `nvim-user` indicator doesn't show in browser after refresh
- [x] 031 - Neovim: Initial document load sometimes opens with empty buffer instead of browser content
- [x] 069 - Neovim: Copilot Tab completions are not synced to browser clients
- [x] 027 - Display last saved timestamp
- [x] 032 - Prompt for username and assign persistent color
- [x] 033 - Display correct username and room in the toolbar
- [x] 034 - Share cursor position using provider.awareness
- [x] 035 - Show typing indicators live in the UI
- [x] 036 - Reflect live updates to name and color
- [x] 037 - Remove users from UI on disconnect
- [x] 038 - Display user count in the toolbar

- [x] 039 - Basic collaborative editing with Yjs and CodeMirror
- [x] 040 - Auto-save document to the `/save` endpoint
- [x] 041 - Load existing document from the `/load` endpoint

- [x] 042 - Use y-indexeddb for local persistence
- [x] 043 - Sync with server on reconnect
- [x] 044 - Test and confirm offline editing behavior
- [x] 045 - Add service worker to cache HTML/CSS/JS for full offline access

- [x] 046 - Add basic formatting toolbar (bold, italic, etc.)
- [x] 047 - Add keyboard shortcuts (e.g., Ctrl+B for bold)
- [x] 048 - Add placeholder text when the document is empty

- [x] 049 - Show user cursors with unique colors
- [x] 050 - Show list of active users with optional avatars
- [x] 051 - Add room join/leave notifications

- [x] 052 - Confirm that the `/save` endpoint writes updates to disk
- [x] 053 - Add document versioning or revision history
- [x] 054 - Add export option (e.g., download as .txt or .json)

- [x] 055 - Make room name dynamic (via prompt or URL)

- [x] 056 - Improve overall UI design and layout
- [x] 057 - User Logging
- [x] 058 - Show awareness metadata on cursor hover (e.g., name, color)

- [x] 059 - Create user guide at `docs/user-guide.md`
- [x] 060 - Create project README with install and usage instructions

- [x] 061 - Move backend logic from Go to Rust
- [x] 062 - Support `/load` and `/save` endpoints in Rust
- [x] 063 - Implement file-based persistence for Yjs documents

- [x] 064 - Separate development and production builds
- [x] 065 - Add automated unit or DOM tests
- [x] 066 - Validate document integrity before saving

- [x] 067 - Replace hardcoded values with config (e.g., WebSocket URL, room)
- [x] 068 - Modularize editor.js into separate concerns
- [x] 025 - Add a connection status indicator (e.g., "connected", "saving", etc.)
- [x] 071 - Add logging around Neovim on_lines to debug Copilot sync
- [x] 072 - Neovim: Tweak browser presence badge (nvim-user bar shows as full-width notification)
- [x] 074 - Neovim: Allow setting name/color from client and reflect in browser badges
- [x] 075 - Neovim: Deprecate/remove legacy Go helper and protocol.lua references
- [x] 076 - Consolidate Neovim plugin docs into docs/neovim-plugin.md and remove nvim/README.md
- [x] 011 - Legacy (Yjs): Use `Y.Array` or `Y.Map` for shared structured data
- [x] 026 - Add dark mode toggle
- [x] 073 - Neovim: Show browser usernames next to remote cursor in Neovim
- [x] 077 - Fix search functionality in browser and Neovim plugin; add coverage
- [x] 080 - Dark mode: diff viewer/raw diff panes use light backgrounds
- [x] 081 - Dark mode: editor gutter/line numbers stay light
- [x] 082 - Dark mode: keyboard shortcuts dialog background stays light
- [x] 083 - Dark mode: markdown preview background stays light
- [x] 079 - Dark mode: user activity log uses light background
- [x] 080 - Dark mode: diff viewer/raw diff panes use light backgrounds
- [x] 081 - Dark mode: editor gutter/line numbers stay light
- [x] 082 - Dark mode: keyboard shortcuts dialog background stays light
- [x] 083 - Dark mode: markdown preview background stays light
