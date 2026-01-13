# Testing Notes: CollabQuick Neovim Shortcut

Purpose: reduce the current four-step Neovim flow (`:set runtimepath`, `:lua ...setup`, `:CollabConnect`, `:CollabOpen <doc-id>`) to a single testing-only command.

Feature:
- `:CollabQuick <doc-id>` connects if needed and opens the given document once connected. No paths are hardcoded in the plugin.
- Existing commands (`:CollabConnect`, `:CollabOpen`, `:CollabCreate`, etc.) stay unchanged.

Config note (user-local, not in the plugin):
- Ensure the plugin is on your runtime path and set up in `~/.config/nvim/init.lua`, e.g.:
  ```lua
  vim.opt.runtimepath:append('~/lab/collab-editor/nvim')
  require('collab-editor').setup({ debug = false })
  ```
- Keep these settings in your config file; they are not baked into the plugin code.

Status: implemented in `nvim/lua/collab-editor/init.lua` and documented in `docs/neovim-plugin.md`.
