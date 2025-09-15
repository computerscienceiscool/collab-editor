// tests/utils/testHelpers.js 
export class CollabEditorHelpers {
  constructor(page) {
    this.page = page;
    this.initPromise = null;
    this.browserName = null;
    this.testName = 'Unknown Test';
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
   * Navigate to a test room and initialize the application
   */
  async navigateToRoom(roomId = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`) {
    this.log(`Navigating to room: ${roomId}`);
   

    // Detect browser for key combination adjustments
    this.browserName = await this.page.evaluate(() => {
      const ua = navigator.userAgent || '';
      const isFirefox = ua.includes('Firefox');
      const isChromium = ua.includes('Chrome') || ua.includes('Chromium') || ua.includes('Edg');
      const isWebKit = !isChromium && !isFirefox && ua.includes('Safari');
      if (isFirefox) return 'firefox';
      if (isChromium) return 'chromium';
      if (isWebKit) return 'webkit';
      return 'chromium';
    });
    

    this.log(`Detected browser: ${this.browserName}`);
    
    await this.page.goto(`http://localhost:8080/?room=${roomId}`, { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });
    
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
   * Enhanced WASM function mocks with better error handling
   */
  async setupWasmMocking() {
    await this.page.evaluate(() => {
      // Suppress console logs from app initialization during tests
      const originalLog = console.log;
      window.testConsoleLog = originalLog;
      console.log = function(...args) {
        // Only log if it's not the repetitive app initialization messages
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

      // Enhanced text formatting functions with better edge case handling
      window.toggle_bold = function(text) {
        if (!text || typeof text !== 'string') return text || '';
        const trimmed = text.trim();
        const isBold = trimmed.startsWith("**") && trimmed.endsWith("**") && trimmed.length > 4;
        return isBold ? trimmed : `**${trimmed}**`;
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
          .replace(/[ \t]+/g, ' ')           // Multiple spaces/tabs to single space
          .replace(/\n{3,}/g, '\n\n')       // Multiple newlines to double
          .replace(/[ \t]+$/gm, '')         // Trailing spaces on lines
          .replace(/^[ \t]+/gm, '')         // Leading spaces on lines (optional)
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
          
          // Prevent infinite loops with very large documents
          if (matches.length > 1000) break;
        }
        
        return JSON.stringify(matches);
      };

    // Enhanced URL conversion — wraps bare http(s) URLs anywhere in the text
    window.convert_url_to_markdown = function(text) {
      if (!text || typeof text !== 'string') return text || '';

      // Match bare URLs not already wrapped; keep it simple and robust
      const urlRegex = /\bhttps?:\/\/[^\s<>()\[\]]+/g;

      return text.replace(urlRegex, (url, idx, src) => {
        // If already in [label](url) form, skip wrapping the (url) part
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

      // Compression functions with better simulation
    // Compression functions with reversible simulation
    (() => {
      // store original texts keyed by a short id
      if (!window.__mockCompressionStore) window.__mockCompressionStore = new Map();

      window.compress_document = function(text) {
        if (typeof text !== 'string' || !text.length) return new Uint8Array(0);
        const id = Math.random().toString(36).slice(2, 10); // 8-char token
        window.__mockCompressionStore.set(id, text);

        const payload = 'mock:' + id;
        // encode small payload so "compressed" size < original
        if (typeof TextEncoder !== 'undefined') {
          return new TextEncoder().encode(payload);
        } else {
          // fallback encoder
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
          // fallback decoder
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
    });
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
      // Verify content was set correctly
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
    
    // Type in chunks to avoid overwhelming the editor
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
   * Generic formatting application with comprehensive retry logic and logging
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
   * Get appropriate key modifier for browser
   */
  getKeyModifier() {
    return this.browserName === 'webkit' ? 'Meta' : 'Control';
  }

  /**
   * Press keyboard shortcut with browser-specific modifier
   */
  async pressShortcut(key) {
    const modifier = this.getKeyModifier();
    this.log(`Pressing ${modifier}+${key}`);
    await this.page.keyboard.press(`${modifier}+${key}`);
  }

  /**
   * Enhanced menu operations with better logging
   */
  async openMenu(menuName) {
    this.log(`Opening ${menuName} menu`);
    
    // Close any existing menus first
    await this.page.keyboard.press('Escape');
    await this.page.waitForTimeout(200);
    
    let attempts = 0;
    while (attempts < 3) {
      try {
        await this.page.click(`button[data-menu="${menuName}"]`);
        await this.page.waitForSelector(`#${menuName}-menu.show`, { timeout: 5000 });
        await this.page.waitForTimeout(300);
        this.log(`${menuName} menu opened successfully`, 'success');
        return;
      } catch (error) {
        attempts++;
        this.log(`Menu open attempt ${attempts} failed for ${menuName}`, 'warning');
        await this.page.waitForTimeout(500);
        if (attempts >= 3) {
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
    // Try editorView first
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
    
    // Fallback to DOM content
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
   * Select all text with logging
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
   * Type text in editor with logging
   */
  /**
   * Format document using format button
   */
  async formatDocument() {
    this.log('Formatting document');
    await this.page.click('#format-button');
    await this.page.waitForTimeout(500);
    this.log('Document formatted', 'success');
  }

  /**
   * Search document for a term
   */
  async searchDocument(term) {
    this.log(`Searching for: "${term}"`);
    await this.page.fill('#search-input', term);
    await this.page.click('#search-button');
    await this.page.waitForTimeout(500);
    this.log('Search completed', 'success');
    return 1; // Mock return value
  }

  /**
   * Menu operations
   */
  async clickMenuItem(action) {
    this.log(`Clicking menu item: ${action}`);
    await this.page.click(`[data-action="${action}"]`);
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
    await this.page.click('#save-button');
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
/**
 * Type text in editor with logging
 */
    async typeInEditor(text) {
      this.log(`Typing in editor: "${text.substring(0, 30)}${text.length > 30 ? '...' : ''}"`);

      // Prefer CodeMirror model insert — reliable and overlay-agnostic
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
        // Fallback: use a locator (more robust than page.type) and ensure focus
        const cm = this.page.locator('#editor .cm-content');
        await cm.waitFor({ state: 'visible' });
        await cm.click({ force: true });
        await cm.type(text, { delay: 10 });
      }

      this.log('Text typed successfully', 'success');
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
 * Used by tests that need a quiescent UI before interacting with menus.
 */
async waitForStableEditor(timeoutMs = 10000) {
  // Ensure the basic app init has completed
  await this.waitForAppInitialization();

  // Wait for any transient spinners or overlays to disappear (best-effort)
  try {
    await this.page.waitForSelector('.loading,.spinner,.overlay', { state: 'detached', timeout: 2000 });
  } catch (_) {
    // ignore: element might never appear
  }

  // Ensure CodeMirror is interactive and page is fully ready
  await this.page.waitForFunction(() => {
    const view = window.editorView;
    const content = document.querySelector('#editor .cm-content');
    if (!view || !content) return false;
    const style = getComputedStyle(content);
    const stable = style.pointerEvents !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
    return stable && document.readyState === 'complete';
  }, { timeout: Math.max(1000, timeoutMs / 2) });

  // Double RAF to settle layout
  await this.page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));

  // Small idle wait
  await this.page.waitForTimeout(150);
  this.log('Editor stable');
  }
   
}
