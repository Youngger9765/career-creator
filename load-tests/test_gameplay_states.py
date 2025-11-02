#!/usr/bin/env python3
"""
Test 3: Gameplay States 並發保存測試
測試 50 個使用者同時玩遊戲並保存狀態

場景:
1. 50 個 owners 各自創建房間
2. 每個人玩不同遊戲模式
3. 每 30 秒自動保存狀態
4. 模擬 5 分鐘遊戲過程
5. 驗證狀態是否正確保存並可讀取
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
NUM_USERS = int(os.getenv("NUM_USERS", "100"))
TEST_DURATION_SEC = 60
SAVE_INTERVAL_SEC = 30

# Game types to test
GAME_TYPES = [
    "personality_analysis",
    "career_collector",
    "advantage_analysis",
    "growth_planning",
    "position_breakdown",
    "value_ranking",
    "life_transformation"
]

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S"
)
logger = logging.getLogger(__name__)


class GameplayMetrics:
    """收集 Gameplay States 測試指標"""

    def __init__(self):
        self.saves_attempted = 0
        self.saves_succeeded = 0
        self.saves_failed = 0
        self.loads_attempted = 0
        self.loads_succeeded = 0
        self.loads_failed = 0
        self.save_times = []
        self.load_times = []
        self.errors = defaultdict(int)
        self.data_integrity_ok = 0
        self.data_integrity_fail = 0
        self.start_time = time.time()

    def record_save(self, success: bool, duration_ms: float, error: str = None):
        self.saves_attempted += 1
        if success:
            self.saves_succeeded += 1
            self.save_times.append(duration_ms)
        else:
            self.saves_failed += 1
            if error:
                self.errors[error] += 1

    def record_load(self, success: bool, duration_ms: float, error: str = None):
        self.loads_attempted += 1
        if success:
            self.loads_succeeded += 1
            self.load_times.append(duration_ms)
        else:
            self.loads_failed += 1
            if error:
                self.errors[error] += 1

    def record_integrity(self, valid: bool):
        if valid:
            self.data_integrity_ok += 1
        else:
            self.data_integrity_fail += 1

    def get_stats(self) -> Dict:
        avg_save = sum(self.save_times) / len(self.save_times) if self.save_times else 0
        avg_load = sum(self.load_times) / len(self.load_times) if self.load_times else 0

        p95_save = sorted(self.save_times)[int(len(self.save_times) * 0.95)] if self.save_times else 0
        p95_load = sorted(self.load_times)[int(len(self.load_times) * 0.95)] if self.load_times else 0

        save_rate = (self.saves_succeeded / self.saves_attempted * 100) if self.saves_attempted > 0 else 0
        load_rate = (self.loads_succeeded / self.loads_attempted * 100) if self.loads_attempted > 0 else 0
        integrity_rate = (self.data_integrity_ok / (self.data_integrity_ok + self.data_integrity_fail) * 100) if (self.data_integrity_ok + self.data_integrity_fail) > 0 else 0

        return {
            "test_config": {
                "num_users": NUM_USERS,
                "duration_sec": TEST_DURATION_SEC,
                "save_interval_sec": SAVE_INTERVAL_SEC
            },
            "saves": {
                "attempted": self.saves_attempted,
                "succeeded": self.saves_succeeded,
                "failed": self.saves_failed,
                "success_rate": f"{save_rate:.2f}%",
                "avg_time_ms": round(avg_save, 2),
                "p95_time_ms": round(p95_save, 2)
            },
            "loads": {
                "attempted": self.loads_attempted,
                "succeeded": self.loads_succeeded,
                "failed": self.loads_failed,
                "success_rate": f"{load_rate:.2f}%",
                "avg_time_ms": round(avg_load, 2),
                "p95_time_ms": round(p95_load, 2)
            },
            "data_integrity": {
                "valid": self.data_integrity_ok,
                "invalid": self.data_integrity_fail,
                "integrity_rate": f"{integrity_rate:.2f}%"
            },
            "errors": dict(self.errors),
            "test_duration_actual_sec": round(time.time() - self.start_time, 2)
        }


metrics = GameplayMetrics()


class GameplayUser:
    """模擬使用者玩遊戲並保存狀態"""

    def __init__(self, user_id: int):
        self.user_id = user_id
        self.email = f"test.user{user_id}@example.com"
        self.password = "TestPassword123!"
        self.token = None
        self.room_id = None
        self.game_type = GAME_TYPES[user_id % len(GAME_TYPES)]
        self.save_count = 0

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
                logger.info(f"[User {self.user_id}] ✓ Logged in")
                return True
            else:
                logger.error(f"[User {self.user_id}] ✗ Login failed: {response.status_code}")
                return False
        except Exception as e:
            logger.error(f"[User {self.user_id}] ✗ Login error: {e}")
            return False

    def create_room(self) -> bool:
        """創建房間"""
        try:
            response = requests.post(
                f"{API_BASE_URL}/api/rooms/",
                json={"name": f"Test Room {self.user_id}"},
                headers={"Authorization": f"Bearer {self.token}"},
                timeout=30
            )
            if response.status_code == 201:
                data = response.json()
                self.room_id = data["id"]
                logger.info(f"[User {self.user_id}] ✓ Created room {self.room_id}")
                return True
            else:
                logger.error(f"[User {self.user_id}] ✗ Room creation failed: {response.status_code}")
                return False
        except Exception as e:
            logger.error(f"[User {self.user_id}] ✗ Room creation error: {e}")
            return False

    def generate_game_state(self) -> Dict:
        """生成遊戲狀態資料"""
        self.save_count += 1

        # 模擬真實遊戲狀態
        state = {
            "game_type": self.game_type,
            "cards": {},
            "metadata": {
                "user_id": self.user_id,
                "save_count": self.save_count,
                "timestamp": int(time.time() * 1000)
            }
        }

        # 根據遊戲類型生成不同的牌卡狀態
        if self.game_type == "personality_analysis":
            # 六大性格分析: 三欄分類
            for i in range(20):
                zone = ["like", "neutral", "dislike"][i % 3]
                state["cards"][f"card-{i}"] = {"zone": zone, "index": i}

        elif self.game_type == "value_ranking":
            # 價值觀排序: 排序
            for i in range(15):
                state["cards"][f"value-{i}"] = {"zone": "ranked", "index": i, "rank": i + 1}

        elif self.game_type == "life_transformation":
            # 生活改造王: 籌碼分配
            state["settings"] = {
                "totalTokens": 100,
                "allocations": {
                    "work": 30,
                    "family": 25,
                    "health": 20,
                    "hobby": 15,
                    "study": 10
                }
            }

        else:
            # 其他遊戲: 基本牌卡狀態
            for i in range(10):
                state["cards"][f"card-{i}"] = {"zone": "placed", "index": i}

        return state

    def save_game_state(self) -> bool:
        """保存遊戲狀態"""
        start = time.time()

        try:
            state = self.generate_game_state()

            response = requests.put(
                f"{API_BASE_URL}/api/rooms/{self.room_id}/gameplay-states/{self.game_type}",
                json={"state": state},
                headers={"Authorization": f"Bearer {self.token}"},
                timeout=30
            )

            duration_ms = (time.time() - start) * 1000

            if response.status_code == 200:
                metrics.record_save(True, duration_ms)
                logger.debug(f"[User {self.user_id}] ✓ Saved state #{self.save_count} in {duration_ms:.0f}ms")
                return True
            else:
                error = f"HTTP {response.status_code}"
                metrics.record_save(False, duration_ms, error)
                logger.error(f"[User {self.user_id}] ✗ Save failed: {error}")
                return False

        except Exception as e:
            duration_ms = (time.time() - start) * 1000
            error = str(type(e).__name__)
            metrics.record_save(False, duration_ms, error)
            logger.error(f"[User {self.user_id}] ✗ Save error: {e}")
            return False

    def load_game_state(self) -> bool:
        """讀取遊戲狀態並驗證完整性"""
        start = time.time()

        try:
            response = requests.get(
                f"{API_BASE_URL}/api/rooms/{self.room_id}/gameplay-states/{self.game_type}",
                headers={"Authorization": f"Bearer {self.token}"},
                timeout=30
            )

            duration_ms = (time.time() - start) * 1000

            if response.status_code == 200:
                metrics.record_load(True, duration_ms)

                # 驗證資料完整性
                data = response.json()
                game_state = data.get("game_state", {})

                # 檢查必要欄位
                has_cards = "cards" in game_state or "settings" in game_state
                has_metadata = "metadata" in game_state
                correct_type = game_state.get("game_type") == self.game_type

                is_valid = has_cards and has_metadata and correct_type
                metrics.record_integrity(is_valid)

                if is_valid:
                    logger.debug(f"[User {self.user_id}] ✓ Loaded state in {duration_ms:.0f}ms")
                else:
                    logger.warning(f"[User {self.user_id}] ⚠ Data integrity issue")

                return True
            else:
                error = f"HTTP {response.status_code}"
                metrics.record_load(False, duration_ms, error)
                logger.error(f"[User {self.user_id}] ✗ Load failed: {error}")
                return False

        except Exception as e:
            duration_ms = (time.time() - start) * 1000
            error = str(type(e).__name__)
            metrics.record_load(False, duration_ms, error)
            logger.error(f"[User {self.user_id}] ✗ Load error: {e}")
            return False

    async def run(self):
        """執行完整測試流程"""
        # 1. 登入
        if not self.login():
            return

        # 2. 創建房間
        if not self.create_room():
            return

        # 3. 模擬遊戲過程
        logger.info(f"[User {self.user_id}] Starting game: {self.game_type}")

        end_time = time.time() + TEST_DURATION_SEC
        last_save = 0

        while time.time() < end_time:
            current_time = time.time()

            # 每 SAVE_INTERVAL_SEC 秒保存一次
            if current_time - last_save >= SAVE_INTERVAL_SEC:
                self.save_game_state()
                last_save = current_time

            # 隨機等待 1-3 秒 (模擬遊戲操作)
            await asyncio.sleep(1 + (self.save_count % 2))

        # 4. 最後保存並驗證
        self.save_game_state()
        await asyncio.sleep(1)
        self.load_game_state()

        logger.info(f"[User {self.user_id}] Completed ({self.save_count} saves)")


async def main():
    """主測試函數"""
    logger.info("=" * 80)
    logger.info("Test 3: Gameplay States 並發保存測試")
    logger.info(f"Users: {NUM_USERS}")
    logger.info(f"Duration: {TEST_DURATION_SEC}s")
    logger.info(f"Save Interval: {SAVE_INTERVAL_SEC}s")
    logger.info("=" * 80)

    # 創建所有使用者
    users = [GameplayUser(i) for i in range(NUM_USERS)]

    # 並發執行
    logger.info(f"\nStarting {NUM_USERS} concurrent users...")
    tasks = [user.run() for user in users]
    await asyncio.gather(*tasks)

    # 輸出結果
    logger.info("\n" + "=" * 80)
    logger.info("TEST RESULTS")
    logger.info("=" * 80)

    stats = metrics.get_stats()
    print(json.dumps(stats, indent=2))

    # 保存結果
    output_file = f"gameplay_states_test_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(output_file, "w") as f:
        json.dump(stats, f, indent=2)

    logger.info(f"\nResults saved to: {output_file}")

    # Summary
    logger.info("\n" + "=" * 80)
    logger.info("SUMMARY")
    logger.info("=" * 80)
    logger.info(f"✓ Saves: {stats['saves']['succeeded']}/{stats['saves']['attempted']} ({stats['saves']['success_rate']})")
    logger.info(f"✓ Loads: {stats['loads']['succeeded']}/{stats['loads']['attempted']} ({stats['loads']['success_rate']})")
    logger.info(f"✓ Avg Save Time: {stats['saves']['avg_time_ms']} ms")
    logger.info(f"✓ P95 Save Time: {stats['saves']['p95_time_ms']} ms")
    logger.info(f"✓ Data Integrity: {stats['data_integrity']['integrity_rate']}")

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
