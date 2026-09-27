import pytest
from fastapi import HTTPException
from routers.generation import GenerateRequest, generate_image
from services import comfyui


@pytest.mark.asyncio
async def test_disabled_image_model_never_opens_network(monkeypatch):
    monkeypatch.setattr(comfyui, 'COMFYUI_CHECKPOINT', '')
    def forbidden(*args, **kwargs):
        raise AssertionError('Disabled inference must not connect')
    monkeypatch.setattr(comfyui.httpx, 'AsyncClient', forbidden)
    for request in (GenerateRequest(), GenerateRequest(prompt='test')):
        with pytest.raises(HTTPException) as error:
            await generate_image(request)
        assert error.value.status_code == 503


@pytest.mark.asyncio
async def test_custom_prompt_uses_existing_service_method(monkeypatch):
    async def fake_generate_image(prompt, seed):
        assert prompt == 'fixture'
        assert seed == 42
        return {'status': 'completed', 'images': [], 'seed': seed}
    monkeypatch.setattr(comfyui.comfyui_service, 'generate_image', fake_generate_image)
    assert (await generate_image(GenerateRequest(prompt='fixture', seed=42)))['status'] == 'completed'
