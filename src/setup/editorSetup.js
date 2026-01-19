// File: src/setup/editorSetup.js
import { EditorView, minimalSetup } from 'codemirror';
import { EditorState, Compartment, Annotation } from '@codemirror/state';
import { remoteCursorPlugin } from '../ui/remoteCursorPlugin.js';
import { history, undo, redo } from '@codemirror/commands';
import { keymap } from '@codemirror/view';
import { lineNumbers } from '@codemirror/view';
import { markdown } from '@codemirror/lang-markdown';
import { next as Automerge } from '@automerge/automerge';
import { getClientID } from '../utils/clientId.js';

/**
 * Annotation to mark transactions as originating from remote changes.
 * Using annotations instead of a mutable flag prevents race conditions
 * when concurrent updates occur.
 */
const isRemoteChange = Annotation.define();

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

  let currentDoc = null;
  let lastSyncedContent = '';

  // Create update listener for local changes BEFORE creating state
  // Uses transaction annotations to detect remote changes (race-condition-free)
  const updateListener = EditorView.updateListener.of((update) => {
    // Check if any transaction in this update is marked as a remote change
    // This is race-condition-free since annotations are per-transaction
    const hasRemoteChange = update.transactions.some(
      tr => tr.annotation(isRemoteChange)
    );
    if (hasRemoteChange) return;

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
  // Uses transaction annotations instead of mutable flag for race-condition-free sync
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
      // Save cursor position and clamp to valid range
      const selection = view.state.selection.main;
      const newAnchor = Math.min(selection.anchor, newText.length);
      const newHead = Math.min(selection.head, newText.length);

      // Update editor content with remote change annotation
      // The annotation marks this transaction so updateListener ignores it
      view.dispatch({
        changes: {
          from: 0,
          to: oldText.length,
          insert: newText
        },
        selection: { anchor: newAnchor, head: newHead },
        annotations: isRemoteChange.of(true)
      });

      // Update last synced content
      lastSyncedContent = newText;
    }

    currentDoc = doc;
  });

  // Load initial content when document is ready
  try {
    const doc = handle.doc();
    if (doc && doc.content !== undefined) {
      const initialText = typeof doc.content === 'string' ? doc.content : doc.content.toString();
      if (initialText.length > 0) {
        view.dispatch({
          changes: {
            from: 0,
            to: 0,
            insert: initialText
          },
          annotations: isRemoteChange.of(true)
        });
        lastSyncedContent = initialText;
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
