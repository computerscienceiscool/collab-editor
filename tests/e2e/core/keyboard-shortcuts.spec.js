// tests/e2e/core/keyboard-shortcuts.spec.js  
import { test, expect } from '@playwright/test';
import { CollabEditorHelpers } from '../../utils/testHelpers.js';

test.describe('Keyboard Shortcuts', () => {
  let helpers;

  test.beforeEach(async ({ page }) => {
    helpers = new CollabEditorHelpers(page);
    await helpers.navigateToRoom();
    await helpers.clearEditor();
  });

  test('Ctrl+B applies bold formatting', async ({ page }) => {
    await helpers.setEditorContent('Bold text test');
    await helpers.selectAllText();
    
    // Test ACTUAL keyboard shortcut
    await page.keyboard.press('Control+b');
    await page.waitForTimeout(1500);
    
    const content = await helpers.getEditorContent();
    expect(content).toBe('**Bold text test**');
  });

  test('Ctrl+I applies italic formatting', async ({ page }) => {
    await helpers.setEditorContent('Italic text test');
    await helpers.selectAllText();
    
    await page.keyboard.press('Control+i');
    await page.waitForTimeout(1500);
    
    const content = await helpers.getEditorContent();
    expect(content).toBe('*Italic text test*');
  });

  test('Ctrl+U applies underline formatting', async ({ page }) => {
    await helpers.setEditorContent('Underline text test');
    await helpers.selectAllText();
    
    await page.keyboard.press('Control+u');
    await page.waitForTimeout(1500);
    
    const content = await helpers.getEditorContent();
    expect(content).toBe('__Underline text test__');
  });

  test('Ctrl+Shift+X applies strikethrough', async ({ page }) => {
    await helpers.setEditorContent('Strike text test');
    await helpers.selectAllText();
    
    await page.keyboard.press('Control+Shift+x');
    await page.waitForTimeout(1500);
    
    const content = await helpers.getEditorContent();
    expect(content).toBe('~~Strike text test~~');
  });

  test('formatting shortcuts can be combined', async ({ page }) => {
    await helpers.setEditorContent('Combined formatting');
    
    // Apply bold first
    await helpers.selectAllText();
    await page.keyboard.press('Control+b');
    await page.waitForTimeout(1000);
    
    // Then apply italic on top
    await helpers.selectAllText();
    await page.keyboard.press('Control+i');
    await page.waitForTimeout(1000);
    
    const content = await helpers.getEditorContent();
    expect(content).toBe('***Combined formatting***');
  });

  test.describe('Heading Shortcuts', () => {
    test('Ctrl+Alt+1 creates H1 heading', async ({ page }) => {
      await helpers.setEditorContent('Main Heading');
      await helpers.selectAllText();
      
      await page.keyboard.press('Control+Alt+Digit1');
      await page.waitForTimeout(1500);
      
      const content = await helpers.getEditorContent();
      expect(content).toBe('# Main Heading');
    });

    test('Ctrl+Alt+2 creates H2 heading', async ({ page }) => {
      await helpers.setEditorContent('Sub Heading');
      await helpers.selectAllText();
      
      await page.keyboard.press('Control+Alt+Digit2');
      await page.waitForTimeout(1500);
      
      const content = await helpers.getEditorContent();
      expect(content).toBe('## Sub Heading');
    });

    test('Ctrl+Alt+3 creates H3 heading', async ({ page }) => {
      await helpers.setEditorContent('Sub Sub Heading');
      await helpers.selectAllText();
      
      await page.keyboard.press('Control+Alt+Digit3');
      await page.waitForTimeout(1500);
      
      const content = await helpers.getEditorContent();
      expect(content).toBe('### Sub Sub Heading');
    });
  });

  test.describe('List Shortcuts', () => {
    test('Ctrl+Shift+8 creates bullet list', async ({ page }) => {
      await helpers.setEditorContent('List item');
      await helpers.selectAllText();
      
      await page.keyboard.press('Control+Shift+Digit8');
      await page.waitForTimeout(1500);
      
      const content = await helpers.getEditorContent();
      expect(content).toBe('- List item');
    });

    test('Ctrl+Shift+7 creates numbered list', async ({ page }) => {
      await helpers.setEditorContent('Numbered item');
      await helpers.selectAllText();
      
      await page.keyboard.press('Control+Shift+Digit7');
      await page.waitForTimeout(1500);
      
      const content = await helpers.getEditorContent();
      expect(content).toBe('1. Numbered item');
    });
  });

  test.describe('Document Navigation Shortcuts', () => {
    test('Ctrl+A selects all text', async ({ page }) => {
      await helpers.setEditorContent('Select all this text for testing');
      
      await page.keyboard.press('Control+a');
      await page.waitForTimeout(300);
      
      // Check if text is selected by trying to replace it
      await page.keyboard.press('Delete');
      const content = await helpers.getEditorContent();
      expect(content).toBe('');
    });

    test('Ctrl+F focuses search box', async ({ page }) => {
      await page.keyboard.press('Control+f');
      await page.waitForTimeout(500);
      
      const searchInput = page.locator('#search-input');
      await expect(searchInput).toBeFocused();
    });

    test('Ctrl+N creates new document', async ({ page }) => {
      page.on('dialog', dialog => dialog.accept());
      
      const navigationPromise = page.waitForURL(/.*/, { timeout: 15000 });
      await page.keyboard.press('Control+n');
      
      await navigationPromise;
      
      const content = await helpers.getEditorContent();
      expect(content.trim()).toBe('');
    });

    test('Ctrl+Shift+U copies room URL', async ({ page }) => {
      await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
      
      let alertShown = false;
      page.on('dialog', dialog => {
        alertShown = true;
        dialog.accept();
      });

      await page.keyboard.press('Control+Shift+u');
      await page.waitForTimeout(1000);
      
      expect(alertShown).toBe(true);
    });
  });

  test.describe('Edit Operation Shortcuts', () => {
    test('copy and paste work with keyboard shortcuts', async ({ page }) => {
      await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
      
      await helpers.setEditorContent('Copy and paste test');
      
      await page.keyboard.press('Control+a');
      await page.keyboard.press('Control+c');
      await page.keyboard.press('Delete');
      await page.keyboard.press('Control+v');
      
      const content = await helpers.getEditorContent();
      expect(content).toBe('Copy and paste test');
    });

    test('cut operation works', async ({ page }) => {
      await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
      
      await helpers.setEditorContent('Cut this text');
      
      await page.keyboard.press('Control+a');
      await page.keyboard.press('Control+x');
      
      const content = await helpers.getEditorContent();
      expect(content).toBe('');
      
      await page.keyboard.press('Control+v');
      const restoredContent = await helpers.getEditorContent();
      expect(restoredContent).toBe('Cut this text');
    });
  });

  test.describe('Interface Shortcuts', () => {
    test('Ctrl+Shift+T toggles toolbar', async ({ page }) => {
      const toolbar = page.locator('#toolbar');
      await expect(toolbar).toBeVisible();
      
      await page.keyboard.press('Control+Shift+t');
      await page.waitForTimeout(500);
      
      const isHidden = await toolbar.evaluate(el => 
        el.classList.contains('hidden') || 
        getComputedStyle(el).display === 'none'
      );
      expect(isHidden).toBe(true);
    });

    test('Esc closes open menus', async ({ page }) => {
      await page.click('button[data-menu="file"]');
      await expect(page.locator('#file-menu')).toBeVisible();
      
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
      
      const menuVisible = await page.locator('#file-menu.show').isVisible().catch(() => false);
      expect(menuVisible).toBe(false);
    });
  });

  test.describe('Tools Shortcuts', () => {
    test('Ctrl+Shift+C shows word count', async ({ page }) => {
      await helpers.setEditorContent('This is a test document with exactly ten words here.');
      
      let alertMessage = '';
      page.on('dialog', dialog => {
        alertMessage = dialog.message();
        dialog.accept();
      });
      
      await page.keyboard.press('Control+Shift+c');
      await page.waitForTimeout(1000);
      
      expect(alertMessage).toContain('Document Statistics');
    });
  });

  test.describe('Link and URL Shortcuts', () => {
    test('Ctrl+K processes URLs into links', async ({ page }) => {
      await helpers.setEditorContent('https://github.com');
      await helpers.selectAllText();
      
      await page.keyboard.press('Control+k');
      await page.waitForTimeout(1500);
      
      const content = await helpers.getEditorContent();
      expect(content).toBe('[https://github.com](https://github.com)');
    });
  });
});
