
// File: src/setup/yjsSetup.js

import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { IndexeddbPersistence } from 'y-indexeddb';
import { v4 as uuidv4 } from 'uuid';

/**
 * Initializes the Yjs document, WebSocket provider, and awareness.
 * 
 * @returns {Object} ydoc, provider, ytext, awareness
 */
export function setupYjs() {
  const ydoc = new Y.Doc();
/*
  // Room ID from URL or fallback
  const urlParams = new URLSearchParams(window.location.search);
  const room = urlParams.get('room') || 'default-room';
*/

  // Room ID from URL or generate a UUID if missing
  const urlParams = new URLSearchParams(window.location.search);
  let room = urlParams.get('room');

  if (!room) {
    room = uuidv4();
    // Update URL in-place so user can copy/share it
    const newUrl = `${window.location.pathname}?room=${room}`;
    window.history.replaceState({}, '', newUrl);
    console.log(`[Yjs] No room specified, generated UUID: ${room}`);
  }
  
    


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
