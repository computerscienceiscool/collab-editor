# Neovim Plugin Attempt - December 27, 2025

## What We Tried

Attempted to create a Neovim plugin that would integrate with the existing browser-based collaborative editor (CodeMirror + Yjs). The goal was to allow Neovim users to collaborate in real-time with browser users in the same room.

## Approach Taken

Created a plugin architecture with:
- Go WebSocket client module (websocket-client/)
- Go helper binary for stdin/stdout bridge (nvim/go-helper/)
- Lua Neovim plugin (nvim/lua/collab-editor/)
- Direct connection to existing y-websocket server (port 1234)

## Why It Failed

The implementation is incomplete and non-functional:

1. Yjs binary protocol was not implemented (stubbed as "not yet implemented")
2. No text synchronization between Neovim and browser
3. No awareness protocol (users can't see each other)
4. Estimated 16-21 additional hours of work needed to complete
5. Ports were hardcoded despite explicit requirements not to

## Critical Mistake: Wrong Technology Choice

**We chose to implement Yjs protocol support, but:**
- Team is planning to replace Yjs due to garbage collection destroying audit trail
- Implementing for a technology we're removing is backwards

## Better Approach Discovered Too Late

**Teamtype (formerly Ethersync) is the better path:**
- Already has Neovim support working
- Works in VSCode (which is Electron/Chromium, essentially a browser)
- If it works in VSCode, it can work in regular browsers
- No garbage collection issues (addresses our audit trail requirement)
- Should investigate Teamtype's protocol and add browser/CodeMirror support

## What Actually Works in This Branch

- WebSocket connection to y-websocket server (verified via lsof)
- Go helper process spawning and management
- stdin/stdout JSON communication between Neovim and Go
- Basic Neovim commands (:CollabJoin, :CollabLeave, :CollabInfo)

## What Does NOT Work

- Text synchronization (browser to Neovim: nothing appears)
- Text synchronization (Neovim to browser: nothing appears)
- User awareness (neither side sees the other as connected)
- Remote cursor display
- User list
- Typing indicators
- Everything that makes collaboration actually work
- I could get it working, but it would take significant time and effort

## Lessons Learned

1. Don't implement support for a system you're planning to replace
2. Research existing solutions (Teamtype) before building from scratch
3. Require working proof-of-concept before investing hours
4. Be honest about complexity and timelines upfront
5. Teamtype working in VSCode proves browser support is viable

## Cost

Approximately 4-5 hours of development time wasted on non-functional code.

## Recommendation

Do NOT continue this approach. Instead:

1. Research Teamtype's protocol and architecture
2. Evaluate adding browser/CodeMirror support to Teamtype
3. This gives us:
   - Working Neovim support (already exists in Teamtype)
   - No Yjs garbage collection issues
   - Single protocol for both editors
   - Alignment with team's goal to replace Yjs

## Files in This Branch

- websocket-client/ - Generic WebSocket client (works, but unused without protocol)
- nvim/go-helper/ - stdin/stdout bridge (works, but useless without protocol)
- nvim/lua/collab-editor/ - Neovim plugin (connects but doesn't sync)
- docs/nvim-plugin.md - Original planning document

## Status

This branch represents a failed approach. The code connects but does not collaborate.
Do not merge to main. Keep for reference only.  It will take a fair bit of time to get working and it will be dependent on YJS.

Consider this a learning experience about choosing the right technology before implementation.

---

Created: December 27, 2025
Author: Jennifer
Status: ABANDONED - Wrong approach, incomplete implementation
Next Steps: Investigate Teamtype protocol for browser integration









Git status before choosing to pivot.

On branch nvim-plugin

Your branch is up to date with 'origin/nvim-plugin'.

Untracked files:

  (use "git add <file>..." to include in what will be committed)

	docs/nvim-plugin.md

	go-helper

	nvim/

	websocket-client/

nothing added to commit but untracked files present (use "git add" to track)


