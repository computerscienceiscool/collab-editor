# Testing Notes: Viduct Neovim Plugin

The Neovim plugin has been moved to a separate repository:

**[github.com/computerscienceiscool/viduct](https://github.com/computerscienceiscool/viduct)**

## Quick Start

Purpose: reduce the Neovim flow to a single testing-only command.

Feature:
- `:DuctQuick <doc-id>` connects if needed and opens the given document once connected.
- Existing commands (`:DuctConnect`, `:DuctOpen`, `:DuctCreate`, etc.) stay unchanged.

## Config (user-local)

Ensure the plugin is installed and set up in `~/.config/nvim/init.lua`:

### vim-plug
```vim
Plug 'computerscienceiscool/viduct', { 'do': 'cd node-helper && npm install' }
```

Then in your config:
```lua
require('viduct').setup({ debug = false })
```

## Testing Viduct with collab-editor

1. Start the collaboration servers:
   ```bash
   make ws         # Sync server (port 1234)
   make awareness  # Awareness server (port 1235)
   make serve      # Web frontend (port 8080)
   ```

2. In Neovim:
   ```vim
   :DuctConnect
   :DuctCreate
   ```

3. Open browser to collaborate: `http://localhost:8080?doc=<document-id>`

For complete Viduct documentation, see the [Viduct repository](https://github.com/computerscienceiscool/viduct).
