import { notFound } from "next/navigation"
import { prisma } from "@/lib/db"
import { parseChecks } from "@/lib/floorplan"
import { PlanView } from "../../PlanView"

export const metadata = { robots: { index: false, follow: false } }

export default async function SharedPlanPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  const project = await prisma.project.findUnique({
    where: { shareToken: token },
    include: { planRequest: { include: { floorPlan: true } } },
  })
  const plan = project?.planRequest
  if (!project || !plan?.floorPlan) notFound()

  return (
    <PlanView
      title={project.title}
      svgData={plan.floorPlan.svgData}
      roadmapText={plan.floorPlan.roadmapText}
      checks={parseChecks(plan.floorPlan.complianceJson)}
      summary={`${plan.plotWidth} m frontage × ${plan.plotLength} m deep · ${plan.bedrooms} bed · ${plan.bathrooms} bath${plan.hasKitchen ? " · kitchen" : ""} · ${plan.houseType}`}
    />
  )
}