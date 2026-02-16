# 127 - Neovim: Replace :CollabSetColor with :CollabUserColor (color picker)

## Summary
Replace the existing `:CollabSetColor #hexcode` command with a new `:CollabUserColor` command that shows a color picker using `vim.ui.select()` with an extended palette of 12+ colors.

## Current Behavior
- `:CollabSetColor #hexcode` requires user to type a hex color code
- Color is sent to the node-helper and broadcast via awareness
- Color appears in browser badges and cursor styling

## Desired Behavior
- `:CollabUserColor` opens a picker with 12+ named color options
- User selects from list using `vim.ui.select()`
- Selected color syncs with browser (same color in badges/cursors)
- Remove the old `:CollabSetColor` command

## Color Palette (12+ colors)
Suggested palette with descriptive names:
```lua
local colors = {
  { name = "Coral Red",     hex = "#FF6B6B" },
  { name = "Sunset Orange", hex = "#FFB703" },
  { name = "Golden Yellow", hex = "#FFE66D" },
  { name = "Lime Green",    hex = "#06D6A0" },
  { name = "Mint",          hex = "#95E1D3" },
  { name = "Teal",          hex = "#4ECDC4" },
  { name = "Ocean Blue",    hex = "#219EBC" },
  { name = "Sky Blue",      hex = "#8ECAE6" },
  { name = "Light Blue",    hex = "#A8D8EA" },
  { name = "Purple",        hex = "#8338EC" },
  { name = "Lavender",      hex = "#AA96DA" },
  { name = "Hot Pink",      hex = "#FF006E" },
  { name = "Soft Pink",     hex = "#FCBAD3" },
}
```

## Implementation
1. Create color palette table with names and hex values
2. Use `vim.ui.select()` to show picker:
   ```lua
   vim.ui.select(color_names, {
     prompt = "Select cursor color:",
   }, function(choice)
     if choice then
       local hex = colors[choice]
       M.set_color(hex)
     end
   end)
   ```
3. Call existing `M.set_color(hex)` with selected color

## Files to Modify
- `nvim/lua/collab-editor/init.lua`:
  - Add color palette table
  - Create new command handler with `vim.ui.select()`
  - Rename command from `:CollabSetColor` to `:CollabUserColor`
  - Remove old command registration

## Testing
1. Open Neovim and connect to a document
2. Run `:CollabUserColor`
3. Verify color picker appears with 12+ options
4. Select a color
5. Verify color appears in browser user badges
6. Verify local cursor color updates in Neovim
7. Verify `:CollabSetColor` no longer exists
