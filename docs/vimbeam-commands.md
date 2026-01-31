# Vimbeam Commands Reference

Complete command reference for the Vimbeam Neovim plugin.

**Plugin Repository**: [github.com/computerscienceiscool/vimbeam](https://github.com/computerscienceiscool/vimbeam)

---

## Connection Commands

### :BeamConnect

Connect to the collaboration servers.

**Usage:**
```vim
:BeamConnect
```

**Description:**
Establishes WebSocket connections to both the sync server (port 1234) and awareness server (port 1235). Must be called before creating or opening documents.

**Output:**
```
[vimbeam] Connected as beam-a7f2k9x1
```

---

### :BeamDisconnect

Disconnect from the collaboration servers.

**Usage:**
```vim
:BeamDisconnect
```

**Description:**
Closes all WebSocket connections and cleans up the session. Your cursor will disappear from other users' screens.

---

### :BeamInfo

Show current connection status and document information.

**Usage:**
```vim
:BeamInfo
```

**Description:**
Displays connection state, current document ID, and user information.

**Output:**
```
[vimbeam] Connected: true | Doc: automerge:4DbPtgHxqM6snzcLJRL3qV9khUym | User: Alice
```

---

## Document Commands

### :BeamCreate

Create a new collaborative document.

**Usage:**
```vim
:BeamCreate
```

**Description:**
Creates a new empty collaborative document and opens it in the current buffer. Returns a document ID that can be shared with collaborators.

**Output:**
```
[vimbeam] Created document: automerge:4DbPtgHxqM6snzcLJRL3qV9khUym
```

**Sharing:**
Share the document ID with others. They can join via:
- Neovim: `:BeamOpen 4DbPtgHxqM6snzcLJRL3qV9khUym`
- Browser: `http://localhost:8080?doc=4DbPtgHxqM6snzcLJRL3qV9khUym`

---

### :BeamOpen

Open an existing collaborative document by ID.

**Usage:**
```vim
:BeamOpen <doc_id>
```

**Arguments:**
| Argument | Required | Description |
|----------|----------|-------------|
| `doc_id` | Yes | The document ID (with or without `automerge:` prefix) |

**Examples:**
```vim
:BeamOpen 4DbPtgHxqM6snzcLJRL3qV9khUym
:BeamOpen automerge:4DbPtgHxqM6snzcLJRL3qV9khUym
```

**Description:**
Opens an existing document and loads its content into the current buffer. Changes sync bidirectionally with all other connected users.

---

### :BeamClose

Close the current collaborative document.

**Usage:**
```vim
:BeamClose
```

**Description:**
Stops syncing the current document but maintains the server connection. The buffer content remains but is no longer collaborative.

---

### :BeamQuick

Connect and open a document in one step.

**Usage:**
```vim
:BeamQuick <doc_id>
```

**Arguments:**
| Argument | Required | Description |
|----------|----------|-------------|
| `doc_id` | Yes | The document ID to open |

**Example:**
```vim
:BeamQuick 4DbPtgHxqM6snzcLJRL3qV9khUym
```

**Description:**
Convenience command that combines `:BeamConnect` and `:BeamOpen`. If already connected, skips the connection step. Useful for quickly joining a collaboration session.

---

## User Commands

### :BeamUserName

Set your display name for collaboration.

**Usage:**
```vim
:BeamUserName <name>
```

**Arguments:**
| Argument | Required | Description |
|----------|----------|-------------|
| `name` | Yes | Your display name (can include spaces) |

**Examples:**
```vim
:BeamUserName Alice
:BeamUserName John Doe
```

**Description:**
Sets the name displayed next to your cursor in other users' editors. Updates immediately for all connected collaborators.

---

### :BeamUserColor

Set your cursor color.

**Usage:**
```vim
:BeamUserColor [color]
```

**Arguments:**
| Argument | Required | Description |
|----------|----------|-------------|
| `color` | No | Color name or hex code. If omitted, opens color picker. |

**Examples:**
```vim
:BeamUserColor                " Opens interactive color picker
:BeamUserColor green          " Set by simple name
:BeamUserColor Hot Pink       " Set by descriptive name
:BeamUserColor #FF6B6B        " Set by hex code
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
require('vimbeam').setup({
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
:BeamConnect
:BeamCreate
" Share the document ID with collaborators
" Start editing!
```

### Join an Existing Session

```vim
:BeamQuick 4DbPtgHxqM6snzcLJRL3qV9khUym
" Or separately:
:BeamConnect
:BeamOpen 4DbPtgHxqM6snzcLJRL3qV9khUym
```

### Customize Your Identity

```vim
:BeamUserName Alice
:BeamUserColor Teal
```

### Check Status

```vim
:BeamInfo
```

### End Session

```vim
:BeamClose       " Close document but stay connected
:BeamDisconnect  " Fully disconnect
```

---

## Troubleshooting

### "Not connected" error
Run `:BeamConnect` first, or use `:BeamQuick` which connects automatically.

### Empty buffer after :BeamOpen
Wait 5-10 seconds for initial sync. Large documents take longer.

### Can't see other users' cursors
Ensure the awareness server is running on port 1235.

### Commands not recognized
Run `:PlugInstall` (vim-plug) or your plugin manager's install command, then restart Neovim.

---

## Server Requirements

Vimbeam requires two WebSocket servers:

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

- [Vimbeam Repository](https://github.com/computerscienceiscool/vimbeam)
- [Protocol Documentation](https://github.com/computerscienceiscool/vimbeam/blob/main/docs/PROTOCOL.md)
- [Message Flow](message-flow.md)
