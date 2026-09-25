import { auth } from "../../../../../auth"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: "Not signed in" }, { status: 401 })

  const { persona } = await req.json()
  if (!["student", "engineer", "homeowner"].includes(persona)) {
    return NextResponse.json({ error: "Invalid persona" }, { status: 400 })
  }

  await prisma.user.update({ where: { email: session.user.email }, data: { persona } })
  return NextResponse.json({ success: true })
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: "Not signed in" }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  return NextResponse.json({ persona: user?.persona || null })
}