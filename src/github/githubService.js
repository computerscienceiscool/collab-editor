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
      lastCommit: null
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

    try {
      // First, check if file exists to get SHA if it does
      let fileSha = null;
      try {
        const fileResponse = await fetch(`https://api.github.com/repos/${this.settings.selectedRepo}/contents/${filePath}`, {
          headers: {
            'Authorization': `token ${this.settings.token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        });
        
        if (fileResponse.ok) {
          const fileData = await fileResponse.json();
          fileSha = fileData.sha;
        }
      } catch (error) {
        // File likely doesn't exist yet, which is fine
        console.log('File does not exist yet, will create new');
      }

      // Build commit message with co-authors
      let fullCommitMessage = commitMessage;
      
      if (coAuthors && coAuthors.length > 0) {
        fullCommitMessage += '\n\n';
        coAuthors.forEach(author => {
          fullCommitMessage += `Co-authored-by: ${author.name} <${author.email}>\n`;
        });
      }

      // Create or update file
      const payload = {
        message: fullCommitMessage,
        content: btoa(unescape(encodeURIComponent(content))), // Base64 encode the content
        branch: selectedRepo.defaultBranch
      };

      // Add SHA if file exists (update instead of create)
      if (fileSha) {
        payload.sha = fileSha;
      }

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
        const error = await commitResponse.json();
        throw new Error(`GitHub API error: ${error.message}`);
      }

      const result = await commitResponse.json();
      
      // Save last commit info
      this.settings.lastCommit = {
        sha: result.commit.sha,
        url: result.commit.html_url,
        date: new Date().toISOString()
      };
      this.saveSettings();
      
      return result;
    } catch (error) {
      console.error('Failed to commit file:', error);
      throw new Error('Failed to commit to GitHub: ' + error.message);
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
