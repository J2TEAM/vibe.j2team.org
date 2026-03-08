<script setup lang="ts">
import { ref, onUnmounted, onMounted, computed } from 'vue'

type EntityType = 'bug' | 'golden' | 'bomb' | 'coffee' | 'boss' | 'freeze'

interface ActiveEntity {
  index: number
  type: EntityType
  emoji: string
}

interface Particle {
  id: number
  x: number
  y: number
  text: string
  color: string
}

const score = ref(0)
const highScore = ref(0)
const timeLeft = ref(30)
const activeEntity = ref<ActiveEntity | null>(null)
const isGameOver = ref(false)
const message = ref('Sẵn sàng chưa?')
const combo = ref(0)
const isMuted = ref(false)
const cheerText = ref('')
const showCheer = ref(false)

const isBulletTime = ref(false)
const isFrozen = ref(false)
const bossHealth = ref(3)

const particles = ref<Particle[]>([])
const floaters = ref<Particle[]>([])

const bugEmojis = ['🐛', '🐞', '🦟', '🦗', '🕷️']
const codeSnippets = ['ĐÃ FIX', '404', '{ }', '0101', 'BUG', 'XONG', 'ĐÃ MERGE']
const messages = [
  'Đập nó!',
  'Sạch sẽ!',
  'Đã sửa!',
  'Lỗi này lạ quá!',
  'Bug này cứng đầu thế!',
  'Vibe up!',
  'J2TEAM Security!',
  'Code sạch!',
  'Cẩn thận bom!',
  'Nhanh tay lên!',
  'Comboooo!',
]
const cheers = [
  'QUÁ ĐỈNH!',
  'KHÔNG THỂ CẢN PHÁ!',
  'NHƯ MỘT VỊ THẦN!',
  'KẺ DIỆT BUG!',
  'VÃI CHƯỞNG!',
  'HUYỀN THOẠI!',
]

let gameTimeout: ReturnType<typeof setTimeout>
let timerInterval: ReturnType<typeof setInterval>
let effectTimeout: ReturnType<typeof setTimeout>
let audioCtx: AudioContext | null = null

interface WindowWithWebkit extends Window {
  webkitAudioContext?: typeof AudioContext
}

const initAudio = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as WindowWithWebkit).webkitAudioContext)()
  }
}

onMounted(() => {
  const saved = localStorage.getItem('whack-a-bug-highscore')
  if (saved) highScore.value = parseInt(saved)
})

const playSound = (
  type:
    | 'pop'
    | 'whack'
    | 'bomb'
    | 'golden'
    | 'gameover'
    | 'cheer'
    | 'coffee'
    | 'freeze'
    | 'bossHit'
    | 'bossKill',
) => {
  if (isMuted.value || !audioCtx) return
  if (audioCtx.state === 'suspended') audioCtx.resume()

  const now = audioCtx.currentTime
  const osc = audioCtx.createOscillator()
  const gain = audioCtx.createGain()
  osc.connect(gain)
  gain.connect(audioCtx.destination)

  if (type === 'cheer' || type === 'coffee') {
    const notes = type === 'cheer' ? [523, 659, 783, 1046] : [261, 329, 392, 523]
    notes.forEach((freq, i) => {
      const o = audioCtx!.createOscillator()
      const g = audioCtx!.createGain()
      o.connect(g)
      g.connect(audioCtx!.destination)
      o.type = type === 'coffee' ? 'sine' : 'triangle'
      o.frequency.setValueAtTime(freq / (type === 'coffee' ? 2 : 1), now + i * 0.1)
      g.gain.setValueAtTime(0.1, now + i * 0.1)
      g.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.3)
      o.start(now + i * 0.1)
      o.stop(now + i * 0.1 + 0.3)
    })
    return
  }

  if (type === 'freeze') {
    osc.type = 'sine'
    osc.frequency.setValueAtTime(1046, now)
    osc.frequency.linearRampToValueAtTime(1318, now + 0.5)
    gain.gain.setValueAtTime(0.1, now)
    gain.gain.linearRampToValueAtTime(0.01, now + 0.5)
    osc.start(now)
    osc.stop(now + 0.5)
  } else if (type === 'bossHit') {
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(80, now)
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.1)
    gain.gain.setValueAtTime(0.2, now)
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1)
    osc.start(now)
    osc.stop(now + 0.1)
  } else if (type === 'bossKill') {
    osc.type = 'square'
    osc.frequency.setValueAtTime(200, now)
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.4)
    gain.gain.setValueAtTime(0.3, now)
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4)
    osc.start(now)
    osc.stop(now + 0.4)
  } else if (type === 'pop') {
    osc.type = 'sine'
    osc.frequency.setValueAtTime(440, now)
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.1)
    gain.gain.setValueAtTime(0.05, now)
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1)
    osc.start(now)
    osc.stop(now + 0.1)
  } else if (type === 'whack') {
    osc.type = 'square'
    osc.frequency.setValueAtTime(150, now)
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.1)
    gain.gain.setValueAtTime(0.1, now)
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1)
    osc.start(now)
    osc.stop(now + 0.1)
  } else if (type === 'bomb') {
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(100, now)
    osc.frequency.linearRampToValueAtTime(20, now + 0.3)
    gain.gain.setValueAtTime(0.2, now)
    gain.gain.linearRampToValueAtTime(0.01, now + 0.3)
    osc.start(now)
    osc.stop(now + 0.3)
  } else if (type === 'golden') {
    osc.type = 'sine'
    osc.frequency.setValueAtTime(880, now)
    osc.frequency.exponentialRampToValueAtTime(1760, now + 0.2)
    gain.gain.setValueAtTime(0.1, now)
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2)
    osc.start(now)
    osc.stop(now + 0.2)
  } else if (type === 'gameover') {
    ;[440, 349, 329, 261].forEach((freq, i) => {
      const o = audioCtx!.createOscillator()
      const g = audioCtx!.createGain()
      o.connect(g)
      g.connect(audioCtx!.destination)
      o.type = 'triangle'
      o.frequency.setValueAtTime(freq, now + i * 0.15)
      g.gain.setValueAtTime(0.1, now + i * 0.15)
      g.gain.exponentialRampToValueAtTime(0.01, now + i * 0.15 + 0.1)
      o.start(now + i * 0.15)
      o.stop(now + i * 0.15 + 0.1)
    })
  }
}

const spawnParticles = (x: number, y: number, color: string) => {
  const id = Date.now()
  const text = codeSnippets[Math.floor(Math.random() * codeSnippets.length)] || ''
  particles.value.push({ id, x, y, text, color })
  setTimeout(() => {
    particles.value = particles.value.filter((p) => p.id !== id)
  }, 800)
}

const spawnFloater = (x: number, y: number, text: string, color: string) => {
  const id = Date.now() + Math.random()
  floaters.value.push({ id, x, y, text, color })
  setTimeout(() => {
    floaters.value = floaters.value.filter((f) => f.id !== id)
  }, 1000)
}

const triggerCheer = () => {
  const index = Math.min(Math.floor((combo.value - 3) / 2), cheers.length - 1)
  cheerText.value = cheers[index] || ''
  showCheer.value = true
  playSound('cheer')
  setTimeout(() => {
    showCheer.value = false
  }, 1000)
}

const startGame = () => {
  initAudio()
  score.value = 0
  timeLeft.value = 30
  isGameOver.value = false
  isBulletTime.value = false
  isFrozen.value = false
  message.value = 'Chạy ngay đi!'
  combo.value = 0
  startTimer()
  spawnNext()
}

const startTimer = () => {
  timerInterval = setInterval(() => {
    if (!isFrozen.value) {
      timeLeft.value--
      if (timeLeft.value <= 0) endGame()
    }
  }, 1000)
}

const spawnNext = () => {
  if (isGameOver.value) return

  const rand = Math.random()
  let type: EntityType = 'bug'
  let emoji = bugEmojis[Math.floor(Math.random() * bugEmojis.length)] || '🐛'

  if (rand > 0.96) {
    type = 'freeze'
    emoji = '❄️'
  } else if (rand > 0.92) {
    type = 'coffee'
    emoji = '☕'
  } else if (rand > 0.88) {
    type = 'boss'
    emoji = '👾'
    bossHealth.value = 3
  } else if (rand > 0.8) {
    type = 'golden'
    emoji = '✨'
  } else if (rand > 0.65) {
    type = 'bomb'
    emoji = '💣'
  }

  activeEntity.value = { index: Math.floor(Math.random() * 9), type, emoji }
  playSound('pop')

  let duration = Math.max(300, 1000 - score.value * 15)
  if (type === 'golden') duration = 400
  if (type === 'coffee' || type === 'freeze') duration = 700
  if (type === 'bomb') duration = Math.max(500, 1000 - score.value * 5)
  if (type === 'boss') duration = Math.max(1200, 2000 - score.value * 10)

  if (isBulletTime.value) duration *= 2.5
  if (isFrozen.value) duration *= 1.5

  gameTimeout = setTimeout(() => {
    activeEntity.value = null
    if (!isGameOver.value) {
      const nextDelay =
        isBulletTime.value || isFrozen.value ? 500 : Math.max(100, 400 - score.value * 5)
      setTimeout(spawnNext, Math.random() * nextDelay + 50)
    }
  }, duration)
}

const whack = (index: number, event: MouseEvent) => {
  if (isGameOver.value) return

  if (activeEntity.value && index === activeEntity.value.index) {
    const type = activeEntity.value.type

    // Handle Boss Logic separately because it takes multiple hits
    if (type === 'boss') {
      bossHealth.value--
      spawnParticles(event.clientX, event.clientY, '#a855f7')

      if (bossHealth.value > 0) {
        playSound('bossHit')
        spawnFloater(event.clientX, event.clientY, '-1 HP', '#a855f7')
        return // Do not destroy the entity yet
      } else {
        // Boss killed
        activeEntity.value = null
        clearTimeout(gameTimeout)
        score.value += 10
        timeLeft.value += 3
        combo.value += 3
        playSound('bossKill')
        spawnFloater(event.clientX, event.clientY, '+10', '#fbbf24')
        spawnFloater(event.clientX, event.clientY - 30, '+3s', '#34d399')
        message.value = 'ĐÃ DIỆT TRÙM! 👾'
        if (combo.value >= 3) triggerCheer()
        spawnNext()
        return
      }
    }

    // Normal entities
    activeEntity.value = null
    clearTimeout(gameTimeout)

    const color =
      type === 'golden'
        ? '#fbbf24'
        : type === 'bomb'
          ? '#ef4444'
          : type === 'coffee'
            ? '#60a5fa'
            : type === 'freeze'
              ? '#38bdf8'
              : '#f87171'
    spawnParticles(event.clientX, event.clientY, color)

    if (type === 'bug') {
      score.value++
      combo.value++
      playSound('whack')
      spawnFloater(event.clientX, event.clientY, '+1', '#ffffff')
      message.value = messages[Math.floor(Math.random() * messages.length)] || ''
      if (combo.value >= 3 && combo.value % 2 === 1) triggerCheer()
    } else if (type === 'golden') {
      score.value += 5
      combo.value += 2
      playSound('golden')
      spawnFloater(event.clientX, event.clientY, '+5', '#fbbf24')
      message.value = 'XỊN THẾ! +5 💎'
      if (combo.value >= 3) triggerCheer()
    } else if (type === 'bomb') {
      score.value = Math.max(0, score.value - 3)
      timeLeft.value = Math.max(0, timeLeft.value - 2)
      combo.value = 0
      playSound('bomb')
      spawnFloater(event.clientX, event.clientY, '-3', '#ef4444')
      spawnFloater(event.clientX, event.clientY - 30, '-2s', '#ef4444')
      message.value = 'BÙM! -3đ -2s 💀'
    } else if (type === 'coffee') {
      isBulletTime.value = true
      playSound('coffee')
      spawnFloater(event.clientX, event.clientY, 'SIÊU CHẬM', '#60a5fa')
      message.value = 'ĐẾN GIỜ CAFE! ☕'
      clearTimeout(effectTimeout)
      effectTimeout = setTimeout(() => {
        isBulletTime.value = false
      }, 5000)
    } else if (type === 'freeze') {
      isFrozen.value = true
      playSound('freeze')
      spawnFloater(event.clientX, event.clientY, 'BĂNG GIÁ!', '#38bdf8')
      message.value = 'NGƯNG ĐỌNG! ❄️'
      clearTimeout(effectTimeout)
      effectTimeout = setTimeout(() => {
        isFrozen.value = false
      }, 3000)
    }

    spawnNext()
  } else {
    combo.value = 0
  }
}

const endGame = () => {
  isGameOver.value = true
  clearInterval(timerInterval)
  clearTimeout(gameTimeout)
  clearTimeout(effectTimeout)
  activeEntity.value = null
  playSound('gameover')
  if (score.value > highScore.value) {
    highScore.value = score.value
    localStorage.setItem('whack-a-bug-highscore', score.value.toString())
  }

  if (score.value > 80) message.value = 'CẤP ĐỘ CTO! 👑'
  else if (score.value > 50) message.value = 'HUYỀN THOẠI LẬP TRÌNH! 🏆'
  else if (score.value > 30) message.value = 'LẬP TRÌNH VIÊN CẤP CAO! 😎'
  else message.value = 'Cố gắng thêm nhé! 💪'
}

onUnmounted(() => {
  clearInterval(timerInterval)
  clearTimeout(gameTimeout)
  clearTimeout(effectTimeout)
})

const timerWidth = computed(() => Math.min((timeLeft.value / 30) * 100, 100))
</script>

<template>
  <div
    class="min-h-screen bg-[#020617] text-white p-4 font-sans flex flex-col items-center justify-center overflow-hidden transition-colors duration-500"
    :class="{
      'bg-[#0c1e3d]': isBulletTime,
      'bg-[#082f49]': isFrozen,
    }"
  >
    <!-- Background Vibe -->
    <div class="fixed inset-0 pointer-events-none opacity-20 transition-all duration-500">
      <div
        class="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] transition-colors duration-500"
        :class="isFrozen ? 'bg-sky-400' : 'bg-accent-coral'"
      ></div>
      <div
        class="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] transition-colors duration-500"
        :class="isFrozen ? 'bg-blue-300' : 'bg-accent-amber'"
      ></div>

      <!-- Snow overlay when frozen -->
      <div v-if="isFrozen" class="absolute inset-0 bg-white/5 backdrop-blur-[1px]"></div>
    </div>

    <!-- Floating Code Particles -->
    <div
      v-for="p in particles"
      :key="p.id"
      class="fixed pointer-events-none z-[100] font-black italic animate-particle-fade text-xl mix-blend-screen"
      :style="{ left: p.x + 'px', top: p.y + 'px', color: p.color }"
    >
      {{ p.text }}
    </div>

    <!-- Floating Scores -->
    <div
      v-for="f in floaters"
      :key="f.id"
      class="fixed pointer-events-none z-[110] font-black text-3xl drop-shadow-[0_0_10px_rgba(0,0,0,0.8)] animate-float-up"
      :style="{ left: f.x + 'px', top: f.y + 'px', color: f.color }"
    >
      {{ f.text }}
    </div>

    <div class="max-w-md w-full text-center space-y-4 z-10">
      <!-- Progress Bar -->
      <div
        class="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800 shadow-lg relative"
      >
        <div
          class="h-full transition-all duration-1000 shadow-[0_0_10px_rgba(255,255,255,0.3)]"
          :class="
            isFrozen
              ? 'bg-sky-400 ease-out'
              : timeLeft < 10
                ? 'bg-red-500 animate-pulse ease-linear'
                : 'bg-gradient-to-r from-emerald-500 to-accent-amber ease-linear'
          "
          :style="{ width: timerWidth + '%' }"
        ></div>
        <div v-if="isFrozen" class="absolute inset-0 bg-white/30 animate-pulse"></div>
      </div>

      <!-- Header -->
      <div class="space-y-1 relative">
        <h1
          class="text-5xl font-black tracking-tighter italic text-transparent bg-clip-text bg-gradient-to-r from-accent-coral via-white to-accent-amber"
          :class="{ 'animate-pulse scale-105': isBulletTime || isFrozen }"
        >
          ĐẬP BUG GIẢI NGHIỆP
        </h1>
        <div class="flex items-center justify-center gap-4">
          <p class="text-slate-400 text-[10px] font-bold tracking-widest uppercase">
            <span v-if="isFrozen" class="text-sky-300">❄️ THỜI GIAN NGƯNG ĐỌNG ❄️</span>
            <span v-else-if="isBulletTime" class="text-blue-400">☕ SIÊU CHẬM ☕</span>
            <span v-else>Điểm cao nhất: {{ highScore }}</span>
          </p>
          <button
            @click="isMuted = !isMuted"
            class="p-1.5 bg-slate-800/50 hover:bg-slate-700 rounded-lg border border-slate-700"
          >
            {{ isMuted ? '🔇' : '🔊' }}
          </button>
        </div>
      </div>

      <!-- Stats -->
      <div
        class="grid grid-cols-3 gap-2 bg-slate-900/80 backdrop-blur-md p-4 rounded-3xl border border-slate-800 shadow-2xl relative"
      >
        <div
          v-if="combo >= 3"
          class="absolute inset-0 bg-gradient-to-t from-accent-coral/20 to-transparent pointer-events-none animate-pulse"
        ></div>
        <div class="text-center">
          <p class="text-[10px] uppercase text-slate-500 font-bold">Điểm</p>
          <p class="text-3xl font-black text-accent-amber">{{ score }}</p>
        </div>
        <div class="flex flex-col justify-center items-center border-x border-slate-800 px-2">
          <p
            class="text-xs font-bold text-accent-coral animate-bounce leading-tight truncate w-full"
          >
            {{ message }}
          </p>
          <p
            v-if="combo > 1"
            class="text-[10px] font-mono"
            :class="combo >= 3 ? 'text-accent-coral font-black' : 'text-white/50'"
          >
            {{ combo >= 5 ? '🔥' : '' }} Combo: {{ combo }}
          </p>
        </div>
        <div class="text-center">
          <p class="text-[10px] uppercase text-slate-500 font-bold">Giây</p>
          <p
            class="text-3xl font-black"
            :class="
              isFrozen
                ? 'text-sky-400'
                : timeLeft < 7
                  ? 'text-red-500 animate-ping'
                  : 'text-emerald-400'
            "
          >
            {{ timeLeft }}
          </p>
        </div>
      </div>

      <!-- Cheer Area -->
      <div class="h-10 flex items-center justify-center overflow-visible">
        <Transition name="cheer">
          <div v-if="showCheer" class="absolute z-30 pointer-events-none">
            <span
              class="text-4xl font-black text-white italic drop-shadow-[0_0_15px_rgba(255,255,255,0.6)] uppercase"
              >{{ cheerText }}</span
            >
          </div>
        </Transition>
      </div>

      <!-- Game Board -->
      <div
        class="grid grid-cols-3 gap-3 bg-slate-950 p-4 rounded-[2rem] border-8 shadow-2xl relative transition-colors duration-500"
        :class="[
          score > 40 && !isFrozen && !isBulletTime ? 'animate-[shake_0.5s_infinite]' : '',
          isFrozen ? 'border-sky-900/50 shadow-sky-900/50' : 'border-slate-900',
        ]"
      >
        <div
          v-for="i in 9"
          :key="i - 1"
          class="aspect-square bg-slate-800/50 rounded-2xl relative overflow-hidden border-b-4 border-black active:scale-90 transition-transform select-none"
          style="
            cursor:
              url(&quot;data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' style='font-size:24px'><text y='24'>🔨</text></svg>&quot;)
                16 16,
              crosshair;
          "
          @mousedown="whack(i - 1, $event)"
        >
          <div class="absolute inset-x-2 bottom-3 h-3 bg-black/60 rounded-[50%] blur-sm"></div>
          <Transition name="pop">
            <div
              v-if="activeEntity?.index === i - 1"
              class="absolute inset-0 flex items-center justify-center text-5xl select-none"
              :class="{
                'drop-shadow-[0_0_15px_rgba(255,215,0,0.8)] scale-110':
                  activeEntity.type === 'golden',
                'drop-shadow-[0_0_15px_rgba(96,165,250,0.8)] scale-110':
                  activeEntity.type === 'coffee',
                'drop-shadow-[0_0_15px_rgba(56,189,248,0.8)] scale-110 animate-pulse':
                  activeEntity.type === 'freeze',
                'drop-shadow-[0_0_20px_rgba(168,85,247,0.8)]': activeEntity.type === 'boss',
                'scale-[1.3]': activeEntity.type === 'boss' && bossHealth === 3,
                'scale-[1.1]': activeEntity.type === 'boss' && bossHealth === 2,
                'scale-[0.9] text-red-500': activeEntity.type === 'boss' && bossHealth === 1,
              }"
            >
              {{ activeEntity.emoji }}
            </div>
          </Transition>
        </div>

        <!-- Overlay -->
        <div
          v-if="!timerInterval || isGameOver"
          class="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 z-20 rounded-[1.5rem]"
        >
          <div v-if="isGameOver" class="mb-6 space-y-1 w-full text-center">
            <h2 class="text-4xl font-black text-red-500 tracking-tighter">KẾT THÚC</h2>
            <p class="text-slate-400 font-medium text-sm italic mb-2">{{ message }}</p>
            <div class="bg-slate-900 p-3 rounded-xl border border-slate-800 grid grid-cols-2 gap-4">
              <div>
                <p class="text-[10px] text-slate-500 uppercase">Điểm</p>
                <p class="text-2xl font-black">{{ score }}</p>
              </div>
              <div>
                <p class="text-[10px] text-slate-500 uppercase">Kỷ lục</p>
                <p class="text-2xl font-black text-accent-amber">{{ highScore }}</p>
              </div>
            </div>
          </div>
          <button
            @click="startGame"
            class="group relative px-8 py-4 w-full bg-white text-black font-black text-2xl rounded-2xl hover:bg-accent-coral hover:text-white transition-all active:scale-95"
          >
            <span class="relative z-10">{{
              isGameOver ? 'TRIỂN KHAI LẠI' : 'BẮT ĐẦU FIX BUG'
            }}</span>
            <div
              class="absolute inset-0 bg-accent-amber blur-xl opacity-0 group-hover:opacity-40 transition-opacity"
            ></div>
          </button>
          <div
            class="mt-4 flex flex-wrap justify-center gap-2 text-[10px] text-slate-400 uppercase tracking-widest font-bold"
          >
            <span class="bg-slate-900 px-2 py-1 rounded">☕ Chậm</span>
            <span class="bg-slate-900 px-2 py-1 rounded">❄️ Đóng băng</span>
            <span class="bg-slate-900 px-2 py-1 rounded">👾 Trùm (3x)</span>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <router-link
        to="/"
        class="inline-flex items-center gap-2 text-slate-500 hover:text-white font-bold text-xs uppercase tracking-widest group mt-4"
      >
        <span class="group-hover:-translate-x-1 transition-transform">←</span> Về trang chủ
      </router-link>
    </div>
  </div>
</template>

<style scoped>
.pop-enter-active {
  transition: all 0.1s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.pop-leave-active {
  transition: all 0.08s ease-in;
}
.pop-enter-from,
.pop-leave-to {
  transform: translateY(100%) scale(0.3);
  opacity: 0;
}

.cheer-enter-active {
  animation: cheer-in 0.8s ease-out;
}
.cheer-leave-active {
  opacity: 0;
  transition: opacity 0.2s;
}

@keyframes cheer-in {
  0% {
    transform: scale(0) translateY(20px) rotate(-20deg);
    opacity: 0;
  }
  50% {
    transform: scale(1.2) translateY(-10px) rotate(10deg);
    opacity: 1;
  }
  100% {
    transform: scale(1) translateY(0) rotate(0deg);
    opacity: 1;
  }
}

@keyframes particle-fade {
  0% {
    transform: translate(-50%, -50%) scale(0.5) rotate(-20deg);
    opacity: 0;
  }
  20% {
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -150%) scale(1.2) rotate(20deg);
    opacity: 0;
  }
}

.animate-particle-fade {
  animation: particle-fade 0.8s ease-out forwards;
}

@keyframes float-up {
  0% {
    transform: translate(-50%, -50%) scale(0.5);
    opacity: 0;
  }
  20% {
    transform: translate(-50%, -80%) scale(1.2);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -150%) scale(1);
    opacity: 0;
  }
}

.animate-float-up {
  animation: float-up 1s ease-out forwards;
}

@keyframes shake {
  0%,
  100% {
    transform: translate(0, 0);
  }
  25% {
    transform: translate(2px, 2px);
  }
  50% {
    transform: translate(-2px, -2px);
  }
  75% {
    transform: translate(2px, -2px);
  }
}
</style>
