// File: src/setup/editorSetup.js
import { EditorView, minimalSetup } from 'codemirror';
import { EditorState, Compartment } from '@codemirror/state';
import { remoteCursorPlugin } from '../ui/remoteCursorPlugin.js';
import { history, undo, redo } from '@codemirror/commands';
import { keymap } from '@codemirror/view';
import { lineNumbers } from '@codemirror/view';
import { markdown } from '@codemirror/lang-markdown';
import { next as Automerge } from '@automerge/automerge';

/**
 * Initializes the CodeMirror editor with Automerge integration.
 * 
 * CRITICAL: Automerge 2.x requires Automerge.updateText() for text operations
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

  // Flag to prevent update loops between editor and Automerge
  let isRemoteChange = false;
  let currentDoc = null;
  let lastSyncedContent = '';

  // Create update listener for local changes BEFORE creating state
  const updateListener = EditorView.updateListener.of((update) => {
    if (isRemoteChange) return;
    if (!update.docChanged) return;
    
    const newText = update.state.doc.toString();
    
    // Only update if content actually changed
    if (newText === lastSyncedContent) return;
    
    // Update Automerge document
    handle.change(d => {
      Automerge.updateText(d, ['content'], newText);
    });
    
    lastSyncedContent = newText;
    console.log('[Editor] Synced to Automerge:', newText.length, 'chars');
  });

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
      ...remoteCursorPlugin(awareness, getClientID()),
      updateListener
    ]
  });

  const view = new EditorView({
    state,
    parent: editorElement
  });

  // Handle remote changes (from other users) -> Update CodeMirror
  handle.on('change', ({ doc }) => {
    if (!doc || doc.content === undefined) {
      console.warn('[Editor] Document or content is undefined');
      return;
    }
    
    // Convert content to string (handles both string and Text types)
    const newText = typeof doc.content === 'string' ? doc.content : doc.content.toString();
    const oldText = view.state.doc.toString();
    
    // Only update if content actually changed
    if (newText !== oldText) {
      isRemoteChange = true;
      
      // Save cursor position and clamp to valid range
      const selection = view.state.selection.main;
      const newAnchor = Math.min(selection.anchor, newText.length);
      const newHead = Math.min(selection.head, newText.length);
      
      // Update editor content
      view.dispatch({
        changes: {
          from: 0,
          to: oldText.length,
          insert: newText
        },
        selection: { anchor: newAnchor, head: newHead }
      });
      
      // Update last synced content
      lastSyncedContent = newText;
      
      isRemoteChange = false;
    }
    
    currentDoc = doc;
  });

  // Load initial content when document is ready
  try {
    const doc = handle.doc();
    if (doc && doc.content !== undefined) {
      const initialText = typeof doc.content === 'string' ? doc.content : doc.content.toString();
      if (initialText.length > 0) {
        isRemoteChange = true;
        view.dispatch({
          changes: {
            from: 0,
            to: 0,
            insert: initialText
          }
        });
        lastSyncedContent = initialText;
        isRemoteChange = false;
        console.log('[Editor] Loaded initial content:', initialText.length, 'chars');
      }
      currentDoc = doc;
    }
  } catch (err) {
    console.error('[Editor] Failed to load initial content:', err);
  }

  // Make components globally available for menu system
  window.editorLineNumberCompartment = lineNumberCompartment;
  window.lineNumbersExtension = lineNumbersExtension;
  window.editorView = view;
  window.automergeHandle = handle;
  window.automergeDoc = currentDoc;
  
  // Add a direct toggle function for line numbers
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
    const content = currentDoc?.content;
    return typeof content === 'string' ? content : (content?.toString() || '');
  };

  console.log('[Editor] CodeMirror initialized with Automerge');
  console.log('[Editor] Line numbers initially:', lineNumbersEnabled ? 'enabled' : 'disabled');

  return view;
}

/**
 * Generate or retrieve persistent client ID
 */
function getClientID() {
  let clientID = localStorage.getItem('automerge-client-id');
  if (!clientID) {
    clientID = crypto.randomUUID();
    localStorage.setItem('automerge-client-id', clientID);
  }
  return clientID;
}
