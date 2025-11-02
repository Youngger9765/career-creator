#!/usr/bin/env python3
"""
100 Rooms Concurrent Test
Tests 100 counselors each with 1 visitor (200 total users, 100 rooms)
"""

import asyncio
import requests
import time
from datetime import datetime
import json

API_URL = "https://career-creator-backend-staging-x43mdhfwsq-de.a.run.app"
NUM_COUNSELORS = 100

class TestMetrics:
    def __init__(self):
        self.counselor_logins = {"success": 0, "fail": 0, "times": []}
        self.room_creations = {"success": 0, "fail": 0, "times": []}
        self.visitor_joins = {"success": 0, "fail": 0, "times": []}
        self.errors = {}
        self.start_time = time.time()

    def record_login(self, success: bool, duration_ms: float):
        if success:
            self.counselor_logins["success"] += 1
            self.counselor_logins["times"].append(duration_ms)
        else:
            self.counselor_logins["fail"] += 1

    def record_room(self, success: bool, duration_ms: float):
        if success:
            self.room_creations["success"] += 1
            self.room_creations["times"].append(duration_ms)
        else:
            self.room_creations["fail"] += 1

    def record_visitor(self, success: bool, duration_ms: float, error: str = None):
        if success:
            self.visitor_joins["success"] += 1
            self.visitor_joins["times"].append(duration_ms)
        else:
            self.visitor_joins["fail"] += 1
            if error:
                self.errors[error] = self.errors.get(error, 0) + 1

    def get_summary(self):
        total_time = time.time() - self.start_time

        def calc_stats(data):
            times = data["times"]
            return {
                "success": data["success"],
                "fail": data["fail"],
                "total": data["success"] + data["fail"],
                "success_rate": f"{(data['success'] / (data['success'] + data['fail']) * 100) if (data['success'] + data['fail']) > 0 else 0:.1f}%",
                "avg_ms": round(sum(times) / len(times), 0) if times else 0,
                "p95_ms": round(sorted(times)[int(len(times) * 0.95)], 0) if len(times) > 20 else 0
            }

        return {
            "test_config": {
                "num_counselors": NUM_COUNSELORS,
                "num_visitors": NUM_COUNSELORS,
                "total_users": NUM_COUNSELORS * 2,
                "total_rooms": NUM_COUNSELORS
            },
            "counselor_logins": calc_stats(self.counselor_logins),
            "room_creations": calc_stats(self.room_creations),
            "visitor_joins": calc_stats(self.visitor_joins),
            "errors": dict(self.errors),
            "total_duration_sec": round(total_time, 1)
        }

metrics = TestMetrics()

async def test_single_room(counselor_num: int):
    """Test one counselor creating room + one visitor joining"""

    # 1. Counselor login
    start = time.time()
    try:
        response = requests.post(
            f"{API_URL}/api/auth/login",
            json={
                "email": f"test.user{counselor_num}@example.com",
                "password": "TestPassword123!"
            },
            timeout=30
        )
        duration = (time.time() - start) * 1000

        if response.status_code != 200:
            metrics.record_login(False, duration)
            print(f"❌ [Room {counselor_num}] Login failed: HTTP {response.status_code}")
            return

        data = response.json()
        if "access_token" not in data:
            metrics.record_login(False, duration)
            print(f"❌ [Room {counselor_num}] Login response missing token: {data}")
            return

        metrics.record_login(True, duration)
        token = data["access_token"]
        print(f"✅ [Room {counselor_num}] Logged in, token: {token[:30]}...")

    except Exception as e:
        duration = (time.time() - start) * 1000
        metrics.record_login(False, duration)
        print(f"❌ [Room {counselor_num}] Login error: {str(e)[:50]}")
        return

    # 2. Create room
    start = time.time()
    try:
        response = requests.post(
            f"{API_URL}/api/rooms/",  # Add trailing slash
            headers={"Authorization": f"Bearer {token}"},
            json={"name": f"Test Room {counselor_num}"},
            timeout=30
        )
        duration = (time.time() - start) * 1000

        if response.status_code != 201:
            metrics.record_room(False, duration)
            print(f"❌ [Room {counselor_num}] Create room failed: HTTP {response.status_code} - {response.text[:100]}")
            return

        metrics.record_room(True, duration)
        share_code = response.json()["share_code"]

    except Exception as e:
        duration = (time.time() - start) * 1000
        metrics.record_room(False, duration)
        print(f"❌ [Room {counselor_num}] Create room error: {str(e)[:50]}")
        return

    # 3. Visitor join
    start = time.time()
    try:
        session_id = f"session-{int(time.time() * 1000)}-{counselor_num}"
        response = requests.post(
            f"{API_URL}/api/visitors/join-room/{share_code}",
            json={
                "name": f"Visitor-{counselor_num}",
                "session_id": session_id
            },
            timeout=30
        )
        duration = (time.time() - start) * 1000

        if response.status_code != 201:
            error = f"HTTP {response.status_code}"
            metrics.record_visitor(False, duration, error)
            print(f"❌ [Room {counselor_num}] Visitor join failed: {error}")
            return

        metrics.record_visitor(True, duration)
        print(f"✅ [Room {counselor_num}] Complete (Login: {counselor_num}ms, Room: {duration:.0f}ms, Visitor: {duration:.0f}ms)")

    except Exception as e:
        duration = (time.time() - start) * 1000
        error = type(e).__name__
        metrics.record_visitor(False, duration, error)
        print(f"❌ [Room {counselor_num}] Visitor join error: {str(e)[:50]}")

async def main():
    print("=" * 80)
    print(f"100 Rooms Concurrent Test")
    print(f"100 Counselors + 100 Visitors = 200 Total Users")
    print("=" * 80)
    print()

    # Run all rooms concurrently
    tasks = [test_single_room(i + 1) for i in range(NUM_COUNSELORS)]
    await asyncio.gather(*tasks)

    # Print results
    summary = metrics.get_summary()

    print()
    print("=" * 80)
    print("RESULTS")
    print("=" * 80)
    print(f"Counselor Logins: {summary['counselor_logins']['success']}/{summary['counselor_logins']['total']} ({summary['counselor_logins']['success_rate']}) - Avg: {summary['counselor_logins']['avg_ms']:.0f}ms, P95: {summary['counselor_logins']['p95_ms']:.0f}ms")
    print(f"Room Creations:   {summary['room_creations']['success']}/{summary['room_creations']['total']} ({summary['room_creations']['success_rate']}) - Avg: {summary['room_creations']['avg_ms']:.0f}ms, P95: {summary['room_creations']['p95_ms']:.0f}ms")
    print(f"Visitor Joins:    {summary['visitor_joins']['success']}/{summary['visitor_joins']['total']} ({summary['visitor_joins']['success_rate']}) - Avg: {summary['visitor_joins']['avg_ms']:.0f}ms, P95: {summary['visitor_joins']['p95_ms']:.0f}ms")
    print(f"Total Duration:   {summary['total_duration_sec']}s")

    if summary['errors']:
        print()
        print("Errors:")
        for error, count in summary['errors'].items():
            print(f"  - {error}: {count}")

    print()

    # Overall pass/fail
    all_success = (
        summary['counselor_logins']['success'] == NUM_COUNSELORS and
        summary['room_creations']['success'] == NUM_COUNSELORS and
        summary['visitor_joins']['success'] == NUM_COUNSELORS
    )

    if all_success:
        print(f"✅ PASS: All {NUM_COUNSELORS} rooms working perfectly!")
    else:
        print(f"⚠️  PARTIAL: Some operations failed")

    print("=" * 80)

    # Save results
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"100_rooms_test_results_{timestamp}.json"
    with open(filename, 'w') as f:
        json.dump(summary, f, indent=2)
    print(f"\nResults saved to: {filename}")

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n\nTest interrupted")
