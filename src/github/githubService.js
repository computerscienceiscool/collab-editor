// File: src/github/githubService.js
/**
 * GitHub integration service for the collaborative editor
 * Handles GitHub API communications and settings management
 */
export class GitHubService {
  constructor() {
    this.settings = this.loadSettings();
  }

  /**
   * Load GitHub settings from localStorage
   * @returns {Object} GitHub settings
   */
  loadSettings() {
    try {
      const savedSettings = localStorage.getItem('github-settings');
      if (savedSettings) {
        return JSON.parse(savedSettings);
      }
    } catch (error) {
      console.error('Failed to load GitHub settings:', error);
    }

    // Default settings if none found
    return {
      token: '',
      username: '',
      repos: [],
      selectedRepo: '',
      defaultPath: '',
      commitMessage: 'Update from collaborative editor',
      enabled: false,
      lastCommit: null,
      useAICommitMessage: false, // Add this field for AI checkbox state
      grokkerApiKey: '' // Add Grokker API key field
    };
  }

  /**
   * Save GitHub settings to localStorage
   * @param {Object} settings - Settings to save
   */
  saveSettings(settings = this.settings) {
    try {
      localStorage.setItem('github-settings', JSON.stringify(settings));
      this.settings = settings;
    } catch (error) {
      console.error('Failed to save GitHub settings:', error);
      throw new Error('Failed to save settings: ' + error.message);
    }
  }

  /**
   * Validate GitHub personal access token
   * @param {string} token - Personal access token to validate
   * @returns {Promise<Object>} User information if valid
   * @throws {Error} If token is invalid
   */
  async validateToken(token) {
    try {
      const response = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (!response.ok) {
        throw new Error('Invalid token or API error');
      }

      const userData = await response.json();
      return userData;
    } catch (error) {
      console.error('Token validation failed:', error);
      throw new Error('GitHub token validation failed: ' + error.message);
    }
  }

  /**
   *  Generate commit message using Grokker
   * @param {string} content - Document content to analyze
   * @returns {Promise<string>} Generated commit message
   */
  async generateCommitMessage(content) {
    if (!this.settings.grokkerApiKey) {
      throw new Error('Grokker API key not configured');
    }
    
    try {
      // Call backend API to execute grok command
      // This assumes you have a backend endpoint for executing grok
      const response = await fetch('/api/grokker/commit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Grokker-API-Key': this.settings.grokkerApiKey
        },
        body: JSON.stringify({
          content: content
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate commit message');
      }
      
      const data = await response.json();
      return data.commitMessage;
    } catch (error) {
      console.error('Failed to generate commit message:', error);
      throw new Error('Failed to generate commit message: ' + error.message);
    }
  }

  /**
   * Fetch user repositories
   * @returns {Promise<Array>} List of repositories
   */
  async fetchRepositories() {
    if (!this.settings.token) {
      throw new Error('GitHub token not configured');
    }

    try {
      const response = await fetch('https://api.github.com/user/repos?sort=updated&per_page=100', {
        headers: {
          'Authorization': `token ${this.settings.token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch repositories');
      }

      const repos = await response.json();
      
      // Update settings with fetched repos
      this.settings.repos = repos.map(repo => ({
        name: repo.name,
        fullName: repo.full_name,
        defaultBranch: repo.default_branch
      }));
      
      this.saveSettings();
      
      return this.settings.repos;
    } catch (error) {
      console.error('Failed to fetch repositories:', error);
      throw new Error('Failed to fetch GitHub repositories: ' + error.message);
    }
  }

  /**
   * Commit file to GitHub repository
   * @param {string} content - Document content
   * @param {string} filePath - File path in repository
   * @param {string} commitMessage - Commit message
   * @param {Array<Object>} coAuthors - List of co-authors {name, email}
   * @returns {Promise<Object>} Commit result
   */
  async commitFile(content, filePath, commitMessage, coAuthors = []) {
    if (!this.settings.token || !this.settings.selectedRepo) {
      throw new Error('GitHub settings not configured');
    }

    const selectedRepo = this.settings.repos.find(r => r.fullName === this.settings.selectedRepo);
    if (!selectedRepo) {
      throw new Error('Selected repository not found');
    }

    console.log(`Starting commit to ${this.settings.selectedRepo}, path: ${filePath}`);
    console.log(`With ${coAuthors.length} co-authors`);
    
    try {
      // First, check if file exists to get SHA if it does
      let fileSha = null;
      let existingFile = false;
      
      try {
        console.log(`Checking if file exists: ${filePath}`);
        const fileResponse = await fetch(`https://api.github.com/repos/${this.settings.selectedRepo}/contents/${filePath}`, {
          headers: {
            'Authorization': `token ${this.settings.token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        });
        
        if (fileResponse.ok) {
          const fileData = await fileResponse.json();
          fileSha = fileData.sha;
          existingFile = true;
          console.log(`File exists with SHA: ${fileSha}`);
        }
      } catch (error) {
        // File likely doesn't exist yet, which is fine
        console.log('File does not exist yet, will create new file');
        existingFile = false;
      }

      // Build commit message with co-authors
      let fullCommitMessage = commitMessage.trim();
      
      if (coAuthors && coAuthors.length > 0) {
        // Add a blank line between commit message and co-authors
        fullCommitMessage += '\n\n';
        
        // Log co-authors for debugging
        console.log('Adding co-authors to commit:');
        
        // Add each co-author in the correct format
        coAuthors.forEach(author => {
          // Make sure name and email are properly formatted and sanitized
          const sanitizedName = author.name.replace(/[<>]/g, '').trim();
          let sanitizedEmail = author.email;
          
          // If email is missing, generate one from the name
          if (!sanitizedEmail) {
            sanitizedEmail = `${sanitizedName.toLowerCase().replace(/[^a-z0-9]/g, '')}@example.com`;
          }
          
          sanitizedEmail = sanitizedEmail.replace(/[<>]/g, '').trim();
          
          // Add co-author line in the correct format
          fullCommitMessage += `Co-authored-by: ${sanitizedName} <${sanitizedEmail}>\n`;
          console.log(`- ${sanitizedName} <${sanitizedEmail}>`);
        });
      }

      console.log('Preparing commit payload');
      
      // Create or update file
      const payload = {
        message: fullCommitMessage,
        content: btoa(unescape(encodeURIComponent(content))), // Base64 encode the content
        branch: selectedRepo.defaultBranch
      };

      // Add SHA if file exists (update instead of create)
      if (existingFile && fileSha) {
        payload.sha = fileSha;
        console.log(`Updating existing file with SHA: ${fileSha}`);
      } else {
        console.log('Creating new file');
      }

      console.log('Sending commit request to GitHub API');
      
      // Make the commit API request
      const commitResponse = await fetch(`https://api.github.com/repos/${this.settings.selectedRepo}/contents/${filePath}`, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${this.settings.token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!commitResponse.ok) {
        const errorData = await commitResponse.json();
        console.error('GitHub API error:', errorData);
        throw new Error(`GitHub API error: ${errorData.message || 'Unknown error'}`);
      }

      const result = await commitResponse.json();
      console.log('Commit successful:', result.commit.html_url);
      
      // Save last commit info
      this.settings.lastCommit = {
        sha: result.commit.sha,
        url: result.commit.html_url,
        date: new Date().toISOString(),
        path: filePath,
        repository: this.settings.selectedRepo
      };
      this.saveSettings();
      
      return result;
    } catch (error) {
      console.error('Failed to commit file:', error);
      throw new Error('Failed to commit to GitHub: ' + error.message);
    }
  }

  /**
   *  Execute grok command directly (fallback for local development)
   * @param {string} content - Content to analyze
   * @returns {Promise<string>} Generated commit message
   */
  async executeGrokCommand(content) {
    if (!this.settings.grokkerApiKey) {
      throw new Error('Grokker API key not configured');
    }

    try {
      // This is a client-side implementation for executing grok
      // In a real environment, this would be handled server-side
      const tempFile = `temp-${Date.now()}.md`;
      
      // Create a blob with the content
      const blob = new Blob([content], { type: 'text/plain' });
      const fileUrl = URL.createObjectURL(blob);
      
      console.log(`Executing grok command on content of length ${content.length}`);
      
      // This is where we would typically execute a command like:
      // const result = await execCommand(`grok commit`);
      
      // Since we can't execute commands directly from the browser,
      // we'd need a server endpoint or to use a desktop framework like Electron
      
      // For now, simulate a response for development purposes
      const simulatedResponse = `feat(editor): implement collaborative editing

Added real-time collaboration features using Yjs and WebSockets.
- Added user presence indicators
- Implemented conflict resolution
- Added offline support with IndexedDB`;
      
      // Clean up
      URL.revokeObjectURL(fileUrl);
      
      return simulatedResponse;
    } catch (error) {
      console.error('Failed to execute grok command:', error);
      throw new Error(`Grok command failed: ${error.message}`);
    }
  }

  /**
   * Get file content from GitHub
   * @param {string} repo - Repository full name
   * @param {string} path - File path
   * @returns {Promise<string>} File content
   */
  async getFileContent(repo, path) {
    if (!this.settings.token) {
      throw new Error('GitHub token not configured');
    }

    try {
      const response = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
        headers: {
          'Authorization': `token ${this.settings.token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch file content');
      }

      const data = await response.json();
      // Base64 decode content
      return decodeURIComponent(escape(atob(data.content)));
    } catch (error) {
      console.error('Failed to get file content:', error);
      throw new Error('Failed to get file from GitHub: ' + error.message);
    }
  }

  /**
   * Clear all GitHub settings
   */
  clearSettings() {
    localStorage.removeItem('github-settings');
    this.settings = this.loadSettings();
  }
}

// Create global instance
export const githubService = new GitHubService();

// Make available globally for UI access
window.githubService = githubService;
