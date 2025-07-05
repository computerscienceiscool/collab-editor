
// File: src/setup/userSetup.js

/**
 * Sets up user name/color input listeners and updates Yjs awareness state.
 * 
 * @param {WebsocketProvider} provider - The Yjs WebSocket provider
 */
export function setupUserControls(provider) {
  const nameInput = document.querySelector('#name-input');
  const colorInput = document.querySelector('#color-input');
  const awareness = provider.awareness;

  // Restore name/color from localStorage
  const storedName = localStorage.getItem('username') || '';
  const storedColor = localStorage.getItem('usercolor') || '#000000';

  nameInput.value = storedName;
  colorInput.value = storedColor;

  // Apply initial awareness state
  awareness.setLocalStateField('user', {
    name: storedName,
    color: storedColor
  });

  // Update on name change
  nameInput.addEventListener('input', () => {
    const name = nameInput.value;
    localStorage.setItem('username', name);
    awareness.setLocalStateField('user', {
      name,
      color: colorInput.value
    });
  });

  // Update on color change
  colorInput.addEventListener('input', () => {
    const color = colorInput.value;
    localStorage.setItem('usercolor', color);
    awareness.setLocalStateField('user', {
      name: nameInput.value,
      color
    });
  });
}
