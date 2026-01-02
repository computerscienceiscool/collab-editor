
// File: src/setup/editorSetup.js
import { EditorView, minimalSetup } from 'codemirror';
import { EditorState, Compartment } from '@codemirror/state';
import { remoteCursorPlugin } from '../ui/remoteCursorPlugin.js';
import { history, undo, redo } from '@codemirror/commands';
import { keymap } from '@codemirror/view';
import { lineNumbers } from '@codemirror/view';
import { markdown } from '@codemirror/lang-markdown';
import * as Automerge from '@automerge/automerge';

/**
 * Initializes the CodeMirror editor with Automerge integration.
 * 
 * @param {Repo} repo - The Automerge repository
 * @param {DocHandle} handle - The Automerge document handle  
 * @param {Object} awareness - Custom awareness implementation
 * @returns {EditorView} - The initialized CodeMirror editor view
 */
export function setupEditor(repo, handle, awareness) {
  const editorElement = document.querySelector('#editor');

  // Create compartment for line numbers (allows dynamic reconfiguration)
  const lineNumberCompartment = new Compartment();
  
  // Check if line numbers should be enabled (default: true)
  const lineNumbersEnabled = localStorage.getItem('line-numbers-enabled') !== 'false';
  
  // Create line numbers extension
  const lineNumbersExtension = lineNumbers({
    domEventHandlers: {
      mousedown: (view, line, event) => {
        console.log('Line number clicked:', line.from);
        return false;
      }
    }
  });

  // Flag to prevent update loops
  let isRemoteChange = false;
  let currentDoc = null;

  const state = EditorState.create({
    doc: '',
    extensions: [
      minimalSetup,
      markdown(),
      history(),
      keymap.of([
        { key: "Ctrl-z", run: (view) => {
          if (window.shortcutManager && !window.shortcutManager.isEnabled()) return false;
          return undo(view);
        }},
        { key: "Ctrl-y", run: (view) => {
          if (window.shortcutManager && !window.shortcutManager.isEnabled()) return false;
          return redo(view);
        }},
        { key: "Ctrl-Shift-z", run: (view) => {
          if (window.shortcutManager && !window.shortcutManager.isEnabled()) return false;
          return redo(view);
        }}
      ]),
      lineNumberCompartment.of(lineNumbersEnabled ? lineNumbersExtension : []),
      ...remoteCursorPlugin(awareness, getClientID())
    ]
  });

  const view = new EditorView({
    state,
    parent: editorElement
  });

  // Set up bidirectional sync between CodeMirror and Automerge
  
  // 1. Handle local changes (user typing) -> Update Automerge
  view.dom.addEventListener('input', () => {
    if (isRemoteChange) return;
    
    const newText = view.state.doc.toString();
    
    // Update Automerge document
    handle.change(d => {
      if (!d.content) {
        d.content = new Automerge.Text();
      }
      
      // Clear existing content
      if (d.content.length > 0) {
        for (let i = d.content.length - 1; i >= 0; i--) {
          d.content.deleteAt(i);
        }
      }
      
      // Insert new content
      if (newText.length > 0) {
        d.content.insertAt(0, ...newText);
      }
    });
  });

  // 2. Handle remote changes (from other users) -> Update CodeMirror
  handle.on('change', ({ doc }) => {
    if (!doc || !doc.content) return;
    
    const newText = doc.content.toString();
    const oldText = view.state.doc.toString();
    
    if (newText !== oldText) {
      isRemoteChange = true;
      
      // Save cursor position
      const selection = view.state.selection.main;
      
      // Update editor content
      view.dispatch({
        changes: {
          from: 0,
          to: oldText.length,
          insert: newText
        },
        selection: { anchor: selection.anchor, head: selection.head }
      });
      
      isRemoteChange = false;
    }
    
    currentDoc = doc;
  });

  // Load initial content
  handle.doc().then(doc => {
    if (doc && doc.content) {
      const initialText = doc.content.toString();
      if (initialText.length > 0) {
        isRemoteChange = true;
        view.dispatch({
          changes: {
            from: 0,
            to: 0,
            insert: initialText
          }
        });
        isRemoteChange = false;
      }
      currentDoc = doc;
    }
  });

  // Make components globally available for menu system
  window.editorLineNumberCompartment = lineNumberCompartment;
  window.lineNumbersExtension = lineNumbersExtension;
  window.editorView = view;
  window.automergeHandle = handle;
  window.automergeDoc = currentDoc;
  
  // Add a direct toggle function
  window.toggleLineNumbers = function() {
    const currentlyEnabled = localStorage.getItem('line-numbers-enabled') !== 'false';
    const newState = !currentlyEnabled;
    
    console.log('=== LINE NUMBERS TOGGLE ===');
    console.log('Current state:', currentlyEnabled);
    console.log('New state:', newState);
    
    view.dispatch({
      effects: lineNumberCompartment.reconfigure(
        newState ? lineNumbersExtension : []
      )
    });
    localStorage.setItem('line-numbers-enabled', newState.toString());
    
    console.log('Toggle completed');
    return newState;
  };

  // Helper function to get current document content
  window.getAutomergeContent = function() {
    return currentDoc?.content?.toString() || '';
  };

  console.log('CodeMirror editor initialized with Automerge');
  console.log('Line numbers initially:', lineNumbersEnabled ? 'enabled' : 'disabled');

  return view;
}

// Generate or retrieve persistent client ID
function getClientID() {
  let clientID = localStorage.getItem('automerge-client-id');
  if (!clientID) {
    clientID = crypto.randomUUID();
    localStorage.setItem('automerge-client-id', clientID);
  }
  return clientID;
}
