<script setup lang="ts">
// ──────────────────────────────────────────────
// ReadingSynthesis — hiển thị lời giải ngôn ngữ tự nhiên
// sau khi cả ba lá bài đã được lật.
//
// Render bold/italic từ chuỗi synthesis thành HTML.
// Fade-in animation so le cho mỗi đoạn văn.
// ──────────────────────────────────────────────

import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import { useTarotStore } from '../stores/useTarotStore'
import { POSITION_LABELS } from '../composables/useReadingSynthesis'

const store = useTarotStore()

const emit = defineEmits<{
  reset: []
}>()

/**
 * Chuyển đổi markdown đơn giản (**bold** và *italic*)
 * sang HTML. Giữ nhẹ nhàng — không cần parser markdown đầy đủ.
 */
function formatMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-accent-coral font-semibold">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em class="text-accent-amber">$1</em>')
}

// Định dạng sẵn tất cả đoạn văn
const formattedParagraphs = computed(() => store.reading.map((p) => formatMarkdown(p)))
</script>

<template>
  <div
    v-if="store.allFlipped && store.reading.length > 0"
    class="max-w-2xl mx-auto px-6 py-8"
    role="region"
    aria-label="Lời giải trải bài tarot"
    aria-live="polite"
  >
    <!-- Tiêu đề phần -->
    <div class="text-center mb-8 animate-fade-up">
      <h2
        class="font-display text-2xl font-semibold text-text-primary flex items-center justify-center gap-3 mb-8"
      >
        <span class="text-accent-coral font-display text-sm tracking-widest">//</span>
        Lời Giải Của Bạn
      </h2>
    </div>

    <!-- Các đoạn lời giải -->
    <div class="space-y-4">
      <div
        v-for="(paragraph, index) in formattedParagraphs"
        :key="index"
        class="border border-border-default bg-bg-surface p-6 animate-fade-up"
        :style="{ animationDelay: `${(index + 1) * 150}ms` }"
      >
        <!-- Nhãn vị trí cho lời giải từng lá (3 đoạn đầu) -->
        <div v-if="index < 3 && store.spread[index]" class="mb-2">
          <span
            class="inline-flex items-center gap-1.5 font-display text-[10px] tracking-[0.15em] uppercase"
            :class="{
              'text-accent-amber': index === 0,
              'text-accent-coral': index === 1,
              'text-accent-sky': index === 2,
            }"
          >
            <Icon
              :icon="
                index === 0 ? 'lucide:history' : index === 1 ? 'lucide:compass' : 'lucide:telescope'
              "
              class="w-3 h-3"
            />
            {{ POSITION_LABELS[store.spread[index]!.position] }}
          </span>
        </div>

        <!-- Nhãn tổng kết cho đoạn cuối -->
        <div v-if="index === 3" class="mb-2">
          <span
            class="inline-flex items-center gap-1.5 font-display text-[10px] tracking-[0.15em] uppercase text-text-dim"
          >
            <Icon icon="lucide:sparkles" class="w-3 h-3" />
            tổng kết
          </span>
        </div>

        <!-- eslint-disable-next-line vue/no-v-html -->
        <p class="text-sm text-text-secondary leading-relaxed" v-html="paragraph" />
      </div>
    </div>

    <!-- Nút Trải Bài Mới -->
    <div class="text-center mt-8 animate-fade-up animate-delay-5">
      <button
        class="inline-flex items-center gap-2 border border-accent-coral bg-accent-coral/10 px-6 py-2.5 font-display text-sm tracking-wider uppercase text-accent-coral transition-all duration-300 hover:bg-accent-coral hover:text-bg-deep focus-visible:outline-2 focus-visible:outline-accent-coral focus-visible:outline-offset-4"
        aria-label="Bắt đầu trải bài mới"
        @click="emit('reset')"
      >
        <Icon icon="lucide:refresh-cw" class="w-4 h-4" />
        Trải Bài Mới
      </button>
    </div>
  </div>
</template>
