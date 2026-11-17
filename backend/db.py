import sqlite3
import uuid
from contextlib import contextmanager
from datetime import datetime, timezone

from . import config

DB_PATH = config.DATA_DIR / "ragstead.db"
DEFAULT_CHAT_TITLE = "New chat"
SCHEMA = """
CREATE TABLE IF NOT EXISTS chats (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chat_id TEXT NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL
);
"""


def now():
    return datetime.now(timezone.utc).isoformat()


@contextmanager
def connect():
    config.DATA_DIR.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    try:
        yield connection
        connection.commit()
    finally:
        connection.close()


def row_to_dict(row):
    return dict(row) if row is not None else None


def init_db():
    with connect() as connection:
        connection.executescript(SCHEMA)


def list_chats(query=""):
    pattern = f"%{query.strip()}%"
    with connect() as connection:
        rows = connection.execute(
            "SELECT * FROM chats WHERE title LIKE ? ORDER BY updated_at DESC",
            (pattern,),
        ).fetchall()
    return [dict(row) for row in rows]


def create_chat(title=DEFAULT_CHAT_TITLE):
    timestamp = now()
    chat = {
        "id": uuid.uuid4().hex,
        "title": title,
        "created_at": timestamp,
        "updated_at": timestamp,
    }
    with connect() as connection:
        connection.execute(
            "INSERT INTO chats (id, title, created_at, updated_at)"
            " VALUES (:id, :title, :created_at, :updated_at)",
            chat,
        )
    return chat


def get_chat(chat_id):
    with connect() as connection:
        row = connection.execute(
            "SELECT * FROM chats WHERE id = ?", (chat_id,)
        ).fetchone()
    return row_to_dict(row)


def list_messages(chat_id):
    with connect() as connection:
        rows = connection.execute(
            "SELECT * FROM messages WHERE chat_id = ? ORDER BY id ASC", (chat_id,)
        ).fetchall()
    return [dict(row) for row in rows]


def add_message(chat_id, role, content):
    timestamp = now()
    with connect() as connection:
        cursor = connection.execute(
            "INSERT INTO messages (chat_id, role, content, created_at)"
            " VALUES (?, ?, ?, ?)",
            (chat_id, role, content, timestamp),
        )
        connection.execute(
            "UPDATE chats SET updated_at = ? WHERE id = ?", (timestamp, chat_id)
        )
        row = connection.execute(
            "SELECT * FROM messages WHERE id = ?", (cursor.lastrowid,)
        ).fetchone()
    return dict(row)


def delete_chat(chat_id):
    with connect() as connection:
        cursor = connection.execute("DELETE FROM chats WHERE id = ?", (chat_id,))
    return cursor.rowcount > 0


def delete_chats(chat_ids):
    ids = list(dict.fromkeys(chat_ids))
    if not ids:
        return 0
    placeholders = ", ".join("?" for _ in ids)
    with connect() as connection:
        cursor = connection.execute(
            f"DELETE FROM chats WHERE id IN ({placeholders})", ids
        )
    return cursor.rowcount


def set_title(chat_id, title):
    with connect() as connection:
        connection.execute("UPDATE chats SET title = ? WHERE id = ?", (title, chat_id))
