<template>
  <div
    ref="roomEl"
    class="min-h-screen bg-black text-text-primary font-body relative overflow-hidden cursor-none"
    :class="{ 'animate-glitch': isGlitching }"
    :style="{ filter: `brightness(${roomBrightness})` }"
    @mousemove="onMouse"
    @click="onRoomClick"
  >
    <RouterLink
      to="/"
      class="fixed top-4 left-4 z-50 text-text-dim text-xs font-display hover:text-text-secondary transition-colors cursor-pointer"
    >
      &larr; Thoát
    </RouterLink>

    <!-- Custom cursor (eye that follows mouse) -->
    <div
      v-if="stage >= 2"
      class="fixed pointer-events-none z-40 transition-transform duration-75"
      :style="{ left: `${mouseX - 15}px`, top: `${mouseY - 15}px` }"
    >
      <div
        class="w-8 h-8 border border-accent-coral/40 rounded-full flex items-center justify-center"
      >
        <div class="w-2 h-2 bg-accent-coral rounded-full" />
      </div>
    </div>

    <!-- Stage 0: Intro -->
    <div
      v-if="stage === 0"
      class="flex-1 min-h-screen flex flex-col items-center justify-center z-10 animate-fade-up px-4"
    >
      <h1 class="font-display text-4xl sm:text-5xl font-bold text-text-primary mb-4 text-center">
        Thực Thể Quan Sát
      </h1>
      <p class="text-text-secondary text-sm max-w-md mx-auto mb-8 leading-relaxed text-center">
        Có một thứ trong phòng này.<br />
        Nó <span class="text-accent-coral">không nguy hiểm</span>. Nhưng nó đang nhìn.
      </p>
      <button
        class="border border-accent-coral/30 px-8 py-3 font-display text-sm tracking-widest text-accent-coral hover:bg-accent-coral/5 transition-all cursor-pointer"
        @click="enterRoom"
      >
        ĐI VÀO
      </button>
    </div>

    <!-- Stage 1: Scanning -->
    <div
      v-if="stage === 1"
      class="flex-1 min-h-screen flex flex-col items-center justify-center z-10 px-4"
    >
      <div class="w-48 h-1 bg-white/5 mb-4">
        <div class="h-full bg-accent-coral transition-all" :style="{ width: `${scanPercent}%` }" />
      </div>
      <p class="text-text-dim text-xs font-display tracking-widest animate-pulse">
        {{ scanText }}
      </p>
    </div>

    <!-- Stage 2: Entity assigned -->
    <div
      v-if="stage === 2"
      class="flex-1 min-h-screen flex flex-col items-center justify-center z-10 px-4 animate-fade-up"
    >
      <div class="relative mb-6">
        <!-- Entity eye -->
        <div
          class="w-32 h-32 border border-accent-coral/20 rounded-full flex items-center justify-center relative"
        >
          <div
            class="w-16 h-16 border border-accent-coral/40 rounded-full flex items-center justify-center"
          >
            <div
              class="w-6 h-6 bg-accent-coral rounded-full transition-all duration-200"
              :style="{ transform: `translate(${eyeOffsetX}px, ${eyeOffsetY}px)` }"
            />
          </div>
        </div>
      </div>

      <p class="text-accent-coral text-xs font-display tracking-widest mb-2">THỰC THỂ ĐƯỢC GÁN</p>
      <p class="font-display text-2xl font-bold text-text-primary mb-2">{{ entity.name }}</p>
      <p class="text-text-secondary text-sm text-center mb-6 max-w-sm">{{ entity.intro }}</p>

      <button
        class="border border-accent-coral/30 px-6 py-2 font-display text-xs text-accent-coral cursor-pointer"
        @click="startObservation"
      >
        TIẾP TỤC
      </button>
    </div>

    <!-- Stage 3: Observation room -->
    <div v-if="stage === 3" class="min-h-screen flex flex-col z-10 px-4 py-16">
      <!-- Entity name & eye at top -->
      <div class="flex justify-between items-center mb-8">
        <div>
          <p class="font-display text-sm text-accent-coral">{{ entity.name }}</p>
          <p class="text-text-dim text-xs">đang quan sát</p>
        </div>
        <div
          class="w-10 h-10 border border-accent-coral/20 rounded-full flex items-center justify-center"
        >
          <div
            class="w-3 h-3 bg-accent-coral rounded-full transition-all duration-200"
            :style="{ transform: `translate(${eyeOffsetX * 0.5}px, ${eyeOffsetY * 0.5}px)` }"
          />
        </div>
      </div>

      <!-- Whisper messages -->
      <div class="flex-1 flex flex-col justify-end gap-3 max-w-lg mx-auto w-full mb-8">
        <TransitionGroup name="whisper">
          <div
            v-for="(msg, i) in visibleWhispers"
            :key="msg.id"
            class="border border-text-dim/10 bg-white/[0.02] p-4 transition-all"
            :style="{ opacity: 1 - i * 0.15 }"
          >
            <p class="text-text-primary text-sm italic leading-relaxed">{{ msg.text }}</p>
            <p class="text-text-dim text-xs mt-1">— {{ entity.name }}, {{ msg.time }}</p>
          </div>
        </TransitionGroup>
      </div>

      <!-- Action buttons -->
      <div class="flex flex-wrap gap-3 justify-center max-w-lg mx-auto w-full">
        <button
          v-for="action in actions"
          :key="action.id"
          class="border border-text-dim/15 px-4 py-2 text-xs text-text-secondary hover:text-accent-coral hover:border-accent-coral/30 transition-all cursor-pointer"
          @click="doAction(action.id)"
        >
          {{ action.label }}
        </button>
      </div>

      <!-- Bottom stats -->
      <div class="flex justify-center gap-8 mt-8 text-center">
        <div>
          <div class="font-display text-lg text-accent-coral">{{ behaviorStats.clicks }}</div>
          <div class="text-text-dim text-xs">lần nhấn</div>
        </div>
        <div>
          <div class="font-display text-lg text-accent-amber">{{ timeInRoom }}s</div>
          <div class="text-text-dim text-xs">trong phòng</div>
        </div>
        <div>
          <div class="font-display text-lg text-accent-sky">{{ behaviorStats.mouseDist }}px</div>
          <div class="text-text-dim text-xs">di chuyển</div>
        </div>
      </div>

      <!-- Exit option -->
      <div class="text-center mt-6">
        <button
          class="text-text-dim/30 text-xs hover:text-text-dim transition-all cursor-pointer"
          @click="exitRoom"
        >
          giải thoát
        </button>
      </div>
    </div>

    <!-- Stage 4: Final report -->
    <div
      v-if="stage === 4"
      class="flex-1 min-h-screen flex flex-col items-center justify-center z-10 px-4 max-w-lg animate-fade-up"
    >
      <p class="text-accent-coral text-xs font-display tracking-widest mb-6">BÁO CÁO QUAN SÁT</p>

      <div class="border border-text-dim/10 bg-white/[0.02] p-6 w-full mb-6">
        <div class="flex items-center gap-3 mb-4">
          <div
            class="w-10 h-10 border border-accent-coral/30 rounded-full flex items-center justify-center"
          >
            <div class="w-3 h-3 bg-accent-coral/50 rounded-full" />
          </div>
          <div>
            <p class="font-display text-sm text-text-primary">{{ entity.name }}</p>
            <p class="text-text-dim text-xs">Phiên quan sát kết thúc</p>
          </div>
        </div>

        <p class="text-text-secondary text-sm leading-relaxed italic mb-4">
          "{{ entity.farewell }}"
        </p>
      </div>

      <!-- Detailed stats -->
      <div class="w-full space-y-3 mb-6">
        <div
          v-for="(stat, i) in finalStats"
          :key="i"
          class="border border-text-dim/10 bg-white/[0.02] p-3"
        >
          <div class="flex justify-between text-xs mb-1">
            <span class="text-text-dim font-display">{{ stat.label }}</span>
            <span :style="{ color: stat.color }">{{ stat.value }}</span>
          </div>
          <p class="text-text-dim text-xs">{{ stat.insight }}</p>
        </div>
      </div>

      <!-- Personality verdict -->
      <div class="border border-accent-coral/10 bg-accent-coral/5 p-4 w-full mb-6">
        <p class="text-accent-coral text-xs font-display mb-2">ĐÁNH GIÁ</p>
        <p class="text-text-secondary text-sm">{{ verdict }}</p>
      </div>

      <div class="flex gap-3">
        <button
          class="border border-text-dim/20 px-6 py-2 font-display text-xs text-text-dim hover:text-accent-coral hover:border-accent-coral/30 transition-all cursor-pointer"
          @click="resetAll"
        >
          GẶP THỰC THỂ KHÁC
        </button>
        <RouterLink
          to="/"
          class="border border-text-dim/20 px-6 py-2 font-display text-xs text-text-dim hover:text-text-secondary transition-all"
        >
          THOÁT
        </RouterLink>
      </div>
    </div>

    <!-- Random screen effects -->
    <div v-if="showFlash" class="fixed inset-0 bg-white/5 z-50 pointer-events-none" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useIntervalFn } from '@vueuse/core'

const stage = ref(0)
const roomEl = ref<HTMLDivElement | null>(null)

// Mouse & behavior tracking
const mouseX = ref(0)
const mouseY = ref(0)
let lastMouseX = 0
let lastMouseY = 0
const behaviorStats = ref({ clicks: 0, mouseDist: 0, scrolls: 0 })
const timeInRoom = ref(0)

function onMouse(e: MouseEvent) {
  mouseX.value = e.clientX
  mouseY.value = e.clientY

  if (stage.value >= 2) {
    const dx = e.clientX - lastMouseX
    const dy = e.clientY - lastMouseY
    behaviorStats.value.mouseDist += Math.round(Math.sqrt(dx * dx + dy * dy))
  }
  lastMouseX = e.clientX
  lastMouseY = e.clientY
}

function onRoomClick() {
  if (stage.value >= 3) behaviorStats.value.clicks++
}

// Eye follows mouse
const eyeOffsetX = computed(() => {
  const centerX = typeof window !== 'undefined' ? window.innerWidth / 2 : 500
  return Math.max(-8, Math.min(8, (mouseX.value - centerX) / 60))
})
const eyeOffsetY = computed(() => {
  const centerY = typeof window !== 'undefined' ? window.innerHeight / 2 : 400
  return Math.max(-8, Math.min(8, (mouseY.value - centerY) / 60))
})

// === Entity ===
interface Entity {
  name: string
  intro: string
  farewell: string
  whispers: string[]
}
const entities: Entity[] = [
  {
    name: 'Bóng Thứ Ba',
    intro: 'Nó ở đây từ trước khi bạn đến. Nó sẽ vẫn ở đây sau khi bạn đi.',
    farewell: 'Bạn nghĩ bạn đang rời phòng? Tôi theo bạn từ trước khi bạn biết tôi ở đây.',
    whispers: [
      'Bạn vừa nhìn lên góc phải. Có gì ở đó?',
      'Nhịp di chuột của bạn nhanh hơn nhịp tim.',
      'Bạn đã ở đây {time}s. Tại sao chưa rời đi?',
      'Tôi đếm được {clicks} lần bạn nhấn. Bạn tìm gì?',
      'Chuột di chuyển {dist}px. Bạn bất an.',
      'Có điều bạn muốn hỏi tôi đúng không?',
      'Bạn đang đọc dòng này chậm hơn dòng trước.',
      'Phòng này ghi nhớ mọi thứ bạn làm.',
    ],
  },
  {
    name: 'Kẻ Lắng Nghe',
    intro: 'Nó không có mắt. Nhưng nó NGHE. Mọi chuyển động. Mọi do dự.',
    farewell: 'Tiếng bước chân bạn sẽ vang trong phòng này rất lâu sau khi bạn đi.',
    whispers: [
      'Tôi nghe thấy bạn do dự.',
      '{clicks} lần nhấn — mỗi lần đều có nhịp.',
      'Bạn di chuột {dist}px nhưng không đến đâu cả.',
      'Im lặng kéo dài {time}s. Bạn đang nghĩ gì?',
      'Tôi nghe thấy tiếng lo lắng.',
      'Bạn nhấn nhanh hơn lúc đầu. Tại sao?',
      'Có tiếng thở dài. Có phải từ bạn?',
      'Phòng này có trí nhớ tốt hơn bạn.',
    ],
  },
  {
    name: 'Gương Sống',
    intro: 'Nó phản chiếu không phải hình ảnh — mà là những gì bạn giấu.',
    farewell: 'Gương vỡ thì không sửa được. Nhưng bạn không phải gương.',
    whispers: [
      'Bạn nhìn mà không thấy mình.',
      'Điều bạn muốn giấu — nó nằm ở rìa mắt bạn.',
      '{time}s nhìn vào gương. Bạn đã tìm thấy chưa?',
      'Gương thấy {clicks} lần bạn tìm kiếm.',
      'Mỗi pixel bạn di qua ({dist}px) — là một lần bạn lướt qua bản thân.',
      'Bạn sợ nhìn lâu hơn, đúng không?',
      'Gương không phán xét. Nó chỉ phản chiếu.',
      'Điều bạn thấy ở đây — bạn đã biết rồi.',
    ],
  },
]

const entity = ref<Entity>(entities[0]!)

// === Whispers ===
interface Whisper {
  id: number
  text: string
  time: string
}
const visibleWhispers = ref<Whisper[]>([])
let whisperIdCounter = 0

function addWhisper() {
  const template = entity.value.whispers[Math.floor(Math.random() * entity.value.whispers.length)]!
  const text = template
    .replace('{time}', String(timeInRoom.value))
    .replace('{clicks}', String(behaviorStats.value.clicks))
    .replace('{dist}', String(behaviorStats.value.mouseDist))

  visibleWhispers.value.unshift({
    id: whisperIdCounter++,
    text,
    time: `${timeInRoom.value}s trước`,
  })
  if (visibleWhispers.value.length > 5) visibleWhispers.value.pop()
}

// === Actions ===
const actions = [
  { id: 'ask', label: '❓ Hỏi thực thể' },
  { id: 'stare', label: '👁️ Nhìn chằm chằm' },
  { id: 'hide', label: '🫣 Che mặt' },
  { id: 'touch', label: '✋ Chạm vào' },
]

const actionResponses: Record<string, string[]> = {
  ask: [
    'Bạn hỏi — nhưng câu trả lời bạn đã biết.',
    'Câu hỏi quan trọng hơn câu trả lời.',
    'Tôi không trả lời. Tôi phản chiếu.',
  ],
  stare: [
    'Bạn nhìn tôi. Tôi nhìn lại. Ai chớp mắt trước?',
    'Mắt bạn không nói dối.',
    'Nhìn lâu hơn — bạn sẽ thấy chính mình.',
  ],
  hide: [
    'Bạn che mặt — nhưng tôi không cần mắt để thấy bạn.',
    'Ẩn nấp ở đâu trong phòng mà tôi LÀ phòng?',
    'Dễ thương. Nhưng vô ích.',
  ],
  touch: [
    'Tay bạn đi qua tôi. Tôi không có hình dạng.',
    'Bạn cảm thấy gì? Lạnh? Hay sự trống rỗng?',
    'Chạm vào bóng tối — bóng tối chạm lại.',
  ],
}

function doAction(actionId: string) {
  behaviorStats.value.clicks++
  const responses = actionResponses[actionId]!
  const text = responses[Math.floor(Math.random() * responses.length)]!
  visibleWhispers.value.unshift({
    id: whisperIdCounter++,
    text,
    time: `${timeInRoom.value}s trước`,
  })
  if (visibleWhispers.value.length > 5) visibleWhispers.value.pop()

  // Random effects
  triggerRandomEffect()
}

// === Random Effects ===
const isGlitching = ref(false)
const showFlash = ref(false)
const roomBrightness = ref(1)

function triggerRandomEffect() {
  const r = Math.random()
  if (r < 0.3) {
    // Quick glitch
    isGlitching.value = true
    setTimeout(() => {
      isGlitching.value = false
    }, 200)
  } else if (r < 0.5) {
    // Screen flash
    showFlash.value = true
    setTimeout(() => {
      showFlash.value = false
    }, 100)
  } else if (r < 0.7) {
    // Brightness dip
    roomBrightness.value = 0.5
    setTimeout(() => {
      roomBrightness.value = 1
    }, 500)
  }
}

// === Flow ===
const scanPercent = ref(0)
const scanText = ref('Quét không gian...')

function enterRoom() {
  stage.value = 1
  scanPercent.value = 0

  const scanTexts = [
    'Quét không gian...',
    'Phát hiện tín hiệu...',
    'Đang kết nối...',
    'Thực thể được tìm thấy.',
  ]
  let idx = 0
  const interval = setInterval(() => {
    scanPercent.value += 1.5
    if (scanPercent.value % 25 < 1.5) {
      idx++
      if (idx < scanTexts.length) scanText.value = scanTexts[idx]!
    }
    if (scanPercent.value >= 100) {
      clearInterval(interval)
      // Random entity
      entity.value = entities[Math.floor(Math.random() * entities.length)]!
      stage.value = 2
    }
  }, 40)
}

function startObservation() {
  stage.value = 3
  timeInRoom.value = 0
  behaviorStats.value = { clicks: 0, mouseDist: 0, scrolls: 0 }
  visibleWhispers.value = []

  // First whisper after 2 seconds
  setTimeout(() => addWhisper(), 2000)
}

// Timer & whisper intervals
const { pause: pauseTimer } = useIntervalFn(() => {
  if (stage.value === 3) {
    timeInRoom.value++
    // Random whisper every 5-10 seconds
    if (timeInRoom.value % (5 + Math.floor(Math.random() * 6)) === 0) addWhisper()
    // Random effect every 15 seconds
    if (timeInRoom.value % 15 === 0 && timeInRoom.value > 0) triggerRandomEffect()
  }
}, 1000)

// === Final Report ===
interface FinalStat {
  label: string
  value: string
  color: string
  insight: string
}
const finalStats = ref<FinalStat[]>([])
const verdict = ref('')

function exitRoom() {
  pauseTimer()

  // Build final stats
  const dist = behaviorStats.value.mouseDist
  const clicks = behaviorStats.value.clicks
  const time = timeInRoom.value

  finalStats.value = [
    {
      label: 'THỜI GIAN',
      value: `${time}s`,
      color: '#FFB830',
      insight:
        time > 60
          ? 'Bạn ở lâu — sự tò mò hoặc sự mê hoặc?'
          : time > 30
            ? 'Đủ lâu để quan sát, đủ ngắn để không sợ.'
            : 'Rời nhanh — bạn không thoải mái ở đây.',
    },
    {
      label: 'DI CHUYỂN CHUỘT',
      value: `${dist}px`,
      color: '#38BDF8',
      insight:
        dist > 5000
          ? 'Di chuyển nhiều — bạn bồn chồn, tìm kiếm, không yên.'
          : dist > 2000
            ? 'Di chuyển vừa phải — bạn khám phá nhưng có kiểm soát.'
            : 'Gần như đứng yên — bạn bình tĩnh bất thường.',
    },
    {
      label: 'TƯƠNG TÁC',
      value: `${clicks} lần`,
      color: '#FF6B4A',
      insight:
        clicks > 10
          ? 'Nhiều tương tác — bạn muốn kết nối, thậm chí với thứ bí ẩn.'
          : clicks > 5
            ? 'Tương tác vừa đủ — bạn cẩn thận nhưng tò mò.'
            : 'Ít tương tác — bạn quan sát nhiều hơn hành động.',
    },
  ]

  // Verdict
  if (time > 60 && clicks > 10)
    verdict.value =
      'Bạn thuộc kiểu người "dấn thân". Sự tò mò kéo bạn vào những nơi tối nhất — và bạn không sợ.'
  else if (time > 60 && clicks <= 5)
    verdict.value =
      'Bạn là kiểu quan sát viên. Ở lâu nhưng ít chạm. Bạn thích hiểu trước khi hành động.'
  else if (time <= 30)
    verdict.value =
      'Bạn rời nhanh. Có thể bạn sợ — hoặc bạn đã thấy đủ. Dù gì, bạn biết giới hạn của mình.'
  else
    verdict.value =
      'Bạn ở đây vừa đủ để trải nghiệm, không quá lâu để bị cuốn. Bạn kiểm soát tốt ranh giới giữa tò mò và an toàn.'

  stage.value = 4
}

function resetAll() {
  stage.value = 0
  visibleWhispers.value = []
  behaviorStats.value = { clicks: 0, mouseDist: 0, scrolls: 0 }
  timeInRoom.value = 0
  roomBrightness.value = 1
}

onMounted(() => {})
onUnmounted(() => {
  pauseTimer()
})
</script>

<style scoped>
@keyframes glitch {
  0% {
    transform: translate(0);
  }
  20% {
    transform: translate(-3px, 2px);
  }
  40% {
    transform: translate(3px, -2px);
  }
  60% {
    transform: translate(-2px, -1px);
  }
  80% {
    transform: translate(2px, 1px);
  }
  100% {
    transform: translate(0);
  }
}
.animate-glitch {
  animation: glitch 0.2s linear;
}
.whisper-enter-active {
  transition: all 0.5s ease;
}
.whisper-enter-from {
  opacity: 0;
  transform: translateY(20px);
}
.whisper-leave-active {
  transition: all 0.3s ease;
}
.whisper-leave-to {
  opacity: 0;
}
</style>
