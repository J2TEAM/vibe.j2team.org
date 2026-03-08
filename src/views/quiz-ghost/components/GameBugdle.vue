<script setup lang="ts">
import { ref } from 'vue'
import { useDailyQuiz } from '../composables/useDailyQuiz'
import type { BugdleItem } from '../types'
import AutocompleteInput from './AutocompleteInput.vue'

const { questions, options, guesses, status, addGuessAsync, nextQuestion, goToQuestion, isUnlocked, currentQ, isFinished, score, isLoading, isGuessing, isError } = useDailyQuiz<BugdleItem, BugdleItem>('bugdle')

const inputVal = ref('')

const handleGuess = async () => {
  if (currentQ.value < 0 || !questions.value[currentQ.value] || !inputVal.value.trim() || isGuessing.value) return
  const guess = inputVal.value.trim()
  inputVal.value = ''
  await addGuessAsync(currentQ.value, guess)
}

const getMatchColor = (compStatus?: string) => {
  if (compStatus === 'correct') return 'text-green-400 border-green-400/30 bg-green-900/10'
  return 'text-red-400 border-red-400/30 bg-red-900/10'
}
</script>

<template>
  <div class="space-y-8 max-w-4xl mx-auto font-body text-text-primary animate-fade-up">

    <!-- Header Section -->
    <div class="flex flex-col items-center gap-2 mb-6">
      <h2 class="font-display text-3xl font-bold text-accent-coral flex items-center gap-3">
        <span class="text-accent-amber">//</span>
        BUGDLE
      </h2>
      <p class="text-text-secondary">Đoán xem lỗi nào đang đợi bạn (5 câu/ngày)</p>
      
      <div v-if="!isFinished && !isLoading && !isError" class="mt-4 flex items-center gap-2">
        <button v-for="i in 5" :key="i"
          @click="goToQuestion(i - 1)"
          :disabled="!isUnlocked(i - 1)"
          class="w-10 h-10 flex items-center justify-center font-display font-bold border transition-all duration-300"
          :class="[
            currentQ === i - 1 ? 'border-accent-coral bg-accent-coral/20 text-accent-coral scale-110' : 'border-border-default bg-bg-deep text-text-dim hover:text-text-primary',
            status[i - 1] === 'won' && currentQ !== i - 1 ? 'border-green-500/50 text-green-500' : '',
            status[i - 1] === 'lost' && currentQ !== i - 1 ? 'border-red-500/50 text-red-500' : '',
            !isUnlocked(i - 1) ? 'opacity-30 cursor-not-allowed hover:text-text-dim' : 'cursor-pointer hover:border-accent-coral/50'
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
      <div class="w-10 h-10 border-4 border-accent-coral border-t-transparent rounded-full animate-spin mb-4"></div>
      <p class="font-display tracking-widest text-text-dim">ĐANG TẢI DỮ LIỆU TỪ SERVER...</p>
    </div>

    <!-- Active Question -->
    <div v-else-if="!isFinished && questions[currentQ]" class="border border-border-default bg-bg-surface p-6 sm:p-8 relative">
      <span class="absolute top-4 right-4 font-display text-4xl sm:text-6xl font-bold text-accent-amber/5 select-none pointer-events-none">
        0{{ currentQ + 1 }}
      </span>

      <!-- Input Area -->
      <div v-if="status[currentQ] === 'playing'" class="flex flex-col sm:flex-row gap-4 mb-4">
        <div class="relative flex-1">
          <AutocompleteInput
            v-model="inputVal"
            @submit="handleGuess"
            :disabled="isGuessing"
            :options="options"
            themeClass="focus:border-accent-coral"
            placeholder="Nhập tên Bug/Lỗi (vd: CORS error)..."
          />
        </div>
        <button @click="handleGuess" :disabled="isGuessing" class="px-8 py-3 bg-accent-coral text-bg-deep font-display font-bold hover:bg-white hover:text-accent-coral transition-colors duration-300 disabled:opacity-50 flex items-center justify-center min-w-[120px]">
          <span v-if="isGuessing" class="w-5 h-5 border-2 border-bg-deep border-t-transparent rounded-full animate-spin"></span>
          <span v-else>ĐOÁN</span>
        </button>
      </div>
      
      <!-- Lượt đoán Header -->
      <div v-if="status[currentQ] === 'playing'" class="text-right text-xs font-display text-text-dim mb-6 tracking-wide">
        Số lượt đã đoán: <span class="text-accent-amber font-bold">{{ guesses[currentQ]?.length || 0 }}</span>
      </div>

      <!-- Per-Question Result Panel -->
      <div v-if="status[currentQ] === 'won' || status[currentQ] === 'lost'" class="w-full mb-8 pt-6 pb-8 border border-border-default flex flex-col items-center animate-fade-up" :class="status[currentQ] === 'won' ? 'bg-green-900/10 border-green-500/30' : 'bg-red-900/10 border-red-500/30'">
         <div class="text-4xl mb-4">{{ status[currentQ] === 'won' ? '🎉' : '💀' }}</div>
         <h4 class="font-display text-2xl font-bold tracking-widest mb-1" :class="status[currentQ] === 'won' ? 'text-green-400' : 'text-red-400'">
            {{ status[currentQ] === 'won' ? 'CHÍNH XÁC' : 'THẤT BẠI' }}
         </h4>
         <p class="text-text-secondary mb-6 text-sm">
            {{ status[currentQ] === 'won' ? `Mất ${guesses[currentQ]?.length || 0} lượt đoán.` : `Hết lượt! Đáp án đã bị ẩn đi vĩnh viễn.` }}
         </p>
         
         <button @click="nextQuestion" class="px-8 py-2 border font-display text-sm tracking-widest font-bold transition-colors" :class="status[currentQ] === 'won' ? 'border-green-500/50 text-green-400 hover:bg-green-900/30' : 'border-red-500/50 text-red-400 hover:bg-red-900/30'">
           {{ currentQ < 4 ? 'CÂU TIẾP THEO ➝' : 'XEM KẾT QUẢ TỔNG ➝' }}
         </button>
      </div>

      <!-- Guesses history -->
      <div class="overflow-x-auto pb-4 custom-scrollbar">
        <div class="inline-flex flex-col gap-3 min-w-[700px] w-full">
          <!-- Table Header -->
          <div class="grid grid-cols-5 gap-3 text-center text-xs font-display text-text-dim uppercase tracking-widest pb-3 border-b border-border-default">
            <div>Bug Name</div>
            <div>Language</div>
            <div>Stage</div>
            <div>Trầm Cảm (1-5)</div>
            <div>Common Fix</div>
          </div>
          
          <!-- Rows -->
          <TransitionGroup name="list" tag="div" class="flex flex-col gap-3">
            <div v-for="guess in [...(guesses[currentQ] || [])].reverse()" :key="guess.id" 
              class="grid grid-cols-5 gap-3 text-center text-sm font-medium">
              <div class="p-3 border flex items-center justify-center transition-colors" :class="getMatchColor(guess._comparison?.name)">
                {{ guess.name }}
              </div>
              <div class="p-3 border flex items-center justify-center transition-colors" :class="getMatchColor(guess._comparison?.language)">
                {{ guess._comparison?.language === 'correct' ? guess.language : '???' }}
              </div>
              <div class="p-3 border flex items-center justify-center transition-colors" :class="getMatchColor(guess._comparison?.stage)">
                {{ guess._comparison?.stage === 'correct' ? guess.stage : '???' }}
              </div>
              <div class="p-3 border flex items-center justify-center text-xl font-bold font-display transition-colors" :class="getMatchColor(guess._comparison?.depressionLevel)">
                {{ guess._comparison?.depressionLevel === 'correct' ? guess.depressionLevel : '???' }}
                <span v-if="guess._comparison?.depressionLevel === 'higher'" class="ml-2 text-xs">↑</span>
                <span v-if="guess._comparison?.depressionLevel === 'lower'" class="ml-2 text-xs">↓</span>
              </div>
              <div class="p-3 border flex items-center justify-center transition-colors" :class="getMatchColor(guess._comparison?.commonFix)">
                {{ guess._comparison?.commonFix === 'correct' ? guess.commonFix : '???' }}
              </div>
            </div>
          </TransitionGroup>
          
          <div v-if="(guesses[currentQ] || []).length === 0" class="py-8 text-center text-text-dim italic">
            Chưa có dự đoán nào. Thử một cái tên lỗi đi!
          </div>
        </div>
      </div>
    </div>

    <!-- Final Result Popup / View -->
    <div v-if="isFinished" class="border border-border-default bg-bg-surface p-8 text-center animate-fade-up">
      <div class="mx-auto w-20 h-20 mb-6 border-4 border-accent-coral flex items-center justify-center rotate-3">
        <span class="text-4xl">🐛</span>
      </div>
      <h3 class="font-display text-4xl font-bold text-text-primary mb-2">TỔNG KẾT BUGDLE</h3>
      <p class="text-text-secondary text-lg mb-8">Bạn đã giải xong 5 câu hỏi của ngày hôm nay.</p>
      
      <div class="flex justify-center gap-4 mb-8">
        <div class="text-center p-4 border border-border-default bg-bg-deep w-32">
          <div class="font-display text-4xl font-bold text-accent-sky">{{ score }}</div>
          <div class="text-xs text-text-dim tracking-widest uppercase mt-2">Dự đoán đúng</div>
        </div>
        <div class="text-center p-4 border border-border-default bg-bg-deep w-32">
          <div class="font-display text-4xl font-bold text-accent-coral">{{ 5 - score }}</div>
          <div class="text-xs text-text-dim tracking-widest uppercase mt-2">Đoán sai</div>
        </div>
      </div>
      
      <p class="text-text-dim italic text-sm mb-8">Hẹn gặp lại vào ngày mai với những con bug mới.</p>
      
      <RouterLink to="/" class="inline-flex items-center gap-2 px-6 py-3 border border-border-default hover:border-accent-coral bg-bg-deep text-text-primary hover:text-accent-coral transition-colors font-display text-sm tracking-widest font-bold">
        <span>&larr;</span> TRỞ VỀ HUB GAME
      </RouterLink>
    </div>

  </div>
</template>

<style scoped>
.list-enter-active,
.list-leave-active {
  transition: all 0.4s ease;
}
.list-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}
.list-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
.custom-scrollbar::-webkit-scrollbar {
  height: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: var(--color-bg-deep); 
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: var(--color-border-default); 
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: var(--color-text-dim); 
}
</style>
