import { auth } from "../../../../auth"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: "Not signed in" }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) return NextResponse.json({ messages: [] })

  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get("projectId")
  if (!projectId) return NextResponse.json({ messages: [] })

  const project = await prisma.project.findFirst({ where: { id: projectId, userId: user.id } })
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const messages = await prisma.message.findMany({ where: { projectId }, orderBy: { createdAt: "asc" } })
  return NextResponse.json({ messages })
}