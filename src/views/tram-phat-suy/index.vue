<script setup lang="ts">
import { ref } from 'vue'

const lyrics = [
  "Lần cuối đi bên nhau, cay đắng nhưng không đau...",
  "Em dạo này có còn xem phim một mình?",
  "Cho tôi đi theo với, nơi anh đi về...",
  "Cùng lắm thì mình lại lênh đênh...",
  "Nếu một mai tôi có bay lên trời, thì người ơi tôi đã quên anh rồi."
]

const currentLyric = ref(lyrics[0])
const isFading = ref(false)

const changeLyric = () => {
  isFading.value = true
  
  setTimeout(() => {
    let randomIndex
    do {
      randomIndex = Math.floor(Math.random() * lyrics.length)
    } while (lyrics[randomIndex] === currentLyric.value && lyrics.length > 1)
    
    currentLyric.value = lyrics[randomIndex]
    isFading.value = false
  }, 400) // Thời gian đợi hiệu ứng mờ
}
</script>

<template>
  <div class="min-h-screen bg-zinc-900 text-gray-200 flex flex-col items-center justify-center p-6 font-sans relative overflow-hidden">
    <router-link to="/" class="absolute top-6 left-6 text-sm text-zinc-400 hover:text-white transition-colors flex items-center gap-2 z-10">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" />
      </svg>
      Về trang chủ
    </router-link>

    <div class="max-w-2xl text-center flex flex-col items-center w-full z-10">
      <div class="relative w-48 h-48 md:w-64 md:h-64 mb-12">
        <div class="absolute inset-0 bg-zinc-800 rounded-full border-8 border-zinc-950 shadow-2xl animate-[spin_4s_linear_infinite] flex items-center justify-center">
          <div class="absolute inset-2 rounded-full border border-zinc-700/50"></div>
          <div class="absolute inset-6 rounded-full border border-zinc-700/50"></div>
          <div class="absolute inset-10 rounded-full border border-zinc-700/50"></div>
          <div class="w-16 h-16 bg-red-800/80 rounded-full flex items-center justify-center border-4 border-zinc-900">
            <div class="w-3 h-3 bg-zinc-900 rounded-full"></div>
          </div>
        </div>
      </div>

      <div 
        class="min-h-[120px] flex items-center justify-center transition-opacity duration-400 ease-in-out px-4"
        :class="{ 'opacity-0 scale-95': isFading, 'opacity-100 scale-100': !isFading }"
      >
        <p class="text-2xl md:text-3xl font-sans italic text-zinc-300 leading-relaxed tracking-wide drop-shadow-md">
          "{{ currentLyric }}"
        </p>
      </div>

      <button 
        @click="changeLyric"
        class="mt-12 px-8 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-full shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-all duration-200 transform hover:scale-105 active:scale-95 border border-zinc-700/50 flex items-center gap-3"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" />
        </svg>
        Đổi đĩa, suy tiếp
      </button>
    </div>
  </div>
</template>