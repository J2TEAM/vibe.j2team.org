<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  reactionTime: number
  selectedTime: number
}>()

const emit = defineEmits<{ retry: [] }>()

// Reaction time in seconds, clamped to [0.1, 5] để tránh chia cho số quá nhỏ hoặc quá lớn
const reactionSeconds = computed(() => Math.max(0.1, Math.min(5, props.reactionTime / 1000)))

// Công thức: nhịp tim tăng dần khi phản xạ nhanh hơn
// Baseline 72 BPM, tăng tối đa ~120 BPM khi phản xạ rất nhanh
// heartRate = 72 + 120 * (1 - reactionSeconds / 5), clamp [60, 200]
const heartRate = computed(() => {
  const base = 72
  const bonus = Math.round(120 * (1 - reactionSeconds.value / 5))
  return Math.max(60, Math.min(200, base + bonus))
})

const diagnosis = computed(() => {
  const rt = props.reactionTime
  if (rt < 150)
    return {
      label: 'SIÊU PHẢN XẠ',
      text: 'Phản xạ cực nhanh. Bạn có thể làm ninja. Nhưng mà ninja này hơi yểu!!!',
      color: 'text-accent-sky',
      border: 'border-accent-sky',
    }
  if (rt < 300)
    return {
      label: 'ỐI DỒI ÔI',
      text: 'Nhịp tim tăng nhẹ. Có vẻ bạn bị giật mình.',
      color: 'text-accent-amber',
      border: 'border-accent-amber',
    }
  if (rt < 500)
    return {
      label: 'BÌNH THƯỜNG',
      text: 'Bạn thật là cứng gồng đấy chứ!!!',
      color: 'text-accent-coral',
      border: 'border-accent-coral',
    }
  return {
    label: 'ÂY GU ĐỨNG HÌNH MẤT 5 GIÂY',
    text: 'Bệnh nhân bị đứng hình tạm thời. Có lẽ bạn đã bị tê ê ê!!!',
    color: 'text-text-secondary',
    border: 'border-border-default',
  }
})

const bpmCategory = computed(() => {
  const hr = heartRate.value
  if (hr >= 160) return { label: 'Nguy hiểm', color: 'text-accent-sky' }
  if (hr >= 130) return { label: 'Cao', color: 'text-accent-amber' }
  if (hr >= 100) return { label: 'Hơi cao', color: 'text-accent-coral' }
  return { label: 'Be humble - shit down', color: 'text-text-secondary' }
})

function formatTime(ms: number): string {
  if (ms >= 1000) return `${(ms / 1000).toFixed(2)} giây`
  return `${ms} ms`
}
</script>

<template>
  <div class="flex flex-col items-center text-center px-4 animate-fade-up w-full max-w-sm mx-auto">
    <!-- Header badge -->
    <div
      class="mb-6 inline-flex items-center gap-2 border border-accent-coral/30 bg-accent-coral/10 px-4 py-1.5 text-xs font-display tracking-widest text-accent-coral uppercase"
    >
      <span>📋</span>
      Kết quả khám
    </div>

    <!-- Title -->
    <h2
      class="font-display text-3xl sm:text-4xl font-bold text-text-primary mb-1 animate-fade-up animate-delay-1"
    >
      KẾT QUẢ KHÁM
    </h2>
    <p
      class="font-display text-xs tracking-widest text-accent-coral uppercase mb-6 animate-fade-up animate-delay-2"
    >
      // Doctor Le Clinic · Official Report
    </p>

    <!-- Divider dots -->
    <div class="flex gap-1.5 mb-6">
      <span v-for="n in 20" :key="n" class="w-1 h-1 rounded-full bg-border-default" />
    </div>

    <!-- Report Card -->
    <div
      class="w-full border border-border-default bg-bg-surface p-5 mb-4 animate-fade-up animate-delay-2"
    >
      <!-- Report header -->
      <div class="flex items-center justify-between mb-4 pb-3 border-b border-border-default">
        <div class="text-left">
          <p class="font-display text-xs tracking-widest text-text-dim uppercase">Bệnh nhân</p>
          <p class="font-display text-sm font-bold text-text-primary mt-0.5">Ẩn danh</p>
        </div>
        <div class="text-right">
          <p class="font-display text-xs tracking-widest text-text-dim uppercase">Ngày khám</p>
          <p class="font-display text-sm font-bold text-text-primary mt-0.5">
            {{ new Date().toLocaleDateString('vi-VN') }}
          </p>
        </div>
      </div>

      <!-- Metrics -->
      <div class="space-y-3 mb-4">
        <!-- Reaction time -->
        <div class="flex items-center justify-between">
          <span class="text-xs font-display tracking-wide text-text-secondary uppercase"
            >Thời gian phản xạ</span
          >
          <span class="font-display font-bold text-lg text-text-primary tabular-nums">
            {{ formatTime(reactionTime) }}
          </span>
        </div>

        <!-- Heart rate -->
        <div class="flex items-center justify-between">
          <span class="text-xs font-display tracking-wide text-text-secondary uppercase"
            >Nhịp tim ước tính</span
          >
          <span :class="bpmCategory.color" class="font-display font-bold text-2xl tabular-nums">
            {{ heartRate }} <span class="text-sm">BPM</span>
          </span>
        </div>

        <!-- Category -->
        <div class="flex items-center justify-between">
          <span class="text-xs font-display tracking-wide text-text-secondary uppercase"
            >Phân loại</span
          >
          <span
            :class="bpmCategory.color"
            class="font-display font-bold text-sm uppercase tracking-wide"
          >
            {{ bpmCategory.label }}
          </span>
        </div>
      </div>

      <!-- Heart rate bar -->
      <div class="h-1.5 bg-bg-elevated w-full mb-4">
        <div
          class="h-1.5 bg-accent-coral transition-all duration-1000"
          :style="{ width: `${Math.round((heartRate / 200) * 100)}%` }"
        ></div>
      </div>

      <!-- Diagnosis box -->
      <div :class="['border p-4', diagnosis.border, 'bg-bg-elevated']">
        <p :class="['font-display text-xs tracking-widest uppercase mb-2', diagnosis.color]">
          // Chẩn đoán · {{ diagnosis.label }}
        </p>
        <p class="text-text-primary text-sm leading-relaxed italic">"{{ diagnosis.text }}"</p>
      </div>
    </div>

    <!-- Doctor seal -->
    <div
      class="w-full border border-border-default bg-bg-surface px-5 py-3 flex items-center gap-3 mb-6 animate-fade-up animate-delay-3"
    >
      <span class="text-2xl">👨‍⚕️</span>
      <div class="text-left">
        <p class="font-display text-xs tracking-widest text-text-dim uppercase">Ký bởi</p>
        <div
          target="_blank"
          rel="noopener noreferrer"
          class="font-display text-sm font-bold text-text-primary hover:text-accent-coral transition-colors link-underline"
        >
          Dr.Le
        </div>
        Cảm Ơn Bạn Đã Tham Gia, Nhưng Tớ Chịu Không Đo Nổi!!!
      </div>
      <div class="ml-auto">
        <div
          class="bg-accent-coral text-bg-deep font-display font-bold text-xs tracking-widest px-2.5 py-1 rotate-2"
        >
          ĐÃ KÝ
        </div>
      </div>
    </div>

    <!-- Retry button -->
    <button
      class="w-full border border-accent-coral/60 bg-accent-coral/10 px-8 py-4 font-display font-bold text-accent-coral tracking-widest uppercase transition-all duration-300 hover:bg-accent-coral hover:text-bg-deep hover:shadow-lg hover:shadow-accent-coral/20 active:scale-95 animate-fade-up animate-delay-4 touch-manipulation"
      @click="emit('retry')"
    >
      Khám lại
    </button>
  </div>
</template>
