// tests/e2e/core/basic.spec.js 
import { test, expect } from '@playwright/test';
import { CollabEditorHelpers } from '../../utils/testHelpers.js';

test.describe('Basic Editor Functionality', () => {
  let helpers;

  test.beforeEach(async ({ page }, testInfo) => {
    helpers = new CollabEditorHelpers(page);
    helpers.setTestName(testInfo.title);
    await helpers.navigateToRoom();
  });

  test('should load editor successfully', async ({ page }) => {
    // Verify editor elements are present
    await expect(page.locator('#editor')).toBeVisible();
    await expect(page.locator('#document-title')).toBeVisible();
    await expect(page.locator('#name-input')).toBeVisible();
  });

  test('should handle basic text input', async ({ page }) => {
    await helpers.clearEditor(); // Clear any existing content
    await helpers.typeInEditor('Hello World!');
    
    const content = await helpers.getEditorContent();
    expect(content).toContain('Hello World!');
  });

  test('should apply text formatting', async ({ page }) => {
    await helpers.setEditorContent('Format me'); 
    
    // Select all text
    await page.keyboard.press('Control+a');
    
    // Apply bold
    await helpers.applyBold();
    
    const content = await helpers.getEditorContent();
    expect(content).toContain('**Format me**');
  });
});
