<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  termName: string
}>()

const isMuted = ref(true)
const isAmbientMuted = ref(true)
const mainAudio = ref<HTMLAudioElement | null>(null)
const ambientAudio = ref<HTMLAudioElement | null>(null)

/*
// Ambient Sounds Map (GitHub Raw for stability) - Prepared for future use
const _ambientPlaylists: Record<string, string> = {
  'Xuân': 'https://raw.githubusercontent.com/rafael-lua/ambient-sounds/main/sounds/birds.mp3',
  'Hạ': 'https://raw.githubusercontent.com/rafael-lua/ambient-sounds/main/sounds/rain.mp3',
  'Thu': 'https://raw.githubusercontent.com/rafael-lua/ambient-sounds/main/sounds/crickets.mp3',
  'Đông': 'https://raw.githubusercontent.com/rafael-lua/ambient-sounds/main/sounds/wind.mp3',

  // Specific Soundscapes
  'Kinh Trập': 'https://raw.githubusercontent.com/rafael-lua/ambient-sounds/main/sounds/thunder.mp3',
  'Xuân Phân': 'https://raw.githubusercontent.com/rafael-lua/ambient-sounds/main/sounds/river.mp3',
  'Bạch Lộ': 'https://raw.githubusercontent.com/rafael-lua/ambient-sounds/main/sounds/river.mp3',
  'Lập Hạ': 'https://raw.githubusercontent.com/rafael-lua/ambient-sounds/main/sounds/forest.mp3',
}

const _getSeasonFromTerm = (name: string) => {
  if (['Lập Xuân', 'Vũ Thủy', 'Kinh Trập', 'Xuân Phân', 'Thanh Minh', 'Cốc Vũ'].some(t => name.includes(t))) return 'Xuân';
  if (['Lập Hạ', 'Tiểu Mãn', 'Mang Chủng', 'Hạ Chí', 'Tiểu Thử', 'Đại Thử'].some(t => name.includes(t))) return 'Hạ';
  if (['Lập Thu', 'Xử Thử', 'Bạch Lộ', 'Thu Phân', 'Hàn Lộ', 'Sương Giáng'].some(t => name.includes(t))) return 'Thu';
  return 'Đông';
}
*/

const GITHUB_RAW = 'https://cdn.jsdelivr.net/gh/doccosau/Audio-Blog@main/tiet-khi/'
const EFFECTS_RAW = GITHUB_RAW + 'effects/'

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
  'Đại Hàn': GITHUB_RAW + encodeURIComponent('Đại Hàn _ Đại Hàn.mp3'),
}

const ambientPlaylist: Record<string, string> = {
  'Lập Xuân': EFFECTS_RAW + 'lap-xuan.mp3',
  'Vũ Thủy': EFFECTS_RAW + 'vu-thuy.mp3',
  'Kinh Trập': EFFECTS_RAW + 'kinh-trap.mp3',
  'Xuân Phân': EFFECTS_RAW + 'xuan-phan.mp3',
  'Thanh Minh': EFFECTS_RAW + 'thanh-minh.mp3',
  'Cốc Vũ': EFFECTS_RAW + 'coc-vu.mp3',
  'Lập Hạ': EFFECTS_RAW + 'lap-ha.mp3',
  'Tiểu Mãn': EFFECTS_RAW + 'tieu-man.mp3',
  'Mang Chủng': EFFECTS_RAW + 'mang-chung.mp3',
  'Hạ Chí': EFFECTS_RAW + 'ha-chi.mp3',
  'Tiểu Thử': EFFECTS_RAW + 'tieu-thu.mp3',
  'Đại Thử': EFFECTS_RAW + 'dai-thu.mp3',
  'Lập Thu': EFFECTS_RAW + 'lap-thu.mp3',
  'Xử Thử': EFFECTS_RAW + 'xu-thu.mp3',
  'Bạch Lộ': EFFECTS_RAW + 'bach-lo.mp3',
  'Thu Phân': EFFECTS_RAW + 'thu-phan.mp3',
  'Hàn Lộ': EFFECTS_RAW + 'han-lo.mp3',
  'Sương Giáng': EFFECTS_RAW + 'suong-giang.mp3',
  'Lập Đông': EFFECTS_RAW + 'lap-dong.mp3',
  'Tiểu Tuyết': EFFECTS_RAW + 'tieu-tuyet.mp3',
  'Đại Tuyết': EFFECTS_RAW + 'dai-tuyet.mp3',
  'Đông Chí': EFFECTS_RAW + 'dong-chi.mp3',
  'Tiểu Hàn': EFFECTS_RAW + 'tieu-han.mp3',
  'Đại Hàn': EFFECTS_RAW + 'dai-han.mp3',
}

const toggleMute = async () => {
  if (!mainAudio.value) return
  isMuted.value = !isMuted.value
  if (!isMuted.value) {
    try {
      const songUrl = playlist[props.termName] || playlist['Lập Xuân'] || ''
      mainAudio.value.src = songUrl
      mainAudio.value.load()
      await mainAudio.value.play()
    } catch (e) {
      console.warn('Audio play failed:', e)
      isMuted.value = true
    }
  } else {
    mainAudio.value.pause()
  }
}

const toggleAmbient = async () => {
  if (!ambientAudio.value) return
  isAmbientMuted.value = !isAmbientMuted.value
  if (!isAmbientMuted.value) {
    try {
      const ambientUrl = ambientPlaylist[props.termName] || ambientPlaylist['Lập Xuân'] || ''
      const targetSrc = new URL(ambientUrl, window.location.href).href
      if (ambientAudio.value.src !== targetSrc) {
        ambientAudio.value.src = ambientUrl
        ambientAudio.value.load()
      }
      await ambientAudio.value.play()
    } catch (e) {
      console.warn('Ambient play failed:', e)
      isAmbientMuted.value = true
    }
  } else {
    ambientAudio.value.pause()
  }
}

watch(
  () => props.termName,
  async (newName) => {
    // 1. Update Main Music
    if (mainAudio.value) {
      const wasPlaying = !isMuted.value
      const songUrl = playlist[newName] || playlist['Lập Xuân'] || ''
      const targetSrc = new URL(songUrl, window.location.href).href

      if (mainAudio.value.src !== targetSrc) {
        mainAudio.value.pause()
        mainAudio.value.src = songUrl
        mainAudio.value.load()

        if (wasPlaying) {
          try {
            await mainAudio.value.play()
          } catch {
            mainAudio.value.oncanplay = async () => {
              if (!isMuted.value) await mainAudio.value?.play().catch(() => {})
              if (mainAudio.value) mainAudio.value.oncanplay = null
            }
          }
        }
      }
    }

    // 2. Update Ambient
    if (ambientAudio.value) {
      const wasAmbientPlaying = !isAmbientMuted.value
      const ambientUrl = ambientPlaylist[newName] || ambientPlaylist['Lập Xuân'] || ''
      const targetAmbientSrc = new URL(ambientUrl, window.location.href).href

      if (ambientAudio.value.src !== targetAmbientSrc) {
        ambientAudio.value.pause()
        ambientAudio.value.src = ambientUrl
        ambientAudio.value.load()

        if (wasAmbientPlaying) {
          try {
            await ambientAudio.value.play()
          } catch {
            ambientAudio.value.oncanplay = async () => {
              if (!isAmbientMuted.value) await ambientAudio.value?.play().catch(() => {})
              if (ambientAudio.value) ambientAudio.value.oncanplay = null
            }
          }
        }
      }
    }
  },
)

onMounted(() => {
  if (mainAudio.value) {
    mainAudio.value.volume = 0.4
  }
  if (ambientAudio.value) {
    ambientAudio.value.volume = 0.6
  }
})

onUnmounted(() => {
  if (mainAudio.value) mainAudio.value.pause()
  if (ambientAudio.value) ambientAudio.value.pause()
})
</script>

<template>
  <div class="fixed bottom-8 right-8 z-[60] flex flex-col items-end gap-6 pointer-events-none">
    <audio ref="mainAudio" loop crossorigin="anonymous"></audio>
    <audio ref="ambientAudio" loop crossorigin="anonymous"></audio>

    <!-- Ambient Sound Toggle (Above Bar - Centered) -->
    <button
      @click="toggleAmbient"
      :class="[
        'fixed bottom-20 right-4 sm:bottom-36 sm:right-[164px] z-[100] p-3 sm:p-4 rounded-full backdrop-blur-3xl border transition-all duration-500 flex items-center justify-center group pointer-events-auto',
        !isAmbientMuted
          ? 'bg-blue-500/20 border-blue-500/50 text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.2)]'
          : 'bg-black/40 border-white/10 text-white/40',
      ]"
      title="Âm thanh tự nhiên"
    >
      <div class="relative w-5 h-5 flex items-center justify-center overflow-hidden">
        <svg
          v-if="!isAmbientMuted"
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="animate-pulse"
        >
          <path
            d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8a13 13 0 0 1-13 13L8.1 20H11Z"
          ></path>
          <path d="M11 20c0-4.5 7-8 7-8"></path>
        </svg>
        <svg
          v-else
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path
            d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8a13 13 0 0 1-13 13L8.1 20H11Z"
          ></path>
          <line x1="2" y1="2" x2="22" y2="22"></line>
        </svg>
      </div>
      <div
        class="absolute bottom-full mb-4 right-0 px-3 py-1.5 rounded-lg bg-black/80 backdrop-blur-md border border-white/10 text-[10px] font-mono whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none uppercase tracking-widest translate-y-4 group-hover:translate-y-0"
      >
        Âm thanh Môi trường
      </div>
    </button>

    <!-- Music Bar (Standard) -->
    <button
      @click="toggleMute"
      :class="[
        'fixed bottom-8 right-8 z-[60] px-6 py-4 rounded-full backdrop-blur-3xl border transition-all duration-500 flex items-center justify-between gap-4 group pointer-events-auto w-[280px] md:w-[320px]',
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

      <div class="flex flex-col items-start min-w-0">
        <span class="text-[9px] uppercase tracking-[0.3em] text-accent-coral/60 font-mono mb-1"
          >Đang phát</span
        >
        <h3 class="text-sm font-display font-bold tracking-widest truncate w-full">
          {{ props.termName }} - Âm Khuyết Thi Thính
        </h3>
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
