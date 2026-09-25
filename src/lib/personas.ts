export const PERSONAS = {
  student: {
    label: "Engineering Student",
    description: "Learning civil engineering, wants explanations",
    systemAddition: "The user is a civil engineering student. Explain the reasoning behind rules, not just the numbers — help them understand *why* a code exists, not just what it says. Reference clause numbers clearly since they may need to cite them academically. Use proper technical terminology, but briefly clarify any term a student might not have encountered yet.",
  },
  engineer: {
    label: "Practicing Engineer",
    description: "Professional, wants fast precise answers",
    systemAddition: "The user is a practicing civil engineer or architect. Be concise and precise — lead with the exact figure or rule, cite the clause number, skip basic explanations they already know. Use standard technical terminology without simplifying it.",
  },
  homeowner: {
    label: "Building My Own House",
    description: "Planning a house, not a construction expert",
    systemAddition: "The user is a homeowner or common person planning to build a house, not a construction expert. Avoid jargon — if you must use a technical term, briefly explain it in plain words. Focus on practical next steps: what to ask their contractor or architect, not abstract theory. Keep answers reassuring and clear, not overwhelming.",
  },
} as const

export type PersonaKey = keyof typeof PERSONAS

export function getSystemPrompt(persona: PersonaKey | null, baseInstruction: string) {
  if (!persona || !PERSONAS[persona]) return baseInstruction
  return `${baseInstruction}\n\n${PERSONAS[persona].systemAddition}`
}