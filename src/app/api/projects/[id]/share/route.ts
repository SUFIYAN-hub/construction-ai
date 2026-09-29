import { randomBytes } from "crypto"
import { auth } from "../../../../../../auth"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

async function getOwnedProject(id: string) {
  const session = await auth()
  if (!session?.user?.email) return { error: "Not signed in", status: 401 as const }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) return { error: "User not found", status: 404 as const }

  const project = await prisma.project.findFirst({
    where: { id, userId: user.id },
    include: { planRequest: true },
  })
  if (!project) return { error: "Not found", status: 404 as const }

  return { project }
}

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const result = await getOwnedProject(id)
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status })

  if (!result.project.planRequest) {
    return NextResponse.json({ error: "Only house plans can be shared" }, { status: 400 })
  }

  const token = result.project.shareToken ?? randomBytes(16).toString("hex")
  await prisma.project.update({ where: { id }, data: { shareToken: token } })
  return NextResponse.json({ token })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const result = await getOwnedProject(id)
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status })

  await prisma.project.update({ where: { id }, data: { shareToken: null } })
  return NextResponse.json({ success: true })
}