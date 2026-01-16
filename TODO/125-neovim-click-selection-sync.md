# 125 - Neovim Click-Selection Not Highlighted in Other Sessions (FIXED)

## Summary
When selecting text by clicking in Neovim, the selection is not highlighted in other Neovim sessions. Drag-selection works correctly.

## Observed Behavior
- **Drag selection**: Highlighted in other Neovim sessions (works)
- **Click selection**: NOT highlighted in other Neovim sessions (broken)

## Expected Behavior
Both click and drag selection methods should sync highlights across Neovim sessions.

## Likely Cause
Click-based selection may not trigger the same events as drag-based selection. The awareness sync likely hooks into mouse-drag events but misses click events.

## Files to Investigate
- `nvim/lua/collab/init.lua` - Neovim plugin event handling
- `nvim/node-helper/` - Node.js awareness bridge

## Resolution
The cursor extmark was created with only virtual text (the username label) but no `hl_group` for the cursor position itself. Fixed by adding `hl_group = select_hl` and `end_col` to highlight one character at the cursor position in `nvim/lua/collab-editor/init.lua:226-233`.

## Related Issues
- [x] 124 - Bug: Duplicate neovim usernames cause cursor display failure
