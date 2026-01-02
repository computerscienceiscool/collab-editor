// File: src/ui/typingIndicator.js

/**
 * Sets up typing indicator for remote users.
 *
 * @param {Object} awareness - Custom awareness instance (not Yjs)
 */
export function setupTypingIndicator(awareness) {
  const indicator = document.getElementById('typing-indicator');
  if (!indicator) return;

  const localID = getClientID();
  const active = new Map();

  awareness.on('change', (states) => {
    // Clear all previous typing timeouts
    active.forEach(clearTimeout);
    active.clear();

    const messages = [];

    states.forEach((state, id) => {
      if (id === localID) return;
      const user = state.user;
      const typing = state.typing;
      if (user?.name && typing) {
        messages.push(`${user.name} is typing…`);

        // Set timeout to clear after 2.5 seconds
        const timeout = setTimeout(() => {
          updateIndicator([]);
        }, 2500);
        active.set(id, timeout);
      }
    });

    updateIndicator(messages);
  });

  function updateIndicator(messages) {
    if (!messages.length) {
      indicator.textContent = '';
    } else {
      indicator.textContent = messages.join(', ');
    }
  }
}

// Helper function to get client ID
function getClientID() {
  let clientID = localStorage.getItem('automerge-client-id');
  if (!clientID) {
    clientID = crypto.randomUUID();
    localStorage.setItem('automerge-client-id', clientID);
  }
  return clientID;
}
