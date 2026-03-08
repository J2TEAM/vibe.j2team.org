<script setup lang="ts">
import { computed, ref, nextTick } from 'vue'
import { RouterLink } from 'vue-router'
import batquaiImg from './batquai.png'

import { getDailyOracleInfo, getHexagramGuidance } from './constants'
import { findHexagramByBinary } from './hexagrams'
import type { Hexagram } from './types'

const TOTAL_LINES = 6

const isCasting = ref(false)
const lines = ref<number[]>([])
const currentHexagram = ref<Hexagram | null>(null)
const resultRef = ref<HTMLElement | null>(null)
const revealTick = ref(0)
// per-coin spinning state and last coin results for current throw
const coinSpinning = ref<boolean[]>([false, false, false])
const coinResults = ref<Array<number | null>>([null, null, null])

const dailyInfo = getDailyOracleInfo()
const guidance = computed(() => {
  if (!currentHexagram.value) return null
  return getHexagramGuidance()
})
const displayBinary = computed(() => {
  const padded = Array.from({ length: TOTAL_LINES }, (_, index) => {
    const value = lines.value[index]
    return value === undefined ? 'x' : String(value)
  })
  return padded.join('')
})

const throwCount = computed(() => lines.value.length)

const statusText = computed(() => {
  if (isCasting.value) {
    return `Đang gieo hào ${throwCount.value + 1}/${TOTAL_LINES}...`
  }

  if (currentHexagram.value !== null) {
    return 'Gieo quẻ hoàn tất.'
  }

  return 'Sẵn sàng gieo quẻ.'
})

const coinFaces = computed(() => {
  return [0, 1, 2].map((i) => {
    if (coinSpinning.value[i]) return 'spinning'
    const val = coinResults.value[i]
    if (val === null) return '—'
    return val === 0 ? 'Âm' : 'Dương'
  })
})

const isAnySpinning = computed(() => coinSpinning.value.some(Boolean))

function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds)
  })
}

async function castOracle() {
  if (isCasting.value) {
    return
  }

  isCasting.value = true
  lines.value = []
  currentHexagram.value = null

  for (let index = 0; index < TOTAL_LINES; index += 1) {
    // prepare for this throw
    revealTick.value += 1
    coinResults.value = [null, null, null]

    // For each of the 3 coins: show gif 1s then reveal result
    for (let coinIndex = 0; coinIndex < 3; coinIndex += 1) {
      coinSpinning.value[coinIndex] = true
      // show icon spin for 1s
      await sleep(1000)
      coinSpinning.value[coinIndex] = false

      // determine coin result (0 = Âm, 1 = Dương)
      const coin = Math.random() > 0.5 ? 1 : 0
      // set result (this will update the displayed coin face)
      coinResults.value = [
        ...coinResults.value.slice(0, coinIndex),
        coin,
        ...coinResults.value.slice(coinIndex + 1),
      ]
    }

    // small pause (1s) before saving the line to let users see final coin states
    await sleep(1000)

    // derive line from coinResults: majority heads => 1 (Dương), else 0 (Âm)
    const sum = coinResults.value.reduce<number>((s, v) => s + (v ?? 0), 0)
    const line = sum >= 2 ? 1 : 0
    lines.value = [...lines.value, line]
  }

  const binary = lines.value.join('')
  currentHexagram.value = findHexagramByBinary(binary)
  isCasting.value = false

  await nextTick()
  if (resultRef.value) {
    resultRef.value.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body px-4 py-10 sm:py-14">
    <div class="mx-auto max-w-4xl">
      <RouterLink
        to="/"
        class="mb-8 inline-flex items-center gap-2 border border-border-default bg-bg-surface px-4 py-2 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary animate-fade-up"
      >
        &larr; Về trang chủ
      </RouterLink>

      <section
        class="border border-border-default bg-bg-surface p-6 sm:p-8 animate-fade-up animate-delay-1"
      >
        <p class="mb-3 font-display text-xs tracking-widest text-accent-coral">// BINARY ORACLE</p>
        <h1 class="font-display text-3xl sm:text-5xl font-bold leading-tight text-text-primary">
          Kinh Dịch
          <span class="text-accent-coral">Nhị Phân</span>
        </h1>
        <p class="mt-4 max-w-3xl text-text-secondary leading-relaxed">
          Hệ thống dự báo tương lai dựa trên nhị phân học cổ truyền. Kinh Dịch là hệ điều hành đầu
          tiên của nhân loại với 0 là Âm, 1 là Dương.
        </p>
        <div class="mt-6 flex flex-col items-center">
          <img :src="batquaiImg" alt="bát quái" class="w-48 sm:w-64 md:w-80 block object-contain" />
          <p class="mt-4 max-w-2xl text-sm text-text-secondary leading-relaxed text-center">
            Kinh Dịch Nhị Phân là phiên bản giải trí lấy cảm hứng từ Kinh Dịch cổ truyền, sử dụng 6
            lần gieo (mỗi lần gồm 3 đồng xu) để tạo ra một chuỗi nhị phân 6 bit tương ứng với 64
            quẻ. Mỗi quẻ được ánh xạ sang lời giải và khuyến nghị phù hợp với đời sống hàng ngày của
            người làm IT.
          </p>
        </div>
      </section>

      <section class="mt-5 grid gap-4 sm:grid-cols-3 animate-fade-up animate-delay-2">
        <article class="border border-border-default bg-bg-surface p-4">
          <p class="font-display text-xs tracking-widest text-accent-amber">// CON SỐ MAY MẮN</p>
          <p class="mt-2 font-display text-3xl font-bold text-text-primary">
            {{ dailyInfo.luckyNumber }}
          </p>
        </article>

        <article class="border border-border-default bg-bg-surface p-4">
          <p class="font-display text-xs tracking-widest text-accent-sky">// QUÝ NHÂN PHÙ TRỢ</p>
          <p class="mt-2 text-sm leading-relaxed text-text-primary">{{ dailyInfo.deity }}</p>
        </article>

        <article class="border border-border-default bg-bg-surface p-4">
          <p class="font-display text-xs tracking-widest text-accent-coral">
            // HƯỚNG NGỒI PHONG THỦY
          </p>
          <p class="mt-2 text-sm leading-relaxed text-text-primary">{{ dailyInfo.direction }}</p>
        </article>
      </section>

      <section
        class="mt-5 border border-border-default bg-bg-surface p-6 sm:p-8 animate-fade-up animate-delay-3"
      >
        <div class="flex flex-col gap-6">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p class="font-display text-xs tracking-widest text-accent-amber">
                // THE 6-STEP HANDSHAKE
              </p>
              <p class="mt-2 text-sm text-text-secondary">{{ statusText }}</p>
            </div>

            <!-- Enhanced binary display: highlighted, monospace, animated when spinning -->
            <div
              class="font-display text-sm tracking-widest text-text-dim flex items-center gap-3"
              aria-live="polite"
            >
              <span class="uppercase text-xs text-text-dim">Binary</span>
              <div class="flex gap-1">
                <span
                  v-for="(bit, i) in displayBinary.split('')"
                  :key="i"
                  class="w-9 h-9 flex items-center justify-center font-mono text-sm rounded border"
                  :class="[
                    isAnySpinning ? 'animate-pulse' : '',
                    bit === 'x' ? 'bg-bg-deep text-text-dim border-border-default' : '',
                    bit === '1' ? 'bg-accent-coral text-bg-deep border-accent-coral' : '',
                    bit === '0' ? 'bg-accent-sky text-bg-deep border-accent-sky' : '',
                  ]"
                >
                  {{ bit }}
                </span>
              </div>
            </div>
          </div>

          <div class="grid gap-3 sm:grid-cols-3">
            <div
              v-for="(face, index) in coinFaces"
              :key="index"
              class="border border-border-default bg-bg-deep px-4 py-5 text-center"
            >
              <p class="font-display text-xs tracking-widest text-accent-sky">
                COIN {{ index + 1 }}
              </p>
              <div class="mt-2">
                <div v-if="coinSpinning[index]" class="mx-auto flex items-center justify-center">
                  <span class="typing font-mono text-sm text-text-primary">Gieo hào...</span>
                </div>
                <p v-else class="text-sm text-text-primary">{{ face }}</p>
              </div>
            </div>
          </div>

          <button
            class="inline-flex w-full cursor-pointer items-center justify-center gap-2 border border-accent-coral bg-accent-coral/10 px-6 py-4 font-display text-base font-semibold tracking-widest text-accent-coral transition hover:bg-accent-coral hover:text-bg-deep disabled:cursor-not-allowed disabled:border-border-default disabled:text-text-dim disabled:bg-bg-deep"
            :disabled="isCasting"
            @click="castOracle"
          >
            [ {{ isCasting ? 'GIEO_QUE.RUNNING' : 'GIEO_QUE.SH' }} ]
          </button>
        </div>
      </section>

      <section
        v-if="currentHexagram"
        ref="resultRef"
        class="mt-5 border border-border-default bg-bg-surface p-6 sm:p-8 animate-fade-up animate-delay-4"
      >
        <div class="flex flex-wrap items-start justify-between gap-3">
          <p class="font-display text-xs tracking-widest text-accent-coral">// QUẺ HÔM NAY</p>
          <p class="font-display text-xs tracking-widest text-text-dim">
            QUẺ #{{ currentHexagram.id }} • {{ currentHexagram.binary }}
          </p>
        </div>

        <h2 class="mt-3 font-display text-2xl sm:text-3xl font-bold text-text-primary mb-4">
          {{ currentHexagram.name }}
        </h2>

        <article class="border border-border-default bg-bg-deep p-4 sm:col-span-2">
          <p class="font-display text-xs tracking-widest text-accent-sky">// LỜI SẤM</p>
          <p class="mt-2 text-sm leading-relaxed text-text-primary">
            {{ currentHexagram.description }}
          </p>
        </article>

        <article class="mt-4 border border-border-default bg-bg-deep p-4">
          <p class="font-display text-xs tracking-widest text-accent-coral">// LỜI KHUYÊN</p>
          <p class="mt-2 text-sm leading-relaxed text-text-primary">{{ currentHexagram.advice }}</p>
        </article>

        <article class="mt-4 border border-border-default bg-bg-deep p-4">
          <p class="font-display text-xs tracking-widest text-accent-amber">// GỢI Ý NGÀY</p>
          <div class="mt-2 grid gap-3 sm:grid-cols-2">
            <div class="border border-border-default p-4 bg-bg-elevated">
              <p class="font-display text-xs tracking-widest text-accent-sky">// GIỜ HOÀNG ĐẠO</p>
              <p class="mt-1 text-sm text-text-primary">{{ guidance?.auspicious }}</p>

              <p class="font-display text-xs tracking-widest text-accent-coral mt-3">// NÊN LÀM</p>
              <p class="mt-1 text-sm text-text-primary">{{ guidance?.shouldDo }}</p>
            </div>

            <div class="border border-border-default p-4 bg-bg-elevated">
              <p class="font-display text-xs tracking-widest text-accent-sky">// GIỜ HẮC ĐẠO</p>
              <p class="mt-1 text-sm text-text-primary">{{ guidance?.inauspicious }}</p>

              <p class="font-display text-xs tracking-widest text-accent-coral mt-3">
                // KHÔNG NÊN
              </p>
              <p class="mt-1 text-sm text-text-primary">{{ guidance?.shouldNotDo }}</p>
            </div>
          </div>
        </article>
      </section>
    </div>
  </div>
</template>

<style scoped>
.typing {
  display: inline-block;
  overflow: hidden;
  white-space: nowrap;
  width: 0;
  border-right: 0.12em solid rgba(255, 255, 255, 0);
  animation: typing 1s steps(15, end) forwards;
}
@keyframes typing {
  from {
    width: 0;
  }
  to {
    width: 100%;
  }
}
</style>
