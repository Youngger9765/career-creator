# Logo Assets Organization

## Directory Structure

```
logos/
├── current/          # Active logos used in production
│   ├── logo.png      # Main logo (dark/default theme) - 1326x307px
│   └── logo-light.png # Light theme variant - 1329x307px
└── archive/          # Historical versions (backup)
    ├── logo.png      # Original small version - 489x216px
    ├── logo1.png     # Version 1
    ├── logo2.png     # Version 2
    ├── logo3.png     # Version 3 (source of current/logo.png)
    ├── logo-light.png   # Light v1
    ├── logo-light2.png  # Light v2
    └── logo-light3.png  # Light v3 (source of current/logo-light.png)
```

## Current Logo Usage

The active logos are located in `logos/current/`:

- **Main logo**: `/logos/current/logo.png` (36KB, 1326x307)
- **Light logo**: `/logos/current/logo-light.png` (34KB, 1329x307)

## Used In

The logos are referenced in the following files:

1. **Homepage** - `/frontend/src/app/page.tsx`
2. **Login page** - `/frontend/src/app/login/page.tsx`
3. **Dashboard** - `/frontend/src/app/dashboard/page.tsx`

## Update History

- **2026-01-16**: Organized logo files
  - Moved 7 logo files from project root to organized structure
  - Selected `logo3.png` and `logo-light3.png` as current versions
  - Archived all previous versions for backup
  - Updated all code references to new paths

## Notes

- The current logos are significantly larger (3x dimensions) than the original
- Light theme variant available but not yet implemented in UI
- All archived versions preserved for rollback if needed
