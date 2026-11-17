import os
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIR = ROOT_DIR / "frontend"
DATA_DIR = Path(os.getenv("DATA_DIR", ROOT_DIR / "data"))

# One llama-server in router mode can serve chat and embedding models on the
# same port. Keep both URLs in sync for that setup; set LLAMA_EMBED_URL only
# when you run a second server.
LLAMA_CHAT_URL = os.getenv("LLAMA_CHAT_URL", "http://127.0.0.1:8080").rstrip("/")
LLAMA_EMBED_URL = (os.getenv("LLAMA_EMBED_URL") or LLAMA_CHAT_URL).rstrip("/")

# Router mode needs the exact model id from the preset. Leave either value
# empty to pick the first model advertised by that server instead.
DEFAULT_CHAT_MODEL = os.getenv("CHAT_MODEL", "LiquidAI/LFM3-1.7B-GGUF:Q4_K_M")
DEFAULT_EMBED_MODEL = os.getenv("EMBED_MODEL", "ggml-org/embeddinggemma-2-GGUF:Q8_0")
LLAMA_TIMEOUT = float(os.getenv("LLAMA_TIMEOUT", "120"))
