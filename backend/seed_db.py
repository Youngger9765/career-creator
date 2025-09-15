#!/usr/bin/env python3
"""
Database Seeding Script
資料庫種子資料腳本

Usage:
    python seed_db.py                    # 生產環境種子資料
    python seed_db.py --test             # 包含測試資料
    python seed_db.py --test-only        # 僅測試資料
"""

import argparse
import os
import sys

# Add the app directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.seeds import run_all_seeds, run_test_seeds  # noqa: E402


def main():
    parser = argparse.ArgumentParser(description="Database seeding script")
    parser.add_argument(
        "--test",
        action="store_true",
        help="Include test data along with production seeds",
    )
    parser.add_argument(
        "--test-only",
        action="store_true",
        help="Only run test data seeds (for development)",
    )

    args = parser.parse_args()

    if args.test_only:
        print("🧪 Initializing database with test data only...")
        run_test_seeds()
    else:
        print("🚀 Initializing database with seed data...")
        run_all_seeds(include_test_data=args.test)

    print("✅ Database seeding completed!")


if __name__ == "__main__":
    main()
