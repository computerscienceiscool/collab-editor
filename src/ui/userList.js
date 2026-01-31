// File: src/ui/userList.js

// Module-level handler reference for cleanup (prevents duplicate listeners)
let changeHandler = null;
let backupInterval = null;

/**
 * Sets up the live user list display in the top toolbar.
 * Uses named handler to prevent duplicate listeners on re-initialization.
 *
 * @param {Object} awareness - Custom awareness instance
 */
export function setupUserList(awareness) {
  const userList = document.getElementById('user-list');
  const userCount = document.getElementById('user-count');

  if (!userList || !userCount) {
    console.error("User list elements not found in DOM");
    return;
  }

  // Remove previous handler and interval if exists (prevents duplicates on HMR/re-init)
  if (changeHandler) {
    awareness.off('change', changeHandler);
  }
  if (backupInterval) {
    clearInterval(backupInterval);
  }

  function renderUserList() {
    try {
      // Clear existing user list
      userList.innerHTML = '';
      
      // Get all user states from awareness
      const states = awareness.getStates();
      console.log(`[UserList] Rendering ${states.size} users`);
      
      let count = 0;
      const userElements = [];
      
      // Process each user
      states.forEach((state, id) => {
        // Check if user data exists
        if (state.user) {
          count++;
          
          // Create user element
          const span = document.createElement('span');
          span.className = 'user';
          // Show name with short ID to distinguish users with same name
          const shortId = String(id).slice(-6);
          const name = state.user.name || 'User';
          span.textContent = `${name} (${shortId})`;
          span.style.backgroundColor = state.user.color || '#ccc';
          
          userElements.push(span);
          
          console.log(`[UserList] Added user: ${state.user.name || `User ${id}`}`);
        }
      });
      
      // Update user count
      userCount.textContent = count.toString();
      
      // Add user elements to list
      userElements.forEach(el => userList.appendChild(el));
      
      console.log(`[UserList] Displayed ${count} users`);
    } catch (error) {
      console.error("[UserList] Error rendering user list:", error);
    }
  }

  // Create named handler for cleanup capability
  changeHandler = (states) => {
    console.log("[UserList] Awareness changed, updating user list");
    renderUserList();
  };

  // Register the handler
  awareness.on('change', changeHandler);

  // Initial render
  renderUserList();

  // Re-render every 5 seconds as a backup (in case events are missed)
  backupInterval = setInterval(renderUserList, 5000);

  console.log("[UserList] User list initialized");
}
