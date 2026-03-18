<template>
  <div class="flex flex-col items-center w-full">
    <p class="text-text-primary font-display font-medium text-lg mb-6 text-center leading-relaxed">
      Nhấn nút dưới đây <br />
      <span class="text-accent-sky font-bold text-xl">CHÍNH XÁC sau 3 giây</span> kể từ khi bắt đầu.
    </p>

    <div class="relative w-full max-w-sm flex flex-col items-center">
      <button
        v-if="state === 'idle' || state === 'failed'"
        @click="startTimer"
        class="bg-bg-deep border border-accent-sky text-accent-sky hover:bg-accent-sky/10 px-8 py-3 font-display font-bold transition-all w-full"
      >
        Bắt đầu đếm thời gian
      </button>

      <button
        v-if="state === 'running'"
        @click="stopTimer"
        class="bg-accent-sky text-bg-deep px-8 py-3 font-display font-bold transition-all w-full shadow-[4px_4px_0_0_rgba(56,189,248,0.5)] hover:shadow-none hover:translate-x-1 hover:translate-y-1"
      >
        DỪNG LẠI!
      </button>

      <!-- Status Messages -->
      <div v-if="state === 'failed'" class="mt-6 text-center animate-fade-in-up">
        <p class="text-accent-coral font-bold text-lg">Thất bại!</p>
        <p class="text-text-secondary text-sm mt-1">
          Đã trôi qua: {{ (timeElapsed / 1000).toFixed(3) }} giây.
        </p>
        <p class="text-text-dim text-xs mt-2 italic">Phạm vi cho phép: 2.8s - 3.4s</p>
      </div>

      <div v-if="state === 'success'" class="mt-6 text-center animate-bounce-in">
        <p class="text-emerald-500 font-bold text-xl uppercase tracking-wider">Perfect Timing!</p>
        <p class="text-text-primary mt-1">
          Chuẩn {{ (timeElapsed / 1000).toFixed(3) }}s. Bạn như một cái đồng hồ đo.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits(['pass'])

type State = 'idle' | 'running' | 'failed' | 'success'
const state = ref<State>('idle')
const startTime = ref(0)
const timeElapsed = ref(0)

const startTimer = () => {
  state.value = 'running'
  startTime.value = Date.now()
  timeElapsed.value = 0
}

const stopTimer = () => {
  if (state.value !== 'running') return

  const now = Date.now()
  timeElapsed.value = now - startTime.value

  // Pass condition: between 2800ms and 3400ms
  if (timeElapsed.value >= 2800 && timeElapsed.value <= 3400) {
    state.value = 'success'
    setTimeout(() => {
      emit('pass')
    }, 1500)
  } else {
    state.value = 'failed'
  }
}
</script>
