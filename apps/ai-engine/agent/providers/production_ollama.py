# SPDX-License-Identifier: MIT
"""Production inference: pinned package, bounded concurrency, explicit failure."""
import asyncio
import os
import re

import httpx

from agent.providers.ollama_provider import OllamaModelProvider


class InferenceUnavailable(Exception):
    def __init__(self, code="inference_unavailable"):
        self.code = code
        super().__init__(code)


_inference_slot = asyncio.Semaphore(1)


class ProductionOllamaModelProvider(OllamaModelProvider):
    async def generate(self, *args, **kwargs):
        digest = os.getenv("OLLAMA_EXPECTED_DIGEST", "").removeprefix("sha256:")
        if not self.model or not re.fullmatch(r"[0-9a-f]{64}", digest):
            raise InferenceUnavailable("reviewed_model_not_configured")
        if _inference_slot.locked():
            raise InferenceUnavailable("inference_busy")
        async with _inference_slot:
            try:
                async with httpx.AsyncClient(**self._client_options(5.0)) as client:
                    tags = await client.get(f"{self.base_url}/api/tags")
                    if tags.status_code != 200:
                        raise InferenceUnavailable("model_inventory_unavailable")
                    matches = [m for m in tags.json().get("models", []) if m.get("name") == self.model]
                    if len(matches) != 1 or matches[0].get("digest", "").removeprefix("sha256:") != digest:
                        raise InferenceUnavailable("model_digest_mismatch")
                response = await super().generate(*args, **kwargs)
                raw = response.raw if isinstance(response.raw, dict) else {}
                if (raw.get("error_code") or raw.get("done") is not True
                        or type(raw.get("eval_count")) is not int or raw["eval_count"] <= 0
                        or not (response.tool_calls or (isinstance(response.content, str) and response.content.strip()))):
                    raise InferenceUnavailable("inference_not_completed")
                return response
            except InferenceUnavailable:
                raise
            except Exception:
                raise InferenceUnavailable("provider_unavailable") from None
