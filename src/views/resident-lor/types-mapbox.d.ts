/**
 * Minimal types for Mapbox GL when loaded via CDN (no mapbox-gl dependency).
 */
declare module 'mapbox-gl' {
  export interface LngLat {
    lng: number
    lat: number
  }

  export interface Point {
    x: number
    y: number
  }

  export interface MapOptions {
    container: HTMLElement
    style: string
    center?: [number, number]
    zoom?: number
    pitch?: number
    bearing?: number
    antialias?: boolean
    dragRotate?: boolean
    dragPan?: boolean
  }

  export interface MapStyle {
    layers?: { id: string; type: string; layout?: Record<string, unknown> }[]
  }

  export interface Map {
    project(lnglat: [number, number]): Point
    setCenter(center: [number, number], options?: { duration?: number }): this
    addLayer(layer: Record<string, unknown>, beforeId?: string): this
    getStyle(): MapStyle
    on(type: string, fn: () => void): this
    remove(): void
    addControl(control: unknown, position?: string): this
    unproject(point: [number, number]): LngLat
    queryRenderedFeatures(
      bbox: [[number, number], [number, number]],
      options?: { layers?: string[] },
    ): unknown[]
  }

  export interface MapboxGL {
    accessToken: string
    Map: new (options: MapOptions) => Map
    NavigationControl: new () => unknown
  }

  const mapboxgl: MapboxGL
  export default mapboxgl
}
