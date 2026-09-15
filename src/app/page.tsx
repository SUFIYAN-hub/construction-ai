import { auth, signIn, signOut } from "../../auth";
import { ChatTest } from "./ChatTest";
import Link from "next/link";

export default async function Home() {
  const session = await auth();

  if (!session) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bg)",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <h1 className="display" style={{ fontSize: 28, marginBottom: 8 }}>
            Construction AI
          </h1>
          <p style={{ color: "var(--muted)", marginBottom: 24, fontSize: 14 }}>
            Your assistant for construction and site planning
          </p>
          <form
            action={async () => {
              "use server";
              await signIn("google");
            }}
          >
            <button
              type="submit"
              style={{
                background: "var(--steel)",
                color: "white",
                border: "none",
                borderRadius: 8,
                padding: "10px 20px",
                fontFamily: "IBM Plex Sans",
                fontWeight: 500,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              Sign in with Google
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <aside
        style={{
          width: 240,
          background: "var(--sidebar)",
          borderRight: "1px solid var(--border)",
          padding: 20,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <h2 className="display" style={{ fontSize: 17, marginBottom: 24 }}>
          Construction AI
        </h2>
        <a
          href="/new-project"
          style={{
            display: "block",
            marginBottom: 16,
            fontSize: 13,
            color: "var(--steel)",
          }}
        >
          + New Project
        </a>

        <p
          style={{
            fontSize: 12,
            color: "var(--muted)",
            marginBottom: 8,
            fontWeight: 500,
          }}
        >
          PROJECTS
        </p>
        <Link
          href="/plan"
          style={{
            fontSize: 14,
            color: "var(--steel)",
            marginTop: 12,
            display: "block",
          }}
        >
          + New house plan
        </Link>
        <div
          style={{
            padding: "8px 10px",
            borderRadius: 6,
            fontSize: 14,
            background: "white",
            border: "1px solid var(--border)",
          }}
        >
          General Q&A
        </div>

        <div style={{ marginTop: "auto" }}>
          <p
            className="mono"
            style={{ fontSize: 11, color: "var(--muted)", marginBottom: 8 }}
          >
            {session.user?.email}
          </p>
          <form
            action={async () => {
              "use server";
              await signOut();
            }}
          >
            <button
              type="submit"
              style={{
                background: "none",
                border: "1px solid var(--border)",
                borderRadius: 6,
                color: "var(--text)",
                padding: "6px 12px",
                fontSize: 13,
                cursor: "pointer",
                width: "100%",
              }}
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <ChatTest />
      </main>
    </div>
  );
}
