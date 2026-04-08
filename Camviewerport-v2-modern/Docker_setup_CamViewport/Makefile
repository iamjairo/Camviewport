SHELL := /bin/bash
.DEFAULT_GOAL := help

help:  ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

install:  ## Install all dependencies
	@echo "Installing backend dependencies..."
	cd backend && npm install
	@echo "Installing Electron client dependencies..."
	cd electron-client && npm install
	@echo "All dependencies installed successfully!"

dev-backend:  ## Start backend server
	cd backend && npm run dev

dev-electron:  ## Start Electron client
	cd electron-client && npm start

dev:  ## Start both backend and Electron client
	@echo "Starting development environment..."
	@$(MAKE) -j2 dev-backend dev-electron

build-backend:  ## Build backend for production
	cd backend && npm run build

build-electron:  ## Build Electron client
	cd electron-client && npm run build

build:  ## Build all components
	@$(MAKE) build-backend
	@$(MAKE) build-electron

docker-build:  ## Build Docker image
	docker build -t cctv-monitor:latest -f Dockerfile .

docker-run:  ## Run Docker container
	docker run -p 3000:3000 -p 8554:8554 cctv-monitor:latest

clean:  ## Remove build artifacts and dependencies
	rm -rf backend/node_modules backend/dist
	rm -rf electron-client/node_modules electron-client/dist
	@echo "Cleanup complete!"

test:  ## Run tests
	cd backend && npm test

lint:  ## Run linter
	cd backend && npm run lint
	cd electron-client && npm run lint

format:  ## Format code
	cd backend && npm run format
	cd electron-client && npm run format