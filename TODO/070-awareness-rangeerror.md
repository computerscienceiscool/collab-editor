# TODO 070 - Investigate awareness position RangeError

When testing in the browser, a CodeMirror RangeError appears:

```
Uncaught RangeError: Position 89 is out of range for changeset of length 86
  at _ChangeSet.mapPos (chunk-VYTQKC4I.js:792)
  at findSharedChunks …
  at _RangeSet.compare …
  at findChangedDeco …
  at DocView.update …
```

Observed while awareness updates were flowing (stack includes `remoteCursorPlugin.js` and `automergeSetup.js` listeners). Likely cause: a remote awareness selection (anchor/head) exceeds the current document length after the local doc shrinks (e.g., offline edits or remote buffer divergence), so decoration mapping fails.

Definition of done:
- Reproduce reliably (e.g., make one client longer, then shrink the doc on another, or toggle offline/online).
- Normalize awareness selections before rendering (clamp anchor/head), or adjust awareness messages to stay within bounds.
- Verify no RangeErrors in the browser console during awareness updates.
