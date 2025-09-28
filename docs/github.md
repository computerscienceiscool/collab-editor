# GitHub Integration User Guide

This guide explains how to use the GitHub integration features in the Collaborative Text Editor.

## Overview

The GitHub integration allows you to:

- Commit documents directly to GitHub repositories
- Include all collaborators as co-authors in commits
- Configure GitHub settings with your personal access token
- Access GitHub features through menu items and keyboard shortcuts

## Setup Instructions

Before you can use the GitHub integration, you need to configure your GitHub settings:

### Step 1: Create a GitHub Personal Access Token

1. Go to [GitHub Settings → Developer Settings → Personal Access Tokens](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Give your token a descriptive name like "Collaborative Text Editor"
4. Select the **repo** scope (this gives access to your repositories)
5. Click "Generate token"
6. **Important**: Copy the generated token immediately - GitHub will only show it once

### Step 2: Configure GitHub Settings in the Editor

1. Open the Collaborative Text Editor
2. Go to **Tools → GitHub Settings** (or press **Ctrl+Alt+Shift+G**)
3. In the GitHub Settings dialog:
   - Paste your GitHub personal access token in the "Access Token" field
   - Click "Validate Token" (you should see a success message with your username)
   - Select a repository from the dropdown list
   - Enter a default file path (e.g., "documents/mydoc.md")
   - Enter a default commit message (or keep the default)
   - Click "Save Settings"

## Committing Documents to GitHub

Once your GitHub settings are configured, you can commit documents:

### Method 1: Using the File Menu

1. Create or edit a document in the editor
2. Go to **File → Commit to GitHub**
3. In the commit dialog:
   - Verify or change the repository and file path
   - Enter a descriptive commit message
   - Review the list of co-authors (all current collaborators will be included)
   - Click "Commit to GitHub"
4. Wait for the commit to complete (you'll see a success message)
5. Click the "View on GitHub" link to see your commit

### Method 2: Using Keyboard Shortcuts

1. Press **Ctrl+Alt+G** to open the commit dialog
2. Complete the same steps as in Method 1

## Co-Author Attribution

The GitHub integration automatically detects all collaborators in your current editing session:

- Each collaborator's name is included in the commit using the GitHub "Co-authored-by" format
- The system automatically generates email addresses for co-authors based on their display names
- Co-authors are shown in the commit dialog before you commit
- On GitHub, all co-authors will appear in the commit history

Example of how co-authors appear in a commit message:
```
Update document with new content

Co-authored-by: Jane Smith <janesmith@example.com>
Co-authored-by: Bob Johnson <bobjohnson@example.com>
```

## Keyboard Shortcuts

| Action | Shortcut | Description |
|--------|----------|-------------|
| Commit to GitHub | **Ctrl+Alt+G** | Opens the GitHub commit dialog |
| GitHub Settings | **Ctrl+Alt+Shift+G** | Opens the GitHub settings dialog |

Note: On Mac, use **Command** instead of **Ctrl**.

## GitHub Settings Management

You can manage your GitHub settings at any time:

### Updating Settings

1. Go to **Tools → GitHub Settings** (or press **Ctrl+Alt+Shift+G**)
2. Make your changes
3. Click "Save Settings"

### Refreshing Repository List

If you've created new repositories on GitHub and need to update the list:
1. Open GitHub Settings
2. Click the "Refresh" button next to the repository dropdown
3. Select your new repository from the updated list

### Clearing Settings

If you want to remove your GitHub token and settings:
1. Open GitHub Settings
2. Click the "Clear Settings" button at the bottom
3. Confirm the action when prompted

## Troubleshooting

### Common Issues and Solutions

**"Token validation failed" error**
- Ensure your token has the correct 'repo' scope
- Check if your token has expired (GitHub tokens can expire)
- Generate a new token on GitHub and update your settings

**"Failed to fetch repositories" error**
- Check your internet connection
- Verify that your token is still valid
- Ensure you have at least one repository on GitHub

**"Commit failed" error**
- Check that the file path is valid (avoid special characters)
- Ensure the repository still exists
- Verify you have write access to the repository

**Menu items not appearing**
- Reload the page
- Check browser console (F12) for any JavaScript errors

### GitHub Token Security

- Your GitHub token is stored only in your browser's localStorage
- The token never leaves your browser except when making API calls directly to GitHub
- For security, use a token with only the necessary 'repo' scope
- If you're on a shared computer, remember to clear settings when finished

## Feature Limitations

- **Pull from GitHub**: This feature is planned for future updates
- **Branch selection**: Currently uses the default branch of the repository
- **Conflict resolution**: Commits may fail if there are conflicts with remote changes

## Best Practices

- **Use descriptive commit messages** to explain your changes
- **Check co-authors** before committing to ensure all contributors are credited
- **Organize repositories** with logical file paths for your documents
- **Create separate tokens** for different applications or devices
- **Regularly update** your GitHub token for security (every few months)
