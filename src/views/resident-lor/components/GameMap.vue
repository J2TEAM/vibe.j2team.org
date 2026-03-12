<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useMap } from '../composables/useMap'
import { loadMapboxFromCDN } from '../lib/mapbox-cdn'
import type { Map as MapboxMap } from 'mapbox-gl'

const props = defineProps<{
  center: { lat: number; lng: number }
}>()

const mapRef = useMap()
const containerRef = ref<HTMLDivElement | null>(null)
let mapInstance: MapboxMap | null = null

// Mapbox public token (https://docs.mapbox.com/help/glossary/access-token/)
const MAPBOX_TOKEN =
  'pk.eyJ1IjoidHVhbnRhbXR1b25nIiwiYSI6ImNsZ3lpd3Y4ODBhMzEzbHBlejh1Zjc3eGYifQ.i6qdKYjYC6bof7_KDOfGQA'

onMounted(async () => {
  if (!containerRef.value || !MAPBOX_TOKEN) return

  const mapboxgl = await loadMapboxFromCDN()
  mapboxgl.accessToken = MAPBOX_TOKEN

  const map = new mapboxgl.Map({
    container: containerRef.value,
    style: 'mapbox://styles/mapbox/streets-v12',
    center: [props.center.lng, props.center.lat],
    zoom: 20,
    pitch: 60,
    bearing: -20,
    antialias: true,
    dragRotate: false,
    dragPan: false,
    keyboard: false,
    scrollZoom: false,
    doubleClickZoom: false,
  })

  map.addControl(new mapboxgl.NavigationControl(), 'top-right')

  map.on('style.load', () => {
    const layers = map.getStyle().layers
    const labelLayer = layers?.find(
      (l) => l.type === 'symbol' && (l.layout as Record<string, unknown>)?.['text-field'],
    )
    const beforeId = labelLayer?.id

    map.addLayer(
      {
        id: '3d-buildings',
        source: 'composite',
        'source-layer': 'building',
        filter: ['==', 'extrude', 'true'],
        type: 'fill-extrusion',
        minzoom: 15,
        paint: {
          'fill-extrusion-color': '#aaa',
          'fill-extrusion-height': [
            'interpolate',
            ['linear'],
            ['zoom'],
            15,
            0,
            15.05,
            ['get', 'height'],
          ],
          'fill-extrusion-base': [
            'interpolate',
            ['linear'],
            ['zoom'],
            15,
            0,
            15.05,
            ['get', 'min_height'],
          ],
          'fill-extrusion-opacity': 0.7,
        },
      },
      beforeId,
    )
  })

  mapInstance = map
  mapRef.value = map as unknown as MapboxMap
})

onUnmounted(() => {
  if (mapInstance) {
    mapInstance.remove()
    mapInstance = null
  }
  mapRef.value = null
})

watch(
  () => [props.center.lat, props.center.lng],
  () => {
    const map = mapRef.value
    if (map) map.setCenter([props.center.lng, props.center.lat], { duration: 0 })
  },
)
</script>

<template>
  <div ref="containerRef" class="map-container" />
</template>

<style scoped>
.map-container {
  width: 100vw;
  height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
}
</style>
