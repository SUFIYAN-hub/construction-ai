import { addCodeReference } from "../src/lib/rag"

const chunks = [
  { source: "NBC 2016 - Foundations", content: "For residential buildings up to 2 storeys on ordinary soil, minimum foundation depth is typically 1.2 to 1.5 meters below ground level, adjusted for soil bearing capacity and local frost/water table conditions." },
  { source: "NBC 2016 - Room Sizes", content: "Minimum habitable room area is 9.5 sq m with a width not less than 2.4 m. Kitchen minimum area is 5.5 sq m. Bathroom minimum area is 1.8 sq m." },
  { source: "NBC 2016 - Setbacks", content: "Front setback for residential plots is typically 3m for plots under 200 sq m, increasing with plot size per local municipal bylaws; side and rear setbacks are commonly 1.5m to 3m depending on building height." },
]

async function main() {
  for (const chunk of chunks) {
    await addCodeReference(chunk.source, chunk.content)
    console.log("Added:", chunk.source)
  }
}

main()