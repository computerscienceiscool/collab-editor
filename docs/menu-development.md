# Menu Development Guide

Developer guide for extending and maintaining the Google Docs-style menu system in the Collaborative Text Editor.

## Architecture Overview

The menu system is implemented as a modular JavaScript class (`MenuSystem`) embedded in `index.html` with the following components:

### Core Components
- **HTML Structure**: Menu bar with dropdown menus
- **MenuSystem Class**: Handles menu interactions and actions
- **Action Handlers**: Methods that execute menu item functionality
- **Integration Layer**: Connects to WASM, CodeMirror, and Automerge

### File Locations
- **Menu HTML**: `index.html` (menu bar and dropdown structures)
- **Menu JavaScript**: `index.html` (embedded MenuSystem class in `<script>` tag)
- **WASM Integration**: `src/export/handlers.js` (formatting operations)
- **Editor Integration**: `src/app.js` (makes editor globally accessible)

## Adding New Menu Items

### Step 1: Add HTML Menu Item

**Location**: `index.html` - Find the appropriate menu section

**Example**: Adding "Insert Image" to Format menu:

```html
<!-- Format Menu -->
<div class="dropdown-menu" id="format-menu">
  <!-- Existing items... -->
  <div class="menu-section">
    <div class="dropdown-item" data-action="insert-image">Insert Image</div>
  </div>
</div>
```

**Menu Structure Guidelines**:
- Use `data-action` attribute with kebab-case naming
- Group related items in `<div class="menu-section">` containers
- Add `<span class="keyboard-shortcut">Ctrl+Key</span>` for shortcuts
- Use semantic action names that describe the functionality

### Step 2: Add Action Handler

**Location**: `index.html` - In the `handleAction` method of MenuSystem class

```javascript
handleAction(action) {
  switch (action) {
    // Existing cases...
    case 'insert-image':
      this.insertImage();
      break;
    
    default:
      console.log('Unknown action:', action);
  }
}
```

### Step 3: Implement the Method

**Location**: `index.html` - Add method to MenuSystem class before the closing `}`

```javascript
// Add this method before the closing } of MenuSystem class
insertImage() {
  const imageUrl = prompt('Enter image URL:');
  if (imageUrl) {
    const view = this.getEditorView();
    if (view) {
      const selection = view.state.selection.main;
      const imageMarkdown = `![Image](${imageUrl})`;
      view.dispatch({
        changes: {
          from: selection.from,
          to: selection.to,
          insert: imageMarkdown
        }
      });
      console.log('Image inserted:', imageUrl);
    }
  }
}
```

### Step 4: Add Keyboard Shortcut (Optional)

**Location**: `index.html` - In the `setupKeyboardShortcuts` method

```javascript
setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        // Existing cases...
        case 'k':
          if (e.shiftKey) { // Ctrl+Shift+K
            e.preventDefault();
            this.insertImage();
          }
          break;
      }
    }
  });
}
```

## Integration Patterns

### CodeMirror Editor Integration

**Get Editor Reference**:
```javascript
getEditorView() {
  return window.editorView || document.querySelector('#editor')?._editorView;
}
```

**Text Manipulation**:
```javascript
// Insert text
view.dispatch({
  changes: {
    from: selection.from,
    to: selection.to,
    insert: 'new text'
  }
});

// Get selected text
const selectedText = view.state.doc.sliceString(selection.from, selection.to);

// Select all text
view.dispatch({
  selection: { anchor: 0, head: view.state.doc.length }
});
```

### WASM Function Integration

**Location**: Connect to existing WASM functions in `src/export/handlers.js`

```javascript
// Example: Integrating with WASM formatting
async handleWasmFormatting(view, wasmFunction, formatName) {
  try {
    const selection = view.state.selection.main;
    const selectedText = view.state.doc.sliceString(selection.from, selection.to);
    
    // Call WASM function
    const formattedText = await wasmFunction(selectedText);
    
    // Update editor
    view.dispatch({
      changes: {
        from: selection.from,
        to: selection.to,
        insert: formattedText
      }
    });
    
    // Generate PromiseGrid message
    sendEditAsPromiseGridMessage(formatName, selection.from, formattedText, view);
    
  } catch (error) {
    console.error(`WASM ${formatName} failed:`, error);
    alert(`${formatName} operation failed: ${error.message}`);
  }
}
```

### Browser API Integration

**Clipboard Operations**:
```javascript
// Copy to clipboard
async copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    console.log('Copied to clipboard');
  } catch (err) {
    console.error('Clipboard copy failed:', err);
    alert('Copy failed. Browser may not support clipboard access.');
  }
}

// Paste from clipboard
async pasteFromClipboard() {
  try {
    const text = await navigator.clipboard.readText();
    return text;
  } catch (err) {
    console.error('Clipboard read failed:', err);
    return null;
  }
}
```

**File Operations**:
```javascript
// File download
downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// File upload
async uploadFile() {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.txt,.md,.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsText(file);
      }
    };
    input.click();
  });
}
```

## Error Handling Patterns

### User Feedback
```javascript
// Success feedback
showSuccess(message) {
  console.log(message);
  // Optional: Show toast notification
}

// Error feedback
showError(error, operation) {
  console.error(`${operation} failed:`, error);
  alert(`${operation} failed: ${error.message}`);
}

// Warning feedback
showWarning(message) {
  return confirm(`${message}\n\nDo you want to continue?`);
}
```

### Graceful Degradation
```javascript
// Check for feature support
if (!navigator.clipboard) {
  alert('Clipboard operations not supported in this browser');
  return;
}

// Fallback for missing APIs
if (!window.editorView) {
  console.error('Editor not available');
  alert('Editor not ready. Please try again.');
  return;
}
```

## Menu Categories and Guidelines

### File Menu
**Purpose**: Document lifecycle operations
- **Include**: New, open, save, export, share, print
- **Pattern**: Operations that affect the entire document
- **Integration**: Often involves browser APIs or backend calls

### Edit Menu  
**Purpose**: Text manipulation operations
- **Include**: Undo, redo, cut, copy, paste, find, select
- **Pattern**: Operations on selected text or cursor position
- **Integration**: Primarily CodeMirror operations

### Format Menu
**Purpose**: Text appearance and structure
- **Include**: Bold, italic, headers, lists, links
- **Pattern**: Operations that change text formatting
- **Integration**: WASM functions for performance

### Tools Menu
**Purpose**: Document analysis and editor utilities  
- **Include**: Word count, statistics, preferences, settings
- **Pattern**: Operations that analyze or configure the editor
- **Integration**: Mix of calculation, storage, and display

### View Menu
**Purpose**: Interface and display options
- **Include**: Show/hide panels, zoom, themes, layout
- **Pattern**: Operations that change what user sees
- **Integration**: DOM manipulation and CSS changes

### Help Menu
**Purpose**: User assistance and information
- **Include**: Documentation, shortcuts, about, tutorials
- **Pattern**: Operations that provide information
- **Integration**: Display dialogs or open links

## Testing New Menu Features

### Manual Testing Checklist
1. **Menu item appears** in correct location
2. **Click triggers** correct action
3. **Keyboard shortcut** works (if implemented)
4. **Error handling** works for edge cases
5. **Integration works** with existing features
6. **User feedback** is clear and helpful

### Browser Testing
- **Chrome/Chromium**: Primary development target
- **Firefox**: Second priority
- **Safari**: Test on macOS
- **Edge**: Test keyboard shortcuts (Ctrl vs Cmd)

### Collaboration Testing
- **Multiple users**: Test with 2+ browser tabs
- **Real-time sync**: Verify operations sync correctly
- **Conflict handling**: Test simultaneous operations

## Common Patterns and Utilities

### Document Title Integration
```javascript
getDocumentTitle() {
  const titleInput = document.getElementById('document-title');
  return titleInput ? titleInput.value.trim() || 'Untitled Document' : 'Untitled Document';
}

getCleanFilename(extension) {
  return this.getDocumentTitle()
    .replace(/[^a-zA-Z0-9\s\-_]/g, '')
    .replace(/\s+/g, '_')
    .toLowerCase() + '.' + extension;
}
```

### Session Information
```javascript
getSessionInfo() {
  return {
    roomName: document.getElementById('room-name')?.textContent || 'unknown',
    userName: document.getElementById('name-input')?.value || 'Anonymous',
    userCount: document.getElementById('user-count')?.textContent || '0'
  };
}
```

### Storage Operations
```javascript
// Save preference
savePreference(key, value) {
  localStorage.setItem(`collab-editor-${key}`, JSON.stringify(value));
}

// Load preference
loadPreference(key, defaultValue) {
  const saved = localStorage.getItem(`collab-editor-${key}`);
  return saved ? JSON.parse(saved) : defaultValue;
}
```

## Performance Considerations

### WASM Integration
- **Always use async/await** for WASM functions
- **Handle errors gracefully** with try/catch
- **Provide user feedback** for long operations
- **Consider text size limits** for performance

### DOM Operations
- **Batch DOM updates** when possible
- **Use document fragments** for multiple insertions
- **Cache DOM queries** in variables
- **Avoid layout thrashing** with careful CSS changes

### Memory Management
- **Clean up event listeners** when removing features
- **Avoid memory leaks** with proper cleanup
- **Use weak references** for large objects
- **Monitor console** for warnings

## Debugging Tips

### Console Logging
```javascript
// Debug menu actions
console.log('Menu action triggered:', action);
console.log('Editor state:', view.state);
console.log('Selection:', view.state.selection.main);
```

### Error Tracking
```javascript
// Wrap operations in try/catch
try {
  // Menu operation
} catch (error) {
  console.error('Menu operation failed:', {
    action: action,
    error: error.message,
    stack: error.stack
  });
}
```

### Development Mode
```javascript
// Add debug flag
const DEBUG = true;

if (DEBUG) {
  console.log('Debug info:', data);
}
```

## Contributing Guidelines

### Code Style
- **Use consistent naming**: camelCase for methods, kebab-case for actions
- **Add JSDoc comments** for public methods
- **Follow existing patterns** in the codebase
- **Test thoroughly** before submitting

### Documentation
- **Update menu documentation** when adding features
- **Add keyboard shortcuts** to reference guide
- **Update user guide** with new functionality
- **Include examples** in commit messages

### Review Process
1. **Test in multiple browsers**
2. **Verify keyboard shortcuts work**
3. **Check error handling**
4. **Ensure accessibility**
5. **Update relevant documentation**

---

This guide covers the essential patterns for extending the menu system. For specific implementation questions, refer to the existing code examples in `index.html` and `src/export/handlers.js`.
