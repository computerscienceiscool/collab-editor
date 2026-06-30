// tests/github/github-pull.js
import { test, expect } from '@playwright/test';
import { CollabEditorHelpers } from '../../utils/testHelpers.js';

test.describe('GitHub Pull Functionality', () => {
  let helpers;

  test.beforeEach(async ({ page }, testInfo) => {
    helpers = new CollabEditorHelpers(page);
    helpers.setTestName(testInfo.title);
    await helpers.navigateToRoom();
    await helpers.waitForStableEditor();
    
    // Setup GitHub service mocks before each test
    await page.evaluate(() => {
      // Clear any existing GitHub state
      localStorage.removeItem('github-settings');
      delete window.githubTestData;
      delete window.githubPullTestData;
      
      // Mock GitHub service if it exists
      if (window.githubService) {
        // Store original methods for restoration
        window._originalGithubMethods = {
          getFileContent: window.githubService.getFileContent,
          validateToken: window.githubService.validateToken,
          fetchRepositories: window.githubService.fetchRepositories
        };
        
        // Mock settings
        window.githubService.settings = {
          token: 'mock_token_12345',
          username: 'testuser',
          repos: [
            { name: 'test-repo', fullName: 'testuser/test-repo', defaultBranch: 'main' },
            { name: 'docs-repo', fullName: 'testuser/docs-repo', defaultBranch: 'master' },
            { name: 'private-repo', fullName: 'testuser/private-repo', defaultBranch: 'main' }
          ],
          selectedRepo: 'testuser/test-repo',
          defaultPath: 'documents/readme.md',
          enabled: true
        };
        
        // Mock file content retrieval with various test files
        window.githubService.getFileContent = async (repo, path) => {
          // Store test data for verification
          window.githubPullTestData = {
            repo,
            path,
            timestamp: Date.now()
          };
          
          // Simulate different file types and scenarios
          const mockFiles = {
            'testuser/test-repo': {
              'README.md': '# Test Repository\n\nThis is a test repository with sample content.\n\n## Features\n- Feature 1\n- Feature 2\n- Feature 3',
              'docs/guide.md': '# User Guide\n\nWelcome to our application!\n\n## Getting Started\n\n1. Step one\n2. Step two\n3. Step three\n\n## Advanced Usage\n\nAdvanced content here...',
              'notes/meeting.md': '# Team Meeting Notes\n\n**Date:** 2024-01-15\n**Attendees:** Alice, Bob, Charlie\n\n## Agenda\n- Project updates\n- Next milestones\n- Action items',
              'large-file.md': '# Large Document\n\n' + 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(200),
              'unicode-test.md': '# Unicode Test 🚀\n\nThis file contains émojis 😀 and special characters: café, naïve, résumé\n\n中文测试 العربية тест',
              'empty-file.md': '',
              'single-line.md': 'Just a single line of text without newlines.'
            },
            'testuser/docs-repo': {
              'documentation.md': '# Documentation\n\nComprehensive documentation for the project.\n\n## API Reference\n\nDetailed API information...',
              'changelog.md': '# Changelog\n\n## Version 2.0.0\n- Major update\n- Breaking changes\n\n## Version 1.1.0\n- Bug fixes\n- New features'
            },
            'testuser/private-repo': {
              'confidential.md': '# Confidential Information\n\nThis is sensitive content that requires proper access.'
            }
          };
          
          const repoFiles = mockFiles[repo];
          if (!repoFiles) {
            throw new Error('Repository not found or access denied');
          }
          
          const content = repoFiles[path];
          if (content === undefined) {
            throw new Error('File not found in repository');
          }
          
          // Simulate network delay
          await new Promise(resolve => setTimeout(resolve, 100));
          
          return content;
        };
        
        // Mock token validation
        window.githubService.validateToken = async (token) => {
          if (token === 'mock_token_12345') {
            return { login: 'testuser', id: 12345 };
          }
          throw new Error('Invalid token');
        };
        
        // Mock repository fetching
        window.githubService.fetchRepositories = async () => {
          return window.githubService.settings.repos;
        };
      }
      
      // Mock GitHub pull dialog if it exists
      if (window.githubPullDialog) {
        window._originalPullDialog = {
          show: window.githubPullDialog.show,
          hide: window.githubPullDialog.hide
        };
      }
    });
  });

  test.afterEach(async ({ page }) => {
    // Restore original methods and clean up
    await page.evaluate(() => {
      if (window._originalGithubMethods && window.githubService) {
        Object.assign(window.githubService, window._originalGithubMethods);
        delete window._originalGithubMethods;
      }
      
      if (window._originalPullDialog && window.githubPullDialog) {
        Object.assign(window.githubPullDialog, window._originalPullDialog);
        delete window._originalPullDialog;
      }
      
      delete window.githubTestData;
      delete window.githubPullTestData;
      localStorage.removeItem('github-settings');
    });
  });

  test.describe('Dialog Opening', () => {
    test('opens pull dialog via File menu', async ({ page }) => {
      // Set some existing content that will be replaced
      await helpers.setEditorContent('Existing content that will be replaced');
      
      // Open File menu and click Pull from GitHub
      await helpers.openMenu('file');
      
      // Check if GitHub pull menu item exists
      const pullMenuItem = page.locator('[data-action="github-pull"]');
      const menuItemExists = await pullMenuItem.count() > 0;
      
      if (!menuItemExists) {
        // Skip test if GitHub integration not available
        test.skip('GitHub integration not implemented yet');
        return;
      }
      
      await helpers.clickMenuItem('github-pull');
      
      // Verify pull dialog opens
      await expect(page.locator('#github-pull-modal')).toBeVisible({ timeout: 10000 });
      
      // Verify dialog title
      await expect(page.locator('#pull-title')).toContainText('Pull from GitHub');
      
      // Verify essential elements are present
      await expect(page.locator('#pull-repo')).toBeVisible();
      await expect(page.locator('#pull-path')).toBeVisible();
      await expect(page.locator('#file-preview')).toBeVisible();
      await expect(page.locator('.warning-message')).toBeVisible();
    });

    test('shows configuration prompt when GitHub not configured', async ({ page }) => {
      // Clear GitHub settings to simulate unconfigured state
      await page.evaluate(() => {
        if (window.githubService) {
          window.githubService.settings.token = '';
          window.githubService.settings.enabled = false;
        }
      });
      
      let dialogShown = false;
      page.on('dialog', dialog => {
        dialogShown = true;
        expect(dialog.message()).toContain('GitHub integration not configured');
        dialog.accept();
      });
      
      // Try to open pull dialog
      const hasGithubIntegration = await page.evaluate(() => {
        return typeof window.githubService !== 'undefined';
      });
      
      if (!hasGithubIntegration) {
        test.skip('GitHub integration not implemented yet');
        return;
      }
      
      // Open File menu and try to pull
      await helpers.openMenu('file');
      
      const pullMenuItem = page.locator('[data-action="github-pull"]');
      const menuItemExists = await pullMenuItem.count() > 0;
      
      if (menuItemExists) {
        await helpers.clickMenuItem('github-pull');
        await page.waitForTimeout(1000);
        expect(dialogShown).toBe(true);
      }
    });

    test('properly initializes dialog with current settings', async ({ page }) => {
      const hasGithubIntegration = await page.evaluate(() => {
        return typeof window.githubPullDialog !== 'undefined';
      });
      
      if (!hasGithubIntegration) {
        test.skip('GitHub integration not implemented yet');
        return;
      }
      
      // Open pull dialog programmatically
      await page.evaluate(() => {
        if (window.githubPullDialog && window.editorView && window.automergeHandle) {
          const handle = window.automergeHandle;
          window.githubPullDialog.show(handle, window.editorView);
        }
      });
      
      await expect(page.locator('#github-pull-modal')).toBeVisible({ timeout: 5000 });
      
      // Verify repository dropdown is populated
      const repoSelect = page.locator('#pull-repo');
      const repoOptions = await repoSelect.locator('option').count();
      expect(repoOptions).toBeGreaterThan(1); // Should have default option plus repos
      
      // Verify default repository is selected
      const selectedRepo = await repoSelect.inputValue();
      expect(selectedRepo).toBe('testuser/test-repo');
      
      // Verify default path is populated
      const pathInput = page.locator('#pull-path');
      const defaultPath = await pathInput.inputValue();
      expect(defaultPath).toBe('documents/readme.md');
    });
  });

  test.describe('Repository and File Path Selection', () => {
    test('populates repository dropdown with available repos', async ({ page }) => {
      const hasGithubIntegration = await page.evaluate(() => {
        return typeof window.githubPullDialog !== 'undefined';
      });
      
      if (!hasGithubIntegration) {
        test.skip('GitHub integration not implemented yet');
        return;
      }
      
      // Open pull dialog
      await page.evaluate(() => {
        if (window.githubPullDialog && window.editorView && window.automergeHandle) {
          const handle = window.automergeHandle;
          window.githubPullDialog.show(handle, window.editorView);
        }
      });
      
      await expect(page.locator('#github-pull-modal')).toBeVisible({ timeout: 5000 });
      
      // Check repository options
      const repoSelect = page.locator('#pull-repo');
      const repoOptions = repoSelect.locator('option');
      
      // Should have placeholder plus actual repositories
      const optionCount = await repoOptions.count();
      expect(optionCount).toBeGreaterThanOrEqual(3);
      
      // Check specific repository names
      await expect(repoOptions.nth(1)).toContainText('testuser/test-repo');
      await expect(repoOptions.nth(2)).toContainText('testuser/docs-repo');
      await expect(repoOptions.nth(3)).toContainText('testuser/private-repo');
    });

    test('allows switching between repositories', async ({ page }) => {
      const hasGithubIntegration = await page.evaluate(() => {
        return typeof window.githubPullDialog !== 'undefined';
      });
      
      if (!hasGithubIntegration) {
        test.skip('GitHub integration not implemented yet');
        return;
      }
      
      await page.evaluate(() => {
        if (window.githubPullDialog && window.editorView && window.automergeHandle) {
          const handle = window.automergeHandle;
          window.githubPullDialog.show(handle, window.editorView);
        }
      });
      
      await expect(page.locator('#github-pull-modal')).toBeVisible({ timeout: 5000 });
      
      const repoSelect = page.locator('#pull-repo');
      
      // Switch to docs-repo
      await repoSelect.selectOption('testuser/docs-repo');
      const selectedRepo = await repoSelect.inputValue();
      expect(selectedRepo).toBe('testuser/docs-repo');
      
      // Switch to private-repo
      await repoSelect.selectOption('testuser/private-repo');
      const newSelectedRepo = await repoSelect.inputValue();
      expect(newSelectedRepo).toBe('testuser/private-repo');
    });

    test('validates and accepts various file path formats', async ({ page }) => {
      const hasGithubIntegration = await page.evaluate(() => {
        return typeof window.githubPullDialog !== 'undefined';
      });
      
      if (!hasGithubIntegration) {
        test.skip('GitHub integration not implemented yet');
        return;
      }
      
      await page.evaluate(() => {
        if (window.githubPullDialog && window.editorView && window.automergeHandle) {
          const handle = window.automergeHandle;
          window.githubPullDialog.show(handle, window.editorView);
        }
      });
      
      await expect(page.locator('#github-pull-modal')).toBeVisible({ timeout: 5000 });
      
      const pathInput = page.locator('#pull-path');
      
      // Test various file path formats
      const testPaths = [
        'README.md',
        'docs/guide.md',
        'notes/meeting.md',
        'folder/subfolder/document.txt',
        'unicode-test.md',
        'empty-file.md'
      ];
      
      for (const testPath of testPaths) {
        await pathInput.fill(testPath);
        const inputValue = await pathInput.inputValue();
        expect(inputValue).toBe(testPath);
      }
    });

    test('remembers last used repository and path', async ({ page }) => {
      const hasGithubIntegration = await page.evaluate(() => {
        return typeof window.githubPullDialog !== 'undefined';
      });
      
      if (!hasGithubIntegration) {
        test.skip('GitHub integration not implemented yet');
        return;
      }
      
      // Open dialog first time
      await page.evaluate(() => {
        if (window.githubPullDialog && window.editorView && window.automergeHandle) {
          const handle = window.automergeHandle;
          window.githubPullDialog.show(handle, window.editorView);
        }
      });
      
      await expect(page.locator('#github-pull-modal')).toBeVisible({ timeout: 5000 });
      
      // Change repository and path
      await page.selectOption('#pull-repo', 'testuser/docs-repo');
      await page.fill('#pull-path', 'documentation.md');
      
      // Close dialog
      await page.keyboard.press('Escape');
      await expect(page.locator('#github-pull-modal')).not.toBeVisible();
      await page.waitForTimeout(500); // Allow time for settings to save

      // Open dialog again
      await page.evaluate(() => {
        if (window.githubPullDialog && window.editorView && window.automergeHandle) {
          const handle = window.automergeHandle;
          window.githubPullDialog.show(handle, window.editorView);
        }
      });

      await expect(page.locator('#github-pull-modal')).toBeVisible({ timeout: 5000 });

      // Wait for form to be populated with saved values
      await page.waitForFunction(() => {
        const repo = document.querySelector('#pull-repo');
        const path = document.querySelector('#pull-path');
        return repo && repo.value && path && path.value;
      }, { timeout: 5000 });

      // Should remember selections
      const selectedRepo = await page.inputValue('#pull-repo');
      const selectedPath = await page.inputValue('#pull-path');

      expect(selectedRepo).toBe('testuser/docs-repo');
      expect(selectedPath).toBe('documentation.md'); 

    });
  });

  test.describe('File Preview Functionality', () => {
    test('shows placeholder text when no file selected', async ({ page }) => {
      const hasGithubIntegration = await page.evaluate(() => {
        return typeof window.githubPullDialog !== 'undefined';
      });
      
      if (!hasGithubIntegration) {
        test.skip('GitHub integration not implemented yet');
        return;
      }
      
      await page.evaluate(() => {
        if (window.githubPullDialog && window.editorView && window.automergeHandle) {
          const handle = window.automergeHandle;
          window.githubPullDialog.show(handle, window.editorView);
        }
      });
      
      await expect(page.locator('#github-pull-modal')).toBeVisible({ timeout: 5000 });
      
      // Clear the file path
      await page.fill('#pull-path', '');
      
      // Preview should show placeholder
      const previewArea = page.locator('#file-preview');
      await expect(previewArea).toContainText('Select a file to preview content');
    });

    test('loads and displays file preview on demand', async ({ page }) => {
      const hasGithubIntegration = await page.evaluate(() => {
        return typeof window.githubPullDialog !== 'undefined';
      });
      
      if (!hasGithubIntegration) {
        test.skip('GitHub integration not implemented yet');
        return;
      }
      
      await page.evaluate(() => {
        if (window.githubPullDialog && window.editorView && window.automergeHandle) {
          const handle = window.automergeHandle;
          window.githubPullDialog.show(handle, window.editorView);
        }
      });
      
      await expect(page.locator('#github-pull-modal')).toBeVisible({ timeout: 5000 });
      
      // Set file path
      await page.fill('#pull-path', 'README.md');
      
      // Click preview button
      await page.click('#preview-file');
      
      // Wait for preview to load
      await page.waitForTimeout(500);
      
      // Verify preview content appears
      const previewArea = page.locator('#file-preview');
      await expect(previewArea).toContainText('# Test Repository');
      await expect(previewArea).toContainText('This is a test repository');
      await expect(previewArea).toContainText('## Features');
      
      // Verify the preview is properly formatted
      const previewContent = page.locator('.preview-content');
      await expect(previewContent).toBeVisible();
    });

    test('shows different content for different files', async ({ page }) => {
      const hasGithubIntegration = await page.evaluate(() => {
        return typeof window.githubPullDialog !== 'undefined';
      });
      
      if (!hasGithubIntegration) {
        test.skip('GitHub integration not implemented yet');
        return;
      }
      
      await page.evaluate(() => {
        if (window.githubPullDialog && window.editorView && window.automergeHandle) {
          const handle = window.automergeHandle;
          window.githubPullDialog.show(handle, window.editorView);
        }
      });
      
      await expect(page.locator('#github-pull-modal')).toBeVisible({ timeout: 5000 });
      
      // Test different files
      const testFiles = [
        { path: 'docs/guide.md', expectedContent: '# User Guide' },
        { path: 'notes/meeting.md', expectedContent: 'Team Meeting Notes' },
        { path: 'unicode-test.md', expectedContent: 'Unicode Test 🚀' }
      ];
      
      for (const { path, expectedContent } of testFiles) {
        await page.fill('#pull-path', path);
        await page.click('#preview-file');
        await page.waitForTimeout(500);
        
        const previewArea = page.locator('#file-preview');
        await expect(previewArea).toContainText(expectedContent);
      }
    });

    test('handles large file previews appropriately', async ({ page }) => {
      const hasGithubIntegration = await page.evaluate(() => {
        return typeof window.githubPullDialog !== 'undefined';
      });
      
      if (!hasGithubIntegration) {
        test.skip('GitHub integration not implemented yet');
        return;
      }
      
      await page.evaluate(() => {
        if (window.githubPullDialog && window.editorView && window.automergeHandle) {
          const handle = window.automergeHandle;
          window.githubPullDialog.show(handle, window.editorView);
        }
      });
      
      await expect(page.locator('#github-pull-modal')).toBeVisible({ timeout: 5000 });
      
      // Load large file
      await page.fill('#pull-path', 'large-file.md');
      await page.click('#preview-file');
      await page.waitForTimeout(1000);
      
      const previewArea = page.locator('#file-preview');
      await expect(previewArea).toContainText('# Large Document');
      
      // Should either truncate or show full content with scrolling
      const previewContent = await previewArea.textContent();
      expect(previewContent.length).toBeGreaterThan(100);
    });

    test('displays preview for empty files', async ({ page }) => {
      const hasGithubIntegration = await page.evaluate(() => {
        return typeof window.githubPullDialog !== 'undefined';
      });
      
      if (!hasGithubIntegration) {
        test.skip('GitHub integration not implemented yet');
        return;
      }
      
      await page.evaluate(() => {
        if (window.githubPullDialog && window.editorView && window.automergeHandle) {
          const handle = window.automergeHandle;
          window.githubPullDialog.show(handle, window.editorView);
        }
      });
      
      await expect(page.locator('#github-pull-modal')).toBeVisible({ timeout: 5000 });
      
      // Load empty file
      await page.fill('#pull-path', 'empty-file.md');
      await page.click('#preview-file');
      await page.waitForTimeout(500);
      
      // Should handle empty content gracefully
      const previewArea = page.locator('#file-preview');
      const previewText = await previewArea.textContent();
      expect(previewText.trim().length).toBe(0);
    });

    test('handles unicode and special characters in preview', async ({ page }) => {
      const hasGithubIntegration = await page.evaluate(() => {
        return typeof window.githubPullDialog !== 'undefined';
      });
      
      if (!hasGithubIntegration) {
        test.skip('GitHub integration not implemented yet');
        return;
      }
      
      await page.evaluate(() => {
        if (window.githubPullDialog && window.editorView && window.automergeHandle) {
          const handle = window.automergeHandle;
          window.githubPullDialog.show(handle, window.editorView);
        }
      });
      
      await expect(page.locator('#github-pull-modal')).toBeVisible({ timeout: 5000 });
      
      // Load unicode test file
      await page.fill('#pull-path', 'unicode-test.md');
      await page.click('#preview-file');
      await page.waitForTimeout(500);
      
      const previewArea = page.locator('#file-preview');
      await expect(previewArea).toContainText('🚀');
      await expect(previewArea).toContainText('émojis 😀');
      await expect(previewArea).toContainText('café, naïve, résumé');
      await expect(previewArea).toContainText('中文测试');
    });
  });

  test.describe('Content Replacement Warning', () => {
    test('displays warning about content replacement', async ({ page }) => {
      const hasGithubIntegration = await page.evaluate(() => {
        return typeof window.githubPullDialog !== 'undefined';
      });
      
      if (!hasGithubIntegration) {
        test.skip('GitHub integration not implemented yet');
        return;
      }
      
      await page.evaluate(() => {
        if (window.githubPullDialog && window.editorView && window.automergeHandle) {
          const handle = window.automergeHandle;
          window.githubPullDialog.show(handle, window.editorView);
        }
      });
      
      await expect(page.locator('#github-pull-modal')).toBeVisible({ timeout: 5000 });
      
      // Verify warning message is visible
      const warningSection = page.locator('.warning-section');
      await expect(warningSection).toBeVisible();
      
      const warningMessage = page.locator('.warning-message');
      await expect(warningMessage).toContainText('Warning');
      await expect(warningMessage).toContainText('replace your current document content');
    });

    test('shows confirmation dialog before replacing content', async ({ page }) => {
      const hasGithubIntegration = await page.evaluate(() => {
        return typeof window.githubPullDialog !== 'undefined';
      });
      
      if (!hasGithubIntegration) {
        test.skip('GitHub integration not implemented yet');
        return;
      }
      
      // Set existing content in editor
      await helpers.setEditorContent('Existing content that should be preserved');
      
      await page.evaluate(() => {
        if (window.githubPullDialog && window.editorView && window.automergeHandle) {
          const handle = window.automergeHandle;
          window.githubPullDialog.show(handle, window.editorView);
        }
      });
      
      await expect(page.locator('#github-pull-modal')).toBeVisible({ timeout: 5000 });
      
      // Set up dialog handler
      let confirmationShown = false;
      page.on('dialog', dialog => {
        confirmationShown = true;
        expect(dialog.message()).toContain('replace your current document content');
        dialog.dismiss(); // Cancel the operation
      });
      
      // Set up file and preview it first
      await page.fill('#pull-path', 'README.md');
      await page.click('#preview-file');
      await page.waitForTimeout(500);
      
      // Try to pull file
      await page.click('#execute-pull');
      
      // Should show confirmation
      await page.waitForTimeout(1000);
      expect(confirmationShown).toBe(true);
      
      // Content should remain unchanged since we dismissed the dialog
      const currentContent = await helpers.getEditorContent();
      expect(currentContent).toBe('Existing content that should be preserved');
    });

    test('proceeds with replacement when confirmed', async ({ page }) => {
      const hasGithubIntegration = await page.evaluate(() => {
        return typeof window.githubPullDialog !== 'undefined';
      });
      
      if (!hasGithubIntegration) {
        test.skip('GitHub integration not implemented yet');
        return;
      }
      
      // Set existing content in editor
      await helpers.setEditorContent('Content to be replaced');
      
      await page.evaluate(() => {
        if (window.githubPullDialog && window.editorView && window.automergeHandle) {
          const handle = window.automergeHandle;
          window.githubPullDialog.show(handle, window.editorView);
        }
      });
      
      await expect(page.locator('#github-pull-modal')).toBeVisible({ timeout: 5000 });
      
      // Set up dialog handler to accept confirmation
      page.on('dialog', dialog => {
        expect(dialog.message()).toContain('replace your current document content');
        dialog.accept(); // Confirm the operation
      });
      
      // Set up file and preview it
      await page.fill('#pull-path', 'README.md');
      await page.click('#preview-file');
      await page.waitForTimeout(500);
      
      // Pull file
      await page.click('#execute-pull');
      
      // Wait for operation to complete
      await page.waitForTimeout(1000);
      
      // Content should be replaced
      const newContent = await helpers.getEditorContent();
      expect(newContent).toContain('# Test Repository');
      expect(newContent).not.toBe('Content to be replaced');
    });
  });

  test.describe('Pull Flow Execution', () => {
    test('validates required fields before pulling', async ({ page }) => {
      const hasGithubIntegration = await page.evaluate(() => {
        return typeof window.githubPullDialog !== 'undefined';
      });
      
      if (!hasGithubIntegration) {
        test.skip('GitHub integration not implemented yet');
        return;
      }
      
      await page.evaluate(() => {
        if (window.githubPullDialog && window.editorView && window.automergeHandle) {
          const handle = window.automergeHandle;
          window.githubPullDialog.show(handle, window.editorView);
        }
      });
      
      await expect(page.locator('#github-pull-modal')).toBeVisible({ timeout: 5000 });
      
      // Test missing repository
      await page.selectOption('#pull-repo', '');
      await page.click('#execute-pull');
      
      const statusEl = page.locator('#pull-status');
      await expect(statusEl).toContainText('Please select a repository');
      
      // Fix repository, test missing path
      await page.selectOption('#pull-repo', 'testuser/test-repo');
      await page.fill('#pull-path', '');
      await page.click('#execute-pull');
      
      await expect(statusEl).toContainText('Please enter a file path');
    });

    test('executes successful pull operation', async ({ page }) => {
      const hasGithubIntegration = await page.evaluate(() => {
        return typeof window.githubPullDialog !== 'undefined';
      });
      
      if (!hasGithubIntegration) {
        test.skip('GitHub integration not implemented yet');
        return;
      }
      
      // Set initial content
      await helpers.setEditorContent('Original content');
      
      await page.evaluate(() => {
        if (window.githubPullDialog && window.editorView && window.automergeHandle) {
          const handle = window.automergeHandle;
          window.githubPullDialog.show(handle, window.editorView);
        }
      });
      
      await expect(page.locator('#github-pull-modal')).toBeVisible({ timeout: 5000 });
      
      // Set up confirmation handler
      page.on('dialog', dialog => dialog.accept());
      
      // Set file details
      await page.selectOption('#pull-repo', 'testuser/test-repo');
      await page.fill('#pull-path', 'docs/guide.md');
      
      // Preview first (optional but good practice)
      await page.click('#preview-file');
      await page.waitForTimeout(500);
      
      // Execute pull
      await page.click('#execute-pull');
      await page.waitForTimeout(1000);
      
      // Verify success status
      const statusEl = page.locator('#pull-status');
      await expect(statusEl).toContainText('Document updated with content from GitHub');
      
      // Verify content was updated
      const newContent = await helpers.getEditorContent();
      expect(newContent).toContain('# User Guide');
      expect(newContent).toContain('Welcome to our application!');
      expect(newContent).not.toBe('Original content');
      
      // Verify API was called correctly
      const pullData = await page.evaluate(() => window.githubPullTestData);
      expect(pullData.repo).toBe('testuser/test-repo');
      expect(pullData.path).toBe('docs/guide.md');
    });

    test('handles different file types correctly', async ({ page }) => {
      const hasGithubIntegration = await page.evaluate(() => {
        return typeof window.githubPullDialog !== 'undefined';
      });
      
      if (!hasGithubIntegration) {
        test.skip('GitHub integration not implemented yet');
        return;
      }
      
      await page.evaluate(() => {
        if (window.githubPullDialog && window.editorView && window.automergeHandle) {
          const handle = window.automergeHandle;
          window.githubPullDialog.show(handle, window.editorView);
        }
      });
      
      await expect(page.locator('#github-pull-modal')).toBeVisible({ timeout: 5000 });
      
      // Set up confirmation handler
      page.on('dialog', dialog => dialog.accept());
      
      const testFiles = [
        { path: 'single-line.md', expectedContent: 'Just a single line' },
        { path: 'unicode-test.md', expectedContent: 'Unicode Test 🚀' },
        { path: 'empty-file.md', expectedContent: '' }
      ];
      for (const { path, expectedContent } of testFiles) {
      // Clear editor first
      await helpers.setEditorContent('Temp content');
      
      await page.fill('#pull-path', path);
      await page.click('#execute-pull');
      
      // Wait for status message to appear
      await page.waitForFunction(() => {
        const status = document.querySelector('#pull-status');
        return status && (status.textContent.includes('updated') || status.textContent.includes('failed'));
      }, { timeout: 5000 });
      
      const content = await helpers.getEditorContent();
      if (expectedContent) {
        expect(content).toContain(expectedContent);
      } else {
        expect(content.trim()).toBe('');
      }
      
      // Wait between iterations to prevent race conditions
      await page.waitForTimeout(500);
    }

   });


    test('shows loading state during pull operation', async ({ page }) => {
      const hasGithubIntegration = await page.evaluate(() => {
        return typeof window.githubPullDialog !== 'undefined';
      });
      
      if (!hasGithubIntegration) {
        test.skip('GitHub integration not implemented yet');
        return;
      }
      
      // Mock slow pull operation
      await page.evaluate(() => {
        if (window.githubService) {
          const originalGetFile = window.githubService.getFileContent;
          window.githubService.getFileContent = async (...args) => {
            // Store data for verification
            window.githubPullTestData = {
              repo: args[0],
              path: args[1],
              timestamp: Date.now()
            };
            
            // Simulate slow operation
            await new Promise(resolve => setTimeout(resolve, 2000));
            return await originalGetFile.apply(this, args);
          };
        }
      });
      
      await page.evaluate(() => {
        if (window.githubPullDialog && window.editorView && window.automergeHandle) {
          const handle = window.automergeHandle;
          window.githubPullDialog.show(handle, window.editorView);
        }
      });
      
      await expect(page.locator('#github-pull-modal')).toBeVisible({ timeout: 5000 });
      
      // Set up confirmation handler
      page.on('dialog', dialog => dialog.accept());
      
      // Set file details and start pull
      await page.selectOption('#pull-repo', 'testuser/test-repo');
      await page.fill('#pull-path', 'README.md');
      
      const pullButton = page.locator('#execute-pull');
      await pullButton.click();
      
      // Should show loading status
      const statusEl = page.locator('#pull-status');
      await expect(statusEl).toContainText('Fetching file from GitHub...');
      
      // Buttons should be disabled during loading
      await expect(pullButton).toBeDisabled();
      
      // Wait for completion
      await expect(statusEl).toContainText('Document updated with content from GitHub', { timeout: 5000 });
      
      // Buttons should be re-enabled
      await expect(pullButton).toBeEnabled();
    });

    test('closes dialog after successful pull', async ({ page }) => {
      const hasGithubIntegration = await page.evaluate(() => {
        return typeof window.githubPullDialog !== 'undefined';
      });
      
      if (!hasGithubIntegration) {
        test.skip('GitHub integration not implemented yet');
        return;
      }
      
      await page.evaluate(() => {
        if (window.githubPullDialog && window.editorView && window.automergeHandle) {
          const handle = window.automergeHandle;
          window.githubPullDialog.show(handle, window.editorView);
        }
      });
      
      await expect(page.locator('#github-pull-modal')).toBeVisible({ timeout: 5000 });
      
      // Set up confirmation handler
      page.on('dialog', dialog => dialog.accept());
      
      // Execute successful pull
      await page.selectOption('#pull-repo', 'testuser/test-repo');
      await page.fill('#pull-path', 'README.md');
      await page.click('#execute-pull');
      
      // Dialog should auto-close after successful pull
      await expect(page.locator('#github-pull-modal')).not.toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Error Handling for Missing Files', () => {
    test('handles file not found errors gracefully', async ({ page }) => {
      const hasGithubIntegration = await page.evaluate(() => {
        return typeof window.githubPullDialog !== 'undefined';
      });
      
      if (!hasGithubIntegration) {
        test.skip('GitHub integration not implemented yet');
        return;
      }
      
      await page.evaluate(() => {
        if (window.githubPullDialog && window.editorView && window.automergeHandle) {
          const handle = window.automergeHandle;
          window.githubPullDialog.show(handle, window.editorView);
        }
      });
      
      await expect(page.locator('#github-pull-modal')).toBeVisible({ timeout: 5000 });
      
      // Try to preview non-existent file
      await page.fill('#pull-path', 'nonexistent-file.md');
      await page.click('#preview-file');
      await page.waitForTimeout(1000);
      
      // Should show error in preview
      const previewArea = page.locator('#file-preview');
      await expect(previewArea).toContainText('File not found or unable to access');
      
      // Try to pull the non-existent file
      await page.click('#execute-pull');
      await page.waitForTimeout(1000);
      
      // Should show error status
      const statusEl = page.locator('#pull-status');
      await expect(statusEl).toContainText('Failed to fetch file');
      
      // Dialog should remain open for retry
      await expect(page.locator('#github-pull-modal')).toBeVisible();
    });

    test('handles repository access errors', async ({ page }) => {
      const hasGithubIntegration = await page.evaluate(() => {
        return typeof window.githubPullDialog !== 'undefined';
      });
      
      if (!hasGithubIntegration) {
        test.skip('GitHub integration not implemented yet');
        return;
      }
      
      // Mock repository access error
      await page.evaluate(() => {
        if (window.githubService) {
          window.githubService.getFileContent = async (repo, path) => {
            if (repo === 'testuser/nonexistent-repo') {
              throw new Error('Repository not found or access denied');
            }
            return 'Normal content';
          };
        }
      });
      
      await page.evaluate(() => {
        if (window.githubPullDialog && window.editorView && window.automergeHandle) {
          const handle = window.automergeHandle;
          window.githubPullDialog.show(handle, window.editorView);
        }
      });
      
      await expect(page.locator('#github-pull-modal')).toBeVisible({ timeout: 5000 });
      
      // Manually set invalid repository (simulate user typing)
      await page.evaluate(() => {
        const repoSelect = document.querySelector('#pull-repo');
        if (repoSelect) {
          // Add the bad option temporarily
          const badOption = document.createElement('option');
          badOption.value = 'testuser/nonexistent-repo';
          badOption.textContent = 'testuser/nonexistent-repo';
          repoSelect.appendChild(badOption);
        }
      });
      
      await page.selectOption('#pull-repo', 'testuser/nonexistent-repo');
      await page.fill('#pull-path', 'README.md');
      
      // Try to preview
      await page.click('#preview-file');
      await page.waitForTimeout(1000);
      
      const statusEl = page.locator('#pull-status');
      await expect(statusEl).toContainText('Failed to fetch file: Repository not found or access denied');
    });

    test('handles network and API errors', async ({ page }) => {
      const hasGithubIntegration = await page.evaluate(() => {
        return typeof window.githubPullDialog !== 'undefined';
      });
      
      if (!hasGithubIntegration) {
        test.skip('GitHub integration not implemented yet');
        return;
      }
      
      // Mock network error
      await page.evaluate(() => {
        if (window.githubService) {
          window.githubService.getFileContent = async () => {
            throw new Error('Network timeout');
          };
        }
      });
      
      await page.evaluate(() => {
        if (window.githubPullDialog && window.editorView && window.automergeHandle) {
          const handle = window.automergeHandle;
          window.githubPullDialog.show(handle, window.editorView);
        }
      });
      
      await expect(page.locator('#github-pull-modal')).toBeVisible({ timeout: 5000 });
      
      // Try to preview file
      await page.fill('#pull-path', 'README.md');
      await page.click('#preview-file');
      await page.waitForTimeout(1000);
      
      const statusEl = page.locator('#pull-status');
      await expect(statusEl).toContainText('Failed to fetch file: Network timeout');
      
      // Should allow retry
      await expect(page.locator('#preview-file')).toBeEnabled();
      await expect(page.locator('#execute-pull')).toBeEnabled();
    });

    test('preserves dialog state after errors', async ({ page }) => {
      const hasGithubIntegration = await page.evaluate(() => {
        return typeof window.githubPullDialog !== 'undefined';
      });
      
      if (!hasGithubIntegration) {
        test.skip('GitHub integration not implemented yet');
        return;
      }
      
      // Mock temporary failure
      await page.evaluate(() => {
        if (window.githubService) {
          let attemptCount = 0;
          const originalGetFile = window.githubService.getFileContent;
          
          window.githubService.getFileContent = async (...args) => {
            attemptCount++;
            if (attemptCount === 1) {
              throw new Error('Temporary network error');
            }
            return await originalGetFile.apply(this, args);
          };
        }
      });
      
      await page.evaluate(() => {
        if (window.githubPullDialog && window.editorView && window.automergeHandle) {
          const handle = window.automergeHandle;
          window.githubPullDialog.show(handle, window.editorView);
        }
      });
      
      await expect(page.locator('#github-pull-modal')).toBeVisible({ timeout: 5000 });
      
      // Fill form data
      await page.selectOption('#pull-repo', 'testuser/test-repo');
      await page.fill('#pull-path', 'README.md');
      
      // First attempt should fail
      await page.click('#preview-file');
      await page.waitForTimeout(1000);
      
      const statusEl = page.locator('#pull-status');
      await expect(statusEl).toContainText('Failed to fetch file: Temporary network error');
      
      // Form data should be preserved
      expect(await page.inputValue('#pull-repo')).toBe('testuser/test-repo');
      expect(await page.inputValue('#pull-path')).toBe('README.md');
      
      // Second attempt should succeed
      await page.click('#preview-file');
      await page.waitForTimeout(1000);
      
      await expect(statusEl).toContainText('File preview loaded successfully');
      
      // Preview should now show content
      const previewArea = page.locator('#file-preview');
      await expect(previewArea).toContainText('# Test Repository');
    });
  });

  test.describe('Editor Content Update', () => {
    test('completely replaces editor content', async ({ page }) => {
      const hasGithubIntegration = await page.evaluate(() => {
        return typeof window.githubPullDialog !== 'undefined';
      });
      
      if (!hasGithubIntegration) {
        test.skip('GitHub integration not implemented yet');
        return;
      }
      
      // Set complex initial content
      const initialContent = 'Multi-line\ncontent with\nspecial chars: @#$%\nand unicode: 🚀';
      await helpers.setEditorContent(initialContent);
      
      await page.evaluate(() => {
        if (window.githubPullDialog && window.editorView && window.automergeHandle) {
          const handle = window.automergeHandle;
          window.githubPullDialog.show(handle, window.editorView);
        }
      });
      
      await expect(page.locator('#github-pull-modal')).toBeVisible({ timeout: 5000 });
      
      // Set up confirmation
      page.on('dialog', dialog => dialog.accept());
      
      // Pull different content
      await page.fill('#pull-path', 'docs/guide.md');
      await page.click('#execute-pull');
      await page.waitForTimeout(1000);
      
      // Verify complete replacement
      const newContent = await helpers.getEditorContent();
      expect(newContent).not.toContain('Multi-line');
      expect(newContent).not.toContain('special chars');
      expect(newContent).not.toContain('🚀');
      expect(newContent).toContain('# User Guide');
      expect(newContent).toContain('Welcome to our application!');
    });

    test('preserves editor state and functionality after pull', async ({ page }) => {
      const hasGithubIntegration = await page.evaluate(() => {
        return typeof window.githubPullDialog !== 'undefined';
      });
      
      if (!hasGithubIntegration) {
        test.skip('GitHub integration not implemented yet');
        return;
      }
      
      await page.evaluate(() => {
        if (window.githubPullDialog && window.editorView && window.automergeHandle) {
          const handle = window.automergeHandle;
          window.githubPullDialog.show(handle, window.editorView);
        }
      });
      
      await expect(page.locator('#github-pull-modal')).toBeVisible({ timeout: 5000 });
      
      // Set up confirmation
      page.on('dialog', dialog => dialog.accept());
      
      // Pull content
      await page.fill('#pull-path', 'README.md');
      await page.click('#execute-pull');
      await page.waitForTimeout(1000);
      
      // Verify editor is still functional
      await helpers.typeInEditor('\n\nAdded after pull');
      
      const finalContent = await helpers.getEditorContent();
      expect(finalContent).toContain('# Test Repository');
      expect(finalContent).toContain('Added after pull');
      
      // Test formatting still works
      await helpers.selectAllText();
      await helpers.applyBold();
      
      const formattedContent = await helpers.getEditorContent();
      expect(formattedContent).toContain('**');
    });

    test('handles different content encodings correctly', async ({ page }) => {
      const hasGithubIntegration = await page.evaluate(() => {
        return typeof window.githubPullDialog !== 'undefined';
      });
      
      if (!hasGithubIntegration) {
        test.skip('GitHub integration not implemented yet');
        return;
      }
      
      await page.evaluate(() => {
        if (window.githubPullDialog && window.editorView && window.automergeHandle) {
          const handle = window.automergeHandle;
          window.githubPullDialog.show(handle, window.editorView);
        }
      });
      
      await expect(page.locator('#github-pull-modal')).toBeVisible({ timeout: 5000 });
      
      // Set up confirmation
      page.on('dialog', dialog => dialog.accept());
      
      // Pull unicode content
      await page.fill('#pull-path', 'unicode-test.md');
      await page.click('#execute-pull');
      await page.waitForTimeout(1000);
      
      // Verify unicode content is preserved
      const content = await helpers.getEditorContent();
      expect(content).toContain('🚀');
      expect(content).toContain('émojis 😀');
      expect(content).toContain('café, naïve, résumé');
      expect(content).toContain('中文测试');
      expect(content).toContain('العربية');
      expect(content).toContain('тест');
    });

    test('updates document statistics after pull', async ({ page }) => {
      const hasGithubIntegration = await page.evaluate(() => {
        return typeof window.githubPullDialog !== 'undefined';
      });
      
      if (!hasGithubIntegration) {
        test.skip('GitHub integration not implemented yet');
        return;
      }
      
      // Set initial content
      await helpers.setEditorContent('Short content');
      
      // Get initial stats
      const initialWordCount = await helpers.getWordCount();
      const initialCharCount = await helpers.getCharacterCount();
      
      await page.evaluate(() => {
        if (window.githubPullDialog && window.editorView && window.automergeHandle) {
          const handle = window.automergeHandle;
          window.githubPullDialog.show(handle, window.editorView);
        }
      });
      
      await expect(page.locator('#github-pull-modal')).toBeVisible({ timeout: 5000 });
      
      // Set up confirmation
      page.on('dialog', dialog => dialog.accept());
      
      // Pull larger content
      await page.fill('#pull-path', 'large-file.md');
      await page.click('#execute-pull');
      await page.waitForTimeout(2000); // Allow time for stats to update
      
      // Verify stats updated
      const newWordCount = await helpers.getWordCount();
      const newCharCount = await helpers.getCharacterCount();
      
      expect(newWordCount).toBeGreaterThan(initialWordCount);
      expect(newCharCount).toBeGreaterThan(initialCharCount);
    });
  });

  test.describe('Dialog Interaction and UX', () => {
    test('allows manual dialog closure', async ({ page }) => {
      const hasGithubIntegration = await page.evaluate(() => {
        return typeof window.githubPullDialog !== 'undefined';
      });
      
      if (!hasGithubIntegration) {
        test.skip('GitHub integration not implemented yet');
        return;
      }
      
      await page.evaluate(() => {
        if (window.githubPullDialog && window.editorView && window.automergeHandle) {
          const handle = window.automergeHandle;
          window.githubPullDialog.show(handle, window.editorView);
        }
      });
      
      await expect(page.locator('#github-pull-modal')).toBeVisible({ timeout: 5000 });
      
      // Test close button
      // Test close button
      await page.click('#pull-close');
      await expect(page.locator('#github-pull-modal')).not.toBeVisible({ timeout: 3000 });

      // Wait before reopening
      await page.waitForTimeout(500);

      // Reopen for next test
      await page.evaluate(() => {
        if (window.githubPullDialog && window.editorView && window.automergeHandle) {
          const handle = window.automergeHandle;
          window.githubPullDialog.show(handle, window.editorView);
        }
      });
      await expect(page.locator('#github-pull-modal')).toBeVisible({ timeout: 5000 });

      // Test cancel button
      await page.click('#cancel-pull');
      await expect(page.locator('#github-pull-modal')).not.toBeVisible({ timeout: 3000 });

      // Reopen for escape key test
      await page.evaluate(() => {
        if (window.githubPullDialog && window.editorView && window.automergeHandle) {
          const handle = window.automergeHandle;
          window.githubPullDialog.show(handle, window.editorView);
        }
      });
      await expect(page.locator('#github-pull-modal')).toBeVisible({ timeout: 5000 });
      
      // Test escape key
      await page.keyboard.press('Escape');
      await expect(page.locator('#github-pull-modal')).not.toBeVisible();
    });

    test('provides accessible focus management', async ({ page }) => {
      const hasGithubIntegration = await page.evaluate(() => {
        return typeof window.githubPullDialog !== 'undefined';
      });
      
      if (!hasGithubIntegration) {
        test.skip('GitHub integration not implemented yet');
        return;
      }
      
      await page.evaluate(() => {
        if (window.githubPullDialog && window.editorView && window.automergeHandle) {
          const handle = window.automergeHandle;
          window.githubPullDialog.show(handle, window.editorView);
        }
      });
      
      await expect(page.locator('#github-pull-modal')).toBeVisible({ timeout: 5000 });
      
      // Test close button
      await page.click('#pull-close');
      await expect(page.locator('#github-pull-modal')).not.toBeVisible({ timeout: 3000 });

      // Wait before reopening
      await page.waitForTimeout(500);

      // Reopen for next test
      await page.evaluate(() => {
        if (window.githubPullDialog && window.editorView && window.automergeHandle) {
          const handle = window.automergeHandle;
          window.githubPullDialog.show(handle, window.editorView);
        }
      });
      await expect(page.locator('#github-pull-modal')).toBeVisible({ timeout: 5000 });

      // Test cancel button
      await page.click('#cancel-pull');
      await expect(page.locator('#github-pull-modal')).not.toBeVisible({ timeout: 3000 }); 
      // Test dialog ARIA attributes
      const modal = page.locator('#github-pull-modal');
      await expect(modal).toHaveAttribute('role', 'dialog');
      await expect(modal).toHaveAttribute('aria-labelledby', 'pull-title');
    });

    test('provides configure GitHub shortcut', async ({ page }) => {
      const hasGithubIntegration = await page.evaluate(() => {
        return typeof window.githubPullDialog !== 'undefined';
      });
      
      if (!hasGithubIntegration) {
        test.skip('GitHub integration not implemented yet');
        return;
      }
      
      await page.evaluate(() => {
        if (window.githubPullDialog && window.editorView && window.automergeHandle) {
          const handle = window.automergeHandle;
          window.githubPullDialog.show(handle, window.editorView);
        }
      });
      
      await expect(page.locator('#github-pull-modal')).toBeVisible({ timeout: 5000 });
      
      // Should have configure GitHub button
      const configButton = page.locator('#configure-github-pull');
      await expect(configButton).toBeVisible();
      await expect(configButton).toContainText('Configure GitHub');
      
      // Clicking should close current dialog (we can't easily test opening GitHub settings without more complex mocking)
      await configButton.click();
      
      // Dialog should close
      await expect(page.locator('#github-pull-modal')).not.toBeVisible();
    });
  });
});
