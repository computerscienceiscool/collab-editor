// tests/e2e/github/github-settings.js
import { test, expect } from '@playwright/test';
import { CollabEditorHelpers } from '../../utils/testHelpers.js';

test.describe('GitHub Settings Dialog', () => {
  let helpers;

  test.beforeEach(async ({ page }, testInfo) => {
    helpers = new CollabEditorHelpers(page);
    helpers.setTestName(testInfo.title);
    await helpers.navigateToRoom();
    await helpers.waitForStableEditor();
    
    // Clear any existing GitHub settings
    await page.evaluate(() => {
      localStorage.removeItem('github-settings');
      if (window.githubService) {
        window.githubService.settings = {
          token: '',
          username: '',
          repos: [],
          selectedRepo: '',
          defaultPath: '',
          commitMessage: 'Update from collaborative editor',
          enabled: false,
          lastCommit: null
        };
      }
    });

    // Set up GitHub API mocks
    await setupGitHubAPIMocks(page);
  });

  test.afterEach(async ({ page }) => {
    // Clean up
    await page.evaluate(() => {
      localStorage.removeItem('github-settings');
      // Close any open dialogs
      document.querySelectorAll('.modal-overlay').forEach(modal => {
        if (modal.parentNode) modal.remove();
      });
    });
  });

  test.describe('Dialog Opening and Closing', () => {
    test('opens GitHub settings via Tools menu', async ({ page }) => {
      await helpers.openMenu('tools');
      await helpers.clickMenuItem('github-settings');
      
      // Verify dialog is visible
      await expect(page.locator('#github-modal')).toBeVisible({ timeout: 10000 });
      
      // Check dialog structure
      await expect(page.locator('#github-title')).toHaveText('GitHub Settings');
      await expect(page.locator('#github-token')).toBeVisible();
      await expect(page.locator('#validate-token')).toBeVisible();
    });

    test('opens GitHub settings via keyboard shortcut', async ({ page }) => {
      const modifier = helpers.getKeyModifier();
      await page.keyboard.press(`${modifier}+Alt+Shift+g`);
      
      await expect(page.locator('#github-modal')).toBeVisible({ timeout: 5000 });
    });

    test('closes via X button', async ({ page }) => {
      await helpers.openMenu('tools');
      await helpers.clickMenuItem('github-settings');
      await expect(page.locator('#github-modal')).toBeVisible();
      
      await page.click('#github-close');
      await expect(page.locator('#github-modal')).not.toBeVisible();
    });

    test('closes via Cancel button', async ({ page }) => {
      await helpers.openMenu('tools');
      await helpers.clickMenuItem('github-settings');
      await expect(page.locator('#github-modal')).toBeVisible();
      
      await page.click('#cancel-settings');
      await expect(page.locator('#github-modal')).not.toBeVisible();
    });

    test('closes via Escape key', async ({ page }) => {
      await helpers.openMenu('tools');
      await helpers.clickMenuItem('github-settings');
      await expect(page.locator('#github-modal')).toBeVisible();
      
      await page.keyboard.press('Escape');
      await expect(page.locator('#github-modal')).not.toBeVisible();
    });

    test('closes via click outside', async ({ page }) => {
      await helpers.openMenu('tools');
      await helpers.clickMenuItem('github-settings');
      await expect(page.locator('#github-modal')).toBeVisible();
      
      // Click on overlay
      await page.click('#github-modal', { position: { x: 10, y: 10 } });
      await expect(page.locator('#github-modal')).not.toBeVisible();
    });
  });

  test.describe('Token Management', () => {
    test('validates valid GitHub token', async ({ page }) => {
      await helpers.openMenu('tools');
      await helpers.clickMenuItem('github-settings');
      
      // Enter a valid-looking token
      await page.fill('#github-token', 'ghp_validtoken123456789012345678901234');
      await page.click('#validate-token');
      
      // Wait for validation
      await page.waitForTimeout(1000);
      
      // Check for success status
      const tokenStatus = page.locator('#token-status');
      await expect(tokenStatus).toContainText('Token valid for user: testuser');
      await expect(tokenStatus).toHaveClass(/status-valid/);
      
      // Repository section should become visible
      await expect(page.locator('#repository-section')).toBeVisible();
    });

    test('handles invalid GitHub token', async ({ page }) => {
      await helpers.openMenu('tools');
      await helpers.clickMenuItem('github-settings');
      
      // Enter an invalid token
      await page.fill('#github-token', 'invalid_token');
      await page.click('#validate-token');
      
      await page.waitForTimeout(1000);
      
      // Check for error status
      const tokenStatus = page.locator('#token-status');
      await expect(tokenStatus).toContainText('Token validation failed');
      await expect(tokenStatus).toHaveClass(/status-error/);
      
      // Repository section should remain hidden
      await expect(page.locator('#repository-section')).not.toBeVisible();
    });


    test('shows loading state during validation', async ({ page }) => {
      await helpers.openMenu('tools');
      await helpers.clickMenuItem('github-settings');
      
      await page.fill('#github-token', 'ghp_testtoken123456789012345678901234');
      
      const tokenStatus = page.locator('#token-status');
      
      // Start validation and immediately check for loading state
      const validatePromise = page.click('#validate-token');
      
      // Check loading state appears quickly
      await expect(tokenStatus).toContainText('Validating token...', { timeout: 1000 });
      await expect(tokenStatus).toHaveClass(/status-loading/, { timeout: 1000 });
      
      // Wait for validation to complete
      await validatePromise;
    });


    test('handles empty token validation', async ({ page }) => {
      await helpers.openMenu('tools');
      await helpers.clickMenuItem('github-settings');
      
      // Try to validate without entering a token
      await page.click('#validate-token');
      
      const tokenStatus = page.locator('#token-status');
      await expect(tokenStatus).toContainText('Please enter a token');
      await expect(tokenStatus).toHaveClass(/status-error/);
    });
  });

  test.describe('Repository Management', () => {
    test('fetches and displays repositories', async ({ page }) => {
      await helpers.openMenu('tools');
      await helpers.clickMenuItem('github-settings');
      
      // Validate token first
      await page.fill('#github-token', 'ghp_validtoken123456789012345678901234');
      await page.click('#validate-token');
      await page.waitForTimeout(1000);
      
      // Repository dropdown should be populated
      const repoSelect = page.locator('#github-repo');
      await expect(repoSelect).toBeVisible();
      
      // Check that repositories are loaded
      const optionCount = await repoSelect.locator('option').count();
      expect(optionCount).toBeGreaterThan(1); // Default option + actual repos
      
      // Verify specific test repositories exist
      await expect(repoSelect.locator('option[value="testuser/test-repo"]')).toBeVisible();
      await expect(repoSelect.locator('option[value="testuser/docs-repo"]')).toBeVisible();
    });

    test('refreshes repository list', async ({ page }) => {
      await helpers.openMenu('tools');
      await helpers.clickMenuItem('github-settings');
      
      // Validate token and wait for repos
      await page.fill('#github-token', 'ghp_validtoken123456789012345678901234');
      await page.click('#validate-token');
      await page.waitForTimeout(1000);
      
      // Click refresh button
      await page.click('#refresh-repos');
      await page.waitForTimeout(1000);
      
      // Check for success status
      const githubStatus = page.locator('#github-status');
      await expect(githubStatus).toContainText('Fetched');
      await expect(githubStatus).toContainText('repositories');
    });

    test('handles repository fetch failure', async ({ page }) => {
      // Set up mock to fail on repo fetch
      await page.evaluate(() => {
        window.__mockGitHubApiFails = true;
      });
      
      await helpers.openMenu('tools');
      await helpers.clickMenuItem('github-settings');
      
      await page.fill('#github-token', 'ghp_validtoken123456789012345678901234');
      await page.click('#validate-token');
      await page.waitForTimeout(1000);
      
      const githubStatus = page.locator('#github-status');
      await expect(githubStatus).toContainText('Failed to fetch repositories');
      await expect(githubStatus).toHaveClass(/status-error/);
    });

    test('selects repository and sets default values', async ({ page }) => {
      await helpers.openMenu('tools');
      await helpers.clickMenuItem('github-settings');
      
      // Validate token
      await page.fill('#github-token', 'ghp_validtoken123456789012345678901234');
      await page.click('#validate-token');
      await page.waitForTimeout(1000);
      
      // Select a repository
      await page.selectOption('#github-repo', 'testuser/test-repo');
      
      // Fill in other settings
      await page.fill('#github-path', 'docs/my-document.md');
      await page.fill('#github-message', 'Custom commit message');
      
      // Verify values are set
      await expect(page.locator('#github-repo')).toHaveValue('testuser/test-repo');
      await expect(page.locator('#github-path')).toHaveValue('docs/my-document.md');
      await expect(page.locator('#github-message')).toHaveValue('Custom commit message');
    });
  });

  test.describe('Settings Persistence', () => {
    test('saves settings to localStorage', async ({ page }) => {
      await helpers.openMenu('tools');
      await helpers.clickMenuItem('github-settings');
      
      // Configure settings
      await page.fill('#github-token', 'ghp_validtoken123456789012345678901234');
      await page.click('#validate-token');
      await page.waitForTimeout(1000);
      
      await page.selectOption('#github-repo', 'testuser/test-repo');
      await page.fill('#github-path', 'docs/test.md');
      await page.fill('#github-message', 'Test commit message');
      
      // Save settings
      await page.click('#save-settings');
      await page.waitForTimeout(500);
      
      // Verify success message
      const githubStatus = page.locator('#github-status');
      await expect(githubStatus).toContainText('GitHub settings saved successfully');
      
      // Verify localStorage
      const savedSettings = await page.evaluate(() => {
        return JSON.parse(localStorage.getItem('github-settings') || '{}');
      });
      
      expect(savedSettings.token).toBe('ghp_validtoken123456789012345678901234');
      expect(savedSettings.selectedRepo).toBe('testuser/test-repo');
      expect(savedSettings.defaultPath).toBe('docs/test.md');
      expect(savedSettings.commitMessage).toBe('Test commit message');
      expect(savedSettings.enabled).toBe(true);
    });

    test('loads existing settings on dialog open', async ({ page }) => {
      // Pre-populate localStorage
      await page.evaluate(() => {
        const settings = {
          token: 'ghp_existingtoken123456789012345678901',
          username: 'existinguser',
          selectedRepo: 'existinguser/existing-repo',
          defaultPath: 'existing/path.md',
          commitMessage: 'Existing commit message',
          enabled: true,
          repos: [
            { name: 'existing-repo', fullName: 'existinguser/existing-repo', defaultBranch: 'main' }
          ]
        };
        localStorage.setItem('github-settings', JSON.stringify(settings));
      });
      
      await helpers.openMenu('tools');
      await helpers.clickMenuItem('github-settings');
      
      // Verify settings are loaded
      await expect(page.locator('#github-token')).toHaveValue('ghp_existingtoken123456789012345678901');
      await expect(page.locator('#github-path')).toHaveValue('existing/path.md');
      await expect(page.locator('#github-message')).toHaveValue('Existing commit message');
      
      // Repository section should be visible with existing token
      await expect(page.locator('#repository-section')).toBeVisible();
    });

    test('clears all settings', async ({ page }) => {
      // Pre-populate settings
      await page.evaluate(() => {
        const settings = {
          token: 'ghp_testtoken123456789012345678901234',
          selectedRepo: 'test/repo',
          defaultPath: 'test.md',
          enabled: true
        };
        localStorage.setItem('github-settings', JSON.stringify(settings));
      });
      
      await helpers.openMenu('tools');
      await helpers.clickMenuItem('github-settings');
      
      // Set up confirmation dialog
      page.on('dialog', dialog => {
        expect(dialog.message()).toContain('Are you sure you want to clear all GitHub settings?');
        dialog.accept();
      });
      
      // Clear settings
      await page.click('#clear-settings');
      await page.waitForTimeout(500);
      
      // Verify form is cleared
      await expect(page.locator('#github-token')).toHaveValue('');
      await expect(page.locator('#github-repo')).toHaveValue('');
      await expect(page.locator('#github-path')).toHaveValue('');
      await expect(page.locator('#github-message')).toHaveValue('Update from collaborative editor');
      
      // Verify localStorage is cleared
      const clearedSettings = await page.evaluate(() => {
        return localStorage.getItem('github-settings');
      });
      expect(clearedSettings).toBeNull();
    });

    test('cancels clear settings operation', async ({ page }) => {
      await helpers.openMenu('tools');
      await helpers.clickMenuItem('github-settings');
      
      await page.fill('#github-token', 'ghp_testtoken123456789012345678901234');
      
      // Set up confirmation dialog to cancel
      page.on('dialog', dialog => {
        dialog.dismiss();
      });
      
      await page.click('#clear-settings');
      await page.waitForTimeout(500);
      
      // Settings should remain
      await expect(page.locator('#github-token')).toHaveValue('ghp_testtoken123456789012345678901234');
    });
  });

  test.describe('Error Handling and Edge Cases', () => {
    test('handles network timeout during token validation', async ({ page }) => {
      // Mock network timeout
      await page.evaluate(() => {
        window.__mockGitHubApiTimeout = true;
      });
      
      await helpers.openMenu('tools');
      await helpers.clickMenuItem('github-settings');
      
      await page.fill('#github-token', 'ghp_timeouttoken123456789012345678901');
      await page.click('#validate-token');
      
      // Wait longer for timeout
      await page.waitForTimeout(3000);
      
      const tokenStatus = page.locator('#token-status');
      await expect(tokenStatus).toContainText('Token validation failed');
    });

    test('validates required fields before saving', async ({ page }) => {
      await helpers.openMenu('tools');
      await helpers.clickMenuItem('github-settings');
      
      // Try to save without token
      await page.click('#save-settings');
      
      const githubStatus = page.locator('#github-status');
      await expect(githubStatus).toContainText('Please enter a GitHub token');
      await expect(githubStatus).toHaveClass(/status-error/);
    });

    test('handles malformed token input', async ({ page }) => {
      await helpers.openMenu('tools');
      await helpers.clickMenuItem('github-settings');
      
      const malformedTokens = [
        'not-a-token',
        'ghp_',
        'ghp_short',
        '12345',
        '<script>alert("xss")</script>',
        'token with spaces',
        'ghp_' + 'x'.repeat(100) // Too long
      ];
      
      for (const token of malformedTokens) {
        await page.fill('#github-token', token);
        await page.click('#validate-token');
        await page.waitForTimeout(500);
        
        const tokenStatus = page.locator('#token-status');
        await expect(tokenStatus).toHaveClass(/status-error/);
        
        // Clear for next iteration
        await page.fill('#github-token', '');
      }
    });

    test('preserves unsaved changes when dialog is reopened', async ({ page }) => {
      await helpers.openMenu('tools');
      await helpers.clickMenuItem('github-settings');
      
      // Make changes but don't save
      await page.fill('#github-token', 'ghp_unsavedtoken123456789012345678901');
      await page.fill('#github-path', 'unsaved/path.md');
      
      // Close dialog
      await page.click('#cancel-settings');
      
      // Reopen dialog
      await helpers.openMenu('tools');
      await helpers.clickMenuItem('github-settings');
      
      // Changes should not persist (since they weren't saved)
      await expect(page.locator('#github-token')).toHaveValue('');
      await expect(page.locator('#github-path')).toHaveValue('');
    });

    test('handles concurrent dialog operations', async ({ page }) => {
      await helpers.openMenu('tools');
      await helpers.clickMenuItem('github-settings');
      
      // Try to open another settings dialog
      await page.evaluate(() => {
        if (window.githubDialog) {
          window.githubDialog.show();
        }
      });
      
      // Should still only have one dialog
      const modalCount = await page.locator('#github-modal').count();
      expect(modalCount).toBe(1);
    });
  });

  test.describe('Accessibility and Usability', () => {
    test('dialog has proper ARIA attributes', async ({ page }) => {
      await helpers.openMenu('tools');
      await helpers.clickMenuItem('github-settings');
      
      const modal = page.locator('#github-modal');
      await expect(modal).toHaveAttribute('role', 'dialog');
      await expect(modal).toHaveAttribute('aria-labelledby', 'github-title');
    });

    test('form elements are properly labeled', async ({ page }) => {
      await helpers.openMenu('tools');
      await helpers.clickMenuItem('github-settings');
      
      // Check that form inputs have associated labels
      const tokenInput = page.locator('#github-token');
      const tokenLabel = page.locator('label[for="github-token"]');
      await expect(tokenLabel).toBeVisible();
      await expect(tokenLabel).toContainText('Access Token');
      
      const repoSelect = page.locator('#github-repo');
      const repoLabel = page.locator('label[for="github-repo"]');
      await expect(repoLabel).toContainText('Select Repository');
    });

    test('supports keyboard navigation', async ({ page }) => {
      await helpers.openMenu('tools');
      await helpers.clickMenuItem('github-settings');
      
      // Tab through form elements
      await page.keyboard.press('Tab'); // Should focus token input
      await expect(page.locator('#github-token')).toBeFocused();
      
      await page.keyboard.press('Tab'); // Should focus validate button
      await expect(page.locator('#validate-token')).toBeFocused();
    });

    test('provides helpful placeholder text', async ({ page }) => {
      await helpers.openMenu('tools');
      await helpers.clickMenuItem('github-settings');
      
      await expect(page.locator('#github-token')).toHaveAttribute('placeholder', 'ghp_xxxxxxxxxxxxxxxxxxxx');
      await expect(page.locator('#github-path')).toHaveAttribute('placeholder', 'path/to/file.md');
      await expect(page.locator('#github-message')).toHaveAttribute('placeholder', 'Update from collaborative editor');
    });
  });

  // Helper function to set up GitHub API mocks
  async function setupGitHubAPIMocks(page) {
    await page.evaluate(() => {
      // Mock fetch for GitHub API calls
      const originalFetch = window.fetch;
      window.fetch = async function(url, options) {
        // Check for timeout mock
        if (window.__mockGitHubApiTimeout) {
          await new Promise(resolve => setTimeout(resolve, 10000));
          throw new Error('Network timeout');
        }
        
        // Check for API failure mock
        if (window.__mockGitHubApiFails) {
          throw new Error('API request failed');
        }
        
        // Mock user validation
        if (url === 'https://api.github.com/user') {
          const token = options?.headers?.Authorization?.replace('token ', '') || '';
          
          if (token.includes('invalid') || token.includes('timeout')) {
            return new Response(JSON.stringify({ message: 'Bad credentials' }), {
              status: 401,
              headers: { 'Content-Type': 'application/json' }
            });
          }
          
          if (token.startsWith('ghp_')) {
            return new Response(JSON.stringify({
              login: 'testuser',
              id: 12345,
              name: 'Test User'
            }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            });
          }
          
          return new Response(JSON.stringify({ message: 'Bad credentials' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        
        // Mock repositories fetch
        if (url.includes('/user/repos')) {
          return new Response(JSON.stringify([
            {
              name: 'test-repo',
              full_name: 'testuser/test-repo',
              default_branch: 'main'
            },
            {
              name: 'docs-repo',
              full_name: 'testuser/docs-repo',
              default_branch: 'main'
            },
            {
              name: 'private-repo',
              full_name: 'testuser/private-repo',
              default_branch: 'master'
            }
          ]), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        
        // Fallback to original fetch for other requests
        return originalFetch.apply(this, arguments);
      };
    });
  }
});
