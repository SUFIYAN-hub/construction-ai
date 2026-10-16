"use client"
import { useState, useEffect, useRef } from "react"
import ReactMarkdown from "react-markdown"
import { useRouter } from "next/navigation"

type Msg = { role: "user" | "assistant"; content: string }

export function ChatTest({ projectId, title }: { projectId?: string; title?: string }) {
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<Msg[]>([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!projectId) { setMessages([]); return }
    fetch(`/api/messages?projectId=${projectId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.messages) setMessages(data.messages.map((m: any) => ({ role: m.role, content: m.content })))
      })
  }, [projectId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [messages])

  async function sendMessage() {
    if (!message.trim() || loading) return
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

      // Errors (limit reached, not signed in, rate limit) come back as JSON
      if (!res.ok || (res.headers.get("content-type") || "").includes("application/json")) {
        const data = await res.json()
        const text = data.limitReached
          ? "You've reached your free monthly limit. [Upgrade to Pro](/pricing) for unlimited access."
          : data.error || "No response"
        setMessages((prev) => [...prev, { role: "assistant", content: text }])
        return
      }

      const newProjectId = res.headers.get("X-Project-Id")
      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let acc = ""
      let started = false

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        acc += decoder.decode(value, { stream: true })
        const current = acc
        if (!started) {
          started = true
          setLoading(false)
          setMessages((prev) => [...prev, { role: "assistant", content: current }])
        } else {
          setMessages((prev) => {
            const copy = [...prev]
            copy[copy.length - 1] = { role: "assistant", content: current }
            return copy
          })
        }
      }

      if (!projectId && newProjectId) router.push(`/project/${newProjectId}`)
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Network error. Please check your connection and try again." }])
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
              {m.role === "user"
                ? <p style={{ margin: 0, fontWeight: 500 }}>{m.content}</p>
                : <div className="msg-content"><ReactMarkdown>{m.content}</ReactMarkdown></div>}
            </div>
          ))}
          {loading && <p style={{ color: "var(--steel)", fontSize: 14 }}>Searching the code…</p>}
          <div ref={bottomRef} />
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