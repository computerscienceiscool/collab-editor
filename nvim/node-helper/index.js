#!/usr/bin/env node
/**
 * Neovim <-> Automerge Bridge
 * 
 * This helper speaks the real Automerge sync protocol to the collaboration
 * server, and communicates with Neovim via simple JSON over stdin/stdout.
 * 
 * Usage:
 *   node index.js
 *   Then send JSON commands on stdin, receive responses on stdout.
 */

import { Repo } from '@automerge/automerge-repo';
import { BrowserWebSocketClientAdapter } from '@automerge/automerge-repo-network-websocket';
import { NodeFSStorageAdapter } from '@automerge/automerge-repo-storage-nodefs';
import { next as Automerge } from '@automerge/automerge';
import * as readline from 'readline';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import WebSocket from 'ws';

// State
let repo = null;
let handle = null;
let awarenessWs = null;
let userId = null;
let userName = 'nvim-user';
let currentDocId = null;
let isApplyingRemote = false;

// Storage directory for Automerge data
const storageDir = path.join(os.homedir(), '.local', 'share', 'collab-editor', 'automerge-data');

// Ensure storage directory exists
if (!fs.existsSync(storageDir)) {
  fs.mkdirSync(storageDir, { recursive: true });
}

// Setup readline for stdin
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

/**
 * Send a message to Neovim (stdout)
 */
function send(obj) {
  console.log(JSON.stringify(obj));
}

/**
 * Log to stderr (doesn't interfere with JSON protocol)
 */
function log(msg) {
  process.stderr.write(`[helper] ${msg}\n`);
}

/**
 * Generate a simple user ID
 */
function generateUserId() {
  return 'nvim-' + Math.random().toString(36).substring(2, 10);
}

/**
 * Connect to the awareness WebSocket server
 */
function connectAwareness(url) {
  if (awarenessWs) {
    awarenessWs.close();
  }

  awarenessWs = new WebSocket(url);

  awarenessWs.on('open', () => {
    log('Awareness connected');
    // Send initial presence
    sendAwareness();
  });

  awarenessWs.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());
      // Forward cursor updates to Neovim
      if (msg.type === 'awareness' && msg.clientID !== userId) {
        send({
          type: 'cursor',
          userId: msg.clientID,
          name: msg.state?.user?.name || 'unknown',
          color: msg.state?.user?.color || '#888888',
          anchor: msg.state?.selection?.anchor ?? null
        });
      }
    } catch (e) {
      log(`Awareness parse error: ${e.message}`);
    }
  });

  awarenessWs.on('close', () => {
    log('Awareness disconnected');
  });

  awarenessWs.on('error', (err) => {
    log(`Awareness error: ${err.message}`);
  });
}

/**
 * Send awareness (presence/cursor) info
 */
let currentCursorOffset = 0;

function sendAwareness(ranges = []) {
  log('sendAwareness called, offset=' + currentCursorOffset);
  if (awarenessWs && awarenessWs.readyState === WebSocket.OPEN) {
    awarenessWs.send(JSON.stringify({
      type: "awareness",
      clientID: userId,
      state: {
        user: { name: userName, color: "#88cc88" },
        typing: false,
        selection: { anchor: currentCursorOffset }
      },
      documentId: currentDocId
    }));
  }
}

/**
 * Handle incoming messages from Neovim
 */
async function handleMessage(msg) {
  try {
    switch (msg.type) {
      case 'connect': {
        userId = generateUserId();
        
        // Create Automerge repo with WebSocket sync
        repo = new Repo({
          network: [new BrowserWebSocketClientAdapter(msg.syncUrl)],
          storage: new NodeFSStorageAdapter(storageDir),
        });

        // Connect to awareness server if provided
        if (msg.awarenessUrl) {
          connectAwareness(msg.awarenessUrl);
        }

        send({ type: 'connected', userId: userId });
        log(`Connected to ${msg.syncUrl}`);
        break;
      }

      case 'disconnect': {
        if (handle) {
          handle = null;
        }
        if (awarenessWs) {
          awarenessWs.close();
          awarenessWs = null;
        }
        if (repo) {
          repo = null;
        }
        send({ type: 'disconnected' });
        log('Disconnected');
        break;
      }

      case 'create': {
        if (!repo) {
          send({ type: 'error', message: 'Not connected' });
          break;
        }

        // Create new document
        handle = repo.create();
        handle.change(d => {
          d.content = '';
        });

        const docId = handle.documentId;
        currentDocId = docId;
        
        // Setup change listener
        setupChangeListener();
        sendAwareness();

        send({ type: 'created', docId: docId });
        log(`Created document: ${docId}`);
        break;
      }

      case 'open': {
        if (!repo) {
          send({ type: 'error', message: 'Not connected' });
          break;
        }

        const docId = msg.docId;
        log(`Opening document: ${docId}`);

        try {
          // Find the document
          const fullDocId = docId.startsWith('automerge:') ? docId : `automerge:${docId}`;
          handle = repo.find(fullDocId);

          // Wait for it to be ready (local storage)
          await handle.whenReady();
          
          // Check if we got content from local storage
          let doc = handle.doc();
          let content = doc?.content || '';
          
          // If empty, wait for sync server to send the real content
          if (content === '') {
            log('Local storage empty, waiting for sync...');
            
            content = await new Promise((resolve, reject) => {
              const timeout = setTimeout(() => {
                resolve('');
              }, 5000);
              
              handle.on('change', ({ doc }) => {
                const c = doc?.content || '';
                if (c !== '') {
                  clearTimeout(timeout);
                  resolve(c);
                }
              });
            });
          }

          // Setup change listener
          setupChangeListener();
          currentDocId = docId;
          sendAwareness();

          send({ type: 'opened', docId: docId, content: content });
          log(`Opened document: ${docId} (${content.length} chars)`);
        } catch (e) {
          send({ type: 'error', message: `Failed to open: ${e.message}` });
          log(`Open failed: ${e.message}`);
        }
        break;
      }

      case 'edit': {
        if (!handle) {
          send({ type: 'error', message: 'No document open' });
          break;
        }

        if (isApplyingRemote) {
          break;
        }

        const newContent = msg.content;
        
        handle.change(d => {
          d.content = newContent;
        });
        
        log(`Edit applied (${newContent.length} chars)`);
        break;
      }

      case 'close': {
        handle = null;
        send({ type: 'closed' });
        log('Document closed');
        break;
      }

      case 'set_name': {
        userName = msg.name || 'nvim-user';
        sendAwareness();
        send({ type: 'name_set', name: userName });
        log(`Name set to: ${userName}`);
        break;
      }

      case 'cursor': {
        const docLen = (handle?.doc()?.content || '').length;
        const offset = Math.max(0, Math.min(Number(msg.offset) || 0, docLen));
        currentCursorOffset = offset;
        sendAwareness();
        break;
      }

      case 'info': {
        send({
          type: 'info',
          connected: repo !== null,
          docId: handle?.documentId || null,
          userId: userId,
          userName: userName
        });
        break;
      }

      default:
        send({ type: 'error', message: `Unknown message type: ${msg.type}` });
    }
  } catch (e) {
    send({ type: 'error', message: e.message });
    log(`Error: ${e.message}`);
  }
}

/**
 * Setup listener for remote changes
 */
function setupChangeListener() {
  if (!handle) return;

  handle.on('change', ({ doc }) => {
    const content = doc?.content || '';
    
    isApplyingRemote = true;
    send({ type: 'changed', content: content });
    isApplyingRemote = false;
    
    log(`Remote change received (${content.length} chars)`);
  });
}

// Process stdin line by line
rl.on('line', async (line) => {
  if (!line.trim()) return;
  
  try {
    const msg = JSON.parse(line);
    await handleMessage(msg);
  } catch (e) {
    send({ type: 'error', message: `Parse error: ${e.message}` });
    log(`Parse error: ${e.message}`);
  }
});

rl.on('close', () => {
  log('stdin closed, exiting');
  process.exit(0);
});

// Handle process signals
process.on('SIGINT', () => {
  log('SIGINT received, exiting');
  process.exit(0);
});

process.on('SIGTERM', () => {
  log('SIGTERM received, exiting');
  process.exit(0);
});

log('Helper started, waiting for commands...');
