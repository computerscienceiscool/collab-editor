// tests/e2e/core/keyboard-shortcuts.spec.js
import { test, expect } from '@playwright/test';
import { CollabEditorHelpers } from '../../utils/testHelpers.js';

test.describe('Keyboard Shortcuts', () => {
  let helpers;

  test.beforeEach(async ({ page }) => {
    helpers = new CollabEditorHelpers(page);
    await helpers.navigateToRoom();
    await helpers.clearEditor(); // Start with clean editor
  });

  test.describe('Text Formatting Shortcuts', () => {
    test('Ctrl+B applies bold formatting', async ({ page }) => {
      await helpers.setEditorContent('Bold text test');
      await page.keyboard.press('Control+a'); // Select all
      await page.keyboard.press('Control+b'); // Apply bold
      
      const content = await helpers.getEditorContent();
      expect(content).toBe('**Bold text test**');
    });

    test('Ctrl+I applies italic formatting', async ({ page }) => {
      await helpers.setEditorContent('Italic text test');
      await page.keyboard.press('Control+a');
      await page.keyboard.press('Control+i');
      
      const content = await helpers.getEditorContent();
      expect(content).toBe('*Italic text test*');
    });

    test('Ctrl+U applies underline formatting', async ({ page }) => {
      await helpers.setEditorContent('Underline text test');
      await page.keyboard.press('Control+a');
      await page.keyboard.press('Control+u');
      
      const content = await helpers.getEditorContent();
      expect(content).toBe('__Underline text test__');
    });

    test('Ctrl+Shift+X applies strikethrough', async ({ page }) => {
      await helpers.setEditorContent('Strike text test');
      await page.keyboard.press('Control+a');
      await page.keyboard.press('Control+Shift+x');
      
      const content = await helpers.getEditorContent();
      expect(content).toBe('~~Strike text test~~');
    });

    test('formatting shortcuts can be combined', async ({ page }) => {
      await helpers.setEditorContent('Combined formatting');
      
      // Apply bold first
      await page.keyboard.press('Control+a');
      await page.keyboard.press('Control+b');
      
      // Then apply italic on top
      await page.keyboard.press('Control+a');
      await page.keyboard.press('Control+i');
      
      const content = await helpers.getEditorContent();
      expect(content).toBe('***Combined formatting***');
    });
  });

  test.describe('Heading Shortcuts', () => {
    test('Ctrl+Alt+1 creates H1 heading', async ({ page }) => {
      await helpers.setEditorContent('Main Heading');
      await page.keyboard.press('Control+a');
      await page.keyboard.press('Control+Alt+Digit1');
      
      const content = await helpers.getEditorContent();
      expect(content).toBe('# Main Heading');
    });

    test('Ctrl+Alt+2 creates H2 heading', async ({ page }) => {
      await helpers.setEditorContent('Sub Heading');
      await page.keyboard.press('Control+a');
      await page.keyboard.press('Control+Alt+Digit2');
      
      const content = await helpers.getEditorContent();
      expect(content).toBe('## Sub Heading');
    });

    test('Ctrl+Alt+3 creates H3 heading', async ({ page }) => {
      await helpers.setEditorContent('Sub Sub Heading');
      await page.keyboard.press('Control+a');
      await page.keyboard.press('Control+Alt+Digit3');
      
      const content = await helpers.getEditorContent();
      expect(content).toBe('### Sub Sub Heading');
    });
  });

  test.describe('List Shortcuts', () => {
    test('Ctrl+Shift+8 creates bullet list', async ({ page }) => {
      await helpers.setEditorContent('List item');
      await page.keyboard.press('Control+a');
      await page.keyboard.press('Control+Shift+Digit8');
      
      const content = await helpers.getEditorContent();
      expect(content).toBe('• List item');
    });

    test('Ctrl+Shift+7 creates numbered list', async ({ page }) => {
      await helpers.setEditorContent('Numbered item');
      await page.keyboard.press('Control+a');
      await page.keyboard.press('Control+Shift+Digit7');
      
      const content = await helpers.getEditorContent();
      expect(content).toBe('1. Numbered item');
    });
  });

  test.describe('Document Navigation Shortcuts', () => {
    test('Ctrl+A selects all text', async ({ page }) => {
      await helpers.setEditorContent('Select all this text for testing');
      
      await page.keyboard.press('Control+a');
      
      // Check if text is selected by trying to replace it
      await page.keyboard.press('Delete');
      const content = await helpers.getEditorContent();
      expect(content).toBe('');
    });

    test('Ctrl+F focuses search box', async ({ page }) => {
      await page.keyboard.press('Control+f');
      
      // Search input should be focused
      const searchInput = page.locator('#search-input');
      await expect(searchInput).toBeFocused();
    });
  });

  test.describe('File Operation Shortcuts', () => {
    test('Ctrl+N creates new document', async ({ page }) => {
      // Mock the confirm dialog to accept
      page.on('dialog', dialog => dialog.accept());
      
      // Track navigation
      const navigationPromise = page.waitForURL(/.*/, { timeout: 5000 });
      
      await page.keyboard.press('Control+n');
      
      // Should navigate to new URL (though might be same origin)
      await navigationPromise;
      
      // Verify we're in a new clean editor
      const content = await helpers.getEditorContent();
      expect(content.trim()).toBe('');
    });

    test('Ctrl+Shift+U copies room URL', async ({ page }) => {
      // Grant clipboard permissions
      await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
      
      await page.keyboard.press('Control+Shift+u');
      
      // Should show alert about URL being copied
      await page.waitForTimeout(500);
      
      // Verify clipboard contains current URL
      const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
      expect(clipboardText).toContain(page.url());
    });
  });

  test.describe('Edit Operation Shortcuts', () => {
    test('copy and paste work with keyboard shortcuts', async ({ page }) => {
      // Grant clipboard permissions
      await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
      
      await helpers.setEditorContent('Copy and paste test');
      
      // Select all and copy
      await page.keyboard.press('Control+a');
      await page.keyboard.press('Control+c');
      
      // Clear editor
      await page.keyboard.press('Delete');
      
      // Paste
      await page.keyboard.press('Control+v');
      
      const content = await helpers.getEditorContent();
      expect(content).toBe('Copy and paste test');
    });

    test('cut operation works', async ({ page }) => {
      // Grant clipboard permissions
      await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
      
      await helpers.setEditorContent('Cut this text');
      
      // Select all and cut
      await page.keyboard.press('Control+a');
      await page.keyboard.press('Control+x');
      
      // Editor should be empty
      const content = await helpers.getEditorContent();
      expect(content).toBe('');
      
      // Paste should restore text
      await page.keyboard.press('Control+v');
      const restoredContent = await helpers.getEditorContent();
      expect(restoredContent).toBe('Cut this text');
    });
  });

  test.describe('Interface Shortcuts', () => {
    test('Ctrl+Shift+T toggles toolbar', async ({ page }) => {
      const toolbar = page.locator('#toolbar');
      
      // Toolbar should be visible initially
      await expect(toolbar).toBeVisible();
      
      // Hide toolbar
      await page.keyboard.press('Control+Shift+t');
      await page.waitForTimeout(200);
      
      // Check if toolbar is hidden (has .hidden class or display:none)
      const isHidden = await toolbar.evaluate(el => 
        el.classList.contains('hidden') || 
        getComputedStyle(el).display === 'none'
      );
      expect(isHidden).toBe(true);
      
      // Show toolbar again
      await page.keyboard.press('Control+Shift+t');
      await page.waitForTimeout(200);
      
      const isVisible = await toolbar.evaluate(el => 
        !el.classList.contains('hidden') && 
        getComputedStyle(el).display !== 'none'
      );
      expect(isVisible).toBe(true);
    });

    test('Esc closes open menus', async ({ page }) => {
      // Open File menu
      await page.click('button[data-menu="file"]');
      await expect(page.locator('#file-menu')).toBeVisible();
      
      // Press Esc to close
      await page.keyboard.press('Escape');
      await page.waitForTimeout(200);
      
      // Menu should be closed
      await expect(page.locator('#file-menu')).not.toHaveClass(/show/);
    });
  });

  test.describe('Tools Shortcuts', () => {
    test('Ctrl+Shift+C shows word count', async ({ page }) => {
      await helpers.setEditorContent('This is a test document with exactly ten words here.');
      
      // Set up dialog handler
      let alertMessage = '';
      page.on('dialog', dialog => {
        alertMessage = dialog.message();
        dialog.accept();
      });
      
      await page.keyboard.press('Control+Shift+c');
      await page.waitForTimeout(500);
      
      // Should show word count in alert
      expect(alertMessage).toContain('Document Statistics');
    });
  });

  test.describe('Link and URL Shortcuts', () => {
    test('Ctrl+K processes URLs into links', async ({ page }) => {
      await helpers.setEditorContent('https://github.com');
      await page.keyboard.press('Control+a');
      await page.keyboard.press('Control+k');
      
      const content = await helpers.getEditorContent();
      expect(content).toBe('[https://github.com](https://github.com)');
    });
  });
});
