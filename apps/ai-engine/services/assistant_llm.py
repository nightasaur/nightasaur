"""通用 AI 助手 LLM 服務 — 精靈模式外的通用功能"""
import httpx
from config import OLLAMA_URL, OLLAMA_MODEL


class AssistantLLMService:
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
                            "temperature": 0.7,
                            "top_p": 0.9,
                            "num_predict": 512,
                        },
                    },
                )
                if response.status_code == 200:
                    data = response.json()
                    return data["message"]["content"].strip()
                else:
                    print(f"[Assistant LLM Error] HTTP {response.status_code}: {response.text[:200]}")
                    return "抱歉，我暫時無法回應。請稍後再試。"
        except httpx.ConnectError:
            print(f"[Assistant LLM Error] Cannot connect to Ollama at {self.base_url}")
            return "⚠️ AI 引擎尚未啟動，請先執行 Ollama。安裝指南：ollama.com/download"
        except Exception as e:
            print(f"[Assistant LLM Error] {e}")
            return "抱歉，通訊暫時中斷，請重試。"

    async def general_chat(self, message: str, history: list[dict] = None) -> str:
        """通用 AI 問答 — 像個人助手一樣回應"""
        system_prompt = """你是 Nightasaur 的個人 AI 助手，一個友善、專業的通用 AI 助理。

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

        messages = [{"role": "system", "content": system_prompt}]
        if history:
            messages.extend(history[-20:])
        messages.append({"role": "user", "content": message})
        return await self.chat(messages)

    async def code_assistance(self, code: str, language: str, task: str) -> str:
        """程式碼協助：解釋、除錯、優化、重寫"""
        task_prompts = {
            "explain": f"請詳細解釋以下 {language} 程式碼的功能和運作原理：\n\n```{language}\n{code}\n```",
            "debug": f"請檢查以下 {language} 程式碼中可能的錯誤和問題，並提供修正方案：\n\n```{language}\n{code}\n```",
            "optimize": f"請優化以下 {language} 程式碼，提升效能和可讀性：\n\n```{language}\n{code}\n```",
            "rewrite": f"請用更好的方式重寫以下 {language} 程式碼：\n\n```{language}\n{code}\n```",
        }
        prompt = task_prompts.get(task, task_prompts["explain"])
        messages = [
            {"role": "system", "content": "你是專業的程式設計師和技術導師。用繁體中文回應，提供清晰、準確的程式碼分析。"},
            {"role": "user", "content": prompt},
        ]
        return await self.chat(messages)

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
        messages = [
            {"role": "system", "content": "你是專業的翻譯官。精確翻譯文字，保持原文風格和語氣。只輸出翻譯結果。"},
            {"role": "user", "content": prompt},
        ]
        return await self.chat(messages)

    async def document_analysis(self, content: str, doc_type: str, task: str) -> str:
        """文件分析：摘要、分析、提取"""
        task_prompts = {
            "summarize": "請用繁體中文為以下內容撰寫簡潔摘要（3-5句話）：",
            "analyze": "請用繁體中文分析以下內容的重點、觀點和結構：",
            "extract": "請從以下內容中提取關鍵資訊（重點、數據、結論）：",
        }
        prompt_prefix = task_prompts.get(task, task_prompts["summarize"])
        prompt = f"{prompt_prefix}\n\n---\n\n{content}"
        messages = [
            {"role": "system", "content": "你是專業的文件分析師。精確分析內容，提供有價值的見解。用繁體中文回應。"},
            {"role": "user", "content": prompt},
        ]
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


assistant_llm_service = AssistantLLMService()