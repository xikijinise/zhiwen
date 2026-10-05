"""职问 HTTP API and static demo."""

from __future__ import annotations

import json
import logging
import os
import re
from pathlib import Path
from urllib.parse import urlparse

from fastapi import FastAPI, Request
from fastapi.responses import FileResponse, JSONResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field, ValidationError

from app import store
from app.chain import complete_answer, model_key, model_name, stream_answer
from app.knowledge import CHECKED_AT, sources, topics

ROOT = Path(__file__).resolve().parent.parent
STATIC = ROOT / "static"
DIST = ROOT / "web" / "dist"
ENV_FILE = Path("/etc/zhiwen-campus.env")

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s %(message)s")
log = logging.getLogger("zhiwen")
store.init_db()
app = FastAPI(title="职问", docs_url=None, redoc_url=None, openapi_url=None)
app.mount("/static", StaticFiles(directory=STATIC), name="static")
app.mount("/assets", StaticFiles(directory=DIST / "assets"), name="assets")


def _apply_env_file(path: Path) -> None:
    if not path.is_file():
        return
    for line in path.read_text(encoding="utf-8").splitlines():
        text = line.strip()
        if not text or text.startswith("#") or "=" not in text:
            continue
        name, value = text.split("=", 1)
        os.environ.setdefault(name.strip(), value.strip().strip('"').strip("'"))


def load_env() -> None:
    # 已有环境变量优先。本地 .env 给自己跑，/etc 是这台机器上的部署文件。
    _apply_env_file(ROOT / ".env")
    _apply_env_file(ENV_FILE)


load_env()


class HistoryItem(BaseModel):
    question: str = Field(max_length=1800)
    summary: str | None = Field(default=None, max_length=3000)


class ChatRequest(BaseModel):
    question: str
    city: str = ""
    identity: str = "unspecified"
    history: list[HistoryItem] = Field(default_factory=list)
    stream: bool | None = None
    clientId: str = ""
    conversationId: str = ""


_ID = re.compile(r"^[0-9a-zA-Z-]{8,64}$")


def _json(value: dict, status: int = 200) -> JSONResponse:
    return JSONResponse(value, status_code=status, headers={"Cache-Control": "no-store", "X-Content-Type-Options": "nosniff"})


def _origin_error(request: Request) -> JSONResponse | None:
    origin = request.headers.get("origin")
    if not origin:
        return None
    try:
        origin_host = urlparse(origin).netloc
    except ValueError:
        return _json({"error": "请从本站页面发起提问。"}, 403)
    if not origin_host:
        return _json({"error": "请从本站页面发起提问。"}, 403)
    forwarded = request.headers.get("x-forwarded-host") or request.headers.get("host") or request.url.netloc
    host = forwarded.split(",")[0].strip()
    if origin_host != host:
        return _json({"error": "请从本站页面发起提问。"}, 403)
    return None


def _validate(payload: ChatRequest) -> str | None:
    question = payload.question.strip()
    if not question:
        return "请输入问题。"
    if len(question) > 1800:
        return "问题请控制在1800字以内。"
    payload.question = question
    payload.city = payload.city.strip()
    if len(payload.city) > 30:
        return "城市请控制在30字以内。"
    if payload.identity not in {"unspecified", "student", "graduating", "employed"}:
        return "请输入有效问题。"
    if len(payload.history) > 6:
        return "请输入有效问题。"
    client_id = payload.clientId.strip()
    conversation_id = payload.conversationId.strip()
    if client_id or conversation_id:
        if not _ID.fullmatch(client_id) or not _ID.fullmatch(conversation_id):
            return "请输入有效问题。"
    payload.clientId = client_id
    payload.conversationId = conversation_id
    return None


def _client_id(request: Request) -> str:
    return (request.headers.get("x-client-id") or "").strip()


def _remember(payload: ChatRequest, answer: dict | None, error: str | None) -> None:
    if not payload.clientId or not payload.conversationId:
        return
    try:
        store.save_turn(
            payload.clientId,
            payload.conversationId,
            payload.question,
            payload.city,
            payload.identity,
            answer,
            error,
        )
    except Exception:
        log.exception("history_save_failed")


@app.get("/")
def home() -> FileResponse:
    return FileResponse(
        DIST / "index.html",
        headers={"Cache-Control": "no-store", "X-Content-Type-Options": "nosniff"},
    )


@app.get("/favicon.svg")
def favicon() -> FileResponse:
    return FileResponse(STATIC / "favicon.svg", media_type="image/svg+xml")


_ICONS = {
    "icon-192.png",
    "icon-512.png",
    "icon-maskable-192.png",
    "icon-maskable-512.png",
}


def _dist_file(relative: str, media_type: str, cache: str) -> FileResponse:
    return FileResponse(
        DIST / relative,
        media_type=media_type,
        headers={"Cache-Control": cache, "X-Content-Type-Options": "nosniff"},
    )


@app.get("/manifest.webmanifest")
def manifest() -> FileResponse:
    return _dist_file("manifest.webmanifest", "application/manifest+json", "no-cache")


@app.get("/sw.js")
def service_worker() -> FileResponse:
    return _dist_file("sw.js", "text/javascript", "no-cache")


@app.get("/icons/{filename}")
def icon(filename: str) -> FileResponse:
    if filename not in _ICONS:
        return _json({"error": "没有找到这个图标。"}, 404)
    return _dist_file(f"icons/{filename}", "image/png", "public, max-age=86400")


@app.get("/api/chat")
def chat_status() -> JSONResponse:
    key = model_key()
    return _json(
        {
            "aiConfigured": bool(key),
            "provider": "deepseek" if key else "knowledge",
            "model": model_name(),
            "checkedAt": CHECKED_AT,
        }
    )


@app.get("/api/bootstrap")
def bootstrap() -> JSONResponse:
    return _json({"topics": topics, "sources": sources, "checkedAt": CHECKED_AT})


@app.post("/api/chat")
async def chat(request: Request):
    blocked = _origin_error(request)
    if blocked:
        return blocked
    content_type = request.headers.get("content-type") or ""
    if "application/json" not in content_type:
        return _json({"error": "请提交有效的问题。"}, 415)
    raw = await request.body()
    if len(raw) > 25000:
        return _json({"error": "提交内容过长，请缩短问题。"}, 413)
    try:
        body = json.loads(raw)
    except json.JSONDecodeError:
        return _json({"error": "问题格式有误，请重试。"}, 400)
    try:
        payload = ChatRequest.model_validate(body)
    except ValidationError:
        return _json({"error": "请输入有效问题。"}, 400)
    message = _validate(payload)
    if message:
        return _json({"error": message}, 400)
    history = [item.model_dump() for item in payload.history]
    wants_stream = bool(payload.stream) or "text/event-stream" in (request.headers.get("accept") or "")
    if not wants_stream:
        try:
            answer = await complete_answer(payload.question, payload.city, payload.identity, history)
        except Exception:
            _remember(payload, None, "本次回答已中止，请重新提问。")
            return _json({"error": "本次回答已中止，请重新提问。"}, 499)
        _remember(payload, answer, None)
        return _json(answer)

    async def events():
        answer = None
        stopped = False
        try:
            async for event, data in stream_answer(
                payload.question,
                payload.city,
                payload.identity,
                history,
                request.is_disconnected,
            ):
                if event == "done":
                    answer = data
                yield f"event: {event}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"
        except Exception:
            stopped = True
            if not await request.is_disconnected():
                message = json.dumps({"message": "本次回答已中止，请重新提问。"}, ensure_ascii=False)
                yield f"event: error\ndata: {message}\n\n"
        if answer is not None:
            _remember(payload, answer, None)
        elif stopped or await request.is_disconnected():
            _remember(payload, None, "本次回答已停止。你可以重新提问。")
        else:
            _remember(payload, None, "暂时没有收到回答，请重试。")

    return StreamingResponse(
        events(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache, no-transform",
            "X-Accel-Buffering": "no",
            "X-Content-Type-Options": "nosniff",
        },
    )


@app.get("/api/history")
def history_list(request: Request):
    blocked = _origin_error(request)
    if blocked:
        return blocked
    client_id = _client_id(request)
    if not _ID.fullmatch(client_id):
        return _json({"error": "请从本站页面发起提问。"}, 400)
    return _json({"conversations": store.list_conversations(client_id)})


@app.get("/api/history/{conversation_id}")
def history_detail(conversation_id: str, request: Request):
    blocked = _origin_error(request)
    if blocked:
        return blocked
    client_id = _client_id(request)
    if not _ID.fullmatch(client_id) or not _ID.fullmatch(conversation_id):
        return _json({"error": "请从本站页面发起提问。"}, 400)
    conversation = store.get_conversation(client_id, conversation_id)
    if conversation is None:
        return _json({"error": "没有找到这段对话。"}, 404)
    return _json(conversation)
