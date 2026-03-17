<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { useImage } from 'vue-konva'
import { useGameStore } from '../stores/game'

import flagMatTranGiaiPhongUrl from '../assets/flag-mat-tran-giai-phong.webp'
import gateLeftUrl from '../assets/gate-left.webp'
import gateRightUrl from '../assets/gate-right.webp'
import tankWoutOutlineUrl from '../assets/tank-wout-outline.webp'

const [tankWoutOutlineImg] = useImage(tankWoutOutlineUrl)
const [gateLeftImg] = useImage(gateLeftUrl)
const [gateRightImg] = useImage(gateRightUrl)
const [flagMatTranGiaiPhongImg] = useImage(flagMatTranGiaiPhongUrl)

const TITLE = {
  1: 'Chiến sĩ\nGiải phóng quân',
  2: 'Biệt động\nSài Gòn',
  3: 'Thanh niên\nXung phong',
  4: 'Chiến sĩ\nDu kích',
} as const

const COLORS = ['#DA251D', '#3399FF', '#FFFF00', '#0DBF36']

function getTwoUniqueColors(colors: string[]) {
  const randomIndex1 = Math.floor(Math.random() * colors.length)
  let randomIndex2
  do {
    randomIndex2 = Math.floor(Math.random() * colors.length)
  } while (randomIndex2 === randomIndex1)
  return [colors[randomIndex1], colors[randomIndex2]]
}

const gameStore = useGameStore()
const { isAnimationDone, gateLeftDistance, gateRightDistance, tankSpeed } = storeToRefs(gameStore)

const rank = computed(() => {
  if (!isAnimationDone.value) {
    return { title: TITLE[1], flag: 4, colors: getTwoUniqueColors(COLORS) }
  }

  if (gateLeftDistance.value > 10_000 && gateRightDistance.value > 10_000) {
    return { title: TITLE[1], flag: 4, colors: getTwoUniqueColors(COLORS) }
  }

  if (gateLeftDistance.value > 5_000 && gateRightDistance.value > 5_000) {
    return { title: TITLE[2], flag: 3, colors: getTwoUniqueColors(COLORS) }
  }

  if (gateLeftDistance.value > 2_000 && gateRightDistance.value > 2_000) {
    return { title: TITLE[3], flag: 2, colors: getTwoUniqueColors(COLORS) }
  }

  return { title: TITLE[4], flag: 1, colors: getTwoUniqueColors(COLORS) }
})

const onTryAgain = () => {
  gameStore.setStage('ready')
  gameStore.setIsAnimationDone(false)
  gameStore.setIsGateLeftDone(false)
  gameStore.setIsGateRightDone(false)
  gameStore.setIsTankDone(false)
  gameStore.setIsTankHit(false)
  gameStore.setGateLeftDistance(0)
  gameStore.setGateRightDistance(0)
  gameStore.setTankSpeed(0)
}

const formatNumber = (n: number) => Number(n).toLocaleString()
</script>

<template>
  <section
    v-if="isAnimationDone"
    id="result"
    class="fixed inset-0 w-full h-full flex items-center z-10 justify-center select-none"
  >
    <div
      class="w-full h-full bg-black/50 absolute top-0 left-0 z-3 pointer-events-none backdrop-blur-xs"
    />
    <div class="aspect-3/4 w-[90%] sm:w-[400px] bg-white overflow-hidden relative z-5">
      <span
        class="text-[3rem] top-[4%] left-[6%] absolute leading-[1.3] whitespace-pre-line text-black"
        >{{ rank.title }}</span
      >

      <figure class="w-[50%] absolute top-[28%] left-[30%]">
        <svg class="w-full h-full" width="230" height="211" viewBox="0 0 230 211" fill="none">
          <path
            d="M27.9627 37.0177L86.1884 122.819L0.662056 175.936L110.051 161.242L151.921 210.768L150.426 131.832L225.946 148.079L181.017 98.5947L229.178 34.0145L146.96 69.5989L119.973 0.304401L111.784 81.5393L27.9627 37.0177Z"
            :fill="rank.colors[0]"
          />
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M103.135 126.42L54.5602 156.588L114.97 148.473L139.284 177.233L138.142 116.915L191.953 128.491L165.489 99.3439L192.675 62.8887L140.297 85.5582L126.906 51.1733L121.932 100.517L65.0554 70.3071L103.135 126.42ZM27.9627 37.0177L86.1884 122.819L0.662056 175.936L110.051 161.242L151.921 210.768L150.426 131.832L225.946 148.079L181.017 98.5947L229.178 34.0145L146.96 69.5989L119.973 0.304401L111.784 81.5393L27.9627 37.0177Z"
            :fill="rank.colors[1]"
          />
        </svg>
      </figure>

      <figure class="w-[142%] rotate-[9deg] top-[40%] left-[2%] absolute">
        <img
          v-if="tankWoutOutlineImg"
          :src="tankWoutOutlineImg.src"
          alt="tank"
          draggable="false"
          class="w-full h-auto"
        />
      </figure>

      <div
        class="absolute bottom-[4%] left-[6%] flex flex-col space-y-[9%] h-fit w-[50%] leading-none"
      >
        <div class="flex flex-col space-y-[4%]">
          <span class="text-[0.7rem] text-[#6C6C6C]">Tốc độ xe tăng</span>
          <span class="text-[1.2rem] text-[#2a2929]">{{ formatNumber(tankSpeed) }}km/h</span>
        </div>
        <div class="flex gap-[9%] leading-none">
          <div class="flex flex-col space-y-[8%]">
            <span class="text-[0.7rem] text-[#6C6C6C]">Cổng trái</span>
            <span class="text-[1.2rem] text-[#2a2929]">{{ formatNumber(gateLeftDistance) }}m</span>
          </div>
          <div class="flex flex-col space-y-[9%]">
            <span class="text-[0.7rem] text-[#6C6C6C]">Cổng phải</span>
            <span class="text-[1.2rem] text-[#2a2929]">{{ formatNumber(gateRightDistance) }}m</span>
          </div>
        </div>
      </div>

      <figure class="absolute top-[27%] left-[-3.9%] w-[20%] -rotate-12">
        <img
          v-if="gateLeftImg"
          :src="gateLeftImg.src"
          alt="cổng trái"
          draggable="false"
          class="w-full h-auto"
        />
      </figure>
      <figure class="absolute top-[24%] right-[10%] w-[10%] rotate-25">
        <img
          v-if="gateRightImg"
          :src="gateRightImg.src"
          alt="cổng phải"
          draggable="false"
          class="w-full h-auto"
        />
      </figure>

      <div class="absolute bottom-[4%] right-[5%] flex justify-end space-x-[1%]">
        <figure v-for="index in rank.flag" :key="index" class="w-[7%] h-auto">
          <img v-if="flagMatTranGiaiPhongImg" alt="cờ" draggable="false" class="w-full h-auto" />
        </figure>
      </div>
    </div>

    <button
      type="button"
      class="cursor-pointer absolute z-11 bottom-10 text-white bg-black/50 px-3 py-2 text-base flex items-center gap-2"
      @click="onTryAgain"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="w-5 h-5"
      >
        <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
        <path d="M21 3v5h-5" />
      </svg>
      Thử húc tốt hơn
    </button>
  </section>
</template>
