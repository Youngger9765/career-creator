#!/usr/bin/env python3
"""
Realtime Broadcast 100 Rooms Test
測試 100 個房間同時使用 Realtime broadcast
"""
import asyncio
import time
from datetime import datetime
import json
from realtime import AsyncRealtimeClient
import os

API_URL = "https://career-creator-backend-staging-x43mdhfwsq-de.a.run.app"
SUPABASE_URL = os.getenv("SUPABASE_REALTIME_URL", "wss://nnjdyxiiyhawwbkfyhtr.supabase.co/realtime/v1/websocket")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY")

if not SUPABASE_KEY:
    raise ValueError("SUPABASE_ANON_KEY environment variable is required")

class RealtimeMetrics:
    def __init__(self):
        self.connections_success = 0
        self.connections_fail = 0
        self.messages_sent = 0
        self.messages_received = 0
        self.errors = {}

metrics = RealtimeMetrics()

async def test_room_realtime(room_num: int):
    """Test realtime for one room"""
    try:
        client = AsyncRealtimeClient(SUPABASE_URL, SUPABASE_KEY)
        await client.connect()

        channel = client.channel(f"realtime:room:test-{room_num}")

        # Subscribe
        await channel.subscribe()
        metrics.connections_success += 1

        # Send test message
        await channel.send_broadcast(event="card_moved", payload={
            "room_id": f"test-{room_num}",
            "card_id": "card-1",
            "x": 100,
            "y": 200
        })
        metrics.messages_sent += 1

        await asyncio.sleep(2)
        await client.close()

        if room_num % 10 == 0:
            print(f"✅ Room {room_num} realtime OK")

    except Exception as e:
        metrics.connections_fail += 1
        error_type = type(e).__name__
        metrics.errors[error_type] = metrics.errors.get(error_type, 0) + 1
        print(f"❌ Room {room_num} failed: {str(e)[:50]}")

async def main():
    print("=" * 80)
    print("100 Rooms Realtime Broadcast Test")
    print("=" * 80)

    start = time.time()
    tasks = [test_room_realtime(i) for i in range(1, 101)]
    await asyncio.gather(*tasks)
    duration = time.time() - start

    print("\n" + "=" * 80)
    print("RESULTS")
    print("=" * 80)
    print(f"Connections: {metrics.connections_success}/{100} ({metrics.connections_success}%)")
    print(f"Messages Sent: {metrics.messages_sent}")
    print(f"Duration: {duration:.1f}s")

    if metrics.errors:
        print("\nErrors:")
        for error, count in metrics.errors.items():
            print(f"  - {error}: {count}")

    result = {
        "connections_success": metrics.connections_success,
        "connections_fail": metrics.connections_fail,
        "messages_sent": metrics.messages_sent,
        "duration_sec": round(duration, 1),
        "errors": dict(metrics.errors)
    }

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"realtime_100rooms_test_{timestamp}.json"
    with open(filename, 'w') as f:
        json.dump(result, f, indent=2)
    print(f"\nResults saved: {filename}")

if __name__ == "__main__":
    asyncio.run(main())
