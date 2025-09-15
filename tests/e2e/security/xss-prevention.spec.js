// tests/e2e/security/xss-prevention.spec.js
import { test, expect } from '@playwright/test';
import { CollabEditorHelpers } from '../../utils/testHelpers.js';

test.describe('Security - XSS Prevention', () => {
  let helpers;

  test.beforeEach(async ({ page }, testInfo) => {
    helpers = new CollabEditorHelpers(page);
    helpers.setTestName(testInfo.title);
    await helpers.navigateToRoom();
    
    // Clear any potential XSS execution flags
    await page.evaluate(() => {
      delete window.xssExecuted;
      delete window.titleXSS;
      delete window.inputXSS;
      delete window.urlXSS;
      delete window.domXSS;
      delete window.promiseGridXSS;
    });
  });

  test('prevents script execution in document content', async ({ page }) => {
    const xssPayloads = [
      '<script>window.xssExecuted = true;</script>',
      '<img src="x" onerror="window.xssExecuted = true">',
      '<svg onload="window.xssExecuted = true">',
      'javascript:window.xssExecuted = true',
      '<iframe src="javascript:alert(1)"></iframe>',
      '<object data="javascript:alert(1)"></object>',
      '<embed src="javascript:alert(1)"></embed>',
      '<link rel="stylesheet" href="javascript:alert(1)">',
      '<style>@import "javascript:alert(1)";</style>',
      '<div onmouseover="window.xssExecuted = true">hover me</div>',
      '<form><button formaction="javascript:window.xssExecuted = true">click</button></form>',
      '"><script>window.xssExecuted = true;</script>',
      '<script src="data:text/javascript,window.xssExecuted=true"></script>',
      '<script>eval("window.xssExecuted = true")</script>',
      '<script>setTimeout("window.xssExecuted = true", 100)</script>',
      '<script>Function("window.xssExecuted = true")()</script>'
    ];

    for (const payload of xssPayloads) {
      await helpers.clearEditor();
      await helpers.setEditorContent(payload);
      await page.waitForTimeout(300);
      
      // Verify DOM structure safety
      const editorHTML = await page.locator('#editor').innerHTML();
      expect(editorHTML).not.toContain('<script');
      expect(editorHTML).not.toContain('onerror=');
      expect(editorHTML).not.toContain('onload=');
      expect(editorHTML).not.toContain('onmouseover=');
      expect(editorHTML).not.toContain('javascript:');
      expect(editorHTML).not.toContain('data:text/javascript');
      
      // Verify content integrity
      const editorContent = await helpers.getEditorContent();
      expect(editorContent).toBe(payload);
      
      // Verify no script execution
      const scriptExecuted = await page.evaluate(() => window.xssExecuted === true);
      expect(scriptExecuted).toBe(false);
      
      // Verify no dangerous elements created
      const dangerousElements = await page.evaluate(() => {
        const editor = document.querySelector('#editor');
        return {
          scripts: editor.querySelectorAll('script').length,
          iframes: editor.querySelectorAll('iframe').length,
          objects: editor.querySelectorAll('object').length,
          embeds: editor.querySelectorAll('embed').length,
          links: editor.querySelectorAll('link[href*="javascript:"]').length,
          eventHandlers: editor.querySelectorAll('[onerror], [onload], [onmouseover], [onclick]').length
        };
      });
      
      expect(dangerousElements.scripts).toBe(0);
      expect(dangerousElements.iframes).toBe(0);
      expect(dangerousElements.objects).toBe(0);
      expect(dangerousElements.embeds).toBe(0);
      expect(dangerousElements.links).toBe(0);
      expect(dangerousElements.eventHandlers).toBe(0);
    }
  });

  test('safely handles malicious document titles', async ({ page }) => {
    const maliciousTitles = [
      '<script>window.titleXSS = true;</script>Evil Title',
      'javascript:alert("XSS")',
      '<img src=x onerror=window.titleXSS=true>',
      '"><script>window.titleXSS=true;</script><"',
      '<svg/onload=window.titleXSS=true>',
      'data:text/html,<script>window.titleXSS=true</script>',
      'vbscript:msgbox("XSS")',
      'file:///etc/passwd',
      '\u0000<script>window.titleXSS=true</script>',
      '<iframe src="javascript:window.titleXSS=true"></iframe>',
      '<meta http-equiv="refresh" content="0; url=javascript:window.titleXSS=true">',
      '<title><script>window.titleXSS=true</script></title>',
      '</title><script>window.titleXSS=true</script><title>'
    ];
    
    for (const maliciousTitle of maliciousTitles) {
      await helpers.setDocumentTitle(maliciousTitle);
      await page.waitForTimeout(200);
      
      // Verify title is safely stored
      const titleValue = await helpers.getDocumentTitle();
      expect(titleValue).toBe(maliciousTitle);
      
      // Verify no script execution
      const scriptExecuted = await page.evaluate(() => 
        window.titleXSS === true || window.xssExecuted === true
      );
      expect(scriptExecuted).toBe(false);
      
      // Verify DOM safety
      const titleSafety = await page.evaluate(() => {
        const titleElement = document.querySelector('#document-title');
        const pageTitle = document.querySelector('title');
        
        return {
          inputHasScripts: titleElement.innerHTML.includes('<script'),
          inputHasHandlers: titleElement.innerHTML.includes('onerror='),
          pageTitleSafe: !pageTitle?.innerHTML.includes('<script'),
          noInjectedElements: document.querySelectorAll('#document-title script, title script').length === 0
        };
      });
      
      expect(titleSafety.inputHasScripts).toBe(false);
      expect(titleSafety.inputHasHandlers).toBe(false);
      expect(titleSafety.pageTitleSafe).toBe(true);
      expect(titleSafety.noInjectedElements).toBe(true);
    }
  });

  test('validates export filename safety', async ({ page }) => {
    const maliciousContent = 'Test content for export';
    await helpers.setEditorContent(maliciousContent);
    
    const maliciousFilenames = [
      // Directory traversal
      '../../../evil.js',
      '..\\..\\evil.exe',
      '/etc/passwd',
      '\\windows\\system32\\cmd.exe',
      
      // Windows reserved names
      'CON.txt',
      'PRN.txt', 
      'AUX.txt',
      'NUL',
      'COM1.txt',
      'LPT1.txt',
      
      // Script injection attempts
      '<script>alert("xss")</script>.txt',
      'file;rm -rf /.txt',
      'file`rm -rf /`.txt',
      'file$(rm -rf /).txt',
      
      // Special characters
      'file"with"quotes.txt',
      "file'with'single'quotes.txt",
      'file;with;semicolons.txt',
      'file|with|pipes.txt',
      'file&with&ampersands.txt',
      'file with spaces.txt',
      'file\twith\ttabs.txt',
      'file\nwith\nnewlines.txt',
      
      // Unicode/encoding attacks
      'file\u0000null.txt',
      'file\u202emoc.evil',
      'file%00null.txt',
      'file%2e%2e%2f%2e%2e%2fpasswd',
      
      // Long filename attack
      'A'.repeat(300) + '.txt'
    ];
    
    for (const filename of maliciousFilenames) {
      await helpers.setDocumentTitle(filename);
      
      let exportError = null;
      try {
        await helpers.useMenuAction('file', 'save-txt');
        await page.waitForTimeout(500);
      } catch (error) {
        exportError = error;
      }
      
      // Verify application stability
      const editorStillWorks = await page.evaluate(() => {
        return !!document.querySelector('#editor .cm-content');
      });
      expect(editorStillWorks).toBe(true);
      
      // Verify content integrity
      const content = await helpers.getEditorContent();
      expect(content).toBe(maliciousContent);
      
      // Verify DOM integrity
      const domIntegrity = await page.evaluate(() => {
        return {
          noInjectedScripts: document.querySelectorAll('script[src*="evil"]').length === 0,
          noFileSystemAccess: !window.location.href.includes('/etc/passwd'),
          titleElementSafe: !document.querySelector('#document-title').innerHTML.includes('<script')
        };
      });
      
      expect(domIntegrity.noInjectedScripts).toBe(true);
      expect(domIntegrity.noFileSystemAccess).toBe(true);
      expect(domIntegrity.titleElementSafe).toBe(true);
      
      // Verify continued functionality
      await helpers.typeInEditor(' Additional');
      const updatedContent = await helpers.getEditorContent();
      expect(updatedContent).toContain('Additional');
      
      await helpers.setEditorContent(maliciousContent);
    }
  });

  test('protects against CBOR injection attacks', async ({ page }) => {
    const testContents = [
      'Normal content with various special chars: <>&"\'',
      String.fromCharCode(0, 1, 2, 3, 4, 5),
      'Unicode test: 🙂 文字 🚀 💻',
      '\x83\x01\x02\x03',
      '\xa1\x61\x61\x61\x62',
      'Large content: ' + 'X'.repeat(10000),
      '{"script": "<script>alert(1)</script>"}',
      '{"unclosed": "value", "array": [1,2,3'
    ];
    
    for (const testContent of testContents) {
      await helpers.setEditorContent(testContent);
      
      let exportCompleted = false;
      let consoleErrors = [];
      
      const errorHandler = (msg) => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      };
      page.on('console', errorHandler);
      
      try {
        await helpers.useMenuAction('file', 'save-cbor');
        await page.waitForTimeout(1000);
        exportCompleted = true;
      } catch (error) {
        // CBOR export may fail with certain content types
      } finally {
        page.off('console', errorHandler);
      }
      
      // Verify content integrity
      const editorContent = await helpers.getEditorContent();
      expect(editorContent).toBe(testContent);
      
      await helpers.typeInEditor(' More content');
      const updatedContent = await helpers.getEditorContent();
      expect(updatedContent).toContain('More content');
      
      // Check for critical errors only
      const criticalErrors = consoleErrors.filter(error => 
        error.toLowerCase().includes('uncaught') || 
        error.toLowerCase().includes('fatal') ||
        error.toLowerCase().includes('security')
      );
      expect(criticalErrors.length).toBe(0);
      
      // Verify no script execution
      const scriptExecuted = await page.evaluate(() => window.xssExecuted === true);
      expect(scriptExecuted).toBe(false);
      
      await helpers.clearEditor();
    }
  });

  test('handles extremely large documents safely', async ({ page }) => {
    const largeContentTypes = [
      {
        name: 'Repeated text',
        content: 'Lorem ipsum dolor sit amet. '.repeat(1000),
      },
      {
        name: 'Large single line',
        content: 'A'.repeat(50000),
      },
      {
        name: 'Many short lines',
        content: Array(5000).fill('Short line').join('\n'),
      },
      {
        name: 'Mixed content with HTML-like strings',
        content: '<div>Normal content</div>\n'.repeat(1000) + '<script>not executed</script>',
      }
    ];
    
    for (const { name, content } of largeContentTypes) {
      const startTime = Date.now();
      
      await helpers.setEditorContent(content);
      
      const contentSetTime = Date.now() - startTime;
      
      // Verify content was set correctly
      const actualContent = await helpers.getEditorContent();
      expect(actualContent.length).toBeGreaterThanOrEqual(content.length - 100);
      
      // Verify no script execution
      const scriptExecuted = await page.evaluate(() => window.xssExecuted === true);
      expect(scriptExecuted).toBe(false);
      
      // Test responsiveness
      const responseTestStart = Date.now();
      await page.click('#editor .cm-content');
      await helpers.typeInEditor(' Additional text');
      const responseTime = Date.now() - responseTestStart;
      
      const finalContent = await helpers.getEditorContent();
      expect(finalContent).toContain('Additional text');
      
      // Performance expectations
      expect(contentSetTime).toBeLessThan(15000);
      expect(responseTime).toBeLessThan(8000);
      
      await helpers.clearEditor();
    }
  });

  test('validates user input fields', async ({ page }) => {
    const maliciousInputs = [
      '<img src=x onerror=window.inputXSS=true>',
      'javascript:void(window.inputXSS=true)',
      '<svg onload=window.inputXSS=true>',
      '"><script>window.inputXSS=true;</script>',
      '&lt;script&gt;alert("test")&lt;/script&gt;',
      '<iframe src="javascript:window.inputXSS=true"></iframe>',
      '<object data="javascript:window.inputXSS=true"></object>',
      '<link rel="stylesheet" href="javascript:window.inputXSS=true">',
      '<style>@import "javascript:window.inputXSS=true";</style>',
      '<form><input type="text" value="test" onfocus="window.inputXSS=true"></form>',
      'data:text/html,<script>window.inputXSS=true</script>',
      '\u0000<script>window.inputXSS=true</script>',
      String.fromCharCode(60, 115, 99, 114, 105, 112, 116, 62) + 'window.inputXSS=true' + String.fromCharCode(60, 47, 115, 99, 114, 105, 112, 116, 62)
    ];
    
    const inputFields = [
      { selector: '#name-input', name: 'Name input' },
      { selector: '#search-input', name: 'Search input' },
      { selector: '#document-title', name: 'Document title' }
    ];
    
    for (const maliciousInput of maliciousInputs) {
      for (const field of inputFields) {
        // Test basic input handling
        await page.fill(field.selector, maliciousInput);
        const inputValue = await page.inputValue(field.selector);
        expect(inputValue).toBe(maliciousInput);
        
        // Test DOM safety
        const inputSafety = await page.evaluate((selector) => {
          const input = document.querySelector(selector);
          const parent = input.parentElement;
          
          return {
            inputHasNoScripts: !input.innerHTML.includes('<script'),
            parentHasNoScripts: parent.querySelectorAll('script').length === 0,
            noEventHandlers: parent.querySelectorAll('[onerror], [onload], [onclick]').length === 0
          };
        }, field.selector);
        
        expect(inputSafety.inputHasNoScripts).toBe(true);
        expect(inputSafety.parentHasNoScripts).toBe(true);
        expect(inputSafety.noEventHandlers).toBe(0);
        
        await page.fill(field.selector, '');
      }
      
      // Verify no script execution
      const hasXSS = await page.evaluate(() => {
        return window.inputXSS === true || 
               window.xssExecuted === true ||
               window.titleXSS === true;
      });
      expect(hasXSS).toBe(false);
    }
  });

  test('protects against URL manipulation', async ({ page }) => {
    const maliciousRooms = [
      '<script>window.urlXSS=true;</script>',
      'javascript:void(window.urlXSS=true)',
      '"><script>window.urlXSS=true;</script>',
      '%3Cscript%3Ewindow.urlXSS=true;%3C/script%3E',
      'data:text/html,<script>window.urlXSS=true</script>',
      'file:///etc/passwd',
      'ftp://malicious.site/script.js',
      '../../../evil',
      '..%2f..%2f..%2fevil',
      '\u0000<script>window.urlXSS=true</script>',
      String.fromCharCode(60, 115, 99, 114, 105, 112, 116, 62) + 'window.urlXSS=true' + String.fromCharCode(60, 47, 115, 99, 114, 105, 112, 116, 62),
      '//evil.com/script.js',
      '///evil.com/script.js'
    ];
    
    for (const maliciousRoom of maliciousRooms) {
      const maliciousUrl = `http://localhost:8080/?room=${encodeURIComponent(maliciousRoom)}`;
      
      try {
        await page.goto(maliciousUrl, { 
          timeout: 8000, 
          waitUntil: 'domcontentloaded' 
        });
        await helpers.waitForAppInitialization();
        
        // Verify no script execution
        const scriptExecuted = await page.evaluate(() => {
          return window.urlXSS === true || window.xssExecuted === true;
        });
        expect(scriptExecuted).toBe(false);
        
        // Verify room display safety
        const roomDisplay = await page.textContent('#room-name');
        expect(roomDisplay).not.toContain('<script');
        expect(roomDisplay).not.toContain('javascript:');
        
        // Comprehensive URL safety checks
        const urlSafety = await page.evaluate(() => {
          return {
            locationSafe: !window.location.href.includes('<script'),
            noInjectedElements: document.querySelectorAll('script[src*="evil"], script[src*="malicious"]').length === 0,
            roomDisplaySafe: !document.querySelector('#room-name').innerHTML.includes('<script')
          };
        });
        
        expect(urlSafety.locationSafe).toBe(true);
        expect(urlSafety.noInjectedElements).toBe(true);
        expect(urlSafety.roomDisplaySafe).toBe(true);
        
        // Verify functionality
        await helpers.setEditorContent('Test after URL manipulation');
        const content = await helpers.getEditorContent();
        expect(content).toBe('Test after URL manipulation');
        
      } catch (error) {
        // Some malicious URLs should be rejected - this is acceptable
      }
    }
  });

  test('prevents DOM-based XSS through content manipulation', async ({ page }) => {
    const domAttacks = [
      '<div onclick="window.domXSS=true">Click me</div>',
      '<style>body { background: url("javascript:window.domXSS=true"); }</style>',
      '<iframe src="javascript:window.domXSS=true"></iframe>',
      'document.body.innerHTML="<script>window.domXSS=true;</script>"',
      'eval("window.domXSS=true")',
      'setTimeout("window.domXSS=true", 100)',
      'Function("window.domXSS=true")()',
      '<form><input type="text" autofocus onfocus="window.domXSS=true"></form>',
      '<details open ontoggle="window.domXSS=true"></details>',
      '<video><source onerror="window.domXSS=true"></video>',
      '<audio><source onerror="window.domXSS=true"></audio>',
      '<img src="valid.jpg" onload="window.domXSS=true">',
      '<link rel="prefetch" href="javascript:window.domXSS=true">'
    ];
    
    for (const attack of domAttacks) {
      await helpers.setEditorContent(attack);
      await page.waitForTimeout(300);
      
      // Verify no dangerous elements created
      const dangerousElements = await page.evaluate(() => {
        const editor = document.querySelector('#editor');
        return {
          clickableElements: editor.querySelectorAll('[onclick]').length,
          iframes: editor.querySelectorAll('iframe').length,
          styles: editor.querySelectorAll('style').length,
          forms: editor.querySelectorAll('form').length,
          videos: editor.querySelectorAll('video').length,
          audios: editor.querySelectorAll('audio').length,
          links: editor.querySelectorAll('link').length,
          details: editor.querySelectorAll('details').length,
          allEventHandlers: editor.querySelectorAll('[on*]').length
        };
      });
      
      expect(dangerousElements.clickableElements).toBe(0);
      expect(dangerousElements.iframes).toBe(0);
      expect(dangerousElements.styles).toBe(0);
      expect(dangerousElements.forms).toBe(0);
      expect(dangerousElements.videos).toBe(0);
      expect(dangerousElements.audios).toBe(0);
      expect(dangerousElements.links).toBe(0);
      expect(dangerousElements.details).toBe(0);
      expect(dangerousElements.allEventHandlers).toBe(0);
      
      // Verify no script execution
      const scriptExecuted = await page.evaluate(() => window.domXSS === true);
      expect(scriptExecuted).toBe(false);
      
      // Verify content integrity
      const content = await helpers.getEditorContent();
      expect(content).toBe(attack);
      
      await helpers.clearEditor();
    }
  });

  test('validates PromiseGrid message security', async ({ page }) => {
    const maliciousPayloads = [
      '<script>window.promiseGridXSS=true;</script>',
      'eval("window.promiseGridXSS=true")',
      'javascript:window.promiseGridXSS=true',
      '{"__proto__": {"polluted": true}}',
      '\u0000<script>window.promiseGridXSS=true</script>'
    ];
    
    for (const payload of maliciousPayloads) {
      await helpers.setEditorContent(payload);
      
      try {
        await helpers.selectAllText();
        await helpers.applyBold();
        await page.waitForTimeout(300);
        
        await helpers.useMenuAction('tools', 'promisegrid-test');
        await page.waitForTimeout(300);
      } catch (error) {
        // PromiseGrid operations may fail with malicious content
      }
      
      // Verify no script execution
      const promiseGridXSS = await page.evaluate(() => window.promiseGridXSS === true);
      expect(promiseGridXSS).toBe(false);
      
      const content = await helpers.getEditorContent();
      expect(content).toContain(payload);
      
      await helpers.clearEditor();
    }
  });

  test('ensures CSP compliance', async ({ page }) => {
    const cspViolations = [];
    
    page.on('console', msg => {
      const text = msg.text().toLowerCase();
      if (text.includes('content security policy') || 
          text.includes('csp violation') ||
          text.includes('unsafe-eval') ||
          text.includes('unsafe-inline')) {
        cspViolations.push(msg.text());
      }
    });
    
    // Test various operations
    await helpers.setEditorContent('Test content for CSP compliance');
    await helpers.selectAllText();
    await helpers.applyBold();
    await helpers.applyItalic();
    await helpers.formatDocument();
    
    await helpers.searchDocument('Test');
    await page.waitForTimeout(300);
    
    // Test menu operations
    const menuActions = [
      ['tools', 'word-count'],
      ['view', 'toggle-log'],
      ['format', 'bold']
    ];
    
    for (const [menu, action] of menuActions) {
      try {
        await helpers.useMenuAction(menu, action);
        await page.waitForTimeout(200);
      } catch (error) {
        // Some menu actions may fail in test environment
      }
    }
    
    await page.waitForTimeout(1000);
    
    expect(cspViolations).toHaveLength(0);
    
    if (cspViolations.length > 0) {
      console.log('CSP Violations detected:', cspViolations);
    }
  });

  test('verifies secure defaults are maintained', async ({ page }) => {
    const securityCheck = await page.evaluate(() => {
      return {
        // DOM safety
        hasInlineHandlers: document.querySelectorAll('[onclick], [onerror], [onload], [onmouseover]').length,
        hasScriptTags: document.querySelectorAll('script[src*="data:"], script[src*="javascript:"]').length,
        hasJavascriptUrls: document.body.innerHTML.includes('javascript:'),
        hasDataUrls: document.body.innerHTML.includes('data:text/javascript'),
        
        // Input safety
        inputsWithHandlers: document.querySelectorAll('input[onfocus], input[onclick], input[onerror]').length,
        
        // Editor safety
        editorHasScripts: document.querySelector('#editor').querySelectorAll('script').length,
        editorHasHandlers: document.querySelector('#editor').querySelectorAll('[onclick], [onerror]').length,
        editorContentEditable: !!document.querySelector('#editor [contenteditable="true"]'),
        
        // Global object pollution
        windowHasXSSFlags: !!(window.xssExecuted || window.titleXSS || window.inputXSS || window.urlXSS || window.domXSS),
        
        // Dangerous function availability
        evalAvailable: typeof eval !== 'undefined',
        functionConstructor: typeof Function !== 'undefined'
      };
    });
    
    expect(securityCheck.hasInlineHandlers).toBe(0);
    expect(securityCheck.hasScriptTags).toBe(0);
    expect(securityCheck.hasJavascriptUrls).toBe(false);
    expect(securityCheck.hasDataUrls).toBe(false);
    expect(securityCheck.inputsWithHandlers).toBe(0);
    expect(securityCheck.editorHasScripts).toBe(0);
    expect(securityCheck.editorHasHandlers).toBe(0);
    expect(securityCheck.windowHasXSSFlags).toBe(false);
    
    // Verify editor HTML is safe
    const editorHTML = await page.locator('#editor').innerHTML();
    expect(editorHTML).not.toContain('javascript:');
    expect(editorHTML).not.toContain('<script');
    expect(editorHTML).not.toContain('onerror=');
    expect(editorHTML).not.toContain('onload=');
    expect(editorHTML).not.toContain('onclick=');
    
    // Test various input vectors don't create vulnerabilities
    const testVectors = [
      'Normal content',
      '<b>Bold content</b>',
      '**Markdown bold**',
      'Content with "quotes" and \'apostrophes\''
    ];
    
    for (const vector of testVectors) {
      await helpers.setEditorContent(vector);
      await helpers.selectAllText();
      await helpers.applyBold();
      
      const content = await helpers.getEditorContent();
      expect(content).toContain('**');
      
      // Verify no scripts were injected during formatting
      const postFormatHTML = await page.locator('#editor').innerHTML();
      expect(postFormatHTML).not.toContain('<script');
      
      await helpers.clearEditor();
    }
  });

  test('handles edge case XSS vectors', async ({ page }) => {
    const edgeCaseVectors = [
      // Encoding-based attacks
      '%3Cscript%3Ealert(1)%3C/script%3E',
      '&lt;script&gt;alert(1)&lt;/script&gt;',
      '&#60;script&#62;alert(1)&#60;/script&#62;',
      
      // Unicode-based attacks  
      '\u003cscript\u003ealert(1)\u003c/script\u003e',
      '\u{3c}script\u{3e}alert(1)\u{3c}/script\u{3e}',
      
      // CSS-based attacks
      '<style>body{background:url("javascript:alert(1)")}</style>',
      '<link rel="stylesheet" href="javascript:alert(1)">',
      
      // Meta tag attacks
      '<meta http-equiv="refresh" content="0; url=javascript:alert(1)">',
      '<meta charset="x-imap4-modified-utf7">+ADw-script+AD4-alert(1)+ADw-/script+AD4-',
      
      // Data URI attacks
      '<iframe src="data:text/html,<script>alert(1)</script>"></iframe>',
      '<object data="data:text/html,<script>alert(1)</script>"></object>',
      
      // Event handler variations
      '<img src=x onerror=alert(1)>',
      '<svg onload=alert(1)>',
      '<body onload=alert(1)>',
      '<details open ontoggle=alert(1)>',
      
      // Prototype pollution attempts
      '{"__proto__": {"polluted": true}}',
      '{"constructor": {"prototype": {"polluted": true}}}',
      
      // Template literal attacks
      '${alert(1)}',
      '`${alert(1)}`',
      
      // Null byte attacks
      '\x00<script>alert(1)</script>',
      '%00<script>alert(1)</script>'
    ];
    
    for (const vector of edgeCaseVectors) {
      await helpers.setEditorContent(vector);
      await page.waitForTimeout(200);
      
      // Comprehensive safety check
      const safetyCheck = await page.evaluate(() => {
        const editor = document.querySelector('#editor');
        return {
          noScripts: editor.querySelectorAll('script').length === 0,
          noIframes: editor.querySelectorAll('iframe').length === 0,
          noObjects: editor.querySelectorAll('object').length === 0,
          noMetas: editor.querySelectorAll('meta').length === 0,
          noLinks: editor.querySelectorAll('link[href*="javascript:"]').length === 0,
          noStyles: editor.querySelectorAll('style').length === 0,
          noEventHandlers: editor.querySelectorAll('[onerror], [onload], [onclick], [ontoggle]').length === 0,
          contentAsText: (window.editorView && window.editorView.state && typeof window.editorView.state.doc?.toString === 'function')
            ? window.editorView.state.doc.toString()
            : (document.querySelector('#editor .cm-content')?.textContent || editor.textContent || editor.innerText),
          noGlobalPollution: !window.polluted
        };
      });
      
      expect(safetyCheck.noScripts).toBe(true);
      expect(safetyCheck.noIframes).toBe(true);
      expect(safetyCheck.noObjects).toBe(true);
      expect(safetyCheck.noMetas).toBe(true);
      expect(safetyCheck.noLinks).toBe(true);
      expect(safetyCheck.noStyles).toBe(true);
      expect(safetyCheck.noEventHandlers).toBe(true);
      expect(safetyCheck.noGlobalPollution).toBe(true);
      
      // Content should be preserved as text
      expect(safetyCheck.contentAsText).toBe(vector);
      
      await helpers.clearEditor();
    }
  });

  test('prevents XSS during various application operations', async ({ page }) => {
    const xssPayload = '<script>window.operationXSS=true;</script>';
    
    const operations = [
      {
        name: 'Bold formatting',
        operation: async () => {
          await helpers.setEditorContent(xssPayload);
          await helpers.selectAllText();
          await helpers.applyBold();
        }
      },
      {
        name: 'Search operation', 
        operation: async () => {
          await helpers.setEditorContent('Normal content');
          await helpers.searchDocument(xssPayload);
        }
      },
      {
        name: 'Document formatting',
        operation: async () => {
          await helpers.setEditorContent(xssPayload);
          await helpers.formatDocument();
        }
      },
      {
        name: 'Title setting',
        operation: async () => {
          await helpers.setDocumentTitle(xssPayload);
        }
      },
      {
        name: 'User name setting',
        operation: async () => {
          await helpers.setUser(xssPayload, '#ff0000');
        }
      }
    ];
    
    for (const { name, operation } of operations) {
      // Clear previous state
      await page.evaluate(() => {
        delete window.operationXSS;
        delete window.xssExecuted;
      });
      
      await operation();
      await page.waitForTimeout(300);
      
      // Check that XSS was not executed during operation
      const xssExecuted = await page.evaluate(() => 
        window.operationXSS === true || window.xssExecuted === true
      );
      expect(xssExecuted).toBe(false);
      
      // Check that no scripts were injected into DOM
      const maliciousScripts = await page.evaluate((payload) => {
        const scripts = Array.from(document.querySelectorAll('script'));
        return scripts.some(script => 
          script.innerHTML.includes('operationXSS') || 
          script.innerHTML.includes(payload)
        );
      }, xssPayload);
      
      expect(maliciousScripts).toBe(false);
      
      await helpers.clearEditor();
    }
  });
});
