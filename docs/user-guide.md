# Collaborative Text Editor — User Guide

Welcome to the **Collaborative Text Editor**! This guide will help you understand how to use all the key features of the editor to collaborate in real time.

---

## Getting Started

To launch the editor, open the application in your browser. You can specify a custom room in the URL like this:

```
http://localhost:8080/?room=your-room-name
```

This creates or joins a shared editing space named `your-room-name`.

If no room is specified, a globally unique room name (UUID) will be generated automatically. You can share the resulting URL with others to collaborate in the same document.

Example:
```
http://localhost:8080/?room=b51f0dd8-bc93-4a3d-a0e5-417a8ac812c4
```

---

## The Interface

At the top of the screen, you'll see a toolbar with the following information:

| UI Element              | Description |
|-------------------------|-------------|
| **Room**                | The name of the shared editing room (from the URL or generated as a UUID). |
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

### Search
## Document Search

The editor includes a powerful **client-side search feature** powered by Rust WebAssembly for fast text processing.

### How to Search

1. **Locate the search box** in the toolbar (next to document statistics)
2. **Type your search term** in the "Search document..." input field
3. **Press Enter** or **click the Search button**
4. **View results**: The editor will jump to the first match and show a count of total matches

### Search Features

- **Fast performance**: Searches large documents instantly using WASM
- **Case-insensitive**: Searches ignore capitalization by default
- **Multiple matches**: Finds all occurrences in the document
- **Jump to match**: Automatically scrolls to and selects the first result
- **Match counting**: Shows total number of matches found

### Search Controls

| Control | Action |
|---------|--------|
| **Search box** | Type your search term here |
| **Enter key** | Execute search (same as clicking Search button) |
| **Search button** | Find matches and jump to first result |
| **Clear button** | Clear search term and remove selection |

### Using Search Effectively

1. **Type specific terms** for better results (e.g., "constitution" vs "the")
2. **Use the Clear button** to remove search highlighting and return to normal editing
3. **Search works on the current document** - all collaborators can search independently
4. **No network required** - search happens entirely in your browser

### Search Results

When you search, you'll see:
- **Alert popup** showing "Found X matches. First match selected."
- **Text selection** highlighting the first match
- **Automatic scrolling** to bring the match into view
- **Console logging** showing all match positions (for debugging)

### Example Workflow

1. Open a document with substantial text
2. Type "equal" in the search box
3. Press Enter
4. See "Found 6 matches. First match selected." 
5. The word "equal" will be highlighted and visible on screen
6. Click Clear to return to normal editing

### Performance Notes

- **Large documents**: Search works efficiently on documents with 25,000+ characters
- **Real-time results**: Instant search response with WASM performance
- **Memory efficient**: No document indexing required


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
- `/?room=b51f0dd8-bc93-4a3d-a0e5-417a8ac812c4` (UUID)
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
| **.cbor**             | Saves the document state in CBOR format. Useful for syncing or restoring later. |
| **PromiseGrid CBOR**   | **NEW**: Saves document as authentic PromiseGrid protocol message with official 'grid' tag. |
| **.ysnap**             | Binary format snapshot of the full Yjs document. Useful for restoring or syncing state later. |
| **.json (Yjs Update)** | JSON array of bytes representing a Yjs update. Useful for debugging or syncing between sessions. |
| **.md**                | Git-compatible Markdown format (WIP; powered by Rust backend). |

---

## PromiseGrid Protocol Features

This editor includes **real PromiseGrid protocol integration** for decentralized computing demonstration:

### Live Message Generation
Every formatting action automatically creates PromiseGrid CBOR messages:
- **Bold/Italic/Underline** formatting generates protocol messages
- **Document formatting** operations create PromiseGrid messages
- **URL conversion** actions trigger message creation
- All messages follow official PromiseGrid specification

### Console Monitoring
To see PromiseGrid messages in action:
1. **Open browser developer console** (F12)
2. **Perform any formatting action** (Bold, Format, etc.)
3. **Watch console output** showing message creation:
   ```
   PromiseGrid CBOR message created: 193 bytes
   PromiseGrid Message: { "protocol_hash": "QmPromiseGridProtocolV1", ... }
   Created PromiseGrid message for bold edit
   ```

### PromiseGrid Export
The **PromiseGrid CBOR** export option creates protocol-compliant files:
- **Official 'grid' tag** (0x67726964) for authentic PromiseGrid messages
- **Complete document content** packaged as PromiseGrid message
- **User and session metadata** included in message structure
- **CBOR encoding** for efficient storage and transmission

### Protocol Testing
Advanced users can test PromiseGrid functions directly in the browser console:
```javascript
// Create a test message
window.createPromiseGridMessage("test-doc", "insert", 0, "Hello PromiseGrid!", "user");

// Parse and display messages
window.logPromiseGridMessage(messageBytes);
```

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
5. **Check console output**: See PromiseGrid messages being generated in real-time

### Best Practices
- **Select text precisely** for formatting - avoid selecting extra spaces or newlines
- **Use Format button** before sharing documents for professional appearance  
- **Share room URLs** with teammates for instant collaboration
- **Check document stats** to track writing progress
- **Export as PromiseGrid CBOR** to demonstrate decentralized computing capabilities

---

## Troubleshooting

- Ensure you're using a supported browser like **Chrome** or **Firefox**.
- If the editor doesn't load, check your browser console for errors (e.g., related to service workers or WebSocket).
- To reset your name/color, just refresh and retype in the User Settings section.
- **If formatting buttons don't work**: Check console for WASM errors, try refreshing the page.
- **If stats don't update**: Make sure you're typing in the editor area.
- **If PromiseGrid messages don't appear**: Ensure WASM module loaded successfully (check console on page load).

---

## Technical Notes

- **Yjs** handles real-time synchronization and awareness.
- **CodeMirror 6** powers the rich text editing with undo/redo support.
- **IndexedDB** is used for offline persistence.
- **Rust WebAssembly (WASM)** powers all text processing features for near-native performance.
- **PromiseGrid CBOR encoding** provides authentic decentralized computing protocol messaging.
- The editor supports **live cursor awareness**, **room-based isolation**, and **multi-user document interaction** out of the box.
- The backend may be powered by a **Rust** server instead of the default y-websocket server.
- **All text processing happens client-side** - no server required for formatting operations.
- **PromiseGrid protocol compliance** demonstrates real decentralized computing capabilities.

---

## Clean Room URL Example

```text
http://localhost:8080/?room=demo-room
```

or with auto-generated UUID:

```text
http://localhost:8080
```

Share this with others to collaborate!
