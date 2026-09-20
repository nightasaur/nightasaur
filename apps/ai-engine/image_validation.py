# SPDX-License-Identifier: MIT
import io
import warnings
from fastapi import HTTPException, UploadFile
from PIL import Image, UnidentifiedImageError

MAX_IMAGE_BYTES = 5 * 1024 * 1024
MAX_IMAGE_PIXELS = 16_000_000
ALLOWED_TYPES = {"image/png": "PNG", "image/jpeg": "JPEG"}


async def read_validated_image(upload: UploadFile) -> bytes:
    try:
        expected = ALLOWED_TYPES.get(upload.content_type or "")
        if not expected:
            raise HTTPException(415, "Only PNG and JPEG images are accepted")
        data = await upload.read(MAX_IMAGE_BYTES + 1)
        if len(data) > MAX_IMAGE_BYTES:
            raise HTTPException(413, "Image exceeds 5 MiB")
        try:
            with warnings.catch_warnings():
                warnings.simplefilter("error", Image.DecompressionBombWarning)
                with Image.open(io.BytesIO(data), formats=["PNG", "JPEG"]) as image:
                    if image.format != expected:
                        raise HTTPException(415, "Image content does not match media type")
                    if image.width * image.height > MAX_IMAGE_PIXELS:
                        raise HTTPException(413, "Image exceeds pixel limit")
                    if getattr(image, "n_frames", 1) != 1:
                        raise HTTPException(415, "Animated images are not accepted")
                    image.verify()
                with Image.open(io.BytesIO(data), formats=["PNG", "JPEG"]) as image:
                    image.load()
        except (Image.DecompressionBombError, Image.DecompressionBombWarning):
            raise HTTPException(413, "Image exceeds safe decoding limits") from None
        except (UnidentifiedImageError, OSError, SyntaxError, ValueError):
            raise HTTPException(415, "Invalid or truncated image") from None
        return data
    finally:
        await upload.close()
