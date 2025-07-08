
# Collaborative Text Editor — User Guide

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

| UI Element          | Description |
|---------------------|-------------|
| **Room**            | The name of the shared editing room (from the URL or generated as a GUID). |
| **User**            | Your display name in the session. |
| **Users**           | Count of users currently in the session. |
| **User List**       | Colored name tags of all participants. |
| **Typing Indicator**| Shows when someone else is typing. |
| **Save Options**    | Export your document in various formats. |
| **Log Button**      | Toggle to show/hide the User Activity Log. |

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

- **Cursors** appear with the user’s chosen color and name.
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

## Tips and Troubleshooting

- Ensure you're using a supported browser like **Chrome** or **Firefox**.
- If the editor doesn't load, check your browser console for errors (e.g., related to service workers or WebSocket).
- To reset your name/color, just refresh and retype in the User Settings section.

---

## Technical Notes

- **Yjs** handles real-time synchronization and awareness.
- **CodeMirror 6** powers the rich text editing.
- **IndexedDB** is used for offline persistence.
- The editor supports **live cursor awareness**, **room-based isolation**, and **multi-user document interaction** out of the box.
- The backend may be powered by a **Rust** server instead of the default y-websocket server.
- **Markdown** export and PromiseGrid GUIDs are in early support or planned.

---

## Clean Room URL Example

```text
http://localhost:8080/?room=demo-room
```

or with auto-generated GUID:

```text
http://localhost:8080
```

Share this with others to collaborate!
