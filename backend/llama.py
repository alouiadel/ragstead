import json
from pathlib import Path
from urllib.parse import quote

import httpx

from . import config


async def get_json(base_url, path):
    async with httpx.AsyncClient(timeout=config.LLAMA_TIMEOUT) as client:
        response = await client.get(f"{base_url}{path}")
        response.raise_for_status()
        return response.json()


async def list_models(base_url):
    try:
        payload = await get_json(base_url, "/v1/models")
    except httpx.HTTPError:
        return []
    return payload.get("data", [])


async def resolve_model(base_url, preferred):
    """Use the configured model id, or discover the first served model."""
    if preferred:
        return preferred
    models = await list_models(base_url)
    return models[0].get("id", "") if models else ""


async def model_details(base_url, model_id):
    """Read live model information from llama.cpp.

    Router-mode servers need an explicit model id, so a configured id is
    preferred over whatever happens to be first in /v1/models. Asking
    /props about an unloaded router model also triggers its autoload.
    """
    selected = await resolve_model(base_url, model_id)

    props = {}
    if selected:
        try:
            props = await get_json(base_url, f"/props?model={quote(selected, safe='')}")
        except httpx.HTTPError:
            props = {}

    if not props or props.get("role") == "router":
        # Older standalone servers ignore the model query; the router returns
        # its own level here when the requested model is unknown.
        try:
            fallback = await get_json(base_url, "/props")
            if fallback.get("role") != "router":
                props = fallback
        except httpx.HTTPError:
            props = {}

    models = await list_models(base_url)
    matched = [model for model in models if model.get("id") == selected]
    status = None
    if matched:
        status = (matched[0].get("status") or {}).get("value")

    name = props.get("model_alias") or selected
    if not name:
        name = Path(props.get("model_path", "")).name or "Unknown model"

    # The upstream path can contain the server's home directory. Keep the
    # useful filename without exposing local account and directory names.
    public_props = dict(props)
    if public_props.get("model_path"):
        public_props["model_path"] = Path(public_props["model_path"]).name

    return {
        "name": name,
        "model": selected,
        "status": status,
        "url": base_url,
        "props": public_props,
        "models": matched,
    }


async def stream_chat_completion(messages):
    """Yield assistant text deltas from llama.cpp's OpenAI endpoint."""
    payload = {
        "messages": messages,
        "stream": True,
    }
    model = await resolve_model(config.LLAMA_CHAT_URL, config.DEFAULT_CHAT_MODEL)
    if model:
        payload["model"] = model
    async with httpx.AsyncClient(timeout=config.LLAMA_TIMEOUT) as client:
        async with client.stream(
            "POST", f"{config.LLAMA_CHAT_URL}/v1/chat/completions", json=payload
        ) as response:
            response.raise_for_status()
            async for line in response.aiter_lines():
                if not line.startswith("data:"):
                    continue
                data = line[5:].strip()
                if not data or data == "[DONE]":
                    continue
                chunk = json.loads(data)
                choices = chunk.get("choices") or []
                if not choices:
                    continue
                delta = choices[0].get("delta") or {}
                if delta.get("content"):
                    yield delta["content"]
