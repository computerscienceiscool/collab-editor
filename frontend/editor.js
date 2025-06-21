
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { EditorState } from '@codemirror/state'
import { EditorView } from '@codemirror/view'
import { basicSetup } from 'codemirror'
import { yCollab } from 'y-codemirror.next'

console.log("editor.js loaded")

// Prompt for username
const username = prompt("Enter your name:", "anonymous") || "anonymous"

// Assign a persistent color per user
let userColor = localStorage.getItem('userColor')
if (!userColor) {
  userColor = '#' + Math.floor(Math.random() * 16777215).toString(16)
  localStorage.setItem('userColor', userColor)
}

window.addEventListener("DOMContentLoaded", () => {
  const room = 'my-room'
  const roomNameEl = document.getElementById('room-name')
  const userListEl = document.getElementById('user-list')
  const usernameEl = document.getElementById('local-username')

  if (roomNameEl) roomNameEl.textContent = room
  if (usernameEl) usernameEl.textContent = username

  // Yjs doc and provider
  const ydoc = new Y.Doc()
  const ytext = ydoc.getText('codemirror')
  const provider = new WebsocketProvider('ws://localhost:1234', room, ydoc)
  console.log("Yjs + Provider initialized")

  // Set local user awareness
  provider.awareness.setLocalStateField('user', {
    name: username,
    color: userColor
  })

  // Show user name in DOM (optional override via toolbar selector)
  const userLabel = document.querySelector('#toolbar > div:nth-child(2)')
  if (userLabel) userLabel.innerHTML = `User: ${username}`

  // Render list of connected users
  function updateUserList() {
    if (!userListEl) return
    const states = Array.from(provider.awareness.getStates().values())

    userListEl.innerHTML = 'Users in room: '
    states.forEach(state => {
      if (state.user) {
        const userEl = document.createElement('span')
        userEl.className = 'user'
        userEl.textContent = state.user.name
        userEl.style.backgroundColor = state.user.color || '#ccc'
        userEl.style.marginLeft = '5px'
        userEl.style.padding = '2px 5px'
        userEl.style.borderRadius = '4px'
        userListEl.appendChild(userEl)
      }
    })
  }

  provider.awareness.on('change', updateUserList)
  updateUserList()

  // Load doc state from server
  fetch('/load')
    .then(res => (res.ok ? res.arrayBuffer() : null))
    .then(update => {
      if (update) Y.applyUpdate(ydoc, new Uint8Array(update))
    })

  // Auto-save to server
  setInterval(() => {
    const update = Y.encodeStateAsUpdate(ydoc)
    fetch('/save', {
      method: 'POST',
      body: update
    })
  }, 5000)
  console.log("Auto-save set up")

  // Initialize CodeMirror
  let state
  try {
    state = EditorState.create({
      extensions: [
        basicSetup,
        yCollab(ytext, provider.awareness)
      ]
    })
    console.log("EditorState created", state)
  } catch (err) {
    console.error("Failed to create EditorState:", err)
  }

  new EditorView({
    state,
    parent: document.getElementById('editor')
  })
  console.log("EditorView initialized")
})
