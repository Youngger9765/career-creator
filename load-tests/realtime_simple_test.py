#!/usr/bin/env python3
"""
測試 Supabase Realtime Broadcast 是否需要特定的 topic 格式
嘗試不同的 topic 模式
"""

import asyncio
import json
import websockets
import logging

SUPABASE_URL = "https://nnjdyxiiyhawwbkfyhtr.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5uamR5eGlpeWhhd3dia2Z5aHRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3NDY3MDksImV4cCI6MjA3MzMyMjcwOX0.NPPt7gA4BJ9S5DxJKdFM3Z9jaWwPAY6cpFNoBdo-usI"

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

ws_url = SUPABASE_URL.replace("https://", "wss://")
WS_ENDPOINT = f"{ws_url}/realtime/v1/websocket"


async def test_topic(topic_name: str):
    """測試特定 topic 是否可以 join"""
    try:
        params = f"apikey={SUPABASE_ANON_KEY}&vsn=1.0.0"
        url = f"{WS_ENDPOINT}?{params}"

        async with websockets.connect(url) as ws:
            # Send join message
            join_msg = {
                "topic": topic_name,
                "event": "phx_join",
                "payload": {},
                "ref": "1",
            }

            await ws.send(json.dumps(join_msg))
            logger.info(f"Testing topic: {topic_name}")

            # Wait for reply
            response = await asyncio.wait_for(ws.recv(), timeout=5)
            data = json.loads(response)

            if data.get("event") == "phx_reply":
                status = data.get("payload", {}).get("status")
                if status == "ok":
                    logger.info(f"✅ SUCCESS: {topic_name}")
                    return True
                else:
                    reason = data.get("payload", {}).get("response", {}).get("reason", "unknown")
                    logger.warning(f"❌ FAILED: {topic_name} - {reason}")
                    return False

    except Exception as e:
        logger.error(f"❌ ERROR: {topic_name} - {e}")
        return False


async def main():
    logger.info("=" * 80)
    logger.info("Testing different Supabase Realtime topic formats")
    logger.info("=" * 80)

    # 測試不同的 topic 格式
    topics_to_test = [
        # Frontend actual format (from use-card-sync.ts)
        "realtime:room:test-123:cards:personality_analysis",

        # Short format that worked before
        "realtime:room:test-123",

        # Without cards/gameType
        "room:test-123:cards:game1",

        # Database table format
        "public:rooms",

        # Simple broadcast
        "broadcast:test",

        # Single name
        "test",
    ]

    results = {}
    for topic in topics_to_test:
        result = await test_topic(topic)
        results[topic] = result
        await asyncio.sleep(1)

    # Summary
    logger.info("\n" + "=" * 80)
    logger.info("RESULTS SUMMARY")
    logger.info("=" * 80)

    success_topics = [t for t, r in results.items() if r]
    failed_topics = [t for t, r in results.items() if not r]

    if success_topics:
        logger.info(f"\n✅ Successful topics ({len(success_topics)}):")
        for topic in success_topics:
            logger.info(f"  - {topic}")

    if failed_topics:
        logger.info(f"\n❌ Failed topics ({len(failed_topics)}):")
        for topic in failed_topics:
            logger.info(f"  - {topic}")

    logger.info("=" * 80)

    # 如果有成功的 topic，提供下一步建議
    if success_topics:
        logger.info("\n💡 建議:")
        logger.info(f"使用以下 topic 格式進行 Realtime 通訊:")
        logger.info(f"  {success_topics[0]}")
        logger.info("\n修改 frontend/src/hooks/use-card-sync.ts:")
        logger.info(f'  const channel_topic = "{success_topics[0]}";')
    else:
        logger.info("\n⚠️ 所有 topic 格式都失敗")
        logger.info("可能的原因:")
        logger.info("1. Supabase Realtime Broadcast 功能未啟用")
        logger.info("2. 需要使用 Database Realtime (監聽資料庫表格)")
        logger.info("3. 需要設定 RLS 規則")


if __name__ == "__main__":
    asyncio.run(main())
