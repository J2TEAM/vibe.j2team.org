<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'
import { useI18n } from '../composables/useI18n'
import { Icon } from '@iconify/vue'
import { RESOURCE_LUCIDE } from '../constants/icons'

const props = defineProps<{
  turn: number
  year: number
  budget: number
  energy: number
  food: number
  materials: number
  knowledge: number
}>()

const { locale, toggleLocale } = useI18n()

const budgetBounce = ref(false)
const energyBounce = ref(false)
const foodBounce = ref(false)
const matBounce = ref(false)
const knowBounce = ref(false)
const yearPop = ref(false)

const timers = new Set<ReturnType<typeof setTimeout>>()

function scheduleBounce(flag: typeof budgetBounce, duration = 400) {
  flag.value = true
  const id = setTimeout(() => {
    flag.value = false
    timers.delete(id)
  }, duration)
  timers.add(id)
}

watch(
  () => props.budget,
  () => scheduleBounce(budgetBounce),
)
watch(
  () => props.energy,
  () => scheduleBounce(energyBounce),
)
watch(
  () => props.food,
  () => scheduleBounce(foodBounce),
)
watch(
  () => props.materials,
  () => scheduleBounce(matBounce),
)
watch(
  () => props.knowledge,
  () => scheduleBounce(knowBounce),
)
watch(
  () => props.year,
  () => scheduleBounce(yearPop, 500),
)

onUnmounted(() => {
  timers.forEach(clearTimeout)
})
</script>

<template>
  <header
    class="flex items-center justify-between px-3 py-1 bg-bg-deep/80 backdrop-blur-sm border-b border-border-default/40 text-[11px]"
  >
    <!-- Year + turn -->
    <div class="flex items-center gap-1.5 shrink-0">
      <span
        class="font-display font-bold text-sm text-text-primary tabular-nums"
        :class="{ 'year-pop': yearPop }"
        >{{ year }}</span
      >
      <span class="text-text-dim tabular-nums">{{ turn }}/10</span>
    </div>

    <!-- All resources -->
    <div class="flex items-center gap-2 flex-wrap justify-center">
      <span
        class="flex items-center gap-0.5 font-bold tabular-nums text-accent-amber"
        :class="{ 'res-bounce': budgetBounce }"
      >
        <Icon :icon="RESOURCE_LUCIDE.budget" class="w-3 h-3" />{{ budget }}
      </span>
      <span
        class="flex items-center gap-0.5 font-bold tabular-nums text-accent-sky"
        :class="{ 'res-bounce': energyBounce }"
      >
        <Icon :icon="RESOURCE_LUCIDE.energy" class="w-3 h-3" />{{ energy }}
      </span>
      <span class="w-px h-3 bg-border-default/40" />
      <span
        class="flex items-center gap-0.5 font-bold tabular-nums text-green-400"
        :class="{ 'res-bounce': foodBounce }"
      >
        <Icon :icon="RESOURCE_LUCIDE.food" class="w-3 h-3" />{{ food }}
      </span>
      <span
        class="flex items-center gap-0.5 font-bold tabular-nums text-orange-300"
        :class="{ 'res-bounce': matBounce }"
      >
        <Icon :icon="RESOURCE_LUCIDE.materials" class="w-3 h-3" />{{ materials }}
      </span>
      <span
        class="flex items-center gap-0.5 font-bold tabular-nums text-violet-400"
        :class="{ 'res-bounce': knowBounce }"
      >
        <Icon :icon="RESOURCE_LUCIDE.knowledge" class="w-3 h-3" />{{ knowledge }}
      </span>
    </div>

    <!-- Lang -->
    <button
      @click="toggleLocale"
      class="text-[10px] text-text-dim px-1 py-0.5 rounded hover:text-text-secondary transition-colors touch-manipulation active:scale-90 shrink-0"
    >
      {{ locale === 'vi' ? 'EN' : 'VI' }}
    </button>
  </header>
</template>

<style scoped>
.res-bounce {
  animation: res-bounce 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes res-bounce {
  0% {
    transform: scale(1);
  }
  40% {
    transform: scale(1.25);
  }
  100% {
    transform: scale(1);
  }
}
.year-pop {
  animation: year-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes year-pop {
  0% {
    transform: scale(1);
  }
  30% {
    transform: scale(1.3);
  }
  60% {
    transform: scale(0.95);
  }
  100% {
    transform: scale(1);
  }
}
</style>
