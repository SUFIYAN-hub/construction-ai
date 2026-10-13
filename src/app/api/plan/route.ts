import { GoogleGenAI } from "@google/genai"
import { auth } from "../../../../auth"
import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { generateFloorPlan } from "@/lib/floorplan"
import { checkAndIncrementUsage } from "@/lib/usage"
import { retrieveRelevantCodes } from "@/lib/rag"

const PlanSchema = z.object({
  plotLength: z.number().min(3).max(200),
  plotWidth: z.number().min(3).max(200),
  bedrooms: z.number().int().min(0).max(8),
  bathrooms: z.number().int().min(0).max(8),
  hasKitchen: z.boolean(),
  roadWidth: z.number().min(1).max(60),
  houseType: z.enum(["detached", "semi-detached", "row"]),
  budgetRange: z.string().max(60).optional(),
})

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Not signed in" }, { status: 401 })
    }

    const parsed = PlanSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: "Please check the plot size, road width and room counts." }, { status: 400 })
    }
    const { plotLength, plotWidth, bedrooms, bathrooms, hasKitchen, roadWidth, houseType, budgetRange } = parsed.data

    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    const usage = await checkAndIncrementUsage(user.id)
    if (!usage.allowed) {
      return NextResponse.json({ error: "You've reached your free monthly limit. Upgrade to Pro for unlimited access.", limitReached: true }, { status: 403 })
    }

    const plan = generateFloorPlan({ plotLength, plotWidth, bedrooms, bathrooms, hasKitchen, roadWidth, houseType })

    const codeContext = await retrieveRelevantCodes(
      `${houseType} house, ${bedrooms} bedrooms, ${bathrooms} bathrooms, plot ${plotWidth}x${plotLength}m, setbacks open space`
    )
    const contextText = codeContext.map((c) => `[${c.source}]: ${c.content}`).join("\n")

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })
    const prompt =
      `Reference building code context:\n${contextText}\n\n` +
      `Plot: ${plotWidth} m frontage x ${plotLength} m deep. Bedrooms: ${bedrooms}. Bathrooms: ${bathrooms}. ` +
      `Kitchen: ${hasKitchen ? "yes" : "no"}. Budget range: ${budgetRange || "not specified"}.\n\n` +
      `Layout facts already computed (use these exactly, do not contradict them): ${plan.notes}\n\n` +
      `Give a full construction roadmap for this house, citing the reference context where relevant. ` +
      `If the layout notes list failing checks, start with a short section on what to change.`

    const result = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        systemInstruction:
          "You are a construction planning assistant. Give practical, step-by-step house-building roadmaps in markdown. Cover: approvals/permits, foundation type suited to plot size, structural approach, rough construction sequence and timeline, and key budget considerations. Keep it concise and actionable. Note where a licensed structural engineer's sign-off is required.",
      },
    })
    const roadmapText = result.text ?? ""

    const project = await prisma.project.create({
      data: { userId: user.id, title: `House Plan — ${plotLength}x${plotWidth}m` },
    })
    const planRequest = await prisma.planRequest.create({
      data: {
        projectId: project.id,
        plotLength, plotWidth, bedrooms, bathrooms, hasKitchen, roadWidth, houseType,
        budgetRange: budgetRange || null,
      },
    })
    await prisma.floorPlan.create({
      data: {
        planRequestId: planRequest.id,
        svgData: plan.svg,
        roadmapText,
        complianceJson: JSON.stringify(plan.checks),
      },
    })

    return NextResponse.json({ projectId: project.id })
  } catch (err: any) {
    console.error("Plan API error:", err)
    return NextResponse.json({ error: err.message || "Something went wrong" }, { status: 500 })
  }
}