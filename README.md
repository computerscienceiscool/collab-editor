
# Collaborative Text Editor (Yjs-Based)

This is a collaborative text editor demo based on the [Yjs collaborative editing framework](https://docs.yjs.dev/getting-started/a-collaborative-editor).  
It enables multiple users to edit shared text documents in real-time using WebSocket and local IndexedDB persistence.

This demo has been extended with additional features that are useful to teams, including user presence, logging, export options, and document awareness.

---

## 🧭 Features

- Real-time collaborative editing
- Shared cursors and user awareness
- Custom usernames and color indicators
- Room-based collaboration via URL (e.g., `?room=my-team`)
- Offline support with automatic syncing
- Export options:
  - Plain text
  - CodeMirror state (JSON)
  - Yjs snapshot (binary `.ysnap`)
  - Yjs update (JSON array)
- Typing indicators and presence tracking
- Toggleable user activity log

---

## 🚀 How to Run

1. Clone the repository:

   ```bash
   git clone [https://github.com/your-org](https://github.com/computerscienceiscool/collab-editor/refactor-editor/collab-editor.git)
   cd collab-editor
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the WebSocket server:

   ```bash
   npx y-websocket-server --port 1234
   ```

4. In a separate terminal, start the dev server:

   ```bash
   npm run dev
   ```

5. Open your browser and visit:

   ```
   http://localhost:8080/?room=my-room
   ```

   Replace `my-room` with any custom room name.

---

## 📖 User Guide

Please see the [User Guide](docs/user-guide.md) for detailed usage instructions, UI explanations, and feature descriptions.

---

## 🛠️ Tech Stack

- Yjs
- y-websocket
- y-indexeddb
- CodeMirror 6
- Vanilla JS / HTML / CSS

---

## 📂 Folder Structure

- `src/`: All core JavaScript logic
- `src/setup/`: Initialization modules (Yjs, editor, user)
- `src/ui/`: UI utilities (logging, presence, typing)
- `docs/`: Markdown documentation (includes user guide)

---

## 📬 Contributions

This is a living demo extended for internal team use. Pull requests and suggestions are welcome.

