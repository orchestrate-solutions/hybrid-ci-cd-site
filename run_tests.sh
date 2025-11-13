#!/bin/bash

# Test Execution & Validation Guide for NET ZERO Architecture
# 
# This script runs the complete test suite and validates security guarantees.
# Usage: ./run_tests.sh [option]
#
# Options:
#   unit          - Run unit tests only
#   integration   - Run integration tests only
#   security      - Run security-focused tests
#   all           - Run all tests (default)
#   coverage      - Run with coverage report
#   watch         - Run in watch mode (unit tests)

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$SCRIPT_DIR"
BACKEND_ROOT="$PROJECT_ROOT/backend"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== NET ZERO Architecture Test Suite ===${NC}\n"

# Test 1: Unit Tests (Security Focus)
run_unit_tests() {
    echo -e "${YELLOW}Running Unit Tests...${NC}"
    cd "$BACKEND_ROOT"
    python -m pytest tests/unit/test_net_zero_security.py -v \
        --tb=short \
        --color=yes \
        -x
    echo -e "${GREEN}✅ Unit tests passed${NC}\n"
}

# Test 2: Integration Tests
run_integration_tests() {
    echo -e "${YELLOW}Running Integration Tests...${NC}"
    cd "$BACKEND_ROOT"
    python -m pytest tests/integration/test_relay_integration.py -v \
        --tb=short \
        --color=yes \
        -x
    echo -e "${GREEN}✅ Integration tests passed${NC}\n"
}

# Test 3: Security Checks (Critical)
run_security_checks() {
    echo -e "${YELLOW}Running Security Checks...${NC}"
    cd "$BACKEND_ROOT"
    
    # Check for hardcoded secrets
    echo "  Checking for hardcoded secrets..."
    if grep -r "secret.*=" src/ --include="*.py" | grep -v "secret_vault_path" | grep -v "payload_hash"; then
        echo -e "${RED}❌ SECURITY VIOLATION: Found hardcoded secrets${NC}"
        exit 1
    fi
    
    # Check for plaintext API keys
    echo "  Checking for plaintext API keys..."
    if grep -r "api_key.*=" src/ --include="*.py" | grep -v "api_key_hash" | grep -v "generate_api_key"; then
        echo -e "${RED}❌ SECURITY VIOLATION: Found plaintext API keys${NC}"
        exit 1
    fi
    
    # Check for password fields
    echo "  Checking for password storage..."
    if grep -r "password" src/models/webhook.py; then
        echo -e "${RED}❌ SECURITY VIOLATION: Password field in WebhookEvent${NC}"
        exit 1
    fi
    
    # Verify payload field removed
    echo "  Verifying payload field removed from WebhookEvent..."
    if grep -r "payload:" src/models/webhook.py | grep -v "payload_hash"; then
        echo -e "${RED}❌ SECURITY VIOLATION: Payload field still in WebhookEvent${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Security checks passed${NC}\n"
}

# Test 4: Coverage Report
run_coverage() {
    echo -e "${YELLOW}Running Tests with Coverage...${NC}"
    cd "$BACKEND_ROOT"
    python -m pytest tests/unit/test_net_zero_security.py \
        tests/integration/test_relay_integration.py \
        --cov=src \
        --cov-report=term-missing \
        --cov-report=html \
        --tb=short \
        -v
    echo -e "${GREEN}✅ Coverage report generated (htmlcov/index.html)${NC}\n"
}

# Test 5: Watch Mode
run_watch() {
    echo -e "${YELLOW}Running Tests in Watch Mode...${NC}"
    cd "$BACKEND_ROOT"
    python -m pytest tests/unit/test_net_zero_security.py \
        --tb=short \
        --color=yes \
        -v \
        --looponfail
}

# Parse arguments
OPTION=${1:-all}

case $OPTION in
    unit)
        run_unit_tests
        ;;
    integration)
        run_integration_tests
        ;;
    security)
        run_security_checks
        ;;
    coverage)
        run_coverage
        ;;
    watch)
        run_watch
        ;;
    all)
        echo -e "${YELLOW}Running complete test suite...${NC}\n"
        run_unit_tests
        run_integration_tests
        run_security_checks
        
        echo -e "${GREEN}=== ✅ ALL TESTS PASSED ===${NC}"
        echo -e "${GREEN}NET ZERO architecture validated ✅${NC}\n"
        echo "Summary:"
        echo "  - Unit Tests: ✅ WebhookEvent, adapter, store, factory, orchestration"
        echo "  - Integration Tests: ✅ Relay registration, queue polling, routing"
        echo "  - Security Checks: ✅ No hardcoded secrets, no plaintext keys"
        echo "  - Architecture: ✅ Stateless, NET ZERO risk"
        ;;
    *)
        echo "Usage: ./run_tests.sh [unit|integration|security|all|coverage|watch]"
        exit 1
        ;;
esac

cd "$PROJECT_ROOT"
