// File: src/ui/cursorWidget.js

/**
 * Renders the DOM element used for remote cursors in the editor.
 * Used by remoteCursorPlugin in src/core/cursor-plugin.js
 */
export class CursorWidget {
  constructor(name, color) {
    this.name = name || 'User';
    this.color = color || '#000';
  }

  /**
   * Return the DOM structure for the cursor marker.
   * Example:
   *   <span class="remote-cursor" style="border-left: 2px solid #color">
   *     <div style="background: #color">Name</div>
   *   </span>
   */
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

  /**
   * Instructs CodeMirror to ignore events inside this widget
   */
  ignoreEvent() {
    return true;
  }
}
