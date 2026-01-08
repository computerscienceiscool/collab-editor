# Playwright Test Information

> **TODO: Update Playwright tests to include neovim-plugin and change from Yjs to Automerge CRDT.**

Complete documentation for the Playwright testing setup in the Collaborative Text Editor project.

## Overview

This document describes the comprehensive Playwright testing infrastructure implemented for the Collaborative Text Editor - a real-time, multi-user document editing application with WASM-powered text processing and PromiseGrid protocol integration.

## Project Architecture

### Technology Stack
- **Frontend**: Vanilla JavaScript with CodeMirror 6, Vite bundler
- **Real-time Collaboration**: Yjs CRDTs with y-websocket for synchronization
- **Text Processing**: Rust WebAssembly (WASM) for high-performance formatting
- **Protocol Integration**: PromiseGrid CBOR messaging for decentralized computing
- **Backend Options**: Rust server (Axum) or Go server for persistence
- **Testing**: Playwright for E2E, Vitest for unit tests, multi-language testing

### Core Features Tested
- Real-time collaborative editing with conflict resolution
- WASM-powered text formatting (bold, italic, underline, etc.)
- Complex menu system (47 features across 6 menus)
- Document export in multiple formats including PromiseGrid CBOR
- Security measures (XSS prevention, input validation)
- Performance under load (large documents, concurrent users)

## Test Infrastructure

### File Structure
```
collab-editor/
├── playwright.config.js           # Main Playwright configuration
├── package.json                   # Test scripts and dependencies
├── tests/
│   ├── e2e/                       # End-to-end tests
│   │   ├── core/                  # Core functionality tests
│   │   │   ├── basic.spec.js      # Basic editor functionality
│   │   │   ├── keyboard-shortcuts.spec.js # Keyboard shortcut tests
│   │   │   ├── menu-system.spec.js        # Menu system tests
│   │   │   └── wasm-features.spec.js      # WASM integration tests
│   │   ├── collaboration/         # Multi-user collaboration tests
│   │   │   └── multi-user.spec.js # Real-time editing scenarios
│   │   ├── security/              # Security and validation tests
│   │   │   └── xss-prevention.spec.js # XSS and input validation
│   │   └── performance/           # Performance and load tests
│   │       └── load-testing.spec.js # Large document handling
│   ├── utils/                     # Test utilities and helpers
│   │   └── testHelpers.js         # CollabEditorHelpers class
│   └── fixtures/                  # Test data and fixtures
│       └── testData.js           # Sample documents and test data
└── test-results/                  # Generated test reports and artifacts
    ├── screenshots/               # Test failure screenshots
    ├── videos/                    # Test execution videos
    └── playwright-report/         # HTML test reports
```

## Configuration Files

### playwright.config.js
**Location**: Root directory  
**Purpose**: Main Playwright configuration

**Key Features**:
- **Base URL**: `http://localhost:8080/?room=test` (consistent test room)
- **Multi-browser testing**: Chrome, Firefox, Safari, Mobile Chrome
- **Auto-server startup**: Automatically starts y-websocket and frontend servers
- **Test artifacts**: Screenshots, videos, traces for debugging
- **Parallel execution**: Full parallel test execution for speed

```javascript
export default defineConfig({
  testDir: './tests/e2e',
  baseURL: 'http://localhost:8080/?room=test',
  fullyParallel: true,
  webServer: [
    {
      command: 'npx y-websocket --port 1234',
      port: 1234,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'npm run serve',
      port: 8080,
      reuseExistingServer: !process.env.CI,
    }
  ],
  // ... additional configuration
});
```

### package.json Test Scripts
**Location**: Root directory  
**Purpose**: Test execution commands

**Available Commands**:
```json
{
  "scripts": {
    "test:e2e": "playwright test tests/e2e/",
    "test:e2e:headed": "playwright test tests/e2e/ --headed",
    "test:e2e:debug": "playwright test tests/e2e/ --debug",
    "test:security": "playwright test tests/e2e/security/",
    "test:performance": "playwright test tests/e2e/performance/",
    "test:collaboration": "playwright test tests/e2e/collaboration/",
    "test:all": "npm run test:unit && npm run test:integration && npm run test:e2e",
    "test:report": "playwright show-report",
    "wasm:build": "cd rust-wasm && wasm-pack build --target web --out-dir pkg",
    "setup:test": "./scripts/setup-test-env.sh"
  }
}
```

## Test Helper Classes

### CollabEditorHelpers
**Location**: `tests/utils/testHelpers.js`  
**Purpose**: Centralized helper methods for interacting with the editor

**Key Methods**:
```javascript
class CollabEditorHelpers {
  // Navigation and setup
  async navigateToRoom(roomId = 'test')
  async setUser(name, color)
  async clearEditor()
  async setEditorContent(text)

  // Text operations
  async typeInEditor(text)
  async getEditorContent()
  async selectAllText()

  // Formatting operations
  async applyBold()
  async applyItalic()
  async applyUnderline()
  async formatDocument()

  // Menu system operations
  async openMenu(menuName)
  async clickMenuItem(action)
  async useMenuAction(menuName, action)

  // Collaboration features
  async waitForUserCount(expectedCount)
  async waitForConnection()
  async getUserList()

  // WASM and performance testing
  async testWasmCompression(text)
  async measureTypingPerformance(textLength)
  async callWasmFunction(functionName, ...args)
}
```

## Test Categories

### 1. Core Functionality Tests
**Location**: `tests/e2e/core/`

#### basic.spec.js
**Purpose**: Fundamental editor functionality
- Editor loading and initialization
- Basic text input and output
- Text formatting (bold, italic, underline)
- WASM function integration

**Sample Test**:
```javascript
test('should apply text formatting', async ({ page }) => {
  const helpers = new CollabEditorHelpers(page);
  await helpers.navigateToRoom();
  await helpers.setEditorContent('Format me');
  await page.keyboard.press('Control+a');
  await helpers.applyBold();
  
  const content = await helpers.getEditorContent();
  expect(content).toContain('**Format me**');
});
```

#### keyboard-shortcuts.spec.js
**Purpose**: Comprehensive keyboard shortcut testing
- **Text Formatting**: Ctrl+B (Bold), Ctrl+I (Italic), Ctrl+Alt+U (Underline)
- **Document Navigation**: Ctrl+A (Select All), Ctrl+F (Find)
- **File Operations**: Ctrl+N (New), Ctrl+P (Print)
- **Interface Control**: Ctrl+Alt+Y (Toggle Toolbar), Esc (Close Menus)

**Known Issues**:
- **Ctrl+U conflicts** with browser "View Source" - resolved by using Ctrl+Alt+U
- **Ctrl+Shift+U conflicts** with Unicode input - avoided
- **Focus requirements**: Shortcuts only work when editor has focus

### 2. Collaboration Tests
**Location**: `tests/e2e/collaboration/`

#### multi-user.spec.js
**Purpose**: Real-time multi-user editing scenarios
- Simultaneous editing by multiple users
- User presence and awareness features
- Conflict resolution testing
- Typing indicators and user lists

**Multi-User Setup**:
```javascript
test('two users can edit simultaneously', async ({ browser }) => {
  const context1 = await browser.newContext();
  const context2 = await browser.newContext();
  
  const page1 = await context1.newPage();
  const page2 = await context2.newPage();
  
  const user1 = new CollabEditorHelpers(page1);
  const user2 = new CollabEditorHelpers(page2);

  const roomId = await user1.generateUniqueRoom();
  await user1.navigateToRoom(roomId);
  await user2.navigateToRoom(roomId);
  
  // Test simultaneous editing...
});
```

### 3. WASM Integration Tests
**Location**: `tests/e2e/core/wasm-features.spec.js`

#### Features Tested
- **Text Formatting**: Bold (`**text**`), Italic (`*text*`), Underline (`__text__`)
- **Document Compression**: 98% compression ratio testing
- **Document Statistics**: Word count, character count, reading time
- **Search Functionality**: Client-side search with WASM performance
- **PromiseGrid Protocol**: CBOR message generation and parsing

**WASM Performance Test**:
```javascript
test('document compression works correctly', async ({ page }) => {
  const testText = 'This is a test document. '.repeat(100);
  await helpers.typeInEditor(testText);
  
  const compressionResult = await helpers.testWasmCompression(testText);
  
  expect(compressionResult.roundTrip).toBe(true);
  expect(compressionResult.compressed).toBeLessThan(compressionResult.original);
  
  const compressionRatio = (compressionResult.original - compressionResult.compressed) / compressionResult.original;
  expect(compressionRatio).toBeGreaterThan(0.5); // At least 50% compression
});
```

### 4. Security Tests
**Location**: `tests/e2e/security/`

#### XSS Prevention
- Script injection prevention in document content
- Safe handling of malicious document titles
- CBOR injection attack protection
- Input validation across all user inputs

**XSS Test Example**:
```javascript
test('prevents script execution in document content', async ({ page }) => {
  const xssPayloads = [
    '<script>window.testXSS()</script>',
    '<img src="x" onerror="window.testXSS()">',
    '<svg onload="window.testXSS()">'
  ];

  for (const payload of xssPayloads) {
    await helpers.typeInEditor(payload + ' ');
    await page.waitForTimeout(500);
    
    const executed = await page.evaluate(() => window.xssExecuted);
    expect(executed).toBe(false);
  }
});
```

### 5. Menu System Tests
**Location**: `tests/e2e/core/menu-system.spec.js`

#### Menu Categories Tested
- **File Menu**: New, Save, Export (7 formats), Share, Print
- **Edit Menu**: Cut, Copy, Paste, Undo, Redo, Find
- **Format Menu**: Bold, Italic, Underline, Headers, Lists
- **Tools Menu**: Word Count, Statistics, Line Numbers
- **View Menu**: Toggle panels, Markdown preview
- **Help Menu**: Documentation, Keyboard shortcuts

**Menu Interaction Test**:
```javascript
test('Format menu applies text formatting', async ({ page }) => {
  await helpers.typeInEditor('Format this text');
  await page.keyboard.press('Control+a');
  
  await page.click('button[data-menu="format"]');
  await page.click('[data-action="bold"]');
  
  const content = await helpers.getEditorContent();
  expect(content).toContain('**Format this text**');
});
```

## Test Execution

### Development Workflow
```bash
# Setup environment
npm install
make wasm  # Build WASM module
make ws    # Start WebSocket server
make serve # Start frontend server

# Run tests
npm run test:e2e                    # All E2E tests
npm run test:e2e:headed             # With visible browser
npm run test:collaboration          # Just collaboration tests
npm run test:security              # Just security tests
npm run test:e2e:debug             # Debug mode

# View results
npm run test:report                 # Open HTML report
```

### Continuous Integration
The test suite is designed for CI/CD with:
- **Automatic server startup** via webServer configuration
- **Parallel execution** for faster completion
- **Multiple output formats** (HTML, JSON, JUnit)
- **Failure artifacts** (screenshots, videos, traces)

### Performance Characteristics
- **Full test suite**: ~15 minutes (80 tests across 4 browsers)
- **Basic tests only**: ~2 minutes
- **Collaboration tests**: ~5 minutes (requires multiple browser contexts)
- **Security tests**: ~3 minutes
- **WASM tests**: ~4 minutes

## Known Issues and Solutions

### Keyboard Shortcut Conflicts
**Issue**: Browser shortcuts override application shortcuts
- **Ctrl+U**: Conflicts with "View Source" → Use **Ctrl+Alt+U**
- **Ctrl+Shift+U**: Conflicts with Unicode input → Avoided
- **Ctrl+Shift+C**: May conflict with DevTools → Works but timing sensitive

**Solution**: Use alternative key combinations that don't conflict with browser defaults.

### Test Environment Setup
**Issue**: Complex multi-language stack requires specific setup order
**Solution**: 
1. Build WASM module first (`make wasm`)
2. Start WebSocket server (`make ws`)
3. Start frontend server (`make serve`)
4. Run tests with proper base URL (`/?room=test`)

### Text Selection in Tests
**Issue**: CodeMirror text selection can be timing-sensitive
**Solution**: 
- Use `page.keyboard.press('Control+a')` for reliable selection
- Add `waitForTimeout()` after selection operations
- Verify selection state before applying formatting

### Multi-User Testing
**Issue**: Collaboration requires separate browser contexts
**Solution**: 
- Create separate contexts with `browser.newContext()`
- Use unique room IDs for each test to avoid interference
- Wait for user count changes to confirm connection

## Test Data and Fixtures

### Test Documents
**Location**: `tests/fixtures/testData.js`

```javascript
export const testDocuments = {
  simple: "Hello World!",
  markdown: "# Title\n\nThis is **bold** and *italic* text.",
  large: "Lorem ipsum dolor sit amet. ".repeat(1000),
  collaborative: {
    user1: "User 1 content ",
    user2: "User 2 content ",
    user3: "User 3 content "
  }
};
```

### Test Users and Rooms
```javascript
export const testUsers = [
  { name: "Alice", color: "#ff0000" },
  { name: "Bob", color: "#00ff00" },
  { name: "Charlie", color: "#0000ff" }
];

export const testRooms = {
  basic: "test-room-basic",
  collaboration: "test-room-collab",
  performance: "test-room-perf",
  security: "test-room-security"
};
```

## Debugging and Troubleshooting

### Common Issues

1. **WASM not loaded**: Check console for initialization errors
2. **WebSocket connection fails**: Ensure y-websocket server is running on port 1234
3. **Tests timing out**: Increase timeout values in playwright.config.js
4. **Selection not working**: Verify editor has focus before applying formatting

### Debug Tools
- **Headed mode**: `--headed` flag to see browser actions
- **Debug mode**: `--debug` flag for step-by-step execution
- **Screenshots**: Automatic on test failure
- **Videos**: Recorded for failed tests
- **Console logs**: Available in test output and HTML reports

### Environment Verification
```bash
# Check if all components are working
make wasm                           # Build WASM
curl http://localhost:1234          # WebSocket server
curl http://localhost:8080          # Frontend server
npx playwright test --list          # List all tests
```

## Future Enhancements

### Planned Test Additions
- **Mobile device testing** with real device emulation
- **Accessibility testing** with screen reader simulation
- **Performance regression testing** with baseline comparisons
- **API testing** for backend endpoints
- **Load testing** with hundreds of concurrent users

### Integration Opportunities
- **Visual regression testing** with screenshot comparison
- **Cross-browser compatibility** testing automation
- **Automated accessibility audits** using axe-core
- **Performance monitoring** integration with Lighthouse CI

## Maintenance

### Regular Tasks
- **Update dependencies**: Playwright, test browsers
- **Review test coverage**: Ensure new features have tests
- **Clean test artifacts**: Remove old screenshots and videos
- **Monitor test performance**: Identify slow or flaky tests

### Documentation Updates
This document should be updated when:
- New test files are added
- Test helper methods are modified
- Configuration changes are made
- New testing patterns are established

---

**Last Updated**: August 2025  
**Test Suite Version**: 1.0  
**Total Tests**: 80+ across multiple categories  
**Browser Coverage**: Chrome, Firefox, Safari, Mobile Chrome
