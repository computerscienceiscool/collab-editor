// grokker-loader.js
(function() {
    'use strict';
    
    // Create global namespace
    window.Grokker = window.Grokker || {};
    
    // Loading state
    let wasmReady = false;
    let wasmReadyCallbacks = [];
    
    // Initialize WASM
    async function initWASM() {
        // Create Go instance
        const go = new Go();
        
        try {
            // Load and instantiate WASM module
            const result = await WebAssembly.instantiateStreaming(
                fetch('grokker.wasm'),
                go.importObject
            );
            
            // Run the Go program
            go.run(result.instance);
            
            console.log('Grokker WASM loaded successfully');
            wasmReady = true;
            
            // Call any queued callbacks
            wasmReadyCallbacks.forEach(callback => callback());
            wasmReadyCallbacks = [];
            
        } catch (err) {
            console.error('Failed to load Grokker WASM:', err);
            throw err;
        }
    }
    
    // Public API
    window.Grokker.ready = function(callback) {
        if (wasmReady) {
            callback();
        } else {
            wasmReadyCallbacks.push(callback);
        }
    };
    
    window.Grokker.generateCommitMessage = async function(params) {
        if (!wasmReady) {
            throw new Error('Grokker WASM not loaded. Call Grokker.ready() first.');
        }
        
        // Call the WASM function (exposed from Go)
        return await generateCommitMessage(params);
    };
    
    // Auto-initialize
    initWASM();
})();
