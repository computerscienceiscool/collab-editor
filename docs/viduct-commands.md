# Viduct Commands Reference

Complete command reference for the Viduct Neovim plugin.

**Plugin Repository**: [github.com/computerscienceiscool/viduct](https://github.com/computerscienceiscool/viduct)

---

## Connection Commands

### :DuctConnect

Connect to the collaboration servers.

**Usage:**
```vim
:DuctConnect
```

**Description:**
Establishes WebSocket connections to both the sync server (port 1234) and awareness server (port 1235). Must be called before creating or opening documents.

**Output:**
```
[viduct] Connected as duct-a7f2k9x1
```

---

### :DuctDisconnect

Disconnect from the collaboration servers.

**Usage:**
```vim
:DuctDisconnect
```

**Description:**
Closes all WebSocket connections and cleans up the session. Your cursor will disappear from other users' screens.

---

### :DuctInfo

Show current connection status and document information.

**Usage:**
```vim
:DuctInfo
```

**Description:**
Displays connection state, current document ID, and user information.

**Output:**
```
[viduct] Connected: true | Doc: automerge:4DbPtgHxqM6snzcLJRL3qV9khUym | User: Alice
```

---

## Document Commands

### :DuctCreate

Create a new collaborative document.

**Usage:**
```vim
:DuctCreate
```

**Description:**
Creates a new empty collaborative document and opens it in the current buffer. Returns a document ID that can be shared with collaborators.

**Output:**
```
[viduct] Created document: automerge:4DbPtgHxqM6snzcLJRL3qV9khUym
```

**Sharing:**
Share the document ID with others. They can join via:
- Neovim: `:DuctOpen 4DbPtgHxqM6snzcLJRL3qV9khUym`
- Browser: `http://localhost:8080?doc=4DbPtgHxqM6snzcLJRL3qV9khUym`

---

### :DuctOpen

Open an existing collaborative document by ID.

**Usage:**
```vim
:DuctOpen <doc_id>
```

**Arguments:**
| Argument | Required | Description |
|----------|----------|-------------|
| `doc_id` | Yes | The document ID (with or without `automerge:` prefix) |

**Examples:**
```vim
:DuctOpen 4DbPtgHxqM6snzcLJRL3qV9khUym
:DuctOpen automerge:4DbPtgHxqM6snzcLJRL3qV9khUym
```

**Description:**
Opens an existing document and loads its content into the current buffer. Changes sync bidirectionally with all other connected users.

---

### :DuctClose

Close the current collaborative document.

**Usage:**
```vim
:DuctClose
```

**Description:**
Stops syncing the current document but maintains the server connection. The buffer content remains but is no longer collaborative.

---

### :DuctQuick

Connect and open a document in one step.

**Usage:**
```vim
:DuctQuick <doc_id>
```

**Arguments:**
| Argument | Required | Description |
|----------|----------|-------------|
| `doc_id` | Yes | The document ID to open |

**Example:**
```vim
:DuctQuick 4DbPtgHxqM6snzcLJRL3qV9khUym
```

**Description:**
Convenience command that combines `:DuctConnect` and `:DuctOpen`. If already connected, skips the connection step. Useful for quickly joining a collaboration session.

---

## User Commands

### :DuctUserName

Set your display name for collaboration.

**Usage:**
```vim
:DuctUserName <name>
```

**Arguments:**
| Argument | Required | Description |
|----------|----------|-------------|
| `name` | Yes | Your display name (can include spaces) |

**Examples:**
```vim
:DuctUserName Alice
:DuctUserName John Doe
```

**Description:**
Sets the name displayed next to your cursor in other users' editors. Updates immediately for all connected collaborators.

---

### :DuctUserColor

Set your cursor color.

**Usage:**
```vim
:DuctUserColor [color]
```

**Arguments:**
| Argument | Required | Description |
|----------|----------|-------------|
| `color` | No | Color name or hex code. If omitted, opens color picker. |

**Examples:**
```vim
:DuctUserColor                " Opens interactive color picker
:DuctUserColor green          " Set by simple name
:DuctUserColor Hot Pink       " Set by descriptive name
:DuctUserColor #FF6B6B        " Set by hex code
```

**Available Colors:**

| Simple Names | Hex Code |
|--------------|----------|
| Red | #FF6B6B |
| Orange | #FFB703 |
| Yellow | #FFE66D |
| Green | #06D6A0 |
| Teal | #4ECDC4 |
| Blue | #219EBC |
| Purple | #8338EC |
| Pink | #FF006E |

| Descriptive Names | Hex Code |
|-------------------|----------|
| Coral Red | #E63946 |
| Sunset Orange | #F4A261 |
| Lime Green | #2A9D8F |
| Mint | #95E1D3 |
| Ocean Blue | #0077B6 |
| Sky Blue | #8ECAE6 |
| Light Blue | #A8D8EA |
| Lavender | #AA96DA |
| Hot Pink | #F72585 |
| Soft Pink | #FCBAD3 |

**Description:**
Sets the color used for your cursor and name label in other users' editors. Color names are case-insensitive.

---

## Configuration

Add to your `~/.config/nvim/init.lua`:

```lua
require('viduct').setup({
  -- WebSocket URL for document sync (Automerge)
  sync_url = 'ws://localhost:1234',

  -- WebSocket URL for user presence/awareness
  awareness_url = 'ws://localhost:1235',

  -- Path to Node.js helper (auto-detected by default)
  node_helper_path = nil,

  -- Your display name (shown to other collaborators)
  user_name = 'YourName',

  -- Your cursor color (hex code or color name)
  user_color = '#4ECDC4',

  -- Enable debug logging (not recommended - causes message spam)
  debug = false,
})
```

---

## Common Workflows

### Start a New Session

```vim
:DuctConnect
:DuctCreate
" Share the document ID with collaborators
" Start editing!
```

### Join an Existing Session

```vim
:DuctQuick 4DbPtgHxqM6snzcLJRL3qV9khUym
" Or separately:
:DuctConnect
:DuctOpen 4DbPtgHxqM6snzcLJRL3qV9khUym
```

### Customize Your Identity

```vim
:DuctUserName Alice
:DuctUserColor Teal
```

### Check Status

```vim
:DuctInfo
```

### End Session

```vim
:DuctClose       " Close document but stay connected
:DuctDisconnect  " Fully disconnect
```

---

## Troubleshooting

### "Not connected" error
Run `:DuctConnect` first, or use `:DuctQuick` which connects automatically.

### Empty buffer after :DuctOpen
Wait 5-10 seconds for initial sync. Large documents take longer.

### Can't see other users' cursors
Ensure the awareness server is running on port 1235.

### Commands not recognized
Run `:PlugInstall` (vim-plug) or your plugin manager's install command, then restart Neovim.

---

## Server Requirements

Viduct requires two WebSocket servers:

```bash
# Terminal 1: Sync server (document changes)
npx @automerge/automerge-repo-sync-server --port 1234

# Terminal 2: Awareness server (cursor positions)
npx y-websocket-server --port 1235
```

Or use the collab-editor Makefile:
```bash
make ws         # Sync server
make awareness  # Awareness server
```

---

## See Also

- [Viduct Repository](https://github.com/computerscienceiscool/viduct)
- [Protocol Documentation](https://github.com/computerscienceiscool/viduct/blob/main/docs/PROTOCOL.md)
- [Message Flow](message-flow.md)
