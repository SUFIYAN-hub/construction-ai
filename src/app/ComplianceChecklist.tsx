import type { Check } from "@/lib/floorplan"

const MARK = { pass: "✓", fail: "✗", info: "i" } as const
const WORD = { pass: "Pass", fail: "Fix", info: "Note" } as const
const COLOR = { pass: "var(--blue)", fail: "var(--rust)", info: "var(--steel)" } as const

export function ComplianceChecklist({ checks }: { checks: Check[] }) {
  if (!checks.length) return null
  const passed = checks.filter((c) => c.status === "pass").length
  const failed = checks.filter((c) => c.status === "fail").length

  return (
    <section style={{ marginBottom: 40 }}>
      <div className="display" style={{ fontSize: 17 }}>NBC Compliance Check</div>
      <div className="chalk-line" style={{ marginTop: 8, marginBottom: 14 }} />
      <p style={{ fontSize: 14, margin: "0 0 14px", fontWeight: 500 }}>
        {passed} passed{failed ? ` · ${failed} need attention` : ""}
      </p>

      <div style={{ border: "1px solid var(--border)", background: "white" }}>
        {checks.map((c, i) => (
          <div key={i} style={{
            display: "flex", gap: 12, padding: "10px 14px",
            borderTop: i === 0 ? "none" : "1px solid var(--border)",
          }}>
            <div style={{ width: 44, flexShrink: 0, color: COLOR[c.status], fontSize: 13, fontWeight: 600 }}>
              {MARK[c.status]} {WORD[c.status]}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{c.label}</div>
              <div style={{ fontSize: 13, lineHeight: 1.5 }}>{c.detail}</div>
              <div className="mono" style={{ fontSize: 11, color: "var(--steel)", marginTop: 2 }}>{c.clause}</div>
            </div>
          </div>
        ))}
      </div>

      <p style={{ fontSize: 12, color: "var(--steel)", margin: "10px 0 0", lineHeight: 1.6 }}>
        Schematic check against the NBC 2016 rules in our knowledge base (room sizes, setbacks, access road).
        It is not a statutory approval. Your local municipal byelaws govern.
      </p>
    </section>
  )
}