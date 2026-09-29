"use client"
import { useEffect, useState, type CSSProperties } from "react"

const btn: CSSProperties = {
  background: "none", border: "1px solid var(--border)", color: "var(--ink)",
  padding: "8px 14px", fontSize: 13, cursor: "pointer", fontFamily: "IBM Plex Sans", fontWeight: 500,
}

export function PlanActions({ projectId, initialToken }: { projectId?: string; initialToken?: string | null }) {
  const [token, setToken] = useState<string | null>(initialToken ?? null)
  const [origin, setOrigin] = useState("")
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => setOrigin(window.location.origin), [])
  const link = token && origin ? `${origin}/share/${token}` : ""

  async function enableShare() {
    setBusy(true)
    const res = await fetch(`/api/projects/${projectId}/share`, { method: "POST" })
    const data = await res.json()
    if (data.token) setToken(data.token)
    setBusy(false)
  }

  async function revokeShare() {
    setBusy(true)
    await fetch(`/api/projects/${projectId}/share`, { method: "DELETE" })
    setToken(null)
    setBusy(false)
  }

  async function copyLink() {
    await navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button onClick={() => window.print()} style={btn}>Download PDF</button>
        {projectId && !token && (
          <button onClick={enableShare} disabled={busy} style={btn}>Create share link</button>
        )}
      </div>

      {projectId && token && (
        <div style={{ marginTop: 12, padding: 12, border: "1px solid var(--border)", background: "var(--concrete-panel)" }}>
          <p className="mono" style={{ fontSize: 12, margin: "0 0 10px", wordBreak: "break-all" }}>{link}</p>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={copyLink} style={btn}>{copied ? "Copied" : "Copy link"}</button>
            <button onClick={revokeShare} disabled={busy} style={btn}>Stop sharing</button>
          </div>
          <p style={{ fontSize: 12, color: "var(--steel)", margin: "10px 0 0" }}>
            Anyone with this link can view this plan. Stopping sharing disables the link immediately.
          </p>
        </div>
      )}
    </div>
  )
}