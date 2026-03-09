<script setup lang="ts">
import { ref, computed } from 'vue'
import { RouterLink } from 'vue-router'

interface Level {
  id: number
  description: string
  initialCode: string
  targetHtml: string
  hint: string
}

const levels: Level[] = [
  {
    id: 1,
    description: "Khởi động nhẹ nhàng: Hãy canh giữa nội dung theo chiều ngang.",
    initialCode: "/* CSS của div ngoài */\n.container {\n  display: flex;\n  \n}",
    targetHtml: '<div class="w-16 h-16 bg-accent-coral flex items-center justify-center font-display font-bold text-bg-deep shadow-lg">01</div>',
    hint: "Thử dùng justify-content xem sao?"
  },
  {
    id: 2,
    description: "Tăng độ khó: Bây giờ canh giữa luôn cả chiều dọc nhé.",
    initialCode: "/* CSS của div ngoài */\n.container {\n  display: flex;\n  justify-content: center;\n  \n}",
    targetHtml: '<div class="w-20 h-20 bg-accent-amber rounded-full flex items-center justify-center font-display font-bold text-bg-deep shadow-lg">02</div>',
    hint: "Bạn còn nhớ align-items không?"
  },
  {
    id: 3,
    description: "Tuyệt kĩ một dòng: Làm sao để canh giữa hoàn hảo chỉ với Line of Code?",
    initialCode: "/* CSS của div ngoài */\n.container {\n  display: grid;\n  \n}",
    targetHtml: '<div class="w-24 h-24 bg-accent-sky rotate-12 flex items-center justify-center font-display font-bold text-bg-deep shadow-lg">03</div>',
    hint: "Bí thuật: place-items: center;"
  },
  {
    id: 4,
    description: "Cổ điển: Thử thách canh giữa mà không dùng Flexbox hay Grid.",
    initialCode: "/* CSS của khối 04 (Lưu ý: container đã có position: relative) */\n.box {\n  position: absolute;\n  top: 50%;\n  left: 50%;\n  \n}",
    targetHtml: '<div class="box w-20 h-20 border-4 border-text-primary bg-bg-surface flex items-center justify-center font-display font-bold text-text-primary shadow-lg">04</div>',
    hint: "Dịch chuyển ngược lại 50% kích thước bản thân. Bạn nhớ thuộc tính transform không?"
  },
  {
    id: 5,
    description: "Trùm cuối: Canh giữa tuyệt đối dùng margin auto.",
    initialCode: "/* CSS của khối 05 (Lưu ý: container đã có position: relative) */\n.box {\n  position: absolute;\n  inset: 0;\n  \n}",
    targetHtml: '<div class="box w-16 h-16 bg-text-primary rounded-xl flex items-center justify-center font-display font-bold text-bg-deep shadow-2xl skew-x-12">05</div>',
    hint: "Nếu inset: 0 (top/left/right/bottom = 0) thì trình duyệt không biết ép vào đâu nếu thiếu một thuộc tính margin thần thánh."
  }
]

const currentLevelIndex = ref(0)
// We cast to Level because we know index is always valid
const currentLevel = computed(() => levels[currentLevelIndex.value] as Level)
const userCode = ref(levels[0]!.initialCode)
const isSuccess = ref(false)
const showHint = ref(false)

// We check for success by simulating the CSS
// Since we don't have a real DOM parser here we check keywords
// A simple naive approach for the game logic
const checkSuccess = () => {
  const code = userCode.value.toLowerCase().replace(/\s/g, '')
  const lvl = currentLevel.value.id
  
  if (lvl === 1) {
    if (code.includes('justify-content:center')) isSuccess.value = true
    else isSuccess.value = false
  } else if (lvl === 2) {
    if (code.includes('justify-content:center') && code.includes('align-items:center')) isSuccess.value = true
    else isSuccess.value = false
  } else if (lvl === 3) {
    if (code.includes('place-items:center') || (code.includes('justify-content:center') && code.includes('align-items:center'))) isSuccess.value = true
    else isSuccess.value = false
  } else if (lvl === 4) {
    if (code.includes('transform:translate(-50%,-50%)') || code.includes('translate:-50%-50%')) isSuccess.value = true
    else isSuccess.value = false
  } else if (lvl === 5) {
    if (code.includes('margin:auto')) isSuccess.value = true
    else isSuccess.value = false
  }
}

const extractCssRules = computed(() => {
  // Extract rules from the code to apply them dynamically via inline style
  try {
    const rules = userCode.value.split('{')[1]!.split('}')[0]
    return rules
  } catch {
    return ''
  }
})


const nextLevel = () => {
  if (currentLevelIndex.value < levels.length - 1) {
    currentLevelIndex.value++
    userCode.value = currentLevel.value.initialCode
    isSuccess.value = false
    showHint.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body flex flex-col p-4 md:p-8 relative overflow-hidden">
    
    <!-- Background Number -->
    <span class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-display text-[15rem] md:text-[25rem] font-bold text-accent-coral/5 select-none pointer-events-none -z-10 animate-fade-up">
      {{ String(currentLevel.id).padStart(2, '0') }}
    </span>

    <div class="max-w-6xl mx-auto w-full animate-fade-up">
      
      <!-- Header -->
      <header class="flex flex-col md:flex-row items-start justify-between mb-8 gap-4 border-b border-border-default pb-6">
        <div>
          <h1 class="font-display text-3xl font-semibold text-text-primary flex items-center gap-3">
            <span class="text-accent-coral font-display text-sm tracking-widest">//</span>
            Will It Center?
          </h1>
          <p class="text-text-secondary mt-2">{{ currentLevel.description }}</p>
        </div>
        
        <div class="flex items-center gap-4">
          <span class="font-display text-text-dim text-sm tracking-widest bg-bg-surface px-4 py-2 border border-border-default">
            LEVEL {{ currentLevel.id }} / {{ levels.length }}
          </span>
          <RouterLink
            to="/"
            class="text-sm text-text-secondary hover:text-accent-coral transition-colors underline-offset-4 hover:underline"
          >
            Thoát game
          </RouterLink>
        </div>
      </header>

      <!-- Game Area -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
        
        <!-- Editor Side -->
        <div class="flex flex-col gap-4">
          <div class="bg-bg-surface border border-border-default flex flex-col h-[400px] relative group">
            <div class="bg-bg-elevated border-b border-border-default px-4 py-2 flex items-center justify-between">
              <span class="font-display text-xs text-text-secondary tracking-widest">STYLE.CSS</span>
              
              <button 
                @click="showHint = !showHint"
                class="text-xs text-accent-sky hover:text-text-primary transition-colors flex items-center gap-1"
              >
                <span class="text-[10px]">?</span> HINT
              </button>
            </div>
            
            <textarea 
              v-model="userCode" 
              @input="checkSuccess"
              class="flex-1 w-full bg-transparent border-none outline-none resize-none p-4 font-mono text-sm text-accent-amber leading-relaxed whitespace-pre"
              spellcheck="false"
            ></textarea>
            
            <!-- Hint Box -->
            <div v-if="showHint" class="absolute bottom-4 right-4 max-w-xs bg-bg-elevated border-l-2 border-accent-sky p-3 text-sm text-text-secondary shadow-lg animate-fade-up z-10">
              <span class="text-accent-sky font-bold block mb-1">Gợi ý:</span>
              {{ currentLevel.hint }}
            </div>
          </div>
        </div>

        <!-- Preview Side -->
        <div class="flex flex-col gap-4">
          <div 
            class="bg-bg-surface border h-[400px] transition-all duration-500 overflow-hidden relative"
            :class="isSuccess ? 'border-accent-coral shadow-[0_0_30px_rgba(255,107,74,0.15)] pulse-border-once' : 'border-border-default'"
          >
            <div class="bg-bg-elevated border-b border-border-default px-4 py-2 flex items-center justify-between">
              <span class="font-display text-xs text-text-secondary tracking-widest">PREVIEW</span>
              <span v-if="isSuccess" class="font-display text-xs text-accent-coral tracking-widest animate-pulse">CENTERED!</span>
            </div>
            
            <!-- Target Container -->
            <div class="w-full h-[calc(100%-37px)] p-4">
              <!-- Inline style binding from extracted rules -->
              <div 
                class="w-full h-full border border-dashed border-border-default/50 relative transition-all duration-300"
                :style="extractCssRules"
              >
                <!-- Render the dynamic HTML element to be centered -->
                <div v-html="currentLevel.targetHtml"></div>
                
                <!-- Guidelines to show the center -->
                <div class="absolute top-1/2 left-0 w-full border-t border-dashed border-border-default/30 -translate-y-px pointer-events-none"></div>
                <div class="absolute left-1/2 top-0 h-full border-l border-dashed border-border-default/30 -translate-x-px pointer-events-none"></div>
                <div class="absolute top-1/2 left-1/2 w-2 h-2 rounded-full bg-border-default/50 -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
              </div>
            </div>
            
            <!-- Success Overlay -->
            <div 
              v-if="isSuccess" 
              class="absolute inset-0 bg-bg-deep/80 backdrop-blur-sm flex flex-col items-center justify-center animate-fade-up z-20"
            >
              <h2 class="font-display text-4xl font-bold text-accent-coral mb-6 text-center">HOÀN HẢO!</h2>
              
              <button 
                v-if="currentLevelIndex < levels.length - 1"
                @click="nextLevel"
                class="font-display text-sm text-bg-deep bg-text-primary px-8 py-3 font-bold tracking-widest transition-all hover:bg-accent-coral hover:scale-105"
              >
                LEVEL TIẾP THEO
              </button>
              
              <div v-else class="text-center">
                <p class="text-accent-amber mb-6">Bạn đã chiến thắng thử thách CSS!</p>
                <RouterLink
                  to="/"
                  class="font-display text-sm text-bg-deep bg-text-primary px-8 py-3 font-bold tracking-widest transition-all hover:bg-accent-coral hover:scale-105 inline-block"
                >
                  VỀ TRANG CHỦ
                </RouterLink>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
.pulse-border-once {
  animation: pulse-border 1.5s ease-out 1;
}

@keyframes pulse-border {
  0% { border-color: var(--color-border-default); box-shadow: 0 0 0 rgba(255,107,74,0); }
  50% { border-color: var(--color-accent-coral); box-shadow: 0 0 30px rgba(255,107,74,0.3); }
  100% { border-color: var(--color-accent-coral); box-shadow: 0 0 20px rgba(255,107,74,0.15); }
}
</style>
