// File: src/setup/registry.js

import { next as Automerge } from '@automerge/automerge';

/**
 * Registry Document Implementation for Automerge Repo 2.x
 * 
 * This is a TEMPORARY solution to enable room-based collaboration.
 * It will be replaced when PromiseBase implements mutable references.
 * 
 * See registry.md for full documentation and rationale.
 */

// Well-known registry document ID (deterministically generated)
// All clients use this same ID to access the shared registry  
const REGISTRY_SEED = "promisegrid:registry:v1";

/**
 * Initialize the registry system
 * Must be called before using any registry functions
 * 
 * @param {Repo} repo - The Automerge repository
 * @returns {Promise<DocHandle>} - Handle to the registry document
 */
export async function initRegistry(repo) {
  // Generate deterministic registry document ID (just the hash)
  const registryHash = await generateRegistryId();
  
  // Full URL format for repo.find()
  const registryDocId = `automerge:${registryHash}`;
  
  console.log('[Registry] Initializing with ID:', registryDocId);
  
  // Try to find existing registry document
  let handle;
  try {
    handle = await repo.find(registryDocId);
    console.log('[Registry] Found existing registry');
  } catch (e) {
    // Registry doesn't exist, create it with specific ID using import()
    console.log('[Registry] Creating new registry with deterministic ID');
    
    // Create an empty Automerge document
    let doc = Automerge.from({ rooms: {} });
    const binary = Automerge.save(doc);
    
    // Import with specific document ID (hash only, no prefix)
    handle = repo.import(binary, { docId: registryHash });
  }
  
  // Handle is already ready in API 2.x
  const doc = handle.doc();
  if (!doc.rooms) {
    handle.change(d => {
      d.rooms = {};
    });
  }
  
  // Wait a bit for storage to fully sync (especially important on page load)
  await new Promise(resolve => setTimeout(resolve, 300));
  
  console.log('[Registry] Registry ready');
  
  return handle;
}

/**
 * Get or create a document for a room
 * 
 * @param {Repo} repo - The Automerge repository
 * @param {DocHandle} registryHandle - Handle to the registry document
 * @param {string} roomName - The room name from URL parameter
 * @returns {Promise<Object>} - { documentId, isNew, handle }
 */
export async function getOrCreateRoomDocument(repo, registryHandle, roomName) {
  console.log('[Registry] Getting or creating room:', roomName);
  
  // Check if room already exists in registry
  const registry = registryHandle.doc();
  const roomEntry = registry.rooms?.[roomName];
  
  if (roomEntry && roomEntry.documentId) {
    // Room exists, use existing document
    console.log('[Registry] Room exists:', roomEntry.documentId);
    
    try {
      // In API 2.x, find() is async and returns ready handle
      const handle = await repo.find(roomEntry.documentId);
      
      return {
        documentId: roomEntry.documentId,
        isNew: false,
        handle: handle
      };
    } catch (e) {
      console.error('[Registry] Failed to open existing room document:', e);
      // Fall through to create new document
    }
  }
  
  // Room doesn't exist or failed to open, create new document
  console.log('[Registry] Creating new document for room:', roomName);
  
  const handle = repo.create();
  const documentId = handle.documentId;
  
  // Initialize document
  handle.change(d => {
    d.content = "";
    d.metadata = {
      room: roomName,
      created: Date.now(),
      createdBy: getClientID()
    };
  });
  
  // Register the room in the registry
  // Use first-write-wins conflict resolution
  registryHandle.change(d => {
    // Only write if room doesn't exist yet (first-write-wins)
    if (!d.rooms[roomName]) {
      d.rooms[roomName] = {
        documentId: documentId,
        created: Date.now(),
        createdBy: getClientID()
      };
      console.log('[Registry] Registered new room:', roomName, '→', documentId);
    } else {
      console.log('[Registry] Room already registered (race condition), using existing');
    }
  });
  
  return {
    documentId: documentId,
    isNew: true,
    handle: handle
  };
}

/**
 * List all rooms in the registry
 * 
 * @param {DocHandle} registryHandle - Handle to the registry document
 * @returns {Array} - Array of room objects
 */
export function listRooms(registryHandle) {
  const registry = registryHandle.doc();
  
  if (!registry.rooms) {
    return [];
  }
  
  return Object.entries(registry.rooms).map(([name, data]) => ({
    name: name,
    documentId: data.documentId,
    created: data.created,
    createdBy: data.createdBy
  }));
}

/**
 * Get room information
 * 
 * @param {DocHandle} registryHandle - Handle to the registry document
 * @param {string} roomName - The room name
 * @returns {Object|null} - Room info or null if not found
 */
export function getRoomInfo(registryHandle, roomName) {
  const registry = registryHandle.doc();
  
  if (!registry.rooms || !registry.rooms[roomName]) {
    return null;
  }
  
  return {
    name: roomName,
    ...registry.rooms[roomName]
  };
}

/**
 * Delete a room from the registry
 * Note: This only removes the registry entry, not the document itself
 * 
 * @param {DocHandle} registryHandle - Handle to the registry document
 * @param {string} roomName - The room name to delete
 */
export function deleteRoom(registryHandle, roomName) {
  console.log('[Registry] Deleting room:', roomName);
  
  registryHandle.change(d => {
    if (d.rooms && d.rooms[roomName]) {
      delete d.rooms[roomName];
    }
  });
}

/**
 * Generate deterministic registry document ID
 * All clients compute the same ID from the same seed
 * 
 * @returns {Promise<string>} - Automerge document ID
 */
async function generateRegistryId() {
  // Use Web Crypto API to hash the seed
  const encoder = new TextEncoder();
  const data = encoder.encode(REGISTRY_SEED);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  
  // Convert to base58 (Automerge format)
  const base58Hash = base58Encode(hashArray);
  
  // Return just the hash - repo.import() will add the automerge: prefix
  return base58Hash;
}

/**
 * Base58 encoding (Bitcoin alphabet)
 * Used for Automerge document IDs
 */
function base58Encode(bytes) {
  const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  
  // Convert byte array to BigInt
  let num = BigInt(0);
  for (let i = 0; i < bytes.length; i++) {
    num = num * BigInt(256) + BigInt(bytes[i]);
  }
  
  // Convert to base58
  let result = '';
  while (num > 0) {
    const remainder = num % BigInt(58);
    result = ALPHABET[Number(remainder)] + result;
    num = num / BigInt(58);
  }
  
  // Add leading zeros
  for (let i = 0; i < bytes.length && bytes[i] === 0; i++) {
    result = ALPHABET[0] + result;
  }
  
  return result || ALPHABET[0];
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
 * Debug function to inspect registry contents
 * Available as window.debugRegistry() in browser console
 */
export function debugRegistry(registryHandle) {
  const rooms = listRooms(registryHandle);
  
  console.log('=== REGISTRY DEBUG ===');
  console.log('Total Rooms:', rooms.length);
  console.table(rooms);
  
  return rooms;
}

/**
 * Export registry for debugging/monitoring
 */
export function exportRegistry(registryHandle) {
  const registry = registryHandle.doc();
  return {
    rooms: registry.rooms || {},
    roomCount: Object.keys(registry.rooms || {}).length
  };
}
