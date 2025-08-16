# Keyboard Shortcuts Reference

Complete keyboard shortcut guide for the Collaborative Text Editor.

## File Operations

| Shortcut | Action | Description |
|----------|--------|-------------|
| **Ctrl+N** | New Document | Creates a new document with fresh UUID room |
| **Ctrl+P** | Print | Opens browser print dialog |
| **Ctrl+Shift+S** | Make a Copy | Opens document copy in new tab |
| **Ctrl+Shift+E** | Email Document | Opens email client with document and collaboration link |
| **Ctrl+Shift+U** | Copy Room URL | Copies collaboration URL to clipboard |

## Text Editing

| Shortcut | Action | Description |
|----------|--------|-------------|
| **Ctrl+Z** | Undo | Reverse last action |
| **Ctrl+Y** | Redo | Restore undone action |
| **Ctrl+C** | Copy | Copy selected text to clipboard |
| **Ctrl+X** | Cut | Cut selected text to clipboard |
| **Ctrl+V** | Paste | Paste from clipboard |
| **Ctrl+A** | Select All | Select entire document |

## Text Formatting

| Shortcut | Action | Description |
|----------|--------|-------------|
| **Ctrl+B** | Bold | Toggle bold formatting on selected text |
| **Ctrl+I** | Italic | Toggle italic formatting on selected text |
| **Ctrl+U** | Underline | Toggle underline formatting on selected text |
| **Ctrl+Shift+X** | Strikethrough | Toggle strikethrough formatting on selected text |
| **Ctrl+K** | Insert Link | Convert URLs to markdown link format |
| **Ctrl+Alt+1** | Heading 1 | Toggle H1 markdown formatting |
| **Ctrl+Alt+2** | Heading 2 | Toggle H2 markdown formatting |
| **Ctrl+Alt+3** | Heading 3 | Toggle H3 markdown formatting |
| **Ctrl+Shift+7** | Numbered List | Toggle numbered list formatting |
| **Ctrl+Shift+8** | Bullet List | Toggle bullet list formatting |

## Document Tools

| Shortcut | Action | Description |
|----------|--------|-------------|
| **Ctrl+F** | Find | Focus search box for document search |
| **Ctrl+Shift+C** | Word Count | Show detailed document statistics |
| **Ctrl+Shift+L** | Toggle Line Numbers | Show/hide line numbers in editor |

## Navigation and Interface

| Shortcut | Action | Description |
|----------|--------|-------------|
| **Ctrl+M** | Toggle Markdown Preview | Show/hide side-by-side markdown preview |
| **Ctrl+R** | Update Preview | Refresh markdown preview with current text |
| **Ctrl+Alt+A** | Toggle Activity Log | Show/hide user activity sidebar |
| **Ctrl+Shift+T** | Toggle Toolbar | Show/hide formatting toolbar |
| **Esc** | Close Menus | Close any open dropdown menu |

## Quick Reference Card

### Most Used Shortcuts
```
Ctrl+C/X/V    Copy/Cut/Paste
Ctrl+Z/Y      Undo/Redo  
Ctrl+B/I/U    Bold/Italic/Underline
Ctrl+F        Find
Ctrl+P        Print
Ctrl+N        New Document
```

### Document Shortcuts
```
Ctrl+Shift+C  Word Count
Ctrl+A        Select All
Ctrl+M        Toggle Markdown Preview
Ctrl+R        Update Preview
Esc           Close Menus
```

### Advanced Shortcuts
```
Ctrl+Shift+S  Make Copy
Ctrl+Shift+U  Copy Room URL
Ctrl+Shift+E  Email Document
Ctrl+Alt+1/2/3 Headings
Ctrl+Shift+7/8 Lists
Ctrl+Alt+A    Activity Log
Ctrl+Shift+T  Toggle Toolbar
```

## Platform Notes

### Windows/Linux
All shortcuts use the **Ctrl** key as shown above.

### macOS
Replace **Ctrl** with **Cmd** (⌘) for all shortcuts:
- **Cmd+C** for Copy
- **Cmd+B** for Bold
- **Cmd+N** for New Document
- etc.

## Accessibility Notes

### Screen Reader Support
- All buttons and menus are keyboard accessible
- Tab navigation works throughout the interface
- Menu items announce their keyboard shortcuts

### High Contrast
- Use browser settings for high contrast mode
- All keyboard shortcuts work regardless of theme

### Motor Accessibility
- All functionality available via keyboard
- No mouse-only operations
- Sticky keys compatible

## Menu Navigation

### Opening Menus
- **Tab** to menu bar, then **Enter** to open menus
- **Arrow keys** to navigate menu items
- **Enter** to select menu item
- **Esc** to close menus

### Menu Shortcuts
Instead of opening menus, use these direct shortcuts:
- Most File operations: Use toolbar or keyboard shortcuts
- Edit operations: Ctrl+C, Ctrl+V, etc.
- Format operations: Ctrl+B, Ctrl+I, etc.
- Tools: Ctrl+Shift+C for word count

## Tips for Efficiency

### Power User Workflow
1. **Ctrl+N** - Start new document
2. Type content using **Ctrl+B/I/U** for formatting
3. **Ctrl+F** to search when needed
4. **Ctrl+Shift+C** to check word count
5. **Ctrl+P** to print when finished

### Collaboration Tips
- Share room URL for others to join
- Use **Ctrl+F** to quickly find text others mention
- **Ctrl+Z/Y** works with collaborative changes
- Your formatting shortcuts work in real-time for all users

### Search Efficiency
1. **Ctrl+F** to focus search
2. Type search term
3. **Enter** to find matches
4. **Esc** to clear search and return to editing

## Troubleshooting

### Shortcuts Not Working
- Ensure focus is in the editor (click in document area)
- Some shortcuts don't work in input fields (name, search box)
- Refresh page if shortcuts stop responding

### Browser Conflicts
- Some browsers override certain shortcuts
- **Ctrl+Shift+C** might open developer tools in some browsers
- Use menu items as fallback if shortcuts are blocked

### Collaboration Issues
- Shortcuts work independently for each user
- Your Ctrl+B won't affect other users' cursor positions
- All users see formatting changes in real-time

## Custom Shortcuts

### Planned Features
Future versions may include:
- **Ctrl+H** for Find and Replace
- **Ctrl+Shift+Y** for Dictionary lookup

### Current Limitations
- No custom shortcut configuration yet
- Limited to built-in shortcuts
- Menu items provide full functionality access

## Integration Notes

### WASM Features
All formatting shortcuts (**Ctrl+B/I/U**) use:
- Rust WebAssembly for high performance
- PromiseGrid protocol message generation
- Real-time collaborative synchronization

### Browser Requirements
- Modern browsers (Chrome, Firefox, Safari, Edge)
- JavaScript enabled
- Clipboard API support for copy/paste
- WebAssembly support for formatting features

---

**Print this page**: Use **Ctrl+P** to print this reference guide for offline use.
