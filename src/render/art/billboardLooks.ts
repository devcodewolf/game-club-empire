/**
 * Aspecto de las vallas de un campo para su dibujo: los colores del logotipo
 * de cada anunciante (negocios de los patrocinios) o null si está libre.
 */
import type { PlacedBuilding } from '@/sim/buildings/buildings'
import { businessOf } from '@/sim/club/sponsors'
import type { SimContent } from '@/sim/content'
import type { BillboardLook } from './pitchMarker'

export function billboardLooks(
  content: SimContent,
  building: PlacedBuilding,
): (BillboardLook | null)[] {
  return (building.billboards ?? []).map((board) => {
    const logo = board.advertiser ? businessOf(content, board.advertiser)?.logo : undefined
    return logo ? { color: logo.color, accent: logo.accent } : null
  })
}
