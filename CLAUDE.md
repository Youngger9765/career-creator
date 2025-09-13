# CLAUDE.md - Project Guidelines

## Project Overview
Building an online card consultation system for career counselors and their visitors.

## Commit Message Convention
- **Language**: Always use English for commit messages
- **Format**: Use conventional commits format
  - `feat:` for new features
  - `fix:` for bug fixes
  - `docs:` for documentation
  - `style:` for formatting changes
  - `refactor:` for code restructuring
  - `test:` for tests
  - `chore:` for maintenance tasks

## Code Standards
- **Framework**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL with Prisma
- **State Management**: Zustand
- **Drag and Drop**: @dnd-kit

## Development Guidelines
1. **Mobile First**: Always prioritize mobile experience
2. **Type Safety**: Use TypeScript for all code
3. **Component Structure**: Keep components small and focused
4. **Testing**: Write tests for critical functionality
5. **Documentation**: Comment complex logic

## File Structure
```
/src
  /app          # Next.js app router pages
  /components   # Reusable components
  /lib          # Utilities and helpers
  /hooks        # Custom React hooks
  /types        # TypeScript type definitions
  /styles       # Global styles
```

## Key Decisions
- Use polling for MVP (no WebSocket initially)
- Visitors don't need registration
- Room expires after 7 days by default
- Start with single card deck (職能盤點卡)

## Testing Commands
```bash
npm run dev      # Development server
npm run build    # Production build
npm run lint     # Lint check
npm run test     # Run tests
```

## Deployment
- Platform: Vercel
- Database: Supabase PostgreSQL
- Environment: Production branch = main

---
*Last updated: 2025-09-13*