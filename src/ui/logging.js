// File: src/ui/logging.js
import { formatTime } from '../utils/timeUtils.js';
import { getClientID } from '../utils/clientId.js';

/**
 * Sets up user join/leave logging in the activity sidebar.
 *
 * @param {Object} awareness - Custom awareness instance (not Yjs)
 */
export function setupUserLogging(awareness) {
  const logContainer = document.getElementById('log-entries');

  if (!logContainer) return;

  // Get local client ID
  const localClientID = getClientID();
  
  // Track previous states to detect joins/leaves
  let previousStates = new Map();

  awareness.on('change', (states) => {
    const currentStates = new Map(states);
    
    // Detect new joins
    currentStates.forEach((state, id) => {
      if (id === localClientID) return;
      
      if (!previousStates.has(id)) {
        // User joined
        const user = state.user;
        if (user) {
          logEntry(`${user.name} joined`, user.color);
        }
      }
    });
    
    // Detect leaves
    previousStates.forEach((state, id) => {
      if (id === localClientID) return;
      
      if (!currentStates.has(id)) {
        // User left
        const user = state.user;
        if (user) {
          logEntry(`${user.name} left`, user.color);
        }
      }
    });
    
    previousStates = currentStates;
  });

  function logEntry(message, color = '#000') {
    const entry = document.createElement('div');
    entry.className = 'log-entry';

    const colorDot = document.createElement('span');
    colorDot.className = 'log-color';
    colorDot.style.backgroundColor = color;

    const text = document.createElement('span');
    text.textContent = message;

    const timestamp = document.createElement('span');
    timestamp.className = 'log-timestamp';
    timestamp.textContent = formatTime(new Date());

    entry.appendChild(colorDot);
    entry.appendChild(text);
    entry.appendChild(timestamp);
    logContainer.appendChild(entry);
  }

  function formatTime(date) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}
