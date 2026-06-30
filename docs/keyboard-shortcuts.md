
# Keyboard Shortcuts Reference

Complete keyboard shortcut guide for the Collaborative Text Editor.

## Keyboard Shortcut Availability

**IMPORTANT**: By default, only basic editing shortcuts are enabled:
- **Enabled by default**: Copy (Ctrl+C), Cut (Ctrl+X), and Paste (Ctrl+V)
- **Disabled by default**: All other shortcuts for formatting, navigation, etc.

To enable additional shortcuts:
1. Access **Help → Keyboard Shortcuts** menu item
2. Use the toggle switches to enable the shortcuts you want to use
3. Changes are saved automatically to your browser's local storage

## Customization

**NEW**: All keyboard shortcuts can now be customized! Access **Tools → Preferences** or press **Ctrl+Comma** to open the keyboard shortcut configuration dialog. You can change any of the 51 shortcuts listed below with full conflict detection and validation.

See [docs/keyboard-preferences.md](docs/keyboard-preferences.md) for complete customization instructions.

## File Operations

| Shortcut | Action | Description | Enabled by Default |
|----------|--------|-------------|--------------------|
| **Ctrl+N** | New Document | Creates a new document with fresh document ID | No |
| **Ctrl+P** | Print | Opens browser print dialog | No |
| **Ctrl+Shift+S** | Make a Copy | Opens document copy in new tab | No |
| **Ctrl+Shift+E** | Email Document | Opens email client with document and collaboration link | No |
| **Ctrl+Shift+U** | Copy Document URL | Copies collaboration URL to clipboard | No |

## Text Editing

| Shortcut | Action | Description | Enabled by Default |
|----------|--------|-------------|--------------------|
| **Ctrl+Z** | Undo | Reverse last action | No |
| **Ctrl+Y** | Redo | Restore undone action | No |
| **Ctrl+C** | Copy | Copy selected text to clipboard | Yes |
| **Ctrl+X** | Cut | Cut selected text to clipboard | Yes |
| **Ctrl+V** | Paste | Paste from clipboard | Yes |
| **Ctrl+A** | Select All | Select entire document | No |

## Text Formatting

| Shortcut | Action | Description | Enabled by Default |
|----------|--------|-------------|--------------------|
| **Ctrl+B** | Bold | Toggle bold formatting on selected text | No |
| **Ctrl+I** | Italic | Toggle italic formatting on selected text | No |
| **Ctrl+U** | Underline | Toggle underline formatting on selected text | No |
| **Ctrl+Shift+X** | Strikethrough | Toggle strikethrough formatting on selected text | No |
| **Ctrl+K** | Insert Link | Convert URLs to markdown link format | No |
| **Ctrl+Alt+1** | Heading 1 | Toggle H1 markdown formatting | No |
| **Ctrl+Alt+2** | Heading 2 | Toggle H2 markdown formatting | No |
| **Ctrl+Alt+3** | Heading 3 | Toggle H3 markdown formatting | No |
| **Ctrl+Shift+7** | Numbered List | Toggle numbered list formatting | No |
| **Ctrl+Shift+8** | Bullet List | Toggle bullet list formatting | No |

## Document Tools

| Shortcut | Action | Description | Enabled by Default |
|----------|--------|-------------|--------------------|
| **Ctrl+F** | Find | Focus search box for document search | No |
| **Ctrl+Shift+C** | Word Count | Show detailed document statistics | No |
| **Ctrl+Shift+L** | Toggle Line Numbers | Show/hide line numbers in editor | No |
| **Ctrl+Comma** | Preferences | Open keyboard shortcut customization dialog | No |

## Navigation and Interface

| Shortcut | Action | Description | Enabled by Default |
|----------|--------|-------------|--------------------|
| **Ctrl+M** | Toggle Markdown Preview | Show/hide side-by-side markdown preview | No |
| **Ctrl+R** | Update Preview | Refresh markdown preview with current text | No |
| **Ctrl+Alt+A** | Toggle Activity Log | Show/hide user activity sidebar | No |
| **Ctrl+Alt+Y** | Toggle Toolbar | Show/hide formatting toolbar | No |
| **Esc** | Close Menus | Close any open dropdown menu | No |

## Quick Reference Card

### Most Used Shortcuts
```
Ctrl+C/X/V    Copy/Cut/Paste (Enabled by default)
Ctrl+Z/Y      Undo/Redo (Need to enable)
Ctrl+B/I/U    Bold/Italic/Underline (Need to enable)
Ctrl+F        Find (Need to enable)
Ctrl+P        Print (Need to enable)
Ctrl+N        New Document (Need to enable)
Ctrl+Comma    Preferences (Need to enable)
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
Ctrl+Shift+U  Copy Document URL
Ctrl+Shift+E  Email Document
Ctrl+Alt+1/2/3 Headings
Ctrl+Shift+7/8 Lists
Ctrl+Alt+A    Activity Log
Ctrl+Alt+Y  Toggle Toolbar
```

## Enabling Keyboard Shortcuts

### Enable Shortcuts Through the Menu
1. Open the **Help menu**
2. Select **Keyboard Shortcuts**
3. The Keyboard Shortcuts panel will open
4. Toggle switches to enable/disable specific shortcuts
5. Changes save automatically

### Benefits of Enabling Shortcuts
- **Faster editing**: Format text without using the mouse
- **Improved productivity**: Quick access to common operations
- **Professional workflow**: Use industry-standard commands

### Recommended Shortcuts to Enable
If you're new to keyboard shortcuts, consider enabling these first:
- **Undo/Redo** (Ctrl+Z, Ctrl+Y) for error recovery
- **Bold/Italic/Underline** (Ctrl+B, Ctrl+I, Ctrl+U) for basic formatting
- **Find** (Ctrl+F) for searching within documents
- **Select All** (Ctrl+A) for quick document selection
- **Toggle Markdown Preview** (Ctrl+M) to see formatting results

## Shortcut Customization

### Quick Setup
1. **Open Preferences**: Press **Ctrl+Comma** or go to Tools → Preferences
2. **Click any shortcut** in the dialog to edit it
3. **Press your desired keys** (e.g., Ctrl+Shift+B for Bold)
4. **Automatic saving** - changes are saved immediately

### Customization Features
- **51 customizable shortcuts** across 8 categories
- **Conflict detection** - prevents duplicate assignments
- **Industry standards** - defaults follow common conventions
- **Persistent storage** - settings saved locally in browser
- **Reset option** - restore defaults anytime

### Tips for Custom Shortcuts
- **Use modifiers**: Combine Ctrl, Alt, and Shift for unique combinations
- **Avoid conflicts**: System will warn you of existing assignments
- **Group by function**: Keep related shortcuts together (Ctrl+1/2/3 for headings)
- **Test thoroughly**: Make sure new shortcuts feel natural to use

## Platform Notes

### Windows/Linux
All shortcuts use the **Ctrl** key as shown above.

### macOS
Replace **Ctrl** with **Cmd** (⌘) for all shortcuts:
- **Cmd+C** for Copy
- **Cmd+B** for Bold
- **Cmd+N** for New Document
- **Cmd+Comma** for Preferences
- etc.

## Accessibility Notes

### Screen Reader Support
- All buttons and menus have ARIA labels for screen reader compatibility
- Tab navigation works throughout the interface
- Menu items announce their keyboard shortcuts
- Roles and states are properly announced

### Focus Management
- Modal dialogs (GitHub settings, Preferences) use focus traps
- Tab cycles within the dialog when open, preventing focus from escaping
- Escape key closes dialogs and returns focus to the previous element

### High Contrast
- Use browser settings for high contrast mode
- All keyboard shortcuts work regardless of theme

### Motor Accessibility
- All functionality available via keyboard
- No mouse-only operations
- Sticky keys compatible
- **Customizable shortcuts** allow adaptation for different needs

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
- Tools: Ctrl+Shift+C for word count, Ctrl+Comma for preferences

## Tips for Efficiency

### Power User Workflow
1. First, **enable key shortcuts** in Help → Keyboard Shortcuts
2. Then follow this efficient workflow:
   - **Ctrl+N** - Start new document
   - Type content using **Ctrl+B/I/U** for formatting
   - **Ctrl+F** to search when needed
   - **Ctrl+Shift+C** to check word count
   - **Ctrl+Comma** to customize shortcuts as needed
   - **Ctrl+P** to print when finished

### Collaboration Tips
- Share document URL for others to join
- Use **Ctrl+F** to quickly find text others mention
- **Ctrl+Z/Y** works with collaborative changes
- Your formatting shortcuts work in real-time for all users
- **Custom shortcuts are personal** - each user can have different preferences

### Search Efficiency
1. **Ctrl+F** to focus search
2. Type search term
3. **Enter** to find matches
4. **Esc** to clear search and return to editing

## Troubleshooting

### Shortcuts Not Working
**Check these common issues:**
1. **Not enabled**: Verify shortcut is enabled in Help → Keyboard Shortcuts
2. **Editor focus** - Click in document area before using shortcuts
3. **Input field focus** - Shortcuts don't work in name/search inputs
4. **Menu open** - Close any open dropdown menus
5. **Browser override** - Some shortcuts may be reserved by browser
6. **Custom settings** - Check if shortcuts were modified in Preferences

### Customization Problems
**If changes don't save:**
1. **Check browser storage** - Ensure localStorage is enabled
2. **Try incognito mode** - Test without extensions
3. **Clear browser cache** - Refresh the page completely
4. **Reset to defaults** - Use button in Preferences dialog

### Browser Conflicts
- Some browsers override certain shortcuts
- **Ctrl+Shift+C** might open developer tools in some browsers
- Use menu items as fallback if shortcuts are blocked
- **Customize conflicting shortcuts** using Preferences dialog

### Collaboration Issues
- Shortcuts work independently for each user
- Your Ctrl+B won't affect other users' cursor positions
- All users see formatting changes in real-time
- **Each user can have different shortcuts** - customization is local

## Custom Shortcuts

### Future Features
Planned enhancements may include:
- **Ctrl+H** for Find and Replace
- **Ctrl+Shift+Y** for Dictionary lookup
- **Import/Export** shortcut configurations
- **Team shortcut sharing** for collaborative workflows

### Current Capabilities
- **51 shortcuts** can be customized
- **8 categories**: File, Edit, Format, Tools, View, Help, Search, System
- **Conflict detection** prevents duplicate assignments
- **Industry standards** as sensible defaults
- **Instant updates** - no restart required

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
- **localStorage support** for shortcut customization

---

**Enable Your Shortcuts**: Visit **Help → Keyboard Shortcuts** to enable the shortcuts you want to use!

**Customize Your Shortcuts**: Press **Ctrl+Comma** to open the preferences dialog and make this editor truly yours!

**Print this page**: Use **Ctrl+P** to print this reference guide for offline use.
