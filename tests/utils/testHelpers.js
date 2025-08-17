// tests/utils/testHelpers.js - Enhanced version with all your app features
export class CollabEditorHelpers {
  constructor(page) {
    this.page = page;
  }

  // Navigation and setup
async navigateToRoom(roomId = 'test') {
  console.log('Navigating to room:', roomId);
  await this.page.goto(`http://localhost:8080/?room=${roomId}`);
  console.log('Current URL:', this.page.url());
  await this.page.waitForSelector('#editor');
  // Wait for WASM to initialize
  await this.page.waitForFunction(() => window.toggle_bold !== undefined, { timeout: 10000 });
}

  // User setup
  async setUser(name, color = '#ff0000') {
    await this.page.fill('#name-input', name);
    await this.page.fill('#color-input', color);
    await this.page.waitForTimeout(500); // Allow sync
  }

  // Editor operations
  async typeInEditor(text) {
    await this.page.click('#editor .cm-content');
    await this.page.type('#editor .cm-content', text);
  }

  async clearEditor() {
    await this.page.click('#editor .cm-content');
    await this.page.keyboard.press('Control+a');
    await this.page.keyboard.press('Delete');
    await this.page.waitForTimeout(200);
  }

  async setEditorContent(text) {
    await this.clearEditor();
    await this.typeInEditor(text);
  }

  async getEditorContent() {
    return await this.page.textContent('#editor .cm-content');
  }

  async selectAllText() {
    await this.page.click('#editor .cm-content');
    await this.page.keyboard.press('Control+a');
  }

  async selectText(from, to) {
    await this.page.click('#editor .cm-content');
    // Use CodeMirror API to select specific range
    await this.page.evaluate(({ from, to }) => {
      const view = window.editorView;
      view.dispatch({
        selection: { anchor: from, head: to }
      });
    }, { from, to });
  }

  // Formatting operations
  async applyBold() {
    await this.page.click('#bold-button');
    await this.page.waitForTimeout(200); // Allow WASM processing
  }

  async applyItalic() {
    await this.page.click('#italic-button');
    await this.page.waitForTimeout(200);
  }

  async applyUnderline() {
    await this.page.click('#underline-button');
    await this.page.waitForTimeout(200);
  }

  async applyStrikethrough() {
    await this.page.click('#strike-button');
    await this.page.waitForTimeout(200);
  }

  async formatDocument() {
    await this.page.click('#format-button');
    await this.page.waitForTimeout(500); // Allow WASM processing
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
    // Use the menu system approach
    await this.useMenuAction('file', `save-${format}`);
  }

  async exportViaDropdown(format) {
    // Alternative: use the hidden dropdown (legacy compatibility)
    await this.page.selectOption('#save-format', format);
    
    // Set up download promise before clicking
    const downloadPromise = this.page.waitForEvent('download');
    await this.page.click('#save-button');
    
    return await downloadPromise;
  }

  // Search functionality
  async searchDocument(term) {
    await this.page.fill('#search-input', term);
    await this.page.click('#search-button');
    await this.page.waitForTimeout(300); // Allow search processing
  }

  async clearSearch() {
    await this.page.click('#clear-search-button');
  }

  // User awareness and collaboration
  async waitForUserCount(expectedCount) {
    await this.page.waitForFunction(
      (count) => {
        const userCountElement = document.querySelector('#user-count');
        return userCountElement && userCountElement.textContent.trim() === count.toString();
      },
      expectedCount,
      { timeout: 10000 }
    );
  }

  async getUserCount() {
    const userCountText = await this.page.textContent('#user-count');
    return parseInt(userCountText.match(/\d+/)?.[0] || '0');
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
      return document.querySelector('#user-count')?.textContent !== '0';
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
    await this.page.waitForSelector('.word-count-dialog, .popup, [role="dialog"]');
  }

  // PromiseGrid integration testing
  async getPromiseGridMessages() {
    return await this.page.evaluate(() => {
      // Return any PromiseGrid messages logged to console
      return window.promiseGridMessages || [];
    });
  }

  async triggerPromiseGridTest() {
    await this.useMenuAction('tools', 'promisegrid-test');
  }

  // WASM function testing
  async callWasmFunction(functionName, ...args) {
    return await this.page.evaluate(({ functionName, args }) => {
      return window[functionName]?.(...args);
    }, { functionName, args });
  }

  async testWasmCompression(text) {
    return await this.page.evaluate((text) => {
      if (window.compress_document && window.decompress_document) {
        const compressed = window.compress_document(text);
        const decompressed = window.decompress_document(compressed);
        return {
          original: text.length,
          compressed: compressed.length,
          decompressed: decompressed.length,
          roundTrip: text === decompressed
        };
      }
      return null;
    }, text);
  }

  // Security testing helpers
  async injectXSS(payload) {
    await this.typeInEditor(payload);
    // Check if script executed by looking for side effects
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
    await this.typeInEditor(text);
    await this.selectAllText();
    
    const startTime = Date.now();
    await this.applyBold();
    const endTime = Date.now();
    
    return endTime - startTime;
  }

  // Utility functions
  async takeScreenshot(name) {
    await this.page.screenshot({ path: `test-results/screenshots/${name}.png` });
  }

  async waitForStableEditor() {
    // Wait for editor to be stable (no pending operations)
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
      isOffline: document.querySelector('#offline-banner')?.classList.contains('hidden') === false
    }));
    console.log('Current editor state:', state);
    return state;
  }
}
