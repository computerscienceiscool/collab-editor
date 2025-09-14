// tests/global-setup.js
async function globalSetup() {
  console.log('Setting up global test environment...');
  
  // Wait for development server to be ready
  const { chromium } = require('@playwright/test');
  
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Wait for server to be responsive
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds
    
    while (attempts < maxAttempts) {
      try {
        await page.goto('http://localhost:8080', { 
          waitUntil: 'domcontentloaded',
          timeout: 10000 
        });
        
        // Check if the app loads correctly
        await page.waitForSelector('#editor', { timeout: 10000 });
        console.log('✓ Development server is ready');
        break;
      } catch (error) {
        attempts++;
        console.log(`Server not ready, attempt ${attempts}/${maxAttempts}`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    if (attempts >= maxAttempts) {
      throw new Error('Development server failed to start within timeout');
    }
    
    // Verify WASM setup by checking for basic functionality
    const wasmReady = await page.evaluate(() => {
      // Check if we can at least create basic mocks
      return typeof document !== 'undefined' && typeof window !== 'undefined';
    });
    
    if (!wasmReady) {
      console.warn('WASM environment not fully ready, tests will use mocks');
    } else {
      console.log('✓ Browser environment ready for WASM mocking');
    }
    
  } finally {
    await browser.close();
  }
  
  console.log('Global setup complete');
}

// tests/utils/testHelpers.js - Updated for WASM-first initialization
export class CollabEditorHelpers {
  constructor(page) {
    this.page = page;
  }

  // Navigation and setup - FIXED for WASM-first initialization
  async navigateToRoom(roomId = 'test') {
    console.log('Navigating to room:', roomId);
    await this.page.goto(`http://localhost:8080/?room=${roomId}`);
    console.log('Current URL:', this.page.url());
    
    // Wait for complete app initialization
    await this.waitForAppInitialization();
  }

  // Comprehensive app initialization waiter
  async waitForAppInitialization() {
    console.log('Waiting for app initialization...');
    
    // Step 1: Wait for DOM to be ready
    await this.page.waitForSelector('#editor', { timeout: 10000 });
    console.log('Editor DOM ready');
    
    // Step 2: Wait for WASM to be initialized
    await this.page.waitForFunction(() => {
      return typeof window.toggle_bold !== 'undefined' && 
             typeof window.format_text !== 'undefined' &&
             typeof window.calculate_document_stats !== 'undefined';
    }, { timeout: 15000 });
    console.log('WASM functions available');
    
    // Step 3: Wait for editor view to be initialized
    await this.page.waitForFunction(() => {
      return window.editorView && window.editorView.state;
    }, { timeout: 10000 });
    console.log('Editor view initialized');
    
    // Step 4: Wait for Yjs connection (best effort)
    await this.page.waitForFunction(() => {
      const userCount = document.querySelector('#user-count');
      return userCount && userCount.textContent !== 'Users: 0';
    }, { timeout: 5000 }).catch(() => {
      // Yjs connection might be slower, but don't fail the test
      console.log('Yjs connection may still be establishing');
    });
    
    // Step 5: Additional stability wait
    await this.page.waitForTimeout(500);
    console.log('App fully initialized');
  }

  // WASM readiness verification
  async verifyWasmReady() {
    const isReady = await this.page.evaluate(() => {
      return typeof window.toggle_bold !== 'undefined' && 
             typeof window.format_text !== 'undefined';
    });
    
    if (!isReady) {
      throw new Error('WASM functions not available - initialization may have failed');
    }
  }

  // User setup
  async setUser(name, color = '#ff0000') {
    await this.page.fill('#name-input', name);
    await this.page.fill('#color-input', color);
    await this.page.waitForTimeout(500);
  }

  // Editor operations - improved with better error handling
  async typeInEditor(text) {
    await this.page.waitForSelector('#editor .cm-content');
    await this.page.click('#editor .cm-content');
    await this.page.waitForTimeout(100);
    await this.page.type('#editor .cm-content', text);
  }

  async clearEditor() {
    await this.page.waitForSelector('#editor .cm-content');
    await this.page.click('#editor .cm-content');
    await this.page.keyboard.press('Control+a');
    await this.page.keyboard.press('Delete');
    await this.page.waitForTimeout(300);
  }

  async setEditorContent(text) {
    await this.clearEditor();
    await this.typeInEditor(text);
    await this.page.waitForTimeout(200);
  }

  async getEditorContent() {
    await this.page.waitForSelector('#editor .cm-content');
    return await this.page.textContent('#editor .cm-content');
  }

  async selectAllText() {
    await this.page.click('#editor .cm-content');
    await this.page.keyboard.press('Control+a');
    await this.page.waitForTimeout(100);
  }

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

  // Formatting operations - with WASM verification
  async applyBold() {
    await this.verifyWasmReady();
    await this.page.click('#bold-button');
    await this.page.waitForTimeout(300);
  }

  async applyItalic() {
    await this.verifyWasmReady();
    await this.page.click('#italic-button');
    await this.page.waitForTimeout(300);
  }

  async applyUnderline() {
    await this.verifyWasmReady();
    await this.page.click('#underline-button');
    await this.page.waitForTimeout(300);
  }

  async applyStrikethrough() {
    await this.verifyWasmReady();
    await this.page.click('#strike-button');
    await this.page.waitForTimeout(300);
  }

  async formatDocument() {
    await this.verifyWasmReady();
    await this.page.click('#format-button');
    await this.page.waitForTimeout(500);
  }

  // Menu system operations
  async openMenu(menuName) {
    await this.page.click(`button[data-menu="${menuName}"]`);
    await this.page.waitForSelector(`#${menuName}-menu`, { state: 'visible' });
  }

  async clickMenuItem(action) {
    await this.page.click(`[data-action="${action}"]`);
  }

  async useMenuAction(menuName, action) {
    await this.openMenu(menuName);
    await this.clickMenuItem(action);
  }

  // Document operations
  async setDocumentTitle(title) {
    await this.page.fill('#document-title', title);
  }

  async getDocumentTitle() {
    return await this.page.inputValue('#document-title');
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

  // Search functionality - with WASM verification
  async searchDocument(term) {
    await this.verifyWasmReady();
    await this.page.fill('#search-input', term);
    await this.page.click('#search-button');
    await this.page.waitForTimeout(500);
  }

  async clearSearch() {
    await this.page.click('#clear-search');
  }

  // User awareness and collaboration
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
      { timeout: 15000 }
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
    await this.page.waitForSelector('#typing-indicator', { state: 'visible' });
    const text = await this.page.textContent('#typing-indicator');
    return text.includes(userName);
  }

  // WebSocket and connection status
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

  // Document statistics
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

  // PromiseGrid integration testing
  async getPromiseGridMessages() {
    return await this.page.evaluate(() => {
      return window.promiseGridMessages || [];
    });
  }

  async triggerPromiseGridTest() {
    await this.useMenuAction('tools', 'promisegrid-test');
  }

  // WASM function testing - with error handling
  async callWasmFunction(functionName, ...args) {
    await this.verifyWasmReady();
    
    return await this.page.evaluate(({ functionName, args }) => {
      const func = window[functionName];
      if (!func) {
        throw new Error(`WASM function ${functionName} not available`);
      }
      return func(...args);
    }, { functionName, args });
  }

  async testWasmCompression(text) {
    await this.verifyWasmReady();
    
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
      return null;
    }, text);
  }

  // Security testing helpers
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

  // Utility functions
  async takeScreenshot(name) {
    await this.page.screenshot({ path: `test-results/screenshots/${name}.png` });
  }

  async waitForStableEditor() {
    await this.page.waitForTimeout(500);
    await this.page.waitForFunction(() => {
      const view = window.editorView;
      return view && view.state && !view.state.updating;
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
      editorViewReady: !!window.editorView
    }));
    console.log('Current editor state:', state);
    return state;
  }
}

module.exports = globalSetup;
