<template>
  <div
    class="min-h-screen bg-black text-text-primary font-body flex flex-col items-center relative overflow-hidden select-none"
  >
    <RouterLink
      to="/"
      class="fixed top-4 left-4 z-50 text-text-dim text-xs font-display hover:text-text-secondary transition-colors"
    >
      &larr; Thoát
    </RouterLink>

    <!-- Fire canvas at bottom -->
    <canvas ref="fireCanvas" class="fixed bottom-0 left-0 w-full h-48 z-30 pointer-events-none" />

    <!-- Stage 0: Intro -->
    <div
      v-if="stage === 0"
      class="flex-1 flex flex-col items-center justify-center z-10 animate-fade-up px-4"
    >
      <h1 class="font-display text-4xl sm:text-5xl font-bold text-text-primary mb-4 text-center">
        Buồng Xóa Nghiệp
      </h1>
      <p class="text-text-secondary text-sm max-w-md mx-auto mb-8 leading-relaxed text-center">
        Viết điều bạn hối tiếc lên giấy.<br />
        Rồi <span class="text-accent-coral">đốt nó</span>.
      </p>
      <button
        class="border border-accent-coral/30 px-8 py-3 font-display text-sm tracking-widest text-accent-coral hover:bg-accent-coral/5 transition-all"
        @click="stage = 1"
      >
        BƯỚC VÀO BUỒNG
      </button>
    </div>

    <!-- Stage 1: Choose type -->
    <div
      v-if="stage === 1"
      class="flex-1 flex flex-col items-center justify-center z-10 px-4 animate-fade-up"
    >
      <p class="text-text-dim text-xs font-display tracking-widest mb-6">CHỌN LOẠI NGHIỆP</p>
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-md">
        <button
          v-for="(type, i) in regretTypes"
          :key="i"
          class="border border-text-dim/15 p-4 flex flex-col items-center gap-2 hover:border-accent-coral/30 hover:bg-accent-coral/5 transition-all"
          @click="selectType(i)"
        >
          <span class="text-2xl">{{ type.icon }}</span>
          <span class="text-text-secondary text-xs">{{ type.name }}</span>
        </button>
      </div>
    </div>

    <!-- Stage 2: Write on paper -->
    <div
      v-if="stage === 2"
      class="flex-1 flex flex-col items-center justify-center z-10 px-4 w-full"
    >
      <p class="text-text-dim text-xs font-display tracking-widest mb-4">
        {{ regretTypes[selectedType]!.icon }} {{ regretTypes[selectedType]!.name }}
      </p>

      <!-- Paper simulation -->
      <div
        ref="paperEl"
        class="relative w-full max-w-md bg-amber-50/5 border border-amber-100/10 p-6 mb-6"
        :style="{ transform: isDragging ? 'scale(0.95) rotate(-2deg)' : '' }"
      >
        <textarea
          v-model="regretText"
          placeholder="Viết điều bạn muốn xóa đi..."
          class="w-full h-48 bg-transparent text-amber-100/80 text-sm resize-none focus:outline-none placeholder:text-amber-100/20 font-body leading-relaxed"
          :style="{
            backgroundImage:
              'repeating-linear-gradient(transparent, transparent 27px, rgba(255,200,100,0.05) 27px, rgba(255,200,100,0.05) 28px)',
          }"
          maxlength="500"
        />
        <div class="absolute bottom-2 right-3 text-amber-100/20 text-xs">
          {{ regretText.length }}/500
        </div>
      </div>

      <!-- Instructions -->
      <p class="text-text-dim text-xs mb-4 text-center">
        Viết xong? Kéo tờ giấy xuống ngọn lửa bên dưới.
      </p>

      <!-- Draggable paper replica -->
      <div
        v-if="regretText.trim().length >= 5 && !isDragging && !isBurning"
        class="cursor-grab active:cursor-grabbing"
      >
        <button
          class="border border-accent-coral/30 px-8 py-3 font-display text-sm tracking-widest text-accent-coral hover:bg-accent-coral/5 transition-all"
          @click="startBurn"
        >
          🔥 ĐỐT GIẤY
        </button>
      </div>

      <!-- Burning animation -->
      <div v-if="isBurning" class="text-center">
        <div
          class="inline-block border border-amber-100/10 p-4 max-w-sm transition-all duration-1000"
          :style="{
            opacity: burnProgress < 0.8 ? 1 - burnProgress : 0,
            filter: `blur(${burnProgress * 5}px) brightness(${1 + burnProgress * 2})`,
            transform: `translateY(${burnProgress * 100}px) scale(${1 - burnProgress * 0.3})`,
            color: `rgba(255, ${Math.round(200 - burnProgress * 200)}, ${Math.round(100 - burnProgress * 100)}, ${1 - burnProgress})`,
          }"
        >
          <p class="text-xs whitespace-pre-wrap">{{ regretText }}</p>
        </div>

        <div class="mt-4">
          <div class="w-48 h-1 bg-white/5 mx-auto">
            <div
              class="h-full bg-gradient-to-r from-accent-coral to-accent-amber transition-all duration-300"
              :style="{ width: `${burnProgress * 100}%` }"
            />
          </div>
          <p class="text-accent-coral/60 text-xs mt-2 font-display animate-pulse">
            {{
              burnProgress < 0.3
                ? 'Giấy bắt lửa...'
                : burnProgress < 0.6
                  ? 'Đang cháy...'
                  : burnProgress < 0.9
                    ? 'Gần hết...'
                    : 'Tro tàn...'
            }}
          </p>
        </div>
      </div>
    </div>

    <!-- Stage 3: Ash / Aftermath -->
    <div
      v-if="stage === 3"
      class="flex-1 flex flex-col items-center justify-center z-10 px-4 max-w-lg"
    >
      <!-- Ash particles -->
      <canvas ref="ashCanvas" class="w-48 h-48 mb-6" />

      <div class="animate-fade-up text-center">
        <p class="font-display text-xl text-accent-amber mb-4">Đã xóa.</p>
        <p class="text-text-secondary text-sm leading-relaxed mb-8">
          Tờ giấy đã thành tro. Những dòng chữ đã tan.
        </p>
      </div>

      <button
        class="border border-text-dim/20 px-6 py-2 font-display text-xs text-text-dim hover:text-accent-coral transition-all animate-fade-up"
        style="animation-delay: 2s"
        @click="stage = 4"
      >
        ...
      </button>
    </div>

    <!-- Stage 4: The twist -->
    <div
      v-if="stage === 4"
      class="flex-1 flex flex-col items-center justify-center z-10 px-4 max-w-lg animate-fade-up"
    >
      <p class="text-accent-coral font-display text-sm tracking-widest mb-4">NHƯNG...</p>
      <p class="text-text-primary text-xl font-display italic mb-6 text-center">
        "Bạn vẫn nhớ nó."
      </p>

      <!-- Show what they wrote, faded -->
      <div class="border border-text-dim/10 bg-white/[0.02] p-6 w-full mb-6">
        <p class="text-text-dim/30 text-sm italic whitespace-pre-wrap mb-4">{{ regretText }}</p>
        <p class="text-text-secondary text-xs leading-relaxed">
          {{ twistMessages[selectedType] }}
        </p>
      </div>

      <!-- Behavioral observation -->
      <div class="border border-accent-amber/10 bg-accent-amber/5 p-4 w-full mb-6">
        <p class="text-accent-amber text-xs font-display mb-2">BUỒNG ĐÃ QUAN SÁT</p>
        <div class="space-y-1">
          <p v-for="(obs, i) in burnObservations" :key="i" class="text-text-dim text-xs flex gap-2">
            <span class="text-accent-coral">▸</span> {{ obs }}
          </p>
        </div>
      </div>

      <!-- Wisdom -->
      <p class="text-text-dim/50 text-xs italic text-center mb-6">
        "Lửa xóa được giấy, nhưng không xóa được ký ức.<br />
        Và có lẽ, điều bạn cần không phải quên —<br />
        mà là được nói ra."
      </p>

      <div class="flex gap-3 flex-wrap justify-center">
        <button
          class="border border-text-dim/20 px-6 py-2 font-display text-xs text-text-dim hover:text-accent-coral hover:border-accent-coral/30 transition-all"
          @click="resetAll"
        >
          XÓA ĐIỀU KHÁC
        </button>
        <RouterLink
          to="/"
          class="border border-text-dim/20 px-6 py-2 font-display text-xs text-text-dim hover:text-text-secondary transition-all"
        >
          RỜI BUỒNG
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'

const stage = ref(0)
const fireCanvas = ref<HTMLCanvasElement | null>(null)
const ashCanvas = ref<HTMLCanvasElement | null>(null)
const paperEl = ref<HTMLDivElement | null>(null)

const regretText = ref('')
const selectedType = ref(0)
const isDragging = ref(false)
const isBurning = ref(false)
const burnProgress = ref(0)
const burnObservations = ref<string[]>([])

const regretTypes = [
  { icon: '💔', name: 'Tình yêu' },
  { icon: '🗣️', name: 'Lời chưa nói' },
  { icon: '⏳', name: 'Thời gian lãng phí' },
  { icon: '🤝', name: 'Phản bội niềm tin' },
  { icon: '😔', name: 'Cơ hội bỏ lỡ' },
  { icon: '👤', name: 'Điều khác' },
]

const twistMessages = [
  'Bạn chọn đốt chuyện tình cảm. Nhưng bạn gõ nó ra — nghĩa là nó vẫn sống trong bạn. Hối tiếc trong tình yêu không phải gánh nặng. Nó là bằng chứng bạn đã yêu thật.',
  'Lời chưa nói thì đốt bao nhiêu cũng không hết. Vì nó không nằm trên giấy — nó nằm giữa bạn và người đó. Có lẽ bạn cần nói, chứ không phải đốt.',
  'Thời gian đã qua thì không lấy lại được. Nhưng việc bạn viết nó ra nghĩa là bạn đã nhận ra. Đó là bước đầu tiên để không lặp lại.',
  'Phản bội niềm tin — của ai? Của người khác hay của chính bạn? Dù gì thì bạn đang ở đây, thừa nhận. Đó đã là dũng cảm.',
  'Cơ hội bỏ lỡ thì không quay lại. Nhưng cơ hội mới thì vẫn đến mỗi ngày. Câu hỏi là: lần tới bạn có dám bắt lấy không?',
  'Bạn gọi nó là "điều khác" — nhưng nó rõ ràng không "khác" với bạn. Nó đủ lớn để bạn phải đến đây.',
]

let writeStartTime = 0
let pauseCount = 0
let lastTypeTime = 0

function selectType(i: number) {
  selectedType.value = i
  stage.value = 2
  writeStartTime = Date.now()
}

// Track typing behavior
watch(regretText, () => {
  const now = Date.now()
  if (lastTypeTime && now - lastTypeTime > 3000) pauseCount++
  lastTypeTime = now
})

function startBurn() {
  isBurning.value = true
  burnProgress.value = 0

  // Burn animation over 4 seconds
  const start = Date.now()
  const interval = setInterval(() => {
    burnProgress.value = Math.min(1, (Date.now() - start) / 4000)
    if (burnProgress.value >= 1) {
      clearInterval(interval)
      // Build observations
      buildObservations()
      setTimeout(() => {
        stage.value = 3
        nextTick(() => drawAsh())
      }, 500)
    }
  }, 30)
}

function buildObservations() {
  const elapsed = (Date.now() - writeStartTime) / 1000
  const obs: string[] = []

  if (elapsed > 120)
    obs.push(
      `Bạn mất ${Math.round(elapsed / 60)} phút để viết — những thứ nặng nhất thường khó gõ nhất`,
    )
  else if (elapsed < 15)
    obs.push('Bạn viết rất nhanh — như đã nghĩ sẵn từ lâu, chỉ chờ nơi để đổ ra')

  if (regretText.value.length > 200)
    obs.push('Bạn viết nhiều — nỗi niềm này lớn hơn bạn thường thể hiện')
  else if (regretText.value.length < 30)
    obs.push('Vài dòng thôi — nhưng buồng thấy nó nặng hơn ngàn trang')

  if (pauseCount > 2)
    obs.push(`Bạn dừng ${pauseCount} lần — có những đoạn nên viết mà bạn chọn không viết`)

  if (regretText.value.includes('?'))
    obs.push('Bạn đặt câu hỏi trong hối tiếc — bạn vẫn đang tìm câu trả lời')
  if (regretText.value.includes('!'))
    obs.push('Có dấu chấm than — cảm xúc dâng cao khi viết, đúng không?')

  if (obs.length === 0) obs.push('Buồng ghi nhận sự im lặng giữa những dòng chữ')
  burnObservations.value = obs
}

// === Fire Animation ===
let fireAnimId = 0
interface Ember {
  x: number
  y: number
  size: number
  speed: number
  life: number
  maxLife: number
}
const embers: Ember[] = []

function drawFire() {
  const canvas = fireCanvas.value
  if (!canvas) {
    fireAnimId = requestAnimationFrame(drawFire)
    return
  }
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const dpr = window.devicePixelRatio || 1
  const rect = canvas.getBoundingClientRect()
  canvas.width = rect.width * dpr
  canvas.height = rect.height * dpr
  ctx.scale(dpr, dpr)
  const w = rect.width
  const h = rect.height

  ctx.clearRect(0, 0, w, h)

  const intensity = isBurning.value ? 1.5 : 0.4

  // Add embers
  if (Math.random() < 0.3 * intensity) {
    embers.push({
      x: Math.random() * w,
      y: h,
      size: Math.random() * 3 + 1,
      speed: Math.random() * 2 + 1,
      life: 0,
      maxLife: 40 + Math.random() * 40,
    })
  }

  // Update and draw embers
  for (let i = embers.length - 1; i >= 0; i--) {
    const e = embers[i]!
    e.y -= e.speed * intensity
    e.x += (Math.random() - 0.5) * 2
    e.life++

    const progress = e.life / e.maxLife
    if (progress >= 1) {
      embers.splice(i, 1)
      continue
    }

    const alpha = (1 - progress) * 0.8
    const r = 255
    const g = Math.round(200 - progress * 150)
    const b = Math.round(50 - progress * 50)

    ctx.beginPath()
    ctx.arc(e.x, e.y, e.size * (1 - progress * 0.5), 0, Math.PI * 2)
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`
    ctx.fill()
  }

  // Bottom glow
  const gradient = ctx.createLinearGradient(0, h, 0, h - 60 * intensity)
  gradient.addColorStop(0, `rgba(255, 100, 50, ${0.15 * intensity})`)
  gradient.addColorStop(1, 'transparent')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, w, h)

  fireAnimId = requestAnimationFrame(drawFire)
}

// === Ash Animation ===
let ashAnimId = 0
function drawAsh() {
  const canvas = ashCanvas.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const dpr = window.devicePixelRatio || 1
  const rect = canvas.getBoundingClientRect()
  canvas.width = rect.width * dpr
  canvas.height = rect.height * dpr
  ctx.scale(dpr, dpr)
  const cx = rect.width / 2
  const cy = rect.height / 2
  const time = Date.now() / 1000

  ctx.clearRect(0, 0, rect.width, rect.height)

  // Floating ash particles
  for (let i = 0; i < 40; i++) {
    const angle = (i / 40) * Math.PI * 2 + time * 0.2
    const r = 20 + (i % 5) * 15 + Math.sin(time + i) * 5
    const x = cx + Math.cos(angle) * r
    const y = cy + Math.sin(angle) * r + Math.sin(time * 0.5 + i) * 3

    ctx.beginPath()
    ctx.arc(x, y, 1.5, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(150, 130, 110, ${0.3 + Math.sin(time + i) * 0.15})`
    ctx.fill()
  }

  ashAnimId = requestAnimationFrame(drawAsh)
}

function resetAll() {
  stage.value = 0
  regretText.value = ''
  isBurning.value = false
  burnProgress.value = 0
  burnObservations.value = []
  pauseCount = 0
}

onMounted(() => {
  drawFire()
})
onUnmounted(() => {
  cancelAnimationFrame(fireAnimId)
  cancelAnimationFrame(ashAnimId)
})
</script>
