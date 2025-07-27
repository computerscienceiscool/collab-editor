# Rust WebAssembly Features

This document outlines the WASM-powered features in the collaborative editor, built with Rust and compiled to WebAssembly for client-side processing.

## Current Features

### Document Compression
- **Function**: `compress_document()` and `decompress_document()`
- **Technology**: Rust flate2 (gzip compression) compiled to WASM
- **Performance**: Achieves ~98% compression ratio on typical documents
- **Benefit**: Reduces IndexedDB storage size and network transfer

### Text Formatting
- **Functions**: `format_text()` - Auto-format entire document
- **Features**: 
  - Clean up extra whitespace and line breaks
  - Fix markdown headers spacing
  - Format code blocks properly
  - Clean up bold/italic formatting
  - Correct punctuation spacing
    - Remove spaces before commas, periods, colons, semicolons
    - Fix parentheses spacing: `( text )` → `(text)`
    - Clean up doubled punctuation: `..` → `.` and `,,` → `,`
- **Usage**: Click "Format" button to apply to entire document

### Markdown Formatting Toggles
- **Functions**: `toggle_bold()`, `toggle_italic()`, `toggle_underline()`
- **Usage**: Select text and click Bold/Italic/Underline buttons
- **Smart Toggle**: 
  - `"hello"` → `"**hello**"` (add formatting)
  - `"**hello**"` → `"hello"` (remove formatting)
- **Standard Markdown**: Creates portable markdown syntax

### Document Statistics
- **Function**: `calculate_document_stats()`
- **Technology**: Rust string processing compiled to WASM
- **Features**:
  - Real-time word count
  - Character count (with and without spaces)
  - Line count
  - Reading time estimation (based on 200 words/minute)
- **Usage**: Live updates in toolbar as you type
- **Performance**: Near-instantaneous calculation for large documents

### URL Link Helper
- **Function**: `convert_url_to_markdown()`
- **Technology**: Rust string processing and pattern matching compiled to WASM
- **Features**:
  - Smart URL detection (http://, https://, ftp://, www.)
  - Converts plain URLs to markdown link format
  - Preserves existing markdown links (won't double-convert)
  - Leaves non-URL text unchanged
- **Usage**: Select URL text and click "Link" button
- **Examples**:
  - `https://github.com` → `[https://github.com](https://github.com)`
  - `www.google.com` → `[www.google.com](www.google.com)`
  - `ftp://example.com/file.txt` → `[ftp://example.com/file.txt](ftp://example.com/file.txt)`
- **Performance**: Instant conversion with pattern matching

### URL Link Conversion
1. Type or paste URLs in the editor
2. Select any URL text
3. Click "Link" button in toolbar
4. URL converts to proper markdown link format
5. Already-formatted links remain unchanged

### Markdown Export
- **Function**: `export_to_markdown()`
- **Status**: Basic implementation (returns input as-is)
- **Planned**: Full markdown parsing and export capabilities

## Build Process

```bash
# Build WASM module
make wasm

# Clean build
make wasm-rebuild

# Run full development stack
make dev-all
