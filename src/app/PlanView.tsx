import ReactMarkdown from "react-markdown"

export function PlanView({ title, svgData, roadmapText }: { title: string; svgData: string; roadmapText: string }) {
  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "40px 32px" }}>
      <div className="display" style={{ fontSize: 22 }}>{title}</div>
      <div className="chalk-line" style={{ marginTop: 10, marginBottom: 32 }} />
      <div className="display" style={{ fontSize: 17 }}>Floor Plan</div>
      <div className="chalk-line" style={{ marginTop: 8, marginBottom: 20 }} />
      <div style={{ border: "1px solid var(--border)", background: "white", padding: 16, marginBottom: 40 }} dangerouslySetInnerHTML={{ __html: svgData }} />
      <div className="display" style={{ fontSize: 17 }}>Roadmap</div>
      <div className="chalk-line" style={{ marginTop: 8, marginBottom: 20 }} />
      <div className="msg-content" style={{ borderLeft: "3px solid var(--steel)", paddingLeft: 16 }}>
        <ReactMarkdown>{roadmapText}</ReactMarkdown>
      </div>
    </div>
  )
}