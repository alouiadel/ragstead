import httpx
from fastapi import APIRouter, HTTPException

from .. import config, llama

router = APIRouter()

TARGETS = {
    "chat": (config.LLAMA_CHAT_URL, config.DEFAULT_CHAT_MODEL),
    "embed": (config.LLAMA_EMBED_URL, config.DEFAULT_EMBED_MODEL),
}


@router.get("/models/{kind}")
async def model_info(kind: str):
    if kind not in TARGETS:
        raise HTTPException(status_code=404, detail="Unknown model kind")
    base_url, fallback = TARGETS[kind]
    try:
        details = await llama.model_details(base_url, fallback)
    except httpx.HTTPError as error:
        raise HTTPException(
            status_code=503,
            detail=f"llama.cpp server unreachable at {base_url}",
        ) from error
    return {"kind": kind, **details}
