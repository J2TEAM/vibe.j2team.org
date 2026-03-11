<script setup lang="ts">
import { ref } from 'vue'

// Kho tàng lý do kinh điển của giới Dev
const excuses = [
  "Trên máy em nó vẫn chạy bình thường mà! 💻",
  "Chắc do trình duyệt của anh bị cache đấy, Ctrl + F5 đi! 🔄",
  "Đấy là tính năng (feature), không phải bug đâu! 🚀",
  "Tại code của ông làm trước viết lởm quá... 👴",
  "Lạ nhỉ, lúc em test đâu có bị thế này! 🤔",
  "Server đang quá tải thôi, một lát là hết. 🌐",
  "Chắc do cấu hình môi trường (env) bị sai rồi. ⚙️",
  "Trời mưa đứt cáp quang nên nó thế đấy. 🌧️",
  "Em sửa xong rồi nhưng quên chưa push code! 🤦‍♂️",
  "Tester nhà người ta test kiểu gì mà ác thế! 😭"
]

const currentExcuse = ref("Bấm nút đi, xem tại sao lỗi!")
const isSpinning = ref(false)

const spinWheel = () => {
  if (isSpinning.value) return
  isSpinning.value = true

  let count = 0
  const maxSpins = 20 // Số lần text nhảy trước khi dừng
  
  // Tạo hiệu ứng nhảy chữ liên tục
  const interval = setInterval(() => {
    currentExcuse.value = excuses[Math.floor(Math.random() * excuses.length)]
    count++

    if (count >= maxSpins) {
      clearInterval(interval)
      isSpinning.value = false
      // Chốt lại kết quả cuối cùng
      currentExcuse.value = excuses[Math.floor(Math.random() * excuses.length)]
    }
  }, 100) // Tốc độ nhảy chữ (100ms)
}
</script>

<template>
  <div class="min-h-screen bg-indigo-950 flex flex-col items-center justify-center p-6 text-white font-sans relative overflow-hidden">
    <router-link to="/" class="absolute top-6 left-6 text-sm text-indigo-300 hover:text-white transition-colors flex items-center gap-2 z-20">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" />
      </svg>
      Về trang chủ
    </router-link>

    <div class="max-w-3xl text-center flex flex-col items-center w-full z-10">
      <h1 class="text-4xl md:text-6xl font-extrabold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-violet-500 drop-shadow-sm pb-2">
        Vòng Quay Chối Tội 🎲
      </h1>
      <p class="text-indigo-200 mb-12 text-lg md:text-xl">Mỗi lần có bug, hãy để vũ trụ gánh còng lưng giúp bạn!</p>

      <div 
        class="w-full max-w-2xl bg-indigo-900/50 backdrop-blur-md border-2 rounded-3xl p-8 min-h-[200px] flex items-center justify-center shadow-2xl transition-all duration-300"
        :class="isSpinning ? 'border-pink-500/50 shadow-pink-500/20 scale-105' : 'border-indigo-500/30'"
      >
        <p 
          class="text-2xl md:text-3xl font-medium text-indigo-50 leading-relaxed transition-all duration-100"
          :class="{ 'blur-[1px] text-pink-300': isSpinning }"
        >
          {{ currentExcuse }}
        </p>
      </div>

      <button
        @click="spinWheel"
        :disabled="isSpinning"
        class="mt-12 px-10 py-4 text-xl font-bold bg-gradient-to-r from-pink-500 hover:from-pink-600 to-violet-600 hover:to-violet-700 text-white rounded-full shadow-lg transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 border border-white/20"
      >
        {{ isSpinning ? 'Đang tìm lý do...' : 'Cứu Giá Ngay! 🚀' }}
      </button>
    </div>
    
    <div class="absolute top-[-10%] left-[-10%] w-96 h-96 bg-pink-500/20 rounded-full blur-3xl pointer-events-none"></div>
    <div class="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-violet-500/20 rounded-full blur-3xl pointer-events-none"></div>
  </div>
</template>