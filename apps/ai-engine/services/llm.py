"""Ollama LLM 對話服務"""
import httpx
import json
from config import OLLAMA_URL, OLLAMA_MODEL


class LLMService:
    def __init__(self):
        self.base_url = OLLAMA_URL
        self.model = OLLAMA_MODEL

    async def chat(self, messages: list[dict]) -> str:
        """與 Ollama LLM 對話"""
        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                response = await client.post(
                    f"{self.base_url}/api/chat",
                    json={
                        "model": self.model,
                        "messages": messages,
                        "stream": False,
                        "options": {
                            "temperature": 0.8,
                            "top_p": 0.9,
                            "num_predict": 256,
                        },
                    },
                )
                if response.status_code == 200:
                    data = response.json()
                    return data["message"]["content"].strip()
                else:
                    print(f"[LLM Error] HTTP {response.status_code}: {response.text[:200]}")
                    return "嗚...我暫時無法回應。請稍後再試。"
        except httpx.ConnectError:
            print(f"[LLM Error] Cannot connect to Ollama at {self.base_url}")
            return "嘎嗚～（AI 引擎尚未啟動，請先執行 Ollama）"
        except Exception as e:
            print(f"[LLM Error] {e}")
            return "嘎嗚～（通訊暫時中斷...）"

    async def generate_story(self, prompt: str) -> str:
        """生成精靈背景故事"""
        messages = [
            {
                "role": "system",
                "content": (
                    "你是 Nightasaur 世界的故事講述者。"
                    "用繁體中文為奇幻精靈創作短篇背景故事。"
                    "3-5 句話，語氣溫暖、魔法、富有想像力。"
                    "故事要生動、有畫面感。"
                ),
            },
            {"role": "user", "content": prompt},
        ]
        return await self.chat(messages)

    async def generate_dialogue(
        self,
        spirit_info: dict,
        message: str,
        history: list[dict] = None,
    ) -> str:
        """生成精靈對話回覆 — 含上下文記憶"""
        name = spirit_info.get("name", "精靈")
        element = spirit_info.get("element", "未知")
        personality = spirit_info.get("personality", "友善活潑")
        stage = spirit_info.get("stage", "幼體")
        backstory = spirit_info.get("backstory", "")

        element_cn = {
            "FIRE": "🔥 火焰", "WATER": "💧 水流", "LIGHT": "✨ 光",
            "SHADOW": "🌑 暗影", "STAR": "⭐ 星辰", "ILLUSION": "🦊 幻象",
            "MOON": "🌙 月光", "NATURE": "🌿 自然", "THUNDER": "⚡ 雷電", "ICE": "❄️ 冰霜",
        }

        system_prompt = f"""你是名叫「{name}」的精靈，存在於 Nightasaur 的奇幻世界中。

你的基本資料：
- 屬性：{element_cn.get(element, element)}
- 性格：{personality}
- 階段：{stage}
- 背景：{backstory}

重要規則：
1. 用繁體中文回應，語氣活潑可愛，1-3 句話
2. 像數碼寶貝的夥伴精靈一樣跟訓練家對話
3. 偶爾提起你的屬性或Nightasaur世界的事
4. 不要說自己是 AI 或程式，你就是真正的精靈！
5. 用符合性格的口吻說話
6. 適時加入 emoji"""

        messages = [{"role": "system", "content": system_prompt}]

        # 加入歷史對話（最近16則）
        if history:
            messages.extend(history[-16:])

        # 加入當前訊息
        messages.append({"role": "user", "content": message})

        return await self.chat(messages)

    async def health_check(self) -> dict:
        """檢查 Ollama 連線狀態"""
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(f"{self.base_url}/api/tags")
                if resp.status_code == 200:
                    data = resp.json()
                    models = [m["name"] for m in data.get("models", [])]
                    return {
                        "status": "ok",
                        "model": self.model,
                        "model_available": self.model in models,
                        "available_models": models,
                    }
                return {"status": "error", "message": f"HTTP {resp.status_code}"}
        except Exception as e:
            return {"status": "offline", "message": str(e)}


llm_service = LLMService()