// File: src/ui/cursorWidget.js
export class CursorWidget {
  constructor(name, color) {
    this.name = name || 'User';
    this.color = color || '#000';
  }

  toDOM() {
    const wrapper = document.createElement('span');
    wrapper.className = 'remote-cursor';
    wrapper.style.borderLeft = '2px solid ' + this.color;

    const label = document.createElement('span');
    label.className = 'remote-cursor-label';
    label.textContent = this.name;
    label.style.background = this.color;

    wrapper.appendChild(label);
    return wrapper;
  }

  ignoreEvent() { return true; }
  eq(other) { return this.name === other.name && this.color === other.color; }
  compare(other) { return this.name === other.name && this.color === other.color; }
  destroy() {}
  coordsAt() { return null; }
}
