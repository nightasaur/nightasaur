"""Ollama LLM 對話服務

內部改為透過 AgentCore 執行（見 apps/ai-engine/agent/），Ollama 呼叫邏輯已搬到
agent/providers/ollama_provider.py 的 OllamaModelProvider。此檔案對外的
public method 簽名與回傳格式維持不變，確保 routers/dialogue.py 與既有前端
呼叫鏈不受影響。
"""
from agent import AgentInput, build_default_agent_core
from config import OLLAMA_URL, OLLAMA_MODEL

# 與重構前 LLMService.chat() 完全相同的生成參數與錯誤/離線訊息文案，
# 透過 AgentInput.model_options 傳給 OllamaModelProvider，確保行為不變。
DIALOGUE_MODEL_OPTIONS = {
    "temperature": 0.8,
    "top_p": 0.9,
    "num_predict": 256,
    "fallback_message": "嗚...我暫時無法回應。請稍後再試。",
    "offline_message": "嘎嗚～（AI 引擎尚未啟動，請先執行 Ollama）",
    "error_message": "嘎嗚～（通訊暫時中斷...）",
}


class LLMService:
    def __init__(self):
        self.base_url = OLLAMA_URL
        self.model = OLLAMA_MODEL
        self.agent_core = build_default_agent_core(OLLAMA_URL, OLLAMA_MODEL)

    async def generate_story(self, prompt: str) -> str:
        """生成精靈背景故事"""
        system_prompt = (
            "你是 Nightasaur 世界的故事講述者。"
            "用繁體中文為奇幻精靈創作短篇背景故事。"
            "3-5 句話，語氣溫暖、魔法、富有想像力。"
            "故事要生動、有畫面感。"
        )
        output = await self.agent_core.run(
            AgentInput(
                message=prompt,
                system_prompt=system_prompt,
                model_options=DIALOGUE_MODEL_OPTIONS,
            )
        )
        return output.content

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

        # 加入歷史對話（最近16則），與重構前行為一致
        trimmed_history = history[-16:] if history else []

        output = await self.agent_core.run(
            AgentInput(
                message=message,
                system_prompt=system_prompt,
                history=trimmed_history,
                model_options=DIALOGUE_MODEL_OPTIONS,
            )
        )
        return output.content

    async def health_check(self) -> dict:
        """檢查 Ollama 連線狀態"""
        return await self.agent_core.model_provider.health_check()


llm_service = LLMService()
