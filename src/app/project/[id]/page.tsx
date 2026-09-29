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

  const plan = project.planRequest

  return (
    <div className="app-shell" style={{ display: "flex", height: "100vh" }}>
      <Sidebar userEmail={session.user.email} />
      <main className="app-main" style={{ flex: 1, overflowY: "auto" }}>
        {plan?.floorPlan ? (
          <PlanView
            title={project.title}
            svgData={plan.floorPlan.svgData}
            roadmapText={plan.floorPlan.roadmapText}
            summary={`${plan.plotLength} m × ${plan.plotWidth} m plot · ${plan.bedrooms} bed · ${plan.bathrooms} bath${plan.hasKitchen ? " · kitchen" : ""}`}
            projectId={project.id}
            shareToken={project.shareToken}
          />
        ) : (
          <ChatTest projectId={project.id} title={project.title} />
        )}
      </main>
    </div>
  )
}