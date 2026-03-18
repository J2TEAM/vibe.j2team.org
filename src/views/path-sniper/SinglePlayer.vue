<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'

interface Level {
  id: number
  title: string
  tutorial: string
  playerPos: { x: number; y: number }
  enemyPos: { x: number; y: number }
  obstacles: { x: number; y: number; r: number }[]
  hint: string
  defaultPath: string
}
type GameStatus = 'idle' | 'win' | 'fail' | 'collision'

const levels: Level[] = [
  {
    id: 1,
    title: 'Lệnh M & L',
    tutorial:
      'Lệnh M đặt bút. Lệnh L vẽ thẳng tới mục tiêu.\nHệ thống tự động điền M, bạn chỉ cần gõ tiếp L x y.',
    hint: 'Kẻ địch ở 850, 400. Hãy gõ: L 850 400',
    playerPos: { x: 100, y: 400 },
    enemyPos: { x: 850, y: 400 },
    obstacles: [],
    defaultPath: 'L 200 400',
  },
  {
    id: 2,
    title: 'Lệnh Q',
    tutorial: 'Dùng Q x_kéo y_kéo x_đích y_đích để né vật cản.',
    hint: 'Thử bẻ cong lên trên: Q 450 100 800 600',
    playerPos: { x: 100, y: 600 },
    enemyPos: { x: 800, y: 600 },
    obstacles: [{ x: 450, y: 600, r: 60 }],
    defaultPath: '',
  },
]

const currentLevelIdx = ref(0)
const currentLevel = ref<Level>(levels[0]!)
const rawInput = ref('')
const isFiring = ref(false)
const gameStatus = ref<GameStatus>('idle')
const showTutorial = ref(true)
const showWiki = ref(false)
const pathRef = ref<SVGPathElement | null>(null)

const finalPath = computed(() => {
  const start = `M ${currentLevel.value.playerPos.x} ${currentLevel.value.playerPos.y} `
  return start + rawInput.value.replace(/^M\s*[\d.]+\s+[\d.]+/i, '').trim()
})

const generateRandomLevel = (id: number): Level => {
  const px = 50 + Math.random() * 100
  const py = 100 + Math.random() * 600
  const ex = 800 + Math.random() * 150
  const ey = 100 + Math.random() * 600
  const obs = []
  const midX = (px + ex) / 2
  const midY = (py + ey) / 2
  obs.push({
    x: midX + (Math.random() - 0.5) * 100,
    y: midY + (Math.random() - 0.5) * 100,
    r: 45 + Math.random() * 25,
  })
  for (let i = 0; i < Math.min(id + 2, 10); i++) {
    obs.push({
      x: 200 + Math.random() * 550,
      y: 50 + Math.random() * 700,
      r: 25 + Math.random() * 40,
    })
  }
  return {
    id,
    title: `Sniper Campaign ${id}`,
    tutorial: 'Đường bắn thẳng đã bị khóa!',
    hint: `Target: ${Math.round(ex)}, ${Math.round(ey)}`,
    playerPos: { x: px, y: py },
    enemyPos: { x: ex, y: ey },
    obstacles: obs,
    defaultPath: '',
  }
}

const loadLevel = (idx: number) => {
  if (idx < levels.length) currentLevel.value = levels[idx]!
  else currentLevel.value = generateRandomLevel(idx + 1)
  currentLevelIdx.value = idx
  rawInput.value = ''
  gameStatus.value = 'idle'
  showTutorial.value = true
}

const checkCollision = (): GameStatus => {
  if (!pathRef.value) return 'fail'
  const path = pathRef.value
  const length = path.getTotalLength()
  for (let i = 0; i <= 500; i++) {
    const point = path.getPointAtLength((i / 500) * length)
    for (const ob of currentLevel.value.obstacles) {
      if (Math.sqrt((point.x - ob.x) ** 2 + (point.y - ob.y) ** 2) < ob.r) return 'collision'
    }
  }
  const endPoint = path.getPointAtLength(length)
  const dist = Math.sqrt(
    (endPoint.x - currentLevel.value.enemyPos.x) ** 2 +
      (endPoint.y - currentLevel.value.enemyPos.y) ** 2,
  )
  return dist < 30 ? 'win' : 'fail'
}

const fire = () => {
  if (isFiring.value || !rawInput.value) return
  const numbers = rawInput.value.match(/-?\d+(\.\d+)?/g)
  if (numbers && numbers.some((n) => Math.abs(parseFloat(n)) > 2500)) {
    alert('⚠️ Tọa độ vượt ngưỡng Radar (Tối đa 2500).')
    return
  }
  isFiring.value = true
  gameStatus.value = 'idle'
  setTimeout(() => {
    isFiring.value = false
    gameStatus.value = checkCollision()
  }, 2000)
}

onMounted(() => loadLevel(0))
</script>

<template>
  <div class="flex h-screen bg-[#020617] text-slate-300 font-mono overflow-hidden">
    <div
      class="relative flex-[3] border-r border-slate-800 bg-[#020617] overflow-hidden shadow-inner"
    >
      <svg viewBox="0 0 1000 800" class="w-full h-full">
        <defs>
          <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#1e293b" stroke-width="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        <circle
          v-for="(ob, i) in currentLevel.obstacles"
          :key="i"
          :cx="ob.x"
          :cy="ob.y"
          :r="ob.r"
          fill="#000"
          stroke="#ef4444"
          stroke-width="1.5"
        />
        <path
          v-if="isFiring || gameStatus === 'win'"
          ref="pathRef"
          :d="finalPath"
          fill="none"
          stroke="#22d3ee"
          stroke-width="5"
          stroke-linecap="round"
          stroke-dasharray="4000"
          :class="{ 'animate-shoot': isFiring }"
          class="drop-shadow-[0_0_15px_#22d3ee]"
        />
        <circle
          :cx="currentLevel.playerPos.x"
          :cy="currentLevel.playerPos.y"
          r="22"
          fill="#22d3ee"
          class="animate-pulse"
        />
        <circle :cx="currentLevel.enemyPos.x" :cy="currentLevel.enemyPos.y" r="22" fill="#f43f5e" />
      </svg>

      <div
        v-if="showWiki"
        class="absolute inset-0 z-[60] bg-black/90 backdrop-blur-md flex items-center justify-center p-6"
      >
        <div
          class="bg-slate-900 border border-slate-700 p-10 rounded-3xl max-w-xl relative shadow-2xl"
        >
          <button
            @click="showWiki = false"
            class="absolute top-6 right-6 text-slate-500 hover:text-white text-2xl"
          >
            ✕
          </button>
          <h2 class="text-cyan-400 font-black text-3xl mb-8 tracking-tighter uppercase">
            📖 Path Sniper Wiki
          </h2>
          <div class="space-y-6">
            <div class="bg-white/5 p-5 rounded-2xl border border-white/5">
              <p class="text-cyan-300 font-bold mb-1 uppercase text-[10px]">Lệnh L (Line)</p>
              <code class="text-white text-lg">L x y</code>
            </div>
            <div class="bg-white/5 p-5 rounded-2xl border border-white/5">
              <p class="text-cyan-300 font-bold mb-1 uppercase text-[10px]">Lệnh Q (Quadratic)</p>
              <code class="text-white text-lg">Q x1 y1 x2 y2</code>
            </div>
          </div>
        </div>
      </div>

      <div
        v-if="showTutorial"
        class="absolute inset-0 z-50 bg-black/95 flex items-center justify-center p-6 text-center"
      >
        <div
          class="bg-slate-900 border border-cyan-500/50 p-12 rounded-[2.5rem] max-w-lg shadow-2xl"
        >
          <h2 class="text-white font-black text-4xl mb-4 italic uppercase">
            MISSION {{ currentLevel.id }}
          </h2>
          <p class="text-slate-400 mb-10 leading-relaxed">{{ currentLevel.tutorial }}</p>
          <button
            @click="showTutorial = false"
            class="w-full py-5 bg-cyan-600 hover:bg-cyan-500 rounded-2xl font-black text-white uppercase tracking-widest"
          >
            Start Radar
          </button>
        </div>
      </div>

      <div
        v-if="gameStatus !== 'idle'"
        class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 text-center scale-110"
      >
        <div
          v-if="gameStatus === 'win'"
          class="bg-green-600 text-white p-10 rounded-[2.5rem] shadow-[0_0_80px_rgba(22,163,74,0.5)]"
        >
          <h1 class="text-5xl font-black italic mb-2 tracking-tighter">ELIMINATED!</h1>
          <button
            @click="loadLevel(currentLevelIdx + 1)"
            class="w-full py-4 bg-white text-green-700 rounded-2xl font-black uppercase"
          >
            Next Level
          </button>
        </div>
        <div
          v-else
          class="bg-rose-700 text-white p-10 rounded-[2.5rem] shadow-[0_0_80px_rgba(190,18,60,0.5)]"
        >
          <h1 class="text-5xl font-black italic mb-2 tracking-tighter uppercase">
            {{ gameStatus === 'collision' ? 'Crashed' : 'Missed' }}
          </h1>
          <button
            @click="gameStatus = 'idle'"
            class="w-full py-4 bg-white text-rose-700 rounded-2xl font-black uppercase"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>

    <div class="w-96 p-8 bg-slate-950 flex flex-col gap-6 border-l border-white/5 shadow-2xl">
      <div class="flex justify-between items-center">
        <h1 class="text-xl font-black italic text-white tracking-tighter uppercase tracking-widest">
          Path <span class="text-cyan-400">Sniper</span>
        </h1>
        <button
          @click="showWiki = true"
          class="p-2.5 bg-white/5 rounded-xl hover:bg-white/10 text-cyan-400 border border-white/5"
        >
          📖
        </button>
      </div>
      <div class="space-y-3 p-5 bg-slate-900/50 rounded-2xl border border-white/5">
        <div class="flex justify-between items-center text-[10px] font-bold uppercase">
          <span class="text-slate-500">Your Origin (M)</span
          ><span class="text-cyan-400 font-mono"
            >{{ Math.round(currentLevel.playerPos.x) }},
            {{ Math.round(currentLevel.playerPos.y) }}</span
          >
        </div>
        <div class="flex justify-between items-center text-[10px] font-bold uppercase">
          <span class="text-slate-500">Target Dest</span
          ><span class="text-rose-500 font-mono"
            >{{ Math.round(currentLevel.enemyPos.x) }},
            {{ Math.round(currentLevel.enemyPos.y) }}</span
          >
        </div>
      </div>
      <textarea
        v-model="rawInput"
        class="flex-1 bg-black/80 p-6 rounded-2xl border border-slate-800 text-cyan-300 font-mono text-sm resize-none focus:border-cyan-500 focus:outline-none"
        placeholder="Enter Path (e.g. L 800 400)..."
      ></textarea>
      <button
        @click="fire"
        :disabled="isFiring || !rawInput"
        class="py-5 bg-gradient-to-br from-cyan-600 to-blue-700 text-white font-black rounded-2xl uppercase tracking-widest active:scale-95 transition-all"
      >
        FIRE
      </button>
      <button @click="$emit('back')" class="text-[10px] uppercase opacity-30 hover:opacity-100">
        Về sảnh chính
      </button>
    </div>
  </div>
</template>

<style scoped>
.animate-shoot {
  stroke-dashoffset: 4000;
  animation: dash 2s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}
@keyframes dash {
  from {
    stroke-dashoffset: 4000;
  }
  to {
    stroke-dashoffset: 0;
  }
}
circle[fill='#000'] {
  filter: drop-shadow(0 0 5px rgba(255, 0, 0, 0.3));
}
</style>
