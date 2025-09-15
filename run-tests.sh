#!/bin/bash
# run-tests.sh - Enhanced test runner with debugging

set -e

echo "🚀 Starting Enhanced Test Suite"
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if dev server is running
check_server() {
    print_status "Checking if development server is running..."
    if curl -s http://localhost:8080 > /dev/null; then
        print_success "Development server is running"
        return 0
    else
        print_warning "Development server not detected"
        return 1
    fi
}

# Start dev server if needed
start_server() {
    if ! check_server; then
        print_status "Starting development server..."
        npm run dev > server.log 2>&1 &
        SERVER_PID=$!
        echo $SERVER_PID > server.pid
        
        # Wait for server to be ready
        for i in {1..30}; do
            if check_server; then
                print_success "Development server started (PID: $SERVER_PID)"
                break
            fi
            print_status "Waiting for server... ($i/30)"
            sleep 2
        done
        
        if ! check_server; then
            print_error "Failed to start development server"
            exit 1
        fi
    fi
}

# Stop dev server
stop_server() {
    if [ -f server.pid ]; then
        SERVER_PID=$(cat server.pid)
        print_status "Stopping development server (PID: $SERVER_PID)..."
        kill $SERVER_PID 2>/dev/null || true
        rm -f server.pid
        print_success "Development server stopped"
    fi
}

# Cleanup function
cleanup() {
    print_status "Cleaning up..."
    stop_server
    rm -f server.log
}

# Set trap for cleanup
trap cleanup EXIT

# Parse command line arguments
RUN_MODE="all"
BROWSER="all"
VERBOSE=false
DEBUG=false
HEADED=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --browser=*)
            BROWSER="${1#*=}"
            shift
            ;;
        --mode=*)
            RUN_MODE="${1#*=}"
            shift
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        --debug)
            DEBUG=true
            VERBOSE=true
            shift
            ;;
        --headed)
            HEADED=true
            shift
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --browser=BROWSER    Run tests on specific browser (chromium|firefox|webkit|mobile-chrome|all)"
            echo "  --mode=MODE          Test mode (all|core|security|collaboration|quick)"
            echo "  --verbose            Enable verbose output"
            echo "  --debug              Enable debug mode with traces"
            echo "  --headed             Run tests in headed mode (visible browser)"
            echo "  --help               Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0                                    # Run all tests"
            echo "  $0 --browser=chromium --mode=core    # Run core tests on Chromium only"
            echo "  $0 --debug --headed                  # Debug mode with visible browser"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

print_status "Configuration:"
echo "  Browser: $BROWSER"
echo "  Mode: $RUN_MODE"
echo "  Verbose: $VERBOSE"
echo "  Debug: $DEBUG"
echo "  Headed: $HEADED"
echo ""

# Start server
start_server

# Prepare test directory
print_status "Preparing test environment..."
mkdir -p test-results/screenshots
mkdir -p test-results/videos
mkdir -p test-results/traces

# Build test command
TEST_CMD="npx playwright test"

# Add browser selection
case $BROWSER in
    "chromium"|"firefox"|"webkit"|"mobile-chrome")
        TEST_CMD="$TEST_CMD --project=$BROWSER"
        ;;
    "all")
        # Use all browsers
        ;;
    *)
        print_error "Invalid browser: $BROWSER"
        exit 1
        ;;
esac

# Add test selection based on mode
case $RUN_MODE in
    "core")
        TEST_CMD="$TEST_CMD tests/e2e/core/"
        ;;
    "security")
        TEST_CMD="$TEST_CMD tests/e2e/security/"
        ;;
    "collaboration")
        TEST_CMD="$TEST_CMD tests/e2e/collaboration/"
        ;;
    "quick")
        # Run only basic tests for quick validation
        TEST_CMD="$TEST_CMD tests/e2e/core/basic.spec.js"
        ;;
    "keyboard")
        # Run only keyboard shortcut tests
        TEST_CMD="$TEST_CMD tests/e2e/core/keyboard-shortcuts.spec.js"
        ;;
    "all")
        # Run all tests
        ;;
    *)
        print_error "Invalid mode: $RUN_MODE"
        exit 1
        ;;
esac

# Add debug options
if [ "$HEADED" = true ]; then
    TEST_CMD="$TEST_CMD --headed"
fi

if [ "$DEBUG" = true ]; then
    TEST_CMD="$TEST_CMD --debug"
fi

if [ "$VERBOSE" = true ]; then
    TEST_CMD="$TEST_CMD --reporter=list"
else
    TEST_CMD="$TEST_CMD --reporter=line"
fi

# Additional flags for more reliable testing
TEST_CMD="$TEST_CMD --timeout=60000"
TEST_CMD="$TEST_CMD --retries=2"

print_status "Running tests with command:"
echo "  $TEST_CMD"
echo ""

# Run tests
print_status "Starting test execution..."
START_TIME=$(date +%s)

if eval $TEST_CMD; then
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))
    print_success "Tests completed successfully in ${DURATION}s"
    EXIT_CODE=0
else
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))
    print_error "Tests failed after ${DURATION}s"
    EXIT_CODE=1
fi

# Generate summary report
print_status "Generating test summary..."

if [ -f "test-results/results.json" ]; then
    node -e "
    const fs = require('fs');
    const results = JSON.parse(fs.readFileSync('test-results/results.json', 'utf8'));
    const stats = results.stats || {};
    
    console.log('');
    console.log('📊 Test Summary Report');
    console.log('====================');
    console.log('Total Tests:', stats.total || 'N/A');
    console.log('Passed:', stats.passed || 'N/A');
    console.log('Failed:', stats.failed || 'N/A');
    console.log('Skipped:', stats.skipped || 'N/A');
    console.log('Duration:', (stats.duration || 0) + 'ms');
    console.log('');
    
    if (stats.failed && stats.failed > 0) {
        console.log('❌ Failed Tests:');
        (results.suites || []).forEach(suite => {
            (suite.specs || []).forEach(spec => {
                (spec.tests || []).forEach(test => {
                    if (test.status === 'failed') {
                        console.log('  -', test.title);
                    }
                });
            });
        });
        console.log('');
    }
    " 2>/dev/null || print_warning "Could not parse test results"
fi

# Show helpful information
print_status "Additional Information:"
echo "  HTML Report: open test-results/index.html"
echo "  Screenshots: test-results/screenshots/"
echo "  Videos: test-results/videos/"
echo "  Server Log: server.log"

if [ $EXIT_CODE -ne 0 ]; then
    echo ""
    print_warning "Common issues and solutions:"
    echo "  1. WASM functions not loading: Check browser console for errors"
    echo "  2. Timeout errors: Try --browser=chromium for better performance"
    echo "  3. Keyboard shortcuts failing: Some may not work in headless mode"
    echo "  4. Flaky tests: Run with --retries=3 for more reliability"
    echo "  5. WebSocket issues: Check if y-websocket server is running"
    echo ""
    echo "Debug commands:"
    echo "  $0 --debug --headed --browser=chromium --mode=quick"
    echo "  $0 --browser=chromium --mode=keyboard"
fi

exit $EXIT_CODE
