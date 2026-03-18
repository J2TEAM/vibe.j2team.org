<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { LEGO_COLORS, BRICK_DATA } from '../types'
import type { LegoBrickType } from '../types'

defineProps<{
  activeBrickType: LegoBrickType
  activeColor: string
  canUndo: boolean
  canRedo: boolean
}>()

const emit = defineEmits<{
  'update:activeBrickType': [LegoBrickType]
  'update:activeColor': [string]
  'undo': []
  'redo': []
  'clear': []
}>()

const brickTypes: LegoBrickType[] = ['1x1', '1x2', '2x1', '2x2', '2x3', '2x4', '4x2', '4x4']
</script>

<template>
  <div class="fixed bottom-0 left-0 right-0 p-4 md:p-6 pointer-events-none flex flex-col items-center gap-6 z-50">
    <!-- Action buttons redesign -->
    <div class="flex gap-4 pointer-events-auto bg-bg-surface/80 backdrop-blur-2xl border-2 border-border-default p-2 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
      <button 
        @click="emit('undo')" 
        :disabled="!canUndo"
        class="size-14 flex items-center justify-center bg-bg-elevated hover:bg-accent-coral hover:text-white rounded-2xl disabled:opacity-10 disabled:grayscale transition-all active:scale-90 group"
        title="Hoàn tác"
      >
        <Icon icon="lucide:undo-2" class="size-7 group-hover:-rotate-45 transition-transform" />
      </button>
      <button 
        @click="emit('redo')" 
        :disabled="!canRedo"
        class="size-14 flex items-center justify-center bg-bg-elevated hover:bg-accent-coral hover:text-white rounded-2xl disabled:opacity-10 disabled:grayscale transition-all active:scale-90 group"
        title="Làm lại"
      >
        <Icon icon="lucide:redo-2" class="size-7 group-hover:rotate-45 transition-transform" />
      </button>
      <div class="w-px h-10 bg-border-default self-center mx-1" />
      <button 
        @click="emit('clear')" 
        class="size-14 flex items-center justify-center bg-bg-elevated hover:bg-red-500 hover:text-white rounded-2xl transition-all active:scale-90 text-red-500 border border-transparent hover:border-red-400 group"
        title="Xóa hết"
      >
        <Icon icon="lucide:trash-2" class="size-7 group-hover:shake transition-transform" />
      </button>
    </div>

    <!-- Brick selection and color palette -->
    <div class="w-full max-w-6xl pointer-events-auto bg-bg-surface/90 backdrop-blur-3xl border-2 border-border-default px-6 py-6 rounded-[3rem] shadow-[0_30px_60px_rgba(0,0,0,0.4)] flex flex-col gap-8">
      <!-- Brick Types Row -->
      <div class="flex gap-4 overflow-x-auto pb-6 pt-2 px-2 scrollbar-none snap-x items-center min-h-[140px]">
        <button
          v-for="type in brickTypes"
          :key="type"
          @click="emit('update:activeBrickType', type)"
          class="relative flex-shrink-0 snap-center flex flex-col items-center justify-center gap-4 p-5 border-2 transition-all duration-500 rounded-[2rem] min-w-[120px] group"
          :class="activeBrickType === type 
            ? 'border-accent-coral bg-accent-coral/15 scale-110 shadow-[0_0_30px_rgba(255,107,107,0.3)]' 
            : 'border-border-default bg-bg-deep/20 hover:border-accent-sky/50 hover:bg-bg-elevated hover:scale-105'"
        >
          <!-- Visual representation -->
          <div 
            class="transition-all duration-300 shadow-2xl rounded-sm border border-white/5 relative flex items-center justify-center"
            :style="{ 
              backgroundColor: activeColor,
              width: `${BRICK_DATA[type].width * 16}px`,
              height: `${BRICK_DATA[type].depth * 16}px`,
              boxShadow: `0 4px 0 0 rgba(0,0,0,0.5), inset 0 2px 4px rgba(255,255,255,0.2)`
            }"
          >
            <!-- Strict Grid for Studs to prevent overflow -->
            <div 
               class="grid h-full w-full p-0.5 overflow-hidden pointer-events-none"
               :style="{
                 gridTemplateColumns: `repeat(${BRICK_DATA[type].width}, 1fr)`,
                 gridTemplateRows: `repeat(${BRICK_DATA[type].depth}, 1fr)`,
                 gap: '1px'
               }"
            >
               <div v-for="i in (BRICK_DATA[type].width * BRICK_DATA[type].depth)" :key="i" 
                 class="size-[6px] rounded-full bg-white/40 shadow-inner place-self-center ring-1 ring-black/10" />
            </div>
          </div>
          
          <span class="text-[11px] font-black group-hover:text-text-primary transition-colors uppercase tracking-[0.2em]"
            :class="activeBrickType === type ? 'text-accent-coral' : 'text-text-dim'"
          >{{ type }}</span>
          
          <div v-if="activeBrickType === type" class="absolute -top-2 -right-2">
             <div class="size-7 bg-white rounded-full flex items-center justify-center shadow-xl border-4 border-accent-coral">
                <Icon icon="lucide:check" class="size-3.5 text-accent-coral stroke-[4]" />
             </div>
          </div>
        </button>
      </div>

      <!-- Color Palette -->
      <div class="flex gap-4 overflow-x-auto pb-2 px-2 scrollbar-none justify-start md:justify-center">
        <button
          v-for="color in LEGO_COLORS"
          :key="color"
          @click="emit('update:activeColor', color)"
          class="size-11 md:size-12 rounded-[1.2rem] border-4 transition-all duration-500 hover:scale-125 hover:-translate-y-2 active:scale-90 shadow-lg flex-shrink-0"
          :style="{ 
            backgroundColor: color, 
            borderColor: activeColor === color ? '#FFFFFF' : 'rgba(255,255,255,0.1)',
            boxShadow: activeColor === color ? `0 10px 25px ${color}aa, 0 0 0 2px ${color}44` : ''
          }"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.scrollbar-none::-webkit-scrollbar {
  display: none;
}
.scrollbar-none {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.group:hover .shake {
  animation: shake 0.5s infinite;
}

@keyframes shake {
  0%, 100% { transform: rotate(0); }
  25% { transform: rotate(-10deg); }
  75% { transform: rotate(10deg); }
}

@keyframes zoom-in {
  from { transform: scale(0.9); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
</style>
