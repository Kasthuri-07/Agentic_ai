import os
import uuid
import tempfile
import sqlite3
import json
import ast
import operator
import base64
import datetime as dt
from contextlib import contextmanager
from zoneinfo import ZoneInfo
from typing import Annotated, Sequence, TypedDict
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.document_loaders import PyPDFLoader
from langchain_community.tools import DuckDuckGoSearchRun
from langchain_core.tools import tool
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage, BaseMessage
from langchain_ollama import ChatOllama
from langgraph.prebuilt import create_react_agent
from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages

# =========================================================
# APP SETUP
# =========================================================

app = FastAPI(title="Agentic AI Chat")

ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.environ.get(
        "ALLOWED_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000,*"
    ).split(",")
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "llama3.2")
VISION_MODEL = os.environ.get("VISION_MODEL", "llama3.2-vision")
DB_PATH = os.environ.get("DB_PATH", "chat_history.db")
IST = ZoneInfo("Asia/Kolkata")
AGENT_NAMES = ["researcher", "document_agent", "math_agent", "date_agent", "image_agent"]
MAX_UPLOAD_BYTES = 25 * 1024 * 1024  # 25 MB per file, generous but bounded

VECTORSTORES = {}
PDF_NAMES = {}
IMAGE_STORE = {}

# =========================================================
# DATABASE
# =========================================================

@contextmanager
def get_db():
    """Single place that owns connection lifecycle + error translation."""
    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA foreign_keys = ON")
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

def init_db():
    with get_db() as conn:
        c = conn.cursor()
        c.execute("""CREATE TABLE IF NOT EXISTS projects (
            id TEXT PRIMARY KEY, name TEXT, created_at TEXT)""")
        c.execute("""CREATE TABLE IF NOT EXISTS chats (
            id TEXT PRIMARY KEY, title TEXT, project_id TEXT, created_at TEXT)""")
        c.execute("""CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT, chat_id TEXT, role TEXT,
            content TEXT, agents_used TEXT, created_at TEXT)""")
        c.execute("""CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY, value TEXT)""")
        chat_cols = [col[1] for col in c.execute("PRAGMA table_info(chats)").fetchall()]
        if "project_id" not in chat_cols:
            c.execute("ALTER TABLE chats ADD COLUMN project_id TEXT")

init_db()

def db_create_project(name: str) -> str:
    pid = str(uuid.uuid4())
    with get_db() as conn:
        conn.execute(
            "INSERT INTO projects (id, name, created_at) VALUES (?, ?, ?)",
            (pid, name, dt.datetime.now(IST).isoformat()),
        )
    return pid

def db_list_projects():
    with get_db() as conn:
        rows = conn.execute("SELECT id, name FROM projects ORDER BY created_at ASC").fetchall()
    return [{"id": r[0], "name": r[1]} for r in rows]

def db_save_chat(chat_id: str, title: str, project_id: str | None = None):
    with get_db() as conn:
        conn.execute(
            "INSERT INTO chats (id, title, project_id, created_at) VALUES (?, ?, ?, ?) "
            "ON CONFLICT(id) DO UPDATE SET title=excluded.title",
            (chat_id, title, project_id, dt.datetime.now(IST).isoformat()),
        )

def db_rename_chat(chat_id: str, title: str):
    with get_db() as conn:
        cur = conn.execute("UPDATE chats SET title=? WHERE id=?", (title, chat_id))
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Chat not found")

def db_save_message(chat_id: str, role: str, content: str, agents_used: list):
    with get_db() as conn:
        conn.execute(
            "INSERT INTO messages (chat_id, role, content, agents_used, created_at) "
            "VALUES (?, ?, ?, ?, ?)",
            (chat_id, role, content, json.dumps(agents_used or []), dt.datetime.now(IST).isoformat()),
        )

def db_list_chats():
    with get_db() as conn:
        rows = conn.execute(
            "SELECT id, title, project_id FROM chats ORDER BY created_at ASC"
        ).fetchall()
    return [{"id": r[0], "title": r[1], "project_id": r[2]} for r in rows]

def db_get_messages(chat_id: str):
    with get_db() as conn:
        rows = conn.execute(
            "SELECT role, content, agents_used FROM messages WHERE chat_id=? ORDER BY id ASC",
            (chat_id,),
        ).fetchall()
    return [
        {"role": r[0], "content": r[1], "agents_used": json.loads(r[2]) if r[2] else []}
        for r in rows
    ]

def db_delete_chat(chat_id: str):
    with get_db() as conn:
        conn.execute("DELETE FROM chats WHERE id=?", (chat_id,))
        conn.execute("DELETE FROM messages WHERE chat_id=?", (chat_id,))
    VECTORSTORES.pop(chat_id, None)
    PDF_NAMES.pop(chat_id, None)
    IMAGE_STORE.pop(chat_id, None)

def db_wipe_all():
    with get_db() as conn:
        conn.execute("DELETE FROM chats")
        conn.execute("DELETE FROM messages")
    VECTORSTORES.clear()
    PDF_NAMES.clear()
    IMAGE_STORE.clear()

def db_get_setting(key: str, default: str = "") -> str:
    with get_db() as conn:
        row = conn.execute("SELECT value FROM settings WHERE key=?", (key,)).fetchone()
    return row[0] if row else default

def db_set_setting(key: str, value: str):
    with get_db() as conn:
        conn.execute(
            "INSERT INTO settings (key, value) VALUES (?, ?) "
            "ON CONFLICT(key) DO UPDATE SET value=excluded.value",
            (key, value),
        )

# =========================================================
# TOOLS
# =========================================================

_SAFE_OPS = {
    ast.Add: operator.add, ast.Sub: operator.sub, ast.Mult: operator.mul,
    ast.Div: operator.truediv, ast.Pow: operator.pow, ast.Mod: operator.mod,
    ast.USub: operator.neg,
}

def _safe_eval(node):
    if isinstance(node, ast.Constant):
        return node.value
    if isinstance(node, ast.BinOp):
        return _SAFE_OPS[type(node.op)](_safe_eval(node.left), _safe_eval(node.right))
    if isinstance(node, ast.UnaryOp):
        return _SAFE_OPS[type(node.op)](_safe_eval(node.operand))
    raise ValueError("Unsupported expression")

@tool
def calculator(expression: str) -> str:
    """Evaluate a math expression like '23 * 47 + 10'."""
    try:
        tree = ast.parse(expression, mode="eval").body
        return str(_safe_eval(tree))
    except Exception as e:
        return f"Could not evaluate '{expression}': {e}"

@tool
def get_current_datetime(query: str = "") -> str:
    """Get today's current date and time in India (IST)."""
    return dt.datetime.now(IST).strftime("%A, %d %B %Y, %I:%M %p IST")

def make_pdf_tool(vectorstore):
    @tool
    def search_pdf(query: str) -> str:
        """Search the user's uploaded PDF documents."""
        if vectorstore is None:
            return "No PDF has been uploaded in this chat."
        docs = vectorstore.similarity_search(query, k=4)
        if not docs:
            return "No relevant information found."
        result = ""
        for d in docs:
            src = d.metadata.get("source_file", "Unknown")
            page = d.metadata.get("page", "N/A")
            result += f"[Source: {src}, Page {page}]\n{d.page_content}\n\n"
        return result
    return search_pdf

def make_image_tool(chat_id):
    @tool
    def analyze_image(query: str) -> str:
        """Analyze uploaded images to answer questions about them."""
        images = IMAGE_STORE.get(chat_id, [])
        if not images:
            return "No image has been uploaded in this chat."
        vision_llm = ChatOllama(model=VISION_MODEL, temperature=0)
        content = [{"type": "text", "text": query}]
        for img in images:
            content.append({
                "type": "image_url",
                "image_url": f"data:image/png;base64,{img['data']}"
            })
        response = vision_llm.invoke([HumanMessage(content=content)])
        return response.content
    return analyze_image

web_search_tool = DuckDuckGoSearchRun(name="web_search")
web_search_tool.description = "Search the internet for current events, news, or facts."

_llm = None
def get_llm():
    global _llm
    if _llm is None:
        _llm = ChatOllama(model=OLLAMA_MODEL, temperature=0)
    return _llm

_embeddings = None
def get_embeddings():
    global _embeddings
    if _embeddings is None:
        _embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
    return _embeddings

# =========================================================
# MULTI-AGENT GRAPH
# =========================================================

class AgentState(TypedDict):
    messages: Annotated[Sequence[BaseMessage], add_messages]
    next: str
    steps: int

def supervisor_node(state: AgentState):
    steps = state.get("steps", 0) + 1
    if steps > 5:
        return {"next": "FINISH", "steps": steps}

    llm = get_llm()
    system = (
        "You are a supervisor managing: researcher (web search), "
        "document_agent (searches uploaded PDF - use for ANY question about "
        "an uploaded document, or vague questions like 'what is in this'), "
        "math_agent (calculations), date_agent (current date/time), "
        "image_agent (analyzes uploaded images - use for any question about "
        "an uploaded picture/photo/image).\n"
        "If you can answer directly without a worker, reply 'ANSWER: <your answer>'.\n"
        "If a worker is needed, reply with exactly one word naming it.\n"
        "If already answered above, reply FINISH."
    )
    conversation = [SystemMessage(content=system)] + list(state["messages"])
    response = llm.invoke(conversation)
    text = response.content.strip()
    lower = text.lower()

    if lower.startswith("answer:"):
        return {
            "next": "FINISH_DIRECT", "steps": steps,
            "messages": [AIMessage(content=text.split(":", 1)[1].strip(), name="final")]
        }
    elif "image" in lower:
        next_node = "image_agent"
    elif "document" in lower:
        next_node = "document_agent"
    elif "math" in lower:
        next_node = "math_agent"
    elif "date" in lower:
        next_node = "date_agent"
    elif "research" in lower:
        next_node = "researcher"
    else:
        next_node = "FINISH"
    return {"next": next_node, "steps": steps}

def researcher_node(state: AgentState):
    agent = create_react_agent(get_llm(), [web_search_tool])
    result = agent.invoke({"messages": state["messages"]})
    return {"messages": [AIMessage(content=result["messages"][-1].content, name="researcher")]}

def math_agent_node(state: AgentState):
    agent = create_react_agent(get_llm(), [calculator])
    result = agent.invoke({"messages": state["messages"]})
    return {"messages": [AIMessage(content=result["messages"][-1].content, name="math_agent")]}

def date_agent_node(state: AgentState):
    agent = create_react_agent(get_llm(), [get_current_datetime])
    result = agent.invoke({"messages": state["messages"]})
    return {"messages": [AIMessage(content=result["messages"][-1].content, name="date_agent")]}

def finalize_node(state: AgentState):
    llm = get_llm()
    system = "Write ONE clear final answer based on the conversation above. Don't mention workers."
    conversation = [SystemMessage(content=system)] + list(state["messages"])
    response = llm.invoke(conversation)
    return {"messages": [AIMessage(content=response.content, name="final")]}

def build_graph(vectorstore, chat_id):
    def document_agent_node(state: AgentState):
        agent = create_react_agent(get_llm(), [make_pdf_tool(vectorstore)])
        result = agent.invoke({"messages": state["messages"]})
        return {"messages": [AIMessage(content=result["messages"][-1].content, name="document_agent")]}

    def image_agent_node(state: AgentState):
        agent = create_react_agent(get_llm(), [make_image_tool(chat_id)])
        result = agent.invoke({"messages": state["messages"]})
        return {"messages": [AIMessage(content=result["messages"][-1].content, name="image_agent")]}

    graph = StateGraph(AgentState)
    graph.add_node("supervisor", supervisor_node)
    graph.add_node("researcher", researcher_node)
    graph.add_node("document_agent", document_agent_node)
    graph.add_node("math_agent", math_agent_node)
    graph.add_node("date_agent", date_agent_node)
    graph.add_node("image_agent", image_agent_node)
    graph.add_node("finalize", finalize_node)
    graph.set_entry_point("supervisor")
    graph.add_conditional_edges("supervisor", lambda s: s["next"], {
        "researcher": "researcher", "document_agent": "document_agent",
        "math_agent": "math_agent", "date_agent": "date_agent",
        "image_agent": "image_agent",
        "FINISH": "finalize", "FINISH_DIRECT": END,
    })
    graph.add_edge("researcher", "supervisor")
    graph.add_edge("document_agent", "supervisor")
    graph.add_edge("math_agent", "supervisor")
    graph.add_edge("date_agent", "supervisor")
    graph.add_edge("image_agent", "supervisor")
    graph.add_edge("finalize", END)
    return graph.compile()

# =========================================================
# API MODELS
# =========================================================

class NewChatBody(BaseModel):
    title: str = "New Chat"
    project_id: str | None = None

class RenameChatBody(BaseModel):
    title: str

class NewProjectBody(BaseModel):
    name: str

class MessageBody(BaseModel):
    question: str

class SettingsBody(BaseModel):
    user_name: str = ""

# =========================================================
# ROUTES
# =========================================================

@app.get("/greeting")
def greeting():
    """Time-of-day greeting, always computed in IST regardless of server location."""
    hour = dt.datetime.now(IST).hour
    if 5 <= hour < 12:
        text = "Good morning"
    elif 12 <= hour < 17:
        text = "Good afternoon"
    elif 17 <= hour < 21:
        text = "Good evening"
    else:
        text = "Good night"
    return {"greeting": text}

@app.get("/settings")
def get_settings():
    return {"user_name": db_get_setting("user_name", "")}

@app.post("/settings")
def update_settings(body: SettingsBody):
    db_set_setting("user_name", body.user_name.strip())
    return {"user_name": body.user_name.strip()}

@app.get("/projects")
def list_projects():
    return db_list_projects()

@app.post("/projects")
def create_project(body: NewProjectBody):
    if not body.name.strip():
        raise HTTPException(status_code=400, detail="Project name is required")
    pid = db_create_project(body.name.strip())
    return {"id": pid, "name": body.name.strip()}

@app.get("/chats")
def list_chats():
    return db_list_chats()

@app.post("/chats")
def create_chat(body: NewChatBody):
    chat_id = str(uuid.uuid4())
    db_save_chat(chat_id, body.title, body.project_id)
    return {"id": chat_id, "title": body.title, "project_id": body.project_id}

@app.patch("/chats/{chat_id}")
def rename_chat(chat_id: str, body: RenameChatBody):
    title = body.title.strip() or "Untitled chat"
    db_rename_chat(chat_id, title)
    return {"id": chat_id, "title": title}

@app.delete("/chats/{chat_id}")
def delete_chat(chat_id: str):
    db_delete_chat(chat_id)
    return {"ok": True}

@app.delete("/chats")
def wipe_chats():
    db_wipe_all()
    return {"ok": True}

@app.get("/chats/{chat_id}/messages")
def get_messages(chat_id: str):
    return db_get_messages(chat_id)

@app.post("/chats/{chat_id}/upload")
async def upload_files(chat_id: str, files: list[UploadFile] = File(...)):
    all_chunks = []
    splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    pdf_names = PDF_NAMES.get(chat_id, [])
    image_list = IMAGE_STORE.get(chat_id, [])

    for f in files:
        content = await f.read()
        if len(content) > MAX_UPLOAD_BYTES:
            raise HTTPException(
                status_code=413,
                detail=f"{f.filename} exceeds the {MAX_UPLOAD_BYTES // (1024 * 1024)}MB upload limit",
            )
        filename_lower = f.filename.lower()

        if filename_lower.endswith(".pdf"):
            with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
                tmp.write(content)
                tmp_path = tmp.name
            try:
                loader = PyPDFLoader(tmp_path)
                documents = loader.load()
                for doc in documents:
                    doc.metadata["source_file"] = f.filename
                chunks = splitter.split_documents(documents)
                all_chunks.extend(chunks)
                pdf_names.append(f.filename)
            finally:
                os.unlink(tmp_path)

        elif filename_lower.endswith((".png", ".jpg", ".jpeg", ".webp")):
            b64_image = base64.b64encode(content).decode("utf-8")
            image_list.append({"filename": f.filename, "data": b64_image})
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type: {f.filename}. Upload a PDF or PNG/JPG/WEBP image.",
            )

    if all_chunks:
        embeddings = get_embeddings()
        existing = VECTORSTORES.get(chat_id)
        if existing:
            existing.add_documents(all_chunks)
        else:
            VECTORSTORES[chat_id] = Chroma.from_documents(documents=all_chunks, embedding=embeddings)

    PDF_NAMES[chat_id] = pdf_names
    IMAGE_STORE[chat_id] = image_list

    return {"pdf_names": pdf_names, "image_names": [i["filename"] for i in image_list]}

@app.post("/chats/{chat_id}/messages")
def send_message(chat_id: str, body: MessageBody):
    question = body.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Question cannot be empty")

    history = db_get_messages(chat_id)

    if len(history) == 0:
        title = question[:35] + ("..." if len(question) > 35 else "")
        db_save_chat(chat_id, title)

    db_save_message(chat_id, "user", question, [])

    lc_history = []
    for m in history:
        if m["role"] == "user":
            lc_history.append(HumanMessage(content=m["content"]))
        elif m["role"] == "assistant":
            lc_history.append(AIMessage(content=m["content"]))
    lc_history.append(HumanMessage(content=question))

    try:
        vectorstore = VECTORSTORES.get(chat_id)
        graph = build_graph(vectorstore, chat_id)
        result = graph.invoke({"messages": lc_history, "next": "", "steps": 0})
        result_messages = result["messages"]
        answer = result_messages[-1].content
        agents_used = []
        for m in result_messages:
            name = getattr(m, "name", None)
            if name in AGENT_NAMES and name not in agents_used:
                agents_used.append(name)
    except Exception as e:
        answer = f"⚠️ Error: {str(e)}. Make sure Ollama is running (`ollama serve`)."
        agents_used = []

    db_save_message(chat_id, "assistant", answer, agents_used)
    return {"answer": answer, "agents_used": agents_used}