<script setup lang="ts">
/** Traduce un `MenuItem` del catálogo a un `BlueprintButton`. */
import { computed } from 'vue'
import { getBuilding } from '@/content/buildings'
import { getFloor } from '@/content/floors'
import type { MenuColor, MenuItem } from '@/content/buildMenu'
import type { IconName } from '@/content/icons'
import BlueprintButton from '@/ui/components/BlueprintButton.vue'
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

const toolStore = useToolStore()
const progression = useProgressionStore()

const model = computed<ButtonModel>(() => {
  const item = props.item

  if (item.kind === 'building') {
    const def = getBuilding(item.id)
    const reason = progression.lockReason(def.requires)
    const info = `${def.name} · ${def.size.width}×${def.size.height} · ${def.cost.toLocaleString('es-ES')} €`
    return {
      label: item.label ?? def.name,
      icon: def.icon,
      color: props.color,
      badge: def.capacity?.toLocaleString('es-ES'),
      title: reason ? `${info} · ${reason}` : info,
      locked: reason !== null,
      active: toolStore.activeBuilding === item.id,
      select: () => toolStore.selectBuilding(item.id),
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

  if (item.kind === 'demolish') {
    return {
      label: 'Demoler',
      icon: 'hammer',
      color: 'red',
      title: 'Demoler edificio',
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
    :icon="model.icon"
    :color="model.color"
    :swatch="model.swatch"
    :badge="model.badge"
    :title="model.title"
    :locked="model.locked"
    :active="model.active"
    @select="model.select()"
  />
</template>
