# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Nightasaur Team

"""EchoTool —— 最小的 demo/contract 工具實作。

不承載任何業務邏輯，純粹用來驗證 Tool interface -> ToolRegistry.register/get/
execute -> 結果/錯誤 的完整契約是否正確運作（見
tests/test_tool_registry.py）。也可作為未來新增真實工具時的參考範本。
"""
from typing import Any

from agent.tools.base import Tool


class EchoTool(Tool):
    """回傳輸入內容的示範工具；若未提供 text 參數則故意拋出例外，
    用來驗證 ToolRegistry.execute 的錯誤包裝行為。
    """

    name = "echo"
    description = "Echo back the given text. Demo tool used for contract testing."
    parameters = {
        "type": "object",
        "properties": {
            "text": {"type": "string", "description": "The text to echo back."},
        },
        "required": ["text"],
    }

    async def run(self, **kwargs) -> Any:
        if "text" not in kwargs:
            raise ValueError("EchoTool requires a 'text' keyword argument")
        return kwargs["text"]
