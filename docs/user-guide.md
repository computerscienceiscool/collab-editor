# Collaborative Text Editor — User Guide

Welcome to the **Collaborative Text Editor**! This guide will help you understand how to use all the key features of the editor to collaborate in real time.

---

## Getting Started

To launch the editor, open the application in your browser. You can specify a custom document in the URL like this:

```
http://localhost:8080/?doc=your-document-name
```

This creates or joins a shared editing space named `your-document-name`.

If no document is specified, a globally unique document name (UUID) will be generated automatically. You can share the resulting URL with others to collaborate in the same document.

Example:
```
http://localhost:8080/?doc=b51f0dd8-bc93-4a3d-a0e5-417a8ac812c4
```

---

## The Interface

At the top of the screen, you'll see a menu with the following information:

### Menu Bar
At the very top, you'll find the main menu bar with:
- **Document Title**: Click to rename your document (affects export filenames)
- **File Menu**: New, copy, share, print, and export options
- **Edit Menu**: Cut, copy, paste, undo, redo, find, and select operations
- **Format Menu**: Text formatting (bold, italic, headers, lists, links)
- **Tools Menu**: Word count, line numbers, document statistics, and preferences
- **View Menu**: Toggle toolbars, activity log, and fullscreen mode
- **Help Menu**: Keyboard shortcuts, documentation, and about informat

### Toolbar
Beneath the menu bar is the **Toolbar**, which provides quick access to key features:


| UI Element              | Description |
|-------------------------|-------------|
| **Formatting Buttons**  | Bold, Italic, Underline, Strikethrough, Headings (H1-H3) |
| **List Buttons**        | Bullet lists, numbered lists |
| **Action Buttons**      | Link conversion, Undo, Redo, Format Document |
| **Search Box**          | Real-time document search with WASM performance |

### User Settings Panel
| UI Element              | Description |
|-------------------------|-------------|
| **Name Input**          | Your display name for collaboration |
| **Color Picker**        | Your cursor and user indicator color |
| **Document Display**        | Current document name for sharing |

### Status Bar
At the bottom of the screen:
| UI Element              | Description |
|-------------------------|-------------|
| **Document Statistics** | Live word count, character count, and reading time |
| **Typing Indicator**    | Shows when someone else is typing |
| **User Count**          | Number of active collaborators |
| **User List**           | Colored name tags of all participants |

## Menu System Guide

The editor provides comprehensive functionality through its Google Docs-style menu system.

### File Menu Features

**Document Management:**
- **New Document (Ctrl+N)**: Creates a fresh document with new document URL
- **Make a copy**: Opens your document in a new tab for independent editing
- **Rename**: Click the document title or use this menu item to rename

**Export Options:**
All exports automatically use your document title for the filename:
- **Download as Text (.txt)**: Plain text version
- **Download as CodeMirror State (.json)**: Complete editor state
- **Download as CBOR (.cbor)**: Structured document with metadata
- **Download as PromiseGrid CBOR**: Protocol-compliant decentralized computing format
- ~~**Download as Yjs Snapshot (.ysnap)**: Binary collaboration snapshot~~
- ~~**Download as Yjs Update (.json)**: Collaboration state as JSON~~

**Sharing:**
- **Share**: Use native browser sharing or copy URL with message
- **Email**: Opens your email client with document preview and collaboration link
- **Copy Document URL**: Quick clipboard copy for sharing
- **Print (Ctrl+P)**: Standard browser print dialog

### Edit Menu Features

**Text Operations:**
- **Cut (Ctrl+X)**, **Copy (Ctrl+C)**, **Paste (Ctrl+V)**: Standard clipboard operations
- **Select all (Ctrl+A)**: Select entire document
- **Delete**: Remove selected text or character at cursor

**Document Navigation:**
- **Undo (Ctrl+Z)**, **Redo (Ctrl+Y)**: Full history support
- **Find (Ctrl+F)**: Focuses search box for fast WASM-powered search

### Format Menu Features

All formatting operations are powered by Rust WebAssembly for maximum performance:

**Text Formatting:**
- **Bold (Ctrl+B)**, **Italic (Ctrl+I)**, **Underline (Ctrl+U)**: Standard formatting
- **Strikethrough**: Cross out text
- **Format Document**: Clean up spacing, punctuation, and markdown formatting

**Document Structure:**
- **Heading 1, 2, 3**: Convert lines to markdown headers
- **Bullet List**, **Numbered List**: Create and toggle list formatting
- **Insert Link**: Convert URLs to proper markdown links

### Tools Menu Features

**Document Analysis:**
- **Word count (Ctrl+Shift+C)**: Detailed document statistics popup
- **Document Statistics**: Same as status bar info
- **Toggle line numbers**: Show/hide line numbers in editor

**Settings:**
- **Preferences (Ctrl+Comma)**: Keyboard shortcut customization dialog
- **Notification settings**: Information about current notification system
- **Accessibility**: Complete keyboard shortcut reference

**Advanced:**
- **Test PromiseGrid Message**: Generate protocol messages for testing

### View Menu Features

**Interface Control:**
- **Toggle Activity Log (Ctrl+Alt+A)**: Show/hide user activity sidebar
- **Toggle Toolbar (Ctrl+Alt+Y)**: Show/hide formatting toolbar
- **Toggle Markdown Preview (Ctrl+M)**: Show/hide side-by-side markdown preview pane
- **Update Preview (Ctrl+R)**: Refresh markdown preview with current document text
- **Full Screen Mode**: Browser fullscreen for distraction-free editing

### Keyboard Shortcuts Summary

**Note: By default, only Copy (Ctrl+C), Cut (Ctrl+X), and Paste (Ctrl+V) shortcuts are enabled. Other shortcuts need to be enabled through the Keyboard Shortcuts menu item.**

**File Operations:**
- Ctrl+N: New Document
- Ctrl+P: Print
- Ctrl+Shift+S: Make Copy
- Ctrl+Shift+E: Email Document  
- Ctrl+Shift+U: Copy Document URL

**Editing:**
- Ctrl+Z: Undo, Ctrl+Y: Redo
- Ctrl+C: Copy, Ctrl+X: Cut, Ctrl+V: Paste
- Ctrl+A: Select All, Ctrl+F: Find

**Formatting:**
- Ctrl+B: Bold, Ctrl+I: Italic, Ctrl+U: Underline
- Ctrl+Shift+X: Strikethrough
- Ctrl+K: Insert Link
- Ctrl+Alt+1/2/3: Headings
- Ctrl+Shift+7/8: Lists

**View:**
- Ctrl+M: Toggle Markdown Preview
- Ctrl+R: Update Preview
- Ctrl+Alt+A: Toggle Activity Log
- Ctrl+Alt+Y: Toggle Toolbar

**Tools:**
- Ctrl+Shift+C: Word Count
- Ctrl+Shift+L: Toggle Line Numbers
- **Ctrl+Comma: Preferences (Keyboard Shortcuts)**
- Esc: Close any open menu

## Keyboard Shortcut Customization

**NEW FEATURE**: You can now customize any keyboard shortcut to match your preferences!

### How to Customize Shortcuts

1. **Open Preferences**: Press **Ctrl+Comma** or go to **Tools → Preferences**
2. **Browse categories**: Shortcuts are organized by File, Edit, Format, Tools, View, Help, Search, and System
3. **Click any shortcut**: Click on the key combination (like "Ctrl+B") to edit it
4. **Press new keys**: The shortcut turns yellow - press your desired key combination
5. **Automatic save**: Changes are saved immediately to your browser

### Keyboard Shortcuts Opt-In

**Important**: Most keyboard shortcuts are disabled by default except for the basic editing operations:
- **Enabled by default**: Copy (Ctrl+C), Cut (Ctrl+X), Paste (Ctrl+V)
- **Disabled by default**: All other shortcuts (formatting, navigation, etc.)

To enable additional shortcuts:
1. Access **Help → Keyboard Shortcuts** menu item
2. Use the toggle switches to enable the shortcuts you want to use
3. Changes are saved automatically to your browser

### Customization Features

- **51 shortcuts available**: Every keyboard shortcut in the editor can be changed
- **Conflict detection**: System prevents duplicate assignments and suggests alternatives
- **Industry standards**: Defaults follow common conventions (Ctrl+C for Copy, etc.)
- **Personal settings**: Changes are saved locally - each user can have different shortcuts
- **Reset option**: Restore all defaults anytime with one click

### Customization Tips

**Choosing Shortcuts:**
- **Use familiar patterns**: Keep Copy as Ctrl+C, Paste as Ctrl+V
- **Group related functions**: Use Ctrl+1/2/3 for different heading levels
- **Avoid system shortcuts**: Don't use Alt+Tab, Alt+F4, etc.
- **Consider frequency**: Put easy shortcuts on commonly used functions

**Example Custom Setups:**
- **Writer-focused**: Ctrl+W for Word Count, Ctrl+1/2/3 for headings
- **Developer-focused**: Ctrl+/ for Format Document, Ctrl+L for Line Numbers  
- **Minimalist**: Remove rarely used shortcuts, keep only essentials

### Accessing Customization
- **Menu**: Tools → Preferences
- **Keyboard**: Ctrl+Comma (can be customized too!)
- **Documentation**: See [keyboard-preferences.md](keyboard-preferences.md) for complete guide

## Text Formatting and WASM Features

The editor includes powerful **WebAssembly-powered** text processing features accessible through both the toolbar buttons and Format menu:

### Live Document Statistics
- **Word count** - Updates as you type
- **Character count** - Excludes spaces for clean metrics  
- **Reading time** - Estimated based on 200 words per minute
- **Display**: Always visible in the toolbar

### Formatting Buttons
Select text and click buttons to apply formatting:

### Formatting Operations
Apply formatting through toolbar buttons or Format menu (all operations use WASM for performance):

| Operation     | Toolbar | Menu | Keyboard | Example |
|---------------|---------|------|----------|---------|
| **Strikethrough** | S button | Format → Strikethrough | Ctrl+Shift+X | `hello` ↔ `~~hello~~` |
| **Heading 1** | H1 button | Format → Heading 1 | Ctrl+Alt+1 | `hello` ↔ `# hello` |
| **Heading 2** | H2 button | Format → Heading 2 | Ctrl+Alt+2 | `hello` ↔ `## hello` |
| **Heading 3** | H3 button | Format → Heading 3 | Ctrl+Alt+3 | `hello` ↔ `### hello` |
| **Bullet List** | • button | Format → Bullet List | Ctrl+Shift+8 | `item` ↔ `• item` |
| **Numbered List** | 1. button | Format → Numbered List | Ctrl+Shift+7 | `item` ↔ `1. item` |
| **Link Conversion** | Link button | Format → Insert Link | Ctrl+K | `https://github.com` → `[https://github.com](https://github.com)` |

**Note**: All keyboard shortcuts above can be customized via **Tools → Preferences**!

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

## Documents and URLs

Documents allow you to isolate workspaces. The document name is taken from the `doc` query in the URL.

**Examples:**
- `/?doc=math-101`
- `/?doc=demo-document`
- `/?doc=b51f0dd8-bc93-4a3d-a0e5-417a8ac812c4` (UUID)
- If no document is specified, one will be generated for you.

You can share your document URL with others so they can join and collaborate in the same document.

---

## User Awareness

When multiple users are connected:

- **Cursors** appear with the user's chosen color and name.
- You can **see their name and cursor** as they type or move.
- When a user is typing, a **"User is typing..."** indicator appears briefly.

This feature is powered by Automerge awareness and updates in real time.

---

## Exporting and Saving Your Work

Click the **Save** button in the toolbar to export your work. Choose the format from the dropdown:

| Format Option         | Description |
|------------------------|-------------|
| **.txt**               | Saves the plain text contents of the document. |
| **.json**              | Saves the current CodeMirror editor state (can include styling info). |
| **.cbor**             | Saves the document state in CBOR format. Useful for syncing or restoring later. |
| **PromiseGrid CBOR**   | **NEW**: Saves document as authentic PromiseGrid protocol message with official 'grid' tag. |
| ~~**.ysnap**~~             | ~~Binary format snapshot of the full Yjs document. Useful for restoring or syncing state later.~~ |
| ~~**.json (Yjs Update)**~~ | ~~JSON array of bytes representing a Yjs update. Useful for debugging or syncing between sessions.~~ |
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

## Real-Time Markdown Preview

The editor now includes **real-time markdown preview updates** that automatically refresh as you type:

### How It Works
- **Automatic updates**: The markdown preview updates instantly as you type in the editor
- **No manual refresh needed**: You no longer need to click "Update Preview" or press Ctrl+R
- **Works with all input methods**: Keyboard typing, pasting, remote collaborative changes, and programmatic edits
- **Live visualization**: See exactly how your markdown will render as you write it

### Using the Markdown Preview
1. **Open the preview pane**: Click View → Toggle Markdown Preview or press Ctrl+M
2. **Start typing**: The preview updates automatically with each keystroke
3. **Watch formatting**: See how headers, lists, bold text, etc. appear in real-time
4. **Collaborate**: Preview updates with changes from all collaborators

### Manual Refresh Option
Although rarely needed, you can still manually refresh the preview:
- **Menu**: View → Update Preview
- **Keyboard**: Ctrl+R (if enabled)

### Best Practices
- Use markdown syntax (headers with #, lists with - or *, etc.) for optimal preview results
- Watch the preview as you edit to ensure your formatting looks as expected
- The preview shows exactly how your document will appear when exported as markdown

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
1. **Enable needed shortcuts**: Access Help → Keyboard Shortcuts to activate shortcuts you use frequently
2. **Customize shortcuts**: Press Ctrl+Comma to set up shortcuts that work for you
3. **Use markdown preview**: Keep the preview pane open to see how your document renders in real-time
4. **Format entire documents**: Click Format button to clean up spacing and punctuation
5. **Quick URL conversion**: Double-click URLs to select cleanly, then use your Link shortcut
6. **Monitor your progress**: Watch live word count and reading time in toolbar
7. **Check console output**: See PromiseGrid messages being generated in real-time

### Best Practices
- **Activate needed shortcuts**: Enable only the keyboard shortcuts you regularly use
- **Personalize shortcuts**: Set up shortcuts that match your workflow and habits
- **Select text precisely** for formatting - avoid selecting extra spaces or newlines
- **Use Format button** before sharing documents for professional appearance  
- **Share document URLs** with teammates for instant collaboration
- **Check document stats** to track writing progress
- **Export as PromiseGrid CBOR** to demonstrate decentralized computing capabilities

### Shortcut Recommendations
- **Keep standards**: Leave Ctrl+C, Ctrl+V, Ctrl+Z as they are - muscle memory is important
- **Group by function**: Use Ctrl+1/2/3 for headings, Ctrl+Shift+7/8 for lists
- **Use what feels natural**: If Ctrl+B for Bold feels wrong to you, change it!
- **Test your changes**: Make sure new shortcuts don't conflict with browser functions

---

## Troubleshooting

- Ensure you're using a supported browser like **Chrome** or **Firefox**.
- If the editor doesn't load, check your browser console for errors (e.g., related to service workers or WebSocket).
- To reset your name/color, just refresh and retype in the User Settings section.
- **If formatting buttons don't work**: Check console for WASM errors, try refreshing the page.
- **If stats don't update**: Make sure you're typing in the editor area.
- **If keyboard shortcuts don't work**: Check if they've been enabled in Help → Keyboard Shortcuts
- **If markdown preview doesn't update**: Click View → Update Preview to force a refresh
- **If PromiseGrid messages don't appear**: Ensure WASM module loaded successfully (check console on page load).
- **If custom shortcuts don't work**: Check Preferences dialog to verify they saved correctly
- **To reset shortcuts**: Use "Reset to Defaults" button in Tools → Preferences

---

## Technical Notes

- **Automerge** handles real-time synchronization and awareness.
- **CodeMirror 6** powers the rich text editing with undo/redo support.
- **IndexedDB** is used for offline persistence.
- **Rust WebAssembly (WASM)** powers all text processing features for near-native performance.
- **PromiseGrid CBOR encoding** provides authentic decentralized computing protocol messaging.
- The editor supports **live cursor awareness**, **document-based isolation**, and **multi-user document interaction** out of the box.
- ~~The backend may be powered by a **Rust** server instead of the default y-websocket server.~~
- **All text processing happens client-side** - no server required for formatting operations.
- **PromiseGrid protocol compliance** demonstrates real decentralized computing capabilities.
- **Keyboard shortcuts are stored locally** - each user can have completely different shortcuts.
- **Real-time markdown preview** updates automatically without requiring manual refresh.

---

## Document URL Example
```text
http://localhost:8080/?doc=automerge:2VJnuVxuBCphkYpucWZKziogaFBb
```

or visit the base URL to create a new document:
```text
http://localhost:8080/
```

Share the full URL with others to collaborate!

