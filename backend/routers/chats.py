import json

import httpx
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from .. import db, llama

router = APIRouter()

SYSTEM_PROMPT = {"role": "system", "content": "You are a helpful assistant."}


class MessageBody(BaseModel):
    content: str = Field(min_length=1)


class DeleteChatsBody(BaseModel):
    ids: list[str] = Field(min_length=1, max_length=500)


@router.get("/chats")
async def chats(q: str = ""):
    return {"chats": db.list_chats(q)}


@router.post("/chats", status_code=201)
async def new_chat():
    return db.create_chat()


@router.post("/chats/bulk-delete")
async def delete_chats(body: DeleteChatsBody):
    return {"deleted": db.delete_chats(body.ids)}


@router.get("/chats/{chat_id}")
async def chat_detail(chat_id: str):
    chat = db.get_chat(chat_id)
    if chat is None:
        raise HTTPException(status_code=404, detail="Chat not found")
    return {"chat": chat, "messages": db.list_messages(chat_id)}


@router.delete("/chats/{chat_id}")
async def delete_chat(chat_id: str):
    if not db.delete_chat(chat_id):
        raise HTTPException(status_code=404, detail="Chat not found")
    return {"deleted": True}


@router.post("/chats/{chat_id}/messages")
async def send_message(chat_id: str, body: MessageBody):
    chat = db.get_chat(chat_id)
    if chat is None:
        raise HTTPException(status_code=404, detail="Chat not found")
    content = body.content.strip()
    if not content:
        raise HTTPException(status_code=422, detail="Message cannot be empty")

    history = [
        {"role": message["role"], "content": message["content"]}
        for message in db.list_messages(chat_id)
    ]
    user_message = db.add_message(chat_id, "user", content)
    if chat["title"] == db.DEFAULT_CHAT_TITLE:
        title = content[:48] + ("…" if len(content) > 48 else "")
        db.set_title(chat_id, title)

    def sse(event):
        return f"data: {json.dumps(event)}\n\n"

    async def event_stream():
        yield sse(
            {
                "type": "chat",
                "chat": db.get_chat(chat_id),
                "user_message": user_message,
            }
        )
        parts = []
        try:
            async for delta in llama.stream_chat_completion(
                [SYSTEM_PROMPT, *history, {"role": "user", "content": content}]
            ):
                parts.append(delta)
                yield sse({"type": "delta", "content": delta})
        except httpx.HTTPError:
            yield sse(
                {
                    "type": "error",
                    "detail": "The chat model could not answer. Check llama.cpp.",
                }
            )
            return

        answer = "".join(parts).strip()
        assistant_message = db.add_message(chat_id, "assistant", answer)
        yield sse(
            {
                "type": "done",
                "chat": db.get_chat(chat_id),
                "assistant_message": assistant_message,
            }
        )

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
