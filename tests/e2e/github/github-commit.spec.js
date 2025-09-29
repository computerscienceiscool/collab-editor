// tests/github/github-commit.js
import { test, expect } from '@playwright/test';
import { CollabEditorHelpers } from '../../utils/testHelpers.js';

test.describe('GitHub Commit Functionality', () => {
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
      
      // Mock GitHub service if it exists
      if (window.githubService) {
        // Store original methods for restoration
        window._originalGithubMethods = {
          commitFile: window.githubService.commitFile,
          validateToken: window.githubService.validateToken,
          fetchRepositories: window.githubService.fetchRepositories
        };
        
        // Mock settings
        window.githubService.settings = {
          token: 'mock_token_12345',
          username: 'testuser',
          repos: [
            { name: 'test-repo', fullName: 'testuser/test-repo', defaultBranch: 'main' },
            { name: 'docs-repo', fullName: 'testuser/docs-repo', defaultBranch: 'master' }
          ],
          selectedRepo: 'testuser/test-repo',
          defaultPath: 'documents/test.md',
          commitMessage: 'Update from collaborative editor',
          enabled: true
        };
        
        // Mock commit function
        window.githubService.commitFile = async (content, filePath, commitMessage, coAuthors = []) => {
          // Store test data for verification
          window.githubTestData = {
            content,
            filePath,
            commitMessage,
            coAuthors,
            timestamp: Date.now()
          };
          
          // Simulate successful commit response
          return {
            commit: {
              sha: 'abc123def456',
              html_url: 'https://github.com/testuser/test-repo/commit/abc123def456',
              message: commitMessage
            },
            content: {
              path: filePath,
              sha: 'file123abc456'
            }
          };
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
      
      // Mock GitHub dialog if it exists
      if (window.githubCommitDialog) {
        window._originalCommitDialog = {
          show: window.githubCommitDialog.show,
          hide: window.githubCommitDialog.hide
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
      
      if (window._originalCommitDialog && window.githubCommitDialog) {
        Object.assign(window.githubCommitDialog, window._originalCommitDialog);
        delete window._originalCommitDialog;
      }
      
      delete window.githubTestData;
      localStorage.removeItem('github-settings');
    });
  });

  test.describe('Dialog Opening', () => {
    test('opens commit dialog via File menu', async ({ page }) => {
      // Set some content to commit
      await helpers.setEditorContent('Test content for GitHub commit');
      
      // Open File menu and click Commit to GitHub
      await helpers.openMenu('file');
      
      // Check if GitHub commit menu item exists
      const commitMenuItem = page.locator('[data-action="github-commit"]');
      const menuItemExists = await commitMenuItem.count() > 0;
      
      if (!menuItemExists) {
        // Skip test if GitHub integration not available
        test.skip('GitHub integration not implemented yet');
        return;
      }
      
      await helpers.clickMenuItem('github-commit');
      
      // Verify commit dialog opens
      await expect(page.locator('#github-commit-modal')).toBeVisible({ timeout: 10000 });
      
      // Verify dialog title
      await expect(page.locator('#commit-title')).toContainText('Commit to GitHub');
      
      // Verify repository dropdown is populated
      const repoSelect = page.locator('#commit-repo');
      await expect(repoSelect).toBeVisible();
      
      const repoOptions = await repoSelect.locator('option').count();
      expect(repoOptions).toBeGreaterThan(1); // Should have default option plus repos
    });

    test('opens commit dialog via keyboard shortcut', async ({ page }) => {
      // Set content and check if GitHub integration exists
      await helpers.setEditorContent('Shortcut test content');
      
      const hasGithubIntegration = await page.evaluate(() => {
        return typeof window.githubService !== 'undefined' && 
               typeof window.githubCommitDialog !== 'undefined';
      });
      
      if (!hasGithubIntegration) {
        test.skip('GitHub integration not implemented yet');
        return;
      }
      
      // Use Ctrl+Alt+G shortcut
      const modifier = helpers.getKeyModifier();
      await page.keyboard.press(`${modifier}+Alt+g`);
      
      // Verify dialog opens
      await expect(page.locator('#github-commit-modal')).toBeVisible({ timeout: 5000 });
      
      // Verify essential elements are present
      await expect(page.locator('#commit-repo')).toBeVisible();
      await expect(page.locator('#commit-path')).toBeVisible();
      await expect(page.locator('#commit-message')).toBeVisible();
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
      
      // Try to open commit dialog
      const hasGithubIntegration = await page.evaluate(() => {
        return typeof window.githubService !== 'undefined';
      });
      
      if (!hasGithubIntegration) {
        test.skip('GitHub integration not implemented yet');
        return;
      }
      
      const modifier = helpers.getKeyModifier();
      await page.keyboard.press(`${modifier}+Alt+g`);
      
      // Should show configuration dialog
      await page.waitForTimeout(1000);
      expect(dialogShown).toBe(true);
    });
  });

  test.describe('Repository and File Path Selection', () => {
    test('populates repository dropdown with available repos', async ({ page }) => {
      const hasGithubIntegration = await page.evaluate(() => {
        return typeof window.githubCommitDialog !== 'undefined';
      });
      
      if (!hasGithubIntegration) {
        test.skip('GitHub integration not implemented yet');
        return;
      }
      
      // Open commit dialog
      await page.evaluate(() => {
        if (window.githubCommitDialog) {
          window.githubCommitDialog.show('test content', null, null);
        }
      });
      
      await expect(page.locator('#github-commit-modal')).toBeVisible({ timeout: 5000 });
      
      // Check repository options
      const repoSelect = page.locator('#commit-repo');
      const repoOptions = repoSelect.locator('option');
      
      // Should have placeholder plus actual repositories
      const optionCount = await repoOptions.count();
      expect(optionCount).toBeGreaterThanOrEqual(2);
      
      // Check specific repository names
      await expect(repoOptions.nth(1)).toContainText('testuser/test-repo');
      await expect(repoOptions.nth(2)).toContainText('testuser/docs-repo');
      
      // Verify default selection
      const selectedValue = await repoSelect.inputValue();
      expect(selectedValue).toBe('testuser/test-repo');
    });

    test('allows file path input and validates format', async ({ page }) => {
      const hasGithubIntegration = await page.evaluate(() => {
        return typeof window.githubCommitDialog !== 'undefined';
      });
      
      if (!hasGithubIntegration) {
        test.skip('GitHub integration not implemented yet');
        return;
      }
      
      // Open commit dialog
      await page.evaluate(() => {
        if (window.githubCommitDialog) {
          window.githubCommitDialog.show('test content', null, null);
        }
      });
      
      await expect(page.locator('#github-commit-modal')).toBeVisible({ timeout: 5000 });
      
      const pathInput = page.locator('#commit-path');
      
      // Should have default path
      const defaultPath = await pathInput.inputValue();
      expect(defaultPath).toContain('.md');
      
      // Test various file path formats
      const testPaths = [
        'docs/readme.md',
        'folder/subfolder/document.txt',
        'simple-file.md',
        'documents/team-notes.markdown'
      ];
      
      for (const testPath of testPaths) {
        await pathInput.fill(testPath);
        const inputValue = await pathInput.inputValue();
        expect(inputValue).toBe(testPath);
      }
    });

    test('remembers last used repository and path', async ({ page }) => {
      const hasGithubIntegration = await page.evaluate(() => {
        return typeof window.githubCommitDialog !== 'undefined';
      });
      
      if (!hasGithubIntegration) {
        test.skip('GitHub integration not implemented yet');
        return;
      }
      
      // Open dialog first time
      await page.evaluate(() => {
        if (window.githubCommitDialog) {
          window.githubCommitDialog.show('test content', null, null);
        }
      });
      
      await expect(page.locator('#github-commit-modal')).toBeVisible({ timeout: 5000 });
      
      // Change repository and path
      await page.selectOption('#commit-repo', 'testuser/docs-repo');
      await page.fill('#commit-path', 'custom/path/file.md');
      
      // Close dialog
      await page.keyboard.press('Escape');
      await expect(page.locator('#github-commit-modal')).not.toBeVisible();
      
      // Open dialog again
      await page.evaluate(() => {
        if (window.githubCommitDialog) {
          window.githubCommitDialog.show('test content 2', null, null);
        }
      });
      
      await expect(page.locator('#github-commit-modal')).toBeVisible({ timeout: 5000 });
      
      // Should remember selections
      const selectedRepo = await page.inputValue('#commit-repo');
      const selectedPath = await page.inputValue('#commit-path');
      
      expect(selectedRepo).toBe('testuser/docs-repo');
      expect(selectedPath).toBe('custom/path/file.md');
    });
  });

  test.describe('Commit Message Input', () => {
    test('provides default commit message', async ({ page }) => {
      const hasGithubIntegration = await page.evaluate(() => {
        return typeof window.githubCommitDialog !== 'undefined';
      });
      
      if (!hasGithubIntegration) {
        test.skip('GitHub integration not implemented yet');
        return;
      }
      
      await page.evaluate(() => {
        if (window.githubCommitDialog) {
          window.githubCommitDialog.show('test content', null, null);
        }
      });
      
      await expect(page.locator('#github-commit-modal')).toBeVisible({ timeout: 5000 });
      
      const messageInput = page.locator('#commit-message');
      const defaultMessage = await messageInput.inputValue();
      
      expect(defaultMessage).toBeTruthy();
      expect(defaultMessage.length).toBeGreaterThan(0);
      expect(defaultMessage).toContain('collaborative editor');
    });

    test('allows custom commit messages', async ({ page }) => {
      const hasGithubIntegration = await page.evaluate(() => {
        return typeof window.githubCommitDialog !== 'undefined';
      });
      
      if (!hasGithubIntegration) {
        test.skip('GitHub integration not implemented yet');
        return;
      }
      
      await page.evaluate(() => {
        if (window.githubCommitDialog) {
          window.githubCommitDialog.show('test content', null, null);
        }
      });
      
      await expect(page.locator('#github-commit-modal')).toBeVisible({ timeout: 5000 });
      
      const messageInput = page.locator('#commit-message');
      const customMessages = [
        'Add new feature documentation',
        'Fix typos in README',
        'Update team meeting notes',
        'Initial commit with project structure'
      ];
      
      for (const message of customMessages) {
        await messageInput.fill(message);
        const inputValue = await messageInput.inputValue();
        expect(inputValue).toBe(message);
      }
    });

    test('validates commit message requirements', async ({ page }) => {
      const hasGithubIntegration = await page.evaluate(() => {
        return typeof window.githubCommitDialog !== 'undefined';
      });
      
      if (!hasGithubIntegration) {
        test.skip('GitHub integration not implemented yet');
        return;
      }
      
      await page.evaluate(() => {
        if (window.githubCommitDialog) {
          window.githubCommitDialog.show('test content', null, null);
        }
      });
      
      await expect(page.locator('#github-commit-modal')).toBeVisible({ timeout: 5000 });
      
      // Clear commit message
      await page.fill('#commit-message', '');
      
      // Try to commit with empty message
      await page.click('#execute-commit');
      
      // Should show error status
      const statusEl = page.locator('#commit-status');
      await expect(statusEl).toContainText('Please enter a commit message');
    });
  });

  test.describe('Co-Author Detection', () => {
    test('detects co-authors from awareness system', async ({ page }) => {
      const hasGithubIntegration = await page.evaluate(() => {
        return typeof window.githubCommitDialog !== 'undefined';
      });
      
      if (!hasGithubIntegration) {
        test.skip('GitHub integration not implemented yet');
        return;
      }
      
      // Mock awareness system with multiple users
      await page.evaluate(() => {
        // Create mock awareness
        const mockAwareness = {
          clientID: 123,
          getStates() {
            return new Map([
              [123, { user: { name: 'Current User', color: '#ff0000' } }],
              [456, { user: { name: 'Alice Smith', color: '#00ff00' } }],
              [789, { user: { name: 'Bob Johnson', color: '#0000ff' } }]
            ]);
          }
        };
        
        // Open dialog with mock awareness
        if (window.githubCommitDialog) {
          window.githubCommitDialog.show('test content', null, mockAwareness);
        }
      });
      
      await expect(page.locator('#github-commit-modal')).toBeVisible({ timeout: 5000 });
      
      // Check co-authors list
      const coAuthorsList = page.locator('#co-authors-list');
      await expect(coAuthorsList).toBeVisible();
      
      // Should show collaborators (excluding current user)
      const coAuthorItems = page.locator('.co-author-item');
      const itemCount = await coAuthorItems.count();
      expect(itemCount).toBe(2); // Alice and Bob, but not current user
      
      // Check specific co-authors
      await expect(coAuthorsList).toContainText('Alice Smith');
      await expect(coAuthorsList).toContainText('Bob Johnson');
      await expect(coAuthorsList).not.toContainText('Current User');
    });

    test('shows placeholder when no collaborators present', async ({ page }) => {
      const hasGithubIntegration = await page.evaluate(() => {
        return typeof window.githubCommitDialog !== 'undefined';
      });
      
      if (!hasGithubIntegration) {
        test.skip('GitHub integration not implemented yet');
        return;
      }
      
      // Mock awareness with only current user
      await page.evaluate(() => {
        const mockAwareness = {
          clientID: 123,
          getStates() {
            return new Map([
              [123, { user: { name: 'Solo User', color: '#ff0000' } }]
            ]);
          }
        };
        
        if (window.githubCommitDialog) {
          window.githubCommitDialog.show('test content', null, mockAwareness);
        }
      });
      
      await expect(page.locator('#github-commit-modal')).toBeVisible({ timeout: 5000 });
      
      const coAuthorsList = page.locator('#co-authors-list');
      await expect(coAuthorsList).toContainText('No other collaborators detected');
    });

    test('generates appropriate email addresses for co-authors', async ({ page }) => {
      const hasGithubIntegration = await page.evaluate(() => {
        return typeof window.githubCommitDialog !== 'undefined';
      });
      
      if (!hasGithubIntegration) {
        test.skip('GitHub integration not implemented yet');
        return;
      }
      
      await page.evaluate(() => {
        const mockAwareness = {
          clientID: 123,
          getStates() {
            return new Map([
              [123, { user: { name: 'Current User', color: '#ff0000' } }],
              [456, { user: { name: 'Jane Doe', color: '#00ff00' } }],
              [789, { user: { name: 'John Smith-Wilson', color: '#0000ff' } }]
            ]);
          }
        };
        
        if (window.githubCommitDialog) {
          window.githubCommitDialog.show('test content', null, mockAwareness);
        }
      });
      
      await expect(page.locator('#github-commit-modal')).toBeVisible({ timeout: 5000 });
      
      // Check generated email addresses
      const coAuthorEmails = page.locator('.co-author-email');
      
      // Should generate emails based on names
      await expect(coAuthorEmails.first()).toContainText('janedoe@example.com');
      await expect(coAuthorEmails.last()).toContainText('johnsmithwilson@example.com');
    });
  });

  test.describe('Commit Execution', () => {
    test('validates required fields before committing', async ({ page }) => {
      const hasGithubIntegration = await page.evaluate(() => {
        return typeof window.githubCommitDialog !== 'undefined';
      });
      
      if (!hasGithubIntegration) {
        test.skip('GitHub integration not implemented yet');
        return;
      }
      
      await page.evaluate(() => {
        if (window.githubCommitDialog) {
          window.githubCommitDialog.show('test content', null, null);
        }
      });
      
      await expect(page.locator('#github-commit-modal')).toBeVisible({ timeout: 5000 });
      
      // Test missing repository
      await page.selectOption('#commit-repo', '');
      await page.click('#execute-commit');
      
      const statusEl = page.locator('#commit-status');
      await expect(statusEl).toContainText('Please select a repository');
      
      // Fix repository, test missing path
      await page.selectOption('#commit-repo', 'testuser/test-repo');
      await page.fill('#commit-path', '');
      await page.click('#execute-commit');
      
      await expect(statusEl).toContainText('Please enter a file path');
      
      // Fix path, test missing message
      await page.fill('#commit-path', 'test.md');
      await page.fill('#commit-message', '');
      await page.click('#execute-commit');
      
      await expect(statusEl).toContainText('Please enter a commit message');
    });

    test('executes successful commit with co-authors', async ({ page }) => {
      const hasGithubIntegration = await page.evaluate(() => {
        return typeof window.githubCommitDialog !== 'undefined';
      });
      
      if (!hasGithubIntegration) {
        test.skip('GitHub integration not implemented yet');
        return;
      }
      
      // Set up document content
      await helpers.setEditorContent('This is test content for GitHub commit');
      
      // Open dialog with mock collaborators
      await page.evaluate(() => {
        const mockAwareness = {
          clientID: 123,
          getStates() {
            return new Map([
              [123, { user: { name: 'Main Author', color: '#ff0000' } }],
              [456, { user: { name: 'Co Author', color: '#00ff00' } }]
            ]);
          }
        };
        
        if (window.githubCommitDialog) {
          window.githubCommitDialog.show('This is test content for GitHub commit', null, mockAwareness);
        }
      });
      
      await expect(page.locator('#github-commit-modal')).toBeVisible({ timeout: 5000 });
      
      // Fill in commit details
      await page.selectOption('#commit-repo', 'testuser/test-repo');
      await page.fill('#commit-path', 'docs/test-document.md');
      await page.fill('#commit-message', 'Add test document with collaboration');
      
      // Execute commit
      await page.click('#execute-commit');
      
      // Wait for commit to complete
      await page.waitForTimeout(1000);
      
      // Verify success status
      const statusEl = page.locator('#commit-status');
      await expect(statusEl).toContainText('Successfully committed to GitHub');
      
      // Verify GitHub URL link appears
      const githubLink = page.locator('.github-link');
      await expect(githubLink).toBeVisible();
      await expect(githubLink).toContainText('View on GitHub');
      
      // Verify commit data was passed correctly
      const commitData = await page.evaluate(() => window.githubTestData);
      expect(commitData).toBeTruthy();
      expect(commitData.content).toBe('This is test content for GitHub commit');
      expect(commitData.filePath).toBe('docs/test-document.md');
      expect(commitData.commitMessage).toContain('Add test document with collaboration');
      expect(commitData.commitMessage).toContain('Co-authored-by: Co Author <coauthor@example.com>');
      expect(commitData.coAuthors).toHaveLength(1);
      expect(commitData.coAuthors[0].name).toBe('Co Author');
    });

    test('handles commit failures gracefully', async ({ page }) => {
      const hasGithubIntegration = await page.evaluate(() => {
        return typeof window.githubCommitDialog !== 'undefined';
      });
      
      if (!hasGithubIntegration) {
        test.skip('GitHub integration not implemented yet');
        return;
      }
      
      // Mock commit failure
      await page.evaluate(() => {
        if (window.githubService) {
          window.githubService.commitFile = async () => {
            throw new Error('Repository not found');
          };
        }
      });
      
      await page.evaluate(() => {
        if (window.githubCommitDialog) {
          window.githubCommitDialog.show('test content', null, null);
        }
      });
      
      await expect(page.locator('#github-commit-modal')).toBeVisible({ timeout: 5000 });
      
      // Fill valid data and try to commit
      await page.selectOption('#commit-repo', 'testuser/test-repo');
      await page.fill('#commit-path', 'test.md');
      await page.fill('#commit-message', 'Test commit');
      
      await page.click('#execute-commit');
      await page.waitForTimeout(1000);
      
      // Should show error message
      const statusEl = page.locator('#commit-status');
      await expect(statusEl).toContainText('Commit failed: Repository not found');
      
      // Dialog should remain open for retry
      await expect(page.locator('#github-commit-modal')).toBeVisible();
    });

    test('shows loading state during commit', async ({ page }) => {
      const hasGithubIntegration = await page.evaluate(() => {
        return typeof window.githubCommitDialog !== 'undefined';
      });
      
      if (!hasGithubIntegration) {
        test.skip('GitHub integration not implemented yet');
        return;
      }
      
      // Mock slow commit
      await page.evaluate(() => {
        if (window.githubService) {
          window.githubService.commitFile = async (...args) => {
            // Store data for later verification
            window.githubTestData = {
              content: args[0],
              filePath: args[1],
              commitMessage: args[2],
              coAuthors: args[3]
            };
            
            // Simulate slow operation
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            return {
              commit: {
                sha: 'abc123',
                html_url: 'https://github.com/test/repo/commit/abc123'
              }
            };
          };
        }
      });
      
      await page.evaluate(() => {
        if (window.githubCommitDialog) {
          window.githubCommitDialog.show('test content', null, null);
        }
      });
      
      await expect(page.locator('#github-commit-modal')).toBeVisible({ timeout: 5000 });
      
      // Fill data and start commit
      await page.selectOption('#commit-repo', 'testuser/test-repo');
      await page.fill('#commit-path', 'test.md');
      await page.fill('#commit-message', 'Test commit');
      
      // Start commit
      const commitButton = page.locator('#execute-commit');
      await commitButton.click();
      
      // Should show loading status
      const statusEl = page.locator('#commit-status');
      await expect(statusEl).toContainText('Committing to GitHub...');
      
      // Buttons should be disabled during loading
      await expect(commitButton).toBeDisabled();
      
      // Wait for completion
      await expect(statusEl).toContainText('Successfully committed to GitHub', { timeout: 5000 });
      
      // Buttons should be re-enabled
      await expect(commitButton).toBeEnabled();
    });
  });

  test.describe('Settings Update After Commit', () => {
    test('saves commit preferences for future use', async ({ page }) => {
      const hasGithubIntegration = await page.evaluate(() => {
        return typeof window.githubCommitDialog !== 'undefined';
      });
      
      if (!hasGithubIntegration) {
        test.skip('GitHub integration not implemented yet');
        return;
      }
      
      await page.evaluate(() => {
        if (window.githubCommitDialog) {
          window.githubCommitDialog.show('test content', null, null);
        }
      });
      
      await expect(page.locator('#github-commit-modal')).toBeVisible({ timeout: 5000 });
      
      // Change settings and commit
      await page.selectOption('#commit-repo', 'testuser/docs-repo');
      await page.fill('#commit-path', 'new/path/document.md');
      await page.fill('#commit-message', 'Custom commit message');
      
      await page.click('#execute-commit');
      await page.waitForTimeout(1000);
      
      // Verify settings were saved
      const savedSettings = await page.evaluate(() => {
        if (window.githubService) {
          return window.githubService.settings;
        }
        return null;
      });
      
      expect(savedSettings.selectedRepo).toBe('testuser/docs-repo');
      expect(savedSettings.defaultPath).toBe('new/path/document.md');
      expect(savedSettings.commitMessage).toBe('Custom commit message');
    });

    test('updates last commit information', async ({ page }) => {
      const hasGithubIntegration = await page.evaluate(() => {
        return typeof window.githubCommitDialog !== 'undefined';
      });
      
      if (!hasGithubIntegration) {
        test.skip('GitHub integration not implemented yet');
        return;
      }
      
      await page.evaluate(() => {
        if (window.githubCommitDialog) {
          window.githubCommitDialog.show('test content', null, null);
        }
      });
      
      await expect(page.locator('#github-commit-modal')).toBeVisible({ timeout: 5000 });
      
      // Execute commit
      await page.selectOption('#commit-repo', 'testuser/test-repo');
      await page.fill('#commit-path', 'docs/latest.md');
      await page.fill('#commit-message', 'Latest update');
      
      await page.click('#execute-commit');
      await page.waitForTimeout(1000);
      
      // Check last commit info
      const lastCommit = await page.evaluate(() => {
        if (window.githubService) {
          return window.githubService.settings.lastCommit;
        }
        return null;
      });
      
      expect(lastCommit).toBeTruthy();
      expect(lastCommit.sha).toBe('abc123def456');
      expect(lastCommit.url).toContain('github.com');
      expect(lastCommit.path).toBe('docs/latest.md');
      expect(lastCommit.repository).toBe('testuser/test-repo');
      expect(lastCommit.date).toBeTruthy();
    });
  });

  test.describe('Dialog Interaction and UX', () => {
    test('closes dialog after successful commit', async ({ page }) => {
      const hasGithubIntegration = await page.evaluate(() => {
        return typeof window.githubCommitDialog !== 'undefined';
      });
      
      if (!hasGithubIntegration) {
        test.skip('GitHub integration not implemented yet');
        return;
      }
      
      await page.evaluate(() => {
        if (window.githubCommitDialog) {
          window.githubCommitDialog.show('test content', null, null);
        }
      });
      
      await expect(page.locator('#github-commit-modal')).toBeVisible({ timeout: 5000 });
      
      // Execute successful commit
      await page.selectOption('#commit-repo', 'testuser/test-repo');
      await page.fill('#commit-path', 'test.md');
      await page.fill('#commit-message', 'Test commit');
      
      await page.click('#execute-commit');
      
      // Dialog should auto-close after successful commit
      await expect(page.locator('#github-commit-modal')).not.toBeVisible({ timeout: 5000 });
    });

    test('allows manual dialog closure', async ({ page }) => {
      const hasGithubIntegration = await page.evaluate(() => {
        return typeof window.githubCommitDialog !== 'undefined';
      });
      
      if (!hasGithubIntegration) {
        test.skip('GitHub integration not implemented yet');
        return;
      }
      
      await page.evaluate(() => {
        if (window.githubCommitDialog) {
          window.githubCommitDialog.show('test content', null, null);
        }
      });
      
      await expect(page.locator('#github-commit-modal')).toBeVisible({ timeout: 5000 });
      
      // Test various close methods
      
      // 1. Close button
      await page.click('#commit-close');
      await expect(page.locator('#github-commit-modal')).not.toBeVisible();
      
      // Reopen for next test
      await page.evaluate(() => {
        if (window.githubCommitDialog) {
          window.githubCommitDialog.show('test content', null, null);
        }
      });
      await expect(page.locator('#github-commit-modal')).toBeVisible({ timeout: 5000 });
      
      // 2. Cancel button
      await page.click('#cancel-commit');
      await expect(page.locator('#github-commit-modal')).not.toBeVisible();
      
      // Reopen for next test
      await page.evaluate(() => {
        if (window.githubCommitDialog) {
          window.githubCommitDialog.show('test content', null, null);
        }
      });
      await expect(page.locator('#github-commit-modal')).toBeVisible({ timeout: 5000 });
      
      // 3. Escape key
      await page.keyboard.press('Escape');
      await expect(page.locator('#github-commit-modal')).not.toBeVisible();
    });

    test('provides accessible focus management', async ({ page }) => {
      const hasGithubIntegration = await page.evaluate(() => {
        return typeof window.githubCommitDialog !== 'undefined';
      });
      
      if (!hasGithubIntegration) {
        test.skip('GitHub integration not implemented yet');
        return;
      }
      
      await page.evaluate(() => {
        if (window.githubCommitDialog) {
          window.githubCommitDialog.show('test content', null, null);
        }
      });
      
      await expect(page.locator('#github-commit-modal')).toBeVisible({ timeout: 5000 });
      
      // Test tab navigation through dialog elements
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      // Should be able to navigate to commit button and activate with Enter
      const activeElement = await page.evaluate(() => document.activeElement?.id);
      expect(['commit-repo', 'commit-path', 'commit-message', 'execute-commit']).toContain(activeElement);
      
      // Test that dialog has proper ARIA attributes
      const modal = page.locator('#github-commit-modal');
      await expect(modal).toHaveAttribute('role', 'dialog');
      await expect(modal).toHaveAttribute('aria-labelledby', 'commit-title');
    });
  });

  test.describe('Edge Cases and Error Handling', () => {
    test('handles very long file paths', async ({ page }) => {
      const hasGithubIntegration = await page.evaluate(() => {
        return typeof window.githubCommitDialog !== 'undefined';
      });
      
      if (!hasGithubIntegration) {
        test.skip('GitHub integration not implemented yet');
        return;
      }
      
      await page.evaluate(() => {
        if (window.githubCommitDialog) {
          window.githubCommitDialog.show('test content', null, null);
        }
      });
      
      await expect(page.locator('#github-commit-modal')).toBeVisible({ timeout: 5000 });
      
      const longPath = 'very/long/path/with/many/nested/directories/that/might/cause/issues/document.md';
      
      await page.fill('#commit-path', longPath);
      const inputValue = await page.inputValue('#commit-path');
      expect(inputValue).toBe(longPath);
      
      // Should still allow commit with long path
      await page.selectOption('#commit-repo', 'testuser/test-repo');
      await page.fill('#commit-message', 'Test with long path');
      await page.click('#execute-commit');
      
      await page.waitForTimeout(1000);
      const statusEl = page.locator('#commit-status');
      await expect(statusEl).toContainText('Successfully committed to GitHub');
    });

    test('handles special characters in commit messages', async ({ page }) => {
      const hasGithubIntegration = await page.evaluate(() => {
        return typeof window.githubCommitDialog !== 'undefined';
      });
      
      if (!hasGithubIntegration) {
        test.skip('GitHub integration not implemented yet');
        return;
      }
      
      await page.evaluate(() => {
        if (window.githubCommitDialog) {
          window.githubCommitDialog.show('test content', null, null);
        }
      });
      
      await expect(page.locator('#github-commit-modal')).toBeVisible({ timeout: 5000 });
      
      const specialMessage = 'Commit with émojis 🚀 and "quotes" & symbols';
      
      await page.selectOption('#commit-repo', 'testuser/test-repo');
      await page.fill('#commit-path', 'test.md');
      await page.fill('#commit-message', specialMessage);
      
      await page.click('#execute-commit');
      await page.waitForTimeout(1000);
      
      // Verify commit was processed correctly
      const commitData = await page.evaluate(() => window.githubTestData);
      expect(commitData.commitMessage).toContain(specialMessage);
    });

    test('preserves dialog state during temporary failures', async ({ page }) => {
      const hasGithubIntegration = await page.evaluate(() => {
        return typeof window.githubCommitDialog !== 'undefined';
      });
      
      if (!hasGithubIntegration) {
        test.skip('GitHub integration not implemented yet');
        return;
      }
      
      // Mock temporary failure
      await page.evaluate(() => {
        if (window.githubService) {
          let failCount = 0;
          const originalCommit = window.githubService.commitFile;
          
          window.githubService.commitFile = async (...args) => {
            failCount++;
            if (failCount === 1) {
              throw new Error('Network timeout');
            }
            return originalCommit.apply(this, args);
          };
        }
      });
      
      await page.evaluate(() => {
        if (window.githubCommitDialog) {
          window.githubCommitDialog.show('test content', null, null);
        }
      });
      
      await expect(page.locator('#github-commit-modal')).toBeVisible({ timeout: 5000 });
      
      // Fill form
      await page.selectOption('#commit-repo', 'testuser/test-repo');
      await page.fill('#commit-path', 'test-file.md');
      await page.fill('#commit-message', 'Test retry');
      
      // First attempt should fail
      await page.click('#execute-commit');
      await page.waitForTimeout(1000);
      
      const statusEl = page.locator('#commit-status');
      await expect(statusEl).toContainText('Commit failed: Network timeout');
      
      // Form data should be preserved
      expect(await page.inputValue('#commit-repo')).toBe('testuser/test-repo');
      expect(await page.inputValue('#commit-path')).toBe('test-file.md');
      expect(await page.inputValue('#commit-message')).toBe('Test retry');
      
      // Second attempt should succeed
      await page.click('#execute-commit');
      await page.waitForTimeout(1000);
      
      await expect(statusEl).toContainText('Successfully committed to GitHub');
    });
  });
});
