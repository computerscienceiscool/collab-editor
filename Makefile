
SHELL := /bin/bash
ESBUILD=node_modules/.bin/esbuild
EDITOR_SRC=frontend/editor.js
BUNDLE_OUT=public/bundle.js
PORT=8080
WS_PORT=1234

default: help

help:
	@echo ""
	@echo "Available commands:"
	@echo "  make install    - Install all npm dependencies"
	@echo "  make build      - Bundle frontend/editor.js into public/bundle.js"
	@echo "  make serve      - Start static dev server at http://localhost:$(PORT)"
	@echo "  make ws         - Start Yjs websocket server at ws://localhost:$(WS_PORT)"
	@echo "  make run        - Start Go backend server"
	@echo "  make restart    - Kill anything stuck on ports $(PORT) or $(WS_PORT)"
	@echo "  make all        - Install, build, restart, then run both servers"
	@echo "  make clean      - Remove node_modules and build output"
	@echo "  make rebuild    - Clean, reinstall, and rebuild everything"
	@echo ""

build:
	@echo "Building bundle..."
	$(ESBUILD) $(EDITOR_SRC) --bundle --outfile=$(BUNDLE_OUT) --log-level=error --log-limit=0

serve:
	@echo "Starting dev server at http://localhost:$(PORT)"
	$(ESBUILD) $(EDITOR_SRC) --bundle --outfile=$(BUNDLE_OUT) --servedir=public --serve=localhost:$(PORT) --log-level=error --log-limit=0

ws:
	@echo "Starting y-websocket server on ws://localhost:$(WS_PORT)"
	npx y-websocket-server --port $(WS_PORT)

run:
	@echo "Starting Go backend at http://localhost:$(PORT)"
	go run main.go

restart:
	@echo "Killing anything on ports $(PORT) and $(WS_PORT)..."
	@-fuser -k $(PORT)/tcp 2>/dev/null || true
	@-fuser -k $(WS_PORT)/tcp 2>/dev/null || true

clean:
	@echo "Cleaning up..."
	rm -rf node_modules package-lock.json $(BUNDLE_OUT)

install:
	npm install --legacy-peer-deps

rebuild: clean install build

all: install build restart
	@echo "Starting services..."
	@make -j2 ws run
