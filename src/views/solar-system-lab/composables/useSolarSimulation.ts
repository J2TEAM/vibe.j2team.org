import { useElementSize, useEventListener, useMediaQuery, useRafFn } from '@vueuse/core'
import { computed, ref, watch } from 'vue'
import {
  AU_KM,
  DAY_IN_MS,
  EARTH_DIAMETER_KM,
  EARTH_YEAR_DAYS,
  MAX_DISTANCE_AU,
  PLANETS,
  PLANET_IDS,
} from '../data'
import type {
  PlanetDefinition,
  PlanetFrameState,
  PlanetId,
  PlanetSeasonData,
  Star,
  TrailPoint,
} from '../types'

interface OrbitalState {
  eccentricAnomalyRad: number
  trueAnomalyRad: number
  radiusAU: number
}

interface ProjectedPlanetState {
  x: number
  y: number
  drawRadius: number
  orbitalRadiusAU: number
  trueAnomalyRad: number
  semimajorPx: number
}

const TAU = Math.PI * 2
const SEASONS = ['Xuân', 'Hạ', 'Thu', 'Đông']

function degToRad(value: number): number {
  return (value * Math.PI) / 180
}

function normalizeAngle(angle: number): number {
  return ((angle % TAU) + TAU) % TAU
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function mapDistanceAUToPixels(distanceAU: number, maxOrbitRadius: number): number {
  const normalizedDistance = distanceAU / MAX_DISTANCE_AU
  const stretchedDistance = Math.pow(normalizedDistance, 0.58)
  return 34 + stretchedDistance * (maxOrbitRadius - 34)
}

function createFrameState(): PlanetFrameState {
  return {
    x: 0,
    y: 0,
    drawRadius: 0,
    orbitalRadiusAU: 0,
    trueAnomalyRad: 0,
    trail: [],
  }
}

function createStars(total: number): Star[] {
  return Array.from({ length: total }, () => ({
    nx: Math.random(),
    ny: Math.random(),
    radius: 0.3 + Math.random() * 1.45,
    alpha: 0.14 + Math.random() * 0.58,
    phase: Math.random() * TAU,
    twinkleSpeed: 0.28 + Math.random() * 1.45,
  }))
}

function getEffectiveAxialTilt(axialTiltDeg: number): number {
  if (axialTiltDeg > 90) {
    return 180 - axialTiltDeg
  }
  return axialTiltDeg
}

function isRetrogradeTilt(axialTiltDeg: number): boolean {
  return axialTiltDeg > 90
}

function solveEccentricAnomaly(meanAnomalyRad: number, eccentricity: number): number {
  let eccentricAnomaly = meanAnomalyRad

  for (let iteration = 0; iteration < 6; iteration++) {
    const numerator = eccentricAnomaly - eccentricity * Math.sin(eccentricAnomaly) - meanAnomalyRad
    const denominator = 1 - eccentricity * Math.cos(eccentricAnomaly)
    eccentricAnomaly -= numerator / denominator
  }

  return eccentricAnomaly
}

function computeOrbitalState(planet: PlanetDefinition, elapsedDays: number): OrbitalState {
  const meanAnomalyRad = normalizeAngle(
    (elapsedDays / planet.orbitalPeriodDays) * TAU + planet.epochMeanAnomalyRad,
  )

  const eccentricAnomalyRad = solveEccentricAnomaly(meanAnomalyRad, planet.eccentricity)
  const trueAnomalyRad =
    2 *
    Math.atan2(
      Math.sqrt(1 + planet.eccentricity) * Math.sin(eccentricAnomalyRad / 2),
      Math.sqrt(1 - planet.eccentricity) * Math.cos(eccentricAnomalyRad / 2),
    )

  const radiusAU = planet.distanceAU * (1 - planet.eccentricity * Math.cos(eccentricAnomalyRad))

  return {
    eccentricAnomalyRad: normalizeAngle(eccentricAnomalyRad),
    trueAnomalyRad: normalizeAngle(trueAnomalyRad),
    radiusAU,
  }
}

function projectFromFocusCoordinates(
  xFocus: number,
  yFocus: number,
  perihelionArgDeg: number,
  orbitalInclinationDeg: number,
): TrailPoint {
  const perihelionRad = degToRad(perihelionArgDeg)
  const cosPerihelion = Math.cos(perihelionRad)
  const sinPerihelion = Math.sin(perihelionRad)

  const xRotated = xFocus * cosPerihelion - yFocus * sinPerihelion
  const yRotated = xFocus * sinPerihelion + yFocus * cosPerihelion

  const inclinationRad = degToRad(orbitalInclinationDeg)
  const yProjected = yRotated * Math.cos(inclinationRad) * 0.92

  return {
    x: xRotated,
    y: yProjected,
  }
}

function buildOrbitPath(
  planet: PlanetDefinition,
  semimajorPx: number,
  centerX: number,
  centerY: number,
): TrailPoint[] {
  const eccentricity = planet.eccentricity
  const semiminorPx = semimajorPx * Math.sqrt(1 - eccentricity * eccentricity)
  const segments = 110

  const points: TrailPoint[] = []

  for (let segment = 0; segment <= segments; segment++) {
    const eccentricAnomalyRad = (segment / segments) * TAU
    const xFocus = semimajorPx * (Math.cos(eccentricAnomalyRad) - eccentricity)
    const yFocus = semiminorPx * Math.sin(eccentricAnomalyRad)

    const projected = projectFromFocusCoordinates(
      xFocus,
      yFocus,
      planet.perihelionArgDeg,
      planet.orbitalInclinationDeg,
    )

    points.push({
      x: centerX + projected.x,
      y: centerY + projected.y,
    })
  }

  return points
}

function computeSeasonData(planet: PlanetDefinition, trueAnomalyRad: number): PlanetSeasonData {
  const retrogradeRotation = isRetrogradeTilt(planet.axialTiltDeg)
  const axialTiltShownDeg = getEffectiveAxialTilt(planet.axialTiltDeg)
  const seasonAngleRad = trueAnomalyRad + degToRad(planet.seasonOffsetDeg)
  const normalizedPhase = normalizeAngle(seasonAngleRad) / TAU

  let seasonIndex = Math.floor(normalizedPhase * 4) % 4
  if (retrogradeRotation) {
    seasonIndex = (4 - seasonIndex) % 4
  }

  let subsolarLatitudeDeg = axialTiltShownDeg * Math.sin(seasonAngleRad)
  if (retrogradeRotation) {
    subsolarLatitudeDeg *= -1
  }

  const safeTilt = Math.max(1, axialTiltShownDeg)
  const insolationIndex = clamp(Math.abs(subsolarLatitudeDeg) / safeTilt, 0, 1)

  return {
    northSeason: SEASONS[seasonIndex] ?? SEASONS[0]!,
    southSeason: SEASONS[(seasonIndex + 2) % 4] ?? SEASONS[2]!,
    subsolarLatitudeDeg,
    axialTiltShownDeg,
    retrogradeRotation,
    insolationIndex,
  }
}

function drawPlanet(
  ctx: CanvasRenderingContext2D,
  planet: PlanetDefinition,
  state: PlanetFrameState,
  selected: boolean,
  showAxisTilt: boolean,
) {
  if (planet.id === 'saturn') {
    ctx.strokeStyle = 'rgba(223, 196, 144, 0.55)'
    ctx.lineWidth = Math.max(1.1, state.drawRadius * 0.28)
    ctx.beginPath()
    ctx.ellipse(state.x, state.y, state.drawRadius * 1.95, state.drawRadius * 0.62, -0.22, 0, TAU)
    ctx.stroke()
  }

  const gradient = ctx.createRadialGradient(
    state.x - state.drawRadius * 0.35,
    state.y - state.drawRadius * 0.35,
    Math.max(1, state.drawRadius * 0.2),
    state.x,
    state.y,
    state.drawRadius,
  )
  gradient.addColorStop(0, planet.primaryColor)
  gradient.addColorStop(1, planet.secondaryColor)

  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.arc(state.x, state.y, state.drawRadius, 0, TAU)
  ctx.fill()

  if (selected) {
    ctx.strokeStyle = 'rgba(255, 184, 48, 0.95)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.arc(state.x, state.y, state.drawRadius + 4.2, 0, TAU)
    ctx.stroke()

    if (showAxisTilt) {
      const effectiveTiltDeg = getEffectiveAxialTilt(planet.axialTiltDeg)
      const tiltSign = isRetrogradeTilt(planet.axialTiltDeg) ? -1 : 1
      const axisAngle =
        -Math.PI / 2 +
        degToRad(effectiveTiltDeg * 0.7 * tiltSign) +
        degToRad(planet.perihelionArgDeg) * 0.14

      const axisHalfLength = state.drawRadius * 2.05
      const axisDX = Math.cos(axisAngle) * axisHalfLength
      const axisDY = Math.sin(axisAngle) * axisHalfLength

      ctx.strokeStyle = 'rgba(56, 189, 248, 0.9)'
      ctx.lineWidth = 1.2
      ctx.beginPath()
      ctx.moveTo(state.x - axisDX, state.y - axisDY)
      ctx.lineTo(state.x + axisDX, state.y + axisDY)
      ctx.stroke()

      ctx.fillStyle = 'rgba(56, 189, 248, 0.95)'
      ctx.beginPath()
      ctx.arc(state.x + axisDX, state.y + axisDY, 2.6, 0, TAU)
      ctx.fill()
    }
  }
}

export function useSolarSimulation() {
  const stageRef = ref<HTMLDivElement | null>(null)
  const canvasRef = ref<HTMLCanvasElement | null>(null)
  const { width: stageWidth, height: stageHeight } = useElementSize(stageRef)

  const isRunning = ref(true)
  const showOrbits = ref(true)
  const showLabels = ref(true)
  const showTrails = ref(true)
  const showAxisTilt = ref(true)
  const showSeasonOverlay = ref(true)
  const showTiltGuides = ref(true)
  const followSelected = ref(false)

  const daysPerSecond = ref(36)
  const distanceScale = ref(1)
  const sizeScale = ref(1.2)
  const simulationDays = ref(0)
  const selectedPlanetId = ref<PlanetId>('earth')

  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const isCompactScreen = useMediaQuery('(max-width: 960px)')

  watch(
    prefersReducedMotion,
    (reduced) => {
      if (!reduced) return
      showTrails.value = false
      daysPerSecond.value = Math.min(daysPerSecond.value, 18)
    },
    { immediate: true },
  )

  const frameState: Record<PlanetId, PlanetFrameState> = {
    mercury: createFrameState(),
    venus: createFrameState(),
    earth: createFrameState(),
    mars: createFrameState(),
    jupiter: createFrameState(),
    saturn: createFrameState(),
    uranus: createFrameState(),
    neptune: createFrameState(),
  }

  const stars = createStars(300)

  const selectedPlanet = computed(
    () => PLANETS.find((planet) => planet.id === selectedPlanetId.value) ?? PLANETS[2]!,
  )

  const simulationDate = computed(() => {
    const baseTime = Date.UTC(2026, 0, 1)
    return new Date(baseTime + simulationDays.value * DAY_IN_MS)
  })

  const formattedSimulationDate = computed(() =>
    simulationDate.value.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }),
  )

  const earthYearsElapsed = computed(() => simulationDays.value / EARTH_YEAR_DAYS)

  const selectedDistanceMillionKm = computed(
    () => (selectedPlanet.value.distanceAU * AU_KM) / 1_000_000,
  )

  const selectedOrbitSpeedKmS = computed(() => {
    const orbitalLengthKm = 2 * Math.PI * selectedPlanet.value.distanceAU * AU_KM
    const periodSeconds = selectedPlanet.value.orbitalPeriodDays * 24 * 60 * 60
    return orbitalLengthKm / periodSeconds
  })

  const selectedSizeVsEarth = computed(() => selectedPlanet.value.diameterKm / EARTH_DIAMETER_KM)

  const selectedYearVsEarth = computed(
    () => selectedPlanet.value.orbitalPeriodDays / EARTH_YEAR_DAYS,
  )

  const selectedOrbitProgress = computed(() => {
    const fraction =
      (simulationDays.value % selectedPlanet.value.orbitalPeriodDays) /
      selectedPlanet.value.orbitalPeriodDays
    return clamp(fraction * 100, 0, 100)
  })

  const earthOrbitProgress = computed(() => {
    const fraction = (simulationDays.value % EARTH_YEAR_DAYS) / EARTH_YEAR_DAYS
    return clamp(fraction * 100, 0, 100)
  })

  const sizeComparePercent = computed(() => clamp((selectedSizeVsEarth.value / 11) * 100, 4, 100))

  const yearComparePercent = computed(() => clamp((selectedYearVsEarth.value / 165) * 100, 1, 100))

  const selectedSeasonData = computed(() => {
    const orbitalState = computeOrbitalState(selectedPlanet.value, simulationDays.value)
    return computeSeasonData(selectedPlanet.value, orbitalState.trueAnomalyRad)
  })

  function formatNumber(value: number, digits = 1): string {
    return value.toLocaleString('vi-VN', {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    })
  }

  function setSelectedPlanet(id: PlanetId) {
    selectedPlanetId.value = id
  }

  function clearTrails() {
    for (const planetId of PLANET_IDS) {
      frameState[planetId].trail.length = 0
    }
  }

  function resetSimulation() {
    simulationDays.value = 0
    isRunning.value = true
    followSelected.value = false
    clearTrails()
  }

  watch(showTrails, (enabled) => {
    if (!enabled) {
      clearTrails()
    }
  })

  watch([distanceScale, sizeScale, followSelected], () => {
    clearTrails()
  })

  watch(selectedPlanetId, () => {
    if (followSelected.value) {
      clearTrails()
    }
  })

  let lastTimestamp = 0

  watch(isRunning, (running) => {
    if (running) {
      lastTimestamp = 0
    }
  })

  function syncCanvasResolution() {
    const canvas = canvasRef.value
    if (!canvas) return

    const width = Math.max(1, Math.floor(stageWidth.value))
    const height = Math.max(1, Math.floor(stageHeight.value))
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    const pixelWidth = Math.floor(width * dpr)
    const pixelHeight = Math.floor(height * dpr)

    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth
      canvas.height = pixelHeight
    }

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  watch(
    [stageWidth, stageHeight],
    () => {
      syncCanvasResolution()
    },
    { immediate: true },
  )

  function renderFrame(timeSeconds: number) {
    const canvas = canvasRef.value
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = Math.max(1, stageWidth.value)
    const height = Math.max(1, stageHeight.value)

    ctx.clearRect(0, 0, width, height)

    const backdrop = ctx.createLinearGradient(0, 0, 0, height)
    backdrop.addColorStop(0, '#09121A')
    backdrop.addColorStop(0.6, '#122130')
    backdrop.addColorStop(1, '#0F1923')
    ctx.fillStyle = backdrop
    ctx.fillRect(0, 0, width, height)

    ctx.save()
    ctx.globalAlpha = 0.12
    const warmCloud = ctx.createRadialGradient(
      width * 0.22,
      height * 0.15,
      10,
      width * 0.22,
      height * 0.15,
      width * 0.55,
    )
    warmCloud.addColorStop(0, 'rgba(255, 107, 74, 0.55)')
    warmCloud.addColorStop(1, 'rgba(255, 107, 74, 0)')
    ctx.fillStyle = warmCloud
    ctx.fillRect(0, 0, width, height)
    ctx.restore()

    for (const star of stars) {
      const twinkle = 0.64 + 0.36 * Math.sin(timeSeconds * star.twinkleSpeed + star.phase)
      const alpha = clamp(star.alpha * twinkle, 0.07, 1)
      ctx.fillStyle = `rgba(240, 237, 230, ${alpha})`
      ctx.beginPath()
      ctx.arc(star.nx * width, star.ny * height, star.radius, 0, TAU)
      ctx.fill()
    }

    const baseCenterX = width * 0.5
    const baseCenterY = height * 0.52
    const maxOrbitRadius = Math.max(88, Math.min(width, height) * 0.47 * distanceScale.value)
    const earthBaseRadius = Math.max(4.2, Math.min(12.5, Math.min(width, height) * 0.012))

    const projected: Record<PlanetId, ProjectedPlanetState> = {
      mercury: { x: 0, y: 0, drawRadius: 0, orbitalRadiusAU: 0, trueAnomalyRad: 0, semimajorPx: 0 },
      venus: { x: 0, y: 0, drawRadius: 0, orbitalRadiusAU: 0, trueAnomalyRad: 0, semimajorPx: 0 },
      earth: { x: 0, y: 0, drawRadius: 0, orbitalRadiusAU: 0, trueAnomalyRad: 0, semimajorPx: 0 },
      mars: { x: 0, y: 0, drawRadius: 0, orbitalRadiusAU: 0, trueAnomalyRad: 0, semimajorPx: 0 },
      jupiter: { x: 0, y: 0, drawRadius: 0, orbitalRadiusAU: 0, trueAnomalyRad: 0, semimajorPx: 0 },
      saturn: { x: 0, y: 0, drawRadius: 0, orbitalRadiusAU: 0, trueAnomalyRad: 0, semimajorPx: 0 },
      uranus: { x: 0, y: 0, drawRadius: 0, orbitalRadiusAU: 0, trueAnomalyRad: 0, semimajorPx: 0 },
      neptune: { x: 0, y: 0, drawRadius: 0, orbitalRadiusAU: 0, trueAnomalyRad: 0, semimajorPx: 0 },
    }

    for (const planet of PLANETS) {
      const orbitalState = computeOrbitalState(planet, simulationDays.value)
      const semimajorPx = mapDistanceAUToPixels(planet.distanceAU, maxOrbitRadius)
      const semiminorPx = semimajorPx * Math.sqrt(1 - planet.eccentricity * planet.eccentricity)

      const xFocus =
        semimajorPx * (Math.cos(orbitalState.eccentricAnomalyRad) - planet.eccentricity)
      const yFocus = semiminorPx * Math.sin(orbitalState.eccentricAnomalyRad)

      const projectedPoint = projectFromFocusCoordinates(
        xFocus,
        yFocus,
        planet.perihelionArgDeg,
        planet.orbitalInclinationDeg,
      )

      const diameterRatio = planet.diameterKm / EARTH_DIAMETER_KM
      const drawRadius = clamp(
        earthBaseRadius * Math.pow(diameterRatio, 0.5) * sizeScale.value,
        2.3,
        24,
      )

      projected[planet.id] = {
        x: baseCenterX + projectedPoint.x,
        y: baseCenterY + projectedPoint.y,
        drawRadius,
        orbitalRadiusAU: orbitalState.radiusAU,
        trueAnomalyRad: orbitalState.trueAnomalyRad,
        semimajorPx,
      }
    }

    let cameraOffsetX = 0
    let cameraOffsetY = 0

    if (followSelected.value) {
      const focus = projected[selectedPlanetId.value]
      cameraOffsetX = baseCenterX - focus.x
      cameraOffsetY = baseCenterY - focus.y
    }

    const sunX = baseCenterX + cameraOffsetX
    const sunY = baseCenterY + cameraOffsetY

    for (const planet of PLANETS) {
      const point = projected[planet.id]
      const state = frameState[planet.id]

      state.x = point.x + cameraOffsetX
      state.y = point.y + cameraOffsetY
      state.drawRadius = point.drawRadius
      state.orbitalRadiusAU = point.orbitalRadiusAU
      state.trueAnomalyRad = point.trueAnomalyRad

      if (showTrails.value && isRunning.value) {
        state.trail.push({ x: state.x, y: state.y })
        const maxTrailPoints = prefersReducedMotion.value ? 28 : 140
        if (state.trail.length > maxTrailPoints) {
          state.trail.shift()
        }
      }
    }

    if (showOrbits.value) {
      for (const planet of PLANETS) {
        const path = buildOrbitPath(planet, projected[planet.id].semimajorPx, sunX, sunY)

        ctx.strokeStyle =
          planet.id === selectedPlanetId.value
            ? 'rgba(255, 184, 48, 0.62)'
            : 'rgba(139, 157, 181, 0.23)'
        ctx.lineWidth = planet.id === selectedPlanetId.value ? 1.3 : 1
        ctx.setLineDash([6, 8])

        ctx.beginPath()
        ctx.moveTo(path[0]!.x, path[0]!.y)
        for (let index = 1; index < path.length; index++) {
          const point = path[index]!
          ctx.lineTo(point.x, point.y)
        }
        ctx.stroke()
      }
      ctx.setLineDash([])

      if (showTiltGuides.value) {
        const focusPlanet = selectedPlanet.value
        const focusState = projected[focusPlanet.id]
        const inclinationText = `i = ${formatNumber(focusPlanet.orbitalInclinationDeg, 2)}°`
        const eccentricityText = `e = ${formatNumber(focusPlanet.eccentricity, 3)}`

        ctx.font = "12px 'Be Vietnam Pro', sans-serif"
        ctx.fillStyle = 'rgba(255, 184, 48, 0.94)'
        ctx.fillText(
          inclinationText,
          focusState.x + cameraOffsetX + 10,
          focusState.y + cameraOffsetY - 14,
        )
        ctx.fillStyle = 'rgba(56, 189, 248, 0.94)'
        ctx.fillText(
          eccentricityText,
          focusState.x + cameraOffsetX + 10,
          focusState.y + cameraOffsetY + 2,
        )
      }
    }

    if (showTrails.value) {
      for (const planet of PLANETS) {
        const points = frameState[planet.id].trail
        if (points.length < 2) continue

        ctx.strokeStyle = `${planet.secondaryColor}A8`
        ctx.lineWidth = 1.1
        ctx.beginPath()
        ctx.moveTo(points[0]!.x, points[0]!.y)
        for (let index = 1; index < points.length; index++) {
          const point = points[index]!
          ctx.lineTo(point.x, point.y)
        }
        ctx.stroke()
      }
    }

    const sunRadius = clamp(Math.min(width, height) * 0.05 * sizeScale.value, 18, 44)

    const sunGlow = ctx.createRadialGradient(
      sunX,
      sunY,
      sunRadius * 0.2,
      sunX,
      sunY,
      sunRadius * 2.8,
    )
    sunGlow.addColorStop(0, 'rgba(255, 214, 120, 0.9)')
    sunGlow.addColorStop(0.5, 'rgba(255, 167, 64, 0.35)')
    sunGlow.addColorStop(1, 'rgba(255, 167, 64, 0)')
    ctx.fillStyle = sunGlow
    ctx.beginPath()
    ctx.arc(sunX, sunY, sunRadius * 2.8, 0, TAU)
    ctx.fill()

    const sunCore = ctx.createRadialGradient(
      sunX - sunRadius * 0.3,
      sunY - sunRadius * 0.3,
      sunRadius * 0.18,
      sunX,
      sunY,
      sunRadius,
    )
    sunCore.addColorStop(0, '#fff1a8')
    sunCore.addColorStop(0.55, '#ffc85f')
    sunCore.addColorStop(1, '#ff9240')
    ctx.fillStyle = sunCore
    ctx.beginPath()
    ctx.arc(sunX, sunY, sunRadius, 0, TAU)
    ctx.fill()

    const sortedPlanets = [...PLANETS].sort(
      (left, right) => frameState[left.id].y - frameState[right.id].y,
    )

    for (const planet of sortedPlanets) {
      const state = frameState[planet.id]
      const isSelected = planet.id === selectedPlanetId.value
      drawPlanet(ctx, planet, state, isSelected, showAxisTilt.value)
    }

    if (showSeasonOverlay.value) {
      const selectedState = frameState[selectedPlanetId.value]
      const seasonData = selectedSeasonData.value

      ctx.setLineDash([4, 5])
      ctx.strokeStyle = 'rgba(255, 184, 48, 0.48)'
      ctx.lineWidth = 1.2
      ctx.beginPath()
      ctx.moveTo(sunX, sunY)
      ctx.lineTo(selectedState.x, selectedState.y)
      ctx.stroke()
      ctx.setLineDash([])

      ctx.font = "12px 'Be Vietnam Pro', sans-serif"
      ctx.textAlign = 'left'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = 'rgba(255, 184, 48, 0.95)'
      ctx.fillText(`Bắc bán cầu: ${seasonData.northSeason}`, 12, height - 32)
      ctx.fillStyle = 'rgba(56, 189, 248, 0.95)'
      ctx.fillText(`Nam bán cầu: ${seasonData.southSeason}`, 12, height - 16)
    }

    if (showLabels.value) {
      const showDenseLabels = !isCompactScreen.value
      ctx.font = "12px 'Be Vietnam Pro', sans-serif"
      ctx.textAlign = 'left'
      ctx.textBaseline = 'middle'

      for (const planet of PLANETS) {
        if (!showDenseLabels && planet.id !== selectedPlanetId.value) {
          continue
        }

        const state = frameState[planet.id]
        ctx.fillStyle =
          planet.id === selectedPlanetId.value
            ? 'rgba(255, 184, 48, 0.98)'
            : 'rgba(240, 237, 230, 0.88)'
        ctx.fillText(planet.name, state.x + state.drawRadius + 7, state.y)
      }

      ctx.fillStyle = 'rgba(255, 184, 48, 0.96)'
      ctx.fillText('Mặt Trời', sunX + sunRadius + 8, sunY)
    }
  }

  useRafFn(({ timestamp }) => {
    if (stageWidth.value <= 0 || stageHeight.value <= 0) {
      return
    }

    if (lastTimestamp === 0) {
      lastTimestamp = timestamp
    }

    const deltaSeconds = Math.min((timestamp - lastTimestamp) / 1000, 0.05)
    lastTimestamp = timestamp

    if (isRunning.value) {
      simulationDays.value += deltaSeconds * daysPerSecond.value
    }

    renderFrame(timestamp / 1000)
  })

  function handleCanvasPointerDown(event: PointerEvent) {
    const canvas = canvasRef.value
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    let nearestPlanetId: PlanetId | null = null
    let nearestDistance = Number.POSITIVE_INFINITY

    for (const planet of PLANETS) {
      const state = frameState[planet.id]
      const distance = Math.hypot(x - state.x, y - state.y)
      const hitRadius = Math.max(10, state.drawRadius + 6)

      if (distance <= hitRadius && distance < nearestDistance) {
        nearestDistance = distance
        nearestPlanetId = planet.id
      }
    }

    if (nearestPlanetId) {
      selectedPlanetId.value = nearestPlanetId
    }
  }

  useEventListener(canvasRef, 'pointerdown', handleCanvasPointerDown)

  return {
    planets: PLANETS,
    stageRef,
    canvasRef,
    isRunning,
    showOrbits,
    showLabels,
    showTrails,
    showAxisTilt,
    showSeasonOverlay,
    showTiltGuides,
    followSelected,
    daysPerSecond,
    distanceScale,
    sizeScale,
    simulationDays,
    selectedPlanetId,
    selectedPlanet,
    selectedSeasonData,
    formattedSimulationDate,
    earthYearsElapsed,
    selectedDistanceMillionKm,
    selectedOrbitSpeedKmS,
    selectedSizeVsEarth,
    selectedYearVsEarth,
    selectedOrbitProgress,
    earthOrbitProgress,
    sizeComparePercent,
    yearComparePercent,
    setSelectedPlanet,
    clearTrails,
    resetSimulation,
    formatNumber,
  }
}
