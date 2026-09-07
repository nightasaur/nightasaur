#!/usr/bin/env python3
"""Nightasaur 背景任務處理器 — 獨立執行"""
import httpx, asyncio, time

AI_ENGINE = "http://localhost:8000"

async def process_pending_tasks():
    """定時檢查並觸發後端的圖片生成佇列"""
    print("[Worker] Nightasaur Background Worker started")
    while True:
        try:
            async with httpx.AsyncClient(timeout=30) as c:
                r = await c.post("http://localhost:3000/api/generate/process")
                if r.status_code == 200:
                    data = r.json()
                    if data.get("processed", 0) > 0:
                        print(f"[Worker] Processed {data['processed']} tasks")
        except Exception as e:
            pass  # 後端可能未啟動
        await asyncio.sleep(300)  # 每 5 分鐘

if __name__ == "__main__":
    asyncio.run(process_pending_tasks())