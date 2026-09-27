import base64
import io
import hashlib
import pytest
from PIL import Image
from services.procedural_spirit import generate
from routers.generation import GenerateRequest, generate_image


def test_real_png_is_reproducible_and_varies_with_parameters():
    a=generate('FIRE','EGG',42)
    assert a == generate('FIRE','EGG',42)
    raw=base64.b64decode(a['images'][0]['url'].split(',',1)[1])
    im=Image.open(io.BytesIO(raw))
    assert im.format == 'PNG' and im.size == (512,512)
    assert hashlib.sha256(raw).hexdigest() == a['images'][0]['sha256']
    assert len(im.getcolors(512*512)) > 100
    for e,stage,seed in [('WATER','EGG',42),('FIRE','ADULT',42),('FIRE','EGG',43)]:
        assert generate(e,stage,seed)['images'][0]['sha256'] != a['images'][0]['sha256']


@pytest.mark.asyncio
async def test_enabled_renderer_rejects_unknown_inputs_and_does_not_use_model(monkeypatch):
    monkeypatch.setenv('IMAGE_GENERATOR','procedural')
    from fastapi import HTTPException
    result=await generate_image(GenerateRequest(element='ICE',seed=4))
    assert result['generator']=='nightasaur-procedural-v1'
    for req in [GenerateRequest(prompt='arbitrary model prompt'), GenerateRequest(element='UNKNOWN')]:
        with pytest.raises(HTTPException) as e:
            await generate_image(req)
        assert e.value.status_code == 422
