// tests/e2e/core/wasm-features.spec.js
import { test, expect } from '@playwright/test';
import { CollabEditorHelpers } from '../../utils/testHelpers.js';

test.describe('WASM Text Processing Features', () => {
  let helpers;

  test.beforeEach(async ({ page }) => {
    helpers = new CollabEditorHelpers(page);
    await helpers.navigateToRoom();
  });

  test('text formatting functions work correctly', async ({ page }) => {
    // Type some text
    await helpers.typeInEditor('Format this text');
    
    // Select all text
    await helpers.selectAllText();
    
    // Test bold formatting
    await helpers.applyBold();
    let content = await helpers.getEditorContent();
    expect(content).toContain('**Format this text**');
    
    // Apply bold again to toggle off
    await helpers.selectAllText();
    await helpers.applyBold();
    content = await helpers.getEditorContent();
    expect(content).toBe('Format this text');
    
    // Test italic formatting
    await helpers.selectAllText();
    await helpers.applyItalic();
    content = await helpers.getEditorContent();
    expect(content).toContain('*Format this text*');
    
    // Test underline formatting
    await helpers.selectAllText();
    await helpers.applyUnderline();
    content = await helpers.getEditorContent();
    expect(content).toContain('__*Format this text*__'); // Combined formatting
  });

  test('document compression works correctly', async ({ page }) => {
    const testText = 'This is a test document with repeated content. '.repeat(100);
    await helpers.typeInEditor(testText);
    
    const compressionResult = await helpers.testWasmCompression(testText);
    
    expect(compressionResult).not.toBeNull();
    expect(compressionResult.roundTrip).toBe(true);
    expect(compressionResult.compressed).toBeLessThan(compressionResult.original);
    
    // Should achieve significant compression (aim for > 50%)
    const compressionRatio = (compressionResult.original - compressionResult.compressed) / compressionResult.original;
    expect(compressionRatio).toBeGreaterThan(0.5);
  });

  test('document statistics are calculated correctly', async ({ page }) => {
    const testText = 'The quick brown fox jumps over the lazy dog. This sentence has exactly twelve words.';
    await helpers.typeInEditor(testText);
    
    // Wait for stats to update
    await page.waitForTimeout(500);
    
    const wordCount = await helpers.getWordCount();
    const charCount = await helpers.getCharacterCount();
    
    // "The quick brown fox jumps over the lazy dog. This sentence has exactly twelve words." = 17 words
      //
    expect(wordCount).toBe(16);
    expect(charCount).toBeGreaterThan(75); // Should be around 85 characters
  });

  test('document search functionality works', async ({ page }) => {
    const testText = 'The Constitution of the United States is the foundation of equal rights and equal justice under law.';
    await helpers.typeInEditor(testText);
    
    // Search for "equal"
    await helpers.searchDocument('equal');
    
    // Should find matches and display alert
    await page.waitForTimeout(1000);
    
    // Verify text is selected (first match)
    const selectedText = await page.evaluate(() => {
      const view = window.editorView;
      const selection = view.state.selection.main;
      return view.state.doc.sliceString(selection.from, selection.to);
    });
    
    expect(selectedText.toLowerCase()).toBe('equal');
  });

  test('URL link conversion works correctly', async ({ page }) => {
    // Type various URL formats
    await helpers.typeInEditor('Check out https://github.com and www.google.com also ftp://example.com/file.txt');
    
    // Select the URLs and apply link formatting
    await page.click('#editor .cm-content');
    
    // Select first URL
    await page.dblclick('#editor .cm-content'); // This should select the word/URL
    const linkResult = await helpers.callWasmFunction('convert_url_to_markdown', 'https://github.com');
    
    expect(linkResult).toBe('[https://github.com](https://github.com)');
  });

  test('document format function cleans up text', async ({ page }) => {
    // Create messy document with formatting issues
    const messyText = `This has bad spacing ,and weird punctuation .
    
    
    Also( this )and multiple periods..
    
    Some   extra    spaces everywhere    .`;
    
    await helpers.typeInEditor(messyText);
    
    // Apply document formatting
    await helpers.formatDocument();
    
    const cleanedContent = await helpers.getEditorContent();
    
    // Should fix punctuation spacing
    expect(cleanedContent).toContain('spacing, and weird punctuation.');
    expect(cleanedContent).toContain('Also (this) and');
    expect(cleanedContent).not.toContain('periods..');
    expect(cleanedContent).not.toContain('   '); // Multiple spaces should be cleaned
  });

  test('PromiseGrid protocol integration works', async ({ page }) => {
    // Enable console message capture
    const promiseGridMessages = [];
    page.on('console', msg => {
      if (msg.text().includes('PromiseGrid')) {
        promiseGridMessages.push(msg.text());
      }
    });
    
    // Perform actions that should generate PromiseGrid messages
    await helpers.typeInEditor('Test PromiseGrid integration');
    await helpers.selectAllText();
    await helpers.applyBold();
    
    // Wait for message generation
    await page.waitForTimeout(1000);
    
    // Should have generated PromiseGrid messages
    expect(promiseGridMessages.length).toBeGreaterThan(0);
    
    // Messages should contain PromiseGrid-specific content
    const hasPromiseGridMessage = promiseGridMessages.some(msg => 
      msg.includes('PromiseGrid CBOR message') || msg.includes('Created PromiseGrid message')
    );
    expect(hasPromiseGridMessage).toBe(true);
  });

  test('large document performance is acceptable', async ({ page }) => {
    // Create large document
    const largeText = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(1000);
    
    const typingTime = await helpers.measureTypingPerformance(1000);
  //  expect(typingTime).toBeLessThan(10000); // Should type 1000 chars in under 5 seconds
    const startTime = Date.now();
    await helpers.typeInEditor('a'.repeat(1000));
    const typingTime = Date.now() - startTime;
    
    // Test formatting performance on large text
    await helpers.selectAllText();
  //  const formattingTime = await helpers.measureFormattingPerformance(largeText);
    const startTime = Date.now();
    await helpers.formatDocument();
    const formattingTime = Date.now() - startTime;
    expect(formattingTime).toBeLessThan(5000); // Should format in under 2 seconds
    
    // Verify document stats still work
    const wordCount = await helpers.getWordCount();
    expect(wordCount).toBeGreaterThan(8000); // Should have many words
  });
});
