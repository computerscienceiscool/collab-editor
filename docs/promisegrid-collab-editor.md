
# PromiseGrid Collaborative Editor Architecture

## Overview

This collaborative text editor is a community system component of PromiseGrid, implementing real-time multi-user document editing with content-addressable storage integration.

## Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                      User Interface                         │
│              (CodeMirror 6 Editor + UI)                     │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                   CRDT Layer (Automerge)                    │
│  - Conflict-free replicated data type                      │
│  - Handles concurrent edits                                │
│  - Maintains causal consistency                            │
└────────────────────────┬────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Network    │  │   Storage    │  │  Awareness   │
│ (WebSocket)  │  │ (IndexedDB)  │  │ (WebSocket)  │
│  Port 1234   │  │   Browser    │  │  Port 1235   │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │                 │                 │
       ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Automerge    │  │  PromiseBase │  │  Awareness   │
│ Sync Server  │  │   (Future)   │  │    Server    │
└──────────────┘  └──────────────┘  └──────────────┘
```

## Component Responsibilities

### CRDT Layer (Automerge)
- **Purpose**: Conflict-free replicated data type for collaborative editing
- **Why**: Handles concurrent edits from multiple users without conflicts
- **Technology**: @automerge/automerge 2.2.8
- **Key Features**:
  - Automatic merge of concurrent changes
  - Causal consistency across all clients
  - Operation-based CRDT for text editing
  - Full history tracking (Merkle DAG)

### Storage Layer (Dual System)

#### IndexedDB (Browser, Temporary)
- **Purpose**: Client-side persistence for active editing sessions
- **Lifespan**: Per-browser, cleared when user clears data
- **Contains**: Current document state, recent history
- **Technology**: @automerge/automerge-repo-storage-indexeddb

#### PromiseBase (Grid, Permanent)
- **Purpose**: Content-addressable permanent storage
- **Lifespan**: Permanent, immutable, replicated across grid
- **Contains**: Document snapshots as content-addressed blocks
- **Integration**: Future - periodic snapshots from Automerge to PromiseBase

### Network Layer (Dual Protocol)

#### Automerge Sync (Port 1234)
- **Purpose**: Synchronize document changes between clients
- **Protocol**: CBOR binary format (Automerge native)
- **Server**: @automerge/automerge-repo-sync-server
- **Data**: Document operations and state synchronization

#### Awareness (Port 1235)
- **Purpose**: Share user presence, cursors, typing indicators
- **Protocol**: JSON text format (custom implementation)
- **Server**: Custom WebSocket relay (awareness-server.js)
- **Data**: User metadata (name, color, cursor position, typing state)

## Room-Based Collaboration

### Current Implementation (Phase 1)

```
User opens URL: ?room=meeting-notes
         ↓
Hash room name to create deterministic ID
         ↓
Room ID: hash("room:meeting-notes") → base58 encoded
         ↓
Automerge document ID: automerge:[base58]
         ↓
All clients with same room name get same document ID
         ↓
Automerge sync server coordinates changes
```

### Room Name Mapping Strategy

**Human-Readable Names**:
- URL parameter: `?room=meeting-notes`
- Deterministic hash: `hash("room:meeting-notes")`
- Same name always generates same document ID
- Multiple users typing "meeting-notes" collaborate in same room

**Why This Works**:
1. Deterministic: Same input always produces same output
2. Decentralized: No central registry needed
3. Conflict-free: Same name = intentional collaboration
4. Simple: Users can share room names verbally

**Alternative for Private Rooms**:
- Use UUIDs: `?room=87f32ab3-870f-440c-9138-96d55977aaa1`
- Still deterministic hash to Automerge doc ID
- Unguessable room names for privacy

### Future Implementation (Phase 2): PromiseBase Integration

```
User types in editor
         ↓
Automerge CRDT updates
         ↓
Every N seconds: snapshot to PromiseBase
         ↓
Content hash: zb2rhe5P4gXftAwvA4eXQ5HJwsER2owDyS9sKaQRRVQPn93bA
         ↓
Merkle tree: room name → [CID1, CID2, CID3, ...]
         ↓
Tree stored in PromiseBase
         ↓
Mutable ref: "meeting-notes" → latest CID
```

**Versioning Through Merkle Trees**:
```
meeting-notes (mutable pointer)
    ↓
zb2rhA... (current version, 2:45 PM)
    ↓ parent
zb2rhB... (previous version, 2:30 PM)
    ↓ parent  
zb2rhC... (earlier version, 2:15 PM)
    ...
```

Each version is immutable. The room name is a mutable pointer to the latest version.

## Content Addressing Philosophy

### Why Content-Addressable Storage

From PromiseBase principles:
- **Deduplication**: Identical content stored once
- **Verification**: Content hash proves integrity
- **Immutability**: Cannot change without changing address
- **Distribution**: Content can be cached anywhere

### Application to Documents

**Every keystroke creates new content**:
```
Version 1: "Hello"      → CID: abc123...
Version 2: "Hello w"    → CID: abc124...
Version 3: "Hello wo"   → CID: abc125...
Version 4: "Hello wor"  → CID: abc126...
Version 5: "Hello world"→ CID: abc127...
```

**Merkle tree tracks relationships**:
```
Version 5 → parent: Version 4
Version 4 → parent: Version 3
Version 3 → parent: Version 2
Version 2 → parent: Version 1
Version 1 → parent: null (genesis)
```

**Room name resolves to latest**:
```
"meeting-notes" → CID: abc127... (Version 5)
```

But you can still access any historical version by its CID.

## Synchronization Flow

### Real-Time Editing (Current)

```
Browser A                 Sync Server              Browser B
    │                          │                       │
    │ 1. User types "H"        │                       │
    ├─────────────────────────►│                       │
    │   Automerge change       │                       │
    │                          │                       │
    │                          ├──────────────────────►│
    │                          │  Forward change       │
    │                          │                       │
    │                          │                  2. Apply "H"
    │                          │                  Update editor
    │                          │                       │
    │                     3. User types "e"            │
    │                          │◄──────────────────────┤
    │                          │   Automerge change    │
    │                          │                       │
    │◄─────────────────────────┤                       │
    │    Forward change        │                       │
    │                          │                       │
4. Apply "e"                   │                       │
Update editor                  │                       │
```

### Future: Snapshot to PromiseBase

```
Every 30 seconds or on save:
    1. Get current Automerge document state
    2. Serialize to bytes
    3. Hash content → CID
    4. Store in PromiseBase
    5. Update Merkle tree: append new CID
    6. Update mutable ref: room name → new CID
```

## Text Operations in Automerge

### Critical Implementation Detail

Automerge 2.x does NOT use `Automerge.Text` objects. It uses regular JavaScript strings with special operations.

**WRONG (Old Automerge 1.x style)**:
```javascript
d.content = new Automerge.Text();
d.content.insertAt(0, "hello");
d.content.deleteAt(5);
```

**CORRECT (Automerge 2.x style)**:
```javascript
// Initialize as empty string
d.content = "";

// Use Automerge.splice for ALL text operations
Automerge.splice(d, ['content'], 0, 0, ...'hello');

// Replace entire content
const oldLen = d.content.length;
Automerge.splice(d, ['content'], 0, oldLen, ...newText);
```

### Why Automerge.splice?

`Automerge.splice()` is the ONLY method for modifying text in Automerge 2.x:

**Signature**:
```javascript
Automerge.splice(doc, path, index, deleteCount, ...insertItems)
```

**Parameters**:
- `doc`: The Automerge document being modified
- `path`: Array path to the field (e.g., `['content']`)
- `index`: Position to start modification
- `deleteCount`: Number of characters to delete
- `insertItems`: Characters to insert (spread operator)

**Examples**:
```javascript
// Insert "hello" at position 0
Automerge.splice(d, ['content'], 0, 0, ...'hello');

// Delete 5 characters at position 0
Automerge.splice(d, ['content'], 0, 5);

// Replace entire content
const oldLen = d.content.length;
Automerge.splice(d, ['content'], 0, oldLen, ...newText);

// Insert " world" after "hello"
Automerge.splice(d, ['content'], 5, 0, ...' world');
```

## Port Configuration

### Why Two Separate Ports

Automerge sync and awareness use incompatible protocols:

**Port 1234: Automerge Sync**
- Protocol: CBOR binary encoding
- Purpose: Document state synchronization
- Server: Official @automerge/automerge-repo-sync-server
- Data: Compressed document operations
- Cannot handle JSON messages

**Port 1235: Awareness**
- Protocol: JSON text encoding  
- Purpose: User presence information
- Server: Custom WebSocket relay (awareness-server.js)
- Data: User metadata (name, color, cursor, typing)
- Cannot handle CBOR messages

**What Happens If Mixed**:
```
Browser sends JSON to port 1234
    ↓
Sync server expects CBOR
    ↓
Decode error: "JavaScript does not support arrays with length over 4294967295"
    ↓
Server crashes
```

## PromiseGrid Integration Points

### Current State (Phase 1)
- Automerge provides CRDT for real-time collaboration
- IndexedDB provides browser-local persistence
- WebSocket sync server coordinates between clients
- No PromiseBase integration yet

### Near Future (Phase 2)
- Periodic snapshots to PromiseBase
- Merkle tree tracks document history
- Mutable refs map room names to current CID
- Still using Automerge for real-time sync

### Long Term (Phase 3)
- PromiseBase as primary storage
- Automerge as overlay for active editing
- Grid-wide document replication
- Capability-based access control
- Merge-as-consensus for conflict resolution
- LLM-assisted merge for complex conflicts

## Governance and Consensus

### Collaborative Editing as Consensus

In PromiseGrid terms, collaborative editing is a consensus problem:
- Multiple users propose changes (edits)
- System must merge all changes into coherent document
- Automerge CRDT provides automatic merge
- Conflicts are rare but possible

### Merge Strategy

**Automerge automatic merge**:
- Character-level CRDT
- Concurrent inserts at same position: both preserved
- Concurrent deletes: tombstones prevent conflicts
- Last-writer-wins for property updates

**Future PromiseGrid merge functions**:
- Semantic merge (understand code structure)
- LLM-assisted merge (understand intent)
- Human intervention (when automation fails)
- Cascade: CRDT → semantic → LLM → human

## Security Model

### Current (Development)
- No authentication
- No authorization  
- Room names provide security through obscurity
- Anyone with room name can join

### Future (Production)

**Capability-based security** (PromiseGrid model):
```
Room creator generates capability token
    ↓
Token = hash(closure that grants access)
    ↓
Token shared with collaborators
    ↓
Collaborators present token to join
    ↓
Room owner can revoke token
```

**Access levels via capabilities**:
- Read capability: view document
- Write capability: edit document  
- Admin capability: manage collaborators
- Fork capability: create derivative document

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│  User Types "H"                                              │
│       ↓                                                       │
│  CodeMirror Input Event                                      │
│       ↓                                                       │
│  editorSetup.js: view.dom.addEventListener('input')          │
│       ↓                                                       │
│  handle.change(d => {                                        │
│    Automerge.splice(d, ['content'], 0, oldLen, ...newText)  │
│  })                                                          │
│       ↓                                                       │
│  Automerge creates operation:                                │
│    { action: 'set', obj: '...', key: 0, value: 'H' }        │
│       ↓                                                       │
│  Automerge repo queues sync                                  │
│       ↓                                                       │
│  BrowserWebSocketClientAdapter sends to port 1234            │
│       ↓                                                       │
│  Sync server receives CBOR message                           │
│       ↓                                                       │
│  Sync server broadcasts to other clients                     │
│       ↓                                                       │
│  Other clients receive operation                             │
│       ↓                                                       │
│  handle.on('change', ({ doc }) => { ... })                   │
│       ↓                                                       │
│  Update CodeMirror:                                          │
│    view.dispatch({ changes: { ... insert: newText } })       │
│       ↓                                                       │
│  User sees "H" appear in editor                              │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
collab-editor/
├── src/
│   ├── app.js                  # Main initialization
│   ├── setup/
│   │   ├── automergeSetup.js   # Automerge repo + awareness
│   │   ├── editorSetup.js      # CodeMirror + text sync
│   │   ├── userSetup.js        # User name/color controls
│   │   └── documentCopy.js     # Copy document functionality
│   ├── ui/
│   │   ├── userList.js         # Active users display
│   │   ├── logging.js          # User join/leave events
│   │   ├── typingIndicator.js  # Who is typing display
│   │   └── remoteCursorPlugin.js # Show other users' cursors
│   └── export/
│       └── handlers.js         # Save/export functionality
├── awareness-server.js         # Port 1235 WebSocket relay
├── Makefile                    # Build and run commands
└── package.json                # Dependencies
```

## Makefile Targets

All port configuration is centralized in Makefile:

```makefile
AWARENESS_PORT=1235  # Custom awareness relay
WS_PORT=1234         # Automerge sync server
PORT=8080            # Vite dev server
```

**Common commands**:
```bash
make dev-all        # Start all services + open browser
make ws             # Start Automerge sync server (port 1234)
make awareness      # Start awareness server (port 1235)
make serve          # Start Vite dev server (port 8080)
make stop           # Kill all services
```

## Testing Strategy

### Manual Testing
1. Open URL: `http://localhost:8080/?room=test`
2. Open second tab: `http://localhost:8080/?room=test`
3. Type in tab 1 → should appear in tab 2
4. Check console for errors
5. Verify user list shows 2 users
6. Check awareness (cursor positions, typing indicators)

### Expected Console Output (Success)
```
[Automerge] Waiting for handle to be ready...
[Automerge] Handle is ready!
[Automerge] Repository initialized for room: test
[Awareness] WebSocket connected on port 1235
CodeMirror editor initialized with Automerge
[UserList] Displayed 1 users
```

### Common Errors and Fixes

**"value was not a string"**:
- Cause: Using `new Automerge.Text()`
- Fix: Initialize as `d.content = ""`

**"insertAt is not a function"**:
- Cause: Trying to use Automerge 1.x API
- Fix: Use `Automerge.splice()` instead

**CBOR decode error**:
- Cause: JSON sent to CBOR port or vice versa
- Fix: Ensure port 1234 = CBOR, port 1235 = JSON

**Handle never ready**:
- Cause: Sync server not running or wrong port
- Fix: Check `npx @automerge/automerge-repo-sync-server --port 1234` is running

## Future Enhancements

### PromiseBase Snapshots
- Periodic saves to content-addressable storage
- Merkle tree for version history
- Time-travel through document history
- Cross-device sync via grid replication

### Advanced Collaboration
- Rich presence (user status, focus)
- Threaded comments
- Change tracking and review
- Branching and merging documents

### Grid Integration
- Capability-based access control
- Distributed execution of editor
- WASM compilation for performance
- LLM-assisted writing features

### Governance Features
- Collaborative decision making
- Voting on document changes
- Reputation tracking for contributors
- Automated moderation

## References

- PromiseGrid: https://github.com/stevegt/grid-cli
- PromiseBase: (internal repository)
- Automerge: https://automerge.org/
- CodeMirror: https://codemirror.net/
- Multiformats: https://multiformats.io/

## Contact

This collaborative editor is developed as part of PromiseGrid by the community systems team. For questions or contributions, contact the PromiseGrid team.
