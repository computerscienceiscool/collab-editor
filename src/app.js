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
import { githubService } from './github/githubService.js';

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

  // Set up real-time markdown preview updates
  const setupMarkdownPreviewUpdates = (view, ytext) => {
    // Helper function to convert markdown to HTML
    const convertMarkdownToHtml = (markdown) => {
      // First try to use the existing markdown converter from the menu system
      let menuSystemInstance = null;
      
      // Try to get a MenuSystem instance if available
      if (typeof window.menuSystem === 'function') {
        menuSystemInstance = new window.menuSystem();
      }
      
      if (menuSystemInstance && typeof menuSystemInstance.markdownToHtml === 'function') {
        console.log("Using menu system's markdown converter");
        return menuSystemInstance.markdownToHtml(markdown);
      } else if (window.menuSystem && 
                 typeof window.menuSystem.prototype === 'object' && 
                 typeof window.menuSystem.prototype.markdownToHtml === 'function') {
        console.log("Using menu system prototype's markdown converter");
        return window.menuSystem.prototype.markdownToHtml(markdown);
      } else {
        console.log("Using fallback markdown converter");
        // Fallback markdown converter with improved regex patterns
        return markdown
          // Headers
          .replace(/^### (.*$)/gim, '<h3>$1</h3>')
          .replace(/^## (.*$)/gim, '<h2>$1</h2>')
          .replace(/^# (.*$)/gim, '<h1>$1</h1>')
          // Bold - needs non-greedy matching
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          // Italic - needs non-greedy matching
          .replace(/\*(.*?)\*/g, '<em>$1</em>')
          // Underline - supports both syntaxes
          .replace(/_(.*?)_/g, '<u>$1</u>')
          .replace(/__(.*?)__/g, '<u>$1</u>')
          // Strikethrough
          .replace(/~~(.*?)~~/g, '<del>$1</del>')
          // Code
          .replace(/`(.*?)`/g, '<code>$1</code>')
          // Lists - better regex handling
          .replace(/^\s*- (.*$)/gim, '<li>$1</li>')
          .replace(/((^<li>.*<\/li>\n)+)/gm, '<ul>$1</ul>')
          .replace(/^\s*\d+\. (.*$)/gim, '<li>$1</li>')
          .replace(/((^<li>.*<\/li>\n)+)/gm, '<ol>$1</ol>')
          // Links
          .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
          // Line breaks
          .replace(/\n/g, '<br>');
      }
    };
    
    // Function to update the preview
    const updatePreview = () => {
      // Check if the preview is currently visible
      const editorContainer = document.querySelector('.editor-container');
      const previewElement = document.getElementById('markdown-preview');
      
      if (!previewElement) return;
      
      if (editorContainer && editorContainer.classList.contains('split-view')) {
        // Add loading class during update
        editorContainer.classList.add('loading');
        previewElement.classList.add('loading');
        
        // Small delay to ensure loading state is visible
        setTimeout(() => {
          // Get current content and convert
          const content = view.state.doc.toString();
          const html = convertMarkdownToHtml(content);
          
          // Update the preview
          previewElement.innerHTML = html;
          
          // Remove loading classes
          editorContainer.classList.remove('loading');
          previewElement.classList.remove('loading');
          
          console.log('Markdown preview updated');
        }, 10);
      }
    };
    
    // Debounced update function
    const debouncedUpdate = () => {
      if (window.markdownUpdateTimeout) {
        clearTimeout(window.markdownUpdateTimeout);
      }
      
      window.markdownUpdateTimeout = setTimeout(() => {
        updatePreview();
      }, 300);
    };
    
    // Update when user types (keyup event)
    view.dom.addEventListener('keyup', debouncedUpdate);
    
    // Update when content is pasted
    view.dom.addEventListener('paste', debouncedUpdate);
    
    // Update when Yjs document changes (captures remote changes)
    ytext.observe(debouncedUpdate);
    
    // Listen for CodeMirror view updates
    view.dispatch = (() => {
      const originalDispatch = view.dispatch;
      return function(...args) {
        const result = originalDispatch.apply(this, args);
        // Check if this update affects the document content
        if (args[0] && args[0].changes && !args[0].changes.empty) {
          debouncedUpdate();
        }
        return result;
      };
    })();
    
    // Update when the preview is toggled on
    const viewMenu = document.getElementById('view-menu');
    if (viewMenu) {
      const togglePreviewItem = viewMenu.querySelector('[data-action="toggle-markdown-preview"]');
      if (togglePreviewItem) {
        togglePreviewItem.addEventListener('click', () => {
          // Short delay to allow the toggle to complete
          setTimeout(updatePreview, 50);
        });
      }
      
      // Connect to the existing "Update Preview" button
      const updatePreviewItem = viewMenu.querySelector('[data-action="update-markdown-preview"]');
      if (updatePreviewItem) {
        updatePreviewItem.addEventListener('click', updatePreview);
      }
    }
    
    // Connect to window-level toggle and update functions
    if (window.menuSystem && window.menuSystem.prototype) {
      // Store the original toggle function
      const originalToggle = window.menuSystem.prototype.toggleMarkdownPreview;
      if (originalToggle) {
        window.menuSystem.prototype.toggleMarkdownPreview = function() {
          // Call original toggle function
          originalToggle.apply(this);
          // Update the preview after toggling
          setTimeout(updatePreview, 50);
        };
      }
      
      // Store the original update function
      const originalUpdate = window.menuSystem.prototype.updateMarkdownPreview;
      if (originalUpdate) {
        window.menuSystem.prototype.updateMarkdownPreview = function() {
          // Call original update function
          originalUpdate.apply(this);
          // Also call our update function
          updatePreview();
        };
      }
    }
    
    // Check if preview is already visible and update it
    const editorContainer = document.querySelector('.editor-container');
    if (editorContainer && editorContainer.classList.contains('split-view')) {
      // Preview is already visible, update it immediately
      setTimeout(updatePreview, 100); // Small delay to ensure everything is loaded
    }
    
    // Setup scroll synchronization between editor and preview
    const setupScrollSync = () => {
      const editorContainer = document.querySelector('#editor');
      const previewPane = document.getElementById('markdown-preview');
      
      if (!editorContainer || !previewPane) return;
      
      let isEditorScrolling = false;
      let isPreviewScrolling = false;
      
      // When editor scrolls, sync preview
      editorContainer.addEventListener('scroll', () => {
        if (isPreviewScrolling) return;
        
        isEditorScrolling = true;
        
        // Calculate relative position
        const editorScrollRatio = editorContainer.scrollTop / 
          (editorContainer.scrollHeight - editorContainer.clientHeight || 1);
        
        // Apply to preview
        const previewScrollTarget = editorScrollRatio * 
          (previewPane.scrollHeight - previewPane.clientHeight || 1);
        
        previewPane.scrollTop = previewScrollTarget;
        
        // Reset flag after a delay
        setTimeout(() => {
          isEditorScrolling = false;
        }, 50);
      });
      
      // When preview scrolls, sync editor
      previewPane.addEventListener('scroll', () => {
        if (isEditorScrolling) return;
        
        isPreviewScrolling = true;
        
        // Calculate relative position
        const previewScrollRatio = previewPane.scrollTop / 
          (previewPane.scrollHeight - previewPane.clientHeight || 1);
        
        // Apply to editor
        const editorScrollTarget = previewScrollRatio * 
          (editorContainer.scrollHeight - editorContainer.clientHeight || 1);
        
        editorContainer.scrollTop = editorScrollTarget;
        
        // Reset flag after a delay
        setTimeout(() => {
          isPreviewScrolling = false;
        }, 50);
      });
      
      console.log('Scroll synchronization initialized');
    };

    // Function to save preview state
    const savePreviewState = (isVisible) => {
      try {
        localStorage.setItem('markdown-preview-visible', isVisible ? 'true' : 'false');
        console.log(`Markdown preview state saved: ${isVisible ? 'visible' : 'hidden'}`);
      } catch (error) {
        console.warn('Could not save markdown preview state:', error);
      }
    };

    // Function to load preview state
    const loadPreviewState = () => {
      try {
        const state = localStorage.getItem('markdown-preview-visible');
        return state === 'true'; // Convert to boolean
      } catch (error) {
        console.warn('Could not load markdown preview state:', error);
        return false; // Default to hidden
      }
    };

    // Override the menu system's toggle function to save state and setup scroll sync
    if (window.menuSystem && window.menuSystem.prototype) {
      const originalToggle = window.menuSystem.prototype.toggleMarkdownPreview;
      if (originalToggle) {
        window.menuSystem.prototype.toggleMarkdownPreview = function() {
          // Call original toggle function
          originalToggle.apply(this);
          
          // Get current state
          const container = document.querySelector('.editor-container');
          const isVisible = container && container.classList.contains('split-view');
          
          // Save state
          savePreviewState(isVisible);
          
          // Update preview content
          setTimeout(updatePreview, 50);
          
          // Setup scroll sync if preview is visible
          if (isVisible) {
            setTimeout(setupScrollSync, 100);
          }
        };
      }
    }

    // Initialize preview based on saved state
    const shouldShowPreview = loadPreviewState();
    if (shouldShowPreview) {
      console.log('Restoring markdown preview visibility from saved state');
      const container = document.querySelector('.editor-container');
      if (container && !container.classList.contains('split-view')) {
        // Toggle the preview if it should be visible but isn't
        if (window.menuSystem && window.menuSystem.prototype.toggleMarkdownPreview) {
          // Use the menu system's toggle function
          try {
            window.menuSystem.prototype.toggleMarkdownPreview.call({});
          } catch (error) {
            console.warn('Error toggling preview with menu system:', error);
            // Fallback to manual toggle
            container.classList.add('split-view');
            setTimeout(() => {
              updatePreview();
              setupScrollSync();
            }, 100);
          }
        } else {
          // Fallback: Toggle manually
          container.classList.add('split-view');
          setTimeout(() => {
            updatePreview();
            setupScrollSync();
          }, 100);
        }
      } else if (container && container.classList.contains('split-view')) {
        // Preview is already visible, just set up scroll sync
        setTimeout(setupScrollSync, 200);
      }
    }
    
    // Expose update function globally for other components
    window.updateMarkdownPreview = updatePreview;
    
    console.log('Real-time markdown preview updates initialized');
    return updatePreview;
  };

  // Add real-time markdown preview updates
  setupMarkdownPreviewUpdates(view, ytext);

  setTimeout(() => {
    handleDocumentCopy(view, ytext);
    }, 1500);

  // 3h. Detect when *this* user types and tell the others
  view.dom.addEventListener('keydown', (e) => {
    // Check if shortcuts are enabled - only block if it's a shortcut combination
    if (window.shortcutManager && !window.shortcutManager.isEnabled() && 
        (e.ctrlKey || e.metaKey)) {
      return; // Exit early if shortcuts are disabled and it's likely a shortcut
   }
      
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
  // Make key components available globally for GitHub integration
  window.ydoc = ydoc;
  window.awareness = awareness;

  // Initialize GitHub integration if token exists
  if (githubService.settings.token) {
    console.log("GitHub integration available");
  }
});
// initWasm();
