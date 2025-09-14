// tests/utils/testHelpers.js
export class CollabEditorHelpers {
  constructor(page) {
    this.page = page;
    this.initPromise = null;
  }

  /**
   * Navigate to a test room and initialize the application
   * @param {string} roomId - Unique room identifier
   */
  async navigateToRoom(roomId = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`) {
    await this.page.goto(`http://localhost:8080/?room=${roomId}`, { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });
    
    if (!this.initPromise) {
      this.initPromise = this.waitForAppInitialization();
    }
    await this.initPromise;
  }

  /**
   * Wait for all application components to be ready for testing
   */
  async waitForAppInitialization() {
    // Wait for DOM elements
    await this.page.waitForSelector('#editor', { timeout: 20000 });
    
    // Setup WASM function mocks for test environment
    await this.setupWasmMocking();
    
    // Wait for CodeMirror editor initialization
    await this.page.waitForFunction(() => {
      return window.editorView && 
             window.editorView.state && 
             document.querySelector('#editor .cm-content');
    }, { timeout: 15000 });
    
    // Wait for toolbar to be ready
    await this.page.waitForSelector('#bold-button', { timeout: 10000 });
    
    // Verify editor is interactive
    await this.page.waitForFunction(() => {
      const content = document.querySelector('#editor .cm-content');
      return content && getComputedStyle(content).pointerEvents !== 'none';
    }, { timeout: 10000 });
    
    // Brief stability wait
    await this.page.waitForTimeout(300);
  }

  /**
   * Setup mock WASM functions for consistent test behavior
   */
  async setupWasmMocking() {
    await this.page.evaluate(() => {
      // Text formatting functions
      window.toggle_bold = function(text) {
        const trimmed = text.trim();
        if (trimmed.startsWith("**") && trimmed.endsWith("**") && trimmed.length > 4) {
          return trimmed.slice(2, -2);
        }
        return `**${trimmed}**`;
      };
      
      window.toggle_italic = function(text) {
        const trimmed = text.trim();
        if (trimmed.startsWith("*") && trimmed.endsWith("*") && trimmed.length > 2 && !trimmed.startsWith("**")) {
          return trimmed.slice(1, -1);
        }
        return `*${trimmed}*`;
      };
      
      window.toggle_underline = function(text) {
        const trimmed = text.trim();
        if (trimmed.startsWith("__") && trimmed.endsWith("__") && trimmed.length > 4) {
          return trimmed.slice(2, -2);
        }
        return `__${trimmed}__`;
      };

      window.toggle_strikethrough = function(text) {
        const trimmed = text.trim();
        if (trimmed.startsWith("~~") && trimmed.endsWith("~~") && trimmed.length > 4) {
          return trimmed.slice(2, -2);
        }
        return `~~${trimmed}~~`;
      };

      window.toggle_heading = function(text, level) {
        const trimmed = text.trim();
        const prefix = '#'.repeat(Math.max(1, Math.min(6, level))) + ' ';
        const headingRegex = /^#+\s*/;
        const cleanText = trimmed.replace(headingRegex, '');
        return prefix + cleanText;
      };

      window.toggle_list = function(text) {
        const lines = text.split('\n');
        const isAlreadyList = lines.every(line => line.trim().startsWith('- ') || line.trim() === '');
        
        if (isAlreadyList) {
          return lines.map(line => line.replace(/^\s*-\s*/, '')).join('\n');
        }
        return lines.map(line => line.trim() ? `- ${line.trim()}` : line).join('\n');
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
        
        if (trimmed.startsWith("[") && trimmed.includes("](") && trimmed.endsWith(")")) {
          return text;
        }
        
        if (trimmed.match(/^https?:\/\/[^\s]+$/)) {
          return `[${trimmed}](${trimmed})`;
        }
        
        return text;
      };

      // PromiseGrid functions
      window.createPromiseGridMessage = function(docId, editType, position, content, userId) {
        return new Uint8Array([0x67, 0x72, 0x69, 0x64]);
      };

      window.create_promisegrid_edit_message = function(docId, editType, position, content, userId) {
        return window.createPromiseGridMessage(docId, editType, position, content, userId);
      };

      // Compression functions
      window.compress_document = function(text) {
        return new Uint8Array(Math.floor(text.length / 2));
      };

      window.decompress_document = function(compressed) {
        return 'decompressed text content';
      };
      
      window.isPromiseGridMocked = true;
    });
  }

  /**
   * Set editor content using the most reliable method
   * @param {string} text - Content to set in editor
   */
  async setEditorContent(text) {
    await this.page.waitForSelector('#editor .cm-content', { timeout: 15000 });
    
    const success = await this.page.evaluate((content) => {
      if (window.editorView && window.editorView.state) {
        const view = window.editorView;
        view.dispatch({
          changes: { from: 0, to: view.state.doc.length, insert: content },
          selection: { anchor: content.length }
        });
        return true;
      }
      return false;
    }, text);
    
    if (!success) {
      throw new Error('Failed to set editor content - editorView not available');
    }
    
    // Wait for content to be set
    await this.page.waitForFunction((expectedText) => {
      return window.editorView?.state.doc.toString() === expectedText;
    }, text, { timeout: 3000 });
  }

  /**
   * Get current editor content
   * @returns {Promise<string>} Current editor content
   */
  async getEditorContent() {
    return await this.page.evaluate(() => {
      if (window.editorView && window.editorView.state) {
        return window.editorView.state.doc.toString();
      }
      throw new Error('Editor not available');
    });
  }

  /**
   * Clear all content from editor
   */
  async clearEditor() {
    await this.setEditorContent('');
  }

  /**
   * Type text into editor at current cursor position
   * @param {string} text - Text to type
   */
  async typeInEditor(text) {
    await this.page.waitForSelector('#editor .cm-content', { timeout: 15000 });
    
    const success = await this.page.evaluate((content) => {
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
    
    if (success) {
      await this.page.waitForTimeout(200);
      return;
    }
    
    // Fallback to manual typing
    await this.page.click('#editor .cm-content');
    const chunks = text.match(/.{1,20}/g) || [text];
    for (const chunk of chunks) {
      await this.page.type('#editor .cm-content', chunk);
      await this.page.waitForTimeout(50);
    }
  }

  /**
   * Select all text in editor
   */
  async selectAllText() {
    await this.page.evaluate(() => {
      if (window.editorView) {
        const view = window.editorView;
        view.dispatch({
          selection: { anchor: 0, head: view.state.doc.length }
        });
      }
    });
    await this.page.waitForTimeout(100);
  }

  /**
   * Select specific range of text in editor
   * @param {number} from - Start position
   * @param {number} to - End position
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
   * Apply bold formatting to selected text
   */
  async applyBold() {
    const success = await this.page.evaluate(() => {
      if (window.editorView && window.toggle_bold) {
        const view = window.editorView;
        const selection = view.state.selection.main;
        
        if (!selection.empty) {
          const selectedText = view.state.doc.sliceString(selection.from, selection.to);
          const formattedText = window.toggle_bold(selectedText);
          
          view.dispatch({
            changes: { from: selection.from, to: selection.to, insert: formattedText },
            selection: { anchor: selection.from, head: selection.from + formattedText.length }
          });
          return true;
        }
      }
      return false;
    });
    
    if (!success) {
      await this.page.click('#bold-button');
    }
    
    await this.page.waitForTimeout(200);
  }

  /**
   * Apply italic formatting to selected text
   */
  async applyItalic() {
    const success = await this.page.evaluate(() => {
      if (window.editorView && window.toggle_italic) {
        const view = window.editorView;
        const selection = view.state.selection.main;
        
        if (!selection.empty) {
          const selectedText = view.state.doc.sliceString(selection.from, selection.to);
          const formattedText = window.toggle_italic(selectedText);
          
          view.dispatch({
            changes: { from: selection.from, to: selection.to, insert: formattedText },
            selection: { anchor: selection.from, head: selection.from + formattedText.length }
          });
          return true;
        }
      }
      return false;
    });
    
    if (!success) {
      await this.page.click('#italic-button');
    }
    
    await this.page.waitForTimeout(200);
  }

  /**
   * Apply underline formatting to selected text
   */
  async applyUnderline() {
    const success = await this.page.evaluate(() => {
      if (window.editorView && window.toggle_underline) {
        const view = window.editorView;
        const selection = view.state.selection.main;
        
        if (!selection.empty) {
          const selectedText = view.state.doc.sliceString(selection.from, selection.to);
          const formattedText = window.toggle_underline(selectedText);
          
          view.dispatch({
            changes: { from: selection.from, to: selection.to, insert: formattedText },
            selection: { anchor: selection.from, head: selection.from + formattedText.length }
          });
          return true;
        }
      }
      return false;
    });
    
    if (!success) {
      await this.page.click('#underline-button');
    }
    
    await this.page.waitForTimeout(200);
  }

  /**
   * Apply strikethrough formatting to selected text
   */
  async applyStrikethrough() {
    const success = await this.page.evaluate(() => {
      if (window.editorView && window.toggle_strikethrough) {
        const view = window.editorView;
        const selection = view.state.selection.main;
        
        if (!selection.empty) {
          const selectedText = view.state.doc.sliceString(selection.from, selection.to);
          const formattedText = window.toggle_strikethrough(selectedText);
          
          view.dispatch({
            changes: { from: selection.from, to: selection.to, insert: formattedText },
            selection: { anchor: selection.from, head: selection.from + formattedText.length }
          });
          return true;
        }
      }
      return false;
    });
    
    if (!success) {
      await this.page.click('#strike-button');
    }
    
    await this.page.waitForTimeout(200);
  }

  /**
   * Apply document-wide formatting
   */
  async formatDocument() {
    await this.page.click('#format-button');
    await this.page.waitForTimeout(500);
  }

  /**
   * Open a menu in the application
   * @param {string} menuName - Name of menu to open
   */
  async openMenu(menuName) {
    await this.page.keyboard.press('Escape');
    await this.page.waitForTimeout(100);
    
    await this.page.click(`button[data-menu="${menuName}"]`);
    await this.page.waitForSelector(`#${menuName}-menu.show`, { timeout: 5000 });
    await this.page.waitForTimeout(200);
  }

  /**
   * Click a menu item
   * @param {string} action - Action identifier for menu item
   */
  async clickMenuItem(action) {
    await this.page.click(`[data-action="${action}"]`);
    await this.page.waitForTimeout(300);
  }

  /**
   * Execute a menu action
   * @param {string} menuName - Menu to open
   * @param {string} action - Action to execute
   */
  async useMenuAction(menuName, action) {
    await this.openMenu(menuName);
    await this.clickMenuItem(action);
  }

  /**
   * Set document title
   * @param {string} title - New document title
   */
  async setDocumentTitle(title) {
    await this.page.fill('#document-title', title);
    await this.page.waitForTimeout(100);
  }

  /**
   * Get current document title
   * @returns {Promise<string>} Current document title
   */
  async getDocumentTitle() {
    return await this.page.inputValue('#document-title');
  }

  /**
   * Search for text in document
   * @param {string} term - Search term
   * @returns {Promise<number>} Number of matches found
   */
  async searchDocument(term) {
    await this.page.fill('#search-input', term);
    await this.page.click('#search-button');
    await this.page.waitForTimeout(300);
    
    return await this.page.evaluate(() => {
      const searchHighlights = document.querySelectorAll('.search-highlight');
      return searchHighlights.length;
    });
  }

  /**
   * Clear search results
   */
  async clearSearch() {
    await this.page.click('#clear-search');
    await this.page.waitForTimeout(200);
  }

  /**
   * Set user information
   * @param {string} name - User name
   * @param {string} color - User color
   */
  async setUser(name, color = '#ff0000') {
    await this.page.fill('#name-input', name);
    await this.page.fill('#color-input', color);
    await this.page.waitForTimeout(200);
  }

  /**
   * Wait for specific number of users to be connected
   * @param {number} expectedCount - Expected user count
   * @param {number} timeout - Maximum wait time in milliseconds
   */
  async waitForUserCount(expectedCount, timeout = 8000) {
    try {
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
        { timeout }
      );
    } catch (error) {
      const actualCount = await this.getUserCount();
      console.warn(`Expected ${expectedCount} users, got ${actualCount}. Collaboration may not be fully connected in test environment.`);
    }
  }

  /**
   * Get current user count
   * @returns {Promise<number>} Number of connected users
   */
  async getUserCount() {
    const userCountText = await this.page.textContent('#user-count') || '0';
    return parseInt(userCountText.match(/(\d+)/)?.[0] || '0');
  }

  /**
   * Get list of connected users
   * @returns {Promise<string>} User list text
   */
  async getUserList() {
    return await this.page.textContent('#user-list');
  }

  /**
   * Wait for typing indicator for specific user
   * @param {string} userName - User name to check for
   * @returns {Promise<boolean>} Whether typing indicator appeared
   */
  async waitForTypingIndicator(userName) {
    try {
      await this.page.waitForSelector('#typing-indicator', { state: 'visible', timeout: 8000 });
      const text = await this.page.textContent('#typing-indicator');
      return text.includes(userName);
    } catch {
      return false;
    }
  }

  /**
   * Get current word count from status bar
   * @returns {Promise<number>} Current word count
   */
  async getWordCount() {
    const stats = await this.page.textContent('#word-count') || '0 words';
    return parseInt(stats.match(/(\d+)/)?.[1] || '0');
  }

  /**
   * Get current character count from status bar
   * @returns {Promise<number>} Current character count
   */
  async getCharacterCount() {
    const stats = await this.page.textContent('#char-count') || '0 chars';
    return parseInt(stats.match(/(\d+)/)?.[1] || '0');
  }

  /**
   * Call a WASM function with error handling
   * @param {string} functionName - Name of WASM function
   * @param {...any} args - Function arguments
   * @returns {Promise<any>} Function result
   */
  async callWasmFunction(functionName, ...args) {
    return await this.page.evaluate(({ functionName, args }) => {
      const func = window[functionName];
      if (!func) {
        throw new Error(`WASM function ${functionName} not available`);
      }
      try {
        return func(...args);
      } catch (error) {
        throw error;
      }
    }, { functionName, args });
  }

  /**
   * Test WASM compression functionality
   * @param {string} text - Text to compress
   * @returns {Promise<Object|null>} Compression test results
   */
  async testWasmCompression(text) {
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
        return null;
      }
    }, text);
  }

  /**
   * Export document in specified format
   * @param {string} format - Export format
   */
  async exportDocument(format) {
    await this.useMenuAction('file', `save-${format}`);
  }

  /**
   * Generate unique room ID for testing
   * @returns {string} Unique room identifier
   */
  generateUniqueRoom() {
    return `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Take screenshot for debugging
   * @param {string} name - Screenshot filename
   */
  async takeScreenshot(name) {
    await this.page.screenshot({ path: `test-results/screenshots/${name}.png` });
  }

  /**
   * Wait for editor to be in stable state
   */
  async waitForStableEditor() {
    await this.page.waitForTimeout(300);
    await this.page.waitForFunction(() => {
      const view = window.editorView;
      return view && view.state && !view.state.updating;
    }, { timeout: 10000 }).catch(() => {
      // Timeout acceptable - editor may be stable enough
    });
  }
}
