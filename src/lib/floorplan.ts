export type HouseType = "detached" | "semi-detached" | "row"

export interface PlanInput {
  plotLength: number // depth: from the road side to the back of the plot (m)
  plotWidth: number // frontage: the side facing the road (m)
  bedrooms: number
  bathrooms: number
  hasKitchen: boolean
  roadWidth: number // representative width of the road the plot fronts (m)
  houseType: HouseType
}

export interface Check {
  label: string
  status: "pass" | "fail" | "info"
  detail: string
  clause: string
}

export interface PlanResult {
  svg: string
  checks: Check[]
  notes: string
}

type RoomKind = "bedroom" | "living" | "kitchen" | "bathroom"
interface RoomSpec { name: string; short: string; kind: RoomKind; area: number }
interface PlacedRoom extends RoomSpec { x: number; y: number; w: number; h: number }
interface Setbacks { front: number; rear: number; left: number; right: number }
interface Services { x: number; y: number; w: number; h: number; gapX: number; gapW: number }

// Minimums from NBC 2016 Part 3, Clause 12 (the stricter single-room reading for habitable rooms;
// bathroom = combined bath + water-closet).
const RULES: Record<RoomKind, { minArea: number; minWidth: number; clause: string }> = {
  bedroom: { minArea: 9.5, minWidth: 2.4, clause: "NBC 2016 Cl.12.2.2" },
  living: { minArea: 9.5, minWidth: 2.4, clause: "NBC 2016 Cl.12.2.2" },
  kitchen: { minArea: 5.0, minWidth: 1.8, clause: "NBC 2016 Cl.12.3.2" },
  bathroom: { minArea: 2.8, minWidth: 1.2, clause: "NBC 2016 Cl.12.4.2" },
}

const MAX_SCALE_UP = 1.5 // rooms never grow beyond 1.5x their comfortable target size
const BATH_AREA = 3.5
const BATH_DEPTH = 2.2 // bathrooms sit in a passage band of this depth

const f1 = (v: number) => Math.floor(v * 10 + 1e-9) / 10 // round DOWN to 1 decimal (conservative)
const sum = (rooms: RoomSpec[]) => rooms.reduce((t, r) => t + r.area, 0)

export function getSetbacks(i: Pick<PlanInput, "plotLength" | "plotWidth" | "roadWidth" | "houseType">): Setbacks {
  // Cl.8.2.1.1 front open space by road width
  const front = i.roadWidth <= 7.5 ? 1.5 : i.roadWidth <= 18 ? 3 : i.roadWidth <= 30 ? 4.5 : 6
  // Cl.8.2.1.2 rear open space (reduced for shallow plots)
  const rear = i.plotLength < 9 ? 1.5 : 3
  // Cl.8.2.1.3 side open spaces
  let left = 3
  let right = 3
  if (i.houseType === "row") {
    left = 0
    right = 0
  } else if (i.houseType === "semi-detached") {
    left = 0
    right = i.plotWidth < 9 ? 1.5 : 3
  } else if (i.plotWidth < 12) {
    left = 1.5 // one side may be reduced on frontages under 12 m
  }
  return { front, rear, left, right }
}

function buildRooms(bedrooms: number, bathrooms: number, hasKitchen: boolean) {
  const front: RoomSpec[] = [{ name: "Living / dining", short: "Living", kind: "living", area: 16 }]
  if (hasKitchen) front.push({ name: "Kitchen", short: "Kitchen", kind: "kitchen", area: 7.5 })

  const beds: RoomSpec[] = []
  for (let i = 0; i < bedrooms; i++) {
    beds.push({
      name: i === 0 ? "Master bedroom" : `Bedroom ${i + 1}`,
      short: i === 0 ? "Master" : `Bed ${i + 1}`,
      kind: "bedroom",
      area: i === 0 ? 13 : 11,
    })
  }
  const baths: RoomSpec[] = []
  for (let i = 0; i < bathrooms; i++) {
    baths.push({ name: `Bathroom ${i + 1}`, short: `Bath ${i + 1}`, kind: "bathroom", area: BATH_AREA })
  }
  return { front, beds, baths }
}

function placeBand(rooms: RoomSpec[], x0: number, y0: number, width: number, depth: number): PlacedRoom[] {
  const bandArea = sum(rooms)
  let x = x0
  return rooms.map((r) => {
    const w = (width * r.area) / bandArea
    const placed = { ...r, x, y: y0, w, h: depth }
    x += w
    return placed
  })
}

function drawSvg(
  input: PlanInput,
  env: { x: number; y: number; w: number; h: number },
  placed: PlacedRoom[],
  failing: Set<string>,
  buildable: boolean,
  services: Services | null
): string {
  const pad = 40
  const scale = Math.min(34, 560 / input.plotWidth, 560 / input.plotLength)
  const W = input.plotWidth * scale
  const H = input.plotLength * scale
  const roadH = 24
  const vbW = W + pad * 2
  const vbH = H + pad * 2 + roadH + 36
  const n = (v: number) => v.toFixed(1)
  const sx = (m: number) => n(pad + m * scale)

  const p: string[] = []
  // the whole plot is tinted (required open space); the buildable area is drawn clear on top of it
  p.push(`<rect x="${pad}" y="${pad}" width="${n(W)}" height="${n(H)}" fill="#E9EEF8" stroke="#8C887E" stroke-width="1.5"/>`)
  if (buildable) {
    p.push(
      `<rect x="${sx(env.x)}" y="${sx(env.y)}" width="${n(env.w * scale)}" height="${n(env.h * scale)}" fill="#FAF9F5" stroke="#1E4FBF" stroke-width="1" stroke-dasharray="5 4"/>`
    )
  }

  // road along the front (bottom edge)
  const roadY = pad + H + 8
  p.push(`<rect x="${pad}" y="${n(roadY)}" width="${n(W)}" height="${roadH}" fill="#8C887E" fill-opacity="0.3"/>`)
  p.push(
    `<text x="${n(pad + W / 2)}" y="${n(roadY + roadH / 2 + 4)}" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10" fill="#211F1B">ROAD</text>`
  )

  // plot dimensions
  p.push(
    `<text x="${n(pad + W / 2)}" y="${pad - 14}" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="11" fill="#8C887E">${input.plotWidth} m</text>`
  )
  p.push(
    `<text x="${pad - 16}" y="${n(pad + H / 2)}" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="11" fill="#8C887E" transform="rotate(-90 ${pad - 16} ${n(pad + H / 2)})">${input.plotLength} m</text>`
  )

  // passage band behind the bathrooms
  if (services) {
    p.push(
      `<rect x="${sx(services.x)}" y="${sx(services.y)}" width="${n(services.w * scale)}" height="${n(services.h * scale)}" fill="#FAF9F5" stroke="#8C887E" stroke-width="1"/>`
    )
    if (services.gapW * scale >= 56) {
      p.push(
        `<text x="${n(pad + (services.gapX + services.gapW / 2) * scale)}" y="${n(pad + (services.y + services.h / 2) * scale + 3)}" text-anchor="middle" font-family="IBM Plex Sans, sans-serif" font-size="10" font-style="italic" fill="#8C887E">Passage</text>`
      )
    }
  }

  for (const r of placed) {
    const bad = failing.has(r.name)
    const wpx = r.w * scale
    const cx = pad + r.x * scale + wpx / 2
    const cy = pad + r.y * scale + (r.h * scale) / 2
    p.push(
      `<rect x="${sx(r.x)}" y="${sx(r.y)}" width="${n(wpx)}" height="${n(r.h * scale)}" fill="${bad ? "#F3DDD2" : "#F1EEE7"}" stroke="${bad ? "#B5502A" : "#211F1B"}" stroke-width="1.5"/>`
    )
    p.push(
      `<text x="${n(cx)}" y="${n(cy - 3)}" text-anchor="middle" font-family="IBM Plex Sans, sans-serif" font-size="11" font-weight="600" fill="#211F1B">${r.short}</text>`
    )
    if (wpx >= 40) {
      p.push(
        `<text x="${n(cx)}" y="${n(cy + 11)}" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="9" fill="#8C887E">${f1(r.w).toFixed(1)}×${f1(r.h).toFixed(1)}</text>`
      )
    }
  }

  const ly = roadY + roadH + 18
  p.push(`<text x="${pad}" y="${n(ly)}" font-family="IBM Plex Sans, sans-serif" font-size="10" fill="#8C887E">Blue-tinted margin = open space required by setbacks</text>`)
  p.push(`<text x="${pad}" y="${n(ly + 14)}" font-family="IBM Plex Sans, sans-serif" font-size="10" fill="#8C887E">Rust-tinted rooms are below NBC minimums · sizes in metres</text>`)

  return `<svg viewBox="0 0 ${n(vbW)} ${n(vbH)}" width="100%" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Floor plan">${p.join("")}</svg>`
}

export function generateFloorPlan(input: PlanInput): PlanResult {
  const sb = getSetbacks(input)
  const env = {
    x: sb.left,
    y: sb.rear,
    w: input.plotWidth - sb.left - sb.right,
    h: input.plotLength - sb.rear - sb.front,
  }
  const buildable = env.w > 0 && env.h > 0
  const checks: Check[] = []

  checks.push(
    input.roadWidth >= 6
      ? { label: "Access road", status: "pass", detail: "The plot fronts a road of at least 6 m, the minimum for development.", clause: "NBC 2016 Cl.4.3" }
      : { label: "Access road", status: "fail", detail: "Development is not permitted unless the plot is reached by a public street of at least 6 m.", clause: "NBC 2016 Cl.4.3" }
  )
  checks.push({
    label: "Setbacks applied",
    status: buildable ? "pass" : "fail",
    detail: `Front ${sb.front} m, rear ${sb.rear} m, left ${sb.left} m, right ${sb.right} m (${input.houseType}).`,
    clause: "NBC 2016 Cl.8.2.1",
  })
  checks.push({
    label: "Height assumption",
    status: "info",
    detail: "Setbacks assume a building up to 7 m high. Taller buildings need larger side and rear open spaces.",
    clause: "NBC 2016 Table 4",
  })

  const { front, beds, baths } = buildRooms(input.bedrooms, input.bathrooms, input.hasKitchen)
  const hs = baths.length > 0 ? BATH_DEPTH : 0
  const roomArea = sum(beds) + sum(front)
  const availH = env.h - hs
  const canPlace = env.w > 0 && availH > 0

  const placed: PlacedRoom[] = []
  let services: Services | null = null
  let scaleFactor = 1
  let bathOverflow = false
  const bandArea = canPlace ? env.w * availH : 0

  if (canPlace) {
    scaleFactor = Math.min(MAX_SCALE_UP, bandArea / roomArea)
    const k = Math.sqrt((roomArea * scaleFactor) / bandArea)
    const fw = env.w * k
    const fhRooms = availH * k
    const x0 = input.houseType === "detached" ? env.x + (env.w - fw) / 2 : env.x
    let y = env.y + env.h - (fhRooms + hs) // house sits toward the road, garden behind

    const bedDepth = beds.length ? (fhRooms * sum(beds)) / roomArea : 0
    const frontDepth = (fhRooms * sum(front)) / roomArea

    const bedPlaced = beds.length ? placeBand(beds, x0, y, fw, bedDepth) : []
    y += bedDepth

    const bathPlaced: PlacedRoom[] = []
    if (baths.length) {
      const bw = BATH_AREA / BATH_DEPTH
      let prevEnd = x0
      baths.forEach((b, i) => {
        const x = Math.max(bedPlaced[i]?.x ?? x0, prevEnd)
        bathPlaced.push({ ...b, x, y, w: bw, h: BATH_DEPTH })
        prevEnd = x + bw
      })
      bathOverflow = prevEnd > x0 + fw + 1e-6
      services = { x: x0, y, w: fw, h: BATH_DEPTH, gapX: prevEnd, gapW: Math.max(0, x0 + fw - prevEnd) }
      y += BATH_DEPTH
    }

    const frontPlaced = placeBand(front, x0, y, fw, frontDepth)
    placed.push(...bedPlaced, ...bathPlaced, ...frontPlaced)
  }

  const failing = new Set<string>()
  for (const r of placed) {
    const rule = RULES[r.kind]
    const area = f1(r.w * r.h)
    const width = f1(Math.min(r.w, r.h))
    const ok = area >= rule.minArea && width >= rule.minWidth
    if (!ok) failing.add(r.name)
    checks.push({
      label: r.name,
      status: ok ? "pass" : "fail",
      detail: `${area.toFixed(1)} sq m, ${width.toFixed(1)} m wide (minimum ${rule.minArea} sq m, ${rule.minWidth} m).`,
      clause: rule.clause,
    })
  }

  if (!canPlace) {
    checks.push({
      label: "Fit on plot",
      status: "fail",
      detail: "These setbacks leave too little buildable area for this room list. Try a row or semi-detached house type, or check your local byelaws.",
      clause: "NBC 2016 Cl.8.2.1",
    })
  } else {
    if (bathOverflow) {
      checks.push({
        label: "Bathroom fit",
        status: "fail",
        detail: "The bathrooms need more width than the buildable area offers. Reduce the bathroom count or use a wider plot or a row type.",
        clause: "NBC 2016 Cl.12.4.2",
      })
    }
    if (scaleFactor < 1) {
      checks.push({
        label: "Fit on plot",
        status: failing.size > 0 ? "fail" : "info",
        detail:
          `Bedrooms, living and kitchen need about ${Math.round(roomArea)} sq m, but only ${Math.round(bandArea)} sq m is left` +
          `${baths.length ? " after the bathroom passage" : ""} inside the ${input.houseType} setbacks. ` +
          `${input.houseType === "row" ? "Try fewer rooms, a bigger plot, or a second floor." : "Try a row or semi-detached type, fewer rooms, or a second floor."}`,
        clause: "NBC 2016 Cl.8.2.1",
      })
    }
  }

  const problems = checks.filter((c) => c.status === "fail").map((c) => c.label)
  const notes =
    `Single-storey layout, ${input.houseType} house. Setbacks: front ${sb.front} m, rear ${sb.rear} m, left ${sb.left} m, right ${sb.right} m. ` +
    (buildable ? `Buildable area about ${Math.round(env.w * env.h)} sq m. ` : "No buildable area remains after setbacks. ") +
    (problems.length ? `NBC checks that fail: ${problems.join(", ")}.` : "All NBC checks in the layout pass.")

  return { svg: drawSvg(input, env, placed, failing, buildable, services), checks, notes }
}

export function parseChecks(json: string | null | undefined): Check[] {
  if (!json) return []
  try {
    const v = JSON.parse(json)
    return Array.isArray(v) ? (v as Check[]) : []
  } catch {
    return []
  }
}