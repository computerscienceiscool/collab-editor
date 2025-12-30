-- File: nvim/lua/collab-editor/websocket.lua
-- WebSocket connection management via Go helper

local M = {}

local job_id = nil
local message_handlers = {}

-- Start Go helper process and connect to WebSocket
function M.connect(go_helper_path, ws_url, room)
  if job_id then
    vim.notify('[collab-editor] Already connected', vim.log.levels.WARN)
    return false, 'already connected'
  end
  
  -- Check if go-helper exists
  if vim.fn.executable(go_helper_path) == 0 then
    vim.notify('[collab-editor] go-helper not found at: ' .. go_helper_path, vim.log.levels.ERROR)
    return false, 'go-helper not found'
  end
  
  -- Start go-helper as a job
  local cmd = {
    go_helper_path,
    '--ws-url', ws_url,
    '--room', room,
  }
  
  job_id = vim.fn.jobstart(cmd, {
    on_stdout = function(_, data, _)
      M.on_message(data)
    end,
    on_stderr = function(_, data, _)
      for _, line in ipairs(data) do
        if line ~= '' then
          vim.notify('[collab-editor] Error: ' .. line, vim.log.levels.ERROR)
        end
      end
    end,
    on_exit = function(_, code, _)
      vim.notify('[collab-editor] Connection closed (exit code: ' .. code .. ')', vim.log.levels.INFO)
      job_id = nil
    end,
    stdout_buffered = false,
    stderr_buffered = false,
  })
  
  if job_id <= 0 then
    vim.notify('[collab-editor] Failed to start go-helper', vim.log.levels.ERROR)
    job_id = nil
    return false, 'failed to start'
  end
  
  return true
end

-- Disconnect from WebSocket
function M.disconnect()
  if not job_id then
    return
  end
  
  -- Send close message
  M.send_message({ type = 'close' })
  
  -- Stop the job
  vim.fn.jobstop(job_id)
  job_id = nil
end

-- Send message to Go helper (and thus to WebSocket)
function M.send_message(msg)
  if not job_id then
    vim.notify('[collab-editor] Not connected', vim.log.levels.WARN)
    return false
  end
  
  local json = vim.fn.json_encode(msg)
  vim.fn.chansend(job_id, json .. '\n')
  return true
end

-- Handle incoming messages from Go helper
function M.on_message(data)
  for _, line in ipairs(data) do
    if line ~= '' then
      local ok, msg = pcall(vim.fn.json_decode, line)
      if ok and msg.type then
        M.dispatch_message(msg)
      else
        vim.notify('[collab-editor] Invalid message: ' .. line, vim.log.levels.WARN)
      end
    end
  end
end

-- Dispatch message to registered handlers
function M.dispatch_message(msg)
  if msg.type == 'connected' then
    vim.notify('[collab-editor] Connected to WebSocket', vim.log.levels.INFO)
    
  elseif msg.type == 'ws_message' then
    -- Message from WebSocket - forward to Yjs handler
    local yjs = require('collab-editor.yjs')
    yjs.handle_message(msg.data)
    
  elseif msg.type == 'pong' then
    -- Pong response to ping
    
  else
    vim.notify('[collab-editor] Unknown message type: ' .. msg.type, vim.log.levels.WARN)
  end
  
  -- Call any registered handlers
  if message_handlers[msg.type] then
    for _, handler in ipairs(message_handlers[msg.type]) do
      handler(msg)
    end
  end
end

-- Register a message handler
function M.register_handler(msg_type, handler)
  if not message_handlers[msg_type] then
    message_handlers[msg_type] = {}
  end
  table.insert(message_handlers[msg_type], handler)
end

-- Check if connected
function M.is_connected()
  return job_id ~= nil
end

return M
