-- File: nvim/lua/collab-editor/protocol.lua
-- Protocol handling for communication with Automerge collab-editor server
-- Uses Teamtype-style JSON-RPC messages

local M = {}

local request_id = 0

-- Generate unique request ID
local function next_id()
    request_id = request_id + 1
    return request_id
end

-- Send raw message to go-helper via stdin
local function send_raw(msg)
    local init = require('collab-editor')
    local job_id = init.get_job_id()

    if not job_id then
        vim.notify('[collab-editor] Not connected', vim.log.levels.WARN)
        return false
    end

    local json = vim.fn.json_encode(msg)
    vim.fn.chansend(job_id, json .. '\n')
    return true
end

-- Send a request (expects response)
function M.send_request(method, params, callback)
    local id = next_id()
    local msg = {
        id = id,
        method = method,
        params = params,
    }

    -- TODO: Store callback for response handling
    -- For now, just send and ignore response

    return send_raw(msg)
end

-- Send a notification (no response expected)
function M.send_notification(method, params)
    local msg = {
        method = method,
        params = params,
    }
    return send_raw(msg)
end

-----------------------------------------------------------
-- High-level protocol methods
-----------------------------------------------------------

-- Open a document for collaboration
-- @param uri string: Document URI (e.g., "file:///path/to/file.txt")
-- @param content string: Current document content
function M.send_open(uri, content)
    return M.send_request('open', {
        uri = uri,
        content = content,
    })
end

-- Close a document
-- @param uri string: Document URI
function M.send_close(uri)
    return M.send_request('close', {
        uri = uri,
    })
end

-- Send an edit to the server
-- @param uri string: Document URI
-- @param revision number: Last seen daemon revision
-- @param delta table: Array of edits [{range: {start: pos, end: pos}, replacement: string}]
function M.send_edit(uri, revision, delta)
    return M.send_notification('edit', {
        uri = uri,
        revision = revision,
        delta = delta,
    })
end

-- Send cursor position update
-- @param uri string: Document URI
-- @param ranges table: Array of cursor ranges [{start: pos, end: pos}]
function M.send_cursor(uri, ranges)
    return M.send_notification('cursor', {
        uri = uri,
        ranges = ranges,
    })
end

-- Send ping (for keepalive)
function M.send_ping()
    return M.send_request('ping', {})
end

-- Send disconnect request
function M.send_disconnect()
    return M.send_notification('disconnect', {})
end

-----------------------------------------------------------
-- Delta computation helpers
-----------------------------------------------------------

-- Create a position object
-- @param line number: 0-indexed line number
-- @param character number: 0-indexed character (Unicode) position
function M.make_position(line, character)
    return {
        line = line,
        character = character,
    }
end

-- Create a range object
-- @param start_line number
-- @param start_char number
-- @param end_line number
-- @param end_char number
function M.make_range(start_line, start_char, end_line, end_char)
    return {
        start = M.make_position(start_line, start_char),
        ['end'] = M.make_position(end_line, end_char), -- 'end' is a Lua keyword
    }
end

-- Create an edit object
-- @param range table: Range object
-- @param replacement string: Text to insert (empty string for deletion)
function M.make_edit(range, replacement)
    return {
        range = range,
        replacement = replacement or '',
    }
end

-- Create a simple single-edit delta
-- @param start_line number
-- @param start_char number
-- @param end_line number
-- @param end_char number
-- @param replacement string
function M.make_simple_delta(start_line, start_char, end_line, end_char, replacement)
    return {
        M.make_edit(
            M.make_range(start_line, start_char, end_line, end_char),
            replacement
        )
    }
end

return M
