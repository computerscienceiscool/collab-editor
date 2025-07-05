
// File: src/ui/remoteCursorPlugin.js

import { Decoration, ViewPlugin, EditorView } from '@codemirror/view';
import { StateField } from '@codemirror/state';
import { CursorWidget } from './cursorWidget.js';

/**
 * Creates a CodeMirror extension for displaying remote cursors.
 *
 * @param {awareness} awareness - Yjs awareness instance
 * @param {number} clientID - Local Y.Doc client ID
 * @returns {Extension} - CodeMirror extension
 */
export function remoteCursorPlugin(awareness, clientID) {
  const remoteCursorField = StateField.define({
    create() {
      return Decoration.none;
    },
    update(deco, tr) {
      return Decoration.none;
    }
  });

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
        this.view.dispatch({
          effects: remoteCursorField.init(this.decorations),
        });
      }

      destroy() {
        awareness.off('change', this.updateDecorations);
      }
    },
    {
      decorations: v => v.decorations,
    }
  );

  return [remoteCursorField, plugin];
}
