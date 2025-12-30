-- File: nvim/lua/collab-editor/init.lua
-- Main entry point for collab-editor Neovim plugin

local M = {}

local websocket = require('collab-editor.websocket')
local ui = require('collab-editor.ui')

-- Plugin state
M.state = {
  active = false,
  room = nil,
  ws_url = nil,
  users = {},
}

-- Configuration defaults
M.config = {
  ws_url = 'ws://localhost:1234',
  go_helper_path = nil, -- Will be auto-detected
}

-- Setup function called by user in their init.lua
function M.setup(opts)
  opts = opts or {}
  M.config = vim.tbl_deep_extend('force', M.config, opts)
  
  -- Auto-detect go-helper binary if not specified
  if not M.config.go_helper_path then
    -- Try to find it relative to this plugin
    local plugin_path = debug.getinfo(1).source:match("@?(.*/)"):gsub("/lua/collab%-editor/$", "")
    M.config.go_helper_path = plugin_path .. '/go-helper/go-helper'
  end
  
  print('[collab-editor] Plugin loaded')
end

-- Join a collaboration room
function M.join_room(room)
  if M.state.active then
    print('[collab-editor] Already in a room. Leave first.')
    return
  end
  
  room = room or vim.fn.input('Room ID: ')
  if room == '' then
    print('[collab-editor] Room ID required')
    return
  end
  
  M.state.room = room
  M.state.ws_url = M.config.ws_url
  
  -- Start WebSocket connection
  local ok, err = websocket.connect(M.config.go_helper_path, M.state.ws_url, room)
  if not ok then
    print('[collab-editor] Failed to connect: ' .. tostring(err))
    return
  end
  
  M.state.active = true
  
  -- Setup UI
  ui.setup()
  ui.show_status('Connected to room: ' .. room)
  
  print('[collab-editor] Joined room: ' .. room)
end

-- Leave current room
function M.leave_room()
  if not M.state.active then
    print('[collab-editor] Not in a room')
    return
  end
  
  websocket.disconnect()
  ui.cleanup()
  
  M.state.active = false
  M.state.room = nil
  M.state.users = {}
  
  print('[collab-editor] Left room')
end

-- Get current room info
function M.get_room_info()
  if not M.state.active then
    print('[collab-editor] Not in a room')
    return nil
  end
  
  return {
    room = M.state.room,
    ws_url = M.state.ws_url,
    users = M.state.users,
  }
end

-- User commands
vim.api.nvim_create_user_command('CollabJoin', function(opts)
  M.join_room(opts.args)
end, { nargs = '?' })

vim.api.nvim_create_user_command('CollabLeave', function()
  M.leave_room()
end, {})

vim.api.nvim_create_user_command('CollabInfo', function()
  local info = M.get_room_info()
  if info then
    print(string.format('[collab-editor] Room: %s, Users: %d', info.room, #info.users))
  end
end, {})

return M
