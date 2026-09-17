import fs from "fs"
import path from "path"
import { parse } from "csv-parse/sync"
import { addCodeReference } from "../src/lib/rag"
import { prisma } from "../src/lib/db"

async function main() {
  const filePath = path.join(process.cwd(), "data", "building-codes.csv")
  const fileContent = fs.readFileSync(filePath, "utf-8")
  const records: { source: string; category: string; content: string }[] = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
  })

  console.log(`Found ${records.length} entries. Clearing old data...`)
  await prisma.$executeRawUnsafe(`DELETE FROM "CodeReference"`)

  for (const row of records) {
    await addCodeReference(`${row.source} [${row.category}]`, row.content)
    console.log("Added:", row.source)
  }

  console.log("Done.")
}

main().then(() => process.exit(0)).catch((err) => {
  console.error(err)
  process.exit(1)
})