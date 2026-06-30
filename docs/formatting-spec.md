
# Formatting Spec for Collaborative Editor

## Purpose

This document outlines current and future formatting plans for the collaborative editor that will be integrated into PromiseGrid.

---

## Current State

- Uses **Automerge** CRDT for collaborative editing.
- Supports **rich text formatting** within the editor (e.g., bold, italics, cursors).
- State is synchronized using Automerge sync protocol and optionally served or exported through the new Rust backend.
- **PromiseGrid protocol integration** creates CBOR messages for all formatting operations.

---

## Formatting Goals

- Adopt a **standard document format** for import/export.
- Target format: **Markdown** (with optional extensions for metadata, comments, and mentions).
- Support **round-trip conversion** between the editor state and Markdown.
- **PromiseGrid protocol compliance** for all document operations and state changes.

---

## Export Requirements

- Export document to:
  - `.txt`: plain text
  - `.json`: serialized Codemirror state
  - `.automerge`: Automerge binary document
  - `.cbor`: CBOR-encoded document
  - `.md`: Git-compatible Markdown (WIP — implemented in Rust backend)
  - **PromiseGrid CBOR**: Protocol-compliant messages with official 'grid' tag

---

## PromiseGrid Protocol Integration

### Message Format Specification
PromiseGrid messages follow this structure:
```
Tag: 0x67726964 ('grid')
├── Protocol Hash (CID)
└── Payload
    ├── Message Type
    └── Data (key-value pairs)
```

### Supported Message Types
- **document_edit**: Text editing operations (insert, delete, format)
- **document_stats**: Document statistics updates (word count, character count)
- **export**: Document export operations

### Message Generation
Every formatting action generates PromiseGrid messages:
- **Bold/Italic/Underline**: Text formatting operations
- **Document Format**: Entire document cleanup operations  
- **URL Conversion**: Link formatting actions
- **Export Operations**: Document saving and export

### CBOR Encoding
- Uses `serde_cbor` for protocol-compliant encoding
- Official PromiseGrid tag (0x67726964) applied to all messages
- Structured payload with protocol hash and message data
- User and document identification included in all messages

---

## Import Requirements (Planned)

- Parse `.md` documents into editable state (Markdown → Automerge-compatible text).
- **Parse PromiseGrid CBOR** messages back into document state.
- Preserve:
  - Headings
  - Lists
  - Code blocks
  - Bold / Italics / Links
  - Footnotes / Mentions (TBD)
  - **PromiseGrid message metadata** for protocol compliance

---

## Design Considerations

- Conversion will likely be handled by a **Markdown transformer** like:
  - `marked` (for parsing)
  - `markdown-it`
- Final state may be stored in **CBOR**, but Markdown remains the human-readable layer.
- **PromiseGrid protocol** provides machine-readable layer for decentralized systems.

---

## File Naming and Document Identity (Planned)

Document instances may eventually include unique identifiers as part of their filename or metadata, especially during export or persistent storage. This will enable tracking across distributed instances and support identity and versioning architecture.

### Current Export Naming
- **Standard exports**: `document.txt`, `document.json`, etc.
- **PromiseGrid exports**: `{document-id}_promisegrid.cbor`
- **Future considerations**: Support for content-addressable naming schemes

---

## Alignment with PromiseGrid

This formatting approach is being developed with the long-term goal of seamless integration into PromiseGrid's document layer. Markdown will act as the canonical human-readable format for versioning, collaboration, and long-term storage, while **PromiseGrid CBOR messages** provide the protocol layer for decentralized computing.

### Protocol Compliance Features
- **Content-addressable design**: Ready for PromiseGrid's hash-based storage
- **Capability-based security**: Message structure supports PromiseGrid capability tokens
- **Decentralized messaging**: All document operations can be expressed as PromiseGrid promises
- **Consensus mechanisms**: Document state changes follow PromiseGrid merge-as-consensus model

---

## Questions

- Should custom Markdown extensions be used for user mentions or signatures?
- Will PromiseGrid define a canonical schema for Markdown with metadata blocks?
- Should the formatting spec support localization or multi-language formatting?
- **How should PromiseGrid capability tokens be embedded in document metadata?**
- **What protocol hash should identify the document formatting specification?**
- **Should document edits be grouped into PromiseGrid transactions for atomic operations?**

---

## Status

This spec is a living document and will evolve as PromiseGrid integration progresses. **Current PromiseGrid protocol integration** demonstrates real CBOR message creation and provides foundation for future decentralized document features.
