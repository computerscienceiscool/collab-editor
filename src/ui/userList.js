// File: src/ui/userList.js

/**
 * Sets up the live user list display in the top toolbar.
 * 
 * @param {awareness} awareness - Yjs awareness instance
 */
export function setupUserList(awareness) {
  const userList = document.getElementById('user-list');
  const userCount = document.getElementById('user-count');
  const localID = awareness.clientID;

  if (!userList || !userCount) return;

  function renderUserList() {
    const states = awareness.getStates();
    const fragments = [];

    let count = 0;
    states.forEach((state, id) => {
      const user = state.user;
      if (!user) return;

      const span = document.createElement('span');
      span.className = 'user';
      span.textContent = user.name || `User ${id}`;
      span.style.backgroundColor = user.color || '#ccc';

      fragments.push(span);
      count += 1;
    });

    // Clear and re-render
    userList.innerHTML = '';
    fragments.forEach(fragment => userList.appendChild(fragment));

    userCount.textContent = `Users: ${count}`;
  }

  awareness.on('change', renderUserList);
  renderUserList();
}
