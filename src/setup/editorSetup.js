// File: src/setup/editorSetup.js
import { EditorView, basicSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { yCollab } from 'y-codemirror.next';
import { remoteCursorPlugin } from '../ui/remoteCursorPlugin.js';
import { history, undo, redo } from '@codemirror/commands';
import { keymap } from '@codemirror/view';

/**
 * Initializes the CodeMirror editor and attaches Yjs collaborative binding.
 * 
 * @param {Y.Doc} ydoc - The Yjs document
 * @param {WebsocketProvider} provider - The Yjs WebSocket provider
 * @param {Y.Text} ytext - The shared Yjs text type
 * @param {awareness} awareness - Awareness instance for cursors, users
 * @returns {EditorView} - The initialized CodeMirror editor view
 */
export function setupEditor(ydoc, provider, ytext, awareness) {
  const editorElement = document.querySelector('#editor');

  const state = EditorState.create({
    doc: '',
    extensions: [
      basicSetup, // Already includes basic history
      history(), // Add explicit history support
      keymap.of([
        { key: "Ctrl-z", run: undo },
        { key: "Ctrl-y", run: redo },
        { key: "Ctrl-Shift-z", run: redo }
      ]),
      yCollab(ytext, awareness, { clientID: ydoc.clientID }),
      ...remoteCursorPlugin(awareness, ydoc.clientID)
    ]
  });

  const view = new EditorView({
    state,
    parent: editorElement
  });

  return view;
}
