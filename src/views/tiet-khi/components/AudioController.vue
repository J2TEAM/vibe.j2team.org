<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  termName: string
}>()

const isMuted = ref(true)
const audioRef = ref<HTMLAudioElement | null>(null)

// Sử dụng các URL âm thanh thiên nhiên mẫu (có thể thay thế bằng file local sau)
// Âm Khuyết Thi Thính - 24 Tiết Khí (Interestingcn)
// Nguồn: GitHub doccosau/Audio-Blog
const GITHUB_RAW = 'https://github.com/doccosau/Audio-Blog/raw/main/tiet-khi/'

const playlist: Record<string, string> = {
  'Lập Xuân': GITHUB_RAW + encodeURIComponent('Lập Xuân _ 立春.mp3'),
  'Vũ Thủy': GITHUB_RAW + encodeURIComponent('Nước Mưa _ 雨水.mp3'),
  'Kinh Trập': GITHUB_RAW + encodeURIComponent('Kinh Trập _ 惊蛰.mp3'),
  'Xuân Phân': GITHUB_RAW + encodeURIComponent('Xuân Phân.mp3'),
  'Thanh Minh': GITHUB_RAW + encodeURIComponent('Thanh Minh _ 清明.mp3'),
  'Cốc Vũ': GITHUB_RAW + encodeURIComponent('Cốc Vũ _ 谷雨.mp3'),
  'Lập Hạ': GITHUB_RAW + encodeURIComponent('Lập Hạ.mp3'),
  'Tiểu Mãn': GITHUB_RAW + encodeURIComponent('Tiểu Mãn _ 小滿.mp3'),
  'Mang Chủng': GITHUB_RAW + encodeURIComponent('Mang Chủng _ 芒种.mp3'),
  'Hạ Chí': GITHUB_RAW + encodeURIComponent('Hạ Chí _ 夏至.mp3'),
  'Tiểu Thử': GITHUB_RAW + encodeURIComponent('Tiểu Thử _ 小暑.mp3'),
  'Đại Thử': GITHUB_RAW + encodeURIComponent('Đại Thử _ 大暑.mp3'),
  'Lập Thu': GITHUB_RAW + encodeURIComponent('Lập Thu _ 立秋.mp3'),
  'Xử Thử': GITHUB_RAW + encodeURIComponent('Xử Thử _ 處暑.mp3'),
  'Bạch Lộ': GITHUB_RAW + encodeURIComponent('Bạch Lộ _ 白露.mp3'),
  'Thu Phân': GITHUB_RAW + encodeURIComponent('Thu Phân _ 秋分.mp3'),
  'Hàn Lộ': GITHUB_RAW + encodeURIComponent('Sương Lạnh _ 寒露.mp3'),
  'Sương Giáng': GITHUB_RAW + encodeURIComponent('Sương Giáng.mp3'),
  'Lập Đông': GITHUB_RAW + encodeURIComponent('Lập Đông _ 立冬.mp3'),
  'Tiểu Tuyết': GITHUB_RAW + encodeURIComponent('Tiểu Tuyết _ 小雪.mp3'),
  'Đại Tuyết': GITHUB_RAW + encodeURIComponent('Đại Tuyết _ 大雪.mp3'),
  'Đông Chí': GITHUB_RAW + encodeURIComponent('Đông Chí _ 冬至.mp3'),
  'Tiểu Hàn': GITHUB_RAW + encodeURIComponent('Tiểu Hàn _ 小寒.mp3'),
  'Đại Hàn': GITHUB_RAW + encodeURIComponent('Đại Hàn _ 大寒.mp3'),
}

const toggleMute = async () => {
  isMuted.value = !isMuted.value
  if (!isMuted.value && audioRef.value) {
    try {
      await audioRef.value.play()
    } catch (e) {
      console.warn('Audio play failed, user interaction might be required:', e)
      isMuted.value = true
    }
  } else {
    audioRef.value?.pause()
  }
}

watch(
  () => props.termName,
  async (newName) => {
    if (audioRef.value) {
      const wasPlaying = !isMuted.value
      const songUrl = playlist[newName] || playlist['Lập Xuân']
      if (songUrl) {
        audioRef.value.src = songUrl
      }
      audioRef.value.load()
      if (wasPlaying) {
        try {
          await audioRef.value.play()
        } catch (e) {
          console.warn('Audio switch failed:', e)
        }
      }
    }
  },
)

onMounted(() => {
  audioRef.value = new Audio(playlist[props.termName] || playlist['Lập Xuân'])
  audioRef.value.loop = true
  audioRef.value.volume = 0.4
})

onUnmounted(() => {
  audioRef.value?.pause()
  audioRef.value = null
})
</script>

<template>
  <div class="fixed bottom-8 right-8 z-[60]">
    <button
      @click="toggleMute"
      :class="[
        'p-4 md:p-5 rounded-full backdrop-blur-3xl border transition-all duration-500 flex items-center justify-center gap-3 group',
        !isMuted
          ? 'bg-accent-coral/20 border-accent-coral/50 text-accent-coral shadow-[0_0_30px_rgba(255,107,74,0.3)]'
          : 'bg-black/40 border-white/10 text-white/40',
      ]"
    >
      <!-- Sound Wave Animation -->
      <div v-if="!isMuted" class="flex gap-1 items-end h-4">
        <div
          v-for="i in 4"
          :key="i"
          class="w-[3px] bg-accent-coral rounded-full animate-sound-wave"
          :style="{ animationDelay: `${i * 0.1}s` }"
        ></div>
      </div>

      <div class="flex flex-col items-end">
        <span class="text-[8px] opacity-30 font-mono uppercase tracking-[0.2em] mb-1"
          >Đang phát</span
        >
        <span class="text-[10px] font-bold uppercase tracking-[0.1em] text-white/60">
          {{ termName }} - Âm Khuyết Thi Thính
        </span>
      </div>

      <div class="relative">
        <svg
          v-if="isMuted"
          xmlns="http://www.w3.org/2000/svg"
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="m11 5-7 7H2v4h4l7 7zM22 9l-6 6M16 9l6 6" />
        </svg>
        <svg
          v-else
          xmlns="http://www.w3.org/2000/svg"
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path
            d="M11 5 6 10H2v4h4l5 5zM15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14"
          />
        </svg>
      </div>
    </button>
  </div>
</template>

<style scoped>
.animate-sound-wave {
  animation: wave 0.8s ease-in-out infinite alternate;
}

@keyframes wave {
  from {
    height: 4px;
  }
  to {
    height: 16px;
  }
}

button:hover {
  transform: translateY(-5px) scale(1.05);
}
</style>
