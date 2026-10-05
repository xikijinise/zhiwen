const BOOT = JSON.parse(document.getElementById("boot").textContent);
const ICONS = {
  scale: [["path", { d: "M12 3v18" }], ["path", { d: "m19 8 3 8a5 5 0 0 1-6 0zV7" }], ["path", { d: "M3 7h1a17 17 0 0 0 8-2 17 17 0 0 0 8 2h1" }], ["path", { d: "m5 8 3 8a5 5 0 0 1-6 0zV7" }], ["path", { d: "M7 21h10" }]],
  plus: [["path", { d: "M5 12h14" }], ["path", { d: "M12 5v14" }]],
  "message-circle": [["path", { d: "M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719" }]],
  "graduation-cap": [["path", { d: "M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" }], ["path", { d: "M22 10v6" }], ["path", { d: "M6 12.5V16a6 3 0 0 0 12 0v-3.5" }]],
  "file-check-2": [["path", { d: "M10.5 22H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.706.706l3.588 3.588A2.4 2.4 0 0 1 20 8v6" }], ["path", { d: "M14 2v5a1 1 0 0 0 1 1h5" }], ["path", { d: "m14 20 2 2 4-4" }]],
  "shield-check": [["path", { d: "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" }], ["path", { d: "m9 12 2 2 4-4" }]],
  "briefcase-business": [["path", { d: "M12 12h.01" }], ["path", { d: "M16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" }], ["path", { d: "M22 13a18.15 18.15 0 0 1-20 0" }], ["rect", { width: "20", height: "14", x: "2", y: "6", rx: "2" }]],
  wallet: [["path", { d: "M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" }], ["path", { d: "M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" }]],
  "book-open": [["path", { d: "M12 5v16" }], ["path", { d: "M20.001 19A2 2 0 0022 17V5a2 2 0 00-1.999-2L16 3.002A5 5 0 0012 5a5 5 0 00-4-2H4a2 2 0 00-2 2v12a2 2 0 001.999 2H8a5 5 0 014 2 5 5 0 014-2z" }]],
  "map-pin": [["path", { d: "M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" }], ["circle", { cx: "12", cy: "10", r: "3" }]],
  send: [["path", { d: "M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z" }], ["path", { d: "m21.854 2.147-10.94 10.939" }]],
  square: [["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }]],
  "chevron-right": [["path", { d: "m9 18 6-6-6-6" }]],
  "external-link": [["path", { d: "M15 3h6v6" }], ["path", { d: "M10 14 21 3" }], ["path", { d: "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" }]],
  check: [["path", { d: "M20 6 9 17l-5-5" }]],
  "circle-help": [["circle", { cx: "12", cy: "12", r: "10" }], ["path", { d: "M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" }], ["path", { d: "M12 17h.01" }]],
  landmark: [["path", { d: "M10 18v-7" }], ["path", { d: "M11.119 2.205a2 2 0 0 1 1.762 0l7.84 3.846A.5.5 0 0 1 20.5 7h-17a.5.5 0 0 1-.22-.949z" }], ["path", { d: "M14 18v-7" }], ["path", { d: "M18 18v-7" }], ["path", { d: "M3 22h18" }], ["path", { d: "M6 18v-7" }]],
  copy: [["rect", { width: "14", height: "14", x: "8", y: "8", rx: "2", ry: "2" }], ["path", { d: "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" }]],
  "loader-circle": [["path", { d: "M21 12a9 9 0 1 1-6.219-8.56" }]],
  "panel-left": [["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }], ["path", { d: "M9 3v18" }]],
  clock: [["circle", { cx: "12", cy: "12", r: "10" }], ["path", { d: "M12 6v6l4 2" }]]
};
const TOPIC_ICON = { all: "message-circle", intern: "graduation-cap", agreement: "file-check-2", insurance: "shield-check", contract: "briefcase-business", rights: "wallet" };
const shell = document.getElementById("shell");
const side = document.getElementById("side");
const scrim = document.getElementById("scrim");
const scroller = document.getElementById("scroller");
const nav = document.getElementById("nav");
const form = document.getElementById("composer");
const input = document.getElementById("question-input");
const send = document.getElementById("send");
const sheet = document.getElementById("sheet");
const mobileQuery = window.matchMedia("(max-width: 767px)");
const state = { active: "all", view: "chat", turns: [], records: [], busy: false, pin: true, serial: 0, controller: null, frame: 0, queued: null, desktopOpen: true, conversationId: null };

function svg(name, size, fill) {
  const nodes = ICONS[name] || [];
  const body = nodes.map(([tag, attrs]) => `<${tag} ${Object.entries(attrs).map(([key, value]) => `${key}="${value}"`).join(" ")}/>`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="${fill || "none"}" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
}
function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
}
function isMobile() { return mobileQuery.matches; }
function setSidebar(open) {
  if (isMobile()) {
    shell.classList.toggle("is-mobile-open", open);
    shell.classList.remove("is-collapsed");
    side.dataset.state = "expanded";
    side.dataset.collapsible = "";
    scrim.hidden = !open;
    return;
  }
  shell.classList.remove("is-mobile-open");
  shell.classList.toggle("is-collapsed", !open);
  side.dataset.state = open ? "expanded" : "collapsed";
  side.dataset.collapsible = open ? "" : "offcanvas";
  scrim.hidden = true;
}
function toggleSidebar() {
  if (isMobile()) setSidebar(!shell.classList.contains("is-mobile-open"));
  else { state.desktopOpen = !state.desktopOpen; setSidebar(state.desktopOpen); }
}
function nearBottom() {
  if (scroller.clientHeight < 40) return state.pin;
  return scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight < 64;
}
function cards() {
  if (state.active === "all") {
    const listed = BOOT.topics.filter((topic) => topic.id !== "all").map((topic) => ({ topic, question: topic.examples[0] }));
    const insurance = BOOT.topics.find((topic) => topic.id === "insurance");
    return listed.concat([{ topic: insurance, question: "试用期不交社保，合法吗？" }]);
  }
  const topic = BOOT.topics.find((item) => item.id === state.active);
  return topic.examples.map((question) => ({ topic, question }));
}
function markerHtml(text, turnId, streaming, active) {
  const visible = streaming ? String(text).replace(/\[[0-9]{0,2}$/, "") : String(text);
  return visible.split(/(\[\d{2}\])/g).map((part) => {
    const mark = /^\[(\d{2})\]$/.exec(part);
    if (!mark) return esc(part);
    const source = BOOT.sources.find((item) => item.id === mark[1]);
    if (!source) return "";
    const label = String(Number(mark[1]));
    if (streaming) return `<span class="cite-mark is-static" title="${esc(source.title)}">${label}</span>`;
    return `<button type="button" class="cite-mark${active === mark[1] ? " is-active" : ""}" data-cite="${mark[1]}" data-turn="${turnId}" aria-label="查看知识库位置 ${label}，${esc(source.title)}">${label}</button>`;
  }).join("");
}
function caret() { return `<span class="stream-caret" aria-hidden="true"></span>`; }
function draftHtml(draft) {
  const writing = draft.actions.length ? "actions" : draft.details.length ? "details" : draft.summary ? "summary" : "title";
  const details = draft.details.map((item, index) => `<section><h3>${esc(item.title)}${writing === "details" && index === draft.details.length - 1 && !item.text ? caret() : ""}</h3>${item.text ? `<p>${markerHtml(item.text, "", true)}${writing === "details" && index === draft.details.length - 1 ? caret() : ""}</p>` : ""}</section>`).join("");
  const actions = draft.actions.map((item, index) => `<li>${esc(item)}${writing === "actions" && index === draft.actions.length - 1 ? caret() : ""}</li>`).join("");
  return `<article class="answer-card is-streaming" aria-busy="true"><h2>${esc(draft.title.replace(/\[\d{2}\]/g, ""))}${writing === "title" ? caret() : ""}</h2>${draft.summary ? `<p class="answer-summary">${markerHtml(draft.summary, "", true)}${writing === "summary" ? caret() : ""}</p>` : ""}${details ? `<div class="answer-details">${details}</div>` : ""}${actions ? `<section class="actions-box"><ol>${actions}</ol></section>` : ""}</article>`;
}
function answerHtml(turn) {
  const answer = turn.answer;
  const picked = turn.picked || "";
  const panel = answer.sources.filter((item) => item.id === picked).map((item) => `<article><p class="cite-kicker">${esc(item.article)}</p><h3>${esc(item.title)}</h3><blockquote>${esc(item.quote)}</blockquote><a href="${esc(item.url)}" target="_blank" rel="noopener noreferrer">原文${svg("external-link", 14)}</a></article>`).join("");
  const sources = answer.sources.map((item) => `<div class="source-row${picked === item.id ? " is-active" : ""}"><button type="button" data-cite="${esc(item.id)}" data-turn="${turn.id}"><span class="source-number">${Number(item.id)}</span><span>${esc(item.title)}<small>${esc(item.article)}</small></span></button><a href="${esc(item.url)}" target="_blank" rel="noopener noreferrer" aria-label="打开${esc(item.title)}">${svg("external-link", 15)}</a></div>`).join("");
  const followups = answer.followups.map((question, index) => `<button type="button" data-follow="${turn.id}" data-index="${index}">${esc(question)}${svg("chevron-right", 14)}</button>`).join("");
  return `<article class="answer-card"><button class="copy-button" type="button" data-copy="${turn.id}" aria-label="${turn.copied ? "已复制" : "复制回答"}">${turn.copied ? svg("check", 17) : svg("copy", 17)}</button>${answer.notice ? `<p class="answer-notice">${esc(answer.notice)}</p>` : ""}<h2>${esc(answer.title)}</h2><p class="answer-summary">${markerHtml(answer.summary, turn.id, false, picked)}</p><div class="answer-details">${answer.details.map((item) => `<section><h3>${esc(item.title)}</h3><p>${markerHtml(item.text, turn.id, false, picked)}</p></section>`).join("")}</div>${panel ? `<div class="cite-panel">${panel}</div>` : ""}${answer.actions.length ? `<section class="actions-box"><ol>${answer.actions.map((item) => `<li>${esc(item)}</li>`).join("")}</ol></section>` : ""}${sources ? `<div class="answer-sources">${sources}</div>` : ""}${followups ? `<div class="followups">${followups}</div>` : ""}</article>`;
}
function clientId() {
  const key = "zhiwen-client";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}
function formatTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
}
function renderNav() {
  const historyOn = state.view === "history";
  const historyItem = `<li><button type="button" class="nav-item" data-history="1" data-active="${historyOn}"><span class="nav-ico">${svg("clock", 19)}</span><span>历史记录</span>${historyOn ? `<span class="nav-mark"></span>` : ""}</button></li>`;
  const topics = BOOT.topics.map((topic) => `<li><button type="button" class="nav-item" data-topic="${topic.id}" data-active="${!historyOn && state.active === topic.id}"><span class="nav-ico">${svg(TOPIC_ICON[topic.id], 19)}</span><span>${esc(topic.label)}</span>${!historyOn && state.active === topic.id ? `<span class="nav-mark"></span>` : ""}</button></li>`).join("");
  nav.innerHTML = `<ul class="nav-list">${historyItem}${topics}</ul>`;
}
function renderConversation() {
  if (state.view === "history") {
    const rows = state.records.length
      ? state.records.map((item) => `<button type="button" class="history-row" data-open="${esc(item.id)}"><span>${esc(item.title)}</span><time>${esc(formatTime(item.updatedAt))}</time></button>`).join("")
      : `<p class="history-empty">还没有历史对话</p>`;
    scroller.innerHTML = `<section class="welcome history-list">${rows}</section>`;
    return;
  }
  if (!state.turns.length) {
    scroller.innerHTML = `<section class="welcome"><div class="question-grid">${cards().map((card) => `<button class="question-card" type="button" data-ask="${esc(card.question)}" ${state.busy ? "disabled" : ""}><span class="question-category">${svg(TOPIC_ICON[card.topic.id], 18)}${esc(card.topic.label)}</span><span class="question-text">${esc(card.question)}</span>${svg("chevron-right", 17).replace("<svg", '<svg class="question-go"')}</button>`).join("")}</div></section>`;
  } else {
    scroller.innerHTML = `<div class="turns">${state.turns.map((turn) => `<div class="turn"><div class="user-message"><p>${esc(turn.question)}</p></div>${turn.answer ? answerHtml(turn) : turn.error ? `<div class="error-box" role="alert">${svg("circle-help", 19)}<span>${esc(turn.error)}</span><button type="button" data-retry="${turn.id}" ${state.busy ? "disabled" : ""}>重试</button></div>` : turn.draft ? draftHtml(turn.draft) : `<div class="loading-answer" role="status" aria-label="正在查找">${svg("loader-circle", 18).replace("<svg", '<svg class="spin"')}<span class="sk a"></span><span class="sk b"></span></div>`}</div>`).join("")}</div>`;
  }
  if (state.pin && state.turns.length) scroller.scrollTop = scroller.scrollHeight;
}
function updateComposer() {
  const compact = input.value.length < 36 && !input.value.includes("\n");
  form.classList.toggle("is-compact", compact);
  input.rows = compact ? 1 : 2;
  if (state.busy) {
    send.disabled = false;
    send.type = "button";
    send.innerHTML = `${svg("square", 14, "currentColor")}<span>停止</span>`;
    send.setAttribute("aria-label", "停止回答");
    return;
  }
  send.disabled = !input.value.trim();
  send.type = "submit";
  send.innerHTML = `<span>发送</span>${svg("send", 16)}`;
  send.removeAttribute("aria-label");
}
function stopFrame() {
  if (state.frame) cancelAnimationFrame(state.frame);
  state.frame = 0;
  state.queued = null;
}
function reset() {
  state.serial += 1;
  state.controller?.abort();
  stopFrame();
  state.busy = false;
  state.turns = [];
  state.active = "all";
  state.view = "chat";
  state.conversationId = null;
  state.pin = true;
  input.value = "";
  if (isMobile()) setSidebar(false);
  renderNav();
  renderConversation();
  updateComposer();
}
async function ask(text) {
  const question = text.trim();
  if (!question || state.busy || question.length > 1800) return;
  state.view = "chat";
  state.busy = true;
  state.pin = true;
  if (!state.conversationId) state.conversationId = crypto.randomUUID();
  input.value = "";
  updateComposer();
  const id = Date.now();
  const ticket = state.serial;
  const history = state.turns.slice(-6).map((turn) => ({ question: turn.question, summary: turn.answer?.summary || "" }));
  state.turns.push({ id, question, picked: null, copied: false });
  renderConversation();
  const abort = new AbortController();
  state.controller = abort;
  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
      body: JSON.stringify({
        question,
        city: document.getElementById("city").value.trim(),
        identity: document.getElementById("identity").value,
        history,
        stream: true,
        clientId: clientId(),
        conversationId: state.conversationId
      }),
      signal: abort.signal
    });
    if (!response.ok || !response.body) {
      const data = await response.json().catch(() => ({ error: "暂时没有收到回答，请重试。" }));
      throw new Error(data.error || "暂时没有收到回答，请重试。");
    }
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let pending = "";
    let answer;
    const apply = (block) => {
      let event = "message";
      const data = [];
      for (const line of block.split(/\r?\n/)) {
        if (line.startsWith("event:")) event = line.slice(6).trim();
        else if (line.startsWith("data:")) data.push(line.slice(5).trim());
      }
      if (!data.length || ticket !== state.serial) return;
      const payload = JSON.parse(data.join("\n"));
      if (event === "draft") {
        state.queued = payload;
        if (!state.frame) {
          state.frame = requestAnimationFrame(() => {
            state.frame = 0;
            const next = state.queued;
            state.queued = null;
            const turn = state.turns.find((item) => item.id === id);
            if (!next || ticket !== state.serial || !turn || turn.answer) return;
            turn.draft = next;
            renderConversation();
          });
        }
      } else if (event === "done") {
        stopFrame();
        answer = payload;
      } else if (event === "error") throw new Error(payload.message || "暂时没有收到回答，请重试。");
    };
    while (true) {
      const chunk = await reader.read();
      pending += decoder.decode(chunk.value, { stream: !chunk.done });
      const blocks = pending.split(/\n\n/);
      pending = blocks.pop() ?? "";
      for (const block of blocks) apply(block);
      if (chunk.done) break;
    }
    if (pending.trim()) apply(pending);
    stopFrame();
    if (ticket !== state.serial) return;
    if (!answer) throw new Error("暂时没有收到回答，请重试。");
    const turn = state.turns.find((item) => item.id === id);
    if (turn) { turn.answer = answer; turn.draft = undefined; }
    renderConversation();
  } catch (error) {
    stopFrame();
    if (ticket !== state.serial) return;
    const turn = state.turns.find((item) => item.id === id);
    const message = error instanceof Error && error.name === "AbortError" ? "本次回答已停止。你可以重新提问。" : error instanceof Error ? error.message : "连接暂时失败，请重试。";
    if (turn) { turn.draft = undefined; turn.error = message; }
    renderConversation();
  } finally {
    if (ticket === state.serial) {
      state.busy = false;
      state.controller = null;
      updateComposer();
      renderConversation();
    }
  }
}
function turnById(id) { return state.turns.find((turn) => String(turn.id) === String(id)); }

document.getElementById("brand-icon").innerHTML = svg("scale", 23);
document.getElementById("hide-side").innerHTML = svg("panel-left", 18);
document.getElementById("show-side").innerHTML = svg("panel-left", 18);
document.getElementById("open-sources").innerHTML = svg("book-open", 17);
document.getElementById("id-icon").innerHTML = svg("graduation-cap", 16);
document.getElementById("pin-icon").innerHTML = svg("map-pin", 16);
document.getElementById("landmark-icon").innerHTML = svg("landmark", 23);
document.getElementById("new-chat").innerHTML = `${svg("plus", 18)} 开始新对话`;
document.getElementById("source-library").innerHTML = BOOT.sources.map((source) => `<a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer"><span class="source-label">${esc(source.publisher)}</span><h3>${esc(source.title)}${svg("external-link", 16)}</h3></a>`).join("");
document.getElementById("hide-side").addEventListener("click", toggleSidebar);
document.getElementById("show-side").addEventListener("click", toggleSidebar);
scrim.addEventListener("click", () => setSidebar(false));
document.getElementById("new-chat").addEventListener("click", reset);
document.getElementById("open-sources").addEventListener("click", () => { sheet.hidden = false; });
document.getElementById("close-sheet").addEventListener("click", () => { sheet.hidden = true; });
document.getElementById("sheet-backdrop").addEventListener("click", () => { sheet.hidden = true; });
async function showHistory() {
  if (state.busy) return;
  state.view = "history";
  if (isMobile()) setSidebar(false);
  renderNav();
  scroller.innerHTML = `<section class="welcome history-list"><p class="history-empty">正在读取历史记录</p></section>`;
  try {
    const response = await fetch("/api/history", { headers: { "X-Client-Id": clientId() } });
    const data = await response.json();
    if (state.view !== "history") return;
    state.records = response.ok && Array.isArray(data.conversations) ? data.conversations : [];
  } catch {
    if (state.view !== "history") return;
    state.records = [];
  }
  renderConversation();
}
async function openRecord(id) {
  if (state.busy) return;
  const response = await fetch(`/api/history/${id}`, { headers: { "X-Client-Id": clientId() } });
  if (!response.ok) return;
  const data = await response.json();
  state.view = "chat";
  state.active = "all";
  state.conversationId = data.id;
  state.pin = true;
  if (data.city) document.getElementById("city").value = data.city;
  if (data.identity) document.getElementById("identity").value = data.identity;
  state.turns = (data.turns || []).map((turn) => ({
    id: turn.id,
    question: turn.question,
    answer: turn.answer || undefined,
    error: turn.answer ? undefined : turn.error || undefined,
    picked: null,
    copied: false
  }));
  renderNav();
  renderConversation();
}
nav.addEventListener("click", (event) => {
  if (event.target.closest("[data-history]")) { showHistory(); return; }
  const button = event.target.closest("[data-topic]");
  if (!button) return;
  const leavingHistory = state.view === "history";
  state.view = "chat";
  state.active = button.dataset.topic;
  if (isMobile()) setSidebar(false);
  renderNav();
  if (leavingHistory || !state.turns.length) renderConversation();
});
input.addEventListener("input", updateComposer);
form.addEventListener("submit", (event) => { event.preventDefault(); ask(input.value); });
send.addEventListener("click", () => { if (state.busy) state.controller?.abort(); });
input.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey && !event.isComposing) { event.preventDefault(); ask(input.value); }
});
scroller.addEventListener("scroll", () => { state.pin = nearBottom(); });
scroller.addEventListener("click", async (event) => {
  const askButton = event.target.closest("[data-ask]");
  if (askButton) { ask(askButton.dataset.ask); return; }
  const record = event.target.closest("[data-open]");
  if (record) { openRecord(record.dataset.open); return; }
  const retry = event.target.closest("[data-retry]");
  if (retry) { const turn = turnById(retry.dataset.retry); if (turn) ask(turn.question); return; }
  const follow = event.target.closest("[data-follow]");
  if (follow) { const turn = turnById(follow.dataset.follow); const question = turn?.answer?.followups?.[Number(follow.dataset.index)]; if (question) ask(question); return; }
  const cite = event.target.closest("[data-cite]");
  if (cite) { const turn = turnById(cite.dataset.turn); if (!turn) return; turn.picked = turn.picked === cite.dataset.cite ? null : cite.dataset.cite; renderConversation(); return; }
  const copy = event.target.closest("[data-copy]");
  if (!copy) return;
  const turn = turnById(copy.dataset.copy);
  if (!turn?.answer) return;
  const plain = (value) => value.replace(/\[\d{2}\]/g, "");
  const answer = turn.answer;
  const text = [turn.question, answer.title, plain(answer.summary), ...answer.details.map((item) => `${item.title}：${plain(item.text)}`), ...answer.actions, ...answer.sources.map((item) => `${item.title} ${item.article} ${item.url}`)].join("\n\n");
  try { await navigator.clipboard.writeText(text); turn.copied = true; renderConversation(); window.setTimeout(() => { turn.copied = false; renderConversation(); }, 1600); } catch {}
});
window.addEventListener("keydown", (event) => {
  if (event.key.toLowerCase() === "b" && (event.metaKey || event.ctrlKey)) { event.preventDefault(); toggleSidebar(); }
});
mobileQuery.addEventListener("change", () => setSidebar(isMobile() ? false : state.desktopOpen));
setSidebar(isMobile() ? false : true);
renderNav();
renderConversation();
updateComposer();
