# TODO 002 - Fix cursor message flow and helper error

Fix Neovim cursor/presence updates so they propagate correctly and stop the helper error.

## Symptoms
- `nvim/node-helper/index.js` emits `Unknown message type: cursor` when Neovim sends `{type:"cursor", offset:N}`.
- Neovim cursor moves don’t update other clients because the node-helper never updates/sends awareness from cursor events.

## Likely Cause
- `nvim/lua/collab-editor/init.lua` sends cursor updates (`type = 'cursor'`) but `nvim/node-helper/index.js` has no `case 'cursor'` handler.

## Fix Outline
- Add `case 'cursor'` in `nvim/node-helper/index.js`:
  - Update `currentCursorOffset` from `msg.offset` (clamp to doc length if needed).
  - Call `sendAwareness()` so the awareness WS broadcasts `{state:{selection:{anchor:...}}}`.
- Verify cursor semantics match the browser: browser uses `state.selection.anchor` (character offset) and renders via `src/ui/remoteCursorPlugin.js`.
- (Optional) Support selections/ranges, not just a single anchor, if needed by the Neovim UX.

Done when Neovim no longer logs unknown cursor messages and remote cursors update in browser + Neovim.

