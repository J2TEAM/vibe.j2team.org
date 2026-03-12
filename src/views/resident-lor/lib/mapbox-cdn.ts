/**
 * Load Mapbox GL JS + CSS from CDN (no npm dependency).
 * Chỉ tải khi vào trang resident-lor.
 */

const MAPBOX_VERSION = '3.19.1'
const CDN_BASE = 'https://unpkg.com/mapbox-gl@' + MAPBOX_VERSION + '/dist'

export interface MapboxMapInstance {
  project(lnglat: [number, number]): { x: number; y: number }
  setCenter(center: [number, number], options?: { duration?: number }): MapboxMapInstance
  addLayer(layer: Record<string, unknown>, beforeId?: string): MapboxMapInstance
  getStyle(): { layers?: { id: string; type: string; layout?: Record<string, unknown> }[] }
  on(type: string, fn: () => void): MapboxMapInstance
  remove(): void
  addControl(control: unknown, position?: string): MapboxMapInstance
  unproject(point: [number, number]): { lng: number; lat: number }
  queryRenderedFeatures(
    bbox: [[number, number], [number, number]],
    options?: { layers?: string[] },
  ): unknown[]
}

export type MapboxGL = {
  accessToken: string
  Map: new (options: {
    container: HTMLElement
    style: string
    center?: [number, number]
    zoom?: number
    pitch?: number
    bearing?: number
    antialias?: boolean
    dragRotate?: boolean
    dragPan?: boolean
    /** Tắt pan bằng phím mũi tên để tránh lệch tọa độ với game */
    keyboard?: boolean
    /** Tắt zoom bằng scroll chuột */
    scrollZoom?: boolean
    /** Tắt zoom bằng double-click */
    doubleClickZoom?: boolean
  }) => MapboxMapInstance
  NavigationControl: new () => unknown
}

declare global {
  interface Window {
    mapboxgl?: MapboxGL
  }
}

let loadPromise: Promise<MapboxGL> | null = null

function loadCSS(href: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`link[href="${href}"]`)) {
      resolve()
      return
    }
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = href
    link.onload = () => resolve()
    link.onerror = () => reject(new Error(`Failed to load CSS: ${href}`))
    document.head.appendChild(link)
  })
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      if (window.mapboxgl) resolve()
      else reject(new Error('mapbox-gl script loaded but window.mapboxgl missing'))
      return
    }
    const script = document.createElement('script')
    script.src = src
    script.async = false
    script.onload = () => {
      if (window.mapboxgl) resolve()
      else reject(new Error('mapbox-gl did not attach to window.mapboxgl'))
    }
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`))
    document.head.appendChild(script)
  })
}

export function loadMapboxFromCDN(): Promise<MapboxGL> {
  if (loadPromise) return loadPromise
  loadPromise = loadCSS(`${CDN_BASE}/mapbox-gl.css`)
    .then(() => loadScript(`${CDN_BASE}/mapbox-gl.js`))
    .then(() => window.mapboxgl!)
  return loadPromise
}
