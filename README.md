# Collaborative Text Editor (Yjs-Based)

This is a collaborative text editor demo based on the [Yjs collaborative editing framework](https://docs.yjs.dev/getting-started/a-collaborative-editor).  
It enables multiple users to edit shared text documents in real-time using WebSocket and local IndexedDB persistence.

This demo has been extended with additional features that are useful to teams, including user presence, logging, export options, and document awareness.

---

## Features
### Core Collaboration
- Real-time collaborative editing
- Shared cursors and user awareness
- Custom usernames and color indicators
- Room-based collaboration via URL (e.g., `?room=my-team`)
- UUID-based room creation (see `docs/guid-rooms.md`)
- Typing indicators and presence tracking
- Toggleable user activity log
- Offline support with automatic syncing (via IndexedDB)

### WASM-Powered Text Processing
- **Document compression**: 98% compression ratio using Rust WASM
- **Smart text formatting**: Auto-clean whitespace, headers, and code blocks
- **Markdown formatting buttons**: Bold, italic, underline with smart toggle
- **Live document statistics**: Real-time word count, character count, reading time
- **Client-side processing**: All text operations run in browser with near-native speed

### Backend Support
- Optional Go or Rust backend support:
  - Go backend: Simple in-memory collaboration for legacy support
  - Rust backend: Fast document persistence, UUID-based room support, Markdown export

### Export Options
- Plain text
- CodeMirror state (JSON)
- Yjs snapshot (binary `.ysnap`# Collaborative Text Editor — User Guide

Welcome to the **Collaborative Text Editor**! This guide will help you understand how to use all the key features of the editor to collaborate in real time.

---

## Getting Started

To launch the editor, open the application in your browser. You can specify a custom room in the URL like this:

```
http://localhost:8080/?room=your-room-name
```

This creates or joins a shared editing space named `your-room-name`.

If no room is specified, a globally unique room name (GUID) will be generated automatically. You can share the resulting URL with others to collaborate in the same document.

Example:
```
http://localhost:8080/?room=b51f0dd8-bc93-4a3d-a0e5-417a8ac812c4
```

---

## The Interface

At the top of the screen, you'll see a toolbar with the following information:

| UI Element              | Description |
|-------------------------|-------------|
| **Room**                | The name of the shared editing room (from the URL or generated as a GUID). |
| **User**                | Your display name in the session. |
| **Users**               | Count of users currently in the session. |
| **User List**           | Colored name tags of all participants. |
| **Document Statistics** | Live word count, character count, and reading time. |
| **Typing Indicator**    | Shows when someone else is typing. |
| **Formatting Buttons**  | Bold, Italic, Underline, Format, Link, Undo, Redo buttons. |
| **Save Options**        | Export your document in various formats. |
| **Log Button**          | Toggle to show/hide the User Activity Log. |

---

## Text Formatting and WASM Features

The editor includes powerful **WebAssembly-powered** text processing features:

### Live Document Statistics
- **Word count** - Updates as you type
- **Character count** - Excludes spaces for clean metrics  
- **Reading time** - Estimated based on 200 words per minute
- **Display**: Always visible in the toolbar

### Formatting Buttons
Select text and click buttons to apply formatting:

| Button        | Function | Example |
|---------------|----------|---------|
| **Bold**      | Toggle bold formatting | `hello` ↔ `**hello**` |
| **Italic**    | Toggle italic formatting | `hello` ↔ `*hello*` |
| **Underline** | Toggle underline formatting | `hello` ↔ `__hello__` |
| **Link**      | Convert URLs to markdown links | `https://github.com` → `[https://github.com](https://github.com)` |

### Document-Wide Formatting
Click the **Format** button to automatically clean up your entire document:
- Remove extra whitespace and line breaks
- Fix markdown header spacing
- Format code blocks properly  
- Clean up bold/italic syntax
- **Fix punctuation spacing** (removes spaces before commas, periods, etc.)
- **Clean up parentheses** spacing: `( text )` → `(text)`

**Example transformation:**
```
Before: This has bad spacing ,and weird punctuation .Also( this )and multiple periods..
After:  This has bad spacing, and weird punctuation. Also (this) and multiple periods.
```

### Undo and Redo
- **Undo button** - Reverse your last action
- **Redo button** - Restore what you undid
- **Keyboard shortcuts** - `Ctrl+Z` (undo), `Ctrl+Y` (redo)
- Works with all formatting operations and text changes

### URL Link Helper  
1. **Type or paste URLs** in your document:
   - `https://github.com`
   - `www.google.com`  
   - `ftp://example.com/file.txt`
2. **Select the URL text**
3. **Click the Link button**
4. **Result**: `[https://github.com](https://github.com)` 

**Smart features:**
- Only converts actual URLs (detects http, https, ftp, www)
- Won't double-convert existing markdown links
- Leaves regular text unchanged

---

## Changing Your Name and Color

Beneath the toolbar is a **User Settings** section:

- **Name:**  
  Type your preferred name into the "Name" input. This updates your name in real time for all other participants.

- **Color:**  
  Choose a custom color using the color picker. This color is used in:
  - Your username badge
  - Your cursor (awareness)

---

## Rooms and URLs

Rooms allow you to isolate workspaces. The room name is taken from the `room` query in the URL.

**Examples:**
- `/?room=math-101`
- `/?room=demo-room`
- `/?room=b51f0dd8-bc93-4a3d-a0e5-417a8ac812c4` (GUID)
- If no room is specified, one will be generated for you.

You can share your room URL with others so they can join and collaborate in the same document.

---

## User Awareness

When multiple users are connected:

- **Cursors** appear with the user's chosen color and name.
- You can **see their name and cursor** as they type or move.
- When a user is typing, a **"User is typing..."** indicator appears briefly.

This feature is powered by Yjs awareness and updates in real time.

---

## Exporting and Saving Your Work

Click the **Save** button in the toolbar to export your work. Choose the format from the dropdown:

| Format Option         | Description |
|------------------------|-------------|
| **.txt**               | Saves the plain text contents of the document. |
| **.json**              | Saves the current CodeMirror editor state (can include styling info). |
| **.ysnap**             | Binary format snapshot of the full Yjs document. Useful for restoring or syncing state later. |
| **.json (Yjs Update)** | JSON array of bytes representing a Yjs update. Useful for debugging or syncing between sessions. |
| **.md**                | Git-compatible Markdown format (WIP; powered by Rust backend). |

---

## User Activity Log

Click the **"Log"** button to toggle the **User Activity Panel**.

In this panel, you will see:

- When users join or leave the session
- When users change their name or color
- Additional user-driven events (editable in code)

This provides a helpful way to audit or follow collaboration flow.

---

## Offline Support

If your browser disconnects, a **yellow OFFLINE MODE banner** appears at the top.

- Your changes are saved locally (using IndexedDB).
- When you reconnect, changes sync automatically to others.

---

## Quick Tips

### Efficient Workflow
1. **Use keyboard shortcuts**: `Ctrl+Z` for undo, `Ctrl+Y` for redo
2. **Format entire documents**: Click Format button to clean up spacing and punctuation
3. **Quick URL conversion**: Double-click URLs to select cleanly, then click Link button
4. **Monitor your progress**: Watch live word count and reading time in toolbar

### Best Practices
- **Select text precisely** for formatting - avoid selecting extra spaces or newlines
- **Use Format button** before sharing documents for professional appearance  
- **Share room URLs** with teammates for instant collaboration
- **Check document stats** to track writing progress

---

## Troubleshooting

- Ensure you're using a supported browser like **Chrome** or **Firefox**.
- If the editor doesn't load, check your browser console for errors (e.g., related to service workers or WebSocket).
- To reset your name/color, just refresh and retype in the User Settings section.
- **If formatting buttons don't work**: Check console for WASM errors, try refreshing the page.
- **If stats don't update**: Make sure you're typing in the editor area.

---

## Technical Notes

- **Yjs** handles real-time synchronization and awareness.
- **CodeMirror 6** powers the rich text editing with undo/redo support.
- **IndexedDB** is used for offline persistence.
- **Rust WebAssembly (WASM)** powers all text processing features for near-native performance.
- The editor supports **live cursor awareness**, **room-based isolation**, and **multi-user document interaction** out of the box.
- The backend may be powered by a **Rust** server instead of the default y-websocket server.
- **All text processing happens client-side** - no server required for formatting operations.

---

## Clean Room URL Example

```text
http://localhost:8080/?room=demo-room
```

or with auto-generated GUID:

```text
http://localhost:8080
```

Share this with others to collaborate!)
- Yjs update (JSON array)

---

## How to Run

1. Clone the repository:

   ```bash
   git clone https://github.com/your-org/collab-editor.git
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

5. Start the Rust backend:

   ```bash
   cd rust-server
   cargo run
   ```

6. Open your browser and visit:

   ```
   http://localhost:8080/?room=my-room
   ```

   Replace `my-room` with any custom room name. If none is provided, a UUID will be generated.

---

## Makefile Usage

For advanced use and automation, see [docs/makefile-usage.md](docs/makefile-usage.md) for how to run the Go and Rust servers using `make`.

---

## User Guide

Please see the [User Guide](docs/user-guide.md) for detailed usage instructions, UI explanations, and feature descriptions.

For information about UUID-based rooms, see [docs/guid-rooms.md](docs/guid-rooms.md).

---

## Tech Stack

- Yjs
- y-websocket
- y-indexeddb
- CodeMirror 6
- Vanilla JS / HTML / CSS
- Rust WebAssembly (WASM) - Client-side text processing
- Go (optional backend for legacy and service compatibility)
- Rust (new backend for high-performance persistence and exports)

---

## Folder Structure

- `src/`: All core JavaScript logic
- `src/setup/`: Initialization modules (Yjs, editor, user)
- `src/ui/`: UI utilities (logging, presence, typing)
- `src/wasm/`: WebAssembly integration and initialization
- `rust-wasm/`: Rust code compiled to WebAssembly
- `rust-server/`: Rust backend server code
- `docs/`: Markdown documentation (includes user guide and other files)

---

## Documentation

- [User Guide](docs/user-guide.md) — How to use the editor and its features (7/26/25)
- [Project Overview](docs/format.md) — Overview of the project structure and architecture (7/26/25)
- [UUID-Based Rooms](docs/uuid-rooms.md) — How room names are generated using UUIDs
- [Formatting Spec](docs/formatting-spec.md) — Planned document structure and export formats
- [Rust Developer Notes](docs/rust-developer-notes.md) — Architecture and data flow for the Rust backend (for Go developers)
- [docs/makefile-usage.md](docs/makefile-usage.md) — How to use the Makefile for building and running the Rust or Go server
- [docs/project.md](docs/project.md) — Latest project overview and architecture 
- [docs/rust-wasm-features.md](docs/rust-wasm-features.md) — Features implemented in the Rust for WebAssembly (7/26/25)

---

## Contributions

This is a living demo extended for internal team use. Pull requests and suggestions are welcome.
