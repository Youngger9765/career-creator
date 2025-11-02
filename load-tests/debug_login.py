#!/usr/bin/env python3
"""
Debug login API to identify 500 errors
"""

import requests
import concurrent.futures
import time

BACKEND_URL = "https://career-creator-backend-staging-x43mdhfwsq-de.a.run.app"

def test_login(user_id):
    """Test single login"""
    email = f"test.user{user_id}@example.com"
    password = "TestPassword123!"

    start = time.time()
    try:
        response = requests.post(
            f"{BACKEND_URL}/api/auth/login",
            json={"email": email, "password": password},
            timeout=60
        )
        elapsed = time.time() - start

        if response.status_code == 200:
            return {"user_id": user_id, "status": "SUCCESS", "time": elapsed}
        else:
            return {
                "user_id": user_id,
                "status": "FAILED",
                "code": response.status_code,
                "error": response.text[:200],
                "time": elapsed
            }
    except Exception as e:
        elapsed = time.time() - start
        return {
            "user_id": user_id,
            "status": "EXCEPTION",
            "error": str(e),
            "time": elapsed
        }

def main():
    print("=" * 60)
    print("Testing concurrent logins to identify 500 errors")
    print("=" * 60)

    # Test with 25 concurrent logins (same as load test)
    num_users = 25

    print(f"\nTesting {num_users} concurrent logins...")
    start_time = time.time()

    with concurrent.futures.ThreadPoolExecutor(max_workers=num_users) as executor:
        futures = [executor.submit(test_login, i+1) for i in range(num_users)]
        results = [f.result() for f in concurrent.futures.as_completed(futures)]

    total_time = time.time() - start_time

    # Analyze results
    success = [r for r in results if r["status"] == "SUCCESS"]
    failed = [r for r in results if r["status"] == "FAILED"]
    exceptions = [r for r in results if r["status"] == "EXCEPTION"]

    print("\n" + "=" * 60)
    print("RESULTS")
    print("=" * 60)
    print(f"Total time: {total_time:.2f}s")
    print(f"Success: {len(success)}/{num_users} ({len(success)/num_users*100:.1f}%)")
    print(f"Failed: {len(failed)}/{num_users} ({len(failed)/num_users*100:.1f}%)")
    print(f"Exceptions: {len(exceptions)}/{num_users} ({len(exceptions)/num_users*100:.1f}%)")

    if success:
        avg_time = sum(r["time"] for r in success) / len(success)
        max_time = max(r["time"] for r in success)
        min_time = min(r["time"] for r in success)
        print(f"\nSuccess response times:")
        print(f"  Average: {avg_time:.2f}s")
        print(f"  Min: {min_time:.2f}s")
        print(f"  Max: {max_time:.2f}s")

    if failed:
        print(f"\n❌ FAILURES ({len(failed)}):")
        for r in failed:
            print(f"  User {r['user_id']}: HTTP {r['code']} - {r['error']}")

    if exceptions:
        print(f"\n❌ EXCEPTIONS ({len(exceptions)}):")
        for r in exceptions:
            print(f"  User {r['user_id']}: {r['error']}")

    print("=" * 60)

if __name__ == "__main__":
    main()
