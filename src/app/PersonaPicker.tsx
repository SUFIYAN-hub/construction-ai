"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { PERSONAS, type PersonaKey } from "@/lib/personas"

export function PersonaPicker() {
  const [saving, setSaving] = useState<string | null>(null)
  const router = useRouter()

  async function choose(key: PersonaKey) {
    setSaving(key)
    await fetch("/api/user/persona", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ persona: key }),
    })
    router.refresh()
  }

  return (
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", maxWidth: 560 }}>
        <div className="display" style={{ fontSize: 22 }}>Who's asking?</div>
        <div className="chalk-line" style={{ margin: "10px auto 8px" }} />
        <p style={{ color: "var(--steel)", fontSize: 14, marginBottom: 32 }}>
          This tunes how answers are explained — you can change it anytime.
        </p>
        <div style={{ display: "grid", gap: 12 }}>
          {(Object.entries(PERSONAS) as [PersonaKey, typeof PERSONAS[PersonaKey]][]).map(([key, p]) => (
            <button key={key} onClick={() => choose(key)} disabled={!!saving} style={{
              textAlign: "left", padding: "16px 20px", border: "1px solid var(--border)",
              background: saving === key ? "var(--concrete-panel)" : "white",
              cursor: "pointer", fontFamily: "IBM Plex Sans"
            }}>
              <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{p.label}</div>
              <div style={{ fontSize: 13, color: "var(--steel)" }}>{p.description}</div>
            </button>
          ))}
        </div>
      </div>
    </main>
  )
}