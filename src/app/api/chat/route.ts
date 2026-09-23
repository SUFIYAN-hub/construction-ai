import { GoogleGenAI } from "@google/genai"
import { auth } from "../../../../auth"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { checkAndIncrementUsage } from "@/lib/usage"
import { retrieveRelevantCodes } from "@/lib/rag"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Not signed in" }, { status: 401 })
    }

    const { message, projectId } = await req.json()

    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    const usage = await checkAndIncrementUsage(user.id)
    if (!usage.allowed) {
      return NextResponse.json({ error: "You've reached your free monthly limit. Upgrade to Pro for unlimited access.", limitReached: true }, { status: 403 })
    }

    // Use the given project, or create a new one if this is a fresh chat
    let project
    if (projectId) {
      project = await prisma.project.findFirst({ where: { id: projectId, userId: user.id } })
      if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 })
    } else {
      project = await prisma.project.create({
        data: { userId: user.id, title: message.slice(0, 50) },
      })
    }

    await prisma.message.create({
      data: { projectId: project.id, userId: user.id, role: "user", content: message },
    })

    // Retrieve relevant NBC content before answering
    const codeContext = await retrieveRelevantCodes(message)
    const contextText = codeContext.map(c => `[${c.source}]: ${c.content}`).join("\n")

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
    const result = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: `Reference NBC 2016 context (use this as your primary source when relevant; cite the clause number if context is used):\n${contextText}\n\nUser question: ${message}`,
      config: {
        systemInstruction: "You are a construction and civil engineering assistant. Answer using the provided reference context when it's relevant to the question — cite the exact clause number from the context rather than inventing figures. If the reference context doesn't cover the question, answer from general engineering knowledge but clearly say the answer is general guidance, not a specific NBC citation, and recommend the user verify with local municipal byelaws or a licensed engineer. Never state a specific number as an NBC requirement unless it's explicitly present in the provided context.",
      },
    })
    const reply = result.text ?? ""

    await prisma.message.create({
      data: { projectId: project.id, userId: user.id, role: "assistant", content: reply },
    })

    return NextResponse.json({ reply, projectId: project.id })
  } catch (err: any) {
    console.error("Chat API error:", err)
    return NextResponse.json({ error: err.message || "Something went wrong" }, { status: 500 })
  }
}