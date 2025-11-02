#!/usr/bin/env python3
"""
Supabase Realtime WebSocket Load Test
測試 50 個並發使用者的 Realtime 連接和訊息廣播

測試場景:
1. 50 users 同時連接到同一個 room channel
2. 1 owner 廣播遊戲模式切換 → 49 visitors 接收
3. 所有 users 隨機移動牌卡 → 其他人接收更新
4. 測量訊息延遲和送達率
"""

import os
import sys
import json
import time
import asyncio
import logging
from datetime import datetime
from typing import Dict, List, Set
from collections import defaultdict
import websockets
from websockets.client import WebSocketClientProtocol

# Configuration
SUPABASE_URL = os.getenv(
    "SUPABASE_URL", "https://nnjdyxiiyhawwbkfyhtr.supabase.co"
)
SUPABASE_ANON_KEY = os.getenv(
    "SUPABASE_ANON_KEY",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5uamR5eGlpeWhhd3dia2Z5aHRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3NDY3MDksImV4cCI6MjA3MzMyMjcwOX0.NPPt7gA4BJ9S5DxJKdFM3Z9jaWwPAY6cpFNoBdo-usI",
)

# Test Configuration
NUM_USERS = 50
TEST_DURATION_SEC = 120  # 2 minutes
ROOM_ID = f"test-room-{int(time.time())}"
GAME_TYPE = "personality_analysis"

# Supabase Realtime WebSocket URL
ws_url = SUPABASE_URL.replace("https://", "wss://").replace("http://", "ws://")
WS_ENDPOINT = f"{ws_url}/realtime/v1/websocket"

# Logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s", datefmt="%H:%M:%S"
)
logger = logging.getLogger(__name__)


class RealtimeMetrics:
    """收集 Realtime 測試指標"""

    def __init__(self):
        self.connections_success = 0
        self.connections_failed = 0
        self.messages_sent = 0
        self.messages_received = 0
        self.connection_times = []
        self.message_latencies = []
        self.errors = defaultdict(int)
        self.start_time = time.time()

        # Track message delivery (for broadcast verification)
        self.sent_messages: Dict[str, float] = {}  # msg_id -> timestamp
        self.received_by_user: Dict[str, Set[str]] = defaultdict(set)  # msg_id -> set of user_ids

    def record_connection(self, success: bool, duration_ms: float = 0):
        if success:
            self.connections_success += 1
            self.connection_times.append(duration_ms)
        else:
            self.connections_failed += 1

    def record_message_sent(self, msg_id: str):
        self.messages_sent += 1
        self.sent_messages[msg_id] = time.time()

    def record_message_received(self, msg_id: str, user_id: str):
        self.messages_received += 1
        self.received_by_user[msg_id].add(user_id)

        # Calculate latency if we have the send time
        if msg_id in self.sent_messages:
            latency_ms = (time.time() - self.sent_messages[msg_id]) * 1000
            self.message_latencies.append(latency_ms)

    def record_error(self, error_type: str):
        self.errors[error_type] += 1

    def get_stats(self) -> Dict:
        total_users = self.connections_success
        avg_conn_time = (
            sum(self.connection_times) / len(self.connection_times) if self.connection_times else 0
        )

        avg_latency = (
            sum(self.message_latencies) / len(self.message_latencies)
            if self.message_latencies
            else 0
        )

        p50_latency = (
            sorted(self.message_latencies)[len(self.message_latencies) // 2]
            if self.message_latencies
            else 0
        )
        p95_latency = (
            sorted(self.message_latencies)[int(len(self.message_latencies) * 0.95)]
            if self.message_latencies
            else 0
        )
        p99_latency = (
            sorted(self.message_latencies)[int(len(self.message_latencies) * 0.99)]
            if self.message_latencies
            else 0
        )

        # Broadcast delivery rate (how many users received each message)
        broadcast_rates = []
        for msg_id, receivers in self.received_by_user.items():
            # Expected: NUM_USERS - 1 (everyone except sender)
            expected = NUM_USERS - 1
            actual = len(receivers)
            rate = (actual / expected * 100) if expected > 0 else 0
            broadcast_rates.append(rate)

        avg_broadcast_rate = (
            sum(broadcast_rates) / len(broadcast_rates) if broadcast_rates else 0
        )

        return {
            "test_config": {
                "num_users": NUM_USERS,
                "duration_sec": TEST_DURATION_SEC,
                "room_id": ROOM_ID,
            },
            "connections": {
                "success": self.connections_success,
                "failed": self.connections_failed,
                "success_rate": f"{self.connections_success}/{NUM_USERS}",
                "avg_connection_time_ms": round(avg_conn_time, 2),
            },
            "messages": {
                "sent": self.messages_sent,
                "received": self.messages_received,
                "avg_latency_ms": round(avg_latency, 2),
                "p50_latency_ms": round(p50_latency, 2),
                "p95_latency_ms": round(p95_latency, 2),
                "p99_latency_ms": round(p99_latency, 2),
            },
            "broadcast": {
                "avg_delivery_rate": f"{round(avg_broadcast_rate, 1)}%",
                "total_broadcasts": len(self.sent_messages),
                "expected_receivers_per_msg": NUM_USERS - 1,
            },
            "errors": dict(self.errors),
            "test_duration_actual_sec": round(time.time() - self.start_time, 2),
        }


# Global metrics
metrics = RealtimeMetrics()


class RealtimeClient:
    """Supabase Realtime WebSocket 客戶端"""

    def __init__(self, user_id: str, is_owner: bool = False):
        self.user_id = user_id
        self.is_owner = is_owner
        self.ws: WebSocketClientProtocol = None
        self.connected = False
        self.channel_joined = False
        self.ref_counter = 0

        # Channel topic
        self.channel_topic = f"realtime:room:{ROOM_ID}:cards:{GAME_TYPE}"

    async def connect(self):
        """建立 WebSocket 連接"""
        start_time = time.time()
        try:
            # Connect with Supabase auth
            params = f"apikey={SUPABASE_ANON_KEY}&vsn=1.0.0"
            url = f"{WS_ENDPOINT}?{params}"

            self.ws = await websockets.connect(url)
            self.connected = True

            duration_ms = (time.time() - start_time) * 1000
            metrics.record_connection(True, duration_ms)

            logger.info(f"[{self.user_id}] Connected in {duration_ms:.2f}ms")

            # Start listening
            asyncio.create_task(self._listen())

            return True

        except Exception as e:
            metrics.record_connection(False)
            metrics.record_error("connection_failed")
            logger.error(f"[{self.user_id}] Connection failed: {e}")
            return False

    async def join_channel(self):
        """加入 Realtime channel"""
        if not self.connected:
            return False

        try:
            # Join channel message
            join_msg = {
                "topic": self.channel_topic,
                "event": "phx_join",
                "payload": {},
                "ref": str(self._next_ref()),
            }

            await self.ws.send(json.dumps(join_msg))
            logger.debug(f"[{self.user_id}] Joining channel: {self.channel_topic}")

            # Wait a bit for join confirmation
            await asyncio.sleep(0.5)

            self.channel_joined = True
            return True

        except Exception as e:
            metrics.record_error("join_failed")
            logger.error(f"[{self.user_id}] Join channel failed: {e}")
            return False

    async def broadcast_card_move(self, card_id: str):
        """廣播牌卡移動事件"""
        if not self.channel_joined:
            return

        try:
            msg_id = f"{self.user_id}-{int(time.time() * 1000)}-{card_id}"

            payload = {
                "type": "broadcast",
                "event": "card_moved",
                "payload": {
                    "msg_id": msg_id,
                    "cardId": card_id,
                    "fromZone": "deck",
                    "toZone": "like",
                    "timestamp": int(time.time() * 1000),
                    "performedBy": "owner" if self.is_owner else "visitor",
                    "performerName": self.user_id,
                    "performerId": self.user_id,
                },
            }

            broadcast_msg = {
                "topic": self.channel_topic,
                "event": "broadcast",
                "payload": payload,
                "ref": str(self._next_ref()),
            }

            await self.ws.send(json.dumps(broadcast_msg))
            metrics.record_message_sent(msg_id)

            logger.debug(f"[{self.user_id}] Broadcasted card move: {card_id}")

        except Exception as e:
            metrics.record_error("broadcast_failed")
            logger.error(f"[{self.user_id}] Broadcast failed: {e}")

    async def _listen(self):
        """監聽 WebSocket 訊息"""
        try:
            async for message in self.ws:
                await self._handle_message(message)
        except websockets.exceptions.ConnectionClosed:
            logger.warning(f"[{self.user_id}] Connection closed")
            self.connected = False
        except Exception as e:
            logger.error(f"[{self.user_id}] Listen error: {e}")
            self.connected = False

    async def _handle_message(self, message: str):
        """處理收到的訊息"""
        try:
            data = json.loads(message)
            event = data.get("event")

            # Handle join reply
            if event == "phx_reply" and data.get("payload", {}).get("status") == "ok":
                logger.debug(f"[{self.user_id}] Channel joined successfully")

            # Handle broadcast messages
            elif event == "broadcast":
                payload = data.get("payload", {})
                if payload.get("event") == "card_moved":
                    card_data = payload.get("payload", {})
                    msg_id = card_data.get("msg_id")
                    sender_id = card_data.get("performerId")

                    # Don't count our own messages
                    if sender_id != self.user_id and msg_id:
                        metrics.record_message_received(msg_id, self.user_id)
                        logger.debug(
                            f"[{self.user_id}] Received card move from {sender_id}: "
                            f"{card_data.get('cardId')}"
                        )

        except json.JSONDecodeError:
            logger.warning(f"[{self.user_id}] Invalid JSON: {message}")
        except Exception as e:
            logger.error(f"[{self.user_id}] Handle message error: {e}")

    async def disconnect(self):
        """關閉連接"""
        if self.ws:
            await self.ws.close()
            self.connected = False
            logger.debug(f"[{self.user_id}] Disconnected")

    def _next_ref(self) -> int:
        """生成下一個 ref ID"""
        self.ref_counter += 1
        return self.ref_counter


async def run_user_simulation(user_id: str, is_owner: bool = False):
    """執行單一使用者的模擬"""
    client = RealtimeClient(user_id, is_owner)

    # Connect
    if not await client.connect():
        return

    # Join channel
    if not await client.join_channel():
        return

    # Wait a bit for all users to connect
    await asyncio.sleep(2)

    # Simulate card moves
    test_end = time.time() + TEST_DURATION_SEC
    move_count = 0

    while time.time() < test_end:
        # Move a card
        card_id = f"card-{move_count % 100}"
        await client.broadcast_card_move(card_id)

        move_count += 1

        # Random wait between moves (1-5 seconds)
        await asyncio.sleep(1 + (move_count % 4))

    # Disconnect
    await client.disconnect()
    logger.info(f"[{user_id}] Completed simulation ({move_count} moves)")


async def main():
    """主測試函數"""
    logger.info("=" * 80)
    logger.info("Supabase Realtime Load Test")
    logger.info(f"Users: {NUM_USERS}")
    logger.info(f"Duration: {TEST_DURATION_SEC}s")
    logger.info(f"Room: {ROOM_ID}")
    logger.info("=" * 80)

    # Create user tasks
    tasks = []

    # User 0 is the owner
    tasks.append(run_user_simulation("owner", is_owner=True))

    # Rest are visitors
    for i in range(1, NUM_USERS):
        tasks.append(run_user_simulation(f"visitor-{i}", is_owner=False))

    # Run all users concurrently
    logger.info(f"\nStarting {NUM_USERS} concurrent users...")
    await asyncio.gather(*tasks)

    # Print results
    logger.info("\n" + "=" * 80)
    logger.info("TEST RESULTS")
    logger.info("=" * 80)

    stats = metrics.get_stats()
    print(json.dumps(stats, indent=2))

    # Save to file
    output_file = f"realtime_test_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(output_file, "w") as f:
        json.dump(stats, f, indent=2)

    logger.info(f"\nResults saved to: {output_file}")

    # Summary
    logger.info("\n" + "=" * 80)
    logger.info("SUMMARY")
    logger.info("=" * 80)
    logger.info(f"✓ Connections: {stats['connections']['success']}/{NUM_USERS}")
    logger.info(f"✓ Messages Sent: {stats['messages']['sent']}")
    logger.info(f"✓ Messages Received: {stats['messages']['received']}")
    logger.info(f"✓ Avg Latency: {stats['messages']['avg_latency_ms']} ms")
    logger.info(f"✓ P95 Latency: {stats['messages']['p95_latency_ms']} ms")
    logger.info(f"✓ Broadcast Delivery: {stats['broadcast']['avg_delivery_rate']}")
    logger.info("=" * 80)


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("\n\nTest interrupted by user")
        stats = metrics.get_stats()
        print(json.dumps(stats, indent=2))
