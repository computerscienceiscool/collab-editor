// File: src/ui/remoteCursorPlugin.js

import { Decoration, ViewPlugin, EditorView } from '@codemirror/view';
import { StateField, StateEffect } from '@codemirror/state';
import { CursorWidget } from './cursorWidget.js';

/**
 * Creates a CodeMirror extension for displaying remote cursors.
 *
 * @param {Object} awareness - Custom awareness instance (not Yjs)
 * @param {string} clientID - Local client ID
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
      // Safely map decorations through changes
      // If mapping fails (position out of range), return empty decorations
      try {
        return deco.map(tr.changes);
      } catch (e) {
        // Position out of range - clear decorations, they'll be rebuilt
        console.warn('[RemoteCursor] Decoration mapping failed, clearing:', e.message);
        return Decoration.none;
      }
    },
    provide: f => EditorView.decorations.from(f)
  });

  // Define the plugin class for handling awareness updates
  const plugin = ViewPlugin.fromClass(
    class {
      constructor(view) {
        this.view = view;
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
        // Build decorations based on current awareness states
        // Positions are clamped at dispatch time to avoid race conditions
        const buildDecorations = (currentDocLength) => {
          const decorations = [];
          const states = awareness.getStates();

          states.forEach((state, id) => {
            if (id === clientID) return;

            const user = state.user;
            const selection = state.selection;

            if (user && selection && typeof selection.anchor === 'number') {
              // Clamp anchor to current doc length to avoid out-of-range errors
              const anchor = Math.max(0, Math.min(selection.anchor, currentDocLength));
              decorations.push(
                Decoration.widget({
                  widget: new CursorWidget(user.name, user.color, id),
                  side: -1,
                }).range(anchor)
              );
            }
          });

          return Decoration.set(decorations, true);
        };

        // Dispatch with fresh positions to avoid race condition
        // The setTimeout is needed to avoid recursive dispatch during update
        setTimeout(() => {
          try {
            // Re-check doc length at dispatch time (not when updateDecorations was called)
            const currentDocLength = this.view.state.doc.length;
            const freshDecorations = buildDecorations(currentDocLength);
            this.view.dispatch({
              effects: setRemoteCursors.of(freshDecorations)
            });
          } catch (e) {
            console.warn('[RemoteCursor] Dispatch failed:', e.message);
          }
        }, 0);
      }

      destroy() {
        awareness.off('change', this.updateDecorations);
      }
    }
  );

  return [remoteCursorField, plugin];
}
