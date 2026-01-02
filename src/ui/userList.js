// File: src/ui/userList.js

/**
 * Sets up the live user list display in the top toolbar.
 * 
 * @param {Object} awareness - Custom awareness instance (not Yjs)
 */
export function setupUserList(awareness) {
  const userList = document.getElementById('user-list');
  const userCount = document.getElementById('user-count');
  
  if (!userList || !userCount) {
    console.error("User list elements not found in DOM");
    return;
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
          span.textContent = state.user.name || `User ${id}`;
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

  // Set up event listeners
  awareness.on('change', (states) => {
    console.log("[UserList] Awareness changed, updating user list");
    renderUserList();
  });
  
  // Initial render
  renderUserList();
  
  // Re-render every 5 seconds as a backup (in case events are missed)
  setInterval(renderUserList, 5000);
  
  console.log("[UserList] User list initialized");
}
