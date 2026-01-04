# Neovim Collaborative Editor Plugin

Real-time collaborative editing for Neovim, working with an Automerge-based server.

## Architecture

```
┌─────────────┐    stdin/stdout     ┌─────────────────┐    WebSocket     ┌──────────────────┐
│   Neovim    │ ◄─────────────────► │   Go Helper     │ ◄──────────────► │ Your Automerge   │
│ (Lua plugin)│   JSON messages     │   (adapter)     │   JSON-RPC       │  Collab-Editor   │
└─────────────┘                     └─────────────────┘                  └──────────────────┘
```

## Installation

### 1. Build the Go helper

```bash
cd nvim/go-helper
go build -o go-helper
```

### 2. Install the plugin

#### Using lazy.nvim

```lua
{
    dir = "/path/to/your/collab-editor/nvim",
    config = function()
        require('collab-editor').setup({
            server_url = 'ws://localhost:8080/ws',
            debug = false,
        })
    end,
}
```

#### Using packer.nvim

```lua
use {
    '/path/to/your/collab-editor/nvim',
    config = function()
        require('collab-editor').setup({
            server_url = 'ws://localhost:8080/ws',
        })
    end
}
```

#### Manual installation

Add the `nvim` directory to your runtimepath:

```vim
set runtimepath+=/path/to/collab-editor/nvim
```

Then in your `init.lua`:

```lua
require('collab-editor').setup({
    server_url = 'ws://localhost:8080/ws',
})
```

## Commands

| Command | Description |
|---------|-------------|
| `:CollabConnect [server] [room]` | Connect to server and join room |
| `:CollabDisconnect` | Disconnect from server |
| `:CollabJoin [room]` | Join a collaboration room |
| `:CollabLeave` | Leave current room |
| `:CollabOpen` | Open current buffer for collaboration |
| `:CollabClose` | Close current buffer from collaboration |
| `:CollabInfo` | Show connection status |

## Usage

1. Start your Automerge collab-editor server
2. In Neovim, connect to the server:
   ```
   :CollabConnect ws://localhost:8080/ws myroom
   ```
3. Open a file and enable collaboration:
   ```
   :CollabOpen
   ```
4. Other users can join the same room and edit together

## Configuration

```lua
require('collab-editor').setup({
    -- WebSocket server URL (required)
    server_url = 'ws://localhost:8080/ws',
    
    -- Path to go-helper binary (auto-detected if nil)
    go_helper_path = nil,
    
    -- Show remote user cursors
    show_remote_cursors = true,
    
    -- How often to send cursor updates (ms)
    cursor_update_interval = 100,
    
    -- Enable debug logging
    debug = false,
})
```

## Protocol

The plugin uses a Teamtype-style JSON-RPC protocol. Messages sent to the server:

### open
```json
{
    "method": "open",
    "params": {
        "uri": "file:///path/to/file.txt",
        "content": "file contents..."
    }
}
```

### close
```json
{
    "method": "close",
    "params": {
        "uri": "file:///path/to/file.txt"
    }
}
```

### edit
```json
{
    "method": "edit",
    "params": {
        "uri": "file:///path/to/file.txt",
        "revision": 5,
        "delta": [
            {
                "range": {
                    "start": {"line": 0, "character": 0},
                    "end": {"line": 0, "character": 5}
                },
                "replacement": "Hello"
            }
        ]
    }
}
```

### cursor
```json
{
    "method": "cursor",
    "params": {
        "uri": "file:///path/to/file.txt",
        "ranges": [
            {
                "start": {"line": 10, "character": 5},
                "end": {"line": 10, "character": 5}
            }
        ]
    }
}
```

Messages received from the server:

### edit (notification)
```json
{
    "method": "edit",
    "params": {
        "uri": "file:///path/to/file.txt",
        "revision": 3,
        "delta": [...]
    }
}
```

### cursor (notification)
```json
{
    "method": "cursor",
    "params": {
        "userid": "user123",
        "name": "Alice",
        "uri": "file:///path/to/file.txt",
        "ranges": [...]
    }
}
```

## Server Requirements

Your Automerge collab-editor server needs to:

1. Accept WebSocket connections with a `room` query parameter
2. Handle `open`, `close`, `edit`, and `cursor` messages
3. Broadcast `edit` and `cursor` notifications to other clients in the room
4. Implement revision-based conflict resolution (see Teamtype protocol)

## Troubleshooting

### "go-helper not found"

Build the Go helper:
```bash
cd nvim/go-helper
go build -o go-helper
```

### No remote cursors appearing

1. Check that `show_remote_cursors = true` in config
2. Verify the server is sending cursor updates
3. Check `:messages` for errors

### Edits not syncing

1. Ensure buffer is opened with `:CollabOpen`
2. Check `:CollabInfo` to verify connection
3. Enable debug mode: `debug = true` in config
4. Check server logs for errors

## Development

### Testing locally

1. Start your collab-editor server
2. Open two Neovim instances
3. In both, run:
   ```
   :CollabConnect ws://localhost:8080/ws testroom
   :e /tmp/test.txt
   :CollabOpen
   ```
4. Edits in one should appear in the other

### Debug logging

Enable debug mode to see all messages:

```lua
require('collab-editor').setup({
    server_url = 'ws://localhost:8080/ws',
    debug = true,
})
```

Check `:messages` for debug output.
