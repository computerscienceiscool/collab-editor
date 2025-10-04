// File: src/git/gitMenuIntegration.js

/**
 * Git menu integration 
 * Adds Git-related menu items to the application for both GitHub and Gitea
 */
import { gitService } from './gitService.js';
import { gitDialog } from '../ui/gitDialog.js';
import { gitCommitDialog } from '../ui/gitCommitDialog.js';
import { gitPullDialog } from '../ui/gitPullDialog.js';

/**
 * Git menu integration utilities
 */
export const gitMenuIntegration = {
  setup: setupGitMenuItems
};

/**
 * Initialize Git menu items
 */
function setupGitMenuItems() {
  // Add Git items to the File menu
  addFileMenuItems();
  
  // Add Git settings to the Tools menu
  addToolsMenuItem();
  
  // Register keyboard shortcuts
  registerShortcuts();
  
  console.log('Git menu integration initialized');
}

/**
 * Add Git-related items to File menu
 */
function addFileMenuItems() {
  const fileMenu = document.getElementById('file-menu');
  if (!fileMenu) return;
  
  // First check if Git items already exist to avoid duplicates
  const existingCommitItem = fileMenu.querySelector('[data-action="git-commit"]');
  if (existingCommitItem) {
    console.log('Git menu items already exist in File menu');
    return;
  }
  
  // Find position to insert Git items (before Email or Print)
  let insertBefore = null;
  for (const item of fileMenu.children) {
    if (item.dataset.action === 'email' || item.dataset.action === 'print') {
      insertBefore = item;
      break;
    }
  }
  
  // Create a section for Git actions
  const section = document.createElement('div');
  section.className = 'menu-section';
  
  // Commit to Git menu item
  const commitItem = document.createElement('div');
  commitItem.className = 'dropdown-item';
  commitItem.dataset.action = 'git-commit';
  commitItem.innerHTML = 'Commit to Git Repository <span class="keyboard-shortcut">Ctrl+Alt+G</span>';
  
  // Git Pull menu item
  const pullItem = document.createElement('div');
  pullItem.className = 'dropdown-item';
  pullItem.dataset.action = 'git-pull';
  pullItem.innerHTML = 'Pull from Git Repository';
  
  // Add items to the section
  section.appendChild(commitItem);
  section.appendChild(pullItem);
  
  // Insert section into the File menu
  if (insertBefore) {
    fileMenu.insertBefore(section, insertBefore);
  } else {
    fileMenu.appendChild(section);
  }
  
  // Update menu handlers
  updateMenuHandlers();
}

/**
 * Add Git settings to Tools menu
 */
function addToolsMenuItem() {
  const toolsMenu = document.getElementById('tools-menu');
  if (!toolsMenu) return;
  
  // First check if Git Settings already exists to avoid duplicates
  const existingGitItem = toolsMenu.querySelector('[data-action="git-settings"]');
  if (existingGitItem) {
    // Item already exists, no need to add it again
    console.log('Git Settings menu item already exists');
    return;
  }
  
  // Find settings section in Tools menu
  let settingsSection = null;
  for (const item of toolsMenu.children) {
    if (item.className === 'menu-section' && 
        item.querySelector('[data-action="preferences"]')) {
      settingsSection = item;
      break;
    }
  }
  
  if (!settingsSection) return;
  
  // Create Git settings menu item
  const gitSettingsItem = document.createElement('div');
  gitSettingsItem.className = 'dropdown-item';
  gitSettingsItem.dataset.action = 'git-settings';
  gitSettingsItem.textContent = 'Git Repository Settings';
  
  // Add item to the settings section
  settingsSection.appendChild(gitSettingsItem);
  
  // Update menu handlers
  updateMenuHandlers();
}

/**
 * Register Git keyboard shortcuts
 */
function registerShortcuts() {
  if (window.shortcutManager) {
    // Add Git shortcuts to shortcut manager
    const shortcuts = {
      'git-commit': { key: 'Ctrl+Alt+G', category: 'Git', description: 'Commit to Git Repository' },
      'git-settings': { key: 'Ctrl+Alt+Shift+G', category: 'Git', description: 'Git Repository Settings' }
    };
    
    // Register shortcuts with shortcut manager
    Object.entries(shortcuts).forEach(([action, config]) => {
      if (!window.shortcutManager.getShortcut(action)) {
        window.shortcutManager.shortcuts.set(action, config);
        window.shortcutManager.keyToAction.set(config.key, action);
      }
    });
    
    // Save shortcuts to localStorage
    window.shortcutManager.saveCustomizations();
  }
  
  // Add document-level keyboard handler
  document.addEventListener('keydown', handleGitShortcuts);
}

/**
 * Handle Git keyboard shortcuts
 * @param {KeyboardEvent} event - Keyboard event
 */
function handleGitShortcuts(event) {
  // Don't handle if a modal is already open
  if (document.querySelector('.modal-overlay.show')) {
    return;
  }
  
  const isMac = /Mac|iPhone|iPad/.test(navigator.platform);
  const mod = isMac ? event.metaKey : event.ctrlKey;
  
  // Ctrl+Alt+G: Commit to Git
  if (mod && event.altKey && !event.shiftKey && 
      (event.key === 'g' || event.key === 'G')) {
    event.preventDefault();
    handleGitCommit();
  }
  
  // Ctrl+Alt+Shift+G: Git Settings
  if (mod && event.altKey && event.shiftKey && 
      (event.key === 'g' || event.key === 'G')) {
    event.preventDefault();
    handleGitSettings();
  }
}

/**
 * Update menu action handlers to include Git actions
 */
function updateMenuHandlers() {
  // If MenuSystem class is accessible, extend its handleAction method
  if (window.menuSystem && window.menuSystem.prototype) {
    const originalHandleAction = window.menuSystem.prototype.handleAction;
    
    window.menuSystem.prototype.handleAction = function(action) {
      switch (action) {
        case 'git-commit':
          handleGitCommit();
          break;
        case 'git-pull':
          handleGitPull();
          break;
        case 'git-settings':
          handleGitSettings();
          break;
        default:
          // Call the original method for all other actions
          originalHandleAction.call(this, action);
      }
    };
  }
  
  // Add click handlers directly to the new menu items
  const commitItem = document.querySelector('[data-action="git-commit"]');
  if (commitItem) {
    commitItem.addEventListener('click', () => {
      // Close menu
      document.querySelectorAll('.dropdown-menu').forEach(menu => {
        menu.classList.remove('show');
      });
      
      handleGitCommit();
    });
  }
  
  const pullItem = document.querySelector('[data-action="git-pull"]');
  if (pullItem) {
    pullItem.addEventListener('click', () => {
      // Close menu
      document.querySelectorAll('.dropdown-menu').forEach(menu => {
        menu.classList.remove('show');
      });
      
      handleGitPull();
    });
  }
  
  const settingsItem = document.querySelector('[data-action="git-settings"]');
  if (settingsItem) {
    settingsItem.addEventListener('click', () => {
      // Close menu
      document.querySelectorAll('.dropdown-menu').forEach(menu => {
        menu.classList.remove('show');
      });
      
      handleGitSettings();
    });
  }
}

/**
 * Handle Git commit action
 */
function handleGitCommit() {
  // Check if Git integration is configured
  if (!gitService.settings.token) {
    if (confirm(`${gitService.getActivePlatformName()} integration not configured. Would you like to configure it now?`)) {
      gitDialog.show();
    }
    return;
  }
  
  // Get the editor view and document content
  const view = window.editorView;
  if (!view) {
    alert('Editor not available. Please try again.');
    return;
  }
  
  // Get the Yjs text and awareness instances
  const ytext = window.ydoc ? window.ydoc.getText('codemirror') : null;
  let awareness = null;
  
  // Try different ways to access awareness (based on your app structure)
  if (window.awareness) {
    awareness = window.awareness;
  } else if (window.provider && window.provider.awareness) {
    awareness = window.provider.awareness;
  }
  
  // Debug log the awareness object
  console.log("Awareness object for commit:", awareness);
  if (awareness) {
    console.log("Current users in room:", Array.from(awareness.getStates().entries()));
  }
  
  // Get document content
  const content = view.state.doc.toString();
  
  // Show commit dialog with awareness explicitly passed
  gitCommitDialog.show(content, ytext, awareness);
}

/**
 * Handle Git pull action
 */
function handleGitPull() {
  // Check if Git integration is configured
  if (!gitService.settings.token) {
    if (confirm(`${gitService.getActivePlatformName()} integration not configured. Would you like to configure it now?`)) {
      gitDialog.show();
    }
    return;
  }
  
  // Get the editor view and document content
  const view = window.editorView;
  if (!view) {
    alert('Editor not available. Please try again.');
    return;
  }
  
  // Get the Yjs text instance
  const ytext = window.ydoc ? window.ydoc.getText('codemirror') : null;
  
  // Show pull dialog
  if (window.gitPullDialog) {
    window.gitPullDialog.show(ytext, view);
  } else {
    console.error('Git pull dialog not available');
    alert('Git pull functionality not available. Please check the console for errors.');
  }
}

/**
 * Handle Git settings action
 */
function handleGitSettings() {
  gitDialog.show();
}

// Export for manual initialization
export default {
  setup: setupGitMenuItems
};
