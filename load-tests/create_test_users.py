#!/usr/bin/env python3
"""
Create 50 test users via API for load testing.

Usage:
    python create_test_users.py
"""

import requests
import sys

BACKEND_URL = "https://career-creator-backend-staging-x43mdhfwsq-de.a.run.app"
ADMIN_EMAIL = "demo.admin@example.com"
ADMIN_PASSWORD = "demo123"

def login_admin():
    """Login as admin and get token"""
    response = requests.post(
        f"{BACKEND_URL}/api/auth/login",
        json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
    )

    if response.status_code != 200:
        print(f"❌ Admin login failed: {response.status_code}")
        print(response.text)
        sys.exit(1)

    token = response.json()["access_token"]
    print(f"✅ Admin logged in successfully")
    return token

def batch_create_users(token):
    """Batch create 50 users"""
    headers = {"Authorization": f"Bearer {token}"}

    # Prepare user list
    users = []
    for i in range(1, 51):
        users.append({
            "email": f"test.user{i}@example.com",
            "password": "TestPassword123!",
            "roles": ["counselor"]
        })

    response = requests.post(
        f"{BACKEND_URL}/api/admin/users/batch",
        headers=headers,
        json={
            "users": users,
            "on_duplicate": "skip"  # Skip if already exists
        }
    )

    return response

def main():
    print("=" * 60)
    print("Creating 50 test users for load testing")
    print("=" * 60)

    # Login as admin
    token = login_admin()

    # Batch create users
    response = batch_create_users(token)

    if response.status_code == 200:
        result = response.json()
        success_count = len(result.get("success", []))
        skip_count = len(result.get("existing", []))
        fail_count = len(result.get("failed", []))

        print(f"\n✅ Successfully created: {success_count}")
        for user in result.get("success", []):
            print(f"   - {user['email']}")

        if skip_count > 0:
            print(f"\n⏭️  Skipped (already exists): {skip_count}")
            for user in result.get("existing", []):
                print(f"   - {user}")

        if fail_count > 0:
            print(f"\n❌ Failed: {fail_count}")
            for user in result.get("failed", []):
                print(f"   - {user}")

    print("=" * 60)
    print(f"Summary:")
    print(f"  ✅ Created: {success_count}")
    print(f"  ⏭️  Skipped: {skip_count}")
    print(f"  ❌ Failed: {fail_count}")
    print(f"  📊 Total: {success_count + skip_count}/{50}")
    print("=" * 60)

    if success_count + skip_count == 50:
        print("✅ All 50 test users are ready!")
        return 0
    else:
        print("⚠️  Some users could not be created")
        return 1

if __name__ == "__main__":
    sys.exit(main())
