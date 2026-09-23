"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { signOutAction } from "./actions"

interface ProjectItem { id: string; title: string; type: "chat" | "plan" }

export function Sidebar({ userEmail }: { userEmail: string }) {
  const [projects, setProjects] = useState<ProjectItem[]>([])
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    fetch("/api/projects").then((res) => res.json()).then((data) => {
      if (data.projects) setProjects(data.projects)
    })
  }, [pathname])

  async function newChat() {
    const res = await fetch("/api/projects", { method: "POST" })
    const data = await res.json()
    if (data.project) router.push(`/project/${data.project.id}`)
  }

  return (
    <aside style={{ width: 240, padding: 24, borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", height: "100vh" }}>
      <Link href="/" style={{ textDecoration: "none", color: "inherit" }}>
        <div className="display" style={{ fontSize: 16 }}>CONSTRUCTION AI</div>
      </Link>
      <p className="mono" style={{ fontSize: 11, color: "var(--steel)", marginTop: 4, marginBottom: 20 }}>PROJECT SET — 2026</p>

      <button onClick={newChat} style={{
        background: "var(--blue)", color: "white", border: "none",
        padding: "8px 12px", fontSize: 13, fontWeight: 600, cursor: "pointer", marginBottom: 8
      }}>
        + New chat
      </button>
      <Link href="/plan" style={{
        fontSize: 13, color: "var(--ink)", border: "1px solid var(--border)",
        padding: "8px 12px", textAlign: "center", marginBottom: 20, textDecoration: "none", display: "block"
      }}>
        + New house plan
      </Link>

      <p style={{ fontSize: 12, color: "var(--steel)", marginBottom: 8, fontWeight: 500 }}>Projects</p>
      <div style={{ flex: 1, overflowY: "auto" }}>
        {projects.map((p) => {
          const active = pathname === `/project/${p.id}`
          return (
            <Link key={p.id} href={`/project/${p.id}`} style={{
              display: "block", fontSize: 14, padding: "8px 10px", marginBottom: 4,
              background: active ? "var(--concrete-panel)" : "transparent",
              borderLeft: active ? "2px solid var(--blue)" : "2px solid transparent",
              color: "var(--ink)", textDecoration: "none",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
            }}>
              {p.type === "plan" ? "🏠 " : ""}{p.title}
            </Link>
          )
        })}
      </div>

      <div style={{ marginTop: 16 }}>
        <p className="mono" style={{ fontSize: 11, color: "var(--steel)", marginBottom: 8 }}>{userEmail}</p>
        <form action={signOutAction}>
          <button type="submit" style={{
            background: "none", border: "1px solid var(--border)",
            color: "var(--ink)", padding: "6px 12px", fontSize: 13, cursor: "pointer", width: "100%"
          }}>
            Sign out
          </button>
        </form>
      </div>
    </aside>
  )
}