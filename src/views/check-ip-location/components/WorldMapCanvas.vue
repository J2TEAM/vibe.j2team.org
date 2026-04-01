<script setup lang="ts">
import { onUnmounted, ref, watch } from 'vue'

const props = defineProps<{
  hoveredCountryName: string
  mapDetailScope: string
  isMapReady: boolean
  mapScriptError: string
  setMapContainerRef: (element: HTMLDivElement | null) => void
}>()

const localMapContainerRef = ref<HTMLDivElement | null>(null)

watch(
  localMapContainerRef,
  (value) => {
    props.setMapContainerRef(value)
  },
  { immediate: true },
)

onUnmounted(() => {
  props.setMapContainerRef(null)
})
</script>

<template>
  <div class="world-map-stage">
    <div
      class="world-map-country-chip"
      :class="{ 'is-active': props.hoveredCountryName }"
      aria-live="polite"
    >
      {{ props.hoveredCountryName || `${props.mapDetailScope} · rê chuột lên bản đồ` }}
    </div>

    <div ref="localMapContainerRef" class="world-map-maplibre" />

    <div v-if="!props.isMapReady && !props.mapScriptError" class="world-map-overlay-note">
      Đang tải bản đồ...
    </div>

    <div v-if="props.mapScriptError" class="world-map-overlay-note is-error">
      {{ props.mapScriptError }}
    </div>
  </div>
</template>

<style scoped>
.world-map-stage {
  position: relative;
  height: 100%;
  padding: 10px;
}

.world-map-country-chip {
  position: absolute;
  z-index: 3;
  top: 14px;
  left: 14px;
  pointer-events: none;
  border: 1px solid var(--color-border-default);
  background: rgb(15 25 35 / 78%);
  color: var(--color-text-dim);
  padding: 5px 8px;
  font-size: 11px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.world-map-country-chip.is-active {
  border-color: var(--color-accent-amber);
  color: var(--color-text-primary);
  background: rgb(255 184 48 / 12%);
}

.world-map-maplibre {
  width: 100%;
  height: 100%;
  border: 1px solid var(--color-border-default);
  background: radial-gradient(circle at 50% 46%, rgb(15 25 35 / 90%), rgb(7 11 17 / 96%));
}

.world-map-overlay-note {
  position: absolute;
  inset: 10px;
  z-index: 4;
  display: grid;
  place-items: center;
  border: 1px solid var(--color-border-default);
  background: rgb(15 25 35 / 78%);
  color: var(--color-text-secondary);
  font-size: 13px;
  letter-spacing: 0.03em;
}

.world-map-overlay-note.is-error {
  color: var(--color-accent-coral);
}

.world-map-maplibre :deep(.maplibregl-map) {
  width: 100%;
  height: 100%;
}

.world-map-maplibre :deep(.maplibregl-canvas) {
  cursor: grab;
}

.world-map-maplibre :deep(.maplibregl-canvas:active) {
  cursor: grabbing;
}

.world-map-maplibre :deep(.maplibregl-ctrl-bottom-left),
.world-map-maplibre :deep(.maplibregl-ctrl-bottom-right) {
  display: none;
}

.world-map-maplibre :deep(.world-map-marker-hit) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  background: transparent;
  margin: 0;
  padding: 0;
  line-height: 0;
  cursor: pointer;
}

.world-map-maplibre :deep(.world-map-marker-hit:focus-visible) {
  outline: 1px solid var(--color-text-primary);
  outline-offset: 2px;
}

.world-map-maplibre :deep(.world-map-ip-svg) {
  width: 40px;
  height: 38px;
  overflow: visible;
}

.world-map-maplibre :deep(.world-map-ip-pulse) {
  fill: rgb(56 189 248 / 14%);
  stroke: rgb(56 189 248 / 44%);
  stroke-width: 0.7;
  transform-box: fill-box;
  transform-origin: center;
  animation: world-map-ip-pulse 2.2s ease-out infinite;
}

.world-map-maplibre :deep(.world-map-ip-ring) {
  fill: rgb(56 189 248 / 18%);
  stroke: rgb(56 189 248 / 86%);
  stroke-width: 0.7;
}

.world-map-maplibre :deep(.world-map-ip-dot) {
  fill: var(--color-accent-sky);
  stroke: var(--color-text-primary);
  stroke-width: 0.55;
}

.world-map-maplibre :deep(.world-map-ip-label) {
  font-family: var(--font-display);
  font-size: 7px;
  fill: color-mix(in srgb, var(--color-accent-sky) 86%, var(--color-text-primary) 14%);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  text-anchor: middle;
  pointer-events: none;
}

.world-map-maplibre :deep(.world-map-ip-node.is-active .world-map-ip-ring) {
  fill: rgb(56 189 248 / 28%);
  stroke: var(--color-text-primary);
}

.world-map-maplibre :deep(.world-map-ip-node.is-active .world-map-ip-dot) {
  fill: color-mix(in srgb, var(--color-accent-sky) 75%, var(--color-text-primary) 25%);
}

.world-map-maplibre :deep(.world-map-ip-node.is-self .world-map-ip-pulse) {
  fill: rgb(255 107 74 / 17%);
  stroke: rgb(255 107 74 / 56%);
}

.world-map-maplibre :deep(.world-map-ip-node.is-self .world-map-ip-ring) {
  fill: rgb(255 107 74 / 24%);
  stroke: rgb(255 107 74 / 94%);
}

.world-map-maplibre :deep(.world-map-ip-node.is-self .world-map-ip-dot) {
  fill: var(--color-accent-coral);
  stroke: var(--color-text-primary);
}

.world-map-maplibre :deep(.world-map-ip-node.is-self .world-map-ip-label) {
  fill: var(--color-accent-coral);
}

.world-map-maplibre :deep(.world-map-self-ip-marker) {
  pointer-events: none;
}

@keyframes world-map-ip-pulse {
  0% {
    transform: scale(0.45);
    opacity: 0.76;
  }

  74% {
    transform: scale(1.9);
    opacity: 0;
  }

  100% {
    transform: scale(1.9);
    opacity: 0;
  }
}

@media (max-width: 900px) {
  .world-map-stage {
    padding: 8px;
  }
}
</style>
