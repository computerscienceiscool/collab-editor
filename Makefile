
SHELL := /bin/bash
BACKEND_PORT=3000  # for Rust or Go backend
PORT=8080
WS_PORT=1234  # for Yjs websocket server
# Define the branch too use the branch already in use by the machine
BRANCH := $(shell git rev-parse --abbrev-ref HEAD)

.PHONY: help install build serve ws run run-rust run-go restart clean all stop start open-room wasm wasm-clean wasm-rebuild dev-all rebuild commit test test-all test-quick

default: help

help:
	@echo ""
	@echo "Available commands:"
	@echo "  make install     - Install all npm dependencies"
	@echo "  make wasm        - Build Rust WASM module"
	@echo "  make wasm-clean  - Clean WASM build artifacts"
	@echo "  make wasm-rebuild - Clean, rebuild WASM module"
	@echo "  make dev-all     - Run full dev stack (ws, rust, vite, and room)"
	@echo "  make build       - Build frontend using Vite(including WASM)"
	@echo "  make serve       - Start Vite dev server at http://localhost:$(PORT)"
	@echo "  make ws          - Start Yjs websocket server at ws://localhost:$(WS_PORT)"
	@echo "  make run         - Start Rust backend server (default)"
	@echo "  make run-go      - Start Go backend server"
	@echo "  make run-rust    - Start Rust backend server"
	@echo "  make restart     - Kill anything stuck on ports $(PORT), $(WS_PORT), and $(BACKEND_PORT)" 
	@echo "  make all         - Install, build, restart, then run all services"
	@echo "  make start       - Restart ports and run websocket + frontend"
	@echo "  make stop        - Kill anything on ports $(PORT) and $(WS_PORT)"
	@echo "  make open-room   - Open a browser tab with a new UUID room"
	@echo "  make clean       - Remove node_modules and Vite build output"
	@echo "  make rebuild     - Clean, reinstall, and rebuild everything"
	@echo "  make commit      - Commit changes with grok commit message and push to origin/$(BRANCH)"
	@echo ""

install:
	npm install --legacy-peer-deps

build: wasm
	@echo "Building with Vite..."
	npx vite build

serve:
	@echo "Ensuring frontend port $(PORT) is free..."
	@-fuser -k $(PORT)/tcp 2>/dev/null || true
	@echo "Starting Vite dev server at http://localhost:$(PORT)"
	npx vite --port $(PORT) --strictPort 

ws:
	@echo "Starting y-websocket server on ws://localhost:$(WS_PORT)"
	npx y-websocket --port $(WS_PORT)

run:
	@echo "Starting Rust backend at http://localhost:$(BACKEND_PORT)"
	cd rust-server && PORT=$(BACKEND_PORT) cargo run

run-rust:
	@echo "Running Rust backend..."
	cd rust-server && PORT=$(BACKEND_PORT) cargo run

run-go:
	@echo "Running Go backend..."
	cd go-server && PORT=$(BACKEND_PORT) go run main.go
#	go run main.go

restart:
	@echo "Killing anything on ports $(PORT),$(BACKEND_PORT)and $(WS_PORT)..."
	@-fuser -k $(PORT)/tcp 2>/dev/null || true
	@-fuser -k $(WS_PORT)/tcp 2>/dev/null || true
	@-fuser -k $(BACKEND_PORT)/tcp 2>/dev/null || true
	sleep 2

clean:
	@echo "Cleaning up..."
	rm -rf node_modules package-lock.json dist


all: install build restart
	@echo "Starting services..."
	@make -j2 ws run

stop:
	@echo "Killing anything on ports $(PORT),$(WS_PORT)and $(BACKEND_PORT)..."
	@-fuser -k $(PORT)/tcp 2>/dev/null || true
	@-fuser -k $(WS_PORT)/tcp 2>/dev/null || true
	@-fuser -k $(BACKEND_PORT)/tcp 2>/dev/null || true

start:
	@echo "Restarting ports and running websocket + frontend..."
	@make restart
	@make -j2 ws serve

open-room:
	@echo "Generating UUID room name..."
	@uuid=$$(uuidgen); \
	echo "Opening: http://localhost:$(PORT)/?room=$$uuid"; \
	xdg-open "http://localhost:$(PORT)/?room=$$uuid" >/dev/null 2>&1 || open "http://localhost:$(PORT)/?room=$$uuid"

wasm:
	@echo "Building WASM module..."
	cd rust-wasm && wasm-pack build --target web --out-dir pkg

wasm-clean:
	@echo "Cleaning WASM build artifacts..."
	rm -rf rust-wasm/pkg

wasm-rebuild: wasm-clean wasm
	@echo "WASM module rebuilt successfully"


rebuild: clean wasm install build


dev-all:
	@echo "Running full dev stack (ws, rust, vite, and room)..."
	@make stop 
	@sleep 2
	@make -j2 ws run &
	@sleep 2
	@make serve &
	@sleep 3
	@make open-room

# git add .
#  grok commit | git commit -F -
# git push
commit: 
	# Add any files tracked files that have been modified
	git add -u
	# fail if any files are untracked
#	test "$$(git status --porcelain|grep '??' |wc -l)" -le 0
	grok commit | git commit -F-
	git push origin $(BRANCH)


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
