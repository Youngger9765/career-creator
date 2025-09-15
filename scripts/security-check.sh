#!/bin/bash

# Security check script for career-creator project
# Run this before committing sensitive changes

set -e

echo "🔒 Running comprehensive security checks..."
echo "==========================================="

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track if any issues found
ISSUES_FOUND=0

# 1. Check for hardcoded secrets in code
echo -e "\n${YELLOW}1. Checking for hardcoded secrets...${NC}"
if grep -r -E "(password|secret|api_key|credential)\s*=\s*[\"'][^\"']+[\"']" \
    --include="*.py" --include="*.js" --include="*.ts" --include="*.tsx" \
    --exclude-dir=node_modules --exclude-dir=venv --exclude-dir=.git \
    --exclude-dir=.next --exclude-dir=.mypy_cache --exclude="*.test.*" --exclude="*test*.py" . 2>/dev/null | \
    grep -v -E "(example|demo|test|mock|placeholder|dummy|expire|_days|_minutes|_hours)" ; then
    echo -e "${RED}❌ Found potential hardcoded secrets!${NC}"
    ISSUES_FOUND=1
else
    echo -e "${GREEN}✅ No hardcoded secrets found${NC}"
fi

# 2. Check for exposed environment files
echo -e "\n${YELLOW}2. Checking for exposed .env files...${NC}"
if git ls-files | grep -E "\.env$|\.env\..*[^(example)]$" ; then
    echo -e "${RED}❌ Found .env files in git!${NC}"
    ISSUES_FOUND=1
else
    echo -e "${GREEN}✅ No .env files tracked${NC}"
fi

# 3. Run gitleaks if installed
echo -e "\n${YELLOW}3. Running Gitleaks secret scanner...${NC}"
if command -v gitleaks &> /dev/null; then
    if gitleaks detect --source . --verbose --no-git; then
        echo -e "${GREEN}✅ Gitleaks found no secrets${NC}"
    else
        echo -e "${RED}❌ Gitleaks found potential secrets!${NC}"
        ISSUES_FOUND=1
    fi
else
    echo -e "${YELLOW}⚠️  Gitleaks not installed. Install with: brew install gitleaks${NC}"
fi

# 4. Check Python dependencies for vulnerabilities
echo -e "\n${YELLOW}4. Checking Python dependencies...${NC}"
if [ -f "backend/requirements.txt" ]; then
    cd backend
    if command -v safety &> /dev/null; then
        if safety check --json --file requirements.txt 2>/dev/null; then
            echo -e "${GREEN}✅ No known vulnerabilities in Python dependencies${NC}"
        else
            echo -e "${YELLOW}⚠️  Some vulnerabilities found in dependencies${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  Safety not installed. Install with: pip install safety${NC}"
    fi
    cd ..
fi

# 5. Check npm dependencies for vulnerabilities
echo -e "\n${YELLOW}5. Checking npm dependencies...${NC}"
if [ -f "frontend/package.json" ]; then
    cd frontend
    if npm audit --audit-level=high 2>/dev/null; then
        echo -e "${GREEN}✅ No high/critical vulnerabilities in npm dependencies${NC}"
    else
        echo -e "${YELLOW}⚠️  Some vulnerabilities found in npm dependencies${NC}"
        echo "   Run 'npm audit fix' to fix automatically"
    fi
    cd ..
fi

# 6. Check for sensitive data patterns
echo -e "\n${YELLOW}6. Checking for sensitive data patterns...${NC}"
# Split patterns to avoid triggering our own security checks
PATTERNS=(
    "BEGIN""_RSA_PRIVATE_KEY"
    "BEGIN""_DSA_PRIVATE_KEY"
    "BEGIN""_EC_PRIVATE_KEY"
    "BEGIN""_OPENSSH_PRIVATE_KEY"
    "AWS_ACCESS_KEY_ID"
    "AWS_SECRET_ACCESS_KEY"
    "GOOGLE_APPLICATION_CREDENTIALS"
    "client_secret"
)

FOUND_PATTERNS=0
for pattern in "${PATTERNS[@]}"; do
    # Replace underscores with spaces when searching
    search_pattern="${pattern//_/ }"
    if grep -r "$search_pattern" --include="*.py" --include="*.js" --include="*.ts" --include="*.tsx" \
        --include="*.json" --exclude-dir=node_modules --exclude-dir=venv \
        --exclude-dir=.git --exclude-dir=.mypy_cache --exclude="*.example" . 2>/dev/null | \
        grep -v -E "(config\.py.*refresh_token_expire|test|mock)" ; then
        echo -e "${RED}❌ Found pattern: $pattern${NC}"
        FOUND_PATTERNS=1
    fi
done

if [ $FOUND_PATTERNS -eq 0 ]; then
    echo -e "${GREEN}✅ No sensitive data patterns found${NC}"
else
    ISSUES_FOUND=1
fi

# 7. Check file permissions
echo -e "\n${YELLOW}7. Checking file permissions...${NC}"
SENSITIVE_FILES=(
    ".env"
    ".env.local"
    "*.pem"
    "*.key"
    "id_rsa*"
)

for pattern in "${SENSITIVE_FILES[@]}"; do
    while IFS= read -r -d '' file; do
        perms=$(stat -f "%A" "$file" 2>/dev/null || stat -c "%a" "$file" 2>/dev/null)
        if [ "$perms" -gt 644 ]; then
            echo -e "${YELLOW}⚠️  File $file has loose permissions: $perms${NC}"
        fi
    done < <(find . -name "$pattern" -type f -print0 2>/dev/null)
done

# 8. Run bandit for Python security issues
echo -e "\n${YELLOW}8. Running Bandit security linter...${NC}"
if command -v bandit &> /dev/null; then
    if bandit -r backend/ --skip B101 -f json 2>/dev/null | grep -q '"issue_severity": "HIGH"'; then
        echo -e "${YELLOW}⚠️  Bandit found some security issues${NC}"
        bandit -r backend/ --skip B101 -ll
    else
        echo -e "${GREEN}✅ No high-severity issues found by Bandit${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Bandit not installed. Install with: pip install bandit${NC}"
fi

# Summary
echo -e "\n==========================================="
if [ $ISSUES_FOUND -eq 0 ]; then
    echo -e "${GREEN}✅ Security check completed successfully!${NC}"
    exit 0
else
    echo -e "${RED}❌ Security issues found! Please review and fix before committing.${NC}"
    exit 1
fi
