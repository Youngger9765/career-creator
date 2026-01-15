#!/usr/bin/env python3
"""Verify demo consultation records in database."""
from app.core.database import engine
from sqlmodel import Session, text
import sys


def verify_demo_data():
    """Verify demo consultation records exist in database."""
    try:
        with Session(engine) as session:
            result = session.exec(text('''
                SELECT COUNT(*) as total,
                       COUNT(DISTINCT room_id) as rooms,
                       COUNT(DISTINCT client_id) as clients,
                       MIN(session_date) as earliest,
                       MAX(session_date) as latest
                FROM consultation_records
                WHERE counselor_id = '00000000-0000-0000-0001-000000000001'
            ''')).first()

            if result:
                print(f"✅ Verification Results:")
                print(f"   Total Records: {result.total}")
                print(f"   Rooms: {result.rooms}")
                print(f"   Clients: {result.clients}")
                print(f"   Date Range: {result.earliest} to {result.latest}")

                if result.total == 0:
                    print("⚠️  No demo records found!")
                    sys.exit(1)

                print("\n✅ Demo data verification passed!")
            else:
                print("❌ Verification failed - no results returned")
                sys.exit(1)

    except Exception as e:
        print(f"❌ Verification error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    verify_demo_data()
