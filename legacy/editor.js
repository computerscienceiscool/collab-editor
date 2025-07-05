import { Decoration, ViewPlugin, ViewUpdate } from '@codemirror/view'
import * as Y from 'yjs'
import { IndexeddbPersistence } from 'y-indexeddb';
import { yCollab } from 'y-codemirror.next'
import { WebsocketProvider } from 'y-websocket'
import { EditorState } from '@codemirror/state'
import { EditorView } from '@codemirror/view'
import { basicSetup } from 'codemirror'

console.log("editor.js loaded")

window.ydoc = null;
window.ytext = null;
window.view = null;


const storedName = localStorage.getItem('username') || 'anonymous'
const username = storedName;
const storedColor = localStorage.getItem('userColor') || '#' + Math.floor(Math.random() * 16777215).toString(16)

localStorage.setItem('username', storedName)
localStorage.setItem('userColor', storedColor)


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
  
  const nameInput = document.getElementById('name-input');
  const colorInput = document.getElementById('color-input');

  nameInput.value = storedName;
  colorInput.value = storedColor;

  function updateUserAwareness() {
    const name = nameInput.value;
    const color = colorInput.value;

    provider.awareness.setLocalStateField('user', { name, color });

    localStorage.setItem('username', name);
    localStorage.setItem('userColor', color);

    if (usernameEl) usernameEl.textContent = name;
    updateUserList();
  }

  nameInput.addEventListener('input', updateUserAwareness);
  colorInput.addEventListener('input', updateUserAwareness);



ydoc = new Y.Doc();
ytext = ydoc.getText('codemirror');
const persistence = new IndexeddbPersistence(room, ydoc);

persistence.once('synced', () => {
        console.log('IndexedDB content loaded');
 });


let provider;

if (!navigator.onLine) {
  console.warn("Offline mode – disabling real provider");

  provider = {
    awareness: {
      setLocalStateField: () => {},
      getStates: () => new Map(),
      on: () => {},
      off: () => {},
    }
  };
} else {
  provider = new WebsocketProvider('ws://localhost:1234', room, ydoc);
  console.log("Yjs + Provider initialized");

  provider.awareness.setLocalStateField('user', {
    name: storedName,
    color: storedColor
  });
}


let typingTimeout;

const editorContainer = document.getElementById('editor');
if (editorContainer) {
  try {
    



const remoteCursorPlugin = ViewPlugin.fromClass(class {
  constructor(view) {
    this.view = view;
    this.decorations = this.buildDecorations();
  }

update(update) {
  this.decorations = this.buildDecorations();
}


buildDecorations() {
    const builder = [];

    const states = Array.from(provider.awareness.getStates().entries());
    for (const [clientID, state] of states) {
      if (clientID === ydoc.clientID) continue; // skip self
      const cursor = state.cursor;
      const user = state.user;
      if (!cursor || !user) continue;

      const pos = cursor.head;
    //  if (pos == null || pos < 0 || pos > this.view.state.doc.length) continue;

    const docLength = this.view.state.doc.length;
    if (typeof pos !== 'number' || pos < 0 || pos > docLength) {
        console.warn(`Invalid cursor position: ${pos} in doc of length ${docLength}`);
        continue;
    }
    
      const deco = Decoration.widget({
        widget: new CursorWidget(user.name, user.color),
        side: -1
      }).range(pos);
      builder.push(deco);
    }

    return Decoration.set(builder);
  }

  destroy() {}

}, {
  decorations: v => v.decorations
});




    const state = EditorState.create({
      extensions: [
        basicSetup,
        yCollab(ytext, provider.awareness, {
          awareness: provider.awareness,
          clientID: ydoc.clientID
        }),
        remoteCursorPlugin,
        EditorView.updateListener.of(update => {
          if (update.docChanged || update.selectionSet) {
            provider.awareness.setLocalStateField('isTyping', true);
            clearTimeout(typingTimeout);
            typingTimeout = setTimeout(() => {
              provider.awareness.setLocalStateField('isTyping', null);
            }, 2000);
          }
        })
      ]
    });

    window.view = new EditorView({
      state,
      parent: editorContainer
    });

    console.log("EditorView successfully initialized");
  } catch (err) {
    console.error("Failed to create EditorState:", err);
  }
} else {
  console.error("Cannot find #editor element in DOM");
}








const logArray = ydoc.getArray('user-log');
const logEntriesEl = document.getElementById('log-entries');

function addLogEntry(entry) {
  const wrapper = document.createElement('div');
  wrapper.className = 'log-entry';

  const colorDot = document.createElement('span');
  colorDot.className = 'log-color';
  colorDot.style.backgroundColor = entry.user.color;

  const message = document.createElement('span');
  message.textContent = `${entry.user.name} ${entry.type} at ${formatTime(entry.timestamp)} (${relativeTime(entry.timestamp)})`;

  wrapper.appendChild(colorDot);
  wrapper.appendChild(message);
  logEntriesEl.prepend(wrapper);
}

function formatTime(ts) {
  const date = new Date(ts);
  return date.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' });
}

function relativeTime(ts) {
  const now = Date.now();
  const diff = Math.floor((now - ts) / 60000);
  if (diff === 0) return 'just now';
  if (diff === 1) return '1 minute ago';
  return `${diff} minutes ago`;
}

provider.awareness.on('change', ({ added, removed }) => {
  const states = provider.awareness.getStates();
  const now = Date.now();

  added.forEach(id => {
    const user = states.get(id)?.user;
    if (user) {
      logArray.push([{ type: 'joined', user, timestamp: now }]);
    }
  });

  removed.forEach(id => {
    const user = states.get(id)?.user;
    if (user) {
      logArray.push([{ type: 'left', user, timestamp: now }]);
    }
  });
});

logArray.observe(event => {
  event.changes.added.forEach(item => {
    item.content.getContent().forEach(addLogEntry);
  });
});

// Toggle log sidebar
const toggleLogBtn = document.getElementById('toggle-log');
const sidebar = document.getElementById('user-log');
toggleLogBtn.addEventListener('click', () => {
  sidebar.classList.toggle('open');
});

/*
let provider = null;

if (navigator.onLine) {
  provider = new WebsocketProvider('ws://localhost:1234', room, ydoc);
  console.log("WebSocketProvider connected for online collaboration");
} else {
  console.warn("Offline mode: WebSocketProvider not started");
  // Provide a mock awareness provider to avoid errors
  provider = {
    awareness: {
      setLocalStateField: () => {},
      getStates: () => new Map(),
      on: () => {},
      off: () => {},
    }
  };
}*/
    //
    //
    //
    //
    //
    //
    //
 // provider.awareness.setLocalStateField('user', {
 //   name: storedName,
 //   color: storedColor
//  });
    
const offlineBanner = document.getElementById('offline-banner');
if (offlineBanner) {
  offlineBanner.style.display = navigator.onLine ? 'none' : 'block';

  window.addEventListener('offline', () => {
    console.warn('Browser is offline');
    offlineBanner.style.display = 'block';
  });

  window.addEventListener('online', () => {
    console.info('Browser is back online');
    offlineBanner.style.display = 'none';
  });

}
  


  // Set local user awareness
  provider.awareness.setLocalStateField('user', {
    name: username,
    color: userColor
  })

  // Show user name in DOM (optional override via toolbar selector)
  const userLabel = document.querySelector('#toolbar > div:nth-child(2)')
  if (userLabel) userLabel.innerHTML = `User: ${username}`




class CursorWidget {
  constructor(name, color) {
    this.name = name;
    this.color = color;
  }

toDOM() {
  const cursor = document.createElement("span");
  cursor.className = "remote-cursor";
  cursor.style.borderLeft = `2px solid ${this.color}`;
  cursor.style.marginLeft = "-1px";
  cursor.style.height = "1em";
  cursor.style.position = "relative";

  const label = document.createElement("div");
  label.textContent = this.name;
  label.style.position = "absolute";
  label.style.top = "-1.2em";
  label.style.left = "0";
  label.style.background = this.color;
  label.style.color = "#fff";
  label.style.fontSize = "0.75em";
  label.style.padding = "0 4px";
  label.style.borderRadius = "4px";

  cursor.appendChild(label);
  return cursor;
  }

  ignoreEvent() {
    return true;
  }
}



















function updateUserList() {
  if (!userListEl) return;
  const states = Array.from(provider.awareness.getStates().values());

  // Update user count
  const userCountEl = document.getElementById('user-count');
  if (userCountEl) {
    userCountEl.textContent = `Users: ${states.length}`;
  }

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

//  Correct awareness change handler
  updateUserList();

  const states = Array.from(provider.awareness.getStates().entries());
  const typingUsers = states
    .filter(([clientID, state]) => state?.isTyping && state.user?.name && clientID !== ydoc.clientID)
    .map(([_, state]) => state.user.name);

  updateTypingIndicator(typingUsers);
});



function updateTypingIndicator(usersTyping) {
  const indicator = document.getElementById('typing-indicator');
  if (!indicator) return;

  if (usersTyping.length === 0) {
    indicator.textContent = '';
  } else if (usersTyping.length === 1) {
    indicator.textContent = `${usersTyping[0]} is typing...`;
  } else {
    indicator.textContent = `${usersTyping.join(', ')} are typing...`;
  }
}




// ==========================
// Export Functions
// ==========================
//
//
//
//




function handleSave() {
  const format = document.getElementById('save-format').value;
  if (format === 'txt') {
    exportAsText();
  } else if (format === 'json') {
    exportAsJSON();
  } else if (format === 'yjs') {
    exportSnapshotAsJSON();
  }
}
function exportAsText() {
  const text = ytext.toString();
  const blob = new Blob([text], { type: 'text/plain' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'document.txt';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function exportAsJSON() {
  const state = window.view.state.toJSON();  // JJ: Use the view's state directly
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'codemirror_state.json';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function exportAsYsnap() {
  const update = Y.encodeStateAsUpdate(ydoc);
  const blob = new Blob([update], { type: 'application/octet-stream' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'snapshot.ysnap';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function exportSnapshotAsJSON() {
  const update = Y.encodeStateAsUpdate(ydoc);
  const arr = Array.from(update);
  const blob = new Blob([JSON.stringify(arr, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'snapshot.json';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}


// Make available globally
window.exportAsText = exportAsText;
window.exportAsJSON = exportAsJSON;
window.exportAsYsnap = exportAsYsnap;
window.exportSnapshotAsJSON = exportSnapshotAsJSON;
console.log("Export functions set up")
window.handleSave = handleSave;
export {};

