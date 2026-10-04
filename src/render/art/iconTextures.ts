/**
 * Iconos de Tabler como texturas de Pixi (para los marcadores del mapa).
 *
 * Se cargan en "modo textura": el navegador rasteriza el SVG (respeta las
 * puntas redondeadas, que el modo vectorial de Pixi no soporta) a resolución
 * alta, en BLANCO. Para otro color basta con `sprite.tint`.
 *
 * Los imports son explícitos (uno por icono) para que solo se empaqueten los
 * que usamos; `satisfies` obliga a registrar todos los de ICON_NAMES.
 */
import { Assets, type Texture } from 'pixi.js'
import type { IconName } from '@/content/icons'
import soccerFieldSvg from '@tabler/icons/outline/soccer-field.svg?raw'
import buildingStadiumSvg from '@tabler/icons/outline/building-stadium.svg?raw'
import blocksSvg from '@tabler/icons/outline/blocks.svg?raw'
import wallSvg from '@tabler/icons/outline/wall.svg?raw'
import textureSvg from '@tabler/icons/outline/texture.svg?raw'
import layoutGridSvg from '@tabler/icons/outline/layout-grid.svg?raw'
import armchairSvg from '@tabler/icons/outline/armchair.svg?raw'
import boltSvg from '@tabler/icons/outline/bolt.svg?raw'
import usersSvg from '@tabler/icons/outline/users.svg?raw'
import hammerSvg from '@tabler/icons/outline/hammer.svg?raw'
import arrowsMoveSvg from '@tabler/icons/outline/arrows-move.svg?raw'
import ballFootballSvg from '@tabler/icons/outline/ball-football.svg?raw'
import stairsSvg from '@tabler/icons/outline/stairs.svg?raw'
import playFootballSvg from '@tabler/icons/outline/play-football.svg?raw'
import flagSvg from '@tabler/icons/outline/flag.svg?raw'
import archiveSvg from '@tabler/icons/outline/archive.svg?raw'
import bathSvg from '@tabler/icons/outline/bath.svg?raw'
import toiletPaperSvg from '@tabler/icons/outline/toilet-paper.svg?raw'
import washHandSvg from '@tabler/icons/outline/wash-hand.svg?raw'
import armchair2Svg from '@tabler/icons/outline/armchair-2.svg?raw'
import deskSvg from '@tabler/icons/outline/desk.svg?raw'
import chairDirectorSvg from '@tabler/icons/outline/chair-director.svg?raw'
import folderSvg from '@tabler/icons/outline/folder.svg?raw'
import treeSvg from '@tabler/icons/outline/tree.svg?raw'
import plantSvg from '@tabler/icons/outline/plant.svg?raw'
import lampSvg from '@tabler/icons/outline/lamp.svg?raw'
import trashSvg from '@tabler/icons/outline/trash.svg?raw'
import picnicTableSvg from '@tabler/icons/outline/picnic-table.svg?raw'
import fountainSvg from '@tabler/icons/outline/fountain.svg?raw'
import seedlingSvg from '@tabler/icons/outline/seedling.svg?raw'
import massageSvg from '@tabler/icons/outline/massage.svg?raw'
import barbellSvg from '@tabler/icons/outline/barbell.svg?raw'
import stretchingSvg from '@tabler/icons/outline/stretching.svg?raw'
import coffeeSvg from '@tabler/icons/outline/coffee.svg?raw'
import cupSvg from '@tabler/icons/outline/cup.svg?raw'
import shirtSportSvg from '@tabler/icons/outline/shirt-sport.svg?raw'
import briefcaseSvg from '@tabler/icons/outline/briefcase.svg?raw'
import ticketSvg from '@tabler/icons/outline/ticket.svg?raw'
import firstAidKitSvg from '@tabler/icons/outline/first-aid-kit.svg?raw'
import packageSvg from '@tabler/icons/outline/package.svg?raw'
import cameraSvg from '@tabler/icons/outline/camera.svg?raw'
import doorSvg from '@tabler/icons/outline/door.svg?raw'
import fenceSvg from '@tabler/icons/outline/fence.svg?raw'
import dropletSvg from '@tabler/icons/outline/droplet.svg?raw'
import bulbSvg from '@tabler/icons/outline/bulb.svg?raw'
import lawnMowerSvg from '@tabler/icons/outline/lawn-mower.svg?raw'
import shieldSvg from '@tabler/icons/outline/shield.svg?raw'
import clipboardSvg from '@tabler/icons/outline/clipboard.svg?raw'
import deviceCctvSvg from '@tabler/icons/outline/device-cctv.svg?raw'
import lockSvg from '@tabler/icons/outline/lock.svg?raw'
import rotateClockwiseSvg from '@tabler/icons/outline/rotate-clockwise.svg?raw'

const SVG_SOURCES = {
  'soccer-field': soccerFieldSvg,
  'building-stadium': buildingStadiumSvg,
  blocks: blocksSvg,
  wall: wallSvg,
  texture: textureSvg,
  'layout-grid': layoutGridSvg,
  armchair: armchairSvg,
  bolt: boltSvg,
  users: usersSvg,
  hammer: hammerSvg,
  'arrows-move': arrowsMoveSvg,
  'ball-football': ballFootballSvg,
  stairs: stairsSvg,
  'play-football': playFootballSvg,
  flag: flagSvg,
  archive: archiveSvg,
  bath: bathSvg,
  'toilet-paper': toiletPaperSvg,
  'wash-hand': washHandSvg,
  'armchair-2': armchair2Svg,
  desk: deskSvg,
  'chair-director': chairDirectorSvg,
  folder: folderSvg,
  tree: treeSvg,
  plant: plantSvg,
  lamp: lampSvg,
  trash: trashSvg,
  'picnic-table': picnicTableSvg,
  fountain: fountainSvg,
  seedling: seedlingSvg,
  massage: massageSvg,
  barbell: barbellSvg,
  stretching: stretchingSvg,
  coffee: coffeeSvg,
  cup: cupSvg,
  'shirt-sport': shirtSportSvg,
  briefcase: briefcaseSvg,
  ticket: ticketSvg,
  'first-aid-kit': firstAidKitSvg,
  package: packageSvg,
  camera: cameraSvg,
  door: doorSvg,
  fence: fenceSvg,
  droplet: dropletSvg,
  bulb: bulbSvg,
  'lawn-mower': lawnMowerSvg,
  shield: shieldSvg,
  clipboard: clipboardSvg,
  'device-cctv': deviceCctvSvg,
  lock: lockSvg,
  'rotate-clockwise': rotateClockwiseSvg,
} satisfies Record<IconName, string>

/** Rasterizado a 4× (96 px para un icono de 24): nítido hasta zoom ×2. */
const RESOLUTION = 4

export interface IconTextures {
  get(name: string): Texture | undefined
}

export async function loadIconTextures(): Promise<IconTextures> {
  const entries = await Promise.all(
    (Object.entries(SVG_SOURCES) as Array<[IconName, string]>).map(async ([name, svg]) => {
      const white = svg.replaceAll('currentColor', '#ffffff')
      const src = `data:image/svg+xml;charset=utf8,${encodeURIComponent(white)}`
      const texture = await Assets.load<Texture>({
        src,
        parser: 'svg',
        data: { resolution: RESOLUTION },
      })
      return [name, texture] as const
    }),
  )
  const textures = new Map<string, Texture>(entries)

  return { get: (name) => textures.get(name) }
}
