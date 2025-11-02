#!/usr/bin/env python3
"""
Concurrent Rooms Load Test
Configurable test for N counselors each creating a room with 1 visitor

Usage:
  python test_concurrent_rooms.py                       # Default: medium config
  python test_concurrent_rooms.py --config smoke        # Quick smoke test (10 rooms)
  python test_concurrent_rooms.py --config large        # Large test (200 rooms)
  python test_concurrent_rooms.py --rooms 50            # Custom room count
  python test_concurrent_rooms.py --rooms 200 --local   # Local backend
"""

import asyncio
import argparse
import requests
import time
from datetime import datetime
import json
import sys
import os

# Add parent directory to path for config import
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from config import (
    STAGING_API, LOCAL_API, DEFAULT_TEST_PASSWORD,
    get_scenario_config, SCENARIOS
)

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

    def get_summary(self, num_rooms):
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
                "num_counselors": num_rooms,
                "num_visitors": num_rooms,
                "total_users": num_rooms * 2,
                "total_rooms": num_rooms
            },
            "counselor_logins": calc_stats(self.counselor_logins),
            "room_creations": calc_stats(self.room_creations),
            "visitor_joins": calc_stats(self.visitor_joins),
            "errors": dict(self.errors),
            "total_duration_sec": round(total_time, 1)
        }

async def test_single_room(api_url: str, counselor_num: int, metrics: TestMetrics):
    """Test one counselor creating room + one visitor joining"""

    # 1. Counselor login
    start = time.time()
    try:
        response = requests.post(
            f"{api_url}/api/auth/login",
            json={
                "email": f"test.user{counselor_num}@example.com",
                "password": DEFAULT_TEST_PASSWORD
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
            print(f"❌ [Room {counselor_num}] Login response missing token")
            return

        metrics.record_login(True, duration)
        token = data["access_token"]

    except Exception as e:
        duration = (time.time() - start) * 1000
        metrics.record_login(False, duration)
        print(f"❌ [Room {counselor_num}] Login error: {str(e)[:50]}")
        return

    # 2. Create room
    start = time.time()
    try:
        response = requests.post(
            f"{api_url}/api/rooms/",  # Trailing slash required
            headers={"Authorization": f"Bearer {token}"},
            json={"name": f"Test Room {counselor_num}"},
            timeout=30
        )
        duration = (time.time() - start) * 1000

        if response.status_code != 201:
            metrics.record_room(False, duration)
            print(f"❌ [Room {counselor_num}] Create room failed: HTTP {response.status_code}")
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
            f"{api_url}/api/visitors/join-room/{share_code}",
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
        if counselor_num % 10 == 0:  # Only print every 10th room
            print(f"✅ [Room {counselor_num}] Complete")

    except Exception as e:
        duration = (time.time() - start) * 1000
        error = type(e).__name__
        metrics.record_visitor(False, duration, error)
        print(f"❌ [Room {counselor_num}] Visitor join error: {str(e)[:50]}")

async def main():
    parser = argparse.ArgumentParser(
        description='Concurrent Rooms Load Test',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s --config smoke     # Quick test: 10 rooms
  %(prog)s --config medium    # Medium test: 100 rooms (default)
  %(prog)s --config large     # Large test: 200 rooms
  %(prog)s --rooms 150        # Custom: 150 rooms
  %(prog)s --local            # Test local backend
        """
    )
    parser.add_argument('--config', type=str, choices=['smoke', 'small', 'medium', 'large', 'stress'],
                       help='Test configuration preset')
    parser.add_argument('--rooms', type=int, help='Number of rooms (overrides --config)')
    parser.add_argument('--local', action='store_true', help='Test against local backend')
    args = parser.parse_args()

    # Determine number of rooms
    if args.rooms:
        num_rooms = args.rooms
    elif args.config:
        config = get_scenario_config('concurrent_rooms', args.config)
        num_rooms = config['rooms']
    else:
        # Default to medium config
        config = get_scenario_config('concurrent_rooms', 'medium')
        num_rooms = config['rooms']

    api_url = LOCAL_API if args.local else STAGING_API
    env = "Local" if args.local else "Staging"

    print("=" * 80)
    print(f"{num_rooms} Rooms Concurrent Test ({env})")
    print(f"{num_rooms} Counselors + {num_rooms} Visitors = {num_rooms * 2} Total Users")
    print(f"API: {api_url}")
    print("=" * 80)
    print()

    metrics = TestMetrics()

    # Run all rooms concurrently
    tasks = [test_single_room(api_url, i + 1, metrics) for i in range(num_rooms)]
    await asyncio.gather(*tasks)

    # Print results
    summary = metrics.get_summary(num_rooms)

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
        summary['counselor_logins']['success'] == num_rooms and
        summary['room_creations']['success'] == num_rooms and
        summary['visitor_joins']['success'] == num_rooms
    )

    if all_success:
        print(f"✅ PASS: All {num_rooms} rooms working perfectly!")
    else:
        print(f"⚠️  PARTIAL: Some operations failed")

    print("=" * 80)

    # Save results to load-tests directory
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    script_dir = os.path.dirname(os.path.abspath(__file__))
    filename = f"concurrent_rooms_test_{num_rooms}rooms_{env.lower()}_{timestamp}.json"
    filepath = os.path.join(script_dir, filename)
    with open(filepath, 'w') as f:
        json.dump(summary, f, indent=2)
    print(f"\nResults saved to: {filename}")

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n\nTest interrupted")
