
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { EditorState } from '@codemirror/state'
import { EditorView } from '@codemirror/view'
import { basicSetup } from 'codemirror'
import { yCollab } from 'y-codemirror.next'

console.log("editor.js loaded")

// Prompt for username
const username = prompt("Enter your name:", "anonymous") || "anonymous";

const presetColors = [
  '#e6194b', '#3cb44b', '#ffe119', '#4363d8', '#f58231',
  '#911eb4', '#46f0f0', '#f032e6', '#bcf60c', '#fabebe',
  '#008080', '#e6beff', '#9a6324', '#fffac8', '#800000',
  '#aaffc3', '#808000', '#ffd8b1', '#000075', '#808080'
];

let userColor = localStorage.getItem('userColor');
if (!userColor) {
  userColor = presetColors[Math.floor(Math.random() * presetColors.length)];
  localStorage.setItem('userColor', userColor);
}

// DOM elements must exist before setting content
window.addEventListener("DOMContentLoaded", () => {
  const usernameEl = document.getElementById('local-username');
  const roomNameEl = document.getElementById('room-name');
  const userListEl = document.getElementById('user-list');

  const room = 'my-room';

  if (usernameEl) usernameEl.textContent = username;
  if (roomNameEl) roomNameEl.textContent = room;

  // Create Yjs document and provider
  const ydoc = new Y.Doc();
  const ytext = ydoc.getText('codemirror');
  const provider = new WebsocketProvider('ws://localhost:1234', room, ydoc);
  console.log("Yjs + Provider initialized");

  // Set local awareness info
  provider.awareness.setLocalStateField('user', {
    name: username,
    color: userColor
  });

  // Update user list UI
  function updateUserList() {
    if (!userListEl) return;
    const states = Array.from(provider.awareness.getStates().values());

    userListEl.innerHTML = 'Users in room: ';
    states.forEach(state => {
      if (state.user) {
        const userEl = document.createElement('span');
        userEl.className = 'user';
        userEl.textContent = state.user.name;
        userEl.style.backgroundColor = state.user.color || '#ccc';
        userEl.style.marginLeft = '5px';
        userEl.style.padding = '2px 5px';
        userEl.style.borderRadius = '4px';
        userListEl.appendChild(userEl);
      }
    });
  }

  provider.awareness.on('change', updateUserList);
  updateUserList();

  // Load saved state
  fetch('/load')
    .then(res => (res.ok ? res.arrayBuffer() : null))
    .then(update => {
      if (update) Y.applyUpdate(ydoc, new Uint8Array(update))
    });

  // Auto-save
  setInterval(() => {
    const update = Y.encodeStateAsUpdate(ydoc);
    fetch('/save', {
      method: 'POST',
      body: update
    });
  }, 5000);
  console.log("Auto-save set up");

  // Create CodeMirror editor
  let state;
  try {
    state = EditorState.create({
      extensions: [
        basicSetup,
        yCollab(ytext, provider.awareness)
      ]
    });
    console.log("EditorState created", state);
  } catch (err) {
    console.error("Failed to create EditorState:", err);
  }

  new EditorView({
    state,
    parent: document.getElementById('editor')
  });
  console.log("EditorView initialized");
});
