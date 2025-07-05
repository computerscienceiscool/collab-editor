// File: src/core/cursor-plugin.js
// File: src/core/cursor-plugin.js

import { CursorWidget } from '../ui/cursorWidget.js';
import { Decoration, ViewPlugin, DecorationSet } from '@codemirror/view';
import { StateField } from '@codemirror/state';

/**
 * Creates a CodeMirror ViewPlugin that displays remote user cursors.
 *
 * @param {awareness} awareness - Yjs awareness instance
 * @param {number} clientID - Y.Doc client ID
 * @returns {Extension} - CodeMirror extension
 */
export function remoteCursorPlugin(awareness, clientID) {
  return ViewPlugin.fromClass(
    class {
      constructor(view) {
        this.decorations = Decoration.none;
        this.view = view;

        this.updateDecorations();

        // Listen to awareness changes
        awareness.on('change', this.updateDecorations);
      }

      update(update) {
        if (update.docChanged || update.selectionSet) {
          this.updateDecorations();
        }
      }

      updateDecorations = () => {
        const decorations = [];

        awareness.getStates().forEach((state, id) => {
          if (id === clientID) return;

          const user = state.user;
          const cursor = state.selection?.anchor;

          if (typeof cursor === 'number') {
            const deco = Decoration.widget({
              widget: new CursorWidget(user.name, user.color),
              side: -1
            }).range(cursor);

            decorations.push(deco);
          }
        });

        this.decorations = Decoration.set(decorations);
        this.view.dispatch({
          effects: setRemoteCursors.of(this.decorations)
        });
      };

      destroy() {
        awareness.off('change', this.updateDecorations);
      }
    },
    {
      decorations: v => v.decorations
    }
  );
}

/**
 * CursorWidget is responsible for rendering a remote user’s name + color
 */
class CursorWidget {
  constructor(name, color) {
    this.name = name || 'User';
    this.color = color || '#000';
  }

  toDOM() {
    const wrapper = document.createElement('span');
    wrapper.className = 'remote-cursor';
    wrapper.style.borderLeft = `2px solid ${this.color}`;

    const label = document.createElement('div');
    label.textContent = this.name;
    label.style.background = this.color;

    wrapper.appendChild(label);
    return wrapper;
  }

  ignoreEvent() {
    return true;
  }
}

// StateField to trigger decoration redraws
const setRemoteCursors = StateField.define({
  create: () => Decoration.none,
  update: (deco, tr) => deco.map(tr.changes),
  provide: f => EditorView.decorations.from(f)
});
