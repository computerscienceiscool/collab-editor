
# UUID-Based Room Names for Collaboration

This document describes how UUID-based room names work in the collaborative text editor, and how they support isolated, real-time editing sessions.

---

## What is a UUID Room?

Each collaborative editing session is identified by a unique room name. By default, rooms can be named manually via URL parameters. With the new design, the editor can also generate a globally unique identifier (UUID) to represent a new room.

---

## Why Use UUIDs?

- Avoids collisions between rooms
- Automatically creates isolated sessions
- Useful for temporary documents or one-time collaboration

---

## How It Works

When the editor is launched without a `?room=` parameter in the URL, a new UUID is generated and used as the room name. This ensures a unique editing session.

The generated UUID appears in the address bar so users can copy and share it.

---

## URL Examples

- Manual room: `http://localhost:8080/?room=math-class-notes`
- Auto-generated UUID room: `http://localhost:8080/?room=89f76e62-35fc-4ae3-9688-6a9835f3967b`

---

## Technical Notes

- UUIDs are generated using the `uuid` package in JavaScript.
- They follow the RFC 4122 UUID v4 standard.
- The room name is used to:
  - Initialize the Yjs document and WebSocket provider
  - Store local persistence in IndexedDB

---

## Sharing and Collaboration

To collaborate, users simply share the full URL with others. When two people open the same `?room=UUID`, they are editing the same document in real time.

---

## Testing and Debugging

For testing purposes, you can still manually assign room names via the URL. UUID-based rooms are intended for production use or on-demand session generation.

