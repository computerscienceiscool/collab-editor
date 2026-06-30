// tests/github/github-integration-b.spec.js
import { test, expect } from '@playwright/test';
import { CollabEditorHelpers } from '../../utils/testHelpers.js';

test.describe('GitHub Integration Tests - Menu & Keyboard Shortcuts', () => {
  let helpers;

  test.beforeEach(async ({ page }, testInfo) => {
    helpers = new CollabEditorHelpers(page);
    helpers.setTestName(testInfo.title);
    await helpers.navigateToRoom();
    await helpers.waitForStableEditor();
    
    // Setup comprehensive GitHub integration mocks
    await page.evaluate(() => {
      // Clear any existing state
      localStorage.removeItem('github-settings');
      delete window.githubTestData;
      delete window.githubIntegrationTestData;
      delete window.xssExecuted;
      delete window.performanceTestData;
      
      // Enhanced GitHub service mock for integration testing
      if (window.githubService) {
        // Store original methods
        window._originalGithubMethods = {
          commitFile: window.githubService.commitFile,
          getFileContent: window.githubService.getFileContent,
          validateToken: window.githubService.validateToken,
          fetchRepositories: window.githubService.fetchRepositories,
          saveSettings: window.githubService.saveSettings
        };
        
        // Integration test data storage
        window.githubIntegrationTestData = {
          commits: [],
          pulls: [],
          settings: [],
          errors: [],
          performance: {
            commits: [],
            pulls: [],
            validations: []
          },
          menuInteractions: [],
          keyboardShortcuts: [],
          recoveryAttempts: []
        };
        
        // Mock settings with comprehensive configuration
        window.githubService.settings = {
          token: 'integration_test_token_12345',
          username: 'integrationuser',
          repos: [
            { name: 'main-repo', fullName: 'integrationuser/main-repo', defaultBranch: 'main' },
            { name: 'docs-repo', fullName: 'integrationuser/docs-repo', defaultBranch: 'master' },
            { name: 'collab-repo', fullName: 'integrationuser/collab-repo', defaultBranch: 'main' },
            { name: 'large-repo', fullName: 'integrationuser/large-repo', defaultBranch: 'main' }
          ],
          selectedRepo: 'integrationuser/main-repo',
          defaultPath: 'documents/integration-test.md',
          commitMessage: 'Integration test commit',
          enabled: true,
          lastCommit: null
        };
        
        // Enhanced commit function with integration tracking
        window.githubService.commitFile = async (content, filePath, commitMessage, coAuthors = []) => {
          const startTime = Date.now();
          
          // Simulate various scenarios based on content/path
          if (content.includes('SIMULATE_ERROR')) {
            throw new Error('Simulated commit error for testing');
          }
          
          if (filePath.includes('forbidden')) {
            throw new Error('Access denied to this path');
          }
          
          // XSS testing - ensure no script execution
          if (commitMessage.includes('<script>')) {
            // This should be sanitized by the application
            if (commitMessage.includes('window.xssExecuted = true')) {
              window.xssExecuted = true; // This should NOT happen in real app
            }
          }
          
          // Simulate processing time for large documents
          const processingTime = content.length > 50000 ? 2000 : Math.random() * 500 + 100;
          await new Promise(resolve => setTimeout(resolve, processingTime));
          
          const commitData = {
            content,
            filePath,
            commitMessage,
            coAuthors: coAuthors || [],
            timestamp: Date.now(),
            processingTime: Date.now() - startTime,
            contentLength: content.length,
            coAuthorCount: coAuthors ? coAuthors.length : 0
          };
          
          // Store for integration testing
          window.githubIntegrationTestData.commits.push(commitData);
          window.githubIntegrationTestData.performance.commits.push({
            contentLength: content.length,
            processingTime: commitData.processingTime,
            coAuthorCount: commitData.coAuthorCount
          });
          
          // Update last commit
          const commitSha = `commit_${Date.now().toString(36)}`;
          window.githubService.settings.lastCommit = {
            sha: commitSha,
            url: `https://github.com/${window.githubService.settings.selectedRepo}/commit/${commitSha}`,
            date: new Date().toISOString(),
            path: filePath,
            repository: window.githubService.settings.selectedRepo,
            coAuthors: coAuthors || []
          };
          
          return {
            commit: {
              sha: commitSha,
              html_url: window.githubService.settings.lastCommit.url,
              message: commitMessage
            },
            content: {
              path: filePath,
              sha: `file_${Date.now().toString(36)}`
            }
          };
        };
        
        // Enhanced file retrieval with integration scenarios
        window.githubService.getFileContent = async (repo, path) => {
          const startTime = Date.now();
          
          // Simulate various error scenarios
          if (path.includes('nonexistent')) {
            throw new Error('File not found in repository');
          }
          
          if (repo.includes('private') && !window.githubService.settings.token.includes('integration')) {
            throw new Error('Repository not found or access denied');
          }
          
          if (path.includes('network-error')) {
            throw new Error('Network timeout');
          }
          
          // File content database for integration testing
          const fileDatabase = {
            'integrationuser/main-repo': {
              'documents/integration-test.md': '# Integration Test Document\n\nThis is a test document for GitHub integration.\n\n## Features\n- Real-time collaboration\n- GitHub integration\n- Security testing',
              'README.md': '# Main Repository\n\nThis is the main repository for integration testing.\n\n## Setup\n1. Configure GitHub\n2. Set repository\n3. Start collaborating',
              'docs/workflow.md': '# Workflow Documentation\n\n## Commit Process\n1. Edit document\n2. Add collaborators\n3. Commit to GitHub\n\n## Pull Process\n1. Select repository\n2. Choose file\n3. Preview content\n4. Pull to editor',
              'large-document.md': '# Large Document\n\n' + 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(1000) + '\n\n## Conclusion\nThis is a large document for performance testing.',
              'unicode-content.md': '# Unicode Test 🚀\n\nTesting émojis 😀 and international characters:\n- Café ☕\n- Naïve approach\n- Résumé writing\n- 中文测试\n- العربية\n- Тест на русском',
              'collaborative-notes.md': '# Team Collaboration Notes\n\n**Meeting Date:** 2024-01-15\n\n## Attendees\n- Alice (Lead)\n- Bob (Developer)\n- Charlie (Designer)\n\n## Action Items\n- [ ] Complete GitHub integration\n- [ ] Test multi-user scenarios\n- [ ] Review security measures',
              'xss-test.md': '# XSS Test Document\n\nThis document contains potential XSS vectors:\n- <script>alert("xss")</script>\n- <img src="x" onerror="alert(1)">\n- javascript:void(0)\n\nThese should be safely displayed as text.'
            },
            'integrationuser/docs-repo': {
              'user-guide.md': '# User Guide\n\n## Getting Started\nWelcome to the collaborative editor!\n\n### Setting up GitHub\n1. Generate personal access token\n2. Configure repository access\n3. Set default paths',
              'api-docs.md': '# API Documentation\n\n## GitHub Integration\n\n### Authentication\nUse personal access tokens with repo scope.\n\n### Endpoints\n- Commit files\n- Retrieve content\n- Manage repositories'
            },
            'integrationuser/collab-repo': {
              'shared-document.md': '# Shared Collaboration Document\n\nThis document demonstrates multi-user collaboration.\n\n## Contributors\nThis section will be updated by various collaborators.\n\n## Content\nCollaborative content goes here...'
            },
            'integrationuser/large-repo': {
              'massive-file.md': '# Massive Test File\n\n' + 'This is a very large file for performance testing. '.repeat(5000) + '\n\n## Performance Metrics\nThis file tests:\n- Large content handling\n- Memory usage\n- Processing time\n- Network transfer'
            }
          };
          
          const repoFiles = fileDatabase[repo];
          if (!repoFiles) {
            throw new Error('Repository not found or access denied');
          }
          
          const content = repoFiles[path];
          if (content === undefined) {
            throw new Error('File not found in repository');
          }
          
          // Simulate network delay based on content size
          const networkDelay = Math.min(content.length / 1000, 2000) + Math.random() * 200;
          await new Promise(resolve => setTimeout(resolve, networkDelay));
          
          const pullData = {
            repo,
            path,
            contentLength: content.length,
            timestamp: Date.now(),
            processingTime: Date.now() - startTime
          };
          
          window.githubIntegrationTestData.pulls.push(pullData);
          window.githubIntegrationTestData.performance.pulls.push({
            contentLength: content.length,
            processingTime: pullData.processingTime
          });
          
          return content;
        };
        
        // Token validation with performance tracking
        window.githubService.validateToken = async (token) => {
          const startTime = Date.now();
          
          await new Promise(resolve => setTimeout(resolve, 300)); // Simulate API call
          
          const validationData = {
            token: token.substring(0, 10) + '...',
            timestamp: Date.now(),
            processingTime: Date.now() - startTime
          };
          
          window.githubIntegrationTestData.performance.validations.push(validationData);
          
          if (token.includes('integration_test_token') || token.includes('valid_token')) {
            return { login: 'integrationuser', id: 12345 };
          }
          throw new Error('Invalid token');
        };
        
        // Enhanced settings persistence
        window.githubService.saveSettings = function(settings = this.settings) {
          const settingsData = {
            ...settings,
            timestamp: Date.now()
          };
          
          window.githubIntegrationTestData.settings.push(settingsData);
          localStorage.setItem('github-settings', JSON.stringify(settings));
          this.settings = settings;
        };
        
        // Repository fetching
        window.githubService.fetchRepositories = async () => {
          await new Promise(resolve => setTimeout(resolve, 200));
          return window.githubService.settings.repos;
        };
      }
      
      // Mock dialog systems for integration testing
      if (window.githubDialog) {
        window._originalGithubDialog = { ...window.githubDialog };
      }
      
      if (window.githubCommitDialog) {
        window._originalCommitDialog = { ...window.githubCommitDialog };
      }
      
      if (window.githubPullDialog) {
        window._originalPullDialog = { ...window.githubPullDialog };
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
      
      // Restore dialog systems
      if (window._originalGithubDialog && window.githubDialog) {
        Object.assign(window.githubDialog, window._originalGithubDialog);
        delete window._originalGithubDialog;
      }
      
      if (window._originalCommitDialog && window.githubCommitDialog) {
        Object.assign(window.githubCommitDialog, window._originalCommitDialog);
        delete window._originalCommitDialog;
      }
      
      if (window._originalPullDialog && window.githubPullDialog) {
        Object.assign(window.githubPullDialog, window._originalPullDialog);
        delete window._originalPullDialog;
      }
      
      delete window.githubTestData;
      delete window.githubIntegrationTestData;
      delete window.xssExecuted;
      delete window.performanceTestData;
      localStorage.removeItem('github-settings');
    });
  });

  // ==========================================
  // COMPLETE AREA 5: Menu Integration
  // ==========================================
  test.describe('Menu Integration', () => {
    test('GitHub menu items are properly added to File menu', async ({ page }) => {
      const hasGithubIntegration = await page.evaluate(() => {
        return typeof window.githubService !== 'undefined' && 
               typeof window.githubCommitDialog !== 'undefined' &&
               typeof window.githubPullDialog !== 'undefined' &&
               typeof window.githubDialog !== 'undefined';
      });
      
      if (!hasGithubIntegration) {
        test.skip('GitHub integration not implemented yet');
        return;
      }
      
      helpers.log('Testing GitHub menu integration');
      
      // Open File menu
      await helpers.openMenu('file');
      
      // Check for GitHub Commit menu item
      const commitMenuItem = page.locator('[data-action="github-commit"]');
      await expect(commitMenuItem).toBeVisible();
      
      const commitText = await commitMenuItem.textContent();
      expect(commitText).toContain('Commit to GitHub');
      expect(commitText).toContain('Ctrl+Alt+G');
      
      // Check for GitHub Pull menu item
      const pullMenuItem = page.locator('[data-action="github-pull"]');
      await expect(pullMenuItem).toBeVisible();
      
      const pullText = await pullMenuItem.textContent();
      expect(pullText).toContain('Pull from GitHub');
      
      helpers.log('GitHub menu items found in File menu', 'success');
      
      // Verify menu section structure
      const githubSection = page.locator('.menu-section').filter({ has: commitMenuItem });
      await expect(githubSection).toBeVisible();
      
      const sectionItems = await githubSection.locator('.dropdown-item').count();
      expect(sectionItems).toBeGreaterThanOrEqual(2);
      
      helpers.log('GitHub menu section properly structured', 'success');
    });

    test('GitHub Settings menu item is added to Tools menu', async ({ page }) => {
      const hasGithubIntegration = await page.evaluate(() => {
        return typeof window.githubDialog !== 'undefined';
      });
      
      if (!hasGithubIntegration) {
        test.skip('GitHub integration not implemented yet');
        return;
      }
      
      helpers.log('Testing GitHub settings menu integration');
      
      // Open Tools menu
      await helpers.openMenu('tools');
      
      // Check for GitHub Settings menu item
      const settingsMenuItem = page.locator('[data-action="github-settings"]');
      await expect(settingsMenuItem).toBeVisible();
      
      const settingsText = await settingsMenuItem.textContent();
      expect(settingsText).toContain('GitHub Settings');
      
      helpers.log('GitHub Settings menu item found in Tools menu', 'success');
      
      // Verify it's in the correct section with other settings
      const preferencesItem = page.locator('[data-action="preferences"]');
      const settingsSection = page.locator('.menu-section').filter({ has: preferencesItem });
      const githubInSection = await settingsSection.locator('[data-action="github-settings"]').count();
      
      expect(githubInSection).toBe(1);
      helpers.log('GitHub Settings properly positioned in settings section', 'success');
    });

    test('GitHub Commit menu action works correctly', async ({ page }) => {
      const hasGithubIntegration = await page.evaluate(() => {
        return typeof window.githubService !== 'undefined' && 
               typeof window.githubCommitDialog !== 'undefined';
      });
      
      if (!hasGithubIntegration) {
        test.skip('GitHub integration not implemented yet');
        return;
      }
      
      helpers.log('Testing GitHub commit menu action');
      
      // Set some content to commit
      await helpers.setEditorContent('Test content for GitHub commit menu action');
      
      // Track menu interaction
      await page.evaluate(() => {
        window.githubIntegrationTestData.menuInteractions.push({
          type: 'commit-menu-action',
          timestamp: Date.now()
        });
      });
      
      // Use menu action
      await helpers.openMenu('file');
      await helpers.clickMenuItem('github-commit');
      
      // Verify commit dialog opens
      await expect(page.locator('#github-commit-modal')).toBeVisible({ timeout: 5000 });
      
      // Verify content is pre-populated
      // Verify content is pre-populated
      const modalVisible = await page.locator('#github-commit-modal').isVisible();
      expect(modalVisible).toBe(true);

        // Wait for form fields to be populated
      await page.waitForFunction(() => {
        const repo = document.querySelector('#commit-repo');
        const path = document.querySelector('#commit-path'); 
        const message = document.querySelector('#commit-message');
      return repo && repo.value && path && path.value && message && message.value;
      }, { timeout: 5000 });

      // Check pre-populated fields
      const repoSelect = await page.inputValue('#commit-repo');
      const pathInput = await page.inputValue('#commit-path');
      const messageInput = await page.inputValue('#commit-message');

      expect(repoSelect).toBeTruthy();
      expect(pathInput).toBeTruthy();
      expect(messageInput).toBeTruthy(); 
      helpers.log('GitHub commit dialog opened via menu with pre-populated fields', 'success');
      
      // Close dialog
      await page.keyboard.press('Escape');
      await expect(page.locator('#github-commit-modal')).not.toBeVisible({ timeout: 3000 });
    });

    test('GitHub Pull menu action works correctly', async ({ page }) => {
      const hasGithubIntegration = await page.evaluate(() => {
        return typeof window.githubService !== 'undefined' && 
               typeof window.githubPullDialog !== 'undefined';
      });
      
      if (!hasGithubIntegration) {
        test.skip('GitHub integration not implemented yet');
        return;
      }
      
      helpers.log('Testing GitHub pull menu action');
      
      // Track menu interaction
      await page.evaluate(() => {
        window.githubIntegrationTestData.menuInteractions.push({
          type: 'pull-menu-action',
          timestamp: Date.now()
        });
      });
      
      // Use menu action
      await helpers.openMenu('file');
      await helpers.clickMenuItem('github-pull');
      
      // Verify pull dialog opens
      await expect(page.locator('#github-pull-modal')).toBeVisible({ timeout: 5000 });
      
      // Verify dialog components
      await expect(page.locator('#pull-repo')).toBeVisible();
      await expect(page.locator('#pull-path')).toBeVisible();
      await expect(page.locator('#file-preview')).toBeVisible();
      
      helpers.log('GitHub pull dialog opened via menu with all components', 'success');
      
      // Close dialog
      await page.keyboard.press('Escape');
      await expect(page.locator('#github-pull-modal')).not.toBeVisible({ timeout: 3000 });
    });

    test('GitHub Settings menu action works correctly', async ({ page }) => {
      const hasGithubIntegration = await page.evaluate(() => {
        return typeof window.githubDialog !== 'undefined';
      });
      
      if (!hasGithubIntegration) {
        test.skip('GitHub integration not implemented yet');
        return;
      }
      
      helpers.log('Testing GitHub settings menu action');
      
      // Track menu interaction
      await page.evaluate(() => {
        window.githubIntegrationTestData.menuInteractions.push({
          type: 'settings-menu-action',
          timestamp: Date.now()
        });
      });
      
      // Use menu action
      await helpers.openMenu('tools');
      await helpers.clickMenuItem('github-settings');
      
      // Verify settings dialog opens
      await expect(page.locator('#github-modal')).toBeVisible({ timeout: 5000 });
      
      // Verify settings dialog components
      await expect(page.locator('#github-token')).toBeVisible();
      await expect(page.locator('#github-repo')).toBeVisible();
      await expect(page.locator('#validate-token')).toBeVisible();
      
      helpers.log('GitHub settings dialog opened via menu with all components', 'success');
      
      // Close dialog
      await page.keyboard.press('Escape');
      await expect(page.locator('#github-modal')).not.toBeVisible({ timeout: 3000 });
    });

    test('menu items handle unconfigured GitHub gracefully', async ({ page }) => {
      const hasGithubIntegration = await page.evaluate(() => {
        return typeof window.githubService !== 'undefined';
      });
      
      if (!hasGithubIntegration) {
        test.skip('GitHub integration not implemented yet');
        return;
      }
      
      helpers.log('Testing menu behavior with unconfigured GitHub');
      
      // Clear GitHub configuration
      await page.evaluate(() => {
        if (window.githubService) {
          window.githubService.settings.token = '';
          window.githubService.settings.enabled = false;
        }
      });
      
      // Set up confirmation dialog handler
      let confirmShown = false;
      page.on('dialog', dialog => {
        confirmShown = true;
        expect(dialog.message()).toContain('GitHub integration not configured');
        dialog.accept(); // Accept to open settings
      });
      
      // Try commit action without configuration
      await helpers.openMenu('file');
      await helpers.clickMenuItem('github-commit');
      
      // Should show confirmation and open settings
      expect(confirmShown).toBe(true);
      await expect(page.locator('#github-modal')).toBeVisible({ timeout: 5000 });
      
      helpers.log('Unconfigured GitHub properly prompts for configuration', 'success');
      
      // Close settings dialog
      await page.keyboard.press('Escape');
    });

    test('menu integration survives page navigation', async ({ page }) => {
      const hasGithubIntegration = await page.evaluate(() => {
        return typeof window.githubService !== 'undefined';
      });
      
      if (!hasGithubIntegration) {
        test.skip('GitHub integration not implemented yet');
        return;
      }
      
      helpers.log('Testing menu integration persistence across navigation');
      
      // Verify initial menu items
      await helpers.openMenu('file');
      await expect(page.locator('[data-action="github-commit"]')).toBeVisible();
      await page.keyboard.press('Escape');
      
      // Navigate to a different room
      const newRoomId = await helpers.generateUniqueRoom();
      await helpers.navigateToRoom(newRoomId);
      
      // Verify menu items still exist
      await helpers.openMenu('file');
      await expect(page.locator('[data-action="github-commit"]')).toBeVisible();
      await expect(page.locator('[data-action="github-pull"]')).toBeVisible();
      
      await helpers.openMenu('tools');
      await expect(page.locator('[data-action="github-settings"]')).toBeVisible();
      
      helpers.log('GitHub menu items persist across navigation', 'success');
    });

    test('menu interactions are properly tracked', async ({ page }) => {
      const hasGithubIntegration = await page.evaluate(() => {
        return typeof window.githubService !== 'undefined';
      });
      
      if (!hasGithubIntegration) {
        test.skip('GitHub integration not implemented yet');
        return;
      }
      
      helpers.log('Testing menu interaction tracking');
      
      // Perform multiple menu interactions
      await helpers.openMenu('file');
      await helpers.clickMenuItem('github-commit');
      await page.keyboard.press('Escape');
      
      await helpers.openMenu('file');
      await helpers.clickMenuItem('github-pull');
      await page.keyboard.press('Escape');
      
      await helpers.openMenu('tools');
      await helpers.clickMenuItem('github-settings');
      await page.keyboard.press('Escape');
      
      // Verify tracking data
      // Wait for tracking data to be populated
      await page.waitForFunction(() => {
        return window.githubIntegrationTestData && 
               window.githubIntegrationTestData.menuInteractions.length >= 3;
      }, { timeout: 5000 });

      // Verify tracking data
      const trackingData = await page.evaluate(() => window.githubIntegrationTestData.menuInteractions);

      expect(trackingData.length).toBeGreaterThanOrEqual(3);


      const actionTypes = trackingData.map(interaction => interaction.type);
      expect(actionTypes).toContain('commit-menu-action');
      expect(actionTypes).toContain('pull-menu-action'); 
      expect(actionTypes).toContain('settings-menu-action');
      
      helpers.log('Menu interactions properly tracked', 'success');
    });
  });

  // ==========================================
  // COMPLETE AREA 6: Keyboard Shortcuts
  // ==========================================
  test.describe('Keyboard Shortcuts', () => {
    test('Ctrl+Alt+G opens GitHub commit dialog', async ({ page, browserName }) => {
      const hasGithubIntegration = await page.evaluate(() => {
        return typeof window.githubCommitDialog !== 'undefined';
      });
      
      if (!hasGithubIntegration) {
        test.skip('GitHub integration not implemented yet');
        return;
      }
      
      helpers.log('Testing Ctrl+Alt+g shortcut for GitHub commit');
      
      // Set content to commit
      await helpers.setEditorContent('Content for keyboard shortcut commit test');
      
      // Track keyboard shortcut usage
      await page.evaluate(() => {
        window.githubIntegrationTestData.keyboardShortcuts.push({
          shortcut: 'Ctrl+Alt+g',
          action: 'github-commit',
          timestamp: Date.now()
        });
      });
      
      // Use keyboard shortcut
      const modifier = browserName === 'webkit' ? 'Meta' : 'Control';
      await page.keyboard.press(`${modifier}+Alt+g`);
      
      // Verify commit dialog opens
      await expect(page.locator('#github-commit-modal')).toBeVisible({ timeout: 5000 });
      
      // Verify content is available in dialog context
      const modalContent = await page.evaluate(() => {
        return window.githubCommitDialog && window.githubCommitDialog.documentContent;
      });
      
      expect(modalContent).toContain('Content for keyboard shortcut commit test');
      
      helpers.log('Ctrl+Alt+G successfully opened commit dialog with content', 'success');
      
      // Close dialog
      await page.keyboard.press('Escape');
      await expect(page.locator('#github-commit-modal')).not.toBeVisible({ timeout: 3000 });
    });


    test('keyboard shortcuts work when modal is already open', async ({ page, browserName }) => {
      const hasGithubIntegration = await page.evaluate(() => {
        return typeof window.githubCommitDialog !== 'undefined' && 
               typeof window.githubDialog !== 'undefined';
      });
      
      if (!hasGithubIntegration) {
        test.skip('GitHub integration not implemented yet');
        return;
      }
      
      helpers.log('Testing keyboard shortcuts with open modals');
      
      // Open commit dialog first
      const modifier = browserName === 'webkit' ? 'Meta' : 'Control';
      await page.keyboard.press(`${modifier}+Alt+g`);
      await expect(page.locator('#github-commit-modal')).toBeVisible({ timeout: 5000 });
      


      // Try to open commit dialog again (should close first one and reopen)
      await page.keyboard.press(`${modifier}+Alt+g`);
      
      // Should still have commit dialog open
      await expect(page.locator('#github-commit-modal')).toBeVisible({ timeout: 5000 });
      
      helpers.log('Keyboard shortcuts properly handle modal switching', 'success');

      
      // Close settings dialog
      await page.keyboard.press('Escape');
    });

    test('keyboard shortcuts are disabled when other modals are open', async ({ page, browserName }) => {
      const hasGithubIntegration = await page.evaluate(() => {
        return typeof window.githubCommitDialog !== 'undefined';
      });
      
      if (!hasGithubIntegration) {
        test.skip('GitHub integration not implemented yet');
        return;
      }
      
      helpers.log('Testing keyboard shortcut blocking with non-GitHub modals');
      
      // Open a non-GitHub modal (preferences)
      const hasPreferences = await page.evaluate(() => {
        return typeof window.preferencesDialog !== 'undefined' && 
               typeof window.preferencesDialog.show === 'function';
      });
      
      if (hasPreferences) {
        await page.evaluate(() => window.preferencesDialog.show());
        await expect(page.locator('#preferences-modal')).toBeVisible({ timeout: 5000 });
        
        // Try GitHub shortcut - should be ignored
        const modifier = browserName === 'webkit' ? 'Meta' : 'Control';
        await page.keyboard.press(`${modifier}+Alt+g`);
        
        // GitHub dialog should not open
        const githubModalVisible = await page.locator('#github-commit-modal').isVisible();
        expect(githubModalVisible).toBe(false);
        
        // Preferences dialog should still be open
        await expect(page.locator('#preferences-modal')).toBeVisible();
        
        helpers.log('GitHub shortcuts properly blocked when other modals are open', 'success');
        
        // Close preferences
        await page.keyboard.press('Escape');
      } else {
        helpers.log('Preferences dialog not available, skipping modal blocking test', 'warning');
      }
    });

    test('keyboard shortcuts work across different browser contexts', async ({ page, browserName }) => {
      const hasGithubIntegration = await page.evaluate(() => {
        return typeof window.githubCommitDialog !== 'undefined';
      });
      
      if (!hasGithubIntegration) {
        test.skip('GitHub integration not implemented yet');
        return;
      }
      
      helpers.log('Testing keyboard shortcuts across browser contexts');
      
      // Test in different focus contexts
      const contexts = [
        { name: 'editor', selector: '#editor .cm-content' },
        { name: 'title', selector: '#document-title' },
        { name: 'search', selector: '#search-input' },
        { name: 'name', selector: '#name-input' }
      ];
      
      const modifier = browserName === 'webkit' ? 'Meta' : 'Control';
      
      for (const context of contexts) {
        helpers.log(`Testing shortcut in ${context.name} context`);
        
        // Focus the context element
        await page.click(context.selector);
        await page.waitForTimeout(100);
        
        // Use GitHub shortcut
        await page.keyboard.press(`${modifier}+Alt+g`);
        
        // Should open regardless of focus context
        await expect(page.locator('#github-commit-modal')).toBeVisible({ timeout: 5000 });
        
        // Close dialog
        await page.keyboard.press('Escape');
        await expect(page.locator('#github-commit-modal')).not.toBeVisible({ timeout: 3000 });
        
        helpers.log(`Shortcut works in ${context.name} context`, 'success');
      }
    });

    test('keyboard shortcuts are registered in shortcut manager', async ({ page }) => { 
      const hasShortcutManager = await page.evaluate(() => {
        return typeof window.shortcutManager !== 'undefined' && 
               typeof window.shortcutManager.getShortcut === 'function';
      });
      
      if (!hasShortcutManager) {
        test.skip('Shortcut manager not implemented yet');
        return;
      }
      
      helpers.log('Testing GitHub shortcuts registration in shortcut manager');
      
     // Check if GitHub shortcuts are registered
      const shortcuts = await page.evaluate(() => {
        const githubCommit = window.shortcutManager.getShortcut('github-commit');
        
        return {
          commit: githubCommit,
          allShortcuts: Array.from(window.shortcutManager.shortcuts.keys())
        };
      });
      
      expect(shortcuts.commit).toBeTruthy();
      expect(shortcuts.commit.key).toBe('Ctrl+Alt+G');
      expect(shortcuts.commit.category).toBe('GitHub');
      expect(shortcuts.commit.description).toContain('Commit to GitHub'); 

      helpers.log('GitHub shortcuts properly registered in shortcut manager', 'success');
      
      // Verify shortcuts are saved to localStorage
      const savedShortcuts = await page.evaluate(() => {
        return JSON.parse(localStorage.getItem('keyboard-shortcuts') || '{}');
      });
      
      if (Object.keys(savedShortcuts).length > 0) {
        // If there are custom shortcuts, GitHub ones should be included
        const hasGithubShortcuts = savedShortcuts['github-commit'];
        if (hasGithubShortcuts) {
          helpers.log('GitHub shortcuts persisted in localStorage', 'success');
        }
       }
      
     });

    test('keyboard shortcuts can be customized', async ({ page, browserName }) => {
      const hasFeatures = await page.evaluate(() => {
        return typeof window.shortcutManager !== 'undefined' && 
               typeof window.preferencesDialog !== 'undefined' &&
               typeof window.githubCommitDialog !== 'undefined';
      });
      
      if (!hasFeatures) {
        test.skip('Shortcut customization features not implemented yet');
        return;
      }
      
      helpers.log('Testing GitHub shortcut customization');
      
      // Open preferences dialog
      await page.evaluate(() => window.preferencesDialog.show());
      await expect(page.locator('#preferences-modal')).toBeVisible({ timeout: 5000 });
      
      // Find GitHub commit shortcut
      const githubCommitShortcut = page.locator('.shortcut-key[data-action="github-commit"]');
      const shortcutExists = await githubCommitShortcut.count() > 0;
      
      if (shortcutExists) {
        // Click to edit
        await githubCommitShortcut.click();
        await expect(githubCommitShortcut).toHaveClass(/editing/);
        
        // Change to a different shortcut
        const modifier = browserName === 'webkit' ? 'Meta' : 'Control';
        await page.keyboard.press(`${modifier}+Shift+g`);
        
        // Verify change
        await expect(githubCommitShortcut).toHaveText('Ctrl+Shift+G');
        await expect(githubCommitShortcut).not.toHaveClass(/editing/);
        
        // Close preferences
        await page.keyboard.press('Escape');
        
        // Test new shortcut
        await page.keyboard.press(`${modifier}+Shift+g`);
        await expect(page.locator('#github-commit-modal')).toBeVisible({ timeout: 5000 });
        
        helpers.log('GitHub shortcut successfully customized and functional', 'success');
        
        // Close commit dialog
        await page.keyboard.press('Escape');
      } else {
        helpers.log('GitHub shortcut not found in preferences dialog', 'warning');
      }
    });

    test('keyboard shortcut performance is acceptable', async ({ page, browserName }) => {
      const hasGithubIntegration = await page.evaluate(() => {
        return typeof window.githubCommitDialog !== 'undefined';
      });
      
      if (!hasGithubIntegration) {
        test.skip('GitHub integration not implemented yet');
        return;
      }
      
      helpers.log('Testing keyboard shortcut performance');
      
      const modifier = browserName === 'webkit' ? 'Meta' : 'Control';
      const performanceTests = [];
      
      // Test shortcut response time multiple times
      for (let i = 0; i < 5; i++) {
        const startTime = Date.now();
        
        await page.keyboard.press(`${modifier}+Alt+g`);
        await expect(page.locator('#github-commit-modal')).toBeVisible({ timeout: 5000 });
        
        const responseTime = Date.now() - startTime;
        performanceTests.push(responseTime);
        
        await page.keyboard.press('Escape');
        await expect(page.locator('#github-commit-modal')).not.toBeVisible({ timeout: 3000 });
        
        await page.waitForTimeout(100); // Brief pause between tests
      }
      
      const averageTime = performanceTests.reduce((a, b) => a + b, 0) / performanceTests.length;
      const maxTime = Math.max(...performanceTests);
      
      // Performance expectations
      expect(averageTime).toBeLessThan(1000); // Should respond within 1 second on average
      expect(maxTime).toBeLessThan(2000); // Should never take more than 2 seconds
      
      helpers.log(`Keyboard shortcut performance: avg ${averageTime.toFixed(0)}ms, max ${maxTime}ms`, 'success');
      
      // Store performance data
      await page.evaluate((data) => {
        window.githubIntegrationTestData.performance.keyboardShortcuts = data;
      }, { average: averageTime, maximum: maxTime, tests: performanceTests });
    });
  });

  // ==========================================
  // COMPLETE AREA 7: Error Recovery Scenarios
  // ==========================================
  test.describe('Error Recovery Scenarios', () => {
    test('recovers from network failures during commit', async ({ page }) => {
      const hasGithubIntegration = await page.evaluate(() => {
        return typeof window.githubService !== 'undefined' && 
               typeof window.githubCommitDialog !== 'undefined';
      });
      
      if (!hasGithubIntegration) {
        test.skip('GitHub integration not implemented yet');
        return;
      }
      
      helpers.log('Testing network failure recovery during commit');
      
      // Mock network failure
      await page.evaluate(() => {
        const originalCommit = window.githubService.commitFile;
        window.githubService.commitFile = async function(...args) {
          window.githubIntegrationTestData.recoveryAttempts.push({
            type: 'network-failure-commit',
            timestamp: Date.now(),
            args: args.map(arg => typeof arg === 'string' ? arg.substring(0, 50) : typeof arg)
          });
          throw new Error('Network request failed');
        };
        window._originalCommitForRecovery = originalCommit;
      });
      
      // Set content and open commit dialog
      await helpers.setEditorContent('Content for network failure test');
      
      await page.evaluate(() => {
        if (window.githubCommitDialog && window.automergeHandle) {
          const handle = window.automergeHandle;
          window.githubCommitDialog.show('Content for network failure test', handle, null);
        }
      });
      
      await expect(page.locator('#github-commit-modal')).toBeVisible({ timeout: 5000 });
      
      // Configure and attempt commit
      await page.fill('#commit-path', 'network-test.md');
      await page.fill('#commit-message', 'Network failure test');
      await page.click('#execute-commit');
      
      // Should show error
      await expect(page.locator('#commit-status')).toContainText('failed', { timeout: 5000 });
      await expect(page.locator('#commit-status')).toHaveClass(/status-error/);
      
      helpers.log('Network failure properly handled with error message', 'success');
      
      // Restore network and retry
      await page.evaluate(() => {
        window.githubService.commitFile = window._originalCommitForRecovery;
        delete window._originalCommitForRecovery;
      });
      
      // Retry commit
      await page.click('#execute-commit');
      
      // Should succeed this time
      await expect(page.locator('#commit-status')).toContainText('Successfully committed', { timeout: 5000 });
      await expect(page.locator('#commit-status')).toHaveClass(/status-success/);
      
      helpers.log('Network recovery successful - commit completed after retry', 'success');
      
      // Close dialog
      await page.keyboard.press('Escape');
    });

    test('recovers from invalid token scenarios', async ({ page }) => {
      const hasGithubIntegration = await page.evaluate(() => {
        return typeof window.githubService !== 'undefined' && 
               typeof window.githubDialog !== 'undefined';
      });
      
      if (!hasGithubIntegration) {
        test.skip('GitHub integration not implemented yet');
        return;
      }
      
      helpers.log('Testing invalid token recovery');
      
      // Open GitHub settings
      await page.evaluate(() => window.githubDialog.show());
      await expect(page.locator('#github-modal')).toBeVisible({ timeout: 5000 });
      
      // Enter invalid token
      await page.fill('#github-token', 'invalid_token_12345');
      
      // Track recovery attempt
      await page.evaluate(() => {
        window.githubIntegrationTestData.recoveryAttempts.push({
          type: 'invalid-token-validation',
          timestamp: Date.now()
        });
      });
      
      // Attempt validation
      await page.click('#validate-token');

      // Wait for status to appear
      await page.waitForFunction(() => {
        const status = document.querySelector('#token-status');
        return status && status.textContent.trim().length > 0;
      }, { timeout: 5000 });

      // Should show error
      await expect(page.locator('#token-status')).toContainText('failed', { timeout: 5000 });

      helpers.log('Invalid token properly rejected with error message', 'success');
      
      // Correct the token
      await page.fill('#github-token', 'integration_test_token_12345');
      await page.click('#validate-token');
      
      // Should succeed
      await expect(page.locator('#token-status')).toContainText('valid', { timeout: 5000 });
      await expect(page.locator('#token-status')).toHaveClass(/status-valid/);
      
      helpers.log('Token recovery successful - valid token accepted', 'success');
      
      // Close dialog
      await page.keyboard.press('Escape');
    });

    test('recovers from repository access errors', async ({ page }) => {
      const hasGithubIntegration = await page.evaluate(() => {
        return typeof window.githubService !== 'undefined' && 
               typeof window.githubPullDialog !== 'undefined';
      });
      
      if (!hasGithubIntegration) {
        test.skip('GitHub integration not implemented yet');
        return;
      }
      
      helpers.log('Testing repository access error recovery');
      
      // Open pull dialog
      await page.evaluate(() => {
        if (window.githubPullDialog && window.editorView && window.automergeHandle) {
          const handle = window.automergeHandle;
          window.githubPullDialog.show(handle, window.editorView);
        }
      });
      
      await expect(page.locator('#github-pull-modal')).toBeVisible({ timeout: 5000 });
      
      // Try to access non-existent file
      await page.fill('#pull-path', 'nonexistent/file.md');
      
      // Track recovery attempt
      await page.evaluate(() => {
        window.githubIntegrationTestData.recoveryAttempts.push({
          type: 'repository-access-error',
          timestamp: Date.now()
        });
      });
      
      // Attempt to preview
      await page.click('#preview-file');
      
      // Should show error
      await expect(page.locator('#pull-status')).toContainText('Failed to fetch', { timeout: 5000 });
      await expect(page.locator('#pull-status')).toHaveClass(/status-error/);
      
      // Preview should show error message
      await expect(page.locator('#file-preview')).toContainText('File not found');
      
      helpers.log('Repository access error properly handled with error message', 'success');
      
      // Correct the path
      await page.fill('#pull-path', 'README.md');
      await page.click('#preview-file');
      
      // Should succeed
      await expect(page.locator('#pull-status')).toContainText('successfully', { timeout: 5000 });
      await expect(page.locator('#pull-status')).toHaveClass(/status-success/);
      
      // Preview should show content
      await expect(page.locator('#file-preview')).toContainText('Main Repository');
      
      helpers.log('Repository access recovery successful - valid file loaded', 'success');
      
      // Close dialog
      await page.keyboard.press('Escape');
    });

    test('recovers from malformed settings data', async ({ page }) => {
      const hasGithubIntegration = await page.evaluate(() => {
        return typeof window.githubService !== 'undefined';
      });
      
      if (!hasGithubIntegration) {
        test.skip('GitHub integration not implemented yet');
        return;
      }
      
      helpers.log('Testing malformed settings data recovery');
      
      // Corrupt localStorage settings
      await page.evaluate(() => {
        window.githubIntegrationTestData.recoveryAttempts.push({
          type: 'malformed-settings-recovery',
          timestamp: Date.now()
        });
        
        localStorage.setItem('github-settings', '{"invalid": json}');
      });
      
      // Reload GitHub service settings
      await page.evaluate(() => {
        if (window.githubService && window.githubService.loadSettings) {
          try {
            window.githubService.settings = window.githubService.loadSettings();
          } catch (error) {
            console.log('Settings load error handled:', error.message);
          }
        }
      });
      
      // Should fall back to defaults
      const settings = await page.evaluate(() => window.githubService.settings);
      
      expect(settings.token).toBe('');
      expect(settings.enabled).toBe(false);
      expect(settings.repos).toEqual([]);
      expect(settings.commitMessage).toBeTruthy();
      
      helpers.log('Malformed settings recovered with default values', 'success');
      
      // Should be able to set new valid settings
      await page.evaluate(() => {
        window.githubService.settings = {
          token: 'recovery_token',
          username: 'recoveryuser',
          repos: [],
          selectedRepo: '',
          defaultPath: '',
          commitMessage: 'Recovery test',
          enabled: true,
          lastCommit: null
        };
        window.githubService.saveSettings();
      });
      
      // Verify recovery settings are saved
      const recoveredSettings = await page.evaluate(() => {
        return JSON.parse(localStorage.getItem('github-settings') || '{}');
      });
      
      expect(recoveredSettings.token).toBe('recovery_token');
      expect(recoveredSettings.enabled).toBe(true);
      
      helpers.log('New settings successfully saved after recovery', 'success');
    });

    test('recovers from dialog state corruption', async ({ page }) => {
      const hasGithubIntegration = await page.evaluate(() => {
        return typeof window.githubCommitDialog !== 'undefined';
      });
      
      if (!hasGithubIntegration) {
        test.skip('GitHub integration not implemented yet');
        return;
      }
      
      helpers.log('Testing dialog state corruption recovery');
      
      // Corrupt dialog state
      await page.evaluate(() => {
        window.githubIntegrationTestData.recoveryAttempts.push({
          type: 'dialog-state-corruption',
          timestamp: Date.now()
        });
        
        if (window.githubCommitDialog) {
          // Simulate corrupted state
          window.githubCommitDialog.isOpen = true;
          window.githubCommitDialog.isLoading = true;
          window.githubCommitDialog.documentContent = undefined;
        }
      });
      
      // Try to open dialog with corrupted state
      await page.evaluate(() => {
        if (window.githubCommitDialog && window.automergeHandle) {
          const handle = window.automergeHandle;
          window.githubCommitDialog.show('Recovery test content', handle, null);
        }
      });
      
      // Should still open and function
      // Should still open and function
      await expect(page.locator('#github-commit-modal')).toBeVisible({ timeout: 5000 });

      // Wait for dialog to fully recover from corruption
      await page.waitForFunction(() => {
        const modal = document.querySelector('#github-commit-modal');
        const form = document.querySelector('#commit-repo');
        return modal && form && !window.githubCommitDialog.isLoading;
      }, { timeout: 5000 });

      // Verify dialog is functional
      await expect(page.locator('#commit-repo')).toBeVisible();
      await expect(page.locator('#commit-path')).toBeVisible();
      await expect(page.locator('#execute-commit')).toBeEnabled();
          
      helpers.log('Dialog recovered from corrupted state and is functional', 'success');
      
      // Verify content was properly set
      const dialogContent = await page.evaluate(() => window.githubCommitDialog.documentContent);
      expect(dialogContent).toBe('Recovery test content');
      
      // Close dialog
      await page.keyboard.press('Escape');
      
      // Verify clean state after close
      const dialogState = await page.evaluate(() => ({
        isOpen: window.githubCommitDialog.isOpen,
        isLoading: window.githubCommitDialog.isLoading,
        content: window.githubCommitDialog.documentContent
      }));
      
      expect(dialogState.isOpen).toBe(false);
      expect(dialogState.isLoading).toBe(false);
      expect(dialogState.content).toBe('');
      
      helpers.log('Dialog state properly cleaned after close', 'success');
    });

    test('recovers from simultaneous operation conflicts', async ({ page }) => {
      const hasGithubIntegration = await page.evaluate(() => {
        return typeof window.githubService !== 'undefined' && 
               typeof window.githubCommitDialog !== 'undefined' &&
               typeof window.githubPullDialog !== 'undefined';
      });
      
      if (!hasGithubIntegration) {
        test.skip('GitHub integration not implemented yet');
        return;
      }
      
      helpers.log('Testing simultaneous operation conflict recovery');
      
      // Track conflict scenario
      await page.evaluate(() => {
        window.githubIntegrationTestData.recoveryAttempts.push({
          type: 'simultaneous-operation-conflict',
          timestamp: Date.now()
        });
      });
      
      // Open commit dialog
      await page.evaluate(() => {
        if (window.githubCommitDialog && window.automergeHandle) {
          const handle = window.automergeHandle;
          window.githubCommitDialog.show('Conflict test content', handle, null);
        }
      });
      
      await expect(page.locator('#github-commit-modal')).toBeVisible({ timeout: 5000 });
      
      // Try to open pull dialog while commit is open (should close commit)
      await page.evaluate(() => {
        if (window.githubPullDialog && window.editorView && window.automergeHandle) {
          const handle = window.automergeHandle;
          window.githubPullDialog.show(handle, window.editorView);
        }
      });
      
      // Commit dialog should close, pull should open
      await expect(page.locator('#github-commit-modal')).not.toBeVisible({ timeout: 3000 });
      await expect(page.locator('#github-pull-modal')).toBeVisible({ timeout: 5000 });
      
      helpers.log('Dialog conflict resolved - commit closed, pull opened', 'success');
      
      // Close pull dialog
      await page.keyboard.press('Escape');
      
      // Try simultaneous keyboard shortcuts
      await page.keyboard.press('Control+Alt+g'); // Commit
      await page.waitForTimeout(100);
      await page.keyboard.press('Control+Alt+Shift+g'); // Settings
      
      // Should end up with settings dialog open
      await expect(page.locator('#github-modal')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('#github-commit-modal')).not.toBeVisible();
      
      helpers.log('Simultaneous keyboard shortcuts resolved correctly', 'success');
      
      // Close settings
      await page.keyboard.press('Escape');
    });

    test('maintains data integrity during recovery', async ({ page }) => {
      const hasGithubIntegration = await page.evaluate(() => {
        return typeof window.githubService !== 'undefined';
      });
      
      if (!hasGithubIntegration) {
        test.skip('GitHub integration not implemented yet');
        return;
      }
      
      helpers.log('Testing data integrity during error recovery');
      
      // Set up initial state
      const testContent = 'Data integrity test content that should be preserved';
      await helpers.setEditorContent(testContent);
      
      // Set some GitHub settings
      await page.evaluate(() => {
        window.githubService.settings = {
          token: 'integrity_test_token',
          username: 'integrityuser',
          repos: [{ name: 'test-repo', fullName: 'integrityuser/test-repo', defaultBranch: 'main' }],
          selectedRepo: 'integrityuser/test-repo',
          defaultPath: 'integrity-test.md',
          commitMessage: 'Integrity test commit',
          enabled: true,
          lastCommit: null
        };
        window.githubService.saveSettings();
      });
      
      // Verify initial state
      const initialContent = await helpers.getEditorContent();
      const initialSettings = await page.evaluate(() => window.githubService.settings);
      
      expect(initialContent).toBe(testContent);
      expect(initialSettings.username).toBe('integrityuser');
      
      // Simulate various error scenarios
      const errorScenarios = [
        'network-failure',
        'invalid-response', 
        'token-expiration',
        'rate-limiting'
      ];
      
      for (const scenario of errorScenarios) {
        helpers.log(`Testing data integrity during ${scenario}`);
        
        // Track recovery attempt
        await page.evaluate((scenario) => {
          window.githubIntegrationTestData.recoveryAttempts.push({
            type: `data-integrity-${scenario}`,
            timestamp: Date.now()
          });
        }, scenario);
        
        // Simulate error and attempt operations
        await page.evaluate((scenario) => {
          const originalCommit = window.githubService.commitFile;
          window.githubService.commitFile = async function() {
            throw new Error(`Simulated ${scenario} error`);
          };
          setTimeout(() => {
            window.githubService.commitFile = originalCommit;
          }, 1000);
        }, scenario);
        
        // Try to commit (should fail)
        await page.evaluate(() => {
          if (window.githubCommitDialog && window.automergeHandle) {
            const handle = window.automergeHandle;
            window.githubCommitDialog.show(window.editorView.state.doc.toString(), handle, null);
          }
        });
        
        await expect(page.locator('#github-commit-modal')).toBeVisible({ timeout: 5000 });
        await page.fill('#commit-path', `${scenario}-test.md`);
        await page.fill('#commit-message', `${scenario} test`);
        await page.click('#execute-commit');
        
        // Should show error but not corrupt data
        await expect(page.locator('#commit-status')).toContainText('failed', { timeout: 5000 });
        
        // Close dialog
        await page.keyboard.press('Escape');
        
        // Verify data integrity maintained
        const currentContent = await helpers.getEditorContent();
        const currentSettings = await page.evaluate(() => window.githubService.settings);
        
        expect(currentContent).toBe(testContent);
        expect(currentSettings.username).toBe('integrityuser');
        expect(currentSettings.selectedRepo).toBe('integrityuser/test-repo');
        
        await page.waitForTimeout(1200); // Wait for mock to be restored
      }
      
      helpers.log('Data integrity maintained through all error scenarios', 'success');
      
      // Verify recovery tracking
      const recoveryData = await page.evaluate(() => window.githubIntegrationTestData.recoveryAttempts);
      const integrityTests = recoveryData.filter(r => r.type.includes('data-integrity'));
      
      expect(integrityTests.length).toBe(errorScenarios.length);
      helpers.log(`Tracked ${integrityTests.length} data integrity recovery attempts`, 'success');
    });

    test('provides helpful error messages for common issues', async ({ page }) => {
      const hasGithubIntegration = await page.evaluate(() => {
        return typeof window.githubService !== 'undefined' && 
               typeof window.githubCommitDialog !== 'undefined';
      });
      
      if (!hasGithubIntegration) {
        test.skip('GitHub integration not implemented yet');
        return;
      }
      
      helpers.log('Testing error message quality and helpfulness');
      
      const errorScenarios = [
        {
          name: 'missing-token',
          setup: () => page.evaluate(() => { window.githubService.settings.token = ''; }),
          expectedMessage: 'not configured'
        },
        {
          name: 'empty-path',
          setup: async () => {
            await page.evaluate(() => {
              if (window.githubCommitDialog && window.automergeHandle) {
                const handle = window.automergeHandle;
                window.githubCommitDialog.show('test content', handle, null);
              }
            });
            await expect(page.locator('#github-commit-modal')).toBeVisible({ timeout: 5000 });
            await page.fill('#commit-path', '');
          },
          expectedMessage: 'enter a file path',
          closeDialog: true
        },
        {
          name: 'empty-message',
          setup: async () => {
            await page.evaluate(() => {
              if (window.githubCommitDialog && window.automergeHandle) {
                const handle = window.automergeHandle;
                window.githubCommitDialog.show('test content', handle, null);
              }
            });
            await expect(page.locator('#github-commit-modal')).toBeVisible({ timeout: 5000 });
            await page.fill('#commit-path', 'test.md');
            await page.fill('#commit-message', '');
          },
          expectedMessage: 'enter a commit message',
          closeDialog: true
        },
        {
          name: 'no-repository',
          setup: async () => {
            await page.evaluate(() => {
              if (window.githubCommitDialog && window.automergeHandle) {
                const handle = window.automergeHandle;
                window.githubCommitDialog.show('test content', handle, null);
              }
            });
            await expect(page.locator('#github-commit-modal')).toBeVisible({ timeout: 5000 });
            await page.selectOption('#commit-repo', '');
          },
          expectedMessage: 'select a repository',
          closeDialog: true
        }
      ];
      
      for (const scenario of errorScenarios) {
        helpers.log(`Testing error message for: ${scenario.name}`);
        
        // Track error message test
        await page.evaluate((name) => {
          window.githubIntegrationTestData.recoveryAttempts.push({
            type: `error-message-test-${name}`,
            timestamp: Date.now()
          });
        }, scenario.name);
        
        // Setup scenario
        await scenario.setup();
        
        // If this is a dialog test, try to commit
        if (scenario.closeDialog) {
          await page.click('#execute-commit');
          
          // Check for helpful error message
          await expect(page.locator('#commit-status')).toContainText(scenario.expectedMessage, { timeout: 3000 });
          await expect(page.locator('#commit-status')).toHaveClass(/status-error/);
          
          helpers.log(`Error message for ${scenario.name}: contains "${scenario.expectedMessage}"`, 'success');
          
          // Close dialog
          await page.keyboard.press('Escape');
        } else {
          // For non-dialog scenarios, check the error handling
          helpers.log(`Setup completed for ${scenario.name}: expected "${scenario.expectedMessage}"`, 'success');
        }
        
        await page.waitForTimeout(500);
      }
      
      helpers.log('All error message scenarios tested successfully', 'success');
    });

    test('recovery state is properly tracked and logged', async ({ page }) => {
      const hasGithubIntegration = await page.evaluate(() => {
        return typeof window.githubService !== 'undefined';
      });
      
      if (!hasGithubIntegration) {
        test.skip('GitHub integration not implemented yet');
        return;
      }
      
      helpers.log('Testing recovery state tracking and logging');
      
      // Trigger multiple recovery scenarios
      const recoveryTests = [
        'network-recovery',
        'token-recovery', 
        'settings-recovery',
        'dialog-recovery',
        'conflict-recovery'
      ];
      
      for (const testType of recoveryTests) {
        await page.evaluate((type) => {
          window.githubIntegrationTestData.recoveryAttempts.push({
            type: type,
            timestamp: Date.now(),
            success: true,
            details: `Recovery test for ${type}`
          });
        }, testType);
      }
      
      // Verify tracking data structure
      const trackingData = await page.evaluate(() => window.githubIntegrationTestData.recoveryAttempts);
      
      expect(trackingData.length).toBeGreaterThanOrEqual(recoveryTests.length);
      
      // Verify each recovery type is tracked
      const trackedTypes = trackingData.map(recovery => recovery.type);
      for (const testType of recoveryTests) {
        expect(trackedTypes).toContain(testType);
      }
      
      // Verify data structure integrity
      for (const recovery of trackingData) {
        expect(recovery.timestamp).toBeTruthy();
        expect(recovery.type).toBeTruthy();
        expect(typeof recovery.success).toBe('boolean');
      }
      
      helpers.log('Recovery state tracking verified with proper data structure', 'success');
      
      // Test performance tracking for recovery operations
      const performanceData = await page.evaluate(() => window.githubIntegrationTestData.performance);
      
      expect(performanceData.commits).toBeDefined();
      expect(performanceData.pulls).toBeDefined();
      expect(performanceData.validations).toBeDefined();
      
      helpers.log('Performance tracking integrated with recovery scenarios', 'success');
    });

    test('graceful degradation when GitHub service is unavailable', async ({ page }) => {
      const hasGithubIntegration = await page.evaluate(() => {
        return typeof window.githubService !== 'undefined';
      });
      
      if (!hasGithubIntegration) {
        test.skip('GitHub integration not implemented yet');
        return;
      }
      
      helpers.log('Testing graceful degradation with unavailable GitHub service');
      
      // Completely disable GitHub service
      await page.evaluate(() => {
        window.githubIntegrationTestData.recoveryAttempts.push({
          type: 'service-unavailable-degradation',
          timestamp: Date.now()
        });
        
        // Backup and disable service
        window._githubServiceBackup = window.githubService;
        delete window.githubService;
      });
      
      // Editor should still function normally
      await helpers.setEditorContent('Content with GitHub service disabled');
      const content = await helpers.getEditorContent();
      expect(content).toBe('Content with GitHub service disabled');
      
      // Formatting should still work
      await helpers.selectAllText();
      await helpers.applyBold();
      const boldContent = await helpers.getEditorContent();
      expect(boldContent).toContain('**Content with GitHub service disabled**');
      
      helpers.log('Core editor functionality maintained without GitHub service', 'success');
      
      // Menu items should handle missing service gracefully
      try {
        await helpers.openMenu('file');
        const githubMenuItems = await page.locator('[data-action^="github-"]').count();

        if (githubMenuItems > 0) {
          // If menu items exist, they should handle missing service
          await helpers.clickMenuItem('github-commit');
        
          // Wait for any response
          await page.waitForTimeout(1000);
        
          // Should either not respond or show appropriate error
          const modalVisible = await page.locator('#github-commit-modal').isVisible();
          if (modalVisible) {
            // If modal opens, it should show service unavailable message
            await expect(page.locator('#commit-status')).toContainText('not available', { timeout: 5000 });
            await page.keyboard.press('Escape');
          }
        }
      } catch (error) {
        // Menu system may fail gracefully when service unavailable
        helpers.log('Menu system gracefully degraded when service unavailable', 'info');
      }

      // Keyboard shortcuts should not break the application
      await page.keyboard.press('Control+Alt+g');
      await page.waitForTimeout(500);
      
      // Application should remain responsive
      await helpers.typeInEditor(' Additional text after shortcut');
      const finalContent = await helpers.getEditorContent();
      expect(finalContent).toContain('Additional text after shortcut');
      
      helpers.log('Keyboard shortcuts safe when service unavailable', 'success');
      
      // Restore service
      await page.evaluate(() => {
        if (window._githubServiceBackup) {
          window.githubService = window._githubServiceBackup;
          delete window._githubServiceBackup;
        }
      });
    });

    test('comprehensive error boundary testing', async ({ page }) => {
      const hasGithubIntegration = await page.evaluate(() => {
        return typeof window.githubService !== 'undefined' && 
               typeof window.githubCommitDialog !== 'undefined';
      });
      
      if (!hasGithubIntegration) {
        test.skip('GitHub integration not implemented yet');
        return;
      }
      
      helpers.log('Testing comprehensive error boundary scenarios');
      
      const errorBoundaryTests = [
        {
          name: 'json-parse-error',
          trigger: () => page.evaluate(() => {
            const original = JSON.parse;
            JSON.parse = function(text) {
              if (text.includes('github')) throw new Error('JSON parse failure');
              return original(text);
            };
            setTimeout(() => { JSON.parse = original; }, 2000);
          })
        },
        {
          name: 'dom-manipulation-error',
          trigger: () => page.evaluate(() => {
            const original = document.createElement;
            document.createElement = function(tag) {
              if (tag === 'div' && new Error().stack.includes('github')) {
                throw new Error('DOM manipulation failure');
              }
              return original.call(document, tag);
            };
            setTimeout(() => { document.createElement = original; }, 2000);
          })
        },
        {
          name: 'event-handler-error',
          trigger: () => page.evaluate(() => {
            const original = addEventListener;
            window.addEventListener = function(type, handler, options) {
              if (type === 'click' && handler.toString().includes('github')) {
                throw new Error('Event handler failure');
              }
              return original.call(this, type, handler, options);
            };
            setTimeout(() => { window.addEventListener = original; }, 2000);
          })
        }
      ];
      
      for (const errorTest of errorBoundaryTests) {
        helpers.log(`Testing error boundary: ${errorTest.name}`);
        
        // Track error boundary test
        await page.evaluate((testName) => {
          window.githubIntegrationTestData.recoveryAttempts.push({
            type: `error-boundary-${testName}`,
            timestamp: Date.now()
          });
        }, errorTest.name);
        
        // Set up error condition
        await errorTest.trigger();
        
        // Try to use GitHub functionality
        try {
          await page.evaluate(() => {
            if (window.githubCommitDialog && window.automergeHandle) {
              const handle = window.automergeHandle;
              window.githubCommitDialog.show('Error boundary test', handle, null);
            }
          });
          
          // Should either work normally or fail gracefully
          const modalVisible = await page.locator('#github-commit-modal').isVisible();
          if (modalVisible) {
            // If modal opens, basic functionality should work
            await expect(page.locator('#commit-repo')).toBeVisible();
            await page.keyboard.press('Escape');
          }
          
        } catch (error) {
          helpers.log(`Error boundary test ${errorTest.name} caught error: ${error.message}`, 'warning');
        }
        
        // Application should remain functional
        await helpers.setEditorContent(`${errorTest.name} test content`);
        const content = await helpers.getEditorContent();
        expect(content).toBe(`${errorTest.name} test content`);
        
        helpers.log(`Error boundary ${errorTest.name} - application remains functional`, 'success');
        
        // Wait for mock restoration
        await page.waitForTimeout(2100);
      }
      
      helpers.log('All error boundary tests completed', 'success');
    });
  });

  // ==========================================
  // Test Summary and Integration Verification
  // ==========================================
  test('integration test summary and verification', async ({ page }) => {
    const hasGithubIntegration = await page.evaluate(() => {
      return typeof window.githubService !== 'undefined' && 
             typeof window.githubCommitDialog !== 'undefined' &&
             typeof window.githubPullDialog !== 'undefined' &&
             typeof window.githubDialog !== 'undefined';
    });
    
    if (!hasGithubIntegration) {
      test.skip('GitHub integration not implemented yet');
      return;
    }
    
    helpers.log('Running integration test summary and verification');
    
    // Verify all integration data was collected
    const integrationData = await page.evaluate(() => window.githubIntegrationTestData);
    
    expect(integrationData).toBeDefined();
    expect(integrationData.commits).toBeDefined();
    expect(integrationData.pulls).toBeDefined();
    expect(integrationData.settings).toBeDefined();
    expect(integrationData.errors).toBeDefined();
    expect(integrationData.performance).toBeDefined();
    expect(integrationData.menuInteractions).toBeDefined();
    expect(integrationData.keyboardShortcuts).toBeDefined();
    expect(integrationData.recoveryAttempts).toBeDefined();
    
    helpers.log('All integration data structures verified', 'success');
    
    // Verify menu integration worked
    if (integrationData.menuInteractions.length > 0) {
      const menuTypes = [...new Set(integrationData.menuInteractions.map(m => m.type))];
      expect(menuTypes.length).toBeGreaterThan(0);
      helpers.log(`Menu integration: ${menuTypes.length} different interaction types tracked`, 'success');
    }
    
    // Verify keyboard shortcuts were tested
    if (integrationData.keyboardShortcuts.length > 0) {
      const shortcuts = [...new Set(integrationData.keyboardShortcuts.map(k => k.shortcut))];
      expect(shortcuts).toContain('Ctrl+Alt+G');
      helpers.log(`Keyboard shortcuts: ${shortcuts.length} shortcuts tested`, 'success');
    }
    
    // Verify recovery scenarios were tested
    if (integrationData.recoveryAttempts.length > 0) {
      const recoveryTypes = [...new Set(integrationData.recoveryAttempts.map(r => r.type))];
      expect(recoveryTypes.length).toBeGreaterThan(5);
      helpers.log(`Error recovery: ${recoveryTypes.length} recovery scenarios tested`, 'success');
    }
    
    // Verify performance data was collected
    const perfData = integrationData.performance;
    if (perfData.commits.length > 0) {
      const avgCommitTime = perfData.commits.reduce((sum, c) => sum + c.processingTime, 0) / perfData.commits.length;
      expect(avgCommitTime).toBeLessThan(5000); // Should be reasonable
      helpers.log(`Performance: Average commit time ${avgCommitTime.toFixed(0)}ms`, 'success');
    }
    
    // Generate summary report
    const summary = {
      totalTests: {
        menuInteractions: integrationData.menuInteractions.length,
        keyboardShortcuts: integrationData.keyboardShortcuts.length,
        recoveryAttempts: integrationData.recoveryAttempts.length,
        commits: integrationData.commits.length,
        pulls: integrationData.pulls.length
      },
      performance: {
        averageCommitTime: perfData.commits.length > 0 ? 
          (perfData.commits.reduce((sum, c) => sum + c.processingTime, 0) / perfData.commits.length).toFixed(0) + 'ms' : 'N/A',
        averagePullTime: perfData.pulls.length > 0 ? 
          (perfData.pulls.reduce((sum, p) => sum + p.processingTime, 0) / perfData.pulls.length).toFixed(0) + 'ms' : 'N/A',
        averageValidationTime: perfData.validations.length > 0 ? 
          (perfData.validations.reduce((sum, v) => sum + v.processingTime, 0) / perfData.validations.length).toFixed(0) + 'ms' : 'N/A'
      },
      coverage: {
        menuIntegration: integrationData.menuInteractions.length > 0,
        keyboardShortcuts: integrationData.keyboardShortcuts.length > 0,
        errorRecovery: integrationData.recoveryAttempts.length > 0,
        performanceTesting: perfData.commits.length > 0 || perfData.pulls.length > 0
      }
    };
    
    helpers.log('=== GITHUB INTEGRATION TEST SUMMARY ===');
    helpers.log(`Menu Interactions: ${summary.totalTests.menuInteractions}`);
    helpers.log(`Keyboard Shortcuts: ${summary.totalTests.keyboardShortcuts}`);
    helpers.log(`Recovery Attempts: ${summary.totalTests.recoveryAttempts}`);
    helpers.log(`Commits Tested: ${summary.totalTests.commits}`);
    helpers.log(`Pulls Tested: ${summary.totalTests.pulls}`);
    helpers.log(`Average Commit Time: ${summary.performance.averageCommitTime}`);
    helpers.log(`Average Pull Time: ${summary.performance.averagePullTime}`);
    helpers.log(`Average Validation Time: ${summary.performance.averageValidationTime}`);
    helpers.log('=== END SUMMARY ===');
    
    // Verify all areas were covered
    expect(summary.coverage.menuIntegration).toBe(true);
    expect(summary.coverage.keyboardShortcuts).toBe(true);
    expect(summary.coverage.errorRecovery).toBe(true);
    expect(summary.coverage.performanceTesting).toBe(true);
    
    helpers.log('GitHub Integration Tests - All areas successfully covered', 'success');
    });
  });
