<script setup lang="ts">
import Matter from 'matter-js'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useImage } from 'vue-konva'
import { useGameStore } from '../stores/game'

import dinhDocLapUrl from '../assets/dinh-doc-lap.webp'
import frameUrl from '../assets/fence.webp'
import gateLeftUrl from '../assets/gate-left.webp'
import gateRightUrl from '../assets/gate-right.webp'
import tankUrl from '../assets/tank-wout-outline.webp'

const [dinhDocLapImg] = useImage(dinhDocLapUrl)
const [frameImg] = useImage(frameUrl)
const [gateLeftImg] = useImage(gateLeftUrl)
const [gateRightImg] = useImage(gateRightUrl)
const [tankImg] = useImage(tankUrl)

const DEFAULT_SCALES = {
  tank: 0.4,
  buildingGroup: 1.0,
  frame: 0.7,
}

const DEFAULT_PHYSICS = {
  tank: { width: 274, height: 105 },
  gateLeft: { width: 95, height: 195 },
  gateRight: { width: 95, height: 195 },
}

const REFERENCE_WIDTH = 1920
const MOBILE_BREAKPOINT = 768

const GROUP_LAYOUT = {
  dinhDocLap: { x: -740, y: -200 },
  frame: { x: -740, y: -80 },
  gateLeft: { x: -85, y: 40 },
  gateRight: { x: 30, y: 40 },
}

// ============ Helpers ============
const getResponsiveScale = (baseScale: number) => {
  const currentWidth = document.body.clientWidth
  const isMobile = currentWidth <= MOBILE_BREAKPOINT
  const mobileScaleFactor = isMobile ? 0.7 : 1.0
  const scaleFactor = Math.min(Math.max(currentWidth / REFERENCE_WIDTH, 0.5), 1.5)
  return baseScale * scaleFactor * mobileScaleFactor
}

const getPhysicsBodyDimensions = (defaultDimensions: { width: number; height: number }) => {
  const currentWidth = document.body.clientWidth
  const isMobile = currentWidth <= MOBILE_BREAKPOINT
  const mobileScaleFactor = isMobile ? 0.7 : 1.0
  const scaleFactor = Math.min(Math.max(currentWidth / REFERENCE_WIDTH, 0.5), 1.5)
  return {
    width: defaultDimensions.width * scaleFactor * mobileScaleFactor,
    height: defaultDimensions.height * scaleFactor * mobileScaleFactor,
  }
}

// ============ Setup ============
const gameStore = useGameStore()
const containerRef = ref<HTMLDivElement | null>(null)
const stageRef = ref<{ getNode: () => { container: () => HTMLElement } } | null>(null)
const buildingGroupRef = ref<{
  getNode: () => {
    getAbsoluteTransform: () => {
      copy: () => {
        invert: () => void
        point: (p: { x: number; y: number }) => { x: number; y: number }
      }
    }
  }
} | null>(null)

const stageSize = ref({ width: 800, height: 600 })

const buildingGroupPos = ref({ x: 0, y: 0 })
const groupScale = ref(1)
const tankPosition = ref({ x: 0, y: 0 })
const tankRotation = ref(0)
const gateLeftPosition = ref({ x: GROUP_LAYOUT.gateLeft.x, y: GROUP_LAYOUT.gateLeft.y })
const gateRightPosition = ref({ x: GROUP_LAYOUT.gateRight.x, y: GROUP_LAYOUT.gateRight.y })
const gateLeftRotation = ref(0)
const gateRightRotation = ref(0)

const tankVelocity = ref({ x: 0, y: 0 })
const isDragging = ref(false)
const prevMousePosition = ref({ x: 0, y: 0 })
const gateLeftInitialPos = ref({ x: 0, y: 0 })
const gateRightInitialPos = ref({ x: 0, y: 0 })

let engine: Matter.Engine
let tankRigidbody: Matter.Body
let gateLeftRigidbody: Matter.Body
let gateRightRigidbody: Matter.Body
let tankPhysicsDimensions = { width: 100, height: 50 }
let gateLeftPhysicsDimensions = { width: 95, height: 195 }
let gateRightPhysicsDimensions = { width: 95, height: 195 }
let animationId: number

const getGateWorldPosition = (localX: number) => ({
  x: buildingGroupPos.value.x + localX * groupScale.value,
  y: buildingGroupPos.value.y + GROUP_LAYOUT.gateLeft.y * groupScale.value,
})

const recreatePhysicsBodies = () => {
  if (!engine?.world) return

  Matter.Composite.remove(engine.world, tankRigidbody)
  Matter.Composite.remove(engine.world, gateLeftRigidbody)
  Matter.Composite.remove(engine.world, gateRightRigidbody)

  const tankPos = tankRigidbody?.position ?? {
    x: stageSize.value.width * 0.8,
    y: stageSize.value.height / 2,
  }
  const gateLeftWorld = getGateWorldPosition(GROUP_LAYOUT.gateLeft.x)
  const gateRightWorld = getGateWorldPosition(GROUP_LAYOUT.gateRight.x)
  const gateLeftPos = gateLeftRigidbody?.position ?? gateLeftWorld
  const gateRightPos = gateRightRigidbody?.position ?? gateRightWorld

  tankRigidbody = Matter.Bodies.rectangle(
    tankPos.x,
    tankPos.y,
    tankPhysicsDimensions.width,
    tankPhysicsDimensions.height,
    { label: 'Tank', mass: 10 },
  )
  gateLeftRigidbody = Matter.Bodies.rectangle(
    gateLeftPos.x,
    gateLeftPos.y,
    gateLeftPhysicsDimensions.width,
    gateLeftPhysicsDimensions.height,
    {
      label: 'Gate Left',
      mass: 1,
      friction: 0.3,
      restitution: 0.2,
      inertia: Infinity,
      angularVelocity: 0,
      torque: 0,
    },
  )
  gateRightRigidbody = Matter.Bodies.rectangle(
    gateRightPos.x,
    gateRightPos.y,
    gateRightPhysicsDimensions.width,
    gateRightPhysicsDimensions.height,
    {
      label: 'Gate Right',
      mass: 1,
      friction: 0.3,
      restitution: 0.2,
      inertia: Infinity,
      angularVelocity: 0,
      torque: 0,
    },
  )

  Matter.Composite.add(engine.world, [tankRigidbody, gateLeftRigidbody, gateRightRigidbody])
}

const updateResponsiveElements = () => {
  groupScale.value = getResponsiveScale(DEFAULT_SCALES.buildingGroup)
  tankPhysicsDimensions = getPhysicsBodyDimensions(DEFAULT_PHYSICS.tank)
  gateLeftPhysicsDimensions = getPhysicsBodyDimensions(DEFAULT_PHYSICS.gateLeft)
  gateRightPhysicsDimensions = getPhysicsBodyDimensions(DEFAULT_PHYSICS.gateRight)
  recreatePhysicsBodies()
}

const resetPositions = () => {
  if (!engine?.world) return

  Matter.Body.setVelocity(tankRigidbody, { x: 0, y: 0 })
  Matter.Body.setAngularVelocity(tankRigidbody, 0)
  Matter.Body.setAngle(tankRigidbody, 0)
  Matter.Body.setVelocity(gateLeftRigidbody, { x: 0, y: 0 })
  Matter.Body.setAngularVelocity(gateLeftRigidbody, 0)
  Matter.Body.setAngle(gateLeftRigidbody, 0)
  Matter.Body.setVelocity(gateRightRigidbody, { x: 0, y: 0 })
  Matter.Body.setAngularVelocity(gateRightRigidbody, 0)
  Matter.Body.setAngle(gateRightRigidbody, 0)

  const tankPos = { x: stageSize.value.width * 0.8, y: stageSize.value.height / 2 }
  buildingGroupPos.value = { x: stageSize.value.width * 0.4, y: stageSize.value.height / 2 - 70 }
  groupScale.value = getResponsiveScale(DEFAULT_SCALES.buildingGroup)

  const gateLeftWorld = getGateWorldPosition(GROUP_LAYOUT.gateLeft.x)
  const gateRightWorld = getGateWorldPosition(GROUP_LAYOUT.gateRight.x)

  Matter.Body.setPosition(tankRigidbody, tankPos)
  Matter.Body.setPosition(gateLeftRigidbody, gateLeftWorld)
  Matter.Body.setPosition(gateRightRigidbody, gateRightWorld)

  tankPosition.value = { ...tankPos }
  gateLeftPosition.value = { x: GROUP_LAYOUT.gateLeft.x, y: GROUP_LAYOUT.gateLeft.y }
  gateRightPosition.value = { x: GROUP_LAYOUT.gateRight.x, y: GROUP_LAYOUT.gateRight.y }
  gateLeftRotation.value = 0
  gateRightRotation.value = 0
  tankRotation.value = 0

  gateLeftInitialPos.value = { ...gateLeftWorld }
  gateRightInitialPos.value = { ...gateRightWorld }

  gameStore.setGateLeftDistance(0)
  gameStore.setGateRightDistance(0)
  gameStore.setTankSpeed(0)
  isDragging.value = false
  tankVelocity.value = { x: 0, y: 0 }

  updateResponsiveElements()
}

const clientToStage = (clientX: number, clientY: number) => {
  const stage = stageRef.value?.getNode()
  if (!stage) return { x: clientX, y: clientY }
  const rect = stage.container().getBoundingClientRect()
  return { x: clientX - rect.left, y: clientY - rect.top }
}

const handleDragRelease = () => {
  if (isDragging.value) {
    isDragging.value = false
    Matter.Body.setStatic(tankRigidbody, false)
    Matter.Body.setVelocity(tankRigidbody, {
      x: tankVelocity.value.x * 0.5,
      y: tankVelocity.value.y * 0.5,
    })
  }
}

const handleGlobalMouseMove = (e: MouseEvent) => {
  if (!isDragging.value) return
  const pos = clientToStage(e.clientX, e.clientY)
  tankVelocity.value = {
    x: pos.x - prevMousePosition.value.x,
    y: pos.y - prevMousePosition.value.y,
  }
  gameStore.setStage('playing')
  Matter.Body.setPosition(tankRigidbody, pos)
  prevMousePosition.value = pos
}

const handleGlobalTouchMove = (e: TouchEvent) => {
  if (!isDragging.value || e.touches.length === 0) return
  e.preventDefault()
  const touch = e.touches[0]
  if (!touch) return
  const pos = clientToStage(touch.clientX, touch.clientY)
  tankVelocity.value = {
    x: pos.x - prevMousePosition.value.x,
    y: pos.y - prevMousePosition.value.y,
  }
  gameStore.setStage('playing')
  Matter.Body.setPosition(tankRigidbody, pos)
  prevMousePosition.value = pos
}

const handleGlobalPointerUp = () => handleDragRelease()

const onTankPointerDown = (e: {
  target: { getStage: () => { getPointerPosition: () => { x: number; y: number } } }
}) => {
  const pos = e.target.getStage().getPointerPosition()
  isDragging.value = true
  Matter.Body.setStatic(tankRigidbody, true)
  prevMousePosition.value = { x: pos.x, y: pos.y }
}

const runPhysicsLoop = () => {
  if (!engine?.world) return
  Matter.Engine.update(engine, 1000 / 60)

  gameStore.setGateLeftDistance(
    Math.round(
      Math.sqrt(
        Math.pow(gateLeftRigidbody.position.x - gateLeftInitialPos.value.x, 2) +
          Math.pow(gateLeftRigidbody.position.y - gateLeftInitialPos.value.y, 2),
      ),
    ),
  )
  gameStore.setGateRightDistance(
    Math.round(
      Math.sqrt(
        Math.pow(gateRightRigidbody.position.x - gateRightInitialPos.value.x, 2) +
          Math.pow(gateRightRigidbody.position.y - gateRightInitialPos.value.y, 2),
      ),
    ),
  )

  tankPosition.value = { x: tankRigidbody.position.x, y: tankRigidbody.position.y }

  const buildingGroup = buildingGroupRef.value?.getNode()
  if (buildingGroup) {
    const transform = buildingGroup.getAbsoluteTransform().copy()
    transform.invert()
    gateLeftPosition.value = transform.point({
      x: gateLeftRigidbody.position.x,
      y: gateLeftRigidbody.position.y,
    })
    gateRightPosition.value = transform.point({
      x: gateRightRigidbody.position.x,
      y: gateRightRigidbody.position.y,
    })
  }
  gateLeftRotation.value = gateLeftRigidbody.angle
  gateRightRotation.value = gateRightRigidbody.angle

  const targetRotation = isDragging.value ? (tankVelocity.value.x / 30) * 0.5 : 0
  tankRotation.value += (targetRotation - tankRotation.value) * 0.3
  if (!isDragging.value) tankRotation.value *= 0.95

  animationId = requestAnimationFrame(runPhysicsLoop)
}

// ============ Konva configs ============
const backgroundRectConfig = computed(() => ({
  x: 0,
  y: 0,
  width: stageSize.value.width,
  height: stageSize.value.height,
  fill: '#f8f8ff',
  listening: false,
}))

const stageConfig = computed(() => ({
  width: stageSize.value.width,
  height: stageSize.value.height,
}))

const buildingGroupConfig = computed(() => ({
  x: buildingGroupPos.value.x,
  y: buildingGroupPos.value.y,
  scaleX: groupScale.value,
  scaleY: groupScale.value,
}))

const tankConfig = computed(() => ({
  image: tankImg.value,
  x: tankPosition.value.x,
  y: tankPosition.value.y,
  offsetX: 737,
  offsetY: 52.5,
  scaleX: getResponsiveScale(DEFAULT_SCALES.tank),
  scaleY: getResponsiveScale(DEFAULT_SCALES.tank),
  rotation: (tankRotation.value * 180) / Math.PI,
  listening: true,
  draggable: false,
}))

const gateLeftConfig = computed(() => ({
  image: gateLeftImg.value,
  x: gateLeftPosition.value.x,
  y: gateLeftPosition.value.y,
  scaleX: 0.7,
  scaleY: 0.7,
  rotation: (gateLeftRotation.value * 180) / Math.PI,
  listening: false,
}))

const gateRightConfig = computed(() => ({
  image: gateRightImg.value,
  x: gateRightPosition.value.x,
  y: gateRightPosition.value.y,
  scaleX: 0.7,
  scaleY: 0.7,
  rotation: (gateRightRotation.value * 180) / Math.PI,
  listening: false,
}))

// ============ Lifecycle ============
const initPhysics = () => {
  tankPhysicsDimensions = getPhysicsBodyDimensions(DEFAULT_PHYSICS.tank)
  gateLeftPhysicsDimensions = getPhysicsBodyDimensions(DEFAULT_PHYSICS.gateLeft)
  gateRightPhysicsDimensions = getPhysicsBodyDimensions(DEFAULT_PHYSICS.gateRight)

  engine = Matter.Engine.create({ gravity: { x: 0, y: 0 } })

  const tankPos = { x: stageSize.value.width * 0.8, y: stageSize.value.height / 2 }
  buildingGroupPos.value = { x: stageSize.value.width * 0.4, y: stageSize.value.height / 2 - 70 }
  groupScale.value = getResponsiveScale(DEFAULT_SCALES.buildingGroup)
  const gateLeftWorld = getGateWorldPosition(GROUP_LAYOUT.gateLeft.x)
  const gateRightWorld = getGateWorldPosition(GROUP_LAYOUT.gateRight.x)

  tankRigidbody = Matter.Bodies.rectangle(
    tankPos.x,
    tankPos.y,
    tankPhysicsDimensions.width,
    tankPhysicsDimensions.height,
    { label: 'Tank', mass: 10 },
  )
  gateLeftRigidbody = Matter.Bodies.rectangle(
    gateLeftWorld.x,
    gateLeftWorld.y,
    gateLeftPhysicsDimensions.width,
    gateLeftPhysicsDimensions.height,
    {
      label: 'Gate Left',
      mass: 1,
      friction: 0.3,
      restitution: 0.2,
      inertia: Infinity,
      angularVelocity: 0,
      torque: 0,
    },
  )
  gateRightRigidbody = Matter.Bodies.rectangle(
    gateRightWorld.x,
    gateRightWorld.y,
    gateRightPhysicsDimensions.width,
    gateRightPhysicsDimensions.height,
    {
      label: 'Gate Right',
      mass: 1,
      friction: 0.3,
      restitution: 0.2,
      inertia: Infinity,
      angularVelocity: 0,
      torque: 0,
    },
  )

  Matter.Composite.add(engine.world, [tankRigidbody, gateLeftRigidbody, gateRightRigidbody])

  tankPosition.value = { ...tankPos }
  gateLeftInitialPos.value = { ...gateLeftWorld }
  gateRightInitialPos.value = { ...gateRightWorld }

  Matter.Events.on(engine, 'collisionStart', (event: Matter.IEventCollision<Matter.Engine>) => {
    event.pairs.forEach((pair) => {
      const bodyA = pair.bodyA
      const bodyB = pair.bodyB
      if (bodyA.label === 'Tank' || bodyB.label === 'Tank') {
        const tank = bodyA.label === 'Tank' ? bodyA : bodyB
        const gate = bodyA.label === 'Tank' ? bodyB : bodyA
        const impactVelocity = isDragging.value ? tankVelocity.value : tank.velocity
        const speed = Math.sqrt(
          impactVelocity.x * impactVelocity.x + impactVelocity.y * impactVelocity.y,
        )
        if (Math.round(speed) > 0) {
          gameStore.setIsTankHit(true)
          gameStore.setTankSpeed(Math.round(speed))
        }
        const forceMagnitude = Math.pow(speed, 1.5) * 0.005
        const forceDirection = {
          x: gate.position.x - tank.position.x,
          y: gate.position.y - tank.position.y,
        }
        const length = Math.sqrt(
          forceDirection.x * forceDirection.x + forceDirection.y * forceDirection.y,
        )
        forceDirection.x /= length
        forceDirection.y /= length
        const offsetY = speed > 20 ? 40 : 30
        const forcePoint = { x: gate.position.x + 30, y: gate.position.y + offsetY }
        Matter.Body.applyForce(gate, forcePoint, {
          x: forceDirection.x * forceMagnitude,
          y: forceDirection.y * forceMagnitude,
        })
        const randomRotation = (Math.random() - 0.5) * (0.1 + speed * 0.01)
        Matter.Body.setAngularVelocity(gate, randomRotation)
      }
    })
  })
}

const handleResize = () => {
  if (!containerRef.value) return
  stageSize.value = {
    width: containerRef.value.clientWidth,
    height: containerRef.value.clientHeight,
  }
  resetPositions()
}

onMounted(() => {
  handleResize()
  initPhysics()

  window.addEventListener('mousemove', handleGlobalMouseMove)
  window.addEventListener('mouseup', handleGlobalPointerUp)
  window.addEventListener('touchmove', handleGlobalTouchMove, { passive: false })
  window.addEventListener('touchend', handleGlobalPointerUp)
  window.addEventListener('touchcancel', handleGlobalPointerUp)
  window.addEventListener('resize', handleResize)

  animationId = requestAnimationFrame(runPhysicsLoop)
})

onUnmounted(() => {
  cancelAnimationFrame(animationId)
  if (engine) {
    Matter.Events.off(engine, 'collisionStart')
    Matter.World.clear(engine.world, false)
  }
  window.removeEventListener('mousemove', handleGlobalMouseMove)
  window.removeEventListener('mouseup', handleGlobalPointerUp)
  window.removeEventListener('touchmove', handleGlobalTouchMove)
  window.removeEventListener('touchend', handleGlobalPointerUp)
  window.removeEventListener('touchcancel', handleGlobalPointerUp)
  window.removeEventListener('resize', handleResize)
})

watch(
  () => gameStore.stage,
  (stage) => {
    if (stage === 'ready') resetPositions()
  },
)
</script>

<template>
  <main ref="containerRef" class="w-full h-full">
    <v-stage
      v-if="dinhDocLapImg && frameImg && gateLeftImg && gateRightImg && tankImg"
      ref="stageRef"
      :config="stageConfig"
      class="block"
    >
      <!-- Building group (background) -->
      <v-layer>
        <v-rect :config="backgroundRectConfig" />
        <v-group ref="buildingGroupRef" :config="buildingGroupConfig">
          <v-image
            v-if="dinhDocLapImg"
            :config="{
              image: dinhDocLapImg,
              x: GROUP_LAYOUT.dinhDocLap.x,
              y: GROUP_LAYOUT.dinhDocLap.y,
              scaleX: 0.7,
              scaleY: 0.7,
            }"
          />
          <v-image
            v-if="frameImg"
            :config="{
              image: frameImg,
              x: GROUP_LAYOUT.frame.x,
              y: GROUP_LAYOUT.frame.y,
              scaleX: 0.7,
              scaleY: 0.7,
            }"
          />
          <v-image v-if="gateLeftImg" :config="gateLeftConfig" />
          <v-image v-if="gateRightImg" :config="gateRightConfig" />
        </v-group>
      </v-layer>
      <!-- Tank (foreground) -->
      <v-layer>
        <v-image
          v-if="tankImg"
          :config="tankConfig"
          @mousedown="onTankPointerDown"
          @touchstart="onTankPointerDown"
        />
      </v-layer>
    </v-stage>
  </main>
</template>
