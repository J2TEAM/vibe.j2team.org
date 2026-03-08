<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'

type CoinResult = 'HEADS' | 'TAILS'
type CoinRestClass = 'rest-heads' | 'rest-tails'
type CoinAnimationClass =
  | ''
  | 'animate-flip-h2h'
  | 'animate-flip-h2t'
  | 'animate-flip-t2h'
  | 'animate-flip-t2t'

const heads = ref(0)
const tails = ref(0)
const isFlipping = ref(false)
const result = ref<CoinResult>('HEADS')
const coinAnimationClass = ref<CoinAnimationClass>('')
const coinRestClass = ref<CoinRestClass>('rest-heads')
const resultHidden = ref(true)
const flipDurationMs = 3000

const getAnimationClass = (from: CoinResult, to: CoinResult): CoinAnimationClass => {
  if (from === 'HEADS' && to === 'HEADS') return 'animate-flip-h2h'
  if (from === 'HEADS' && to === 'TAILS') return 'animate-flip-h2t'
  if (from === 'TAILS' && to === 'HEADS') return 'animate-flip-t2h'
  return 'animate-flip-t2t'
}

const flipCoin = (): void => {
  if (isFlipping.value) return

  isFlipping.value = true
  resultHidden.value = true

  const fromResult = result.value
  const nextIsHeads = Math.random() < 0.5
  const nextResult: CoinResult = nextIsHeads ? 'HEADS' : 'TAILS'

  coinRestClass.value = fromResult === 'HEADS' ? 'rest-heads' : 'rest-tails'
  coinAnimationClass.value = ''

  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      coinAnimationClass.value = getAnimationClass(fromResult, nextResult)
    })
  })

  window.setTimeout(() => {
    if (nextResult === 'HEADS') {
      heads.value += 1
      result.value = 'HEADS'
    } else {
      tails.value += 1
      result.value = 'TAILS'
    }

    coinRestClass.value = nextResult === 'HEADS' ? 'rest-heads' : 'rest-tails'
    coinAnimationClass.value = ''
    resultHidden.value = false
    isFlipping.value = false
  }, flipDurationMs)
}
</script>

<template>
  <div class="min-h-screen bg-[#f7f3ea] px-4 py-8 text-[#6f5534] font-body">
    <div
      class="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-3xl flex-col items-center justify-center"
    >
      <h1
        class="font-display text-center text-3xl font-bold tracking-[0.2em] text-[#6f5534] uppercase md:text-4xl"
      >
        Flip a coin
      </h1>

      <div
        class="coin-container mt-10"
        role="button"
        tabindex="0"
        aria-label="Flip coin"
        @click="flipCoin"
      >
        <div class="coin" :class="[coinRestClass, coinAnimationClass]">
          <div class="coin-face heads">
            <img
              class="coin-image"
              src="https://media.geeksforgeeks.org/wp-content/uploads/20231016151817/heads.png"
              alt="Heads"
            />
          </div>
          <div class="coin-face tails">
            <img
              class="coin-image"
              src="https://media.geeksforgeeks.org/wp-content/uploads/20231016151806/tails.png"
              alt="Tails"
            />
          </div>
        </div>
      </div>

      <div class="stats mt-10 space-y-2 text-center">
        <p
          class="text-xl font-bold tracking-[0.1em] uppercase transition-opacity duration-500"
          :class="resultHidden ? 'opacity-0' : 'opacity-100'"
        >
          {{ result }}
        </p>
        <div class="flex items-center gap-8 text-sm tracking-[0.08em] uppercase">
          <div>
            Heads: <span>{{ heads }}</span>
          </div>
          <div>
            Tails: <span>{{ tails }}</span>
          </div>
        </div>
        <button
          type="button"
          class="coin-button mt-7 px-8 py-3 font-display text-sm font-bold tracking-[0.12em] uppercase"
          @click="flipCoin"
        >
          Flip Coin
        </button>
      </div>

      <RouterLink
        to="/"
        class="mt-10 inline-flex items-center gap-2 border border-border-default bg-bg-surface px-5 py-2.5 text-sm text-text-secondary transition hover:border-accent-coral hover:bg-bg-elevated hover:text-text-primary"
      >
        &larr; Về trang chủ
      </RouterLink>
    </div>
  </div>
</template>

<style scoped>
:root {
  --coin-gold: #e5c680;
  --coin-gold-dark: #d2b16c;
  --coin-inner: #ddbd76;
  --symbol-color: #6f5534;
}

.coin-container {
  perspective: 1000px;
  width: min(52vw, 220px);
  height: min(52vw, 220px);
  cursor: pointer;
}

.coin {
  width: 100%;
  height: 100%;
  position: relative;
  transform-style: preserve-3d;
}

.coin-face {
  width: 100%;
  height: 100%;
  position: absolute;
  border-radius: 50%;
  overflow: hidden;
  backface-visibility: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 10px 20px rgb(0 0 0 / 14%);
  border: 0;
  background-color: transparent;
}

.heads {
  z-index: 2;
}

.tails {
  transform: rotateY(180deg);
}

.coin-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.rest-heads {
  transform: rotateY(0deg);
}

.rest-tails {
  transform: rotateY(180deg);
}

.animate-flip-h2h {
  animation: flip-h2h 3s forwards;
}

.animate-flip-h2t {
  animation: flip-h2t 3s forwards;
}

.animate-flip-t2h {
  animation: flip-t2h 3s forwards;
}

.animate-flip-t2t {
  animation: flip-t2t 3s forwards;
}

@keyframes flip-h2h {
  from {
    transform: rotateY(0);
  }
  to {
    transform: rotateY(1800deg);
  }
}

@keyframes flip-h2t {
  from {
    transform: rotateY(0);
  }
  to {
    transform: rotateY(1980deg);
  }
}

@keyframes flip-t2h {
  from {
    transform: rotateY(180deg);
  }
  to {
    transform: rotateY(2160deg);
  }
}

@keyframes flip-t2t {
  from {
    transform: rotateY(180deg);
  }
  to {
    transform: rotateY(1980deg);
  }
}

.stats {
  color: var(--symbol-color);
}

.coin-button {
  color: var(--symbol-color);
  background: var(--coin-gold);
  border: 2px solid var(--symbol-color);
  border-radius: 999px;
  box-shadow: 0 8px 20px rgb(0 0 0 / 16%);
  transition: all 0.2s ease;
}

.coin-button:hover {
  background: var(--coin-gold-dark);
}

.coin-button:active {
  transform: scale(0.95);
}

@media (prefers-reduced-motion: reduce) {
  .coin,
  .animate-flip-h2h,
  .animate-flip-h2t,
  .animate-flip-t2h,
  .animate-flip-t2t {
    animation: none !important;
    transition: none !important;
  }
}
</style>
