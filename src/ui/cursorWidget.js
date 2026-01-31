// File: src/ui/cursorWidget.js
export class CursorWidget {
  constructor(name, color, clientID) {
    this.name = name || 'User';
    this.color = color || '#000';
    this.clientID = clientID || '';
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

  // Required by CodeMirror WidgetType - update existing DOM instead of recreating
  updateDOM(dom) {
    // Update the cursor line color
    dom.style.borderLeft = '2px solid ' + this.color;
    // Update the label
    const label = dom.querySelector('.remote-cursor-label');
    if (label) {
      label.textContent = this.name;
      label.style.background = this.color;
    }
    return true;
  }

  ignoreEvent() { return true; }
  eq(other) { return this.clientID === other.clientID; }
  compare(other) { return this.clientID === other.clientID; }
  destroy() {}
  coordsAt() { return null; }
}
