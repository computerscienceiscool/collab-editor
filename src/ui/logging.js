// File: src/ui/logging.js
import { formatTime } from '../utils/timeUtils.js';

/**
 * Sets up user join/leave logging in the activity sidebar.
 *
 * @param {awareness} awareness - Yjs awareness instance
 */
export function setupUserLogging(awareness) {
  const logContainer = document.getElementById('log-entries');

  if (!logContainer) return;

  const localClientID = awareness.clientID;

  awareness.on('update', ({ added, removed }) => {
    const states = awareness.getStates();

    for (const id of added) {
      if (id === localClientID) continue;
      const user = states.get(id)?.user;
      if (user) logEntry(`${user.name} joined`, user.color);
    }

    for (const id of removed) {
      const user = states.get(id)?.user;
      if (user) logEntry(`${user.name} left`, user.color);
    }
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
