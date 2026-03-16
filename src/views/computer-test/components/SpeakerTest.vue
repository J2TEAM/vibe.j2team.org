<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'

interface TestTrack {
  key: string
  label: string
  description: string
  emoji: string
}

// Danh sách bài thử
const tracks: TestTrack[] = [
  {
    key: 'bass',
    label: 'Âm trầm (Bass)',
    description: '80 Hz — thử loa sub hoặc âm trầm',
    emoji: '🔉',
  },
  {
    key: 'mid',
    label: 'Âm trung (Mid)',
    description: '1000 Hz — thử dải trung, giọng nói',
    emoji: '🔊',
  },
  {
    key: 'high',
    label: 'Âm cao (Treble)',
    description: '8000 Hz — thử độ chi tiết âm thanh',
    emoji: '🎵',
  },
  {
    key: 'sweep',
    label: 'Quét tần số (Sweep)',
    description: '80→8000 Hz — quét toàn dải để nghe tổng thể',
    emoji: '📡',
  },
  {
    key: 'left',
    label: 'Kênh trái (Left)',
    description: '1000 Hz chỉ phát qua loa trái',
    emoji: '◀️',
  },
  {
    key: 'right',
    label: 'Kênh phải (Right)',
    description: '1000 Hz chỉ phát qua loa phải',
    emoji: '▶️',
  },
]

const playingKey = ref<string | null>(null)
const volume = ref(70) // 0-100

let audioCtx: AudioContext | null = null
let oscillator: OscillatorNode | null = null
let gainNode: GainNode | null = null
let sweepInterval: ReturnType<typeof setInterval> | null = null
let panNode: StereoPannerNode | null = null

// Khởi tạo AudioContext
function getAudioCtx() {
  if (!audioCtx || audioCtx.state === 'closed') {
    audioCtx = new AudioContext()
  }
  return audioCtx
}

// Dừng âm đang phát
function stopSound() {
  if (sweepInterval) {
    clearInterval(sweepInterval)
    sweepInterval = null
  }
  if (oscillator) {
    try {
      oscillator.stop()
    } catch {
      // ignore
    }
    oscillator.disconnect()
    oscillator = null
  }
  if (gainNode) {
    gainNode.disconnect()
    gainNode = null
  }
  if (panNode) {
    panNode.disconnect()
    panNode = null
  }
  playingKey.value = null
}

// Phát âm theo key
function playTrack(key: string) {
  // Nếu đang phát cùng track → dừng
  if (playingKey.value === key) {
    stopSound()
    return
  }

  stopSound()

  const ctx = getAudioCtx()
  gainNode = ctx.createGain()
  gainNode.gain.value = volume.value / 100

  if (key === 'left' || key === 'right') {
    // Phát kênh trái/phải bằng StereoPannerNode
    oscillator = ctx.createOscillator()
    oscillator.type = 'sine'
    oscillator.frequency.value = 1000

    panNode = ctx.createStereoPanner()
    panNode.pan.value = key === 'left' ? -1 : 1

    oscillator.connect(panNode)
    panNode.connect(gainNode)
    gainNode.connect(ctx.destination)
    oscillator.start()
  } else if (key === 'sweep') {
    // Phát âm thanh quét tần số 80→8000Hz trong 4 giây rồi lặp lại
    oscillator = ctx.createOscillator()
    oscillator.type = 'sine'
    oscillator.frequency.value = 80

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)
    oscillator.start()

    let freq = 80
    const step = (8000 - 80) / 80 // tăng mỗi 50ms
    sweepInterval = setInterval(() => {
      if (!oscillator) return
      freq += step
      if (freq > 8000) freq = 80
      oscillator.frequency.value = freq
    }, 50)
  } else {
    // Phát âm đơn tần
    const freqMap: Record<string, number> = {
      bass: 80,
      mid: 1000,
      high: 8000,
    }

    oscillator = ctx.createOscillator()
    oscillator.type = 'sine'
    oscillator.frequency.value = freqMap[key] ?? 1000

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)
    oscillator.start()
  }

  playingKey.value = key
}

// Cập nhật volume realtime khi kéo slider
watch(volume, (val) => {
  if (gainNode) {
    gainNode.gain.value = val / 100
  }
})

onUnmounted(() => {
  stopSound()
  if (audioCtx) {
    audioCtx.close()
    audioCtx = null
  }
})
</script>

<template>
  <div class="flex flex-col gap-8 w-full max-w-6xl mx-auto p-4 sm:p-6 mb-20 animate-fade-up">
    <!-- Mô tả -->
    <div class="bg-bg-surface border border-border-default p-6 shadow-sm">
      <h2 class="font-display text-xl font-bold text-text-primary mb-2">Kiểm tra Loa</h2>
      <p class="text-sm text-text-secondary leading-relaxed">
        Phát các âm tần thử nghiệm để kiểm tra xem loa còn SỦA với bạn được không? 🤡
      </p>
      <p class="text-sm text-text-secondary leading-relaxed">
        Nhấn vào từng ô để phát/dừng âm thanh
      </p>
      <p class="text-sm text-text-secondary leading-relaxed">
        Nếu âm thanh nghe bị <strong class="text-accent-amber">rè</strong> → loa có thể bị bụi hoặc
        hư phần cứng. Nếu <strong class="text-accent-coral">mất một kênh</strong> → kiểm tra cài đặt
        âm thanh stereo hoặc đã hư phần cứng
      </p>
    </div>

    <!-- Điều chỉnh âm lượng -->
    <div class="bg-bg-surface border border-border-default p-6 shadow-sm">
      <div class="flex items-center justify-between mb-3">
        <p class="text-[10px] text-text-dim uppercase tracking-widest font-display">Âm lượng</p>
        <span class="text-sm font-bold text-text-primary font-display">{{ volume }}%</span>
      </div>
      <input
        v-model.number="volume"
        type="range"
        min="0"
        max="100"
        step="5"
        class="w-full h-1.5 accent-accent-coral cursor-pointer"
      />
    </div>

    <!-- Danh sách bài thử -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div
        v-for="track in tracks"
        :key="track.key"
        class="bg-bg-surface border shadow-sm overflow-hidden transition-all duration-200 cursor-pointer"
        :class="
          playingKey === track.key
            ? 'border-accent-coral'
            : 'border-border-default hover:border-text-dim'
        "
        @click="playTrack(track.key)"
      >
        <div class="flex items-center gap-4 p-5">
          <!-- Emoji + trạng thái -->
          <div
            class="w-12 h-12 flex items-center justify-center text-2xl flex-shrink-0 border transition-all"
            :class="
              playingKey === track.key
                ? 'border-accent-coral bg-accent-coral/10 animate-pulse'
                : 'border-border-default bg-bg-deep'
            "
          >
            {{ track.emoji }}
          </div>

          <!-- Thông tin -->
          <div class="flex-1 min-w-0">
            <p
              class="font-display text-sm font-semibold"
              :class="playingKey === track.key ? 'text-accent-coral' : 'text-text-primary'"
            >
              {{ track.label }}
            </p>
            <p class="text-xs text-text-dim mt-0.5">{{ track.description }}</p>
          </div>

          <!-- Nút play/stop -->
          <div
            class="text-xs font-display uppercase tracking-widest px-3 py-1.5 border flex-shrink-0 transition-all"
            :class="
              playingKey === track.key
                ? 'bg-accent-coral border-accent-coral text-bg-deep'
                : 'border-border-default text-text-dim'
            "
          >
            {{ playingKey === track.key ? '⏹ Dừng' : '▶ Phát' }}
          </div>
        </div>

        <!-- Sóng âm đơn giản khi đang phát -->
        <div
          v-if="playingKey === track.key"
          class="flex items-end gap-0.5 px-5 pb-4 h-8 overflow-hidden"
        >
          <div
            v-for="i in 24"
            :key="i"
            class="flex-1 bg-accent-coral/60 rounded-sm animate-pulse"
            :style="{
              height: `${Math.abs(Math.sin(i * 0.6)) * 100}%`,
              animationDelay: `${i * 40}ms`,
            }"
          />
        </div>
      </div>
    </div>
  </div>
</template>
