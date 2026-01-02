
// File: src/app.js
//
import { initWasm } from './wasm/initWasm.js';
import { initDiffWasm } from './wasm/diffWasm.js';
import { setupDocumentStats } from './ui/documentStats.js';
import { setupAutomerge } from './setup/automergeSetup.js';
import { setupEditor } from './setup/editorSetup.js';
import { setupExportHandlers } from './export/handlers.js';
import { setupUserControls } from './setup/userSetup.js';
import { setupUserLogging } from './ui/logging.js';
import { setupTypingIndicator } from './ui/typingIndicator.js';
import { setupUserList } from './ui/userList.js';
import { handleDocumentCopy } from './setup/documentCopy.js';
import { githubService } from './github/githubService.js';

// 0. Version storage functions
async function saveVersionToIndexedDB(content, timestamp, room) {
  try {
    const dbName = `versions-${room}`;
    const request = indexedDB.open(dbName, 1);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('versions')) {
        const store = db.createObjectStore('versions', { keyPath: 'timestamp' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(['versions'], 'readwrite');
      const store = transaction.objectStore('versions');
      
      store.add({
        timestamp,
        content,
        length: content.length
      });
      
      // Keep only last 50 versions
      const index = store.index('timestamp');
      const getAllRequest = index.getAll();
      getAllRequest.onsuccess = () => {
        const versions = getAllRequest.result;
        if (versions.length > 50) {
          versions.sort((a, b) => a.timestamp - b.timestamp);
          const toDelete = versions.slice(0, versions.length - 50);
          toDelete.forEach(version => store.delete(version.timestamp));
        }
      };
    };
  } catch (error) {
    console.error('Failed to save version:', error);
  }
}

async function getLatestVersionFromIndexedDB(room) {
  return new Promise((resolve) => {
    const dbName = `versions-${room}`;
    const request = indexedDB.open(dbName, 1);
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('versions')) {
        resolve('');
        return;
      }
      
      const transaction = db.transaction(['versions'], 'readonly');
      const store = transaction.objectStore('versions');
      const index = store.index('timestamp');
      
      // Get the second-to-last version (not the current one)
      const getAllRequest = index.getAll();
      getAllRequest.onsuccess = () => {
        const versions = getAllRequest.result;
        if (versions.length >= 2) {
          versions.sort((a, b) => b.timestamp - a.timestamp);
          resolve(versions[1].content); // Second most recent
        } else {
          resolve('');
        }
      };
    };
    
    request.onerror = () => resolve('');
  });
}
window.getLatestVersionFromIndexedDB = getLatestVersionFromIndexedDB;

// 1. Initialize Grokker WASM
async function initGrokkerWasm() {
  if (typeof Go === 'undefined') {
    console.error("Go WASM runtime not loaded. Make sure wasm_exec.js is loaded first.");
    return;
  }
  
  const go = new Go();
  try {
    console.log("Attempting to load Grokker WASM from dist/grokker.wasm");
    const result = await WebAssembly.instantiateStreaming(
      fetch('dist/grokker.wasm'),
      go.importObject
    );
    go.run(result.instance);
    console.log("Grokker WASM initialized successfully");
    console.log("generateCommitMessage function available:", typeof window.generateCommitMessage);
    console.log("generateSideBySideDiff function available:", typeof window.generateSideBySideDiff);
  } catch (error) {
    console.error("Failed to load Grokker WASM:", error);
    console.log("Make sure to run: make grokker-wasm");
  }
}

// 2. Declare a typingTimeout variable — it's needed across functions
let typingTimeout = null;

// 3. Wait for the page (DOM) to load before touching any HTML elements
window.addEventListener('DOMContentLoaded', async() => {

  // Initialize WASM FIRST
  console.log("Initializing Rust WASM...");
  await initWasm();
  console.log("Rust WASM ready!");

  // Then initialize Grokker WASM
  console.log("Initializing Grokker WASM...");
  await initGrokkerWasm();
  
  // Initialize Diff WASM
  console.log("Initializing Diff WASM...");
  await initDiffWasm();
  
  // Add a delay to ensure everything is ready
  await new Promise(resolve => setTimeout(resolve, 1000));
  console.log("All WASM modules should now be ready");  
    
  // 3a. Set up Automerge state: repository, document handle, awareness, etc.
  const { repo, handle, doc, awareness, room } = setupAutomerge();

  // Listen for document changes and save versions
  handle.on('change', ({ doc }) => {
    if (doc && doc.content) {
      const content = doc.content.toString();
      const timestamp = Date.now();
      
      // Save to IndexedDB with versioning
      saveVersionToIndexedDB(content, timestamp, room);
    }
  });

  document.querySelector('#room-name').textContent = room;

  // 3b. Set up the CodeMirror editor
  const view = setupEditor(repo, handle, awareness);

  //3b.i. Attach the editor globally available for menu actions
  window.editorView = view;

  // 3c. Hook up UI elements: name/color fields
  setupUserControls(awareness);

  // 3d. Hook up save/export buttons
  setupExportHandlers(handle, view);

  // 3e. Track users joining/leaving
  setupUserLogging(awareness);

  // 3f. Show typing indicator in UI
  setupTypingIndicator(awareness);

  // 3g. Update user list in the toolbar
  setupUserList(awareness);
  
  // Setup document stats (needs to work with Automerge)
  setupDocumentStats(handle, view);

  // Set up real-time markdown preview updates
  const setupMarkdownPreviewUpdates = (view, handle) => {
    // Helper function to convert markdown to HTML
    const convertMarkdownToHtml = (markdown) => {
      let menuSystemInstance = null;
      
      if (typeof window.menuSystem === 'function') {
        menuSystemInstance = new window.menuSystem();
      }
      
      if (menuSystemInstance && typeof menuSystemInstance.markdownToHtml === 'function') {
        console.log("Using menu system's markdown converter");
        return menuSystemInstance.markdownToHtml(markdown);
      } else if (window.menuSystem && 
                 typeof window.menuSystem.prototype === 'object' && 
                 typeof window.menuSystem.prototype.markdownToHtml === 'function') {
        console.log("Using menu system prototype's markdown converter");
        return window.menuSystem.prototype.markdownToHtml(markdown);
      } else {
        console.log("Using fallback markdown converter");
        return markdown
          .replace(/^### (.*$)/gim, '<h3>$1</h3>')
          .replace(/^## (.*$)/gim, '<h2>$1</h2>')
          .replace(/^# (.*$)/gim, '<h1>$1</h1>')
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.*?)\*/g, '<em>$1</em>')
          .replace(/_(.*?)_/g, '<u>$1</u>')
          .replace(/__(.*?)__/g, '<u>$1</u>')
          .replace(/~~(.*?)~~/g, '<del>$1</del>')
          .replace(/`(.*?)`/g, '<code>$1</code>')
          .replace(/^\s*- (.*$)/gim, '<li>$1</li>')
          .replace(/((^<li>.*<\/li>\n)+)/gm, '<ul>$1</ul>')
          .replace(/^\s*\d+\. (.*$)/gim, '<li>$1</li>')
          .replace(/((^<li>.*<\/li>\n)+)/gm, '<ol>$1</ol>')
          .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
          .replace(/\n/g, '<br>');
      }
    };
   
    // Function to update the preview
    const updatePreview = () => {
      const editorContainer = document.querySelector('.editor-container');
      const previewElement = document.getElementById('markdown-preview');
      
      if (!previewElement) return;
      
      if (editorContainer && editorContainer.classList.contains('split-view')) {
        editorContainer.classList.add('loading');
        previewElement.classList.add('loading');
        
        setTimeout(() => {
          const content = view.state.doc.toString();
          const html = convertMarkdownToHtml(content);
          previewElement.innerHTML = html;
          editorContainer.classList.remove('loading');
          previewElement.classList.remove('loading');
          console.log('Markdown preview updated');
        }, 10);
      }
    };
    
    // Debounced update function
    const debouncedUpdate = () => {
      if (window.markdownUpdateTimeout) {
        clearTimeout(window.markdownUpdateTimeout);
      }
      
      window.markdownUpdateTimeout = setTimeout(() => {
        updatePreview();
      }, 300);
    };
    
    window.updateMarkdownPreview = debouncedUpdate;
    
    view.dom.addEventListener('keyup', debouncedUpdate);
    view.dom.addEventListener('paste', debouncedUpdate);
    
    // Listen to Automerge changes instead of Yjs
    handle.on('change', debouncedUpdate);
    
    view.dispatch = (() => {
      const originalDispatch = view.dispatch;
      return function(...args) {
        const result = originalDispatch.apply(this, args);
        
        if (args[0]) {
          if (
            (args[0].changes && !args[0].changes.empty) ||
            (args[0].effects && args[0].effects.length > 0)
          ) {
            console.log('Document changed, updating markdown preview');
            debouncedUpdate();
          }
        }
        
        return result;
      };
    })();
     
    const viewMenu = document.getElementById('view-menu');
    if (viewMenu) {
      const togglePreviewItem = viewMenu.querySelector('[data-action="toggle-markdown-preview"]');
      if (togglePreviewItem) {
        togglePreviewItem.addEventListener('click', () => {
          setTimeout(updatePreview, 50);
        });
      }
      
      const updatePreviewItem = viewMenu.querySelector('[data-action="update-markdown-preview"]');
      if (updatePreviewItem) {
        updatePreviewItem.addEventListener('click', updatePreview);
      }
    }
    
    if (window.menuSystem && window.menuSystem.prototype) {
      const originalToggle = window.menuSystem.prototype.toggleMarkdownPreview;
      if (originalToggle) {
        window.menuSystem.prototype.toggleMarkdownPreview = function() {
          originalToggle.apply(this);
          setTimeout(updatePreview, 50);
        };
      }
      
      const originalUpdate = window.menuSystem.prototype.updateMarkdownPreview;
      if (originalUpdate) {
        window.menuSystem.prototype.updateMarkdownPreview = function() {
          originalUpdate.apply(this);
          updatePreview();
        };
      }
    }
    
    const editorContainer = document.querySelector('.editor-container');
    if (editorContainer && editorContainer.classList.contains('split-view')) {
      setTimeout(updatePreview, 100);
    }
    
    // Setup scroll synchronization
    const setupScrollSync = () => {
      const editorContainer = document.querySelector('#editor');
      const previewPane = document.getElementById('markdown-preview');
      
      if (!editorContainer || !previewPane) return;
      
      let isEditorScrolling = false;
      let isPreviewScrolling = false;
      
      editorContainer.addEventListener('scroll', () => {
        if (isPreviewScrolling) return;
        
        isEditorScrolling = true;
        const editorScrollRatio = editorContainer.scrollTop / 
          (editorContainer.scrollHeight - editorContainer.clientHeight || 1);
        
        const previewScrollTarget = editorScrollRatio * 
          (previewPane.scrollHeight - previewPane.clientHeight || 1);
        
        previewPane.scrollTop = previewScrollTarget;
        
        setTimeout(() => {
          isEditorScrolling = false;
        }, 50);
      });
      
      previewPane.addEventListener('scroll', () => {
        if (isEditorScrolling) return;
        
        isPreviewScrolling = true;
        const previewScrollRatio = previewPane.scrollTop / 
          (previewPane.scrollHeight - previewPane.clientHeight || 1);
        
        const editorScrollTarget = previewScrollRatio * 
          (editorContainer.scrollHeight - editorContainer.clientHeight || 1);
        
        editorContainer.scrollTop = editorScrollTarget;
        
        setTimeout(() => {
          isPreviewScrolling = false;
        }, 50);
      });
      
      console.log('Scroll synchronization initialized');
    };

    const savePreviewState = (isVisible) => {
      try {
        localStorage.setItem('markdown-preview-visible', isVisible ? 'true' : 'false');
        console.log(`Markdown preview state saved: ${isVisible ? 'visible' : 'hidden'}`);
      } catch (error) {
        console.warn('Could not save markdown preview state:', error);
      }
    };

    const loadPreviewState = () => {
      try {
        const state = localStorage.getItem('markdown-preview-visible');
        return state === 'true';
      } catch (error) {
        console.warn('Could not load markdown preview state:', error);
        return false;
      }
    };

    if (window.menuSystem && window.menuSystem.prototype) {
      const originalToggle = window.menuSystem.prototype.toggleMarkdownPreview;
      if (originalToggle) {
        window.menuSystem.prototype.toggleMarkdownPreview = function() {
          originalToggle.apply(this);
          const container = document.querySelector('.editor-container');
          const isVisible = container && container.classList.contains('split-view');
          savePreviewState(isVisible);
          setTimeout(updatePreview, 50);
          if (isVisible) {
            setTimeout(setupScrollSync, 100);
          }
        };
      }
    }

    const shouldShowPreview = loadPreviewState();
    if (shouldShowPreview) {
      console.log('Restoring markdown preview visibility from saved state');
      const container = document.querySelector('.editor-container');
      if (container && !container.classList.contains('split-view')) {
        if (window.menuSystem && window.menuSystem.prototype.toggleMarkdownPreview) {
          try {
            window.menuSystem.prototype.toggleMarkdownPreview.call({});
          } catch (error) {
            console.warn('Error toggling preview with menu system:', error);
            container.classList.add('split-view');
            setTimeout(() => {
              updatePreview();
              setupScrollSync();
            }, 100);
          }
        } else {
          container.classList.add('split-view');
          setTimeout(() => {
            updatePreview();
            setupScrollSync();
          }, 100);
        }
      } else if (container && container.classList.contains('split-view')) {
        setTimeout(setupScrollSync, 200);
      }
    }
    
    window.updateMarkdownPreview = updatePreview;
    console.log('Real-time markdown preview updates initialized');
    return updatePreview;
  };

  // Add real-time markdown preview updates
  setupMarkdownPreviewUpdates(view, handle);

  setTimeout(() => {
    handleDocumentCopy(view, handle);
  }, 1500);

  // 3h. Detect when *this* user types and tell the others
  view.dom.addEventListener('keydown', (e) => {
    if (window.shortcutManager && !window.shortcutManager.isEnabled() && 
        (e.ctrlKey || e.metaKey)) {
      return;
    }
      
    awareness.setLocalStateField('typing', true);

    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      awareness.setLocalStateField('typing', false);
    }, 1500);
  });
  
  // 3i. Hook up the Log toggle button *after* DOM is ready
  const toggleLogBtn = document.getElementById('toggle-log');
  const logPanel = document.getElementById('user-log');

  if (toggleLogBtn && logPanel) {
    toggleLogBtn.addEventListener('click', () => {
      const visible = logPanel.style.display !== 'none';
      logPanel.style.display = visible ? 'none' : 'block';
    });
  }
  
  // Make key components available globally for GitHub integration
  window.automergeHandle = handle;
  window.automergeRepo = repo;
  window.awareness = awareness;

  // Initialize GitHub integration if token exists
  if (githubService.settings.token) {
    console.log("GitHub integration available");
  }
});
