"use client"
import { useState } from "react"
import ReactMarkdown from "react-markdown"

export default function NewProject() {
  const [form, setForm] = useState({ plotLength: "", plotWidth: "", bedrooms: "2", bathrooms: "2", hasKitchen: true, budgetRange: "" })
  const [result, setResult] = useState<{ svgData: string; roadmapText: string } | null>(null)
  const [loading, setLoading] = useState(false)

  async function submit() {
    setLoading(true)
    const res = await fetch("/api/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        plotLength: parseFloat(form.plotLength),
        plotWidth: parseFloat(form.plotWidth),
        bedrooms: parseInt(form.bedrooms),
        bathrooms: parseInt(form.bathrooms),
        hasKitchen: form.hasKitchen,
        budgetRange: form.budgetRange,
      }),
    })
    const data = await res.json()
    setResult(data)
    setLoading(false)
  }

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: 32 }}>
      <h1 className="display" style={{ fontSize: 24, marginBottom: 24 }}>New Project</h1>

      {!result && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", gap: 12 }}>
            <input placeholder="Plot length (ft)" value={form.plotLength}
              onChange={(e) => setForm({ ...form, plotLength: e.target.value })}
              style={{ flex: 1, padding: 10, border: "1px solid var(--border)", borderRadius: 6 }} />
            <input placeholder="Plot width (ft)" value={form.plotWidth}
              onChange={(e) => setForm({ ...form, plotWidth: e.target.value })}
              style={{ flex: 1, padding: 10, border: "1px solid var(--border)", borderRadius: 6 }} />
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <input placeholder="Bedrooms" value={form.bedrooms}
              onChange={(e) => setForm({ ...form, bedrooms: e.target.value })}
              style={{ flex: 1, padding: 10, border: "1px solid var(--border)", borderRadius: 6 }} />
            <input placeholder="Bathrooms" value={form.bathrooms}
              onChange={(e) => setForm({ ...form, bathrooms: e.target.value })}
              style={{ flex: 1, padding: 10, border: "1px solid var(--border)", borderRadius: 6 }} />
          </div>
          <input placeholder="Budget range (e.g. ₹20-25 lakh)" value={form.budgetRange}
            onChange={(e) => setForm({ ...form, budgetRange: e.target.value })}
            style={{ padding: 10, border: "1px solid var(--border)", borderRadius: 6 }} />
          <label style={{ fontSize: 14 }}>
            <input type="checkbox" checked={form.hasKitchen}
              onChange={(e) => setForm({ ...form, hasKitchen: e.target.checked })} /> Include kitchen
          </label>
          <button onClick={submit} disabled={loading} style={{
            background: "var(--orange)", color: "white", border: "none", borderRadius: 8,
            padding: "12px 24px", fontWeight: 500, cursor: "pointer", marginTop: 8
          }}>
            {loading ? "Generating..." : "Generate Plan"}
          </button>
        </div>
      )}

      {result && (
        <div>
          <div dangerouslySetInnerHTML={{ __html: result.svgData }} style={{ marginBottom: 24, border: "1px solid var(--border)", padding: 16, borderRadius: 8 }} />
          <div className="msg-content">
            <ReactMarkdown>{result.roadmapText}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  )
}