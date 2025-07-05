// File: src/setup/editorSetup.js

import { EditorView, basicSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { yCollab } from 'y-codemirror.next';
import { remoteCursorPlugin } from '../ui/remoteCursorPlugin.js';

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
      basicSetup,
      yCollab(ytext, awareness, { clientID: ydoc.clientID }),
      ...remoteCursorPlugin(awareness, ydoc.clientID)  // Spread the plugin array here
    ]
  });

  const view = new EditorView({
    state,
    parent: editorElement
  });

  return view;
}

