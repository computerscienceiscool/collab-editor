# 126 - Neovim: Rename :CollabSetName to :CollabUserName

## Summary
Rename the existing `:CollabSetName` command to `:CollabUserName` for consistency with the new `:CollabUserColor` command. Keep the same argument-based behavior.

## Current Behavior
- `:CollabSetName <name>` sets the user's display name
- Name is sent to the node-helper and broadcast via awareness
- Name appears in browser user badges and cursor labels

## Desired Behavior
- `:CollabUserName <name>` - same functionality, renamed command
- Remove the old `:CollabSetName` command

## Files to Modify
- `nvim/lua/collab-editor/init.lua` - Rename command registration (line ~270-272)

## Testing
1. Open Neovim and connect to a document
2. Run `:CollabUserName TestUser`
3. Verify name appears in browser user list
4. Verify `:CollabSetName` no longer exists
