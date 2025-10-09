# Collaborative Text Editor Installation Guide

This guide will walk you through setting up and running the Collaborative Text Editor, a real-time collaborative document editor built with Yjs, CodeMirror 6, WebAssembly, and modern web technologies.
This needs to be tested

## Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v14 or later)
- [npm](https://www.npmjs.com/) (v6 or later)
- [Go](https://golang.org/) (v1.16 or later, for the Go server)
- [Rust](https://www.rust-lang.org/) and [wasm-pack](https://rustwasm.github.io/wasm-pack/installer/) (for WebAssembly features)

## Installation Steps

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

### 4. Start the Yjs WebSocket Server

For real-time collaboration, the project uses a WebSocket server to sync changes between clients:

```bash
# Install the y-websocket server globally and start it
make ws
```

### 5. Start the Go Server (Optional)

The project includes a Go server for additional functionality:

```bash
# Build and run the Go server
make run
```

### 6. Start the Development Server

```bash
# Start the Vite development server
make serve
```

After running this command, the application should be available at http://localhost:8080.


## Quick Start
For new users who want to get started quickly, you can use a single command to set up everything:

```bash
make dev-all
```
 
This will build the WebAssembly module, start the WebSocket server, and launch the development server all in one go. After running this, access the application at http://localhost:8080.



## Configuration Options

### Room-Based Collaboration

The editor uses room-based collaboration. You can create or join a room by using a URL parameter:

```
http://localhost:8080/?room=your-room-name
```

Each room is a separate collaborative space with its own document content.

### Persistent Storage

The editor uses:

1. **IndexedDB**: For offline persistence of documents using `y-indexeddb`
2. **WebSocket**: For real-time syncing of changes using `y-websocket`

## Project Structure Overview

- `src/`: JavaScript source code
  - `setup/`: Setup modules for Yjs, CodeMirror, and user management
  - `ui/`: User interface components
  - `wasm/`: WebAssembly integration
- `rust-wasm/`: Rust code for WebAssembly features
- `public/`: Static assets
- `index.html`: Main HTML entry point

## Editor Features

- Real-time collaboration with Yjs CRDTs
- WASM-powered text processing (Rust)
- PromiseGrid protocol integration
- Offline support with automatic sync
- Advanced formatting and export options
- User presence and cursor awareness
- Markdown preview mode

## Troubleshooting

### WebSocket Connection Issues

If you encounter WebSocket connection issues:

1. Ensure the y-websocket-server is running (started with `make ws`). It uses port 1234 by default.
2. Check for any network/firewall restrictions
3. Verify that your browser supports WebSockets

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


## Troubleshooting
If you encounter issues during setup or usage, please check the make file for detailed commands and options.
