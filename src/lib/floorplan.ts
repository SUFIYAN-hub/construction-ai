interface RoomSpec { name: string; area: number }
interface PlacedRoom extends RoomSpec { x: number; y: number; width: number; height: number }

function buildRoomList(bedrooms: number, bathrooms: number, hasKitchen: boolean): RoomSpec[] {
  const rooms: RoomSpec[] = []
  for (let i = 0; i < bedrooms; i++) {
    rooms.push({ name: i === 0 ? "Master Bedroom" : `Bedroom ${i + 1}`, area: i === 0 ? 15 : 11 })
  }
  for (let i = 0; i < bathrooms; i++) {
    rooms.push({ name: `Bathroom ${i + 1}`, area: 4.5 })
  }
  if (hasKitchen) rooms.push({ name: "Kitchen", area: 9 })
  rooms.push({ name: "Living Room", area: 18 })
  return rooms
}

function layoutRooms(rooms: RoomSpec[], plotWidth: number) {
  const depth = 3.5
  let x = 0, y = 0
  const placed: PlacedRoom[] = []
  for (const room of rooms) {
    const width = Math.max(2.5, room.area / depth)
    if (x + width > plotWidth && x > 0) {
      x = 0
      y += depth
    }
    placed.push({ ...room, x, y, width, height: depth })
    x += width
  }
  return { placed, usedHeight: y + depth }
}

export function generateFloorPlanSVG(
  plotLength: number, plotWidth: number,
  bedrooms: number, bathrooms: number, hasKitchen: boolean
): string {
  const rooms = buildRoomList(bedrooms, bathrooms, hasKitchen)
  const { placed, usedHeight } = layoutRooms(rooms, plotWidth)
  const scale = 30 // pixels per meter
  const padding = 20
  const svgWidth = plotWidth * scale + padding * 2
  const svgHeight = Math.max(usedHeight, plotLength) * scale + padding * 2

  const roomRects = placed.map((r) => `
    <rect x="${r.x * scale + padding}" y="${r.y * scale + padding}" width="${r.width * scale}" height="${r.height * scale}"
      fill="#F3F3F1" stroke="#2B5876" stroke-width="1.5" />
    <text x="${r.x * scale + padding + (r.width * scale) / 2}" y="${r.y * scale + padding + (r.height * scale) / 2 - 6}"
      text-anchor="middle" font-family="IBM Plex Sans" font-size="12" fill="#1C1E1B">${r.name}</text>
    <text x="${r.x * scale + padding + (r.width * scale) / 2}" y="${r.y * scale + padding + (r.height * scale) / 2 + 10}"
      text-anchor="middle" font-family="IBM Plex Mono" font-size="10" fill="#8A8A82">${r.width.toFixed(1)}m × ${r.height.toFixed(1)}m</text>
  `).join("")

  return `
    <svg viewBox="0 0 ${svgWidth} ${svgHeight}" xmlns="http://www.w3.org/2000/svg">
      <rect x="${padding}" y="${padding}" width="${plotWidth * scale}" height="${plotLength * scale}"
        fill="none" stroke="#D9541E" stroke-width="2" stroke-dasharray="4 4" />
      ${roomRects}
    </svg>
  `
}