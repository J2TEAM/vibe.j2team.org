import { inject, provide, type Ref } from 'vue'
import type { Map as MapboxMap } from 'mapbox-gl'

const MAP_KEY = Symbol('resident-lor-map')

export function provideMap(mapRef: Ref<MapboxMap | null>) {
  provide(MAP_KEY, mapRef)
}

export function useMap(): Ref<MapboxMap | null> {
  const map = inject<Ref<MapboxMap | null>>(MAP_KEY)
  if (!map) throw new Error('useMap must be used within a provider that calls provideMap')
  return map
}
