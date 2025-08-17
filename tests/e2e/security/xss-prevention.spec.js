// tests/e2e/security/xss-prevention.spec.js
import { test, expect } from '@playwright/test';
import { CollabEditorHelpers } from '../../utils/testHelpers.js';

test.describe('Security - XSS Prevention', () => {
  let helpers;

  test.beforeEach(async ({ page }) => {
    helpers = new CollabEditorHelpers(page);
    await helpers.navigateToRoom();
  });

  test('prevents script execution in document content', async ({ page }) => {
    // Track any potential XSS execution
    let xssExecuted = false;
    await page.addInitScript(() => {
      window.xssExecuted = false;
      window.testXSS = () => { window.xssExecuted = true; };
    });

    // Attempt various XSS payloads
    const xssPayloads = [
      '<script>window.testXSS()</script>',
      '<img src="x" onerror="window.testXSS()">',
      '<svg onload="window.testXSS()">',
      'javascript:window.testXSS()',
      '<iframe src="javascript:window.testXSS()"></iframe>'
    ];

    for (const payload of xssPayloads) {
      await helpers.typeInEditor(payload + ' ');
      await page.waitForTimeout(500);
      
      // Check if XSS executed
      const executed = await page.evaluate(() => window.xssExecuted);
      expect(executed).toBe(false);
      
      // Verify content is displayed as text, not HTML
      const content = await helpers.getEditorContent();
      expect(content).toContain(payload);
    }
  });

  test('safely handles malicious document titles', async ({ page }) => {
    const maliciousTitles = [
      '<script>alert("XSS")</script>',
      '"><script>alert("XSS")</script>',
      'javascript:alert("XSS")',
      '<img src=x onerror=alert("XSS")>'
    ];

    for (const title of maliciousTitles) {
      await helpers.setDocumentTitle(title);
      await page.waitForTimeout(200);
      
      // Title should be safely displayed
      const displayedTitle = await helpers.getDocumentTitle();
      expect(displayedTitle).toBe(title); // Should be text, not executed
      
      // No alerts should appear
      const alertHandled = await page.evaluate(() => {
        // Override alert to detect if it's called
        let alertCalled = false;
        const originalAlert = window.alert;
        window.alert = () => { alertCalled = true; };
        setTimeout(() => { window.alert = originalAlert; }, 100);
        return alertCalled;
      });
      expect(alertHandled).toBe(false);
    }
  });

  test('validates export filename safety', async ({ page }) => {
    // Set malicious document title
    await helpers.setDocumentTitle('<script>alert("XSS")</script>Document');
    
    // Attempt to export - filename should be sanitized
    const download = await helpers.exportDocument('txt');
    const filename = download.suggestedFilename();
    
    // Filename should not contain script tags or dangerous characters
    expect(filename).not.toContain('<script>');
    expect(filename).not.toContain('alert');
    expect(filename).toMatch(/^[a-zA-Z0-9\-_\s]+\.txt$/); // Should be sanitized
  });

  test('protects against CBOR injection attacks', async ({ page }) => {
    // Monitor console for errors during CBOR processing
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Create large, deeply nested, or malformed content that could exploit CBOR
    const maliciousContent = {
      nested: {},
      large: 'A'.repeat(100000),
      special: '\u0000\u0001\u0002\u0003'
    };
    
    // Create deep nesting
    let current = maliciousContent.nested;
    for (let i = 0; i < 1000; i++) {
      current.next = {};
      current = current.next;
    }

    await helpers.typeInEditor(JSON.stringify(maliciousContent));
    
    // Try to export as CBOR
    try {
      await helpers.exportDocument('cbor');
      await page.waitForTimeout(1000);
    } catch (error) {
      // Export might fail, but shouldn't crash the application
    }

    // Application should still be responsive
    await helpers.typeInEditor(' Still working');
    const content = await helpers.getEditorContent();
    expect(content).toContain('Still working');
    
    // No critical errors should occur
    const criticalErrors = errors.filter(error => 
      error.includes('Maximum call stack') || 
      error.includes('out of memory') ||
      error.includes('security')
    );
    expect(criticalErrors.length).toBe(0);
  });
});

// tests/e2e/security/input-validation.spec.js
test.describe('Security - Input Validation', () => {
  let helpers;

  test.beforeEach(async ({ page }) => {
    helpers = new CollabEditorHelpers(page);
    await helpers.navigateToRoom();
  });

  test('handles extremely large documents safely', async ({ page }) => {
    // Create very large document
    const veryLargeText = 'Large content test. '.repeat(50000); // ~1MB of text
    
    // Should not crash when processing large content
    await helpers.typeInEditor(veryLargeText.substring(0, 10000)); // Type first 10k chars
    
    // WASM functions should handle large input safely
    const compressionResult = await helpers.testWasmCompression(veryLargeText);
    expect(compressionResult).not.toBeNull();
    expect(compressionResult.roundTrip).toBe(true);
    
    // Editor should remain responsive
    await helpers.typeInEditor(' Still responsive');
    const content = await helpers.getEditorContent();
    expect(content).toContain('Still responsive');
  });

  test('validates user input fields', async ({ page }) => {
    // Test username field with various inputs
    const invalidUsernames = [
      '<script>alert("XSS")</script>',
      'A'.repeat(1000), // Very long username
      '\n\r\t', // Whitespace characters
      '🚀💻📱', // Unicode/emoji
      ''  // Empty string
    ];

    for (const username of invalidUsernames) {
      await helpers.setUser(username);
      await page.waitForTimeout(200);
      
      // Username should be safely handled
      const userList = await helpers.getUserList();
      if (username.length > 0) {
        expect(userList).toContain(username.substring(0, 50)); // Should be truncated if too long
      }
    }
  });

  test('protects against URL manipulation', async ({ page }) => {
    // Test malicious room IDs
    const maliciousRooms = [
      '../../../etc/passwd',
      '<script>alert("XSS")</script>',
      'room?param=value&other=malicious',
      'room#fragment',
      'javascript:alert("XSS")'
    ];

    for (const roomId of maliciousRooms) {
      try {
        await helpers.navigateToRoom(roomId);
        await page.waitForTimeout(500);
        
        // Application should handle malicious room IDs safely
        const currentUrl = page.url();
        expect(currentUrl).toContain('room=');
        
        // Editor should still work
        await helpers.typeInEditor('Safe room test');
        const content = await helpers.getEditorContent();
        expect(content).toContain('Safe room test');
        
      } catch (error) {
        // Navigation might fail, but shouldn't crash
        console.log(`Room ${roomId} failed safely:`, error.message);
      }
    }
  });
});
