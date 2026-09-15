"use client"
import { useState, useEffect } from "react"
import ReactMarkdown from "react-markdown"

export function ChatTest() {
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
  fetch("/api/messages")
    .then((res) => res.json())
    .then((data) => {
      if (data.messages) {
        setMessages(data.messages.map((m: any) => ({ role: m.role, content: m.content })))
      }
    })
}, [])

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
        body: JSON.stringify({ message: userMsg }),
      })
     const data = await res.json()
if (data.limitReached) {
  setMessages((prev) => [...prev, { role: "assistant", content: "You've reached your free monthly limit. [Upgrade to Pro](/pricing) for unlimited access." }])
} else {
  setMessages((prev) => [...prev, { role: "assistant", content: data.reply || data.error || "No response" }])
}
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Network error — check the terminal" }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ flex: 1, overflowY: "auto", padding: "32px 24px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          {messages.length === 0 && (
            <p style={{ color: "var(--muted)", textAlign: "center", marginTop: 60 }}>
              Ask a construction or civil engineering question to get started.
            </p>
          )}
          {messages.map((m, i) => (
            <div key={i} style={{ marginBottom: 24, display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
              <div style={{
                maxWidth: "80%",
                background: m.role === "user" ? "var(--steel)" : "white",
                color: m.role === "user" ? "white" : "var(--text)",
                border: m.role === "user" ? "none" : "1px solid var(--border)",
                borderRadius: 12,
                padding: "12px 16px",
              }}>
                {m.role === "user" ? (
                  <p style={{ margin: 0 }}>{m.content}</p>
                ) : (
                  <div className="msg-content"><ReactMarkdown>{m.content}</ReactMarkdown></div>
                )}
              </div>
            </div>
          ))}
          {loading && <p style={{ color: "var(--muted)", fontSize: 14 }}>Thinking...</p>}
        </div>
      </div>

      <div style={{ borderTop: "1px solid var(--border)", padding: 20 }}>
        <div style={{ maxWidth: 720, margin: "0 auto", display: "flex", gap: 8 }}>
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Ask a construction question..."
            style={{
              flex: 1, padding: "12px 16px", border: "1px solid var(--border)",
              borderRadius: 8, fontSize: 14, fontFamily: "IBM Plex Sans"
            }}
          />
          <button onClick={sendMessage} disabled={loading} style={{
            background: "var(--orange)", color: "white", border: "none", borderRadius: 8,
            padding: "12px 24px", fontWeight: 500, cursor: "pointer", fontSize: 14
          }}>
            Send
          </button>
        </div>
      </div>
    </div>
  )
}