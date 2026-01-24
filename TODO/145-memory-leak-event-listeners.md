# TODO 145 - Memory Leak: Event Listeners Not Cleaned Up

## Problem

Event listeners are added to DOM elements and the document but never removed when components are destroyed or the page navigates. This causes memory leaks in long-running sessions and can lead to duplicate handlers firing multiple times.

## Affected Files

### 1. `src/export/handlers.js`

**No cleanup at all** - all listeners persist indefinitely.

| Line | Listener | Issue |
|------|----------|-------|
| 196 | `searchInput.addEventListener('keypress', ...)` | Never removed |
| 761 | `document.addEventListener('keydown', ...)` | Never removed |
| 808 | `document.addEventListener('keydown', ...)` | Never removed |
| 860 | `document.addEventListener('keydown', ...)` | Never removed |
| 882 | `document.addEventListener('click', safeTxtExportHandler)` | Never removed |
| 970 | `document.addEventListener('keydown', ...)` | Never removed |
| 1049 | `document.addEventListener('click', ...)` | Never removed |

**Note:** Many of these use guard flags like `window.__shortcutsInstalled` to prevent duplicate registration, but listeners are still never cleaned up.

### 2. `src/ui/preferencesDialog.js`

**Partial cleanup** - keydown handler is cleaned up but others are not.

| Line | Listener | Status |
|------|----------|--------|
| 184 | `modal.addEventListener('click', ...)` | NOT cleaned up |
| 193 | `headerCloseButton.addEventListener('click', ...)` | NOT cleaned up |
| 201 | `footerCloseButton.addEventListener('click', ...)` | NOT cleaned up |
| 208 | `document.addEventListener('keydown', this.keydownHandler)` | Cleaned up at line 66 |
| 211 | `modal.addEventListener('click', ...)` | NOT cleaned up |
| 223 | `resetButton.addEventListener('click', ...)` | NOT cleaned up |
| 228 | `shortcutsToggle.addEventListener('change', ...)` | NOT cleaned up |

### 3. `src/menu-system.js`

**Good pattern** - has a `destroy()` method that removes listeners.

```javascript
destroy() {
  document.removeEventListener('click', this._boundHandlers.clickOutside);
  document.removeEventListener('click', this._boundHandlers.menuActions);
  document.removeEventListener('keydown', this._boundHandlers.keyboardShortcuts);
}
```

**However:** The `destroy()` method may not be called on page unload or component unmount.

## Fix Requirements

### 1. handlers.js - Add Cleanup Registry

Create a cleanup pattern similar to menu-system.js:

```javascript
// At module level
const registeredListeners = [];

function registerListener(element, event, handler, options) {
  element.addEventListener(event, handler, options);
  registeredListeners.push({ element, event, handler, options });
}

function cleanupAllListeners() {
  for (const { element, event, handler, options } of registeredListeners) {
    element.removeEventListener(event, handler, options);
  }
  registeredListeners.length = 0;
}

// Export for app.js to call on cleanup
export { cleanupAllListeners };
```

### 2. preferencesDialog.js - Add Full Cleanup

Add a `destroy()` or `cleanup()` method that removes ALL listeners:

```javascript
cleanup() {
  document.removeEventListener('keydown', this.keydownHandler);
  // Remove modal click listeners
  // Remove button click listeners
  // Remove toggle change listeners
}
```

Store references to handlers so they can be removed:

```javascript
this._handlers = {
  modalClick: (e) => { ... },
  closeClick: () => { ... },
  // etc.
};
```

### 3. app.js - Call Cleanup on Unload

```javascript
window.addEventListener('beforeunload', () => {
  cleanupAllListeners();
  if (window.menuSystem?.destroy) window.menuSystem.destroy();
  if (window.preferencesDialog?.cleanup) window.preferencesDialog.cleanup();
});
```

### 4. Use AbortController Pattern (Modern Approach)

For new code, consider using AbortController for easier cleanup:

```javascript
const controller = new AbortController();

document.addEventListener('keydown', handler, { signal: controller.signal });
document.addEventListener('click', handler2, { signal: controller.signal });

// Cleanup all at once
controller.abort();
```

## Definition of Done

- [ ] All event listeners in `handlers.js` are tracked and can be cleaned up
- [ ] `preferencesDialog.js` has a `cleanup()` method that removes all listeners
- [ ] `app.js` calls cleanup methods on `beforeunload`
- [ ] No duplicate event handlers fire after repeated dialog open/close cycles
- [ ] Memory profiler shows no detached DOM nodes from leaked listeners
- [ ] Consider migrating to AbortController pattern for new listeners

## Testing

1. Open Chrome DevTools → Memory tab
2. Take heap snapshot
3. Open/close preferences dialog 10 times
4. Take another heap snapshot
5. Compare - should not see growing listener counts or detached nodes

## Priority

High - Memory leaks accumulate over time and can cause:
- Sluggish performance in long sessions
- Duplicate handler executions
- Unexpected behavior from stale closures
