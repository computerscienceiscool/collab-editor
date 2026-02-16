# 029 - Neovim: Browser Freezes During Offline Editing

## Summary
When editing in Neovim while offline, the browser freezes upon reconnection.

## Root Cause Analysis

### Primary Issue: Accumulated Change Listeners

**Location:** `nvim/node-helper/index.js` lines 251, 299, 412-424

Every document open/create calls `setupChangeListener()` without removing previous listeners:

```javascript
function setupChangeListener() {
  if (!handle) return;
  handle.on('change', ({ doc }) => {  // Never removed!
    const content = contentToString(doc);
    send({ type: 'changed', content: content });
  });
}
```

**Impact:** N accumulated listeners = N duplicate messages per change.

---

### Secondary Issue: Concurrent Message Processing

**Location:** `nvim/node-helper/index.js` lines 427-437

```javascript
rl.on('line', async (line) => {
  const msg = JSON.parse(line);
  await handleMessage(msg);  // No queue - concurrent execution
});
```

When offline, keystrokes queue in stdin. On reconnect, all process concurrently causing:
- Multiple simultaneous `handle.change()` calls
- Cascading change events
- Exponential message traffic

---

### Contributing Factors

| File | Line | Issue |
|------|------|-------|
| `nvim/node-helper/index.js` | 340-342 | `handle.change()` has no try-catch |
| `nvim/node-helper/index.js` | 33, 418-420 | `isApplyingRemote` flag race condition |
| `src/setup/editorSetup.js` | 97-133 | Full document replace on every change |

---

## Freeze Scenario

1. User types in Neovim while offline
2. Each keystroke queues a JSON message to node-helper stdin
3. On reconnect:
   - All queued messages process concurrently
   - Multiple `handle.change()` on same document
   - Each accumulated listener fires
   - Browser receives exponential change events
   - CodeMirror tries full-document replace N times
   - Event loop blocks → **freeze**

---

## Recommended Fixes

### Fix 1: Remove Previous Listeners (Critical)
```javascript
let changeHandler = null;

function setupChangeListener() {
  if (!handle) return;

  // Remove previous listener
  if (changeHandler) {
    handle.off('change', changeHandler);
  }

  changeHandler = ({ doc }) => {
    const content = contentToString(doc);
    send({ type: 'changed', content: content });
  };

  handle.on('change', changeHandler);
}
```

### Fix 2: Serialize Message Processing
```javascript
const messageQueue = [];
let processing = false;

async function processQueue() {
  if (processing) return;
  processing = true;

  while (messageQueue.length > 0) {
    const msg = messageQueue.shift();
    await handleMessage(msg);
  }

  processing = false;
}

rl.on('line', (line) => {
  const msg = JSON.parse(line);
  messageQueue.push(msg);
  processQueue();
});
```

### Fix 3: Add Error Handling
```javascript
case 'edit': {
  try {
    handle.change(d => {
      d.content = msg.content;
    });
  } catch (err) {
    send({ type: 'error', message: `Edit failed: ${err.message}` });
  }
  break;
}
```

### Fix 4: Debounce Browser Updates
In `src/setup/editorSetup.js`, debounce the change handler to batch rapid updates.

---

## Testing Plan

1. Open document in browser and Neovim
2. Disconnect network (airplane mode or kill WebSocket server)
3. Type 50+ characters rapidly in Neovim
4. Reconnect network
5. Verify: browser doesn't freeze, content syncs correctly

---

## Priority
**Critical** - This blocks offline editing use case.

## Effort
Medium - Primary fix is straightforward, but needs testing across reconnection scenarios.

---

## Fixes Applied

### Node Helper (`nvim/node-helper/index.js`)
1. **Change listener cleanup** - Added `changeHandler` variable, `setupChangeListener()` now removes previous listener
2. **Temp sync listener cleanup** - Named `syncHandler` in 'open' case removed after sync/timeout
3. **Error handling** - `handle.change()` wrapped in try-catch
4. **Message queue** - Added `messageQueue` and `processQueue()` to serialize stdin processing
5. **Cleanup on close/disconnect** - Both cases remove `changeHandler`

### Lua Plugin (`nvim/lua/collab-editor/init.lua`)
1. **Removed duplicate triggers** - Removed `on_bytes` and `TextChanged` autocmd, kept only `on_lines`
2. **Autocmd cleanup** - Added `autocmd_group`, cleaned up on detach
3. **Race condition fix** - `ignore_changes` reset via `vim.schedule()` in `apply_remote_change`
