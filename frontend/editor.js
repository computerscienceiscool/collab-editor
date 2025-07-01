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
  provider.awareness.setLocalStateField('user', {
    name: storedName,
    color: storedColor
  });
    

  const offlineBanner = document.getElementById('offline-banner');
  if (offlineBanner) {
    offlineBanner.style.display = navigator.onLine ? 'none' : 'block'
  }



  window.addEventListener('offline', () => {
    console.warn('Browser is offline');
    if (offlineBanner) offlineBanner.style.display = 'block';
  });

  window.addEventListener('online', () => {
    console.info('Browser is back online');
    if (offlineBanner) offlineBanner.style.display = 'none';
  });

  // Set local user awareness
  provider.awareness.setLocalStateField('user', {
    name: username,
    color: userColor
  })

  // Show user name in DOM (optional override via toolbar selector)
  const userLabel = document.querySelector('#toolbar > div:nth-child(2)')
  if (userLabel) userLabel.innerHTML = `User: ${username}`

const remoteCursorPlugin = ViewPlugin.fromClass(class {
  constructor(view) {
    this.view = view;
    this.decorations = this.buildDecorations();
  }

  update(update) {
    if (update.docChanged || update.transactions.some(tr => tr.annotation("awareness"))) {
      this.decorations = this.buildDecorations();
    }
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
      if (pos == null || pos < 0 || pos > this.view.state.doc.length) continue;

      const deco = Decoration.widget({
        widget: new CursorWidget(user),
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
provider.awareness.on('change', () => {
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
      yCollab(ytext, provider.awareness, {
        awareness: provider.awareness,
        clientID: ydoc.clientID
      }),
        remoteCursorPlugin    //  Custom cursor plugin
    ]
  })
  console.log("EditorState created", state)
} catch (err) {
  console.error("Failed to create EditorState:", err)
}

const cursorPlugin = ViewPlugin.fromClass(class {
  constructor(view) {
    this.decorations = this.buildDecorations(view)
    provider.awareness.on('change', () => {
      this.decorations = this.buildDecorations(view)
      view.update([])
    })
  }

  update(update) {
    // Called on every document update
    this.decorations = this.buildDecorations(update.view)
  }

  buildDecorations(view) {
    const decos = []
    const states = provider.awareness.getStates()
    for (const [clientID, state] of states.entries()) {
      if (clientID === ydoc.clientID) continue
      const cursor = state.cursor
      const user = state.user
      if (cursor && user) {
        const deco = Decoration.widget({
          widget: new CursorWidget(user.name, user.color),
          side: -1
        }).range(cursor.head)
        decos.push(deco)
      }
    }
    return Decoration.set(decos)
  }

  destroy() {
    provider.awareness.off('change', this)
  }
}, {
  decorations: v => v.decorations
})




view = new EditorView({
  state,
  parent: document.getElementById('editor')
})
console.log("EditorView initialized")

view.dispatch({
  effects: EditorView.updateListener.of(update => {
    if (update.selectionSet) {
      const anchor = update.state.selection.main.anchor
      const head = update.state.selection.main.head
      provider.awareness.setLocalStateField('cursor', { anchor, head })
    }
  })
})

let typingTimeout;

view.dom.addEventListener('input', () => {
  provider.awareness.setLocalStateField('isTyping', true);

  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    provider.awareness.setLocalStateField('isTyping', false);
  }, 2000);
});




class CursorWidget {
  constructor(user) {
    this.user = user;
  }

  toDOM() {
    const cursor = document.createElement("span");
    cursor.className = "remote-cursor";
    cursor.style.borderLeft = `2px solid ${this.user.color}`;
    cursor.style.marginLeft = "-1px";
    cursor.style.height = "1em";
    cursor.style.position = "relative";

    const label = document.createElement("div");
    label.textContent = this.user.name;
    label.style.position = "absolute";
    label.style.top = "-1.2em";
    label.style.left = "0";
    label.style.background = this.user.color;
    label.style.color = "#fff";
    label.style.fontSize = "0.75em";
    label.style.padding = "0 4px";
    label.style.borderRadius = "4px";

    cursor.appendChild(label);
    return cursor;
  }

  ignoreEvent() { return true; }
}
//}); //Test here






  provider.awareness.on('change', () => {
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

 // let typingTimeout;

  view.dom.addEventListener('input', () => {
    provider.awareness.setLocalStateField('isTyping', true);

    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      provider.awareness.setLocalStateField('isTyping', false);
    }, 2000);
  });

});

// ==========================
// Export Functions
// ==========================

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
  const state = view.state.toJSON();
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

//});

// Make available globally
window.exportAsText = exportAsText;
window.exportAsJSON = exportAsJSON;
window.exportAsYsnap = exportAsYsnap;
window.exportSnapshotAsJSON = exportSnapshotAsJSON;
console.log("Export functions set up")
export {};

