/**
 * Todo el contenido que la simulación necesita consultar, agrupado.
 *
 * Se inyecta (en vez de importar `src/content/`) para que los tests usen
 * catálogos de prueba. Añadir un catálogo nuevo (salas, objetos…) = añadir
 * un campo aquí.
 */
import type { BuildingCatalog } from './buildings'
import type { FloorCatalog } from './floors'
import type { RoomCatalog } from './roomTypes'
import type { DoorCatalog, WallCatalog } from './structureTypes'

export interface SimContent {
  readonly buildings: BuildingCatalog
  readonly floors: FloorCatalog
  readonly walls: WallCatalog
  readonly doors: DoorCatalog
  readonly rooms: RoomCatalog
}
