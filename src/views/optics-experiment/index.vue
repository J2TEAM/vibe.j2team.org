<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import { useWindowSize, useEventListener } from '@vueuse/core'
import { Vector2 } from './engine/Vector2'
import { Mirror } from './engine/Mirror'
import { Prism } from './engine/Prism'
import { Lens } from './engine/Lens'
import { FreehandMirror, chaikinSmooth } from './engine/FreehandMirror'
import { Laser } from './engine/Laser'
import { Scene } from './engine/Scene'
import type { OpticalObject } from './engine/OpticalObject'

const svgRef = ref<SVGSVGElement | null>(null)
const { width: windowWidth, height: windowHeight } = useWindowSize()

// Scene and State
const scene = new Scene()
// We use a counter to force reactivity when the scene updates its internal state
const updateTick = ref(0)
const forceUpdate = () => {
  scene.update()
  updateTick.value++
}

onMounted(() => {
  // Initial Scene Setup
  const w = windowWidth.value
  const h = windowHeight.value
  const screenCenter = new Vector2(w / 2, h / 2)
  const isMobile = w < 640

  // Scale offsets for mobile so objects stay within the viewport
  const laserOffsetX = isMobile ? 100 : 300
  const mirrorOffset = isMobile ? 60 : 100

  // Create a laser pointing right
  const initialLaser = new Laser(
    new Vector2(screenCenter.x - laserOffsetX, screenCenter.y),
    new Vector2(1, 0),
  )

  // Create a mirror at a 45 degree angle starting from the center
  const initialMirror = new Mirror(
    new Vector2(screenCenter.x + mirrorOffset, screenCenter.y - mirrorOffset),
    new Vector2(screenCenter.x - mirrorOffset, screenCenter.y + mirrorOffset),
  )

  scene.addLaser(initialLaser)
  scene.addObject(initialMirror)
  forceUpdate()
})

// Tool definitions
type Tool = 'mirror' | 'laser' | 'move' | 'delete' | 'prism' | 'lens' | 'freehand'
const activeTool = ref<Tool>('mirror')
const showModal = ref(false)

// Properties Modal State
const showPropertiesModal = ref(false)
const propertiesTarget = ref<OpticalObject | null>(null)
const tempRefractiveIndex = ref(1.5)
const tempLensType = ref<'converging' | 'diverging'>('converging')
const tempFocalLength = ref(100)

const openProperties = (target: OpticalObject) => {
  if (target instanceof Prism) {
    propertiesTarget.value = target
    tempRefractiveIndex.value = target.refractiveIndex
    showPropertiesModal.value = true
  } else if (target instanceof Lens) {
    propertiesTarget.value = target
    tempFocalLength.value = Math.abs(target.focalLength)
    tempLensType.value = target.focalLength > 0 ? 'converging' : 'diverging'
    showPropertiesModal.value = true
  }
}

const applyProperties = () => {
  if (propertiesTarget.value instanceof Prism) {
    propertiesTarget.value.refractiveIndex = tempRefractiveIndex.value
  } else if (propertiesTarget.value instanceof Lens) {
    const sign = tempLensType.value === 'converging' ? 1 : -1
    propertiesTarget.value.focalLength = tempFocalLength.value * sign
  }
  showPropertiesModal.value = false
  propertiesTarget.value = null
  forceUpdate()
}

// Interaction State
type DragTarget =
  | { type: 'none' }
  | { type: 'drawing-mirror'; mirrorId: string; startPoint: Vector2 }
  | { type: 'moving-mirror'; mirror: Mirror; offset: Vector2 }
  | { type: 'moving-mirror-p1'; mirror: Mirror; offset: Vector2 }
  | { type: 'moving-mirror-p2'; mirror: Mirror; offset: Vector2 }
  | { type: 'drawing-lens'; lensId: string; startPoint: Vector2 }
  | { type: 'moving-lens'; lens: Lens; offset: Vector2 }
  | { type: 'moving-lens-p1'; lens: Lens; offset: Vector2 }
  | { type: 'moving-lens-p2'; lens: Lens; offset: Vector2 }
  | { type: 'drawing-prism'; prismId: string }
  | { type: 'drawing-freehand'; mirrorId: string }
  | { type: 'moving-freehand'; mirror: FreehandMirror; offset: Vector2 }
  | { type: 'moving-prism'; prism: Prism; offset: Vector2 }
  | { type: 'moving-prism-p1'; prism: Prism; offset: Vector2 }
  | { type: 'moving-prism-p2'; prism: Prism; offset: Vector2 }
  | { type: 'moving-prism-p3'; prism: Prism; offset: Vector2 }
  | { type: 'moving-laser'; laser: Laser; offset: Vector2 }
  | { type: 'rotating-laser'; laser: Laser }

// Compute the third vertex of an isosceles triangle given the apex and one base vertex
// apexAngle is in radians
const PRISM_APEX_ANGLE = (50 * Math.PI) / 180
const computeIsoscelesP3 = (apex: Vector2, baseVertex: Vector2): Vector2 => {
  const v = baseVertex.sub(apex)
  const cos = Math.cos(-PRISM_APEX_ANGLE)
  const sin = Math.sin(-PRISM_APEX_ANGLE)
  return apex.add(new Vector2(v.x * cos - v.y * sin, v.x * sin + v.y * cos))
}

let currentDrag: DragTarget = { type: 'none' }

// Get mouse coordinates relative to SVG
const getMousePos = (e: MouseEvent | TouchEvent) => {
  if (!svgRef.value) return new Vector2(0, 0)
  const rect = svgRef.value.getBoundingClientRect()
  let clientX, clientY
  if ('touches' in e && (e as TouchEvent).touches.length > 0) {
    clientX = (e as TouchEvent).touches[0]!.clientX
    clientY = (e as TouchEvent).touches[0]!.clientY
  } else {
    clientX = (e as MouseEvent).clientX
    clientY = (e as MouseEvent).clientY
  }
  return new Vector2(clientX - rect.left, clientY - rect.top)
}

// Mouse Handlers
const onPointerDown = (e: MouseEvent | TouchEvent, targetType: string, targetData?: unknown) => {
  if (activeTool.value === 'delete') {
    if (targetType && targetData && (targetData as OpticalObject).id) {
      scene.removeObject((targetData as OpticalObject).id)
      if (targetType === 'laser') scene.removeLaser((targetData as Laser).id)
      forceUpdate()
    }
    return
  }

  const pos = getMousePos(e)

  if (targetType === 'background') {
    if (activeTool.value === 'mirror') {
      const newMirror = new Mirror(pos.clone(), pos.clone())
      scene.addObject(newMirror)
      currentDrag = { type: 'drawing-mirror', mirrorId: newMirror.id, startPoint: pos.clone() }
      forceUpdate()
    } else if (activeTool.value === 'laser') {
      const newLaser = new Laser(pos.clone(), new Vector2(1, 0))
      scene.addLaser(newLaser)
      forceUpdate()
    } else if (activeTool.value === 'prism') {
      const newPrism = new Prism(pos.clone(), pos.clone(), pos.clone())
      scene.addObject(newPrism)
      currentDrag = { type: 'drawing-prism', prismId: newPrism.id }
      forceUpdate()
    } else if (activeTool.value === 'lens') {
      const newLens = new Lens(pos.clone(), pos.clone(), 100)
      scene.addObject(newLens)
      currentDrag = { type: 'drawing-lens', lensId: newLens.id, startPoint: pos.clone() }
      forceUpdate()
    } else if (activeTool.value === 'freehand') {
      const newFreehand = new FreehandMirror([pos.clone()])
      scene.addObject(newFreehand)
      currentDrag = { type: 'drawing-freehand', mirrorId: newFreehand.id }
      forceUpdate()
    }
  } else if (activeTool.value === 'move') {
    if (targetType === 'mirror' && targetData) {
      const mirror = targetData as Mirror
      const center = mirror.p1.add(mirror.p2).div(2)
      currentDrag = { type: 'moving-mirror', mirror, offset: pos.sub(center) }
    } else if (targetType === 'mirror-p1' && targetData) {
      currentDrag = {
        type: 'moving-mirror-p1',
        mirror: targetData as Mirror,
        offset: pos.sub((targetData as Mirror).p1),
      }
    } else if (targetType === 'mirror-p2' && targetData) {
      currentDrag = {
        type: 'moving-mirror-p2',
        mirror: targetData as Mirror,
        offset: pos.sub((targetData as Mirror).p2),
      }
    } else if (targetType === 'laser' && targetData) {
      currentDrag = {
        type: 'moving-laser',
        laser: targetData as Laser,
        offset: pos.sub((targetData as Laser).origin),
      }
    } else if (targetType === 'laser-rotator' && targetData) {
      currentDrag = { type: 'rotating-laser', laser: targetData as Laser }
    } else if (targetType === 'prism' && targetData) {
      const prism = targetData as Prism
      const center = prism.p1.add(prism.p2).add(prism.p3).div(3)
      currentDrag = { type: 'moving-prism', prism, offset: pos.sub(center) }
    } else if (targetType === 'prism-p1' && targetData) {
      currentDrag = {
        type: 'moving-prism-p1',
        prism: targetData as Prism,
        offset: pos.sub((targetData as Prism).p1),
      }
    } else if (targetType === 'prism-p2' && targetData) {
      currentDrag = {
        type: 'moving-prism-p2',
        prism: targetData as Prism,
        offset: pos.sub((targetData as Prism).p2),
      }
    } else if (targetType === 'prism-p3' && targetData) {
      currentDrag = {
        type: 'moving-prism-p3',
        prism: targetData as Prism,
        offset: pos.sub((targetData as Prism).p3),
      }
    } else if (targetType === 'lens' && targetData) {
      const lens = targetData as Lens
      const center = lens.p1.add(lens.p2).div(2)
      currentDrag = { type: 'moving-lens', lens, offset: pos.sub(center) }
    } else if (targetType === 'lens-p1' && targetData) {
      currentDrag = {
        type: 'moving-lens-p1',
        lens: targetData as Lens,
        offset: pos.sub((targetData as Lens).p1),
      }
    } else if (targetType === 'lens-p2' && targetData) {
      currentDrag = {
        type: 'moving-lens-p2',
        lens: targetData as Lens,
        offset: pos.sub((targetData as Lens).p2),
      }
    } else if (targetType === 'freehand' && targetData) {
      const fh = targetData as FreehandMirror
      let center = new Vector2(0, 0)
      for (const p of fh.points) center = center.add(p)
      center = center.div(fh.points.length)
      currentDrag = { type: 'moving-freehand', mirror: fh, offset: pos.sub(center) }
    }
  }
}

const onPointerMove = (e: MouseEvent | TouchEvent) => {
  const drag = currentDrag
  if (drag.type === 'none') return
  const pos = getMousePos(e)

  if (drag.type === 'drawing-mirror') {
    const mirror = scene.objects.find((o) => o.id === drag.mirrorId) as Mirror
    if (mirror) {
      mirror.p2 = pos.clone()
      forceUpdate()
    }
  } else if (drag.type === 'drawing-lens') {
    const lens = scene.objects.find((o) => o.id === drag.lensId) as Lens
    if (lens) {
      lens.p2 = pos.clone()
      forceUpdate()
    }
  } else if (drag.type === 'drawing-prism') {
    const prism = scene.objects.find((o) => o.id === drag.prismId) as Prism
    if (prism) {
      prism.p2 = pos.clone()
      prism.p3 = computeIsoscelesP3(prism.p1, pos)
      forceUpdate()
    }
  } else if (drag.type === 'drawing-freehand') {
    const fh = scene.objects.find((o) => o.id === drag.mirrorId) as FreehandMirror
    if (fh) {
      const lastPoint = fh.points[fh.points.length - 1]!
      if (lastPoint.sub(pos).magsq() > 25) {
        // 5px threshold
        fh.points.push(pos.clone())
        forceUpdate()
      }
    }
  } else if (drag.type === 'moving-mirror') {
    const center = pos.sub(drag.offset)
    const mir = drag.mirror
    const half = mir.p2.sub(mir.p1).div(2)
    mir.p1 = center.sub(half)
    mir.p2 = center.add(half)
    forceUpdate()
  } else if (drag.type === 'moving-mirror-p1') {
    drag.mirror.p1 = pos.sub(drag.offset)
    forceUpdate()
  } else if (drag.type === 'moving-mirror-p2') {
    drag.mirror.p2 = pos.sub(drag.offset)
    forceUpdate()
  } else if (drag.type === 'moving-lens') {
    const center = pos.sub(drag.offset)
    const lens = drag.lens
    const half = lens.p2.sub(lens.p1).div(2)
    lens.p1 = center.sub(half)
    lens.p2 = center.add(half)
    forceUpdate()
  } else if (drag.type === 'moving-lens-p1') {
    drag.lens.p1 = pos.sub(drag.offset)
    forceUpdate()
  } else if (drag.type === 'moving-lens-p2') {
    drag.lens.p2 = pos.sub(drag.offset)
    forceUpdate()
  } else if (drag.type === 'moving-prism') {
    const center = pos.sub(drag.offset)
    const prism = drag.prism
    const oldCenter = prism.p1.add(prism.p2).add(prism.p3).div(3)
    const diff = center.sub(oldCenter)
    prism.p1 = prism.p1.add(diff)
    prism.p2 = prism.p2.add(diff)
    prism.p3 = prism.p3.add(diff)
    forceUpdate()
  } else if (drag.type === 'moving-prism-p1') {
    drag.prism.p1 = pos.sub(drag.offset)
    forceUpdate()
  } else if (drag.type === 'moving-prism-p2') {
    drag.prism.p2 = pos.sub(drag.offset)
    forceUpdate()
  } else if (drag.type === 'moving-prism-p3') {
    drag.prism.p3 = pos.sub(drag.offset)
    forceUpdate()
  } else if (drag.type === 'moving-freehand') {
    const center = pos.sub(drag.offset)
    const fh = drag.mirror
    let oldCenter = new Vector2(0, 0)
    for (const p of fh.points) oldCenter = oldCenter.add(p)
    oldCenter = oldCenter.div(fh.points.length)
    const diff = center.sub(oldCenter)
    fh.points = fh.points.map((p) => p.add(diff))
    forceUpdate()
  } else if (drag.type === 'moving-laser') {
    drag.laser.origin = pos.sub(drag.offset)
    forceUpdate()
  } else if (drag.type === 'rotating-laser') {
    drag.laser.direction = pos.sub(drag.laser.origin).normalize()
    forceUpdate()
  }
}

const MIN_OBJECT_LENGTH = 20 // px — minimum length for mirrors & lenses

const onPointerUp = () => {
  const drag = currentDrag
  if (drag.type === 'drawing-mirror') {
    const mirror = scene.objects.find((o) => o.id === drag.mirrorId) as Mirror
    if (mirror && mirror.p2.sub(mirror.p1).magsq() < MIN_OBJECT_LENGTH * MIN_OBJECT_LENGTH) {
      scene.removeObject(mirror.id)
      forceUpdate()
    }
  } else if (drag.type === 'drawing-prism') {
    const prism = scene.objects.find((o) => o.id === drag.prismId) as Prism
    if (prism && prism.p2.sub(prism.p1).magsq() < MIN_OBJECT_LENGTH * MIN_OBJECT_LENGTH) {
      scene.removeObject(prism.id)
      forceUpdate()
    }
  } else if (drag.type === 'drawing-freehand') {
    const fh = scene.objects.find((o) => o.id === drag.mirrorId) as FreehandMirror
    if (fh) {
      if (fh.points.length <= 2) {
        scene.removeObject(fh.id)
        forceUpdate()
      } else {
        fh.points = chaikinSmooth(fh.points, 3)
        forceUpdate()
      }
    }
  } else if (drag.type === 'drawing-lens') {
    const lens = scene.objects.find((o) => o.id === drag.lensId) as Lens
    if (lens) {
      if (lens.p2.sub(lens.p1).magsq() < MIN_OBJECT_LENGTH * MIN_OBJECT_LENGTH) {
        scene.removeObject(lens.id)
        forceUpdate()
      } else {
        openProperties(lens)
      }
    }
  }
  currentDrag = { type: 'none' }
}

const clearAll = () => {
  scene.clear()
  forceUpdate()
}

// Global listeners for drag end (in case pointer leaves the SVG bounds)
useEventListener(window, 'mouseup', onPointerUp)
useEventListener(window, 'touchend', onPointerUp)
useEventListener(window, 'mousemove', onPointerMove)
useEventListener(window, 'touchmove', onPointerMove, { passive: false })

const renderMirrors = computed(() => {
  if (updateTick.value < 0) return []
  return scene.objects.filter((o) => o instanceof Mirror) as Mirror[]
})

const renderPrisms = computed(() => {
  if (updateTick.value < 0) return []
  return scene.objects.filter((o) => o instanceof Prism) as Prism[]
})

const renderLenses = computed(() => {
  if (updateTick.value < 0) return []
  return scene.objects.filter((o) => o instanceof Lens) as Lens[]
})

const renderFreehandMirrors = computed(() => {
  if (updateTick.value < 0) return []
  return scene.objects.filter((o) => o instanceof FreehandMirror) as FreehandMirror[]
})

const renderLasers = computed(() => {
  if (updateTick.value < 0) return []
  return scene.lasers
})

const renderRays = computed(() => {
  if (updateTick.value < 0) return []
  return scene.computedRays
})

const pointsToPolyline = (points: Vector2[]) => {
  return points.map((p) => `${p.x},${p.y}`).join(' ')
}

const renderLensArrows = (lens: Lens) => {
  // Guard against degenerate (zero-length) lens
  if (lens.isDegenerate()) return []

  const dir = lens.p2.sub(lens.p1).normalize()
  const p1 = lens.p1
  const p2 = lens.p2

  const n = new Vector2(-dir.y, dir.x)
  const size = 15
  const isConverging = lens.focalLength > 0
  const dirSign = isConverging ? 1 : -1

  const arr1p1 = p1.add(dir.mul(size * dirSign)).add(n.mul(size * 0.3))
  const arr1p2 = p1.add(dir.mul(size * dirSign)).add(n.mul(-size * 0.3))

  const arr2p1 = p2.add(dir.mul(-size * dirSign)).add(n.mul(size * 0.3))
  const arr2p2 = p2.add(dir.mul(-size * dirSign)).add(n.mul(-size * 0.3))

  return [
    { x1: arr1p1.x, y1: arr1p1.y, x2: p1.x, y2: p1.y },
    { x1: arr1p2.x, y1: arr1p2.y, x2: p1.x, y2: p1.y },
    { x1: arr2p1.x, y1: arr2p1.y, x2: p2.x, y2: p2.y },
    { x1: arr2p2.x, y1: arr2p2.y, x2: p2.x, y2: p2.y },
  ]
}
</script>

<template>
  <div
    class="h-screen w-full bg-bg-deep overflow-hidden relative select-none touch-none pt-[env(safe-area-inset-top)]"
  >
    <!-- Top-left Info Block -->
    <div
      class="absolute top-20 left-2 sm:top-6 sm:left-6 z-20 flex items-center gap-2 sm:gap-5 pointer-events-auto"
    >
      <!-- Main Info Text -->
      <div class="flex flex-col drop-shadow-md">
        <h1
          class="text-base sm:text-3xl font-display font-extrabold text-text-primary tracking-tight uppercase"
        >
          Thí nghiệm quang học
        </h1>
        <p class="text-[10px] sm:text-sm font-medium text-text-secondary mt-0.5 sm:mt-1">
          Tác giả: <span class="text-accent-coral font-bold">iTCuong</span>
          <span class="hidden sm:inline"
            ><span class="mx-1">&middot;</span> dragonsvip090@gmail.com</span
          >
        </p>
      </div>

      <!-- Help Button -->
      <button
        @click="showModal = true"
        class="w-7 h-7 sm:w-10 sm:h-10 flex shrink-0 items-center justify-center rounded-full bg-bg-surface/70 backdrop-blur-md border border-border-default text-text-secondary hover:text-accent-sky hover:bg-bg-elevated hover:border-accent-sky/30 hover:scale-105 active:scale-95 transition-all outline-none focus:ring-2 focus:ring-accent-sky/50 shadow-xl group"
        title="Hướng dẫn"
      >
        <span
          class="font-display font-bold text-sm sm:text-lg group-hover:drop-shadow-[0_0_5px_rgba(14,165,233,0.6)]"
          >?</span
        >
      </button>
    </div>

    <!-- Top-right Home Button -->
    <div
      class="absolute top-20 right-2 sm:top-5 sm:right-6 z-20 flex flex-col items-center gap-1 sm:gap-1.5 pointer-events-auto"
    >
      <RouterLink
        to="/"
        class="flex items-center gap-1.5 sm:gap-2 bg-bg-surface/90 backdrop-blur border border-border-default rounded-none px-2.5 py-1.5 sm:px-4 sm:py-2.5 shadow-lg text-xs sm:text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors"
      >
        <Icon icon="lucide:home" class="w-3.5 h-3.5 sm:w-[18px] sm:h-[18px]" />
        <span class="hidden sm:inline">Trang chủ</span>
      </RouterLink>
      <span
        class="text-[8px] sm:text-[10px] font-display font-bold text-accent-coral tracking-wider"
        >vibe.j2team.org</span
      >
    </div>

    <!-- Modal Hướng Dẫn -->
    <div
      v-if="showModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity pointer-events-auto select-auto"
      @mousedown.self="showModal = false"
      @touchstart.self="showModal = false"
    >
      <div
        class="bg-bg-surface border border-border-default rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col sm:mb-20"
      >
        <!-- Header -->
        <div
          class="px-5 py-4 border-b border-border-default flex items-center justify-between bg-bg-elevated/50"
        >
          <h2 class="text-lg font-display font-bold text-text-primary flex items-center gap-2">
            <span class="text-accent-coral">//</span> Hướng dẫn nhanh
          </h2>
          <button
            @click="showModal = false"
            class="text-text-muted hover:text-text-primary transition-colors"
          >
            <Icon icon="lucide:x" width="24" />
          </button>
        </div>
        <!-- Content -->
        <div
          class="p-6 text-sm text-text-secondary leading-relaxed space-y-4 max-h-[60vh] overflow-y-auto optics-scrollbar"
        >
          <p>
            Ứng dụng mô phỏng đường đi của ánh sáng qua các đối tượng quang học: gương, lăng kính,
            thấu kính.
          </p>
          <ul class="space-y-3 text-text-primary/90">
            <li class="flex gap-2.5 items-start">
              <Icon icon="lucide:slash" class="w-5 h-5 shrink-0 text-accent-sky mt-0.5" />
              <div>
                <strong>Gương phẳng:</strong> Nhấn giữ và kéo để vạch ra một đoạn thẳng làm bề mặt
                phản xạ ánh sáng.
              </div>
            </li>
            <li class="flex gap-2.5 items-start">
              <Icon icon="lucide:triangle" class="w-5 h-5 shrink-0 text-accent-sky mt-0.5" />
              <div>
                <strong>Lăng kính:</strong> Nhấn giữ và kéo để tạo một lăng kính tam giác cân (góc
                đỉnh 50°). Đỉnh cố định là nơi bạn click, kéo tới đâu sẽ đặt đỉnh đáy.
                <em>Click đúp</em> vào lăng kính (ở chế độ Di chuyển) để thay đổi chiết suất.
              </div>
            </li>
            <li class="flex gap-2.5 items-start">
              <Icon icon="lucide:eye" class="w-5 h-5 shrink-0 text-accent-sky mt-0.5" />
              <div>
                <strong>Thấu kính:</strong> Nhấn giữ và kéo để đặt thấu kính. Sau khi thả chuột, một
                hộp thoại sẽ hiện ra để bạn chọn loại (hội tụ/phân kì) và tiêu cự.
                <em>Click đúp</em> để chỉnh lại thuộc tính.
              </div>
            </li>
            <li class="flex gap-2.5 items-start">
              <Icon icon="lucide:pen-tool" class="w-5 h-5 shrink-0 text-accent-sky mt-0.5" />
              <div>
                <strong>Gương tự do:</strong> Vẽ tự do bằng cách nhấn giữ và kéo. Khi thả chuột, nét
                vẽ sẽ được tự động làm trơn và hoạt động như một bề mặt phản xạ.
              </div>
            </li>
            <li class="flex gap-2.5 items-start">
              <Icon icon="lucide:zap" class="w-5 h-5 shrink-0 text-accent-coral mt-0.5" />
              <div>
                <strong>Nguồn Laser:</strong> Click vào màn hình để đặt nguồn phát tia laser. Tia
                sáng sẽ tương tác với các đối tượng quang học theo đúng định luật vật lý.
              </div>
            </li>
            <li class="flex gap-2.5 items-start">
              <Icon icon="lucide:move" class="w-5 h-5 shrink-0 text-accent-amber mt-0.5" />
              <div>
                <strong>Di chuyển:</strong> Kéo thân đối tượng để dời vị trí, kéo các điểm neo ở đầu
                mút để thay đổi hình dạng. Với laser, kéo vòng tròn ngoài để xoay hướng chiếu.
              </div>
            </li>
            <li class="flex gap-2.5 items-start">
              <Icon icon="lucide:eraser" class="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
              <div>
                <strong>Xóa:</strong> Click vào bất kỳ đối tượng nào để xóa nó khỏi sandbox.
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Modal Properties -->
    <div
      v-if="showPropertiesModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity pointer-events-auto select-auto"
      @mousedown.self="showPropertiesModal = false"
      @touchstart.self="showPropertiesModal = false"
    >
      <div
        class="bg-bg-surface border border-border-default rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col"
      >
        <div
          class="px-5 py-4 border-b border-border-default flex items-center justify-between bg-bg-elevated/50"
        >
          <h2 class="text-lg font-display font-bold text-text-primary flex items-center gap-2">
            <span class="text-accent-coral">//</span> Thuộc tính quang học
          </h2>
          <button
            @click="showPropertiesModal = false"
            class="text-text-muted hover:text-text-primary transition-colors"
          >
            <Icon icon="lucide:x" width="24" />
          </button>
        </div>
        <div class="p-6 text-sm text-text-secondary space-y-5">
          <template v-if="propertiesTarget instanceof Prism">
            <div class="space-y-2">
              <label class="block font-medium text-text-primary"
                >Chiết suất (Refractive Index)</label
              >
              <div class="flex items-center gap-4">
                <input
                  type="range"
                  v-model.number="tempRefractiveIndex"
                  min="0.5"
                  max="3"
                  step="0.01"
                  class="flex-1 accent-accent-sky"
                />
                <input
                  type="number"
                  v-model.number="tempRefractiveIndex"
                  step="0.01"
                  class="w-20 bg-bg-deep border border-border-default rounded-lg px-2 py-1 text-center text-text-primary outline-none focus:border-accent-sky transition-colors"
                />
              </div>
            </div>
          </template>
          <template v-else-if="propertiesTarget instanceof Lens">
            <div class="space-y-2">
              <label class="block font-medium text-text-primary">Loại thấu kính</label>
              <div class="flex gap-2">
                <button
                  @click="tempLensType = 'converging'"
                  class="flex-1 py-1.5 rounded-lg border transition-all text-center"
                  :class="
                    tempLensType === 'converging'
                      ? 'bg-accent-sky/20 border-accent-sky text-accent-sky'
                      : 'border-border-default hover:bg-bg-elevated text-text-secondary'
                  "
                >
                  Hội tụ (&gt;0)
                </button>
                <button
                  @click="tempLensType = 'diverging'"
                  class="flex-1 py-1.5 rounded-lg border transition-all text-center"
                  :class="
                    tempLensType === 'diverging'
                      ? 'bg-accent-sky/20 border-accent-sky text-accent-sky'
                      : 'border-border-default hover:bg-bg-elevated text-text-secondary'
                  "
                >
                  Phân kì (&lt;0)
                </button>
              </div>
            </div>
            <div class="space-y-2">
              <label class="block font-medium text-text-primary">Tiêu cự (Focal Length)</label>
              <div class="flex items-center gap-4">
                <input
                  type="range"
                  v-model.number="tempFocalLength"
                  min="10"
                  max="1000"
                  step="10"
                  class="flex-1 accent-accent-sky"
                />
                <input
                  type="number"
                  v-model.number="tempFocalLength"
                  class="w-20 bg-bg-deep border border-border-default rounded-lg px-2 py-1 text-center text-text-primary outline-none focus:border-accent-sky transition-colors"
                />
              </div>
            </div>
          </template>
          <button
            @click="applyProperties"
            class="w-full mt-2 py-2.5 rounded-xl bg-accent-sky text-bg-deep font-bold font-display hover:bg-accent-sky/90 active:scale-[0.98] transition-all"
          >
            Lưu thay đổi
          </button>
        </div>
      </div>
    </div>

    <svg
      ref="svgRef"
      class="w-full h-full absolute inset-0 block optics-svg"
      @mousedown.prevent="onPointerDown($event, 'background')"
      @touchstart.prevent="onPointerDown($event, 'background')"
    >
      <!-- Glow Filters -->
      <defs>
        <filter
          id="glow-laser"
          x="-5000"
          y="-5000"
          width="10000"
          height="10000"
          filterUnits="userSpaceOnUse"
        >
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter
          id="glow-mirror"
          x="-5000"
          y="-5000"
          width="10000"
          height="10000"
          filterUnits="userSpaceOnUse"
        >
          <feGaussianBlur stdDeviation="1" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <!-- Mirrors -->
      <g v-for="mirror in renderMirrors" :key="mirror.id">
        <!-- Interaction area (wider invisible stroke for easier clicking) -->
        <line
          :x1="mirror.p1.x"
          :y1="mirror.p1.y"
          :x2="mirror.p2.x"
          :y2="mirror.p2.y"
          stroke="transparent"
          stroke-width="20"
          :cursor="activeTool === 'move' ? 'move' : activeTool === 'delete' ? 'pointer' : 'default'"
          @mousedown.stop="onPointerDown($event, 'mirror', mirror)"
          @touchstart.stop="onPointerDown($event, 'mirror', mirror)"
        />
        <!-- Visual Mirror -->
        <line
          :x1="mirror.p1.x"
          :y1="mirror.p1.y"
          :x2="mirror.p2.x"
          :y2="mirror.p2.y"
          stroke="#0ea5e9"
          stroke-width="4"
          stroke-linecap="round"
          filter="url(#glow-mirror)"
          class="pointer-events-none"
        />

        <!-- Move endpoints (only show when move tool is active or hover) -->
        <g v-if="activeTool === 'move'">
          <circle
            :cx="mirror.p1.x"
            :cy="mirror.p1.y"
            r="8"
            fill="#38bdf8"
            cursor="pointer"
            @mousedown.stop="onPointerDown($event, 'mirror-p1', mirror)"
            @touchstart.stop="onPointerDown($event, 'mirror-p1', mirror)"
          />
          <circle
            :cx="mirror.p2.x"
            :cy="mirror.p2.y"
            r="8"
            fill="#38bdf8"
            cursor="pointer"
            @mousedown.stop="onPointerDown($event, 'mirror-p2', mirror)"
            @touchstart.stop="onPointerDown($event, 'mirror-p2', mirror)"
          />
        </g>
      </g>

      <!-- Prisms -->
      <g
        v-for="prism in renderPrisms"
        :key="prism.id"
        @dblclick="openProperties(prism)"
        class="cursor-pointer"
      >
        <polygon
          :points="`${prism.p1.x},${prism.p1.y} ${prism.p2.x},${prism.p2.y} ${prism.p3.x},${prism.p3.y}`"
          fill="rgba(14, 165, 233, 0.1)"
          stroke="transparent"
          stroke-width="20"
          :cursor="activeTool === 'move' ? 'move' : activeTool === 'delete' ? 'pointer' : 'default'"
          @mousedown.stop="onPointerDown($event, 'prism', prism)"
          @touchstart.stop="onPointerDown($event, 'prism', prism)"
        />
        <polygon
          :points="`${prism.p1.x},${prism.p1.y} ${prism.p2.x},${prism.p2.y} ${prism.p3.x},${prism.p3.y}`"
          fill="rgba(14, 165, 233, 0.2)"
          stroke="#0ea5e9"
          stroke-width="2"
          stroke-linejoin="round"
          class="pointer-events-none"
        />
        <g v-if="activeTool === 'move'">
          <circle
            :cx="prism.p1.x"
            :cy="prism.p1.y"
            r="8"
            fill="#38bdf8"
            cursor="pointer"
            @mousedown.stop="onPointerDown($event, 'prism-p1', prism)"
            @touchstart.stop="onPointerDown($event, 'prism-p1', prism)"
          />
          <circle
            :cx="prism.p2.x"
            :cy="prism.p2.y"
            r="8"
            fill="#38bdf8"
            cursor="pointer"
            @mousedown.stop="onPointerDown($event, 'prism-p2', prism)"
            @touchstart.stop="onPointerDown($event, 'prism-p2', prism)"
          />
          <circle
            :cx="prism.p3.x"
            :cy="prism.p3.y"
            r="8"
            fill="#38bdf8"
            cursor="pointer"
            @mousedown.stop="onPointerDown($event, 'prism-p3', prism)"
            @touchstart.stop="onPointerDown($event, 'prism-p3', prism)"
          />
        </g>
      </g>

      <!-- Lenses -->
      <g
        v-for="lens in renderLenses"
        :key="lens.id"
        @dblclick="openProperties(lens)"
        class="cursor-pointer"
      >
        <line
          :x1="lens.p1.x"
          :y1="lens.p1.y"
          :x2="lens.p2.x"
          :y2="lens.p2.y"
          stroke="transparent"
          stroke-width="20"
          :cursor="activeTool === 'move' ? 'move' : activeTool === 'delete' ? 'pointer' : 'default'"
          @mousedown.stop="onPointerDown($event, 'lens', lens)"
          @touchstart.stop="onPointerDown($event, 'lens', lens)"
        />
        <line
          :x1="lens.p1.x"
          :y1="lens.p1.y"
          :x2="lens.p2.x"
          :y2="lens.p2.y"
          stroke="#0ea5e9"
          stroke-width="4"
          stroke-linecap="round"
          class="pointer-events-none"
          stroke-dasharray="8 4"
        />
        <!-- Arrows -->
        <g class="pointer-events-none">
          <line
            v-for="(arr, idx) in renderLensArrows(lens)"
            :key="'lensline-' + idx"
            :x1="arr.x1"
            :y1="arr.y1"
            :x2="arr.x2"
            :y2="arr.y2"
            stroke="#0ea5e9"
            stroke-width="3"
            stroke-linecap="round"
          />
        </g>
        <g v-if="activeTool === 'move'">
          <circle
            :cx="lens.p1.x"
            :cy="lens.p1.y"
            r="8"
            fill="#38bdf8"
            cursor="pointer"
            @mousedown.stop="onPointerDown($event, 'lens-p1', lens)"
            @touchstart.stop="onPointerDown($event, 'lens-p1', lens)"
          />
          <circle
            :cx="lens.p2.x"
            :cy="lens.p2.y"
            r="8"
            fill="#38bdf8"
            cursor="pointer"
            @mousedown.stop="onPointerDown($event, 'lens-p2', lens)"
            @touchstart.stop="onPointerDown($event, 'lens-p2', lens)"
          />
        </g>
      </g>

      <!-- Freehand Mirrors -->
      <g v-for="fh in renderFreehandMirrors" :key="fh.id">
        <polyline
          :points="pointsToPolyline(fh.points)"
          stroke="transparent"
          stroke-width="20"
          fill="none"
          :cursor="activeTool === 'move' ? 'move' : activeTool === 'delete' ? 'pointer' : 'default'"
          @mousedown.stop="onPointerDown($event, 'freehand', fh)"
          @touchstart.stop="onPointerDown($event, 'freehand', fh)"
        />
        <polyline
          :points="pointsToPolyline(fh.points)"
          stroke="#0ea5e9"
          stroke-width="4"
          stroke-linecap="round"
          stroke-linejoin="round"
          fill="none"
          filter="url(#glow-mirror)"
          class="pointer-events-none"
        />
      </g>

      <!-- Draw all rays here so they are above mirrors -->
      <g>
        <line
          v-for="(ray, i) in renderRays"
          :key="'ray-' + i"
          :x1="ray.start.x"
          :y1="ray.start.y"
          :x2="ray.end.x"
          :y2="ray.end.y"
          stroke="#f43f5e"
          stroke-width="2"
          filter="url(#glow-laser)"
          opacity="0.9"
        />
      </g>

      <!-- Lasers -->
      <g v-for="laser in renderLasers" :key="laser.id">
        <!-- Base Laser Origin -->
        <circle
          :cx="laser.origin.x"
          :cy="laser.origin.y"
          r="12"
          fill="#1e293b"
          stroke="#f43f5e"
          stroke-width="3"
          :cursor="activeTool === 'move' ? 'move' : activeTool === 'delete' ? 'pointer' : 'default'"
          @mousedown.stop="onPointerDown($event, 'laser', laser)"
          @touchstart.stop="onPointerDown($event, 'laser', laser)"
        />

        <!-- Permanent Barrel / Nòng súng -->
        <line
          :x1="laser.origin.x"
          :y1="laser.origin.y"
          :x2="laser.origin.x + laser.direction.x * 20"
          :y2="laser.origin.y + laser.direction.y * 20"
          stroke="#f43f5e"
          stroke-width="6"
          stroke-linecap="round"
          class="pointer-events-none"
        />

        <!-- Rotate Handle -->
        <g v-if="activeTool === 'move'">
          <line
            :x1="laser.origin.x"
            :y1="laser.origin.y"
            :x2="laser.origin.x + laser.direction.x * 40"
            :y2="laser.origin.y + laser.direction.y * 40"
            stroke="#f43f5e"
            stroke-width="2"
            stroke-dasharray="4"
            class="pointer-events-none"
          />
          <circle
            :cx="laser.origin.x + laser.direction.x * 40"
            :cy="laser.origin.y + laser.direction.y * 40"
            r="8"
            fill="#f43f5e"
            cursor="crosshair"
            @mousedown.stop="onPointerDown($event, 'laser-rotator', laser)"
            @touchstart.stop="onPointerDown($event, 'laser-rotator', laser)"
          />
        </g>
      </g>
    </svg>

    <!-- UI Toolbar -->
    <div
      class="fixed bottom-3 sm:bottom-6 left-1/2 -translate-x-1/2 bg-bg-surface/90 backdrop-blur border border-border-default rounded-xl sm:rounded-2xl shadow-xl shadow-black/50 p-1 sm:p-2 flex items-center gap-0.5 sm:gap-2 z-10 transition-transform max-w-[calc(100vw-1rem)] pb-[max(0.25rem,env(safe-area-inset-bottom))]"
    >
      <button
        @click="activeTool = 'mirror'"
        class="flex flex-col items-center justify-center py-1 sm:py-2 px-0.5 sm:px-2 rounded-lg sm:rounded-xl border border-transparent transition-all min-w-[2.25rem] sm:min-w-[4rem] h-11 sm:h-16 gap-0.5 sm:gap-1"
        :class="
          activeTool === 'mirror'
            ? 'bg-bg-elevated text-accent-sky border-accent-sky/30 shadow-inner'
            : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary'
        "
        title="Vẽ Gương (Kéo thả)"
      >
        <Icon
          icon="lucide:slash"
          class="w-4 h-4 sm:w-6 sm:h-6"
          :class="activeTool === 'mirror' ? 'text-accent-sky' : ''"
        />
        <span class="text-[7px] sm:text-[10px] font-medium pointer-events-none whitespace-nowrap"
          >Gương</span
        >
      </button>

      <button
        @click="activeTool = 'prism'"
        class="flex flex-col items-center justify-center py-1 sm:py-2 px-0.5 sm:px-2 rounded-lg sm:rounded-xl border border-transparent transition-all min-w-[2.25rem] sm:min-w-[4rem] h-11 sm:h-16 gap-0.5 sm:gap-1"
        :class="
          activeTool === 'prism'
            ? 'bg-bg-elevated text-accent-sky border-accent-sky/30 shadow-inner'
            : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary'
        "
        title="Lăng Kính (Click)"
      >
        <Icon
          icon="lucide:triangle"
          class="w-4 h-4 sm:w-6 sm:h-6"
          :class="activeTool === 'prism' ? 'text-accent-sky' : ''"
        />
        <span class="text-[7px] sm:text-[10px] font-medium pointer-events-none whitespace-nowrap"
          >Lăng kính</span
        >
      </button>

      <button
        @click="activeTool = 'lens'"
        class="flex flex-col items-center justify-center py-1 sm:py-2 px-0.5 sm:px-2 rounded-lg sm:rounded-xl border border-transparent transition-all min-w-[2.25rem] sm:min-w-[4rem] h-11 sm:h-16 gap-0.5 sm:gap-1"
        :class="
          activeTool === 'lens'
            ? 'bg-bg-elevated text-accent-sky border-accent-sky/30 shadow-inner'
            : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary'
        "
        title="Thấu kính (Kéo thả)"
      >
        <Icon
          icon="lucide:eye"
          class="w-4 h-4 sm:w-6 sm:h-6"
          :class="activeTool === 'lens' ? 'text-accent-sky' : ''"
        />
        <span class="text-[7px] sm:text-[10px] font-medium pointer-events-none whitespace-nowrap"
          >Thấu kính</span
        >
      </button>

      <button
        @click="activeTool = 'freehand'"
        class="flex flex-col items-center justify-center py-1 sm:py-2 px-0.5 sm:px-2 rounded-lg sm:rounded-xl border border-transparent transition-all min-w-[2.25rem] sm:min-w-[4rem] h-11 sm:h-16 gap-0.5 sm:gap-1"
        :class="
          activeTool === 'freehand'
            ? 'bg-bg-elevated text-accent-sky border-accent-sky/30 shadow-inner'
            : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary'
        "
        title="Gương Tự Do (Kéo thả)"
      >
        <Icon
          icon="lucide:pen-tool"
          class="w-4 h-4 sm:w-6 sm:h-6"
          :class="activeTool === 'freehand' ? 'text-accent-sky' : ''"
        />
        <span class="text-[7px] sm:text-[10px] font-medium pointer-events-none whitespace-nowrap"
          >Tự do</span
        >
      </button>

      <button
        @click="activeTool = 'laser'"
        class="flex flex-col items-center justify-center py-1 sm:py-2 px-0.5 sm:px-2 rounded-lg sm:rounded-xl border border-transparent transition-all min-w-[2.25rem] sm:min-w-[4rem] h-11 sm:h-16 gap-0.5 sm:gap-1"
        :class="
          activeTool === 'laser'
            ? 'bg-bg-elevated text-accent-coral border-accent-coral/30 shadow-inner'
            : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary'
        "
        title="Đặt Laser (Click)"
      >
        <Icon
          icon="lucide:zap"
          class="w-4 h-4 sm:w-6 sm:h-6"
          :class="activeTool === 'laser' ? 'text-accent-coral' : ''"
        />
        <span class="text-[7px] sm:text-[10px] font-medium pointer-events-none whitespace-nowrap"
          >Laser</span
        >
      </button>

      <div class="w-px h-8 sm:h-10 bg-border-default mx-0.5 sm:mx-1"></div>

      <button
        @click="activeTool = 'move'"
        class="flex flex-col items-center justify-center py-1 sm:py-2 px-0.5 sm:px-2 rounded-lg sm:rounded-xl border border-transparent transition-all min-w-[2.25rem] sm:min-w-[4rem] h-11 sm:h-16 gap-0.5 sm:gap-1"
        :class="
          activeTool === 'move'
            ? 'bg-bg-elevated text-accent-amber border-accent-amber/30 shadow-inner'
            : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary'
        "
        title="Di chuyển / Xoay"
      >
        <Icon
          icon="lucide:move"
          class="w-4 h-4 sm:w-6 sm:h-6"
          :class="activeTool === 'move' ? 'text-accent-amber' : ''"
        />
        <span class="text-[7px] sm:text-[10px] font-medium pointer-events-none whitespace-nowrap"
          >Dịch/Xoay</span
        >
      </button>

      <button
        @click="activeTool = 'delete'"
        class="flex flex-col items-center justify-center py-1 sm:py-2 px-0.5 sm:px-2 rounded-lg sm:rounded-xl border border-transparent transition-all min-w-[2.25rem] sm:min-w-[4rem] h-11 sm:h-16 gap-0.5 sm:gap-1"
        :class="
          activeTool === 'delete'
            ? 'bg-bg-elevated text-red-500 border-red-500/30 shadow-inner'
            : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary'
        "
        title="Xóa từng cái"
      >
        <Icon
          icon="lucide:eraser"
          class="w-4 h-4 sm:w-6 sm:h-6"
          :class="activeTool === 'delete' ? 'text-red-500' : ''"
        />
        <span class="text-[7px] sm:text-[10px] font-medium pointer-events-none whitespace-nowrap"
          >Xóa</span
        >
      </button>

      <div class="w-px h-8 sm:h-10 bg-border-default mx-0.5 sm:mx-1"></div>

      <button
        @click="clearAll"
        class="flex flex-col items-center justify-center py-1 sm:py-2 px-0.5 sm:px-2 rounded-lg sm:rounded-xl border border-transparent transition-all min-w-[2.25rem] sm:min-w-[4rem] h-11 sm:h-16 gap-0.5 sm:gap-1 text-text-secondary hover:bg-bg-elevated hover:text-text-primary"
        title="Xóa toàn bộ"
      >
        <Icon icon="lucide:trash-2" class="w-4 h-4 sm:w-6 sm:h-6" />
        <span class="text-[7px] sm:text-[10px] font-medium pointer-events-none whitespace-nowrap"
          >Xóa hết</span
        >
      </button>
    </div>
  </div>
</template>

<style scoped>
.optics-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: rgba(255 255 255 / 0.15) transparent;
}
.optics-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.optics-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.optics-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255 255 255 / 0.15);
  border-radius: 3px;
}
.optics-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(255 255 255 / 0.3);
}

/* Disable SVG blur filters on small screens to prevent blurry rendering */
@media (max-width: 639px) {
  .optics-svg :deep([filter]) {
    filter: none !important;
  }
}
</style>
