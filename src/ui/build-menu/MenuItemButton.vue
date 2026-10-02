<script setup lang="ts">
/** Traduce un `MenuItem` del catálogo a un `BlueprintButton`. */
import { computed } from 'vue'
import { getBuilding } from '@/content/buildings'
import { getDoor } from '@/content/doors'
import { getFloor } from '@/content/floors'
import { getRoom } from '@/content/rooms'
import { getWall } from '@/content/walls'
import type { MenuColor, MenuItem } from '@/content/buildMenu'
import type { IconName } from '@/content/icons'
import BlueprintButton from '@/ui/components/BlueprintButton.vue'
import { buildingName } from '@/ui/composables/contentLookup'
import { useProgressionStore } from '@/ui/stores/progressionStore'
import { useToolStore } from '@/ui/stores/toolStore'

/** Datos ya resueltos para pintar el botón y su acción al pulsar. */
interface ButtonModel {
  label: string
  icon?: IconName
  color: MenuColor
  swatch?: number
  badge?: string
  title: string
  locked: boolean
  active: boolean
  select: () => void
}

const props = defineProps<{ item: MenuItem; color: MenuColor }>()

/** Importe con separador de miles y símbolo de euro. */
const formatCost = (amount: number): string => `${amount.toLocaleString('es-ES')} €`

const toolStore = useToolStore()
const progression = useProgressionStore()

const model = computed<ButtonModel>(() => {
  const item = props.item

  if (item.kind === 'building') {
    const def = getBuilding(item.id)
    const reason = progression.lockReason(def.requires)
    const where = def.stand?.corner
      ? 'cierra una esquina entre dos gradas; no pasa del nivel de la más baja'
      : def.stand
        ? 'se pega a un lado de un campo y crece al mejorarla'
        : `${def.size.width}×${def.size.height}`
    const info = `${def.name} · ${where} · ${def.cost.toLocaleString('es-ES')} €`
    return {
      label: item.label ?? def.name,
      icon: def.icon,
      color: props.color,
      badge: def.capacity?.toLocaleString('es-ES'),
      title: reason ? `${info} · ${reason}` : info,
      locked: reason !== null,
      active: toolStore.activeBuilding === item.id,
      select: () =>
        def.stand ? toolStore.selectStand(item.id) : toolStore.selectBuilding(item.id),
    }
  }

  if (item.kind === 'floor') {
    const def = getFloor(item.id)
    const reason = progression.lockReason(def.requires)
    return {
      label: def.name,
      color: props.color,
      swatch: def.color,
      title: reason ? `${def.name} · ${reason}` : def.name,
      locked: reason !== null,
      active: toolStore.activeFloor === item.id,
      select: () => toolStore.selectFloor(item.id),
    }
  }

  if (item.kind === 'foundation') {
    const def = getWall(item.wall)
    const reason = progression.lockReason(def.requires)
    const info = `Cimientos de ${def.name.toLowerCase()} · ${formatCost(def.costPerTile)}/casilla · Arrastra un rectángulo (mín. 3×3)`
    return {
      label: `Cimientos de ${def.name.toLowerCase()}`,
      icon: 'blocks',
      color: props.color,
      swatch: def.faceColor,
      title: reason ? `${info} · ${reason}` : info,
      locked: reason !== null,
      active: toolStore.activeFoundation === item.wall,
      select: () => toolStore.selectFoundation(item.wall),
    }
  }

  if (item.kind === 'wall') {
    const def = getWall(item.id)
    const reason = progression.lockReason(def.requires)
    const info = `${def.name} · ${formatCost(def.costPerTile)}/casilla · Arrastra una línea`
    return {
      label: def.name,
      color: props.color,
      swatch: def.faceColor,
      title: reason ? `${info} · ${reason}` : info,
      locked: reason !== null,
      active: toolStore.activeWall === item.id,
      select: () => toolStore.selectWall(item.id),
    }
  }

  if (item.kind === 'door') {
    const def = getDoor(item.id)
    const reason = progression.lockReason(def.requires)
    const info = `${def.name} · ${formatCost(def.cost)} · Clic sobre un muro recto`
    return {
      label: def.name,
      icon: 'door',
      color: props.color,
      swatch: def.color,
      title: reason ? `${info} · ${reason}` : info,
      locked: reason !== null,
      active: toolStore.activeDoor === item.id,
      select: () => toolStore.selectDoor(item.id),
    }
  }

  if (item.kind === 'room') {
    const def = getRoom(item.id)
    const reason = progression.lockReason(def.requires)
    const needs = def.requirements.map((req) => `${req.min} ${buildingName(req.object)}`).join(', ')
    const info = `${def.name} · mínimo ${def.minSize.width}×${def.minSize.height} · Requiere: ${needs} · Clic dentro de un edificio`
    return {
      label: def.name,
      icon: def.icon,
      color: props.color,
      swatch: def.color,
      title: reason ? `${info} · ${reason}` : info,
      locked: reason !== null,
      active: toolStore.activeRoom === item.id,
      select: () => toolStore.selectRoom(item.id),
    }
  }

  if (item.kind === 'removeRoom') {
    return {
      label: 'Quitar sala',
      icon: 'layout-grid',
      color: props.color,
      title: 'Clic sobre una sala para quitar su designación',
      locked: false,
      active: toolStore.tool.kind === 'removeRoom',
      select: () => toolStore.selectRemoveRoom(),
    }
  }

  if (item.kind === 'demolish') {
    return {
      label: 'Demoler',
      icon: 'hammer',
      color: 'red',
      title:
        'Clic: quita lo que haya encima (objeto, puerta, muro o suelo) · Arrastrar: arrasa la zona',
      locked: false,
      active: toolStore.tool.kind === 'demolish',
      select: () => toolStore.selectDemolish(),
    }
  }

  return {
    label: item.label,
    icon: item.icon,
    color: props.color,
    badge: item.arrives,
    title: `Próximamente · ${item.arrives}`,
    locked: true,
    active: false,
    select: () => undefined,
  }
})
</script>

<template>
  <BlueprintButton
    :label="model.label"
    :icon="model.swatch === undefined ? model.icon : undefined"
    :swatch-icon="model.swatch === undefined ? undefined : model.icon"
    :color="model.color"
    :swatch="model.swatch"
    :badge="model.badge"
    :title="model.title"
    :locked="model.locked"
    :active="model.active"
    @select="model.select()"
  />
</template>
