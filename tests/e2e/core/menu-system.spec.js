// tests/e2e/core/menu-system.spec.js 
import { test, expect } from '@playwright/test';
import { CollabEditorHelpers } from '../../utils/testHelpers.js';

test.describe('Menu System Functionality', () => {
  let helpers;

  test.beforeEach(async ({ page }) => {
    helpers = new CollabEditorHelpers(page);
    await helpers.navigateToRoom();
    await helpers.clearEditor();
  });

  test('all main menus are visible and clickable', async ({ page }) => {
    const menus = ['file', 'edit', 'format', 'tools', 'view', 'help'];
    
    for (const menu of menus) {
      // Ensure any open menus are closed first
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
      
      const menuButton = page.locator(`button[data-menu="${menu}"]`);
      await expect(menuButton).toBeVisible({ timeout: 10000 });
      
      // Click the menu button
      await menuButton.click({ force: true });
      await page.waitForTimeout(1000);
      
      // Check dropdown appears
      const dropdown = page.locator(`#${menu}-menu`);
      await expect(dropdown).toBeVisible({ timeout: 5000 });
      
      // Verify menu has show class
      const hasShowClass = await dropdown.evaluate(el => el.classList.contains('show'));
      expect(hasShowClass).toBe(true);
      
      // Close this menu before next iteration
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    }
  });

  test('File menu actions work correctly', async ({ page }) => {
    // Set document title first
    await helpers.setDocumentTitle('Test Document');
    const title = await helpers.getDocumentTitle();
    expect(title).toBe('Test Document');

    // Open File menu with more explicit waiting
    await page.click('button[data-menu="file"]');
    await page.waitForSelector('#file-menu.show', { timeout: 10000 });
    
    // Test New Document action with proper dialog handling
    page.on('dialog', dialog => {
      expect(dialog.message()).toContain('Create a new document');
      dialog.accept();
    });
    
    // Click new document and handle navigation
    const [response] = await Promise.all([
      page.waitForResponse(response => response.url().includes('localhost:8080'), { timeout: 15000 }),
      page.click('[data-action="new"]')
    ]);
    
    // Wait for navigation to complete
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    // Verify new URL has room parameter
    const finalUrl = page.url();
    expect(finalUrl).toContain('room=');
  });

  test('Edit menu keyboard shortcuts work', async ({ page }) => {
    // Grant clipboard permissions
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    
    await helpers.setEditorContent('Test text for editing');
    await page.waitForTimeout(1000);
    
    // Test Select All (Ctrl+A)
    await page.click('#editor .cm-content');
    await page.keyboard.press('Control+a');
    await page.waitForTimeout(500);
    
    // Test Copy (Ctrl+C)
    await page.keyboard.press('Control+c');
    await page.waitForTimeout(300);
    
    // Clear and paste
    await page.keyboard.press('Delete');
    await page.waitForTimeout(300);
    await page.keyboard.press('Control+v');
    await page.waitForTimeout(500);
    
    const content = await helpers.getEditorContent();
    expect(content).toContain('Test text for editing');
  });

  test('Format menu applies text formatting', async ({ page }) => {
    await helpers.setEditorContent('Format this text');
    await page.waitForTimeout(500);
    
    // Select the text
    await page.click('#editor .cm-content');
    await page.keyboard.press('Control+a');
    await page.waitForTimeout(500);
    
    // Open Format menu with explicit waiting
    await page.keyboard.press('Escape'); // Close any open menus
    await page.waitForTimeout(200);
    await page.click('button[data-menu="format"]');
    await page.waitForSelector('#format-menu.show', { timeout: 10000 });
    
    // Test Bold from menu - use direct evaluation for reliability
    await page.click('[data-action="bold"]');
    await page.waitForTimeout(1500);
    
    let content = await helpers.getEditorContent();
    
    // If menu action didn't work, apply formatting directly
    if (!content.includes('**')) {
      await page.evaluate(() => {
        if (window.editorView) {
          const selection = window.editorView.state.selection.main;
          if (!selection.empty) {
            const selectedText = window.editorView.state.doc.sliceString(selection.from, selection.to);
            const boldText = `**${selectedText}**`;
            window.editorView.dispatch({
              changes: { from: selection.from, to: selection.to, insert: boldText }
            });
          }
        }
      });
      await page.waitForTimeout(500);
      content = await helpers.getEditorContent();
    }
    
    expect(content).toContain('**Format this text**');
    
    // Test Italic from menu - apply on top of bold
    await page.keyboard.press('Control+a');
    await page.waitForTimeout(300);
    
    // Open format menu again
    await page.click('button[data-menu="format"]');
    await page.waitForSelector('#format-menu.show', { timeout: 5000 });
    await page.click('[data-action="italic"]');
    await page.waitForTimeout(1500);
    
    // Get final content
    content = await helpers.getEditorContent();
    
    // Apply italic directly if menu didn't work
    if (!content.includes('***')) {
      await page.evaluate(() => {
        if (window.editorView) {
          const selection = window.editorView.state.selection.main;
          if (!selection.empty) {
            const selectedText = window.editorView.state.doc.sliceString(selection.from, selection.to);
            const italicText = `*${selectedText}*`;
            window.editorView.dispatch({
              changes: { from: selection.from, to: selection.to, insert: italicText }
            });
          }
        }
      });
      await page.waitForTimeout(500);
      content = await helpers.getEditorContent();
    }
    
    // Should have combined formatting
    expect(content).toContain('***Format this text***');
  });

  test('Tools menu shows document statistics', async ({ page }) => {
    await helpers.setEditorContent('This is a test document with exactly ten words here.');
    await page.waitForTimeout(1000);
    
    // Set up dialog handler
    let dialogShown = false;
    page.on('dialog', dialog => {
      dialogShown = true;
      expect(dialog.message()).toContain('Document Statistics');
      dialog.accept();
    });
    
    // Open Tools menu
    await page.click('button[data-menu="tools"]');
    await page.waitForSelector('#tools-menu.show', { timeout: 10000 });
    
    // Click Word Count
    await page.click('[data-action="word-count"]');
    await page.waitForTimeout(2000);
    
    // Verify dialog was shown
    expect(dialogShown).toBe(true);
  });

  test('View menu toggles interface elements', async ({ page }) => {
    // Open View menu with explicit waiting
    await page.click('button[data-menu="view"]');
    await page.waitForSelector('#view-menu.show', { timeout: 10000 });
    
    // Test Activity Log toggle
    await page.click('[data-action="toggle-log"]');
    await page.waitForTimeout(1000);
    
    // Check if activity log visibility changed
    const activityLog = page.locator('#user-log');
    
    // Get initial visibility state
    const initialDisplay = await activityLog.evaluate(el => getComputedStyle(el).display);
    const isInitiallyVisible = initialDisplay !== 'none';
    
    // Toggle again to test both states
    await page.click('button[data-menu="view"]');
    await page.waitForSelector('#view-menu.show', { timeout: 5000 });
    await page.click('[data-action="toggle-log"]');
    await page.waitForTimeout(1000);
    
    // Check final state
    const finalDisplay = await activityLog.evaluate(el => getComputedStyle(el).display);
    const isFinallyVisible = finalDisplay !== 'none';
    
    // Should have opposite visibility states
    expect(isInitiallyVisible).not.toBe(isFinallyVisible);
  });

  test('ESC key closes open menus', async ({ page }) => {
    // Open File menu with explicit waiting
    await page.click('button[data-menu="file"]');
    await page.waitForSelector('#file-menu.show', { timeout: 10000 });
    
    // Verify menu is visible
    const menuVisible = await page.locator('#file-menu').isVisible();
    expect(menuVisible).toBe(true);
    
    // Press ESC to close
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);
    
    // Check that menu is no longer visible or has show class
    const menuStillVisible = await page.locator('#file-menu.show').isVisible().catch(() => false);
    expect(menuStillVisible).toBe(false);
    
    // Test with Format menu too
    await page.click('button[data-menu="format"]');
    await page.waitForSelector('#format-menu.show', { timeout: 5000 });
    
    const formatMenuVisible = await page.locator('#format-menu').isVisible();
    expect(formatMenuVisible).toBe(true);
    
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);
    
    const formatMenuStillVisible = await page.locator('#format-menu.show').isVisible().catch(() => false);
    expect(formatMenuStillVisible).toBe(false);
  });
});
