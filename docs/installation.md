
# Collaborative Text Editor Installation Guide

This guide will walk you through setting up and running the Collaborative Text Editor, a real-time collaborative document editor built with Automerge, CodeMirror 6, WebAssembly, and modern web technologies.

## Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v14 or later)
- [npm](https://www.npmjs.com/) (v6 or later)
- [Go](https://golang.org/) (v1.16 or later, for the Go server)
- [Rust](https://www.rust-lang.org/) (v1.56.0 or later, Rust 2021 edition required) 
- [wasm-pack](https://rustwasm.github.io/wasm-pack/installer/) (v0.10.0 or later)


## Quick Start Installation
```bash
git clone https://github.com/computerscienceiscool/collab-editor.git
cd collab-editor
npm install
make wasm
make dev-all
```


## Installation Steps (alternative detailed steps)

### 1. Clone the Repository

```bash
git clone https://github.com/computerscienceiscool/collab-editor.git
cd collab-editor
```

### 2. Install JavaScript Dependencies

```bash
npm install
```

### 3. Build WebAssembly Components

The text editor uses Rust-based WebAssembly for text processing, formatting, and PromiseGrid CBOR integration:

```bash
# Build the WebAssembly module
make wasm
```

### 4. Starts Services including Automerge Sync Server, Awareness Server, Dev Server and opens a new document in the browser
```bash
make dev-all
```
After running make dev-all, the application will be available at http://localhost:8080/ and will automatically create a new document with a shareable URL.



## Configuration Options

### Document-Based Collaboration

The editor uses document URLs for collaboration. When you open the editor, a new document is created and the URL updates with the document ID:

```
http://localhost:8080/?doc=automerge:2VJnuVxuBCphkYpucWZKziogaFBb
```

Share this URL with others to collaborate on the same document.

### Persistent Storage

The editor uses:

1. **IndexedDB**: For offline persistence of documents using Automerge's IndexedDB storage adapter
2. **WebSocket**: For real-time syncing of changes using Automerge sync protocol

## Project Structure Overview

- `src/`: JavaScript source code
  - `setup/`: Setup modules for Automerge, CodeMirror, and user management
  - `ui/`: User interface components
  - `wasm/`: WebAssembly integration
- `rust-wasm/`: Rust code for WebAssembly features
- `public/`: Static assets
- `index.html`: Main HTML entry point

## Editor Features

- Real-time collaboration with Automerge CRDTs
- WASM-powered text processing (Rust)
- PromiseGrid protocol integration
- Offline support with automatic sync
- Advanced formatting and export options
- User presence and cursor awareness
- Markdown preview mode

## Troubleshooting

### WebSocket Connection Issues

If you encounter WebSocket connection issues:

1. Ensure the Automerge sync server is running (started with `make ws`). It uses port 1234 by default.
2. Ensure the awareness server is running (started with `make awareness`). It uses port 1235.
3. Check for any network/firewall restrictions
4. Verify that your browser supports WebSockets

### WebAssembly Not Loading

If WebAssembly features aren't working:

1. Verify you've built the Rust WASM package correctly
2. Check browser console for WASM-related errors
3. Ensure you're using a browser that supports WebAssembly

### IndexedDB Persistence Issues

If offline changes aren't being saved:

1. Check browser console for IndexedDB-related errors
2. Ensure your browser has sufficient storage permissions
3. Clear site data if you encounter corruption issues

## Development Notes

### Building for Production

```bash
# Build the production version
npm run build
```

### Running Tests

```bash
# Run unit tests
npm run test:unit

# Run end-to-end tests
npm run test:e2e
```


