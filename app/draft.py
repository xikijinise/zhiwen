"""Incremental parser for a partially streamed answer JSON object."""

from __future__ import annotations

import re

_ESCAPES = {"n": "\n", "t": "\t", "r": "\r", '"': '"', "\\": "\\", "/": "/"}


def read_draft(raw: str) -> dict:
    parser = _Parser(raw)
    parser.parse()
    parser.draft["details"] = [item for item in parser.draft["details"] if item["title"] or item["text"]]
    parser.draft["actions"] = parser.draft["actions"][:5]
    return parser.draft


class _Parser:
    def __init__(self, raw: str) -> None:
        self.source = raw.strip()
        self.index = 0
        self.draft: dict = {"title": "", "summary": "", "details": [], "actions": []}

    def parse(self) -> None:
        self._skip()
        start = self.source.find("{", self.index)
        if start < 0:
            return
        self.index = start + 1
        self._parse_object(self._on_root)

    def _skip(self) -> None:
        while self.index < len(self.source) and self.source[self.index] in " \n\r\t":
            self.index += 1

    def _read_string(self) -> dict | None:
        if self.index >= len(self.source) or self.source[self.index] != '"':
            return None
        self.index += 1
        value = ""
        while self.index < len(self.source):
            char = self.source[self.index]
            self.index += 1
            if char == '"':
                return {"value": value, "complete": True}
            if char != "\\":
                value += char
                continue
            if self.index >= len(self.source):
                return {"value": value, "complete": False}
            nxt = self.source[self.index]
            self.index += 1
            if nxt == "u":
                hex_text = self.source[self.index : self.index + 4]
                if not re.fullmatch(r"[0-9a-fA-F]{4}", hex_text):
                    return {"value": value, "complete": False}
                value += chr(int(hex_text, 16))
                self.index += 4
            else:
                value += _ESCAPES.get(nxt, nxt)
        return {"value": value, "complete": False}

    def _parse_object(self, on_key) -> None:
        while self.index < len(self.source):
            self._skip()
            if self.index >= len(self.source):
                return
            if self.source[self.index] == "}":
                self.index += 1
                return
            if self.source[self.index] == ",":
                self.index += 1
                continue
            if self.source[self.index] != '"':
                return
            key = self._read_string()
            if not key or not key["complete"]:
                return
            self._skip()
            if self.index >= len(self.source) or self.source[self.index] != ":":
                return
            self.index += 1
            on_key(key["value"])

    def _parse_array(self, key: str) -> None:
        while self.index < len(self.source):
            self._skip()
            if self.index >= len(self.source):
                return
            if self.source[self.index] == "]":
                self.index += 1
                return
            if self.source[self.index] == ",":
                self.index += 1
                continue
            if key == "details" and self.source[self.index] == "{":
                self.index += 1
                item = {"title": "", "text": ""}
                self.draft["details"].append(item)
                self._parse_object(lambda field, item=item: self._on_detail(item, field))
                continue
            if key == "actions" and self.source[self.index] == '"':
                text = self._read_string()
                if not text:
                    return
                if text["value"]:
                    self.draft["actions"].append(text["value"])
                if not text["complete"]:
                    return
                continue
            self._parse_value()

    def _on_detail(self, item: dict, field: str) -> None:
        self._skip()
        if self.index >= len(self.source) or self.source[self.index] != '"':
            self._parse_value()
            return
        text = self._read_string()
        if not text:
            return
        if field == "title":
            item["title"] = text["value"]
        if field == "text":
            item["text"] = text["value"]

    def _parse_value(self) -> None:
        self._skip()
        if self.index >= len(self.source):
            return
        if self.source[self.index] == '"':
            self._read_string()
            return
        if self.source[self.index] == "{":
            self.index += 1
            self._parse_object(lambda _key: self._parse_value())
            return
        if self.source[self.index] == "[":
            self.index += 1
            self._parse_array("")
            return
        while self.index < len(self.source) and self.source[self.index] not in ",}]":
            self.index += 1

    def _on_root(self, key: str) -> None:
        self._skip()
        if self.index >= len(self.source):
            return
        if key in ("title", "summary") and self.source[self.index] == '"':
            text = self._read_string()
            if not text:
                return
            if key == "title":
                self.draft["title"] = text["value"]
            if key == "summary":
                self.draft["summary"] = text["value"]
            return
        if key in ("details", "actions", "followups", "citationIds") and self.source[self.index] == "[":
            self.index += 1
            self._parse_array(key)
            return
        self._parse_value()
