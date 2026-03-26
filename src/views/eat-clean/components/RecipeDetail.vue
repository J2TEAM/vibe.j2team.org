<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import { breakfasts, lunches, dinners } from '../data/meals'
import { recipes } from '../data/recipes'

const props = defineProps<{
  id: string
}>()

defineEmits<{
  (e: 'close'): void
}>()

const allMeals = [...breakfasts, ...lunches, ...dinners]

const meal = computed(() => {
  return allMeals.find(m => m.id === props.id)
})

const recipe = computed(() => {
  return recipes[props.id] || null
})

const defaultRecipe = {
  ingredients: [
    '100g protein (ức gà/cá/bò) sạch',
    '150g rau xanh (súp lơ/xà lách/cải)',
    '1/2 bát tinh bột chậm (cơm lứt/khoai lang)',
    'Gia vị healthy (dầu oliu, tiêu, chanh)'
  ],
  steps: [
    'Sơ chế sạch các nguyên liệu, rau củ cắt miếng vừa ăn.',
    'Chế biến protein (áp chảo/luộc/hấp) với chút dầu oliu và gia vị nhạt.',
    'Rau củ luộc chín hoặc trộn salad với nước sốt mè rang.',
    'Bày biện ra đĩa thật đẹp và thưởng thức thôi! ✨'
  ]
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg-deep/80 backdrop-blur-md animate-fade-in">
    <div class="bg-bg-surface border border-border-default w-full max-w-3xl max-h-[90vh] overflow-y-auto relative animate-fade-up">
      <!-- Close Button -->
      <button 
        @click="$emit('close')"
        class="absolute top-4 right-4 p-2 hover:bg-bg-elevated text-text-secondary hover:text-white transition-colors z-10"
      >
        <Icon icon="lucide:x" class="size-6" />
      </button>

      <div class="p-8 sm:p-12">
        <div class="flex flex-wrap items-center gap-3 mb-6">
          <span class="px-3 py-1 bg-accent-coral/10 text-accent-coral text-[10px] font-display uppercase tracking-widest border border-accent-coral/20">
            Chi tiết Công thức
          </span>
          <span class="px-3 py-1 bg-accent-amber/10 text-accent-amber text-[10px] font-display uppercase tracking-widest border border-accent-amber/20 flex items-center gap-1">
            <Icon icon="lucide:flame" class="size-3" /> {{ meal?.calories || 0 }} kcal
          </span>
        </div>
        
        <h2 class="text-3xl sm:text-4xl font-display font-bold text-white mb-8 tracking-tight">
          {{ meal?.name || 'Món ăn không tìm thấy 🤔' }}
        </h2>
        
        <div v-if="meal" class="grid grid-cols-1 md:grid-cols-2 gap-12">
          <!-- Ingredients -->
          <div>
            <h3 class="text-xl font-display font-bold text-white mb-6 flex items-center gap-2">
              <Icon icon="lucide:shopping-basket" class="size-5 text-accent-amber" />
              Nguyên Liệu
            </h3>
            <ul class="space-y-4">
              <li 
                v-for="(item, idx) in (recipe?.ingredients || defaultRecipe.ingredients)" 
                :key="idx" 
                class="flex gap-3 text-text-secondary text-sm p-4 bg-bg-deep border border-border-default hover:border-accent-coral/30 transition-colors"
              >
                <Icon icon="lucide:check-circle" class="size-4 text-accent-coral shrink-0 mt-0.5" />
                <span>{{ item }}</span>
              </li>
            </ul>
          </div>
          
          <!-- Steps -->
          <div>
            <h3 class="text-xl font-display font-bold text-white mb-6 flex items-center gap-2">
              <Icon icon="lucide:chef-hat" class="size-5 text-accent-sky" />
              Cách Chế Biến
            </h3>
            <div class="space-y-6">
              <div 
                v-for="(step, idx) in (recipe?.steps || defaultRecipe.steps)" 
                :key="idx" 
                class="flex gap-4"
              >
                <div class="flex flex-col items-center">
                  <div class="size-7 bg-bg-elevated border border-border-default flex items-center justify-center text-white font-display font-bold text-xs shrink-0">
                    {{ idx + 1 }}
                  </div>
                  <div v-if="idx !== (recipe?.steps?.length || defaultRecipe.steps.length) - 1" class="w-px h-full bg-border-default my-2"></div>
                </div>
                <div class="pb-2">
                  <p class="text-text-secondary text-sm leading-relaxed">{{ step }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-fade-in {
  animation: fade-in 0.3s ease-out both;
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
