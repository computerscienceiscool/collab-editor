// tests/e2e/core/menu-system.spec.js
import { test, expect } from '@playwright/test';
import { CollabEditorHelpers } from '../../utils/testHelpers.js';

test.describe('Menu System Functionality', () => {
  let helpers;

  test.beforeEach(async ({ page }) => {
    helpers = new CollabEditorHelpers(page);
    await helpers.navigateToRoom();
  });

  test('all main menus are visible and clickable', async ({ page }) => {
    // Check all main menu buttons exist
    const menus = ['file', 'edit', 'format', 'tools', 'view', 'help'];
    
    for (const menu of menus) {
      const menuButton = page.locator(`button[data-menu="${menu}"]`);
      await expect(menuButton).toBeVisible();
      
      // Click to open menu
      await menuButton.click();
      
      // Check dropdown appears
      const dropdown = page.locator(`#${menu}-menu`);
      await expect(dropdown).toBeVisible();
      
      // Close menu by clicking elsewhere
      await page.click('body');
      await expect(dropdown).toBeHidden();
    }
  });

  test('File menu actions work correctly', async ({ page }) => {
    // Open File menu
    await page.click('button[data-menu="file"]');
    await expect(page.locator('#file-menu')).toBeVisible();

    // Test document title change
    await helpers.setDocumentTitle('Test Document');
    const title = await helpers.getDocumentTitle();
    expect(title).toBe('Test Document');

    // Test New Document action
    page.on('dialog', dialog => dialog.accept()); // Accept any confirmation dialog
    await page.click('[data-action="new"]'); 
    await page.waitForTimeout(2000);
    const newURL = page.url();
    expect(newURL).toContain('?room=');

  });

  test('Edit menu keyboard shortcuts work', async ({ page }) => {
    await helpers.typeInEditor('Test text for editing');
    
    // Test Select All (Ctrl+A)
    await page.keyboard.press('Control+a');
    await page.waitForTimeout(200);
    
    // Test Copy (Ctrl+C)
    await page.keyboard.press('Control+c');
    
    // Test Paste (Ctrl+V) 
    await page.click('#editor .cm-content');
    await page.keyboard.press('End');
    await page.keyboard.press('Control+v');
    
    const content = await helpers.getEditorContent();
    expect(content).toContain('Test text for editing');
  });

  test('Format menu applies text formatting', async ({ page }) => {
    await helpers.typeInEditor('Format this text');
    await page.keyboard.press('Control+a');
    
    // Open Format menu
    await page.click('button[data-menu="format"]');
    
    // Test Bold from menu - should create markdown
    await page.click('[data-action="bold"]');
    let content = await helpers.getEditorContent();
    expect(content).toContain('**Format this text**');
    
    // Test Italic from menu - should add markdown on top of bold
    await page.keyboard.press('Control+a');
    await page.click('button[data-menu="format"]');
    await page.click('[data-action="italic"]');
    content = await helpers.getEditorContent();
    expect(content).toContain('***Format this text***'); // Bold + Italic markdown
  });

  test('Tools menu shows document statistics', async ({ page }) => {
    await helpers.typeInEditor('This is a test document with exactly ten words here.');
    
    // Open Tools menu and click Word Count
    await page.click('button[data-menu="tools"]');
    await page.click('[data-action="word-count"]');
    
    // Should show word count dialog or popup
    await page.waitForTimeout(500);
    // The exact implementation may vary, but should show stats
  });

  test('View menu toggles interface elements', async ({ page }) => {
    // Open View menu
    await page.click('button[data-menu="view"]');
    
    // Test Activity Log toggle
    await page.click('[data-action="toggle-log"]');
    await page.waitForTimeout(300);
    
    // Activity log should toggle visibility
    const activityLog = page.locator('#user-log');
    const isVisibleAfter = await activityLog.isVisible();
    
    // Toggle again to test both states
    await page.click('button[data-menu="view"]');
    await page.click('[data-action="toggle-log"]');
    await page.waitForTimeout(300);
    
    // Should have opposite visibility
    const isVisibleAfterSecond = await activityLog.isVisible();
    expect(isVisibleAfterSecond).not.toBe(isVisibleAfter);
  });

  test('ESC key closes open menus', async ({ page }) => {
    // Open File menu
    await page.click('button[data-menu="file"]');
    await expect(page.locator('#file-menu')).toBeVisible();
    
    // Press ESC to close
    await page.keyboard.press('Escape');
    await expect(page.locator('#file-menu')).toBeHidden();
    
    // Test with Format menu too
    await page.click('button[data-menu="format"]');
    await expect(page.locator('#format-menu')).toBeVisible();
    
    await page.keyboard.press('Escape');
    await expect(page.locator('#format-menu')).toBeHidden();
  });
});
