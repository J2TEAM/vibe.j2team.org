<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '../composables/useI18n'
import { Icon } from '@iconify/vue'
import { UI_LUCIDE } from '../constants/icons'

const props = defineProps<{
  step: number // 1-4
}>()

const emit = defineEmits<{
  next: []
  skip: []
}>()

const { locale } = useI18n()

const STEPS_VI = [
  {
    title: 'Quy Luật Thời Gian',
    body: 'Mỗi bước đi của bạn tương ứng với 5 năm. Chúng ta chỉ có 10 bước để hoàn thành một chu kỳ nhân gian.',
    lucideIcon: 'lucide:hourglass',
    target: 'turn-header',
  },
  {
    title: 'Gieo Mầm',
    body: 'Ngân sách cho phép bạn thực hiện các dự án vật chất. Hãy đặt nền móng cho hệ sinh thái. Chọn 2 thẻ từ xấp bài để tạo nên thế giới.',
    lucideIcon: 'lucide:layers',
    target: 'hand-area',
  },
  {
    title: 'Sức Sống Của Vùng Đất',
    body: 'Mọi hành động đều để lại dấu ấn. Sinh thái và Nhân sinh là linh hồn của vùng đất này. Hãy giữ chúng cân bằng để đạt được sự Hòa Hợp.',
    lucideIcon: 'lucide:bar-chart-2',
    target: 'stats-bar',
  },
  {
    title: 'Sức Mạnh Cộng Đồng',
    body: 'Khi lòng dân đồng thuận, Sức dân sẽ giúp bạn vượt qua trở ngại. Dùng 3 Năng lượng để rút thêm thẻ hoặc 5 Năng lượng để giảm giá.',
    lucideIcon: 'lucide:zap',
    target: 'energy-area',
  },
]

const STEPS_EN = [
  {
    title: 'The Flow of Time',
    body: 'Each step spans 5 years. You only have 10 steps to complete one cycle of civilization.',
    lucideIcon: 'lucide:hourglass',
    target: 'turn-header',
  },
  {
    title: 'Sow the Seeds',
    body: 'Budget lets you build. Choose 2 cards from your hand of 5 to shape the world each turn.',
    lucideIcon: 'lucide:layers',
    target: 'hand-area',
  },
  {
    title: 'Life Force of the Land',
    body: 'Every action leaves a mark. Nature and Human are the soul of this land. Keep them balanced to achieve Harmony.',
    lucideIcon: 'lucide:bar-chart-2',
    target: 'stats-bar',
  },
  {
    title: 'Power of Community',
    body: 'When people unite, Energy helps you overcome obstacles. Spend 3 Energy for an extra card or 5 Energy for a discount.',
    lucideIcon: 'lucide:zap',
    target: 'energy-area',
  },
]

const currentStep = computed(() => {
  const steps = locale.value === 'vi' ? STEPS_VI : STEPS_EN
  return steps[props.step - 1]
})
</script>

<template>
  <div
    v-if="currentStep"
    class="fixed inset-0 z-40 flex items-end sm:items-center justify-center p-4 pointer-events-none"
  >
    <!-- Dim overlay -->
    <div class="absolute inset-0 bg-black/60 pointer-events-auto" @click="emit('next')" />

    <!-- Tooltip card -->
    <div
      class="relative pointer-events-auto bg-bg-surface border border-border-default rounded-2xl max-w-sm w-full p-5 mb-4 sm:mb-0 animate-fade-up shadow-xl"
    >
      <!-- Skip button -->
      <button
        class="absolute top-3 right-3 text-text-dim text-xs hover:text-text-secondary transition-colors flex items-center gap-1"
        @click="emit('skip')"
      >
        {{ locale === 'vi' ? 'Bỏ qua' : 'Skip' }}
        <Icon :icon="UI_LUCIDE.close" class="w-3 h-3" />
      </button>

      <!-- Step indicator -->
      <div class="flex items-center gap-1.5 mb-3">
        <span
          v-for="i in 4"
          :key="i"
          :class="[
            'w-2 h-2 rounded-full transition-colors',
            i === step ? 'bg-accent-coral' : i < step ? 'bg-accent-coral/40' : 'bg-bg-elevated',
          ]"
        />
        <span class="text-[10px] text-text-dim ml-1">{{ step }}/4</span>
      </div>

      <!-- Content -->
      <div class="flex items-start gap-3">
        <Icon :icon="currentStep.lucideIcon" class="w-8 h-8 mt-0.5 text-accent-coral shrink-0" />
        <div class="flex-1 min-w-0">
          <h3 class="font-display font-bold text-text-primary text-sm mb-1">
            {{ currentStep.title }}
          </h3>
          <p class="text-text-secondary text-xs leading-relaxed">
            {{ currentStep.body }}
          </p>
        </div>
      </div>

      <!-- Next button -->
      <button
        class="mt-4 w-full py-2.5 rounded-lg text-sm font-display font-bold transition-all touch-manipulation hover:scale-[1.02] active:scale-[0.98]"
        :class="
          step < 4
            ? 'bg-bg-elevated text-text-primary hover:bg-border-default'
            : 'bg-gradient-to-r from-accent-coral to-accent-amber text-bg-deep'
        "
        @click="emit('next')"
      >
        {{
          step < 4
            ? locale === 'vi'
              ? 'Tiếp theo →'
              : 'Next →'
            : locale === 'vi'
              ? 'Bắt đầu chơi!'
              : 'Start playing!'
        }}
      </button>
    </div>
  </div>
</template>
