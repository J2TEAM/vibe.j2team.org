<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import { RouterLink } from 'vue-router'

const props = defineProps<{
  show: boolean
  isHighPercentage: boolean
  isLowPercentage: boolean
  finalPercentage: number | null
  displayMaleName: string
  displayFemaleName: string
}>()

defineEmits<{
  reset: []
}>()

const percentageColorClass = computed(() => {
  if (props.isHighPercentage) {
    return 'text-accent-coral'
  }
  if (props.isLowPercentage) {
    return 'text-accent-sky'
  }
  return 'text-accent-amber'
})

const percentageBgClass = computed(() => {
  if (props.isHighPercentage) {
    return 'bg-accent-coral/10'
  }
  if (props.isLowPercentage) {
    return 'bg-accent-sky/10'
  }
  return 'bg-accent-amber/10'
})
</script>

<template>
  <Teleport v-if="show" to="body">
    <Transition
      name="modal"
      enter-active-class="transition-opacity duration-300"
      leave-active-class="transition-opacity duration-300"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
        <div
          class="w-full max-w-md animate-fade-up space-y-6 border-4 border-accent-coral bg-bg-surface p-8 shadow-lg shadow-accent-coral/20"
        >
          <div class="text-center">
            <Icon
              v-if="isHighPercentage"
              icon="lucide:heart"
              class="mx-auto mb-4 animate-pulse text-6xl text-accent-coral"
            />
            <Icon
              v-else-if="isLowPercentage"
              icon="lucide:heart-crack"
              class="mx-auto mb-4 animate-pulse text-6xl text-accent-sky"
            />
            <Icon
              v-else
              icon="lucide:heart-handshake"
              class="mx-auto mb-4 animate-pulse text-6xl text-accent-amber"
            />

            <h3 class="mt-4 font-display text-2xl font-bold text-text-primary">
              {{ displayMaleName }}<br />
              & <br />{{ displayFemaleName }}
            </h3>

            <div
              class="mx-auto mt-8 flex w-fit flex-col items-center border-2 border-accent-coral px-8 py-6"
              :class="percentageBgClass"
            >
              <p class="font-body text-sm tracking-widest text-text-secondary">Tỷ Lệ Tình Yêu</p>
              <p class="mt-2 font-display text-7xl font-bold" :class="percentageColorClass">
                {{ finalPercentage }}%
              </p>
            </div>

            <p class="mt-6 font-body text-lg" :class="percentageColorClass">
              <span v-if="isHighPercentage"> ❤️ Tình yêu rực rỡ! Hai bạn xứng đôi! </span>
              <span v-else-if="isLowPercentage"> 💙 Còn cơ hội để xây dựng tình yêu... </span>
              <span v-else> 💛 Tình yêu đang phát triển, cần thêm thời gian! </span>
            </p>
          </div>

          <div class="space-y-3 border-t border-border-default pt-6">
            <button
              class="w-full border border-accent-coral bg-accent-coral px-4 py-3 font-display font-semibold text-bg-deep transition hover:bg-accent-coral/90"
              @click="$emit('reset')"
            >
              Thử Lại với tên khác
            </button>
            <RouterLink
              to="/"
              class="block border border-border-default bg-bg-elevated px-4 py-3 text-center font-display font-semibold text-text-primary transition hover:border-accent-coral hover:text-accent-coral"
            >
              Về Trang Chủ
            </RouterLink>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
