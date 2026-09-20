import io
import secrets
import pytest
from fastapi.testclient import TestClient
from PIL import Image
import main
import security
from security import ServiceBoundary

@pytest.fixture
def client(monkeypatch):
    key = secrets.token_urlsafe(48)
    monkeypatch.setenv("AI_ENGINE_API_KEY", key)
    return TestClient(main.app, headers={"Authorization": "Bearer " + key})

@pytest.mark.parametrize("path", ["/api/assistant/chat", "/api/assistant/analyze-image", "/api/dialogue/chat", "/api/generate/image", "/api/generate/status", "/openapi.json"])
def test_private_routes_deny_anonymous_requests(client, path):
    assert client.post(path, headers={"Authorization": ""}, content=b"invalid").status_code == 401

def test_key_absence_fails_closed_and_health_is_minimal(client, monkeypatch):
    monkeypatch.delenv("AI_ENGINE_API_KEY")
    assert client.post("/api/assistant/chat", json={"message": "unit"}).status_code == 503
    health = client.get("/api/health")
    assert health.status_code == 200
    assert set(health.json()) == {"status", "service", "version"}
    assert "access-control-allow-origin" not in health.headers

def test_wrong_key_and_duplicate_authorization_are_rejected(client):
    assert client.post("/api/assistant/chat", headers={"Authorization": "Bearer wrong"}).status_code == 401
    assert client.post("/api/assistant/chat", headers=[("Authorization", client.headers["Authorization"]), ("Authorization", "Bearer wrong")]).status_code == 401

def test_body_limit_applies_before_json_or_multipart_parsing(client, monkeypatch):
    monkeypatch.setattr(security, "MAX_REQUEST_BYTES", 128)
    assert client.post("/api/assistant/chat", content=b"x" * 129).status_code == 413

@pytest.mark.asyncio
async def test_chunked_body_cannot_bypass_limit_and_anonymous_body_is_not_read(monkeypatch):
    key = secrets.token_urlsafe(48)
    monkeypatch.setenv("AI_ENGINE_API_KEY", key)
    monkeypatch.setattr(security, "MAX_REQUEST_BYTES", 5)
    called = False
    async def downstream(*_):
        nonlocal called
        called = True
    scope = {"type": "http", "path": "/api/assistant/chat", "method": "POST", "headers": [(b"authorization", ("Bearer " + key).encode())]}
    chunks = iter([{"type": "http.request", "body": b"123", "more_body": True}, {"type": "http.request", "body": b"456", "more_body": False}])
    async def receive(): return next(chunks)
    messages = []
    async def send(msg): messages.append(msg)
    await ServiceBoundary(downstream)(scope, receive, send)
    assert messages[0]["status"] == 413 and not called
    async def unread(): raise AssertionError("Must authenticate before reading body")
    scope["headers"] = []
    messages.clear()
    await ServiceBoundary(downstream)(scope, unread, send)
    assert messages[0]["status"] == 401 and not called

def png():
    output = io.BytesIO()
    Image.new("RGB", (2, 2)).save(output, format="PNG")
    return output.getvalue()

def test_image_requires_real_supported_content(client):
    for name, data, mime in [("x.svg", b"<svg/>", "image/svg+xml"), ("x.png", b"not an image", "image/png"), ("x.jpg", png(), "image/jpeg"), ("x.png", png()[:30], "image/png")]:
        assert client.post("/api/assistant/analyze-image", files={"image": (name, data, mime)}).status_code == 415

def test_image_byte_and_pixel_limits(client, monkeypatch):
    import image_validation
    monkeypatch.setattr(image_validation, "MAX_IMAGE_BYTES", 10)
    assert client.post("/api/assistant/analyze-image", files={"image": ("x.png", png(), "image/png")}).status_code == 413
    monkeypatch.setattr(image_validation, "MAX_IMAGE_BYTES", 1024)
    monkeypatch.setattr(image_validation, "MAX_IMAGE_PIXELS", 1)
    assert client.post("/api/assistant/analyze-image", files={"image": ("x.png", png(), "image/png")}).status_code == 413

def test_valid_image_reports_unconfigured_vision_provider(client):
    result = client.post("/api/assistant/analyze-image", files={"image": ("x.png", png(), "image/png")})
    assert result.status_code == 503
    assert "no reviewed vision provider" in result.json()["detail"]
