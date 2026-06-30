// File: docs/server-protocol-example.go
// This is an EXAMPLE showing what your Automerge collab-editor server needs to implement
// to work with the Neovim plugin. This is NOT a complete implementation.

package main

/*
SERVER PROTOCOL REQUIREMENTS

Your Automerge-based collab-editor server needs to handle these messages
from the Neovim plugin (via the go-helper WebSocket bridge).

The protocol is based on Teamtype/Ethersync's editor protocol.
See: https://teamtype.github.io/teamtype/editor-plugin-dev-guide.html
*/

// ============================================================================
// DATA TYPES
// ============================================================================

// Position represents a position in a text document
// Line and Character are 0-indexed
// Character is in Unicode characters (not bytes!)
type Position struct {
	Line      int `json:"line"`
	Character int `json:"character"`
}

// Range represents a range in a text document
// For selections, End is the active/movable end
type Range struct {
	Start Position `json:"start"`
	End   Position `json:"end"`
}

// Edit represents a single text edit
type Edit struct {
	Range       Range  `json:"range"`
	Replacement string `json:"replacement"`
}

// Delta is an array of non-overlapping edits
// All ranges refer to the document state BEFORE any edits in this delta
type Delta []Edit

// ============================================================================
// MESSAGES FROM EDITOR TO SERVER
// ============================================================================

// OpenRequest - Editor wants to open a document for collaboration
// The server should:
// 1. Check if the document exists/is allowed
// 2. If content differs from server state, send edits back to sync
// 3. Start sending updates for this document to this client
type OpenRequest struct {
	Method string `json:"method"` // "open"
	Params struct {
		URI     string `json:"uri"`     // e.g., "file:///path/to/file.txt"
		Content string `json:"content"` // Editor's current buffer content
	} `json:"params"`
}

// CloseRequest - Editor is closing the document
// Stop sending updates to this client for this document
type CloseRequest struct {
	Method string `json:"method"` // "close"
	Params struct {
		URI string `json:"uri"`
	} `json:"params"`
}

// EditRequest - Editor made changes to the document
// revision = last revision received from server (used for conflict detection)
type EditRequest struct {
	Method string `json:"method"` // "edit"
	Params struct {
		URI      string `json:"uri"`
		Revision int    `json:"revision"` // Last seen server revision
		Delta    Delta  `json:"delta"`
	} `json:"params"`
}

// CursorRequest - Editor's cursor position changed
type CursorRequest struct {
	Method string `json:"method"` // "cursor"
	Params struct {
		URI    string  `json:"uri"`
		Ranges []Range `json:"ranges"` // Multiple ranges for multi-cursor
	} `json:"params"`
}

// ============================================================================
// MESSAGES FROM SERVER TO EDITOR (Notifications)
// ============================================================================

// EditNotification - Another user made changes
// revision = last revision received from THIS editor
// If editor's revision != this, editor should IGNORE (will be retried)
type EditNotification struct {
	Method string `json:"method"` // "edit"
	Params struct {
		URI      string `json:"uri"`
		Revision int    `json:"revision"` // Last seen editor revision
		Delta    Delta  `json:"delta"`
	} `json:"params"`
}

// CursorNotification - Another user's cursor moved
type CursorNotification struct {
	Method string `json:"method"` // "cursor"
	Params struct {
		UserID string  `json:"userid"`
		Name   string  `json:"name,omitempty"` // Display name
		URI    string  `json:"uri"`
		Ranges []Range `json:"ranges"`
	} `json:"params"`
}

// ============================================================================
// REVISION SYSTEM (Critical for conflict handling!)
// ============================================================================

/*
Each document tracks TWO revisions per client:

1. Editor Revision: How many edits the editor has sent
   - Incremented by editor after each local edit
   - Sent by server in EditNotification.revision
   - If mismatch, editor ignores the notification (server will retry)

2. Daemon/Server Revision: How many edits the editor has received
   - Incremented by editor after applying each remote edit
   - Sent by editor in EditRequest.revision
   - Server uses this to know which edits the editor has seen

CONFLICT RESOLUTION FLOW:

1. Editor sends edit with revision=5 (last server revision it saw)
2. Server receives edit
3. If server's current revision for this editor != 5:
   - Server transforms the edit against intervening changes
   - Or rejects and will retry after editor catches up
4. Server applies edit to Automerge document
5. Server broadcasts EditNotification to other editors with their last known revision

The key insight: Automerge handles the actual CRDT merging.
The revision numbers just ensure edits are applied in the right order
and that conflicts are detected at the protocol level.
*/

// ============================================================================
// EXAMPLE HANDLER PSEUDOCODE
// ============================================================================

/*
func handleWebSocket(conn *websocket.Conn) {
    // Get room from query params
    room := conn.Query("room")
    
    // Create/join room in your Automerge system
    doc := getOrCreateDocument(room)
    
    // Track revisions for this client
    clientRevisions := map[string]struct{
        editorRevision int
        daemonRevision int
    }{}
    
    for {
        msg := conn.ReadJSON()
        
        switch msg.Method {
        case "open":
            uri := msg.Params.URI
            content := msg.Params.Content
            
            // Initialize revision tracking
            clientRevisions[uri] = {0, 0}
            
            // Compare with Automerge doc state
            serverContent := doc.GetText(uri)
            if content != serverContent {
                // Send diff as edit notification
                delta := computeDelta(content, serverContent)
                conn.WriteJSON(EditNotification{
                    Method: "edit",
                    Params: {
                        URI: uri,
                        Revision: 0, // Editor hasn't sent anything yet
                        Delta: delta,
                    },
                })
                clientRevisions[uri].daemonRevision++
            }
            
        case "edit":
            uri := msg.Params.URI
            revision := msg.Params.Revision
            delta := msg.Params.Delta
            
            rev := clientRevisions[uri]
            
            // Check if editor is in sync
            if revision != rev.daemonRevision {
                // Editor is behind, they'll catch up
                // Could transform the edit, or just wait
                continue
            }
            
            // Apply to Automerge document
            applyDeltaToAutomerge(doc, uri, delta)
            
            // Track that editor sent an edit
            rev.editorRevision++
            
            // Broadcast to other clients
            for otherConn := range room.Clients {
                if otherConn != conn {
                    otherRev := otherConn.revisions[uri]
                    otherConn.WriteJSON(EditNotification{
                        Method: "edit",
                        Params: {
                            URI: uri,
                            Revision: otherRev.editorRevision,
                            Delta: delta, // May need transformation
                        },
                    })
                    otherRev.daemonRevision++
                }
            }
            
        case "cursor":
            // Broadcast to other clients
            for otherConn := range room.Clients {
                if otherConn != conn {
                    otherConn.WriteJSON(CursorNotification{
                        Method: "cursor",
                        Params: {
                            UserID: conn.UserID,
                            Name: conn.UserName,
                            URI: msg.Params.URI,
                            Ranges: msg.Params.Ranges,
                        },
                    })
                }
            }
            
        case "close":
            delete(clientRevisions, msg.Params.URI)
        }
    }
}
*/

// ============================================================================
// INTEGRATION WITH YOUR AUTOMERGE SERVER
// ============================================================================

/*
Your collab-editor already uses Automerge. You need to add:

1. A WebSocket endpoint that accepts connections with ?room=<roomid>
2. Message parsing for open/close/edit/cursor
3. Revision tracking per client per document
4. Broadcasting edits and cursors to other clients

The Automerge part you already have handles:
- Actual CRDT merge logic
- Conflict resolution at the data level
- Document persistence

The protocol layer (what you need to add) handles:
- Which edits each client has seen
- Detecting when clients are out of sync
- Cursor position sharing

This separation is why Teamtype/Ethersync can work with multiple editors -
the protocol is simple enough that each editor plugin just needs to:
1. Track two revision numbers
2. Send edits as deltas
3. Apply incoming deltas to the buffer
4. Display remote cursors
*/
