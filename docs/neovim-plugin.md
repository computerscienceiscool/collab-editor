# Neovim Plugin - Moved to Vimbeam

The Neovim collaborative editing plugin has been moved to its own repository:

**[github.com/computerscienceiscool/vimbeam](https://github.com/computerscienceiscool/vimbeam)**

## Installation

Install Vimbeam using your preferred plugin manager:

### vim-plug
```vim
Plug 'computerscienceiscool/vimbeam', { 'do': 'cd node-helper && npm install' }
```

### lazy.nvim
```lua
{
  'computerscienceiscool/vimbeam',
  build = 'cd node-helper && npm install',
  config = function()
    require('vimbeam').setup({
      sync_url = 'ws://localhost:1234',
      awareness_url = 'ws://localhost:1235',
    })
  end,
}
```

### packer.nvim
```lua
use {
  'computerscienceiscool/vimbeam',
  run = 'cd node-helper && npm install',
  config = function()
    require('vimbeam').setup({
      sync_url = 'ws://localhost:1234',
      awareness_url = 'ws://localhost:1235',
    })
  end,
}
```

## Quick Start

1. Start the collaboration servers:
   ```bash
   # Terminal 1: Sync server
   npx @automerge/automerge-repo-sync-server --port 1234

   # Terminal 2: Awareness server
   npx y-websocket-server --port 1235
   ```

2. In Neovim:
   ```vim
   :BeamConnect
   :BeamCreate
   ```

3. Share the document URL with browser users:
   ```
   http://localhost:8080?doc=<document-id>
   ```

## Commands

| Command | Description |
|---------|-------------|
| `:BeamConnect` | Connect to the collaboration servers |
| `:BeamDisconnect` | Disconnect from the servers |
| `:BeamCreate` | Create a new collaborative document |
| `:BeamOpen <id>` | Open an existing document by ID |
| `:BeamClose` | Close the current document |
| `:BeamInfo` | Show connection status |
| `:BeamUserName <name>` | Set your display name |
| `:BeamUserColor [color]` | Set your cursor color |
| `:BeamQuick <id>` | Connect and open in one step |

For complete documentation, see the [Vimbeam repository](https://github.com/computerscienceiscool/vimbeam).
