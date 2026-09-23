"use client"
import { useState, useEffect } from "react"
import ReactMarkdown from "react-markdown"
import { useRouter } from "next/navigation"

export function ChatTest({ projectId, title }: { projectId?: string; title?: string }) {
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (!projectId) { setMessages([]); return }
    fetch(`/api/messages?projectId=${projectId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.messages) setMessages(data.messages.map((m: any) => ({ role: m.role, content: m.content })))
      })
  }, [projectId])

  async function sendMessage() {
    if (!message.trim()) return
    const userMsg = message
    setMessages((prev) => [...prev, { role: "user", content: userMsg }])
    setMessage("")
    setLoading(true)
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg, projectId }),
      })
      const data = await res.json()
      if (data.limitReached) {
        setMessages((prev) => [...prev, { role: "assistant", content: "You've reached your free monthly limit. [Upgrade to Pro](/pricing) for unlimited access." }])
      } else {
        setMessages((prev) => [...prev, { role: "assistant", content: data.reply || data.error || "No response" }])
        if (!projectId && data.projectId) router.push(`/project/${data.projectId}`)
      }
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Network error — check the terminal" }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ padding: "32px 40px 0" }}>
        <div className="display" style={{ fontSize: 20 }}>{title || "New Chat"}</div>
        <div className="chalk-line" style={{ marginTop: 10, marginBottom: 28 }} />
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "0 40px" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          {messages.length === 0 && (
            <p style={{ color: "var(--steel)", fontSize: 14 }}>Ask a construction or civil engineering question to get started.</p>
          )}
          {messages.map((m, i) => (
            <div key={i} style={{ marginBottom: 22, borderLeft: `3px solid ${m.role === "user" ? "var(--blue)" : "var(--steel)"}`, paddingLeft: 14 }}>
              {m.role === "user" ? <p style={{ margin: 0, fontWeight: 500 }}>{m.content}</p> : <div className="msg-content"><ReactMarkdown>{m.content}</ReactMarkdown></div>}
            </div>
          ))}
          {loading && <p style={{ color: "var(--steel)", fontSize: 14 }}>Thinking…</p>}
        </div>
      </div>

      <div style={{ borderTop: "1px solid var(--border)", padding: 20 }}>
        <div style={{ maxWidth: 680, margin: "0 auto", display: "flex", gap: 8 }}>
          <input value={message} onChange={(e) => setMessage(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Ask a construction question..."
            style={{ flex: 1, padding: "12px 16px", border: "1px solid var(--border)", background: "white", fontSize: 14, fontFamily: "IBM Plex Sans" }} />
          <button onClick={sendMessage} disabled={loading} style={{ background: "var(--blue)", color: "white", border: "none", padding: "12px 24px", fontWeight: 600, cursor: "pointer", fontSize: 14 }}>
            Send
          </button>
        </div>
      </div>
    </div>
  )
}