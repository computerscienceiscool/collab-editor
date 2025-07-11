
// File: src/export/handlers.js

import * as Y from 'yjs';

/**
 * Sets up handlers for the export buttons in the UI.
 * 
 * @param {Y.Doc} ydoc - The Yjs document
 * @param {Y.Text} ytext - The Yjs text field
 * @param {EditorView} view - The CodeMirror editor view
 */
export function setupExportHandlers(ydoc, ytext, view) {
  const saveButton = document.querySelector('#save-button');
  const formatSelect = document.querySelector('#save-format');

  if (!saveButton || !formatSelect) return;

  saveButton.onclick = () => {
    const format = formatSelect.value;
    handleSave(format, ydoc, ytext, view);
  };
}

/**
 * Exports document based on selected format.
 * 
 * @param {string} format - The export format selected by user
 * @param {Y.Doc} ydoc
 * @param {Y.Text} ytext
 * @param {EditorView} view
 */
function handleSave(format, ydoc, ytext, view) {
  let content, blob, filename;

  switch (format) {
    case 'txt':
      content = ytext.toString();
      blob = new Blob([content], { type: 'text/plain' });
      filename = 'document.txt';
      break;

    case 'json':
      content = JSON.stringify(view.state.toJSON(), null, 2);
      blob = new Blob([content], { type: 'application/json' });
      filename = 'codemirror_state.json';
      break;

    case 'ysnap':
      const snapshot = Y.encodeStateAsUpdate(ydoc);
      blob = new Blob([snapshot], { type: 'application/octet-stream' });
      filename = 'snapshot.ysnap';
      break;

    case 'yjs':
      const update = Y.encodeStateAsUpdate(ydoc);
      const array = Array.from(update);
      content = JSON.stringify(array, null, 2);
      blob = new Blob([content], { type: 'application/json' });
      filename = 'snapshot.json';
      break;

    default:
      alert('Unsupported export format.');
      return;
  }

  downloadBlob(blob, filename);
}

/**
 * Triggers download of the given blob.
 * 
 * @param {Blob} blob - The blob data
 * @param {string} filename - Desired filename
 */
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
