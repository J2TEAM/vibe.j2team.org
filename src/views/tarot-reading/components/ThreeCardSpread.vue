<script setup lang="ts">
// ──────────────────────────────────────────────
// ThreeCardSpread — hiển thị ba lá bài theo bố cục ngang.
//
// Responsive: xếp dọc trên màn hình nhỏ, ngang trên sm+.
// Mỗi lá bài có animation deal-in (translate3d từ trung tâm)
// với delay so le để tạo hiệu ứng cascading.
// ──────────────────────────────────────────────

import { ref, onMounted } from 'vue'
import TarotCard from './TarotCard.vue'
import { useTarotStore } from '../stores/useTarotStore'

const store = useTarotStore()

/** Điều khiển animation deal-in — bắt đầu false, set true sau mount */
const dealt = ref(false)

// Kích hoạt animation deal-in sau khi component mount
onMounted(() => {
  // Delay nhỏ để đảm bảo vị trí ban đầu được render trước
  requestAnimationFrame(() => {
    dealt.value = true
  })
})

function handleFlip(index: number) {
  store.flipCard(index)
}
</script>

<template>
  <div class="px-6 py-8" role="region" aria-label="Trải bài ba lá tarot">
    <!-- Tiêu đề -->
    <div class="text-center mb-8">
      <h2
        class="font-display text-xl sm:text-2xl font-semibold text-text-primary flex items-center justify-center gap-3"
      >
        <span class="text-accent-coral font-display text-sm tracking-widest">//</span>
        Trải Bài Của Bạn
      </h2>
      <p class="mt-2 text-text-secondary text-sm">
        {{
          store.allFlipped
            ? 'Tất cả lá bài đã lật — đọc lời giải bên dưới.'
            : `Chạm vào lá bài để lật. ${store.flippedCount}/3 đã lật.`
        }}
      </p>
    </div>

    <!-- Ba lá bài xếp hàng (xếp dọc trên mobile) -->
    <div
      class="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-8"
      role="list"
      aria-label="Ba lá bài tarot: quá khứ, hiện tại, tương lai"
    >
      <div
        v-for="(drawnCard, index) in store.spread"
        :key="drawnCard.card.id"
        role="listitem"
        class="spread-card transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
        :class="dealt ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'"
        :style="{
          /* Delay deal-in so le: 0ms, 200ms, 400ms */
          transitionDelay: `${index * 200}ms`,
        }"
      >
        <TarotCard
          :drawn-card="drawnCard"
          :index="index"
          :interactive="!store.isAnimating"
          @flip="handleFlip"
        />
      </div>
    </div>
  </div>
</template>
