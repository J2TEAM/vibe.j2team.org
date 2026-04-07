<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { Icon } from '@iconify/vue'

defineProps<{
  countingTimer: number
}>()

const emit = defineEmits<{
  submit: [answer: number]
}>()

const answer = ref<string>('')
const inputRef = ref<HTMLInputElement | null>(null)

onMounted(async () => {
  await nextTick()
  inputRef.value?.focus()
})

function handleSubmit() {
  const num = parseInt(answer.value, 10)
  if (!isNaN(num) && num >= 0) {
    emit('submit', num)
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    handleSubmit()
  }
}
</script>

<template>
  <div class="animate-fade-up border-accent-coral/30 bg-bg-surface border p-4">
    <div class="mb-3 flex items-center justify-between">
      <h3 class="font-display text-text-primary flex items-center gap-2 text-sm font-semibold">
        <Icon icon="lucide:hash" class="text-accent-coral size-4" />
        Bao nhiêu hành khách trên xe?
      </h3>
      <div class="flex items-center gap-1.5">
        <Icon
          icon="lucide:alarm-clock"
          class="size-4"
          :class="countingTimer <= 3 ? 'text-accent-coral animate-pulse' : 'text-accent-amber'"
        />
        <span
          class="font-display text-lg font-bold tabular-nums"
          :class="countingTimer <= 3 ? 'text-accent-coral' : 'text-accent-amber'"
        >
          {{ countingTimer }}
        </span>
      </div>
    </div>

    <!-- Countdown bar -->
    <div class="bg-bg-elevated mb-4 h-1 w-full overflow-hidden">
      <div
        class="h-full transition-all duration-1000 ease-linear"
        :class="countingTimer <= 3 ? 'bg-accent-coral' : 'bg-accent-amber'"
        :style="{ width: `${(countingTimer / 10) * 100}%` }"
      />
    </div>

    <div class="flex gap-3">
      <input
        ref="inputRef"
        v-model="answer"
        type="number"
        min="0"
        max="50"
        placeholder="0"
        class="bg-bg-elevated border-border-default text-text-primary font-display focus:border-accent-coral w-full border px-4 py-3 text-center text-2xl font-bold tabular-nums focus:outline-none"
        @keydown="handleKeydown"
      />
      <button
        class="bg-accent-coral text-bg-deep font-display hover:bg-accent-coral/90 shrink-0 px-6 py-3 font-bold tracking-wide transition active:scale-95"
        @click="handleSubmit"
      >
        <Icon icon="lucide:check" class="mr-1 inline size-5 -translate-y-0.5" />
        GỬI
      </button>
    </div>
  </div>
</template>
