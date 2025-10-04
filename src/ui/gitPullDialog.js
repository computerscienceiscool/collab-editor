// File: src/ui/gitPullDialog.js
/**
 * Git pull dialog
 * Handles the process of pulling a document from GitHub or Gitea
 */
import { gitService } from '../git/gitService.js';

export class GitPullDialog {
  constructor() {
    this.isOpen = false;
    this.isLoading = false;
    this.repositories = [];
    this.handleEscape = null;
    this.fileContent = null;
  }

  /**
   * Show Git pull dialog
   * @param {Object} ytext - Yjs text instance to update with pulled content
   * @param {Object} view - CodeMirror editor view
   */
  async show(ytext, view) {
    if (this.isOpen) return;
    
    this.isOpen = true;
    this.ytext = ytext;
    this.view = view;
    document.body.style.overflow = 'hidden';
    
    // Create and show modal
    const modal = this.createModalHTML();
    document.body.appendChild(modal);
    
    // Populate with current settings
    this.populateSettings();
    
    // Setup event listeners
    this.setupEventListeners();
    
    // If repos exist, try to load file list
    if (gitService.settings.selectedRepo) {
      this.updateFilePath();
    }
    
    console.log(`${gitService.getActivePlatformName()} pull dialog opened`);
  }

  /**
   * Hide Git pull dialog
   */
  hide() {
    if (!this.isOpen) return;
    
    this.isOpen = false;
    document.body.style.overflow = 'auto';
    
    // Remove escape key listener
    if (this.handleEscape) {
      document.removeEventListener('keydown', this.handleEscape);
      this.handleEscape = null;
    }
    
    const modal = document.getElementById('git-pull-modal');
    if (modal) {
      modal.remove();
    }
    
    // Reset state
    this.repositories = [];
    this.ytext = null;
    this.view = null;
    this.fileContent = null;
    
    console.log(`${gitService.getActivePlatformName()} pull dialog closed`);
  }

  /**
   * Create the modal HTML structure
   */
  createModalHTML() {
    const modal = document.createElement('div');
    modal.id = 'git-pull-modal';
    modal.className = 'modal-overlay show';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-labelledby', 'pull-title');
    
    const platformName = gitService.getActivePlatformName();
    
    modal.innerHTML = `
      <div class="modal-dialog git-commit-dialog">
        <div class="modal-header">
          <h2 id="pull-title" class="modal-title">Pull from ${platformName}</h2>
          <button class="modal-close" type="button" id="pull-close">&times;</button>
        </div>
        <div class="modal-content">
          <div class="settings-section">
            <h3>Repository Information</h3>
            <div class="input-group">
              <label for="pull-repo">${platformName} Repository:</label>
              <select id="pull-repo" class="settings-input">
                <option value="">-- Select a repository --</option>
              </select>
            </div>
            <div class="input-group">
              <label for="pull-path">File Path:</label>
              <input 
                type="text" 
                id="pull-path" 
                class="settings-input" 
                placeholder="path/to/file.md"
              />
            </div>
          </div>
          
          <div class="settings-section">
            <h3>File Preview</h3>
            <div class="preview-container">
              <div id="file-preview" class="file-preview">
                <div class="preview-placeholder">Select a file to preview content</div>
              </div>
            </div>
          </div>
          
          <div class="warning-section">
            <div class="warning-message">
              <strong>Warning:</strong> Pulling a file will replace your current document content.
            </div>
          </div>
          
          <div class="status-section">
            <div id="pull-status" class="status-message"></div>
          </div>
        </div>
        <div class="modal-footer">
          <button id="configure-git-pull" class="secondary-button">Configure ${platformName}</button>
          <button id="preview-file" class="secondary-button">Preview File</button>
          <button id="execute-pull" class="primary-button">Pull File</button>
          <button id="cancel-pull" class="modal-button">Cancel</button>
        </div>
      </div>
    `;
    
    return modal;
  }

  /**
   * Populate dialog with current settings
   */
  populateSettings() {
    const settings = gitService.settings;
    
    const repoSelect = document.getElementById('pull-repo');
    const pathInput = document.getElementById('pull-path');
    
    if (!settings.enabled || !settings.token) {
      this.setStatus('warning', `${gitService.getActivePlatformName()} integration not configured. Please configure first.`);
    }
    
    if (repoSelect) {
      // Clear existing options
      while (repoSelect.options.length > 1) {
        repoSelect.remove(1);
      }
      
      // Add repository options
      if (settings.repos && settings.repos.length > 0) {
        settings.repos.forEach(repo => {
          const option = document.createElement('option');
          option.value = repo.fullName;
          option.textContent = repo.fullName;
          repoSelect.appendChild(option);
        });
        
        // Select current repo if set
        if (settings.selectedRepo) {
          repoSelect.value = settings.selectedRepo;
        }
      }
    }
    
    // Set file path if available
    if (pathInput) {
      pathInput.value = settings.defaultPath || '';
    }
  }

  /**
   * Setup event listeners for the dialog
   */
  setupEventListeners() {
    const modal = document.getElementById('git-pull-modal');
    if (!modal) return;
    
    // Escape key handler
    this.handleEscape = (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        e.preventDefault();
        e.stopPropagation();
        this.hide();
      }
    };
    
    document.addEventListener('keydown', this.handleEscape);
    
    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.hide();
      }
    });
    
    // Close button
    const closeButton = document.getElementById('pull-close');
    if (closeButton) {
      closeButton.addEventListener('click', () => this.hide());
    }
    
    // Cancel button
    const cancelButton = document.getElementById('cancel-pull');
    if (cancelButton) {
      cancelButton.addEventListener('click', () => this.hide());
    }
    
    // Configure Git button
    const configButton = document.getElementById('configure-git-pull');
    if (configButton) {
      configButton.addEventListener('click', () => {
        this.hide();
        if (window.gitDialog) {
          window.gitDialog.show();
        }
      });
    }
    
    // Repository select
    const repoSelect = document.getElementById('pull-repo');
    if (repoSelect) {
      repoSelect.addEventListener('change', () => this.updateFilePath());
    }
    
    // Preview button
    const previewButton = document.getElementById('preview-file');
    if (previewButton) {
      previewButton.addEventListener('click', () => this.previewFile());
    }
    
    // Pull button
    const pullButton = document.getElementById('execute-pull');
    if (pullButton) {
      pullButton.addEventListener('click', () => this.executePull());
    }
  }

  /**
   * Update file path when repository changes
   */
  async updateFilePath() {
    const repoSelect = document.getElementById('pull-repo');
    if (!repoSelect || !repoSelect.value) return;
    
    // Store selected repo
    gitService.settings.selectedRepo = repoSelect.value;
    gitService.saveSettings();
  }

  /**
   * Preview file from Git repository
   */
  async previewFile() {
    const repoSelect = document.getElementById('pull-repo');
    const pathInput = document.getElementById('pull-path');
    const previewContainer = document.getElementById('file-preview');
    
    // Validate inputs
    if (!repoSelect.value) {
      this.setStatus('error', 'Please select a repository');
      return;
    }
    
    if (!pathInput.value.trim()) {
      this.setStatus('error', 'Please enter a file path');
      return;
    }
    
    // Check for Git configuration
    if (!gitService.settings.token) {
      this.setStatus('error', `${gitService.getActivePlatformName()} token not configured. Please configure ${gitService.getActivePlatformName()} first.`);
      return;
    }
    
    this.setLoading(true);
    this.setStatus('loading', `Fetching file from ${gitService.getActivePlatformName()}...`);
    
    try {
      // Get file content
      const content = await gitService.getFileContent(
        repoSelect.value,
        pathInput.value.trim()
      );
      
      // Update preview
      if (previewContainer) {
        previewContainer.innerHTML = '';
        
        const previewContent = document.createElement('pre');
        previewContent.className = 'preview-content';
        previewContent.textContent = content.substring(0, 1000) + 
          (content.length > 1000 ? '...\n(Content truncated for preview)' : '');
        
        previewContainer.appendChild(previewContent);
      }
      
      this.setStatus('success', 'File preview loaded successfully');
      this.fileContent = content;
    } catch (error) {
      if (previewContainer) {
        previewContainer.innerHTML = '<div class="preview-placeholder">File not found or unable to access</div>';
      }
      this.setStatus('error', `Failed to fetch file: ${error.message}`);
      this.fileContent = null;
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Execute pull from Git repository
   */
  async executePull() {
    // If we haven't previewed the file yet, do that first
    if (!this.fileContent) {
      await this.previewFile();
      if (!this.fileContent) {
        return; // Preview failed
      }
    }
    
    if (!this.ytext) {
      this.setStatus('error', 'Editor not available');
      return;
    }
    
    // Confirm before replacing content
    if (!confirm('This will replace your current document content. Continue?')) {
      return;
    }
    
    try {
      // Replace document content
      this.ytext.delete(0, this.ytext.length);
      this.ytext.insert(0, this.fileContent);
      
      // Update status
      this.setStatus('success', `Document updated with content from ${gitService.getActivePlatformName()}`);
      
      // Save path in settings
      const pathInput = document.getElementById('pull-path');
      if (pathInput && pathInput.value) {
        gitService.settings.defaultPath = pathInput.value.trim();
        gitService.saveSettings();
      }
      
      // Close dialog after delay
      setTimeout(() => {
        this.hide();
      }, 1500);
    } catch (error) {
      this.setStatus('error', `Failed to update document: ${error.message}`);
    }
  }

  /**
   * Set status message
   */
  setStatus(status, message = '') {
    const statusElement = document.getElementById('pull-status');
    if (!statusElement) return;
    
    statusElement.className = 'status-message';
    statusElement.textContent = message;
    
    if (status) {
      statusElement.classList.add(`status-${status}`);
    }
  }

  /**
   * Set loading state
   */
  setLoading(isLoading) {
    this.isLoading = isLoading;
    
    const buttons = document.querySelectorAll('.settings-button, .modal-button, .primary-button, .secondary-button');
    buttons.forEach(button => {
      button.disabled = isLoading;
    });
    
    const inputs = document.querySelectorAll('.settings-input');
    inputs.forEach(input => {
      input.disabled = isLoading;
    });
  }
}

// Create global instance
export const gitPullDialog = new GitPullDialog();

// Make available globally for menu system
window.gitPullDialog = gitPullDialog;
