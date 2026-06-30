
// File: src/ui/remoteCursorPlugin.js

import { Decoration, ViewPlugin, EditorView } from '@codemirror/view';
import { StateField, StateEffect } from '@codemirror/state';
import { CursorWidget } from './cursorWidget.js';

/**
 * Creates a CodeMirror extension for displaying remote cursors.
 *
 * @param {awareness} awareness - Yjs awareness instance
 * @param {number} clientID - Local Y.Doc client ID
 * @returns {Extension} - CodeMirror extension
 */
export function remoteCursorPlugin(awareness, clientID) {
  // Define a StateEffect for setting remote cursor decorations
  const setRemoteCursors = StateEffect.define();

  // Define a StateField to hold remote cursor decorations
  const remoteCursorField = StateField.define({
    create() {
      return Decoration.none;
    },
    update(deco, tr) {
      for (let e of tr.effects) {
        if (e.is(setRemoteCursors)) {
          return e.value;
        }
      }
      return deco.map(tr.changes);
    },
    provide: f => EditorView.decorations.from(f)
  });

  // Define the plugin class for handling awareness updates
  const plugin = ViewPlugin.fromClass(
    class {
      constructor(view) {
        this.view = view;
        this.decorations = Decoration.none;
        this.updateDecorations = this.updateDecorations.bind(this);
        this.updateDecorations();

        awareness.on('change', this.updateDecorations);
      }

      update(update) {
        if (update.docChanged || update.selectionSet) {
          this.updateDecorations();
        }
      }

      updateDecorations() {
        const decorations = [];

        awareness.getStates().forEach((state, id) => {
          if (id === clientID) return;

          const user = state.user;
          const selection = state.selection;

          if (user && selection && typeof selection.anchor === 'number') {
            decorations.push(
              Decoration.widget({
                widget: new CursorWidget(user.name, user.color),
                side: -1,
              }).range(selection.anchor)
            );
          }
        });

        this.decorations = Decoration.set(decorations);

        // Safely dispatch decoration update
        setTimeout(() => {
          this.view.dispatch({
            effects: setRemoteCursors.of(this.decorations)
          });
        }, 0);
      }

      destroy() {
        awareness.off('change', this.updateDecorations);
      }
    }
  );

  return [remoteCursorField, plugin];
}
