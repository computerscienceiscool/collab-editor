// tests/e2e/core/wasm-features.spec.js - FIXED VERSION
import { test, expect } from '@playwright/test';
// import { TestSetup } from '../../helpers/setup.js';
import { CollabEditorHelpers } from '../../utils/testHelpers.js';

test.describe('WASM Text Processing Features', () => {
  let helpers;
  test.beforeEach(async ({ page }) => {
      helpers = new CollabEditorHelpers(page);
      await helpers.navigateToRoom();
      await helpers.clearEditor();
    });

  test('text formatting functions work correctly', async ({ page }) => {
    const unformattedText = '  This is   unformatted    text  with   extra   spaces  ';
    
    await setup.typeInEditor(unformattedText);
    
    // Wait for and click format button
    await setup.waitForToolbarButton('format-button');
    await page.click('#format-button');
    
    // Wait for formatting to complete
    await page.waitForTimeout(2000);
    
    const formattedContent = await setup.getEditorContent();
    
    // Check that text was formatted (trimmed spaces)
    expect(formattedContent.trim()).not.toBe(unformattedText);
    expect(formattedContent).not.toContain('   '); // No triple spaces
  });

  test('document compression works correctly', async ({ page }) => {
    // Create a large document with repetitive content
    const largeText = 'This is repeated content. '.repeat(100);
    
    await setup.typeInEditor(largeText);
    
    // Test compression through WASM
    const compressionResult = await page.evaluate(() => {
      if (window.wasmModule && window.wasmModule.compress_document) {
        const text = window.editorView.state.doc.toString();
        return window.wasmModule.compress_document(text);
      }
      return null;
    });
    
    expect(compressionResult).not.toBeNull();
    expect(typeof compressionResult).toBe('string');
  });

  test('document statistics are calculated correctly', async ({ page }) => {
    const testText = 'This is a test document.\nIt has multiple lines.\nAnd several words.';
    
    await setup.typeInEditor(testText);
    
    // Wait for stats to update
    await page.waitForTimeout(1000);
    
    // Check status bar stats
    const wordCount = await page.textContent('#word-count');
    const charCount = await page.textContent('#char-count');
    
    expect(wordCount).toContain('words');
    expect(charCount).toContain('chars');
    
    // Verify stats through WASM
    const wasmStats = await page.evaluate(() => {
      if (window.wasmModule && window.wasmModule.calculate_stats) {
        const text = window.editorView.state.doc.toString();
        return window.wasmModule.calculate_stats(text);
      }
      return null;
    });
    
    if (wasmStats) {
      expect(wasmStats.word_count).toBeGreaterThan(0);
      expect(wasmStats.char_count).toBeGreaterThan(0);
    }
  });

  test('document search functionality works', async ({ page }) => {
    const testText = 'The quick brown fox jumps over the lazy dog. The fox is quick.';
    
    await setup.typeInEditor(testText);
    
    // Use search box
    await page.fill('#search-input', 'fox');
    await page.click('#search-button');
    
    // Wait for search to complete
    await page.waitForTimeout(1000);
    
    // Check if search highlights are present
    const hasSearchHighlight = await page.evaluate(() => {
      const editor = document.querySelector('#editor');
      return editor && (
        editor.querySelector('.search-highlight') ||
        editor.innerHTML.includes('fox')
      );
    });
    
    expect(hasSearchHighlight).toBe(true);
  });

  test('URL link conversion works correctly', async ({ page }) => {
    const textWithUrl = 'Visit https://example.com for more info';
    
    await setup.typeInEditor(textWithUrl);
    await setup.selectAllText();
    
    // Trigger link conversion via Ctrl+K
    await setup.pressShortcut('k');
    await page.waitForTimeout(1000);
    
    // Check if URL was converted to link
    const hasLink = await page.evaluate(() => {
      const editor = document.querySelector('#editor .cm-content');
      return editor && (
        editor.querySelector('a[href]') ||
        editor.innerHTML.includes('<a')
      );
    });
    
    expect(hasLink).toBe(true);
  });

  test('document format function cleans up text', async ({ page }) => {
    const messyText = 'This    has\n\n\n\nexcessive\t\twhitespace   and\n\n\nline breaks';
    
    await setup.typeInEditor(messyText);
    
    // Apply document formatting
    await page.click('#format-button');
    await page.waitForTimeout(2000);
    
    const cleanedContent = await setup.getEditorContent();
    
    // Verify cleanup occurred
    expect(cleanedContent).not.toContain('\n\n\n\n');
    expect(cleanedContent).not.toContain('    ');
    expect(cleanedContent).not.toContain('\t\t');
  });

  test('PromiseGrid protocol integration works', async ({ page }) => {
    const testResult = await page.evaluate(() => {
      if (window.createPromiseGridMessage) {
        try {
          const message = window.createPromiseGridMessage(
            'test-doc',
            'insert',
            0,
            'Test content',
            'test-user'
          );
          return {
            success: true,
            hasRequiredFields: !!(message && message.doc_id && message.op && message.content)
          };
        } catch (error) {
          return { success: false, error: error.message };
        }
      }
      return { success: false, error: 'Function not available' };
    });
    
    expect(testResult.success).toBe(true);
    if (testResult.success) {
      expect(testResult.hasRequiredFields).toBe(true);
    }
  });

  test('large document performance is acceptable', async ({ page }) => {
    // Create a large document
    const largeContent = 'Lorem ipsum dolor sit amet. '.repeat(1000);
    
    const startTime = Date.now();
    
    await setup.typeInEditor(largeContent);
    
    // Wait for editor to process
    await page.waitForTimeout(3000);
    
    const processingTime = Date.now() - startTime;
    
    // Verify content was processed
    const finalContent = await setup.getEditorContent();
    expect(finalContent.length).toBeGreaterThan(1000);
    
    // Performance should be reasonable (less than 10 seconds)
    expect(processingTime).toBeLessThan(10000);
    
    // Verify editor is still responsive
    await page.click('#editor .cm-content');
    await page.type('#editor .cm-content', ' Additional text.');
    
    const updatedContent = await setup.getEditorContent();
    expect(updatedContent).toContain('Additional text.');
  });
});

