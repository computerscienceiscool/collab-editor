// File: src/app.js
//
import { initWasm } from './wasm/initWasm.js';
import { initDiffWasm } from './wasm/diffWasm.js';
import { setupDocumentStats } from './ui/documentStats.js';
import { setupEditor } from './setup/editorSetup.js';
import { setupAutomerge } from './setup/automergeSetup.js';
import { setupExportHandlers } from './export/handlers.js';
import { setupUserControls } from './setup/userSetup.js';
import { setupUserLogging } from './ui/logging.js';
import { setupTypingIndicator } from './ui/typingIndicator.js';
import { setupUserList } from './ui/userList.js';
import { handleDocumentCopy } from './setup/documentCopy.js';
import { githubService } from './github/githubService.js';
import { showErrorBanner } from './ui/errors.js';
import { addDocument, getDocTitle, updateTitle } from './utils/documentRegistry.js';

/**
 * Sanitize HTML to prevent XSS attacks.
 * Removes dangerous elements and attributes using browser DOM APIs.
 */
function sanitizeHtml(html) {
  const template = document.createElement('template');
  template.innerHTML = html;

  const dangerousTags = ['script', 'iframe', 'object', 'embed', 'form', 'input', 'textarea', 'button'];
  const dangerousAttrs = ['onclick', 'onerror', 'onload', 'onmouseover', 'onfocus', 'onblur', 'onchange', 'onsubmit'];

  const walk = (node) => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const tagName = node.tagName.toLowerCase();

      // Allow disabled checkbox inputs for task lists
      const isAllowedInput = tagName === 'input' &&
        node.getAttribute('type') === 'checkbox' &&
        node.hasAttribute('disabled');

      // Remove dangerous elements entirely (but allow safe checkboxes)
      if (dangerousTags.includes(tagName) && !isAllowedInput) {
        node.remove();
        return;
      }

      // Remove dangerous attributes
      for (const attr of dangerousAttrs) {
        node.removeAttribute(attr);
      }

      // Sanitize href/src attributes (remove javascript: URLs)
      for (const attr of ['href', 'src', 'action']) {
        const value = node.getAttribute(attr);
        if (value && value.trim().toLowerCase().startsWith('javascript:')) {
          node.removeAttribute(attr);
        }
      }

      // Remove style attributes that could be dangerous
      const style = node.getAttribute('style');
      if (style && /expression|javascript|behavior/i.test(style)) {
        node.removeAttribute('style');
      }
    }

    // Recurse into children
    for (const child of Array.from(node.childNodes)) {
      walk(child);
    }
  };

  walk(template.content);
  return template.innerHTML;
}

// 0. Version storage functions
async function saveVersionToIndexedDB(content, timestamp, docId) {
  try {
    const dbName = `versions-${docId}`;
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
      // All versions are kept - no cleanup, full history preserved
    };
  } catch (error) {
    console.error('Failed to save version:', error);
  }
}

async function getLatestVersionFromIndexedDB(docId) {
  return new Promise((resolve) => {
    const dbName = `versions-${docId}`;
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

// 1. Initialize Grokker WASM
async function initGrokkerWasm() {
  if (typeof Go === 'undefined') {
    console.error("Go WASM runtime not loaded. Make sure wasm_exec.js is loaded first.");
    throw new Error('Go WASM runtime not loaded');
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
    throw error;
  }
}

// 2. Declare a typingTimeout variable — it's needed across functions
let typingTimeout = null;
let lastSavedTimestamp = Date.now();
let lastSavedInterval = null;

function formatLastSaved(ts) {
  const diff = Date.now() - ts;
  if (diff < 15000) return 'Saved just now';
  if (diff < 60000) return `Saved ${Math.round(diff / 1000)}s ago`;
  if (diff < 3600000) return `Saved ${Math.round(diff / 60000)}m ago`;
  const d = new Date(ts);
  return `Saved at ${d.toLocaleTimeString()}`;
}

function updateLastSaved(ts = Date.now()) {
  lastSavedTimestamp = ts;
  const el = typeof document !== 'undefined' ? document.getElementById('last-saved') : null;
  if (el) {
    el.textContent = formatLastSaved(lastSavedTimestamp);
  }
}

function startLastSavedTicker() {
  if (lastSavedInterval) return;
  updateLastSaved(lastSavedTimestamp);
  lastSavedInterval = setInterval(() => updateLastSaved(lastSavedTimestamp), 15000);
}

// 3. Main initialization function
async function initApp() {
  try {
    await initAppInternal();
  } catch (err) {
    // Top-level error boundary - catches any uncaught errors during initialization
    console.error('[App] Fatal initialization error:', err);
    showErrorBanner('Application failed to start. Please refresh the page.');
  }
}

/**
 * Internal initialization logic, wrapped by initApp error boundary.
 * Separated to keep error handling clean and ensure all errors are caught.
 */
async function initAppInternal() {
  // Initialize WASM FIRST
  console.log("Initializing Rust WASM...");
  try {
    await initWasm();
    console.log("Rust WASM ready!");
  } catch (err) {
    console.error("Failed to initialize Rust WASM:", err);
    showErrorBanner("Failed to load Rust WASM. Try `make wasm` and reload.");
    return;
  }

  // Then initialize Grokker WASM
  console.log("Initializing Grokker WASM...");
  try {
    await initGrokkerWasm();
  } catch (err) {
    console.error("Failed to initialize Grokker WASM:", err);
    showErrorBanner("Failed to load Grokker WASM. Try `make grokker-wasm` and reload.");
  }
  
  // Initialize Diff WASM
  console.log("Initializing Diff WASM...");
  try {
    await initDiffWasm();
  } catch (err) {
    console.error("Failed to initialize Diff WASM:", err);
    showErrorBanner("Failed to load diff engine. Run `make diff-wasm` and reload.");
  }
  
  // Add a delay to ensure everything is ready
  await new Promise(resolve => setTimeout(resolve, 1000));
  console.log("All WASM modules should now be ready");  
    
// 3a. Parse document ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  const docParam = urlParams.get('doc');
  
  // 3b. Set up Automerge state: repository, document handle, awareness, etc., with one retry
  let repo, handle, doc, awareness, documentId, isNew;
  let loadAttempt = 0;
  async function loadAutomergeWithRetry() {
    try {
      return await setupAutomerge(docParam);
    } catch (err) {
      loadAttempt += 1;
      if (loadAttempt <= 1) {
        console.warn('[Automerge] retrying after failure:', err);
        await new Promise(resolve => setTimeout(resolve, 500));
        return loadAutomergeWithRetry();
      }
      throw err;
    }
  }

  try {
    ({ repo, handle, doc, awareness, documentId, isNew } = await loadAutomergeWithRetry());
  } catch (err) {
    console.error("Could not set up Automerge document:", err);
    showErrorBanner("Could not load document. Check your connection and refresh.");
    return;
  }
  startLastSavedTicker();

  // Register this document in the recent documents registry
  addDocument(documentId, getDocTitle(documentId));
  
  // If new document, log the shareable URL
  if (isNew) {
    console.log('[App] New document created. Share this URL:', window.location.href);
  }
    
  // Listen for document changes and save versions
  handle.on('change', ({ doc }) => {
    if (doc && doc.content !== undefined) {
      const content = typeof doc.content === 'string' ? doc.content : '';
      const timestamp = Date.now();
      
      // Save to IndexedDB with versioning
      saveVersionToIndexedDB(content, timestamp, documentId);
      updateLastSaved(timestamp);
    }
  });

    // Display truncated document ID and setup copy functionality
  const docNameEl = document.querySelector('#document-name');
  if (docNameEl) {
    // Show truncated ID (first 8 chars of the hash part)
    const shortId = documentId.replace('automerge:', '').slice(0, 8);
    docNameEl.textContent = shortId;
    // Show full URL on hover
    docNameEl.title = `Click to copy: ${window.location.href}`;
    docNameEl.style.cursor = 'pointer';

    docNameEl.addEventListener('click', () => {
      navigator.clipboard.writeText(window.location.href).then(() => {
        const original = docNameEl.textContent;
        docNameEl.textContent = 'Copied!';
        setTimeout(() => {
          docNameEl.textContent = original;
        }, 1500);
      });
    });
  }

  // Persist document title across page refreshes
  const titleInput = document.getElementById('document-title');
  if (titleInput) {
    const titleKey = `docTitle:${documentId}`;
    const savedTitle = localStorage.getItem(titleKey);
    if (savedTitle) {
      titleInput.value = savedTitle;
    }
    titleInput.addEventListener('input', () => {
      localStorage.setItem(titleKey, titleInput.value);
      // Also update the document registry
      updateTitle(documentId, titleInput.value);
    });
  }

  // 3b. Set up the CodeMirror editor
  // Validate required objects before proceeding - prevents silent failures downstream
  if (!handle) {
    throw new Error('Document handle is undefined - cannot initialize editor');
  }
  if (!awareness) {
    throw new Error('Awareness is undefined - cannot initialize editor');
  }

  let view;
  try {
    view = setupEditor(repo, handle, awareness);
  } catch (err) {
    console.error('[App] Failed to initialize editor:', err);
    showErrorBanner('Editor failed to load. Please refresh the page.');
    throw err; // Re-throw to stop further initialization
  }

  if (!view) {
    throw new Error('Editor view is undefined after setup');
  }

  //3b.i. Attach the editor globally available for menu actions
  window.editorView = view;
  const connectionStatus = document.getElementById('connection-status');
  const setConnectionStatus = (state, label) => {
    if (!connectionStatus) return;
    connectionStatus.className = `status-pill ${state}`;
    connectionStatus.textContent = label;
  };

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

  // 3h. Theme toggle
  const root = document.documentElement;
  const themeToggle = document.getElementById('theme-toggle');
  const activityLog = document.getElementById('user-log');
  const setLogThemeVars = (mode) => {
    const isDark = mode === 'dark';
    const bg = isDark ? '#0b1224' : '#ffffff';
    const border = isDark ? '#1f2937' : '#dadce0';
    const text = isDark ? '#e5e7eb' : '#333333';
    const handleBg = isDark ? '#0f172a' : '#f8f9fa';
    const handleBorder = border;
    const handleText = isDark ? '#e5e7eb' : '#3c4043';
    const handleHover = isDark ? '#111827' : '#e8eaed';

    root.style.setProperty('--user-log-bg', bg);
    root.style.setProperty('--user-log-border', border);
    root.style.setProperty('--user-log-text', text);
    root.style.setProperty('--user-log-handle-bg', handleBg);
    root.style.setProperty('--user-log-handle-border', handleBorder);
    root.style.setProperty('--user-log-handle-text', handleText);
    root.style.setProperty('--user-log-handle-hover', handleHover);

    return { bg, border, text, handleBg, handleBorder, handleText, handleHover };
  };
  const applyLogTheme = (mode) => {
    const { bg, border, text, handleBg, handleBorder, handleText, handleHover } = setLogThemeVars(mode);

    if (activityLog) {
      activityLog.style.setProperty('background-color', bg, 'important');
      activityLog.style.setProperty('border-color', border, 'important');
      activityLog.style.setProperty('color', text, 'important');
    }

    const logEntries = document.getElementById('log-entries');
    if (logEntries) {
      logEntries.style.setProperty('background-color', bg, 'important');
      logEntries.style.setProperty('color', text, 'important');
    }

    const logHandle = document.getElementById('log-drag-handle');
    if (logHandle) {
      logHandle.style.setProperty('background-color', handleBg, 'important');
      logHandle.style.setProperty('border-color', handleBorder, 'important');
      logHandle.style.setProperty('color', handleText, 'important');
      logHandle.dataset.hoverColor = handleHover;
    }
  };

  const applyTheme = (mode) => {
    if (mode === 'dark') {
      root.classList.add('theme-dark');
      if (activityLog) activityLog.classList.add('theme-dark');
      if (themeToggle) themeToggle.textContent = '☀️';
    } else {
      root.classList.remove('theme-dark');
      if (activityLog) activityLog.classList.remove('theme-dark');
      if (themeToggle) themeToggle.textContent = '🌙';
    }
    applyLogTheme(mode);
    localStorage.setItem('theme', mode);
  };
  const storedTheme = localStorage.getItem('theme');
  applyTheme(storedTheme === 'dark' ? 'dark' : 'light');
  const syncActivityLogTheme = () => {
    const mode = root.classList.contains('theme-dark') ? 'dark' : 'light';
    applyLogTheme(mode);
  };
  window.syncActivityLogTheme = syncActivityLogTheme;
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const next = root.classList.contains('theme-dark') ? 'light' : 'dark';
      applyTheme(next);
    });
  }

  // Connection status indicator
  // Uses browser online/offline plus repo network events to reflect connectivity
  window.addEventListener('online', () => setConnectionStatus('online', 'Online'));
  window.addEventListener('offline', () => setConnectionStatus('offline', 'Offline'));
  setConnectionStatus(navigator.onLine ? 'online' : 'offline', navigator.onLine ? 'Online' : 'Offline');
  if (repo) {
    repo.networkSubsystem?.on?.('connection', ({ status }) => {
      if (status === 'connected') {
        setConnectionStatus('online', 'Online');
      } else if (status === 'disconnected') {
        setConnectionStatus('offline', 'Offline');
      } else {
        setConnectionStatus('reconnecting', 'Reconnecting…');
      }
    });
  }
  
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
        // Store escaped characters to restore later
        const escapeMap = [];
        let result = markdown.replace(/\\([\\`*_{}[\]()#+\-.!>|])/g, (match, char) => {
          const placeholder = `\x00ESC${escapeMap.length}\x00`;
          escapeMap.push(char);
          return placeholder;
        });

        // Fenced code blocks (must be before inline code)
        result = result.replace(/```(\w*)\n?([\s\S]*?)```/g, (match, lang, code) => {
          const escaped = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
          return `<pre><code class="language-${lang || 'plaintext'}">${escaped}</code></pre>`;
        });

        // Tables (must be before other line-based processing) - allow leading whitespace
        result = result.replace(/^\s*(\|.+\|)\s*\n\s*(\|[-:| ]+\|)\s*\n((?:\s*\|.+\|\s*\n?)+)/gm, (match, header, separator, body) => {
          const headerCells = header.split('|').slice(1, -1).map(cell => `<th>${cell.trim()}</th>`).join('');
          const bodyRows = body.trim().split('\n').map(row => {
            const cells = row.split('|').slice(1, -1).map(cell => `<td>${cell.trim()}</td>`).join('');
            return `<tr>${cells}</tr>`;
          }).join('');
          return `<table><thead><tr>${headerCells}</tr></thead><tbody>${bodyRows}</tbody></table>`;
        });

        // Blockquotes - allow leading whitespace
        result = result.replace(/^\s*> (.*$)/gim, '<blockquote>$1</blockquote>');
        result = result.replace(/<\/blockquote>\n<blockquote>/g, '\n'); // Merge consecutive

        // Horizontal rules (must be before list processing) - allow leading whitespace
        result = result.replace(/^\s*(?:[-*_]){3,}\s*$/gm, '<hr>');

        // Headings (H6 to H1, longest match first) - allow leading whitespace
        result = result
          .replace(/^\s*###### (.*$)/gim, '<h6>$1</h6>')
          .replace(/^\s*##### (.*$)/gim, '<h5>$1</h5>')
          .replace(/^\s*#### (.*$)/gim, '<h4>$1</h4>')
          .replace(/^\s*### (.*$)/gim, '<h3>$1</h3>')
          .replace(/^\s*## (.*$)/gim, '<h2>$1</h2>')
          .replace(/^\s*# (.*$)/gim, '<h1>$1</h1>');

        // Task lists (must be before regular bullet lists)
        result = result
          .replace(/^\s*[-*+] \[x\] (.*$)/gim, '<li class="task task-done"><input type="checkbox" checked disabled> $1</li>')
          .replace(/^\s*[-*+] \[ \] (.*$)/gim, '<li class="task"><input type="checkbox" disabled> $1</li>');
        result = result.replace(/((?:^<li class="task[^"]*">.*<\/li>\n?)+)/gm, '<ul class="task-list">$1</ul>');

        // Bold, italic, strikethrough
        result = result
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/__(.*?)__/g, '<strong>$1</strong>')
          .replace(/\*(.*?)\*/g, '<em>$1</em>')
          .replace(/_(.*?)_/g, '<em>$1</em>')
          .replace(/~~(.*?)~~/g, '<del>$1</del>');

        // Inline code (after fenced blocks)
        result = result.replace(/`(.*?)`/g, '<code>$1</code>');

        // Bullet lists
        result = result.replace(/^\s*[-*+] (.*$)/gim, '<li class="bullet">$1</li>');
        result = result.replace(/((?:^<li class="bullet">.*<\/li>\n?)+)/gm, '<ul>$1</ul>');

        // Numbered lists
        result = result.replace(/^\s*\d+\. (.*$)/gim, '<li class="numbered">$1</li>');
        result = result.replace(/((?:^<li class="numbered">.*<\/li>\n?)+)/gm, '<ol>$1</ol>');

        // Images (before links to avoid conflict)
        result = result.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width:100%">');

        // Links
        result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');

        // Autolinked URLs (bare URLs not already in links)
        result = result.replace(/(?<!href="|src="|">)(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank">$1</a>');

        // Restore escaped characters
        escapeMap.forEach((char, i) => {
          result = result.replace(`\x00ESC${i}\x00`, char);
        });

        // Line breaks
        result = result.replace(/\n/g, '<br>');

        return result;
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
          previewElement.innerHTML = sanitizeHtml(html);
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
    
    // Listen to Automerge changes
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

  // 3h.1 Track cursor position and send to awareness
  view.dom.addEventListener("selectionchange", () => {
    const selection = view.state.selection.main;
    awareness.setLocalStateField("selection", { anchor: selection.anchor });
  });

  // Also track on mouseup and keyup for more reliable updates
  view.dom.addEventListener("mouseup", () => {
    const selection = view.state.selection.main;
    awareness.setLocalStateField("selection", { anchor: selection.anchor });
  });

  view.dom.addEventListener("keyup", () => {
    const selection = view.state.selection.main;
    awareness.setLocalStateField("selection", { anchor: selection.anchor });
  });
  
  // 3i. Hook up the Log toggle button *after* DOM is ready
  const toggleLogBtn = document.getElementById('toggle-log');
  const logPanel = document.getElementById('user-log');

  if (toggleLogBtn && logPanel) {
    toggleLogBtn.addEventListener('click', () => {
      const visible = logPanel.style.display !== 'none';
      logPanel.style.display = visible ? 'none' : 'block';
      if (typeof window.syncActivityLogTheme === 'function') {
        window.syncActivityLogTheme();
      }
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
}

// Global error handlers - catch any unhandled errors and show user-friendly message
window.addEventListener('error', (event) => {
  console.error('[App] Unhandled error:', event.error);
  showErrorBanner('An unexpected error occurred. Some features may not work correctly.');
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('[App] Unhandled promise rejection:', event.reason);
  showErrorBanner('An unexpected error occurred. Some features may not work correctly.');
});

// Run initialization immediately if DOM is ready, otherwise wait
if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', initApp);
} else {
  // DOM is already ready, run immediately
  initApp();
}
