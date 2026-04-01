<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { useHead } from '@unhead/vue'
import { useScriptTag } from '@vueuse/core'
import WorldMapTopBar from './components/WorldMapTopBar.vue'
import WorldMapCanvas from './components/WorldMapCanvas.vue'
import WorldMapSidebar from './components/WorldMapSidebar.vue'
import type { Coordinates, TrackedIpLocation } from './types'

type MapLineFeatureCollection = {
  type: 'FeatureCollection'
  features: {
    type: 'Feature'
    properties: {
      id: string
      isActive: number
    }
    geometry: {
      type: 'LineString'
      coordinates: Coordinates[]
    }
  }[]
}

type MapMouseEvent = {
  point: {
    x: number
    y: number
  }
}

type MapFeature = {
  properties?: Record<string, string | number | null | undefined>
}

type MapFilterExpression = Array<string | number | boolean | MapFilterExpression>

type MapPaintDefinition = Record<string, string | number | number[]>

type MapLayoutDefinition = Record<string, string>

type MapLayerDefinition = {
  id: string
  type: 'fill' | 'line'
  source: string
  paint: MapPaintDefinition
  layout?: MapLayoutDefinition
  filter?: MapFilterExpression
}

type MapSourceDefinition = {
  type: 'geojson'
  data: MapLineFeatureCollection | string
}

type MapSourceInstance = {
  setData?: (data: MapLineFeatureCollection) => void
}

type MapInitOptions = {
  container: HTMLElement
  style: string
  center: Coordinates
  zoom: number
  minZoom?: number
  maxZoom?: number
  maxPitch?: number
  dragRotate?: boolean
  touchPitch?: boolean
  attributionControl?: boolean
}

type MapEaseToOptions = {
  center: Coordinates
  zoom: number
  duration: number
  essential: boolean
}

type MapInstance = {
  on: (eventType: string, listener: (event?: MapMouseEvent) => void) => MapInstance
  addSource: (sourceId: string, source: MapSourceDefinition) => void
  getSource: (sourceId: string) => MapSourceInstance | undefined
  addLayer: (layer: MapLayerDefinition) => void
  getLayer: (layerId: string) => { id: string } | undefined
  setFilter: (layerId: string, filter: MapFilterExpression) => void
  setPaintProperty: (layerId: string, property: string, value: string | number | number[]) => void
  queryRenderedFeatures: (
    point: { x: number; y: number },
    options?: { layers?: string[] },
  ) => MapFeature[]
  getZoom: () => number
  easeTo: (options: MapEaseToOptions) => void
  remove: () => void
}

type MapMarkerOptions = {
  element: HTMLElement
  anchor?: 'center' | 'top' | 'bottom' | 'left' | 'right'
}

type MapMarkerInstance = {
  setLngLat: (coordinates: Coordinates) => MapMarkerInstance
  addTo: (map: MapInstance) => MapMarkerInstance
  remove: () => void
}

type MapLibreGlobal = {
  Map: new (options: MapInitOptions) => MapInstance
  Marker: new (options: MapMarkerOptions) => MapMarkerInstance
}

type FreeIpApiLookupResponse = {
  ipAddress?: string
  cityName?: string | null
  countryName?: string | null
  latitude?: number
  longitude?: number
  asnOrganization?: string | null
}

type GeolocationDbLookupResponse = {
  IPv4?: string
  city?: string | null
  country_name?: string | null
  latitude?: number
  longitude?: number
}

type IpifyLookupResponse = {
  ip?: string
}

type DnsResolveResponse = {
  Status?: number
  Answer?: {
    type?: number
    data?: string
  }[]
}

type LookupTarget = {
  input: string
  kind: 'ip' | 'domain'
  value: string
}

const MAPLIBRE_VERSION = '4.7.1'
const MAPLIBRE_SCRIPT_URL = `https://unpkg.com/maplibre-gl@${MAPLIBRE_VERSION}/dist/maplibre-gl.js`
const MAPLIBRE_CSS_URL = `https://unpkg.com/maplibre-gl@${MAPLIBRE_VERSION}/dist/maplibre-gl.css`

const DETAILED_DARK_MAP_STYLE_URL =
  'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
const COUNTRY_BORDERS_GEOJSON_URL =
  'https://cdn.jsdelivr.net/gh/datasets/geo-countries@master/data/countries.geojson'

const COUNTRY_SOURCE_ID = 'world-map-country-borders'
const COUNTRY_HITBOX_LAYER_ID = 'world-map-country-hitbox'
const COUNTRY_HOVER_FILL_LAYER_ID = 'world-map-country-hover-fill'
const COUNTRY_HOVER_LINE_LAYER_ID = 'world-map-country-hover-line'
const SELF_CONNECTION_SOURCE_ID = 'world-map-self-connections'
const SELF_CONNECTION_LINE_LAYER_ID = 'world-map-self-connection-line'
const SELF_CONNECTION_ACTIVE_LINE_LAYER_ID = 'world-map-self-connection-line-active'

const MAP_MIN_ZOOM = 1
const MAP_MAX_ZOOM = 12
const MAX_IP_LOOKUP_BATCH = 20

const IPV4_ADDRESS_PATTERN = /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/
const IPV6_ADDRESS_PATTERN = /^[0-9a-fA-F:]+$/
const DOMAIN_LABEL_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i

const DNS_RESOLVE_ENDPOINT = 'https://dns.google/resolve'
const DOMAIN_DNS_RECORD_TYPES = [1, 28] as const

const CONNECTION_LINE_DASH_ANIMATION_SEQUENCE: number[][] = [
  [0, 4, 3],
  [0.5, 4, 2.5],
  [1, 4, 2],
  [1.5, 4, 1.5],
  [2, 4, 1],
  [2.5, 4, 0.5],
  [3, 4, 0],
  [0, 0.5, 3, 3.5],
  [0, 1, 3, 3],
  [0, 1.5, 3, 2.5],
  [0, 2, 3, 2],
  [0, 2.5, 3, 1.5],
  [0, 3, 3, 1],
  [0, 3.5, 3, 0.5],
]

const CONNECTION_LINE_DASH_FRAME_MS = 80

const COUNTRY_HITBOX_LAYER: MapLayerDefinition = {
  id: COUNTRY_HITBOX_LAYER_ID,
  source: COUNTRY_SOURCE_ID,
  type: 'fill',
  paint: {
    'fill-color': 'rgba(255, 255, 255, 0)',
    'fill-opacity': 0,
  },
}

const COUNTRY_HOVER_FILL_LAYER: MapLayerDefinition = {
  id: COUNTRY_HOVER_FILL_LAYER_ID,
  source: COUNTRY_SOURCE_ID,
  type: 'fill',
  filter: ['==', ['get', 'ISO3166-1-Alpha-3'], '__none__'],
  paint: {
    'fill-color': 'rgba(255, 184, 48, 0.08)',
    'fill-outline-color': 'rgba(255, 184, 48, 0.72)',
    'fill-opacity': 0.12,
  },
}

const COUNTRY_HOVER_LINE_LAYER: MapLayerDefinition = {
  id: COUNTRY_HOVER_LINE_LAYER_ID,
  source: COUNTRY_SOURCE_ID,
  type: 'line',
  filter: ['==', ['get', 'ISO3166-1-Alpha-3'], '__none__'],
  paint: {
    'line-color': 'rgba(255, 184, 48, 0.74)',
    'line-width': 0.75,
    'line-opacity': 1,
  },
  layout: {
    'line-cap': 'round',
    'line-join': 'round',
  },
}

const SELF_CONNECTION_LINE_LAYER: MapLayerDefinition = {
  id: SELF_CONNECTION_LINE_LAYER_ID,
  source: SELF_CONNECTION_SOURCE_ID,
  type: 'line',
  filter: ['==', 'isActive', 0],
  paint: {
    'line-color': 'rgba(56, 189, 248, 0.44)',
    'line-width': 1.2,
    'line-opacity': 0.78,
    'line-dasharray': [3, 6],
  },
  layout: {
    'line-cap': 'round',
    'line-join': 'round',
  },
}

const SELF_CONNECTION_ACTIVE_LINE_LAYER: MapLayerDefinition = {
  id: SELF_CONNECTION_ACTIVE_LINE_LAYER_ID,
  source: SELF_CONNECTION_SOURCE_ID,
  type: 'line',
  filter: ['==', 'isActive', 1],
  paint: {
    'line-color': 'rgba(56, 189, 248, 0.96)',
    'line-width': 1.5,
    'line-opacity': 0.96,
    'line-dasharray': [3, 6],
  },
  layout: {
    'line-cap': 'round',
    'line-join': 'round',
  },
}

const mapContainerRef = ref<HTMLDivElement | null>(null)
const matrixCanvasRef = ref<HTMLCanvasElement | null>(null)
const mapRef = ref<MapInstance | null>(null)
const isMapReady = ref(false)
const isMapInitializing = ref(false)
const mapScriptError = ref('')
const mapZoomLevel = ref(1.45)
const hoveredCountryName = ref('')
const hoveredCountryCode = ref<string | null>(null)

const ipInput = ref('')
const isLookupLoading = ref(false)
const lookupError = ref('')
const trackedIpLocations = ref<TrackedIpLocation[]>([])
const activeTrackedTarget = ref<string | null>(null)
const selfIpLocation = ref<TrackedIpLocation | null>(null)
const isSelfIpResolving = ref(true)

const trackedIpMarkers = ref<MapMarkerInstance[]>([])
const selfIpMarker = ref<MapMarkerInstance | null>(null)

const selfIpAbortController = ref<AbortController | null>(null)
const connectionDashAnimationFrameId = ref<number | null>(null)
const previousConnectionDashStep = ref(-1)

let matrixAnimationFrameId = 0
let cleanupMatrixResize: (() => void) | null = null

const { load: loadMaplibreScript } = useScriptTag(MAPLIBRE_SCRIPT_URL, undefined, {
  manual: true,
})

useHead({
  link: [{ rel: 'stylesheet', href: MAPLIBRE_CSS_URL }],
})

const activeTrackedIpLocation = computed(() => {
  const selectedTarget = activeTrackedTarget.value
  if (!selectedTarget) {
    return trackedIpLocations.value[0] ?? null
  }

  const matchedLocation = trackedIpLocations.value.find(
    (location) => getTrackedLocationKey(location) === selectedTarget,
  )
  return matchedLocation ?? trackedIpLocations.value[0] ?? null
})

const mapDetailScope = computed(() => getDetailScopeLabel(mapZoomLevel.value))
const connectionCount = computed(() => (selfIpLocation.value ? trackedIpLocations.value.length : 0))

function setMapContainerRef(element: HTMLDivElement | null) {
  mapContainerRef.value = element
}

watch(trackedIpLocations, (locations) => {
  if (locations.length === 0) {
    activeTrackedTarget.value = null
    return
  }

  if (
    !activeTrackedTarget.value ||
    !locations.some((location) => getTrackedLocationKey(location) === activeTrackedTarget.value)
  ) {
    activeTrackedTarget.value = locations[0] ? getTrackedLocationKey(locations[0]) : null
  }
})

watch([trackedIpLocations, activeTrackedTarget], () => {
  rebuildTrackedIpMarkers()
  updateSelfConnectionSourceData()
})

watch(selfIpLocation, () => {
  rebuildSelfIpMarker()
  updateSelfConnectionSourceData()
})

watch(hoveredCountryCode, () => {
  updateCountryHoverLayers()
})

watch(
  mapContainerRef,
  (container) => {
    if (!container) {
      return
    }

    if (mapRef.value || isMapInitializing.value) {
      return
    }

    void initializeMap()
  },
  { immediate: true },
)

onMounted(() => {
  startMatrixBackdrop()
  void resolveSelfIpLocation()
})

onUnmounted(() => {
  stopMatrixBackdrop()
  stopConnectionLineAnimation()

  selfIpAbortController.value?.abort()
  selfIpAbortController.value = null

  clearTrackedIpMarkers()
  clearSelfIpMarker()

  if (mapRef.value) {
    mapRef.value.remove()
    mapRef.value = null
  }
})

function randomInteger(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function startMatrixBackdrop() {
  if (!matrixCanvasRef.value) {
    return
  }

  const canvas = matrixCanvasRef.value
  const context = canvas.getContext('2d')

  if (!context) {
    return
  }

  let drops: number[] = []
  let columnCount = 0
  let fontSize = 16

  const matrixCharacters = 'アァカサタナハマヤャラワン0123456789ABCDEF<>/*+-=%$#@{}[];:|'

  const resize = () => {
    const width = window.innerWidth
    const height = window.innerHeight
    const devicePixelRatio = Math.max(1, window.devicePixelRatio || 1)

    canvas.width = Math.floor(width * devicePixelRatio)
    canvas.height = Math.floor(height * devicePixelRatio)
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`

    context.setTransform(1, 0, 0, 1, 0, 0)
    context.scale(devicePixelRatio, devicePixelRatio)

    fontSize = width < 760 ? 13 : 16
    columnCount = Math.floor(width / fontSize)
    drops = Array.from({ length: columnCount }, () => randomInteger(-40, 0))
  }

  const renderFrame = () => {
    const width = window.innerWidth
    const height = window.innerHeight

    context.fillStyle = 'rgba(15, 25, 35, 0.11)'
    context.fillRect(0, 0, width, height)
    context.font = `${fontSize}px Consolas, Monaco, 'Courier New', monospace`

    for (let index = 0; index < drops.length; index += 1) {
      const randomCharacterIndex = Math.floor(Math.random() * matrixCharacters.length)
      const character = matrixCharacters.charAt(randomCharacterIndex)
      const x = index * fontSize
      const currentDrop = drops[index] ?? 0
      const y = currentDrop * fontSize

      context.fillStyle = index % 7 === 0 ? 'rgba(255, 184, 48, 0.72)' : 'rgba(56, 189, 248, 0.42)'
      context.fillText(character, x, y)

      if (y > height && Math.random() > 0.975) {
        drops[index] = randomInteger(-10, 0)
      } else {
        drops[index] = currentDrop + 1
      }
    }

    matrixAnimationFrameId = window.requestAnimationFrame(renderFrame)
  }

  resize()
  renderFrame()

  window.addEventListener('resize', resize)
  cleanupMatrixResize = () => {
    window.removeEventListener('resize', resize)
  }
}

function stopMatrixBackdrop() {
  if (matrixAnimationFrameId) {
    window.cancelAnimationFrame(matrixAnimationFrameId)
    matrixAnimationFrameId = 0
  }

  if (cleanupMatrixResize) {
    cleanupMatrixResize()
    cleanupMatrixResize = null
  }
}

function getMaplibreGlobal() {
  const maplibre = (window as Window & { maplibregl?: MapLibreGlobal }).maplibregl
  return maplibre ?? null
}

function addLayerIfMissing(map: MapInstance, layer: MapLayerDefinition) {
  if (!map.getLayer(layer.id)) {
    map.addLayer(layer)
  }
}

function upsertCountryLayers(map: MapInstance) {
  if (!map.getSource(COUNTRY_SOURCE_ID)) {
    map.addSource(COUNTRY_SOURCE_ID, {
      type: 'geojson',
      data: COUNTRY_BORDERS_GEOJSON_URL,
    })
  }

  addLayerIfMissing(map, COUNTRY_HITBOX_LAYER)
  addLayerIfMissing(map, COUNTRY_HOVER_FILL_LAYER)
  addLayerIfMissing(map, COUNTRY_HOVER_LINE_LAYER)
}

function upsertSelfConnectionLayers(map: MapInstance) {
  if (!map.getSource(SELF_CONNECTION_SOURCE_ID)) {
    map.addSource(SELF_CONNECTION_SOURCE_ID, {
      type: 'geojson',
      data: buildSelfConnectionLinesData(),
    })
  }

  addLayerIfMissing(map, SELF_CONNECTION_LINE_LAYER)
  addLayerIfMissing(map, SELF_CONNECTION_ACTIVE_LINE_LAYER)
}

function animateConnectionLineDash(timestamp: number) {
  const map = mapRef.value

  if (map && isMapReady.value) {
    const step =
      Math.floor(timestamp / CONNECTION_LINE_DASH_FRAME_MS) %
      CONNECTION_LINE_DASH_ANIMATION_SEQUENCE.length

    if (step !== previousConnectionDashStep.value) {
      const dashPattern = CONNECTION_LINE_DASH_ANIMATION_SEQUENCE[step]

      if (dashPattern) {
        for (const layerId of [
          SELF_CONNECTION_LINE_LAYER_ID,
          SELF_CONNECTION_ACTIVE_LINE_LAYER_ID,
        ]) {
          if (!map.getLayer(layerId)) {
            continue
          }

          try {
            map.setPaintProperty(layerId, 'line-dasharray', dashPattern)
          } catch {
            // Ignore transient style update errors while the style is reloading.
          }
        }

        previousConnectionDashStep.value = step
      }
    }
  }

  connectionDashAnimationFrameId.value = window.requestAnimationFrame(animateConnectionLineDash)
}

function startConnectionLineAnimation() {
  if (connectionDashAnimationFrameId.value !== null) {
    return
  }

  connectionDashAnimationFrameId.value = window.requestAnimationFrame(animateConnectionLineDash)
}

function stopConnectionLineAnimation() {
  if (connectionDashAnimationFrameId.value !== null) {
    window.cancelAnimationFrame(connectionDashAnimationFrameId.value)
    connectionDashAnimationFrameId.value = null
  }

  previousConnectionDashStep.value = -1
}

function syncMapLayers() {
  const map = mapRef.value
  if (!map) {
    return
  }

  upsertCountryLayers(map)
  upsertSelfConnectionLayers(map)
  updateCountryHoverLayers()
  updateSelfConnectionSourceData()
}

async function initializeMap() {
  if (!mapContainerRef.value || mapRef.value || isMapInitializing.value) {
    return
  }

  isMapInitializing.value = true
  mapScriptError.value = ''

  try {
    await loadMaplibreScript()

    const maplibre = getMaplibreGlobal()
    if (!maplibre) {
      mapScriptError.value = 'Không thể khởi tạo MapLibre.'
      return
    }

    const map = new maplibre.Map({
      container: mapContainerRef.value,
      style: DETAILED_DARK_MAP_STYLE_URL,
      center: [8, 16],
      zoom: 1.45,
      minZoom: MAP_MIN_ZOOM,
      maxZoom: MAP_MAX_ZOOM,
      maxPitch: 0,
      dragRotate: false,
      touchPitch: false,
      attributionControl: false,
    })

    mapRef.value = map

    map.on('load', () => {
      isMapReady.value = true
      mapZoomLevel.value = map.getZoom()
      syncMapLayers()
      rebuildTrackedIpMarkers()
      rebuildSelfIpMarker()
      startConnectionLineAnimation()
    })

    map.on('styledata', () => {
      if (!isMapReady.value) {
        return
      }

      syncMapLayers()
    })

    map.on('mousemove', (event) => {
      handleMapMouseMove(event)
    })

    map.on('mouseleave', () => {
      hoveredCountryName.value = ''
      hoveredCountryCode.value = null
    })

    map.on('move', () => {
      mapZoomLevel.value = map.getZoom()
    })

    map.on('zoom', () => {
      mapZoomLevel.value = map.getZoom()
    })
  } catch {
    mapScriptError.value = 'Không thể tải thư viện map. Vui lòng kiểm tra mạng và thử lại.'
  } finally {
    isMapInitializing.value = false
  }
}

function buildSelfConnectionLinesData(): MapLineFeatureCollection {
  if (!selfIpLocation.value || trackedIpLocations.value.length === 0) {
    return {
      type: 'FeatureCollection',
      features: [],
    }
  }

  const selfCoordinates = selfIpLocation.value.coordinates

  return {
    type: 'FeatureCollection',
    features: trackedIpLocations.value.map((location, index) => ({
      type: 'Feature',
      properties: {
        id: `self-${index + 1}`,
        isActive:
          activeTrackedTarget.value && getTrackedLocationKey(location) === activeTrackedTarget.value
            ? 1
            : 0,
      },
      geometry: {
        type: 'LineString',
        coordinates: greatCircleCoordinates(selfCoordinates, location.coordinates),
      },
    })),
  }
}

function updateSelfConnectionSourceData() {
  const map = mapRef.value
  if (!map) {
    return
  }

  const source = map.getSource(SELF_CONNECTION_SOURCE_ID)
  if (!source || typeof source.setData !== 'function') {
    return
  }

  source.setData(buildSelfConnectionLinesData())
}

function updateCountryHoverLayers() {
  const map = mapRef.value
  if (!map) {
    return
  }

  const filter: MapFilterExpression = [
    '==',
    ['get', 'ISO3166-1-Alpha-3'],
    hoveredCountryCode.value ?? '__none__',
  ]

  if (map.getLayer(COUNTRY_HOVER_FILL_LAYER_ID)) {
    map.setFilter(COUNTRY_HOVER_FILL_LAYER_ID, filter)
  }

  if (map.getLayer(COUNTRY_HOVER_LINE_LAYER_ID)) {
    map.setFilter(COUNTRY_HOVER_LINE_LAYER_ID, filter)
  }
}

function handleMapMouseMove(event?: MapMouseEvent) {
  if (!event) {
    return
  }

  const map = mapRef.value
  if (!map) {
    return
  }

  const hoveredCountryFeature = map.queryRenderedFeatures(event.point, {
    layers: [COUNTRY_HITBOX_LAYER_ID],
  })[0]

  if (hoveredCountryFeature) {
    hoveredCountryName.value = getMapFeatureLabel(hoveredCountryFeature)
    hoveredCountryCode.value = getCountryFeatureCode(hoveredCountryFeature) || null
    return
  }

  hoveredCountryName.value = ''
  hoveredCountryCode.value = null
}

function focusMapOnCoordinates(coordinates: Coordinates, minimumZoom = 3.1) {
  const map = mapRef.value
  if (!map) {
    return
  }

  map.easeTo({
    center: coordinates,
    zoom: Math.max(map.getZoom(), minimumZoom),
    duration: 750,
    essential: true,
  })
}

function handleTrackedIpSelect(location: TrackedIpLocation, shouldFocus = false) {
  activeTrackedTarget.value = getTrackedLocationKey(location)

  if (shouldFocus) {
    focusMapOnCoordinates(location.coordinates, 3.4)
  }
}

function handleFocusSelfIp() {
  if (!selfIpLocation.value) {
    return
  }

  focusMapOnCoordinates(selfIpLocation.value.coordinates, 3.4)
}

function clearTrackedIpMarkers() {
  for (const marker of trackedIpMarkers.value) {
    marker.remove()
  }

  trackedIpMarkers.value = []
}

function clearSelfIpMarker() {
  if (selfIpMarker.value) {
    selfIpMarker.value.remove()
    selfIpMarker.value = null
  }
}

function createTrackedIpMarkerElement(location: TrackedIpLocation, isActive: boolean) {
  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'world-map-marker-hit'
  const lookupLabel = getTrackedLocationKey(location)
  button.ariaLabel = `${lookupLabel} - ${location.city}, ${location.country}`
  button.title = `${lookupLabel} - ${location.city}, ${location.country}`

  button.innerHTML = `
    <svg viewBox="-19 -18 38 36" class="world-map-ip-node world-map-ip-svg${isActive ? ' is-active' : ''}" aria-hidden="true">
      <circle class="world-map-ip-pulse" r="${isActive ? '9' : '7'}" />
      <circle class="world-map-ip-ring" r="${isActive ? '7' : '6'}" />
      <circle class="world-map-ip-dot" r="${isActive ? '3.6' : '3'}" />
      <text class="world-map-ip-label" y="${isActive ? '-12' : '-10'}">${formatIpLabel(lookupLabel)}</text>
    </svg>
  `

  button.addEventListener('click', () => {
    handleTrackedIpSelect(location, true)
  })

  button.addEventListener('mouseenter', () => {
    handleTrackedIpSelect(location)
  })

  button.addEventListener('focus', () => {
    handleTrackedIpSelect(location)
  })

  return button
}

function createSelfIpMarkerElement(location: TrackedIpLocation) {
  const container = document.createElement('div')
  container.className = 'world-map-self-ip-marker'
  container.ariaLabel = `IP của bạn: ${location.ip} - ${location.city}, ${location.country}`
  container.title = `IP của bạn: ${location.ip} - ${location.city}, ${location.country}`

  container.innerHTML = `
    <svg viewBox="-19 -18 38 36" class="world-map-ip-node world-map-ip-svg is-self" aria-hidden="true">
      <circle class="world-map-ip-pulse" r="9" />
      <circle class="world-map-ip-ring" r="7" />
      <circle class="world-map-ip-dot" r="3.6" />
      <text class="world-map-ip-label" y="-12">ME</text>
    </svg>
  `

  return container
}

function rebuildTrackedIpMarkers() {
  const map = mapRef.value
  const maplibre = getMaplibreGlobal()

  if (!map || !maplibre || !isMapReady.value) {
    return
  }

  clearTrackedIpMarkers()

  trackedIpMarkers.value = trackedIpLocations.value.map((location) => {
    const markerElement = createTrackedIpMarkerElement(
      location,
      getTrackedLocationKey(location) === activeTrackedTarget.value,
    )

    return new maplibre.Marker({ element: markerElement, anchor: 'center' })
      .setLngLat(location.coordinates)
      .addTo(map)
  })
}

function rebuildSelfIpMarker() {
  const map = mapRef.value
  const maplibre = getMaplibreGlobal()

  if (!map || !maplibre || !isMapReady.value) {
    return
  }

  clearSelfIpMarker()

  if (!selfIpLocation.value) {
    return
  }

  const markerElement = createSelfIpMarkerElement(selfIpLocation.value)
  selfIpMarker.value = new maplibre.Marker({ element: markerElement, anchor: 'center' })
    .setLngLat(selfIpLocation.value.coordinates)
    .addTo(map)
}

function isLikelyIpAddress(value: string) {
  return (
    IPV4_ADDRESS_PATTERN.test(value) || (value.includes(':') && IPV6_ADDRESS_PATTERN.test(value))
  )
}

function normalizeText(value: string | null | undefined, fallback: string) {
  if (!value) {
    return fallback
  }

  const normalized = value.trim()
  return normalized.length > 0 ? normalized : fallback
}

function normalizeLookupToken(token: string) {
  return token.trim().replace(/^[[("']+|[\])"']+$/g, '')
}

function normalizeDomainCandidate(value: string) {
  return value.trim().toLowerCase().replace(/\.+$/g, '')
}

function isLikelyDomain(value: string) {
  const domainCandidate = normalizeDomainCandidate(value)

  if (!domainCandidate || domainCandidate.length > 253) {
    return false
  }

  if (domainCandidate.includes('://')) {
    return false
  }

  const labels = domainCandidate.split('.')

  if (labels.length < 2) {
    return false
  }

  const topLevelDomain = labels[labels.length - 1] ?? ''
  if (topLevelDomain.length < 2 || !/^[a-z]{2,63}$/i.test(topLevelDomain)) {
    return false
  }

  return labels.every((label) => DOMAIN_LABEL_PATTERN.test(label))
}

function getTrackedLocationKey(location: TrackedIpLocation) {
  return location.query ?? location.ip
}

function extractHostnameFromUrlInput(value: string) {
  if (!value.includes('://')) {
    return null
  }

  try {
    const parsedUrl = new URL(value)
    return normalizeDomainCandidate(parsedUrl.hostname)
  } catch {
    return null
  }
}

function parseLookupInput(input: string) {
  const uniqueTargets = new Set<string>()

  input
    .split(/[\s,;]+/)
    .map((item) => normalizeLookupToken(item))
    .filter(Boolean)
    .forEach((target) => uniqueTargets.add(target))

  return [...uniqueTargets]
}

function parseLookupTarget(token: string): LookupTarget | null {
  if (isLikelyIpAddress(token)) {
    return {
      input: token,
      kind: 'ip',
      value: token,
    }
  }

  const hostnameFromUrl = extractHostnameFromUrlInput(token)
  const domainCandidate = normalizeDomainCandidate(hostnameFromUrl ?? token)

  if (!isLikelyDomain(domainCandidate)) {
    return null
  }

  return {
    input: token,
    kind: 'domain',
    value: domainCandidate,
  }
}

function dedupeLookupTargets(targets: LookupTarget[]) {
  const uniqueTargets = new Map<string, LookupTarget>()

  for (const target of targets) {
    const targetKey = `${target.kind}:${target.value}`
    if (!uniqueTargets.has(targetKey)) {
      uniqueTargets.set(targetKey, target)
    }
  }

  return [...uniqueTargets.values()]
}

function summarizeLookupList(entries: string[]) {
  if (entries.length <= 3) {
    return entries.join(', ')
  }

  return `${entries.slice(0, 3).join(', ')} +${entries.length - 3} mục khác`
}

function formatIpLabel(ip: string) {
  return ip.length > 14 ? `${ip.slice(0, 6)}...${ip.slice(-4)}` : ip
}

async function fetchLookupPayload<T>(url: string, signal: AbortSignal) {
  const response = await fetch(url, {
    method: 'GET',
    signal,
    headers: {
      Accept: 'application/json',
    },
  })

  if (response.status === 403) {
    throw new Error('lookup_blocked')
  }

  if (response.status === 429) {
    throw new Error('lookup_rate_limited')
  }

  if (!response.ok) {
    throw new Error('lookup_unavailable')
  }

  return (await response.json()) as T
}

async function lookupFromFreeIpApi(ip: string, signal: AbortSignal) {
  const payload = await fetchLookupPayload<FreeIpApiLookupResponse>(
    `https://free.freeipapi.com/api/json/${encodeURIComponent(ip)}`,
    signal,
  )

  if (typeof payload.latitude !== 'number' || !Number.isFinite(payload.latitude)) {
    return null
  }

  if (typeof payload.longitude !== 'number' || !Number.isFinite(payload.longitude)) {
    return null
  }

  return {
    ip: normalizeText(payload.ipAddress, ip),
    city: normalizeText(payload.cityName, 'Unknown city'),
    country: normalizeText(payload.countryName, 'Unknown country'),
    isp: normalizeText(payload.asnOrganization, 'Unknown network'),
    coordinates: [payload.longitude, payload.latitude] as Coordinates,
  }
}

async function lookupFromGeolocationDb(ip: string, signal: AbortSignal) {
  const payload = await fetchLookupPayload<GeolocationDbLookupResponse>(
    `https://geolocation-db.com/json/${encodeURIComponent(ip)}&position=true`,
    signal,
  )

  if (typeof payload.latitude !== 'number' || !Number.isFinite(payload.latitude)) {
    return null
  }

  if (typeof payload.longitude !== 'number' || !Number.isFinite(payload.longitude)) {
    return null
  }

  return {
    ip: normalizeText(payload.IPv4, ip),
    city: normalizeText(payload.city, 'Unknown city'),
    country: normalizeText(payload.country_name, 'Unknown country'),
    isp: 'Unknown network',
    coordinates: [payload.longitude, payload.latitude] as Coordinates,
  }
}

function extractResolvedIpsFromDnsResponse(payload: DnsResolveResponse) {
  if (payload.Status !== 0 || !Array.isArray(payload.Answer)) {
    return []
  }

  const ipv4Addresses = new Set<string>()
  const ipv6Addresses = new Set<string>()

  for (const record of payload.Answer) {
    if (typeof record?.data !== 'string' || typeof record?.type !== 'number') {
      continue
    }

    const resolvedValue = record.data.trim()

    if (!resolvedValue) {
      continue
    }

    if (record.type === 1 && IPV4_ADDRESS_PATTERN.test(resolvedValue)) {
      ipv4Addresses.add(resolvedValue)
      continue
    }

    if (record.type === 28 && IPV6_ADDRESS_PATTERN.test(resolvedValue)) {
      ipv6Addresses.add(resolvedValue)
    }
  }

  return [...ipv4Addresses, ...ipv6Addresses]
}

async function resolveDomainToIps(domain: string, signal: AbortSignal) {
  const resolvedIps = new Set<string>()

  for (const recordType of DOMAIN_DNS_RECORD_TYPES) {
    try {
      const queryUrl = `${DNS_RESOLVE_ENDPOINT}?name=${encodeURIComponent(domain)}&type=${recordType}`
      const payload = await fetchLookupPayload<DnsResolveResponse>(queryUrl, signal)

      for (const ip of extractResolvedIpsFromDnsResponse(payload)) {
        resolvedIps.add(ip)
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw error
      }
    }
  }

  return [...resolvedIps]
}

async function resolveLookupTarget(target: LookupTarget, signal: AbortSignal) {
  if (target.kind === 'ip') {
    const resolvedLocation = await lookupIpWithFallback(target.value, signal)
    if (!resolvedLocation) {
      return null
    }

    return resolvedLocation
  }

  const candidateIps = await resolveDomainToIps(target.value, signal)
  if (candidateIps.length === 0) {
    return null
  }

  for (const candidateIp of candidateIps) {
    const resolvedLocation = await lookupIpWithFallback(candidateIp, signal)

    if (resolvedLocation) {
      return {
        ...resolvedLocation,
        query: target.value,
      }
    }
  }

  return null
}

async function lookupIpWithFallback(ip: string, signal: AbortSignal) {
  const providers = [lookupFromFreeIpApi, lookupFromGeolocationDb] as const
  let blockedAttempts = 0
  let rateLimitedAttempts = 0

  for (const provider of providers) {
    try {
      const resolvedLocation = await provider(ip, signal)
      if (resolvedLocation) {
        return resolvedLocation
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw error
      }

      if (error instanceof Error && error.message === 'lookup_blocked') {
        blockedAttempts += 1
        continue
      }

      if (error instanceof Error && error.message === 'lookup_rate_limited') {
        rateLimitedAttempts += 1
        continue
      }
    }
  }

  if (rateLimitedAttempts >= providers.length) {
    throw new Error('lookup_rate_limited')
  }

  if (blockedAttempts >= providers.length) {
    throw new Error('lookup_blocked')
  }

  return null
}

async function resolveSelfIpLocation() {
  selfIpAbortController.value?.abort()

  const controller = new AbortController()
  selfIpAbortController.value = controller
  const timeoutId = window.setTimeout(() => controller.abort(), 9000)

  isSelfIpResolving.value = true

  try {
    let resolvedLocation: TrackedIpLocation | null = null

    try {
      const response = await fetch('https://api.ipify.org?format=json', {
        method: 'GET',
        signal: controller.signal,
        cache: 'no-store',
        headers: {
          Accept: 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('self_ip_unavailable')
      }

      const payload = (await response.json()) as IpifyLookupResponse
      const currentIp = typeof payload.ip === 'string' ? payload.ip.trim() : ''

      if (!currentIp || !isLikelyIpAddress(currentIp)) {
        throw new Error('self_ip_unavailable')
      }

      resolvedLocation = await lookupIpWithFallback(currentIp, controller.signal)
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw error
      }
    }

    if (!resolvedLocation) {
      const fallbackPayload = await fetchLookupPayload<GeolocationDbLookupResponse>(
        'https://geolocation-db.com/json/&position=true',
        controller.signal,
      )

      if (
        typeof fallbackPayload.latitude === 'number' &&
        typeof fallbackPayload.longitude === 'number'
      ) {
        resolvedLocation = {
          ip: normalizeText(fallbackPayload.IPv4, 'Current IP'),
          city: normalizeText(fallbackPayload.city, 'Unknown city'),
          country: normalizeText(fallbackPayload.country_name, 'Unknown country'),
          isp: 'Unknown network',
          coordinates: [fallbackPayload.longitude, fallbackPayload.latitude],
        }
      }
    }

    if (!resolvedLocation) {
      throw new Error('self_ip_unavailable')
    }

    if (!controller.signal.aborted) {
      selfIpLocation.value = resolvedLocation
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return
    }

    selfIpLocation.value = null
  } finally {
    window.clearTimeout(timeoutId)

    if (selfIpAbortController.value === controller) {
      selfIpAbortController.value = null
    }

    isSelfIpResolving.value = false
  }
}

async function handleLookupSubmit() {
  const rawInput = ipInput.value.trim()

  if (!rawInput) {
    lookupError.value = 'Vui lòng nhập ít nhất 1 địa chỉ IP hoặc domain.'
    return
  }

  const lookupEntries = parseLookupInput(rawInput)

  if (lookupEntries.length === 0) {
    lookupError.value = 'Không tìm thấy IP hoặc domain hợp lệ trong dữ liệu nhập.'
    return
  }

  const parsedTargets = lookupEntries
    .map((entry) => parseLookupTarget(entry))
    .filter((target): target is LookupTarget => target !== null)

  const invalidEntries = lookupEntries.filter((entry) => !parseLookupTarget(entry))

  if (invalidEntries.length > 0) {
    lookupError.value = `Sai định dạng IP/domain: ${summarizeLookupList(invalidEntries)}.`
    return
  }

  const lookupTargets = dedupeLookupTargets(parsedTargets)

  if (lookupTargets.length > MAX_IP_LOOKUP_BATCH) {
    lookupError.value = `Tối đa ${MAX_IP_LOOKUP_BATCH} mục (IP/domain) cho mỗi lần tra cứu.`
    return
  }

  lookupError.value = ''
  isLookupLoading.value = true

  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), 9000)
  const resolvedLocations: TrackedIpLocation[] = []
  const rateLimitedTargets: string[] = []
  const blockedTargets: string[] = []
  const unresolvedTargets: string[] = []

  const toDisplayValue = (target: LookupTarget) => target.input

  try {
    for (const target of lookupTargets) {
      try {
        const resolvedLocation = await resolveLookupTarget(target, controller.signal)

        if (resolvedLocation) {
          resolvedLocations.push(resolvedLocation)
          continue
        }

        unresolvedTargets.push(toDisplayValue(target))
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          throw error
        }

        if (error instanceof Error && error.message === 'lookup_blocked') {
          blockedTargets.push(toDisplayValue(target))
          continue
        }

        if (error instanceof Error && error.message === 'lookup_rate_limited') {
          rateLimitedTargets.push(toDisplayValue(target))
          continue
        }

        unresolvedTargets.push(toDisplayValue(target))
      }
    }

    trackedIpLocations.value = resolvedLocations
    activeTrackedTarget.value = resolvedLocations[0]
      ? getTrackedLocationKey(resolvedLocations[0])
      : null

    if (resolvedLocations.length === lookupTargets.length) {
      lookupError.value = ''
      return
    }

    if (resolvedLocations.length > 0) {
      lookupError.value = `Đã thêm ${resolvedLocations.length}/${lookupTargets.length} mục. Không tra được: ${summarizeLookupList(
        [...rateLimitedTargets, ...blockedTargets, ...unresolvedTargets],
      )}.`
      return
    }

    if (rateLimitedTargets.length > 0) {
      throw new Error('Nhà cung cấp giới hạn truy vấn. Vui lòng thử lại sau.')
    }

    if (blockedTargets.length > 0) {
      throw new Error('Nhà cung cấp đang chặn truy vấn. Vui lòng thử lại sau.')
    }

    throw new Error('Không thể tra cứu các IP/domain này ở thời điểm hiện tại.')
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      lookupError.value = 'Hết thời gian tra cứu. Vui lòng thử lại.'
    } else {
      lookupError.value = error instanceof Error ? error.message : 'Tra cứu thất bại.'
    }

    trackedIpLocations.value = []
    activeTrackedTarget.value = null
  } finally {
    window.clearTimeout(timeoutId)
    isLookupLoading.value = false
  }
}

function clearTrackedIpLocation() {
  trackedIpLocations.value = []
  activeTrackedTarget.value = null
  lookupError.value = ''
  ipInput.value = ''
}

function getMapFeatureLabel(feature: MapFeature | undefined) {
  if (!feature?.properties) {
    return ''
  }

  const nameCandidates = [
    feature.properties.name,
    feature.properties.name_en,
    feature.properties['name:en'],
    feature.properties.name_int,
    feature.properties.admin,
    feature.properties.adm0_name,
    feature.properties.NAME,
    feature.properties.NAME_EN,
    feature.properties.NAME_LONG,
  ]

  for (const candidate of nameCandidates) {
    if (typeof candidate === 'string' && candidate.trim().length > 0) {
      return candidate.trim()
    }
  }

  return ''
}

function getCountryFeatureCode(feature: MapFeature | undefined) {
  if (!feature?.properties) {
    return ''
  }

  const codeCandidates = [
    feature.properties['ISO3166-1-Alpha-3'],
    feature.properties.iso_a3,
    feature.properties.ISO_A3,
    feature.properties.adm0_a3,
  ]

  for (const candidate of codeCandidates) {
    if (typeof candidate === 'string' && candidate.trim().length > 0) {
      return candidate.trim().toUpperCase()
    }
  }

  return ''
}

function getDetailScopeLabel(zoomLevel: number) {
  if (zoomLevel >= 6) {
    return 'Chi tiết thành phố'
  }

  if (zoomLevel >= 4) {
    return 'Chi tiết khu vực'
  }

  return 'Chi tiết quốc gia'
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function toRadians(value: number) {
  return (value * Math.PI) / 180
}

function toDegrees(value: number) {
  return (value * 180) / Math.PI
}

function toUnitVector([longitude, latitude]: Coordinates) {
  const longitudeRad = toRadians(longitude)
  const latitudeRad = toRadians(latitude)
  const cosLatitude = Math.cos(latitudeRad)

  return {
    x: cosLatitude * Math.cos(longitudeRad),
    y: cosLatitude * Math.sin(longitudeRad),
    z: Math.sin(latitudeRad),
  }
}

function greatCircleCoordinates(
  from: Coordinates,
  to: Coordinates,
  segmentCount = 44,
): Coordinates[] {
  const start = toUnitVector(from)
  const end = toUnitVector(to)

  const dotProduct = clamp(start.x * end.x + start.y * end.y + start.z * end.z, -1, 1)
  const angularDistance = Math.acos(dotProduct)

  if (!Number.isFinite(angularDistance) || angularDistance < 1e-6) {
    return [from, to]
  }

  const sinAngularDistance = Math.sin(angularDistance)
  const coordinates: Coordinates[] = []
  let previousLongitude: number | null = null

  for (let step = 0; step <= segmentCount; step += 1) {
    const ratio = step / segmentCount
    const interpolationFrom = Math.sin((1 - ratio) * angularDistance) / sinAngularDistance
    const interpolationTo = Math.sin(ratio * angularDistance) / sinAngularDistance

    const x = interpolationFrom * start.x + interpolationTo * end.x
    const y = interpolationFrom * start.y + interpolationTo * end.y
    const z = interpolationFrom * start.z + interpolationTo * end.z

    const normalizedLength = Math.hypot(x, y, z) || 1
    const normalizedX = x / normalizedLength
    const normalizedY = y / normalizedLength
    const normalizedZ = z / normalizedLength

    let longitude = toDegrees(Math.atan2(normalizedY, normalizedX))
    const latitude = toDegrees(Math.atan2(normalizedZ, Math.hypot(normalizedX, normalizedY)))

    if (previousLongitude !== null) {
      while (longitude - previousLongitude > 180) {
        longitude -= 360
      }

      while (longitude - previousLongitude < -180) {
        longitude += 360
      }
    }

    coordinates.push([longitude, latitude])
    previousLongitude = longitude
  }

  return coordinates
}
</script>

<template>
  <div class="check-ip-page min-h-screen bg-bg-deep text-text-primary">
    <canvas ref="matrixCanvasRef" class="matrix-background" aria-hidden="true"></canvas>

    <div class="check-ip-content mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <header class="mb-8 flex flex-wrap items-center justify-between gap-3 animate-fade-up">
        <h1
          class="flex items-center gap-3 font-display text-3xl font-bold text-text-primary sm:text-4xl"
        >
          <span class="text-accent-coral font-display text-sm tracking-widest">//</span>
          Check IP Location
        </h1>

        <RouterLink
          to="/"
          class="inline-flex items-center gap-2 border border-border-default bg-bg-surface px-4 py-2 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
        >
          ← Về trang chủ
        </RouterLink>
      </header>

      <article class="world-map-shell animate-fade-up animate-delay-2">
        <WorldMapTopBar
          v-model:ip-input="ipInput"
          :connection-count="connectionCount"
          :tracked-ip-count="trackedIpLocations.length"
          :is-lookup-loading="isLookupLoading"
          :can-clear="trackedIpLocations.length > 0"
          @submit="handleLookupSubmit"
          @clear="clearTrackedIpLocation"
        />

        <div class="world-map-surface">
          <WorldMapCanvas
            :hovered-country-name="hoveredCountryName"
            :map-detail-scope="mapDetailScope"
            :is-map-ready="isMapReady"
            :map-script-error="mapScriptError"
            :set-map-container-ref="setMapContainerRef"
          />

          <WorldMapSidebar
            :active-tracked-ip-location="activeTrackedIpLocation"
            :tracked-ip-locations="trackedIpLocations"
            :self-ip-location="selfIpLocation"
            :is-self-ip-resolving="isSelfIpResolving"
            :lookup-error="lookupError"
            :format-ip-label="formatIpLabel"
            @select-ip="handleTrackedIpSelect"
            @focus-self-ip="handleFocusSelfIp"
          />
        </div>
      </article>
    </div>
  </div>
</template>

<style scoped>
.check-ip-page {
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(circle at top, rgb(255 107 74 / 6%), transparent 30%),
    linear-gradient(180deg, #0f1923 0%, #132130 38%, #0f1923 100%);
}

.check-ip-content {
  position: relative;
  z-index: 2;
}

.matrix-background {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
  opacity: 0.22;
}

.world-map-shell {
  position: relative;
  overflow: hidden;
  border: 1px solid var(--color-border-default);
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--color-bg-surface) 92%, black 8%),
    #101c29
  );
  box-shadow:
    inset 0 0 0 1px color-mix(in srgb, var(--color-accent-coral) 8%, transparent),
    0 16px 30px -20px rgb(0 0 0 / 60%);
}

.world-map-shell::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.34;
  background:
    repeating-linear-gradient(0deg, rgb(139 157 181 / 10%) 0 1px, transparent 1px 28px),
    repeating-linear-gradient(90deg, rgb(139 157 181 / 10%) 0 1px, transparent 1px 36px),
    radial-gradient(circle at 12% 8%, rgb(56 189 248 / 10%), transparent 44%),
    radial-gradient(circle at 88% 90%, rgb(255 107 74 / 10%), transparent 48%);
}

.world-map-surface {
  --world-map-height: clamp(456px, calc(66.5dvh + 66px), 836px);
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 268px;
  height: var(--world-map-height);
}

@media (max-width: 1100px) {
  .world-map-surface {
    grid-template-columns: 1fr;
    grid-template-rows: var(--world-map-height) auto;
    height: auto;
  }
}

@media (max-width: 900px) {
  .world-map-surface {
    --world-map-height: clamp(361px, calc(57dvh + 53px), 589px);
  }
}
</style>
