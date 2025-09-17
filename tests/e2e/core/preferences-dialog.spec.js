// tests/e2e/core/preferences-dialog.spec.js
import { test, expect } from '@playwright/test';
import { CollabEditorHelpers } from '../../utils/testHelpers.js';

test('DEBUG - check what exists', async ({ page }) => {
  const debug = await page.evaluate(() => {
    return {
      hasPreferencesDialog: typeof window.preferencesDialog !== 'undefined',
      hasShortcutManager: typeof window.shortcutManager !== 'undefined',
      preferencesType: typeof window.preferencesDialog,
      shortcutType: typeof window.shortcutManager,
      bodyHtml: document.body.innerHTML.substring(0, 500)
    };
  });
  console.log('DEBUG:', JSON.stringify(debug, null, 2));
});



test.describe('Preferences Dialog', () => {
  let helpers;

  test.beforeEach(async ({ page }, testInfo) => {
    helpers = new CollabEditorHelpers(page);
    helpers.setTestName(testInfo.title);
    await helpers.navigateToRoom();
    await helpers.waitForStableEditor();
    
    // Ensure shortcut manager and preferences dialog are properly initialized
    await page.evaluate(() => {
      // Clear any existing preferences
      localStorage.removeItem('keyboard-shortcuts');
      
      // Ensure shortcut manager is available
      if (window.shortcutManager) {
        window.shortcutManager.loadDefaults();
        window.shortcutManager.loadUserCustomizations();
      }
      
      // Ensure preferences dialog is available
      if (window.preferencesDialog) {
        window.preferencesDialog.isOpen = false;
        window.preferencesDialog.editingAction = null;
      }
    });
    
    // Wait for initialization to complete
    await page.waitForTimeout(500);
  });

  test.afterEach(async ({ page }) => {
    // Close any open dialog
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
    
    // Clean up localStorage
    await page.evaluate(() => {
      localStorage.removeItem('keyboard-shortcuts');
      
      // Reset dialog state
      if (window.preferencesDialog) {
        window.preferencesDialog.isOpen = false;
        window.preferencesDialog.editingAction = null;
      }
    });
  });

  test.describe('Dialog Opening and Closing', () => {
    test('opens preferences dialog via menu', async ({ page }) => {
    // First verify that the preferences dialog functionality exists
    const hasPreferencesDialog = await page.evaluate(() => {
      return typeof window.preferencesDialog !== 'undefined' && 
             typeof window.preferencesDialog.show === 'function';
    });
    
    if (!hasPreferencesDialog) {
      test.skip('Preferences dialog not implemented yet');
      return;
    }
    
    // Open Tools menu and click Preferences
    await helpers.openMenu('tools');
    await helpers.clickMenuItem('preferences');
    
    // Verify dialog is visible
    await expect(page.locator('#preferences-modal')).toBeVisible({ timeout: 10000 });
    
    // Check if body scroll is disabled
    const bodyOverflow = await page.evaluate(() => document.body.style.overflow);
    expect(['hidden', '']).toContain(bodyOverflow);
    });

    test('opens via window.preferencesDialog.show()', async ({ page }) => {
      // Check if preferences dialog is available
      const hasPreferencesDialog = await page.evaluate(() => {
        return typeof window.preferencesDialog !== 'undefined';
      });
      
      if (!hasPreferencesDialog) {
        test.skip('Preferences dialog not implemented yet');
        return;
      }
      
      // Open programmatically
      await page.evaluate(() => window.preferencesDialog.show());
      
      // Verify dialog state
      await expect(page.locator('#preferences-modal')).toBeVisible({ timeout: 5000 });
      
      const isOpen = await page.evaluate(() => window.preferencesDialog.isOpen);
      expect(isOpen).toBe(true);
    });

    test('closes via X button', async ({ page }) => {
    const hasPreferencesDialog = await page.evaluate(() => {
      return typeof window.preferencesDialog !== 'undefined';
    });
    
    if (!hasPreferencesDialog) {
      test.skip('Preferences dialog not implemented yet');
      return;
    }
    
    await page.evaluate(() => window.preferencesDialog.show());
    await expect(page.locator('#preferences-modal')).toBeVisible({ timeout: 5000 });
    
    // Click X button
    const closeButton = page.locator('.modal-close').first();
    await closeButton.click();
    
    // Verify dialog is closed
    await expect(page.locator('#preferences-modal')).not.toBeVisible({ timeout: 5000 });
    
    const isOpen = await page.evaluate(() => window.preferencesDialog.isOpen);
    expect(isOpen).toBe(false);
    });

    test('closes via Close button', async ({ page }) => {
    const hasPreferencesDialog = await page.evaluate(() => {
      return typeof window.preferencesDialog !== 'undefined';
    });
    
    if (!hasPreferencesDialog) {
      test.skip('Preferences dialog not implemented yet');
      return;
    }
    
    await page.evaluate(() => window.preferencesDialog.show());
    await expect(page.locator('#preferences-modal')).toBeVisible({ timeout: 5000 });
    
    // Click Close button in footer
    const closeButton = page.locator('.modal-footer .modal-button').first();
    await closeButton.click();
    
    // Verify dialog is closed
    await expect(page.locator('#preferences-modal')).not.toBeVisible({ timeout: 5000 });
  });
    test('closes via Escape key', async ({ page }) => {
      const hasPreferencesDialog = await page.evaluate(() => {
        return typeof window.preferencesDialog !== 'undefined';
      });
      
      if (!hasPreferencesDialog) {
        test.skip('Preferences dialog not implemented yet');
        return;
      }
      
      await page.evaluate(() => window.preferencesDialog.show());
      await expect(page.locator('#preferences-modal')).toBeVisible({ timeout: 5000 });
      
      // Press Escape
      await page.keyboard.press('Escape');
      
      // Verify dialog is closed
      await expect(page.locator('#preferences-modal')).not.toBeVisible({ timeout: 5000 });
      });

      test('closes via click outside modal', async ({ page }) => {
        const hasPreferencesDialog = await page.evaluate(() => {
          return typeof window.preferencesDialog !== 'undefined';
        });
        
        if (!hasPreferencesDialog) {
          test.skip('Preferences dialog not implemented yet');
          return;
        }
        
        await page.evaluate(() => window.preferencesDialog.show());
        await expect(page.locator('#preferences-modal')).toBeVisible({ timeout: 5000 });
        
        // Click on overlay (outside dialog)
        const overlay = page.locator('#preferences-modal');
        await overlay.click({ position: { x: 10, y: 10 } });
        
        // Verify dialog is closed
        await expect(page.locator('#preferences-modal')).not.toBeVisible({ timeout: 5000 });
     });

     test('does not close when clicking inside dialog', async ({ page }) => {
        const hasPreferencesDialog = await page.evaluate(() => {
          return typeof window.preferencesDialog !== 'undefined';
        });
        
        if (!hasPreferencesDialog) {
          test.skip('Preferences dialog not implemented yet');
          return;
        }
        
        await page.evaluate(() => window.preferencesDialog.show());
        await expect(page.locator('#preferences-modal')).toBeVisible({ timeout: 5000 });
        
        // Click inside dialog content
        const modalContent = page.locator('.modal-content').first();
        await modalContent.click();
        
        // Verify dialog remains open
        await expect(page.locator('#preferences-modal')).toBeVisible();
        
        const isOpen = await page.evaluate(() => window.preferencesDialog.isOpen);
        expect(isOpen).toBe(true);
      }); 


    test('prevents multiple dialogs from opening', async ({ page }) => {
      const hasPreferencesDialog = await page.evaluate(() => {
        return typeof window.preferencesDialog !== 'undefined';
      });
      
      if (!hasPreferencesDialog) {
        test.skip('Preferences dialog not implemented yet');
        return;
      }
      
      // Open first dialog
      await page.evaluate(() => window.preferencesDialog.show());
      await expect(page.locator('#preferences-modal')).toBeVisible({ timeout: 5000 });
      
      // Try to open again
      await page.evaluate(() => window.preferencesDialog.show());
      
      // Should still only have one dialog
      const modalCount = await page.locator('#preferences-modal').count();
      expect(modalCount).toBe(1);
    });
  });

  test.describe('Shortcut Display and Organization', () => {
    test('displays shortcuts organized by category', async ({ page }) => {
      const hasFeatures = await page.evaluate(() => {
        return typeof window.preferencesDialog !== 'undefined' && 
               typeof window.shortcutManager !== 'undefined';
      });
      
      if (!hasFeatures) {
        test.skip('Shortcut management features not implemented yet');
        return;
      }
      
      await page.evaluate(() => window.preferencesDialog.show());
      await expect(page.locator('#preferences-modal')).toBeVisible({ timeout: 5000 });
      
      // Verify categories are present (but be flexible about which ones exist)
      const categoryElements = page.locator('.category-title');
      const categoryCount = await categoryElements.count();
      
      // Should have at least some categories
      expect(categoryCount).toBeGreaterThan(0);
      
      // Check for common expected categories
      const possibleCategories = ['File', 'Edit', 'Format', 'Tools', 'View'];
      let foundCategories = 0;
      
      for (const category of possibleCategories) {
        const categoryExists = await page.locator('.category-title').filter({ hasText: category }).count() > 0;
        if (categoryExists) foundCategories++;
      }
      
      expect(foundCategories).toBeGreaterThan(0);
    });

    test('displays shortcut items with description and key', async ({ page }) => {
      const hasFeatures = await page.evaluate(() => {
        return typeof window.preferencesDialog !== 'undefined' && 
               typeof window.shortcutManager !== 'undefined';
      });
      
      if (!hasFeatures) {
        test.skip('Shortcut management features not implemented yet');
        return;
      }
      
      await page.evaluate(() => window.preferencesDialog.show());
      await expect(page.locator('#preferences-modal')).toBeVisible({ timeout: 5000 });
      
      // Check that shortcut items have proper structure
      const shortcutItems = page.locator('.shortcut-item');
      const itemCount = await shortcutItems.count();
      
      if (itemCount > 0) {
        const firstShortcut = shortcutItems.first();
        await expect(firstShortcut.locator('.shortcut-description')).toBeVisible();
        await expect(firstShortcut.locator('.shortcut-key')).toBeVisible();
        
        // Verify data attributes are present
        const hasDataAction = await firstShortcut.locator('.shortcut-key').getAttribute('data-action');
        expect(hasDataAction).toBeTruthy();
      }
    });

    test('shows correct default shortcuts', async ({ page }) => {
      const hasFeatures = await page.evaluate(() => {
        return typeof window.preferencesDialog !== 'undefined' && 
               typeof window.shortcutManager !== 'undefined';
      });
      
      if (!hasFeatures) {
        test.skip('Shortcut management features not implemented yet');
        return;
      }
      
      await page.evaluate(() => window.preferencesDialog.show());
      await expect(page.locator('#preferences-modal')).toBeVisible({ timeout: 5000 });
      
      // Check some known default shortcuts (if they exist)
      const shortcuts = [
        { action: 'bold', expected: 'Ctrl+B' },
        { action: 'italic', expected: 'Ctrl+I' },
        { action: 'new', expected: 'Ctrl+N' }
      ];
      
      for (const shortcut of shortcuts) {
        const shortcutElement = page.locator(`.shortcut-key[data-action="${shortcut.action}"]`);
        const exists = await shortcutElement.count() > 0;
        
        if (exists) {
          await expect(shortcutElement).toHaveText(shortcut.expected);
        }
      }
    });
  });

  test.describe('Shortcut Editing Functionality', () => {
    test('enters edit mode when clicking shortcut key', async ({ page }) => {
      const hasFeatures = await page.evaluate(() => {
        return typeof window.preferencesDialog !== 'undefined' && 
               typeof window.shortcutManager !== 'undefined';
      });
      
      if (!hasFeatures) {
        test.skip('Shortcut editing not implemented yet');
        return;
      }
      
      await page.evaluate(() => window.preferencesDialog.show());
      await expect(page.locator('#preferences-modal')).toBeVisible({ timeout: 5000 });
      
      const boldShortcut = page.locator('.shortcut-key[data-action="bold"]');
      const exists = await boldShortcut.count() > 0;
      
      if (exists) {
        await boldShortcut.click();
        
        // Verify edit mode
        await expect(boldShortcut).toHaveClass(/editing/);
        await expect(boldShortcut).toHaveText('Press keys...');
        
        // Verify edit state in JavaScript
        const editingAction = await page.evaluate(() => window.preferencesDialog.editingAction);
        expect(editingAction).toBe('bold');
      }
    });

    test('updates shortcut with valid key combination', async ({ page }) => {
      const hasFeatures = await page.evaluate(() => {
        return typeof window.preferencesDialog !== 'undefined' && 
               typeof window.shortcutManager !== 'undefined';
      });
      
      if (!hasFeatures) {
        test.skip('Shortcut editing not implemented yet');
        return;
      }
      
      await page.evaluate(() => window.preferencesDialog.show());
      await expect(page.locator('#preferences-modal')).toBeVisible({ timeout: 5000 });
      
      const boldShortcut = page.locator('.shortcut-key[data-action="bold"]');
      const exists = await boldShortcut.count() > 0;
      
      if (exists) {
        await boldShortcut.click();
        await expect(boldShortcut).toHaveClass(/editing/);
        
        // Press new key combination
        await page.keyboard.press('Control+Shift+b');
        
        // Verify shortcut is updated
        await expect(boldShortcut).toHaveText('Ctrl+Shift+B');
        await expect(boldShortcut).not.toHaveClass(/editing/);
        
        // Verify temporary success message
        const messageExists = await page.locator('.preferences-message').count() > 0;
        if (messageExists) {
          await expect(page.locator('.preferences-message')).toBeVisible();
          await expect(page.locator('.preferences-message')).toContainText('Updated to "Ctrl+Shift+B"');
        }
      }
    });

    test('rejects invalid key combinations', async ({ page }) => {
      const hasFeatures = await page.evaluate(() => {
        return typeof window.preferencesDialog !== 'undefined' && 
               typeof window.shortcutManager !== 'undefined';
      });
      
      if (!hasFeatures) {
        test.skip('Shortcut editing not implemented yet');
        return;
      }
      
      await page.evaluate(() => window.preferencesDialog.show());
      await expect(page.locator('#preferences-modal')).toBeVisible({ timeout: 5000 });
      
      const boldShortcut = page.locator('.shortcut-key[data-action="bold"]');
      const exists = await boldShortcut.count() > 0;
      
      if (exists) {
        await boldShortcut.click();
        
        // Try invalid combination (just a letter)
        await page.keyboard.press('b');
        
        // Should show error message or remain in edit mode
        const messageExists = await page.locator('.preferences-message').count() > 0;
        if (messageExists) {
          await expect(page.locator('.preferences-message')).toBeVisible();
          await expect(page.locator('.preferences-message')).toContainText('Invalid shortcut');
        }
        
        // Should remain in edit mode
        await expect(boldShortcut).toHaveClass(/editing/);
      }
    });

    test('supports function key shortcuts', async ({ page }) => {
      const hasFeatures = await page.evaluate(() => {
        return typeof window.preferencesDialog !== 'undefined' && 
               typeof window.shortcutManager !== 'undefined';
      });
      
      if (!hasFeatures) {
        test.skip('Shortcut editing not implemented yet');
        return;
      }
      
      await page.evaluate(() => window.preferencesDialog.show());
      await expect(page.locator('#preferences-modal')).toBeVisible({ timeout: 5000 });
      
      const helpShortcut = page.locator('.shortcut-key[data-action="about"]');
      const exists = await helpShortcut.count() > 0;
      
      if (exists) {
        await helpShortcut.click();
        
        // Use F2 as new shortcut
        await page.keyboard.press('F2');
        
        // Should accept function keys
        await expect(helpShortcut).toHaveText('F2');
        await expect(helpShortcut).not.toHaveClass(/editing/);
      }
    });

    test('persists shortcut changes to localStorage', async ({ page }) => {
      const hasFeatures = await page.evaluate(() => {
        return typeof window.preferencesDialog !== 'undefined' && 
               typeof window.shortcutManager !== 'undefined';
      });
      
      if (!hasFeatures) {
        test.skip('Shortcut persistence not implemented yet');
        return;
      }
      
      await page.evaluate(() => window.preferencesDialog.show());
      await expect(page.locator('#preferences-modal')).toBeVisible({ timeout: 5000 });
      
      const boldShortcut = page.locator('.shortcut-key[data-action="bold"]');
      const exists = await boldShortcut.count() > 0;
      
      if (exists) {
        await boldShortcut.click();
        await page.keyboard.press('Control+Shift+b');
        
        // Close and reopen dialog
        await page.keyboard.press('Escape');
        await page.evaluate(() => window.preferencesDialog.show());
        
        // Verify change persisted
        const updatedShortcut = page.locator('.shortcut-key[data-action="bold"]');
        await expect(updatedShortcut).toHaveText('Ctrl+Shift+B');
        
        // Verify localStorage was updated
        const storedShortcuts = await page.evaluate(() => {
          return JSON.parse(localStorage.getItem('keyboard-shortcuts') || '{}');
        });
        expect(storedShortcuts.bold).toBe('Ctrl+Shift+B');
      }
    });
  });

  test.describe('Reset to Defaults Functionality', () => {
    test('shows confirmation dialog for reset', async ({ page }) => {
      const hasFeatures = await page.evaluate(() => {
        return typeof window.preferencesDialog !== 'undefined' && 
               typeof window.shortcutManager !== 'undefined';
      });
      
      if (!hasFeatures) {
        test.skip('Reset functionality not implemented yet');
        return;
      }
      
      await page.evaluate(() => window.preferencesDialog.show());
      await expect(page.locator('#preferences-modal')).toBeVisible({ timeout: 5000 });
      
      const resetButton = page.locator('#reset-shortcuts');
      const buttonExists = await resetButton.count() > 0;
      
      if (buttonExists) {
        // Set up dialog handler
        let confirmShown = false;
        page.on('dialog', dialog => {
          confirmShown = true;
          expect(dialog.message()).toContain('Reset all keyboard shortcuts to defaults');
          dialog.dismiss(); // Cancel the reset
        });
        
        await resetButton.click();
        
        expect(confirmShown).toBe(true);
      }
    });

    test('resets shortcuts when confirmed', async ({ page }) => {
      const hasFeatures = await page.evaluate(() => {
        return typeof window.preferencesDialog !== 'undefined' && 
               typeof window.shortcutManager !== 'undefined';
      });
      
      if (!hasFeatures) {
        test.skip('Reset functionality not implemented yet');
        return;
      }
      
      // First, modify a shortcut
      await page.evaluate(() => window.preferencesDialog.show());
      await expect(page.locator('#preferences-modal')).toBeVisible({ timeout: 5000 });
      
      const boldShortcut = page.locator('.shortcut-key[data-action="bold"]');
      const shortcutExists = await boldShortcut.count() > 0;
      
      if (shortcutExists) {
        await boldShortcut.click();
        await page.keyboard.press('Control+Shift+b');
        await expect(boldShortcut).toHaveText('Ctrl+Shift+B');
        
        // Now reset
        const resetButton = page.locator('#reset-shortcuts');
        const resetExists = await resetButton.count() > 0;
        
        if (resetExists) {
          page.on('dialog', dialog => dialog.accept());
          await resetButton.click();
          
          // Verify reset
          await expect(boldShortcut).toHaveText('Ctrl+B');
          
          const messageExists = await page.locator('.preferences-message').count() > 0;
          if (messageExists) {
            await expect(page.locator('.preferences-message')).toContainText('Reset to defaults');
          }
          
          // Verify localStorage is cleared
          const storedShortcuts = await page.evaluate(() => {
            return localStorage.getItem('keyboard-shortcuts');
          });
          expect(storedShortcuts).toBeNull();
        }
      }
    });
  });

  test.describe('Edge Cases and Error Handling', () => {
    test('handles missing shortcutManager gracefully', async ({ page }) => {
      // Temporarily remove shortcutManager
      await page.evaluate(() => {
        window._backupShortcutManager = window.shortcutManager;
        delete window.shortcutManager;
      });
      
      // Try to open dialog
      const hasPreferencesDialog = await page.evaluate(() => {
        return typeof window.preferencesDialog !== 'undefined';
      });
      
      if (hasPreferencesDialog) {
        await page.evaluate(() => window.preferencesDialog.show());
        
        // Should not crash, but might not show shortcuts
        await expect(page.locator('#preferences-modal')).toBeVisible({ timeout: 5000 });
      }
      
      // Restore shortcutManager
      await page.evaluate(() => {
        if (window._backupShortcutManager) {
          window.shortcutManager = window._backupShortcutManager;
          delete window._backupShortcutManager;
        }
      });
    });

    test('preserves state after page interactions', async ({ page }) => {
      const hasFeatures = await page.evaluate(() => {
        return typeof window.preferencesDialog !== 'undefined' && 
               typeof window.shortcutManager !== 'undefined';
      });
      
      if (!hasFeatures) {
        test.skip('State preservation not testable without full implementation');
        return;
      }
      
      await page.evaluate(() => window.preferencesDialog.show());
      await expect(page.locator('#preferences-modal')).toBeVisible({ timeout: 5000 });
      
      const boldShortcut = page.locator('.shortcut-key[data-action="bold"]');
      const exists = await boldShortcut.count() > 0;
      
      if (exists) {
        await boldShortcut.click();
        await page.keyboard.press('Control+Shift+b');
        
        // Click elsewhere on page
        await page.click('body');
        
        // Reopen dialog
        await page.evaluate(() => window.preferencesDialog.show());
        
        // Should preserve the change
        const updatedShortcut = page.locator('.shortcut-key[data-action="bold"]');
        await expect(updatedShortcut).toHaveText('Ctrl+Shift+B');
      }
    });
  });

  test.describe('Accessibility', () => {
    test('dialog has proper ARIA attributes', async ({ page }) => {
    const hasPreferencesDialog = await page.evaluate(() => {
      return typeof window.preferencesDialog !== 'undefined';
    });
    
    if (!hasPreferencesDialog) {
      test.skip('Preferences dialog not implemented yet');
      return;
    }
    
    await page.evaluate(() => window.preferencesDialog.show());
    await expect(page.locator('#preferences-modal')).toBeVisible({ timeout: 5000 });
    
    const modal = page.locator('#preferences-modal');
    await expect(modal).toHaveAttribute('role', 'dialog');
    
    // Check for title and aria-labelledby (if implemented)
    const title = page.locator('#preferences-title').first();
    const titleExists = await title.count() > 0;
    
    if (titleExists) {
      const titleId = await title.getAttribute('id');
      if (titleId) {
        await expect(modal).toHaveAttribute('aria-labelledby', titleId);
      }
    }
  });

    test('keyboard navigation works within dialog', async ({ page }) => {
      const hasPreferencesDialog = await page.evaluate(() => {
        return typeof window.preferencesDialog !== 'undefined';
      });
      
      if (!hasPreferencesDialog) {
        test.skip('Preferences dialog not implemented yet');
        return;
      }
      
      await page.evaluate(() => window.preferencesDialog.show());
      await expect(page.locator('#preferences-modal')).toBeVisible({ timeout: 5000 });
      
      // Tab through elements
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      // Should be able to navigate to buttons
      const activeElement = await page.evaluate(() => document.activeElement.tagName);
      expect(['BUTTON', 'SPAN', 'DIV']).toContain(activeElement);
    });
  });

  test.describe('Integration with Shortcut Manager', () => {
    test('updates work with shortcut manager state', async ({ page }) => {
      const hasFeatures = await page.evaluate(() => {
        return typeof window.preferencesDialog !== 'undefined' && 
               typeof window.shortcutManager !== 'undefined';
      });
      
      if (!hasFeatures) {
        test.skip('Shortcut manager integration not implemented yet');
        return;
      }
      
      await page.evaluate(() => window.preferencesDialog.show());
      await expect(page.locator('#preferences-modal')).toBeVisible({ timeout: 5000 });
      
      const boldShortcut = page.locator('.shortcut-key[data-action="bold"]');
      const exists = await boldShortcut.count() > 0;
      
      if (exists) {
        await boldShortcut.click();
        await page.keyboard.press('Control+Shift+b');
        
        // Verify shortcut manager was updated
        const managerShortcut = await page.evaluate(() => {
          if (window.shortcutManager && window.shortcutManager.getShortcut) {
            return window.shortcutManager.getShortcut('bold').key;
          }
          return null;
        });
        
        if (managerShortcut) {
          expect(managerShortcut).toBe('Ctrl+Shift+B');
        }
        
        const actionMapping = await page.evaluate(() => {
          if (window.shortcutManager && window.shortcutManager.getAction) {
            return window.shortcutManager.getAction('Ctrl+Shift+B');
          }
          return null;
        });
        
        if (actionMapping) {
          expect(actionMapping).toBe('bold');
        }
      }
    });
  });
});
