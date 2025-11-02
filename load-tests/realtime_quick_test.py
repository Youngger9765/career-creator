#!/usr/bin/env python3
"""
Quick Realtime Test - 驗證 broadcast 是否正常運作
簡化版測試：5 users, 30 seconds
"""

import os
import json
import time
import asyncio
import logging
from collections import defaultdict
import websockets

# Configuration
SUPABASE_URL = "https://nnjdyxiiyhawwbkfyhtr.supabase.co"
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")

if not SUPABASE_ANON_KEY:
    raise ValueError("SUPABASE_ANON_KEY environment variable is required")

NUM_USERS = 5
TEST_DURATION_SEC = 30
ROOM_ID = f"quick-test-{int(time.time())}"
GAME_TYPE = "personality_analysis"

ws_url = SUPABASE_URL.replace("https://", "wss://")
WS_ENDPOINT = f"{ws_url}/realtime/v1/websocket"

logging.basicConfig(
    level=logging.DEBUG, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s", datefmt="%H:%M:%S"
)
logger = logging.getLogger("RealtimeTest")

# Metrics
messages_sent = []
messages_received = defaultdict(list)  # user_id -> list of received msgs


class QuickClient:
    def __init__(self, user_id: str):
        self.user_id = user_id
        self.ws = None
        self.connected = False
        self.ref_counter = 0
        self.channel_topic = f"realtime:room:{ROOM_ID}:cards:{GAME_TYPE}"

    async def connect(self):
        try:
            params = f"apikey={SUPABASE_ANON_KEY}&vsn=1.0.0"
            url = f"{WS_ENDPOINT}?{params}"

            self.ws = await websockets.connect(url)
            self.connected = True

            logger.info(f"[{self.user_id}] ✓ Connected")

            # Start listening
            asyncio.create_task(self._listen())

            return True

        except Exception as e:
            logger.error(f"[{self.user_id}] ✗ Connection failed: {e}")
            return False

    async def join_channel(self):
        try:
            join_msg = {
                "topic": self.channel_topic,
                "event": "phx_join",
                "payload": {},
                "ref": str(self._next_ref()),
            }

            await self.ws.send(json.dumps(join_msg))
            logger.debug(f"[{self.user_id}] → JOIN: {self.channel_topic}")

            await asyncio.sleep(1)  # Wait for join confirmation
            return True

        except Exception as e:
            logger.error(f"[{self.user_id}] ✗ Join failed: {e}")
            return False

    async def broadcast_message(self, card_id: str):
        if not self.connected:
            return

        try:
            msg_id = f"{self.user_id}-{card_id}"

            # 完全按照 frontend 的格式
            broadcast_msg = {
                "topic": self.channel_topic,
                "event": "broadcast",
                "payload": {
                    "type": "broadcast",
                    "event": "card_moved",
                    "payload": {
                        "msg_id": msg_id,
                        "cardId": card_id,
                        "fromZone": "deck",
                        "toZone": "like",
                        "timestamp": int(time.time() * 1000),
                        "performedBy": "visitor",
                        "performerName": self.user_id,
                        "performerId": self.user_id,
                    },
                },
                "ref": str(self._next_ref()),
            }

            await self.ws.send(json.dumps(broadcast_msg))
            messages_sent.append({"msg_id": msg_id, "sender": self.user_id, "time": time.time()})

            logger.info(f"[{self.user_id}] → BROADCAST: {msg_id}")

        except Exception as e:
            logger.error(f"[{self.user_id}] ✗ Broadcast failed: {e}")

    async def _listen(self):
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
        try:
            data = json.loads(message)
            event = data.get("event")

            # Log all messages for debugging
            logger.debug(f"[{self.user_id}] ← {event}: {json.dumps(data)[:200]}")

            if event == "phx_reply":
                status = data.get("payload", {}).get("status")
                if status == "ok":
                    logger.info(f"[{self.user_id}] ✓ Channel joined")
                else:
                    logger.warning(f"[{self.user_id}] ✗ Join failed: {data}")

            elif event == "broadcast":
                # 收到 broadcast 訊息
                payload = data.get("payload", {})
                if payload.get("event") == "card_moved":
                    card_data = payload.get("payload", {})
                    msg_id = card_data.get("msg_id")
                    sender_id = card_data.get("performerId")

                    # 不計算自己的訊息
                    if sender_id != self.user_id:
                        messages_received[self.user_id].append(
                            {"msg_id": msg_id, "from": sender_id, "time": time.time()}
                        )
                        logger.info(f"[{self.user_id}] ✓ RECEIVED: {msg_id} from {sender_id}")

        except json.JSONDecodeError:
            logger.warning(f"[{self.user_id}] Invalid JSON: {message[:100]}")
        except Exception as e:
            logger.error(f"[{self.user_id}] Handle error: {e}")

    async def disconnect(self):
        if self.ws:
            await self.ws.close()
            self.connected = False

    def _next_ref(self) -> int:
        self.ref_counter += 1
        return self.ref_counter


async def run_user(user_id: str):
    client = QuickClient(user_id)

    if not await client.connect():
        return

    if not await client.join_channel():
        return

    # 等待所有人加入
    await asyncio.sleep(3)

    # 每個人發送 3 條訊息，間隔 3 秒
    for i in range(3):
        card_id = f"card-{i}"
        await client.broadcast_message(card_id)
        await asyncio.sleep(3)

    # 等待最後的訊息
    await asyncio.sleep(5)

    await client.disconnect()
    logger.info(f"[{user_id}] Done")


async def main():
    logger.info("=" * 80)
    logger.info(f"Quick Realtime Test - {NUM_USERS} users, {TEST_DURATION_SEC}s")
    logger.info(f"Room: {ROOM_ID}")
    logger.info("=" * 80)

    tasks = [run_user(f"user-{i}") for i in range(NUM_USERS)]

    await asyncio.gather(*tasks)

    # Results
    logger.info("\n" + "=" * 80)
    logger.info("RESULTS")
    logger.info("=" * 80)
    logger.info(f"Messages sent: {len(messages_sent)}")

    total_received = sum(len(msgs) for msgs in messages_received.values())
    logger.info(f"Messages received: {total_received}")

    # Expected: each user sends 3 messages, 4 other users should receive each
    expected = len(messages_sent) * (NUM_USERS - 1)
    delivery_rate = (total_received / expected * 100) if expected > 0 else 0

    logger.info(f"Expected total: {expected}")
    logger.info(f"Delivery rate: {delivery_rate:.1f}%")

    # Per-user breakdown
    logger.info("\nPer-user received:")
    for user_id, msgs in messages_received.items():
        logger.info(f"  {user_id}: {len(msgs)} messages")

    logger.info("=" * 80)


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("\nTest interrupted")
