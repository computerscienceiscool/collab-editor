# Test Running Guide

## Overview

This document provides comprehensive instructions for running the end-to-end test suite for the Collaborative Text Editor. The test suite uses Playwright for browser automation and includes tests for core functionality, security features, and multi-user collaboration.

## Prerequisites

### Required Software
- **Node.js** (v16 or higher)
- **npm** (v7 or higher)
- **Git** (for version control)

### Initial Setup
```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install

# Verify installation
npx playwright --version
```

## Test Suite Structure

```
tests/
├── e2e/
│   ├── core/                 # Basic functionality tests
│   │   ├── basic.spec.js     # Editor loading and text input
│   │   ├── keyboard-shortcuts.spec.js  # Keyboard shortcut functionality
│   │   ├── menu-system.spec.js         # Menu operations
│   │   └── wasm-features.spec.js       # WASM text processing
│   ├── security/             # Security and XSS prevention tests
│   │   └── xss-prevention.spec.js
│   └── collaboration/        # Multi-user functionality tests
│       └── multi-user.spec.js
├── utils/
│   └── testHelpers.js        # Shared test utilities
├── global-setup.js           # Global test configuration
└── playwright.config.js      # Playwright configuration
```

## Enhanced Test Logging

The test suite now includes enhanced logging that shows exactly which test is running and what operations it's performing. This makes debugging much easier.

### Log Format
```
[timestamp] [Test Name] LEVEL Message
```

### Log Levels
- **INFO**: General information and progress
- **PASS/SUCCESS**: Successful operations
- **FAIL/ERROR**: Failures and errors
- **FLAKY/RETRY**: Retry attempts for flaky operations
- **WARN**: Warnings and fallback operations
- **TIMEOUT**: Timeout-related messages

### Example Output
```
[12:34:56] [Ctrl+B applies bold formatting] INFO Navigating to room: test-1234567890
[12:34:57] [Ctrl+B applies bold formatting] INFO Setting editor content: "Bold text test"
[12:34:58] [Ctrl+B applies bold formatting] PASS Content set successfully
[12:34:59] [Ctrl+B applies bold formatting] INFO Applying bold formatting
[12:35:00] [Ctrl+B applies bold formatting] PASS Bold formatting applied via WASM
```

### Benefits
- **Precise debugging**: Know exactly which test and operation is failing
- **Progress tracking**: See test execution in real-time
- **Performance insights**: Identify slow operations
- **Fallback tracking**: See when tests use fallback methods

## Running Tests

### Method 1: Enhanced Test Script (Recommended)

The enhanced test script provides the easiest way to run tests with automatic server management and helpful debugging options.

#### Setup
```bash
# Make the script executable (first time only)
chmod +x run-tests.sh
```

#### Basic Usage
```bash
# Run all tests on all browsers
./run-tests.sh

# Run tests on specific browser
./run-tests.sh --browser=chromium
./run-tests.sh --browser=firefox
./run-tests.sh --browser=webkit
./run-tests.sh --browser=mobile-chrome

# Run specific test categories
./run-tests.sh --mode=core          # Core functionality only
./run-tests.sh --mode=security      # Security tests only
./run-tests.sh --mode=collaboration # Multi-user tests only
./run-tests.sh --mode=quick         # Basic validation tests
./run-tests.sh --mode=keyboard      # Keyboard shortcuts only
```

#### Debugging Options
```bash
# Debug mode with visible browser
./run-tests.sh --debug --headed --browser=chromium

# Verbose output for troubleshooting
./run-tests.sh --verbose --browser=chromium

# Focus on specific failing tests
./run-tests.sh --mode=keyboard --browser=chromium --headed
```

#### Combined Options
```bash
# Example: Debug core tests on Chrome with visible browser
./run-tests.sh --browser=chromium --mode=core --debug --headed

# Example: Quick validation with verbose output
./run-tests.sh --mode=quick --verbose
```

#### Help
```bash
# Show all available options
./run-tests.sh --help
```

### Method 2: Direct Playwright Commands

For more control or CI/CD integration, you can run Playwright directly.

#### Prerequisites
```bash
# Ensure development server is running
npm run dev
# Server should be available at http://localhost:8080
```

#### Basic Commands
```bash
# Run all tests
npx playwright test

# Run tests on specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit

# Run specific test files
npx playwright test tests/e2e/core/basic.spec.js
npx playwright test tests/e2e/core/keyboard-shortcuts.spec.js
npx playwright test tests/e2e/security/
```

#### Debug Commands
```bash
# Run with debug info
npx playwright test --debug

# Run in headed mode (visible browser)
npx playwright test --headed

# Run with trace recording
npx playwright test --trace=on

# Run specific test with full debugging
npx playwright test tests/e2e/core/basic.spec.js --headed --debug
```

#### Additional Options
```bash
# Run with custom timeout
npx playwright test --timeout=60000

# Run with retries for flaky tests
npx playwright test --retries=2

# Run tests matching pattern
npx playwright test --grep="keyboard shortcuts"

# Run only failed tests from last run
npx playwright test --last-failed
```

## Test Categories Explained

### Core Tests (`--mode=core`)
Tests fundamental editor functionality:
- **Basic**: Editor loading, text input, content management
- **Keyboard Shortcuts**: All keyboard combinations and formatting shortcuts
- **Menu System**: Menu navigation, dropdown actions, interface controls
- **WASM Features**: Text processing, formatting, compression, search

### Security Tests (`--mode=security`)
Tests security measures and XSS prevention:
- Input validation and sanitization
- Script injection prevention
- URL manipulation protection
- Content Security Policy compliance

### Collaboration Tests (`--mode=collaboration`)
Tests multi-user functionality:
- Real-time document editing
- User presence and awareness
- Conflict resolution
- WebSocket communication

### Quick Tests (`--mode=quick`)
Minimal test set for rapid validation:
- Basic editor loading
- Simple text operations
- Essential functionality verification

### WASM Function Mocking

The test suite includes comprehensive WASM function mocking to ensure tests run reliably without requiring actual WASM compilation.

#### Mocked Functions
- **Text Formatting**: `toggle_bold`, `toggle_italic`, `toggle_underline`, `toggle_strikethrough`
- **Document Processing**: `format_text`, `calculate_document_stats`
- **Search**: `search_document`
- **URL Conversion**: `convert_url_to_markdown`
- **List/Heading**: `toggle_list`, `toggle_heading`
- **Compression**: `compress_document`, `decompress_document`
- **PromiseGrid**: `createPromiseGridMessage`, `create_promisegrid_edit_message`

#### Mock Behavior
- **Realistic responses**: Mocks simulate actual WASM function behavior
- **Edge case handling**: Proper handling of empty strings, special characters
- **Error simulation**: Safe failure modes for testing error handling
- **Performance simulation**: Realistic execution times

#### Benefits
- **No WASM dependencies**: Tests run without requiring WASM compilation
- **Faster execution**: No WASM loading time
- **Reliable behavior**: Consistent mock responses
- **Cross-platform**: Works on all test environments

## Browser-Specific Considerations

### Chromium (Recommended for Development)
- **Most reliable** browser for testing
- **Fastest execution** times
- **Best debugging support**
- Use for primary development and debugging

### Firefox
- **Different rendering engine** (Gecko vs Blink)
- **Longer timeout requirements** than Chromium
- **May require additional retries** for stability
- Important for cross-browser compatibility

### WebKit (Safari)
- **Different key combinations** (Meta vs Control keys)
- **Slower execution** than other browsers
- **Important for Mac/iOS compatibility**
- May have different behavior with keyboard shortcuts

### Mobile Chrome
- **Touch interface testing**
- **Different viewport and interactions**
- **Slower performance** than desktop browsers
- Essential for mobile compatibility

### Browser-Specific Key Handling

The test suite automatically detects the browser and uses appropriate key combinations:

#### Chromium/Firefox
- **Bold**: `Control+b`
- **Italic**: `Control+i`
- **Underline**: `Control+u`
- **Copy**: `Control+c`
- **Paste**: `Control+v`
- **Select All**: `Control+a`
- **Find**: `Control+f`

#### WebKit (Safari)
- **Bold**: `Meta+b` (Cmd+B on Mac)
- **Italic**: `Meta+i` (Cmd+I on Mac)
- **Underline**: `Meta+u` (Cmd+U on Mac)
- **Copy**: `Meta+c` (Cmd+C on Mac)
- **Paste**: `Meta+v` (Cmd+V on Mac)
- **Select All**: `Meta+a` (Cmd+A on Mac)
- **Find**: `Meta+f` (Cmd+F on Mac)

#### Automatic Detection
Tests automatically detect the browser and use the correct modifier:
```javascript
const modifier = browserName === 'webkit' ? 'Meta' : 'Control';
await page.keyboard.press(`${modifier}+b`);
```

## Troubleshooting

### Common Issues and Solutions

#### Development Server Not Running
```bash
# Check if server is running
curl http://localhost:8080

# Start server manually
npm run dev

# Check for port conflicts
lsof -i :8080
```

#### WASM Functions Not Loading
```bash
# Verify WASM build
make wasm

# Check browser console for errors
./run-tests.sh --headed --debug --browser=chromium

# Verify mock setup with enhanced logging
./run-tests.sh --verbose | grep "WASM mocks"
```

#### Keyboard Shortcuts Failing
```bash
# Test on Chromium first (most reliable)
./run-tests.sh --browser=chromium --mode=keyboard

# Check for focus issues
./run-tests.sh --mode=keyboard --headed --debug

# Look for browser detection issues
./run-tests.sh --mode=keyboard --verbose | grep "Detected browser"

# Check for key modifier problems
./run-tests.sh --browser=webkit --mode=keyboard --verbose | grep "Meta\|Control"
```

#### Timeout Errors
```bash
# Increase timeout and retries
npx playwright test --timeout=90000 --retries=3

# Run single browser to reduce resource conflicts
./run-tests.sh --browser=chromium
```

#### WebSocket Connection Issues
```bash
# Check if Automerge sync server is running
# Collaboration tests may fail without sync server running on port 1234

# Run tests that don't require collaboration
./run-tests.sh --mode=core
```

#### Formatting Fallback Issues
```bash
# Track fallback usage
./run-tests.sh --verbose | grep "fallback\|RETRY"

# See which methods succeed
./run-tests.sh --verbose | grep "applied via"

# Check for function availability
./run-tests.sh --verbose | grep "toggle_bold\|format_text"
```

### Enhanced Troubleshooting with Logging

#### Test-Specific Debugging
```bash
# Debug a specific failing test with enhanced logging
npx playwright test tests/e2e/core/keyboard-shortcuts.spec.js --headed --debug --grep="Ctrl+B"

# Run single test with maximum verbosity
npx playwright test tests/e2e/core/basic.spec.js --headed --timeout=0
```

#### Log Analysis
```bash
# Filter logs for specific test
./run-tests.sh --verbose | grep "Bold formatting"

# Look for specific log levels
./run-tests.sh --verbose | grep "FAIL\|ERROR"

# Track retry attempts
./run-tests.sh --verbose | grep "RETRY\|FLAKY"
```

#### Browser Developer Tools
When running with `--headed --debug`:
1. **Console tab**: View test helper logs and WASM mock messages
2. **Network tab**: Monitor WebSocket connections for collaboration tests
3. **Elements tab**: Inspect DOM for XSS prevention verification
4. **Sources tab**: Set breakpoints in test code if needed

### Common Log Patterns

#### Successful Test Pattern
```
[timestamp] [Test Name] INFO Starting test operation
[timestamp] [Test Name] PASS Operation completed successfully
```

#### Retry Pattern (Normal)
```
[timestamp] [Test Name] WARN Method 1 failed, trying fallback
[timestamp] [Test Name] RETRY Attempting method 2
[timestamp] [Test Name] PASS Fallback method succeeded
```

#### Failure Pattern
```
[timestamp] [Test Name] ERROR Operation failed
[timestamp] [Test Name] FAIL Final assertion failed
```

### Test Debugging Workflow

1. **Start with Quick Tests**
   ```bash
   ./run-tests.sh --mode=quick --browser=chromium
   ```

2. **If Quick Tests Fail, Debug**
   ```bash
   ./run-tests.sh --mode=quick --debug --headed --browser=chromium
   ```

3. **Focus on Specific Failures**
   ```bash
   # If keyboard shortcuts fail
   ./run-tests.sh --mode=keyboard --headed --browser=chromium
   
   # If menu system fails
   npx playwright test tests/e2e/core/menu-system.spec.js --headed
   ```

4. **Check Browser Compatibility**
   ```bash
   # Test each browser individually
   ./run-tests.sh --browser=firefox --mode=core
   ./run-tests.sh --browser=webkit --mode=core
   ```

## Advanced Debugging Techniques

### Test-Specific Debugging with Enhanced Logging
```bash
# Debug a specific failing test with enhanced logging
npx playwright test tests/e2e/core/keyboard-shortcuts.spec.js --headed --debug --grep="Ctrl+B"

# Run single test with maximum verbosity
npx playwright test tests/e2e/core/basic.spec.js --headed --timeout=0

# Monitor specific operations
./run-tests.sh --verbose | grep "formatting\|navigation\|content"
```

### Performance Analysis
```bash
# Monitor slow tests
./run-tests.sh --verbose | grep "completed in"

# Track formatting performance
./run-tests.sh --mode=core --verbose | grep "formatting.*ms"

# Identify timeout patterns
./run-tests.sh --verbose | grep "TIMEOUT\|timeout"
```

### Fallback Method Tracking
```bash
# See when tests use fallback methods
./run-tests.sh --verbose | grep "fallback\|RETRY\|attempt"

# Track successful method types
./run-tests.sh --verbose | grep "applied via\|succeeded via"
```

## Performance Monitoring

### Test Execution Timing
The enhanced logging includes timing information for performance monitoring:

```bash
# Monitor slow tests
./run-tests.sh --verbose | grep "completed in"

# Track formatting performance
./run-tests.sh --mode=core --verbose | grep "formatting.*ms"
```

### Resource Usage Patterns
- **Memory**: Monitor for memory leaks in long-running tests
- **CPU**: Watch for high CPU usage during WASM operations
- **Network**: Track WebSocket connection establishment times

### Performance Benchmarks
- **Basic tests**: Should complete in < 30 seconds
- **Keyboard shortcuts**: Should complete in < 60 seconds
- **Menu system**: Should complete in < 45 seconds
- **Security tests**: Should complete in < 90 seconds

## Continuous Integration

### GitHub Actions Example
```yaml
name: E2E Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: ./run-tests.sh --browser=chromium --mode=core
```

### Recommended CI Configuration
```bash
# For CI environments, use single browser with retries
./run-tests.sh --browser=chromium --mode=core --retries=3

# For full validation in CI
./run-tests.sh --browser=chromium
./run-tests.sh --browser=firefox --mode=core
```

## Test Results and Reports

### HTML Report
```bash
# Open detailed HTML report
open test-results/index.html

# Or serve it locally
npx playwright show-report
```

### Screenshots and Videos
- **Screenshots**: `test-results/screenshots/` (on failure)
- **Videos**: `test-results/videos/` (on failure)
- **Traces**: `test-results/traces/` (for debugging)

### Console Output
The enhanced test script provides:
- **Real-time progress** during test execution
- **Summary statistics** after completion
- **Helpful error messages** for common issues
- **Debugging suggestions** for failures

## Performance Considerations

### Optimizing Test Execution

1. **Use Single Browser for Development**
   ```bash
   ./run-tests.sh --browser=chromium
   ```

2. **Run Specific Test Categories**
   ```bash
   ./run-tests.sh --mode=core  # Faster than full suite
   ```

3. **Reduce Parallelism**
   ```bash
   npx playwright test --workers=1  # Prevents resource conflicts
   ```

4. **Skip Heavy Tests During Development**
   ```bash
   ./run-tests.sh --mode=quick  # Minimal test set
   ```

### Resource Management
- **Memory**: Each browser instance uses ~100-200MB RAM
- **CPU**: Parallel execution can be CPU intensive
- **Disk**: Videos and screenshots can accumulate quickly
- **Network**: WebSocket tests require network connectivity

## Advanced Usage

### Custom Test Runs
```bash
# Run tests with custom grep pattern
npx playwright test --grep="formatting"

# Run tests and generate trace for all tests
npx playwright test --trace=on

# Run tests with specific configuration
npx playwright test --config=custom-playwright.config.js
```

### Environment Variables
```bash
# Set custom base URL
BASE_URL=http://localhost:3000 npx playwright test

# Enable debug logging
DEBUG=pw:api npx playwright test

# Set custom timeout
TIMEOUT=120000 npx playwright test
```

### Test Development
```bash
# Generate new test
npx playwright codegen http://localhost:8080

# Run tests in UI mode (experimental)
npx playwright test --ui

# Update snapshots
npx playwright test --update-snapshots
```

## Test Maintenance

### Regular Updates Needed
1. **Browser versions**: Update Playwright browsers monthly
   ```bash
   npx playwright install
   ```

2. **Mock functions**: Keep WASM mocks in sync with actual functions
   ```bash
   # Review and update mocks in testHelpers.js
   ```

3. **Timeout values**: Adjust based on CI environment performance
   ```bash
   # Update playwright.config.js timeout values
   ```

4. **Retry counts**: Monitor flaky test patterns and adjust
   ```bash
   # Analyze test reports for flaky patterns
   ```

### Health Checks
```bash
# Verify test environment
./run-tests.sh --mode=quick --verbose

# Check browser compatibility
./run-tests.sh --browser=chromium --mode=core
./run-tests.sh --browser=firefox --mode=core  
./run-tests.sh --browser=webkit --mode=core

# Validate mock functions
./run-tests.sh --mode=core --verbose | grep "WASM"
```

### Maintenance Schedule
- **Daily**: Run quick tests during development
- **Weekly**: Full test suite on all browsers
- **Monthly**: Update browser versions and dependencies
- **Quarterly**: Review and update test timeouts and retry counts

## Best Practices

### For Development
1. **Start with Chromium** for fastest feedback
2. **Use `--mode=quick`** for rapid iteration
3. **Use `--headed --debug`** when writing new tests
4. **Focus on one test category** at a time
5. **Monitor enhanced logs** for debugging insights

### For Testing
1. **Test on multiple browsers** before deployment
2. **Use retries** for flaky tests in CI
3. **Keep tests isolated** and independent
4. **Clean up resources** after test runs
5. **Leverage enhanced logging** for debugging

### For CI/CD
1. **Use single browser** for faster execution
2. **Cache Playwright browsers** for performance
3. **Run tests in parallel** when resources allow
4. **Store test artifacts** for debugging
5. **Monitor test performance** with logging

### For Debugging
1. **Use enhanced logging** to identify issues quickly
2. **Check browser-specific behavior** with appropriate key combinations
3. **Verify WASM mock functionality** before debugging complex issues
4. **Use fallback tracking** to understand test behavior
5. **Leverage performance monitoring** to identify bottlenecks

## Conclusion

This comprehensive guide should help you effectively run, debug, and maintain the test suite. The enhanced logging system provides unprecedented visibility into test execution, making debugging much more efficient. The browser-specific handling ensures tests work reliably across different platforms, while the WASM mocking system provides fast, reliable test execution.

For questions or issues not covered here, check the test output logs and browser developer tools for additional debugging information. The enhanced logging will typically provide the most direct path to identifying and resolving issues.

## Quick Reference

### Most Common Commands
```bash
# Quick development check
./run-tests.sh --mode=quick --browser=chromium

# Debug specific failing test
./run-tests.sh --mode=keyboard --headed --debug --browser=chromium

# Full test suite for deployment
./run-tests.sh --browser=chromium

# Troubleshoot with enhanced logging
./run-tests.sh --verbose --browser=chromium | grep "ERROR\|FAIL"
```

### Emergency Debugging
```bash
# When everything fails, start here:
./run-tests.sh --mode=quick --headed --debug --verbose --browser=chromium
```
