"""Checked campus-employment knowledge and the same retrieval rules as the TypeScript app."""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

CHECKED_AT = "2026-10-05"
DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "knowledge.json"

_data = json.loads(DATA_PATH.read_text(encoding="utf-8"))
topics: list[dict[str, Any]] = _data["topics"]
sources: list[dict[str, Any]] = _data["sources"]
entries: list[dict[str, Any]] = _data["entries"]
_source_by_id = {item["id"]: item for item in sources}

_START = re.compile(r"^(那|这|它|如果|怎么|需要|有哪些|可以)")
_TOPIC_WORDS = re.compile(
    r"实习|三方|社保|公积金|五险|试用|劳动|工资|欠薪|离职|辞职|辞退|加班|押金|证件|违约金|仲裁|年假|年休假|怀孕|产假|哺乳|工伤|受伤|派遣"
)
_SPACE = re.compile(r"[\s，。？！?,.!：:]")


def normalized(text: str) -> str:
    return _SPACE.sub("", text.lower())


def bigrams(text: str) -> set[str]:
    clean = "".join(char for char in text.lower() if char.isalnum())
    return {clean[index : index + 2] for index in range(len(clean) - 1)}


def contextual(question: str, history: list[dict[str, Any]]) -> bool:
    return bool(history) and bool(_START.match(normalized(question))) and not _TOPIC_WORDS.search(question)


def _score(entry: dict[str, Any], question: str) -> tuple[float, int]:
    query = normalized(question)
    hits = [word for word in entry["keywords"] if normalized(word) in query]
    score = float(sum(8 if len(word) >= 4 else 4 for word in hits))
    entry_tokens = bigrams(entry["title"] + " " + " ".join(entry["keywords"]))
    for token in bigrams(query):
        if token in entry_tokens:
            score += 0.25
    if entry["id"] == "intern-insurance" and re.search(r"实习|大三|在校", query) and re.search(r"社保|五险", query):
        score += 20
    if entry["id"] == "insurance-trial" and re.search(r"试用期|转正", query) and re.search(r"社保|五险", query):
        score += 20
    if entry["id"] == "agreement-cancel" and "三方" in query and re.search(r"换|不去|解约|反悔", query):
        score += 17
    if entry["id"] == "agreement-difference" and "三方" in query and re.search(r"区别|劳动合同|代替", query):
        score += 17
    if entry["id"] == "agreement-penalty" and "三方" in query and re.search(r"违约金|太高|降低", query):
        score += 20
    if entry["id"] == "intern-pay" and "实习" in query and re.search(r"工资|报酬|无薪", query):
        score += 19
    if entry["id"] == "intern-leave" and "实习" in query and re.search(r"提前|结束|辞职|离职", query):
        score += 18
    if entry["id"] == "insurance-basics" and "五险一金" in query and re.search(r"什么|包括", query):
        score += 20
    if entry["id"] == "insurance-rate" and re.search(r"社保|五险|公积金", query) and re.search(r"多少|基数|比例", query):
        score += 20
    if entry["id"] == "housing-start" and "公积金" in query and re.search(r"几个月|何时|什么时候|起缴|开始交", query):
        score += 20
    if entry["id"] == "unpaid" and re.search(r"拖欠|欠薪|没发|不发|不给工资", query):
        score += 25
    if entry["id"] == "relation-test" and "认定" in query and "劳动关系" in query:
        score += 22
    if entry["id"] == "probation-pay" and "试用期" in query and re.search(r"工资|多少钱|八成|80", query):
        score += 22
    if entry["id"] == "wage-payday" and re.search(r"发薪|工资条|工资清单|几号发|工资日|什么时候发", query):
        score += 18
    if entry["id"] == "annual-leave" and re.search(r"年假|年休假", query):
        score += 20
    if entry["id"] == "pregnancy" and re.search(r"怀孕|产假|哺乳", query):
        score += 22
    if entry["id"] == "injury" and re.search(r"工伤|受伤", query):
        score += 18
    if entry["id"] == "dispatch" and "派遣" in query:
        score += 22
    return score, len(hits)


def retrieve(question: str, history: list[dict[str, Any]] | None = None) -> list[dict[str, Any]]:
    history = history or []
    if contextual(question, history):
        return retrieve(history[-1]["question"], [])
    ranked = []
    for entry in entries:
        score, hits = _score(entry, question)
        if hits > 0 and score >= 4:
            ranked.append((score, entry))
    ranked.sort(key=lambda item: item[0], reverse=True)
    if not ranked and history and _START.match(normalized(question)):
        return retrieve(history[-1]["question"], [])
    return [entry for _score_value, entry in ranked[:3]]


def citations_for(entry: dict[str, Any]) -> list[dict[str, Any]]:
    quote = "\n".join(
        [entry["summary"], *[f"{item['title']}：{item['text']}" for item in entry["details"]]]
    )
    cited = []
    for source_id, article in entry["refs"]:
        source = _source_by_id.get(source_id)
        if source:
            cited.append({**source, "article": article, "quote": quote})
    return cited


def _empty_answer(notice: str | None) -> dict[str, Any]:
    answer = {
        "title": "这个问题还没有足够的已核对资料",
        "summary": "当前知识库未检索到足够贴合问题的依据，不能可靠地判断。你可以描述具体的实习、协议、参保或薪资情况。",
        "details": [
            {
                "title": "帮助判断的信息",
                "text": "请补充是否在校或毕业、工作城市、签订的协议类型、事情发生时间及你关心的具体条款。不要提供身份证号、手机号等不必要的个人信息。",
            }
        ],
        "actions": [],
        "followups": ["实习生受劳动法保护吗？", "三方协议和劳动合同有什么区别？", "五险一金到底是什么？"],
        "sources": [],
        "mode": "knowledge",
        "checkedAt": CHECKED_AT,
    }
    if notice:
        answer["notice"] = notice
    return answer


def knowledge_answer(
    question: str,
    city: str,
    history: list[dict[str, Any]] | None = None,
    notice: str | None = None,
) -> dict[str, Any]:
    history = history or []
    matched = retrieve(question, history)
    if not matched:
        return _empty_answer(notice)
    entry = matched[0]
    details = list(entry["details"])
    if city:
        details.append(
            {
                "title": "关于你填写的城市：" + city,
                "text": "以上是全国性规则。知识库未核验该城市的最新缴费比例、最低工资或具体办理流程，需向当地官方机构核实。",
            }
        )
    cited = citations_for(entry)
    markers = []
    for item in cited:
        token = f"[{item['id']}]"
        if token not in markers:
            markers.append(token)
    followup = contextual(question, history)
    answer = {
        "title": entry["title"],
        "summary": entry["summary"] + "".join(markers),
        "details": details,
        "actions": list(entry["actions"]),
        "followups": list(entry["followups"]),
        "sources": cited,
        "mode": "knowledge",
        "checkedAt": CHECKED_AT,
    }
    resolved = notice or (
        "根据上一条问题，找到以下相关知识。当前知识库模式无法对补充事实作个案判断。" if followup else None
    )
    if resolved:
        answer["notice"] = resolved
    return answer
