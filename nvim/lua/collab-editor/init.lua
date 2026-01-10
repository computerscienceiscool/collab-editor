-- File: nvim/lua/collab-editor/init.lua
-- Main entry point for collab-editor Neovim plugin
-- Works with Node.js helper for Automerge collaboration

local M = {}

-- Plugin state
M.state = {
  connected = false,
  doc_id = nil,
  user_id = nil,
  job_id = nil,
  bufnr = nil,
  cursor_ns = nil,  -- namespace for remote cursors
  remote_cursors = {},  -- track remote cursor extmarks
  remote_selections = {},  -- track remote selection extmarks
  last_sent_tick = 0,  -- track last changedtick sent to helper
  ignore_changes = false,
}

-- Configuration defaults
M.config = {
  sync_url = 'ws://localhost:1234',
  awareness_url = 'ws://localhost:1235',
  node_helper_path = nil, -- Will be auto-detected
  debug = false,
}

-- Setup function called by user in their init.lua
function M.setup(opts)
  opts = opts or {}
  M.config = vim.tbl_deep_extend('force', M.config, opts)

  -- Auto-detect node-helper path if not specified
  if not M.config.node_helper_path then
    local source = debug.getinfo(1).source
    if source:sub(1, 1) == '@' then
      local plugin_path = source:sub(2):gsub('/lua/collab%-editor/init%.lua$', '')
      M.config.node_helper_path = plugin_path .. '/node-helper/index.js'
    end
  end

  M.setup_commands()

  if M.config.debug then
    vim.notify('[collab] Plugin loaded', vim.log.levels.DEBUG)
  end
end

-- Show remote cursor in buffer using extmarks
function M.show_remote_cursor(user_id, name, color, anchor, head)
  if not M.state.bufnr or not vim.api.nvim_buf_is_valid(M.state.bufnr) then
    return
  end
  
  -- Create namespace if needed
  if not M.state.cursor_ns then
    M.state.cursor_ns = vim.api.nvim_create_namespace("collab_cursors")
  end
  
  -- Clear previous cursor/selection for this user
  if M.state.remote_cursors[user_id] then
    pcall(vim.api.nvim_buf_del_extmark, M.state.bufnr, M.state.cursor_ns, M.state.remote_cursors[user_id])
    M.state.remote_cursors[user_id] = nil
  end
  if M.state.remote_selections and M.state.remote_selections[user_id] then
    pcall(vim.api.nvim_buf_del_extmark, M.state.bufnr, M.state.cursor_ns, M.state.remote_selections[user_id])
    M.state.remote_selections[user_id] = nil
  end
  
  -- Convert anchor (character offset) to row/col
  local lines = vim.api.nvim_buf_get_lines(M.state.bufnr, 0, -1, false)
  if #lines == 0 then
    lines = { '' }
  end

  local total_len = 0
  for i, line in ipairs(lines) do
    total_len = total_len + #line
    if i < #lines then
      total_len = total_len + 1
    end
  end

  local function clamp_offset(off)
    return math.max(0, math.min(tonumber(off) or 0, total_len))
  end

  local function offset_to_pos(off)
    local clamped = clamp_offset(off)
    local offset = 0
    local target_row = 0
    local target_col = 0

    for i, line in ipairs(lines) do
      local line_len = #line + 1  -- +1 for newline
      if offset + line_len > clamped then
        target_row = i - 1
        target_col = clamped - offset
        return target_row, target_col
      end
      offset = offset + line_len
    end

    local last_row = math.max(0, #lines - 1)
    local last_line = lines[#lines] or ""
    return last_row, math.min(clamped - offset, #last_line)
  end

  local cursor_row, cursor_col = offset_to_pos(anchor or 0)

  local selection_mark_id = nil
  if head ~= nil and head ~= anchor then
    local start_off = clamp_offset(math.min(anchor or 0, head))
    local end_off = clamp_offset(math.max(anchor or 0, head))
    local start_row, start_col = offset_to_pos(start_off)
    local end_row, end_col = offset_to_pos(end_off)

    selection_mark_id = vim.api.nvim_buf_set_extmark(M.state.bufnr, M.state.cursor_ns, start_row, start_col, {
      end_line = end_row,
      end_col = end_col,
      hl_group = "Visual",
      priority = 90,
    })
  end
  
  -- Create extmark with virtual text
  local mark_id = vim.api.nvim_buf_set_extmark(M.state.bufnr, M.state.cursor_ns, cursor_row, cursor_col, {
    virt_text = {{ " " .. (name or "user") .. " ", "Search" }},
    virt_text_pos = "overlay",
    priority = 100,
  })
  
  M.state.remote_cursors[user_id] = mark_id
  if selection_mark_id then
    M.state.remote_selections[user_id] = selection_mark_id
  end
end


-- Setup user commands
function M.setup_commands()
  vim.api.nvim_create_user_command('CollabConnect', function()
    M.connect()
  end, { desc = 'Connect to collaboration server' })

  vim.api.nvim_create_user_command('CollabDisconnect', function()
    M.disconnect()
  end, { desc = 'Disconnect from collaboration server' })

  vim.api.nvim_create_user_command('CollabCreate', function()
    M.create_document()
  end, { desc = 'Create new collaborative document' })

  vim.api.nvim_create_user_command('CollabOpen', function(opts)
    M.open_document(opts.args)
  end, { nargs = 1, desc = 'Open collaborative document by ID' })

  vim.api.nvim_create_user_command('CollabClose', function()
    M.close_document()
  end, { desc = 'Close current collaborative document' })

  vim.api.nvim_create_user_command('CollabInfo', function()
    M.show_info()
  end, { desc = 'Show connection info' })
end

-- Send JSON message to helper
function M.send(msg)
  if M.state.job_id then
    local json = vim.fn.json_encode(msg) .. '\n'
    vim.fn.chansend(M.state.job_id, json)
    if M.config.debug then
      vim.notify('[collab] Sent: ' .. vim.fn.json_encode(msg), vim.log.levels.DEBUG)
    end
  end
end

-- Connect to collaboration server
function M.connect()
  if M.state.connected then
    vim.notify('[collab] Already connected', vim.log.levels.WARN)
    return
  end

  local helper_path = M.config.node_helper_path
  if not helper_path or vim.fn.filereadable(helper_path) == 0 then
    vim.notify('[collab] Node helper not found at: ' .. (helper_path or 'nil'), vim.log.levels.ERROR)
    return
  end

  -- Start node helper process
  M.state.job_id = vim.fn.jobstart({ 'node', helper_path }, {
    on_stdout = function(_, data, _)
      M.on_stdout(data)
    end,
    on_stderr = function(_, data, _)
      for _, line in ipairs(data) do
        if line ~= '' then
          if M.config.debug then
            vim.notify('[collab] Helper: ' .. line, vim.log.levels.DEBUG)
          end
        end
      end
    end,
    on_exit = function(_, code, _)
      M.on_exit(code)
    end,
    stdout_buffered = false,
    stderr_buffered = false,
  })

  if M.state.job_id <= 0 then
    vim.notify('[collab] Failed to start helper', vim.log.levels.ERROR)
    M.state.job_id = nil
    return
  end

  -- Send connect message
  M.send({
    type = 'connect',
    syncUrl = M.config.sync_url,
    awarenessUrl = M.config.awareness_url,
  })
end

-- Disconnect from server
function M.disconnect()
  if not M.state.job_id then
    vim.notify('[collab] Not connected', vim.log.levels.WARN)
    return
  end

  M.send({ type = 'disconnect' })

  vim.fn.jobstop(M.state.job_id)
  M.state.job_id = nil
  M.state.connected = false
  M.state.doc_id = nil
  M.state.user_id = nil

  if M.state.bufnr then
    M.detach_buffer()
  end

  vim.notify('[collab] Disconnected', vim.log.levels.INFO)
end

-- Create new document
function M.create_document()
  if not M.state.connected then
    vim.notify('[collab] Not connected. Run :CollabConnect first', vim.log.levels.ERROR)
    return
  end

  M.send({ type = 'create' })
end

-- Open existing document
function M.open_document(doc_id)
  if not M.state.connected then
    vim.notify('[collab] Not connected. Run :CollabConnect first', vim.log.levels.ERROR)
    return
  end

  if not doc_id or doc_id == '' then
    vim.notify('[collab] Document ID required', vim.log.levels.ERROR)
    return
  end

  M.send({ type = 'open', docId = doc_id })
end

-- Close current document
function M.close_document()
  if not M.state.doc_id then
    vim.notify('[collab] No document open', vim.log.levels.WARN)
    return
  end

  M.send({ type = 'close' })
  M.detach_buffer()
  M.state.doc_id = nil
end

-- Show connection info
function M.show_info()
  M.send({ type = 'info' })
  if M.config.debug then
    local parts = {
      'connected=' .. tostring(M.state.connected),
      'doc=' .. (M.state.doc_id or 'none'),
      'user=' .. (M.state.user_id or 'unknown'),
      'sync=' .. (M.config.sync_url or 'n/a'),
      'awareness=' .. (M.config.awareness_url or 'n/a'),
    }
    vim.notify('[collab] ' .. table.concat(parts, ' | '), vim.log.levels.INFO)
  end
end

-- Handle stdout from helper
function M.on_stdout(data)
  for _, line in ipairs(data) do
    if line ~= '' then
      local ok, msg = pcall(vim.fn.json_decode, line)
      if ok then
        M.handle_message(msg)
      elseif M.config.debug then
        vim.notify('[collab] Invalid JSON: ' .. line, vim.log.levels.DEBUG)
      end
    end
  end
end

-- Handle message from helper
function M.handle_message(msg)
  if M.config.debug then
    vim.notify('[collab] Received: ' .. vim.fn.json_encode(msg), vim.log.levels.DEBUG)
  end

  if msg.type == 'connected' then
    M.state.connected = true
    M.state.user_id = msg.userId
    vim.notify('[collab] Connected as ' .. msg.userId, vim.log.levels.INFO)

  elseif msg.type == 'disconnected' then
    M.state.connected = false
    M.state.doc_id = nil
    vim.notify('[collab] Disconnected', vim.log.levels.INFO)

  elseif msg.type == 'created' then
    M.state.doc_id = msg.docId
    vim.notify('[collab] Created document: ' .. msg.docId, vim.log.levels.INFO)
    M.attach_buffer('')

  elseif msg.type == 'opened' then
    M.state.doc_id = msg.docId
    vim.notify('[collab] Opened document: ' .. msg.docId, vim.log.levels.INFO)
    M.attach_buffer(msg.content or '')

  elseif msg.type == 'changed' then
    M.apply_remote_change(msg.content or '')

  elseif msg.type == 'closed' then
    M.state.doc_id = nil
    M.detach_buffer()
    vim.notify('[collab] Document closed', vim.log.levels.INFO)

  elseif msg.type == 'cursor' then
    -- Remote cursor update - display in buffer
    if msg.anchor ~= nil then
      M.show_remote_cursor(msg.userId, msg.name, msg.color, msg.anchor, msg.head)
    end
    if M.config.debug then
      vim.notify('[collab] Cursor from ' .. (msg.name or msg.userId), vim.log.levels.DEBUG)
    end

  elseif msg.type == 'info' then
    local info = string.format(
      '[collab] Connected: %s | Doc: %s | User: %s',
      tostring(msg.connected),
      msg.docId or 'none',
      msg.userName or 'unknown'
    )
    vim.notify(info, vim.log.levels.INFO)

  elseif msg.type == 'error' then
    vim.notify('[collab] Error: ' .. (msg.message or 'unknown'), vim.log.levels.ERROR)
  end
end

-- Attach to current buffer for collaboration
function M.attach_buffer(initial_content)
  local bufnr = vim.api.nvim_get_current_buf()
  M.state.bufnr = bufnr
  M.state.last_sent_tick = vim.api.nvim_buf_get_changedtick(bufnr)

  -- Set buffer content
  M.state.ignore_changes = true
  local lines = vim.split(initial_content, '\n', { plain = true })
  vim.api.nvim_buf_set_lines(bufnr, 0, -1, false, lines)
  M.state.ignore_changes = false

  -- Set buffer options
  vim.bo[bufnr].modified = false
  vim.bo[bufnr].buftype = 'nofile'

  -- Attach to buffer changes
  local function send_buffer_if_changed(reason)
    if M.state.ignore_changes then
      if M.config.debug then
        vim.notify(string.format('[collab] skip send (%s): ignoring changes', reason or 'unknown'), vim.log.levels.DEBUG)
      end
      return
    end
    if bufnr ~= M.state.bufnr then
      return
    end
    local tick = vim.api.nvim_buf_get_changedtick(bufnr)
    if tick == M.state.last_sent_tick then
      if M.config.debug then
        vim.notify(string.format('[collab] skip send (%s): tick unchanged (%d)', reason or 'unknown', tick), vim.log.levels.DEBUG)
      end
      return
    end
    M.state.last_sent_tick = tick

    local lines = vim.api.nvim_buf_get_lines(bufnr, 0, -1, false)
    local content = table.concat(lines, '\n')
    if M.config.debug then
      vim.notify(string.format('[collab] send (%s): tick %d len %d', reason or 'unknown', tick, #content), vim.log.levels.DEBUG)
    end
    M.send({ type = 'edit', content = content })
  end

  vim.api.nvim_buf_attach(bufnr, false, {
    on_lines = function(_, buf, _, _, _, _, _)
      if buf ~= bufnr then
        return
      end
      send_buffer_if_changed('on_lines')
    end,
    on_bytes = function(_, buf, _, _, _, _, _, _)
      if buf ~= bufnr then
        return
      end
      send_buffer_if_changed('on_bytes')
    end,
    on_detach = function()
      if M.state.bufnr == bufnr then
        M.state.bufnr = nil
      end
    end,
  })

  vim.api.nvim_create_autocmd({'TextChanged', 'TextChangedI'}, {
    buffer = bufnr,
    callback = function()
      send_buffer_if_changed('TextChanged')
    end,
  })

  -- Track cursor movements
  vim.api.nvim_create_autocmd({'CursorMoved', 'CursorMovedI'}, {
    buffer = bufnr,
    callback = function()
      local cursor = vim.api.nvim_win_get_cursor(0)
      local row = cursor[1]  -- 1-indexed
      local col = cursor[2]  -- 0-indexed

      local all_lines = vim.api.nvim_buf_get_lines(bufnr, 0, -1, false)
      if #all_lines == 0 then
        all_lines = { '' }
      end

      local function clamp_pos(lnum, c)
        local lnum_clamped = math.max(1, math.min(lnum, #all_lines))
        local line = all_lines[lnum_clamped] or ""
        local col_clamped = math.max(0, math.min(c, #line))
        return lnum_clamped, col_clamped
      end

      local function offset_from_pos(lnum, c)
        local lnum_clamped, col_clamped = clamp_pos(lnum, c)
        local offset = 0
        for i = 1, lnum_clamped - 1 do
          offset = offset + #all_lines[i] + 1
        end
        return offset + col_clamped
      end

      local offset = offset_from_pos(row, col)

      local selection = nil
      local mode = vim.fn.mode(1)
      local visual_prefix = mode:sub(1, 1)
      if visual_prefix == 'v' or visual_prefix == 'V' or visual_prefix == '\22' then
        local anchor_pos = vim.fn.getpos('v')
        local anchor_row = anchor_pos[2]
        local anchor_col = math.max(0, (anchor_pos[3] or 1) - 1)

        selection = {
          anchor = offset_from_pos(anchor_row, anchor_col),
          head = offset,
        }
      end

      local message = { type = 'cursor', offset = offset }
      if selection then
        message.selection = selection
      end

      M.send(message)
    end,
  })


  if M.config.debug then
    vim.notify('[collab] Attached to buffer ' .. bufnr, vim.log.levels.DEBUG)
  end
end

-- Detach from current buffer
function M.detach_buffer()
  M.state.bufnr = nil
  M.state.remote_cursors = {}
  M.state.remote_selections = {}
  -- Note: nvim_buf_attach doesn't have a direct detach, 
  -- but returning true from on_lines would detach
end

-- Apply remote change to buffer
function M.apply_remote_change(content)
  if not M.state.bufnr then
    return
  end

  local bufnr = M.state.bufnr

  -- Check if buffer still exists
  if not vim.api.nvim_buf_is_valid(bufnr) then
    M.state.bufnr = nil
    return
  end

  -- Get current content
  local current_lines = vim.api.nvim_buf_get_lines(bufnr, 0, -1, false)
  local current_content = table.concat(current_lines, '\n')

  -- Only update if different
  if content == current_content then
    return
  end

  -- Apply change
  M.state.ignore_changes = true
  
  -- Save cursor position
  local cursor = vim.api.nvim_win_get_cursor(0)
  
  local lines = vim.split(content, '\n', { plain = true })
  vim.api.nvim_buf_set_lines(bufnr, 0, -1, false, lines)
  
  -- Restore cursor position (clamped to valid range)
  local line_count = vim.api.nvim_buf_line_count(bufnr)
  local new_row = math.min(cursor[1], line_count)
  local new_line = vim.api.nvim_buf_get_lines(bufnr, new_row - 1, new_row, false)[1] or ''
  local new_col = math.min(cursor[2], #new_line)
  vim.api.nvim_win_set_cursor(0, { new_row, new_col })
  
  M.state.ignore_changes = false
end

-- Handle helper exit
function M.on_exit(code)
  M.state.job_id = nil
  M.state.connected = false
  M.state.doc_id = nil
  
  if code ~= 0 then
    vim.notify('[collab] Helper exited with code ' .. code, vim.log.levels.WARN)
  end
end

return M
