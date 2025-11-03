#!/usr/bin/env python3
"""
Test 4: 訪客加入房間壓力測試
測試 50 個訪客同時加入同一個房間

場景:
1. 創建 1 個測試房間 (owner)
2. 50 個訪客同時透過 share_code 加入
3. 測試 visitor 表 UNIQUE constraint
4. 測試 heartbeat 並發更新
5. 驗證無重複 visitor 記錄
"""

import os
import sys
import json
import time
import asyncio
import logging
from datetime import datetime
from typing import Dict, List
from collections import defaultdict
import requests

# Configuration
API_BASE_URL = os.getenv("API_URL", "https://career-creator-backend-staging-x43mdhfwsq-de.a.run.app")
NUM_VISITORS = 50
HEARTBEAT_INTERVAL = 30  # seconds

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S"
)
logger = logging.getLogger(__name__)


class VisitorMetrics:
    """收集訪客加入測試指標"""

    def __init__(self):
        self.joins_attempted = 0
        self.joins_succeeded = 0
        self.joins_failed = 0
        self.join_times = []
        self.heartbeats_sent = 0
        self.heartbeats_succeeded = 0
        self.heartbeats_failed = 0
        self.heartbeat_times = []
        self.duplicate_visitors = 0
        self.errors = defaultdict(int)
        self.visitor_ids = set()
        self.start_time = time.time()

    def record_join(self, success: bool, duration_ms: float, visitor_id: str = None, error: str = None):
        self.joins_attempted += 1
        if success:
            self.joins_succeeded += 1
            self.join_times.append(duration_ms)
            if visitor_id:
                if visitor_id in self.visitor_ids:
                    self.duplicate_visitors += 1
                    logger.error(f"⚠ DUPLICATE VISITOR ID: {visitor_id}")
                else:
                    self.visitor_ids.add(visitor_id)
        else:
            self.joins_failed += 1
            if error:
                self.errors[error] += 1

    def record_heartbeat(self, success: bool, duration_ms: float, error: str = None):
        self.heartbeats_sent += 1
        if success:
            self.heartbeats_succeeded += 1
            self.heartbeat_times.append(duration_ms)
        else:
            self.heartbeats_failed += 1
            if error:
                self.errors[f"heartbeat_{error}"] += 1

    def get_stats(self) -> Dict:
        avg_join = sum(self.join_times) / len(self.join_times) if self.join_times else 0
        avg_heartbeat = sum(self.heartbeat_times) / len(self.heartbeat_times) if self.heartbeat_times else 0

        p95_join = sorted(self.join_times)[int(len(self.join_times) * 0.95)] if self.join_times else 0
        p95_heartbeat = sorted(self.heartbeat_times)[int(len(self.heartbeat_times) * 0.95)] if self.heartbeat_times else 0

        join_rate = (self.joins_succeeded / self.joins_attempted * 100) if self.joins_attempted > 0 else 0
        heartbeat_rate = (self.heartbeats_succeeded / self.heartbeats_sent * 100) if self.heartbeats_sent > 0 else 0

        return {
            "test_config": {
                "num_visitors": NUM_VISITORS,
                "heartbeat_interval_sec": HEARTBEAT_INTERVAL
            },
            "joins": {
                "attempted": self.joins_attempted,
                "succeeded": self.joins_succeeded,
                "failed": self.joins_failed,
                "success_rate": f"{join_rate:.2f}%",
                "avg_time_ms": round(avg_join, 2),
                "p95_time_ms": round(p95_join, 2)
            },
            "heartbeats": {
                "sent": self.heartbeats_sent,
                "succeeded": self.heartbeats_succeeded,
                "failed": self.heartbeats_failed,
                "success_rate": f"{heartbeat_rate:.2f}%",
                "avg_time_ms": round(avg_heartbeat, 2),
                "p95_time_ms": round(p95_heartbeat, 2)
            },
            "data_integrity": {
                "unique_visitors": len(self.visitor_ids),
                "duplicate_count": self.duplicate_visitors,
                "expected_unique": NUM_VISITORS
            },
            "errors": dict(self.errors),
            "test_duration_actual_sec": round(time.time() - self.start_time, 2)
        }


metrics = VisitorMetrics()


class RoomOwner:
    """房間擁有者 (諮詢師)"""

    def __init__(self):
        self.email = "test.user1@example.com"
        self.password = "TestPassword123!"  # pragma: allowlist secret
        self.token = None
        self.room_id = None
        self.share_code = None

    def login(self) -> bool:
        """登入"""
        try:
            response = requests.post(
                f"{API_BASE_URL}/api/auth/login",
                json={"email": self.email, "password": self.password},
                timeout=30
            )
            if response.status_code == 200:
                data = response.json()
                self.token = data["access_token"]
                logger.info("[Owner] ✓ Logged in")
                return True
            else:
                logger.error(f"[Owner] ✗ Login failed: {response.status_code}")
                return False
        except Exception as e:
            logger.error(f"[Owner] ✗ Login error: {e}")
            return False

    def create_room(self) -> bool:
        """創建測試房間"""
        try:
            response = requests.post(
                f"{API_BASE_URL}/api/rooms/",
                json={"name": "Visitor Join Test Room"},
                headers={"Authorization": f"Bearer {self.token}"},
                timeout=30
            )
            if response.status_code == 201:
                data = response.json()
                self.room_id = data["id"]
                self.share_code = data["share_code"]
                logger.info(f"[Owner] ✓ Created room {self.room_id}")
                logger.info(f"[Owner] ✓ Share code: {self.share_code}")
                return True
            else:
                logger.error(f"[Owner] ✗ Room creation failed: {response.status_code}")
                return False
        except Exception as e:
            logger.error(f"[Owner] ✗ Room creation error: {e}")
            return False

    def get_visitor_count(self) -> int:
        """取得房間內訪客數量"""
        try:
            response = requests.get(
                f"{API_BASE_URL}/api/visitors/room/{self.room_id}",
                headers={"Authorization": f"Bearer {self.token}"},
                timeout=30
            )
            if response.status_code == 200:
                visitors = response.json()
                return len(visitors)
            else:
                return -1
        except Exception as e:
            logger.error(f"[Owner] ✗ Get visitors error: {e}")
            return -1


class Visitor:
    """訪客"""

    def __init__(self, visitor_num: int, share_code: str):
        self.visitor_num = visitor_num
        self.name = f"Visitor-{visitor_num}"
        self.share_code = share_code
        self.visitor_id = None
        self.heartbeat_count = 0

    def join_room(self) -> bool:
        """加入房間"""
        start = time.time()

        try:
            response = requests.post(
                f"{API_BASE_URL}/api/visitors/join-room/{self.share_code}",
                json={"name": self.name, "session_id": f"session-{self.visitor_num}"},
                timeout=30
            )

            duration_ms = (time.time() - start) * 1000

            if response.status_code == 201:
                data = response.json()
                self.visitor_id = data["id"]
                metrics.record_join(True, duration_ms, self.visitor_id)
                logger.info(f"[{self.name}] ✓ Joined room in {duration_ms:.0f}ms")
                return True
            else:
                error = f"HTTP {response.status_code}"
                metrics.record_join(False, duration_ms, error=error)
                error_detail = response.text[:200] if response.text else "No error details"
                logger.error(f"[{self.name}] ✗ Join failed: {error} - {error_detail}")
                return False

        except Exception as e:
            duration_ms = (time.time() - start) * 1000
            error = str(type(e).__name__)
            metrics.record_join(False, duration_ms, error=error)
            logger.error(f"[{self.name}] ✗ Join error: {e}")
            return False

    def send_heartbeat(self) -> bool:
        """發送 heartbeat"""
        if not self.visitor_id:
            return False

        start = time.time()

        try:
            response = requests.put(
                f"{API_BASE_URL}/api/visitors/{self.visitor_id}/heartbeat",
                timeout=30
            )

            duration_ms = (time.time() - start) * 1000

            if response.status_code == 200:
                metrics.record_heartbeat(True, duration_ms)
                self.heartbeat_count += 1
                logger.debug(f"[{self.name}] ✓ Heartbeat #{self.heartbeat_count} in {duration_ms:.0f}ms")
                return True
            else:
                error = f"HTTP {response.status_code}"
                metrics.record_heartbeat(False, duration_ms, error)
                logger.error(f"[{self.name}] ✗ Heartbeat failed: {error}")
                return False

        except Exception as e:
            duration_ms = (time.time() - start) * 1000
            error = str(type(e).__name__)
            metrics.record_heartbeat(False, duration_ms, error)
            logger.error(f"[{self.name}] ✗ Heartbeat error: {e}")
            return False

    async def run(self):
        """執行訪客測試流程"""
        # 1. 加入房間
        if not self.join_room():
            return

        # 2. 持續發送 heartbeat (1 分鐘)
        end_time = time.time() + 60
        last_heartbeat = time.time()

        while time.time() < end_time:
            current_time = time.time()

            # 每 HEARTBEAT_INTERVAL 秒發送 heartbeat
            if current_time - last_heartbeat >= HEARTBEAT_INTERVAL:
                self.send_heartbeat()
                last_heartbeat = current_time

            await asyncio.sleep(5)

        logger.info(f"[{self.name}] Completed ({self.heartbeat_count} heartbeats)")


async def main():
    """主測試函數"""
    logger.info("=" * 80)
    logger.info("Test 4: 訪客加入房間壓力測試")
    logger.info(f"Visitors: {NUM_VISITORS}")
    logger.info(f"Heartbeat Interval: {HEARTBEAT_INTERVAL}s")
    logger.info("=" * 80)

    # 1. Owner 登入並創建房間
    owner = RoomOwner()
    if not owner.login():
        logger.error("Owner login failed, aborting test")
        return

    if not owner.create_room():
        logger.error("Room creation failed, aborting test")
        return

    # 2. 創建所有訪客
    visitors = [Visitor(i, owner.share_code) for i in range(NUM_VISITORS)]

    # 3. 並發加入房間
    logger.info(f"\n{NUM_VISITORS} visitors joining simultaneously...")
    tasks = [visitor.run() for visitor in visitors]
    await asyncio.gather(*tasks)

    # 4. 等待一下讓所有操作完成
    await asyncio.sleep(2)

    # 5. 驗證訪客數量
    visitor_count = owner.get_visitor_count()
    logger.info(f"\n[Owner] Visitor count in room: {visitor_count}")

    # 輸出結果
    logger.info("\n" + "=" * 80)
    logger.info("TEST RESULTS")
    logger.info("=" * 80)

    stats = metrics.get_stats()
    print(json.dumps(stats, indent=2))

    # 保存結果
    output_file = f"visitor_join_test_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(output_file, "w") as f:
        json.dump(stats, f, indent=2)

    logger.info(f"\nResults saved to: {output_file}")

    # Summary
    logger.info("\n" + "=" * 80)
    logger.info("SUMMARY")
    logger.info("=" * 80)
    logger.info(f"✓ Joins: {stats['joins']['succeeded']}/{stats['joins']['attempted']} ({stats['joins']['success_rate']})")
    logger.info(f"✓ Avg Join Time: {stats['joins']['avg_time_ms']} ms")
    logger.info(f"✓ P95 Join Time: {stats['joins']['p95_time_ms']} ms")
    logger.info(f"✓ Heartbeats: {stats['heartbeats']['succeeded']}/{stats['heartbeats']['sent']} ({stats['heartbeats']['success_rate']})")
    logger.info(f"✓ Unique Visitors: {stats['data_integrity']['unique_visitors']}")
    logger.info(f"✓ Duplicates: {stats['data_integrity']['duplicate_count']}")
    logger.info(f"✓ Visitor Count (API): {visitor_count}")

    # 檢查資料完整性
    if stats['data_integrity']['duplicate_count'] > 0:
        logger.error(f"\n⚠ DATA INTEGRITY ISSUE: {stats['data_integrity']['duplicate_count']} duplicate visitor IDs!")

    if stats['data_integrity']['unique_visitors'] != NUM_VISITORS:
        logger.warning(f"\n⚠ Expected {NUM_VISITORS} unique visitors, got {stats['data_integrity']['unique_visitors']}")

    if stats['errors']:
        logger.info(f"\n⚠ Errors encountered:")
        for error, count in stats['errors'].items():
            logger.info(f"  - {error}: {count}")

    logger.info("=" * 80)


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("\n\nTest interrupted by user")
        stats = metrics.get_stats()
        print(json.dumps(stats, indent=2))
