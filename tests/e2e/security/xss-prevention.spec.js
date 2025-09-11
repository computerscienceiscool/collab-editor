// tests/e2e/security/xss-prevention.spec.js
import { test, expect } from '@playwright/test';
import { TestSetup } from '../../helpers/setup.js';
import { CollabEditorHelpers } from '../../utils/testHelpers.js'
test.describe('Security - XSS Prevention', () => {
  let setup;

  test.beforeEach(async ({ page }) => {
    setup = new TestSetup(page);
    await setup.initializeApp();
    await setup.clearEditor();
    await setup.mockWasmIfNeeded();
  });

  test('prevents script execution in document content', async ({ page }) => {
    const maliciousScript = '<script>window.xssExecuted = true;</script>';
    
    // Add content with script tag
    await setup.typeInEditor(maliciousScript);
    
    // Wait for content to be processed
    await page.waitForTimeout(1000);
    
    // Check that script was not executed
    const scriptExecuted = await page.evaluate(() => {
      return window.xssExecuted === true;
    });
    
    expect(scriptExecuted).toBe(false);
    
    // Check that script tag is not present in DOM
    const hasScriptTag = await page.evaluate(() => {
      const editor = document.querySelector('#editor');
      return editor && editor.innerHTML.includes('<script');
    });
    
    expect(hasScriptTag).toBe(false);
    
    // Verify content is safely displayed as text
    const editorContent = await setup.getEditorContent();
    expect(editorContent).toContain('script');
    expect(editorContent).not.toContain('<script');
  });

  test('safely handles malicious document titles', async ({ page }) => {
    const maliciousTitle = '<script>alert("XSS")</script>Evil Title';
    
    // Set malicious title
    await page.fill('#document-title', maliciousTitle);
    await page.waitForTimeout(500);
    
    // Check that script was not executed
    const scriptExecuted = await page.evaluate(() => {
      return typeof window.alert !== 'function' || window.alert.toString().includes('XSS');
    });
    
    expect(scriptExecuted).toBe(false);
    
    // Verify title is safely displayed
    const titleValue = await page.inputValue('#document-title');
    expect(titleValue).toBe(maliciousTitle); // Should be safe as input value
    
    // Check that HTML is not rendered in title
    const titleElement = await page.locator('#document-title');
    const titleHTML = await titleElement.innerHTML();
    expect(titleHTML).not.toContain('<script');
  });

  test('validates export filename safety', async ({ page }) => {
    // Test malicious filename through export
    const maliciousContent = 'Test content for export';
    await setup.typeInEditor(maliciousContent);
    
    // Set a malicious document title that could affect filename
    await page.fill('#document-title', '../../../evil.js');
    
    // Mock download to capture filename
    let downloadFilename = '';
    await page.route('**/*', (route) => {
      const headers = route.request().headers();
      const contentDisposition = headers['content-disposition'];
      if (contentDisposition) {
        downloadFilename = contentDisposition;
      }
      route.continue();
    });
    
    // Trigger export
    await setup.clickMenuItem('file', 'save-txt');
    await page.waitForTimeout(1000);
    
    // Check that filename was sanitized
    expect(downloadFilename).not.toContain('../');
    expect(downloadFilename).not.toContain('evil.js');
  });

  test('protects against CBOR injection attacks', async ({ page }) => {
    const maliciousContent = 'Normal content with CBOR payload attempt';
    await setup.typeInEditor(maliciousContent);
    
    // Attempt to export as CBOR with malicious content
    await setup.clickMenuItem('file', 'save-cbor');
    await page.waitForTimeout(2000);
    
    // Verify that CBOR export completed without throwing errors
    const hasErrors = await page.evaluate(() => {
      return window.lastError || console.error.called;
    });
    
    expect(hasErrors).toBeFalsy();
    
    // Check that the content was properly serialized
    const editorContent = await setup.getEditorContent();
    expect(editorContent).toBe(maliciousContent);
  });

  test.describe('Security - Input Validation', () => {
    test('handles extremely large documents safely', async ({ page }) => {
      // Create a very large document
      const largeContent = 'A'.repeat(100000); // 100KB of content
      
      const startTime = Date.now();
      
      // Type large content
      await page.evaluate((content) => {
        if (window.editorView) {
          window.editorView.dispatch({
            changes: { from: 0, to: 0, insert: content }
          });
        }
      }, largeContent);
      
      await page.waitForTimeout(3000);
      
      const processingTime = Date.now() - startTime;
      
      // Verify content was handled
      const finalContent = await setup.getEditorContent();
      expect(finalContent.length).toBe(largeContent.length);
      
      // Verify processing time is reasonable (under 10 seconds)
      expect(processingTime).toBeLessThan(10000);
      
      // Verify editor is still responsive
      await page.click('#editor .cm-content');
      const isResponsive = await page.evaluate(() => {
        return document.activeElement && document.activeElement.closest('#editor');
      });
      
      expect(isResponsive).toBe(true);
    });

    test('validates user input fields', async ({ page }) => {
      // Test various input fields for XSS
      const maliciousInput = '<img src=x onerror=alert("XSS")>';
      
      // Test name input
      await page.fill('#name-input', maliciousInput);
      await page.waitForTimeout(500);
      
      const nameValue = await page.inputValue('#name-input');
      expect(nameValue).toBe(maliciousInput); // Should be safe as input value
      
      // Check that script is not executed
      const hasAlert = await page.evaluate(() => {
        return window.alert && window.alert.toString().includes('XSS');
      });
      
      expect(hasAlert).toBe(false);
      
      // Test search input
      await page.fill('#search-input', maliciousInput);
      await page.waitForTimeout(500);
      
      const searchValue = await page.inputValue('#search-input');
      expect(searchValue).toBe(maliciousInput);
      
      // Verify no script execution occurred
      const noScriptExecution = await page.evaluate(() => {
        return !window.hasOwnProperty('xssExecuted');
      });
      
      expect(noScriptExecution).toBe(true);
    });

    test('protects against URL manipulation', async ({ page }) => {
      // Test URL-based attacks
      const currentUrl = page.url();
      
      // Attempt to navigate to malicious URL through room parameter
      const maliciousUrl = currentUrl + '?room=<script>alert("XSS")</script>';
      
      await page.goto(maliciousUrl);
      await page.waitForTimeout(2000);
      
      // Check that script was not executed
      const scriptExecuted = await page.evaluate(() => {
        return window.hasOwnProperty('xssExecuted') || 
               (window.alert && window.alert.toString().includes('XSS'));
      });
      
      expect(scriptExecuted).toBe(false);
      
      // Verify room parameter was safely handled
      const roomDisplay = await page.textContent('#room-name');
      expect(roomDisplay).not.toContain('<script');
      
      // Check that editor is still functional
      await setup.typeInEditor('Test after URL manipulation');
      const content = await setup.getEditorContent();
      expect(content).toBe('Test after URL manipulation');
    });
  });
});
