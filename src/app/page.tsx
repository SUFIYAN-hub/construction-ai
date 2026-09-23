import { auth, signIn } from "../../auth"
import { Sidebar } from "./Sidebar"
import { ChatTest } from "./ChatTest"

export default async function Home() {
  const session = await auth()

  if (!session) {
    return (
      <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", maxWidth: 360 }}>
          <div className="display" style={{ fontSize: 26 }}>CONSTRUCTION AI</div>
          <div className="chalk-line" style={{ margin: "12px auto 20px" }} />
          <p style={{ color: "var(--steel)", marginBottom: 28, fontSize: 14, lineHeight: 1.6 }}>
            Grounded answers for civil engineers, students, and anyone planning a build — cited to real code, not guesses.
          </p>
          <form action={async () => { "use server"; await signIn("google") }}>
            <button type="submit" style={{ background: "var(--blue)", color: "white", border: "none", padding: "11px 22px", fontFamily: "IBM Plex Sans", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
              Sign in with Google
            </button>
          </form>
        </div>
      </main>
    )
  }

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <Sidebar userEmail={session.user?.email || ""} />
      <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <ChatTest />
      </main>
    </div>
  )
}