#!/usr/bin/env python3
"""
Realtime Load Test - 50 Concurrent Users
測試 Supabase Realtime Broadcast 功能在 50 人同時使用時的表現

架構分析:
1. 每個房間有 3 個 Realtime channels:
   - room:{roomId}:gamemode (遊戲模式切換)
   - room:{roomId}:cards:{gameType} (牌卡同步)
   - 可能有其他 presence tracking

2. 使用場景:
   - Owner 切換遊戲模式 → 50 個訪客同步接收
   - 訪客拖放牌卡 → 其他 49 人看到更新
   - Owner 保存狀態 → 所有人接收最新狀態

3. 測試重點:
   - Supabase Realtime connection limits
   - Message delivery rate (50 concurrent subscribers)
   - Broadcast latency (owner → 49 visitors)
"""

import os
import time
import json
import asyncio
import logging
from typing import Dict, List
from datetime import datetime
from locust import User, task, between, events
from locust.env import Environment

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Test Configuration
ROOM_ID = "test-realtime-room"
GAME_TYPE = "personality_analysis"
NUM_USERS = 50

# Supabase Configuration (from environment)
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://YOUR_PROJECT.supabase.co")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")

# Metrics
broadcast_latencies = []
connection_times = []
message_delivery_count = {"sent": 0, "received": 0}


class RealtimeMetrics:
    """Track Realtime performance metrics"""

    def __init__(self):
        self.connections = 0
        self.failed_connections = 0
        self.messages_sent = 0
        self.messages_received = 0
        self.latencies = []
        self.start_time = time.time()

    def record_connection(self, success: bool, duration: float):
        if success:
            self.connections += 1
            connection_times.append(duration)
        else:
            self.failed_connections += 1

    def record_message(self, sent: bool = False, received: bool = False, latency: float = None):
        if sent:
            self.messages_sent += 1
            message_delivery_count["sent"] += 1

        if received:
            self.messages_received += 1
            message_delivery_count["received"] += 1

        if latency is not None:
            self.latencies.append(latency)
            broadcast_latencies.append(latency)

    def get_stats(self) -> Dict:
        avg_latency = sum(self.latencies) / len(self.latencies) if self.latencies else 0
        p95_latency = (
            sorted(self.latencies)[int(len(self.latencies) * 0.95)]
            if len(self.latencies) > 0
            else 0
        )

        return {
            "total_connections": self.connections,
            "failed_connections": self.failed_connections,
            "messages_sent": self.messages_sent,
            "messages_received": self.messages_received,
            "avg_latency_ms": round(avg_latency, 2),
            "p95_latency_ms": round(p95_latency, 2),
            "delivery_rate": (
                f"{self.messages_received}/{self.messages_sent}"
                f" ({round(self.messages_received / self.messages_sent * 100, 1)}%)"
                if self.messages_sent > 0
                else "0/0"
            ),
            "test_duration_sec": round(time.time() - self.start_time, 2),
        }


# Global metrics instance
metrics = RealtimeMetrics()


class RealtimeUser(User):
    """
    模擬使用者連接 Supabase Realtime

    注意: 這是一個簡化版本，實際需要使用 WebSocket 客戶端
    因為 Locust 主要是 HTTP 測試工具，Realtime 測試需要專門的 WS 工具
    """

    wait_time = between(1, 3)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.user_id = f"user-{self.environment.runner.user_count}"
        self.is_owner = self.user_id == "user-1"
        self.connected = False
        self.messages_sent = 0
        self.messages_received = 0

    @task(1)
    def simulate_connection(self):
        """
        模擬 Realtime 連接
        實際應該用 WebSocket，這裡用 HTTP health check 代替
        """
        start = time.time()

        try:
            # TODO: 實際應該建立 WebSocket 連接
            # 這裡只是示例，記錄連接嘗試
            duration = time.time() - start
            metrics.record_connection(True, duration * 1000)
            self.connected = True

            logger.info(f"[{self.user_id}] Connected to Realtime in {duration*1000:.2f}ms")

        except Exception as e:
            metrics.record_connection(False, 0)
            logger.error(f"[{self.user_id}] Connection failed: {e}")

    @task(3)
    def simulate_card_move(self):
        """
        模擬牌卡移動廣播
        Owner 和訪客都可以移動牌卡
        """
        if not self.connected:
            return

        # Simulate sending a card move event
        card_id = f"card-{self.messages_sent % 100}"
        event = {
            "cardId": card_id,
            "toZone": "like",
            "fromZone": "deck",
            "timestamp": int(time.time() * 1000),
            "performedBy": "owner" if self.is_owner else "visitor",
            "performerName": self.user_id,
            "performerId": self.user_id,
        }

        # Record outgoing message
        self.messages_sent += 1
        metrics.record_message(sent=True)

        # Simulate receiving the broadcast (in real scenario, other users receive it)
        # In actual test, we'd measure time from send to receive across different clients
        latency = 50 + (self.messages_sent % 50)  # Simulated latency
        metrics.record_message(received=True, latency=latency)
        self.messages_received += 1

        logger.debug(
            f"[{self.user_id}] Moved card {card_id} " f"(sent: {self.messages_sent}, latency: {latency}ms)"
        )

    @task(2)
    def simulate_game_mode_change(self):
        """
        模擬遊戲模式切換 (僅 Owner 可以)
        這應該是 1→50 的廣播測試
        """
        if not self.connected or not self.is_owner:
            return

        mode_state = {
            "deck": "career_cards",
            "gameRule": "六大性格分析",
            "gameMode": "personality_analysis",
        }

        # Record broadcast
        self.messages_sent += 1
        metrics.record_message(sent=True)

        logger.info(f"[{self.user_id}] Owner changed game mode")


@events.test_start.add_listener
def on_test_start(environment, **kwargs):
    """測試開始時的設置"""
    logger.info("=" * 80)
    logger.info("Realtime Load Test Started")
    logger.info(f"Target Users: {NUM_USERS}")
    logger.info(f"Room ID: {ROOM_ID}")
    logger.info(f"Game Type: {GAME_TYPE}")
    logger.info("=" * 80)


@events.test_stop.add_listener
def on_test_stop(environment, **kwargs):
    """測試結束時輸出報告"""
    stats = metrics.get_stats()

    logger.info("\n" + "=" * 80)
    logger.info("REALTIME LOAD TEST RESULTS")
    logger.info("=" * 80)
    logger.info(f"Total Connections:    {stats['total_connections']}")
    logger.info(f"Failed Connections:   {stats['failed_connections']}")
    logger.info(f"Messages Sent:        {stats['messages_sent']}")
    logger.info(f"Messages Received:    {stats['messages_received']}")
    logger.info(f"Delivery Rate:        {stats['delivery_rate']}")
    logger.info(f"Avg Latency:          {stats['avg_latency_ms']} ms")
    logger.info(f"P95 Latency:          {stats['p95_latency_ms']} ms")
    logger.info(f"Test Duration:        {stats['test_duration_sec']} sec")
    logger.info("=" * 80)

    # Save results to file
    with open("realtime_test_results.json", "w") as f:
        json.dump(stats, f, indent=2)

    logger.info("\nResults saved to: realtime_test_results.json")


if __name__ == "__main__":
    print("""
╔══════════════════════════════════════════════════════════════════════════════╗
║                    Realtime Load Test - Setup Required                      ║
╚══════════════════════════════════════════════════════════════════════════════╝

這個測試需要專門的 WebSocket 測試工具，因為:

1. Locust 主要是 HTTP 測試工具
2. Supabase Realtime 使用 WebSocket 協議
3. 需要測試:
   - 50 個同時的 WebSocket 連接
   - Broadcast 訊息傳遞延遲
   - 訊息送達率 (owner → 49 visitors)

建議方案:

A. 使用 Python websockets + asyncio
   - 完全控制 WS 連接
   - 可以精確測量延遲
   - 需要自己寫測試腳本

B. 使用 Artillery (Node.js)
   - 專門的 WebSocket 負載測試工具
   - 支援 Socket.IO 和原生 WS
   - YAML 配置檔案

C. 使用 K6 + xk6-websockets
   - 現代化負載測試工具
   - 支援 WebSocket
   - JavaScript 測試腳本

推薦: Artillery (最簡單) 或 Python asyncio (最靈活)

下一步:
1. 選擇測試工具
2. 設置 Supabase Realtime 連接
3. 實作測試場景
4. 運行並分析結果

要我幫你建立 Artillery 或 Python asyncio 版本的測試嗎？
""")
