# SPDX-License-Identifier: MIT
"""Authenticate before parsing and bound even chunked request bodies."""
import asyncio
import hmac
import os
from starlette.responses import JSONResponse

MAX_REQUEST_BYTES = 6 * 1024 * 1024


class ServiceBoundary:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            if scope["type"] == "websocket":
                await send({"type": "websocket.close", "code": 1008})
                return
            return await self.app(scope, receive, send)
        if scope["path"] == "/api/health" and scope["method"] == "GET":
            return await self.app(scope, receive, send)

        async def reject(status, detail):
            await JSONResponse({"detail": detail}, status_code=status)(scope, receive, send)

        key = os.getenv("AI_ENGINE_API_KEY", "")
        if len(key.encode()) < 32 or len(set(key)) < 10 or key.strip() != key:
            return await reject(503, "AI service authentication not configured")
        auth = [v for k, v in scope["headers"] if k.lower() == b"authorization"]
        if len(auth) != 1 or not hmac.compare_digest(auth[0], ("Bearer " + key).encode()):
            return await reject(401, "Invalid service credential")
        lengths = [v for k, v in scope["headers"] if k.lower() == b"content-length"]
        if len(lengths) > 1:
            return await reject(400, "Ambiguous content length")
        if lengths:
            try:
                length = int(lengths[0])
            except ValueError:
                return await reject(400, "Invalid content length")
            if length < 0:
                return await reject(400, "Invalid content length")
            if length > MAX_REQUEST_BYTES:
                return await reject(413, "Request too large")
        body = bytearray()
        try:
            async with asyncio.timeout(15):
                while True:
                    message = await receive()
                    if message["type"] == "http.disconnect":
                        return
                    chunk = message.get("body", b"")
                    if len(body) + len(chunk) > MAX_REQUEST_BYTES:
                        return await reject(413, "Request too large")
                    body.extend(chunk)
                    if not message.get("more_body", False):
                        break
        except TimeoutError:
            return await reject(408, "Request body timeout")
        if lengths and len(body) != int(lengths[0]):
            return await reject(400, "Content length mismatch")
        delivered = False

        async def bounded_receive():
            nonlocal delivered
            if not delivered:
                delivered = True
                return {"type": "http.request", "body": bytes(body), "more_body": False}
            return await receive()

        await self.app(scope, bounded_receive, send)
