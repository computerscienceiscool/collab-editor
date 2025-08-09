
# PromiseGrid Integration Documentation

This document describes the PromiseGrid protocol integration in the collaborative text editor project.

## Overview

The collaborative editor now includes real PromiseGrid protocol support, creating and parsing CBOR messages with the official PromiseGrid tag (0x67726964 = 'grid'). This integration demonstrates genuine PromiseGrid messaging capabilities alongside the existing Yjs collaboration features.

## PromiseGrid Protocol Background

PromiseGrid is a consensus-based computing, communications, and governance system designed for decentralized collaboration. Key concepts:

- **Messages**: Function calls with capability tokens and payloads
- **CBOR Format**: Messages use CBOR encoding with the 'grid' tag (0x67726964)
- **Protocol Hash**: Each message includes a CID identifying the protocol specification
- **Capability-based Security**: Promises and capability tokens control access
- **Decentralized Cache**: Content-addressable storage for code and data

### Message Structure

PromiseGrid messages consist of:
```
Tag: 0x67726964 ('grid')
├── Protocol Hash (CID)
└── Payload
    ├── Message Type
    └── Data (key-value pairs)
```

## Integration Implementation

### Files Modified

#### 1. `rust-wasm/Cargo.toml`
Added PromiseGrid dependencies:
```toml
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
serde_cbor = "0.11"
js-sys = "0.3"
console_error_panic_hook = "0.1.7"

[dependencies.web-sys]
version = "0.3"
features = ["console"]
```

#### 2. `rust-wasm/src/lib.rs`
Implemented core PromiseGrid CBOR functions:

**Data Structures:**
- `PromiseGridMessage` - Main message structure
- `MessagePayload` - Message content and type
- `DocumentEdit` - Document editing operations

**WASM Functions:**
- `create_promisegrid_edit_message()` - Creates edit messages
- `create_promisegrid_stats_message()` - Creates statistics messages
- `parse_promisegrid_message()` - Parses CBOR to JSON
- `log_promisegrid_message()` - Console logging
- `export_document_as_promisegrid()` - Document export

**Helper Functions:**
- `encode_with_grid_tag()` - Adds official PromiseGrid CBOR tag
- `decode_with_grid_tag()` - Validates and parses tagged messages

#### 3. `src/wasm/initWasm.js`
Extended WASM initialization:
- Imported new PromiseGrid functions
- Added PromiseGrid test during startup
- Exported `promiseGrid` object for use across modules
- Added `getCurrentSessionInfo()` helper for session data

#### 4. `src/export/handlers.js`
Integrated PromiseGrid messaging:
- `handlePromiseGridExport()` - Export documents as PromiseGrid CBOR
- `sendEditAsPromiseGridMessage()` - Create messages for every edit action
- Added "promisegrid" export format option
- Enhanced formatting functions to generate PromiseGrid messages

#### 5. `index.html`
Added user interface:
- PromiseGrid CBOR export option in dropdown menu

## Features

### Real-time Message Generation
Every formatting action now creates PromiseGrid messages:
- **Bold/Italic/Underline**: Text formatting operations
- **Document Format**: Entire document cleanup operations
- **URL Conversion**: Link formatting actions

### Message Types
Current message types implemented:
- `document_edit` - Text editing operations
- `document_stats` - Document statistics updates
- `export` - Document export operations

### Console Logging
All PromiseGrid messages are logged to browser console with:
- Formatted JSON display
- Message type identification
- Timestamp and user information
- CBOR byte size information

### Export Functionality
Documents can be exported as PromiseGrid CBOR messages:
- Official PromiseGrid tag (0x67726964)
- Complete document content and metadata
- Downloadable .cbor files

## Usage

### Testing PromiseGrid Integration

1. **Start the development environment:**
   ```bash
   make wasm     # Build Rust WASM module
   make ws       # Start WebSocket server
   make serve    # Start frontend
   ```

2. **Open browser console** to see PromiseGrid messages

3. **Test message creation:**
   - Type text in editor
   - Click Bold, Italic, or Format buttons
   - Observe PromiseGrid messages in console

4. **Test export functionality:**
   - Select "PromiseGrid CBOR (.cbor)" from dropdown
   - Click Save button
   - Check console output and downloaded file

### Console Testing
PromiseGrid functions are exposed to browser console:
```javascript
// Create a test message
const msg = window.createPromiseGridMessage("test-doc", "typing", 10, "Hello!", "user");

// Parse and display message
window.logPromiseGridMessage(msg);
```

## Message Examples

### Document Edit Message
```json
{
  "protocol_hash": "QmPromiseGridProtocolV1",
  "payload": {
    "message_type": "document_edit",
    "data": {
      "document_id": "room-name",
      "edit_type": "bold",
      "position": 5,
      "content": "**formatted text**",
      "user_id": "username",
      "timestamp": 1703001234567
    }
  }
}
```

### Document Statistics Message
```json
{
  "protocol_hash": "QmPromiseGridProtocolV1",
  "payload": {
    "message_type": "document_stats",
    "data": {
      "document_id": "room-name",
      "word_count": 150,
      "char_count": 750,
      "line_count": 12,
      "user_id": "username",
      "timestamp": 1703001234567
    }
  }
}
```

## Technical Details

### CBOR Encoding
- Uses `serde_cbor` for encoding/decoding
- Official PromiseGrid tag: 0x67726964 ('grid')
- Messages are tagged CBOR values containing nested message structures

### Session Information
- Document ID: Extracted from URL room parameter
- User ID: Retrieved from localStorage username
- Timestamp: JavaScript `Date.now()` for message timing

### Error Handling
- CBOR encoding/decoding errors are caught and logged
- Invalid messages return error strings instead of crashing
- Console warnings for missing session information

## Future Enhancements

### Planned Features
- **Network Communication**: Send PromiseGrid messages over network
- **Capability Tokens**: Implement permission-based document access
- **Merge Conflict Resolution**: Use PromiseGrid consensus mechanisms
- **Decentralized Storage**: Store documents in PromiseGrid cache
- **Live Collaboration**: Replace/supplement Yjs with PromiseGrid sync

### Integration Opportunities
- **Real-time Messaging**: Send messages between collaborative users
- **Document Synchronization**: Use PromiseGrid as sync layer
- **Access Control**: Capability-based document permissions
- **Conflict Resolution**: PromiseGrid merge-as-consensus model

## Development Notes

### Building
```bash
make wasm        # Build WASM module
make wasm-clean  # Clean build artifacts
make wasm-rebuild # Clean rebuild
```

### Dependencies
- **Rust**: serde, serde_cbor, wasm-bindgen, web-sys, js-sys
- **JavaScript**: Existing Yjs and CodeMirror dependencies
- **Build Tools**: wasm-pack, Cargo

### File Structure
```
rust-wasm/
├── Cargo.toml              # Dependencies including PromiseGrid
└── src/
    └── lib.rs              # PromiseGrid WASM functions

src/
├── wasm/initWasm.js        # WASM initialization with PromiseGrid
└── export/handlers.js      # PromiseGrid integration handlers
```

## Status

**Current State**:  Functional PromiseGrid CBOR message creation and parsing
**Next Steps**: Network communication and real-time messaging
**Next Steps** log_promisegrid_message() function is not working as expected. Check dev console for errors and ensure WASM module is properly initialized before calling the function.
**Integration Level**: Proof of concept with working protocol implementation

This integration demonstrates real PromiseGrid protocol compliance and provides a foundation for future decentralized collaboration features.



