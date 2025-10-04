// File: src/app.js
//
import { initWasm } from './wasm/initWasm.js';
import { setupDocumentStats } from './ui/documentStats.js';
import { setupYjs } from './setup/yjsSetup.js';
import { setupEditor } from './setup/editorSetup.js';
import { setupExportHandlers } from './export/handlers.js';
import { setupUserControls } from './setup/userSetup.js';
import { setupUserLogging } from './ui/logging.js';
import { setupTypingIndicator } from './ui/typingIndicator.js';
import { setupUserList } from './ui/userList.js';
import { handleDocumentCopy } from './setup/documentCopy.js';
import { gitService } from './git/gitService.js';
import { gitMenuIntegration } from './git/gitMenuIntegration.js';

// 2. Declare a typingTimeout variable — it's needed across functions
let typingTimeout = null;

// 3. Wait for the page (DOM) to load before touching any HTML elements
window.addEventListener('DOMContentLoaded', async() => {

  // Initialize WASM FIRST
  console.log("Initializing WASM...");
  await initWasm();
  console.log("WASM ready!");

  // 3a. Set up Yjs state: shared document, awareness, etc.
  const { ydoc, provider, ytext, awareness, room } = setupYjs();
  
  document.querySelector('#room-name').textContent = room;

  // 3b. Set up the CodeMirror editor
  const view = setupEditor(ydoc, provider, ytext, awareness);

  //3b.i. Attach the editor globally available for menu actions
  window.editorView = view;

  // 3c. Hook up UI elements: name/color fields
  setupUserControls(provider);

  // 3d. Hook up save/export buttons
  setupExportHandlers(ydoc, ytext, view);

  // 3e. Track users joining/leaving
  setupUserLogging(awareness);

  // 3f. Show typing indicator in UI
  setupTypingIndicator(awareness);

  // 3g. Update user list in the toolbar
  setupUserList(awareness);
  setupDocumentStats(ytext, view);

  setTimeout(() => {
    handleDocumentCopy(view, ytext);
    }, 1500);

  // 3h. Detect when *this* user types and tell the others
  view.dom.addEventListener('keydown', () => {
    awareness.setLocalStateField('typing', true);

    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      awareness.setLocalStateField('typing', false);
    }, 1500);
  });

  //  3i. Hook up the Log toggle button *after* DOM is ready
  const toggleLogBtn = document.getElementById('toggle-log');
  const logPanel = document.getElementById('user-log');

  if (toggleLogBtn && logPanel) {
    toggleLogBtn.addEventListener('click', () => {
      const visible = logPanel.style.display !== 'none';
      logPanel.style.display = visible ? 'none' : 'block';
    });
  }
  
  // Make key components available globally for Git integration
  window.ydoc = ydoc;
  window.awareness = awareness;

  // Migrate legacy GitHub settings to new format if needed
  migrateGitHubSettings();

  // Initialize Git integration
  try {
    // Log available Git platforms
    const platforms = gitService.getPlatforms();
    console.log(`Available Git platforms: ${platforms.map(p => p.name).join(', ')}`);
    
    // Check if any Git platform is configured
    if (gitService.settings.token) {
      console.log(`${gitService.getActivePlatformName()} integration available`);
    } else {
      console.log("No Git platform configured yet");
    }
    
    // Initialize Git menu integration
    gitMenuIntegration.setup();
  } catch (error) {
    console.error("Error initializing Git integration:", error);
  }
});

/**
 * Migrate existing GitHub settings to the new Git service format
 */
function migrateGitHubSettings() {
  try {
    // Check if we have old GitHub settings
    const oldSettings = localStorage.getItem('github-settings');
    
    if (oldSettings) {
      console.log("Found existing GitHub settings");
      
      // Make sure GitHub is set as the active platform
      gitService.setActivePlatform('github');
      
      // Save platform selection in a new key
      localStorage.setItem('git-active-platform', 'github');
      
      console.log("GitHub set as default platform");
    }
  } catch (error) {
    console.error("Failed to migrate GitHub settings:", error);
  }
}

// initWasm();
