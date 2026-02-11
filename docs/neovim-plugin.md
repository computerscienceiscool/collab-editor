# Neovim Plugin - Moved to Viduct

The Neovim collaborative editing plugin has been moved to its own repository:

**[github.com/computerscienceiscool/viduct](https://github.com/computerscienceiscool/viduct)**

## Installation

Install Viduct using your preferred plugin manager:

### vim-plug
```vim
Plug 'computerscienceiscool/viduct', { 'do': 'cd node-helper && npm install' }
```

### lazy.nvim
```lua
{
  'computerscienceiscool/viduct',
  build = 'cd node-helper && npm install',
  config = function()
    require('viduct').setup({
      sync_url = 'ws://localhost:1234',
      awareness_url = 'ws://localhost:1235',
    })
  end,
}
```

### packer.nvim
```lua
use {
  'computerscienceiscool/viduct',
  run = 'cd node-helper && npm install',
  config = function()
    require('viduct').setup({
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
   :DuctConnect
   :DuctCreate
   ```

3. Share the document URL with browser users:
   ```
   http://localhost:8080?doc=<document-id>
   ```

## Commands

| Command | Description |
|---------|-------------|
| `:DuctConnect` | Connect to the collaboration servers |
| `:DuctDisconnect` | Disconnect from the servers |
| `:DuctCreate` | Create a new collaborative document |
| `:DuctOpen <id>` | Open an existing document by ID |
| `:DuctClose` | Close the current document |
| `:DuctInfo` | Show connection status |
| `:DuctUserName <name>` | Set your display name |
| `:DuctUserColor [color]` | Set your cursor color |
| `:DuctQuick <id>` | Connect and open in one step |

For complete documentation, see the [Viduct repository](https://github.com/computerscienceiscool/viduct).
