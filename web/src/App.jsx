import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Icon, TOPIC_ICON } from "./icons.jsx";

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

function plain(value) {
  return String(value || "").replace(/\[\d{2}\]/g, "");
}

function RichText({ text, streaming, sources, picked, onCite }) {
  const visible = streaming ? String(text || "").replace(/\[[0-9]{0,2}$/, "") : String(text || "");
  return visible.split(/(\[\d{2}\])/g).map((part, index) => {
    const mark = /^\[(\d{2})\]$/.exec(part);
    if (!mark) return <span key={index}>{part}</span>;
    const source = sources.find((item) => item.id === mark[1]);
    if (!source) return null;
    const label = String(Number(mark[1]));
    if (streaming) {
      return <span key={index} className="cite-mark is-static" title={source.title}>{label}</span>;
    }
    return (
      <button key={index} type="button" className={`cite-mark${picked === mark[1] ? " is-active" : ""}`} aria-label={`查看知识库位置 ${label}，${source.title}`} onClick={() => onCite(mark[1])}>
        {label}
      </button>
    );
  });
}

function DraftCard({ draft, sources }) {
  const writing = draft.actions.length ? "actions" : draft.details.length ? "details" : draft.summary ? "summary" : "title";
  return (
    <article className="answer-card is-streaming" aria-busy="true">
      <h2>{plain(draft.title)}{writing === "title" ? <span className="stream-caret" aria-hidden="true" /> : null}</h2>
      {draft.summary ? <p className="answer-summary"><RichText text={draft.summary} streaming sources={sources} />{writing === "summary" ? <span className="stream-caret" aria-hidden="true" /> : null}</p> : null}
      {draft.details.length ? (
        <div className="answer-details">
          {draft.details.map((item, index) => (
            <section key={index}>
              <h3>{item.title}{writing === "details" && index === draft.details.length - 1 && !item.text ? <span className="stream-caret" aria-hidden="true" /> : null}</h3>
              {item.text ? <p><RichText text={item.text} streaming sources={sources} />{writing === "details" && index === draft.details.length - 1 ? <span className="stream-caret" aria-hidden="true" /> : null}</p> : null}
            </section>
          ))}
        </div>
      ) : null}
      {draft.actions.length ? (
        <section className="actions-box">
          <ol>
            {draft.actions.map((item, index) => <li key={index}>{item}{writing === "actions" && index === draft.actions.length - 1 ? <span className="stream-caret" aria-hidden="true" /> : null}</li>)}
          </ol>
        </section>
      ) : null}
    </article>
  );
}

function AnswerCard({ turn, sources, onCite, onFollow, onCopy }) {
  const answer = turn.answer;
  const picked = turn.picked || "";
  const cited = answer.sources.find((item) => item.id === picked);
  return (
    <article className="answer-card">
      <button className="copy-button" type="button" aria-label={turn.copied ? "已复制" : "复制回答"} onClick={() => onCopy(turn)}>{turn.copied ? <Icon name="check" size={17} /> : <Icon name="copy" size={17} />}</button>
      {answer.notice ? <p className="answer-notice">{answer.notice}</p> : null}
      <h2>{answer.title}</h2>
      <p className="answer-summary"><RichText text={answer.summary} sources={sources} picked={picked} onCite={(id) => onCite(turn.id, id)} /></p>
      <div className="answer-details">
        {answer.details.map((item, index) => (
          <section key={index}>
            <h3>{item.title}</h3>
            <p><RichText text={item.text} sources={sources} picked={picked} onCite={(id) => onCite(turn.id, id)} /></p>
          </section>
        ))}
      </div>
      {cited ? (
        <div className="cite-panel">
          <article>
            <p className="cite-kicker">{cited.article}</p>
            <h3>{cited.title}</h3>
            <blockquote>{cited.quote}</blockquote>
            <a href={cited.url} target="_blank" rel="noopener noreferrer">原文<Icon name="external-link" size={14} /></a>
          </article>
        </div>
      ) : null}
      {answer.actions.length ? <section className="actions-box"><ol>{answer.actions.map((item, index) => <li key={index}>{item}</li>)}</ol></section> : null}
      {answer.sources.length ? (
        <div className="answer-sources">
          {answer.sources.map((item) => (
            <div className={`source-row${picked === item.id ? " is-active" : ""}`} key={item.id}>
              <button type="button" onClick={() => onCite(turn.id, item.id)}><span className="source-number">{Number(item.id)}</span><span>{item.title}<small>{item.article}</small></span></button>
              <a href={item.url} target="_blank" rel="noopener noreferrer" aria-label={`打开${item.title}`}><Icon name="external-link" size={15} /></a>
            </div>
          ))}
        </div>
      ) : null}
      {answer.followups.length ? (
        <div className="followups">
          {answer.followups.map((question, index) => <button type="button" key={index} onClick={() => onFollow(question)}>{question}<Icon name="chevron-right" size={14} /></button>)}
        </div>
      ) : null}
    </article>
  );
}

export default function App() {
  const [boot, setBoot] = useState(null);
  const [active, setActive] = useState("all");
  const [view, setView] = useState("chat");
  const [turns, setTurns] = useState([]);
  const [records, setRecords] = useState([]);
  const [historyNote, setHistoryNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [input, setInput] = useState("");
  const [city, setCity] = useState("");
  const [identity, setIdentity] = useState("unspecified");
  const [desktopOpen, setDesktopOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobile, setMobile] = useState(() => window.matchMedia("(max-width: 767px)").matches);
  const [sheetOpen, setSheetOpen] = useState(false);
  const scrollerRef = useRef(null);
  const turnsRef = useRef([]);
  const viewRef = useRef("chat");
  const busyRef = useRef(false);
  const pinRef = useRef(true);
  const serialRef = useRef(0);
  const controllerRef = useRef(null);
  const frameRef = useRef(0);
  const queuedRef = useRef(null);
  const conversationRef = useRef(null);
  const copyTimer = useRef(0);

  const sources = boot?.sources || [];
  const topics = boot?.topics || [];
  const sideOpen = mobile ? true : desktopOpen;

  function replaceTurns(next) {
    turnsRef.current = next;
    setTurns(next);
  }

  function patchTurn(id, patch) {
    replaceTurns(turnsRef.current.map((turn) => (turn.id === id ? { ...turn, ...patch } : turn)));
  }

  useEffect(() => {
    fetch("/api/bootstrap", { cache: "no-store" }).then((response) => response.json()).then(setBoot).catch(() => setBoot({ topics: [], sources: [] }));
    const query = window.matchMedia("(max-width: 767px)");
    const onChange = () => {
      const next = query.matches;
      setMobile(next);
      if (next) setMobileOpen(false);
    };
    query.addEventListener("change", onChange);
    const onKey = (event) => {
      if (event.key.toLowerCase() === "b" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        if (query.matches) setMobileOpen((open) => !open);
        else setDesktopOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      query.removeEventListener("change", onChange);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  useLayoutEffect(() => {
    const scroller = scrollerRef.current;
    if (pinRef.current && view === "chat" && turns.length && scroller) scroller.scrollTop = scroller.scrollHeight;
  }, [turns, view]);

  function cards() {
    if (active === "all") {
      const listed = topics.filter((topic) => topic.id !== "all").map((topic) => ({ topic, question: topic.examples[0] }));
      const insurance = topics.find((topic) => topic.id === "insurance");
      return insurance ? listed.concat([{ topic: insurance, question: "试用期不交社保，合法吗？" }]) : listed;
    }
    const topic = topics.find((item) => item.id === active);
    return (topic?.examples || []).map((question) => ({ topic, question }));
  }

  function toggleSidebar() {
    if (mobile) setMobileOpen((open) => !open);
    else setDesktopOpen((open) => !open);
  }

  function stopFrame() {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    frameRef.current = 0;
    queuedRef.current = null;
  }

  function reset() {
    serialRef.current += 1;
    controllerRef.current?.abort();
    stopFrame();
    busyRef.current = false;
    setBusy(false);
    replaceTurns([]);
    setActive("all");
    viewRef.current = "chat";
    setView("chat");
    conversationRef.current = null;
    pinRef.current = true;
    setInput("");
    if (mobile) setMobileOpen(false);
  }

  function changeTopic(topicId) {
    const leavingHistory = viewRef.current === "history";
    viewRef.current = "chat";
    setView("chat");
    setActive(topicId);
    if (mobile) setMobileOpen(false);
    if (leavingHistory) pinRef.current = true;
  }

  async function showHistory() {
    if (busyRef.current) return;
    viewRef.current = "history";
    setView("history");
    setRecords([]);
    setHistoryNote("正在读取历史记录");
    if (mobile) setMobileOpen(false);
    try {
      const response = await fetch("/api/history", { headers: { "X-Client-Id": clientId() } });
      const data = await response.json();
      if (viewRef.current !== "history") return;
      setRecords(response.ok && Array.isArray(data.conversations) ? data.conversations : []);
      setHistoryNote(response.ok && data.conversations?.length ? "" : "还没有历史对话");
    } catch {
      if (viewRef.current !== "history") return;
      setRecords([]);
      setHistoryNote("还没有历史对话");
    }
  }

  async function openRecord(id) {
    if (busyRef.current) return;
    const response = await fetch(`/api/history/${id}`, { headers: { "X-Client-Id": clientId() } });
    if (!response.ok) return;
    const data = await response.json();
    viewRef.current = "chat";
    setView("chat");
    setActive("all");
    conversationRef.current = data.id;
    pinRef.current = true;
    if (data.city) setCity(data.city);
    if (data.identity) setIdentity(data.identity);
    replaceTurns((data.turns || []).map((turn) => ({
      id: turn.id,
      question: turn.question,
      answer: turn.answer || undefined,
      error: turn.answer ? undefined : turn.error || undefined,
      picked: null,
      copied: false,
    })));
  }

  async function ask(text) {
    const question = text.trim();
    if (!question || busyRef.current || question.length > 1800) return;
    viewRef.current = "chat";
    setView("chat");
    busyRef.current = true;
    setBusy(true);
    pinRef.current = true;
    if (!conversationRef.current) conversationRef.current = crypto.randomUUID();
    setInput("");
    const id = Date.now();
    const ticket = serialRef.current;
    const history = turnsRef.current.slice(-6).map((turn) => ({ question: turn.question, summary: turn.answer?.summary || "" }));
    replaceTurns([...turnsRef.current, { id, question, picked: null, copied: false }]);
    const abort = new AbortController();
    controllerRef.current = abort;
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
        body: JSON.stringify({
          question,
          city: city.trim(),
          identity,
          history,
          stream: true,
          clientId: clientId(),
          conversationId: conversationRef.current,
        }),
        signal: abort.signal,
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
        if (!data.length || ticket !== serialRef.current) return;
        const payload = JSON.parse(data.join("\n"));
        if (event === "draft") {
          queuedRef.current = payload;
          if (!frameRef.current) {
            frameRef.current = requestAnimationFrame(() => {
              frameRef.current = 0;
              const next = queuedRef.current;
              queuedRef.current = null;
              if (!next || ticket !== serialRef.current) return;
              const turn = turnsRef.current.find((item) => item.id === id);
              if (!turn || turn.answer) return;
              patchTurn(id, { draft: next });
            });
          }
        } else if (event === "done") {
          stopFrame();
          answer = payload;
        } else if (event === "error") throw new Error(payload.message || "暂时没有收到回答，请重试。");
      };
      while (true) {
        const chunk = await reader.read();
        pending += decoder.decode(chunk.value || new Uint8Array(), { stream: !chunk.done });
        const blocks = pending.split(/\n\n/);
        pending = blocks.pop() ?? "";
        for (const block of blocks) apply(block);
        if (chunk.done) break;
      }
      if (pending.trim()) apply(pending);
      stopFrame();
      if (ticket !== serialRef.current) return;
      if (!answer) throw new Error("暂时没有收到回答，请重试。");
      patchTurn(id, { answer, draft: undefined });
    } catch (error) {
      stopFrame();
      if (ticket !== serialRef.current) return;
      const message = error instanceof Error && error.name === "AbortError" ? "本次回答已停止。你可以重新提问。" : error instanceof Error ? error.message : "连接暂时失败，请重试。";
      patchTurn(id, { draft: undefined, error: message });
    } finally {
      if (ticket === serialRef.current) {
        busyRef.current = false;
        setBusy(false);
        controllerRef.current = null;
      }
    }
  }

  function onCite(turnId, sourceId) {
    const turn = turnsRef.current.find((item) => item.id === turnId);
    if (!turn) return;
    patchTurn(turnId, { picked: turn.picked === sourceId ? null : sourceId });
  }

  async function onCopy(turn) {
    if (!turn.answer) return;
    const answer = turn.answer;
    const text = [turn.question, answer.title, plain(answer.summary), ...answer.details.map((item) => `${item.title}：${plain(item.text)}`), ...answer.actions, ...answer.sources.map((item) => `${item.title} ${item.article} ${item.url}`)].join("\n\n");
    try {
      await navigator.clipboard.writeText(text);
      patchTurn(turn.id, { copied: true });
      window.clearTimeout(copyTimer.current);
      copyTimer.current = window.setTimeout(() => patchTurn(turn.id, { copied: false }), 1600);
    } catch {
      /* 剪贴板被拒绝时保持原按钮。 */
    }
  }

  function onScroll() {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    if (scroller.clientHeight < 40) return;
    pinRef.current = scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight < 64;
  }

  const compact = input.length < 36 && !input.includes("\n");
  const shellClass = `app-shell${mobile && mobileOpen ? " is-mobile-open" : ""}${!mobile && !desktopOpen ? " is-collapsed" : ""}`;

  return (
    <>
      <div className={shellClass} id="shell">
        <div className="scrim" hidden={!(mobile && mobileOpen)} onClick={() => setMobileOpen(false)} />
        <div className="side-peer" data-slot="sidebar" data-state={sideOpen ? "expanded" : "collapsed"} data-collapsible={sideOpen ? "" : "offcanvas"} data-side="left">
          <aside className="side-col" data-slot="sidebar-inner">
            <div className="brand-wrap">
              <div className="brand-row">
                <a href="/" className="brand" aria-label="职问首页"><span className="brand-icon"><Icon name="scale" size={23} /></span><span>职问</span></a>
                <button className="sidebar-hide" type="button" aria-label="隐藏侧栏" onClick={toggleSidebar}><Icon name="panel-left" size={18} /></button>
              </div>
              <button className="new-chat" type="button" onClick={reset}><Icon name="plus" size={18} /> 开始新对话</button>
            </div>
            <nav className="nav-content">
              <ul className="nav-list">
                <li><button type="button" className="nav-item" data-active={view === "history"} onClick={showHistory}><span className="nav-ico"><Icon name="clock" size={19} /></span><span>历史记录</span>{view === "history" ? <span className="nav-mark" /> : null}</button></li>
                {topics.map((topic) => (
                  <li key={topic.id}>
                    <button type="button" className="nav-item" data-active={view !== "history" && active === topic.id} onClick={() => changeTopic(topic.id)}>
                      <span className="nav-ico"><Icon name={TOPIC_ICON[topic.id]} size={19} /></span><span>{topic.label}</span>
                      {view !== "history" && active === topic.id ? <span className="nav-mark" /> : null}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>
        </div>
        <main className="workspace">
          <header className="topbar">
            <div className="topbar-title"><button className="sidebar-toggle" type="button" aria-label="显示侧栏" onClick={toggleSidebar}><Icon name="panel-left" size={18} /></button></div>
            <div className="topbar-right"><button className="source-trigger" type="button" aria-label="官方依据" onClick={() => setSheetOpen(true)}><Icon name="book-open" size={17} /></button></div>
          </header>
          <div className="conversation-scroll" ref={scrollerRef} onScroll={onScroll}>
            {view === "history" ? (
              <section className="welcome history-list">
                {records.length ? records.map((item) => (
                  <button type="button" className="history-row" key={item.id} onClick={() => openRecord(item.id)}><span>{item.title}</span><time>{formatTime(item.updatedAt)}</time></button>
                )) : <p className="history-empty">{historyNote || "还没有历史对话"}</p>}
              </section>
            ) : turns.length ? (
              <div className="turns">
                {turns.map((turn) => (
                  <div className="turn" key={turn.id}>
                    <div className="user-message"><p>{turn.question}</p></div>
                    {turn.answer ? <AnswerCard turn={turn} sources={sources} onCite={onCite} onFollow={ask} onCopy={onCopy} /> : turn.error ? (
                      <div className="error-box" role="alert"><Icon name="circle-help" size={19} /><span>{turn.error}</span><button type="button" disabled={busy} onClick={() => ask(turn.question)}>重试</button></div>
                    ) : turn.draft ? <DraftCard draft={turn.draft} sources={sources} /> : (
                      <div className="loading-answer" role="status" aria-label="正在查找"><Icon name="loader-circle" size={18} className="spin" /><span className="sk a" /><span className="sk b" /></div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <section className="welcome">
                <div className="question-grid">
                  {cards().map((card) => (
                    <button className="question-card" type="button" key={card.question} disabled={busy} onClick={() => ask(card.question)}>
                      <span className="question-category"><Icon name={TOPIC_ICON[card.topic.id]} size={18} />{card.topic.label}</span>
                      <span className="question-text">{card.question}</span>
                      <Icon name="chevron-right" size={17} className="question-go" />
                    </button>
                  ))}
                </div>
              </section>
            )}
          </div>
          <section className="composer-wrap">
            <div className="context-row">
              <div className="identity-control">
                <Icon name="graduation-cap" size={16} />
                <select className="context-select" aria-label="选择当前身份" value={identity} onChange={(event) => setIdentity(event.target.value)}>
                  <option value="unspecified">身份未选择</option>
                  <option value="student">在校大学生</option>
                  <option value="graduating">毕业年级 / 待入职</option>
                  <option value="employed">已毕业 / 正式工作</option>
                </select>
              </div>
              <label className="city-control"><Icon name="map-pin" size={16} /><input aria-label="工作城市（可选）" maxLength={30} placeholder="工作城市（可选）" value={city} onChange={(event) => setCity(event.target.value)} /></label>
            </div>
            <form className={`composer${compact ? " is-compact" : ""}`} onSubmit={(event) => { event.preventDefault(); ask(input); }}>
              <label className="sr-only" htmlFor="question-input">输入问题</label>
              <textarea id="question-input" placeholder="输入问题" maxLength={1800} rows={compact ? 1 : 2} value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); ask(input); } }} />
              <div className="composer-bottom">
                <button className="send-button" type={busy ? "button" : "submit"} disabled={!busy && !input.trim()} aria-label={busy ? "停止回答" : undefined} onClick={() => { if (busy) controllerRef.current?.abort(); }}>
                  {busy ? <><Icon name="square" size={14} fill="currentColor" /><span>停止</span></> : <><span>发送</span><Icon name="send" size={16} /></>}
                </button>
              </div>
            </form>
          </section>
        </main>
      </div>
      <div className="sheet" hidden={!sheetOpen}>
        <div className="sheet-backdrop" onClick={() => setSheetOpen(false)} />
        <aside className="sources-sheet" role="dialog" aria-label="官方依据">
          <div className="sheet-head">
            <h2 className="sheet-title"><Icon name="landmark" size={23} />官方依据</h2>
            <button className="sheet-close" type="button" aria-label="关闭" onClick={() => setSheetOpen(false)}>×</button>
          </div>
          <div className="source-library">
            {sources.map((source) => (
              <a key={source.id} href={source.url} target="_blank" rel="noopener noreferrer">
                <span className="source-label">{source.publisher}</span>
                <h3>{source.title}<Icon name="external-link" size={16} /></h3>
              </a>
            ))}
          </div>
        </aside>
      </div>
    </>
  );
}
