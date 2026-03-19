<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ref, onMounted, onUnmounted, watch } from 'vue'
import type { LegoBrick, LegoBrickType } from '../types'
import { BRICK_DATA } from '../types'

const props = defineProps<{
  bricks: LegoBrick[]
  activeBrickType: LegoBrickType
  activeColor: string
}>()

const emit = defineEmits<{
  'add-brick': [LegoBrick]
  'remove-brick': [string]
}>()

const containerRef = ref<HTMLDivElement | null>(null)
let THREE: any = null
let renderer: any = null
let scene: any = null
let camera: any = null
let controls: any = null
let raycaster: any = null
const mouse = { x: 0, y: 0 }
let legoLastDownTime = 0
let legoLastDownPos = { x: -1, y: -1 }
let ghostBrick: any = null
let isOrbitDragging = false
let baseplate: any = null
let threeBrickGroup: any = null
let animationFrameId: number | null = null

const GRID_SIZE = 1
const BASE_W = 20
const BASE_D = 20

// Load Three.js from CDN
async function initThree() {
  if (!(window as any).THREE) {
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js')
  }
  THREE = (window as any).THREE

  if (!THREE.OrbitControls && !(window as any).THREE.OrbitControls) {
    await loadScript(
      'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js',
    )
  }

  setupScene()
  animate()
}

function loadScript(url: string) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = url
    script.onload = resolve
    script.onerror = reject
    document.head.appendChild(script)
  })
}

function setupScene() {
  if (!containerRef.value) return

  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x0a1018)

  camera = new THREE.PerspectiveCamera(
    45,
    containerRef.value.clientWidth / containerRef.value.clientHeight,
    0.1,
    1000,
  )
  camera.position.set(15, 15, 15)
  camera.lookAt(0, 0, 0)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(containerRef.value.clientWidth, containerRef.value.clientHeight)
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.shadowMap.enabled = true
  containerRef.value.appendChild(renderer.domElement)

  // Controls
  controls = new (THREE as any).OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.05

  // Lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4)
  scene.add(ambientLight)

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
  directionalLight.position.set(10, 20, 10)
  directionalLight.castShadow = true
  directionalLight.shadow.mapSize.width = 1024
  directionalLight.shadow.mapSize.height = 1024
  scene.add(directionalLight)

  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6)
  scene.add(hemiLight)

  // Baseplate
  const baseGeo = new THREE.BoxGeometry(BASE_W, 0.4, BASE_D)
  const baseMat = new THREE.MeshStandardMaterial({ color: 0x1a2a3a })
  baseplate = new THREE.Mesh(baseGeo, baseMat)
  baseplate.position.y = -0.2
  baseplate.receiveShadow = true
  scene.add(baseplate)

  const grid = new THREE.GridHelper(BASE_W, BASE_W, 0x334455, 0x223344)
  grid.position.y = 0.01
  scene.add(grid)

  raycaster = new THREE.Raycaster()

  // Use capture to ensure we see events before OrbitControls,
  // but we will check the target to avoid click-through
  window.addEventListener('pointerdown', onPointerDown, { capture: true })
  window.addEventListener('pointerup', onPointerUp, { capture: true })
  window.addEventListener('pointermove', onMouseMove, { capture: true })

  controls.addEventListener('start', () => {
    isOrbitDragging = false
  })
  controls.addEventListener('change', () => {
    isOrbitDragging = true
  })

  renderBricks()
}

function renderBricks() {
  if (!scene || !THREE) return

  if (threeBrickGroup) scene.remove(threeBrickGroup)
  threeBrickGroup = new THREE.Group()

  props.bricks.forEach((brick) => {
    const mesh = createBrickMesh(brick)
    threeBrickGroup.add(mesh)
  })

  scene.add(threeBrickGroup)
}

function createBrickMesh(brick: LegoBrick) {
  const data = BRICK_DATA[brick.type]
  const group = new THREE.Group()

  const bodyGeo = new THREE.BoxGeometry(data.width * GRID_SIZE, data.height, data.depth * GRID_SIZE)
  const mat = new THREE.MeshStandardMaterial({ color: brick.color, roughness: 0.3, metalness: 0.2 })
  const body = new THREE.Mesh(bodyGeo, mat)
  body.castShadow = true
  body.receiveShadow = true
  group.add(body)

  const studGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 16)
  for (let x = 0; x < data.width; x++) {
    for (let z = 0; z < data.depth; z++) {
      const stud = new THREE.Mesh(studGeo, mat)
      stud.position.x = (x - (data.width - 1) / 2) * GRID_SIZE
      stud.position.y = data.height / 2 + 0.1
      stud.position.z = (z - (data.depth - 1) / 2) * GRID_SIZE
      stud.castShadow = true
      stud.receiveShadow = true
      group.add(stud)
    }
  }

  group.position.set(brick.position.x, brick.position.y, brick.position.z)
  group.userData = { id: brick.id, type: brick.type }

  if (brick.id !== 'ghost') {
    group.scale.set(0, 0, 0)
    let s = 0
    const animateScale = () => {
      s += 0.1
      if (s <= 1) {
        group.scale.set(s, s, s)
        requestAnimationFrame(animateScale)
      } else {
        group.scale.set(1, 1, 1)
      }
    }
    animateScale()
  }

  return group
}

function animate() {
  animationFrameId = requestAnimationFrame(animate)
  if (controls) controls.update()
  if (renderer && scene && camera) renderer.render(scene, camera)
}

function onWindowResize() {
  if (!containerRef.value || !camera || !renderer) return
  camera.aspect = containerRef.value.clientWidth / containerRef.value.clientHeight
  camera.updateProjectionMatrix()
  renderer.setSize(containerRef.value.clientWidth, containerRef.value.clientHeight)
}

// Helper to check if pointer is over the 3D canvas and not on UI
function isPointerOnCanvas(e: PointerEvent): boolean {
  if (!containerRef.value || !renderer) return false
  const target = e.target as HTMLElement
  // Check if target is the renderer's canvas OR if it's explicitly the container
  // This prevents clicking through buttons/toolbar
  return target === renderer.domElement || target === containerRef.value
}

function onPointerDown(e: PointerEvent) {
  if (!isPointerOnCanvas(e)) return

  legoLastDownTime = performance.now()
  legoLastDownPos = { x: e.clientX, y: e.clientY }
  isOrbitDragging = false
}

function updateGhostBrickState() {
  if (!ghostBrick || !THREE) return

  // Update color
  ghostBrick.children.forEach((child: any) => {
    if (child.material) child.material.color.set(props.activeColor)
  })

  // If type changed, it will be handled in onMouseMove next time it moves,
  // but to be instant we might need to recreate it.
  // For now, let's just mark it as needing update.
  if (ghostBrick.userData.type !== props.activeBrickType) {
    scene.remove(ghostBrick)
    ghostBrick = null
  }
}

function onMouseMove(e: PointerEvent) {
  if (!isPointerOnCanvas(e)) {
    if (ghostBrick) ghostBrick.visible = false
    return
  }

  if (!containerRef.value || !raycaster || !THREE || !camera || !baseplate || !threeBrickGroup)
    return

  const rect = containerRef.value.getBoundingClientRect()
  mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
  mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1

  raycaster.setFromCamera(mouse, camera)
  const intersects = raycaster.intersectObjects([baseplate, threeBrickGroup], true)

  if (intersects.length > 0) {
    const intersect = intersects[0]
    if (!intersect.face) return

    const pos = intersect.point.clone()
    const normal = intersect.face.normal.clone().applyQuaternion(intersect.object.quaternion)

    const data = BRICK_DATA[props.activeBrickType]

    // Corner-based snapping:
    // User clicks a cell, brick starts from that cell.
    // Center = floor(point) + size/2
    const snap = (p: number, n: number, size: number) => {
      // If we are clicking a side-face, we might want to offset,
      // but for simplicity and kids: floor and align.
      // We use a small epsilon for normals to determine which cell we are entering
      return Math.floor(p + n * 0.01) + size / 2
    }

    const newPos = {
      x: snap(pos.x, normal.x, data.width),
      y: Math.max(0.6, pos.y + normal.y * (data.height / 2)),
      z: snap(pos.z, normal.z, data.depth),
    }

    if (!ghostBrick || ghostBrick.userData.type !== props.activeBrickType) {
      if (ghostBrick) scene.remove(ghostBrick)
      ghostBrick = createBrickMesh({
        id: 'ghost',
        type: props.activeBrickType,
        color: props.activeColor,
        position: newPos,
        rotation: 0,
      })
      ghostBrick.children.forEach((child: any) => {
        if (child.material) {
          child.material.transparent = true
          child.material.opacity = 0.4
          child.material.depthWrite = false
        }
      })
      scene.add(ghostBrick)
    }

    ghostBrick.position.set(newPos.x, newPos.y, newPos.z)
    ghostBrick.visible = true
    ghostBrick.userData.type = props.activeBrickType
  } else {
    if (ghostBrick) ghostBrick.visible = false
  }
}

function onPointerUp(e: PointerEvent) {
  if (!isPointerOnCanvas(e)) return

  if (!legoLastDownPos || legoLastDownPos.x === -1) return

  const duration = performance.now() - legoLastDownTime
  const dist = Math.sqrt(
    (e.clientX - legoLastDownPos.x) ** 2 + (e.clientY - legoLastDownPos.y) ** 2,
  )

  // If user dragged too much or long press, don't place
  if (isOrbitDragging || dist > 20 || duration > 800) return

  if (!containerRef.value || !raycaster || !THREE || !camera || !baseplate || !threeBrickGroup)
    return

  const rect = containerRef.value.getBoundingClientRect()
  mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
  mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1

  raycaster.setFromCamera(mouse, camera)
  const intersects = raycaster.intersectObjects([baseplate, threeBrickGroup], true)

  if (intersects.length > 0) {
    const intersect = intersects[0]

    if (e.altKey) {
      const brickMesh = findBrickParent(intersect.object)
      if (brickMesh) {
        emit('remove-brick', brickMesh.userData.id)
      }
      return
    }

    if (!intersect.face) return
    const pos = intersect.point.clone()
    const normal = intersect.face.normal.clone().applyQuaternion(intersect.object.quaternion)

    const data = BRICK_DATA[props.activeBrickType]
    const snap = (p: number, n: number, size: number) => Math.floor(p + n * 0.01) + size / 2

    const newPos = {
      x: snap(pos.x, normal.x, data.width),
      y: Math.max(0.6, pos.y + normal.y * (data.height / 2)),
      z: snap(pos.z, normal.z, data.depth),
    }

    const newBrick: LegoBrick = {
      id: Math.random().toString(36).substring(2, 9),
      type: props.activeBrickType,
      color: props.activeColor,
      position: newPos,
      rotation: 0,
    }
    emit('add-brick', newBrick)
  }
}

function findBrickParent(obj: any): any {
  if (!obj) return null
  if (obj.userData && obj.userData.id) return obj
  return findBrickParent(obj.parent)
}

onMounted(() => {
  initThree()
  window.addEventListener('resize', onWindowResize)
})

onUnmounted(() => {
  if (animationFrameId !== null) cancelAnimationFrame(animationFrameId)
  animationFrameId = null
  window.removeEventListener('resize', onWindowResize)
  window.removeEventListener('pointerdown', onPointerDown, { capture: true } as any)
  window.removeEventListener('pointerup', onPointerUp, { capture: true } as any)
  window.removeEventListener('pointermove', onMouseMove, { capture: true } as any)
  if (renderer) renderer.dispose()
})

watch(
  () => props.bricks,
  () => {
    renderBricks()
  },
  { deep: true },
)

watch([() => props.activeBrickType, () => props.activeColor], () => {
  updateGhostBrickState()
})
</script>

<template>
  <div ref="containerRef" class="w-full h-full cursor-crosshair relative overflow-hidden" />
</template>
