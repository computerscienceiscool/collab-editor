# Neovim Commands Quick Reference

A quick reference for all collaborative editing commands in Neovim.

## Connection Commands

### :CollabConnect
Connect to the collaboration server.

### :CollabDisconnect
Disconnect from the collaboration server.

### :CollabInfo
Show connection status, document ID, and user info.

## Document Commands

### :CollabCreate
Create a new collaborative document. Returns a document ID you can share.

### :CollabOpen `<doc_id>`
Open an existing collaborative document by ID.

**Arguments:**
- `doc_id` - The document ID (e.g., `4R9KDGBoZKPjhb15iErZd9nmhPRH`)

**Example:**
```vim
:CollabOpen 4R9KDGBoZKPjhb15iErZd9nmhPRH
```

### :CollabClose
Close the current collaborative document.

## User Commands

### :CollabUserName `<name>`
Set your display name for collaboration. This name appears in browser user lists and cursor labels.

**Arguments:**
- `name` - Your display name

**Example:**
```vim
:CollabUserName Alice
```

### :CollabUserColor `[color]`
Set your cursor color. Run without arguments to open a color picker, or specify a color directly.

**Arguments (optional):**
- `color` - Color name or hex code

**Color Options:**

| Simple Colors | Hex Code |
|---------------|----------|
| Red | #FF6B6B |
| Orange | #FFB703 |
| Yellow | #FFE66D |
| Green | #06D6A0 |
| Teal | #4ECDC4 |
| Blue | #219EBC |
| Purple | #8338EC |
| Pink | #FF006E |

| Descriptive Colors | Hex Code |
|--------------------|----------|
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

**Examples:**
```vim
:CollabUserColor              " Opens color picker
:CollabUserColor green        " Sets green directly
:CollabUserColor Blue         " Case-insensitive
:CollabUserColor Hot Pink     " Descriptive names work
:CollabUserColor #FF0000      " Custom hex code
```

## Testing Commands

### :CollabQuick `<doc_id>`
**Testing only.** Connect (if needed) and open a document in one step.

**Arguments:**
- `doc_id` - The document ID

**Example:**
```vim
:CollabQuick 4R9KDGBoZKPjhb15iErZd9nmhPRH
```
