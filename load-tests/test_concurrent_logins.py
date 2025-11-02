#!/usr/bin/env python3
"""Test 25 concurrent logins"""
import requests
import concurrent.futures
import time

BACKEND_URL = "https://career-creator-backend-staging-x43mdhfwsq-de.a.run.app"

def test_login(user_id):
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
            return {"user_id": user_id, "status": "FAILED", "code": response.status_code, "time": elapsed}
    except Exception as e:
        elapsed = time.time() - start
        return {"user_id": user_id, "status": "EXCEPTION", "error": str(e), "time": elapsed}

print("Testing 25 concurrent logins...")
start_time = time.time()

with concurrent.futures.ThreadPoolExecutor(max_workers=25) as executor:
    futures = [executor.submit(test_login, i+1) for i in range(25)]
    results = [f.result() for f in concurrent.futures.as_completed(futures)]

total_time = time.time() - start_time
success = [r for r in results if r["status"] == "SUCCESS"]
failed = [r for r in results if r["status"] == "FAILED"]
exceptions = [r for r in results if r["status"] == "EXCEPTION"]

print(f"\n{'='*60}")
print(f"RESULTS")
print(f"{'='*60}")
print(f"Total time: {total_time:.2f}s")
print(f"Success: {len(success)}/25 ({len(success)/25*100:.1f}%)")
print(f"Failed: {len(failed)}/25")
print(f"Exceptions: {len(exceptions)}/25")

if success:
    avg_time = sum(r["time"] for r in success) / len(success)
    print(f"\nAverage response time: {avg_time:.2f}s")
print(f"{'='*60}")
