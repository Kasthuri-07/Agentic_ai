import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import "./App.css";

const API = "http://localhost:8000";

// --- SVG Icons Library ---
const Icons = {
  Sparkles: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/>
    </svg>
  ),
  Search: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
    </svg>
  ),
  Plus: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14"/><path d="M12 5v14"/>
    </svg>
  ),
  Folder: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>
    </svg>
  ),
  MessageSquare: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  ),
  Network: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="16" y="16" width="6" height="6" rx="1"/><rect x="2" y="16" width="6" height="6" rx="1"/><rect x="9" y="2" width="6" height="6" rx="1"/>
      <path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3"/><path d="M12 12V8"/>
    </svg>
  ),
  Paperclip: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
    </svg>
  ),
  Send: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>
    </svg>
  ),
  Copy: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
    </svg>
  ),
  Check: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  Speaker: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
    </svg>
  ),
  Square: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
      <rect width="18" height="18" x="3" y="3" rx="2"/>
    </svg>
  ),
  Download: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>
    </svg>
  ),
  Trash: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
    </svg>
  ),
  Edit: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
    </svg>
  ),
  Code: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
    </svg>
  ),
  Settings: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  FileText: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/>
    </svg>
  ),
  Image: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
    </svg>
  ),
  Globe: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>
    </svg>
  ),
  Calculator: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="16" height="20" x="4" y="2" rx="2"/><line x1="8" x2="16" y1="6" y2="6"/><line x1="16" x2="16" y1="14" y2="18"/>
    </svg>
  ),
  Clock: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  X: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
    </svg>
  ),
};

const AGENT_META = {
  researcher: { name: "Web Researcher", icon: Icons.Globe, class: "researcher", desc: "Searches the live web for facts, events, and citations" },
  document_agent: { name: "Document Intelligence", icon: Icons.FileText, class: "document_agent", desc: "Embeds and extracts targeted answers from uploaded PDFs" },
  math_agent: { name: "Math & Logic Engine", icon: Icons.Calculator, class: "math_agent", desc: "Executes safe arithmetic, numerical logic, and expressions" },
  date_agent: { name: "Date & Time (IST)", icon: Icons.Clock, class: "date_agent", desc: "Provides verified real-time Indian Standard Time chronometry" },
  image_agent: { name: "Vision Perceiver", icon: Icons.Image, class: "image_agent", desc: "Inspects scene composition, text, and visual details in images" },
};

// --- Code Block with Copy & Download ---
function CodeBlock({ code, lang }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadSnippet = () => {
    const ext = lang === "python" ? "py" : lang === "javascript" || lang === "jsx" ? "js" : "txt";
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `agent-snippet.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="code-container">
      <div className="code-header">
        <span className="code-lang">{lang || "code"}</span>
        <div className="code-actions-group">
          <button className="code-copy-btn" onClick={copy}>
            {copied ? <Icons.Check /> : <Icons.Copy />}
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>
          <button className="code-copy-btn" onClick={downloadSnippet} title="Download file">
            <Icons.Download />
          </button>
        </div>
      </div>
      <pre className="code-content">
        <code>{code}</code>
      </pre>
    </div>
  );
}

// --- Rich Markdown Message Parser ---
function MessageContent({ content }) {
  const parts = content.split(/```(\w*)\n?([\s\S]*?)```/g);
  const nodes = [];

  for (let i = 0; i < parts.length; i += 3) {
    const text = parts[i];
    if (text) {
      const formattedLines = text.split("\n").map((line, lineIdx) => {
        // Bullet list item
        const isBullet = line.trim().startsWith("* ") || line.trim().startsWith("- ");
        const cleanLine = isBullet ? line.trim().substring(2) : line;

        // Bold & code parsing
        const segments = cleanLine.split(/(\*\*.*?\*\*|`.*?`)/g);

        return (
          <div
            key={`line-${lineIdx}`}
            style={{
              display: isBullet ? "flex" : "block",
              alignItems: "flex-start",
              gap: isBullet ? "8px" : "0",
              margin: line.trim() ? "4px 0" : "8px 0",
              minHeight: line.trim() ? "auto" : "8px",
            }}
          >
            {isBullet && (
              <span style={{ color: "var(--cyan)", fontWeight: "bold", userSelect: "none" }}>•</span>
            )}
            <div>
              {segments.map((seg, sIdx) => {
                if (seg.startsWith("**") && seg.endsWith("**")) {
                  return <strong key={sIdx} style={{ color: "#ffffff", fontWeight: 600 }}>{seg.slice(2, -2)}</strong>;
                }
                if (seg.startsWith("`") && seg.endsWith("`")) {
                  return (
                    <code
                      key={sIdx}
                      style={{
                        background: "rgba(255,255,255,0.08)",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        fontFamily: "var(--font-mono)",
                        fontSize: "12.5px",
                        color: "var(--primary-light)",
                      }}
                    >
                      {seg.slice(1, -1)}
                    </code>
                  );
                }
                return seg;
              })}
            </div>
          </div>
        );
      });
      nodes.push(<div key={`text-${i}`}>{formattedLines}</div>);
    }
    const lang = parts[i + 1];
    const code = parts[i + 2];
    if (code !== undefined) {
      nodes.push(<CodeBlock key={`code-${i}`} code={code.trim()} lang={lang} />);
    }
  }

  return <div>{nodes}</div>;
}

export default function App() {
  const [chats, setChats] = useState([]);
  const [projects, setProjects] = useState([]);
  const [activeProject, setActiveProject] = useState(null);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [greeting, setGreeting] = useState("Welcome");
  const [attachedNames, setAttachedNames] = useState([]);
  const [view, setView] = useState("chat"); // 'chat' | 'swarm' | 'code'
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [userName, setUserName] = useState("");
  const [userNameInput, setUserNameInput] = useState("");
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toastBanner, setToastBanner] = useState("");
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [copiedMsgIdx, setCopiedMsgIdx] = useState(null);
  const [speakingMsgIdx, setSpeakingMsgIdx] = useState(null);
  const [currentTheme, setCurrentTheme] = useState("indigo");
  const [promptMode, setPromptMode] = useState("auto"); // 'auto' | 'web' | 'doc' | 'math' | 'vision'

  const bottomRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  // Load Settings and Data
  useEffect(() => {
    const savedTheme = localStorage.getItem("nexus_theme") || "indigo";
    applyTheme(savedTheme);

    axios.get(`${API}/greeting`)
      .then((r) => setGreeting(r.data?.greeting || "Welcome"))
      .catch(() => setGreeting("Welcome"));

    axios.get(`${API}/settings`)
      .then((r) => {
        if (r.data.user_name) {
          setUserName(r.data.user_name);
          setUserNameInput(r.data.user_name);
        }
      })
      .catch(() => {});

    loadChats();
    loadProjects();
  }, []);

  // Theme application
  const applyTheme = (themeName) => {
    setCurrentTheme(themeName);
    localStorage.setItem("nexus_theme", themeName);
    if (themeName === "indigo") {
      document.documentElement.removeAttribute("data-theme");
    } else {
      document.documentElement.setAttribute("data-theme", themeName);
    }
  };

  // Scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Dynamic textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [input]);

  const flashToast = (msg) => {
    setToastBanner(msg);
    setTimeout(() => setToastBanner(""), 4500);
  };

  const loadChats = async () => {
    try {
      const r = await axios.get(`${API}/chats`);
      setChats(r.data);
    } catch {
      flashToast("Connecting to backend server on :8000...");
    }
  };

  const loadProjects = async () => {
    try {
      const r = await axios.get(`${API}/projects`);
      setProjects(r.data);
    } catch {
      /* non-fatal */
    }
  };

  const handleCreateProject = async () => {
    const name = newProjectName.trim();
    if (!name) return;
    try {
      await axios.post(`${API}/projects`, { name });
      setNewProjectName("");
      setShowProjectModal(false);
      loadProjects();
    } catch {
      flashToast("Failed to create workspace project");
    }
  };

  const saveUserName = async () => {
    const trimmed = userNameInput.trim();
    setUserName(trimmed);
    setShowSettingsModal(false);
    try {
      await axios.post(`${API}/settings`, { user_name: trimmed });
    } catch {
      flashToast("Couldn't persist name");
    }
  };

  const openChat = async (chatId) => {
    setCurrentChat(chatId);
    setAttachedNames([]);
    setView("chat");
    setSidebarOpen(false);
    try {
      const r = await axios.get(`${API}/chats/${chatId}/messages`);
      setMessages(r.data);
    } catch {
      flashToast("Failed to load messages for this chat.");
    }
  };

  const newChat = async () => {
    try {
      const r = await axios.post(`${API}/chats`, {
        title: "New Chat",
        project_id: activeProject,
      });
      setCurrentChat(r.data.id);
      setMessages([]);
      setAttachedNames([]);
      setView("chat");
      setSidebarOpen(false);
      loadChats();
    } catch {
      flashToast("Failed to start new chat");
    }
  };

  const deleteChat = async (chatId, e) => {
    e.stopPropagation();
    try {
      await axios.delete(`${API}/chats/${chatId}`);
      if (currentChat === chatId) {
        setCurrentChat(null);
        setMessages([]);
      }
      loadChats();
    } catch {
      flashToast("Could not delete chat");
    }
  };

  const deleteAllChats = async () => {
    if (!window.confirm("Delete ALL chat history? This cannot be undone.")) return;
    try {
      await axios.delete(`${API}/chats`);
      setChats([]);
      setCurrentChat(null);
      setMessages([]);
    } catch {
      flashToast("Failed to clear chat history");
    }
  };

  const startRename = (chat, e) => {
    e.stopPropagation();
    setRenamingId(chat.id);
    setRenameValue(chat.title);
  };

  const commitRename = async (chatId) => {
    const title = renameValue.trim();
    setRenamingId(null);
    if (!title) return;
    try {
      await axios.patch(`${API}/chats/${chatId}`, { title });
      loadChats();
    } catch {
      flashToast("Failed to rename chat");
    }
  };

  // Upload handler for file picker or drag & drop
  const handleUploadFiles = async (filesList) => {
    if (!filesList || !filesList.length) return;
    let chatId = currentChat;
    setUploading(true);

    try {
      if (!chatId) {
        const r = await axios.post(`${API}/chats`, {
          title: "New Chat",
          project_id: activeProject,
        });
        chatId = r.data.id;
        setCurrentChat(chatId);
        loadChats();
      }

      const form = new FormData();
      for (const f of filesList) form.append("files", f);

      const r = await axios.post(`${API}/chats/${chatId}/upload`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const uploadedFiles = [...(r.data.pdf_names || []), ...(r.data.image_names || [])];
      setAttachedNames((prev) => Array.from(new Set([...prev, ...uploadedFiles])));
      flashToast(`Uploaded ${uploadedFiles.length} file(s) into Agent Knowledge`);
    } catch (err) {
      console.error("Upload error:", err);
      flashToast(err.response?.data?.detail || "Upload failed. Ensure file is supported (PDF/Images < 25MB).");
    } finally {
      setUploading(false);
    }
  };

  const sendMessage = async (overridePrompt) => {
    let question = (overridePrompt || input).trim();
    if (!question || loading) return;

    // Apply Mode Prefix if specialized mode chosen
    if (promptMode === "web" && !question.toLowerCase().includes("search") && !overridePrompt) {
      question = `[Web Search] ${question}`;
    } else if (promptMode === "math" && !overridePrompt) {
      question = `[Math Calculation] ${question}`;
    }

    let chatId = currentChat;
    if (!chatId) {
      try {
        const r = await axios.post(`${API}/chats`, {
          title: "New Chat",
          project_id: activeProject,
        });
        chatId = r.data.id;
        setCurrentChat(chatId);
      } catch {
        flashToast("Failed to initialize session");
        return;
      }
    }

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: question, agents_used: [] }]);
    setLoading(true);

    try {
      const r = await axios.post(`${API}/chats/${chatId}/messages`, { question });
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: r.data.answer, agents_used: r.data.agents_used || [] },
      ]);
      loadChats();
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "⚠️ Error contacting model agent. Check if Ollama (`llama3.2`) and backend are running.",
          agents_used: [],
        },
      ]);
    }
    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUploadFiles(e.dataTransfer.files);
    }
  };

  const removeAttachment = (name) => {
    setAttachedNames((prev) => prev.filter((item) => item !== name));
  };

  const copyMessageContent = (content, index) => {
    navigator.clipboard.writeText(content);
    setCopiedMsgIdx(index);
    setTimeout(() => setCopiedMsgIdx(null), 2000);
  };

  // Text-to-Speech (TTS) Read Aloud using Web Speech API
  const toggleSpeech = (content, index) => {
    if (!("speechSynthesis" in window)) {
      flashToast("Text-to-speech is not supported in this browser.");
      return;
    }
    if (speakingMsgIdx === index) {
      window.speechSynthesis.cancel();
      setSpeakingMsgIdx(null);
      return;
    }

    window.speechSynthesis.cancel();
    // Strip markdown code blocks before reading
    const plainText = content.replace(/```[\s\S]*?```/g, "Code block omitted.").replace(/[#*_`]/g, "");
    const utterance = new SpeechSynthesisUtterance(plainText);
    utterance.rate = 1.05;
    utterance.onend = () => setSpeakingMsgIdx(null);
    utterance.onerror = () => setSpeakingMsgIdx(null);

    setSpeakingMsgIdx(index);
    window.speechSynthesis.speak(utterance);
  };

  // Export Chat to Markdown
  const exportChatAsMarkdown = () => {
    if (messages.length === 0) {
      flashToast("No messages to export");
      return;
    }
    const title = activeChatObj ? activeChatObj.title : "Nexus-AI-Session";
    let md = `# ${title}\n*Generated by Nexus Agentic AI*\n\n---\n\n`;
    messages.forEach((m) => {
      md += `### ${m.role === "user" ? "User" : "Assistant (Nexus Agentic AI)"}\n\n`;
      if (m.agents_used?.length > 0) {
        md += `> Agents involved: ${m.agents_used.join(", ")}\n\n`;
      }
      md += `${m.content}\n\n---\n\n`;
    });

    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/\s+/g, "_")}.md`;
    a.click();
    URL.revokeObjectURL(url);
    flashToast("Conversation exported as Markdown");
  };

  // Extract all code blocks
  const extractCodeBlocks = useCallback(() => {
    const blocks = [];
    messages.forEach((m) => {
      if (m.role !== "assistant") return;
      const regex = /```(?:\w+\n)?([\s\S]*?)```/g;
      let match;
      while ((match = regex.exec(m.content)) !== null) {
        if (match[1].trim()) blocks.push(match[1].trim());
      }
    });
    return blocks;
  }, [messages]);

  // Filter chats by project and search query
  const visibleChats = chats
    .slice()
    .reverse()
    .filter((c) => (activeProject ? c.project_id === activeProject : true))
    .filter((c) => (searchQuery ? c.title.toLowerCase().includes(searchQuery.toLowerCase()) : true));

  const activeChatObj = chats.find((c) => c.id === currentChat);

  return (
    <div
      className="app-container"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Toast Alert */}
      {toastBanner && (
        <div className="toast-banner">
          <span>✨</span>
          <span>{toastBanner}</span>
        </div>
      )}

      {/* Drag & Drop Overlay */}
      {isDragging && (
        <div className="drag-overlay">
          <Icons.Paperclip />
          <h3>Drop PDF or Image files into Agent Knowledge</h3>
          <p>Multi-agent vector embeddings and computer vision will index them immediately.</p>
        </div>
      )}

      {/* Mobile Drawer Backdrop */}
      {sidebarOpen && <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />}

      {/* ----------------- SIDEBAR ----------------- */}
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <div className="brand-wrapper">
            <div className="brand-emblem">
              <Icons.Sparkles />
            </div>
            <div className="brand-info">
              <div className="brand-title">Nexus Agentic AI</div>
              <div className="brand-subtitle">
                <span className="online-beacon" />
                Llama 3.2 • Swarm Online
              </div>
            </div>
          </div>
        </div>

        <div className="sidebar-actions">
          <button className="new-chat-btn" onClick={newChat}>
            <Icons.Plus />
            <span>New Session</span>
          </button>

          <div className="search-box">
            <span className="search-icon"><Icons.Search /></span>
            <input
              type="text"
              className="search-input"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="sidebar-content">
          {/* Workspaces Section */}
          <div className="sidebar-section">
            <div className="sidebar-section-title">
              <span>Workspaces</span>
              <button
                className="section-add-btn"
                onClick={() => setShowProjectModal(true)}
                title="Create Workspace"
              >
                <Icons.Plus />
              </button>
            </div>
            <div className="projects-list">
              <div
                className={`project-chip ${activeProject === null ? "active" : ""}`}
                onClick={() => setActiveProject(null)}
              >
                <span className="project-icon"><Icons.Folder /></span>
                <span className="project-name">All Conversations</span>
              </div>
              {projects.map((p) => (
                <div
                  key={p.id}
                  className={`project-chip ${activeProject === p.id ? "active" : ""}`}
                  onClick={() => setActiveProject(p.id)}
                >
                  <span className="project-icon"><Icons.Folder /></span>
                  <span className="project-name">{p.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Chat History Section */}
          <div className="sidebar-section" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <div className="sidebar-section-title">
              <span>Recent Sessions ({visibleChats.length})</span>
            </div>
            <div className="history-list">
              {visibleChats.length === 0 ? (
                <div style={{ color: "var(--text-dim)", fontSize: "12px", padding: "10px" }}>
                  {searchQuery ? "No matching sessions" : "No sessions yet. Click 'New Session' above!"}
                </div>
              ) : (
                visibleChats.map((c) => (
                  <div
                    key={c.id}
                    className={`history-item ${currentChat === c.id ? "active" : ""}`}
                    onClick={() => openChat(c.id)}
                  >
                    <div className="history-title-wrap">
                      <span className="history-icon"><Icons.MessageSquare /></span>
                      {renamingId === c.id ? (
                        <input
                          className="history-rename-input"
                          value={renameValue}
                          autoFocus
                          onChange={(e) => setRenameValue(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          onBlur={() => commitRename(c.id)}
                          onKeyDown={(e) => e.key === "Enter" && commitRename(c.id)}
                        />
                      ) : (
                        <span className="history-title">{c.title}</span>
                      )}
                    </div>
                    <div className="history-actions">
                      <button
                        className="action-icon-btn"
                        onClick={(e) => startRename(c, e)}
                        title="Rename"
                      >
                        <Icons.Edit />
                      </button>
                      <button
                        className="action-icon-btn danger"
                        onClick={(e) => deleteChat(c.id, e)}
                        title="Delete"
                      >
                        <Icons.Trash />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="sidebar-footer">
          <button className="footer-btn" onClick={() => setView("swarm")}>
            <Icons.Network />
            <span>Agent Swarm Architecture</span>
          </button>
          <button className="footer-btn" onClick={() => setView("code")}>
            <Icons.Code />
            <span>Code Artifacts Studio</span>
          </button>
          <button className="footer-btn" onClick={() => setShowSettingsModal(true)}>
            <Icons.Settings />
            <span>Preferences {userName ? `(${userName})` : ""}</span>
          </button>
          <button className="footer-btn danger" onClick={deleteAllChats}>
            <Icons.Trash />
            <span>Wipe Chat History</span>
          </button>
        </div>
      </aside>

      {/* ----------------- MAIN WORKSPACE ----------------- */}
      <main className="main-workspace">
        {/* Topbar */}
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="mobile-menu-btn"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open Sidebar"
            >
              ☰
            </button>
            <div className="workspace-title-box">
              <span className="current-chat-title">
                {activeChatObj ? activeChatObj.title : "Multi-Agent Intelligence Session"}
              </span>
              <span className="active-agents-indicator">
                <span>Autonomous Supervisor Network • 5 Nodes Active</span>
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="topbar-nav">
            <button
              className={`nav-tab-btn ${view === "chat" ? "active" : ""}`}
              onClick={() => setView("chat")}
            >
              <Icons.MessageSquare />
              <span>Conversation</span>
            </button>
            <button
              className={`nav-tab-btn ${view === "swarm" ? "active" : ""}`}
              onClick={() => setView("swarm")}
            >
              <Icons.Network />
              <span>Agent Swarm</span>
            </button>
            <button
              className={`nav-tab-btn ${view === "code" ? "active" : ""}`}
              onClick={() => setView("code")}
            >
              <Icons.Code />
              <span>Artifacts ({extractCodeBlocks().length})</span>
            </button>
          </div>

          {/* Right Action Icons & Theme Accents */}
          <div className="topbar-right">
            {/* Theme Accent Dots */}
            <div className="theme-selector" title="Theme Accent Color">
              <button
                className={`theme-dot ${currentTheme === "indigo" ? "active" : ""}`}
                style={{ backgroundColor: "#6366f1" }}
                onClick={() => applyTheme("indigo")}
                title="Cyber Indigo"
              />
              <button
                className={`theme-dot ${currentTheme === "cyan" ? "active" : ""}`}
                style={{ backgroundColor: "#06b6d4" }}
                onClick={() => applyTheme("cyan")}
                title="Electric Cyan"
              />
              <button
                className={`theme-dot ${currentTheme === "emerald" ? "active" : ""}`}
                style={{ backgroundColor: "#10b981" }}
                onClick={() => applyTheme("emerald")}
                title="Emerald Matrix"
              />
              <button
                className={`theme-dot ${currentTheme === "amber" ? "active" : ""}`}
                style={{ backgroundColor: "#f59e0b" }}
                onClick={() => applyTheme("amber")}
                title="Solar Amber"
              />
              <button
                className={`theme-dot ${currentTheme === "purple" ? "active" : ""}`}
                style={{ backgroundColor: "#a855f7" }}
                onClick={() => applyTheme("purple")}
                title="Aurora Purple"
              />
            </div>

            <button
              className="topbar-icon-btn"
              onClick={exportChatAsMarkdown}
              title="Export Conversation as Markdown"
            >
              <Icons.Download />
            </button>
          </div>
        </header>

        {/* ----------------- VIEW 1: SWARM GRAPH VISUALIZER ----------------- */}
        {view === "swarm" ? (
          <div className="swarm-graph-view">
            <div className="swarm-hero">
              <h2>Autonomous Agent Swarm Network</h2>
              <p>
                LangGraph-powered supervisor network routing prompts to specialized autonomous worker nodes in real-time.
              </p>
            </div>

            <div className="swarm-canvas">
              {/* Central Supervisor Node */}
              <div className="swarm-supervisor-card">
                <span className="supervisor-badge">
                  <Icons.Sparkles /> Supervisor Core Node
                </span>
                <h3>LangGraph ReAct Router</h3>
                <p>Analyzes intent, decomposes multi-step queries, and directs execution flow.</p>
              </div>

              {/* Worker Nodes Grid */}
              <div className="swarm-workers-grid">
                {Object.entries(AGENT_META).map(([key, meta]) => {
                  const IconComp = meta.icon;
                  return (
                    <div key={key} className="swarm-node-card">
                      <div className="swarm-node-header">
                        <div className="swarm-node-title">
                          <IconComp />
                          <span>{meta.name}</span>
                        </div>
                        <div className="swarm-node-status">
                          <span className="online-beacon" />
                          <span>Ready</span>
                        </div>
                      </div>
                      <p className="swarm-node-desc">{meta.desc}</p>
                      <div className="swarm-node-tools">
                        <span className="swarm-tool-tag">Node: {key}</span>
                        <span className="swarm-tool-tag">LLM: Llama 3.2</span>
                      </div>
                      <button
                        className="swarm-test-btn"
                        onClick={() => {
                          setView("chat");
                          if (key === "researcher") sendMessage("What are the key tech trends in 2026?");
                          if (key === "math_agent") sendMessage("What is 42 * 17.5 + (1200 / 4)?");
                          if (key === "date_agent") sendMessage("What is the current exact date and time in India?");
                          if (key === "document_agent") fileInputRef.current?.click();
                          if (key === "image_agent") fileInputRef.current?.click();
                        }}
                      >
                        ⚡ Test this Agent
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : view === "code" ? (
          /* ----------------- VIEW 2: CODE ARTIFACTS STUDIO ----------------- */
          <div className="code-drawer-view">
            <div className="drawer-header">
              <h2>Extracted Code & Synthesized Blocks</h2>
              <button className="btn-secondary" onClick={() => setView("chat")}>
                ← Back to Conversation
              </button>
            </div>
            {extractCodeBlocks().length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-muted)" }}>
                <Icons.Code />
                <p style={{ marginTop: "12px", fontSize: "14px" }}>
                  No code blocks have been generated in this conversation yet. Ask a programming or data question!
                </p>
              </div>
            ) : (
              extractCodeBlocks().map((code, idx) => (
                <CodeBlock key={idx} code={code} lang="script" />
              ))
            )}
          </div>
        ) : messages.length === 0 ? (
          /* ----------------- VIEW 3: WELCOME HERO SCREEN ----------------- */
          <div className="welcome-hero">
            <div className="hero-glow-card">
              <div className="hero-icon-bubble">
                <Icons.Sparkles />
              </div>
              <h1 className="hero-title">
                {greeting}{userName ? `, ${userName}` : ""}
              </h1>
              <p className="hero-subtitle">
                Autonomous multi-agent intelligence workspace. Harness deep live web research,
                vector document RAG, mathematical AST execution, and visual scene analysis.
              </p>
            </div>

            <div className="capabilities-grid">
              <div
                className="capability-card"
                onClick={() => {
                  sendMessage("What are the top 5 emerging breakthroughs in AI agent architectures this year?");
                }}
              >
                <div className="cap-icon cyan">
                  <Icons.Globe />
                </div>
                <div className="cap-text">
                  <h4>Live Web Research</h4>
                  <p>Autonomous researcher agent searches live web information and cites current facts.</p>
                </div>
              </div>

              <div
                className="capability-card"
                onClick={() => {
                  if (fileInputRef.current) fileInputRef.current.click();
                }}
              >
                <div className="cap-icon emerald">
                  <Icons.FileText />
                </div>
                <div className="cap-text">
                  <h4>Document RAG Engine</h4>
                  <p>Upload PDF documents into Chroma vectorstore for similarity semantic search.</p>
                </div>
              </div>

              <div
                className="capability-card"
                onClick={() => {
                  sendMessage("Calculate compound interest for $15,000 invested at 7.2% annual yield over 6 years.");
                }}
              >
                <div className="cap-icon amber">
                  <Icons.Calculator />
                </div>
                <div className="cap-text">
                  <h4>Math & Symbolic Logic</h4>
                  <p>Deterministic AST arithmetic engine evaluates formulas with precision.</p>
                </div>
              </div>

              <div
                className="capability-card"
                onClick={() => {
                  if (fileInputRef.current) fileInputRef.current.click();
                }}
              >
                <div className="cap-icon purple">
                  <Icons.Image />
                </div>
                <div className="cap-text">
                  <h4>Vision Intelligence</h4>
                  <p>Attach screenshots, charts, or images for scene interpretation and OCR.</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ----------------- VIEW 4: CHAT MESSAGE STREAM ----------------- */
          <div className="chat-scroll-area">
            {messages.map((m, idx) => (
              <div key={idx} className={`message-row ${m.role}`}>
                <div className={`msg-avatar ${m.role === "user" ? "user-avatar" : "ai-avatar"}`}>
                  {m.role === "user" ? "You" : <Icons.Sparkles />}
                </div>

                <div className="message-body">
                  <div className="message-bubble">
                    <MessageContent content={m.content} />

                    {/* Agent Trace Badges */}
                    {m.agents_used && m.agents_used.length > 0 && (
                      <div className="agent-trace-row">
                        <span style={{ fontSize: "11px", color: "var(--text-muted)", alignSelf: "center", marginRight: "4px" }}>
                          Orchestrated by:
                        </span>
                        {m.agents_used.map((agentKey) => {
                          const meta = AGENT_META[agentKey] || {
                            name: agentKey,
                            icon: Icons.Sparkles,
                            class: "researcher",
                          };
                          const IconComp = meta.icon;
                          return (
                            <span key={agentKey} className={`agent-badge-pill ${meta.class}`}>
                              <IconComp />
                              <span>{meta.name}</span>
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="msg-meta-row">
                    <button
                      className="msg-action-btn"
                      onClick={() => copyMessageContent(m.content, idx)}
                    >
                      {copiedMsgIdx === idx ? <Icons.Check /> : <Icons.Copy />}
                      <span>{copiedMsgIdx === idx ? "Copied" : "Copy"}</span>
                    </button>

                    {m.role === "assistant" && (
                      <button
                        className={`msg-action-btn ${speakingMsgIdx === idx ? "active-speaker" : ""}`}
                        onClick={() => toggleSpeech(m.content, idx)}
                        title="Read response aloud"
                      >
                        {speakingMsgIdx === idx ? <Icons.Square /> : <Icons.Speaker />}
                        <span>{speakingMsgIdx === idx ? "Stop Audio" : "Listen"}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="message-row assistant">
                <div className="msg-avatar ai-avatar">
                  <Icons.Sparkles />
                </div>
                <div className="message-body">
                  <div className="message-bubble">
                    <div className="thinking-box">
                      <span className="thinking-pulse-dot" />
                      <span className="thinking-text">
                        Supervisor node evaluating query & dispatching specialized agents...
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        )}

        {/* ----------------- INPUT DOCK & MODE SELECTION ----------------- */}
        {view === "chat" && (
          <div className="input-dock-container">
            <div className="input-dock-wrapper">
              {/* Mode Pills */}
              <div className="mode-pills-row">
                <button
                  className={`mode-pill ${promptMode === "auto" ? "active" : ""}`}
                  onClick={() => setPromptMode("auto")}
                >
                  <Icons.Sparkles /> Auto Supervisor
                </button>
                <button
                  className={`mode-pill ${promptMode === "web" ? "active" : ""}`}
                  onClick={() => setPromptMode("web")}
                >
                  <Icons.Globe /> Force Web Search
                </button>
                <button
                  className={`mode-pill ${promptMode === "math" ? "active" : ""}`}
                  onClick={() => setPromptMode("math")}
                >
                  <Icons.Calculator /> Math Engine
                </button>
                <button
                  className={`mode-pill ${promptMode === "doc" ? "active" : ""}`}
                  onClick={() => {
                    setPromptMode("doc");
                    if (attachedNames.length === 0) fileInputRef.current?.click();
                  }}
                >
                  <Icons.FileText /> PDF RAG ({attachedNames.filter((f) => f.endsWith(".pdf")).length})
                </button>
                <button
                  className={`mode-pill ${promptMode === "vision" ? "active" : ""}`}
                  onClick={() => {
                    setPromptMode("vision");
                    if (attachedNames.length === 0) fileInputRef.current?.click();
                  }}
                >
                  <Icons.Image /> Vision AI
                </button>
              </div>

              {/* Main Input Dock */}
              <div className="input-dock">
                {/* Attached Files Strip */}
                {attachedNames.length > 0 && (
                  <div className="attachments-preview-strip">
                    {attachedNames.map((name) => (
                      <div key={name} className="attachment-pill">
                        {name.toLowerCase().endsWith(".pdf") ? <Icons.FileText /> : <Icons.Image />}
                        <span>{name}</span>
                        <button
                          className="remove-file-btn"
                          onClick={() => removeAttachment(name)}
                          title="Remove attachment"
                        >
                          <Icons.X />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="input-main-row">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".pdf,.png,.jpg,.jpeg,.webp"
                    multiple
                    hidden
                    onChange={(e) => handleUploadFiles(e.target.files)}
                  />
                  <button
                    className="attach-btn"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    title="Attach PDF or Image"
                  >
                    <Icons.Paperclip />
                  </button>

                  <textarea
                    ref={textareaRef}
                    rows={1}
                    className="prompt-textarea"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={
                      uploading
                        ? "Embedding files into vector database..."
                        : promptMode === "web"
                        ? "Search web facts, news, and world trends..."
                        : promptMode === "math"
                        ? "Enter formulas or numeric calculations (e.g., 25 * 40 - 15)..."
                        : "Ask anything, execute calculations, or attach documents... (Enter to send)"
                    }
                    disabled={loading}
                  />

                  <button
                    className="send-btn"
                    onClick={() => sendMessage()}
                    disabled={!input.trim() || loading || uploading}
                    aria-label="Send message"
                  >
                    <Icons.Send />
                  </button>
                </div>
              </div>

              <div className="input-footer-hint">
                <span>↵ Enter to send</span>
                <span>•</span>
                <span>⇧ Shift + Enter for multiline</span>
                <span>•</span>
                <span>Drag & drop files anywhere</span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ----------------- MODALS ----------------- */}

      {/* Workspace Project Modal */}
      {showProjectModal && (
        <div className="modal-backdrop" onClick={() => setShowProjectModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Create Workspace</h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "13px", marginBottom: "14px" }}>
              Organize related AI chats and document attachments into dedicated workspace projects.
            </p>
            <input
              type="text"
              className="modal-input"
              placeholder="e.g. Market Research, Thesis Analysis"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateProject()}
              autoFocus
            />
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowProjectModal(false)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleCreateProject}>
                Create Workspace
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="modal-backdrop" onClick={() => setShowSettingsModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">System & Personalization</h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "13px", marginBottom: "14px" }}>
              Set your name for personalized greetings and multi-agent coordination.
            </p>
            <input
              type="text"
              className="modal-input"
              placeholder="Your name or callsign"
              value={userNameInput}
              onChange={(e) => setUserNameInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveUserName()}
              autoFocus
            />
            <div style={{ background: "rgba(0,0,0,0.35)", padding: "12px", borderRadius: "8px", marginBottom: "18px" }}>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "6px", fontWeight: "700" }}>
                Active Multi-Agent Swarm Topology
              </div>
              <div style={{ fontSize: "12.5px", color: "var(--text-secondary)", fontFamily: "var(--font-mono)", lineHeight: "1.7" }}>
                • Orchestrator: LangGraph Supervisor Node<br />
                • LLM: Ollama (llama3.2 local 3B model)<br />
                • Vector Store: ChromaDB RAG Vectorstore<br />
                • Embeddings: HuggingFace all-MiniLM-L6-v2<br />
                • Audio: Web Speech API Synthesis Engine
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowSettingsModal(false)}>
                Close
              </button>
              <button className="btn-primary" onClick={saveUserName}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
