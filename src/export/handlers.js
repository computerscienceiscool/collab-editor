// File: src/export/handlers.js
import { Decoration, ViewPlugin } from '@codemirror/view';
import { search_document } from '../wasm/initWasm.js';
import * as Y from 'yjs';
import { encode, decode } from 'cbor-x'; 
import {
  format_text,
  toggle_bold,
  toggle_italic,
  toggle_underline,
  toggle_strikethrough,
  toggle_heading,
  toggle_list,
  convert_url_to_markdown,
  promiseGrid,
  getCurrentSessionInfo
} from '../wasm/initWasm.js';

import { undo, redo } from '@codemirror/commands';

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
  const linkButton = document.querySelector('#link-button');
  const formatSelect = document.querySelector('#save-format');
  const undoButton = document.querySelector('#undo-button');
  const redoButton = document.querySelector('#redo-button');
  const strikeButton = document.querySelector('#strike-button');
  const headingButton = document.querySelector('#heading-button');
  const listButton = document.querySelector('#list-button');
  // Add these lines in your setupExportHandlers function
  const searchButton = document.querySelector('#search-button');
  const clearSearchButton = document.querySelector('#clear-search');
  const searchInput = document.querySelector('#search-input');

  if (searchButton && searchInput) {
    searchButton.onclick = () => {
      handleSearch(view);
    };
  }

  if (clearSearchButton) {
    clearSearchButton.onclick = () => {
      handleClearSearch(view);
    };
  }

  // Allow Enter key in search input
  if (searchInput) {
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        handleSearch(view);
      }
    });
  }
  

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

  // Undo button handler
  if (undoButton) {
    undoButton.onclick = () => {
      undo(view);
      console.log("Undo applied");
    };
  }

  // Redo button handler  
  if (redoButton) {
    redoButton.onclick = () => {
      redo(view);
      console.log("Redo applied");
    };
  }
  
  // Strikethrough handler
  if (strikeButton) {
    strikeButton.onclick = () => {
      handleToggleFormatting(view, toggle_strikethrough, "Strikethrough");
    };
  }

  // Heading handler (e.g., toggles between #, ##, ###)
  // H1 button handler
  const heading1Button = document.querySelector('#heading1-button');
  if (heading1Button) {
    heading1Button.onclick = () => {
      handleToggleFormatting(view, (text) => toggle_heading(text, 1), "Heading 1");
    };
  }

  // H2 button handler
  const heading2Button = document.querySelector('#heading2-button');
  if (heading2Button) {
    heading2Button.onclick = () => {
      handleToggleFormatting(view, (text) => toggle_heading(text, 2), "Heading 2");
    };
  }

  // H3 button handler
  const heading3Button = document.querySelector('#heading3-button');
  if (heading3Button) {
    heading3Button.onclick = () => {
      handleToggleFormatting(view, (text) => toggle_heading(text, 3), "Heading 3");
    };
  }

  // List formatting (e.g., toggles bullet points)
  if (listButton) {
    listButton.onclick = () => {
      handleToggleFormatting(view, (text) => toggle_list(text, "bullet"), "List");
    };
  }

  // Link button handler
  // This button converts URLs in the text to Markdown links
  if (linkButton) {
    linkButton.onclick = () => {
      handleToggleFormatting(view, convert_url_to_markdown, "Link");
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

    // NEW: Send edit as PromiseGrid message
    sendEditAsPromiseGridMessage(formatName.toLowerCase(), selection.from, formattedText, view);
    
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
    
    console.log("JAVASCRIPT TEXT FORMATTING (WASM bypass):");
    console.log("Original length:", currentText.length, "characters");
    
    // Validate input
    if (!currentText || typeof currentText !== 'string') {
      console.log("No valid text to format");
      return;
    }

    // Do the formatting in JavaScript instead of WASM (temporary fix)
    let formattedText = currentText
      // Remove excessive blank lines (more than 2 in a row)
      .replace(/\n{3,}/g, '\n\n')
      // Fix spacing around punctuation
      .replace(/\s+([,.!?;:])/g, '$1')
      // Fix spacing in parentheses
      .replace(/\(\s+/g, '(')
      .replace(/\s+\)/g, ')')
      // Fix multiple spaces
      .replace(/[ \t]{2,}/g, ' ')
      // Fix spacing around markdown bold/italic
      .replace(/\*\*\s+/g, '**')
      .replace(/\s+\*\*/g, '**')
      .replace(/\*\s+/g, '*')
      .replace(/\s+\*/g, '*')
      // Trim whitespace at start/end of lines
      .split('\n')
      .map(line => line.trim())
      .join('\n')
      // Ensure single trailing newline
      .replace(/\n*$/, '\n');

    console.log("Formatted length:", formattedText.length, "characters");
    
    // Replace the text in the Yjs document
    ytext.delete(0, ytext.length);
    ytext.insert(0, formattedText);
    
    console.log("JavaScript formatting applied successfully (WASM bypassed)");

    // Send format action as PromiseGrid message
    sendEditAsPromiseGridMessage("format", 0, formattedText, view);
    
  } catch (error) {
    console.error("JavaScript formatting failed:", error);
    alert("Failed to format text: " + error.message);
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

    case 'cbor':
      const cborData = {
        content: ytext.toString(),
        metadata: {
          room_id: window.location.search.replace('?room=', '') || 'default',
          timestamp: Date.now(),
          format: 'cbor'
        }
      };
      const encodedCbor = encode(cborData);
      blob = new Blob([encodedCbor], { type: 'application/cbor' });
      filename = 'document.cbor';
      break;

    // NEW: PromiseGrid CBOR export
    case 'promisegrid':
      handlePromiseGridExport(ydoc, ytext, view);
      return; // Don't continue with regular download

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

// NEW: PromiseGrid export handler
function handlePromiseGridExport(ydoc, ytext, view) {
  try {
    const content = ytext.toString();
    const { documentId, userId } = getCurrentSessionInfo();
    
    // Create PromiseGrid CBOR message
    const cborBytes = promiseGrid.exportDocument(content, documentId, userId);
    
    // Log to console so you can see it working!
    promiseGrid.logMessage(cborBytes);
    
    // Create download
    const blob = new Blob([cborBytes], { type: 'application/cbor' });
    const filename = `${documentId}_promisegrid.cbor`;
    downloadBlob(blob, filename);
    
    console.log(' PromiseGrid CBOR export completed!');
    
  } catch (error) {
    console.error(' PromiseGrid export failed:', error);
    alert('PromiseGrid export failed: ' + error.message);
  }
}

// NEW: Send edit as PromiseGrid message
function sendEditAsPromiseGridMessage(editType, position, content, view) {
  try {
    const { documentId, userId } = getCurrentSessionInfo();
    
    // Create PromiseGrid message for this edit
    const cborBytes = promiseGrid.createEditMessage(
      documentId,
      editType, 
      position,
      content,
      userId
    );
    
    // Log it so you can see the messages being created
    promiseGrid.logMessage(cborBytes);
    
    // Here you would normally send cborBytes over the network
    // For now, we're just logging to see it working
    console.log(`Created PromiseGrid message for ${editType} edit`);
    
    return cborBytes;
  } catch (error) {
    console.error(' Failed to create PromiseGrid edit message:', error);
  }
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

function handleSearch(view) {
  const searchInput = document.querySelector('#search-input');
  const query = searchInput.value.trim();
  
  if (!query) {
    console.log('No search query entered');
    return;
  }
  
  // Show that we're searching
  searchInput.disabled = true;
  
  // Use setTimeout to prevent blocking the UI
  setTimeout(() => {
    try {
      const content = view.state.doc.toString();
      const results = search_document(content, query, false);
      
      console.log('Search results:', results);
      
      const matches = JSON.parse(results);
      highlightMatches(view, matches);
      
    } catch (e) {
      console.error('Error parsing search results:', e);
      alert('Search error: ' + e.message);
    } finally {
      searchInput.disabled = false;
    }
  }, 10);
}


function handleClearSearch(view) {
  const searchInput = document.querySelector('#search-input');
  searchInput.value = '';
  clearHighlights(view);
  console.log('Search cleared');
}





const searchHighlight = Decoration.mark({
  class: 'search-highlight',
  attributes: { style: 'background-color: yellow; color: black;' }
});

let currentSearchDecorations = Decoration.set([]); 

function highlightMatches(view, matches) {
  console.log('Found', matches.length, 'matches:', matches);
  
  if (matches.length === 0) {
    alert('No matches found');
    return;
  }
  
  // Just scroll to and select the first match
  const firstMatch = matches[0];
  view.dispatch({
    selection: { anchor: firstMatch.start, head: firstMatch.end },
    scrollIntoView: true
  });
  
  // Show user how many matches were found
  alert(`Found ${matches.length} matches. First match selected.`);
}


function clearHighlights(view) {
  // Clear selection
  const currentPos = view.state.selection.main.head;
  view.dispatch({
    selection: { anchor: currentPos, head: currentPos }
  });
  console.log('Search cleared');
}

