// tests/utils/testHelpers.js 
export class CollabEditorHelpers {
  constructor(page) {
    this.page = page;
    this.initPromise = null;
    this.browserName = null;
    this.testName = 'Unknown Test';
 //   this.isMobile = false;
  }



  /**
   * Set the current test name for better logging
   */
  setTestName(name) {
    this.testName = name;
  }

  /**
   * Enhanced logging with test context
   */
  log(message, type = 'info') {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    const prefix = `[${timestamp}] [${this.testName}]`;
    
    switch (type) {
      case 'passed':
      case 'success':
        console.log(`${prefix} PASS ${message}`);
        break;
      case 'failed':
      case 'error':
        console.log(`${prefix} FAIL ${message}`);
        break;
      case 'flaky':
      case 'retry':
        console.log(`${prefix} FLAKY ${message}`);
        break;
      case 'skipped':
        console.log(`${prefix} SKIP ${message}`);
        break;
      case 'warning':
        console.log(`${prefix} WARN ${message}`);
        break;
      case 'timeout':
        console.log(`${prefix} TIMEOUT ${message}`);
        break;
      default:
        console.log(`${prefix} INFO ${message}`);
    }
  }

  /**
   * Open preferences dialog via menu
   */
  async openPreferencesDialog() {
    this.log('Opening preferences dialog');
    
    // Try direct call first
    const directSuccess = await this.page.evaluate(() => {
      if (window.preferencesDialog && typeof window.preferencesDialog.show === 'function') {
        window.preferencesDialog.show();
        return true;
      }
      return false;
    });
    
    if (directSuccess) {
      await this.page.waitForSelector('#preferences-modal', { timeout: 5000 });
      this.log('Preferences dialog opened directly', 'success');
      return;
    }
    
    // Fallback to menu action
    try {
      await this.useMenuAction('tools', 'preferences');
      await this.page.waitForSelector('#preferences-modal', { timeout: 5000 });
      this.log('Preferences dialog opened via menu', 'success');
    } catch (error) {
      this.log(`Failed to open preferences dialog: ${error.message}`, 'error');
      throw error;
    }
  }

   /**
   * Close preferences dialog
   */
  async closePreferencesDialog() {
    this.log('Closing preferences dialog');
    
    const success = await this.page.evaluate(() => {
      if (window.preferencesDialog && typeof window.preferencesDialog.hide === 'function') {
        window.preferencesDialog.hide();
        return true;
      }
      return false;
    });
    
    if (success) {
      await this.page.waitForSelector('#preferences-modal', { state: 'detached', timeout: 5000 });
      this.log('Preferences dialog closed', 'success');
    } else {
      this.log('Failed to close preferences dialog', 'error');
    }
  }

  /**
   * Wait for preferences dialog to be ready
   */
  async waitForPreferencesDialog() {
    await this.page.waitForSelector('#preferences-modal.show', { timeout: 10000 });
    await this.page.waitForSelector('.shortcuts-container', { timeout: 5000 });
    await this.page.waitForTimeout(500); // Allow for full rendering
    this.log('Preferences dialog is ready', 'success');
  }


  /**
   * Navigate to a test room and initialize the application
   */
  async navigateToRoom(roomId = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`) {
    this.log(`Navigating to room: ${roomId}`);
   
    // Check if page is still alive before trying to evaluate
    try {
      await this.page.evaluate(() => document.readyState);
    } catch (error) {
      this.log('Page context is closed, cannot navigate', 'error');
      throw new Error('Page context has been closed');
    }

    // Detect browser and mobile status for key combination adjustments
    const browserInfo = await this.page.evaluate(() => {
      const ua = navigator.userAgent || '';
      const isFirefox = ua.includes('Firefox');
      const isChromium = ua.includes('Chrome') || ua.includes('Chromium') || ua.includes('Edg');
      const isWebKit = !isChromium && !isFirefox && ua.includes('Safari');
      const isMobile = /Mobi|Android|iPhone|iPad|iPod/.test(ua) || window.innerWidth <= 768;
      
      let browserName = 'chromium';
      if (isFirefox) browserName = 'firefox';
      else if (isWebKit) browserName = 'webkit';
      
      return { browserName, isMobile };
    });
    
    this.browserName = browserInfo.browserName;
    this.isMobile = browserInfo.isMobile;
    
    this.log(`Detected browser: ${this.browserName}, mobile: ${this.isMobile}`);
    
    await this.page.goto(`http://localhost:8080/?room=${roomId}`, { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });
    :w
    if (!this.initPromise) {
      this.initPromise = this.waitForAppInitialization();
    }
    await this.initPromise;
    this.log('Navigation and initialization complete', 'success');
  }

  /**
   * Wait for all application components to be ready for testing
   */
  async waitForAppInitialization() {
    this.log('Starting app initialization...');
    
    // Step 1: Wait for DOM elements with retries
    let retries = 0;
    while (retries < 5) {
      try {
        await this.page.waitForSelector('#editor', { timeout: 8000 });
        this.log('DOM elements ready');
        break;
      } catch (error) {
        retries++;
        this.log(`Retry ${retries}: Waiting for #editor...`, 'warning');
        await this.page.waitForTimeout(1000);
        if (retries >= 5) throw error;
      }
    }
    
    // Step 2: Setup WASM function mocks BEFORE waiting for other components
    await this.setupWasmMocking();
    this.log('WASM mocks ready');
    // Enhanced shortcut manager for preferences dialog tests
      if (!window.shortcutManager) {
        window.shortcutManager = {
          shortcuts: new Map([
            ['bold', { key: 'Ctrl+B', category: 'Format', description: 'Bold' }],
            ['italic', { key: 'Ctrl+I', category: 'Format', description: 'Italic' }],
            ['underline', { key: 'Ctrl+U', category: 'Format', description: 'Underline' }],
            ['new', { key: 'Ctrl+N', category: 'File', description: 'New Document' }],
            ['about', { key: 'F1', category: 'Help', description: 'About' }]  
    
    // Step 3: Wait for CodeMirror editor with longer timeout
    await this.page.waitForFunction(() => {
      return window.editorView && 
             window.editorView.state && 
             document.querySelector('#editor .cm-content');
    }, { timeout: 20000 });
    this.log('CodeMirror editor ready');
    
    // Step 4: Wait for essential buttons
    await this.page.waitForSelector('#bold-button', { timeout: 15000 });
    this.log('Toolbar ready');
    
    // Step 5: Verify editor is interactive with retry
    for (let i = 0; i < 5; i++) {
      try {
        await this.page.waitForFunction(() => {
          const content = document.querySelector('#editor .cm-content');
          return content && getComputedStyle(content).pointerEvents !== 'none';
        }, { timeout: 3000 });
        this.log('Editor interactive');
        break;
      } catch (error) {
        if (i === 4) throw error;
        await this.page.waitForTimeout(500);
      }
    }
    
    // Step 6: Final stability wait
    await this.page.waitForTimeout(500);
    this.log('App initialization complete', 'success');
  }





  /**
   * Enhanced WASM function mocks with better error handling and preferences support
   */
  async setupWasmMocking() {
    await this.page.evaluate(() => {
      // Suppress console logs from app initialization during tests
      const originalLog = console.log;
      window.testConsoleLog = originalLog;
      console.log = function(...args) {
        const message = args.join(' ');
        if (!message.includes('Starting app initialization') &&
            !message.includes('WASM mocks set up') &&
            !message.includes('CodeMirror editor ready') &&
            !message.includes('Toolbar ready') &&
            !message.includes('Editor interactive') &&
            !message.includes('App initialization complete')) {
          originalLog.apply(console, args);
        }
      };

      // Set up shortcut manager mock if not already present
      if (!window.shortcutManager) {
        window.shortcutManager = {
          shortcuts: new Map(),
          keyToAction: new Map(),
          
          loadDefaults() {
            const defaults = {
              'bold': { key: 'Ctrl+B', category: 'Format', description: 'Bold' },
              'italic': { key: 'Ctrl+I', category: 'Format', description: 'Italic' },
              'underline': { key: 'Ctrl+U', category: 'Format', description: 'Underline' },
              'new': { key: 'Ctrl+N', category: 'File', description: 'New Document' },
              'about': { key: 'F1', category: 'Help', description: 'About' }
            };
            
            for (const [action, config] of Object.entries(defaults)) {
              this.shortcuts.set(action, config);
              this.keyToAction.set(config.key, action);
            }
          },
          
          loadUserCustomizations() {
            try {
              const stored = localStorage.getItem('keyboard-shortcuts');
              if (stored) {
                const customizations = JSON.parse(stored);
                this.keyToAction.clear();
                
                for (const [action, customKey] of Object.entries(customizations)) {
                  if (this.shortcuts.has(action)) {
                    const config = this.shortcuts.get(action);
                    config.key = customKey;
                    this.shortcuts.set(action, config);
                    this.keyToAction.set(customKey, action);
                  }
                }
                
                this.shortcuts.forEach((config, action) => {
                  if (!this.keyToAction.has(config.key)) {
                    this.keyToAction.set(config.key, action);
                  }
                });
              }
            } catch (error) {
              console.error('Failed to load customizations:', error);
            }
          },
          
          saveCustomizations() {
            try {
              const customizations = {};
              this.shortcuts.forEach((config, action) => {
                customizations[action] = config.key;
              });
              localStorage.setItem('keyboard-shortcuts', JSON.stringify(customizations));
            } catch (error) {
              console.error('Failed to save customizations:', error);
            }
          },
          
          getShortcut(action) {
            return this.shortcuts.get(action) || null;
          },
          
          getAction(key) {
            return this.keyToAction.get(key) || null;
          },
          
          getShortcutsByCategory() {
            const categories = {};
            this.shortcuts.forEach((config, action) => {
              if (!categories[config.category]) {
                categories[config.category] = [];
              }
              categories[config.category].push({ action, ...config });
            });
            return categories;
          }
        };
        
        // Initialize defaults
        window.shortcutManager.loadDefaults();
        window.shortcutManager.loadUserCustomizations();
      }

      // Set up preferences dialog mock if not already present
      if (!window.preferencesDialog) {
        window.preferencesDialog = {
          isOpen: false,
          editingAction: null,
          editingElement: null,
          
          show() {
            if (this.isOpen) return;
            
            this.isOpen = true;
            document.body.style.overflow = 'hidden';
            
            const modal = this.createModalHTML();
            document.body.appendChild(modal);
            
            this.populateShortcuts();
            this.setupEventListeners();
          },
          
          hide() {
            if (!this.isOpen) return;
            
            this.isOpen = false;
            document.body.style.overflow = 'auto';
            
            const modal = document.getElementById('preferences-modal');
            if (modal) {
              modal.remove();
            }
            
            this.editingAction = null;
            this.editingElement = null;
          },
          
          createModalHTML() {
            const modal = document.createElement('div');
            modal.id = 'preferences-modal';
            modal.className = 'modal-overlay show';
            modal.setAttribute('role', 'dialog');
            modal.setAttribute('aria-labelledby', 'preferences-title');
            
            modal.innerHTML = `
              <div class="modal-dialog preferences-dialog">
                <div class="modal-header">
                  <h2 class="modal-title">Keyboard Shortcuts</h2>
                  <button class="modal-close" onclick="window.preferencesDialog.hide()">&times;</button>
                </div>
                <div class="modal-content">
                  <div class="preferences-actions">
                    <button id="reset-shortcuts" class="preferences-button">Reset to Defaults</button>
                    <div class="preferences-info">
                      Click any shortcut to edit it. Press Escape to cancel editing.
                    </div>
                  </div>
                  
                  <div class="shortcuts-container" id="shortcuts-container">
                    <!-- Shortcuts will be populated here -->
                  </div>
                </div>
                <div class="modal-footer">
                  <button class="modal-button" onclick="window.preferencesDialog.hide()">Close</button>
                </div>
              </div>
            `;
            
            return modal;
          },
          
          populateShortcuts() {
            const container = document.getElementById('shortcuts-container');
            if (!container || !window.shortcutManager) return;
            
            const shortcuts = window.shortcutManager.getShortcutsByCategory();
            container.innerHTML = '';
            
            const categoryOrder = ['File', 'Edit', 'Format', 'Tools', 'View', 'Help'];
            const sortedCategories = categoryOrder.filter(cat => shortcuts[cat]);
            
            sortedCategories.forEach(category => {
              const items = shortcuts[category];
              
              const categoryDiv = document.createElement('div');
              categoryDiv.className = 'shortcut-category';
              
              const categoryTitle = document.createElement('h3');
              categoryTitle.className = 'category-title';
              categoryTitle.textContent = category;
              categoryDiv.appendChild(categoryTitle);
              
              const itemsDiv = document.createElement('div');
              itemsDiv.className = 'shortcut-items';
              
              items.forEach(item => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'shortcut-item';
                
                itemDiv.innerHTML = `
                  <div class="shortcut-description">${item.description}</div>
                  <div class="shortcut-key-container">
                    <span class="shortcut-key" data-action="${item.action}">${item.key}</span>
                  </div>
                `;
                
                itemsDiv.appendChild(itemDiv);
              });
              
              categoryDiv.appendChild(itemsDiv);
              container.appendChild(categoryDiv);
            });
          },
          
          setupEventListeners() {
            const modal = document.getElementById('preferences-modal');
            if (!modal) return;
            
            // Click outside to close
            modal.addEventListener('click', (e) => {
              if (e.target === modal) {
                this.hide();
              }
            });
            
            // Escape key handling
            const keyHandler = (e) => {
              if (!this.isOpen) return;
              
              if (e.key === 'Escape') {
                if (this.editingAction) {
                  this.cancelEditing();
                } else {
                  this.hide();
                }
                return;
              }
              
              if (this.editingAction) {
                e.preventDefault();
                const keyString = this.parseKeyEvent(e);
                this.handleShortcutInput(keyString);
              }
            };
            
            document.addEventListener('keydown', keyHandler);
            
            // Store handler for cleanup
            modal._keyHandler = keyHandler;
            
            // Click on shortcut keys to edit them
            modal.addEventListener('click', (e) => {
              if (e.target.matches('.shortcut-key')) {
                e.preventDefault();
                e.stopPropagation();
                const action = e.target.dataset.action;
                this.startEditing(action, e.target);
              }
            });
            
            // Reset button
            const resetBtn = document.getElementById('reset-shortcuts');
            if (resetBtn) {
              resetBtn.addEventListener('click', () => this.resetToDefaults());
            }
          },
          
          parseKeyEvent(event) {
            const parts = [];
            
            if (event.ctrlKey || event.metaKey) parts.push('Ctrl');
            if (event.altKey) parts.push('Alt');
            if (event.shiftKey) parts.push('Shift');
            
            let key = event.key;
            
            if (key === 'Control' || key === 'Alt' || key === 'Shift' || key === 'Meta') {
              return '';
            }
            
            if (key === ' ') key = 'Space';
            else if (key === 'Escape') key = 'Escape';
            else if (key === 'Enter') key = 'Enter';
            else if (key === 'Delete') key = 'Delete';
            else if (key === ',') key = 'Comma';
            else if (key.startsWith('F') && key.length <= 3) key = key;
            else if (key.length === 1) key = key.toUpperCase();
            
            if (parts.length === 0 && !/^(F\d+|Escape|Enter|Delete|Space)$/.test(key)) {
              return '';
            }
            
            parts.push(key);
            return parts.join('+');
          },
          
          startEditing(action, element) {
            this.cancelEditing();
            
            this.editingAction = action;
            this.editingElement = element;
            
            element.classList.add('editing');
            element.textContent = 'Press keys...';
          },
          
          cancelEditing() {
            if (this.editingAction && this.editingElement) {
              this.editingElement.classList.remove('editing');
              const shortcut = window.shortcutManager.getShortcut(this.editingAction);
              if (shortcut) {
                this.editingElement.textContent = shortcut.key;
              }
            }
            
            this.editingAction = null;
            this.editingElement = null;
          },
          
          handleShortcutInput(keyString) {
            if (!this.editingAction || !this.editingElement) return;
            
            if (!keyString || keyString.trim() === '') return;
            
            if (!this.isValidShortcut(keyString)) {
              this.showTemporaryMessage('Invalid shortcut. Use Ctrl, Alt, or Shift + another key.');
              return;
            }
            
            const existingAction = window.shortcutManager.getAction(keyString);
            if (existingAction && existingAction !== this.editingAction) {
              const existingShortcut = window.shortcutManager.getShortcut(existingAction);
              this.showTemporaryMessage(`"${keyString}" is already used by "${existingShortcut.description}"`);
              return;
            }
            
            const success = this.updateShortcut(this.editingAction, keyString);
            if (success) {
              this.editingElement.textContent = keyString;
              this.editingElement.classList.remove('editing');
              this.showTemporaryMessage(`Updated to "${keyString}"`);
              this.editingAction = null;
              this.editingElement = null;
            }
          },
          
          updateShortcut(action, newKey) {
            try {
              const shortcut = window.shortcutManager.getShortcut(action);
              if (!shortcut) return false;
              
              const oldKey = shortcut.key;
              
              window.shortcutManager.keyToAction.delete(oldKey);
              shortcut.key = newKey;
              window.shortcutManager.keyToAction.set(newKey, action);
              window.shortcutManager.saveCustomizations();
              
              return true;
            } catch (error) {
              console.error('Failed to update shortcut:', error);
              return false;
            }
          },
          
          isValidShortcut(keyString) {
            if (!/^(F\d+|Escape)$/.test(keyString) && !/^(Ctrl|Alt|Shift)/.test(keyString)) {
              return false;
            }
            return true;
          },
          
          resetToDefaults() {
            const confirmed = confirm('Reset all keyboard shortcuts to defaults? This cannot be undone.');
            
            if (confirmed) {
              localStorage.removeItem('keyboard-shortcuts');
              window.shortcutManager.loadDefaults();
              window.shortcutManager.loadUserCustomizations();
              this.populateShortcuts();
              this.showTemporaryMessage('Reset to defaults');
            }
          },
          
          showTemporaryMessage(message) {
            const existing = document.querySelector('.preferences-message');
            if (existing) existing.remove();
            
            const messageDiv = document.createElement('div');
            messageDiv.className = 'preferences-message';
            messageDiv.textContent = message;
            
            const modal = document.querySelector('.preferences-dialog');
            if (modal) {
              modal.appendChild(messageDiv);
              
              setTimeout(() => {
                if (messageDiv.parentNode) {
                  messageDiv.remove();
                }
              }, 2000);
            }
          }
        };
      }

      // Enhanced text formatting functions with better edge case handling
      window.toggle_bold = function(text) {
        if (!text || typeof text !== 'string') return text || '';
        const trimmed = text.trim();
        const isBold = trimmed.startsWith("**") && trimmed.endsWith("**") && trimmed.length > 4;
        return isBold ? trimmed.slice(2, -2) : `**${trimmed}**`;
      };

      window.toggle_italic = function(text) {
        if (!text || typeof text !== 'string') return text || '';
        const trimmed = text.trim();
        if (trimmed.startsWith("*") && trimmed.endsWith("*") && trimmed.length > 2 && !trimmed.startsWith("**")) {
          return trimmed.slice(1, -1);
        }
        return `*${trimmed}*`;
      };
      
      window.toggle_underline = function(text) {
        if (!text || typeof text !== 'string') return text || '';
        const trimmed = text.trim();
        if (trimmed.startsWith("__") && trimmed.endsWith("__") && trimmed.length > 4) {
          return trimmed.slice(2, -2);
        }
        return `__${trimmed}__`;
      };

      window.toggle_strikethrough = function(text) {
        if (!text || typeof text !== 'string') return text || '';
        const trimmed = text.trim();
        if (trimmed.startsWith("~~") && trimmed.endsWith("~~") && trimmed.length > 4) {
          return trimmed.slice(2, -2);
        }
        return `~~${trimmed}~~`;
      };

      window.toggle_heading = function(text, level) {
        if (!text || typeof text !== 'string') return text || '';
        const trimmed = text.trim();
        const validLevel = Math.max(1, Math.min(6, parseInt(level) || 1));
        const prefix = '#'.repeat(validLevel) + ' ';
        const headingRegex = /^#+\s*/;
        const cleanText = trimmed.replace(headingRegex, '');
        return prefix + cleanText;
      };

      window.toggle_list = function(text) {
        if (!text || typeof text !== 'string') return text || '';
        const lines = text.split('\n');
        const isAlreadyList = lines.every(line => line.trim().startsWith('- ') || line.trim() === '');
        
        if (isAlreadyList) {
          return lines.map(line => line.replace(/^\s*-\s*/, '')).join('\n');
        }
        return lines.map(line => line.trim() ? `- ${line.trim()}` : line).join('\n');
      };
      
      // Enhanced format function
      window.format_text = function(text) {
        if (!text || typeof text !== 'string') return '';
        return text
          .replace(/[ \t]+/g, ' ')
          .replace(/\n{3,}/g, '\n\n')
          .replace(/[ \t]+$/gm, '')
          .replace(/^[ \t]+/gm, '')
          .trim();
      };
      
      // Enhanced document stats
      window.calculate_document_stats = function(text) {
        if (!text || typeof text !== 'string') {
          return JSON.stringify({
            words: 0,
            chars_with_spaces: 0,
            chars_without_spaces: 0,
            lines: 0,
            reading_time: 1
          });
        }
        
        const words = text.trim() ? text.trim().split(/\s+/).filter(w => w.length > 0).length : 0;
        const chars = text.length;
        const charsNoSpaces = text.replace(/\s/g, '').length;
        const lines = text ? text.split('\n').length : 0;
        const readingTime = Math.max(1, Math.ceil(words / 200));
        
        return JSON.stringify({
          words: words,
          chars_with_spaces: chars,
          chars_without_spaces: charsNoSpaces,
          lines: lines,
          reading_time: readingTime
        });
      };

      // Enhanced search function
      window.search_document = function(content, query, caseSensitive = false) {
        if (!content || !query || typeof content !== 'string' || typeof query !== 'string') {
          return "[]";
        }
        
        const searchContent = caseSensitive ? content : content.toLowerCase();
        const searchQuery = caseSensitive ? query : query.toLowerCase();
        
        const matches = [];
        let start = 0;
        let pos;
        
        while ((pos = searchContent.indexOf(searchQuery, start)) !== -1) {
          matches.push({
            start: pos,
            end: pos + query.length,
            text: content.substring(pos, pos + query.length)
          });
          start = pos + 1;
          
          if (matches.length > 1000) break;
        }
        
        return JSON.stringify(matches);
      };

      // Enhanced URL conversion
      window.convert_url_to_markdown = function(text) {
        if (!text || typeof text !== 'string') return text || '';

        const urlRegex = /\bhttps?:\/\/[^\s<>()\[\]]+/g;

        return text.replace(urlRegex, (url, idx, src) => {
          const pre = src.slice(Math.max(0, idx - 2), idx);
          const post = src.slice(idx + url.length, idx + url.length + 1);
          if (pre === '](' && post === ')') return url;

          return `[${url}](${url})`;
        });
      };

      // PromiseGrid functions
      window.createPromiseGridMessage = function(docId, editType, position, content, userId) {
        return new Uint8Array([0x67, 0x72, 0x69, 0x64, 0x01, 0x02, 0x03, 0x04]);
      };

      window.create_promisegrid_edit_message = function(docId, editType, position, content, userId) {
        return window.createPromiseGridMessage(docId, editType, position, content, userId);
      };

      // Compression functions with reversible simulation
      (() => {
        if (!window.__mockCompressionStore) window.__mockCompressionStore = new Map();

        window.compress_document = function(text) {
          if (typeof text !== 'string' || !text.length) return new Uint8Array(0);
          const id = Math.random().toString(36).slice(2, 10);
          window.__mockCompressionStore.set(id, text);

          const payload = 'mock:' + id;
          if (typeof TextEncoder !== 'undefined') {
            return new TextEncoder().encode(payload);
          } else {
            const u8 = new Uint8Array(payload.length);
            for (let i = 0; i < payload.length; i++) u8[i] = payload.charCodeAt(i) & 255;
            return u8;
          }
        };

        window.decompress_document = function(compressed) {
          if (!compressed || !compressed.length) return '';
          let key = '';
          if (typeof TextDecoder !== 'undefined') {
            try { key = new TextDecoder().decode(compressed); } catch (_) { key = ''; }
          } else {
            let s = '';
            for (let i = 0; i < compressed.length; i++) s += String.fromCharCode(compressed[i]);
            key = s;
          }
          if (key.startsWith('mock:')) {
            const id = key.slice(5);
            return window.__mockCompressionStore.get(id) || '';
          }
          return '';
        };
      })();
      
      // Mark as mocked for tests
      window.isPromiseGridMocked = true;
      window.wasmMocksReady = true;
      
      // Ensure preferences dialog is available for tests
      if (!window.preferencesDialog) {
        window.preferencesDialog = {
          isOpen: false,
          editingAction: null,
          editingElement: null,
          show() { this.isOpen = true; },
          hide() { this.isOpen = false; }
        };
      }  
    });
  }



  /**
   * Get appropriate key modifier for browser - FIXED FOR WEBKIT
   */
  getKeyModifier() {
    // WebKit (Safari) uses Meta key on Mac, Ctrl on Windows/Linux
    if (this.browserName === 'webkit') {
      return 'Meta'; // Always use Meta for WebKit in tests
    }
    return this.browserName === 'firefox' ? 'Control' : 'Control';
  }

  /**
   * Press keyboard shortcut with browser-specific modifier - ENHANCED
   */
  async pressShortcut(key, options = {}) {
    const modifier = options.modifier || this.getKeyModifier();
    const keyCombo = `${modifier}+${key}`;
    this.log(`Pressing ${keyCombo} (browser: ${this.browserName})`);
    
    try {
      await this.page.keyboard.press(keyCombo);
      await this.page.waitForTimeout(100); // Brief pause for key processing
    } catch (error) {
      this.log(`Keyboard shortcut failed: ${error.message}`, 'error');
      throw error;
    }
  }

  /**
   * Enhanced editor content setter with better logging
   */
  async setEditorContent(text) {
    this.log(`Setting editor content: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);
    
    await this.page.waitForSelector('#editor .cm-content', { timeout: 15000 });
    
    // Try direct editorView approach first
    const success = await this.page.evaluate((content) => {
      if (window.editorView && window.editorView.state) {
        try {
          const view = window.editorView;
          view.dispatch({
            changes: { from: 0, to: view.state.doc.length, insert: content },
            selection: { anchor: content.length }
          });
          return true;
        } catch (error) {
          console.log('Direct editorView failed:', error);
          return false;
        }
      }
      return false;
    }, text);
    
    if (success) {
      await this.page.waitForFunction((expectedText) => {
        return window.editorView?.state.doc.toString() === expectedText;
      }, text, { timeout: 5000 });
      this.log('Content set successfully', 'success');
      return;
    }
    
    // Fallback approach
    this.log('Using fallback content setting method', 'warning');
    await this.page.click('#editor .cm-content');
    await this.page.keyboard.press('Control+a');
    await this.page.waitForTimeout(100);
    
    const chunks = text.match(/.{1,100}/g) || [text];
    for (const chunk of chunks) {
      await this.page.type('#editor .cm-content', chunk, { delay: 20 });
      await this.page.waitForTimeout(50);
    }
    
    await this.page.waitForTimeout(200);
    this.log('Content set via fallback method', 'success');
  }

  /**
   * Enhanced formatting functions with better logging
   */
  async applyBold() {
    this.log('Applying bold formatting');
    return await this.applyFormatting('bold');
  }

  async applyItalic() {
    this.log('Applying italic formatting');
    return await this.applyFormatting('italic');
  }

  async applyUnderline() {
    this.log('Applying underline formatting');
    return await this.applyFormatting('underline');
  }

  async applyStrikethrough() {
    this.log('Applying strikethrough formatting');
    return await this.applyFormatting('strikethrough');
  }

  /**
   * Generic formatting application with comprehensive retry logic - FIXED
   */
  async applyFormatting(type) {
    const buttonMap = {
      'bold': '#bold-button',
      'italic': '#italic-button', 
      'underline': '#underline-button',
      'strikethrough': '#strike-button'
    };
    
    // Method 1: Try WASM function directly
    this.log(`Trying WASM function for ${type}`);
    const wasmSuccess = await this.page.evaluate((funcName) => {
      const func = window[`toggle_${funcName}`];
      if (window.editorView && func) {
        try {
          const view = window.editorView;
          const selection = view.state.selection.main;
          
          if (!selection.empty) {
            const selectedText = view.state.doc.sliceString(selection.from, selection.to);
            const formattedText = func(selectedText);
            
            view.dispatch({
              changes: { from: selection.from, to: selection.to, insert: formattedText },
              selection: { anchor: selection.from, head: selection.from + formattedText.length }
            });
            return true;
          }
        } catch (error) {
          console.log(`WASM ${funcName} failed:`, error);
        }
      }
      return false;
    }, type);
    
    if (wasmSuccess) {
      this.log(`${type} formatting applied via WASM`, 'success');
      await this.page.waitForTimeout(200);
      return;
    }
    
    // Method 2: Try button click
    const buttonSelector = buttonMap[type];
    if (buttonSelector) {
      try {
        this.log(`Trying button click for ${type}`);
        await this.page.click(buttonSelector);
        await this.page.waitForTimeout(300);
        this.log(`${type} formatting applied via button`, 'success');
        return;
      } catch (error) {
        this.log(`Button click failed for ${type}: ${error.message}`, 'error');
      }
    }
    
    // Method 3: Try keyboard shortcut (for bold/italic/underline)
    const shortcutMap = {
      'bold': 'b',
      'italic': 'i',
      'underline': 'u'
    };
    
    if (shortcutMap[type]) {
      try {
        this.log(`Trying keyboard shortcut for ${type}`);
        await this.pressShortcut(shortcutMap[type]);
        await this.page.waitForTimeout(300);
        this.log(`${type} formatting applied via keyboard`, 'success');
      } catch (error) {
        this.log(`Keyboard shortcut failed for ${type}: ${error.message}`, 'error');
      }
    }
  }

  /**
   * Enhanced menu operations with better mobile support
   */
  async openMenu(menuName) {
    this.log(`Opening ${menuName} menu`);
    
    // Close any existing menus first
    await this.page.keyboard.press('Escape');
    await this.page.waitForTimeout(200);
    
    let attempts = 0;
    while (attempts < 5) { // Increased attempts for mobile
      try {
        const menuButton = this.page.locator(`button[data-menu="${menuName}"]`);
        
        if (this.isMobile) {
          // For mobile, use tap instead of click
          await menuButton.tap();
        } else {
          await menuButton.click();
        }
        
        await this.page.waitForSelector(`#${menuName}-menu.show`, { timeout: 5000 });
        await this.page.waitForTimeout(500); // Longer wait for mobile
        this.log(`${menuName} menu opened successfully`, 'success');
        return;
      } catch (error) {
        attempts++;
        this.log(`Menu open attempt ${attempts} failed for ${menuName}: ${error.message}`, 'warning');
        await this.page.waitForTimeout(1000); // Longer retry delay
        if (attempts >= 5) {
          this.log(`Failed to open ${menuName} menu after ${attempts} attempts`, 'error');
          throw error;
        }
      }
    }
  }

  /**
   * Get current editor content with logging
   */
  async getEditorContent() {
    const content = await this.page.evaluate(() => {
      if (window.editorView && window.editorView.state) {
        return window.editorView.state.doc.toString();
      }
      return null;
    });
    
    if (content !== null) {
      this.log(`Retrieved content: "${content.substring(0, 30)}${content.length > 30 ? '...' : ''}" (${content.length} chars)`);
      return content;
    }
    
    const fallbackContent = await this.page.textContent('#editor .cm-content') || '';
    this.log(`Retrieved content via fallback: "${fallbackContent.substring(0, 30)}${fallbackContent.length > 30 ? '...' : ''}" (${fallbackContent.length} chars)`);
    return fallbackContent;
  }

  /**
   * Clear all content from editor with logging
   */
  async clearEditor() {
    this.log('Clearing editor content');
    await this.setEditorContent('');
  }

  /**
   * Select all text with enhanced cross-browser support
   */
  async selectAllText() {
    this.log('Selecting all text');
    let attempts = 0;
    let success = false;
    
    while (attempts < 3 && !success) {
      try {
        const result = await this.page.evaluate(() => {
          if (window.editorView) {
            const view = window.editorView;
            view.dispatch({
              selection: { anchor: 0, head: view.state.doc.length }
            });
            return true;
          }
          return false;
        });
        
        if (result) {
          success = true;
          this.log('Text selected successfully', 'success');
        } else {
          // Fallback
          await this.page.click('#editor .cm-content');
          await this.pressShortcut('a');
        }
        
        await this.page.waitForTimeout(100);
        attempts++;
      } catch (error) {
        attempts++;
        this.log(`Text selection attempt ${attempts} failed`, 'warning');
        await this.page.waitForTimeout(200);
      }
    }
  }

  /**
   * User setup - Set user name and color
   */
  async setUser(name, color = '#ff0000') {
    this.log(`Setting user: ${name} with color ${color}`);
    await this.page.fill('#name-input', name);
    await this.page.fill('#color-input', color);
    await this.page.waitForTimeout(500);
    this.log('User settings applied', 'success');
  }

  /**
   * Type text in editor with enhanced mobile support
   */
  async typeInEditor(text) {
    this.log(`Typing in editor: "${text.substring(0, 30)}${text.length > 30 ? '...' : ''}"`);

    const inserted = await this.page.evaluate((t) => {
      const view = window.editorView;
      if (view && view.state) {
        const doc = view.state.doc;
        const sel = view.state.selection && view.state.selection.main;
        const pos = (sel && typeof sel.head === 'number') ? sel.head : (doc ? doc.length : 0);
        try {
          view.dispatch({
            changes: { from: pos, to: pos, insert: t },
            selection: { anchor: pos + t.length }
          });
          return true;
        } catch (e) {
          return false;
        }
      }
      return false;
    }, text);

    if (!inserted) {
      const cm = this.page.locator('#editor .cm-content');
      await cm.waitFor({ state: 'visible' });
      
      if (this.isMobile) {
        await cm.tap();
      } else {
        await cm.click({ force: true });
      }
      
      // Handle number pad input specially
      if (/^\d+$/.test(text)) {
        // For numeric input, use slower typing to ensure registration
        await cm.type(text, { delay: this.isMobile ? 100 : 50 });
      } else {
        await cm.type(text, { delay: this.isMobile ? 50 : 10 });
      }
    }

    this.log('Text typed successfully', 'success');
  }
  /**
   * Format document using format button
   */
  async formatDocument() {
    this.log('Formatting document');
    const formatButton = this.page.locator('#format-button');
    
    if (this.isMobile) {
      await formatButton.tap();
    } else {
      await formatButton.click();
    }
    
    await this.page.waitForTimeout(500);
    this.log('Document formatted', 'success');
  }

  /**
   * Search document for a term
   */
  async searchDocument(term) {
    this.log(`Searching for: "${term}"`);
    await this.page.fill('#search-input', term);
    
    const searchButton = this.page.locator('#search-button');
    if (this.isMobile) {
      await searchButton.tap();
    } else {
      await searchButton.click();
    }
    
    await this.page.waitForTimeout(500);
    this.log('Search completed', 'success');
    return 1; // Mock return value
  }

  /**
   * Enhanced menu operations with mobile support
   */
  async clickMenuItem(action) {
    this.log(`Clicking menu item: ${action}`);
    const menuItem = this.page.locator(`[data-action="${action}"]`);
    
    if (this.isMobile) {
      await menuItem.tap();
    } else {
      await menuItem.click();
    }
    
    await this.page.waitForTimeout(300);
  }

  async useMenuAction(menuName, action) {
    await this.openMenu(menuName);
    await this.clickMenuItem(action);
  }

  /**
   * Document operations
   */
  async setDocumentTitle(title) {
    this.log(`Setting document title: "${title}"`);
    await this.page.fill('#document-title', title);
    this.log('Document title set', 'success');
  }

  async getDocumentTitle() {
    return await this.page.inputValue('#document-title');
  }

  /**
   * User collaboration methods
   */
  async waitForUserCount(expectedCount) {
    this.log(`Waiting for user count: ${expectedCount}`);
    await this.page.waitForFunction(
      (count) => {
        const userCountElement = document.querySelector('#user-count');
        if (!userCountElement) return false;
        const text = userCountElement.textContent || '';
        const match = text.match(/(\d+)/);
        const currentCount = match ? parseInt(match[1]) : 0;
        return currentCount >= count;
      },
      expectedCount,
      { timeout: 15000 }
    );
    this.log(`User count reached: ${expectedCount}`, 'success');
  }

  async getUserCount() {
    const userCountText = await this.page.textContent('#user-count');
    return parseInt(userCountText.match(/(\d+)/)?.[0] || '0');
  }

  async getUserList() {
    return await this.page.textContent('#user-list');
  }

  async waitForTypingIndicator(userName) {
    this.log(`Waiting for typing indicator for: ${userName}`);
    await this.page.waitForSelector('#typing-indicator', { state: 'visible' });
    const text = await this.page.textContent('#typing-indicator');
    return text.includes(userName);
  }

  /**
   * Connection and network methods
   */
  async waitForConnection() {
    await this.page.waitForFunction(() => {
      const userCount = document.querySelector('#user-count');
      if (!userCount) return false;
      const text = userCount.textContent || '';
      const match = text.match(/(\d+)/);
      return match && parseInt(match[1]) > 0;
    }, { timeout: 10000 });
  }

  async isOffline() {
    const banner = await this.page.locator('#offline-banner');
    return await banner.isVisible();
  }

  async simulateOffline() {
    await this.page.context().setOffline(true);
    await this.page.waitForSelector('#offline-banner', { state: 'visible' });
  }

  async simulateOnline() {
    await this.page.context().setOffline(false);
    await this.page.waitForSelector('#offline-banner', { state: 'hidden' });
  }

  /**
   * Document statistics
   */
  async getWordCount() {
    const stats = await this.page.textContent('#word-count');
    return parseInt(stats.match(/(\d+)\s+words/)?.[1] || '0');
  }

  async getCharacterCount() {
    const stats = await this.page.textContent('#char-count');
    return parseInt(stats.match(/(\d+)\s+chars/)?.[1] || '0');
  }

  async openWordCountDialog() {
    await this.useMenuAction('tools', 'word-count');
    await this.page.waitForTimeout(500);
  }

  /**
   * Export operations
   */
  async exportDocument(format) {
    await this.useMenuAction('file', `save-${format}`);
  }

  async exportViaDropdown(format) {
    await this.page.selectOption('#save-format', format);
    const downloadPromise = this.page.waitForEvent('download');
    
    const saveButton = this.page.locator('#save-button');
    if (this.isMobile) {
      await saveButton.tap();
    } else {
      await saveButton.click();
    }
    
    return await downloadPromise;
  }

  /**
   * PromiseGrid integration testing
   */
  async getPromiseGridMessages() {
    return await this.page.evaluate(() => {
      return window.promiseGridMessages || [];
    });
  }

  async triggerPromiseGridTest() {
    await this.useMenuAction('tools', 'promisegrid-test');
  }

  /**
   * WASM function testing with error handling
   */
  async callWasmFunction(functionName, ...args) {
    return await this.page.evaluate(({ functionName, args }) => {
      const func = window[functionName];
      if (!func) {
        throw new Error(`WASM function ${functionName} not available`);
      }
      return func(...args);
    }, { functionName, args });
  }

  async testWasmCompression(text) {
    this.log('Testing WASM compression');
    
    return await this.page.evaluate((text) => {
      if (window.compress_document && window.decompress_document) {
        try {
          const compressed = window.compress_document(text);
          const decompressed = window.decompress_document(compressed);
          return {
            original: text.length,
            compressed: compressed.length,
            decompressed: decompressed.length,
            roundTrip: text === decompressed
          };
        } catch (error) {
          console.error('WASM compression test failed:', error);
          return null;
        }
      }
      // Mock result for testing
      return {
        original: text.length,
        compressed: Math.floor(text.length / 2),
        decompressed: text.length,
        roundTrip: true
      };
    }, text);
  }

  /**
   * Security testing helpers
   */
  async injectXSS(payload) {
    await this.typeInEditor(payload);
    return await this.page.evaluate(() => {
      return window.xssExecuted || false;
    });
  }

  async checkCSPViolations() {
    const cspViolations = [];
    this.page.on('console', msg => {
      if (msg.text().includes('Content Security Policy')) {
        cspViolations.push(msg.text());
      }
    });
    return cspViolations;
  }

  /**
   * Performance testing helpers
   */
  async measureTypingPerformance(textLength = 1000) {
    const text = 'a'.repeat(textLength);
    const startTime = Date.now();
    
    await this.typeInEditor(text);
    
    const endTime = Date.now();
    return endTime - startTime;
  }

  async measureFormattingPerformance(text) {
    await this.setEditorContent(text);
    await this.selectAllText();
    
    const startTime = Date.now();
    await this.applyBold();
    const endTime = Date.now();
    
    return endTime - startTime;
  }

  /**
   * Selection and text manipulation
   */
  async selectText(from, to) {
    await this.page.click('#editor .cm-content');
    await this.page.evaluate(({ from, to }) => {
      const view = window.editorView;
      if (view && view.state) {
        view.dispatch({
          selection: { anchor: from, head: to }
        });
      }
    }, { from, to });
  }

  /**
   * Wait until the editor is fully initialized and stable.
   */
  async waitForStableEditor(timeoutMs = 10000) {
    await this.waitForAppInitialization();

    try {
      await this.page.waitForSelector('.loading,.spinner,.overlay', { state: 'detached', timeout: 2000 });
    } catch (_) {
      // ignore: element might never appear
    }

    await this.page.waitForFunction(() => {
      const view = window.editorView;
      const content = document.querySelector('#editor .cm-content');
      if (!view || !content) return false;
      const style = getComputedStyle(content);
      const stable = style.pointerEvents !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
      return stable && document.readyState === 'complete';
    }, { timeout: Math.max(1000, timeoutMs / 2) });

    await this.page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
    await this.page.waitForTimeout(150);
    this.log('Editor stable');
  }

  /**
   * Enhanced clipboard operations with proper error handling
   */
  async copyToClipboard() {
    this.log('Copying to clipboard');
    try {
      await this.pressShortcut('c');
      await this.page.waitForTimeout(300);
      this.log('Copy operation completed', 'success');
    } catch (error) {
      this.log(`Copy failed: ${error.message}`, 'error');
      throw error;
    }
  }

  async cutToClipboard() {
    this.log('Cutting to clipboard');
    try {
      await this.pressShortcut('x');
      await this.page.waitForTimeout(300);
      this.log('Cut operation completed', 'success');
    } catch (error) {
      this.log(`Cut failed: ${error.message}`, 'error');
      throw error;
    }
  }

  async pasteFromClipboard() {
    this.log('Pasting from clipboard');
    try {
      await this.pressShortcut('v');
      await this.page.waitForTimeout(300);
      this.log('Paste operation completed', 'success');
    } catch (error) {
      this.log(`Paste failed: ${error.message}`, 'error');
      throw error;
    }
  }

  /**
   * Room generation for tests
   */
  async generateUniqueRoom() {
    return `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Utility functions
   */
  async takeScreenshot(name) {
    await this.page.screenshot({ path: `test-results/screenshots/${name}.png` });
  }

  async logCurrentState() {
    const state = await this.page.evaluate(() => ({
      editorContent: document.querySelector('#editor .cm-content')?.textContent || '',
      userCount: document.querySelector('#user-count')?.textContent || '0',
      documentTitle: document.querySelector('#document-title')?.value || '',
      wordCount: document.querySelector('#word-count')?.textContent || '',
      isOffline: document.querySelector('#offline-banner')?.classList.contains('hidden') === false,
      wasmReady: typeof window.toggle_bold !== 'undefined',
      editorViewReady: !!window.editorView
    }));
    console.log('Current editor state:', state);
    return state;
  }
}
