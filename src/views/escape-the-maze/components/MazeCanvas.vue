<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { type Cell, type Position } from '../types'
import { CELL_SIZE, WALL_WIDTH } from '../config'

const props = defineProps<{
  maze: Cell[][]
  playerPosition: Position
  exitPosition: Position
}>()

const canvas = ref<HTMLCanvasElement>()

function draw() {
  if (!canvas.value) return

  const ctx = canvas.value.getContext('2d')
  if (!ctx) return

  const size = props.maze.length
  canvas.value.width = size * CELL_SIZE
  canvas.value.height = size * CELL_SIZE

  // Clear canvas
  ctx.fillStyle = '#0F1923'
  ctx.fillRect(0, 0, canvas.value.width, canvas.value.height)

  // Draw walls
  ctx.strokeStyle = '#253549'
  ctx.lineWidth = WALL_WIDTH

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const cell = props.maze[y]![x]!
      const px = x * CELL_SIZE
      const py = y * CELL_SIZE

      ctx.beginPath()
      if (cell.walls.top) {
        ctx.moveTo(px, py)
        ctx.lineTo(px + CELL_SIZE, py)
      }
      if (cell.walls.right) {
        ctx.moveTo(px + CELL_SIZE, py)
        ctx.lineTo(px + CELL_SIZE, py + CELL_SIZE)
      }
      if (cell.walls.bottom) {
        ctx.moveTo(px, py + CELL_SIZE)
        ctx.lineTo(px + CELL_SIZE, py + CELL_SIZE)
      }
      if (cell.walls.left) {
        ctx.moveTo(px, py)
        ctx.lineTo(px, py + CELL_SIZE)
      }
      ctx.stroke()
    }
  }

  // Draw exit
  ctx.fillStyle = '#38BDF8'
  ctx.fillRect(
    props.exitPosition.x * CELL_SIZE + 4,
    props.exitPosition.y * CELL_SIZE + 4,
    CELL_SIZE - 8,
    CELL_SIZE - 8,
  )

  // Draw player
  ctx.fillStyle = '#FF6B4A'
  ctx.beginPath()
  ctx.arc(
    props.playerPosition.x * CELL_SIZE + CELL_SIZE / 2,
    props.playerPosition.y * CELL_SIZE + CELL_SIZE / 2,
    CELL_SIZE / 3,
    0,
    Math.PI * 2,
  )
  ctx.fill()
}

onMounted(() => {
  draw()
})

watch([() => props.maze, () => props.playerPosition, () => props.exitPosition], draw, {
  deep: true,
})
</script>

<template>
  <div class="flex justify-center items-center p-4">
    <canvas
      ref="canvas"
      class="border border-border-default bg-bg-deep"
      :style="{ maxWidth: '100%', height: 'auto' }"
    />
  </div>
</template>
