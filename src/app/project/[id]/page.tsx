import { auth } from "../../../../auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { Sidebar } from "../../Sidebar"
import { ChatTest } from "../../ChatTest"
import { PlanView } from "../../PlanView"

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.email) redirect("/")

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) redirect("/")

  const project = await prisma.project.findFirst({
    where: { id, userId: user.id },
    include: { planRequest: { include: { floorPlan: true } } },
  })
  if (!project) redirect("/")

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <Sidebar userEmail={session.user.email} />
      <main style={{ flex: 1, overflowY: "auto" }}>
        {project.planRequest?.floorPlan ? (
          <PlanView title={project.title} svgData={project.planRequest.floorPlan.svgData} roadmapText={project.planRequest.floorPlan.roadmapText} />
        ) : (
          <ChatTest projectId={project.id} title={project.title} />
        )}
      </main>
    </div>
  )
}