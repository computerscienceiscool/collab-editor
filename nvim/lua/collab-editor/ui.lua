-- File: nvim/lua/collab-editor/ui.lua
-- User interface for collaborative editing

local M = {}

local namespace = nil
local status_timer = nil

-- Setup UI components
function M.setup()
  -- Create namespace for virtual text and highlights
  namespace = vim.api.nvim_create_namespace('collab-editor')
  
  -- Setup autocommands for buffer changes
  vim.api.nvim_create_autocmd({'TextChanged', 'TextChangedI'}, {
    callback = function()
      M.on_buffer_change()
    end,
  })
  
  vim.notify('[collab-editor] UI initialized', vim.log.levels.INFO)
end

-- Cleanup UI components
function M.cleanup()
  if namespace then
    -- Clear all highlights and virtual text
    vim.api.nvim_buf_clear_namespace(0, namespace, 0, -1)
  end
  
  if status_timer then
    vim.fn.timer_stop(status_timer)
    status_timer = nil
  end
  
  vim.notify('[collab-editor] UI cleaned up', vim.log.levels.INFO)
end

-- Show status message
function M.show_status(message)
  vim.notify('[collab-editor] ' .. message, vim.log.levels.INFO)
end

-- Show remote cursor at position
function M.show_cursor(user_id, username, line, col, color)
  if not namespace then
    return
  end
  
  -- TODO: Implement virtual text cursor display
  -- Use vim.api.nvim_buf_set_extmark with virtual text
  
  -- Example (not complete):
  -- vim.api.nvim_buf_set_extmark(0, namespace, line - 1, col, {
  --   virt_text = {{username, 'CollabCursor' .. user_id}},
  --   virt_text_pos = 'overlay',
  -- })
end

-- Update user list display
function M.update_user_list(users)
  -- TODO: Show user list in status line or floating window
  local user_count = #users
  vim.notify('[collab-editor] ' .. user_count .. ' users connected', vim.log.levels.INFO)
end

-- Handle buffer changes (send to other peers)
function M.on_buffer_change()
  -- TODO: Detect what changed and send update
  -- For now, just notify
  -- vim.notify('[collab-editor] Buffer changed', vim.log.levels.DEBUG)
  
  -- Get current buffer content
  local lines = vim.api.nvim_buf_get_lines(0, 0, -1, false)
  local text = table.concat(lines, '\n')
  
  -- TODO: Send to yjs module
  -- local yjs = require('collab-editor.yjs')
  -- yjs.send_update(text)
end

-- Show typing indicator for a user
function M.show_typing_indicator(user_id, username)
  -- TODO: Show typing indicator (e.g., in status line)
  vim.notify('[collab-editor] ' .. username .. ' is typing...', vim.log.levels.INFO)
end

return M
