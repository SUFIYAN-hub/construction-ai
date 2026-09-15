import { GoogleGenAI } from "@google/genai"
import { prisma } from "@/lib/db"

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

export async function embedText(text: string, taskType: "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY") {
  const result = await ai.models.embedContent({
    model: "gemini-embedding-001",
    contents: text,
    config: { outputDimensionality: 768, taskType },
  })
  return result.embeddings![0].values!
}

export async function addCodeReference(source: string, content: string) {
  const embedding = await embedText(content, "RETRIEVAL_DOCUMENT")
  const vectorLiteral = `[${embedding.join(",")}]`
  await prisma.$executeRawUnsafe(
    `INSERT INTO "CodeReference" (id, source, content, embedding) VALUES (gen_random_uuid()::text, $1, $2, $3::vector)`,
    source, content, vectorLiteral
  )
}

export async function retrieveRelevantCodes(query: string, limit = 4) {
  const embedding = await embedText(query, "RETRIEVAL_QUERY")
  const vectorLiteral = `[${embedding.join(",")}]`
  const results = await prisma.$queryRawUnsafe<{ source: string; content: string }[]>(
    `SELECT source, content FROM "CodeReference" ORDER BY embedding <=> $1::vector LIMIT $2`,
    vectorLiteral, limit
  )
  return results
}