# 职问

面向中国大陆大学生的就业问答。问题先在已核对的知识库里检索，再由模型把命中的材料组织成回答，并标出依据位置。检索不到，或模型失败时，退回知识库原文。

在线演示：<https://zhiwen.cise.site>

资料核对日期：2026-10-05。没有联网，也不收录各城市的缴费比例、最低工资数额和地方额外产假天数。

## 一次提问怎么走

```text
浏览器
  POST /api/chat        SSE：draft / done / error
    FastAPI  app/main.py
      CampusRetriever   app/chain.py  调 app/knowledge.py
      prompt | ChatOpenAI | StrOutputParser
        DeepSeek chat/completions，模型 deepseek-flash
      read_draft        app/draft.py  边收 token 边拆 JSON
    校验引用 id 只能来自这次检索到的来源
```

没有密钥，或一条都没检索到：不调用模型，直接 `knowledge_answer`。

## 目录

| 路径 | 讲的时候打开它 |
| --- | --- |
| `app/knowledge.py` | 26 条知识、打分、引用、知识库回答 |
| `data/knowledge.json` | 上面这份数据 |
| `app/chain.py` | Retriever、LCEL 链、流式、引用白名单、失败回退 |
| `app/draft.py` | 半截 JSON 怎么读出标题和段落 |
| `app/main.py` | 校验、同源检查、SSE |
| `web/` | React 页面，可安装为 PWA。空输入框是小圆角，回答贴底滚动，引用可点 |
| `tests/test_retrieve.py` | 不花钱的检索测试 |
| `docs/面试怎么讲.md` | 演示顺序和面试题 |

## 本地运行

```bash
cd /opt/zhiwen-fastapi
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
cp .env.example .env
# 把 DEEPSEEK_API_KEY 写进 .env，不要提交
.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8802
```

进程里已经有这两个环境变量时，`.env` 不会覆盖它们。

```bash
.venv/bin/python -m unittest discover -s tests -t .
```

## 模型

`ChatOpenAI`，`base_url=https://api.deepseek.com`，`OPENAI_MODEL` 默认 `deepseek-flash`。

思考默认开着，会占满输出长度，所以请求里带 `thinking.type=disabled`。输出用 `response_format: json_object`，提示词里写明要 json。引用编号只允许出现在 `summary` 和 `details.text`。
