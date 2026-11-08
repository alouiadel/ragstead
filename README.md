# Ragstead

A minimalist, self-hosted RAG chat app. Local models served by [Ollama](https://ollama.com), a FastAPI backend, and a vanilla JS/HTML/CSS frontend — all running with one `docker compose up`.

No LangChain, no LlamaIndex. The retrieval pipeline is built from scratch: your own chunker, Ollama embeddings, cosine similarity over stored vectors.

> **Status:** pre-alpha. This README describes the intended behavior of the app; the implementation is in progress.

## Why

Most RAG demos are a wrapper around a framework and a hosted API. Ragstead is the opposite:

- **Local first** — Ollama runs in the same Compose stack; nothing leaves your machine.
- **No framework magic** — the whole pipeline is a few hundred readable lines. If retrieval is bad, you can see exactly why.
- **Minimal UI** — chat, libraries, uploads. No dashboards, no pipelines editor.
- **Persistence that makes sense** — every chat is resumable, every library is reusable.

## Features

- 💬 **Streaming chat** — answers stream token by token, with inline source citations.
- 📎 **Temporary uploads** — drop a file into a single chat. It is chunked, indexed for that chat only, and deleted when the chat is deleted (or after a TTL). Temporary files never leak into libraries.
- 📚 **Knowledge libraries** — named, persistent collections of documents you can attach to any chat. Ingest once, query from many conversations.
- 🗂 **Multiple chats** — a sidebar of conversations with titles, timestamps, and full message history. Click any chat to resume it exactly where you left off.
- 🧠 **RAG from scratch** — own token-aware chunker, Ollama `/api/embeddings`, vector store in SQLite, top-k cosine retrieval, prompt assembly with citations.
- 🐳 **One-command deploy** — `docker compose up` starts Ollama, the API, and the UI together.
- 📴 **Offline capable** — pull the models once, then run without a network connection.

## Stack

| Layer      | Choice                                       |
| ---------- | -------------------------------------------- |
| LLM        | Ollama (`llama3.2` by default, configurable) |
| Embeddings | Ollama (`nomic-embed-text` by default)       |
| Backend    | Python 3.11+, FastAPI, Uvicorn               |
| Retrieval  | NumPy cosine similarity, SQLite storage      |
| Frontend   | Vanilla JS, HTML, CSS — no build step        |
| Packaging  | Docker Compose                               |

## How it works

### 1. Ingestion

1. A document is uploaded to a chat (temporary) or a library (persistent).
2. Text is extracted (`pypdf` for PDF, plain read for `.md`/`.txt`).
3. The text is split into overlapping chunks by size, preferring paragraph and sentence boundaries.
4. Each chunk is embedded with Ollama's `/api/embeddings` in small batches.
5. Chunks and their vectors are written to SQLite alongside the source document.

### 2. Retrieval

1. The user's message is embedded with the same model used at ingestion.
2. Cosine similarity is computed against every chunk visible to the chat: its temporary files plus every attached library.
3. The top-k chunks (default `k = 5`) are selected, de-duplicated by document, and ordered by score.

### 3. Generation

1. A system prompt is assembled: instructions + numbered context blocks + the chat history window.
2. The backend streams Ollama's `/api/chat` response to the browser over Server-Sent Events.
3. Source numbers resolve to file name and chunk index in the UI, so every claim is traceable.

```
Browser ──HTTP/SSE──► FastAPI ──► SQLite (chats, libraries, chunks)
                         │
                         └────────► Ollama (chat + embeddings)
```

## Quick start

Requirements: Docker Desktop (or Docker Engine + Compose v2), and enough RAM to run the chat model (8 GB is a comfortable minimum).

```bash
git clone https://github.com/alouiadel/ragstead.git
cd ragstead
docker compose up
```

Then open <http://localhost:8000>.

The first run pulls the chat and embedding models into the `ollama-data` volume. This takes a few minutes and needs network access; later runs are offline-ready.

```bash
# Pull a different model into the running stack
docker compose exec ollama ollama pull qwen2.5:7b
```

## Configuration

All settings are optional and read from the environment (or a `.env` file next to `docker-compose.yml`).

| Variable          | Default               | Description                                     |
| ----------------- | --------------------- | ----------------------------------------------- |
| `CHAT_MODEL`      | `llama3.2`            | Ollama model used for generation                |
| `EMBED_MODEL`     | `nomic-embed-text`    | Ollama model used for embeddings                |
| `OLLAMA_BASE_URL` | `http://ollama:11434` | Ollama endpoint as seen from the backend        |
| `CHUNK_SIZE`      | `800`                 | Target chunk size, in characters                |
| `CHUNK_OVERLAP`   | `120`                 | Overlap between consecutive chunks              |
| `TOP_K`           | `5`                   | Chunks retrieved per query                      |
| `MAX_UPLOAD_MB`   | `20`                  | Per-file upload limit                           |
| `TEMP_FILE_TTL_H` | `24`                  | Hours before an unused temporary upload expires |
| `DATA_DIR`        | `/data`               | SQLite database and uploaded files              |

## Project layout

```
ragstead/
├── docker-compose.yml
├── Dockerfile
├── requirements.txt
├── backend/
│   ├── main.py            # FastAPI app, static file serving
│   ├── db.py              # SQLite schema and queries
│   ├── ingest.py          # extraction, chunking, embedding
│   ├── retrieve.py        # cosine similarity, top-k selection
│   ├── generate.py        # prompt assembly, Ollama streaming
│   └── routes/            # chats, libraries, uploads, models
├── frontend/
│   ├── index.html
│   ├── app.js
│   └── styles.css
└── data/                  # created at runtime; git-ignored
```

## API

| Method   | Path                                     | Purpose                            |
| -------- | ---------------------------------------- | ---------------------------------- |
| `GET`    | `/api/chats`                             | List chats                         |
| `POST`   | `/api/chats`                             | Create a chat                      |
| `GET`    | `/api/chats/{id}`                        | Chat with message history          |
| `DELETE` | `/api/chats/{id}`                        | Delete a chat and its temp uploads |
| `POST`   | `/api/chats/{id}/messages`               | Send a message, stream the answer  |
| `POST`   | `/api/chats/{id}/files`                  | Upload a temporary file to a chat  |
| `GET`    | `/api/libraries`                         | List knowledge libraries           |
| `POST`   | `/api/libraries`                         | Create a library                   |
| `POST`   | `/api/libraries/{id}/documents`          | Upload a document to a library     |
| `DELETE` | `/api/libraries/{id}/documents/{doc_id}` | Remove a document                  |
| `PUT`    | `/api/chats/{id}/libraries`              | Attach/detach libraries for a chat |
| `GET`    | `/api/health`                            | Backend and Ollama availability    |

Message streaming uses `text/event-stream`. Each event carries a token, a source reference, or a terminal error.

## Data and privacy

- Everything lives in the `data/` volume: SQLite database plus original uploads.
- Temporary chat uploads are namespaced per chat and removed on chat deletion, on TTL expiry, and on startup sweep.
- No telemetry, no external calls. If you can reach the UI, the only outbound traffic is what you configure.

## Development (without Docker)

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# Ollama must be running locally
export OLLAMA_BASE_URL=http://localhost:11434

uvicorn backend.main:app --reload --port 8000
```

The backend serves `frontend/` directly, so there is no frontend build step. Reload the page after editing CSS or JS.

Tests:

```bash
pytest
```

## Roadmap

- [ ] Chat CRUD with streaming responses
- [ ] Temporary per-chat uploads with TTL cleanup
- [ ] Knowledge libraries and per-chat attachment
- [ ] PDF, Markdown, and plain-text ingestion
- [ ] Inline citations with a source panel
- [ ] Docker Compose stack with Ollama
- [ ] Reranking pass over top-k candidates
- [ ] Chat export (Markdown)

## License

MIT
