import type { FlightState, BoundingBox } from '../types'
import { getFlightMarkerColor } from '../utils/flight-format-helpers'

// Leaflet types for window.L (no @types/leaflet installed)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LeafletLib = any

declare global {
  interface Window {
    L: LeafletLib
  }
}

const LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
const LEAFLET_JS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
const DARK_TILES = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
const TILE_ATTRIBUTION = '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'

/** Create SVG plane icon markup with rotation and color */
function createPlaneIconSvg(heading: number, color: string): string {
  return `<div style="transform: rotate(${heading}deg); color: ${color}; display: flex; align-items: center; justify-content: center;">
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
      <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
    </svg>
  </div>`
}

/**
 * Load Leaflet CSS and JS from CDN.
 * Returns a promise that resolves when window.L is available.
 */
function loadLeaflet(): Promise<void> {
  if (window.L) return Promise.resolve()

  return new Promise((resolve, reject) => {
    // Load CSS
    if (!document.querySelector(`link[href="${LEAFLET_CSS}"]`)) {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = LEAFLET_CSS
      document.head.appendChild(link)
    }

    // Load JS
    if (document.querySelector(`script[src="${LEAFLET_JS}"]`)) {
      // Script tag exists, wait for load
      const check = setInterval(() => {
        if (window.L) { clearInterval(check); resolve() }
      }, 50)
      setTimeout(() => { clearInterval(check); reject(new Error('Leaflet load timeout')) }, 10000)
      return
    }

    const script = document.createElement('script')
    script.src = LEAFLET_JS
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Leaflet'))
    document.head.appendChild(script)
  })
}

/**
 * Composable for Leaflet map management.
 * Handles: CDN loading, map init, marker updates, flight selection.
 */
export function useFlightMap() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let map: any = null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let markerLayer: any = null
  let leafletReady = false

  /** Initialize Leaflet and create map in container */
  async function initMap(container: HTMLElement, bbox: BoundingBox): Promise<void> {
    await loadLeaflet()
    leafletReady = true
    const L = window.L

    // Center of bounding box
    const centerLat = (bbox.lamin + bbox.lamax) / 2
    const centerLon = (bbox.lomin + bbox.lomax) / 2

    map = L.map(container, {
      center: [centerLat, centerLon],
      zoom: 6,
      zoomControl: false,
    })

    // Dark tile layer matching design system bg-bg-deep
    L.tileLayer(DARK_TILES, {
      attribution: TILE_ATTRIBUTION,
      maxZoom: 18,
    }).addTo(map)

    // Zoom control top-right
    L.control.zoom({ position: 'bottomright' }).addTo(map)

    // Layer group for aircraft markers
    markerLayer = L.layerGroup().addTo(map)
  }

  /** Update aircraft markers on the map */
  function updateMarkers(
    flights: FlightState[],
    onSelect: (flight: FlightState) => void,
    selectedIcao?: string | null,
  ): void {
    if (!leafletReady || !map || !markerLayer) return
    const L = window.L

    markerLayer.clearLayers()

    for (const flight of flights) {
      if (flight.latitude === null || flight.longitude === null) continue

      const color = getFlightMarkerColor(flight.verticalRate, flight.onGround)
      const heading = flight.trueTrack ?? 0
      const isSelected = flight.icao24 === selectedIcao

      const icon = L.divIcon({
        html: createPlaneIconSvg(heading, isSelected ? '#FF6B4A' : color),
        className: 'flight-marker',
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      })

      const marker = L.marker([flight.latitude, flight.longitude], { icon })
      marker.on('click', () => onSelect(flight))

      // Tooltip with callsign
      if (flight.callsign) {
        marker.bindTooltip(flight.callsign, {
          permanent: false,
          direction: 'top',
          offset: [0, -10],
          className: 'flight-tooltip',
        })
      }

      marker.addTo(markerLayer)
    }
  }

  /** Pan and zoom to a specific flight */
  function focusFlight(flight: FlightState): void {
    if (!map || flight.latitude === null || flight.longitude === null) return
    map.setView([flight.latitude, flight.longitude], 10, { animate: true })
  }

  /** Fit map view to bounding box */
  function fitBounds(bbox: BoundingBox): void {
    if (!map) return
    map.fitBounds([
      [bbox.lamin, bbox.lomin],
      [bbox.lamax, bbox.lomax],
    ])
  }

  /** Invalidate map size (call after container resize) */
  function invalidateSize(): void {
    map?.invalidateSize()
  }

  /** Destroy map instance */
  function cleanup(): void {
    if (map) {
      map.remove()
      map = null
      markerLayer = null
    }
  }

  return {
    initMap,
    updateMarkers,
    focusFlight,
    fitBounds,
    invalidateSize,
    cleanup,
  }
}
