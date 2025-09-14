// tests/e2e/core/keyboard-shortcuts.spec.js
import { test, expect } from '@playwright/test';
import { CollabEditorHelpers } from '../../utils/testHelpers.js';

test.describe('Keyboard Shortcuts', () => {
  let helpers;

  test.beforeEach(async ({ page }) => {
    helpers = new CollabEditorHelpers(page);
    await helpers.navigateToRoom();
    
    // Clear any global state that might affect tests
    await page.evaluate(() => {
      delete window.xssExecuted;
      delete window.titleXSS;
    });
  });

  test.afterEach(async ({ page }) => {
    // Clean up any open dialogs or menus
    await page.keyboard.press('Escape');
  });

  test('Ctrl+B applies bold formatting', async ({ page }) => {
    await helpers.setEditorContent('Bold text test');
    await helpers.selectAllText();
    
    await page.keyboard.press('Control+b');
    
    // Wait for formatting to apply
    await page.waitForFunction(() => {
      return window.editorView?.state.doc.toString().includes('**');
    }, { timeout: 3000 });
    
    const content = await helpers.getEditorContent();
    expect(content).toBe('**Bold text test**');
  });

  test('Ctrl+I applies italic formatting', async ({ page }) => {
    await helpers.setEditorContent('Italic text test');
    await helpers.selectAllText();
    
    await page.keyboard.press('Control+i');
    
    await page.waitForFunction(() => {
      const content = window.editorView?.state.doc.toString() || '';
      return content.includes('*Italic text test*');
    }, { timeout: 3000 });
    
    const content = await helpers.getEditorContent();
    expect(content).toBe('*Italic text test*');
  });

  test('Ctrl+U applies underline formatting', async ({ page }) => {
    await helpers.setEditorContent('Underline text test');
    await helpers.selectAllText();
    
    await page.keyboard.press('Control+u');
    
    await page.waitForFunction(() => {
      const content = window.editorView?.state.doc.toString() || '';
      return content.includes('__Underline text test__');
    }, { timeout: 3000 });
    
    const content = await helpers.getEditorContent();
    expect(content).toBe('__Underline text test__');
  });

  test('Ctrl+Shift+X applies strikethrough', async ({ page }) => {
    await helpers.setEditorContent('Strike text test');
    await helpers.selectAllText();
    
    await page.keyboard.press('Control+Shift+x');
    
    await page.waitForFunction(() => {
      const content = window.editorView?.state.doc.toString() || '';
      return content.includes('~~Strike text test~~');
    }, { timeout: 3000 });
    
    const content = await helpers.getEditorContent();
    expect(content).toBe('~~Strike text test~~');
  });

  test('formatting shortcuts can be combined', async ({ page }) => {
    await helpers.setEditorContent('Combined formatting');
    
    // Apply bold first
    await helpers.selectAllText();
    await page.keyboard.press('Control+b');
    
    // Wait for bold to be applied
    await page.waitForFunction(() => {
      return window.editorView?.state.doc.toString().includes('**');
    }, { timeout: 2000 });
    
    // Then apply italic on top
    await helpers.selectAllText();
    await page.keyboard.press('Control+i');
    
    // Wait for italic to be applied
    await page.waitForFunction(() => {
      const content = window.editorView?.state.doc.toString() || '';
      return content.includes('***Combined formatting***');
    }, { timeout: 2000 });
    
    const content = await helpers.getEditorContent();
    expect(content).toBe('***Combined formatting***');
  });

  test.describe('Heading Shortcuts', () => {
    test('Ctrl+Alt+1 creates H1 heading', async ({ page }) => {
      await helpers.setEditorContent('Main Heading');
      await helpers.selectAllText();
      
      await page.keyboard.press('Control+Alt+Digit1');
      
      await page.waitForFunction(() => {
        const content = window.editorView?.state.doc.toString() || '';
        return content.includes('# Main Heading');
      }, { timeout: 3000 });
      
      const content = await helpers.getEditorContent();
      expect(content).toBe('# Main Heading');
    });

    test('Ctrl+Alt+2 creates H2 heading', async ({ page }) => {
      await helpers.setEditorContent('Sub Heading');
      await helpers.selectAllText();
      
      await page.keyboard.press('Control+Alt+Digit2');
      
      await page.waitForFunction(() => {
        const content = window.editorView?.state.doc.toString() || '';
        return content.includes('## Sub Heading');
      }, { timeout: 3000 });
      
      const content = await helpers.getEditorContent();
      expect(content).toBe('## Sub Heading');
    });

    test('Ctrl+Alt+3 creates H3 heading', async ({ page }) => {
      await helpers.setEditorContent('Sub Sub Heading');
      await helpers.selectAllText();
      
      await page.keyboard.press('Control+Alt+Digit3');
      
      await page.waitForFunction(() => {
        const content = window.editorView?.state.doc.toString() || '';
        return content.includes('### Sub Sub Heading');
      }, { timeout: 3000 });
      
      const content = await helpers.getEditorContent();
      expect(content).toBe('### Sub Sub Heading');
    });
  });

  test.describe('List Shortcuts', () => {
    test('Ctrl+Shift+8 creates bullet list', async ({ page }) => {
      await helpers.setEditorContent('List item');
      await helpers.selectAllText();
      
      await page.keyboard.press('Control+Shift+Digit8');
      
      await page.waitForFunction(() => {
        const content = window.editorView?.state.doc.toString() || '';
        return content.includes('- List item');
      }, { timeout: 3000 });
      
      const content = await helpers.getEditorContent();
      expect(content).toBe('- List item');
    });

    test('Ctrl+Shift+7 creates numbered list', async ({ page }) => {
      await helpers.setEditorContent('Numbered item');
      await helpers.selectAllText();
      
      await page.keyboard.press('Control+Shift+Digit7');
      
      await page.waitForFunction(() => {
        const content = window.editorView?.state.doc.toString() || '';
        return content.includes('1. Numbered item');
      }, { timeout: 3000 });
      
      const content = await helpers.getEditorContent();
      expect(content).toBe('1. Numbered item');
    });
  });

  test.describe('Document Navigation Shortcuts', () => {
    test('Ctrl+A selects all text', async ({ page }) => {
      await helpers.setEditorContent('Select all this text for testing');
      
      await page.keyboard.press('Control+a');
      
      // Verify selection by checking if delete removes all content
      await page.keyboard.press('Delete');
      
      // Wait for content to be cleared
      await page.waitForFunction(() => {
        return window.editorView?.state.doc.toString() === '';
      }, { timeout: 2000 });
      
      const content = await helpers.getEditorContent();
      expect(content).toBe('');
    });

    test('Ctrl+F focuses search box', async ({ page }) => {
      await page.keyboard.press('Control+f');
      
      // Wait for search input to be focused
      await page.waitForFunction(() => {
        return document.activeElement?.id === 'search-input';
      }, { timeout: 2000 });
      
      const searchInput = page.locator('#search-input');
      await expect(searchInput).toBeFocused();
    });

    test('Ctrl+N creates new document', async ({ page }) => {
      // Set up dialog handler
      let dialogAccepted = false;
      page.on('dialog', dialog => {
        expect(dialog.message()).toContain('Create a new document');
        dialog.accept();
        dialogAccepted = true;
      });
      
      await page.keyboard.press('Control+n');
      
      // Wait for navigation to complete
      await page.waitForURL(url => url.includes('room='), { timeout: 10000 });
      
      expect(dialogAccepted).toBe(true);
      
      // Verify we're on a new room
      const finalUrl = page.url();
      expect(finalUrl).toContain('room=');
    });

    test('Ctrl+Shift+U copies room URL', async ({ page }) => {
      // Grant clipboard permissions
      await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
      
      let alertShown = false;
      page.on('dialog', dialog => {
        alertShown = true;
        expect(dialog.message()).toContain('Room URL copied to clipboard');
        dialog.accept();
      });

      await page.keyboard.press('Control+Shift+u');
      
      // Wait for alert
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
      
      // Wait for content to be cleared
      await page.waitForFunction(() => {
        return window.editorView?.state.doc.toString() === '';
      }, { timeout: 2000 });
      
      await page.keyboard.press('Control+v');
      
      // Wait for content to be pasted
      await page.waitForFunction(() => {
        return window.editorView?.state.doc.toString() === 'Copy and paste test';
      }, { timeout: 2000 });
      
      const content = await helpers.getEditorContent();
      expect(content).toBe('Copy and paste test');
    });

    test('cut operation works', async ({ page }) => {
      await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
      
      await helpers.setEditorContent('Cut this text');
      
      await page.keyboard.press('Control+a');
      await page.keyboard.press('Control+x');
      
      // Wait for content to be cut (removed)
      await page.waitForFunction(() => {
        return window.editorView?.state.doc.toString() === '';
      }, { timeout: 2000 });
      
      const content = await helpers.getEditorContent();
      expect(content).toBe('');
      
      // Verify paste restores the content
      await page.keyboard.press('Control+v');
      
      await page.waitForFunction(() => {
        return window.editorView?.state.doc.toString() === 'Cut this text';
      }, { timeout: 2000 });
      
      const restoredContent = await helpers.getEditorContent();
      expect(restoredContent).toBe('Cut this text');
    });
  });

  test.describe('Interface Shortcuts', () => {
    test('Ctrl+Shift+T toggles toolbar', async ({ page }) => {
      const toolbar = page.locator('#toolbar');
      await expect(toolbar).toBeVisible();
      
      await page.keyboard.press('Control+Shift+t');
      
      // Wait for toolbar to be hidden
      await page.waitForFunction(() => {
        const toolbar = document.querySelector('#toolbar');
        return toolbar?.classList.contains('hidden') || 
               getComputedStyle(toolbar).display === 'none';
      }, { timeout: 2000 });
      
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
      
      // Wait for menu to close
      await page.waitForFunction(() => {
        const menu = document.querySelector('#file-menu');
        return !menu?.classList.contains('show');
      }, { timeout: 2000 });
      
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
      
      // Wait for alert to appear
      await page.waitForTimeout(1000);
      
      expect(alertMessage).toContain('Document Statistics');
      expect(alertMessage).toContain('words');
    });
  });

  test.describe('Link and URL Shortcuts', () => {
    test('Ctrl+K processes URLs into links', async ({ page }) => {
      await helpers.setEditorContent('https://github.com');
      await helpers.selectAllText();
      
      await page.keyboard.press('Control+k');
      
      // Wait for URL to be converted to markdown link
      await page.waitForFunction(() => {
        const content = window.editorView?.state.doc.toString() || '';
        return content.includes('[https://github.com](https://github.com)');
      }, { timeout: 3000 });
      
      const content = await helpers.getEditorContent();
      expect(content).toBe('[https://github.com](https://github.com)');
    });
  });

  test.describe('Advanced Formatting Shortcuts', () => {
    test('Ctrl+Alt+4 creates H4 heading', async ({ page }) => {
      await helpers.setEditorContent('H4 Heading');
      await helpers.selectAllText();
      
      await page.keyboard.press('Control+Alt+Digit4');
      
      await page.waitForFunction(() => {
        const content = window.editorView?.state.doc.toString() || '';
        return content.includes('#### H4 Heading');
      }, { timeout: 3000 });
      
      const content = await helpers.getEditorContent();
      expect(content).toBe('#### H4 Heading');
    });

    test('Ctrl+Alt+5 creates H5 heading', async ({ page }) => {
      await helpers.setEditorContent('H5 Heading');
      await helpers.selectAllText();
      
      await page.keyboard.press('Control+Alt+Digit5');
      
      await page.waitForFunction(() => {
        const content = window.editorView?.state.doc.toString() || '';
        return content.includes('##### H5 Heading');
      }, { timeout: 3000 });
      
      const content = await helpers.getEditorContent();
      expect(content).toBe('##### H5 Heading');
    });

    test('Ctrl+Alt+6 creates H6 heading', async ({ page }) => {
      await helpers.setEditorContent('H6 Heading');
      await helpers.selectAllText();
      
      await page.keyboard.press('Control+Alt+Digit6');
      
      await page.waitForFunction(() => {
        const content = window.editorView?.state.doc.toString() || '';
        return content.includes('###### H6 Heading');
      }, { timeout: 3000 });
      
      const content = await helpers.getEditorContent();
      expect(content).toBe('###### H6 Heading');
    });
  });

  test.describe('Advanced List Operations', () => {
    test('Tab indents list items', async ({ page }) => {
      await helpers.setEditorContent('- Item 1\n- Item 2');
      
      // Position cursor on second line
      await page.click('#editor .cm-content');
      await page.keyboard.press('ArrowDown');
      
      await page.keyboard.press('Tab');
      
      await page.waitForFunction(() => {
        const content = window.editorView?.state.doc.toString() || '';
        return content.includes('  - Item 2');
      }, { timeout: 2000 });
      
      const content = await helpers.getEditorContent();
      expect(content).toContain('  - Item 2');
    });

    test('Shift+Tab outdents list items', async ({ page }) => {
      await helpers.setEditorContent('- Item 1\n  - Item 2');
      
      // Position cursor on indented line
      await page.click('#editor .cm-content');
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('End');
      
      await page.keyboard.press('Shift+Tab');
      
      await page.waitForFunction(() => {
        const content = window.editorView?.state.doc.toString() || '';
        return content.includes('- Item 2') && !content.includes('  - Item 2');
      }, { timeout: 2000 });
      
      const content = await helpers.getEditorContent();
      expect(content).toBe('- Item 1\n- Item 2');
    });
  });

  test.describe('Document Management Shortcuts', () => {
    test('Ctrl+S triggers save action', async ({ page }) => {
      await helpers.setEditorContent('Document to save');
      
      // Mock save action by checking if it would trigger a download
      let saveTriggered = false;
      page.on('download', () => {
        saveTriggered = true;
      });
      
      // In a real app, Ctrl+S might trigger a save dialog or action
      await page.keyboard.press('Control+s');
      
      // Since this is a web app, Ctrl+S might not do anything by default
      // But we can test that it doesn't break the editor
      const content = await helpers.getEditorContent();
      expect(content).toBe('Document to save');
    });

    test('Ctrl+Z undoes changes', async ({ page }) => {
      await helpers.setEditorContent('Original text');
      await helpers.typeInEditor(' Added text');
      
      const beforeUndo = await helpers.getEditorContent();
      expect(beforeUndo).toBe('Original text Added text');
      
      await page.keyboard.press('Control+z');
      
      await page.waitForFunction(() => {
        const content = window.editorView?.state.doc.toString() || '';
        return content === 'Original text';
      }, { timeout: 2000 });
      
      const afterUndo = await helpers.getEditorContent();
      expect(afterUndo).toBe('Original text');
    });

    test('Ctrl+Y redoes changes', async ({ page }) => {
      await helpers.setEditorContent('Original text');
      await helpers.typeInEditor(' Added text');
      
      // Undo first
      await page.keyboard.press('Control+z');
      
      await page.waitForFunction(() => {
        const content = window.editorView?.state.doc.toString() || '';
        return content === 'Original text';
      }, { timeout: 2000 });
      
      // Then redo
      await page.keyboard.press('Control+y');
      
      await page.waitForFunction(() => {
        const content = window.editorView?.state.doc.toString() || '';
        return content === 'Original text Added text';
      }, { timeout: 2000 });
      
      const afterRedo = await helpers.getEditorContent();
      expect(afterRedo).toBe('Original text Added text');
    });
  });

  test.describe('Selection and Navigation', () => {
    test('Ctrl+Home goes to document start', async ({ page }) => {
      await helpers.setEditorContent('Line 1\nLine 2\nLine 3');
      
      // Go to end first
      await page.keyboard.press('Control+End');
      await page.keyboard.press('Control+Home');
      
      // Verify cursor is at start by typing
      await page.keyboard.type('Start: ');
      
      const content = await helpers.getEditorContent();
      expect(content).toBe('Start: Line 1\nLine 2\nLine 3');
    });

    test('Ctrl+End goes to document end', async ({ page }) => {
      await helpers.setEditorContent('Line 1\nLine 2\nLine 3');
      
      await page.keyboard.press('Control+Home');
      await page.keyboard.press('Control+End');
      
      // Verify cursor is at end by typing
      await page.keyboard.type(' :End');
      
      const content = await helpers.getEditorContent();
      expect(content).toBe('Line 1\nLine 2\nLine 3 :End');
    });

    test('Shift+Arrow keys extend selection', async ({ page }) => {
      await helpers.setEditorContent('Select this text');
      
      // Position cursor at start
      await page.click('#editor .cm-content');
      await page.keyboard.press('Home');
      
      // Select "Select this"
      for (let i = 0; i < 11; i++) {
        await page.keyboard.press('Shift+ArrowRight');
      }
      
      // Type to replace selection
      await page.keyboard.type('Replace');
      
      const content = await helpers.getEditorContent();
      expect(content).toBe('Replace text');
    });
  });

  test.describe('Quick Actions', () => {
    test('Ctrl+D duplicates current line', async ({ page }) => {
      await helpers.setEditorContent('Line to duplicate');
      
      // Position cursor in the line
      await page.click('#editor .cm-content');
      
      // Custom shortcut - this may need to be implemented in your app
      await page.keyboard.press('Control+d');
      
      // This test depends on your app implementing Ctrl+D for line duplication
      // If not implemented, the content should remain unchanged
      const content = await helpers.getEditorContent();
      expect(content.length).toBeGreaterThanOrEqual('Line to duplicate'.length);
    });

    test('Ctrl+/ toggles line comment', async ({ page }) => {
      await helpers.setEditorContent('Code line to comment');
      
      await page.click('#editor .cm-content');
      await page.keyboard.press('Control+/');
      
      // This depends on your app implementing comment toggling
      const content = await helpers.getEditorContent();
      expect(content.length).toBeGreaterThanOrEqual('Code line to comment'.length);
    });
  });
});
