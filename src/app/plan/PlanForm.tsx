"use client"
import { useState, type CSSProperties } from "react"
import { useRouter } from "next/navigation"

const ROAD_OPTIONS = [
  { value: 4.5, label: "Under 6 m (narrow lane)" },
  { value: 6.5, label: "6 – 7.5 m" },
  { value: 12, label: "7.5 – 18 m (typical colony road)" },
  { value: 24, label: "18 – 30 m" },
  { value: 36, label: "Above 30 m" },
]

const HOUSE_TYPES = [
  { value: "detached", label: "Detached: open space on all sides" },
  { value: "semi-detached", label: "Semi-detached: shares one side wall" },
  { value: "row", label: "Row house: shares both side walls" },
]

export function PlanForm() {
  const router = useRouter()
  const [form, setForm] = useState({
    plotLength: 18, plotWidth: 12, bedrooms: 2, bathrooms: 2,
    hasKitchen: true, roadWidth: 12, houseType: "detached", budgetRange: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function submit() {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || "Something went wrong")
      router.push(`/project/${data.projectId}`)
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  const fieldStyle: CSSProperties = {
    width: "100%", padding: "10px 12px", marginTop: 6,
    border: "1px solid var(--border)", background: "white",
    fontFamily: "IBM Plex Sans", fontSize: 14,
  }
  const labelStyle: CSSProperties = { fontSize: 13, color: "var(--steel)", fontWeight: 500 }

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "40px 32px" }}>
      <div className="display" style={{ fontSize: 22 }}>Plan Your House</div>
      <div className="chalk-line" style={{ marginTop: 10, marginBottom: 32 }} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 24 }}>
        <label style={labelStyle}>Plot width: side facing the road (m)
          <input type="number" value={form.plotWidth} onChange={(e) => setForm({ ...form, plotWidth: +e.target.value })} style={fieldStyle} />
        </label>
        <label style={labelStyle}>Plot depth: front to back (m)
          <input type="number" value={form.plotLength} onChange={(e) => setForm({ ...form, plotLength: +e.target.value })} style={fieldStyle} />
        </label>
        <label style={labelStyle}>Road in front of the plot
          <select value={form.roadWidth} onChange={(e) => setForm({ ...form, roadWidth: +e.target.value })} style={fieldStyle}>
            {ROAD_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </label>
        <label style={labelStyle}>House type
          <select value={form.houseType} onChange={(e) => setForm({ ...form, houseType: e.target.value })} style={fieldStyle}>
            {HOUSE_TYPES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
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
        padding: "12px 28px", fontWeight: 600, cursor: "pointer", fontSize: 14,
      }}>
        {loading ? "Generating…" : "Generate Plan"}
      </button>

      {error && <p style={{ color: "var(--rust)", fontSize: 14, marginTop: 14 }}>{error}</p>}
    </div>
  )
}