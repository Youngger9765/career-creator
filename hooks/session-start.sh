#!/bin/bash
# Session Start Hook - Context Persistence
# Based on Anthropic Claude Code Meetup Taipei Best Practices
#
# Purpose: Auto-load project context when Claude Code starts
# This prevents context loss after compression
#
# Triggered: Every time Claude Code session starts

# Color output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📚 Loading project context...${NC}"

# 1. Load CLAUDE.md (Project Configuration)
if [ -f "CLAUDE.md" ]; then
    echo -e "${GREEN}✅ CLAUDE.md loaded${NC}"
    cat CLAUDE.md
fi

# 2. Load Architecture Decisions
if [ -f "docs/architecture.md" ]; then
    echo -e "${GREEN}✅ Architecture decisions loaded${NC}"
    cat docs/architecture.md
fi

# 3. Load Coding Conventions
if [ -f "docs/conventions.md" ]; then
    echo -e "${GREEN}✅ Coding conventions loaded${NC}"
    cat docs/conventions.md
fi

# 4. Load TODO if exists
if [ -f "TODO.md" ]; then
    echo -e "${GREEN}✅ TODO loaded${NC}"
    cat TODO.md
fi

# 5. Load PRD if exists
if [ -f "PRD.md" ]; then
    echo -e "${GREEN}✅ PRD loaded${NC}"
    cat PRD.md
fi

# 6. Show recent git activity (context)
echo -e "${BLUE}📝 Recent git activity:${NC}"
git log --oneline -5 2>/dev/null || echo "Not a git repository"

# 7. Show git status
echo -e "${BLUE}🔍 Git status:${NC}"
git status --short 2>/dev/null || echo "Not a git repository"

echo -e "${GREEN}✅ Context loaded successfully${NC}"
