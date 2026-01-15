#!/bin/bash
# Quick helper script to seed demo consultation records

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}==================================${NC}"
echo -e "${GREEN}Seed Demo Consultation Records${NC}"
echo -e "${GREEN}==================================${NC}"

# Parse arguments
ENV="staging"
ROLLBACK=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --production|-p)
            ENV="production"
            shift
            ;;
        --rollback|-r)
            ROLLBACK="--rollback"
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --production, -p    Seed production database (requires confirmation)"
            echo "  --rollback, -r      Remove demo data instead of creating"
            echo "  --help, -h          Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0                  # Seed staging"
            echo "  $0 --production     # Seed production (with confirmation)"
            echo "  $0 --rollback       # Rollback staging"
            echo "  $0 -p -r            # Rollback production"
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

# Check .env file exists
if [ ! -f "$BACKEND_DIR/.env" ]; then
    echo -e "${RED}Error: .env file not found${NC}"
    echo "Please create .env file with DATABASE_URL and GCS_BUCKET_NAME"
    exit 1
fi

# Load environment variables
source "$BACKEND_DIR/.env"

echo -e "${YELLOW}Environment: $ENV${NC}"
echo -e "${YELLOW}Action: ${ROLLBACK:-create}${NC}"
echo ""

# Run the Python script
cd "$BACKEND_DIR"
python scripts/seed_demo_consultation_records.py --env "$ENV" $ROLLBACK

echo ""
echo -e "${GREEN}Done!${NC}"
