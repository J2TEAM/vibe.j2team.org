<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { StudyConfig, CardSet } from '../../types'
import { getSetById, getSetCardCount } from '../../services/set-service'
import { resetCardLevels } from '../../services/card-service'

const props = defineProps<{
  folderId?: string
  setId?: string
}>()

const emit = defineEmits<{
  start: [config: StudyConfig]
}>()

const set = ref<CardSet | undefined>()
const cardCount = ref(0)
const cardSide = ref<StudyConfig['cardSide']>('front')
const cardOrder = ref<StudyConfig['cardOrder']>('sequential')

onMounted(async () => {
  if (props.setId) {
    set.value = await getSetById(props.setId)
    cardCount.value = await getSetCardCount(props.setId)
  }
})

const resetProgress = ref(false)

async function handleStart() {
  if (resetProgress.value && props.setId) {
    await resetCardLevels(props.setId)
  }
  emit('start', {
    cardSide: cardSide.value,
    cardOrder: cardOrder.value,
  })
}
</script>

<template>
  <div class="max-w-md mx-auto animate-fade-up animate-delay-1">
    <h2 class="font-display text-2xl font-semibold text-text-primary text-center mb-2">
      {{ set?.name ?? 'Chuẩn bị học' }}
    </h2>
    <p class="text-text-secondary text-sm text-center mb-8">{{ cardCount }} thẻ trong bộ này</p>

    <div class="space-y-6">
      <!-- Card side config -->
      <div class="border border-border-default bg-bg-surface p-5">
        <p class="font-display text-sm font-semibold text-text-primary mb-3">
          Hiển thị mặt nào trước?
        </p>
        <div class="space-y-2">
          <label class="flex items-center gap-3 text-sm text-text-secondary cursor-pointer">
            <input v-model="cardSide" type="radio" value="front" class="accent-accent-coral" />
            Mặt trước trước
          </label>
          <label class="flex items-center gap-3 text-sm text-text-secondary cursor-pointer">
            <input v-model="cardSide" type="radio" value="back" class="accent-accent-coral" />
            Mặt sau trước
          </label>
          <label class="flex items-center gap-3 text-sm text-text-secondary cursor-pointer">
            <input v-model="cardSide" type="radio" value="random" class="accent-accent-coral" />
            Ngẫu nhiên
          </label>
        </div>
      </div>

      <!-- Card order config -->
      <div class="border border-border-default bg-bg-surface p-5">
        <p class="font-display text-sm font-semibold text-text-primary mb-3">Thứ tự thẻ</p>
        <div class="space-y-2">
          <label class="flex items-center gap-3 text-sm text-text-secondary cursor-pointer">
            <input
              v-model="cardOrder"
              type="radio"
              value="sequential"
              class="accent-accent-coral"
            />
            Theo thứ tự
          </label>
          <label class="flex items-center gap-3 text-sm text-text-secondary cursor-pointer">
            <input v-model="cardOrder" type="radio" value="random" class="accent-accent-coral" />
            Ngẫu nhiên
          </label>
        </div>
      </div>

      <!-- Reset progress -->
      <label
        class="flex items-center gap-3 text-sm text-text-secondary cursor-pointer border border-border-default bg-bg-surface p-4"
      >
        <input v-model="resetProgress" type="checkbox" class="accent-accent-coral" />
        Học lại từ đầu (xóa tiến trình cũ)
      </label>

      <!-- Start button -->
      <button
        class="w-full py-3 text-sm bg-accent-coral text-bg-deep font-display font-bold tracking-wide transition hover:bg-accent-coral/90"
        :disabled="cardCount === 0"
        @click="handleStart"
      >
        Bắt đầu học
      </button>
    </div>
  </div>
</template>
