.PHONY: help install dev dev-backend dev-frontend build start docker-build docker-run clean stop

help:
	@echo "API Flow - Available targets:"
	@echo "  install        Install dependencies (root + backend)"
	@echo "  dev           Start backend (background) + frontend dev server"
	@echo "  dev-backend   Start backend dev server only (port 3001)"
	@echo "  dev-frontend  Start frontend dev server only (port 5173)"
	@echo "  build         Build frontend + backend for production"
	@echo "  start         Start production server (requires prior build)"
	@echo "  docker-build  Build Docker image"
	@echo "  docker-run    Run Docker container (ports 8080->80, 3001->3001)"
	@echo "  clean         Remove build artifacts and data"
	@echo "  stop          Stop running dev servers"

install:
	cd backend && npm install
	npm install

dev:
	@echo "Starting backend dev server on port 3001..."
	@cd backend && npm run dev &
	@echo "Starting frontend dev server on port 5173..."
	@npm run dev

dev-backend:
	cd backend && npm run dev

dev-frontend:
	npm run dev

build:
	cd backend && npm run build
	npm run build

start:
	cd backend && npm run start

docker-build:
	docker build -t api-flow .

docker-run:
	docker run --rm -p 8080:80 -p 3001:3001 -v $$(pwd)/data:/data api-flow

clean:
	rm -rf dist backend/dist backend/backend/data

stop:
	@pkill -f "tsx watch src/server.ts" 2>/dev/null || true
	@pkill -f "vite" 2>/dev/null || true
	@echo "Stopped dev servers"
