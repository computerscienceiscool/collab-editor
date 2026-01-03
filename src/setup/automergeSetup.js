// File: src/setup/automergeSetup.js

import { Repo } from '@automerge/automerge-repo'
import { BrowserWebSocketClientAdapter } from '@automerge/automerge-repo-network-websocket'
import { IndexedDBStorageAdapter } from '@automerge/automerge-repo-storage-indexeddb'
import { next as Automerge } from '@automerge/automerge'
import { initRegistry, getOrCreateRoomDocument, debugRegistry } from './registry.js'
import { config } from '../config.js'

/**
 * Initializes the Automerge repository, document, and custom awareness.
 * 
 * CRITICAL: Automerge 2.x text handling:
 * - Initialize text fields as regular strings: d.content = ""
 * - Use Automerge.splice() for ALL text modifications
 * - Do NOT use Automerge.Text() or .insertAt()/.deleteAt()
 * 
 * @returns {Object} repo, handle, doc, awareness, room
 */
export async function setupAutomerge() {
  // Get room name from URL parameter or use default
  const urlParams = new URLSearchParams(window.location.search);
  const room = urlParams.get('room') || 'default-room';

  console.log('[Automerge] Initializing for room:', room);

  // Create Automerge repository with WebSocket sync and IndexedDB storage
  // Port configured in src/config.js (default: 1234)
  const repo = new Repo({
    network: [new BrowserWebSocketClientAdapter(config.urls.automergeSync)],
    storage: new IndexedDBStorageAdapter(),
  });

  // Initialize the registry document (shared mapping of room names to doc IDs)
  console.log('[Automerge] Initializing registry...');
  const registryHandle = await initRegistry(repo);
  
  // Get or create document for this room using the registry
  console.log('[Automerge] Getting or creating document for room:', room);
  const { documentId, isNew, handle } = await getOrCreateRoomDocument(repo, registryHandle, room);
  
  console.log('[Automerge] Room document:', isNew ? 'CREATED' : 'FOUND', documentId);
  
  // In API 2.x, handle returned from find/create is already ready
  // Get current document state using doc() (synchronous in 2.x)
  let doc = handle.doc();
  
  if (isNew) {
    // NEW document - initialize it
    if (!doc || doc.content === undefined) {
      console.log('[Automerge] Initializing NEW document structure...');
      handle.change(d => {
        // CRITICAL: Initialize as empty string, not Automerge.Text()
        // Automerge 2.x uses regular strings internally
        d.content = "";
        
        // Initialize metadata
        if (!d.metadata) {
          d.metadata = {
            created: Date.now(),
            room: room,
            version: 1
          };
        }
      });
      
      // Get updated document after initialization
      doc = handle.doc();
      console.log('[Automerge] Document initialized with empty content');
    }
  } else {
    // EXISTING document - wait for storage to load
    console.log('[Automerge] Waiting for storage to load existing document...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    doc = handle.doc();
    
    const contentLength = typeof doc.content === 'string' ? doc.content.length : 0;
    console.log('[Automerge] Loaded existing document, content:', contentLength, 'chars');
    
    // If content is still empty, something is wrong with storage
    if (contentLength === 0) {
      console.warn('[Automerge] WARNING: Document exists in registry but has no content in storage');
    }
  }

  // Create custom awareness system
  // Port 1235: Awareness server (JSON text protocol)
  // MUST be separate from port 1234 (different protocol)
  const awareness = createCustomAwareness(room);

  // Make registry available for debugging
  window.debugRegistry = () => debugRegistry(registryHandle);

  console.log('[Automerge] Setup complete');
  console.log('[Automerge] Repository initialized for room:', room);
  console.log('[Automerge] Document ID:', handle.documentId);
  console.log('[Automerge] Content type:', typeof doc?.content);

  return { repo, handle, doc, awareness, room, registryHandle };
}

/**
 * Creates a custom awareness system to replace Yjs awareness
 * This handles user presence, cursors, and typing indicators
 * 
 * CRITICAL: Uses port 1235 (JSON protocol)
 * Do NOT use port 1234 (that's for Automerge CBOR sync)
 */
function createCustomAwareness(room) {
  const localState = {
    user: { name: 'User', color: '#000000' },
    typing: false,
    cursor: null
  };

  const remoteStates = new Map();
  const listeners = new Set();

  // Connect to awareness server on port 1235
  // CRITICAL: This is separate from Automerge sync on port 1234
  const awarenessWs = getOrCreateAwarenessWebSocket(room);

  // Broadcast local state changes via WebSocket
  const broadcastState = () => {
    if (awarenessWs && awarenessWs.readyState === WebSocket.OPEN) {
      awarenessWs.send(JSON.stringify({
        type: 'awareness',
        clientID: getClientID(),
        state: localState,
        room: room
      }));
    }
  };

  // Handle incoming awareness messages from other clients
  const handleAwarenessMessage = (data) => {
    if (data.type === 'awareness' && data.clientID !== getClientID()) {
      remoteStates.set(data.clientID, data.state);
      notifyListeners();
    }
  };

  // Notify all listeners of state changes
  const notifyListeners = () => {
    const states = getAllStates();
    listeners.forEach(callback => {
      try {
        callback(states);
      } catch (e) {
        console.error('[Awareness] Listener error:', e);
      }
    });
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

  // Register message handler
  if (awarenessWs) {
    registerAwarenessHandler(handleAwarenessMessage);
  }

  // Public API (mimics Yjs awareness API for compatibility)
  return {
    setLocalStateField(field, value) {
      localState[field] = value;
      broadcastState();
      notifyListeners(); // Also notify local listeners
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
// CRITICAL: Uses port 1235, NOT port 1234
let awarenessWebSocket = null;
let awarenessHandlers = [];

/**
 * Get or create WebSocket connection to awareness server
 * 
 * CRITICAL: Port 1235 for awareness (JSON protocol)
 * Port 1234 is for Automerge sync (CBOR protocol)
 * DO NOT MIX THESE PORTS
 */
function getOrCreateAwarenessWebSocket(room) {
  if (!awarenessWebSocket || awarenessWebSocket.readyState === WebSocket.CLOSED) {
    // Use port from config (default: 1235)
    awarenessWebSocket = new WebSocket(config.urls.awareness);
    
    awarenessWebSocket.onopen = () => {
      console.log('[Awareness] WebSocket connected to', config.urls.awareness);
      // Send join message
      awarenessWebSocket.send(JSON.stringify({
        type: 'join',
        room: room,
        clientID: getClientID()
      }));
    };

    awarenessWebSocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        awarenessHandlers.forEach(handler => handler(data));
      } catch (e) {
        console.error('[Awareness] Failed to parse message:', e);
      }
    };

    awarenessWebSocket.onerror = (error) => {
      console.error('[Awareness] WebSocket error:', error);
    };

    awarenessWebSocket.onclose = () => {
      console.log('[Awareness] WebSocket closed');
      awarenessWebSocket = null;
    };
  }

  return awarenessWebSocket;
}

/**
 * Generate or retrieve persistent client ID
 * Used to identify this client in awareness system
 */
function getClientID() {
  let clientID = localStorage.getItem('automerge-client-id');
  if (!clientID) {
    clientID = crypto.randomUUID();
    localStorage.setItem('automerge-client-id', clientID);
  }
  return clientID;
}

/**
 * Register a handler for awareness messages
 * Used by awareness object to receive messages from other clients
 */
export function registerAwarenessHandler(handler) {
  awarenessHandlers.push(handler);
}
