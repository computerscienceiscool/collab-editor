AWARENESS_PORT=1235  # for awareness WebSocket
SHELL := /bin/bash
BACKEND_PORT=3000  # for Rust or Go backend
PORT=8080
WS_PORT=1234  # for sync websocket server
# Define the branch too use the branch already in use by the machine
BRANCH := $(shell git rev-parse --abbrev-ref HEAD)
export TAG = 0.$(shell date +%Y.%m.%d.%H%M)

.PHONY: help install build serve ws run run-rust run-go restart clean all stop start open-room wasm wasm-clean wasm-rebuild wasm-all grokker-wasm grokker-wasm-prod diff-wasm diff-wasm-clean diff-wasm-rebuild clean-wasm rebuild-wasm test-wasm dev-all dev-all-wasm commit test test-all test-quick

default: help

help:
	@echo ""
	@echo "Available commands:"
	@echo "  make install     - Install all npm dependencies"
	@echo ""
	@echo "WASM Commands:"
	@echo "  make wasm        - Build Rust WASM module"
	@echo "  make grokker-wasm - Build Grokker WASM module"
	@echo "  make diff-wasm   - Build Diff WASM module"
	@echo "  make wasm-all    - Build all WASM modules"
	@echo "  make test-wasm   - Test all WASM modules"
	@echo "  make clean-wasm  - Clean all WASM builds"
	@echo "  make rebuild-wasm - Rebuild all WASM modules from scratch"
	@echo ""
	@echo "Build Commands:"
	@echo "  make build       - Build frontend using Vite (including WASM)"
	@echo "  make serve       - Start Vite dev server at http://localhost:$(PORT)"
	@echo "  make ws          - Start Automerge sync server at ws://localhost:$(WS_PORT)"
	@echo "  make run         - Start Rust backend server (default)"
	@echo "  make run-go      - Start Go backend server"
	@echo "  make run-rust    - Start Rust backend server"
	@echo ""
	@echo "Development Commands:"
	@echo "  make dev-all     - Run full dev stack (ws, rust, vite, and room)"
	@echo "  make dev-all-wasm - Run full dev stack with all WASM modules"
	@echo "  make restart     - Kill anything stuck on ports $(PORT), $(WS_PORT), and $(BACKEND_PORT)" 
	@echo "  make all         - Install, build, restart, then run all services"
	@echo "  make start       - Restart ports and run websocket + frontend"
	@echo "  make stop        - Kill anything on ports $(PORT) and $(WS_PORT)"
	@echo "  make open-room   - Open a browser tab with a new UUID room"
	@echo ""
	@echo "Maintenance Commands:"
	@echo "  make clean       - Remove node_modules and Vite build output"
	@echo "  make rebuild     - Clean, reinstall, and rebuild everything"
	@echo "  make commit      - Commit changes with grok commit message and push to origin/$(BRANCH)"
	@echo "  make test        - Run basic tests"
	@echo "  make test-all    - Run all tests including e2e"
	@echo "  make test-quick  - Run quick tests only"
	@echo ""

install:
	npm install --legacy-peer-deps

# =============================================================================
# WASM BUILD TARGETS
# =============================================================================

# Build all WASM modules
wasm-all: wasm grokker-wasm diff-wasm
	@echo "All WASM modules built successfully"

# Rust WASM
wasm:
	@echo "Building Rust WASM module..."
	cd rust-wasm && wasm-pack build --target web --out-dir pkg

wasm-clean:
	@echo "Cleaning Rust WASM build artifacts..."
	rm -rf rust-wasm/pkg

wasm-rebuild: wasm-clean wasm
	@echo "Rust WASM module rebuilt successfully"

awareness-ws:
	@echo "Starting awareness WebSocket server on ws://localhost:$(AWARENESS_PORT)"
	npx ws --port $(AWARENESS_PORT)

nvim-helper:
	@echo "Starting Neovim helper..."
	cd nvim/node-helper && node index.js


# Grokker WASM
grokker-wasm:
	@echo "Building Grokker WASM..."
	cd v3/wasm && GOOS=js GOARCH=wasm go build -o ../../dist/grokker.wasm .
	@echo "Copying Go WASM runtime..."
	cp "$(shell go env GOROOT)/misc/wasm/wasm_exec.js" dist/
	@echo "Grokker WASM built successfully"

grokker-wasm-prod:
	@echo "Building production Grokker WASM..."
	cd v3/wasm && GOOS=js GOARCH=wasm go build -ldflags="-s -w" -o ../../dist/grokker.wasm .
	cp "$(shell go env GOROOT)/misc/wasm/wasm_exec.js" dist/
	gzip -9 -k dist/grokker.wasm
	@echo "Production Grokker WASM built and compressed"

# Diff WASM
diff-wasm:
	@echo "Building Diff WASM..."
	@echo "Checking go-diff directory..."
	@if [ ! -d "go-diff" ]; then echo "Creating go-diff directory..."; mkdir -p go-diff; fi
	@if [ ! -f "go-diff/go.mod" ]; then \
		echo "Initializing go module..."; \
		cd go-diff && go mod init go-diff && go get github.com/sergi/go-diff@v1.4.0; \
	fi
	@echo "Building WASM binary..."
	cd go-diff && GOOS=js GOARCH=wasm go build -o ../dist/diff.wasm .
	@echo "Diff WASM built successfully at dist/diff.wasm"

diff-wasm-clean:
	@echo "Cleaning Diff WASM artifacts..."
	rm -f dist/diff.wasm

diff-wasm-rebuild: diff-wasm-clean diff-wasm
	@echo "Diff WASM module rebuilt successfully"

# Test all WASM modules
test-wasm:
	@echo "Testing WASM modules..."
	@echo "1. Testing if dist/grokker.wasm exists:"
	@test -f dist/grokker.wasm && echo "PASS: grokker.wasm found" || echo "FAIL: grokker.wasm missing (run: make grokker-wasm)"
	@echo "2. Testing if dist/diff.wasm exists:"
	@test -f dist/diff.wasm && echo "PASS: diff.wasm found" || echo "FAIL: diff.wasm missing (run: make diff-wasm)"
	@echo "3. Testing if rust-wasm/pkg exists:"
	@test -d rust-wasm/pkg && echo "PASS: rust WASM found" || echo "FAIL: rust WASM missing (run: make wasm)"
	@echo "4. Testing if wasm_exec.js exists:"
	@test -f dist/wasm_exec.js && echo "PASS: wasm_exec.js found" || echo "FAIL: wasm_exec.js missing"

# Clean all WASM builds
clean-wasm:
	@echo "Cleaning all WASM builds..."
	@make wasm-clean
	@make diff-wasm-clean
	rm -f dist/grokker.wasm dist/wasm_exec.js
	@echo "All WASM artifacts cleaned"

# Rebuild everything from scratch
rebuild-wasm: clean-wasm wasm-all
	@echo "All WASM modules rebuilt from scratch"

# =============================================================================
# BUILD TARGETS
# =============================================================================

build: wasm-all
	@echo "Building with Vite..."
	npx vite build

serve:
	@echo "Ensuring frontend port $(PORT) is free..."
	@-fuser -k $(PORT)/tcp 2>/dev/null || true
	@echo "Starting Vite dev server at http://localhost:$(PORT)"
	npx vite --port $(PORT) --strictPort --no-open

ws:
	@echo "Starting Automerge sync server on ws://localhost:$(WS_PORT)"
	PORT=$(WS_PORT) npx @automerge/automerge-repo-sync-server

awareness:
	@echo "Starting awareness server on ws://localhost:$(AWARENESS_PORT)"
	node awareness-server.js
run:
	@echo "Starting Rust backend at http://localhost:$(BACKEND_PORT)"
	cd rust-server && PORT=$(BACKEND_PORT) cargo run

run-rust:
	@echo "Running Rust backend..."
	cd rust-server && PORT=$(BACKEND_PORT) cargo run

run-go:
	@echo "Running Go backend..."
	cd go-server && PORT=$(BACKEND_PORT) go run main.go

# =============================================================================
# DEVELOPMENT TARGETS
# =============================================================================

dev-all:
	@echo "Running full dev stack (ws, awareness, rust, vite, and room)..."
	@make stop 
	@sleep 2
	@make -j3 ws awareness run &
	@sleep 2
	@make serve &
	@sleep 3
	@make open-room

dev-all-wasm: wasm-all
	@echo "Running full dev stack with all WASM modules..."
	@make stop 
	@sleep 2
	@make -j2 ws run &
	@sleep 2
	@make serve &
	@sleep 3
	@make open-room

restart:
	@echo "Killing anything on ports $(PORT),$(BACKEND_PORT)and $(WS_PORT)..."
	@-fuser -k $(PORT)/tcp 2>/dev/null || true
	@-fuser -k $(WS_PORT)/tcp 2>/dev/null || true
	@-fuser -k $(BACKEND_PORT)/tcp 2>/dev/null || true
	sleep 2

stop:
	@echo "Killing anything on ports $(PORT),$(WS_PORT),$(AWARENESS_PORT) and $(BACKEND_PORT)..."
	@-lsof -ti :$(PORT) | xargs -r kill 2>/dev/null || true
	@-lsof -ti :$(WS_PORT) | xargs -r kill 2>/dev/null || true
	@-lsof -ti :$(AWARENESS_PORT) | xargs -r kill 2>/dev/null || true
	@-lsof -ti :$(BACKEND_PORT) | xargs -r kill 2>/dev/null || true

start:
	@echo "Restarting ports and running websocket + frontend..."
	@make restart
	@make -j2 ws serve

all: install build restart
	@echo "Starting services..."
	@make -j2 ws run

open-room:
	@echo "Opening editor (will create new document)..."
	@echo "Opening: http://localhost:$(PORT)/"; \
	xdg-open "http://localhost:$(PORT)/" >/dev/null 2>&1 || open "http://localhost:$(PORT)/"

# =============================================================================
# MAINTENANCE TARGETS
# =============================================================================

clean:
	@echo "Cleaning up..."
	rm -rf node_modules package-lock.json dist

rebuild: clean wasm-all install build

commit: 
	# Add any files tracked files that have been modified
	git add -u
	# fail if any files are untracked
#	test "$$(git status --porcelain|grep '??' |wc -l)" -le 0
	grok commit | git commit -F-
	git push origin $(BRANCH)

# =============================================================================
# TEST TARGETS
# =============================================================================

test:
	npm run test:unit
	cd rust-server && cargo test
	go test ./...

test-all:
	make test
	npm run test:e2e

test-quick:
	cd rust-server && cargo test
	npm run test:unit

# =============================================================================
# DEPLOYMENT TARGETS
# =============================================================================

deploy: build-container push-container restart-container

build-container:
	docker build -f Dockerfile -t promisewrite:$(TAG) .

push-container:
	docker push promisewrite:$(TAG)

export PROMISEWRITE_HOST = europa.d4.t7a.org 
export PROMISEWRITE_PORT = 23425
restart-container:
	docker-compose -H "ssh://$(USER)@$(PROMISEWRITE_HOST)" down
	docker-compose -H "ssh://$(USER)@$(PROMISEWRITE_HOST)" up -d
