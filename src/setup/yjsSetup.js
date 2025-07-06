
// File: src/setup/yjsSetup.js

import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { IndexeddbPersistence } from 'y-indexeddb';

/**
 * Initializes the Yjs document, WebSocket provider, and awareness.
 * 
 * @returns {Object} ydoc, provider, ytext, awareness
 */
export function setupYjs() {
  const ydoc = new Y.Doc();

  // Room ID from URL or fallback
  const urlParams = new URLSearchParams(window.location.search);
  const room = urlParams.get('room') || 'default-room';

    


  // Persist state locally
  const persistence = new IndexeddbPersistence(room, ydoc);
  persistence.once('synced', () => {
    console.log('[Yjs] Document loaded from IndexedDB');
  });

  // WebSocket provider
  const provider = new WebsocketProvider('ws://localhost:1234', room, ydoc);
  

  // Shared text type
  const ytext = ydoc.getText('codemirror');

  // Awareness for user cursors, etc.
  const awareness = provider.awareness;

  return { ydoc, provider, ytext, awareness, room  };
}
