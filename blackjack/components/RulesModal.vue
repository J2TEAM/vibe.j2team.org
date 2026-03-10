<script setup lang="ts">
defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (e: "close"): void;
}>();

const rules = [
  {
    title: "Mục tiêu",
    desc: `Đạt tổng điểm gần 21 nhất có thể nhưng không được vượt quá 21 điểm.
Ai có điểm cao hơn là người thắng.`,
  },
  {
    title: "Giá trị quân bài",
    desc: "2-10 giữ nguyên giá trị. J, Q, K tính 10 điểm. Át (A) tính 1 hoặc 11 điểm tùy điều kiện có lợi nhất cho người chơi.",
  },
  {
    title: "Các lựa chọn",
    desc: `RÚT: Lấy thêm 1 lá bài.
DỪNG: Giữ nguyên bài hiện tại.
GẤP ĐÔI (x2): Gấp đôi tiền cược và chỉ được rút duy nhất 1 lá.
TÁCH: Nếu có 2 lá bài giống giá trị, tách thành 2 phần bài.`,
  },
  {
    title: "Luật của Dealer",
    desc: "Dealer bắt buộc phải rút bài cho đến khi tổng điểm đạt ít nhất 17 điểm.",
  },
  {
    title: "Số dư",
    desc: `Withdraw để lưu số dư của mình.
Deposit để nạp lại số dư.`,
  },
];
</script>

<template>
  <transition name="fade-scale">
    <div v-if="isOpen" class="fixed inset-0 z-100 flex items-center justify-center p-4">
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-bg-deep/95 backdrop-blur-md" @click="emit('close')"></div>

      <!-- Modal Content -->
      <div
        class="relative w-full max-w-2xl bg-bg-surface border-2 border-border-default shadow-[20px_20px_0_rgba(255,107,74,0.15)] overflow-hidden animate-fade-up"
      >
        <div class="p-8 sm:p-10 flex flex-col gap-8">
          <div class="flex items-center justify-between border-b border-border-default pb-6">
            <h2 class="font-display text-3xl font-black italic uppercase tracking-tighter">
              Luật chơi <span class="text-accent-coral">Blackjack</span>
            </h2>
          </div>

          <div class="grid gap-8 overflow-y-auto max-h-[60vh] custom-scrollbar pr-2">
            <div v-for="(rule, index) in rules" :key="index" class="flex flex-col gap-2">
              <div class="flex items-center gap-4">
                <span class="text-accent-coral font-display text-xs font-black"
                  >0{{ index + 1 }} //</span
                >
                <h3
                  class="font-display text-sm font-black uppercase tracking-widest text-text-primary"
                >
                  {{ rule.title }}
                </h3>
              </div>
              <!-- Thêm whitespace-pre-line để nhận diện dấu xuống dòng -->
              <p
                class="text-text-secondary text-[12px] sm:text-[13px] leading-relaxed font-semibold pl-12 border-l-2 border-border-default/40 ml-4 whitespace-pre-line"
              >
                {{ rule.desc }}
              </p>
            </div>
          </div>

          <div class="mt-6 pt-8 border-t border-border-default flex justify-center">
            <button
              @click="emit('close')"
              class="bg-accent-coral text-bg-deep font-display font-black px-12 py-4 text-xs tracking-[0.3em] uppercase hover:bg-accent-coral/90 transition-all active:translate-y-1 shadow-lg shadow-accent-coral/20"
            >
              ĐÃ HIỂU
            </button>
          </div>
        </div>

        <!-- Decorative BG Text -->
        <div
          class="absolute bottom-[-15%] right-[-5%] opacity-[0.03] pointer-events-none select-none"
        >
          <span class="font-display text-[18vw] font-black italic uppercase">RULES</span>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
}
.fade-scale-enter-from {
  opacity: 0;
  transform: scale(0.95) translateY(30px);
}
.fade-scale-leave-to {
  opacity: 0;
  transform: scale(1.05);
}

.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 107, 74, 0.2);
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 107, 74, 0.4);
}
</style>
