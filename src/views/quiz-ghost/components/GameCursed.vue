<script setup lang="ts">
import { ref, computed } from 'vue'
import { useDailyQuiz } from '../composables/useDailyQuiz'
import type { CursedCodeItem } from '../types'
import AutocompleteInput from './AutocompleteInput.vue'

const { questions, options, guesses, status, serverHints, addGuessAsync, nextQuestion, goToQuestion, isUnlocked, currentQ, isFinished, score, isLoading, isGuessing, isError } = useDailyQuiz<CursedCodeItem, string>('cursed', 5)

const inputVal = ref('')

const currentHints = computed(() => {
  if (currentQ.value < 0) return []
  return serverHints.value[currentQ.value] || []
})

const handleGuess = async () => {
  if (currentQ.value < 0 || !questions.value[currentQ.value] || !inputVal.value.trim() || isGuessing.value) return
  const guess = inputVal.value.trim()
  inputVal.value = ''
  await addGuessAsync(currentQ.value, guess)
}
</script>

<template>
  <div class="space-y-8 max-w-4xl mx-auto font-body text-text-primary animate-fade-up">

    <!-- Header Section -->
    <div class="flex flex-col items-center gap-2 mb-6">
      <h2 class="font-display text-3xl font-bold text-accent-coral flex items-center gap-3">
        <span class="text-accent-sky">//</span>
        CURSED CODE
      </h2>
      <p class="text-text-secondary">Đoán Output của những đoạn code trầm cảm (5 câu/ngày)</p>
      
      <div v-if="!isFinished && !isLoading && !isError" class="mt-4 flex items-center gap-2">
        <button v-for="i in 5" :key="i"
          @click="goToQuestion(i - 1)"
          :disabled="!isUnlocked(i - 1)"
          class="w-10 h-10 flex items-center justify-center font-display font-bold border transition-all duration-300"
          :class="[
            currentQ === i - 1 ? 'border-accent-sky bg-accent-sky/20 text-accent-sky scale-110' : 'border-border-default bg-bg-deep text-text-dim hover:text-text-primary',
            status[i - 1] === 'won' && currentQ !== i - 1 ? 'border-green-500/50 text-green-500' : '',
            status[i - 1] === 'lost' && currentQ !== i - 1 ? 'border-red-500/50 text-red-500' : '',
            !isUnlocked(i - 1) ? 'opacity-30 cursor-not-allowed hover:text-text-dim' : 'cursor-pointer hover:border-accent-sky/50'
          ]"
        >
          {{ i }}
        </button>
      </div>
    </div>

    <!-- Error State -->
    <div v-if="isError" class="border border-red-500/50 bg-red-900/20 p-8 text-center animate-fade-up">
      <span class="text-4xl">⚠️</span>
      <h3 class="font-display text-2xl font-bold text-red-400 mt-4">LỖI KẾT NỐI API</h3>
      <p class="text-text-secondary mt-2">Hãy chắc chắn đã dán URL của Google Apps Script vào file <code>useDailyQuiz.ts</code>.</p>
    </div>

    <!-- Loading State -->
    <div v-else-if="isLoading" class="border border-border-default bg-bg-surface p-12 flex flex-col items-center justify-center animate-pulse">
      <div class="w-10 h-10 border-4 border-accent-sky border-t-transparent rounded-full animate-spin mb-4"></div>
      <p class="font-display tracking-widest text-text-dim">ĐANG TẢI DỮ LIỆU TỪ SERVER...</p>
    </div>

    <!-- Active Question -->
    <div v-else-if="!isFinished && questions[currentQ]" class="border border-border-default bg-bg-surface p-6 sm:p-8 relative">
      <span class="absolute top-4 right-4 font-display text-4xl sm:text-6xl font-bold text-accent-amber/5 select-none pointer-events-none">
        0{{ currentQ + 1 }}
      </span>

      <!-- The Snippet -->
      <div class="mb-8 p-6 bg-[#0a0f14] border border-[#1e2d3d] font-mono text-lg relative overflow-hidden group">
        <div class="absolute top-0 right-0 px-3 py-1 bg-border-default text-xs text-text-secondary font-display font-medium tracking-wide">
          {{ questions[currentQ]?.language }}
        </div>
        <div class="text-accent-sky">console<span class="text-text-primary">.</span>log<span class="text-accent-amber">(</span></div>
        <!-- Note: We use 'snippet' from the API payload (which was NOT hidden) -->
        <div class="pl-8 text-2xl font-bold text-accent-coral tracking-wider my-3">{{ questions[currentQ]?.snippet }}</div>
        <div class="text-accent-amber">)</div>
      </div>

      <!-- Input Area -->
      <div v-if="status[currentQ] === 'playing'" class="flex flex-col sm:flex-row gap-4 mb-4">
        <div class="relative flex-1">
          <AutocompleteInput
            v-model="inputVal"
            @submit="handleGuess"
            :disabled="isGuessing"
            :options="options"
            themeClass="focus:border-accent-sky font-mono"
            placeholder="Nhập kết quả in ra màn hình..."
          />
        </div>
        <button @click="handleGuess" :disabled="isGuessing" class="px-8 py-3 bg-accent-sky text-bg-deep font-display font-bold hover:bg-white hover:text-accent-sky transition-colors duration-300 disabled:opacity-50 flex items-center justify-center min-w-[150px]">
          <span v-if="isGuessing" class="w-5 h-5 border-2 border-bg-deep border-t-transparent rounded-full animate-spin"></span>
          <span v-else>CHẠY TEST</span>
        </button>
      </div>

      <!-- Lượt đoán Header -->
      <div v-if="status[currentQ] === 'playing'" class="text-right text-xs font-display text-text-dim mb-6 tracking-wide">
        Số kết quả test: <span class="text-accent-sky font-bold">{{ guesses[currentQ]?.length || 0 }}</span>
      </div>

      <!-- Per-Question Result Panel -->
      <div v-if="status[currentQ] === 'won' || status[currentQ] === 'lost'" class="w-full mb-8 pt-6 pb-8 border border-border-default flex flex-col items-center animate-fade-up" :class="status[currentQ] === 'won' ? 'bg-green-900/10 border-green-500/30' : 'bg-red-900/10 border-red-500/30'">
         <div class="text-4xl mb-4">{{ status[currentQ] === 'won' ? '🎉' : '💀' }}</div>
         <h4 class="font-display text-2xl font-bold tracking-widest mb-1" :class="status[currentQ] === 'won' ? 'text-green-400' : 'text-red-400'">
            {{ status[currentQ] === 'won' ? 'CHÍNH XÁC' : 'THẤT BẠI' }}
         </h4>
         <p class="text-text-secondary mb-6 text-sm">
            {{ status[currentQ] === 'won' ? `Mất ${guesses[currentQ]?.length || 0} lượt test.` : `Hết lượt! Testcase đã fail hoàn toàn.` }}
         </p>
         
         <button @click="nextQuestion" class="px-8 py-2 border font-display text-sm tracking-widest font-bold transition-colors" :class="status[currentQ] === 'won' ? 'border-green-500/50 text-green-400 hover:bg-green-900/30' : 'border-red-500/50 text-red-400 hover:bg-red-900/30'">
           {{ currentQ < 4 ? 'CÂU TIẾP THEO ➝' : 'XEM KẾT QUẢ TỔNG ➝' }}
         </button>
      </div>

      <!-- Hints (now served from serverHints instead of local pre-loaded hints) -->
      <div v-if="(guesses[currentQ] || []).length > 0" class="mb-8 space-y-3">
        <h4 class="font-display text-sm tracking-widest text-text-secondary">GỢI Ý ĐÃ NHẬN({{ currentHints.length }}):</h4>
        <div class="flex flex-col gap-2">
          <div v-for="(hint, index) in currentHints" :key="index" class="p-3 border border-accent-amber/30 bg-accent-amber/5 text-accent-amber flex items-center gap-3 font-mono">
            <span class="text-xl">💡</span> {{ hint }}
          </div>
          <div v-if="status[currentQ] === 'playing'" class="p-3 border border-border-default bg-bg-deep text-text-dim italic flex items-center gap-3">
            <span class="text-xl">🔒</span> Trả lời sai test này để server chọc hint tiếp theo...
          </div>
        </div>
      </div>

      <!-- Guesses history -->
      <div class="overflow-hidden mt-6">
        <h4 class="font-display text-sm tracking-widest text-text-secondary mb-3">LỊCH SỬ TEST KHÔNG QUA:</h4>
        <div class="flex flex-col gap-2">
          <div v-for="(guess, index) in guesses[currentQ]" :key="index" 
            class="p-3 bg-red-900/10 text-red-400 font-mono border border-red-900/50 flex justify-between">
            <span>{{ guess }}</span>
            <span class="font-bold font-display text-sm tracking-widest">THẤT BẠI</span>
          </div>
          <div v-if="(guesses[currentQ] || []).length === 0" class="p-4 border border-dashed border-border-default text-text-dim text-center italic">
            Chưa có kết quả test nào.
          </div>
        </div>
      </div>
      
    </div>

    <!-- Final Result Popup / View -->
    <div v-if="isFinished" class="border border-border-default bg-bg-surface p-8 text-center animate-fade-up">
      <div class="mx-auto w-20 h-20 mb-6 border-4 border-accent-sky flex items-center justify-center rotate-3">
        <span class="text-4xl">💀</span>
      </div>
      <h3 class="font-display text-4xl font-bold text-text-primary mb-2">TỔNG KẾT CURSED CODE</h3>
      <p class="text-text-secondary text-lg mb-8">Bạn đã giải xong 5 câu hỏi của ngày hôm nay.</p>
      
      <div class="flex justify-center gap-4 mb-8">
        <div class="text-center p-4 border border-border-default bg-bg-deep w-32">
          <div class="font-display text-4xl font-bold text-accent-sky">{{ score }}</div>
          <div class="text-xs text-text-dim tracking-widest uppercase mt-2">To cơ</div>
        </div>
        <div class="text-center p-4 border border-border-default bg-bg-deep w-32">
          <div class="font-display text-4xl font-bold text-accent-coral">{{ 5 - score }}</div>
          <div class="text-xs text-text-dim tracking-widest uppercase mt-2">Bị lú</div>
        </div>
      </div>
      
      <p class="text-text-dim italic text-sm mb-8">Hẹn gặp lại bạn vào thử thách hack não tiếp theo.</p>

      <RouterLink to="/" class="inline-flex items-center gap-2 px-6 py-3 border border-border-default hover:border-accent-sky bg-bg-deep text-text-primary hover:text-accent-sky transition-colors font-display text-sm tracking-widest font-bold">
        <span>&larr;</span> TRỞ VỀ HUB GAME
      </RouterLink>
    </div>

  </div>
</template>
