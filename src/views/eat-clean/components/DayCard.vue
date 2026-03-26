<script setup lang="ts">
import { Icon } from '@iconify/vue'
import type { DayPlan } from '../data/meals'

defineProps<{
  dayData: DayPlan
}>()

defineEmits<{
  (e: 'refresh-day'): void
  (e: 'refresh-meal', mealType: 'breakfast' | 'lunch' | 'dinner'): void
  (e: 'view-recipe', mealId: string): void
}>()
</script>

<template>
  <div class="bg-bg-surface border border-border-default hover:border-accent-coral transition-all duration-300 p-6 group">
    <div class="flex justify-between items-center mb-6">
      <h3 class="text-xl font-display font-bold text-white tracking-tight">{{ dayData.day }}</h3>
      <button 
        @click="$emit('refresh-day')" 
        class="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-bg-elevated text-text-secondary hover:text-white"
        title="Làm mới cả ngày"
      >
        <Icon icon="lucide:refresh-cw" class="size-4" />
      </button>
    </div>
    
    <div class="space-y-4">
      <div 
        v-for="type in (['breakfast', 'lunch', 'dinner'] as const)" 
        :key="type" 
        class="p-4 bg-bg-deep border border-border-default hover:border-accent-amber/50 transition-colors relative group/meal cursor-pointer"
        @click="$emit('view-recipe', dayData[type].id)"
      >
        <div class="text-[10px] uppercase tracking-widest text-text-dim mb-1 font-display">
          {{ type === 'breakfast' ? 'Sáng' : type === 'lunch' ? 'Trưa' : 'Tối' }}
        </div>
        <div class="text-sm font-medium text-text-primary pr-8 leading-snug">
          {{ dayData[type].name }}
        </div>
        <div class="text-[10px] text-text-secondary mt-1 flex items-center gap-1">
          <Icon icon="lucide:flame" class="size-3 text-accent-amber" />
          {{ dayData[type].calories }} kcal
        </div>
        
        <button 
          @click.stop="$emit('refresh-meal', type)" 
          class="absolute top-4 right-4 opacity-0 group-hover/meal:opacity-100 transition-opacity p-1.5 hover:bg-bg-elevated rounded text-text-dim hover:text-accent-amber"
          title="Đổi món này"
        >
          <Icon icon="lucide:refresh-cw" class="size-3" />
        </button>
      </div>
    </div>
  </div>
</template>
