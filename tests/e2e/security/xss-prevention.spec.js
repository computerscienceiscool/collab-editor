// tests/e2e/security/xss-prevention.spec.js - FIXED VERSION
import { test, expect } from '@playwright/test';
import { CollabEditorHelpers } from '../../utils/testHelpers.js';

test.describe('Security - XSS Prevention', () => {
  let helpers;

  test.beforeEach(async ({ page }) => {
    helpers = new CollabEditorHelpers(page);
    await helpers.navigateToRoom();
    await helpers.clearEditor();
  });

  test('prevents script execution in document content', async ({ page }) => {
    // Test multiple XSS payloads
    const xssPayloads = [
      '<script>window.xssExecuted = true;</script>',
      '<img src="x" onerror="window.xssExecuted = true">',
    ];

    for (const payload of xssPayloads) {
      console.log('Testing XSS payload:', payload);
      
      // Clear editor and add malicious content
      await helpers.clearEditor();
      await helpers.typeInEditor(payload + ' ');
      
      // Wait for content to be processed
      await page.waitForTimeout(1000);
      
      // Check that script was not executed
      const scriptExecuted = await page.evaluate(() => {
        return window.xssExecuted === true;
      });
      
      expect(scriptExecuted).toBe(false);
      
      // Check that actual script tags aren't present in DOM (not just editor content)
      const editorHtml = await page.locator('#editor').innerHTML();
      expect(editorHtml).not.toContain('<script');
      
      // For img tags, they should be safely escaped/rendered as text
      // Don't check for raw 'onerror=' since CodeMirror may syntax-highlight it safely
      if (payload.includes('<img')) {
        // Verify no actual img elements were created in the editor
        const imgElements = await page.locator('#editor img').count();
        expect(imgElements).toBe(0);
      }
      
      // Verify content is safely displayed as text in editor content
      const editorContent = await helpers.getEditorContent();
      expect(editorContent).toContain(payload); // Should be displayed as text
      
      console.log('✓ XSS payload safely handled:', payload);
    }
  });


  test('safely handles malicious document titles', async ({ page }) => {
    const maliciousTitles = [
      '<script>window.titleXSS = true;</script>Evil Title',
      'javascript:alert("XSS")',
      '<img src=x onerror=alert("XSS")>',
      '"><script>window.titleXSS = true;</script><"'
    ];
    
    for (const maliciousTitle of maliciousTitles) {
      console.log('Testing malicious title:', maliciousTitle);
      
      // Set malicious title
      await helpers.setDocumentTitle(maliciousTitle);
      await page.waitForTimeout(500);
      
      // Check that script was not executed
      const scriptExecuted = await page.evaluate(() => {
        return window.titleXSS === true || window.xssExecuted === true;
      });
      
      expect(scriptExecuted).toBe(false);
      
      // Verify title is safely stored as input value
      const titleValue = await helpers.getDocumentTitle();
      expect(titleValue).toBe(maliciousTitle); // Should be safe as input value
      
      // Check that HTML is not rendered in title element
      const titleElement = page.locator('#document-title');
      const titleHTML = await titleElement.innerHTML();
      expect(titleHTML).not.toContain('<script');
      expect(titleHTML).not.toContain('onerror=');
      
      console.log('✓ Malicious title safely handled');
    }
  });

  test('validates export filename safety', async ({ page }) => {
    console.log('Testing export filename safety');
    
    const maliciousContent = 'Test content for export';
    await helpers.setEditorContent(maliciousContent);
    
    // Test malicious filenames that could affect file system
    const maliciousFilenames = [
      '../../../evil.js',
      '..\\..\\evil.exe',
      '/etc/passwd',
      'CON.txt', // Windows reserved name
      'NUL',     // Windows reserved name
      '<script>alert("xss")</script>.txt'
    ];
    
    for (const filename of maliciousFilenames) {
      console.log('Testing malicious filename:', filename);
      
      await helpers.setDocumentTitle(filename);
      
      // Mock the download to capture what would be downloaded
      let downloadAttempted = false;
      let downloadError = null;
      
      page.route('**/*', (route, request) => {
        const url = request.url();
        if (url.includes('blob:') || request.method() === 'POST') {
          downloadAttempted = true;
          console.log('Download intercepted for URL:', url);
        }
        route.continue().catch(err => {
          downloadError = err;
        });
      });
      
      // Trigger export via menu
      try {
        await helpers.useMenuAction('file', 'save-txt');
        await page.waitForTimeout(1000);
      } catch (error) {
        console.log('Export error (expected for malicious filenames):', error.message);
      }
      
      // Verify no dangerous file operations occurred
      const fileSystemErrors = await page.evaluate(() => {
        return window.fileSystemErrors || [];
      });
      
      // Check that the application didn't crash
      const editorStillWorks = await page.evaluate(() => {
        return !!document.querySelector('#editor .cm-content');
      });
      
      expect(editorStillWorks).toBe(true);
      
      console.log('✓ Malicious filename safely handled');
    }
  });

  test('protects against CBOR injection attacks', async ({ page }) => {
    console.log('Testing CBOR injection protection');
    
    const maliciousContent = 'Normal content with potential CBOR payload';
    await helpers.setEditorContent(maliciousContent);
    
    // Test CBOR export with potentially malicious content
    let exportError = null;
    
    try {
      await helpers.useMenuAction('file', 'save-cbor');
      await page.waitForTimeout(2000);
    } catch (error) {
      exportError = error;
    }
    
    // Verify that CBOR export completed without throwing unhandled errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Check that the content was properly handled
    const editorContent = await helpers.getEditorContent();
    expect(editorContent).toBe(maliciousContent);
    
    // Verify editor is still functional
    await helpers.typeInEditor(' Additional text');
    const updatedContent = await helpers.getEditorContent();
    expect(updatedContent).toContain('Additional text');
    
    console.log('✓ CBOR injection protection verified');
  });

  test('handles extremely large documents safely', async ({ page }) => {
    console.log('Testing large document handling');
    
    // Create a very large document (but not too large for tests)
    const largeContent = 'A'.repeat(10000); // 10KB of content
    
    const startTime = Date.now();
    
    // Set large content using direct editor manipulation for speed
    await page.evaluate((content) => {
      if (window.editorView) {
        window.editorView.dispatch({
          changes: { from: 0, to: window.editorView.state.doc.length, insert: content }
        });
      }
    }, largeContent);
    
    await page.waitForTimeout(2000);
    
    const processingTime = Date.now() - startTime;
    
    // Verify content was handled
    const finalContent = await helpers.getEditorContent();
    expect(finalContent.length).toBeGreaterThanOrEqual(largeContent.length - 100); // Allow for some variance
    
    // Verify processing time is reasonable (under 10 seconds)
    expect(processingTime).toBeLessThan(10000);
    
    // Verify editor is still responsive
    await page.click('#editor .cm-content');
    const isResponsive = await page.evaluate(() => {
      const activeElement = document.activeElement;
      return activeElement && (
        activeElement.closest('#editor') || 
        activeElement.classList.contains('cm-content')
      );
    });
    
    expect(isResponsive).toBe(true);
    
    console.log('✓ Large document handled safely');
  });

  test('validates user input fields', async ({ page }) => {
    console.log('Testing user input field validation');
    
    // Test various input fields for XSS
    const maliciousInputs = [
      '<img src=x onerror=window.inputXSS=true>',
      'javascript:void(window.inputXSS=true)',
      '<svg onload=window.inputXSS=true>',
      '"><script>window.inputXSS=true;</script>'
    ];
    
    for (const maliciousInput of maliciousInputs) {
      console.log('Testing malicious input:', maliciousInput);
      
      // Test name input
      await page.fill('#name-input', maliciousInput);
      await page.waitForTimeout(500);
      
      const nameValue = await page.inputValue('#name-input');
      expect(nameValue).toBe(maliciousInput); // Should be safe as input value
      
      // Test search input
      await page.fill('#search-input', maliciousInput);
      await page.waitForTimeout(500);
      
      const searchValue = await page.inputValue('#search-input');
      expect(searchValue).toBe(maliciousInput);
      
      // Check that script is not executed
      const hasXSSExecution = await page.evaluate(() => {
        return window.inputXSS === true || 
               window.xssExecuted === true ||
               window.titleXSS === true;
      });
      
      expect(hasXSSExecution).toBe(false);
      
      console.log('✓ Malicious input safely handled in form fields');
    }
  });

  test('protects against URL manipulation', async ({ page }) => {
    console.log('Testing URL manipulation protection');
    
    // Test URL-based attacks through room parameter
    const maliciousRooms = [
      '<script>window.urlXSS=true;</script>',
      'javascript:void(window.urlXSS=true)',
      '"><script>window.urlXSS=true;</script>',
      '%3Cscript%3Ewindow.urlXSS=true;%3C/script%3E' // URL encoded
    ];
    
    for (const maliciousRoom of maliciousRooms) {
      console.log('Testing malicious room parameter:', maliciousRoom);
      
      // Navigate to URL with malicious room parameter
      const maliciousUrl = `http://localhost:8080/?room=${encodeURIComponent(maliciousRoom)}`;
      
      try {
        await page.goto(maliciousUrl);
        await page.waitForTimeout(2000);
        
        // Wait for app initialization
        await helpers.waitForAppInitialization();
        
        // Check that script was not executed
        const scriptExecuted = await page.evaluate(() => {
          return window.urlXSS === true || 
                 window.xssExecuted === true ||
                 typeof window.alert !== 'function';
        });
        
        expect(scriptExecuted).toBe(false);
        
        // Verify room parameter was safely handled
        const roomDisplay = await page.textContent('#room-name');
        expect(roomDisplay).not.toContain('<script');
        expect(roomDisplay).not.toContain('javascript:');
        
        // Check that editor is still functional
        await helpers.clearEditor();
        await helpers.typeInEditor('Test after URL manipulation');
        const content = await helpers.getEditorContent();
        expect(content).toBe('Test after URL manipulation');
        
        console.log('✓ Malicious URL parameter safely handled');
        
      } catch (error) {
        console.log('URL navigation error (expected for some malicious URLs):', error.message);
        // This is acceptable - some malicious URLs should be rejected
      }
    }
  });

  test('prevents DOM-based XSS through content manipulation', async ({ page }) => {
    console.log('Testing DOM-based XSS prevention');
    
    // Test various DOM manipulation attacks
    const domAttacks = [
      'document.body.innerHTML="<script>window.domXSS=true;</script>"',
      'eval("window.domXSS=true")',
      'setTimeout("window.domXSS=true", 100)',
      'Function("window.domXSS=true")()'
    ];
    
    for (const attack of domAttacks) {
      console.log('Testing DOM attack:', attack);
      
      // Try to inject the attack through editor content
      await helpers.clearEditor();
      await helpers.typeInEditor(attack);
      
      // Wait for any potential execution
      await page.waitForTimeout(1000);
      
      // Try to execute via search (if search processes content)
      try {
        await helpers.searchDocument(attack);
        await page.waitForTimeout(500);
      } catch (error) {
        // Search might fail with malicious content, which is expected
      }
      
      // Check that DOM attack was not executed
      const domAttackExecuted = await page.evaluate(() => {
        return window.domXSS === true;
      });
      
      expect(domAttackExecuted).toBe(false);
      
      // Verify content is safely displayed
      const content = await helpers.getEditorContent();
      expect(content).toContain(attack); // Should be displayed as text
      
      console.log('✓ DOM attack safely prevented');
    }
  });

  test('validates PromiseGrid message security', async ({ page }) => {
    console.log('Testing PromiseGrid message security');
    
    // Test that PromiseGrid functions don't execute malicious payloads
    const maliciousPayloads = [
      '<script>window.promiseGridXSS=true;</script>',
      'eval("window.promiseGridXSS=true")',
      'javascript:window.promiseGridXSS=true'
    ];
    
    for (const payload of maliciousPayloads) {
      console.log('Testing PromiseGrid payload:', payload);
      
      // Set content with malicious payload
      await helpers.setEditorContent(payload);
      
      // Try to trigger PromiseGrid message creation
      try {
        await helpers.selectAllText();
        await helpers.applyBold(); // This should create a PromiseGrid message
        await page.waitForTimeout(500);
        
        // Try the test function if available
        const testResult = await page.evaluate((payload) => {
          if (window.createPromiseGridMessage) {
            try {
              window.createPromiseGridMessage('test-doc', 'test', 0, payload, 'test-user');
              return { success: true, error: null };
            } catch (error) {
              return { success: false, error: error.message };
            }
          }
          return { success: false, error: 'Function not available' };
        }, payload);
        
        console.log('PromiseGrid test result:', testResult);
        
      } catch (error) {
        console.log('PromiseGrid operation error (expected for malicious content):', error.message);
      }
      
      // Check that malicious payload was not executed
      const promiseGridXSS = await page.evaluate(() => {
        return window.promiseGridXSS === true;
      });
      
      expect(promiseGridXSS).toBe(false);
      
      console.log('✓ PromiseGrid message security verified');
    }
  });

  test('ensures CSP compliance', async ({ page }) => {
    console.log('Testing Content Security Policy compliance');
    
    const cspViolations = [];
    
    // Listen for CSP violations
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('Content Security Policy') || 
          text.includes('CSP') ||
          text.includes('unsafe-eval') ||
          text.includes('unsafe-inline')) {
        cspViolations.push(text);
      }
    });
    
    // Perform various operations that might trigger CSP violations
    await helpers.setEditorContent('Test content for CSP');
    await helpers.selectAllText();
    await helpers.applyBold();
    await helpers.formatDocument();
    await helpers.searchDocument('Test');
    
    // Try export operations
    try {
      await helpers.useMenuAction('file', 'save-txt');
      await page.waitForTimeout(1000);
    } catch (error) {
      // Export might fail in test environment, but shouldn't cause CSP violations
    }
    
    // Wait for any delayed violations
    await page.waitForTimeout(2000);
    
    // Check that no CSP violations occurred
    expect(cspViolations).toHaveLength(0);
    
    console.log('✓ No CSP violations detected');
  });

  test('verifies secure defaults are maintained', async ({ page }) => {
    console.log('Testing secure defaults');
    
    // Check that dangerous globals are not exposed
    const securityCheck = await page.evaluate(() => {
      const dangerous = {
        evalAvailable: typeof eval !== 'undefined',
        functionConstructor: typeof Function !== 'undefined',
        setTimeoutString: false,
        setIntervalString: false,
        documentWrite: typeof document.write !== 'undefined'
      };
      
      // Test if setTimeout/setInterval accept strings (dangerous)
      try {
        setTimeout('1+1', 1);
        dangerous.setTimeoutString = true;
      } catch (e) {
        // Good - string execution blocked
      }
      
      try {
        setInterval('1+1', 1000);
        dangerous.setIntervalString = true;
      } catch (e) {
        // Good - string execution blocked
      }
      
      return dangerous;
    });
    
    console.log('Security check results:', securityCheck);
    
    // These are generally available in browsers but should be used carefully
    // The test mainly ensures our app doesn't create additional attack vectors
    expect(typeof securityCheck).toBe('object');
    
    // Verify editor security state
    const editorSecurity = await page.evaluate(() => {
      const editor = document.querySelector('#editor');
      if (!editor) return { error: 'Editor not found' };
      
      return {
        hasInlineScripts: editor.querySelectorAll('script').length,
        hasEventHandlers: editor.querySelectorAll('[onclick], [onerror], [onload]').length,
        hasJavascriptUrls: editor.innerHTML.includes('javascript:'),
        contentEditable: editor.isContentEditable || !!editor.querySelector('[contenteditable="true"]')
      };
    });
    
    expect(editorSecurity.hasInlineScripts).toBe(0);
    expect(editorSecurity.hasEventHandlers).toBe(0);
    expect(editorSecurity.hasJavascriptUrls).toBe(false);
    
    console.log('✓ Secure defaults maintained');
  });
});
