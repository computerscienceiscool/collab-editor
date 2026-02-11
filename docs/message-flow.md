# Message Flow (Browser, Neovim, Awareness)

How text and presence move between the browser app, the Neovim plugin, and the two WebSocket backends.

## Channels and Ports
- `ws://localhost:1234` (configurable): Automerge sync WebSocket (`@automerge/automerge-repo` binary protocol) used for document replication.
- `ws://localhost:1235` (configurable): Awareness WebSocket (JSON broadcast) used for cursors, selections, typing state, and user metadata.
- Optional REST backend on port `3000` for legacy endpoints; not involved in the live sync/presence path.

See `src/config.js` and `awareness-server.js` for defaults; Makefile targets `make ws` (sync) and `node awareness-server.js` (presence).

## Browser Editor Flow
1) Startup: `src/setup/automergeSetup.js` creates a Repo with `BrowserWebSocketClientAdapter(config.urls.automergeSync)` and IndexedDB storage; it either finds `?doc=...` or creates a new doc and sets `doc.content`.
2) Awareness: `createCustomAwareness` opens the awareness WebSocket and broadcasts `{type:"awareness", clientID, state, documentId}` when `setLocalStateField` is called (name/color/typing/selection).
3) Edits: CodeMirror changes update Automerge; the Repo sync adapter pushes those changes over the sync WebSocket. Remote changes arrive via `handle.on('change')` and update the editor.
4) Remote cursors: `src/ui/remoteCursorPlugin.js` listens to awareness state changes and renders remote cursors when `selection.anchor` (and optional `selection.head`) are present.

## Neovim Plugin Flow (Viduct)

The Neovim plugin has been moved to a separate repository: [github.com/computerscienceiscool/viduct](https://github.com/computerscienceiscool/viduct)

Viduct's Lua plugin talks JSON to its Node helper:
- Neovim → Helper:
  - `{"type":"connect","syncUrl":"ws://localhost:1234","awarenessUrl":"ws://localhost:1235"}`
  - `{"type":"open","docId":"automerge:..."}`
  - `{"type":"edit","content":"full buffer text"}`
  - `{"type":"cursor","offset":123,"selection":{"anchor":120,"head":123}}` (sent on cursor move; includes Visual selections)
- Helper → Neovim:
  - `{"type":"connected","userId":"duct-..."}` / `{"type":"opened","docId":...,"content":...}` / `{"type":"changed","content":...}`
  - Awareness fanout as cursors: `{"type":"cursor","userId":...,"name":...,"color":...,"anchor":N,"head":M}`

Inside the helper:
- Automerge Repo + `BrowserWebSocketClientAdapter` mirrors the Neovim buffer into `doc.content` and syncs it to the server.
- Cursor handling clamps offsets to the current doc length and calls `sendAwareness()` so other clients see the Neovim presence.
- Awareness messages from other clients are forwarded back to Neovim to render extmarks.

For implementation details, see the [Viduct PROTOCOL.md](https://github.com/computerscienceiscool/viduct/blob/main/docs/PROTOCOL.md).

## Awareness Message Shape (JSON over port 1235)
```json
{
  "type": "awareness",
  "clientID": "client-123",
  "state": {
    "user": { "name": "alice", "color": "#88cc88" },
    "typing": false,
    "selection": { "anchor": 42, "head": 45 }
  },
  "documentId": "automerge:XYZ"
}
```
- `selection.head` is optional; if omitted, consumers treat it as a caret at `anchor`.
- The awareness server simply broadcasts inbound JSON to other connected clients.

## Awareness Connection Resilience

The awareness WebSocket connection includes several reliability features:

### Reconnection with Exponential Backoff
When the awareness WebSocket disconnects:
1. Client waits 1 second, then attempts reconnect
2. If that fails, waits 2 seconds, then 4, 8, etc.
3. Maximum backoff caps at 30 seconds
4. Successful reconnect resets the backoff timer

### Heartbeat/Keepalive
- Client sends periodic ping messages to keep connection alive
- Detects stale connections that appear open but aren't responding
- Server-side timeout closes inactive connections

### Connection Timeout
- Initial connection attempts have a timeout (default 10 seconds)
- User sees feedback if connection takes too long
- Graceful fallback if awareness server is unavailable

### Disconnected User Cleanup
- When a user disconnects, their awareness state is removed from memory
- Prevents stale cursors and user indicators from persisting
- Other clients are notified to update their UI

## Common Failure Modes and Fixes
- Missing handler for `cursor` in the helper → "Unknown message type: cursor" and no remote cursors. Fixed by adding the case and calling `sendAwareness()`.
- Presence shape mismatches: ensure `selection.anchor`/`head` are numbers and clamped to doc length.
- Wrong ports/URLs: verify `config.urls.automergeSync` and `config.urls.awareness` match the running servers (or Neovim opts).

## Key Code Paths
- Browser Automerge setup: `src/setup/automergeSetup.js`
- Browser awareness rendering: `src/ui/remoteCursorPlugin.js`
- Awareness server: `awareness-server.js`
- Viduct plugin: [github.com/computerscienceiscool/viduct](https://github.com/computerscienceiscool/viduct)
