<p align="center">
  <img src="assets/logo.svg" alt="Ragstead logo" width="168">
</p>

<h1 align="center">Ragstead</h1>

<p align="center">
  <strong>Your documents stay home. Your questions get answers.</strong><br>
  A minimalist, self-hosted RAG chat app.
</p>

<p align="center">
  <img alt="Platform" src="https://img.shields.io/badge/platform-Docker-2496ED">
  <img alt="License" src="https://img.shields.io/badge/license-MIT-2EA043">
</p>

---

**Ragstead** is a small, local-first chat app for talking to your own documents. Ollama, FastAPI, and plain HTML, CSS, and JavaScript run in one Compose stack, and the retrieval pipeline is written from scratch, so when an answer is wrong you can see exactly which chunks were retrieved and why.

The name is **rag + stead**: a stead is a homestead, the place where things are kept and worked, which is what this is for your knowledge.

## Features

- **Chat** — streaming answers with inline citations, a sidebar of resumable conversations, and full history.
- **Temporary uploads** — attach a file to one chat; it is indexed for that chat only and deleted with it.
- **Knowledge libraries** — ingest documents once, then attach the library to any number of chats.
- **Retrieval from scratch** — own chunker, Ollama embeddings, NumPy cosine ranking, cited context blocks.
- **One command, offline after the first run** — `docker compose up` starts the model, the API, and the UI.

## Quick start

Requires Docker Desktop or Docker Engine with Compose v2. The default models are small, so a few GB of free RAM is enough.

```bash
git clone https://github.com/alouiadel/ragstead.git
cd ragstead
docker compose up
```

Open <http://localhost:8000>. The first run pulls the models into the `ollama-data` volume; later runs work offline.

| Variable      | Default            | Description                        |
| ------------- | ------------------ | ---------------------------------- |
| `CHAT_MODEL`  | `lfm3`             | Ollama model used for generation   |
| `EMBED_MODEL` | `embeddinggemma-2` | Ollama model used for embeddings   |
| `TOP_K`       | `5`                | Chunks retrieved per query         |
| `DATA_DIR`    | `/data`            | SQLite database and uploaded files |

Set any of them in the environment or a `.env` file beside `docker-compose.yml`.

## Roadmap

- [ ] Chat CRUD with streaming responses
- [ ] Temporary per-chat uploads with TTL cleanup
- [ ] Knowledge libraries and per-chat attachment
- [ ] Inline citations with a source panel
- [ ] Docker Compose stack with Ollama

## License

[MIT](LICENSE) © 2026 Adel Aloui
