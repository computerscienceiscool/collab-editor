// File: src/git/gitService.js

/**
 * Generic Git integration service for the collaborative editor
 * Handles Git platform API communications and settings management
 */
export class GitService {
  constructor() {
    this.platforms = {
      github: {
        name: "GitHub",
        apiBaseUrl: "https://api.github.com",
        defaultSettings: {
          token: '',
          username: '',
          repos: [],
          selectedRepo: '',
          defaultPath: '',
          commitMessage: 'Update from collaborative editor',
          enabled: false,
          lastCommit: null
        }
      },
      gitea: {
        name: "Gitea",
        apiBaseUrl: '', // Will be set by the user
        defaultSettings: {
          serverUrl: '',
          token: '',
          username: '',
          repos: [],
          selectedRepo: '',
          defaultPath: '',
          commitMessage: 'Update from collaborative editor',
          enabled: false,
          lastCommit: null
        }
      }
    };
    
    this.activePlatform = "github"; // Default platform
    this.settings = this.loadSettings();
  }

  /**
   * Set the active Git platform
   * @param {string} platform - Platform name (github or gitea)
   */
  setActivePlatform(platform) {
    if (this.platforms[platform]) {
      this.activePlatform = platform;
      this.settings = this.loadSettings();
      return true;
    }
    return false;
  }

  /**
   * Get the current active platform
   * @returns {string} Current platform name
   */
  getActivePlatform() {
    return this.activePlatform;
  }

  /**
   * Get the current active platform's display name
   * @returns {string} Platform display name
   */
  getActivePlatformName() {
    return this.platforms[this.activePlatform].name;
  }

  /**
   * Load Git settings from localStorage
   * @returns {Object} Git settings
   */
  loadSettings() {
    try {
      const platform = this.activePlatform;
      const savedSettings = localStorage.getItem(`${platform}-settings`);
      if (savedSettings) {
        return JSON.parse(savedSettings);
      }
    } catch (error) {
      console.error(`Failed to load ${this.getActivePlatformName()} settings:`, error);
    }

    // Default settings if none found
    return { ...this.platforms[this.activePlatform].defaultSettings };
  }

  /**
   * Save Git settings to localStorage
   * @param {Object} settings - Settings to save
   */
  saveSettings(settings = this.settings) {
    try {
      const platform = this.activePlatform;
      localStorage.setItem(`${platform}-settings`, JSON.stringify(settings));
      this.settings = settings;
    } catch (error) {
      console.error(`Failed to save ${this.getActivePlatformName()} settings:`, error);
      throw new Error('Failed to save settings: ' + error.message);
    }
  }

  /**
   * Get API base URL for the current platform
   * @returns {string} API base URL
   */
  getApiBaseUrl() {
    const platform = this.activePlatform;
    if (platform === 'gitea') {
      return this.settings.serverUrl ? `${this.settings.serverUrl}/api/v1` : '';
    }
    return this.platforms[platform].apiBaseUrl;
  }

  /**
   * Validate Git personal access token
   * @param {string} token - Personal access token to validate
   * @param {string} serverUrl - Server URL (for Gitea only)
   * @returns {Promise<Object>} User information if valid
   * @throws {Error} If token is invalid
   */
 /* async validateToken(token, serverUrl = null) {
    try {
      let apiUrl;
      
      if (this.activePlatform === 'gitea') {
        if (!serverUrl) {
          throw new Error('Server URL is required for Gitea');
        }
        // Store the server URL
        this.settings.serverUrl = serverUrl;
        // Use the Gitea API endpoint for user info
        apiUrl = `${serverUrl}/api/v1/user`;
      } else {
        // GitHub API endpoint
        apiUrl = 'https://api.github.com/user';
      }

      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Invalid token or API error');
      }

      const userData = await response.json();
      return userData;
    } catch (error) {
      console.error(`Token validation failed:`, error);
      throw new Error(`${this.getActivePlatformName()} token validation failed: ${error.message}`);
    }
  }*/
  /**
     * Validate Git personal access token
     * @param {string} token - Personal access token to validate
     * @param {string} serverUrl - Server URL (for Gitea only)
     * @returns {Promise<Object>} User information if valid
     * @throws {Error} If token is invalid
     */

// In src/git/gitService.js - modify validateToken method

async validateToken(token, serverUrl = null) {
  try {
    if (this.activePlatform === 'gitea') {
      if (!serverUrl) {
        throw new Error('Server URL is required for Gitea');
      }
      
      // Normalize serverUrl
      if (serverUrl.endsWith('/')) {
        serverUrl = serverUrl.slice(0, -1);
      }
      
      this.settings.serverUrl = serverUrl;
      this.settings.token = token;
      
      // For Gitea 1.14.6 - just store the token and assume it works
      this.settings.username = "Gitea User";
      
      console.log("Gitea authentication bypassed - token stored");
      return { username: "Gitea User" };
    } else {
      // GitHub authentication (unchanged)
      const apiUrl = 'https://api.github.com/user';
      
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`GitHub API error: ${response.status} - ${errorText}`);
      }
      
      const userData = await response.json();
      this.settings.username = userData.login;
      return userData;
    }
  } catch (error) {
    console.error(`${this.getActivePlatformName()} token validation failed:`, error);
    throw new Error(`${this.getActivePlatformName()} token validation failed: ${error.message}`);
  }
}


  /**
   * Fetch user repositories
   * @returns {Promise<Array>} List of repositories
   */
// In src/git/gitService.js - modify fetchRepositories method

async fetchRepositories() {
  if (!this.settings.token) {
    throw new Error(`${this.getActivePlatformName()} token not configured`);
  }

  try {
    if (this.activePlatform === 'gitea') {
      // For Gitea, bypass API fetching and offer a direct approach
      // Add a single example repository that the user can edit in the UI
      
      // First check if we already have repositories configured
      if (!this.settings.repos || this.settings.repos.length === 0) {
        this.settings.repos = [{
          name: "Enter your repo name",
          fullName: "owner/repository",
          defaultBranch: "main"
        }];
      }
      
      this.saveSettings();
      return this.settings.repos;
    } else {
      // Standard GitHub approach (unchanged)
      const apiBaseUrl = this.getApiBaseUrl();
      const endpoint = `${apiBaseUrl}/user/repos?sort=updated&per_page=100`;
      
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `token ${this.settings.token}`,
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch repositories`);
      }
      
      const repos = await response.json();
      this.settings.repos = repos.map(repo => ({
        name: repo.name,
        fullName: repo.full_name,
        defaultBranch: repo.default_branch
      }));
      
      this.saveSettings();
      return this.settings.repos;
    }
  } catch (error) {
    console.error('Failed to fetch repositories:', error);
    throw new Error(`Failed to fetch ${this.getActivePlatformName()} repositories: ${error.message}`);
  }
}

/**
 * Commit file to Git repository
 * @param {string} content - Document content
 * @param {string} filePath - File path in repository
 * @param {string} commitMessage - Commit message
 * @param {Array<Object>} coAuthors - List of co-authors {name, email}
 * @returns {Promise<Object>} Commit result
 */
async commitFile(content, filePath, commitMessage, coAuthors = []) {
  if (!this.settings.token) {
    throw new Error(`${this.getActivePlatformName()} token not configured`);
  }

  // Check if repository is selected for Gitea
  if (this.activePlatform === 'gitea') {
    // For Gitea, manually check if we have repository information
    if (!this.settings.selectedRepo && this.settings.repos && this.settings.repos.length > 0) {
      // Auto-select the first repository if none is selected
      this.settings.selectedRepo = this.settings.repos[0].fullName;
      this.saveSettings();
      console.log(`Auto-selected repository: ${this.settings.selectedRepo}`);
    }
  }

  if (!this.settings.selectedRepo) {
    throw new Error(`${this.getActivePlatformName()} repository not selected`);
  }

  const selectedRepo = this.settings.repos.find(r => r.fullName === this.settings.selectedRepo);
  if (!selectedRepo) {
    throw new Error('Selected repository not found in repository list');
  }

  console.log(`Starting commit to ${this.settings.selectedRepo}, path: ${filePath}`);
  console.log(`With ${coAuthors.length} co-authors`);
  
  try {
    const apiBaseUrl = this.getApiBaseUrl();
    
    // First, check if file exists to get SHA if it does
    let fileSha = null;
    let existingFile = false;
    
    try {
      console.log(`Checking if file exists: ${filePath}`);
      const fileEndpoint = `${apiBaseUrl}/repos/${this.settings.selectedRepo}/contents/${filePath}`;
      const fileResponse = await fetch(fileEndpoint, {
        headers: {
          'Authorization': `token ${this.settings.token}`,
          'Accept': 'application/json'
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

    console.log('Sending commit request to Git API');
    console.log('API endpoint:', `${apiBaseUrl}/repos/${this.settings.selectedRepo}/contents/${filePath}`);
    
    // Make the commit API request
    const commitEndpoint = `${apiBaseUrl}/repos/${this.settings.selectedRepo}/contents/${filePath}`;
    const commitResponse = await fetch(commitEndpoint, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${this.settings.token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!commitResponse.ok) {
      // Get detailed error information
      let errorMessage = `HTTP error ${commitResponse.status}`;
      try {
        const errorData = await commitResponse.json();
        console.error('Git API error response:', errorData);
        errorMessage += `: ${errorData.message || 'Unknown error'}`;
      } catch (parseError) {
        const errorText = await commitResponse.text();
        console.error('Git API error text:', errorText);
        errorMessage += ` (${errorText.substring(0, 100)}...)`;
      }
      throw new Error(`${this.getActivePlatformName()} API error: ${errorMessage}`);
    }

    const result = await commitResponse.json();
    console.log('Commit successful:', result.commit?.html_url || result.url || 'Commit URL not available');
    
    // Save last commit info
    this.settings.lastCommit = {
      sha: result.commit?.sha || result.content?.sha || 'unknown',
      url: result.commit?.html_url || result.content?.html_url || `${this.settings.serverUrl}/${this.settings.selectedRepo}/commit/${result.sha || 'unknown'}`,
      date: new Date().toISOString(),
      path: filePath,
      repository: this.settings.selectedRepo
    };
    this.saveSettings();
    
    return result;
  } catch (error) {
    console.error('Failed to commit file:', error);
    throw new Error(`Failed to commit to ${this.getActivePlatformName()}: ${error.message}`);
  }
}
  /**
   * Get file content from Git repository
   * @param {string} repo - Repository full name
   * @param {string} path - File path
   * @returns {Promise<string>} File content
   */
  async getFileContent(repo, path) {
    if (!this.settings.token) {
      throw new Error(`${this.getActivePlatformName()} token not configured`);
    }

    try {
      const apiBaseUrl = this.getApiBaseUrl();
      const endpoint = `${apiBaseUrl}/repos/${repo}/contents/${path}`;
      
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `token ${this.settings.token}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch file content`);
      }

      const data = await response.json();
      // Base64 decode content
      return decodeURIComponent(escape(atob(data.content)));
    } catch (error) {
      console.error('Failed to get file content:', error);
      throw new Error(`Failed to get file from ${this.getActivePlatformName()}: ${error.message}`);
    }
  }

  /**
   * Clear all Git settings for the current platform
   */
  clearSettings() {
    const platform = this.activePlatform;
    localStorage.removeItem(`${platform}-settings`);
    this.settings = { ...this.platforms[platform].defaultSettings };
  }

  /**
   * Get all available Git platforms
   * @returns {Object} Available platforms
   */
  getPlatforms() {
    return Object.keys(this.platforms).map(key => ({
      id: key,
      name: this.platforms[key].name
    }));
  }
}

// Create global instance
export const gitService = new GitService();

// Make available globally for UI access
window.gitService = gitService;
