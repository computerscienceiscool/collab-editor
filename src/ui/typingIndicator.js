// File: src/ui/typingIndicator.js
import { getClientID } from '../utils/clientId.js';

// Module-level handler reference for cleanup (prevents duplicate listeners)
let changeHandler = null;

/**
 * Sets up typing indicator for remote users.
 * Uses named handler to prevent duplicate listeners on re-initialization.
 *
 * @param {Object} awareness - Custom awareness instance
 */
export function setupTypingIndicator(awareness) {
  const indicator = document.getElementById('typing-indicator');
  if (!indicator) return;

  // Remove previous handler if exists (prevents duplicates on HMR/re-init)
  if (changeHandler) {
    awareness.off('change', changeHandler);
  }

  const localID = getClientID();
  const active = new Map();

  // Create named handler for cleanup capability
  changeHandler = (states) => {
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
  };

  // Register the handler
  awareness.on('change', changeHandler);

  function updateIndicator(messages) {
    if (!messages.length) {
      indicator.textContent = '';
    } else {
      indicator.textContent = messages.join(', ');
    }
  }
}
