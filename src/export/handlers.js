
// File: src/export/handlers.js

import * as Y from 'yjs';
import { format_text, toggle_bold, toggle_italic, toggle_underline } from '../wasm/initWasm.js';

/**
 * Sets up handlers for the export buttons in the UI.
 * 
 * @param {Y.Doc} ydoc - The Yjs document
 * @param {Y.Text} ytext - The Yjs text field
 * @param {EditorView} view - The CodeMirror editor view
 */
export function setupExportHandlers(ydoc, ytext, view) {
  const saveButton = document.querySelector('#save-button');
  const formatButton = document.querySelector('#format-button');
  const boldButton = document.querySelector('#bold-button');
  const italicButton = document.querySelector('#italic-button');
  const underlineButton = document.querySelector('#underline-button');
  const formatSelect = document.querySelector('#save-format');

  if (!saveButton || !formatSelect) return;
   
  saveButton.onclick = () => {
    const format = formatSelect.value;
    handleSave(format, ydoc, ytext, view);
  };
  
   // Format button handler
  if (formatButton) {
    formatButton.onclick = () => {
      handleFormat(ytext, view);
    };
  }

  // Bold button handler
  if (boldButton) {
    boldButton.onclick = () => {
      handleToggleFormatting(view, toggle_bold, "Bold");
    };
  }

  // Italic button handler
  if (italicButton) {
    italicButton.onclick = () => {
      handleToggleFormatting(view, toggle_italic, "Italic");
    };
  }

  // Underline button handler
  if (underlineButton) {
    underlineButton.onclick = () => {
      handleToggleFormatting(view, toggle_underline, "Underline");
    };
  }
}


    

/**
 * Handles formatting toggle for selected text
 * 
 * @param {EditorView} view - The CodeMirror editor view
 * @param {Function} toggleFunction - The WASM toggle function
 * @param {string} formatName - Name for logging
 */
async function handleToggleFormatting(view, toggleFunction, formatName) {
  try {
    const selection = view.state.selection.main;
    
    if (selection.empty) {
      console.log(`No text selected for ${formatName} formatting`);
      return;
    }

    const selectedText = view.state.doc.sliceString(selection.from, selection.to);
    console.log(`WASM ${formatName.toUpperCase()} TOGGLE:`);
    console.log(`Selected: "${selectedText}"`);
    
    const formattedText = await toggleFunction(selectedText);
    console.log(`Result: "${formattedText}"`);
    
    // Replace the selected text
    view.dispatch({
      changes: {
        from: selection.from,
        to: selection.to,
        insert: formattedText
      },
      selection: {
        anchor: selection.from,
        head: selection.from + formattedText.length
      }
    });
    
    console.log(`WASM ${formatName} formatting applied successfully`);
  } catch (error) {
    console.error(`WASM ${formatName} formatting failed:`, error);
  }
}




/**
 * Formats the current document text using WASM.
 * 
 * @param {Y.Text} ytext - The Yjs text field
 * @param {EditorView} view - The CodeMirror editor view
 */

async function handleFormat(ytext, view) {
  try {
    const currentText = ytext.toString();
    console.log("WASM TEXT FORMATTING:");
    console.log("Original length:", currentText.length, "characters");
    
    const formattedText = await format_text(currentText);
    console.log("Formatted length:", formattedText.length, "characters");
    
    // Replace the text in the Yjs document
    ytext.delete(0, ytext.length);
    ytext.insert(0, formattedText);
    
    console.log("WASM formatting applied successfully");
  } catch (error) {
    console.error("WASM formatting failed:", error);
    alert("Failed to format text. Please try again.");
  }
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
