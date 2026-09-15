import { GoogleGenAI } from "@google/genai"
import { auth } from "../../../../auth"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { generateFloorPlanSVG } from "@/lib/floorplan"
import { checkAndIncrementUsage } from "@/lib/usage"
import { retrieveRelevantCodes } from "@/lib/rag"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Not signed in" }, { status: 401 })
    }

    const { plotLength, plotWidth, bedrooms, bathrooms, hasKitchen, budgetRange } = await req.json()

    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    // Check usage limit — after user is defined
    const usage = await checkAndIncrementUsage(user.id)
    if (!usage.allowed) {
      return NextResponse.json({ error: "You've reached your free monthly limit. Upgrade to Pro for unlimited access.", limitReached: true }, { status: 403 })
    }

    const project = await prisma.project.create({
      data: { userId: user.id, title: `House Plan — ${plotLength}x${plotWidth}m` },
    })

    const svgData = generateFloorPlanSVG(plotLength, plotWidth, bedrooms, bathrooms, hasKitchen)

    // Retrieve relevant building code context
    const codeContext = await retrieveRelevantCodes(`house with ${bedrooms} bedrooms, ${bathrooms} bathrooms, plot ${plotLength}x${plotWidth}m`)
    const contextText = codeContext.map(c => `[${c.source}]: ${c.content}`).join("\n")

   const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })
const prompt = `Reference building code context:\n${contextText}\n\nPlot size: ${plotLength}m x ${plotWidth}m. Bedrooms: ${bedrooms}. Bathrooms: ${bathrooms}. Kitchen: ${hasKitchen ? "yes" : "no"}. Budget range: ${budgetRange || "not specified"}. Give a full construction roadmap for this house, citing the reference context where relevant.`
const result = await ai.models.generateContent({
  model: "gemini-3.6-flash",
  contents: prompt,
  config: {
    systemInstruction: "You are a construction planning assistant. Give practical, step-by-step house-building roadmaps in markdown. Cover: approvals/permits, foundation type suited to plot size, structural approach, rough construction sequence and timeline, and key budget considerations. Keep it concise and actionable. Note where a licensed structural engineer's sign-off is required.",
  },
})
const roadmapText = result.text ?? ""

    const planRequest = await prisma.planRequest.create({
      data: {
        projectId: project.id,
        plotLength, plotWidth, bedrooms, bathrooms, hasKitchen,
        budgetRange: budgetRange || null,
      },
    })

    const floorPlan = await prisma.floorPlan.create({
      data: { planRequestId: planRequest.id, svgData, roadmapText },
    })

    return NextResponse.json({ svgData, roadmapText, projectId: project.id })
  } catch (err: any) {
    console.error("Plan API error:", err)
    return NextResponse.json({ error: err.message || "Something went wrong" }, { status: 500 })
  }
}