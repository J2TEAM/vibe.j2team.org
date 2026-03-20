import { type Ref, ref } from 'vue'
import { type DataFragment, DATA_CHARS, ZEN_THEMES, type ZenTheme } from '../types'

export function useDriftEngine() {
  const fragments = ref<DataFragment[]>([])
  const theme = ref(ZEN_THEMES.deep) as Ref<ZenTheme>
  const speed = ref(8)
  const driftOffset = ref({ x: 0, y: 0 }) // Controlled by mouse

  const dataPool = ref<string[]>([])
  const nextDataPool = ref<string[]>([])
  const currentSector = ref('System Kernel')
  const nextSectorName = ref('')
  const isLoadingNext = ref(false)

  const modules = import.meta.glob('/src/views/*/index.vue', {
    query: '?raw',
    import: 'default',
  }) as Record<string, () => Promise<string>>

  const availablePaths = ref<string[]>(Object.keys(modules))
  const fallbackPaths = ['/src/main.ts', '/src/App.vue', '/src/router/index.ts']

  function init(count = 400) {
    fragments.value = Array.from({ length: count }, () => createFragment(true))
    if (availablePaths.value.length === 0) {
      availablePaths.value = [...fallbackPaths]
    }
    // Initial data load
    loadData()
  }

  async function loadData(targetPool: 'current' | 'next' = 'current') {
    if (targetPool === 'next') isLoadingNext.value = true

    try {
      const isFallback = Math.random() > 0.9 && fallbackPaths.length > 0
      const nextFile = isFallback
        ? fallbackPaths[Math.floor(Math.random() * fallbackPaths.length)]!
        : availablePaths.value[Math.floor(Math.random() * availablePaths.value.length)]!

      let sectorName = ''
      if (nextFile.includes('/views/')) {
        const slug = nextFile.split('/views/')[1]?.split('/')[0] || 'Unknown'
        sectorName = slug
          .split('-')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ')
      } else {
        sectorName = nextFile
          .replace('/src/', '')
          .replace('.vue', '')
          .replace('.ts', '')
          .replace('/', ' - ')
      }

      let content = ''
      if (modules[nextFile]) {
        content = await modules[nextFile]()
      } else {
        content = await fetch(nextFile).then((r) => r.text())
      }

      // Richer Filter (Include exports, imports, more varied syntax)
      const lines = content
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 3 && l.length < 80 && !l.startsWith('//'))

      const p = lines.length > 0 ? lines : DATA_CHARS.split('')

      if (targetPool === 'current') {
        dataPool.value = p
        currentSector.value = sectorName
        // Immediately start prefetching the next one
        loadData('next')
      } else {
        nextDataPool.value = p
        nextSectorName.value = sectorName
        isLoadingNext.value = false
      }
    } catch {
      if (targetPool === 'current') {
        dataPool.value = DATA_CHARS.split('')
        currentSector.value = 'Void Cluster'
      }
      isLoadingNext.value = false
    }
  }

  function swapToNext() {
    if (nextDataPool.value.length > 0) {
      dataPool.value = [...nextDataPool.value]
      currentSector.value = nextSectorName.value
      // Prefetch the next one again
      loadData('next')
    }
  }

  function createFragment(randomZ = false): DataFragment {
    const isBinary = Math.random() > 0.8
    const text = isBinary
      ? Math.random().toString(2).slice(2, 12)
      : dataPool.value.length > 0
        ? dataPool.value[Math.floor(Math.random() * dataPool.value.length)]!
        : DATA_CHARS[Math.floor(Math.random() * DATA_CHARS.length)]!

    return {
      id: Math.random().toString(36).substring(7),
      text,
      x: (Math.random() - 0.5) * 4000,
      y: (Math.random() - 0.5) * 4000,
      z: randomZ ? Math.random() * 2000 : 2000,
      size: (isBinary ? 8 : 12) + Math.random() * 8,
      opacity: 0,
      color:
        Math.random() > 0.92
          ? theme.value.accent
          : Math.random() > 0.75
            ? theme.value.secondary
            : theme.value.primary,
    }
  }

  function update() {
    // Sector shuffle chance increase with speed
    const shuffleChance = 0.999 - (speed.value / 60) * 0.008
    if (Math.random() > shuffleChance) swapToNext()
    for (let i = 0; i < fragments.value.length; i++) {
      const f = fragments.value[i]!

      f.z -= speed.value

      // Drifting effect (perspective shift)
      f.x += driftOffset.value.x * (speed.value * 0.1)
      f.y += driftOffset.value.y * (speed.value * 0.1)

      // Reset when too close
      if (f.z <= 10) {
        Object.assign(f, createFragment())
      }

      // Re-center if drift goes too far
      if (Math.abs(f.x) > 3000) f.x *= -0.8
      if (Math.abs(f.y) > 3000) f.y *= -0.8

      // Update Opacity based on Z (fade in from distance, fade out when near)
      const distRatio = f.z / 2000
      f.opacity = Math.max(0, Math.min(1, (1 - distRatio) * (f.z > 200 ? 1 : f.z / 200)))
    }
  }

  return {
    fragments,
    theme,
    speed,
    driftOffset,
    currentSector,
    init,
    loadData,
    update,
  }
}
