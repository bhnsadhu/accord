"""Private Accord recognition endpoint. Reuses the existing ScentLens runtime.

Deploy with `modal deploy deploy/scanner.py`. Model assets are local, ignored
ScentLens exports, never committed here. The public ScentLens demo is untouched.
"""
from pathlib import Path
import os
import modal

source = Path(os.environ.get("SCENTLENS_SOURCE", Path(__file__).resolve().parent.parent.parent / "scent-lens"))
image = (
    modal.Image.from_id("im-NF7L0se9XJp45wOqlyZfde")
    .add_local_dir(source / "src" / "scent_lens", "/accord/src/scent_lens")
    .add_local_dir(source / "artifacts" / "export", "/accord/export")
)
app = modal.App("accord-scanner", image=image)

@app.function(cpu=4.0, memory=4096, max_containers=1, scaledown_window=30, timeout=120)
@modal.concurrent(max_inputs=1)
@modal.asgi_app(requires_proxy_auth=True)
def web():
    import sys
    from io import BytesIO
    import warnings
    from fastapi import FastAPI, HTTPException, Request
    from PIL import Image, UnidentifiedImageError
    from starlette.concurrency import run_in_threadpool
    sys.path.insert(0, "/accord/src")
    from scent_lens.recognize import Recognizer
    recognizer = Recognizer(Path("/accord/export"), reader="rapidocr")
    api = FastAPI(docs_url=None, redoc_url=None, openapi_url=None)
    Image.MAX_IMAGE_PIXELS = 16_000_000

    def identify(raw):
        try:
            with warnings.catch_warnings():
                warnings.simplefilter("error", Image.DecompressionBombWarning)
                with Image.open(BytesIO(raw)) as photo:
                    if photo.width * photo.height > 16_000_000:
                        raise HTTPException(413, "Image dimensions are too large")
                    photo.load()
                    return recognizer(photo).to_dict()
        except (UnidentifiedImageError, OSError, Image.DecompressionBombError, Image.DecompressionBombWarning):
            raise HTTPException(400, "Invalid image") from None

    @api.post("/identify")
    async def scan(request: Request):
        raw = bytearray()
        async for chunk in request.stream():
            raw.extend(chunk)
            if len(raw) > 2 * 1024 * 1024:
                raise HTTPException(413, "Image is too large")
        if len(raw) < 1024:
            raise HTTPException(400, "Invalid image")
        # Bytes stay in request memory. No upload directory or Gradio file cache.
        return await run_in_threadpool(identify, bytes(raw))

    return api
