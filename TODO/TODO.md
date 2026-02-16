# TODO Index

Rules:
- Use letter-prefixed IDs (`LNNN` format: `S015`, `J016`, ...); do not renumber.
- Prefixes: `S` = Steve, `J` = JJ. Default prefix for this repo: `J`.
- Transition: existing TODOs without a letter (e.g., `015`) are treated as `J015`.
- Sort this file by priority, not number.
- Mark completion with checkboxes (`- [ ] J005 - ...` → `- [x] J005 - ...`).

This list was migrated from the legacy `TODO.md` at the repo root.

## Critical
(none)

## High
- [ ] J144 - Security: GitHub token XOR obfuscation (githubService.js:15-23) is trivially reversible. Consider not storing tokens, using sessionStorage, or proper encryption.

## Medium
- [ ] J006 - Rust backend: Support document versioning via filename or embedded metadata
- [ ] J008 - Rust backend: Test offline edits syncing with Rust backend
- [ ] J085 - Add regression tests alongside fixes to prevent regressions
- [ ] J086 - Add Vitest coverage for error banner and UI helpers
- [ ] J087 - Develop unit test strategy for the app
- [x] J078 - Neovim plugin tests (moved to Viduct repo: github.com/computerscienceiscool/viduct)
- [ ] J131 - Refactor xss-prevention.spec.js: Extract duplicate testFilename(), sanitizeFilename(), and helper functions (defined 4+ times each) into shared test utilities. File is 1300+ lines with significant repetition.
- [x] J148 - Neovim cursor debouncing (moved to Viduct repo: github.com/computerscienceiscool/viduct)
- [ ] J149 - Code quality: Extract magic numbers (timeouts, intervals) to named constants. Hardcoded values scattered across automergeSetup.js, app.js, etc.
- [ ] J150 - Performance: Use Promise.allSettled() for parallel WASM init instead of sequential loading in app.js:150-180. Reduces startup time.
- [ ] J151 - Testing: Add unit tests for utility modules (clientId.js, timeUtils.js, documentRegistry.js, sanitizeFilename.js). Currently no unit test coverage.
- [ ] J152 - Docs: Document awareness-server.js with JSDoc and usage examples. No comments or documentation for this critical component.

## Low (Features)
- [ ] J109 - Add real-time conflict indication (show unmerged changes)
- [ ] J110 - Add document history viewer (browse/restore old versions from IndexedDB)
- [ ] J111 - Add change highlighting (show what changed since last save)
- [ ] J112 - Add comment/annotation system for specific text passages
- [ ] J113 - Add user permissions model (reader/editor/owner roles)
- [ ] J114 - Add mention system (@username notifications)
- [ ] J116 - Add document templates (start from pre-built formats)
- [ ] J117 - Add production monitoring/error tracking (Sentry integration)
- [ ] J118 - Add Docker support for deployment
- [ ] J119 - Add environment-specific config (.env support)
- [ ] J133 - TypeScript migration: Add tsconfig.json and incrementally convert ~7,580 lines of JavaScript to TypeScript. Start with utility modules (utils/, config.js) then expand to UI components. Enables compile-time type checking and better IDE support.
- [ ] J134 - ESLint setup: Add .eslintrc.js with rules for unused variables, consistent imports, and code style. Integrate with Vite build and add pre-commit hook. Currently no linting enforced.
- [ ] J135 - CI/CD pipeline: Create .github/workflows for automated testing (Playwright), linting, and build verification on PRs. Add deployment workflow for Docker registry push.
- [ ] J138 - Rust API docs: Document /health, /export, /load, /save endpoints in docs/api.md. Include request/response formats, error codes, and curl examples. Currently undocumented.
- [ ] J139 - Troubleshooting guide: Create docs/troubleshooting.md covering common issues: WebSocket connection failures, IndexedDB quota, WASM loading errors, sync conflicts. (Viduct setup docs in separate repo)
- [ ] J140 - Performance guide: Document optimization strategies in docs/performance.md: debouncing settings, IndexedDB cleanup, WASM module loading, large document handling, memory management for long sessions.
- [ ] J141 - GitHub docs expansion: Expand docs/github.md with token permissions required, rate limiting handling, error recovery, and workflow examples for common use cases.
- [ ] J142 - Docker infrastructure: Complete Makefile docker targets (push/pull partially defined). Add docker-compose.yml for full stack (sync server, awareness server, Rust backend). Document in docs/deployment.md.
- [ ] J130 - (Pre-production) Logging cleanup: Remove or wrap 900+ console.log() calls with debug mode check. Use existing logger.js utility with localStorage debug flag.
- [ ] J154 - Cleanup: Remove test-only window exports in initWasm.js:88-100 or gate behind DEBUG flag. Exposes internal functions to console.
- [ ] J155 - Robustness: Add null checks for DOM elements in export handlers (handlers.js:335,743). Silent failures when elements missing.

## Done
- [x] J147 - Performance: Removed arbitrary 1-second delay in app.js. WASM init functions already await completion.
- [x] J145 - Memory leak: Added event listener cleanup registry and beforeunload cleanup.
- [x] J181 - Bug: Restore window.getLatestVersionFromIndexedDB export (needed by diff viewer, removed prematurely in TODO 153)
- [x] J180 - Dark mode: Dialog inputs/labels unreadable - add styles for settings-input, settings-section, input-group labels
- [x] J179 - Dark mode: Menu items barely readable - fix text/background contrast
- [x] J178 - Markdown preview: Fixed multiple tables merging into one (use [ \t]* instead of \s* to stop at blank lines)
- [x] J177 - Markdown preview: Added dark mode styles for h1, h2, h3 headings
- [x] J176 - Markdown preview: Added thick border under table headers (light and dark mode)
- [x] J175 - Markdown preview: Fixed table header empty cells (added .slice(1,-1) to strip pipe delimiters)
- [x] J115 - Export as HTML: Added HTML download (PDF removed - print dialog was broken)
- [x] J164 - Heading regex: Verified lib.rs uses raw strings correctly (`r"\s"` is valid Rust regex)
- [x] J174 - WASM: Added toggle_numbered_list function for `1. item` style lists
- [x] J173 - WASM toggle_list: Now recognizes `* ` and `+ ` when toggling off
- [x] J172 - Markdown preview: List wrapping fixed (no longer requires trailing newline)
- [x] J171 - Markdown preview: Bullet lists now support `* ` and `+ ` per GFM
- [x] J170 - Markdown preview: Image regex runs before link regex (no more `!` before links)
- [x] J169 - Markdown preview: Escape characters now work
- [x] J168 - Markdown preview: Autolinked URLs now work
- [x] J167 - Markdown preview: Task lists now work (fixed sanitizer removing checkboxes)
- [x] J166 - Markdown preview: Tables now work (fixed trailing whitespace handling)
- [x] J165 - Markdown preview: Fenced code blocks now work
- [x] J163 - Markdown preview: Images now work
- [x] J162 - Markdown preview: Horizontal rules now work (fixed leading whitespace)
- [x] J161 - Markdown preview: Blockquotes now work (fixed leading whitespace)
- [x] J160 - Markdown preview: H4-H6 headings now work (fixed leading whitespace)
- [x] J159 - Underline formatting: Use HTML `<u>text</u>` instead of `__` (GFM compliant)
- [x] J158 - Markdown preview: Fixed regex order (`__` before `_`)
- [x] J157 - Markdown preview: `__text__` now renders as bold
- [x] J156 - Markdown preview: `_text_` now renders as italic
- [x] J153 - Cleanup: Remove unused window.getLatestVersionFromIndexedDB export (REVERTED in TODO 181 - still needed by diff viewer)
- [x] J146 - GitHub API: Add AbortController with 30s timeout to all fetch calls
- [x] J143 - XSS: Sanitize markdown HTML before innerHTML assignment in app.js:465
- [x] J137 - GitHub token validation: Add format/length validation before API calls in githubService.js
- [x] J136 - WASM error handling: Add user-visible feedback when WASM modules fail to load
- [x] J132 - Refactor export/handlers.js: Consolidate 3 separate sanitizeFilename() definitions into single utility
- [x] J105 - Add user-visible error messages for all failure modes
- [x] J104 - Fix content sync race conditions (use transaction annotations instead of mutable flag)
- [x] J120 - Add /health endpoint to Rust backend
- [x] J010 - Add STORAGE_PATH env var config for Rust backend
- [x] J007 - Add CORS headers to Rust backend (tower-http cors layer)
- [x] J003 - Add "Open Recent" submenu to switch between visited documents (localStorage registry)
- [x] J102 - OBSOLETE: Rust backend /load and /save endpoints are legacy (unused). Automerge sync server handles multi-doc by ID.
- [x] J128 - Neovim: Create neovim-commands.md quick reference (`docs/neovim-commands.md`)
- [x] J127 - Neovim: Replace :CollabSetColor with :CollabUserColor color picker (`TODO/127-neovim-collabusercolor-picker.md`)
- [x] J126 - Neovim: Rename :CollabSetName to :CollabUserName (`TODO/126-neovim-collabusername-command.md`)
- [x] J125 - Bug: Neovim click-selection not highlighted in other Neovim sessions (`TODO/125-neovim-click-selection-sync.md`)
- [x] J124 - Bug: Duplicate neovim usernames cause cursor display failure (`TODO/124-duplicate-name-cursor-bug.md`)
- [x] J029 - Neovim: Offline editing browser freeze (`TODO/029-neovim-offline-freeze.md`)
- [x] J123 - Persist document title to localStorage (keyed by document ID)
- [x] J009 - Rust backend: Add basic logging (tracing with info/warn/error levels)
- [x] J122 - Fix doc ID display cutoff in user settings (shorter ID, full URL in tooltip)
- [x] J100 - Add ARIA labels and keyboard navigation for accessibility
- [x] J101 - Add focus trap for modal dialogs (githubDialog, preferencesDialog)
- [x] J004 - Rust backend: Validate file writes and error handling (atomic writes, validation)
- [x] J005 - Rust backend: Add `/export` endpoint to serve Markdown
- [x] J070 - Fix awareness position RangeError (clamp positions, handle mapping failures)
- [x] J099 - Fix Neovim byte-to-char conversion for multi-byte/Unicode characters
- [x] J106 - Standardize logging format (create shared logger utility)
- [x] J103 - Add timeout handling for awareness server connection
- [x] J091 - Add awareness WebSocket reconnection with exponential backoff
- [x] J121 - Neovim: Fix offline edits lost on reconnect (use Automerge.updateText)
- [x] J098 - Fix GitHub token storage security (obfuscation for localStorage)
- [x] J092 - Add heartbeat/keepalive for awareness WebSocket
- [x] J093 - BY DESIGN: Keep all IndexedDB databases (no cleanup)
- [x] J095 - Fix multiple event listeners per component (awareness.on leaks on reload)
- [x] J097 - Clean up disconnected user states from awareness (memory leak)
- [x] J094 - BY DESIGN: Remove version limit - keep full history (was hardcoded 50 in app.js)
- [x] J089 - Add error boundaries for app initialization with user-facing error UI
- [x] J090 - Fix silent failures in editor setup (doc=undefined causes later crashes)
- [x] J096 - Add debouncing for document stats (WASM call on every keystroke)
- [x] J108 - Deduplicate getClientID() across modules
- [x] J088 - Fix menu system event listener memory leak (click handlers never removed)
- [x] J028 - Add error handling for fetch, save, and load failures
- [x] J002 - Fix cursor message flow and "Unknown message type: cursor" (`TODO/002-fix-cursor-message-flow.md`)
- [x] J001 - Document message flow (`TODO/001-message-flow-doc.md`)
- [x] J030 - Neovim: `nvim-user` indicator doesn't show in browser after refresh
- [x] J031 - Neovim: Initial document load sometimes opens with empty buffer instead of browser content
- [x] J069 - Neovim: Copilot Tab completions are not synced to browser clients
- [x] J027 - Display last saved timestamp
- [x] J032 - Prompt for username and assign persistent color
- [x] J033 - Display correct username and room in the toolbar
- [x] J034 - Share cursor position using provider.awareness
- [x] J035 - Show typing indicators live in the UI
- [x] J036 - Reflect live updates to name and color
- [x] J037 - Remove users from UI on disconnect
- [x] J038 - Display user count in the toolbar

- [x] J039 - Basic collaborative editing with Automerge and CodeMirror
- [x] J040 - Auto-save document to the `/save` endpoint
- [x] J041 - Load existing document from the `/load` endpoint

- [x] J042 - Use IndexedDB for local persistence
- [x] J043 - Sync with server on reconnect
- [x] J044 - Test and confirm offline editing behavior
- [x] J045 - Add service worker to cache HTML/CSS/JS for full offline access

- [x] J046 - Add basic formatting toolbar (bold, italic, etc.)
- [x] J047 - Add keyboard shortcuts (e.g., Ctrl+B for bold)
- [x] J048 - Add placeholder text when the document is empty

- [x] J049 - Show user cursors with unique colors
- [x] J050 - Show list of active users with optional avatars
- [x] J051 - Add room join/leave notifications

- [x] J052 - Confirm that the `/save` endpoint writes updates to disk
- [x] J053 - Add document versioning or revision history
- [x] J054 - Add export option (e.g., download as .txt or .json)

- [x] J055 - Make room name dynamic (via prompt or URL)

- [x] J056 - Improve overall UI design and layout
- [x] J057 - User Logging
- [x] J058 - Show awareness metadata on cursor hover (e.g., name, color)

- [x] J059 - Create user guide at `docs/user-guide.md`
- [x] J060 - Create project README with install and usage instructions

- [x] J061 - Move backend logic from Go to Rust
- [x] J062 - Support `/load` and `/save` endpoints in Rust
- [x] J063 - Implement file-based persistence for Automerge documents

- [x] J064 - Separate development and production builds
- [x] J065 - Add automated unit or DOM tests
- [x] J066 - Validate document integrity before saving

- [x] J067 - Replace hardcoded values with config (e.g., WebSocket URL, room)
- [x] J068 - Modularize editor.js into separate concerns
- [x] J025 - Add a connection status indicator (e.g., "connected", "saving", etc.)
- [x] J024 - Improve mobile responsiveness
- [x] J071 - Add logging around Neovim on_lines to debug Copilot sync
- [x] J072 - Neovim: Tweak browser presence badge (nvim-user bar shows as full-width notification)
- [x] J074 - Neovim: Allow setting name/color from client and reflect in browser badges
- [x] J075 - Neovim: Deprecate/remove legacy Go helper and protocol.lua references
- [x] J076 - Consolidate Neovim plugin docs into docs/neovim-plugin.md and remove nvim/README.md
- [x] J011 - Legacy: Shared structured data types (completed with Automerge)
- [x] J026 - Add dark mode toggle
- [x] J073 - Neovim: Show browser usernames next to remote cursor in Neovim
- [x] J077 - Fix search functionality in browser and Neovim plugin; add coverage
- [x] J079 - Dark mode: activity log background still white (text is white)
- [x] J080 - Dark mode: diff viewer/raw diff panes use light backgrounds
- [x] J081 - Dark mode: editor gutter/line numbers stay light
- [x] J082 - Dark mode: keyboard shortcuts dialog background stays light
- [x] J083 - Dark mode: markdown preview background stays light
- [x] J084 - Add user-facing error banner for load/save/fetch failures
