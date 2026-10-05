"""SQLite store for conversation history."""

from __future__ import annotations

import json
import sqlite3
from contextlib import closing
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parent.parent
DB_PATH = ROOT / "data" / "history.db"

_SCHEMA = """
CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    client_id TEXT NOT NULL,
    title TEXT NOT NULL,
    city TEXT NOT NULL DEFAULT '',
    identity TEXT NOT NULL DEFAULT 'unspecified',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS conversations_client_updated
    ON conversations (client_id, updated_at DESC);
CREATE TABLE IF NOT EXISTS turns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id TEXT NOT NULL,
    question TEXT NOT NULL,
    answer_json TEXT,
    error TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id)
);
CREATE INDEX IF NOT EXISTS turns_conversation ON turns (conversation_id, id);
"""


def init_db(path: Path | None = None) -> None:
    database = path or DB_PATH
    database.parent.mkdir(parents=True, exist_ok=True)
    with closing(sqlite3.connect(database)) as conn:
        conn.executescript(_SCHEMA)


def _connect(path: Path | None = None) -> sqlite3.Connection:
    database = path or DB_PATH
    database.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(database, timeout=5)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def _now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def save_turn(
    client_id: str,
    conversation_id: str,
    question: str,
    city: str,
    identity: str,
    answer: dict[str, Any] | None,
    error: str | None,
    path: Path | None = None,
) -> bool:
    now = _now()
    title = " ".join(question.split())[:42] or "未命名对话"
    with closing(_connect(path)) as conn:
        row = conn.execute("SELECT client_id FROM conversations WHERE id = ?", (conversation_id,)).fetchone()
        if row is not None and row["client_id"] != client_id:
            return False
        if row is None:
            conn.execute(
                """INSERT INTO conversations
                   (id, client_id, title, city, identity, created_at, updated_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?)""",
                (conversation_id, client_id, title, city, identity, now, now),
            )
        else:
            conn.execute(
                "UPDATE conversations SET city = ?, identity = ?, updated_at = ? WHERE id = ?",
                (city, identity, now, conversation_id),
            )
        conn.execute(
            """INSERT INTO turns (conversation_id, question, answer_json, error, created_at)
               VALUES (?, ?, ?, ?, ?)""",
            (
                conversation_id,
                question,
                json.dumps(answer, ensure_ascii=False) if answer else None,
                error,
                now,
            ),
        )
        conn.commit()
    return True


def list_conversations(client_id: str, path: Path | None = None) -> list[dict[str, Any]]:
    with closing(_connect(path)) as conn:
        rows = conn.execute(
            """SELECT c.id, c.title, c.updated_at, COUNT(t.id) AS turns
               FROM conversations c
               LEFT JOIN turns t ON t.conversation_id = c.id
               WHERE c.client_id = ?
               GROUP BY c.id
               ORDER BY c.updated_at DESC
               LIMIT 100""",
            (client_id,),
        ).fetchall()
    return [
        {"id": row["id"], "title": row["title"], "updatedAt": row["updated_at"], "turns": row["turns"]}
        for row in rows
    ]


def get_conversation(client_id: str, conversation_id: str, path: Path | None = None) -> dict[str, Any] | None:
    with closing(_connect(path)) as conn:
        conversation = conn.execute(
            "SELECT * FROM conversations WHERE id = ? AND client_id = ?",
            (conversation_id, client_id),
        ).fetchone()
        if conversation is None:
            return None
        turns = conn.execute(
            """SELECT id, question, answer_json, error, created_at
               FROM turns WHERE conversation_id = ? ORDER BY id""",
            (conversation_id,),
        ).fetchall()
    return {
        "id": conversation["id"],
        "title": conversation["title"],
        "city": conversation["city"],
        "identity": conversation["identity"],
        "updatedAt": conversation["updated_at"],
        "turns": [_turn_row(row) for row in turns],
    }


def _turn_row(row: sqlite3.Row) -> dict[str, Any]:
    answer = None
    if row["answer_json"]:
        try:
            parsed = json.loads(row["answer_json"])
        except json.JSONDecodeError:
            parsed = None
        if isinstance(parsed, dict):
            answer = parsed
    return {
        "id": row["id"],
        "question": row["question"],
        "answer": answer,
        "error": row["error"],
        "createdAt": row["created_at"],
    }
