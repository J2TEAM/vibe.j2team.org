<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'

const props = defineProps<{
  names: string[]
}>()

const emit = defineEmits<{
  winner: [name: string]
}>()

// ── Cube geometry (used when names ≤ 6) ───────────────
const CUBE_SIZE = 130 // px — each cube face is this square size
const MIN_SIDES = 6

const CUBE_FACE_POSITIONS = [
  `rotateY(0deg) translateZ(${CUBE_SIZE / 2}px)`,
  `rotateY(180deg) translateZ(${CUBE_SIZE / 2}px)`,
  `rotateY(90deg) translateZ(${CUBE_SIZE / 2}px)`,
  `rotateY(-90deg) translateZ(${CUBE_SIZE / 2}px)`,
  `rotateX(90deg) translateZ(${CUBE_SIZE / 2}px)`,
  `rotateX(-90deg) translateZ(${CUBE_SIZE / 2}px)`,
]

const CUBE_FACE_TARGETS: { x: number; y: number; z: number }[] = [
  { x: 0, y: 0, z: 0 },
  { x: 0, y: -180, z: 0 },
  { x: 0, y: -90, z: 0 },
  { x: 0, y: 90, z: 0 },
  { x: -90, y: 0, z: 0 },
  { x: 90, y: 0, z: 0 },
]

// ── Dodecahedron geometry (used when names > 6) ───────
// A regular dodecahedron has 12 pentagonal faces, 20 vertices, 30 edges.
// We compute exact face normals and derive CSS transforms + landing rotations.
//
// Face layout (oriented with one face toward +Z camera):
//   0: front — faces directly toward camera (+Z)
//   1–5: ring around front, tilted outward by the dihedral complement
//   6–10: ring around back, tilted further
//   11: back — faces directly away from camera (-Z)

const DODECA_FACES = 12

// Desired visual size: edge length in pixels
const DODECA_EDGE = 72 // px

// Pentagon circumradius for edge a: R = a / (2 * sin(π/5))
const PENT_CIRCUMRADIUS = DODECA_EDGE / (2 * Math.sin(Math.PI / 5))

// The face div is a square that circumscribes the pentagon.
// Its side = 2 * circumradius of the pentagon.
const DODECA_FACE_PX = Math.ceil(PENT_CIRCUMRADIUS * 2)

// Dodecahedron inradius (center-to-face-center distance) for edge length a:
//   inradius = a * sqrt(25 + 11*sqrt(5)) / (4*sqrt(3))
//            ≈ a * 1.11352
const DODECA_INRADIUS = (DODECA_EDGE * Math.sqrt(25 + 11 * Math.sqrt(5))) / (4 * Math.sqrt(3))

// Angle between the +Z axis and the normals of the "front ring" faces.
// For a dodecahedron: θ₁ = arctan(2) ≈ 63.4349°
const THETA1 = Math.atan(2) * (180 / Math.PI) // ≈ 63.4349°

// Angle for the "back ring" faces: θ₂ = 180° - θ₁ ≈ 116.5651°
const THETA2 = 180 - THETA1

// Pentagon clip-path (regular pentagon inscribed in a circle, top vertex up)
const PENTAGON_CLIP = (() => {
  const pts: string[] = []
  for (let i = 0; i < 5; i++) {
    const angle = (i * 72 - 90) * (Math.PI / 180)
    const x = 50 + 50 * Math.cos(angle)
    const y = 50 + 50 * Math.sin(angle)
    pts.push(`${x.toFixed(2)}% ${y.toFixed(2)}%`)
  }
  return `polygon(${pts.join(', ')})`
})()

// ── Build dodecahedron face data ──────────────────────
// Each face needs:
//   transform: CSS transform to position it in 3D (applied to individual face div)
//   landing: {x, y, z} — the container rotation that brings this face to front-center
//
// Strategy: use ONLY rotateY + rotateX + translateZ for positioning.
//   The container applies: rotateX(rx) rotateY(ry) rotateZ(rz)
//   CSS reads right-to-left, so the face transform:
//     rotateY(azimuth) rotateX(elevation) translateZ(inradius)
//   first pushes the face out along its local Z, then tilts, then spins to azimuth.
//
// To "land" on face i, the container must negate: rotateX(-elevation) rotateY(-azimuth)

interface DodecaFaceInfo {
  transform: string
  landing: { x: number; y: number; z: number }
  /** In-plane rotation so the pentagon's top vertex points "up" visually */
  spin: number
}

function buildDodecaFaces(): DodecaFaceInfo[] {
  const result: DodecaFaceInfo[] = []
  const r = DODECA_INRADIUS

  // Face positions use spherical coordinates: rotateZ(azimuth) rotateY(tilt)
  // This places face centers at (r·sinθ·cosφ, r·sinθ·sinφ, r·cosθ),
  // correctly distributing them in a symmetric cone around the +Z axis.
  //
  // Landing rotation: to bring face i to front, the drum needs
  //   rotateX(0) rotateY(-tilt) rotateZ(-azimuth)
  //
  // A tiny outward nudge (0.5px) prevents CSS bounding-box z-fighting
  // at dihedral edges while keeping pentagons visually edge-to-edge.
  const rr = r + 7.5

  // Face 0: front — normal along +Z, no rotation needed
  result.push({
    transform: `translateZ(${rr.toFixed(1)}px)`,
    landing: { x: 0, y: 0, z: 0 },
    spin: 54,
  })

  // Faces 1–5: front ring — tilt θ₁ from +Z, azimuth spaced 72° starting at 0°
  for (let i = 0; i < 5; i++) {
    const az = i * 72
    result.push({
      transform: `rotateZ(${az}deg) rotateY(${THETA1.toFixed(4)}deg) translateZ(${rr.toFixed(1)}px)`,
      landing: { x: 0, y: -THETA1, z: -az },
      spin: 90, // rotate pentagon so edges align with front face and back-ring neighbors
    })
  }

  // Faces 6–10: back ring — tilt θ₂ from +Z, offset 36° from front ring
  for (let i = 0; i < 5; i++) {
    const az = i * 72 + 36
    result.push({
      transform: `rotateZ(${az}deg) rotateY(${THETA2.toFixed(4)}deg) translateZ(${rr.toFixed(1)}px)`,
      landing: { x: 0, y: -THETA2, z: -az },
      spin: 54,
    })
  }

  // Face 11: back — normal along -Z (tilt 180°)
  result.push({
    transform: `rotateY(180deg) translateZ(${rr.toFixed(1)}px)`,
    landing: { x: 0, y: -180, z: 0 },
    spin: 54,
  })

  return result
}

const DODECA_FACE_DATA = buildDodecaFaces()

// ── Mode selection ─────────────────────────────────────
const isCubeMode = computed(() => props.names.length <= 6)
const isDodecaMode = computed(() => props.names.length > 6)

// Total face count
const faceCount = computed(() => {
  if (isDodecaMode.value) return DODECA_FACES
  return Math.max(MIN_SIDES, props.names.length)
})

// Build face list: real names first, then blank fillers
const faces = computed<{ label: string; isBlank: boolean }[]>(() => {
  const result = props.names.map((name) => ({ label: name, isBlank: false }))
  const blanksNeeded = faceCount.value - props.names.length
  for (let i = 0; i < blanksNeeded; i++) {
    result.push({ label: '', isBlank: true })
  }
  return result
})

// CSS perspective — further away for dodecahedron to avoid distortion
const perspectivePx = computed<number>(() => {
  if (isDodecaMode.value) return DODECA_INRADIUS * 4 + 400
  return CUBE_SIZE * 2.6 + 220
})

// Font size
const faceFontSize = computed<number>(() => {
  if (isDodecaMode.value) return 11
  return 16
})

// ── Face colors ────────────────────────────────────────
const FACE_COLORS = [
  {
    bg: 'linear-gradient(160deg, #7c3aed 0%, #5b21b6 50%, #4c1d95 100%)',
    border: 'rgba(167, 139, 250, 0.6)',
  }, // violet
  {
    bg: 'linear-gradient(160deg, #2563eb 0%, #1d4ed8 50%, #1e40af 100%)',
    border: 'rgba(96, 165, 250, 0.6)',
  }, // blue
  {
    bg: 'linear-gradient(160deg, #059669 0%, #047857 50%, #065f46 100%)',
    border: 'rgba(52, 211, 153, 0.6)',
  }, // emerald
  {
    bg: 'linear-gradient(160deg, #ea580c 0%, #c2410c 50%, #9a3412 100%)',
    border: 'rgba(251, 146, 60, 0.6)',
  }, // orange
  {
    bg: 'linear-gradient(160deg, #e11d48 0%, #be123c 50%, #9f1239 100%)',
    border: 'rgba(251, 113, 133, 0.6)',
  }, // rose
  {
    bg: 'linear-gradient(160deg, #ca8a04 0%, #a16207 50%, #854d0e 100%)',
    border: 'rgba(250, 204, 21, 0.6)',
  }, // amber
  {
    bg: 'linear-gradient(160deg, #0d9488 0%, #0f766e 50%, #115e59 100%)',
    border: 'rgba(45, 212, 191, 0.6)',
  }, // teal
  {
    bg: 'linear-gradient(160deg, #c026d3 0%, #a21caf 50%, #86198f 100%)',
    border: 'rgba(232, 121, 249, 0.6)',
  }, // fuchsia
  {
    bg: 'linear-gradient(160deg, #0284c7 0%, #0369a1 50%, #075985 100%)',
    border: 'rgba(56, 189, 248, 0.6)',
  }, // sky
  {
    bg: 'linear-gradient(160deg, #16a34a 0%, #15803d 50%, #166534 100%)',
    border: 'rgba(74, 222, 128, 0.6)',
  }, // green
  {
    bg: 'linear-gradient(160deg, #dc2626 0%, #b91c1c 50%, #991b1b 100%)',
    border: 'rgba(248, 113, 113, 0.6)',
  }, // red
  {
    bg: 'linear-gradient(160deg, #4f46e5 0%, #4338ca 50%, #3730a3 100%)',
    border: 'rgba(129, 140, 248, 0.6)',
  }, // indigo
]

function getFaceColor(index: number) {
  return FACE_COLORS[index % FACE_COLORS.length]!
}

// ── State ──────────────────────────────────────────────
const drumRotX = ref(-15)
const drumRotY = ref(0)
const drumRotZ = ref(0)
const isRolling = ref(false)
const winnerIndex = ref<number | null>(null)

let animId = 0

// ── Easing ─────────────────────────────────────────────
function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4)
}

// ── Roll ──────────────────────────────────────────────
function spin(): void {
  if (isRolling.value || props.names.length < 2) return

  isRolling.value = true
  winnerIndex.value = null

  const n = props.names.length
  const wIdx = Math.floor(Math.random() * n)
  const winnerName = props.names[wIdx] ?? ''

  // ── Landing rotation for the winning face ──
  let landX: number
  let landY: number
  let landZ: number

  if (isDodecaMode.value) {
    const landing = DODECA_FACE_DATA[wIdx]!.landing
    landX = landing.x
    landY = landing.y
    landZ = landing.z
  } else {
    const target = CUBE_FACE_TARGETS[wIdx]!
    landX = target.x
    landY = target.y
    landZ = target.z
  }

  // ── Spin with multiple full rotations for dramatic tumble ──
  const fullRotY = 5 + Math.floor(Math.random() * 5)
  const fullRotX = 3 + Math.floor(Math.random() * 4)
  const fullRotZ = 2 + Math.floor(Math.random() * 3)

  const dirX = Math.random() < 0.5 ? 1 : -1
  const dirZ = Math.random() < 0.5 ? 1 : -1

  const offsetY = (((landY - drumRotY.value) % 360) + 360) % 360
  const targetRotY = drumRotY.value + offsetY - fullRotY * 360

  const offsetX = (((landX - drumRotX.value) % 360) + 360) % 360
  const targetRotX = drumRotX.value + offsetX + dirX * fullRotX * 360

  const offsetZ = (((landZ - drumRotZ.value) % 360) + 360) % 360
  const targetRotZ = drumRotZ.value + offsetZ + dirZ * fullRotZ * 360

  const startRotX = drumRotX.value
  const startRotY = drumRotY.value
  const startRotZ = drumRotZ.value
  const duration = 3200 + Math.random() * 700
  const startTime = performance.now()

  cancelAnimationFrame(animId)

  function frame(): void {
    const t = Math.min((performance.now() - startTime) / duration, 1)
    const e = easeOutQuart(t)

    drumRotX.value = startRotX + (targetRotX - startRotX) * e
    drumRotY.value = startRotY + (targetRotY - startRotY) * e
    drumRotZ.value = startRotZ + (targetRotZ - startRotZ) * e

    if (t < 1) {
      animId = requestAnimationFrame(frame)
      return
    }

    drumRotX.value = landX
    drumRotY.value = landY
    drumRotZ.value = landZ
    isRolling.value = false
    winnerIndex.value = wIdx
    emit('winner', winnerName)
  }

  animId = requestAnimationFrame(frame)
}

onUnmounted(() => cancelAnimationFrame(animId))
defineExpose({ spin })
</script>

<template>
  <div class="flex w-full flex-col items-center gap-8">
    <!-- ── 3D die viewport ── -->
    <div class="die-viewport" :style="{ perspective: `${perspectivePx}px` }">
      <!-- Cube mode uses a shadow wrapper (safe because it's simple backface-hidden).
             Dodecahedron skips the filter wrapper to preserve transform-style:preserve-3d. -->
      <div :class="isCubeMode ? 'drum-shadow' : 'drum-no-shadow'">
        <div
          class="drum"
          :style="{
            width: isCubeMode ? `${CUBE_SIZE}px` : '0px',
            height: isCubeMode ? `${CUBE_SIZE}px` : '0px',
            transform: `rotateX(${drumRotX}deg) rotateY(${drumRotY}deg) rotateZ(${drumRotZ}deg)`,
          }"
        >
          <!-- Cube mode: 6 faces positioned as a regular cube (≤ 6 names) -->
          <template v-if="isCubeMode">
            <div
              v-for="(face, i) in faces"
              :key="i"
              class="die-face die-face--cube"
              :class="{
                'die-face--winner': !isRolling && winnerIndex === i,
                'die-face--blank': face.isBlank,
              }"
              :style="{
                width: `${CUBE_SIZE}px`,
                height: `${CUBE_SIZE}px`,
                fontSize: `${faceFontSize}px`,
                transform: CUBE_FACE_POSITIONS[i],
                background: getFaceColor(i).bg,
                borderColor: getFaceColor(i).border,
              }"
            >
              <span class="face-label">{{ face.label || '\u2014' }}</span>
            </div>
          </template>

          <!-- Dodecahedron mode: 12 pentagonal faces (> 6 names) -->
          <template v-else-if="isDodecaMode">
            <div
              v-for="(face, i) in faces"
              :key="i"
              class="die-face die-face--dodeca"
              :class="{
                'die-face--winner': !isRolling && winnerIndex === i,
                'die-face--blank': face.isBlank,
              }"
              :style="{
                width: `${DODECA_FACE_PX}px`,
                height: `${DODECA_FACE_PX}px`,
                marginLeft: `${-DODECA_FACE_PX / 2}px`,
                marginTop: `${-DODECA_FACE_PX / 2}px`,
                fontSize: `${faceFontSize}px`,
                transform: `${DODECA_FACE_DATA[i]?.transform} rotate(${DODECA_FACE_DATA[i]?.spin ?? 0}deg)`,
                background: getFaceColor(i).bg,
                clipPath: PENTAGON_CLIP,
              }"
            >
              <span class="face-label">{{ face.label || '\u2014' }}</span>
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- ── Status text ── -->
    <p
      v-if="isRolling"
      class="font-display animate-pulse text-sm tracking-[0.15em] text-accent-amber"
    >
      THE DIE IS ROLLING…
    </p>
    <p v-else-if="names.length === 0" class="font-display text-sm tracking-[0.12em] text-text-dim">
      Enter names to roll the die
    </p>
    <p v-else class="font-display text-sm tracking-[0.12em] text-text-dim">
      Roll the die — fate will choose
    </p>

    <!-- ── Roll button ── -->
    <button
      :disabled="isRolling || names.length < 2"
      class="font-display bg-accent-coral px-14 py-4 text-base font-bold tracking-[0.15em] text-bg-deep transition-all hover:bg-accent-amber active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
      type="button"
      @click="spin"
    >
      {{ isRolling ? 'ROLLING\u2026' : 'ROLL THE DIE' }}
    </button>
  </div>
</template>

<style scoped>
/* ── Perspective viewport ────────────────────────────── */
.die-viewport {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 300px;
  perspective-origin: 50% 48%;
}

/* ── Shadow host — ONLY for cube mode.
   CSS filter on a parent flattens preserve-3d children,
   so dodecahedron mode must NOT use a filter wrapper. */
.drum-shadow {
  filter: drop-shadow(0 16px 32px rgba(0, 0, 0, 0.65));
}

/* No filter for dodecahedron — passes 3D context through to drum */
.drum-no-shadow {
  transform-style: preserve-3d;
}

/* ── Drum (the die container) ────────────────────────── */
.drum {
  position: relative;
  transform-style: preserve-3d;
}

/* ── Face base ───────────────────────────────────────── */
.die-face {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 6px;
  background: linear-gradient(160deg, #1e3354 0%, #111e30 60%, #0d1726 100%);
  border: 1.5px solid rgba(255, 107, 74, 0.28);
  border-radius: 8px;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.15),
    inset 0 -1px 0 rgba(0, 0, 0, 0.3),
    inset 2px 0 0 rgba(255, 255, 255, 0.08),
    inset -2px 0 0 rgba(0, 0, 0, 0.2);
  backface-visibility: visible;
}

/* ── Cube-mode face ──────────────────────────────────── */
.die-face--cube {
  top: 0;
  left: 0;
  backface-visibility: hidden;
}

/* ── Dodecahedron face — pentagonal with clip-path ───── */
.die-face--dodeca {
  /* Offset by half its own size so transforms originate from center */
  top: 50%;
  left: 50%;
  transform-origin: center center;
  border-radius: 0;
  border: none;
  box-shadow:
    inset 0 0 0 2px rgba(255, 255, 255, 0.1),
    inset 0 2px 4px rgba(255, 255, 255, 0.06),
    inset 0 -2px 4px rgba(0, 0, 0, 0.3);
  backface-visibility: hidden;
}

/* ── Name label on each face ─────────────────────────── */
.face-label {
  color: #f0ece6;
  font-family: 'Be Vietnam Pro', sans-serif;
  font-weight: 700;
  text-align: center;
  letter-spacing: 0.025em;
  word-break: break-word;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  max-width: 80%;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.6);
}

/* ── Winner face highlight ───────────────────────────── */
.die-face--winner {
  border-color: rgba(255, 107, 74, 0.9);
  background: linear-gradient(160deg, #24344d 0%, #14202e 60%, #0f1a28 100%) !important;
  box-shadow:
    inset 0 1px 0 rgba(255, 107, 74, 0.18),
    inset 0 -1px 0 rgba(0, 0, 0, 0.35),
    0 0 22px rgba(255, 107, 74, 0.4),
    0 0 60px rgba(255, 107, 74, 0.15);
}

.die-face--winner.die-face--dodeca {
  box-shadow:
    inset 0 0 0 3px rgba(255, 107, 74, 0.7),
    0 0 22px rgba(255, 107, 74, 0.4),
    0 0 60px rgba(255, 107, 74, 0.15);
}

.die-face--winner .face-label {
  color: #ff6b4a;
  text-shadow:
    0 0 10px rgba(255, 107, 74, 0.55),
    0 1px 4px rgba(0, 0, 0, 0.5);
}

/* ── Blank face ──────────────────────────────────────── */
.die-face--blank {
  background: linear-gradient(160deg, #141c2a 0%, #0c1320 60%, #090e18 100%) !important;
  border-color: rgba(255, 107, 74, 0.1);
  opacity: 0.5;
}

.die-face--blank .face-label {
  color: #4a4a52;
  font-weight: 400;
}
</style>
