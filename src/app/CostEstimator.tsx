"use client"
import { useState, type CSSProperties } from "react"
import {
  TIERS, RANGE, defaultBuiltUpSqft, estimate, formatInr, type TierKey,
} from "@/lib/cost"
import type { HouseType } from "@/lib/floorplan"

export function CostEstimator({ plotLength, plotWidth, roadWidth, houseType }: {
  plotLength: number
  plotWidth: number
  roadWidth: number
  houseType: HouseType
}) {
  const [area, setArea] = useState(() => defaultBuiltUpSqft({ plotLength, plotWidth, roadWidth, houseType }))
  const [tier, setTier] = useState<TierKey>("standard")
  const [rate, setRate] = useState<number>(TIERS.standard.rate)

  const est = estimate(area, rate)

  function pickTier(key: TierKey) {
    setTier(key)
    setRate(TIERS[key].rate)
  }

  const field: CSSProperties = {
    width: "100%", padding: "8px 10px", marginTop: 6,
    border: "1px solid var(--border)", background: "white",
    fontFamily: "IBM Plex Sans", fontSize: 14,
  }
  const label: CSSProperties = { fontSize: 13, color: "var(--steel)", fontWeight: 500 }

  return (
    <section style={{ marginBottom: 40 }}>
      <div className="display" style={{ fontSize: 17 }}>Cost Estimate</div>
      <div className="chalk-line" style={{ marginTop: 8, marginBottom: 16 }} />

      <div className="no-print" style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {(Object.keys(TIERS) as TierKey[]).map((key) => (
          <button key={key} onClick={() => pickTier(key)} style={{
            padding: "8px 14px", fontSize: 13, cursor: "pointer", fontFamily: "IBM Plex Sans",
            border: `1px solid ${tier === key ? "var(--blue)" : "var(--border)"}`,
            background: tier === key ? "var(--blue)" : "white",
            color: tier === key ? "white" : "var(--ink)", fontWeight: 600,
          }}>
            {TIERS[key].label}
          </button>
        ))}
      </div>
      <p style={{ fontSize: 13, color: "var(--steel)", margin: "0 0 16px" }}>{TIERS[tier].note}</p>

      <div className="no-print" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
        <label style={label}>Built-up area (sq ft)
          <input type="number" min={0} value={area} onChange={(e) => setArea(+e.target.value)} style={field} />
        </label>
        <label style={label}>Rate (₹ per sq ft)
          <input type="number" min={0} value={rate} onChange={(e) => setRate(+e.target.value)} style={field} />
        </label>
      </div>

      <div style={{ border: "1px solid var(--border)", background: "white", padding: 18, marginBottom: 14 }}>
        <div className="display" style={{ fontSize: 26 }}>{formatInr(est.total)}</div>
        <div className="mono" style={{ fontSize: 12, color: "var(--steel)", marginTop: 4 }}>
          Likely range {formatInr(est.low)} to {formatInr(est.high)} (±{Math.round(RANGE * 100)}%)
          · {area.toLocaleString("en-IN")} sq ft at ₹{rate.toLocaleString("en-IN")}/sq ft
        </div>
      </div>

      <div style={{ border: "1px solid var(--border)", background: "white" }}>
        {est.parts.map((p, i) => (
          <div key={p.label} style={{ padding: "10px 14px", borderTop: i === 0 ? "none" : "1px solid var(--border)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, gap: 12 }}>
              <span>{p.label}</span>
              <span style={{ fontWeight: 600, whiteSpace: "nowrap" }}>{formatInr(p.amount)}</span>
            </div>
            <div style={{ height: 4, background: "var(--concrete)", marginTop: 6 }}>
              <div style={{ height: 4, width: `${p.share * 100}%`, background: "var(--blue)" }} />
            </div>
          </div>
        ))}
      </div>

      <p style={{ fontSize: 12, color: "var(--steel)", margin: "10px 0 0", lineHeight: 1.6 }}>
        Rough estimate only, not a quotation. Starting rates are typical 2026 Indian ranges and vary by city,
        soil, materials and contractor, so change them to match local quotes. Excludes land, furniture and
        interiors, compound wall, landscaping and utility connection charges. Area starts as the single-storey
        footprint inside the setbacks. Edit it for the real built-up area.
      </p>
    </section>
  )
}