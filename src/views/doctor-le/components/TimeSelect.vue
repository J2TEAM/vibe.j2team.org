<script setup lang="ts">
const emit = defineEmits<{ selectTime: [time: number] }>()

const options = [
  { value: 10, label: '10 giây', desc: 'Nhanh chóng' },
  { value: 20, label: '20 giây', desc: 'Tiêu chuẩn' },
  { value: 30, label: '30 giây', desc: 'Chuyên sâu' },
]
</script>

<template>
  <div class="flex flex-col items-center text-center px-4 animate-fade-up">
    <!-- Header -->
    <div
      class="mb-6 inline-flex items-center gap-2 border border-accent-sky/30 bg-accent-sky/10 px-4 py-1.5 text-xs font-display tracking-widest text-accent-sky uppercase"
    >
      <span>📋</span>
      Bước 1 / 2
    </div>

    <h2
      class="font-display text-3xl sm:text-4xl font-bold text-text-primary mb-2 animate-fade-up animate-delay-1"
    >
      Chọn thời gian đo
    </h2>
    <p class="text-text-secondary text-sm mb-8 animate-fade-up animate-delay-2">
      Bác sĩ cần biết bạn muốn kiểm tra trong bao lâu
    </p>

    <!-- Divider -->
    <div class="flex gap-1.5 mb-8">
      <span v-for="n in 20" :key="n" class="w-1 h-1 rounded-full bg-border-default" />
    </div>

    <!-- Time options -->
    <div class="w-full max-w-sm flex flex-col gap-3 animate-fade-up animate-delay-3">
      <button
        v-for="(opt, i) in options"
        :key="opt.value"
        :class="`animate-delay-${i + 3}`"
        class="animate-fade-up group w-full border border-border-default bg-bg-surface px-6 py-4 flex items-center justify-between transition-all duration-300 hover:border-accent-coral hover:bg-bg-elevated hover:-translate-y-0.5 hover:shadow-lg hover:shadow-accent-coral/5 active:scale-95 touch-manipulation"
        @click="emit('selectTime', opt.value)"
      >
        <div class="text-left">
          <span
            class="font-display text-xl font-bold text-text-primary group-hover:text-accent-coral transition-colors"
          >
            {{ opt.label }}
          </span>
          <p class="text-xs text-text-dim mt-0.5">{{ opt.desc }}</p>
        </div>
        <span
          class="font-display text-3xl font-bold text-accent-amber/10 group-hover:text-accent-coral/20 transition-colors select-none"
        >
          {{ String(opt.value).padStart(2, '0') }}
        </span>
      </button>
    </div>
  </div>
</template>
