"use client"
import { useState, type CSSProperties } from "react"
import ReactMarkdown from "react-markdown"


export function PlanForm() {
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

 const fieldStyle: CSSProperties = {
    width: "100%", padding: "10px 12px", marginTop: 6,
    border: "1px solid var(--border)", background: "white",
    fontFamily: "IBM Plex Sans", fontSize: 14
  }
  const labelStyle: CSSProperties = { fontSize: 13, color: "var(--steel)", fontWeight: 500 }

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "40px 32px" }}>
      <div className="display" style={{ fontSize: 22 }}>Plan Your House</div>
      <div className="chalk-line" style={{ marginTop: 10, marginBottom: 32 }} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 24 }}>
        <label style={labelStyle}>Plot length (m)
          <input type="number" value={form.plotLength} onChange={(e) => setForm({ ...form, plotLength: +e.target.value })} style={fieldStyle} />
        </label>
        <label style={labelStyle}>Plot width (m)
          <input type="number" value={form.plotWidth} onChange={(e) => setForm({ ...form, plotWidth: +e.target.value })} style={fieldStyle} />
        </label>
        <label style={labelStyle}>Bedrooms
          <input type="number" value={form.bedrooms} onChange={(e) => setForm({ ...form, bedrooms: +e.target.value })} style={fieldStyle} />
        </label>
        <label style={labelStyle}>Bathrooms
          <input type="number" value={form.bathrooms} onChange={(e) => setForm({ ...form, bathrooms: +e.target.value })} style={fieldStyle} />
        </label>
        <label style={labelStyle}>Budget range (optional)
          <input value={form.budgetRange} onChange={(e) => setForm({ ...form, budgetRange: e.target.value })}
            placeholder="e.g. ₹25–30 lakh" style={fieldStyle} />
        </label>
        <label style={{ ...labelStyle, display: "flex", alignItems: "center", gap: 8, marginTop: 24 }}>
          <input type="checkbox" checked={form.hasKitchen} onChange={(e) => setForm({ ...form, hasKitchen: e.target.checked })} />
          Include kitchen
        </label>
      </div>

      <button onClick={submit} disabled={loading} style={{
        background: "var(--blue)", color: "white", border: "none",
        padding: "12px 28px", fontWeight: 600, cursor: "pointer", fontSize: 14
      }}>
        {loading ? "Generating..." : "Generate Plan"}
      </button>

      {result && (
        <div style={{ marginTop: 48 }}>
          <div className="display" style={{ fontSize: 17 }}>Floor Plan</div>
          <div className="chalk-line" style={{ marginTop: 8, marginBottom: 20 }} />
          <div style={{ border: "1px solid var(--border)", background: "white", padding: 16, marginBottom: 40 }}
            dangerouslySetInnerHTML={{ __html: result.svgData }} />

          <div className="display" style={{ fontSize: 17 }}>Roadmap</div>
          <div className="chalk-line" style={{ marginTop: 8, marginBottom: 20 }} />
          <div className="msg-content" style={{ borderLeft: "3px solid var(--steel)", paddingLeft: 16 }}>
            <ReactMarkdown>{result.roadmapText}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  )
}