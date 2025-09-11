// tests/e2e/collaboration/multi-user.spec.js
import { test, expect } from '@playwright/test';
import { CollabEditorHelpers } from '../../utils/testHelpers.js';

test.describe('Real-time Collaboration', () => {
  let roomId;

  test.beforeEach(async () => {
    roomId = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  });

  test('two users can edit simultaneously', async ({ browser }) => {
    // Create two browser contexts (different users)
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();
    
    const user1 = new CollabEditorHelpers(page1);
    const user2 = new CollabEditorHelpers(page2);

    // Both users join the same room
    await user1.navigateToRoom(roomId);
    await user2.navigateToRoom(roomId);

    // Set up user identities
    await user1.setUser('Alice', '#ff0000');
    await user2.setUser('Bob', '#0000ff');

    // Wait for both users to connect
    await user1.waitForUserCount(2);
    await user2.waitForUserCount(2);

    // User 1 types first
    await user1.typeInEditor('Alice says hello! ');
    await user1.page.waitForTimeout(500);

    // User 2 should see Alice's text
    const contentAfterAlice = await user2.getEditorContent();
    expect(contentAfterAlice).toContain('Alice says hello!');

    // User 2 types at the end
    await user2.page.click('#editor .cm-content');
    await user2.page.keyboard.press('End');
    await user2.typeInEditor('Bob replies!');
    await user2.page.waitForTimeout(500);

    // Both users should see combined content
    const finalContentUser1 = await user1.getEditorContent();
    const finalContentUser2 = await user2.getEditorContent();

    expect(finalContentUser1).toContain('Alice says hello!');
    expect(finalContentUser1).toContain('Bob replies!');
    expect(finalContentUser2).toContain('Alice says hello!');
    expect(finalContentUser2).toContain('Bob replies!');

    // Clean up
    await context1.close();
    await context2.close();
  });

   test('user presence and awareness features work', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
  
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();
  
    const user1 = new CollabEditorHelpers(page1);
    const user2 = new CollabEditorHelpers(page2);

  // Join room
    await user1.navigateToRoom(roomId);
    await user2.navigateToRoom(roomId); 

    await user1.setUser('Alice', '#ff0000');
    await user2.setUser('Bob', '#0000ff');

    // Wait for connection
    await user1.waitForUserCount(2);
    await user2.waitForUserCount(2);

    // Check user list shows both users
    const userList1 = await user1.getUserList();
    const userList2 = await user2.getUserList();

    expect(userList1).toContain('Alice');
    expect(userList1).toContain('Bob');
    expect(userList2).toContain('Alice');
    expect(userList2).toContain('Bob');

    // Test typing indicator
    await user1.page.click('#editor .cm-content');
    await user1.page.keyboard.press('a'); // Start typing

    // User 2 should see typing indicator
    const isTyping = await user2.waitForTypingIndicator('Alice');
    expect(isTyping).toBe(true);

    await context1.close();
    await context2.close();
  });
});
