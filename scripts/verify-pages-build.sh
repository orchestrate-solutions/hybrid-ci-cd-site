#!/bin/bash

# GitHub Pages Build Verification Script
# Validates that all necessary files and configurations are in place for GitHub Pages deployment

set -e

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Initialize counters
PASSED=0
FAILED=0
WARNINGS=0

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "GitHub Pages Setup Verification"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check 1: Export directory exists
echo -e "${BLUE}ℹ️  1. Checking export directory...${NC}"
if [ -d "out" ]; then
    FILE_COUNT=$(find out -type f | wc -l)
    echo -e "${GREEN}✅ Export directory exists${NC}"
    echo -e "   ${BLUE}→${NC} Total files: $FILE_COUNT"
    ((PASSED++))
else
    echo -e "${RED}❌ Export directory missing${NC}"
    ((FAILED++))
fi

# Check 2: .nojekyll exists
echo -e "${BLUE}ℹ️  2. Checking GitHub Pages config files...${NC}"
if [ -f ".nojekyll" ]; then
    echo -e "${GREEN}✅ .nojekyll present${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ .nojekyll missing${NC}"
    ((FAILED++))
fi

# Check 3: next.config.ts configuration
echo -e "${BLUE}ℹ️  3. Checking next.config.ts...${NC}"
if [ -f "next.config.ts" ]; then
    echo -e "${GREEN}✅ next.config.ts exists${NC}"
    if grep -q "output.*export" next.config.ts; then
        echo -e "${GREEN}✅${NC}   → export mode enabled"
        ((PASSED++))
    else
        echo -e "${RED}❌${NC}   → export mode not configured"
        ((FAILED++))
    fi
    if grep -q "trailingSlash.*true" next.config.ts; then
        echo -e "${GREEN}✅${NC}   → trailing slash enabled"
        ((PASSED++))
    else
        echo -e "${YELLOW}⚠️ ${NC}   → trailing slash not enabled"
        ((WARNINGS++))
    fi
else
    echo -e "${RED}❌ next.config.ts missing${NC}"
    ((FAILED++))
fi

# Check 4: GitHub Actions workflows
echo -e "${BLUE}ℹ️  4. Checking GitHub Actions workflows...${NC}"
if [ -f ".github/workflows/deploy-pages.yml" ]; then
    echo -e "${GREEN}✅ deploy-pages.yml exists${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ deploy-pages.yml missing${NC}"
    ((FAILED++))
fi

if [ -f ".github/workflows/test-deploy.yml" ]; then
    if grep -q "pages.*write" .github/workflows/test-deploy.yml; then
        echo -e "${GREEN}✅ test-deploy.yml has pages permissions${NC}"
        ((PASSED++))
    else
        echo -e "${YELLOW}⚠️ ${NC}   → pages permissions not configured"
        ((WARNINGS++))
    fi
else
    echo -e "${YELLOW}⚠️ ${NC}   → test-deploy.yml not found"
    ((WARNINGS++))
fi

# Check 5: npm scripts
echo -e "${BLUE}ℹ️  5. Checking npm scripts...${NC}"
if grep -q '"build:pages"' package.json; then
    echo -e "${GREEN}✅ npm run build:pages available${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ npm run build:pages not configured${NC}"
    ((FAILED++))
fi

if grep -q '"verify:pages"' package.json; then
    echo -e "${GREEN}✅ npm run verify:pages available${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ npm run verify:pages not configured${NC}"
    ((FAILED++))
fi

if grep -q '"test:pages"' package.json; then
    echo -e "${GREEN}✅ npm run test:pages available${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠️ ${NC}   → npm run test:pages not configured"
    ((WARNINGS++))
fi

# Check 6: Export contents
echo -e "${BLUE}ℹ️  6. Checking export contents...${NC}"
if [ -d "out" ]; then
    HTML_COUNT=$(find out -name "*.html" -type f | wc -l)
    if [ "$HTML_COUNT" -gt 0 ]; then
        echo -e "${GREEN}✅ HTML files present ($HTML_COUNT)${NC}"
        ((PASSED++))
    else
        echo -e "${RED}❌ No HTML files found${NC}"
        ((FAILED++))
    fi
    
    JS_COUNT=$(find out -name "*.js" -type f | wc -l)
    if [ "$JS_COUNT" -gt 0 ]; then
        echo -e "${GREEN}✅ JavaScript files present ($JS_COUNT)${NC}"
        ((PASSED++))
    else
        echo -e "${YELLOW}⚠️ ${NC}   → No JavaScript files found"
        ((WARNINGS++))
    fi
    
    if [ ! -d "out/.next" ]; then
        echo -e "${GREEN}✅ .next not in export${NC}"
        ((PASSED++))
    else
        echo -e "${RED}❌ .next directory should not be in export${NC}"
        ((FAILED++))
    fi
    
    if [ ! -d "out/node_modules" ]; then
        echo -e "${GREEN}✅ node_modules not in export${NC}"
        ((PASSED++))
    else
        echo -e "${RED}❌ node_modules directory should not be in export${NC}"
        ((FAILED++))
    fi
fi

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ Passed: $PASSED${NC}"
echo -e "${RED}❌ Failed: $FAILED${NC}"
echo -e "${YELLOW}⚠️  Warnings: $WARNINGS${NC}"
echo ""

if [ "$FAILED" -eq 0 ]; then
    echo -e "${GREEN}ℹ️  ✅ VERIFICATION PASSED${NC}"
    echo ""
    echo -e "${BLUE}ℹ️  Next steps to deploy:${NC}"
    echo "  1. Push to main branch: git push origin main"
    echo "  2. Go to Settings → Pages"
    echo "  3. Set Source to 'GitHub Actions'"
    echo "  4. Workflow will deploy automatically on next push"
    echo ""
    exit 0
else
    echo -e "${RED}ℹ️  ✅ VERIFICATION FAILED${NC}"
    echo ""
    echo -e "${YELLOW}Please fix the issues above before deploying.${NC}"
    echo ""
    exit 1
fi
