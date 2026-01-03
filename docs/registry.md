# Registry Document

## Purpose

The registry document is a **temporary solution** to enable room-based collaboration in the collaborative editor while we wait for PromiseGrid/PromiseBase to implement mutable references.

## The Problem

Users need to share collaborative editing sessions using simple room names:

```
User A: "Join me in room 'meeting-notes'"
User B: Opens http://localhost:8080/?room=meeting-notes
Result: Both users should edit the same document
```

**The fundamental issue:**

Automerge uses document IDs like `automerge:2Wvx7G4Kj...` (random, 40+ characters)
- Too long to share verbally
- Too complex to type
- Not human-memorable

But room names like "meeting-notes" or UUIDs like "abc-123-def" are:
- Short and shareable
- Easy to communicate
- Human-readable

**The gap:**
We need to map: `room name → Automerge document ID`

## Why Not Other Solutions?

### Option: Store mapping in localStorage/IndexedDB
**Problem**: Per-browser only
- User A's browser has the mapping
- User B's browser doesn't
- Cannot share between different machines
- **Not decentralized**

### Option: Modify sync server to handle rooms
**Problem**: Requires server-side logic
- Server would assign rooms to document IDs
- Creates central authority
- **Not decentralized**
- **Waiting on PromiseGrid team to implement**

### Option: Put document ID in URL
**Problem**: Unusable UX
```
User A: "Join me at http://localhost:8080/?doc=automerge:2Wvx7G4KjMp..."
User B: "Can you repeat that?"
```
- Cannot share verbally
- Error-prone to type
- **Breaks user experience**

### Option: Wait for PromiseBase mutable refs
**Problem**: Blocks development
- PromiseBase will eventually solve this with mutable pointers
- Like Git: `refs/rooms/meeting-notes → commit hash`
- Timeline unknown
- **Cannot make progress now**

## The Registry Document Solution

### What It Is

A special shared Automerge document that all clients sync. It contains a simple mapping:

```javascript
{
  "meeting-notes": "automerge:2Wvx7G4KjMp...",
  "project-planning": "automerge:7Qz3N9FxLk...",
  "daily-standup": "automerge:8Rw5M2HyPn..."
}
```

### How It Works

```
Client A opens ?room=meeting-notes
    ↓
1. Connect to well-known registry document
    ↓
2. Check if "meeting-notes" exists in registry
    ↓
3a. NOT FOUND: Create new document, write mapping to registry
3b. FOUND: Use existing document ID from registry
    ↓
4. Open the document and start editing
    ↓
Registry syncs via Automerge CRDT to all clients
    ↓
Client B opens ?room=meeting-notes
    ↓
1. Connect to same registry document
    ↓
2. Check if "meeting-notes" exists
    ↓
3. FOUND: Use document ID from registry
    ↓
4. Open same document as Client A
    ↓
Both clients now editing same document
```

### Why It's Decentralized

**No central authority:**
- Registry is just another Automerge CRDT document
- All clients have full copy
- Sync server is dumb relay (only passes bytes)
- No server makes decisions

**Handles conflicts automatically:**
- If two clients create "meeting-notes" simultaneously
- Automerge CRDT merges both writes
- Last-write-wins for the mapping (or we can implement merge logic)
- No coordination needed

**Works offline:**
- Client can create rooms while disconnected
- Registry syncs when reconnected
- Automerge merges changes

**Fully peer-to-peer compatible:**
- Registry can sync via any Automerge network adapter
- WebSocket, BroadcastChannel, future P2P adapters
- No dependency on specific server implementation

## Implementation Details

### Registry Document ID

The registry needs a well-known document ID that all clients use. We generate it deterministically:

```javascript
// Hash a known string to get consistent document ID
const REGISTRY_SEED = "promisegrid:registry:v1";
const registryDocId = await hashToAutomergeId(REGISTRY_SEED);
// Result: automerge:3Kx7M2HyPn... (always the same)
```

**Why deterministic:**
- All clients compute same ID independently
- No configuration needed
- No coordination required
- Truly decentralized

### Registry Document Structure

```javascript
{
  rooms: {
    "meeting-notes": {
      documentId: "automerge:2Wvx7G4KjMp...",
      created: 1704067200000,
      createdBy: "client-uuid-abc"
    },
    "project-planning": {
      documentId: "automerge:7Qz3N9FxLk...",
      created: 1704153600000,
      createdBy: "client-uuid-def"
    }
  }
}
```

Metadata helps with:
- Debugging (who created the room)
- Cleanup (delete old unused rooms)
- Auditing (when was room created)

### Conflict Resolution

**Scenario:** Two clients both create "meeting-notes" at the same time while offline

```
Client A (offline): Creates room, writes to registry
Client B (offline): Creates room, writes to registry
Both come online and sync
```

**Automerge CRDT handles this:**
- Both writes are preserved in the CRDT
- We implement a merge policy:
  - Option 1: Last-write-wins (use most recent timestamp)
  - Option 2: First-write-wins (use earliest timestamp)
  - Option 3: Merge both (create "meeting-notes-2" for second)

**Our choice: First-write-wins**
- Earliest created timestamp wins
- Consistent with "first person to create owns the room"
- Prevents race conditions from fragmenting collaboration

### Performance Considerations

**Registry size:**
- Each room entry: ~100 bytes
- 10,000 rooms: ~1 MB
- Acceptable for collaborative editing use case

**Sync overhead:**
- Registry only syncs when changed
- Small deltas (one room entry at a time)
- Negligible impact on performance

**Scaling:**
- For very large deployments (100k+ rooms)
- Can shard registries by prefix: "a-m", "n-z"
- Or implement registry-per-workspace
- Not needed for current use case

## Comparison to PromiseGrid/PromiseBase Future

### Current: Registry Document

```
Room name: "meeting-notes"
    ↓
Registry CRDT: {"meeting-notes": "automerge:abc..."}
    ↓
Document ID: automerge:abc...
    ↓
Automerge CRDT content
```

**Issues:**
- Registry is a "magic" document
- All clients must know registry ID
- Registry could grow large
- Not integrated with content-addressable storage

### Future: PromiseBase Mutable Refs

```
Room name: "meeting-notes"
    ↓
PromiseBase ref: refs/rooms/meeting-notes
    ↓
Current CID: zb2rhe5P4gXf...
    ↓
Content block (immutable)
```

**Advantages:**
- Native mutable pointer support
- Integrated with content-addressable storage
- Part of Merkle tree structure
- Efficient updates (just change ref, not copy data)
- Version history (all past CIDs preserved)

### Migration Path

When PromiseBase mutable refs are ready:

1. Export registry mappings
2. Create PromiseBase refs for each room
3. Point refs to current document CIDs
4. Update editor to use PromiseBase refs instead of registry
5. Deprecate registry document
6. Delete registry after migration period

**Compatibility:**
- Old clients use registry
- New clients use PromiseBase refs
- Both work during transition
- Eventually all migrate to refs

## Why This Is The Right Temporary Solution

### Aligns with PromiseGrid Philosophy

**Decentralized:**
- No central authority
- All clients are peers
- Works offline
- Syncs automatically

**Content-addressable compatible:**
- Registry maps names to content addresses
- Preserves immutability of documents
- Mutable pointer (room name) to immutable content (document)
- Same pattern as PromiseBase refs

**CRDT-based:**
- Uses Automerge for conflict-free updates
- No coordination needed
- Automatic merge
- Consistent across all clients

### Unblocks Development

**Without registry:**
- Cannot implement room-based collaboration
- Must wait for PromiseBase mutable refs
- Timeline unknown
- Development blocked

**With registry:**
- Room-based collaboration works today
- Can test and iterate on editor features
- Users can actually use the system
- Replace with PromiseBase refs when ready

### Minimal Code

**Registry implementation:**
- ~100 lines of code
- Single file: `src/setup/registry.js`
- No external dependencies
- Easy to understand and maintain

**Removal later:**
- Delete registry.js
- Update automergeSetup.js to use PromiseBase refs
- Migration script (one-time)
- Clean cutover

## Security Considerations

### Current Registry (Temporary)

**No access control:**
- Anyone can create rooms
- Anyone can see all room names
- Anyone can join any room
- Acceptable for development/testing

**Future improvements:**
- When PromiseBase refs available
- Capability-based access control
- Room creators issue capability tokens
- Token required to read/write room

### Attack Vectors

**Registry pollution:**
- Malicious client creates millions of fake rooms
- Registry grows unbounded
- **Mitigation:** Rate limiting on registry writes (future)

**Room hijacking:**
- Attacker overwrites existing room mapping
- Points to different document
- **Mitigation:** First-write-wins prevents this
- Original creator's mapping persists

**Privacy:**
- All room names visible in registry
- **Mitigation:** Use UUIDs for private rooms
- Human names for public/team rooms

## Testing Strategy

### Unit Tests

Test registry operations:
```javascript
- createRoom("meeting-notes") → new document ID
- createRoom("meeting-notes") again → same document ID
- getRoom("meeting-notes") → returns correct ID
- getRoom("nonexistent") → returns null
- listRooms() → returns all room names
```

### Integration Tests

Test multi-client scenarios:
```javascript
- Client A creates room
- Client B joins room
- Both see same document
- Edits sync between clients
```

### Conflict Tests

Test simultaneous creation:
```javascript
- Client A creates "test" (offline)
- Client B creates "test" (offline)
- Both come online
- Verify first-write-wins
- Both end up with same document
```

## Monitoring and Debugging

### Registry Inspection

Add debug command to view registry:
```javascript
window.debugRegistry = async () => {
  const registry = await getRegistry();
  console.table(registry.rooms);
}
```

Output:
```
┌─────────────────┬─────────────────────────┬──────────────────┐
│ Room Name       │ Document ID             │ Created          │
├─────────────────┼─────────────────────────┼──────────────────┤
│ meeting-notes   │ automerge:2Wvx7G4KjMp...│ 2024-01-01 10:00 │
│ project-plan    │ automerge:7Qz3N9FxLk... │ 2024-01-01 11:30 │
└─────────────────┴─────────────────────────┴──────────────────┘
```

### Metrics

Track registry health:
- Number of rooms
- Registry sync time
- Conflicts detected
- Failed room creations

## Documentation for Users

### Creating a Room

```
1. Open editor: http://localhost:8080
2. Click "New Room" or add ?room=your-name to URL
3. Share URL with collaborators
4. Everyone joins same room
```

### Joining a Room

```
1. Receive URL: http://localhost:8080/?room=meeting-notes
2. Open in browser
3. Start editing
4. Changes sync with all participants
```

### Room Names

**Best practices:**
- Use descriptive names: "2024-q1-planning" not "doc1"
- Use hyphens not spaces: "team-meeting" not "team meeting"
- Keep under 50 characters
- Use UUIDs for private rooms

## Future Enhancements

### Room Metadata

Add to registry:
```javascript
{
  rooms: {
    "meeting-notes": {
      documentId: "automerge:...",
      created: 1704067200000,
      createdBy: "alice",
      participants: ["alice", "bob", "charlie"],
      lastActive: 1704153600000,
      description: "Weekly team meeting notes"
    }
  }
}
```

### Room Discovery

```javascript
// List public rooms
window.listPublicRooms()
// List my recent rooms  
window.listMyRooms()
// Search rooms
window.searchRooms("meeting")
```

### Room Lifecycle

```javascript
// Archive old rooms (mark as inactive)
archiveRoom("old-meeting")
// Delete room (requires consensus)
deleteRoom("spam-room")
// Restore archived room
restoreRoom("old-meeting")
```

## Conclusion

The registry document is a **pragmatic temporary solution** that:

1. **Enables room-based collaboration today** without waiting for PromiseBase
2. **Aligns with PromiseGrid philosophy** (decentralized, CRDT-based, content-addressable)
3. **Unblocks development** so we can build and test the editor
4. **Will be replaced** when PromiseBase mutable refs are ready
5. **Requires minimal code** (~100 lines, easy to remove later)

This is not a permanent architecture decision. It's a **practical stepping stone** that gets us working now while maintaining alignment with long-term PromiseGrid design.

When PromiseBase implements mutable references (like Git's `refs/heads/main`), we'll migrate from the registry document to native mutable pointers. The user experience will remain identical - users still share room names, but the underlying implementation will be cleaner and more integrated with PromiseBase.

## References

- PromiseGrid README: Content-addressable storage and governance
- PromiseBase README: Merkle trees and immutable blocks  
- Automerge documentation: CRDT and sync protocol
- Git references: Mutable pointers to immutable commits (our model)
