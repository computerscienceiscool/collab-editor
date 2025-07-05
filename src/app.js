// File: src/app.js

// 1. Import all setup functions from your other modules
import { setupYjs } from './setup/yjsSetup.js';
import { setupEditor } from './setup/editorSetup.js';
import { setupExportHandlers } from './export/handlers.js';
import { setupUserControls } from './setup/userSetup.js';
import { setupUserLogging } from './ui/logging.js';
import { setupTypingIndicator } from './ui/typingIndicator.js';
import { setupUserList } from './ui/userList.js';

// 2. Declare a typingTimeout variable — it’s needed across functions
let typingTimeout = null;

// 3. Wait for the page (DOM) to load before touching any HTML elements
window.addEventListener('DOMContentLoaded', () => {
  // 3a. Set up Yjs state: shared document, awareness, etc.
  const { ydoc, provider, ytext, awareness } = setupYjs();

  // 3b. Set up the CodeMirror editor
  const view = setupEditor(ydoc, provider, ytext, awareness);

  // 3c. Hook up UI elements: name/color fields
  setupUserControls(provider);

  // 3d. Hook up save/export buttons
  setupExportHandlers(ydoc, ytext, view);

  // 3e. Track users joining/leaving
  setupUserLogging(awareness);

  // 3f. Show typing indicator in UI
  setupTypingIndicator(awareness);

  // 3g. Update user list in the toolbar
  setupUserList(awareness);

  // 3h. Detect when *this* user types and tell the others
  view.dom.addEventListener('keydown', () => {
    awareness.setLocalStateField('typing', true);

    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      awareness.setLocalStateField('typing', false);
    }, 1500);
  });
});
