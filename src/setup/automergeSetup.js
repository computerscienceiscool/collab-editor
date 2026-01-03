// File: src/setup/automergeSetup.js

import { Repo } from '@automerge/automerge-repo'
import { BrowserWebSocketClientAdapter } from '@automerge/automerge-repo-network-websocket'
import { IndexedDBStorageAdapter } from '@automerge/automerge-repo-storage-indexeddb'
import { config } from '../config.js'

/**
 * Initializes the Automerge repository and document.
 * 
 * URL modes:
 * - No ?doc= param: Creates new document, updates URL
 * - ?doc=automerge:xxx: Loads existing document
 * 
 * @param {string|null} documentId - Document ID from URL, or null to create new
 * @returns {Object} repo, handle, doc, awareness, documentId, isNew
 */
export async function setupAutomerge(documentId = null) {
  console.log('[Automerge] Initializing...');
  
  if (documentId) {
    console.log('[Automerge] Loading document:', documentId);
  } else {
    console.log('[Automerge] No document ID provided, will create new');
  }

  // Create Automerge repository with WebSocket sync and IndexedDB storage
  const repo = new Repo({
    network: [new BrowserWebSocketClientAdapter(config.urls.automergeSync)],
    storage: new IndexedDBStorageAdapter(),
  });

  let handle;
  let isNew = false;
if (documentId) {
    // Load existing document
    try {
      // Find returns a DocHandle - need to prepend automerge: if not present
      const fullDocId = documentId.startsWith('automerge:') ? documentId : `automerge:${documentId}`;
      handle = await repo.find(fullDocId);
      
      // Wait for document to be ready using whenReady()
      await handle.whenReady();
      
      const doc = handle.doc();
      if (!doc) {
        throw new Error('Document loaded but has no content');
      }
      
      const contentLength = typeof doc.content === 'string' ? doc.content.length : 0;
      console.log('[Automerge] Document loaded, content:', contentLength, 'chars');
      
    } catch (err) {
      console.error('[Automerge] Failed to load document:', err);
      throw new Error(`Could not load document: ${documentId}`);
    }
  }
   else {
    // Create new document
    handle = repo.create();
    isNew = true;
    
    // Initialize document structure
    handle.change(d => {
      d.content = "";
      d.metadata = {
        created: Date.now(),
        version: 1
      };
    });
    
    // Update URL with new document ID (without page reload)
    const newUrl = `${window.location.pathname}?doc=${handle.documentId}`;
    window.history.replaceState(null, '', newUrl);
    
    console.log('[Automerge] Created new document:', handle.documentId);
  }

  // Get document reference
  const doc = handle.doc();
  
  // Create custom awareness system (uses document ID for grouping)
  const awareness = createCustomAwareness(handle.documentId);

  console.log('[Automerge] Setup complete');
  console.log('[Automerge] Document ID:', handle.documentId);

  return { 
    repo, 
    handle, 
    doc, 
    awareness, 
    documentId: handle.documentId,
    isNew 
  };
}

/**
 * Wait for a document handle to be ready
 * Handles the async loading from IndexedDB/network
 */
async function waitForDocumentReady(handle, timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Timeout waiting for document to be ready'));
    }, timeoutMs);
    
    // Wait for the document to load via change event
    const onReady = ({ doc }) => {
      if (doc !== undefined) {
        clearTimeout(timeout);
        handle.off('change', onReady);
        resolve(doc);
      }
    };
    
    handle.on('change', onReady);
    
    // Also check if it's already ready via doc() method
    try {
      const doc = handle.doc();
      if (doc !== undefined) {
        clearTimeout(timeout);
        handle.off('change', onReady);
        resolve(doc);
      }
    } catch (e) {
      // Not ready yet, will wait for change event
    }
  });
}

/**
 * Creates a custom awareness system for user presence
 * Uses document ID to group users (replaces room-based grouping)
 */
function createCustomAwareness(documentId) {
  const localState = {
    user: { name: 'User', color: '#000000' },
    typing: false,
    cursor: null
  };

  const remoteStates = new Map();
  const listeners = new Set();

  // Connect to awareness server using document ID as the "room"
  const awarenessWs = getOrCreateAwarenessWebSocket(documentId);

  const broadcastState = () => {
    if (awarenessWs && awarenessWs.readyState === WebSocket.OPEN) {
      awarenessWs.send(JSON.stringify({
        type: 'awareness',
        clientID: getClientID(),
        state: localState,
        documentId: documentId
      }));
    }
  };

  const handleAwarenessMessage = (data) => {
    if (data.type === 'awareness' && data.clientID !== getClientID()) {
      remoteStates.set(data.clientID, data.state);
      notifyListeners();
    }
  };

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

  const getAllStates = () => {
    const states = new Map();
    states.set(getClientID(), localState);
    remoteStates.forEach((state, clientID) => {
      states.set(clientID, state);
    });
    return states;
  };

  if (awarenessWs) {
    registerAwarenessHandler(handleAwarenessMessage);
  }

  return {
    setLocalStateField(field, value) {
      localState[field] = value;
      broadcastState();
      notifyListeners();
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

    _handleMessage: handleAwarenessMessage
  };
}

// Shared WebSocket connection for awareness
let awarenessWebSocket = null;
let awarenessHandlers = [];

/**
 * Get or create WebSocket connection to awareness server
 * Now uses documentId instead of room name
 */
function getOrCreateAwarenessWebSocket(documentId) {
  if (!awarenessWebSocket || awarenessWebSocket.readyState === WebSocket.CLOSED) {
    awarenessWebSocket = new WebSocket(config.urls.awareness);
    
    awarenessWebSocket.onopen = () => {
      console.log('[Awareness] WebSocket connected to', config.urls.awareness);
      awarenessWebSocket.send(JSON.stringify({
        type: 'join',
        documentId: documentId,
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
 */
export function registerAwarenessHandler(handler) {
  awarenessHandlers.push(handler);
}
