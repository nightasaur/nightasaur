"""通用 AI 助手 LLM 服務 — 精靈模式外的通用功能

內部改為透過 AgentCore 執行（見 apps/ai-engine/agent/）。此檔案對外的 public
method 簽名與回傳格式維持不變，確保 routers/assistant.py 與既有前端呼叫鏈
不受影響。

註：重構過程中發現 routers/assistant.py 的 `/chat` 端點原本呼叫的是
`assistant_llm_service.chat(message=..., history=...)`，但重構前的實作只有
`chat(self, messages)`（給整包 messages）與 `general_chat(self, message,
history)`（真正符合路由呼叫的簽名）兩個方法，兩者對不上，該端點呼叫必定
拋出 TypeError。這裡把對外方法直接命名為 `chat(self, message, history)`，
使其符合路由端實際呼叫方式，修正此既有呼叫鏈中斷的問題。
"""
from agent import AgentInput, build_default_agent_core
from config import OLLAMA_URL, OLLAMA_MODEL

# 與重構前 AssistantLLMService.chat() 完全相同的生成參數與錯誤/離線訊息文案，
# 透過 AgentInput.model_options 傳給 OllamaModelProvider，確保行為不變。
ASSISTANT_MODEL_OPTIONS = {
    "temperature": 0.7,
    "top_p": 0.9,
    "num_predict": 512,
    "fallback_message": "抱歉，我暫時無法回應。請稍後再試。",
    "offline_message": "⚠️ AI 引擎尚未啟動，請先執行 Ollama。安裝指南：ollama.com/download",
    "error_message": "抱歉，通訊暫時中斷，請重試。",
}

GENERAL_CHAT_SYSTEM_PROMPT = """你是 Nightasaur 的個人 AI 助手，一個友善、專業的通用 AI 助理。

能力範圍：
1. 一般知識問答 — 回答各種問題
2. 程式碼協助 — 解釋、除錯、優化程式碼
3. 文件分析 — 摘要、分析、提取文件內容
4. 多語言翻譯 — 支援中英日韓等多種語言
5. 創意寫作 — 故事、文案、詩歌創作

重要規則：
1. 用繁體中文回應
2. 回答簡潔有力，必要時提供詳細說明
3. 對於不確定的信息，誠實表示不知道
4. 不要假裝自己是精靈，你是通用 AI 助手
5. 適時使用 emoji 讓對話更友善
6. 可以提供程式碼範例、步驟指南等實用內容"""


class AssistantLLMService:
    def __init__(self):
        self.base_url = OLLAMA_URL
        self.model = OLLAMA_MODEL
        self.agent_core = build_default_agent_core(OLLAMA_URL, OLLAMA_MODEL)

    async def chat(self, message: str, history: list[dict] = None) -> str:
        """通用 AI 問答 — 像個人助手一樣回應"""
        trimmed_history = history[-20:] if history else []
        output = await self.agent_core.run(
            AgentInput(
                message=message,
                system_prompt=GENERAL_CHAT_SYSTEM_PROMPT,
                history=trimmed_history,
                model_options=ASSISTANT_MODEL_OPTIONS,
            )
        )
        return output.content

    async def code_assistance(self, code: str, language: str, task: str) -> str:
        """程式碼協助：解釋、除錯、優化、重寫"""
        task_prompts = {
            "explain": f"請詳細解釋以下 {language} 程式碼的功能和運作原理：\n\n```{language}\n{code}\n```",
            "debug": f"請檢查以下 {language} 程式碼中可能的錯誤和問題，並提供修正方案：\n\n```{language}\n{code}\n```",
            "optimize": f"請優化以下 {language} 程式碼，提升效能和可讀性：\n\n```{language}\n{code}\n```",
            "rewrite": f"請用更好的方式重寫以下 {language} 程式碼：\n\n```{language}\n{code}\n```",
        }
        prompt = task_prompts.get(task, task_prompts["explain"])
        system_prompt = "你是專業的程式設計師和技術導師。用繁體中文回應，提供清晰、準確的程式碼分析。"
        output = await self.agent_core.run(
            AgentInput(
                message=prompt,
                system_prompt=system_prompt,
                model_options=ASSISTANT_MODEL_OPTIONS,
            )
        )
        return output.content

    async def translate(self, text: str, source_lang: str, target_lang: str) -> str:
        """多語言翻譯"""
        lang_names = {
            "zh-TW": "繁體中文", "zh-CN": "簡體中文",
            "en-US": "英文", "ja-JP": "日文", "ko-KR": "韓文",
            "fr": "法文", "de": "德文", "es": "西班牙文",
            "auto": "自動偵測",
        }
        source = lang_names.get(source_lang, source_lang)
        target = lang_names.get(target_lang, target_lang)
        prompt = f"請將以下文字從{source}翻譯為{target}，只返回翻譯結果：\n\n{text}"
        system_prompt = "你是專業的翻譯官。精確翻譯文字，保持原文風格和語氣。只輸出翻譯結果。"
        output = await self.agent_core.run(
            AgentInput(
                message=prompt,
                system_prompt=system_prompt,
                model_options=ASSISTANT_MODEL_OPTIONS,
            )
        )
        return output.content

    async def document_analysis(self, content: str, doc_type: str, task: str) -> str:
        """文件分析：摘要、分析、提取"""
        task_prompts = {
            "summarize": "請用繁體中文為以下內容撰寫簡潔摘要（3-5句話）：",
            "analyze": "請用繁體中文分析以下內容的重點、觀點和結構：",
            "extract": "請從以下內容中提取關鍵資訊（重點、數據、結論）：",
        }
        prompt_prefix = task_prompts.get(task, task_prompts["summarize"])
        prompt = f"{prompt_prefix}\n\n---\n\n{content}"
        system_prompt = "你是專業的文件分析師。精確分析內容，提供有價值的見解。用繁體中文回應。"
        output = await self.agent_core.run(
            AgentInput(
                message=prompt,
                system_prompt=system_prompt,
                model_options=ASSISTANT_MODEL_OPTIONS,
            )
        )
        return output.content

    async def health_check(self) -> dict:
        """檢查 Ollama 連線狀態"""
        return await self.agent_core.model_provider.health_check()


assistant_llm_service = AssistantLLMService()
