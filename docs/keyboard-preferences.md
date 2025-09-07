# Keyboard Shortcut Configuration

Complete guide to customizing keyboard shortcuts in the Collaborative Text Editor.

## Overview

The editor includes a comprehensive keyboard shortcut customization system that allows users to:
- View and edit any keyboard shortcut
- Prevent conflicting key assignments with helpful suggestions
- Save preferences locally for persistent customization
- Reset to industry-standard defaults at any time
- Import/export shortcut configurations

## Accessing Shortcut Configuration

**Open the preferences dialog:**
- **Menu Path**: Tools → Preferences
- **Keyboard Shortcut**: `Ctrl+Comma` (industry standard)
- **Console Command**: `window.preferencesDialog.show()`

## Configuration Interface

### Preferences Dialog Layout

The dialog organizes shortcuts by category:
- **File**: Document operations (New, Save, Print, Share)
- **Edit**: Text manipulation (Cut, Copy, Paste, Undo, Redo)
- **Format**: Text formatting (Bold, Italic, Headers, Lists)
- **Tools**: Utilities (Word Count, Statistics, Preferences)
- **View**: Interface control (Toggle panels, Preview)
- **Help**: Information and assistance
- **Search**: Document search operations
- **System**: Core interface functions

### Visual Design
- **Clean categorization** with color-coded section headers
- **Clickable shortcut keys** displayed in monospace font
- **Yellow highlighting** when editing a shortcut
- **Real-time conflict detection** with clear error messages
- **Success feedback** when shortcuts are updated

## Customizing Shortcuts

### How to Change a Shortcut

1. **Open Preferences**: Tools → Preferences or `Ctrl+Comma`
2. **Find the action** you want to modify in the categorized list
3. **Click the shortcut key** (e.g., click "Ctrl+B" next to "Bold")
4. **The key turns yellow** and shows "Press keys..."
5. **Press your desired key combination** (e.g., `Ctrl+Shift+B`)
6. **The shortcut updates** and shows success message

### Editing Controls
- **Click any shortcut** to enter edit mode
- **Press Escape** to cancel editing
- **Press the new key combination** to update
- **Automatic validation** prevents invalid combinations

### Key Combination Requirements
Valid shortcuts must include:
- **At least one modifier**: Ctrl, Alt, or Shift
- **A letter, number, or function key**
- **Exception**: Function keys (F1-F12) and Escape can be used alone

### Invalid Examples
These combinations are not allowed:
- Single letters without modifiers (`B`, `I`, `U`)
- Modifier keys alone (`Ctrl`, `Alt`, `Shift`)
- System reserved shortcuts (`Alt+Tab`, `Alt+F4`)

## Default Shortcuts

### File Operations
| Action | Default Shortcut | Description |
|--------|------------------|-------------|
| New Document | `Ctrl+N` | Create new document with fresh room |
| Open | `Ctrl+O` | Open document (planned feature) |
| Make a Copy | `Ctrl+Shift+S` | Duplicate document in new tab |
| Save as Text | `Ctrl+S` | Export as plain text |
| Save as JSON | `Ctrl+Shift+J` | Export CodeMirror state |
| Save as CBOR | `Ctrl+Shift+B` | Export in CBOR format |
| Save as PromiseGrid | `Ctrl+Shift+P` | Export PromiseGrid CBOR |
| Print | `Ctrl+P` | Browser print dialog |
| Share Document | `Ctrl+Shift+H` | Share with others |
| Email Document | `Ctrl+Shift+E` | Open email client |
| Copy Room URL | `Ctrl+Shift+U` | Copy collaboration URL |

### Edit Operations
| Action | Default Shortcut | Description |
|--------|------------------|-------------|
| Undo | `Ctrl+Z` | Reverse last action |
| Redo | `Ctrl+Y` | Restore undone action |
| Cut | `Ctrl+X` | Cut selected text |
| Copy | `Ctrl+C` | Copy selected text |
| Paste | `Ctrl+V` | Paste from clipboard |
| Select All | `Ctrl+A` | Select entire document |
| Find | `Ctrl+F` | Focus search box |
| Delete | `Delete` | Delete selected text |

### Format Operations
| Action | Default Shortcut | Description |
|--------|------------------|-------------|
| Bold | `Ctrl+B` | Toggle bold formatting |
| Italic | `Ctrl+I` | Toggle italic formatting |
| Underline | `Ctrl+U` | Toggle underline formatting |
| Strikethrough | `Ctrl+Shift+X` | Toggle strikethrough |
| Heading 1 | `Ctrl+Alt+1` | Toggle H1 formatting |
| Heading 2 | `Ctrl+Alt+2` | Toggle H2 formatting |
| Heading 3 | `Ctrl+Alt+3` | Toggle H3 formatting |
| Bullet List | `Ctrl+Shift+8` | Toggle bullet list |
| Numbered List | `Ctrl+Shift+7` | Toggle numbered list |
| Insert Link | `Ctrl+K` | Convert URLs to links |
| Format Document | `Ctrl+Shift+F` | Clean document formatting |

### Tools and Interface
| Action | Default Shortcut | Description |
|--------|------------------|-------------|
| Word Count | `Ctrl+Shift+C` | Show document statistics |
| Toggle Line Numbers | `Ctrl+Shift+L` | Show/hide line numbers |
| Preferences | `Ctrl+Comma` | Open this preferences dialog |
| Toggle Activity Log | `Ctrl+Alt+L` | Show/hide user activity |
| Toggle Toolbar | `Ctrl+Shift+T` | Show/hide formatting toolbar |
| Toggle Markdown Preview | `Ctrl+M` | Show/hide preview pane |
| Update Preview | `Ctrl+R` | Refresh markdown preview |
| About | `F1` | Show about information |
| Close Menus | `Escape` | Close any open menu |

## Conflict Detection

### How Conflicts Work
When you try to assign a shortcut that's already in use:
1. **Immediate feedback** shows which feature currently uses that shortcut
2. **Assignment is prevented** to avoid conflicts
3. **Suggestion system** offers alternative key combinations

### Conflict Resolution
**Example conflict scenario:**
- You try to assign `Ctrl+B` to "Italic"
- System shows: `"Ctrl+B" is already used by "Bold"`
- **Options**:
  - Try a different combination like `Ctrl+Alt+B`
  - First change Bold to something else, then assign `Ctrl+B` to Italic

### Suggested Alternatives
When conflicts occur, the system suggests:
- `Ctrl+Alt+[Key]` variations
- `Ctrl+Shift+[Key]` alternatives  
- `Ctrl+Alt+Shift+[Key]` for rarely used functions

## Storage and Persistence

### Local Storage
- **Customizations saved** automatically in browser localStorage
- **Persistent across sessions** - your shortcuts remain after closing browser
- **Per-browser settings** - each browser maintains separate shortcuts
- **Room-independent** - shortcuts work across all collaboration rooms

### Data Format
Shortcuts are stored as:
```json
{
  "bold": "Ctrl+B",
  "italic": "Ctrl+I",
  "new": "Ctrl+N"
}
```

### Reset to Defaults
Click **"Reset to Defaults"** to:
- Restore all original shortcuts
- Clear all customizations from localStorage
- Return to industry-standard key combinations
- **Cannot be undone** - make sure you want to reset

## Advanced Features

### Console Testing
Test shortcuts programmatically:
```javascript
// Get current shortcut for an action
window.shortcutManager.getShortcut('bold')

// Get action for a key combination
window.shortcutManager.getAction('Ctrl+B')

// List all shortcuts by category
window.shortcutManager.getShortcutsByCategory()
```

### Integration with Editor
Shortcuts work seamlessly with:
- **Menu system** - All menu actions respect custom shortcuts
- **CodeMirror editor** - Core editing shortcuts integrate properly
- **Toolbar buttons** - Buttons show current shortcuts in tooltips
- **Real-time collaboration** - Shortcuts work independently for each user

## Platform Differences

### Windows/Linux
- Use **Ctrl** as the primary modifier key
- All shortcuts displayed with `Ctrl+` notation
- Standard PC keyboard layout

### macOS  
- System automatically maps **Ctrl** to **Cmd** (⌘)
- Shortcuts display as `Ctrl+` but function with Cmd key
- Native macOS keyboard behavior maintained

### Browser Compatibility
**Supported browsers:**
- **Chrome/Chromium**: Full support for all shortcuts
- **Firefox**: Complete functionality 
- **Safari**: Works with standard shortcuts
- **Edge**: Full compatibility with Windows shortcuts

**Known limitations:**
- Some browsers reserve certain key combinations
- `Ctrl+Shift+C` may conflict with developer tools
- System shortcuts always take precedence

## Troubleshooting

### Shortcuts Not Working
**Check these common issues:**
1. **Editor focus** - Click in document area before using shortcuts
2. **Input field focus** - Shortcuts don't work in name/search inputs
3. **Menu open** - Close any open dropdown menus
4. **Browser override** - Some shortcuts may be reserved by browser

### Customization Problems
**If changes don't save:**
1. **Check browser storage** - Ensure localStorage is enabled
2. **Try incognito mode** - Test without extensions
3. **Clear browser cache** - Refresh the page completely
4. **Reset to defaults** - Clear corrupted settings

### Performance Issues
**If shortcut detection is slow:**
1. **Check browser console** - Look for JavaScript errors
2. **Disable extensions** - Some extensions interfere with key events
3. **Refresh the page** - Reload the editor completely

## Best Practices

### Choosing Shortcuts
**Effective shortcut design:**
- **Use familiar patterns** - `Ctrl+C` for Copy, `Ctrl+V` for Paste
- **Group related functions** - `Ctrl+1/2/3` for headings
- **Avoid conflicts** - Don't use system-reserved combinations
- **Consider frequency** - Assign easy shortcuts to common actions

### Organization Tips
- **Keep formatting together** - Use `Ctrl+` combinations for text formatting
- **Use Alt combinations** - For view and interface functions
- **Save Shift combinations** - For variations of existing shortcuts
- **Function keys** - Reserve for help and special functions

### Workflow Integration
- **Learn gradually** - Master a few shortcuts before adding more
- **Use tooltips** - Hover over toolbar buttons to see current shortcuts
- **Print reference** - Use browser print on this page for offline reference
- **Share with team** - Coordinate shortcuts for collaborative editing

## Example Workflows

### Writer-Focused Setup
```
Ctrl+B/I/U     → Bold/Italic/Underline
Ctrl+1/2/3     → Headings
Ctrl+L         → Lists  
Ctrl+Shift+W   → Word Count
F1             → Help
```

### Developer-Focused Setup
```
Ctrl+/         → Format Document
Ctrl+D         → Document Stats
Ctrl+T         → Toggle Line Numbers
Ctrl+M         → Markdown Preview
Ctrl+E         → Export
```

### Collaboration-Focused Setup
```
Ctrl+U         → Copy URL
Ctrl+Shift+S   → Share Document
Ctrl+Alt+A     → Activity Log
Ctrl+L         → User List
Ctrl+N         → New Room
```

## Technical Implementation

### Architecture
- **ShortcutManager class** - Central registry for all shortcuts
- **PreferencesDialog component** - User interface for customization  
- **MenuSystem integration** - Dynamic shortcut handling
- **localStorage persistence** - Automatic saving and loading

### Key Detection
- **Event parsing** - Converts keyboard events to shortcut strings
- **Modifier detection** - Handles Ctrl, Alt, Shift combinations
- **Cross-platform mapping** - Works on Windows, Mac, and Linux
- **Conflict prevention** - Real-time validation during assignment

### Performance Optimizations
- **Efficient lookups** - HashMap-based shortcut resolution
- **Minimal overhead** - Lightweight event handling
- **Memory management** - No memory leaks from event listeners
- **Fast rendering** - Optimized UI updates during editing

## Future Enhancements

### Planned Features
- **Global shortcut profiles** - Predefined sets for different workflows
- **Import/export configurations** - Share shortcuts between browsers
- **Advanced conflict resolution** - Automatic suggestions for conflicts
- **Shortcut analytics** - Track most-used shortcuts for optimization

### Integration Opportunities
- **Team synchronization** - Share shortcuts across collaboration rooms
- **Cloud storage** - Sync shortcuts across devices
- **Plugin system** - Allow extensions to register shortcuts
- **Voice commands** - Alternative to keyboard shortcuts

## Support

**For technical issues:**
- Check browser console for error messages
- Verify localStorage is enabled and functional
- Test in incognito mode to isolate extension conflicts
- Reset to defaults if shortcuts become corrupted

**For feature requests:**
- Submit suggestions for new shortcut categories
- Request specific key combinations for common workflows
- Propose integration with other productivity tools

---

**Last Updated**: Current Version  
**Total Shortcuts**: 51 configurable shortcuts across 8 categories  
**Browser Support**: Chrome, Firefox, Safari, Edge  
**Platform Support**: Windows, macOS, Linux
