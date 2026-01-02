// File: src/setup/automergeSetup.js

import { Repo } from '@automerge/automerge-repo'
import { BrowserWebSocketClientAdapter } from '@automerge/automerge-repo-network-websocket'
import { IndexedDBStorageAdapter } from '@automerge/automerge-repo-storage-indexeddb'
import * as Automerge from '@automerge/automerge'

/**
 * Initializes the Automerge repository, document, and custom awareness.
 * 
 * @returns {Object} repo, handle, doc, awareness, room
 */
export async function setupAutomerge() {
  // Room ID from URL or fallback
  const urlParams = new URLSearchParams(window.location.search);
  const room = urlParams.get('room') || 'default-room';

  // Create Automerge repository with WebSocket and IndexedDB
  const repo = new Repo({
    // TODO: Add network adapter later -     // network: [new BrowserWebSocketClientAdapter('ws://localhost:1234')],
    storage: new IndexedDBStorageAdapter(),
  });

  // Find or create document for this room
  const handle = repo.create();
  
  // Wait for handle to be ready before initializing
  await handle.whenReady();
  
  // Initialize document structure if needed
  const doc = await handle.doc();
  if (!doc || !doc.content) {
    handle.change(d => {
      if (!d.content) {
        d.content = "";
        // Convert to Automerge.Text by splicing
        Automerge.splice(d, ["content"], 0, 0, "");
      }
      if (!d.metadata) {
        d.metadata = {};
      }
    });
  }

  // Custom awareness implementation (Automerge doesn't have built-in awareness)
  const awareness = createCustomAwareness(room);

  console.log('[Automerge] Repository initialized for room:', room);

  return { repo, handle, doc: await handle.doc(), awareness, room };
}

/**
 * Creates a custom awareness system to replace Yjs awareness
 * This handles user presence, cursors, and typing indicators
 */
function createCustomAwareness(room) {
  const localState = {
    user: { name: 'User', color: '#000000' },
    typing: false,
    cursor: null
  };

  const remoteStates = new Map();
  const listeners = new Set();

  // Broadcast local state changes via WebSocket
  const broadcastState = () => {
    const ws = getOrCreateWebSocket(room);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'awareness',
        clientID: getClientID(),
        state: localState
      }));
    }
  };

  // Handle incoming awareness messages
  const handleAwarenessMessage = (data) => {
    if (data.type === 'awareness' && data.clientID !== getClientID()) {
      remoteStates.set(data.clientID, data.state);
      notifyListeners();
    }
  };

  // Notify all listeners of state changes
  const notifyListeners = () => {
    const states = getAllStates();
    listeners.forEach(callback => callback(states));
  };

  // Get all states (local + remote)
  const getAllStates = () => {
    const states = new Map();
    states.set(getClientID(), localState);
    remoteStates.forEach((state, clientID) => {
      states.set(clientID, state);
    });
    return states;
  };

  // Public API (mimics Yjs awareness API)
  return {
    setLocalStateField(field, value) {
      localState[field] = value;
      broadcastState();
    },

    getLocalState() {
      return localState;
    },

    getStates() {
      return getAllStates();
    },

    on(event, callback) {
      if (event === 'change') {
        listeners.add(callback);
      }
    },

    off(event, callback) {
      if (event === 'change') {
        listeners.delete(callback);
      }
    },

    // Internal method for handling incoming messages
    _handleMessage: handleAwarenessMessage
  };
}

// Shared WebSocket connection for awareness
let sharedWebSocket = null;
let awarenessHandlers = [];

function getOrCreateWebSocket(room) {
  if (!sharedWebSocket || sharedWebSocket.readyState === WebSocket.CLOSED) {
    sharedWebSocket = new WebSocket(`ws://localhost:1234`);
    
    sharedWebSocket.onopen = () => {
      console.log('[Awareness] WebSocket connected');
      // Join room
      sharedWebSocket.send(JSON.stringify({
        type: 'join',
        room: room
      }));
    };

    sharedWebSocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        awarenessHandlers.forEach(handler => handler(data));
      } catch (e) {
        console.error('[Awareness] Failed to parse message:', e);
      }
    };

    sharedWebSocket.onerror = (error) => {
      console.error('[Awareness] WebSocket error:', error);
    };

    sharedWebSocket.onclose = () => {
      console.log('[Awareness] WebSocket closed');
      sharedWebSocket = null;
    };
  }

  return sharedWebSocket;
}

// Generate or retrieve persistent client ID
function getClientID() {
  let clientID = localStorage.getItem('automerge-client-id');
  if (!clientID) {
    clientID = crypto.randomUUID();
    localStorage.setItem('automerge-client-id', clientID);
  }
  return clientID;
}

// Register awareness message handler
export function registerAwarenessHandler(handler) {
  awarenessHandlers.push(handler);
}
