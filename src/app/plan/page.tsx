import { auth } from "../../../auth"
import { redirect } from "next/navigation"
import { Sidebar } from "../Sidebar"
import { PlanForm } from "./PlanForm"

export default async function PlanPage() {
  const session = await auth()
  if (!session?.user?.email) redirect("/")

  return (
    <div className="app-shell" style={{ display: "flex", height: "100vh" }}>
      <Sidebar userEmail={session.user.email} />
      <main className="app-main" style={{ flex: 1, overflowY: "auto" }}>
        <PlanForm />
      </main>
    </div>
  )
}