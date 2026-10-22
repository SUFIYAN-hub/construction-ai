import { getSetbacks, type HouseType } from "./floorplan"

export const SQM_TO_SQFT = 10.7639

export const TIERS = {
  basic: { label: "Basic", rate: 1800, note: "Plain tiles, standard fittings, simple finish" },
  standard: { label: "Standard", rate: 2300, note: "Vitrified tiles, branded fittings, good finish" },
  premium: { label: "Premium", rate: 3200, note: "Better tiles, modular kitchen, higher-end electricals" },
} as const
export type TierKey = keyof typeof TIERS

// Typical share of an all-in rate (materials + labour). Adds up to 100.
export const SPLIT = [
  { label: "Structure and masonry", share: 0.45 },
  { label: "Flooring, doors, windows, paint", share: 0.25 },
  { label: "Plumbing and sanitary", share: 0.09 },
  { label: "Electrical", share: 0.08 },
  { label: "Fees, approvals and contingency", share: 0.13 },
] as const

export const RANGE = 0.15 // shown as total ± 15%

// Footprint of the buildable area left after NBC setbacks (one storey), in sq ft.
export function defaultBuiltUpSqft(p: { plotLength: number; plotWidth: number; roadWidth: number; houseType: HouseType }): number {
  const s = getSetbacks(p)
  const w = Math.max(0, p.plotWidth - s.left - s.right)
  const d = Math.max(0, p.plotLength - s.front - s.rear)
  return Math.round(w * d * SQM_TO_SQFT / 10) * 10
}

export function estimate(areaSqft: number, rate: number) {
  const total = Math.max(0, areaSqft) * Math.max(0, rate)
  return {
    total,
    low: total * (1 - RANGE),
    high: total * (1 + RANGE),
    parts: SPLIT.map((s) => ({ label: s.label, share: s.share, amount: total * s.share })),
  }
}

export function formatInr(n: number): string {
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(2)} crore`
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(1)} lakh`
  return `₹${Math.round(n).toLocaleString("en-IN")}`
}