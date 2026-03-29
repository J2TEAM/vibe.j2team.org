<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  hours: number
  minutes: number
  seconds: number
  dateStr: string
  rainIntensity: number
  intensityLabel: string
}>()

const timeStr = computed(() => ({
  h: String(props.hours).padStart(2, '0'),
  m: String(props.minutes).padStart(2, '0'),
  s: String(props.seconds).padStart(2, '0'),
}))

const hourAngle = computed(() => (props.hours % 12) * 30 + props.minutes * 0.5)
const minuteAngle = computed(() => props.minutes * 6)
const secondAngle = computed(() => props.seconds * 6)

const hourHand = computed(() => ({
  x2: 100 + 48 * Math.sin((hourAngle.value * Math.PI) / 180),
  y2: 100 - 48 * Math.cos((hourAngle.value * Math.PI) / 180),
}))
const minuteHand = computed(() => ({
  x2: 100 + 66 * Math.sin((minuteAngle.value * Math.PI) / 180),
  y2: 100 - 66 * Math.cos((minuteAngle.value * Math.PI) / 180),
}))
const secondHand = computed(() => ({
  x1: 100 + 15 * Math.sin(((secondAngle.value + 180) * Math.PI) / 180),
  y1: 100 - 15 * Math.cos(((secondAngle.value + 180) * Math.PI) / 180),
  x2: 100 + 72 * Math.sin((secondAngle.value * Math.PI) / 180),
  y2: 100 - 72 * Math.cos((secondAngle.value * Math.PI) / 180),
}))

function tickCoords(index: number, inner: number) {
  const angle = (index * 30 * Math.PI) / 180
  return {
    x1: 100 + 80 * Math.sin(angle),
    y1: 100 - 80 * Math.cos(angle),
    x2: 100 + inner * Math.sin(angle),
    y2: 100 - inner * Math.cos(angle),
  }
}

const clockDropStyles = computed(() =>
  Array.from({ length: props.rainIntensity * 3 }, (_, index) => ({
    left: `${15 + ((index * 37) % 70)}%`,
    animationDuration: `${1.2 + (index % 7) * 0.3}s`,
    animationDelay: `-${(index * 0.17) % 2}s`,
    opacity: 0.28 + (index % 4) * 0.08,
  }))
)
</script>

<template>
  <section class="hero-panel">
    <div class="intensity-chip">
      <span class="chip-dot" />
      <span>{{ intensityLabel }}</span>
      <span class="chip-level">{{ rainIntensity }}/8</span>
    </div>

    <div class="clock-wrap">
      <svg class="analog-clock" viewBox="0 0 200 200">
        <circle cx="100" cy="100" r="94" class="clock-ring-outer" />
        <circle cx="100" cy="100" r="88" class="clock-ring-inner" />

        <g v-for="i in 12" :key="i">
          <line
            v-bind="tickCoords(i, i % 3 === 0 ? 66 : 74)"
            :class="i % 3 === 0 ? 'tick-major' : 'tick-minor'"
          />
        </g>

        <line x1="100" y1="100" v-bind="hourHand" class="hand hand-hour" />
        <line x1="100" y1="100" v-bind="minuteHand" class="hand hand-minute" />
        <line v-bind="secondHand" class="hand hand-second" />

        <circle cx="100" cy="100" r="4" class="center-dot" />
        <circle cx="100" cy="100" r="2" class="center-dot-inner" />
      </svg>

      <div class="clock-drops">
        <span
          v-for="(style, index) in clockDropStyles"
          :key="index"
          class="clock-drop"
          :style="style"
        />
      </div>
    </div>

    <div class="digital-time">
      <span class="digit">{{ timeStr.h }}</span>
      <span class="colon">:</span>
      <span class="digit">{{ timeStr.m }}</span>
      <span class="colon colon-dim">:</span>
      <span class="digit digit-sec">{{ timeStr.s }}</span>
    </div>

    <p class="date-line">{{ dateStr }}</p>
  </section>
</template>

<style scoped>
.hero-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 0;
  gap: clamp(0.5rem, 1.8vh, 1.1rem);
}

.intensity-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0.7rem;
  background: rgba(8, 18, 34, 0.55);
  border: 1px solid rgba(61, 100, 136, 0.45);
  color: var(--color-text-dim);
  font-family: var(--font-body);
  font-size: 0.74rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.chip-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--color-accent-sky);
  box-shadow: 0 0 12px rgba(56, 189, 248, 0.9);
}

.chip-level {
  color: var(--color-text-secondary);
  font-family: 'Courier New', monospace;
}

.clock-wrap {
  position: relative;
  width: min(240px, 44vw, 32vh);
}

.analog-clock {
  width: 100%;
  height: auto;
  filter: drop-shadow(0 0 22px rgba(56, 189, 248, 0.2));
}

.clock-ring-outer {
  fill: none;
  stroke: rgba(56, 189, 248, 0.15);
  stroke-width: 1;
}

.clock-ring-inner {
  fill: rgba(5, 12, 20, 0.62);
  stroke: rgba(56, 189, 248, 0.1);
  stroke-width: 0.5;
}

.tick-major {
  stroke: rgba(160, 205, 245, 0.58);
  stroke-width: 1.5;
  stroke-linecap: round;
}

.tick-minor {
  stroke: rgba(100, 150, 200, 0.28);
  stroke-width: 0.8;
  stroke-linecap: round;
}

.hand {
  stroke-linecap: round;
}

.hand-hour {
  stroke: rgba(232, 240, 255, 0.9);
  stroke-width: 3;
}

.hand-minute {
  stroke: rgba(205, 225, 255, 0.74);
  stroke-width: 2;
}

.hand-second {
  stroke: var(--color-accent-sky);
  stroke-width: 1;
  opacity: 0.92;
}

.center-dot {
  fill: rgba(56, 189, 248, 0.35);
}

.center-dot-inner {
  fill: var(--color-accent-sky);
}

.clock-drops {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  border-radius: 50%;
}

.clock-drop {
  position: absolute;
  top: -8px;
  width: 1px;
  height: 8px;
  background: linear-gradient(to bottom, transparent, rgba(160, 210, 250, 0.62));
  animation: fall-drop linear infinite;
}

@keyframes fall-drop {
  to {
    transform: translateY(245px);
  }
}

.digital-time {
  display: flex;
  align-items: baseline;
  gap: 0.1em;
  font-family: 'Courier New', 'Lucida Console', monospace;
  letter-spacing: -0.02em;
  line-height: 1;
}

.digit {
  font-size: clamp(2.6rem, 10vw, 5.6rem);
  color: #c8dff5;
  font-weight: 400;
  text-shadow: 0 0 30px rgba(56, 189, 248, 0.32);
}

.digit-sec {
  font-size: clamp(1.2rem, 4.5vw, 2.7rem);
  color: var(--color-text-dim);
  text-shadow: none;
  align-self: flex-end;
  padding-bottom: 0.13em;
}

.colon {
  font-size: clamp(2rem, 8vw, 4rem);
  color: rgba(56, 189, 248, 0.52);
  animation: blink-colon 1s step-end infinite;
}

.colon-dim {
  font-size: clamp(1.2rem, 4vw, 2.1rem);
  opacity: 0.35;
  animation: none;
}

@keyframes blink-colon {
  50% {
    opacity: 0.15;
  }
}

.date-line {
  font-family: var(--font-body);
  font-size: 0.76rem;
  color: var(--color-text-dim);
  letter-spacing: 0.05em;
  text-transform: uppercase;
  margin: 0;
}

@media (max-height: 780px) {
  .date-line {
    display: none;
  }

  .digital-time {
    transform: scale(0.88);
  }
}
</style>
