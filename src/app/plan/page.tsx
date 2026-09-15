"use client"
import { useState } from "react"
import ReactMarkdown from "react-markdown"

export default function PlanPage() {
  const [form, setForm] = useState({ plotLength: 10, plotWidth: 8, bedrooms: 2, bathrooms: 2, hasKitchen: true, budgetRange: "" })
  const [result, setResult] = useState<{ svgData: string; roadmapText: string } | null>(null)
  const [loading, setLoading] = useState(false)

  async function submit() {
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setResult(data)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 32 }}>
      <h1 className="display" style={{ fontSize: 26, marginBottom: 24 }}>Plan Your House</h1>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
        <label>Plot length (m)
          <input type="number" value={form.plotLength} onChange={(e) => setForm({ ...form, plotLength: +e.target.value })}
            style={{ width: "100%", padding: 8, marginTop: 4, border: "1px solid var(--border)", borderRadius: 6 }} />
        </label>
        <label>Plot width (m)
          <input type="number" value={form.plotWidth} onChange={(e) => setForm({ ...form, plotWidth: +e.target.value })}
            style={{ width: "100%", padding: 8, marginTop: 4, border: "1px solid var(--border)", borderRadius: 6 }} />
        </label>
        <label>Bedrooms
          <input type="number" value={form.bedrooms} onChange={(e) => setForm({ ...form, bedrooms: +e.target.value })}
            style={{ width: "100%", padding: 8, marginTop: 4, border: "1px solid var(--border)", borderRadius: 6 }} />
        </label>
        <label>Bathrooms
          <input type="number" value={form.bathrooms} onChange={(e) => setForm({ ...form, bathrooms: +e.target.value })}
            style={{ width: "100%", padding: 8, marginTop: 4, border: "1px solid var(--border)", borderRadius: 6 }} />
        </label>
        <label>Budget range (optional)
          <input value={form.budgetRange} onChange={(e) => setForm({ ...form, budgetRange: e.target.value })}
            placeholder="e.g. ₹25–30 lakh"
            style={{ width: "100%", padding: 8, marginTop: 4, border: "1px solid var(--border)", borderRadius: 6 }} />
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 20 }}>
          <input type="checkbox" checked={form.hasKitchen} onChange={(e) => setForm({ ...form, hasKitchen: e.target.checked })} />
          Include kitchen
        </label>
      </div>

      <button onClick={submit} disabled={loading} style={{
        background: "var(--orange)", color: "white", border: "none", borderRadius: 8,
        padding: "12px 28px", fontWeight: 500, cursor: "pointer", fontSize: 14
      }}>
        {loading ? "Generating..." : "Generate Plan"}
      </button>

      {result && (
        <div style={{ marginTop: 40 }}>
          <h2 className="display" style={{ fontSize: 20, marginBottom: 12 }}>Floor Plan</h2>
          <div style={{ border: "1px solid var(--border)", borderRadius: 8, padding: 16, marginBottom: 32 }}
            dangerouslySetInnerHTML={{ __html: result.svgData }} />

          <h2 className="display" style={{ fontSize: 20, marginBottom: 12 }}>Roadmap</h2>
          <div className="msg-content">
            <ReactMarkdown>{result.roadmapText}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  )
}