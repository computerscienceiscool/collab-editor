# GitHub Integration User Guide

This guide explains how to use the GitHub integration features in the Collaborative Text Editor.

## Overview

The GitHub integration allows you to:

- Commit documents directly to GitHub repositories
- Pull existing files from GitHub repositories into your editor
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

Once your GitHub settings are configured, you can commit documents to your GitHub repository:

### How to Commit a Document

1. Create or edit a document in the editor
2. Go to **File → Commit to GitHub** (or press **Ctrl+Alt+G**)
3. In the commit dialog:
   - Verify or change the repository selection
   - Enter the file path where you want to save the document
   - Enter a descriptive commit message
   - Review the list of co-authors (all current collaborators will be included)
   - Click "Commit to GitHub"
4. Wait for the commit to complete (you'll see a success message)
5. Click the "View on GitHub" link to see your commit in the browser

### Commit Dialog Options

The commit dialog provides several options:

- **Repository**: Select which of your GitHub repositories to use
- **File Path**: Specify where in the repository the file should be saved
- **Commit Message**: A description of your changes (use standard Git conventions)
- **Co-Authors**: Displays collaborators who will be credited in the commit

### Co-Author Attribution

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

## Pulling Documents from GitHub

You can also retrieve existing files from GitHub repositories and load them into the editor:

### How to Pull a Document

1. Go to **File → Pull from GitHub**
2. In the pull dialog:
   - Select the repository containing the file
   - Enter the file path of the document you want to pull
   - Click "Preview File" to see the content before pulling
   - Review the file preview to ensure it's the correct document
   - Click "Pull File" to load the document into your editor
3. Confirm that you want to replace your current document
4. The file will be loaded into your editor

### Pull Dialog Options

The pull dialog provides several options:

- **Repository**: Select which of your GitHub repositories to pull from
- **File Path**: Specify the path to the file you want to retrieve
- **File Preview**: Shows a preview of the file content before you pull it
- **Pull File**: Replaces your current document with the GitHub file content

### Important Warning

When pulling a file from GitHub, it will replace any content currently in your editor. Make sure to save or commit your current work before pulling a file if you want to keep your changes.

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

## Common Workflows

### Creating a New Document in GitHub

1. Create a new document in the editor
2. Edit your content as needed
3. Go to File → Commit to GitHub
4. Enter a file path for your new document (e.g., "docs/new-document.md")
5. Enter a commit message like "Add new document"
6. Click "Commit to GitHub"

### Updating an Existing Document

1. Pull the document from GitHub (File → Pull from GitHub)
2. Make your edits in the editor
3. Commit the changes back to GitHub (File → Commit to GitHub)
4. Use the same file path as before
5. Enter a commit message describing your changes
6. Click "Commit to GitHub"

### Collaborative Editing and Committing

1. Share your room URL with collaborators
2. Edit the document together in real-time
3. When ready, one person commits the document to GitHub
4. All active collaborators will be listed as co-authors in the commit
5. The commit will appear in GitHub with all contributors credited

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

**"Pull failed" error**
- Verify the file exists at the specified path
- Check that you have read access to the repository
- Ensure the file isn't too large (GitHub has file size limits)

**Menu items not appearing or duplicated**
- Reload the page
- Check browser console (F12) for any JavaScript errors

### GitHub Token Security

- Your GitHub token is stored in your browser's localStorage with obfuscation
- Tokens are encoded to prevent casual inspection
- The token never leaves your browser except when making API calls directly to GitHub
- For security, use a token with only the necessary 'repo' scope
- If you're on a shared computer, remember to clear settings when finished

## Best Practices

- **Use descriptive commit messages** to explain your changes
- **Check co-authors** before committing to ensure all contributors are credited
- **Organize repositories** with logical file paths for your documents
- **Preview files** before pulling them to avoid accidentally overwriting content
- **Use consistent file paths** when committing and pulling the same document
- **Create separate tokens** for different applications or devices
- **Regularly update** your GitHub token for security (every few months)
