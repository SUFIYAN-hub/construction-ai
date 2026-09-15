import { auth } from "../../../../auth"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET() {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 })
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) return NextResponse.json({ messages: [] })

  const project = await prisma.project.findFirst({ where: { userId: user.id } })
  if (!project) return NextResponse.json({ messages: [] })

  const messages = await prisma.message.findMany({
    where: { projectId: project.id },
    orderBy: { createdAt: "asc" },
  })

  return NextResponse.json({ messages })
}