<template>
  <div class="mystical-container">
    <div class="h-[90px] text-center">
      <transition name="fade">
        <div v-if="(!shuffling && !cardsDealt) || selectedCard" class="intro-message">
          <button v-if="!selectedCard" @click="shuffleAndDeal" class="mystical-button">
            <span class="button-text">Xào Bài</span>
          </button>
          <button v-else @click="resetAndSuffle" class="mystical-button mt-4">
            <span class="button-text">Xào Lại</span>
          </button>
        </div>
      </transition>
    </div>
    <div v-if="isIntro" class="text-xs sm:text-md text-center leading-6 pt-4">
      <p>
        Trước khi chọn bài, hãy tập trung vào câu hỏi của bạn và tin tưởng vào sự hướng dẫn của vũ
        trụ.
      </p>
      <p>Mỗi lá bài sẽ mang đến một thông điệp đặc biệt, giúp bạn tìm ra con đường đúng đắn.</p>
    </div>
    <div class="cards-container" :class="{ dealt: cardsDealt }">
      <transition-group name="card" tag="div" class="cards-layout">
        <div
          v-for="(card, index) in cards"
          :key="card.id"
          class="card"
          :class="{
            'card-back': !card.revealed,
            'card-front': card.revealed,
            selected: selectedCardIndex === index,
            unselected: selectedCardIndex !== null && selectedCardIndex !== index,
            'shuffle-card': shuffling,
          }"
          :style="getCardStyle(index)"
          @click="selectCard(index)"
          @mouseenter="onCardHover(index, true)"
          @mouseleave="onCardHover(index, false)"
        >
          <div class="card-inner">
            <div class="card-back-face">
              <div class="astro-border"></div>
              <div class="celestial-circle"></div>
              <div class="zodiac-wheel"></div>
              <div class="astro-stars"></div>
              <div class="moon-phases"></div>
            </div>
            <div class="card-front-face">
              <div class="astro-border"></div>
              <h3
                class="magic-text"
                :class="selectedCardIndex || selectedCardIndex === 0 ? 'block' : 'hidden'"
              >
                <span
                  v-for="(item, index) in card.title.split(' ')"
                  :key="index"
                  :class="selectedCard ? 'inline-block' : 'hidden'"
                  :style="`animation-delay: ${index < 1 ? 1 : 1 + index * 0.15}s`"
                >
                  {{ item }} <span> </span>
                </span>
              </h3>
              <p
                class="magic-text"
                :class="selectedCardIndex || selectedCardIndex === 0 ? 'block' : 'hidden'"
              >
                <span
                  v-for="(item, index) in card.message.split(' ')"
                  :class="selectedCard ? 'inline-block' : 'hidden'"
                  :key="index"
                  :style="`animation-delay: ${index < 1 ? 2 : 2 + index * 0.15}s`"
                >
                  {{ item }} <span> </span>
                </span>
              </p>
            </div>
          </div>
        </div>
      </transition-group>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import { decisions } from '../assets/decides'
import { useWindowSize } from '@vueuse/core'

type DecisionCard = {
  id: number
  title: string
  message: string
}

type MysticalCard = DecisionCard & {
  revealed: boolean
}
const isIntro = ref(true)
const cardsData: DecisionCard[] = decisions

const cards = ref<MysticalCard[]>([])
const cardsDealt = ref(false)
const selectedCardIndex = ref<number | null>(null)
const hoveredCardIndex = ref<number | null>(null)
const shuffling = ref(false)

const { width } = useWindowSize()

const selectedCard = computed<MysticalCard | null>(() => {
  if (selectedCardIndex.value !== null) {
    return cards.value[selectedCardIndex.value] ?? null
  }
  return null
})

const previousDeals: MysticalCard[][] = []
const MAX_HISTORY = 3

function shuffleAndDeal() {
  selectedCardIndex.value = null
  isIntro.value = false

  let newDeal: MysticalCard[]
  let attempts = 0
  const maxAttempts = 10
  const TRUE = true
  do {
    const shuffled = [...cardsData]
      .map((card) => ({ ...card, revealed: false }))
      .sort(() => Math.random() - 0.5)

    const cardCount = width.value < 500 ? 10 : 30
    newDeal = shuffled.slice(0, cardCount)

    const isDuplicate = isCardSetDuplicate(newDeal)

    if (!isDuplicate || attempts >= maxAttempts) {
      break
    }

    attempts++
  } while (TRUE)

  addToHistory(newDeal)
  cards.value = newDeal
  shuffling.value = true

  setTimeout(() => {
    shuffling.value = false
    setTimeout(() => {
      cardsDealt.value = true
    })
  }, 2000)
}

function isCardSetDuplicate(newCards: MysticalCard[]): boolean {
  for (const previousSet of previousDeals) {
    const isSame = areCardSetsEqual(newCards, previousSet)
    if (isSame) return true
  }
  return false
}

function areCardSetsEqual(set1: MysticalCard[], set2: MysticalCard[]): boolean {
  if (set1.length !== set2.length) return false

  const set1Ids = set1.map((card) => card.id).sort((a, b) => a - b)
  const set2Ids = set2.map((card) => card.id).sort((a, b) => a - b)

  return set1Ids.every((id, index) => id === set2Ids[index])
}

function addToHistory(cardSet: MysticalCard[]): void {
  const cardSetCopy = cardSet.map((card) => ({ ...card }))

  previousDeals.unshift(cardSetCopy)

  if (previousDeals.length > MAX_HISTORY) {
    previousDeals.pop()
  }
}

function selectCard(index: number) {
  if (!cardsDealt.value || selectedCardIndex.value !== null || shuffling.value) return
  selectedCardIndex.value = index

  setTimeout(() => {
    const card = cards.value[index]
    if (card) {
      card.revealed = true
    }
  }, 2000)
}

function resetAndSuffle() {
  resetCards()
  setTimeout(() => {
    shuffleAndDeal()
  }, 500)
}

function resetCards() {
  cardsDealt.value = false
  selectedCardIndex.value = null
  cards.value = []
}

function onCardHover(index: number, isHovered: boolean) {
  hoveredCardIndex.value = isHovered ? index : null
}

function getCardStyle(index: number) {
  if (shuffling.value) {
    // During shuffle animation, each card gets a random position
    // This is handled by CSS, so we just return an empty style
    return {}
  }
  if (!cardsDealt.value) {
    // Initial position (stacked)
    return {
      transform: `translateX(0) translateY(0) rotate(0deg)`,
      transition: 'none',
    }
  }

  if (selectedCardIndex.value === index) {
    // Selected card moves to center
    return {
      transform: `translateX(0) translateY(0) rotate(0deg) scale(1.2)`,
      zIndex: 10,
      transitionDuration: '1s',
    }
  }

  if (selectedCardIndex.value !== null) {
    // Other cards move away when one is selected
    const direction = index < selectedCardIndex.value ? -1 : 1
    return {
      transform: `translateX(${direction * 60}vw) translateY(20vh) rotate(${direction * 20}deg)`,
      opacity: 0.3,
      transitionDuration: '1.2s',
    }
  }

  // Spread out the cards in a fan pattern
  const totalCards = cards.value.length
  const spreadWidth = width.value < 500 ? 100 : 600 // percentage of container width
  const angle = width.value < 500 ? 40 : 20 // maximum rotation angle

  // Calculate position in the fan
  const position = index - (totalCards - 1) / 2
  const xPercent = (position / (totalCards - 1)) * spreadWidth
  const rotation = position * (angle / ((totalCards - 1) / 2))

  // Apply hover effect - only move up on Y axis when hovered
  const yOffset = hoveredCardIndex.value === index ? -40 : 0

  return {
    transform: `translateX(${xPercent}%) translateY(${yOffset}px) rotate(${rotation}deg)`,
    boxShadow:
      hoveredCardIndex.value === index
        ? '0 20px 40px rgba(0, 0, 0, 0.6), 0 0 20px rgba(255, 215, 0, 1)'
        : '0 10px 30px rgba(0, 0, 0, 0.5)',
    zIndex: index,
  }
}
</script>

<style scoped>
@keyframes appearAnimation {
  0% {
    opacity: 0;
    transform: translateY(15px) scale(0.2);
    filter: blur(10px);
  }

  60% {
    opacity: 1;
    transform: translateY(0) scale(1.05);
    filter: blur(0);
  }

  100% {
    opacity: 1;
    transform: scale(1);
  }
}

.magic-text span {
  display: inline-block;
  opacity: 0;
  animation: appearAnimation 0.5s forwards;
}

.mystical-container {
  min-height: calc(100vh - 110px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  position: relative;
  z-index: 1;
  overflow: hidden;
  color: #f0e6ff;
}

.mystical-background::before {
  content: '';
  position: absolute;
  width: 200%;
  height: 200%;
  top: -50%;
  left: -50%;
  background: radial-gradient(
    ellipse at center,
    rgba(255, 215, 0, 0.1) 0%,
    rgba(255, 215, 0, 0) 70%
  );
  animation: rotate 60s linear infinite;
}

@keyframes rotate {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(180deg);
  }
}

.title {
  font-size: 2.5rem;
  margin-bottom: 2rem;
  text-align: center;
  color: #ffd700;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
  letter-spacing: 2px;
}

.intro-message p {
  font-size: 1.2rem;
  margin-bottom: 2rem;
  line-height: 1.6;
}

.mystical-button {
  background: linear-gradient(135deg, #071729 0%, #1a2a44 100%);
  border: 2px solid #ffd700;
  color: #ffffff;
  padding: 0.8rem 2rem;
  font-size: 1.1rem;
  border-radius: 30px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  z-index: 1;
  box-shadow: 0 0 15px rgba(12, 33, 58, 0.5);
}

.mystical-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: all 0.6s ease;
  z-index: -1;
}

.mystical-button:hover {
  transform: translateY(-3px);
  box-shadow: 0 7px 20px rgba(44, 98, 166, 0.7);
}

.mystical-button:hover::before {
  left: 100%;
}

.button-text {
  position: relative;
  z-index: 2;
}

.cards-container.shuffling .card {
  transition: all 0.3s ease-in-out;
}

.shuffle-card {
  animation: shuffle 2s ease-in-out;
}

@keyframes shuffle {
  0%,
  100% {
    transform: translateX(0) translateY(0) rotate(0deg);
  }

  10% {
    transform: translateX(-100px) translateY(-50px) rotate(-10deg);
  }

  20% {
    transform: translateX(150px) translateY(30px) rotate(5deg);
  }

  30% {
    transform: translateX(-80px) translateY(80px) rotate(15deg);
  }

  40% {
    transform: translateX(120px) translateY(-100px) rotate(-20deg);
  }

  50% {
    transform: translateX(-150px) translateY(-30px) rotate(10deg);
  }

  60% {
    transform: translateX(100px) translateY(90px) rotate(-15deg);
  }

  70% {
    transform: translateX(-120px) translateY(-70px) rotate(20deg);
  }

  80% {
    transform: translateX(80px) translateY(50px) rotate(-5deg);
  }

  90% {
    transform: translateX(-50px) translateY(-120px) rotate(15deg);
  }
}

.shuffle-card:nth-child(1) {
  animation-delay: 0s;
}

.shuffle-card:nth-child(2) {
  animation-delay: 0.05s;
}

.shuffle-card:nth-child(3) {
  animation-delay: 0.1s;
}

.shuffle-card:nth-child(4) {
  animation-delay: 0.15s;
}

.shuffle-card:nth-child(5) {
  animation-delay: 0.2s;
}

.shuffle-card:nth-child(6) {
  animation-delay: 0.25s;
}

.shuffle-card:nth-child(7) {
  animation-delay: 0.3s;
}

.shuffle-card:nth-child(8) {
  animation-delay: 0.35s;
}

.shuffle-card:nth-child(9) {
  animation-delay: 0.4s;
}

.shuffle-card:nth-child(10) {
  animation-delay: 0.45s;
}

.shuffle-card:nth-child(11) {
  animation-delay: 0.5s;
}

.shuffle-card:nth-child(12) {
  animation-delay: 0.55s;
}

.shuffle-card:nth-child(13) {
  animation-delay: 0.6s;
}

.shuffle-card:nth-child(14) {
  animation-delay: 0.65s;
}

.shuffle-card:nth-child(15) {
  animation-delay: 0.7s;
}

.shuffle-card:nth-child(16) {
  animation-delay: 0.75s;
}

.shuffle-card:nth-child(17) {
  animation-delay: 0.8s;
}

.shuffle-card:nth-child(18) {
  animation-delay: 0.85s;
}

.shuffle-card:nth-child(19) {
  animation-delay: 0.9s;
}

.shuffle-card:nth-child(20) {
  animation-delay: 0.95s;
}

.shuffle-card:nth-child(21) {
  animation-delay: 1s;
}

.shuffle-card:nth-child(22) {
  animation-delay: 1.05s;
}

.shuffle-card:nth-child(23) {
  animation-delay: 1.1s;
}

.shuffle-card:nth-child(24) {
  animation-delay: 1.15s;
}

.shuffle-card:nth-child(25) {
  animation-delay: 1.2s;
}

.shuffle-card:nth-child(26) {
  animation-delay: 1.25s;
}

.shuffle-card:nth-child(27) {
  animation-delay: 1.3s;
}

.shuffle-card:nth-child(28) {
  animation-delay: 1.35s;
}

.shuffle-card:nth-child(29) {
  animation-delay: 1.4s;
}

.shuffle-card:nth-child(30) {
  animation-delay: 1.45s;
}

.cards-container {
  width: 100%;
  height: 60vh;
  position: relative;
  perspective: 1000px;
  margin: 2rem 0;
}

.cards-layout {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
}

.card {
  position: absolute;
  width: 220px;
  height: 340px;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  transform-style: preserve-3d;
  border-radius: 15px;
}

.card-inner {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  transition: transform 1s ease-in-out;
}

.card.selected .card-inner {
  transform: rotateY(180deg);
}

.card-back-face,
.card-front-face {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  border-radius: 15px;
  display: flex;
  flex-direction: column;
  justify-content: start;
  align-items: center;
  padding: 1.5rem;
  text-align: center;
}

/* Astrology-styled card back */
.card-back-face {
  background: linear-gradient(135deg, #0a1a2f 0%, #133355 50%, #1d4e75 100%);
  border: 3px solid #ffd700;
  position: absolute;
  z-index: 1;
}

/* Celestial circle in the center */
.celestial-circle {
  position: absolute;
  width: 150px;
  height: 150px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  border: 2px solid rgba(255, 215, 0, 0.7);
  box-shadow: 0 0 20px rgba(255, 215, 0, 0.3);
  background: radial-gradient(
    circle at center,
    rgba(88, 125, 154, 0.2) 0%,
    rgba(12, 24, 56, 0.8) 70%
  );
  z-index: 1;
}

/* Zodiac wheel */
.zodiac-wheel {
  position: absolute;
  width: 180px;
  height: 180px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Ccircle cx='100' cy='100' r='90' fill='none' stroke='%23ffd700' stroke-width='1' stroke-dasharray='4 4'/%3E%3Ccircle cx='100' cy='100' r='70' fill='none' stroke='%23ffd700' stroke-width='1'/%3E%3Cpath d='M100,10 L100,30 M190,100 L170,100 M100,190 L100,170 M10,100 L30,100' stroke='%23ffd700' stroke-width='1'/%3E%3Cpath d='M135,35 L125,45 M165,135 L155,125 M65,165 L75,155 M35,65 L45,75' stroke='%23ffd700' stroke-width='1'/%3E%3Cpath d='M35,135 L45,125 M135,165 L125,155 M165,65 L155,75 M65,35 L75,45' stroke='%23ffd700' stroke-width='1'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: center;
  opacity: 0.7;
  animation: rotate-slow 60s linear infinite;
  z-index: 1;
}

@keyframes rotate-slow {
  0% {
    transform: translate(-50%, -50%) rotate(0deg);
  }

  100% {
    transform: translate(-50%, -50%) rotate(360deg);
  }
}

/* Astrology border with zodiac pattern */
.astro-border {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border: 1px solid rgba(255, 215, 0, 0.3);
  margin: 8px;
  border-radius: 10px;
  pointer-events: none;
  background-image:
    radial-gradient(circle at 10% 10%, rgba(255, 215, 0, 0.1) 1px, transparent 1px),
    radial-gradient(circle at 90% 10%, rgba(255, 215, 0, 0.1) 1px, transparent 1px),
    radial-gradient(circle at 10% 90%, rgba(255, 215, 0, 0.1) 1px, transparent 1px),
    radial-gradient(circle at 90% 90%, rgba(255, 215, 0, 0.1) 1px, transparent 1px);
  z-index: 3;
}

/* Starry background effect */
.astro-stars {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image:
    radial-gradient(circle at 20% 30%, rgba(255, 255, 255, 0.8) 1px, transparent 1px),
    radial-gradient(circle at 40% 70%, rgba(255, 255, 255, 0.6) 1px, transparent 1px),
    radial-gradient(circle at 60% 20%, rgba(255, 255, 255, 0.7) 1px, transparent 1px),
    radial-gradient(circle at 80% 50%, rgba(255, 255, 255, 0.5) 1px, transparent 1px),
    radial-gradient(circle at 10% 60%, rgba(255, 255, 255, 0.7) 1px, transparent 1px),
    radial-gradient(circle at 30% 90%, rgba(255, 255, 255, 0.6) 1px, transparent 1px),
    radial-gradient(circle at 70% 80%, rgba(255, 255, 255, 0.8) 1px, transparent 1px),
    radial-gradient(circle at 90% 10%, rgba(255, 255, 255, 0.5) 1px, transparent 1px);
  pointer-events: none;
  opacity: 0.3;
  z-index: 0;
}

/* Moon phases at the corners */
.moon-phases {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 4;
}

.moon-phases::before,
.moon-phases::after {
  content: '';
  position: absolute;
  width: 30px;
  height: 30px;
  background-size: contain;
  background-repeat: no-repeat;
  opacity: 0.7;
}

.moon-phases::before {
  top: 20px;
  left: 20px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='40' fill='none' stroke='%23ffd700' stroke-width='2'/%3E%3Cpath d='M50,10 A40,40 0 0,1 50,90 A40,40 0 0,0 50,10' fill='%23ffd700' opacity='0.5'/%3E%3C/svg%3E");
}

.moon-phases::after {
  bottom: 20px;
  right: 20px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='40' fill='none' stroke='%23ffd700' stroke-width='2'/%3E%3Cpath d='M50,10 A40,40 0 0,0 50,90 A40,40 0 0,1 50,10' fill='%23ffd700' opacity='0.5'/%3E%3C/svg%3E");
}

@keyframes glow {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.card-symbol {
  width: 80%;
  height: 80%;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='45' fill='none' stroke='%23ffd700' stroke-width='2'/%3E%3Cpath d='M50 5 L50 95 M5 50 L95 50 M26 26 L74 74 M26 74 L74 26' stroke='%23ffd700' stroke-width='1'/%3E%3Ccircle cx='50' cy='50' r='20' fill='none' stroke='%23ffd700' stroke-width='1'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: center;
  opacity: 0.8;
}

.card-front-face {
  /* background: linear-gradient(135deg, #353535 0%, #040405 40%); */
  backdrop-filter: blur(15px);
  border: 3px solid #ffd700;
  transform: rotateY(180deg);
  position: absolute;
  box-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
  z-index: 5;
}

.card-front-face h3 {
  flex: 1;
  max-height: 50%;
  color: #ffd700;
  font-size: 1rem;
  text-shadow: 0 0 5px rgba(255, 215, 0, 0.5);
}

.card-front-face p {
  color: #f0e6ff;
  font-size: 0.8rem;
  line-height: 1.5;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.card-move {
  transition: transform 0.8s;
}

.card-enter-active,
.card-leave-active {
  transition: all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.card-enter-from {
  opacity: 0;
  transform: translateY(50px) scale(0.8);
}

.card-leave-to {
  opacity: 0;
  transform: translateY(-50px) scale(0.8);
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .title {
    font-size: 2rem;
  }

  .card {
    width: 180px;
    height: 280px;
  }

  .card-front-face h3 {
    font-size: 1.2rem;
  }

  .card-front-face p {
    font-size: 0.9rem;
  }
}

@media (max-width: 480px) {
  .title {
    font-size: 1.8rem;
  }

  .card {
    width: 150px;
    height: 230px;
  }

  .card-front-face h3 {
    font-size: 0.75rem;
  }

  .card-front-face p {
    font-size: 0.5rem;
  }
}
</style>
