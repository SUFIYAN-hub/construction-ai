import { GoogleGenAI } from "@google/genai"
import { auth } from "../../../../auth"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { checkAndIncrementUsage } from "@/lib/usage"
import { retrieveRelevantCodes } from "@/lib/rag"
import { getSystemPrompt } from "@/lib/personas"

export const maxDuration = 60

const BASE_INSTRUCTION =
  "You are a construction and civil engineering assistant. Answer using the provided reference context when it's relevant to the question — cite the exact clause number from the context (for example Cl.12.2.2) rather than inventing figures. If the reference context doesn't cover the question, answer from general engineering knowledge but clearly say the answer is general guidance, not a specific NBC citation, and recommend the user verify with local municipal byelaws or a licensed engineer. Never state a specific number as an NBC requirement unless it's explicitly present in the provided context."

// Only list a source if the answer actually cites its clause number.
function citedSources(reply: string, codes: { source: string }[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const c of codes) {
    const m = c.source.match(/Cl\.\s*(\d+(?:\.\d+)*)/)
    if (!m || seen.has(c.source)) continue
    const num = m[1].replace(/\./g, "\\.")
    if (new RegExp(`(?<![\\d.])${num}(?!\\.?\\d)`).test(reply)) {
      seen.add(c.source)
      out.push(c.source)
    }
  }
  return out
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Not signed in" }, { status: 401 })
    }

    const { message, projectId } = await req.json()
    if (typeof message !== "string" || !message.trim() || message.length > 4000) {
      return NextResponse.json({ error: "Please enter a question (up to 4000 characters)." }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    const usage = await checkAndIncrementUsage(user.id)
    if (!usage.allowed) {
      return NextResponse.json({ error: "You've reached your free monthly limit. Upgrade to Pro for unlimited access.", limitReached: true }, { status: 403 })
    }

    let project
    if (projectId) {
      project = await prisma.project.findFirst({ where: { id: projectId, userId: user.id } })
      if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 })
    } else {
      project = await prisma.project.create({ data: { userId: user.id, title: message.slice(0, 50) } })
    }

    await prisma.message.create({
      data: { projectId: project.id, userId: user.id, role: "user", content: message },
    })

    const codeContext = await retrieveRelevantCodes(message)
    const contextText = codeContext.map((c) => `[${c.source}]: ${c.content}`).join("\n")

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })
    const geminiStream = await ai.models.generateContentStream({
      model: "gemini-3.6-flash",
      contents: `Reference NBC 2016 context (use this as your primary source when relevant; cite the clause number if context is used):\n${contextText}\n\nUser question: ${message}`,
      config: { systemInstruction: getSystemPrompt(user.persona as any, BASE_INSTRUCTION) },
    })

    const encoder = new TextEncoder()
    const pid = project.id
    const uid = user.id

    const body = new ReadableStream({
      async start(controller) {
        let reply = ""
        try {
          for await (const chunk of geminiStream) {
            const t = chunk.text ?? ""
            if (t) {
              reply += t
              controller.enqueue(encoder.encode(t))
            }
          }

          const sources = citedSources(reply, codeContext)
          const footer = sources.length
            ? `\n\n**Sources**\n${sources.map((s) => `- ${s}`).join("\n")}`
            : `\n\n*General guidance, not a specific NBC citation. Verify with your local municipal byelaws.*`
          controller.enqueue(encoder.encode(footer))

          await prisma.message.create({
            data: { projectId: pid, userId: uid, role: "assistant", content: reply + footer },
          })
        } catch (err) {
          console.error("Chat stream error:", err)
          controller.enqueue(encoder.encode("\n\nSomething went wrong while answering. Please try again."))
        } finally {
          controller.close()
        }
      },
    })

    return new Response(body, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "X-Project-Id": project.id,
      },
    })
  } catch (err: any) {
    console.error("Chat API error:", err)
    return NextResponse.json({ error: err.message || "Something went wrong" }, { status: 500 })
  }
}