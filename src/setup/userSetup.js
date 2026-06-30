
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

  if (!nameInput || !colorInput) {
    console.warn('Name or color input not found');
    return;
  }

  // Restore name/color from localStorage or use fallback
  const storedName = localStorage.getItem('username') || getRandomName();
  const storedColor = localStorage.getItem('usercolor') || getRandomColor();

  nameInput.value = storedName;
  colorInput.value = storedColor;

  // Update awareness and UI display
  updateAwarenessAndDisplay(storedName, storedColor);

  // Listen for changes
  nameInput.addEventListener('input', () => {
    const name = nameInput.value;
    localStorage.setItem('username', name);
    updateAwarenessAndDisplay(name, colorInput.value);
  });

  colorInput.addEventListener('input', () => {
    const color = colorInput.value;
    localStorage.setItem('usercolor', color);
    updateAwarenessAndDisplay(nameInput.value, color);
  });

  function updateAwarenessAndDisplay(name, color) {
    awareness.setLocalStateField('user', { name, color });
    const display = document.querySelector('#local-username');
    if (display) {
      display.textContent = `Current User: ${name}`;
    }
  }
}

function getRandomName() {
  const names = ['Explorer', 'Coder', 'Writer', 'Builder', 'User'];
  return names[Math.floor(Math.random() * names.length)];
}

function getRandomColor() {
  const colors = ['#ffb703', '#219ebc', '#8ecae6', '#ff006e', '#8338ec', '#06d6a0'];
  return colors[Math.floor(Math.random() * colors.length)];
}
