
SHELL := /bin/bash
BACKEND_PORT=3000  # for Rust or Go backend
PORT=8080 # for frontend
WS_PORT=1234  # for Yjs websocket server

default: help

help:
	@echo ""
	@echo "Available commands:"
	@echo "  make install     - Install all npm dependencies"
	@echo "  make build       - Build frontend using Vite"
	@echo "  make serve       - Start Vite dev server at http://localhost:$(PORT)"
	@echo "  make ws          - Start Yjs websocket server at ws://localhost:$(WS_PORT)"
	@echo "  make run         - Start Rust backend server (default)"
	@echo "  make run-go      - Start Go backend server"
	@echo "  make run-rust    - Start Rust backend server"
	@echo "  make restart     - Kill anything stuck on ports $(PORT) or $(WS_PORT)"
	@echo "  make all         - Install, build, restart, then run all services"
	@echo "  make start       - Restart ports and run websocket + frontend"
	@echo "  make stop        - Kill anything on ports $(PORT) and $(WS_PORT)"
	@echo "  make open-room   - Open a browser tab with a new UUID room"
	@echo "  make clean       - Remove node_modules and Vite build output"
	@echo "  make rebuild     - Clean, reinstall, and rebuild everything"
	@echo ""

install:
	npm install --legacy-peer-deps

build:
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
	go run main.go

restart:
	@echo "Killing anything on ports $(PORT),$(BACKEND_PORT)and $(WS_PORT)..."
	@-fuser -k $(PORT)/tcp 2>/dev/null || true
	@-fuser -k $(WS_PORT)/tcp 2>/dev/null || true
	@-fuser -k $(BACKEND_PORT)/tcp 2>/dev/null || true

clean:
	@echo "Cleaning up..."`
	rm -rf node_modules package-lock.json dist

rebuild: clean install build

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

dev-all:
	@echo "Running full dev stack (ws, rust, vite, and room)..."
	@make restart
	@sleep 2
	@make -j2 ws run &
	@sleep 2
	@make serve &
	@sleep 3
	@make open-room

