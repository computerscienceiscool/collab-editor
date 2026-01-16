# 124 - Duplicate Neovim Usernames Cause Cursor Display Failure

## Summary
When two Neovim users connect with the same name, only the first user's cursor is displayed in the browser. The second user's cursor fails to render with repeated errors.

## Observed Behavior
- Two Neovim clients connect with identical usernames
- Only the first user's cursor appears in the browser UI
- Console floods with errors from `remoteCursorPlugin.js:98`

## Error Message
```
[RemoteCursor] Dispatch failed: Ranges must be added sorted by `from` position and `startSide`
```

## Stack Trace
```
remoteCursorPlugin.js:98 [RemoteCursor] Dispatch failed: Ranges must be added sorted by `from` position and `startSide`
    (anonymous) @ remoteCursorPlugin.js:98
    setTimeout
    updateDecorations @ remoteCursorPlugin.js:89
    (anonymous) @ automergeSetup.js:216
    notifyListeners @ automergeSetup.js:214
    handleAwarenessMessage @ automergeSetup.js:173
    (anonymous) @ automergeSetup.js:339
    awarenessWebSocket.onmessage @ automergeSetup.js:339
```

## Root Cause Analysis

### Likely Cause
The `Decoration.set()` function in CodeMirror requires decorations to be sorted by their `from` position. When two users have cursors at different positions, the decorations array may be built in an order that doesn't match position order (since it iterates over `awareness.getStates()` which is a Map and doesn't guarantee order).

### Relevant Code (`src/ui/remoteCursorPlugin.js:59-85`)
```javascript
updateDecorations() {
  const buildDecorations = (currentDocLength) => {
    const decorations = [];
    const states = awareness.getStates();

    states.forEach((state, id) => {
      if (id === clientID) return;

      const user = state.user;
      const selection = state.selection;

      if (user && selection && typeof selection.anchor === 'number') {
        const anchor = Math.max(0, Math.min(selection.anchor, currentDocLength));
        decorations.push(
          Decoration.widget({
            widget: new CursorWidget(user.name, user.color),
            side: -1,
          }).range(anchor)
        );
      }
    });

    return Decoration.set(decorations);  // <-- BUG: decorations not sorted
  };
  // ...
}
```

### Why Duplicate Names Trigger This
When two clients share the same name, they likely:
1. Still have different client IDs (so both are processed)
2. Have cursors at different positions
3. The Map iteration order doesn't guarantee position-sorted output
4. `Decoration.set()` throws because ranges aren't sorted by `from`

## Proposed Fix

Sort decorations by position before creating the DecorationSet:

```javascript
// Sort decorations by position before creating the set
decorations.sort((a, b) => a.from - b.from);
return Decoration.set(decorations);
```

Or use the `sort` parameter of `Decoration.set()`:

```javascript
// Pass true to indicate decorations need sorting
return Decoration.set(decorations, true);
```

## Files to Modify
- `src/ui/remoteCursorPlugin.js` - Add sorting before `Decoration.set()` call

## Testing
1. Connect two Neovim clients with the same username (e.g., both named "nvim-user")
2. Verify both cursors appear in the browser
3. Verify no console errors during cursor updates
4. Test with cursors at same position vs different positions

## Related Issues
- [x] 070 - Fix awareness position RangeError (clamp positions, handle mapping failures)
