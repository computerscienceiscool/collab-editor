# Room Mapping Strategy

## Purpose

This document explains how room names map to Automerge document IDs in the collaborative editor, and why this design was chosen.

## The Problem

Users need to share collaborative editing sessions. They need a way to:
1. Create a new collaborative document
2. Share access with others
3. Have all participants edit the same document in real-time

## The Solution: Deterministic Room Mapping

### How It Works

```
User shares: "meeting-notes"
     ↓
Hash: SHA-256("room:meeting-notes")
     ↓
Encode: base58(hash)
     ↓
Document ID: "automerge:2Wvx7G..."
     ↓
All clients with "meeting-notes" get same document ID
     ↓
Automerge sync server coordinates changes
```

### Why Deterministic

**Decentralization principle**: No central registry needed
- Any client can independently compute the document ID
- No coordination required between clients
- Works even if first client disconnects before others join

**Consistency guarantee**: Same input always produces same output
- Room name "meeting-notes" always hashes to same document ID
- Mathematical certainty that all participants get same document
- No race conditions or timing issues

**PromiseGrid alignment**: Content-addressable philosophy
- Room names namespace the collaboration space
- Document content is content-addressed (changes create new CIDs)
- Mutable pointer (room name) to immutable content (snapshots)

## Room Name Options

### Option 1: Human-Readable Names (Chosen)

```
URL: ?room=meeting-notes
Sharing: "Join room meeting-notes"
Document ID: automerge:2Wvx7G...
```

**Advantages**:
- Easy to share verbally
- Memorable
- Intentional collaboration (same name = want to work together)

**Disadvantages**:
- No privacy (anyone who guesses name can join)
- Name collisions are features, not bugs

**Use cases**:
- Public collaboration spaces
- Team documents with known names
- IRC-style channels

### Option 2: UUID-Based Names

```
URL: ?room=87f32ab3-870f-440c-9138-96d55977aaa1
Sharing: Copy/paste URL
Document ID: automerge:9Zk4L...
```

**Advantages**:
- Unguessable (privacy through obscurity)
- No accidental collisions
- Can be generated client-side

**Disadvantages**:
- Hard to share verbally
- Not memorable
- Requires copy/paste

**Use cases**:
- Private documents
- Sensitive collaboration
- One-time sessions

### Hybrid Approach (Future)

```
Public rooms: ?room=meeting-notes
Private rooms: ?room=private:87f32ab3-870f-440c-9138-96d55977aaa1
```

Room name prefix determines behavior.

## Implementation Details

### Hash Function

```javascript
async function generateDocumentIdFromRoom(roomName) {
  // Namespace: "room:meeting-notes"
  const seed = `room:${roomName}`;
  
  // SHA-256 hash
  const encoder = new TextEncoder();
  const data = encoder.encode(seed);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  
  // Convert to base58 (Automerge format)
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const base58Hash = base58Encode(hashArray);
  
  // Return Automerge URL
  return `automerge:${base58Hash}`;
}
```

### Why SHA-256

- Standard cryptographic hash function
- Available in Web Crypto API (no dependencies)
- 256-bit output provides sufficient collision resistance
- Deterministic and reproducible

### Why Base58

- Automerge uses base58 for document IDs
- URL-safe (no special characters)
- Human-readable (no ambiguous characters like 0/O, l/1)
- Bitcoin alphabet standard

### Namespace Prefix

The "room:" prefix:
- Separates room IDs from other hash uses
- Prevents collision with direct content hashes
- Allows future namespacing (e.g., "private:room:...")

## Relationship to PromiseBase

### Current: Automerge Only

```
Room name: "meeting-notes"
     ↓
Automerge doc ID: automerge:2Wvx7G...
     ↓
Document state stored in IndexedDB (browser local)
     ↓
Synced via WebSocket between active clients
```

### Future: PromiseBase Integration

```
Room name: "meeting-notes" (mutable pointer)
     ↓
Current version CID: zb2rhe5P4gXf... (content hash)
     ↓
Previous version CID: zb2rhd7J3kL... (parent)
     ↓
Previous version CID: zb2rhc2M9pQ... (grandparent)
     ...
```

**Mutable vs Immutable**:
- Room name: Mutable pointer to latest version
- Version CIDs: Immutable content snapshots
- Merkle tree: Tracks version history

**Storage layers**:
```
Layer 1: Automerge (real-time CRDT, active editing)
     ↓ snapshot every 30 seconds
Layer 2: PromiseBase (content-addressed, permanent storage)
     ↓ replicate across grid
Layer 3: Grid cache (distributed, automatic replication)
```

## Version History

### Automerge Provides

- Complete operation history
- Every keystroke tracked
- Can replay to any point
- CRDT guarantees causal consistency

### PromiseBase Will Provide

- Periodic snapshots as immutable blocks
- Merkle tree of document evolution
- Content-addressed storage
- Grid-wide replication
- Time-travel to any snapshot

### Difference

**Automerge**: Fine-grained operation log
- "User A inserted 'H' at position 0"
- "User B inserted 'e' at position 1"
- Millisecond-level granularity

**PromiseBase**: Coarse-grained snapshots
- Snapshot at 2:00 PM: "Hello world"
- Snapshot at 2:30 PM: "Hello world, updated"
- Minute-level granularity

## Security Considerations

### Current State

**No authentication**: Anyone can connect
**No authorization**: Anyone in room can edit
**No encryption**: Traffic visible to sync server

Room names provide only:
- Discovery obscurity (hard to guess UUIDs)
- Intentional collaboration (same name = same room)

### Future: Capability-Based Security

**PromiseGrid model**:
```
Room creator issues capability tokens
     ↓
Token = hash(closure that grants access)
     ↓
Token sent to collaborators out-of-band
     ↓
Collaborators present token to join
     ↓
Creator can revoke token
```

**Access levels**:
- Read capability: View document
- Write capability: Edit document
- Admin capability: Manage collaborators
- Fork capability: Create derivative

**Token example**:
```
Capability token: cap:2Wvx7G...
     ↓
References closure: function grantAccess(userID, docID)
     ↓
Closure enforces access rules
     ↓
Token can be revoked by changing closure
```

## Migration Path

### Phase 1: Current
- Human-readable room names OR UUIDs
- Deterministic hashing to Automerge doc ID
- IndexedDB persistence
- WebSocket sync

### Phase 2: PromiseBase Storage
- Keep Automerge for real-time editing
- Periodic snapshots to PromiseBase
- Merkle tree version history
- Content-addressable snapshots

### Phase 3: Grid Integration
- Grid-wide document replication
- Capability-based access control
- Distributed sync (no central server)
- LLM-assisted merge

### Phase 4: Self-Hosting
- Run sync server on grid
- PromiseBase as primary storage
- Browser as thin client
- Full decentralization

## Design Rationale

### Why Not Central Registry

**Problem**: Central registry is a single point of failure
- Registry goes down, collaboration stops
- Requires coordination
- Creates centralization

**Solution**: Deterministic hashing
- No registry needed
- Purely mathematical
- Decentralized by design

### Why Not Random IDs

**Problem**: First client generates random ID, how do others join?
- Need to communicate ID somehow
- Creates chicken-and-egg problem
- Requires out-of-band sharing

**Solution**: Deterministic from room name
- Share room name, not document ID
- Document ID computed independently
- No coordination needed

### Why Not Content-Address Room

**Problem**: Room needs to exist before content
- Can't hash content that doesn't exist yet
- Room is namespace, not content
- Mutable pointer vs immutable content

**Solution**: Hash room name (namespace), not content
- Room name is stable identifier
- Content changes over time
- Separate concerns

## Comparison to Other Systems

### Git Branches

```
Branch name: "main" (mutable)
     ↓
Current commit: abc123... (immutable)
     ↓
Parent commit: def456... (immutable)
```

Similar model:
- Branch name is mutable pointer
- Commits are immutable content
- Room name is like branch name

### IRC Channels

```
Channel name: "#meeting"
     ↓
Anyone can join if they know name
     ↓
Shared conversation space
```

Similar model:
- Channel name is shared identifier
- Same name = same conversation
- No privacy by default

### IPFS Mutable Pointers (IPNS)

```
IPNS name: /ipns/QmHash...
     ↓
Points to: /ipfs/QmContent...
     ↓
Content-addressed data
```

Similar model:
- IPNS provides mutable pointer
- IPFS provides immutable content
- Room name like IPNS, snapshots like IPFS

## Conclusion

Deterministic room mapping aligns with:
- PromiseGrid's decentralization philosophy
- PromiseBase's content-addressable storage
- Automerge's CRDT collaboration model

It provides:
- Zero-configuration room creation
- Decentralized operation
- Predictable behavior
- Foundation for future grid integration

The design trades privacy (anyone with room name can join) for simplicity (no central registry). Future capability-based access control will address privacy needs while maintaining decentralization.
