/** Comprobaciones de integridad del contenido (catálogos y menú de construcción). */
import { describe, expect, it } from 'vitest'
import type { BuildingDef } from '@/sim/buildings'
import type { FloorDef } from '@/sim/floors'
import type { DoorDef, WallDef } from '@/sim/structureTypes'
import { BUILDINGS } from './buildings'
import { BUILD_CATEGORIES, type MenuItem } from './buildMenu'
import { DOORS } from './doors'
import { FLOORS } from './floors'
import { ICON_NAMES } from './icons'
import { DIVISIONS } from './progression'
import { WALLS } from './walls'

const iconNames: readonly string[] = ICON_NAMES
const divisionIds: readonly string[] = DIVISIONS.map((division) => division.id)

const allItems: readonly MenuItem[] = BUILD_CATEGORIES.flatMap((category) =>
  category.tabs.flatMap((tab) => tab.items),
)
const buildings: readonly BuildingDef[] = Object.values<BuildingDef>(BUILDINGS)
const floors: readonly FloorDef[] = Object.values<FloorDef>(FLOORS)
const walls: readonly WallDef[] = Object.values<WallDef>(WALLS)
const doors: readonly DoorDef[] = Object.values<DoorDef>(DOORS)

describe('contenido', () => {
  it('cada muro, puerta y cimiento del menú existe en su catálogo', () => {
    for (const item of allItems) {
      if (item.kind === 'wall') expect(WALLS, item.id).toHaveProperty(item.id)
      if (item.kind === 'door') expect(DOORS, item.id).toHaveProperty(item.id)
      if (item.kind === 'foundation') expect(WALLS, item.wall).toHaveProperty(item.wall)
    }
  })

  it('los cimientos solo usan muros estructurales', () => {
    const foundations = allItems.flatMap((item) => (item.kind === 'foundation' ? [item] : []))
    expect(foundations.length).toBeGreaterThan(0)
    for (const { wall } of foundations) {
      expect(WALLS[wall].structural, wall).toBe(true)
    }
  })

  it('cada edificio y suelo del menú existe en su catálogo', () => {
    for (const item of allItems) {
      if (item.kind === 'building') expect(BUILDINGS, item.id).toHaveProperty(item.id)
      if (item.kind === 'floor') expect(FLOORS, item.id).toHaveProperty(item.id)
    }
  })

  it('ningún id se repite dentro del menú', () => {
    const ids = allItems.flatMap((item) =>
      item.kind === 'building' || item.kind === 'floor' ? [`${item.kind}:${item.id}`] : [],
    )
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('todos los iconos existen en ICON_NAMES', () => {
    for (const building of buildings) expect(iconNames, building.id).toContain(building.icon)
    for (const item of allItems) {
      if (item.kind === 'planned') expect(iconNames, item.label).toContain(item.icon)
    }
  })

  it('cada requires es una división válida', () => {
    for (const { id, requires } of [...buildings, ...floors, ...walls, ...doors]) {
      if (requires) expect(divisionIds, id).toContain(requires)
    }
  })

  it('cada superficie de campo existe en FLOORS', () => {
    for (const { id, pitch } of buildings) {
      if (pitch) expect(FLOORS, id).toHaveProperty(pitch.surface)
    }
  })

  it('los campos del mismo formato tienen el mismo tamaño', () => {
    const sizes = new Map<number, string>()
    for (const { pitch, size } of buildings) {
      if (!pitch) continue
      const key = `${size.width}x${size.height}`
      expect(sizes.get(pitch.format) ?? key).toBe(key)
      sizes.set(pitch.format, key)
    }
  })

  it('las gradas tienen aforo positivo y creciente en el orden del menú', () => {
    const standsCategory = BUILD_CATEGORIES.find((category) => category.id === 'stands')
    const ids = (standsCategory?.tabs ?? []).flatMap((tab) =>
      tab.items.flatMap((item) => (item.kind === 'building' ? [item.id] : [])),
    )
    expect(ids.length).toBeGreaterThan(0)
    const capacities = ids.map((id) => buildings.find((b) => b.id === id)?.capacity ?? 0)
    for (const capacity of capacities) expect(capacity).toBeGreaterThan(0)
    capacities
      .slice(1)
      .forEach((capacity, i) => expect(capacity).toBeGreaterThan(capacities[i] ?? 0))
  })
})
