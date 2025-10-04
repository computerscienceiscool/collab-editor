// File: src/ui/gitDialog.js

/**
 * Git settings dialog
 * Provides UI for configuring Git integration for GitHub and Gitea
 */
import { gitService } from '../git/gitService.js';

export class GitDialog {
  constructor() {
    this.isOpen = false;
    this.isLoading = false;
    this.validationStatus = null;
    this.repos = [];
    this.handleEscape = null;
  }

  /**
   * Show Git settings dialog
   */
  async show() {
    if (this.isOpen) return;
    
    this.isOpen = true;
    document.body.style.overflow = 'hidden';
    
    // Create and show modal
    const modal = this.createModalHTML();
    document.body.appendChild(modal);
    
    // Load current settings
    this.populateSettings();
    
    // Setup event listeners
    this.setupEventListeners();
    
    console.log('Git settings dialog opened');
  }

  /**
   * Hide Git settings dialog
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
    
    const modal = document.getElementById('git-modal');
    if (modal) {
      modal.remove();
    }
    
    console.log('Git settings dialog closed');
  }

  /**
   * Create the modal HTML structure
   */
  createModalHTML() {
    const modal = document.createElement('div');
    modal.id = 'git-modal';
    modal.className = 'modal-overlay show';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-labelledby', 'git-title');
    
    const platformName = gitService.getActivePlatformName();
    const isGitea = gitService.getActivePlatform() === 'gitea';
    
    modal.innerHTML = `
      <div class="modal-dialog git-dialog">
        <div class="modal-header">
          <h2 id="git-title" class="modal-title">${platformName} Settings</h2>
          <button class="modal-close" type="button" id="git-close">&times;</button>
        </div>
        <div class="modal-content">
          <div class="settings-section">
            <h3>Git Platform</h3>
            <div class="input-group">
              <label for="git-platform">Select Platform:</label>
              <select id="git-platform" class="settings-input">
                ${this.getPlatformOptions()}
              </select>
            </div>
          </div>
          
          <div class="settings-section">
            <h3>${platformName} Authentication</h3>
            ${isGitea ? `
            <div class="input-group">
              <label for="server-url">Server URL:</label>
              <input 
                type="url" 
                id="server-url" 
                class="settings-input" 
                placeholder="https://gitea.example.com"
                autocomplete="off"
              />
              <div class="setting-help">Enter the base URL of your Gitea server</div>
            </div>
            ` : ''}
            <p>Enter your ${platformName} personal access token${isGitea ? ' with "repo" scope' : ' (needs repo scope)'}</p>
            <div class="input-group">
              <label for="git-token">Access Token:</label>
              <input 
                type="password" 
                id="git-token" 
                class="settings-input" 
                placeholder="${isGitea ? 'Access token' : 'ghp_xxxxxxxxxxxxxxxxxxxx'}"
                autocomplete="off"
              />
              <button id="validate-token" class="settings-button">Validate Token</button>
            </div>
            <div id="token-status" class="status-message"></div>
          </div>
          
          <div class="settings-section" id="repository-section" style="display:none">
            <h3>Repository Settings</h3>
            <div class="input-group">
              <label for="git-repo">Select Repository:</label>
              <select id="git-repo" class="settings-input">
                <option value="">-- Select a repository --</option>
              </select>
              <button id="refresh-repos" class="settings-button">Refresh</button>
            </div>
            <div class="input-group">
              <label for="git-path">Default File Path:</label>
              <input 
                type="text" 
                id="git-path" 
                class="settings-input" 
                placeholder="path/to/file.md"
              />
            </div>
            <div class="input-group">
              <label for="git-message">Default Commit Message:</label>
              <input 
                type="text" 
                id="git-message" 
                class="settings-input" 
                placeholder="Update from collaborative editor"
              />
            </div>
          </div>
          
          <div class="status-section">
            <div id="git-status" class="status-message"></div>
          </div>
        </div>
        <div class="modal-footer">
          <button id="clear-settings" class="danger-button">Clear Settings</button>
          <button id="save-settings" class="primary-button">Save Settings</button>
          <button id="cancel-settings" class="modal-button">Cancel</button>
        </div>
      </div>
    `;
    
    return modal;
  }

  /**
   * Get platform options for select dropdown
   */
  getPlatformOptions() {
    const platforms = gitService.getPlatforms();
    const currentPlatform = gitService.getActivePlatform();
    
    return platforms.map(platform => 
      `<option value="${platform.id}" ${platform.id === currentPlatform ? 'selected' : ''}>${platform.name}</option>`
    ).join('');
  }

  /**
   * Populate dialog with current settings
   */
  populateSettings() {
    const settings = gitService.settings;
    const platform = gitService.getActivePlatform();
    
    const platformSelect = document.getElementById('git-platform');
    const tokenInput = document.getElementById('git-token');
    const serverUrlInput = document.getElementById('server-url');
    const repoSelect = document.getElementById('git-repo');
    const pathInput = document.getElementById('git-path');
    const messageInput = document.getElementById('git-message');
    
    if (platformSelect) platformSelect.value = platform;
    if (tokenInput) tokenInput.value = settings.token || '';
    if (serverUrlInput && platform === 'gitea') serverUrlInput.value = settings.serverUrl || '';
    
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
        
        // Show repository section
        document.getElementById('repository-section').style.display = 'block';
      }
    }
    
    if (pathInput) pathInput.value = settings.defaultPath || '';
    if (messageInput) messageInput.value = settings.commitMessage || 'Update from collaborative editor';
    
    // Show validation status if token exists
    if (settings.token) {
      this.setValidationStatus('valid', `Token configured for ${settings.username}`);
      document.getElementById('repository-section').style.display = 'block';
    }
    
    // Add manual repository entry for Gitea
    if (platform === 'gitea') {
      this.addManualRepositorySection();
    }
  }

  /**
   * Add manual repository entry section for Gitea
   */
  addManualRepositorySection() {
    // Check if section already exists
    if (document.getElementById('manual-repo-section')) {
      return;
    }
    
    const repoSection = document.getElementById('repository-section');
    if (!repoSection) return;
    
    const manualSection = document.createElement('div');
    manualSection.id = 'manual-repo-section';
    manualSection.className = 'manual-repo-entry';
    manualSection.innerHTML = `
      <h4>Manual Repository Entry</h4>
      <p class="settings-help">If API access fails, add your repositories manually:</p>
      
      <div class="input-group">
        <label for="manual-repo-name">Repository Name:</label>
        <input 
          type="text" 
          id="manual-repo-name" 
          class="settings-input" 
          placeholder="my-repository"
        />
      </div>
      
      <div class="input-group">
        <label for="manual-repo-fullname">Repository Full Name (owner/repo):</label>
        <input 
          type="text" 
          id="manual-repo-fullname" 
          class="settings-input" 
          placeholder="username/my-repository"
        />
      </div>
      
      <div class="input-group">
        <label for="manual-repo-branch">Default Branch:</label>
        <input 
          type="text" 
          id="manual-repo-branch" 
          class="settings-input" 
          placeholder="main"
          value="main"
        />
      </div>
      
      <button id="add-manual-repo" class="settings-button">Add Repository</button>
      <div id="manual-repo-status" class="status-message"></div>
      
      <div id="manual-repos-list" class="manual-repos-list">
        <h4>Added Repositories:</h4>
        <div class="manual-repos-container">
          <em>No repositories added yet</em>
        </div>
      </div>
    `;
    
    repoSection.appendChild(manualSection);
    
    // Update the list of manual repositories if any exist
    setTimeout(() => this.updateManualReposList(), 100);
    
    // Add event listener for the add repository button
    setTimeout(() => {
      const addRepoButton = document.getElementById('add-manual-repo');
      if (addRepoButton) {
        addRepoButton.addEventListener('click', () => this.addManualRepository());
      }
    }, 100);
  }
  
  /**
   * Add a manually entered repository
   */
  addManualRepository() {
    const nameInput = document.getElementById('manual-repo-name');
    const fullNameInput = document.getElementById('manual-repo-fullname');
    const branchInput = document.getElementById('manual-repo-branch');
    const statusEl = document.getElementById('manual-repo-status');
    
    if (!nameInput || !fullNameInput || !branchInput || !statusEl) {
      console.error('Manual repository inputs not found');
      return;
    }
    
    const name = nameInput.value.trim();
    const fullName = fullNameInput.value.trim();
    const branch = branchInput.value.trim() || 'main';
    
    if (!name) {
      statusEl.textContent = 'Please enter a repository name';
      statusEl.className = 'status-message status-error';
      return;
    }
    
    if (!fullName) {
      statusEl.textContent = 'Please enter the full repository name (owner/repo)';
      statusEl.className = 'status-message status-error';
      return;
    }
    
    // Add to repos list
    if (!gitService.settings.repos) {
      gitService.settings.repos = [];
    }
    
    // Check for duplicate
    const existing = gitService.settings.repos.find(r => r.fullName === fullName);
    if (existing) {
      statusEl.textContent = 'This repository is already in your list';
      statusEl.className = 'status-message status-warning';
      return;
    }
    
    gitService.settings.repos.push({
      name: name,
      fullName: fullName,
      defaultBranch: branch
    });
    
    gitService.saveSettings();
    
    // Clear inputs
    nameInput.value = '';
    fullNameInput.value = '';
    branchInput.value = 'main';
    
    // Show success
    statusEl.textContent = `Added repository: ${fullName}`;
    statusEl.className = 'status-message status-success';
    
    // Update repos list display
    this.updateManualReposList();
    
    // Update repository dropdown
    this.updateRepositoryDropdown();
  }
  
  /**
   * Update the list of manually added repositories
   */
  updateManualReposList() {
    const container = document.querySelector('.manual-repos-container');
    if (!container) return;
    
    const repos = gitService.settings.repos || [];
    
    if (repos.length === 0) {
      container.innerHTML = '<em>No repositories added yet</em>';
      return;
    }
    
    let html = '<ul class="manual-repos-list">';
    repos.forEach((repo, index) => {
      html += `
        <li>
          <strong>${repo.fullName}</strong> 
          (branch: ${repo.defaultBranch}) 
          <button class="remove-repo-btn" data-index="${index}">Remove</button>
        </li>
      `;
    });
    html += '</ul>';
    
    container.innerHTML = html;
    
    // Setup remove buttons
    setTimeout(() => {
      const removeButtons = document.querySelectorAll('.remove-repo-btn');
      removeButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
          const index = parseInt(e.target.dataset.index, 10);
          if (!isNaN(index) && index >= 0 && index < gitService.settings.repos.length) {
            gitService.settings.repos.splice(index, 1);
            gitService.saveSettings();
            this.updateManualReposList();
            this.updateRepositoryDropdown();
          }
        });
      });
    }, 0);
  }
  
  /**
   * Update the repository dropdown with manual repositories
   */
  updateRepositoryDropdown() {
    const repoSelect = document.getElementById('git-repo');
    if (!repoSelect) return;
    
    // Clear existing options except the first placeholder
    while (repoSelect.options.length > 1) {
      repoSelect.remove(1);
    }
    
    // Add repository options
    const repos = gitService.settings.repos || [];
    repos.forEach(repo => {
      const option = document.createElement('option');
      option.value = repo.fullName;
      option.textContent = repo.fullName;
      repoSelect.appendChild(option);
    });
    
    // Select current repo if set
    if (gitService.settings.selectedRepo) {
      repoSelect.value = gitService.settings.selectedRepo;
    }
    
    // Show repository section
    if (repos.length > 0) {
      document.getElementById('repository-section').style.display = 'block';
    }
  }

  /**
   * Setup event listeners for the dialog
   */
  setupEventListeners() {
    const modal = document.getElementById('git-modal');
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
    const closeButton = document.getElementById('git-close');
    if (closeButton) {
      closeButton.addEventListener('click', () => this.hide());
    }
    
    // Cancel button
    const cancelButton = document.getElementById('cancel-settings');
    if (cancelButton) {
      cancelButton.addEventListener('click', () => this.hide());
    }
    
    // Platform select
    const platformSelect = document.getElementById('git-platform');
    if (platformSelect) {
      platformSelect.addEventListener('change', () => this.handlePlatformChange(platformSelect.value));
    }
    
    // Validate token button
    const validateButton = document.getElementById('validate-token');
    if (validateButton) {
      validateButton.addEventListener('click', () => this.validateToken());
    }
    
    // Refresh repositories button
    const refreshButton = document.getElementById('refresh-repos');
    if (refreshButton) {
      refreshButton.addEventListener('click', () => this.fetchRepositories());
    }
    
    // Clear settings button
    const clearButton = document.getElementById('clear-settings');
    if (clearButton) {
      clearButton.addEventListener('click', () => this.clearSettings());
    }
    
    // Save settings button
    const saveButton = document.getElementById('save-settings');
    if (saveButton) {
      saveButton.addEventListener('click', () => this.saveSettings());
    }
  }

  /**
   * Handle platform change
   * @param {string} platform - The new platform value
   */
  handlePlatformChange(platform) {
    // Set the new active platform
    if (gitService.setActivePlatform(platform)) {
      // Recreate the dialog with the new platform settings
      const oldModal = document.getElementById('git-modal');
      if (oldModal) {
        oldModal.remove();
      }
      
      const newModal = this.createModalHTML();
      document.body.appendChild(newModal);
      
      // Re-populate settings and set up event listeners
      this.populateSettings();
      this.setupEventListeners();
      
      console.log(`Platform changed to ${gitService.getActivePlatformName()}`);
    }
  }

  /**
   * Validate Git token
   */
  async validateToken() {
    const tokenInput = document.getElementById('git-token');
    if (!tokenInput || !tokenInput.value.trim()) {
      this.setValidationStatus('error', 'Please enter a token');
      return;
    }
    
    const token = tokenInput.value.trim();
    let serverUrl = null;
    
    if (gitService.getActivePlatform() === 'gitea') {
      const serverUrlInput = document.getElementById('server-url');
      if (!serverUrlInput || !serverUrlInput.value.trim()) {
        this.setValidationStatus('error', 'Please enter a Gitea server URL');
        return;
      }
      serverUrl = serverUrlInput.value.trim();
      
      // Make sure server URL doesn't end with a slash
      if (serverUrl.endsWith('/')) {
        serverUrl = serverUrl.slice(0, -1);
      }
    }
    
    this.setLoading(true);
    this.setValidationStatus('loading', 'Validating token...');
    
    try {
      const userData = await gitService.validateToken(token, serverUrl);
      this.setValidationStatus('valid', `Token valid for user: ${userData.username || userData.login || "User"}`);
      
      // Store username for later use
      gitService.settings.username = userData.login || userData.username || "User";
      
      // Fetch repositories with the token
      await this.fetchRepositories();
      
      // Show repository section
      document.getElementById('repository-section').style.display = 'block';
      
    } catch (error) {
      this.setValidationStatus('error', `Token validation failed: ${error.message}`);
      
      // For Gitea, try to proceed anyway with manual repository entry
      if (gitService.getActivePlatform() === 'gitea') {
        gitService.settings.token = token;
        gitService.settings.username = "Gitea User";
        gitService.saveSettings();
        
        // Show repository section with manual entry
        document.getElementById('repository-section').style.display = 'block';
        this.addManualRepositorySection();
        
        this.setStatus('warning', 'API validation failed. You can add repositories manually.');
      }
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Fetch repositories for the user
   */
  async fetchRepositories() {
    const tokenInput = document.getElementById('git-token');
    const repoSelect = document.getElementById('git-repo');
    
    if (!tokenInput || !tokenInput.value.trim()) {
      this.setStatus('error', 'Please enter and validate a token first');
      return;
    }
    
    this.setLoading(true);
    this.setStatus('loading', 'Fetching repositories...');
    
    try {
      // Set token for API call
      gitService.settings.token = tokenInput.value.trim();
      
      // If Gitea, also set server URL
      if (gitService.getActivePlatform() === 'gitea') {
        const serverUrlInput = document.getElementById('server-url');
        if (serverUrlInput) {
          gitService.settings.serverUrl = serverUrlInput.value.trim();
        }
      }
      
      // Fetch repositories
      const repos = await gitService.fetchRepositories();
      
      // Update repository select
      if (repoSelect) {
        // Clear existing options
        while (repoSelect.options.length > 1) {
          repoSelect.remove(1);
        }
        
        // Add repository options
        repos.forEach(repo => {
          const option = document.createElement('option');
          option.value = repo.fullName;
          option.textContent = repo.fullName;
          repoSelect.appendChild(option);
        });
      }
      
      if (repos.length > 0) {
        this.setStatus('success', `Fetched ${repos.length} repositories`);
      } else if (gitService.getActivePlatform() === 'gitea') {
        // For Gitea, show manual repository entry if no repos were found
        this.setStatus('warning', 'No repositories found. You can add them manually below.');
        this.addManualRepositorySection();
      } else {
        this.setStatus('warning', 'No repositories found.');
      }
    } catch (error) {
      this.setStatus('error', `Failed to fetch repositories: ${error.message}`);
      
      // For Gitea, show manual repository entry on error
      if (gitService.getActivePlatform() === 'gitea') {
        this.addManualRepositorySection();
      }
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Save Git settings
   */
saveSettings() {
  const tokenInput = document.getElementById('git-token');
  const repoSelect = document.getElementById('git-repo');
  const pathInput = document.getElementById('git-path');
  const messageInput = document.getElementById('git-message');
  
  // Validate required fields
  if (!tokenInput.value.trim()) {
    this.setStatus('error', `Please enter a ${gitService.getActivePlatformName()} token`);
    return;
  }
  
  try {
    // Update settings object
    gitService.settings.token = tokenInput.value.trim();
    
    // If Gitea, also set server URL
    if (gitService.getActivePlatform() === 'gitea') {
      const serverUrlInput = document.getElementById('server-url');
      if (serverUrlInput) {
        gitService.settings.serverUrl = serverUrlInput.value.trim();
      }
      
      // Make sure a repository is selected for Gitea
      if (!repoSelect.value && gitService.settings.repos && gitService.settings.repos.length > 0) {
        // Auto-select the first repository
        repoSelect.value = gitService.settings.repos[0].fullName;
      }
    }
    
    gitService.settings.selectedRepo = repoSelect.value;
    gitService.settings.defaultPath = pathInput.value.trim();
    gitService.settings.commitMessage = messageInput.value.trim() || 'Update from collaborative editor';
    gitService.settings.enabled = true;
    
    // Save settings
    gitService.saveSettings();
    
    this.setStatus('success', `${gitService.getActivePlatformName()} settings saved successfully`);
    
    // Close dialog after short delay
    setTimeout(() => {
      this.hide();
    }, 1500);
  } catch (error) {
    this.setStatus('error', `Failed to save settings: ${error.message}`);
  }
}
  /**
   * Clear Git settings
   */
  clearSettings() {
    if (confirm(`Are you sure you want to clear all ${gitService.getActivePlatformName()} settings?`)) {
      try {
        gitService.clearSettings();
        
        // Reset form
        document.getElementById('git-token').value = '';
        if (gitService.getActivePlatform() === 'gitea') {
          const serverUrlInput = document.getElementById('server-url');
          if (serverUrlInput) serverUrlInput.value = '';
        }
        document.getElementById('git-repo').value = '';
        document.getElementById('git-path').value = '';
        document.getElementById('git-message').value = 'Update from collaborative editor';
        
        // Hide repository section
        document.getElementById('repository-section').style.display = 'none';
        
        // Clear status
        this.setValidationStatus(null);
        this.setStatus('success', `${gitService.getActivePlatformName()} settings cleared`);
        
        // Remove manual repository section if it exists
        const manualSection = document.getElementById('manual-repo-section');
        if (manualSection) {
          manualSection.remove();
        }
      } catch (error) {
        this.setStatus('error', `Failed to clear settings: ${error.message}`);
      }
    }
  }

  /**
   * Set validation status message
   */
  setValidationStatus(status, message = '') {
    const statusElement = document.getElementById('token-status');
    if (!statusElement) return;
    
    statusElement.className = 'status-message';
    statusElement.textContent = message;
    
    if (status) {
      statusElement.classList.add(`status-${status}`);
    }
    
    this.validationStatus = status;
  }

  /**
   * Set general status message
   */
  setStatus(status, message = '') {
    const statusElement = document.getElementById('git-status');
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
    
    const buttons = document.querySelectorAll('.settings-button, .modal-button, .primary-button, .danger-button');
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
export const gitDialog = new GitDialog();

// Make available globally for menu system and UI
window.gitDialog = gitDialog;
