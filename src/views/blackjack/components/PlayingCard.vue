<script setup lang="ts">
import { computed } from "vue";
import type { Card, Suit } from "../types/blackjack";

const props = defineProps<{
  card: Card;
}>();

const suitSymbol = computed(() => {
  const symbols: Record<Suit, string> = {
    hearts: "♥",
    diamonds: "♦",
    clubs: "♣",
    spades: "♠",
  };
  return symbols[props.card.suit];
});

const isRed = computed(() => ["hearts", "diamonds"].includes(props.card.suit));
</script>

<template>
  <!-- Wrapper cho hoạt ảnh bay vào -->
  <div class="card-deal-wrapper">
    <!-- Container cho hiệu ứng lật 3D -->
    <div
      class="relative w-16 h-24 sm:w-20 sm:h-28 transition-all duration-700 preserve-3d shadow-xl select-none"
      :class="{ 'is-flipped': !card.isFaceUp }"
    >
      <!-- Mặt trước (Front) -->
      <div
        class="absolute inset-0 w-full h-full bg-[#F0EDE6] flex flex-col justify-between p-1.5 backface-hidden border border-border-default overflow-hidden z-20"
        :class="isRed ? 'text-accent-coral' : 'text-bg-deep'"
      >
        <template v-if="card.isFaceUp">
          <div class="flex flex-col items-center self-start leading-[0.8] font-display">
            <span class="text-lg font-black tracking-tighter">{{ card.rank }}</span>
            <span class="text-xs font-bold">{{ suitSymbol }}</span>
          </div>

          <div class="text-4xl self-center font-display leading-none opacity-90">
            {{ suitSymbol }}
          </div>

          <div class="flex flex-col items-center self-end rotate-180 leading-[0.8] font-display">
            <span class="text-lg font-black tracking-tighter">{{ card.rank }}</span>
            <span class="text-xs font-bold">{{ suitSymbol }}</span>
          </div>
        </template>
        <!-- Noise overlay cho mặt trước -->
        <div class="absolute inset-0 opacity-[0.03] pointer-events-none bg-noise"></div>
      </div>

      <!-- Mặt sau (Back) - J2team Branding -->
      <div
        class="absolute inset-0 w-full h-full bg-[#111827] border-[3px] border-border-default rotate-y-180 backface-hidden flex items-center justify-center overflow-hidden z-10"
      >
        <!-- Hoa văn nền -->
        <div class="absolute inset-0 opacity-10 bg-pattern-back"></div>

        <!-- Chữ J2team chạy chéo mờ (Tăng kích thước) -->
        <div
          class="absolute inset-0 flex items-center justify-center rotate-[-35deg] pointer-events-none whitespace-nowrap opacity-[0.05] select-none uppercase font-display font-black text-6xl tracking-tighter"
        >
          J2TEAM J2TEAM
        </div>

        <div class="absolute inset-2 border border-accent-coral/10"></div>

        <!-- Logo trung tâm (Thu nhỏ khung hình thoi) -->
        <div class="relative flex flex-col items-center justify-center">
          <!-- Khung kim cương thu nhỏ -->
          <div
            class="w-10 h-10 border-2 border-accent-coral rotate-45 flex items-center justify-center shadow-[0_0_15px_rgba(255,107,74,0.4)]"
          >
            <div
              class="w-8 h-8 border border-accent-coral/30 flex items-center justify-center bg-bg-deep/80"
            >
              <!-- Chữ J2team nghiêng bên trong -->
              <div class="-rotate-45 flex flex-col items-center leading-none">
                <span
                  class="font-display text-[10px] font-black text-accent-coral tracking-tighter uppercase"
                  >J2</span
                >
                <span
                  class="font-display text-[5px] font-black text-accent-coral tracking-widest uppercase -mt-0.5"
                  >TEAM</span
                >
              </div>
            </div>
          </div>
        </div>
        <!-- Góc trang trí -->
        <div
          class="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-accent-coral/30"
        ></div>
        <div
          class="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-accent-coral/30"
        ></div>
        <div
          class="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-accent-coral/30"
        ></div>
        <div
          class="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-accent-coral/30"
        ></div>

        <div class="absolute inset-0 bg-noise opacity-[0.05]"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.preserve-3d {
  transform-style: preserve-3d;
}
.backface-hidden {
  backface-visibility: hidden;
}
.rotate-y-180 {
  transform: rotateY(180deg);
}

/* Hiệu ứng lật bài */
.is-flipped {
  transform: rotateY(180deg);
}

/* Animation chia bài bay vào */
@keyframes card-deal {
  from {
    transform: translate(300px, -300px) rotate(45deg);
    opacity: 0;
  }
  to {
    transform: translate(0, 0) rotate(0deg);
    opacity: 1;
  }
}
.card-deal-wrapper {
  animation: card-deal 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
}

.bg-pattern-back {
  background-image:
    linear-gradient(45deg, #ff6b4a 0.5px, transparent 0.5px),
    linear-gradient(-45deg, #ff6b4a 0.5px, transparent 0.5px);
  background-size: 8px 8px;
}

.bg-noise {
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
}
</style>
