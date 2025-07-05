
SHELL := /bin/bash
PORT=8080
WS_PORT=1234

default: help

help:
	@echo ""
	@echo "Available commands:"
	@echo "  make install    - Install all npm dependencies"
	@echo "  make build      - Build frontend using Vite"
	@echo "  make serve      - Start Vite dev server at http://localhost:$(PORT)"
	@echo "  make ws         - Start Yjs websocket server at ws://localhost:$(WS_PORT)"
	@echo "  make run        - Start Go backend server"
	@echo "  make restart    - Kill anything stuck on ports $(PORT) or $(WS_PORT)"
	@echo "  make all        - Install, build, restart, then run both servers"
	@echo "  make clean      - Remove node_modules and Vite build output"
	@echo "  make rebuild    - Clean, reinstall, and rebuild everything"
	@echo "  make start      - Restart ports and run all services"
	@echo "  make stop       - Kill anything on ports 8080 and 1234"
	@echo ""

install:
	npm install --legacy-peer-deps

build:
	@echo "Building with Vite..."
	npx vite build

serve:
	@echo "Starting Vite dev server at http://localhost:$(PORT)"
	npx vite --port $(PORT)

ws:
	@echo "Starting y-websocket server on ws://localhost:$(WS_PORT)"
	npx y-websocket --port $(WS_PORT)

run:
	@echo "Starting Go backend at http://localhost:$(PORT)"
	go run main.go

restart:
	@echo "Killing anything on ports $(PORT) and $(WS_PORT)..."
	@-fuser -k $(PORT)/tcp 2>/dev/null || true
	@-fuser -k $(WS_PORT)/tcp 2>/dev/null || true

clean:
	@echo "Cleaning up..."
	rm -rf node_modules package-lock.json dist

rebuild: clean install build

all: install build restart
	@echo "Starting services..."
	@make -j2 ws run

stop:
	@echo "Killing anything on ports 8080 and 1234..."
	@-fuser -k 8080/tcp 2>/dev/null || true
	@-fuser -k 1234/tcp 2>/dev/null || true

start:
	@echo "Restarting ports and running all services..."
	@make restart
	@make -j2 ws serve
