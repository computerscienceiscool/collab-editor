// File: src/setup/editorSetup.js
import { EditorView, basicSetup } from 'codemirror';
import { EditorState, Compartment } from '@codemirror/state';
import { yCollab } from 'y-codemirror.next';
import { remoteCursorPlugin } from '../ui/remoteCursorPlugin.js';
import { history, undo, redo } from '@codemirror/commands';
import { keymap } from '@codemirror/view';
import { lineNumbers } from '@codemirror/view';
import { markdown } from '@codemirror/lang-markdown';

/**
 * Initializes the CodeMirror editor with proper line number compartment management.
 * 
 * @param {Y.Doc} ydoc - The Yjs document
 * @param {WebsocketProvider} provider - The Yjs WebSocket provider
 * @param {Y.Text} ytext - The shared Yjs text type
 * @param {awareness} awareness - Awareness instance for cursors, users
 * @returns {EditorView} - The initialized CodeMirror editor view
 */
export function setupEditor(ydoc, provider, ytext, awareness) {
  const editorElement = document.querySelector('#editor');

  // Create compartment for line numbers (allows dynamic reconfiguration)
  const lineNumberCompartment = new Compartment();
  
  // Check if line numbers should be enabled (default: true)
  const lineNumbersEnabled = localStorage.getItem('line-numbers-enabled') !== 'false';
  
  // Create line numbers extension
  const lineNumbersExtension = lineNumbers({
    domEventHandlers: {
      // Optional: Handle click events on line numbers
      mousedown: (view, line, event) => {
        // You could implement line selection here if needed
        console.log('Line number clicked:', line.from);
        return false; // Don't prevent default behavior
      }
    }
  });

  const state = EditorState.create({
    doc: '',
    extensions: [
      basicSetup,
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
      // Use compartment to manage line numbers
      lineNumberCompartment.of(lineNumbersEnabled ? lineNumbersExtension : []),
      yCollab(ytext, awareness, { clientID: ydoc.clientID }),
      ...remoteCursorPlugin(awareness, ydoc.clientID)
    ]
  });

  const view = new EditorView({
    state,
    parent: editorElement
  });

  // Make compartment and extension globally available for menu system
  window.editorLineNumberCompartment = lineNumberCompartment;
  window.lineNumbersExtension = lineNumbersExtension;
  window.editorView = view;

  // Log setup completion
  console.log('CodeMirror editor initialized with compartmented line numbers');
  console.log('Line numbers initially:', lineNumbersEnabled ? 'enabled' : 'disabled');

  return view;
}
