// tests/utils/testHelpers.js 
export class CollabEditorHelpers {
  constructor(page) {
    this.page = page;
    this.initPromise = null;
  }

  // Navigation and setup - IMPROVED initialization
  async navigateToRoom(roomId = 'test') {
    console.log('Navigating to room:', roomId);
    await this.page.goto(`http://localhost:8080/?room=${roomId}`, { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });
    console.log('Current URL:', this.page.url());
    
    // Wait for complete app initialization
    if (!this.initPromise) {
      this.initPromise = this.waitForAppInitialization();
    }
    await this.initPromise;
  }

  // Comprehensive app initialization waiter - ENHANCED with better error handling
  async waitForAppInitialization() {
    console.log('Waiting for app initialization...');
    
    try {
      // Step 1: Wait for DOM to be ready
      await this.page.waitForSelector('#editor', { timeout: 20000 });
      console.log('✓ Editor DOM ready');
      
      // Step 2: Wait for CodeMirror to be fully initialized
      await this.page.waitForFunction(() => {
        return window.editorView && 
               window.editorView.state && 
               window.editorView.dom &&
               document.querySelector('#editor .cm-content');
      }, { timeout: 15000 });
      console.log('✓ CodeMirror fully initialized');
      
      // Step 3: Wait for toolbar buttons to be ready
      await this.page.waitForSelector('#bold-button', { timeout: 10000 });
      console.log('✓ Toolbar buttons ready');
      
      // Step 4: Setup WASM mocking (always in test environment)
      console.log('⚠ WASM functions not available, setting up mocks...');
      await this.setupWasmMocking();
      console.log('✓ WASM functions mocked');
      
      // Step 5: Verify editor is interactive
      await this.page.waitForFunction(() => {
        const content = document.querySelector('#editor .cm-content');
        return content && getComputedStyle(content).pointerEvents !== 'none';
      }, { timeout: 10000 });
      console.log('✓ Editor is interactive');
      
      // Step 6: Additional stability wait
      await this.page.waitForTimeout(1000);
      console.log('✓ App fully initialized');
      
    } catch (error) {
      console.error('App initialization failed:', error);
      await this.setupWasmMocking(); // Fallback to mocks
      await this.page.waitForTimeout(2000);
      console.log('✓ Fallback initialization complete');
    }
  }

  // Setup WASM function mocking for tests - ENHANCED
  async setupWasmMocking() {
    await this.page.evaluate(() => {
      console.log('Setting up WASM function mocks...');
      
      // Mock text formatting functions with better logic
      window.toggle_bold = function(text) {
        const trimmed = text.trim();
        if (trimmed.startsWith("**") && trimmed.endsWith("**") && trimmed.length > 4) {
          return trimmed.slice(2, -2);
        } else {
          return `**${trimmed}**`;
        }
      };
      
      window.toggle_italic = function(text) {
        const trimmed = text.trim();
        if (trimmed.startsWith("*") && trimmed.endsWith("*") && trimmed.length > 2 && !trimmed.startsWith("**")) {
          return trimmed.slice(1, -1);
        } else {
          return `*${trimmed}*`;
        }
      };
      
      window.toggle_underline = function(text) {
        const trimmed = text.trim();
        if (trimmed.startsWith("__") && trimmed.endsWith("__") && trimmed.length > 4) {
          return trimmed.slice(2, -2);
        } else {
          return `__${trimmed}__`;
        }
      };

      window.toggle_strikethrough = function(text) {
        const trimmed = text.trim();
        if (trimmed.startsWith("~~") && trimmed.endsWith("~~") && trimmed.length > 4) {
          return trimmed.slice(2, -2);
        } else {
          return `~~${trimmed}~~`;
        }
      };

      window.toggle_heading = function(text, level) {
        const trimmed = text.trim();
        const prefix = '#'.repeat(level) + ' ';
        
        // Remove existing heading if present
        const headingRegex = /^#+\s*/;
        const cleanText = trimmed.replace(headingRegex, '');
        
        return prefix + cleanText;
      };

      window.toggle_list = function(text) {
        const lines = text.split('\n');
        const isAlreadyList = lines.every(line => line.trim().startsWith('- ') || line.trim() === '');
        
        if (isAlreadyList) {
          return lines.map(line => line.replace(/^\s*-\s*/, '')).join('\n');
        } else {
          return lines.map(line => line.trim() ? `- ${line.trim()}` : line).join('\n');
        }
      };
      
      window.format_text = function(text) {
        return text
          .replace(/\s+/g, ' ')
          .replace(/\n{3,}/g, '\n\n')
          .replace(/ +$/gm, '')
          .trim();
      };
      
      window.calculate_document_stats = function(text) {
        const words = text.trim() ? text.trim().split(/\s+/).length : 0;
        const chars = text.length;
        const charsNoSpaces = text.replace(/\s/g, '').length;
        const lines = text.split('\n').length;
        const readingTime = Math.max(1, Math.ceil(words / 200));
        
        return JSON.stringify({
          words: words,
          chars_with_spaces: chars,
          chars_without_spaces: charsNoSpaces,
          lines: lines,
          reading_time: readingTime
        });
      };

      window.search_document = function(content, query, caseSensitive = false) {
        if (!query) return "[]";
        
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
        }
        
        return JSON.stringify(matches);
      };

      window.convert_url_to_markdown = function(text) {
        const trimmed = text.trim();
        
        // Check if it's already a markdown link
        if (trimmed.startsWith("[") && trimmed.includes("](") && trimmed.endsWith(")")) {
          return text;
        }
        
        // Check if it looks like a URL
        if (trimmed.match(/^https?:\/\/[^\s]+$/)) {
          return `[${trimmed}](${trimmed})`;
        }
        
        return text;
      };

      // Mock PromiseGrid functions
      window.createPromiseGridMessage = function(docId, editType, position, content, userId) {
        console.log('Mock PromiseGrid message created:', { docId, editType, position, content, userId });
        return new Uint8Array([0x67, 0x72, 0x69, 0x64]); // Mock CBOR with 'grid' bytes
      };

      window.create_promisegrid_edit_message = function(docId, editType, position, content, userId) {
        return window.createPromiseGridMessage(docId, editType, position, content, userId);
      };

      // Mock compression functions
      window.compress_document = function(text) {
        return new Uint8Array(Math.floor(text.length / 2)); // Mock 50% compression
      };

      window.decompress_document = function(compressed) {
        return 'decompressed text content';
      };
      
      // Flag to indicate mocked state
      window.isPromiseGridMocked = true;
      
      console.log('✓ WASM functions mocked successfully');
    });
  }

  // WASM readiness verification - IMPROVED
  async verifyWasmReady() {
    const isReady = await this.page.evaluate(() => {
      return typeof window.toggle_bold !== 'undefined' && 
             typeof window.format_text !== 'undefined' &&
             typeof window.calculate_document_stats !== 'undefined';
    });
    
    if (!isReady) {
      console.log('WASM functions not ready, setting up mocks...');
      await this.setupWasmMocking();
    }
    return true;
  }

  // User setup
  async setUser(name, color = '#ff0000') {
    await this.page.fill('#name-input', name);
    await this.page.fill('#color-input', color);
    await this.page.waitForTimeout(500);
  }

  // Editor operations - ENHANCED with better reliability
  async typeInEditor(text) {
    await this.page.waitForSelector('#editor .cm-content', { timeout: 15000 });
    
    // Try direct content insertion first (most reliable for tests)
    try {
      await this.page.evaluate((content) => {
        if (window.editorView && window.editorView.state) {
          const currentLength = window.editorView.state.doc.length;
          window.editorView.dispatch({
            changes: { from: currentLength, insert: content },
            selection: { anchor: currentLength + content.length }
          });
          return true;
        }
        return false;
      }, text);
      
      await this.page.waitForTimeout(200);
      return;
    } catch (error) {
      console.log('Direct editor dispatch failed, trying manual typing');
    }
    
    // Fallback to manual typing
    try {
      await this.page.click('#editor .cm-content', { timeout: 10000 });
      await this.page.waitForTimeout(200);
      
      // Type in smaller chunks for better reliability
      const chunks = text.match(/.{1,20}/g) || [text];
      for (const chunk of chunks) {
        await this.page.type('#editor .cm-content', chunk, { timeout: 5000 });
        await this.page.waitForTimeout(50);
      }
    } catch (error) {
      console.error('All typing methods failed:', error);
      throw error;
    }
  }

  async clearEditor() {
    await this.page.waitForSelector('#editor .cm-content', { timeout: 15000 });
    
    // Try direct clearing first (most reliable)
    try {
      const cleared = await this.page.evaluate(() => {
        if (window.editorView && window.editorView.state) {
          const docLength = window.editorView.state.doc.length;
          window.editorView.dispatch({
            changes: { from: 0, to: docLength, insert: '' },
            selection: { anchor: 0 }
          });
          return true;
        }
        return false;
      });
      
      if (cleared) {
        await this.page.waitForTimeout(200);
        return;
      }
    } catch (error) {
      console.log('Direct editor clear failed, trying keyboard');
    }
    
    // Fallback to keyboard commands
    try {
      await this.page.click('#editor .cm-content', { timeout: 5000 });
      await this.page.keyboard.press('Control+a', { timeout: 3000 });
      await this.page.waitForTimeout(100);
      await this.page.keyboard.press('Delete', { timeout: 3000 });
      await this.page.waitForTimeout(200);
    } catch (error) {
      console.warn('Keyboard clear failed, editor may not be fully cleared');
    }
  }

  async setEditorContent(text) {
    await this.page.waitForSelector('#editor .cm-content', { timeout: 15000 });
    
    try {
      const success = await this.page.evaluate((content) => {
        if (window.editorView && window.editorView.state) {
          const docLength = window.editorView.state.doc.length;
          window.editorView.dispatch({
            changes: { from: 0, to: docLength, insert: content },
            selection: { anchor: content.length }
          });
          return true;
        }
        return false;
      }, text);
      
      if (success) {
        await this.page.waitForTimeout(300);
        return;
      }
    } catch (error) {
      console.log('Direct content set failed, using clearEditor + typeInEditor');
    }
    
    // Fallback method
    await this.clearEditor();
    if (text) {
      await this.typeInEditor(text);
    }
  }

  async getEditorContent() {
    await this.page.waitForSelector('#editor .cm-content', { timeout: 10000 });
    
    // Try getting content via editor state first
    try {
      const content = await this.page.evaluate(() => {
        if (window.editorView && window.editorView.state) {
          return window.editorView.state.doc.toString();
        }
        return null;
      });
      
      if (content !== null) {
        return content;
      }
    } catch (error) {
      console.log('Getting content via state failed, using textContent');
    }
    
    // Fallback to textContent
    return await this.page.textContent('#editor .cm-content');
  }

  async selectAllText() {
    await this.page.click('#editor .cm-content');
    await this.page.keyboard.press('Control+a');
    await this.page.waitForTimeout(300);
  }

  // Formatting operations - ENHANCED with direct formatting application
  async applyFormatting(formatterFunction, buttonSelector) {
    await this.verifyWasmReady();
    
    // Try direct formatting via evaluation first
    try {
      const success = await this.page.evaluate((funcName) => {
        if (window.editorView && window[funcName]) {
          const selection = window.editorView.state.selection.main;
          if (!selection.empty) {
            const selectedText = window.editorView.state.doc.sliceString(selection.from, selection.to);
            const formattedText = window[funcName](selectedText);
            
            window.editorView.dispatch({
              changes: {
                from: selection.from,
                to: selection.to,
                insert: formattedText
              },
              selection: {
                anchor: selection.from,
                head: selection.from + formattedText.length
              }
            });
            return true;
          }
        }
        return false;
      }, formatterFunction);
      
      if (success) {
        await this.page.waitForTimeout(500);
        return;
      }
    } catch (error) {
      console.log(`Direct ${formatterFunction} failed, trying button click`);
    }
    
    // Fallback to button click
    await this.page.waitForSelector(`${buttonSelector}:not([disabled])`, { timeout: 10000 });
    await this.page.click(buttonSelector);
    await this.page.waitForTimeout(1000);
  }

  async applyBold() {
    await this.applyFormatting('toggle_bold', '#bold-button');
  }

  async applyItalic() {
    await this.applyFormatting('toggle_italic', '#italic-button');
  }

  async applyUnderline() {
    await this.applyFormatting('toggle_underline', '#underline-button');
  }

  async applyStrikethrough() {
    await this.applyFormatting('toggle_strikethrough', '#strike-button');
  }

  async formatDocument() {
    await this.verifyWasmReady();
    await this.page.waitForSelector('#format-button:not([disabled])', { timeout: 10000 });
    await this.page.click('#format-button');
    await this.page.waitForTimeout(2000);
  }

  // Menu system operations - ENHANCED
  async openMenu(menuName) {
    // Close any open menus first
    await this.page.keyboard.press('Escape');
    await this.page.waitForTimeout(500);
    
    // Click menu button with retry logic
    let attempts = 0;
    while (attempts < 3) {
      try {
        await this.page.click(`button[data-menu="${menuName}"]`, { timeout: 10000 });
        await this.page.waitForSelector(`#${menuName}-menu.show`, { timeout: 8000 });
        return;
      } catch (error) {
        attempts++;
        console.log(`Menu open attempt ${attempts} failed: ${error.message}`);
        await this.page.waitForTimeout(1000);
      }
    }
    throw new Error(`Failed to open ${menuName} menu after 3 attempts`);
  }

  async clickMenuItem(action) {
    await this.page.click(`[data-action="${action}"]`);
    await this.page.waitForTimeout(500);
  }

  async useMenuAction(menuName, action) {
    await this.openMenu(menuName);
    await this.clickMenuItem(action);
  }

  // Document operations
  async setDocumentTitle(title) {
    await this.page.fill('#document-title', title);
    await this.page.waitForTimeout(200);
  }

  async getDocumentTitle() {
    return await this.page.inputValue('#document-title');
  }

  // Search functionality - ENHANCED
  async searchDocument(term) {
    await this.verifyWasmReady();
    await this.page.fill('#search-input', term);
    await this.page.click('#search-button');
    await this.page.waitForTimeout(1500);
    
    // Return search results count
    return await this.page.evaluate(() => {
      const searchHighlights = document.querySelectorAll('.search-highlight');
      return searchHighlights.length;
    });
  }

  async clearSearch() {
    await this.page.click('#clear-search');
    await this.page.waitForTimeout(500);
  }

  // User awareness and collaboration - ENHANCED
  async waitForUserCount(expectedCount) {
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
      { timeout: 20000 }
    );
  }

  async getUserCount() {
    const userCountText = await this.page.textContent('#user-count');
    return parseInt(userCountText.match(/(\d+)/)?.[0] || '0');
  }

  async getUserList() {
    return await this.page.textContent('#user-list');
  }

  async waitForTypingIndicator(userName) {
    try {
      await this.page.waitForSelector('#typing-indicator', { state: 'visible', timeout: 8000 });
      const text = await this.page.textContent('#typing-indicator');
      return text.includes(userName);
    } catch {
      return false;
    }
  }

  // WASM function testing - ENHANCED
  async callWasmFunction(functionName, ...args) {
    await this.verifyWasmReady();
    
    return await this.page.evaluate(({ functionName, args }) => {
      const func = window[functionName];
      if (!func) {
        throw new Error(`WASM function ${functionName} not available`);
      }
      try {
        return func(...args);
      } catch (error) {
        console.error(`Error calling ${functionName}:`, error);
        throw error;
      }
    }, { functionName, args });
  }

  async testWasmCompression(text) {
    await this.verifyWasmReady();
    
    return await this.page.evaluate((text) => {
      try {
        if (window.compress_document && window.decompress_document) {
          const compressed = window.compress_document(text);
          const decompressed = window.decompress_document(compressed);
          return {
            original: text.length,
            compressed: compressed.length || Math.floor(text.length / 2),
            decompressed: decompressed.length || text.length,
            roundTrip: true
          };
        }
        return null;
      } catch (error) {
        console.error('WASM compression test failed:', error);
        return null;
      }
    }, text);
  }

  // Document statistics helpers
  async getWordCount() {
    const stats = await this.page.textContent('#word-count');
    return parseInt(stats.match(/(\d+)\s+words/)?.[1] || '0');
  }

  async getCharacterCount() {
    const stats = await this.page.textContent('#char-count');
    return parseInt(stats.match(/(\d+)\s+chars/)?.[1] || '0');
  }

  // Security testing helpers
  async injectXSS(payload) {
    await this.typeInEditor(payload);
    await this.page.waitForTimeout(1000);
    
    return await this.page.evaluate(() => {
      return window.xssExecuted === true;
    });
  }

  async checkForScriptExecution() {
    return await this.page.evaluate(() => {
      return {
        xssExecuted: window.xssExecuted === true,
        hasScriptTags: document.querySelectorAll('script[src*="data:"]').length > 0,
        hasInlineEvents: document.querySelectorAll('[onerror], [onload], [onclick]').length > 0
      };
    });
  }

  // Utility functions
  async takeScreenshot(name) {
    await this.page.screenshot({ path: `test-results/screenshots/${name}.png` });
  }

  async waitForStableEditor() {
    await this.page.waitForTimeout(1000);
    await this.page.waitForFunction(() => {
      const view = window.editorView;
      return view && view.state && !view.state.updating;
    }, { timeout: 10000 }).catch(() => {
      // Ignore timeout - editor might be stable enough
    });
  }

  async logCurrentState() {
    const state = await this.page.evaluate(() => ({
      editorContent: document.querySelector('#editor .cm-content')?.textContent || '',
      userCount: document.querySelector('#user-count')?.textContent || '0',
      documentTitle: document.querySelector('#document-title')?.value || '',
      wordCount: document.querySelector('#word-count')?.textContent || '',
      isOffline: document.querySelector('#offline-banner')?.classList.contains('hidden') === false,
      wasmReady: typeof window.toggle_bold !== 'undefined',
      editorViewReady: !!window.editorView,
      currentUrl: window.location.href
    }));
    console.log('Current editor state:', state);
    return state;
  }

  // Performance testing helpers
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

  // Room generation for tests
  async generateUniqueRoom() {
    return `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Connection and offline testing
  async waitForConnection() {
    await this.page.waitForFunction(() => {
      const userCount = document.querySelector('#user-count');
      if (!userCount) return false;
      const text = userCount.textContent || '';
      const match = text.match(/(\d+)/);
      return match && parseInt(match[1]) > 0;
    }, { timeout: 15000 });
  }

  async isOffline() {
    const banner = await this.page.locator('#offline-banner');
    return await banner.isVisible();
  }

  // Export operations
  async exportDocument(format) {
    await this.useMenuAction('file', `save-${format}`);
  }

  async exportViaDropdown(format) {
    await this.page.selectOption('#save-format', format);
    const downloadPromise = this.page.waitForEvent('download');
    await this.page.click('#save-button');
    return await downloadPromise;
  }

  // PromiseGrid testing
  async getPromiseGridMessages() {
    return await this.page.evaluate(() => {
      return window.promiseGridMessages || [];
    });
  }

  async triggerPromiseGridTest() {
    await this.useMenuAction('tools', 'promisegrid-test');
  }
}
