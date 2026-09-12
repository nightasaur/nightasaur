# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Nightasaur Team

"""Ollama ModelProvider —— 現有 services/llm.py、services/assistant_llm.py 中
重複的 Ollama httpx 呼叫邏輯，搬到這裡統一實作，做為第一個可替換的
ModelProvider。行為（timeout、錯誤訊息、health_check 回傳格式）與重構前完全
相同，避免影響既有 /dialogue、/assistant 呼叫鏈。

qwen2.5:3b（透過目前的 /api/chat 呼叫方式）沒有原生 tool-calling 能力，因此
`supports_native_tool_calls()` 回傳 False，需要 tool call 時委派給
agent/providers/tool_call_fallback.py 的 FallbackToolCallAdapter 處理
prompt 組裝與輸出解析 —— 這個檔案本身不包含任何 JSON marker 解析邏輯，只
負責「呼叫 Ollama、把結果交給 adapter」。當 `tools` 為 None/空列表時，完全
不經過 adapter，行為與 v0.1 完全一致（byte-identical prompt/回傳）。
"""
import httpx

from agent.providers.base import ModelProvider
from agent.providers.tool_call_fallback import FallbackToolCallAdapter
from agent.tool_calls import ModelResponse, ToolSpec


class OllamaModelProvider(ModelProvider):
    """透過 Ollama HTTP API 產生文字的 ModelProvider 實作。"""

    def __init__(self, base_url: str, model: str):
        self.base_url = base_url
        self.model = model
        self._tool_call_adapter = FallbackToolCallAdapter()

    def supports_native_tool_calls(self) -> bool:
        return False

    async def generate(
        self,
        messages: list[dict],
        tools: list[ToolSpec] | None = None,
        **options,
    ) -> ModelResponse:
        """呼叫 Ollama /api/chat。失敗時回傳與舊版相同的中文提示字串，
        而不是拋出例外 —— 維持既有對話體驗（精靈/助手「暫時斷線」的口吻）。

        `tools` 有值時，透過 FallbackToolCallAdapter 在送給模型前組裝
        tool-使用說明，並在拿到純文字回覆後解析是否為 tool call；`tools`
        為 None/空列表時完全跳過 adapter，維持 v0.1 的原始行為不變。
        """
        request_options = {
            "temperature": options.get("temperature", 0.8),
            "top_p": options.get("top_p", 0.9),
            "num_predict": options.get("num_predict", 256),
        }
        fallback_message = options.get(
            "fallback_message", "嗚...我暫時無法回應。請稍後再試。"
        )
        offline_message = options.get(
            "offline_message",
            "嘎嗚～（AI 引擎尚未啟動，請先執行 Ollama）",
        )
        error_message = options.get("error_message", "嘎嗚～（通訊暫時中斷...）")

        outgoing_messages = messages
        if tools:
            outgoing_messages = self._tool_call_adapter.build_messages(
                messages, tools
            )

        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                response = await client.post(
                    f"{self.base_url}/api/chat",
                    json={
                        "model": self.model,
                        "messages": outgoing_messages,
                        "stream": False,
                        "options": request_options,
                    },
                )
                if response.status_code == 200:
                    data = response.json()
                    content = data["message"]["content"].strip()
                    if tools:
                        return self._tool_call_adapter.parse(content)
                    return ModelResponse(content=content, raw=data)
                print(
                    f"[ModelProvider Error] HTTP {response.status_code}: "
                    f"{response.text[:200]}"
                )
                return ModelResponse(content=fallback_message)
        except httpx.ConnectError:
            print(f"[ModelProvider Error] Cannot connect to Ollama at {self.base_url}")
            return ModelResponse(content=offline_message)
        except Exception as e:  # noqa: BLE001 - 對齊舊版寬鬆例外處理，避免中斷對話
            print(f"[ModelProvider Error] {e}")
            return ModelResponse(content=error_message)

    async def health_check(self) -> dict:
        """檢查 Ollama 連線狀態，回傳格式與重構前的 health_check 完全相同。"""
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
        except Exception as e:  # noqa: BLE001
            return {"status": "offline", "message": str(e)}
