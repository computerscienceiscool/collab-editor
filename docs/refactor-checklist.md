# Refactoring Checklist for `collab-editor`

This checklist is intended to guide the safe and gradual refactor of the `collab-editor` project, starting from the current monolithic JavaScript setup.

---

## ✅ Preparation

- [ ] Create a new branch for refactoring: `git checkout -b refactor-modular-structure`
- [ ] Create a `src/` folder to store all modular JS files
- [ ] Confirm existing functionality is working (baseline test)

---

## 🧹 Code Cleanup

- [ ] Remove dead code and old commented-out blocks
- [ ] Ensure all variables are declared (`let`, `const`)
- [ ] Check for any lingering console logs or debugging code

---

## 🔀 Modular Breakdown

- [ ] Move initialization (DOMContentLoaded, room setup, etc.) → `src/init.js`
- [ ] Move Yjs setup (Y.Doc, provider, awareness) → `src/yjs-setup.js`
- [ ] Move editor creation and plugins (EditorView, yCollab, remoteCursorPlugin) → `src/editor.js`
- [ ] Move UI interactions (user log, name/color input, sidebar toggle) → `src/ui.js`
- [ ] Move export functions → `src/export.js`
- [ ] Move CursorWidget and remoteCursorPlugin → `src/plugins/remoteCursorPlugin.js`

---

## 🔗 Integration

- [ ] Create a new `main.js` in `src/` that imports and runs each module
- [ ] Update `index.html` to load `dist/bundle.js` compiled from new entry point
- [ ] Confirm all features still work after modularization

---

## 🧪 Testing

- [ ] Confirm editor loads
- [ ] Confirm collaborative cursors show up
- [ ] Confirm export buttons work
- [ ] Confirm name/color inputs update awareness
- [ ] Confirm IndexedDB syncing works
- [ ] Confirm toggle sidebar and user log behave as expected

---

## 📦 Final Steps

- [ ] Remove old top-level JS file after confirming full migration
- [ ] Commit all changes with descriptive messages
- [ ] Push refactor branch and open pull request (if applicable)

---

Let me know if you want this checklist as an issue template or Markdown in the repo.
