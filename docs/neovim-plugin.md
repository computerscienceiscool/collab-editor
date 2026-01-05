# Neovim Collaborative Editor Plugin

A Neovim plugin that enables real-time collaborative editing with the web-based collaborative editor. Multiple users can edit the same document simultaneously from Neovim or a web browser.

## Status

**Current Version:** 0.1.0 (Development)

| Feature | Status |
|---------|--------|
| Connect to collaboration server | Working |
| Create new documents | Working |
| Open existing documents | Working |
| Real-time text sync (Neovim to Browser) | Working |
| Real-time text sync (Browser to Neovim) | Working |
| User presence (shows connected users) | Working |
| Remote cursor display | Planned |
| Typing indicators | Planned |
| Offline support with auto-reconnect | Planned |

## Quick Start

### Prerequisites

- Neovim 0.9 or later
- Node.js 18 or later
- Collaboration servers running (sync server on port 1234, awareness server on port 1235)

### Starting the Servers

From the project root directory:

```bash
# Terminal 1: Start the sync server
make ws

# Terminal 2: Start the awareness server
make awareness

# Terminal 3 (optional): Start the web frontend
make serve
```

### Loading the Plugin

In Neovim, add the plugin to your runtime path:

```vim
:set runtimepath+=~/lab/collab-editor/nvim
:lua require('collab-editor').setup()
```

Or add to your `~/.config/nvim/init.lua` for permanent installation:

```lua
vim.opt.runtimepath:append('~/lab/collab-editor/nvim')
require('collab-editor').setup()
```

### Basic Usage

```vim
" Connect to the collaboration server
:CollabConnect

" Create a new document (returns document ID)
:CollabCreate

" Open an existing document by ID
:CollabOpen 4R9KDGBoZKPjhb15iErZd9nmhPRH

" Show connection status
:CollabInfo

" Close the current document
:CollabClose

" Disconnect from the server
:CollabDisconnect
```

### Collaborating with Browser Users

1. Run `:CollabConnect` and `:CollabCreate` in Neovim
2. Note the document ID shown (e.g., `4R9KDGBoZKPjhb15iErZd9nmhPRH`)
3. Share the URL with collaborators: `http://localhost:8080/?doc=<document-id>`
4. Both Neovim and browser users can now edit the same document in real-time

## Available Commands

| Command | Description |
|---------|-------------|
| `:CollabConnect` | Connect to the collaboration server |
| `:CollabDisconnect` | Disconnect from the server |
| `:CollabCreate` | Create a new collaborative document |
| `:CollabOpen <id>` | Open an existing document by ID |
| `:CollabClose` | Close the current collaborative document |
| `:CollabInfo` | Display connection status and document info |

## Configuration

The plugin can be configured by passing options to the setup function:

```lua
require('collab-editor').setup({
  -- WebSocket URL for document sync (Automerge)
  sync_url = 'ws://localhost:1234',
  
  -- WebSocket URL for user presence/awareness
  awareness_url = 'ws://localhost:1235',
  
  -- Path to Node.js helper (auto-detected by default)
  node_helper_path = nil,
  
  -- Enable debug logging
  debug = false,
})
```

### Remote Server Configuration

To connect to a remote collaboration server:

```lua
require('collab-editor').setup({
  sync_url = 'ws://your-server.com:1234',
  awareness_url = 'ws://your-server.com:1235',
})
```

## Architecture

```
┌─────────────────┐     JSON/stdin-stdout    ┌─────────────────┐
│                 │◄────────────────────────►│                 │
│  Neovim (Lua)   │                          │  Node.js Helper │
│                 │                          │                 │
└─────────────────┘                          └────────┬────────┘
                                                      │
                                             Automerge Protocol
                                                      │
                              ┌───────────────────────┼───────────────────────┐
                              ▼                       ▼                       ▼
                       ┌─────────────┐         ┌─────────────┐         ┌─────────────┐
                       │ Sync Server │         │  Awareness  │         │   Browser   │
                       │  Port 1234  │         │  Port 1235  │         │   Client    │
                       └─────────────┘         └─────────────┘         └─────────────┘
```

### Technology Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| Plugin Core | Lua | Neovim integration, buffer management |
| Helper Process | Node.js | Automerge protocol handling |
| Sync Protocol | Automerge CRDT | Conflict-free document synchronization |
| Transport | WebSocket | Real-time communication |
| Local Storage | File system | Document persistence between sessions |

### Why Node.js Helper?

The plugin uses a Node.js helper process instead of implementing the Automerge protocol directly in Lua because:

1. **Protocol Compatibility**: Uses the exact same `@automerge/automerge-repo` library as the web client, guaranteeing protocol compatibility
2. **Maintenance**: Protocol updates only need to happen in one place
3. **Complexity**: Automerge uses a binary CBOR protocol that would be difficult to implement in pure Lua

## File Structure

```
nvim/
├── lua/collab-editor/
│   ├── init.lua          # Main plugin code
│   ├── buffer.lua        # Buffer management (future)
│   └── cursors.lua       # Remote cursor display (future)
├── node-helper/
│   ├── package.json      # Node.js dependencies
│   └── index.js          # Automerge bridge
├── plugin/
│   └── collab-editor.vim # Vim plugin loader
└── README.md
```

## Troubleshooting

### "Node helper not found"

Ensure the Node.js helper dependencies are installed:

```bash
cd ~/lab/collab-editor/nvim/node-helper
npm install
```

### "Not connected" errors

1. Check that servers are running:
   ```bash
   lsof -i :1234  # Sync server
   lsof -i :1235  # Awareness server
   ```

2. Start servers if needed:
   ```bash
   make ws        # Terminal 1
   make awareness # Terminal 2
   ```

### Document not syncing

1. Verify both users have the same document ID
2. Check `:CollabInfo` shows `Connected: true`
3. Ensure the document ID in the browser URL matches

### Debug Mode

Enable debug logging to see detailed information:

```lua
require('collab-editor').setup({
  debug = true,
})
```

## Future Features

The following features are planned for future releases:

- **Remote Cursor Display**: Show where other users are editing in the buffer
- **Typing Indicators**: Visual feedback when others are typing
- **User Colors**: Assign colors to users for visual distinction
- **Offline Support**: Queue changes when disconnected, sync when reconnected
- **Document History**: View and restore previous versions
- **Multiple Documents**: Edit multiple collaborative documents simultaneously

## Development Information

The plugin source is located in `~/lab/collab-editor/nvim/`. Key files:

- `lua/collab-editor/init.lua` - Main plugin logic
- `node-helper/index.js` - Automerge protocol bridge

To test changes:

1. Make edits to the source files
2. Restart Neovim or reload the plugin: `:lua package.loaded['collab-editor'] = nil`
3. Re-setup: `:lua require('collab-editor').setup()`

## Related Documentation

- [Architecture Overview](architecture.md) - System architecture details
- [User Guide](user-guide.md) - Web editor documentation
