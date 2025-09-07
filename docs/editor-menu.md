# Editor Menu System Documentation

This document describes the Google Docs-style menu system implemented in the Collaborative Text Editor.

## Overview

The editor features a comprehensive menu bar with File, Edit, Format, Tools, View, and Help menus, providing intuitive access to all editor functionality through both menu items and keyboard shortcuts.

## Menu Structure

### File Menu

| Feature | Keyboard Shortcut | Status | Description |
|---------|-------------------|--------|-------------|
| **New Document** | Ctrl+N | Implemented | Creates a new document with fresh UUID room |
| **Open** | Ctrl+O | Not implemented | File upload/import functionality (Medium complexity) |
| **Make a copy** | Ctrl+Shift+S | Implemented | Opens new tab with copied document content |
| **Download as Text (.txt)** | - | Implemented | Exports plain text with custom filename based on document title |
| **Download as CodeMirror State (.json)** | - | Implemented | Exports editor state as JSON |
| **Download as CBOR (.cbor)** | - | Implemented | Exports document with metadata in CBOR format |
| **Download as PromiseGrid CBOR** | - | Implemented | Exports protocol-compliant PromiseGrid CBOR messages |
| **Download as Yjs Snapshot (.ysnap)** | - | Implemented | Binary Yjs document snapshot |
| **Download as Yjs Update (.json)** | - | Implemented | JSON array of Yjs update bytes |
| **Share** | - | Implemented | Native sharing or URL copy with custom message |
| **Email** | Ctrl+Shift+E | Implemented | Opens email client with document content and collaboration link |
| **Copy Room URL** | Ctrl+Shift+U | Implemented | Copies collaboration URL to clipboard |
| **Print** | Ctrl+P | Implemented | Browser print dialog |
| **Rename** | - | Implemented | Focuses document title input for editing |
| **Version history** | - | Implemented | Shows basic document info (room, stats, users) |

### Edit Menu

| Feature | Keyboard Shortcut | Status | Description |
|---------|-------------------|--------|-------------|
| **Undo** | Ctrl+Z | Implemented | CodeMirror undo functionality |
| **Redo** | Ctrl+Y | Implemented | CodeMirror redo functionality |
| **Cut** | Ctrl+X | Implemented | Copy selection to clipboard and delete |
| **Copy** | Ctrl+C | Implemented | Copy selection to clipboard |
| **Paste** | Ctrl+V | Implemented | Paste from clipboard at cursor position |
| **Select all** | Ctrl+A | Implemented | Select entire document |
| **Delete** | - | Implemented | Delete selected text or character at cursor |


### Format Menu

| Feature | Keyboard Shortcut | Status | Description |
|---------|-------------------|--------|-------------|
| **Format Document** | - | Implemented | WASM-powered document cleanup (JavaScript fallback) |
| **Bold** | Ctrl+B | Implemented | WASM toggle bold formatting with PromiseGrid messaging |
| **Italic** | Ctrl+I | Implemented | WASM toggle italic formatting with PromiseGrid messaging |
| **Underline** | Ctrl+U | Implemented | WASM toggle underline formatting with PromiseGrid messaging |
| **Strikethrough** | Ctrl+Shift+X | Implemented | WASM toggle strikethrough formatting |
| **Heading 1** | Ctrl+Alt+1 | Implemented | WASM toggle H1 markdown formatting |
| **Heading 2** | Ctrl+Alt+2 | Implemented | WASM toggle H2 markdown formatting |
| **Heading 3** | Ctrl+Alt+3 | Implemented | WASM toggle H3 markdown formatting |
| **Bullet List** | Ctrl+Shift+8 | Implemented | WASM toggle bullet point formatting |
| **Numbered List** | Ctrl+Shift+7 | Implemented | WASM toggle numbered list formatting |
| **Insert Link** | Ctrl+K | Implemented | WASM URL to markdown link conversion |

### Tools Menu

| Feature | Keyboard Shortcut | Status | Description |
|---------|-------------------|--------|-------------|
| **Word count** | Ctrl+Shift+C | Implemented | Enhanced popup with room info and document statistics |
| **Toggle line numbers** | Ctrl+Shift+L | Implemented | Show/hide line numbers in editor  |
| **Document Statistics** | - | Implemented | Shows live word/char count and reading time |
| **Test PromiseGrid Message** | - | Implemented | Creates and logs PromiseGrid CBOR messages |
| **Notification settings** | - | Implemented | Explains current notification system |
| **Preferences** | Ctrl+Comma | Implemented | Keyboard shortcut customization preferences |
| **Accessibility** | - | Implemented | Complete keyboard shortcuts and accessibility information |

### View Menu

| Feature | Keyboard Shortcut | Status | Description |
|---------|-------------------|--------|-------------|
| **Show/Hide Activity Log** | Ctrl+Alt+A | Implemented | Toggle user activity sidebar |
| **Show/Hide Toolbar** | Ctrl+Shift+T | Implemented | Toggle formatting toolbar visibility |
| **Toggle Markdown Preview** | Ctrl+M | Implemented | Toggle side-by-side markdown preview pane |
| **Update Preview** | Ctrl+R | Implemented | Refresh markdown preview with current text content |
| **Full Screen Mode** | - | Implemented | Browser fullscreen toggle |

### Help Menu

| Feature | Keyboard Shortcut | Status | Description |
|---------|-------------------|--------|-------------|
| **Keyboard Shortcuts** | - | Implemented | Complete list of all keyboard shortcuts |
| **About** | - | Implemented | Editor information and features |
| **Documentation** | - | Implemented | Link to project documentation |
| **PromiseGrid Integration** | - | Implemented | Information about PromiseGrid protocol features |

## Key Features

### Documentation Docs-Style Interface
- Clean, modern menu bar with hover effects
- Dropdown menus with keyboard shortcuts displayed
- Organized menu sections with visual separators
- Professional styling matching Google Docs aesthetic

### WASM Integration
- All text formatting operations powered by Rust WebAssembly
- High-performance text processing with near-native speed
- Client-side document compression and statistics
- Protocol-compliant PromiseGrid message generation

### Collaborative Features
- Real-time document title synchronization (planned)
- Room-based collaboration with UUID generation
- User presence and activity tracking
- Offline support with automatic sync

### Export Options
All export functions respect the document title for filename generation:
- Plain text exports as `{document-title}.txt`
- CBOR exports as `{document-title}.cbor`
- PromiseGrid exports as `{document-title}_promisegrid.cbor`

### Keyboard Shortcuts
Comprehensive keyboard shortcut support for all major operations:
- Standard shortcuts (Ctrl+C, Ctrl+V, etc.)
- Editor-specific shortcuts (Ctrl+B for Bold, etc.)
- Custom shortcuts (Ctrl+Shift+C for Word Count)
- **Fully customizable shortcuts** via Tools → Preferences (Ctrl+Comma)
- ESC to close any open menu

## Technical Implementation

### Menu System Architecture
- Modular JavaScript class-based implementation
- Event delegation for efficient menu handling
- State management for menu visibility
- Integration with existing WASM functions

### Integration Points
- **CodeMirror 6**: Editor operations and text manipulation
- **Yjs**: Real-time collaboration and document synchronization
- **WASM Module**: Text processing and PromiseGrid protocol
- **Browser APIs**: Clipboard, sharing, print functionality

### Error Handling
- Graceful fallbacks for unsupported browser features
- Clear error messages for failed operations
- Permission handling for clipboard and sharing APIs
- Input validation for all text operations

## Future Enhancements

### Planned Features
- **Document title persistence** (room-based or client-only)
- **Find and replace** functionality
- **Line numbers** (full CodeMirror integration)
- **Advanced theme support**

### Potential Integrations
- **Dictionary API** for word definitions
- **Grammar checking** services
- **Document comparison** algorithms
- **Cloud storage** integration

## Usage Guidelines

### For Users
1. **Document Naming**: Click the document title to rename
2. **Collaboration**: Share the room URL for real-time collaboration
3. **Keyboard Efficiency**: Use Ctrl+Shift+C for quick word count
4. **Shortcut Customization**: Use Tools → Preferences to customize keyboard shortcuts
5. **Export Options**: Choose appropriate format based on use case

### For Developers
1. **Menu Extension**: Add new items by updating HTML and handleAction method
2. **Keyboard Shortcuts**: Add to setupKeyboardShortcuts method
3. **WASM Integration**: Connect to existing WASM functions for text processing
4. **Error Handling**: Always provide user feedback for operations

## Status Summary

- **Total Menu Items**: 47
- **Implemented**: 33 (70%)
- **Not Implemented**: 14 (30%)
- **Fully Functional Categories**: File (93%), Edit (100%), Format (100%), View (100%), Help (100%)
- **Partially Implemented**: Tools (86% - missing advanced features)

The menu system provides comprehensive functionality for document editing, collaboration, and export while maintaining the familiar Google Docs interface that users expect.
