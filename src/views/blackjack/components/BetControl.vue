<script setup lang="ts">
import { ref } from "vue";

const props = defineProps<{
  balance: number;
  disabled: boolean;
}>();

const emit = defineEmits<{
  (e: "placeBet", amount: number): void;
}>();

const betAmount = ref("10.00");

const multiplyBet = (factor: number) => {
  const current = parseFloat(betAmount.value) || 0;
  const next = current * factor;
  if (next <= props.balance) betAmount.value = next.toFixed(2);
};

const setMax = () => {
  betAmount.value = props.balance.toFixed(2);
};

const handleBet = () => {
  const amount = parseFloat(betAmount.value);
  if (isNaN(amount) || amount <= 0 || amount > props.balance) return;
  emit("placeBet", amount);
};
</script>

<template>
  <div class="w-full flex flex-col gap-2 animate-fade-up">
    <div class="bg-bg-surface p-4 border border-border-default shadow-xl relative overflow-hidden group hover:border-accent-coral transition-all duration-300 w-full">
      <!-- Background Number Decoration -->
      <span class="absolute -bottom-4 -right-2 font-display text-8xl font-bold text-accent-coral/5 select-none pointer-events-none">
        02
      </span>

      <div class="flex flex-col lg:flex-row gap-4 sm:gap-6 relative z-10">
        <!-- Input Group -->
        <div class="grow flex flex-col gap-2">
          <div class="flex flex-col sm:flex-row items-stretch sm:items-center bg-bg-deep border border-border-default p-1 transition-colors focus-within:border-accent-coral">
            <div class="flex items-center grow">
              <div class="flex items-center justify-center px-4 py-2 bg-accent-coral/10 text-accent-coral font-black border-r border-border-default h-full">
                $
              </div>
              <input
                type="text"
                v-model="betAmount"
                class="bg-transparent text-text-primary font-display font-bold w-full outline-none py-3 px-4 text-xl tracking-tight"
                :disabled="disabled"
              />
            </div>
            <div class="flex gap-1 p-1 bg-bg-surface/50 sm:bg-transparent border-t sm:border-t-0 border-border-default mt-1 sm:mt-0 sm:ml-auto">
              <button @click="multiplyBet(0.5)" :disabled="disabled" class="flex-1 sm:flex-none bg-bg-elevated hover:bg-accent-coral hover:text-bg-deep text-text-secondary px-4 py-3 sm:py-2 text-[10px] font-black transition-all uppercase tracking-tighter border border-border-default active:scale-95">½</button>
              <button @click="multiplyBet(2)" :disabled="disabled" class="flex-1 sm:flex-none bg-bg-elevated hover:bg-accent-coral hover:text-bg-deep text-text-secondary px-4 py-3 sm:py-2 text-[10px] font-black transition-all uppercase tracking-tighter border border-border-default active:scale-95">2x</button>
              <button @click="setMax" :disabled="disabled" class="flex-1 sm:flex-none bg-bg-elevated hover:bg-accent-coral hover:text-bg-deep text-text-secondary px-4 py-3 sm:py-2 text-[10px] font-black transition-all uppercase tracking-tighter border border-border-default active:scale-95">Max</button>
            </div>
          </div>
        </div>

        <!-- Submit Button -->
        <div class="flex flex-col justify-end pt-2 lg:pt-0">
          <button
            @click="handleBet"
            :disabled="disabled"
            class="bg-accent-coral hover:bg-accent-coral/90 text-bg-deep font-display font-black px-8 py-4 sm:py-5 transition-all active:translate-y-1 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed whitespace-nowrap text-xs sm:text-sm uppercase tracking-[0.2em] shadow-lg shadow-accent-coral/20">
            ĐẶT CƯỢC
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
