# Testing Notes: Vimbeam Neovim Plugin

The Neovim plugin has been moved to a separate repository:

**[github.com/computerscienceiscool/vimbeam](https://github.com/computerscienceiscool/vimbeam)**

## Quick Start

Purpose: reduce the Neovim flow to a single testing-only command.

Feature:
- `:BeamQuick <doc-id>` connects if needed and opens the given document once connected.
- Existing commands (`:BeamConnect`, `:BeamOpen`, `:BeamCreate`, etc.) stay unchanged.

## Config (user-local)

Ensure the plugin is installed and set up in `~/.config/nvim/init.lua`:

### vim-plug
```vim
Plug 'computerscienceiscool/vimbeam', { 'do': 'cd node-helper && npm install' }
```

Then in your config:
```lua
require('vimbeam').setup({ debug = false })
```

## Testing Vimbeam with collab-editor

1. Start the collaboration servers:
   ```bash
   make ws         # Sync server (port 1234)
   make awareness  # Awareness server (port 1235)
   make serve      # Web frontend (port 8080)
   ```

2. In Neovim:
   ```vim
   :BeamConnect
   :BeamCreate
   ```

3. Open browser to collaborate: `http://localhost:8080?doc=<document-id>`

For complete Vimbeam documentation, see the [Vimbeam repository](https://github.com/computerscienceiscool/vimbeam).
