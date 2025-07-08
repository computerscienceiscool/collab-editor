# Formatting Spec for Collaborative Editor

## Purpose

This document outlines current and future formatting plans for the collaborative editor that will be integrated into PromiseGrid.

---

## Current State

- Uses **Yjs** CRDT for collaborative editing.
- Supports **rich text formatting** within the editor (e.g., bold, italics, cursors).
- State is synchronized using y-websocket and optionally served or exported through the new Rust backend.

---

## Formatting Goals

- Adopt a **standard document format** for import/export.
- Target format: **Markdown** (with optional extensions for metadata, comments, and mentions).
- Support **round-trip conversion** between the editor state and Markdown.

---

## Export Requirements

- Export document to:
  - `.txt`: plain text
  - `.json`: serialized Codemirror state
  - `.yjs`: Yjs binary snapshot
  - `.snapshot.json`: JSON snapshot of Yjs document
  - `.md`: Git-compatible Markdown (WIP — implemented in Rust backend)

---

## Import Requirements (Planned)

- Parse `.md` documents into editable state (Markdown → Yjs-compatible JSON).
- Preserve:
  - Headings
  - Lists
  - Code blocks
  - Bold / Italics / Links
  - Footnotes / Mentions (TBD)

---

## Design Considerations

- Conversion will likely be handled by a **Markdown transformer** like:
  - `marked` (for parsing)
  - `markdown-it`
- Final state may be stored in **CBOR**, but Markdown remains the human-readable layer.

---

## File Naming and GUIDs (Planned)

Each document instance may eventually include a PromiseGrid GUID as part of its filename or metadata, especially during export or persistent storage. This will enable tracking across distributed instances and support PromiseGrid’s identity and versioning architecture.

---

## Alignment with PromiseGrid

This formatting approach is being developed with the long-term goal of seamless integration into PromiseGrid’s document layer. Markdown will act as the canonical human-readable format for versioning, collaboration, and long-term storage.

---

## Questions

- Should custom Markdown extensions be used for user mentions or signatures?
- Will PromiseGrid define a canonical schema for Markdown with metadata blocks?
- Should the formatting spec support localization or multi-language formatting?

---

## Status

This spec is a living document and will evolve as PromiseGrid integration progresses.

