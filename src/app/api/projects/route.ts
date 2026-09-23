import { auth } from "../../../../auth"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET() {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: "Not signed in" }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) return NextResponse.json({ projects: [] })

  const projects = await prisma.project.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { planRequest: true },
  })

  return NextResponse.json({
    projects: projects.map((p) => ({
      id: p.id,
      title: p.title,
      type: p.planRequest ? "plan" : "chat",
    })),
  })
}

export async function POST() {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: "Not signed in" }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const project = await prisma.project.create({ data: { userId: user.id, title: "New Chat" } })
  return NextResponse.json({ project })
}