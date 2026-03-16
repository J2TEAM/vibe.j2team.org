<script setup lang="ts">
// ──────────────────────────────────────────────
// TarotCard — lá bài với hình ảnh và hiệu ứng lật 3D.
//
// Sử dụng CSS perspective + rotateY cho GPU-accelerated flipping.
// Mặt sau hiển thị ảnh CardBacks.png, mặt trước hiển thị ảnh lá bài.
// Hỗ trợ bàn phím (Enter/Space) và screen reader (aria attributes).
// ──────────────────────────────────────────────

import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import type { DrawnCard } from '../types'
import { POSITION_LABELS } from '../composables/useReadingSynthesis'
import { getCardImageUrl, getCardBackUrl } from '../utils/cardImages'

const props = defineProps<{
  drawnCard: DrawnCard
  index: number
  /** Cho phép tương tác (click/keyboard) hay không */
  interactive: boolean
}>()

const emit = defineEmits<{
  flip: [index: number]
}>()

// Nhãn vị trí (Quá Khứ / Hiện Tại / Tương Lai)
const positionLabel = computed(() => POSITION_LABELS[props.drawnCard.position])

// URL ảnh lá bài (mặt trước)
const cardImageUrl = computed(() => getCardImageUrl(props.drawnCard.card))

// URL ảnh mặt sau
const cardBackUrl = computed(() => getCardBackUrl())

// Ý nghĩa dựa trên hướng lá bài
const meaning = computed(() =>
  props.drawnCard.reversed
    ? props.drawnCard.card.reversedMeaning
    : props.drawnCard.card.uprightMeaning,
)

// Aria label cho screen reader
const ariaLabel = computed(() => {
  if (!props.drawnCard.flipped) {
    return `Lá bài ${positionLabel.value} — nhấn để lật`
  }
  const orientation = props.drawnCard.reversed ? '(ngược)' : '(xuôi)'
  return `${positionLabel.value}: ${props.drawnCard.card.name} ${orientation}`
})

function handleFlip() {
  if (props.interactive && !props.drawnCard.flipped) {
    emit('flip', props.index)
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    handleFlip()
  }
}
</script>

<template>
  <div class="tarot-card-wrapper flex flex-col items-center gap-3">
    <!-- Nhãn vị trí -->
    <span
      class="font-display text-xs tracking-[0.2em] uppercase"
      :class="drawnCard.flipped ? 'text-accent-coral' : 'text-text-dim'"
    >
      {{ positionLabel }}
    </span>

    <!-- Card container với 3D perspective -->
    <div
      class="tarot-card group relative cursor-pointer"
      :class="{
        'pointer-events-none': !interactive || drawnCard.flipped,
      }"
      role="button"
      :tabindex="interactive && !drawnCard.flipped ? 0 : -1"
      :aria-label="ariaLabel"
      @click="handleFlip"
      @keydown="handleKeydown"
    >
      <!-- Inner card xoay khi lật -->
      <div
        class="tarot-card-inner relative w-full h-full transition-transform duration-700"
        :style="{ transform: drawnCard.flipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }"
      >
        <!-- ═══ Mặt Sau (Card Back) ═══ -->
        <div
          class="tarot-card-face tarot-card-back absolute inset-0 border border-border-default bg-bg-deep overflow-hidden"
        >
          <!-- Ảnh mặt sau -->
          <img
            v-if="cardBackUrl"
            :src="cardBackUrl"
            alt="Mặt sau lá bài"
            class="w-full h-full object-cover"
            loading="lazy"
          />

          <!-- Hover glow khi có thể tương tác -->
          <div
            v-if="interactive && !drawnCard.flipped"
            class="absolute inset-0 opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity duration-300 bg-linear-to-t from-accent-coral/15 to-transparent"
          />

          <!-- Gợi ý chạm -->
          <div
            v-if="interactive && !drawnCard.flipped"
            class="absolute bottom-2 inset-x-0 text-center"
          >
            <span
              class="inline-block font-display text-[10px] tracking-widest uppercase text-text-primary/80 bg-bg-deep/70 px-2 py-0.5 group-hover:text-accent-coral transition-colors"
            >
              chạm để lật
            </span>
          </div>
        </div>

        <!-- ═══ Mặt Trước (Card Front) ═══ -->
        <div
          class="tarot-card-face tarot-card-front absolute inset-0 border bg-bg-surface overflow-hidden flex flex-col"
          :class="drawnCard.flipped ? 'border-accent-coral' : 'border-border-default'"
        >
          <!-- Ảnh lá bài chiếm phần chính -->
          <div class="relative flex-1 min-h-0 overflow-hidden bg-bg-deep">
            <img
              v-if="cardImageUrl"
              :src="cardImageUrl"
              :alt="drawnCard.card.name"
              class="w-full h-full object-cover"
              :class="{ 'rotate-180': drawnCard.reversed }"
              loading="lazy"
            />

            <!-- Gradient overlay ở dưới ảnh -->
            <div
              class="absolute inset-x-0 bottom-0 h-16 bg-linear-to-t from-bg-surface to-transparent"
            />

            <!-- Badge ngược (nếu lá bài bị ngược) -->
            <div v-if="drawnCard.reversed" class="absolute top-2 right-2">
              <span
                class="inline-flex items-center gap-1 font-display text-[9px] tracking-widest uppercase text-accent-amber bg-bg-deep/80 px-1.5 py-0.5 border border-accent-amber/30"
              >
                <Icon icon="lucide:rotate-ccw" class="w-2.5 h-2.5" />
                ngược
              </span>
            </div>
          </div>

          <!-- Thông tin lá bài ở dưới -->
          <div class="px-3 py-2 text-center shrink-0">
            <h3
              class="font-display text-xs sm:text-sm font-semibold text-text-primary leading-tight truncate"
            >
              {{ drawnCard.card.name }}
            </h3>
            <p class="font-display text-[9px] tracking-wider uppercase text-text-dim mt-0.5">
              {{ positionLabel }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Ý nghĩa ngắn gọn dưới lá bài (chỉ hiện khi đã lật) -->
    <div v-if="drawnCard.flipped" class="max-w-[192px] text-center animate-fade-up">
      <p class="text-[11px] text-text-secondary leading-relaxed line-clamp-3">
        {{ meaning }}
      </p>
    </div>
  </div>
</template>

<style scoped>
/*
 * Cách tiếp cận animation: CSS 3D transforms cho GPU acceleration.
 * - perspective tạo không gian 3D
 * - preserve-3d cho phép các mặt tồn tại trong 3D
 * - backface-visibility: hidden ngăn z-fighting giữa hai mặt
 * - rotateY(180deg) lật lá bài
 *
 * Hiệu năng: transform và opacity là thuộc tính compositor-only,
 * nên animations chạy trên GPU mà không trigger layout/paint.
 */

.tarot-card {
  perspective: 1000px;
  width: 160px;
  height: 256px;
}

@media (min-width: 640px) {
  .tarot-card {
    width: 192px;
    height: 304px;
  }
}

.tarot-card-inner {
  transform-style: preserve-3d;
  will-change: transform;
}

.tarot-card-face {
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}

.tarot-card-back {
  transform: rotateY(0deg);
}

.tarot-card-front {
  transform: rotateY(180deg);
}

/* Focus ring cho keyboard navigation */
.tarot-card:focus-visible .tarot-card-back {
  outline: 2px solid var(--color-accent-coral);
  outline-offset: 2px;
}
</style>
