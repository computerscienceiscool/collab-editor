// File: src/ui/githubCommitDialog.js
/**
 * GitHub commit dialog
 * Handles the process of committing a document to GitHub
 */
import { githubService } from '../github/githubService.js';

export class GitHubCommitDialog {
  constructor() {
    this.isOpen = false;
    this.isLoading = false;
    this.documentContent = '';
    this.ytext = null;
    this.awareness = null;
  }

  /**
   * Show GitHub commit dialog
   * @param {string} content - Document content to commit
   * @param {Object} ytext - Yjs text instance
   * @param {Object} awareness - Awareness instance for co-authors
   */
  show(content, ytext, awareness) {
    if (this.isOpen) return;
    
    this.isOpen = true;
    document.body.style.overflow = 'hidden';
    
    this.documentContent = content;
    this.ytext = ytext;
    this.awareness = awareness;
    
    // Create and show modal
    const modal = this.createModalHTML();
    document.body.appendChild(modal);
    
    // Populate with current settings
    this.populateSettings();
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Populate co-authors
    this.populateCoAuthors();
    
    console.log('GitHub commit dialog opened');
  }

  /**
   * Hide GitHub commit dialog
   */
  hide() {
    if (!this.isOpen) return;
    
    this.isOpen = false;
    document.body.style.overflow = 'auto';
    
    const modal = document.getElementById('github-commit-modal');
    if (modal) {
      modal.remove();
    }
    
    // Reset state
    this.documentContent = '';
    this.ytext = null;
    this.awareness = null;
    
    console.log('GitHub commit dialog closed');
  }

  /**
   * Create the modal HTML structure
   */
  createModalHTML() {
    const modal = document.createElement('div');
    modal.id = 'github-commit-modal';
    modal.className = 'modal-overlay show';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-labelledby', 'commit-title');
    
    modal.innerHTML = `
      <div class="modal-dialog github-commit-dialog">
        <div class="modal-header">
          <h2 id="commit-title" class="modal-title">Commit to GitHub</h2>
          <button class="modal-close" type="button" id="commit-close">&times;</button>
        </div>
        <div class="modal-content">
          <div class="settings-section">
            <h3>Repository Information</h3>
            <div class="input-group">
              <label for="commit-repo">Repository:</label>
              <select id="commit-repo" class="settings-input">
                <option value="">-- Select a repository --</option>
              </select>
            </div>
            <div class="input-group">
              <label for="commit-path">File Path:</label>
              <input 
                type="text" 
                id="commit-path" 
                class="settings-input" 
                placeholder="path/to/file.md"
              />
            </div>
          </div>
          
          <div class="settings-section">
            <h3>Commit Details</h3>
            <div class="input-group">
              <label for="commit-message">Commit Message:</label>
              <textarea 
                id="commit-message" 
                class="settings-input" 
                placeholder="Describe your changes..."
                rows="3"
              ></textarea>
            </div>
          </div>
          
          <div class="settings-section">
            <h3>Co-Authors</h3>
            <p class="settings-help">The following collaborators will be included as co-authors:</p>
            <div id="co-authors-list" class="co-authors-list">
              <div class="co-author-placeholder">No other collaborators detected</div>
            </div>
          </div>
          
          <div class="status-section">
            <div id="commit-status" class="status-message"></div>
          </div>
        </div>
        <div class="modal-footer">
          <button id="configure-github" class="secondary-button">Configure GitHub</button>
          <button id="execute-commit" class="primary-button">Commit to GitHub</button>
          <button id="cancel-commit" class="modal-button">Cancel</button>
        </div>
      </div>
    `;
    
    return modal;
  }

  /**
   * Populate dialog with current settings
   */
  populateSettings() {
    const settings = githubService.settings;
    
    const repoSelect = document.getElementById('commit-repo');
    const pathInput = document.getElementById('commit-path');
    const messageInput = document.getElementById('commit-message');
    
    if (!settings.enabled || !settings.token) {
      this.setStatus('warning', 'GitHub integration not configured. Please configure first.');
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
    
    // Set document title as filename if path not specified
    const titleInput = document.getElementById('document-title');
    let defaultFilename = 'document.md';
    if (titleInput && titleInput.value) {
      defaultFilename = `${titleInput.value.trim().replace(/\s+/g, '-').toLowerCase()}.md`;
    }
    
    if (pathInput) {
      pathInput.value = settings.defaultPath || defaultFilename;
    }
    
    if (messageInput) {
      messageInput.value = settings.commitMessage || 'Update from collaborative editor';
    }
  }

  /**
   * Setup event listeners for the dialog
   */
  setupEventListeners() {
    const modal = document.getElementById('github-commit-modal');
    if (!modal) return;
    
    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.hide();
      }
    });
    
    // Close button
    const closeButton = document.getElementById('commit-close');
    if (closeButton) {
      closeButton.addEventListener('click', () => this.hide());
    }
    
    // Cancel button
    const cancelButton = document.getElementById('cancel-commit');
    if (cancelButton) {
      cancelButton.addEventListener('click', () => this.hide());
    }
    
    // Configure GitHub button
    const configButton = document.getElementById('configure-github');
    if (configButton) {
      configButton.addEventListener('click', () => {
        this.hide();
        if (window.githubDialog) {
          window.githubDialog.show();
        }
      });
    }
    
    // Commit button
    const commitButton = document.getElementById('execute-commit');
    if (commitButton) {
      commitButton.addEventListener('click', () => this.executeCommit());
    }
  }

  /**
   * Populate co-authors from awareness
   */
    populateCoAuthors() {
      const coAuthorsList = document.getElementById('co-authors-list');
      if (!coAuthorsList) return;
      
      // Clear existing list
      coAuthorsList.innerHTML = '';
      
      // Check if awareness is available
      if (!this.awareness) {
        console.warn('Awareness not available for co-author detection');
        coAuthorsList.innerHTML = '<div class="co-author-placeholder">No awareness system available - collaborators cannot be detected</div>';
        return;
      }
      
      try {
        // Get local client ID
        const localClientID = this.awareness.clientID;
        console.log(`Local client ID: ${localClientID}`);
        
        // Get all users from awareness
        const states = this.awareness.getStates();
        console.log(`Found ${states.size} total users in room`);
        
        // Log all users for debugging
        states.forEach((state, id) => {
          console.log(`User ID ${id}:`, state.user);
        });
        
        // Get all clients except local user
        const clients = Array.from(states.entries())
          .filter(([id]) => id !== localClientID);
        
        console.log(`After filtering local user, found ${clients.length} other clients`);
        
        // Filter out clients without user data
        const collaborators = clients
          .map(([id, state]) => state.user)
          .filter(user => user && user.name);
        
        console.log(`Found ${collaborators.length} collaborators with names`);
        
        if (collaborators.length === 0) {
          coAuthorsList.innerHTML = '<div class="co-author-placeholder">No other collaborators detected in this session</div>';
          return;
        }
        
        // Add each collaborator to the list
        collaborators.forEach(user => {
          const coAuthorElement = document.createElement('div');
          coAuthorElement.className = 'co-author-item';
          
          const colorDot = document.createElement('span');
          colorDot.className = 'co-author-color';
          colorDot.style.backgroundColor = user.color || '#ccc';
          
          const nameSpan = document.createElement('span');
          nameSpan.className = 'co-author-name';
          nameSpan.textContent = user.name;
          
          const emailSpan = document.createElement('span');
          emailSpan.className = 'co-author-email';
          emailSpan.textContent = `${user.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@example.com`;
          
          coAuthorElement.appendChild(colorDot);
          coAuthorElement.appendChild(nameSpan);
          coAuthorElement.appendChild(emailSpan);
          
          coAuthorsList.appendChild(coAuthorElement);
        });
      } catch (error) {
        console.error('Error populating co-authors:', error);
        coAuthorsList.innerHTML = '<div class="co-author-placeholder">Error detecting collaborators</div>';
      }
    }


    /**
   * Execute commit to GitHub
   */
  async executeCommit() {
    const repoSelect = document.getElementById('commit-repo');
    const pathInput = document.getElementById('commit-path');
    const messageInput = document.getElementById('commit-message');
    
    // Validate inputs
    if (!repoSelect.value) {
      this.setStatus('error', 'Please select a repository');
      return;
    }
    
    if (!pathInput.value.trim()) {
      this.setStatus('error', 'Please enter a file path');
      return;
    }
    
    if (!messageInput.value.trim()) {
      this.setStatus('error', 'Please enter a commit message');
      return;
    }
    
    // Check for GitHub configuration
    if (!githubService.settings.token) {
      this.setStatus('error', 'GitHub token not configured. Please configure GitHub first.');
      return;
    }
    
    this.setLoading(true);
    this.setStatus('loading', 'Committing to GitHub...');
    
    try {
      // Get co-authors from the UI
      const coAuthors = this.getCoAuthors();
      
      // Execute commit
      const result = await githubService.commitFile(
        this.documentContent,
        pathInput.value.trim(),
        messageInput.value.trim(),
        coAuthors
      );
      
      // Update settings with last used values
      githubService.settings.selectedRepo = repoSelect.value;
      githubService.settings.defaultPath = pathInput.value.trim();
      githubService.settings.commitMessage = messageInput.value.trim();
      githubService.saveSettings();
      
      this.setStatus('success', 'Successfully committed to GitHub!');
      
      // Create link to view on GitHub
      if (result && result.commit && result.commit.html_url) {
        const statusEl = document.getElementById('commit-status');
        if (statusEl) {
          const viewLink = document.createElement('a');
          viewLink.href = result.commit.html_url;
          viewLink.target = '_blank';
          viewLink.textContent = 'View on GitHub';
          viewLink.className = 'github-link';
          
          statusEl.appendChild(document.createElement('br'));
          statusEl.appendChild(viewLink);
        }
      }
      
      // Close dialog after delay
      setTimeout(() => {
        this.hide();
      }, 3000);
    } catch (error) {
      this.setStatus('error', `Commit failed: ${error.message}`);
    } finally {
      this.setLoading(false);
    }
  }

/**
 * Get co-authors from the awareness system
 * @returns {Array<Object>} List of co-authors {name, email}
 */
  getCoAuthors() {
  if (!this.awareness) {
    console.warn('Awareness not available for co-author detection');
    return [];
  }
  
  // Get local client ID
  const localClientID = this.awareness.clientID;
  
  // Get all clients from awareness and log them for debugging
  const clients = Array.from(this.awareness.getStates().entries());
  console.log(`Found ${clients.length} total users in the room (including self)`);
  
  // Get all user data for logging purposes
  const allUsers = clients.map(([id, state]) => {
    return {
      id,
      name: state.user?.name || 'Unknown',
      isLocal: id === localClientID
    };
  });
  console.log('All users in room:', allUsers);
  
  // Filter out local client and get user data for co-authors
  const collaborators = clients
    .filter(([id]) => id !== localClientID)
    .map(([id, state]) => state.user)
    .filter(user => user && user.name);
  
  console.log(`Found ${collaborators.length} collaborators to add as co-authors`);
  
  // Create co-author objects with name and email
  return collaborators.map(user => {
    // Generate an email based on the name (or use a default)
    const email = user.name 
      ? `${user.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@example.com`
      : 'user@example.com';
    
    return {
      name: user.name || 'Anonymous User',
      email: email
    };
  });
 }

  /**
   * Set status message
   */
  setStatus(status, message = '') {
    const statusElement = document.getElementById('commit-status');
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
export const githubCommitDialog = new GitHubCommitDialog();

// Make available globally for menu system
window.githubCommitDialog = githubCommitDialog;
