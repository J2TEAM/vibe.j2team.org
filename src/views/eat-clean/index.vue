<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { Icon } from '@iconify/vue'
import { useLocalStorage } from '@vueuse/core'
import { toPng } from 'html-to-image'
import { generateWeeklyMenu, breakfasts, lunches, dinners, getRandomItem } from './data/meals'
import type { DayPlan } from './data/meals'
import DayCard from './components/DayCard.vue'
import RecipeDetail from './components/RecipeDetail.vue'

// Persistence using VueUse
const weekPlan = useLocalStorage<DayPlan[]>('eat-clean-weekly-menu', [])

const selectedRecipeId = ref<string | null>(null)
const captureRef = ref<HTMLElement | null>(null)
const isExporting = ref(false)

const generateNewWeek = () => {
  weekPlan.value = generateWeeklyMenu()
}

const refreshDay = (dayIndex: number) => {
  if (!weekPlan.value[dayIndex]) return
  
  const current = weekPlan.value[dayIndex]
  weekPlan.value[dayIndex] = {
    day: current.day,
    breakfast: getRandomItem(breakfasts, current.breakfast.id),
    lunch: getRandomItem(lunches, current.lunch.id),
    dinner: getRandomItem(dinners, current.dinner.id)
  }
}

const mealDataMap = {
  breakfast: breakfasts,
  lunch: lunches,
  dinner: dinners
}

const refreshMeal = (dayIndex: number, mealType: 'breakfast' | 'lunch' | 'dinner') => {
  if (!weekPlan.value[dayIndex]) return
  
  const currentMealId = weekPlan.value[dayIndex][mealType].id
  weekPlan.value[dayIndex][mealType] = getRandomItem(mealDataMap[mealType], currentMealId)
}

const downloadImage = async () => {
  if (!captureRef.value) return
  isExporting.value = true
  
  try {
    // Wait for next tick to ensure UI updates if needed
    await new Promise(resolve => setTimeout(resolve, 100))
    
    const dataUrl = await toPng(captureRef.value, {
      backgroundColor: '#0f1923', // --color-bg-deep
      pixelRatio: 2,
      style: {
        transform: 'scale(1)',
        padding: '2rem'
      },
      filter: (node: Node) => {
        // Filter out elements with data-no-capture
        if (node instanceof HTMLElement && node.hasAttribute('data-no-capture')) {
          return false
        }
        return true
      }
    })
    
    const link = document.createElement('a')
    link.download = `eat-clean-menu-${new Date().toISOString().split('T')[0]}.png`
    link.href = dataUrl
    link.click()
  } catch (error) {
    console.error('Lỗi khi lưu ảnh:', error)
  } finally {
    isExporting.value = false
  }
}

onMounted(() => {
  if (weekPlan.value.length === 0) {
    generateNewWeek()
  }
})
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body pb-20 selection:bg-accent-coral/30">
    <!-- Header / Hero Section -->
    <header class="relative overflow-hidden bg-bg-surface border-b border-border-default pt-24 pb-16 px-4 mb-12">
      <!-- Decoration Orbs -->
      <div class="absolute top-0 right-0 w-[500px] h-[500px] bg-accent-coral/5 blur-[120px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/4"></div>
      <div class="absolute bottom-0 left-0 w-[300px] h-[300px] bg-accent-amber/5 blur-[80px] rounded-full pointer-events-none translate-y-1/2 -translate-x-1/4"></div>

      <div class="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 relative z-10">
        <div class="text-center md:text-left animate-fade-up">
          <div class="inline-flex items-center gap-2 px-3 py-1 bg-accent-coral/10 text-accent-coral text-[10px] font-display uppercase tracking-widest border border-accent-coral/20 mb-4">
            <Icon icon="lucide:leaf" class="size-3" /> Health & Wellness
          </div>
          <h1 class="text-5xl md:text-6xl font-display font-bold text-white mb-4 tracking-tight">
            Eat <span class="text-accent-coral">Clean</span> Menu
          </h1>
          <p class="text-text-secondary text-lg max-w-xl font-light">
            Thiết kế thực đơn dinh dưỡng cho cả tuần để bạn luôn khỏe đẹp.<br>
            Nhấp vào từng món để xem chi tiết cách chế biến.
          </p>
        </div>

        <div class="flex flex-wrap items-center justify-center gap-4 animate-fade-up animate-delay-1" data-no-capture>
          <button 
            @click="downloadImage" 
            class="flex items-center gap-2 px-6 py-3 bg-bg-elevated border border-border-default hover:border-accent-coral hover:text-white transition-all duration-300 font-display font-bold text-sm tracking-wide group"
            :disabled="isExporting"
          >
            <Icon :icon="isExporting ? 'lucide:loader-2' : 'lucide:download'" class="size-4 group-hover:-translate-y-0.5 transition-transform" :class="{'animate-spin': isExporting}" />
            {{ isExporting ? 'Đang xuất...' : 'Lưu Thực Đơn' }}
          </button>
          <button 
            @click="generateNewWeek" 
            class="flex items-center gap-2 px-6 py-3 bg-accent-coral text-white hover:bg-accent-coral/90 transition-all duration-300 font-display font-bold text-sm tracking-wide group"
          >
            <Icon icon="lucide:refresh-ccw" class="size-4 group-hover:rotate-180 transition-transform duration-700" />
            Đổi Thực Đơn
          </button>
        </div>
      </div>
    </header>

    <!-- Main Grid -->
    <main ref="captureRef" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Title for exported image (hidden in UI) -->
      <div class="hidden" :class="{ 'block mb-8': isExporting }">
        <h2 class="text-4xl font-display font-bold text-white">Thực Đơn Eat Clean Của Tôi</h2>
        <p class="text-text-secondary mt-2">www.mtdes23.id.vn</p>
      </div>

      <!-- First Row: Thứ 2 - Thứ 4 (3 days) -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <DayCard
          v-for="(day, index) in weekPlan.slice(0, 3)"
          :key="day.day"
          :day-data="day"
          class="animate-fade-up"
          :style="{ animationDelay: `${(index + 2) * 100}ms` }"
          @refresh-day="refreshDay(index)"
          @refresh-meal="(mealType) => refreshMeal(index, mealType)"
          @view-recipe="(id) => selectedRecipeId = id"
        />
      </div>

      <!-- Second Row: Thứ 5 - Chủ Nhật (4 days) -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <DayCard
          v-for="(day, index) in weekPlan.slice(3, 7)"
          :key="day.day"
          :day-data="day"
          class="animate-fade-up"
          :style="{ animationDelay: `${(index + 5) * 100}ms` }"
          @refresh-day="refreshDay(index + 3)"
          @refresh-meal="(mealType) => refreshMeal(index + 3, mealType)"
          @view-recipe="(id) => selectedRecipeId = id"
        />
      </div>

      <!-- Footer for exported image -->
      <div class="hidden" :class="{ 'block mt-12 pt-8 border-t border-border-default text-center': isExporting }">
        <p class="text-text-dim text-sm tracking-widest uppercase">Designed by mtdes23 • vibe.j2team.org</p>
      </div>
    </main>

    <!-- Custom Footer -->
    <footer class="mt-24 py-12 border-t border-border-default relative overflow-hidden" data-no-capture>
      <div class="max-w-7xl mx-auto px-4 flex flex-col items-center">
        <div class="flex items-center gap-6 mb-8 text-text-dim">
          <RouterLink to="/" class="hover:text-white transition-colors flex items-center gap-2 text-sm font-display tracking-widest uppercase">
            <Icon icon="lucide:arrow-left" class="size-4" /> Về Trang Chủ
          </RouterLink>
        </div>
        
        <div class="text-center">
          <p class="text-text-secondary font-light text-sm mb-2">Designed by <span class="text-white font-bold">mtdes23</span></p>
          <a 
            href="https://www.mtdes23.id.vn" 
            target="_blank" 
            rel="noopener noreferrer"
            class="text-accent-coral hover:text-accent-amber transition-colors font-display text-xs tracking-[0.2em] font-bold uppercase"
          >
            www.mtdes23.id.vn
          </a>
        </div>
      </div>
    </footer>

    <!-- Recipe Detail Modal -->
    <RecipeDetail 
      v-if="selectedRecipeId" 
      :id="selectedRecipeId" 
      @close="selectedRecipeId = null" 
    />
  </div>
</template>

<style scoped>
/* Optional: specific styles if needed */
</style>
