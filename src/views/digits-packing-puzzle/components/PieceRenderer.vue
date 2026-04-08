<script setup lang="ts">
import { computed } from 'vue'
import type { Piece, Segment } from '../types'
import { getPieceSegments } from '../utils/rotation'
import { PIECE_COLORS } from '../utils/segments'

interface Props {
  piece: Piece
  scale?: number
}

const props = withDefaults(defineProps<Props>(), {
  scale: 1,
})

const SEGMENT_LENGTH = 40
const SEGMENT_THICKNESS = 6

const segments = computed(() => getPieceSegments(props.piece))
const color = computed(() => PIECE_COLORS[props.piece.number])

// Calculate bounding box
const boundingBox = computed(() => {
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity

  segments.value.forEach((seg) => {
    minX = Math.min(minX, seg.x)
    minY = Math.min(minY, seg.y)

    if (seg.orientation === 'horizontal') {
      maxX = Math.max(maxX, seg.x + 1)
      maxY = Math.max(maxY, seg.y)
    } else {
      maxX = Math.max(maxX, seg.x)
      maxY = Math.max(maxY, seg.y + 1)
    }
  })

  return { minX, minY, maxX, maxY }
})

const svgDimensions = computed(() => {
  const { minX, minY, maxX, maxY } = boundingBox.value
  const width = (maxX - minX) * SEGMENT_LENGTH * props.scale
  const height = (maxY - minY) * SEGMENT_LENGTH * props.scale
  const padding = 10 * props.scale

  return {
    width: width + 2 * padding,
    height: height + 2 * padding,
    padding,
  }
})

const segmentStyles = computed(() => {
  const thickness = SEGMENT_THICKNESS * props.scale
  const halfThickness = thickness / 2
  const backgroundThickness = (SEGMENT_THICKNESS + 4) * props.scale
  const backgroundHalfThickness = backgroundThickness / 2
  const innerThickness = SEGMENT_THICKNESS * props.scale * 0.7
  const innerHalfThickness = innerThickness / 2
  const backgroundColor = '#0a0e1a'
  const endGap = SEGMENT_LENGTH * props.scale * 0.15

  return {
    thickness,
    halfThickness,
    backgroundThickness,
    backgroundHalfThickness,
    innerThickness,
    innerHalfThickness,
    backgroundColor,
    endGap,
  }
})

/**
 * Convert segment coordinates to pixel coordinates
 */
const segToPixel = (x: number, y: number) => {
  const { minX, minY } = boundingBox.value
  const { padding } = svgDimensions.value
  return {
    x: padding + (x - minX) * SEGMENT_LENGTH * props.scale,
    y: padding + (y - minY) * SEGMENT_LENGTH * props.scale,
  }
}

const getBackgroundPoints = (seg: Segment) => {
  const start = segToPixel(seg.x, seg.y)
  const { backgroundHalfThickness } = segmentStyles.value

  if (seg.orientation === 'horizontal') {
    const end = segToPixel(seg.x + 1, seg.y)
    return `
      ${start.x + backgroundHalfThickness},${start.y - backgroundHalfThickness}
      ${start.x},${start.y}
      ${start.x + backgroundHalfThickness},${start.y + backgroundHalfThickness}
      ${end.x - backgroundHalfThickness},${end.y + backgroundHalfThickness}
      ${end.x},${end.y}
      ${end.x - backgroundHalfThickness},${end.y - backgroundHalfThickness}
    `
  } else {
    const end = segToPixel(seg.x, seg.y + 1)
    return `
      ${start.x - backgroundHalfThickness},${start.y + backgroundHalfThickness}
      ${start.x},${start.y}
      ${start.x + backgroundHalfThickness},${start.y + backgroundHalfThickness}
      ${end.x + backgroundHalfThickness},${end.y - backgroundHalfThickness}
      ${end.x},${end.y}
      ${end.x - backgroundHalfThickness},${end.y - backgroundHalfThickness}
    `
  }
}

const getInnerPoints = (seg: Segment) => {
  const start = segToPixel(seg.x, seg.y)
  const { innerHalfThickness, endGap } = segmentStyles.value

  if (seg.orientation === 'horizontal') {
    const end = segToPixel(seg.x + 1, seg.y)
    const innerStart = { x: start.x + endGap, y: start.y }
    const innerEnd = { x: end.x - endGap, y: end.y }
    return `
      ${innerStart.x + innerHalfThickness},${innerStart.y - innerHalfThickness}
      ${innerStart.x},${innerStart.y}
      ${innerStart.x + innerHalfThickness},${innerStart.y + innerHalfThickness}
      ${innerEnd.x - innerHalfThickness},${innerEnd.y + innerHalfThickness}
      ${innerEnd.x},${innerEnd.y}
      ${innerEnd.x - innerHalfThickness},${innerEnd.y - innerHalfThickness}
    `
  } else {
    const end = segToPixel(seg.x, seg.y + 1)
    const innerStart = { x: start.x, y: start.y + endGap }
    const innerEnd = { x: end.x, y: end.y - endGap }
    return `
      ${innerStart.x - innerHalfThickness},${innerStart.y + innerHalfThickness}
      ${innerStart.x},${innerStart.y}
      ${innerStart.x + innerHalfThickness},${innerStart.y + innerHalfThickness}
      ${innerEnd.x + innerHalfThickness},${innerEnd.y - innerHalfThickness}
      ${innerEnd.x},${innerEnd.y}
      ${innerEnd.x - innerHalfThickness},${innerEnd.y - innerHalfThickness}
    `
  }
}
</script>

<template>
  <svg :width="svgDimensions.width" :height="svgDimensions.height" class="block">
    <!-- Background polygons -->
    <polygon
      v-for="(seg, idx) in segments"
      :key="`bg-${idx}`"
      :points="getBackgroundPoints(seg)"
      :fill="segmentStyles.backgroundColor"
    />

    <!-- Inner colored polygons -->
    <polygon
      v-for="(seg, idx) in segments"
      :key="idx"
      :points="getInnerPoints(seg)"
      :fill="color"
    />
  </svg>
</template>
