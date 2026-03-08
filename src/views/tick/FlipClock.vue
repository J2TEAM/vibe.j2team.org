<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'

const props = defineProps<{
  hours: string
  minutes: string
  seconds: string
  date: string
}>()

function splitDigits(val: string): [string, string] {
  return [val[0]!, val[1]!]
}

interface FlipDigit {
  current: string
  previous: string
  bottomShown: string
  animKey: number
}

type DigitKey = 'h0' | 'h1' | 'm0' | 'm1' | 's0' | 's1'

const digits = ref<Record<DigitKey, FlipDigit>>({
  h0: { current: '0', previous: '0', bottomShown: '0', animKey: 0 },
  h1: { current: '0', previous: '0', bottomShown: '0', animKey: 0 },
  m0: { current: '0', previous: '0', bottomShown: '0', animKey: 0 },
  m1: { current: '0', previous: '0', bottomShown: '0', animKey: 0 },
  s0: { current: '0', previous: '0', bottomShown: '0', animKey: 0 },
  s1: { current: '0', previous: '0', bottomShown: '0', animKey: 0 },
})

const flipTimers = new Map<string, ReturnType<typeof setTimeout>>()

function updateDigit(key: DigitKey, newVal: string) {
  const d = digits.value[key]
  if (!d || d.current === newVal) return

  // Clear any pending timer for this digit
  const existing = flipTimers.get(key)
  if (existing) clearTimeout(existing)

  d.previous = d.current
  d.bottomShown = d.current // bottom keeps showing old value
  d.current = newVal
  d.animKey++

  // After the back flap lands (at 500ms), update the static bottom to new value
  flipTimers.set(
    key,
    setTimeout(() => {
      d.bottomShown = newVal
      flipTimers.delete(key)
    }, 500),
  )
}

function sync() {
  const [h0, h1] = splitDigits(props.hours)
  const [m0, m1] = splitDigits(props.minutes)
  const [s0, s1] = splitDigits(props.seconds)
  updateDigit('h0', h0)
  updateDigit('h1', h1)
  updateDigit('m0', m0)
  updateDigit('m1', m1)
  updateDigit('s0', s0)
  updateDigit('s1', s1)
}

onMounted(() => {
  const [h0, h1] = splitDigits(props.hours)
  const [m0, m1] = splitDigits(props.minutes)
  const [s0, s1] = splitDigits(props.seconds)
  Object.assign(digits.value.h0, { current: h0, previous: h0, bottomShown: h0 })
  Object.assign(digits.value.h1, { current: h1, previous: h1, bottomShown: h1 })
  Object.assign(digits.value.m0, { current: m0, previous: m0, bottomShown: m0 })
  Object.assign(digits.value.m1, { current: m1, previous: m1, bottomShown: m1 })
  Object.assign(digits.value.s0, { current: s0, previous: s0, bottomShown: s0 })
  Object.assign(digits.value.s1, { current: s1, previous: s1, bottomShown: s1 })
})

watch(() => props.seconds, sync)
watch(() => props.minutes, sync)
watch(() => props.hours, sync)

const layout: { key: DigitKey; separator?: boolean }[] = [
  { key: 'h0' },
  { key: 'h1' },
  { key: 'm0', separator: true },
  { key: 'm1' },
  { key: 's0', separator: true },
  { key: 's1' },
]
</script>

<template>
  <div class="text-center">
    <div class="flex items-center justify-center gap-1.5 sm:gap-2 md:gap-3">
      <template v-for="item in layout" :key="item.key">
        <span
          v-if="item.separator"
          class="text-accent-coral font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mx-0.5 sm:mx-1"
          >:</span
        >

        <div class="flip-unit">
          <!--
            How a real flip clock works:
            1. Static top = NEW value (visible once front flap flips away)
            2. Static bottom = OLD value (stays until back flap covers it)
            3. Front flap (top) = OLD value, flips downward to hide
            4. Back flap (bottom) = NEW value, unfolds to reveal
          -->

          <!-- Static top: new value (revealed as front flap moves away) -->
          <div class="half half-top">
            <div class="digit-wrapper">
              <span class="digit">{{ digits[item.key].current }}</span>
            </div>
          </div>

          <!-- Static bottom: old value, switches to new after animation ends -->
          <div class="half half-bottom">
            <div class="digit-wrapper">
              <span class="digit">{{ digits[item.key].bottomShown }}</span>
            </div>
          </div>

          <!-- Front flap: old value, flips down -->
          <div :key="digits[item.key].animKey" class="flap flap-front">
            <div class="digit-wrapper">
              <span class="digit">{{ digits[item.key].previous }}</span>
            </div>
          </div>

          <!-- Back flap: new value, unfolds from behind front flap -->
          <div :key="'b' + digits[item.key].animKey" class="flap flap-back">
            <div class="digit-wrapper">
              <span class="digit">{{ digits[item.key].current }}</span>
            </div>
          </div>

          <!-- Center divider -->
          <div class="divider" />
        </div>
      </template>
    </div>

    <p
      class="mt-6 sm:mt-8 text-text-secondary text-sm sm:text-base font-display tracking-widest uppercase"
    >
      {{ date }}
    </p>
  </div>
</template>

<style scoped>
.flip-unit {
  position: relative;
  width: clamp(3rem, 10vw, 6.5rem);
  height: clamp(4.2rem, 14vw, 9rem);
  perspective: 400px;
}

/* ── Shared half styling ── */
.half,
.flap {
  position: absolute;
  left: 0;
  width: 100%;
  height: 50%;
  overflow: hidden;
}

.digit-wrapper {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  /* Full height of the unit — the half clips it */
  height: 200%;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.digit {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: clamp(2.5rem, 9vw, 6rem);
  color: #f0ede6;
  line-height: 1;
  user-select: none;
  padding-top: 0.12em;
}

/* ── Static halves ── */
.half-top {
  top: 0;
  background: #1e2f42;
  border: 1px solid #253549;
  border-bottom: none;
}
.half-top .digit-wrapper {
  top: 0;
}

.half-bottom {
  bottom: 0;
  background: #162232;
  border: 1px solid #253549;
  border-top: none;
}
.half-bottom .digit-wrapper {
  bottom: 0;
}

/* ── Animated flaps ── */
.flap {
  backface-visibility: hidden;
}

.flap-front {
  top: 0;
  background: #1e2f42;
  border: 1px solid #253549;
  border-bottom: none;
  transform-origin: bottom center;
  z-index: 3;
  animation: flip-front 0.5s ease-in forwards;
}
.flap-front .digit-wrapper {
  top: 0;
}

.flap-back {
  bottom: 0;
  background: #162232;
  border: 1px solid #253549;
  border-top: none;
  transform-origin: top center;
  transform: rotateX(180deg);
  z-index: 2;
  animation: flip-back 0.5s 0.25s ease-out forwards;
}
.flap-back .digit-wrapper {
  bottom: 0;
}

/* ── Divider ── */
.divider {
  position: absolute;
  top: 50%;
  left: 0;
  width: 100%;
  height: 2px;
  background: #0f1923;
  z-index: 5;
  transform: translateY(-50%);
}

/* ── Keyframes ── */
@keyframes flip-front {
  0% {
    transform: rotateX(0deg);
  }
  100% {
    transform: rotateX(-180deg);
  }
}

@keyframes flip-back {
  0% {
    transform: rotateX(180deg);
  }
  100% {
    transform: rotateX(0deg);
  }
}
</style>
