<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from '../composables/useI18n'
import { Icon } from '@iconify/vue'
import { DERIVED_LUCIDE } from '../constants/icons'

const emit = defineEmits<{
  begin: []
  skip: []
}>()

const { locale } = useI18n()

const step = ref(0) // 0 = dark, 1 = seed falls, 2 = narration 1, 3 = narration 2, 4 = ready

const timers: ReturnType<typeof setTimeout>[] = []

onMounted(() => {
  timers.push(setTimeout(() => (step.value = 1), 600))
  timers.push(setTimeout(() => (step.value = 2), 2000))
  timers.push(setTimeout(() => (step.value = 3), 4500))
  timers.push(setTimeout(() => (step.value = 4), 7000))
})

onUnmounted(() => {
  timers.forEach(clearTimeout)
})
</script>

<template>
  <div
    class="min-h-screen bg-black flex flex-col items-center justify-center px-6 relative overflow-hidden select-none"
  >
    <!-- Skip button always visible -->
    <button
      class="absolute top-4 right-4 z-20 text-text-dim text-xs hover:text-text-secondary transition-colors"
      @click="emit('skip')"
    >
      {{ locale === 'vi' ? 'Bỏ qua ▸' : 'Skip ▸' }}
    </button>

    <!-- Ambient glow that grows with steps -->
    <div
      class="absolute inset-0 pointer-events-none transition-opacity duration-[2000ms]"
      :class="step >= 1 ? 'opacity-100' : 'opacity-0'"
      style="
        background: radial-gradient(
          circle at 50% 50%,
          rgba(74, 222, 128, 0.06) 0%,
          transparent 50%
        );
      "
    />

    <!-- 7 biome dots that fade in -->
    <div
      class="absolute inset-0 pointer-events-none transition-opacity duration-[3000ms]"
      :class="step >= 3 ? 'opacity-60' : 'opacity-0'"
    >
      <div class="absolute top-[30%] left-[25%] w-3 h-3 rounded-full bg-green-500/30 blur-sm" />
      <div class="absolute top-[35%] right-[30%] w-2.5 h-2.5 rounded-full bg-blue-400/30 blur-sm" />
      <div class="absolute top-[55%] left-[35%] w-2 h-2 rounded-full bg-amber-400/30 blur-sm" />
      <div class="absolute top-[50%] right-[25%] w-3 h-3 rounded-full bg-teal-400/30 blur-sm" />
      <div class="absolute top-[65%] left-[45%] w-2 h-2 rounded-full bg-emerald-400/30 blur-sm" />
      <div class="absolute top-[40%] left-[50%] w-2.5 h-2.5 rounded-full bg-sky-400/30 blur-sm" />
      <div class="absolute top-[60%] right-[40%] w-2 h-2 rounded-full bg-lime-400/30 blur-sm" />
    </div>

    <div class="relative z-10 text-center max-w-md w-full space-y-6">
      <!-- Seed -->
      <div
        class="flex justify-center transition-all duration-[1500ms]"
        :class="step >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-16'"
      >
        <div class="relative">
          <div
            class="absolute inset-0 blur-2xl rounded-full scale-150 transition-all duration-[2000ms]"
            :class="step >= 3 ? 'bg-green-400/30' : 'bg-green-400/10'"
          />
          <span
            class="relative text-6xl drop-shadow-[0_0_24px_rgba(74,222,128,0.4)] transition-transform duration-1000"
            :class="step >= 3 ? 'scale-110' : 'scale-100'"
            ><Icon :icon="DERIVED_LUCIDE.sustainability" class="w-14 h-14 text-green-400"
          /></span>
        </div>
      </div>

      <!-- Narration 1 -->
      <p
        class="text-text-dim text-sm leading-relaxed transition-all duration-1000"
        :class="step >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'"
      >
        {{
          locale === 'vi'
            ? 'Thế giới này đã ngủ quên quá lâu trong sự tĩnh lặng của hư không.'
            : 'This world has slept too long in the silence of the void.'
        }}
      </p>

      <!-- Narration 2 -->
      <p
        class="text-text-primary text-base leading-relaxed font-display transition-all duration-1000"
        :class="step >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'"
      >
        {{
          locale === 'vi'
            ? 'Bạn mang theo hạt mầm của sự thay đổi. Không phải quyền năng tối thượng, mà là sự kiên nhẫn của một người làm vườn.'
            : 'You carry the seed of change. Not supreme power, but the patience of a gardener.'
        }}
      </p>

      <!-- CTA -->
      <div
        class="space-y-3 transition-all duration-700"
        :class="
          step >= 4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        "
      >
        <button
          class="w-full py-3 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 text-bg-deep font-display font-bold text-lg tracking-wide hover:scale-[1.02] active:scale-[0.98] transition-transform touch-manipulation shadow-lg shadow-green-500/20"
          @click="emit('begin')"
        >
          {{ locale === 'vi' ? 'Bắt đầu hành trình' : 'Begin the Journey' }}
        </button>
        <button
          class="w-full py-2 text-text-dim text-sm hover:text-text-secondary transition-colors"
          @click="emit('skip')"
        >
          {{ locale === 'vi' ? 'Tôi đã biết đường đi →' : 'I know the way →' }}
        </button>
      </div>
    </div>
  </div>
</template>
