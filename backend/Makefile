.PHONY: help install dev test lint format clean build

help:
	@echo "Hybrid CI/CD Backend - Development Commands"
	@echo ""
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@echo "  help        - Show this help message"
	@echo "  install     - Install dependencies"
	@echo "  dev         - Run development server"
	@echo "  test        - Run all tests"
	@echo "  test-unit   - Run unit tests only"
	@echo "  test-cov    - Run tests with coverage report"
	@echo "  lint        - Run code linters"
	@echo "  format      - Format code with Black"
	@echo "  clean       - Remove build artifacts and cache"
	@echo "  build       - Build Lambda deployment package"
	@echo "  dynamodb-local - Start local DynamoDB"

install:
	@echo "Installing dependencies..."
	pip install -r requirements-dev.txt

dev:
	@echo "Starting development server..."
	uvicorn src.main:app --reload --host 0.0.0.0 --port 8000

test:
	@echo "Running all tests..."
	pytest -v --tb=short

test-unit:
	@echo "Running unit tests..."
	pytest tests/unit -v --tb=short

test-integration:
	@echo "Running integration tests..."
	pytest tests/integration -v --tb=short

test-cov:
	@echo "Running tests with coverage..."
	pytest --cov=src --cov-report=html --cov-report=term-missing

lint:
	@echo "Running linters..."
	ruff check src tests
	mypy src --ignore-missing-imports

format:
	@echo "Formatting code..."
	black src tests

clean:
	@echo "Cleaning up..."
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete
	rm -rf .pytest_cache
	rm -rf htmlcov
	rm -rf dist
	rm -rf build
	rm -rf *.egg-info

build:
	@echo "Building Lambda deployment package..."
	mkdir -p build
	pip install -r requirements.txt -t build/
	cd build && zip -r ../lambda_function.zip . > /dev/null
	zip lambda_function.zip -r src > /dev/null
	mv lambda_function.zip ../terraform/
	@echo "Lambda package created: terraform/lambda_function.zip"

dynamodb-local:
	@echo "Starting local DynamoDB..."
	docker run -p 8000:8000 amazon/dynamodb-local

.DEFAULT_GOAL := help
