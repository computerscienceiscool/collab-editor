# TODO Index

Rules:
- Use 3-digit IDs (`001`, `002`, ...); do not renumber.
- Sort this file by priority, not number.
- Mark completion with checkboxes (`- [ ] 005 - ...` → `- [x] 005 - ...`).

This list was migrated from the legacy `TODO.md` at the repo root.

## Critical
(none)

## High
- [ ] 144 - Security: GitHub token XOR obfuscation (githubService.js:15-23) is trivially reversible. Consider not storing tokens, using sessionStorage, or proper encryption.

## Medium
- [ ] 006 - Rust backend: Support document versioning via filename or embedded metadata
- [ ] 008 - Rust backend: Test offline edits syncing with Rust backend
- [ ] 085 - Add regression tests alongside fixes to prevent regressions
- [ ] 086 - Add Vitest coverage for error banner and UI helpers
- [ ] 087 - Develop unit test strategy for the app
- [x] 078 - Neovim plugin tests (moved to Vimbeam repo: github.com/computerscienceiscool/vimbeam)
- [ ] 131 - Refactor xss-prevention.spec.js: Extract duplicate testFilename(), sanitizeFilename(), and helper functions (defined 4+ times each) into shared test utilities. File is 1300+ lines with significant repetition.
- [x] 148 - Neovim cursor debouncing (moved to Vimbeam repo: github.com/computerscienceiscool/vimbeam)
- [ ] 149 - Code quality: Extract magic numbers (timeouts, intervals) to named constants. Hardcoded values scattered across automergeSetup.js, app.js, etc.
- [ ] 150 - Performance: Use Promise.allSettled() for parallel WASM init instead of sequential loading in app.js:150-180. Reduces startup time.
- [ ] 151 - Testing: Add unit tests for utility modules (clientId.js, timeUtils.js, documentRegistry.js, sanitizeFilename.js). Currently no unit test coverage.
- [ ] 152 - Docs: Document awareness-server.js with JSDoc and usage examples. No comments or documentation for this critical component.

## Low (Features)
- [ ] 109 - Add real-time conflict indication (show unmerged changes)
- [ ] 110 - Add document history viewer (browse/restore old versions from IndexedDB)
- [ ] 111 - Add change highlighting (show what changed since last save)
- [ ] 112 - Add comment/annotation system for specific text passages
- [ ] 113 - Add user permissions model (reader/editor/owner roles)
- [ ] 114 - Add mention system (@username notifications)
- [ ] 116 - Add document templates (start from pre-built formats)
- [ ] 117 - Add production monitoring/error tracking (Sentry integration)
- [ ] 118 - Add Docker support for deployment
- [ ] 119 - Add environment-specific config (.env support)
- [ ] 133 - TypeScript migration: Add tsconfig.json and incrementally convert ~7,580 lines of JavaScript to TypeScript. Start with utility modules (utils/, config.js) then expand to UI components. Enables compile-time type checking and better IDE support.
- [ ] 134 - ESLint setup: Add .eslintrc.js with rules for unused variables, consistent imports, and code style. Integrate with Vite build and add pre-commit hook. Currently no linting enforced.
- [ ] 135 - CI/CD pipeline: Create .github/workflows for automated testing (Playwright), linting, and build verification on PRs. Add deployment workflow for Docker registry push.
- [ ] 138 - Rust API docs: Document /health, /export, /load, /save endpoints in docs/api.md. Include request/response formats, error codes, and curl examples. Currently undocumented.
- [ ] 139 - Troubleshooting guide: Create docs/troubleshooting.md covering common issues: WebSocket connection failures, IndexedDB quota, WASM loading errors, sync conflicts. (Vimbeam setup docs in separate repo)
- [ ] 140 - Performance guide: Document optimization strategies in docs/performance.md: debouncing settings, IndexedDB cleanup, WASM module loading, large document handling, memory management for long sessions.
- [ ] 141 - GitHub docs expansion: Expand docs/github.md with token permissions required, rate limiting handling, error recovery, and workflow examples for common use cases.
- [ ] 142 - Docker infrastructure: Complete Makefile docker targets (push/pull partially defined). Add docker-compose.yml for full stack (sync server, awareness server, Rust backend). Document in docs/deployment.md.
- [ ] 130 - (Pre-production) Logging cleanup: Remove or wrap 900+ console.log() calls with debug mode check. Use existing logger.js utility with localStorage debug flag.
- [ ] 154 - Cleanup: Remove test-only window exports in initWasm.js:88-100 or gate behind DEBUG flag. Exposes internal functions to console.
- [ ] 155 - Robustness: Add null checks for DOM elements in export handlers (handlers.js:335,743). Silent failures when elements missing.

## Done
- [x] 147 - Performance: Removed arbitrary 1-second delay in app.js. WASM init functions already await completion.
- [x] 145 - Memory leak: Added event listener cleanup registry and beforeunload cleanup.
- [x] 181 - Bug: Restore window.getLatestVersionFromIndexedDB export (needed by diff viewer, removed prematurely in TODO 153)
- [x] 180 - Dark mode: Dialog inputs/labels unreadable - add styles for settings-input, settings-section, input-group labels
- [x] 179 - Dark mode: Menu items barely readable - fix text/background contrast
- [x] 178 - Markdown preview: Fixed multiple tables merging into one (use [ \t]* instead of \s* to stop at blank lines)
- [x] 177 - Markdown preview: Added dark mode styles for h1, h2, h3 headings
- [x] 176 - Markdown preview: Added thick border under table headers (light and dark mode)
- [x] 175 - Markdown preview: Fixed table header empty cells (added .slice(1,-1) to strip pipe delimiters)
- [x] 115 - Export as HTML: Added HTML download (PDF removed - print dialog was broken)
- [x] 164 - Heading regex: Verified lib.rs uses raw strings correctly (`r"\s"` is valid Rust regex)
- [x] 174 - WASM: Added toggle_numbered_list function for `1. item` style lists
- [x] 173 - WASM toggle_list: Now recognizes `* ` and `+ ` when toggling off
- [x] 172 - Markdown preview: List wrapping fixed (no longer requires trailing newline)
- [x] 171 - Markdown preview: Bullet lists now support `* ` and `+ ` per GFM
- [x] 170 - Markdown preview: Image regex runs before link regex (no more `!` before links)
- [x] 169 - Markdown preview: Escape characters now work
- [x] 168 - Markdown preview: Autolinked URLs now work
- [x] 167 - Markdown preview: Task lists now work (fixed sanitizer removing checkboxes)
- [x] 166 - Markdown preview: Tables now work (fixed trailing whitespace handling)
- [x] 165 - Markdown preview: Fenced code blocks now work
- [x] 163 - Markdown preview: Images now work
- [x] 162 - Markdown preview: Horizontal rules now work (fixed leading whitespace)
- [x] 161 - Markdown preview: Blockquotes now work (fixed leading whitespace)
- [x] 160 - Markdown preview: H4-H6 headings now work (fixed leading whitespace)
- [x] 159 - Underline formatting: Use HTML `<u>text</u>` instead of `__` (GFM compliant)
- [x] 158 - Markdown preview: Fixed regex order (`__` before `_`)
- [x] 157 - Markdown preview: `__text__` now renders as bold
- [x] 156 - Markdown preview: `_text_` now renders as italic
- [x] 153 - Cleanup: Remove unused window.getLatestVersionFromIndexedDB export (REVERTED in TODO 181 - still needed by diff viewer)
- [x] 146 - GitHub API: Add AbortController with 30s timeout to all fetch calls
- [x] 143 - XSS: Sanitize markdown HTML before innerHTML assignment in app.js:465
- [x] 137 - GitHub token validation: Add format/length validation before API calls in githubService.js
- [x] 136 - WASM error handling: Add user-visible feedback when WASM modules fail to load
- [x] 132 - Refactor export/handlers.js: Consolidate 3 separate sanitizeFilename() definitions into single utility
- [x] 105 - Add user-visible error messages for all failure modes
- [x] 104 - Fix content sync race conditions (use transaction annotations instead of mutable flag)
- [x] 120 - Add /health endpoint to Rust backend
- [x] 010 - Add STORAGE_PATH env var config for Rust backend
- [x] 007 - Add CORS headers to Rust backend (tower-http cors layer)
- [x] 003 - Add "Open Recent" submenu to switch between visited documents (localStorage registry)
- [x] 102 - OBSOLETE: Rust backend /load and /save endpoints are legacy (unused). Automerge sync server handles multi-doc by ID.
- [x] 128 - Neovim: Create neovim-commands.md quick reference (`docs/neovim-commands.md`)
- [x] 127 - Neovim: Replace :CollabSetColor with :CollabUserColor color picker (`TODO/127-neovim-collabusercolor-picker.md`)
- [x] 126 - Neovim: Rename :CollabSetName to :CollabUserName (`TODO/126-neovim-collabusername-command.md`)
- [x] 125 - Bug: Neovim click-selection not highlighted in other Neovim sessions (`TODO/125-neovim-click-selection-sync.md`)
- [x] 124 - Bug: Duplicate neovim usernames cause cursor display failure (`TODO/124-duplicate-name-cursor-bug.md`)
- [x] 029 - Neovim: Offline editing browser freeze (`TODO/029-neovim-offline-freeze.md`)
- [x] 123 - Persist document title to localStorage (keyed by document ID)
- [x] 009 - Rust backend: Add basic logging (tracing with info/warn/error levels)
- [x] 122 - Fix doc ID display cutoff in user settings (shorter ID, full URL in tooltip)
- [x] 100 - Add ARIA labels and keyboard navigation for accessibility
- [x] 101 - Add focus trap for modal dialogs (githubDialog, preferencesDialog)
- [x] 004 - Rust backend: Validate file writes and error handling (atomic writes, validation)
- [x] 005 - Rust backend: Add `/export` endpoint to serve Markdown
- [x] 070 - Fix awareness position RangeError (clamp positions, handle mapping failures)
- [x] 099 - Fix Neovim byte-to-char conversion for multi-byte/Unicode characters
- [x] 106 - Standardize logging format (create shared logger utility)
- [x] 103 - Add timeout handling for awareness server connection
- [x] 091 - Add awareness WebSocket reconnection with exponential backoff
- [x] 121 - Neovim: Fix offline edits lost on reconnect (use Automerge.updateText)
- [x] 098 - Fix GitHub token storage security (obfuscation for localStorage)
- [x] 092 - Add heartbeat/keepalive for awareness WebSocket
- [x] 093 - BY DESIGN: Keep all IndexedDB databases (no cleanup)
- [x] 095 - Fix multiple event listeners per component (awareness.on leaks on reload)
- [x] 097 - Clean up disconnected user states from awareness (memory leak)
- [x] 094 - BY DESIGN: Remove version limit - keep full history (was hardcoded 50 in app.js)
- [x] 089 - Add error boundaries for app initialization with user-facing error UI
- [x] 090 - Fix silent failures in editor setup (doc=undefined causes later crashes)
- [x] 096 - Add debouncing for document stats (WASM call on every keystroke)
- [x] 108 - Deduplicate getClientID() across modules
- [x] 088 - Fix menu system event listener memory leak (click handlers never removed)
- [x] 028 - Add error handling for fetch, save, and load failures
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

- [x] 039 - Basic collaborative editing with Automerge and CodeMirror
- [x] 040 - Auto-save document to the `/save` endpoint
- [x] 041 - Load existing document from the `/load` endpoint

- [x] 042 - Use IndexedDB for local persistence
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
- [x] 063 - Implement file-based persistence for Automerge documents

- [x] 064 - Separate development and production builds
- [x] 065 - Add automated unit or DOM tests
- [x] 066 - Validate document integrity before saving

- [x] 067 - Replace hardcoded values with config (e.g., WebSocket URL, room)
- [x] 068 - Modularize editor.js into separate concerns
- [x] 025 - Add a connection status indicator (e.g., "connected", "saving", etc.)
- [x] 024 - Improve mobile responsiveness
- [x] 071 - Add logging around Neovim on_lines to debug Copilot sync
- [x] 072 - Neovim: Tweak browser presence badge (nvim-user bar shows as full-width notification)
- [x] 074 - Neovim: Allow setting name/color from client and reflect in browser badges
- [x] 075 - Neovim: Deprecate/remove legacy Go helper and protocol.lua references
- [x] 076 - Consolidate Neovim plugin docs into docs/neovim-plugin.md and remove nvim/README.md
- [x] 011 - Legacy: Shared structured data types (completed with Automerge)
- [x] 026 - Add dark mode toggle
- [x] 073 - Neovim: Show browser usernames next to remote cursor in Neovim
- [x] 077 - Fix search functionality in browser and Neovim plugin; add coverage
- [x] 079 - Dark mode: activity log background still white (text is white)
- [x] 080 - Dark mode: diff viewer/raw diff panes use light backgrounds
- [x] 081 - Dark mode: editor gutter/line numbers stay light
- [x] 082 - Dark mode: keyboard shortcuts dialog background stays light
- [x] 083 - Dark mode: markdown preview background stays light
- [x] 084 - Add user-facing error banner for load/save/fetch failures
