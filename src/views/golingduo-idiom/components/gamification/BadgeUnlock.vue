<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Badge } from '../../data/types'

const props = defineProps<{
  badge: Badge | null
}>()

const show = ref(false)

watch(
  () => props.badge,
  (b) => {
    if (b) {
      show.value = true
      setTimeout(() => {
        show.value = false
      }, 3000)
    }
  },
)
</script>

<template>
  <Teleport to="body">
    <Transition name="badge-pop">
      <div
        v-if="show && badge"
        class="fixed inset-0 z-50 flex items-center justify-center bg-bg-deep/80 backdrop-blur-sm"
        @click="show = false"
      >
        <div class="animate-fade-up border-2 border-accent-coral bg-bg-surface p-8 text-center">
          <span class="text-6xl">{{ badge.emoji }}</span>
          <h3 class="mt-4 font-display text-xl font-bold text-accent-coral">Badge Mới!</h3>
          <p class="mt-2 font-display text-lg text-text-primary">
            {{ badge.name }}
          </p>
          <p class="mt-1 text-sm italic text-text-secondary">
            {{ badge.description }}
          </p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
