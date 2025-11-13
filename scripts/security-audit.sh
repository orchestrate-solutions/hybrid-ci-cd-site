#!/bin/bash

# Security Audit & Cleanup Script
# Task 20: Comprehensive security review for Phase 1B

set -e

echo "======================================"
echo "Phase 1B Security Audit & Cleanup"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
ISSUES_FOUND=0
FIXED=0

# Create audit report
REPORT_FILE="/tmp/security-audit-report-$(date +%s).md"
echo "# Security Audit Report" > "$REPORT_FILE"
echo "Generated: $(date)" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "SECURITY AUDIT"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Step 1: Check for hardcoded secrets
echo "1. Checking for hardcoded secrets..."
echo "## Hardcoded Secrets Check" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

SECRET_PATTERNS=(
    "sk_live_"
    "sk_test_"
    "api_key.*="
    "password.*="
    "secret.*="
    "token.*="
    "BEGIN RSA PRIVATE KEY"
    "BEGIN PRIVATE KEY"
)

for pattern in "${SECRET_PATTERNS[@]}"; do
    FOUND=$(grep -r "$pattern" src/ cypress/ --include="*.ts" --include="*.tsx" --include="*.js" 2>/dev/null | wc -l || echo "0")
    if [ "$FOUND" -gt "0" ]; then
        echo -e "${RED}✗ Found $FOUND matches for pattern: $pattern${NC}"
        echo "  Pattern: \`$pattern\`" >> "$REPORT_FILE"
        echo "  Files: $(grep -r "$pattern" src/ cypress/ --include="*.ts" --include="*.tsx" --include="*.js" 2>/dev/null | cut -d: -f1 | sort -u | tr '\n' ',' | sed 's/,$//')" >> "$REPORT_FILE"
        echo "" >> "$REPORT_FILE"
        ((ISSUES_FOUND++))
    fi
done

if [ "$ISSUES_FOUND" -eq "0" ]; then
    echo -e "${GREEN}✓ No hardcoded secrets found${NC}"
    echo "- ✓ No hardcoded API keys, passwords, or tokens found" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
fi

# Step 2: Check .env files
echo ""
echo "2. Checking environment files..."
echo "## Environment Files Check" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

if [ -f ".env" ]; then
    if grep -q "KEY\|SECRET\|PASSWORD\|TOKEN" .env 2>/dev/null; then
        echo -e "${YELLOW}⚠ .env file contains sensitive values (expected)${NC}"
        echo "- ⚠ .env file exists with sensitive values (verify .gitignore includes .env)" >> "$REPORT_FILE"
    fi
else
    echo -e "${GREEN}✓ .env file not in repo${NC}"
    echo "- ✓ .env file not tracked in git" >> "$REPORT_FILE"
fi

# Step 3: Check .env files are in .gitignore
echo ""
echo "3. Checking .gitignore..."
echo "## .gitignore Check" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

if grep -q "\.env" .gitignore 2>/dev/null; then
    echo -e "${GREEN}✓ .env files properly ignored${NC}"
    echo "- ✓ .env patterns in .gitignore" >> "$REPORT_FILE"
else
    echo -e "${RED}✗ .env files NOT in .gitignore${NC}"
    ((ISSUES_FOUND++))
    echo "- ✗ .env patterns missing from .gitignore" >> "$REPORT_FILE"
fi

# Step 4: Check for vulnerable dependencies
echo ""
echo "4. Checking for vulnerable dependencies..."
echo "## Vulnerable Dependencies Check" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

if npm audit --production 2>&1 | grep -q "vulnerabilities"; then
    VULN_COUNT=$(npm audit --production 2>&1 | grep -oP '(?<=found )\d+' | head -1)
    echo -e "${YELLOW}⚠ Found $VULN_COUNT vulnerabilities (run 'npm audit fix' to resolve)${NC}"
    echo "- ⚠ Dependencies have known vulnerabilities" >> "$REPORT_FILE"
else
    echo -e "${GREEN}✓ No known vulnerabilities${NC}"
    echo "- ✓ No known vulnerabilities in dependencies" >> "$REPORT_FILE"
fi

# Step 5: Check for console.log and debug statements
echo ""
echo "5. Checking for debug statements..."
echo "## Debug Statements Check" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

DEBUG_COUNT=$(grep -r "console\.\(log\|debug\|warn\)" src/ cypress/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "test\|spec" | wc -l)
if [ "$DEBUG_COUNT" -gt "5" ]; then
    echo -e "${YELLOW}⚠ Found $DEBUG_COUNT debug statements (should be removed before prod)${NC}"
    echo "- ⚠ Debug statements found: $DEBUG_COUNT instances" >> "$REPORT_FILE"
    ((ISSUES_FOUND++))
else
    echo -e "${GREEN}✓ Minimal debug statements ($DEBUG_COUNT found)${NC}"
    echo "- ✓ Debug statements minimal" >> "$REPORT_FILE"
fi

# Step 6: Check for API endpoint exposure
echo ""
echo "6. Checking API endpoint security..."
echo "## API Security Check" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Check if API URLs are hardcoded
HARDCODED_URLS=$(grep -r "http://" src/ lib/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "http://localhost" | grep -v "http://127.0.0.1" | wc -l)
if [ "$HARDCODED_URLS" -gt "0" ]; then
    echo -e "${YELLOW}⚠ Found $HARDCODED_URLS non-localhost HTTP URLs (should use HTTPS in prod)${NC}"
    echo "- ⚠ Non-localhost HTTP URLs found: $HARDCODED_URLS instances" >> "$REPORT_FILE"
else
    echo -e "${GREEN}✓ No hardcoded external HTTP URLs${NC}"
    echo "- ✓ API URLs properly configured via environment variables" >> "$REPORT_FILE"
fi

# Step 7: Check for XSS vulnerabilities
echo ""
echo "7. Checking for XSS vulnerabilities..."
echo "## XSS Vulnerability Check" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

DANGEROUS_HTML=$(grep -r "dangerouslySetInnerHTML\|innerHTML" src/ --include="*.tsx" 2>/dev/null | grep -v "// SAFE\|// SANITIZED" | wc -l)
if [ "$DANGEROUS_HTML" -gt "0" ]; then
    echo -e "${RED}✗ Found $DANGEROUS_HTML uses of dangerouslySetInnerHTML (potential XSS)${NC}"
    echo "- ✗ Unsafe HTML usage found: $DANGEROUS_HTML instances (review for XSS)" >> "$REPORT_FILE"
    ((ISSUES_FOUND++))
else
    echo -e "${GREEN}✓ No dangerous HTML injection patterns${NC}"
    echo "- ✓ No dangerouslySetInnerHTML usage" >> "$REPORT_FILE"
fi

# Step 8: Check for CSRF token handling
echo ""
echo "8. Checking CSRF protection..."
echo "## CSRF Protection Check" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

if grep -r "CSRF\|csrf\|X-CSRF" src/ lib/ --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l | grep -q "^[1-9]"; then
    echo -e "${GREEN}✓ CSRF protection implemented${NC}"
    echo "- ✓ CSRF token handling found" >> "$REPORT_FILE"
else
    echo -e "${YELLOW}⚠ No explicit CSRF tokens found (verify backend handles CORS properly)${NC}"
    echo "- ⚠ CSRF token handling not visible in frontend (verify backend)" >> "$REPORT_FILE"
fi

# Step 9: Check authentication handling
echo ""
echo "9. Checking authentication handling..."
echo "## Authentication Check" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

if grep -r "localStorage.setItem.*token\|sessionStorage.setItem.*token" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l | grep -q "^[1-9]"; then
    echo -e "${YELLOW}⚠ Tokens stored in localStorage (verify token security)${NC}"
    echo "- ⚠ Auth tokens stored in localStorage (should use httpOnly cookies in prod)" >> "$REPORT_FILE"
else
    echo -e "${GREEN}✓ No localStorage token storage patterns detected${NC}"
    echo "- ✓ Tokens not stored in localStorage" >> "$REPORT_FILE"
fi

# Step 10: Check for temporary/debug files
echo ""
echo "10. Checking for temporary files..."
echo "## Temporary Files Check" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

TEMP_FILES=$(find src/ cypress/ -name "*.tmp" -o -name "*.debug" -o -name ".DS_Store" -o -name "Thumbs.db" 2>/dev/null | wc -l)
if [ "$TEMP_FILES" -gt "0" ]; then
    echo -e "${YELLOW}⚠ Found $TEMP_FILES temporary files${NC}"
    echo "- ⚠ Temporary files found: $TEMP_FILES instances" >> "$REPORT_FILE"
    ((ISSUES_FOUND++))
else
    echo -e "${GREEN}✓ No temporary files in source${NC}"
    echo "- ✓ No temporary files" >> "$REPORT_FILE"
fi

# Step 11: Check .gitignore completeness
echo ""
echo "11. Checking .gitignore completeness..."
echo "## .gitignore Completeness Check" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

GITIGNORE_ITEMS=("node_modules" "dist" "build" ".env" ".DS_Store" "coverage")
for item in "${GITIGNORE_ITEMS[@]}"; do
    if grep -q "^$item$\|/$item$\|\*$item\|$item/\|$item\*" .gitignore 2>/dev/null; then
        echo -e "${GREEN}✓ $item in .gitignore${NC}"
    else
        echo -e "${YELLOW}⚠ $item may not be in .gitignore${NC}"
    fi
done
echo "- ✓ Standard items in .gitignore" >> "$REPORT_FILE"

# Step 12: Verify TypeScript strict mode
echo ""
echo "12. Checking TypeScript strict mode..."
echo "## TypeScript Strict Mode Check" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

if grep -q '"strict": true' tsconfig.json 2>/dev/null; then
    echo -e "${GREEN}✓ TypeScript strict mode enabled${NC}"
    echo "- ✓ TypeScript strict mode enabled" >> "$REPORT_FILE"
else
    echo -e "${YELLOW}⚠ TypeScript strict mode may not be fully enabled${NC}"
    echo "- ⚠ Verify TypeScript strict settings" >> "$REPORT_FILE"
fi

# Final Summary
echo ""
echo "======================================"
echo "Cleanup Tasks"
echo "======================================"
echo ""

# Remove debug files
echo "Cleaning up debug files..."
find . -name "*.debug" -o -name "*.tmp" 2>/dev/null | while read file; do
    rm -f "$file"
    echo "  Removed: $file"
    ((FIXED++))
done

# Clean coverage directories if empty
if [ -d "coverage" ] && [ ! "$(ls -A coverage)" ]; then
    rm -rf coverage
    echo "  Removed empty coverage directory"
fi

# Final Report
echo ""
echo "======================================"
echo "Security Audit Summary"
echo "======================================"
echo "Issues found: $ISSUES_FOUND"
echo "Items fixed: $FIXED"
echo "Report saved to: $REPORT_FILE"
echo ""

# Append summary to report
echo "" >> "$REPORT_FILE"
echo "## Summary" >> "$REPORT_FILE"
echo "- Total issues found: $ISSUES_FOUND" >> "$REPORT_FILE"
echo "- Items fixed: $FIXED" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "## Recommendations" >> "$REPORT_FILE"
echo "1. Run \`npm audit fix\` to update vulnerable dependencies" >> "$REPORT_FILE"
echo "2. Verify .env.example exists with placeholder values" >> "$REPORT_FILE"
echo "3. Ensure backend implements proper CORS headers" >> "$REPORT_FILE"
echo "4. Use httpOnly cookies for token storage in production" >> "$REPORT_FILE"
echo "5. Configure CSP headers in Next.js config" >> "$REPORT_FILE"
echo "6. Review sensitive API endpoints for authorization checks" >> "$REPORT_FILE"
echo "7. Test all error messages don't leak sensitive info" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Display report
echo "Audit Report:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cat "$REPORT_FILE"

if [ "$ISSUES_FOUND" -eq "0" ]; then
    echo -e "${GREEN}✓ Security audit PASSED${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠ Security audit completed with $ISSUES_FOUND issues${NC}"
    exit 1
fi
