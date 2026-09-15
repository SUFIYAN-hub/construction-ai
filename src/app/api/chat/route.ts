import { GoogleGenAI } from "@google/genai"
import { auth } from "../../../../auth"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { checkAndIncrementUsage } from "@/lib/usage"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Not signed in" }, { status: 401 })
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "Missing GEMINI_API_KEY in .env" }, { status: 500 })
    }

    const { message } = await req.json()

    // Find the user
    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    // Check usage limit — moved here, after user is defined
    const usage = await checkAndIncrementUsage(user.id)
    if (!usage.allowed) {
      return NextResponse.json({ error: "You've reached your free monthly limit. Upgrade to Pro for unlimited access.", limitReached: true }, { status: 403 })
    }

    // Get or create their default project
    let project = await prisma.project.findFirst({ where: { userId: user.id } })
    if (!project) {
      project = await prisma.project.create({
        data: { userId: user.id, title: "General Q&A" },
      })
    }

    // Save the user's message
    await prisma.message.create({
      data: { projectId: project.id, userId: user.id, role: "user", content: message },
    })

    // Get AI response
   const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
const result = await ai.models.generateContent({
  model: "gemini-3.6-flash",
  contents: message,
  config: {
    systemInstruction: "You are a construction and civil engineering assistant. Answer questions about construction methods, materials, structural basics, codes, and building processes clearly and practically. If a question needs a licensed engineer's sign-off (structural safety calculations, legal compliance), say so.",
  },
})
const reply = result.text

    // Save the AI's reply
    await prisma.message.create({
      data: { projectId: project.id, userId: user.id, role: "assistant", content: reply },
    })

    return NextResponse.json({ reply })
  } catch (err: any) {
    console.error("Chat API error:", err)
    return NextResponse.json({ error: err.message || "Something went wrong" }, { status: 500 })
  }
}