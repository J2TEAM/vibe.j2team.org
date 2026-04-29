<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'

type LevelKey = 'easy' | 'medium' | 'hard'
type Side = 'left' | 'right'
type CharType = 'human' | 'demon'

interface LevelConfig {
  label: string
  missionaries: number
  cannibals: number
  capacity: number
}
interface Character {
  id: string
  type: CharType
  side: Side
  onBoat: boolean
  animBoarding: boolean
  animAlighting: boolean
  animArriving: boolean
}
interface RipplePt {
  id: number
  x: number
  y: number
}

const levelConfigs: Record<LevelKey, LevelConfig> = {
  easy: {
    label: 'Dễ',
    missionaries: 3,
    cannibals: 3,
    capacity: 2,
  },
  medium: {
    label: 'Trung bình',
    missionaries: 4,
    cannibals: 4,
    capacity: 3,
  },
  hard: {
    label: 'Khó',
    missionaries: 5,
    cannibals: 5,
    capacity: 3,
  },
}

const currentLevel = ref<LevelKey>('easy')
const boatSide = ref<Side>('left')
const steps = ref(0)
const hasFailed = ref(false)
const showWin = ref(false)
const isCrossing = ref(false)
const showRules = ref(false)
const mounted = ref(false)
const characters = ref<Character[]>([])
const ripples = ref<RipplePt[]>([])
let rippleId = 0
let charId = 0

const level = computed(() => levelConfigs[currentLevel.value])

const leftHumans = computed(() =>
  characters.value.filter((c) => c.type === 'human' && c.side === 'left' && !c.onBoat),
)
const leftDemons = computed(() =>
  characters.value.filter((c) => c.type === 'demon' && c.side === 'left' && !c.onBoat),
)
const rightHumans = computed(() =>
  characters.value.filter((c) => c.type === 'human' && c.side === 'right' && !c.onBoat),
)
const rightDemons = computed(() =>
  characters.value.filter((c) => c.type === 'demon' && c.side === 'right' && !c.onBoat),
)
const boatHumans = computed(() => characters.value.filter((c) => c.type === 'human' && c.onBoat))
const boatDemons = computed(() => characters.value.filter((c) => c.type === 'demon' && c.onBoat))
const boatCount = computed(() => boatHumans.value.length + boatDemons.value.length)

const hasWon = computed(
  () =>
    rightHumans.value.length === level.value.missionaries &&
    rightDemons.value.length === level.value.cannibals,
)

function canBoard(type: CharType) {
  if (isCrossing.value || hasFailed.value || showWin.value) return false
  if (boatCount.value >= level.value.capacity) return false
  const pool =
    boatSide.value === 'left'
      ? type === 'human'
        ? leftHumans.value
        : leftDemons.value
      : type === 'human'
        ? rightHumans.value
        : rightDemons.value
  return pool.length > 0
}

function canDeboard(type: CharType) {
  if (isCrossing.value) return false
  return (type === 'human' ? boatHumans.value : boatDemons.value).length > 0
}
const canCross = computed(
  () => !isCrossing.value && !hasFailed.value && !showWin.value && boatCount.value >= 1,
)
const progressPct = computed(() => {
  const total = level.value.missionaries + level.value.cannibals
  return Math.round(((rightHumans.value.length + rightDemons.value.length) / total) * 100)
})

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

function initLevel(key: LevelKey) {
  currentLevel.value = key
  boatSide.value = 'left'
  steps.value = 0
  hasFailed.value = false
  showWin.value = false
  isCrossing.value = false
  const cfg = levelConfigs[key]
  const list: Character[] = []
  for (let i = 0; i < cfg.missionaries; i++)
    list.push({
      id: `c${++charId}`,
      type: 'human',
      side: 'left',
      onBoat: false,
      animBoarding: false,
      animAlighting: false,
      animArriving: false,
    })
  for (let i = 0; i < cfg.cannibals; i++)
    list.push({
      id: `c${++charId}`,
      type: 'demon',
      side: 'left',
      onBoat: false,
      animBoarding: false,
      animAlighting: false,
      animArriving: false,
    })
  characters.value = list
}

function isSafe(h: number, d: number) {
  return h === 0 || h >= d
}

function checkDanger() {
  if (
    !isSafe(leftHumans.value.length, leftDemons.value.length) ||
    !isSafe(rightHumans.value.length, rightDemons.value.length)
  ) {
    hasFailed.value = true
  }
}

async function boardChar(type: CharType) {
  if (!canBoard(type)) return
  const pool =
    boatSide.value === 'left'
      ? type === 'human'
        ? leftHumans.value
        : leftDemons.value
      : type === 'human'
        ? rightHumans.value
        : rightDemons.value
  const ch = pool[pool.length - 1]
  if (!ch) return
  ch.animBoarding = true
  await sleep(380)
  ch.onBoat = true
  ch.animBoarding = false
}

async function deboardChar(type: CharType) {
  if (!canDeboard(type)) return
  const pool = type === 'human' ? boatHumans.value : boatDemons.value
  const ch = pool[pool.length - 1]
  if (!ch) return
  ch.animAlighting = true
  await sleep(320)
  ch.onBoat = false
  ch.animAlighting = false
}

async function crossRiver() {
  if (!canCross.value) return
  isCrossing.value = true
  await sleep(950)
  const dest = boatSide.value === 'left' ? 'right' : 'left'
  boatSide.value = dest
  const onBoat = characters.value.filter((c) => c.onBoat)
  for (const c of onBoat) {
    c.side = dest
    c.onBoat = false
    c.animArriving = true
  }
  await sleep(100)
  for (const c of onBoat) c.animArriving = false
  steps.value++
  isCrossing.value = false
  checkDanger()
  if (hasWon.value)
    setTimeout(() => {
      showWin.value = true
    }, 500)
}

function addRipple(e: MouseEvent) {
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  const id = ++rippleId
  ripples.value.push({
    id,
    x: e.clientX - rect.left,
    y: e.clientY - rect.top,
  })
  setTimeout(() => {
    ripples.value = ripples.value.filter((r) => r.id !== id)
  }, 750)
}

onMounted(() => {
  initLevel('easy')
  setTimeout(() => {
    mounted.value = true
  }, 80)
})
</script>

<template>
  <div class="root" :class="{ mounted }">
    <!-- ══ ANIMATED BACKGROUND ══ -->
    <div class="bg-sky">
      <div class="sun"></div>
      <div class="cloud c1"></div>
      <div class="cloud c2"></div>
      <div class="cloud c3"></div>
      <div class="cloud c4"></div>
    </div>
    <div class="bg-hills">
      <svg viewBox="0 0 1440 180" preserveAspectRatio="none" class="hill-svg">
        <path
          d="M0,180 Q120,60 280,100 Q440,140 600,70 Q760,0 920,80 Q1080,160 1200,90 Q1320,20 1440,100 L1440,180Z"
          fill="#4caf50"
        />
        <path
          d="M0,180 Q100,90 240,120 Q380,150 520,90 Q660,30 820,100 Q980,170 1100,110 Q1220,50 1440,130 L1440,180Z"
          fill="#66bb6a"
          opacity="0.7"
        />
      </svg>
    </div>

    <!-- ══ PAGE CONTENT ══ -->
    <div class="page">
      <!-- HEADER -->
      <header class="card reveal" style="--d: 0">
        <div class="header-row">
          <div>
            <span class="badge">🎮 PUZZLE GAME</span>
            <h1 class="title">Người &amp; Quỷ <em>Qua Sông</em></h1>
            <p class="sub">
              Đưa tất cả sang bờ phải — không để quỷ nhiều hơn người ở bất kỳ bờ nào!
            </p>
          </div>
          <div class="hbtns">
            <RouterLink to="/" class="btn btn-sky home-btn" style="color: black">
              ← Trang chủ
            </RouterLink>
            <button class="btn btn-amber" style="color: black" @click="initLevel(currentLevel)">
              ↺ Chơi lại
            </button>
            <button class="btn btn-sky" style="color: black" @click="showRules = !showRules">
              📖 Luật chơi
            </button>
          </div>
        </div>
      </header>

      <!-- RULES PANEL -->
      <Transition name="slide">
        <section v-if="showRules" class="card rules-panel">
          <div class="rules-grid">
            <div class="rc rc-red">
              <span class="rc-ico">⚠️</span>
              <div>
                <h4>Điều kiện thua</h4>
                <p>Quỷ 👹 nhiều hơn Người 🧑 ở bất kỳ bờ nào → thua ngay.</p>
              </div>
            </div>
            <div class="rc rc-green">
              <span class="rc-ico">🏆</span>
              <div>
                <h4>Điều kiện thắng</h4>
                <p>Toàn bộ người và quỷ đều ở <b>bờ phải</b>.</p>
              </div>
            </div>
            <div class="rc rc-blue">
              <span class="rc-ico">🚣</span>
              <div>
                <h4>Quy tắc thuyền</h4>
                <ul>
                  <li>Cần ≥ 1 người để chèo thuyền.</li>
                  <li>Không vượt sức chứa tối đa.</li>
                </ul>
              </div>
            </div>
            <div class="rc rc-gold">
              <span class="rc-ico">📊</span>
              <div>
                <h4>Các cấp độ</h4>
                <ul>
                  <li><b>Dễ:</b> 3🧑 3👹, thuyền 2 chỗ — 11 bước tối thiểu</li>
                  <li><b>Trung bình:</b> 4🧑 4👹, thuyền 3 chỗ — 9 bước</li>
                  <li><b>Khó:</b> 5🧑 5👹, thuyền 3 chỗ — 11 bước</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </Transition>

      <!-- LEVEL SELECT -->
      <div class="levels reveal" style="--d: 1">
        <button
          v-for="(cfg, key) in levelConfigs"
          :key="key"
          class="lvl"
          :class="[`lvl-${key}`, { active: currentLevel === key }]"
          @click="initLevel(key as LevelKey)"
        >
          <span class="lvl-name">{{ cfg.label }}</span>
          <span class="lvl-info"
            >{{ cfg.missionaries }}🧑 {{ cfg.cannibals }}👹 · ⛵×{{ cfg.capacity }}</span
          >
        </button>
      </div>

      <!-- ══ RIVER SCENE ══ -->
      <div class="river-scene reveal" style="--d: 2">
        <!-- RIVER ILLUSTRATION -->
        <div class="river-illus">
          <!-- Trees left -->
          <div class="illus-bank illus-left">
            <span class="itree" style="left: 6px; bottom: 20px; font-size: 2rem">🌲</span>
            <span class="itree" style="left: 38px; bottom: 24px; font-size: 1.6rem">🌳</span>
            <span class="itree" style="left: 68px; bottom: 18px; font-size: 1.4rem">🌲</span>
          </div>
          <!-- Trees right -->
          <div class="illus-bank illus-right">
            <span class="itree" style="right: 6px; bottom: 20px; font-size: 2rem">🌲</span>
            <span class="itree" style="right: 38px; bottom: 24px; font-size: 1.6rem">🌳</span>
            <span class="itree" style="right: 68px; bottom: 18px; font-size: 1.4rem">🌲</span>
          </div>

          <!-- WATER -->
          <div class="water">
            <div class="wv wv1"></div>
            <div class="wv wv2"></div>
            <div class="wv wv3"></div>
            <div class="fish f1">🐟</div>
            <div class="fish f2">🐠</div>
          </div>

          <!-- BOAT -->
          <div
            class="boat-container"
            :class="boatSide === 'right' ? 'to-right' : 'to-left'"
            :style="isCrossing ? 'transition:left .95s cubic-bezier(.4,0,.2,1)' : 'transition:none'"
          >
            <div class="boat" :class="{ rocking: isCrossing }">
              <!-- Hull SVG -->
              <svg class="hull" viewBox="0 0 130 58">
                <defs>
                  <linearGradient id="hg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#e8a83a" />
                    <stop offset="100%" stop-color="#8b5a1a" />
                  </linearGradient>
                </defs>
                <path
                  d="M8,12 Q65,4 122,12 L110,50 Q65,57 20,50 Z"
                  fill="url(#hg)"
                  stroke="#6b3a0f"
                  stroke-width="1.5"
                />
                <path
                  d="M14,14 Q65,8 116,14"
                  fill="none"
                  stroke="#f5c842"
                  stroke-width="2"
                  opacity=".6"
                />
                <line
                  x1="40"
                  y1="14"
                  x2="35"
                  y2="49"
                  stroke="#6b3a0f"
                  stroke-width="0.7"
                  opacity=".4"
                />
                <line
                  x1="65"
                  y1="10"
                  x2="65"
                  y2="55"
                  stroke="#6b3a0f"
                  stroke-width="0.7"
                  opacity=".4"
                />
                <line
                  x1="90"
                  y1="14"
                  x2="95"
                  y2="49"
                  stroke="#6b3a0f"
                  stroke-width="0.7"
                  opacity=".4"
                />
                <path
                  d="M20,50 Q65,57 110,50"
                  fill="none"
                  stroke="#5b3310"
                  stroke-width="1.2"
                  opacity=".5"
                />
              </svg>

              <!-- Oar -->
              <div class="oar" :class="{ rowing: isCrossing }">🚣</div>

              <!-- Passengers on boat -->
              <div class="boat-pax">
                <TransitionGroup name="pax" tag="div" class="pax-row pax-humans">
                  <span
                    v-for="ch in boatHumans"
                    :key="ch.id"
                    class="pax-char"
                    :class="{ 'pax-boarding': ch.animBoarding, 'pax-alighting': ch.animAlighting }"
                    @click="deboardChar('human')"
                    title="↑ Xuống thuyền"
                    >🧑<span class="pax-hint">↑</span></span
                  >
                </TransitionGroup>
                <TransitionGroup name="pax" tag="div" class="pax-row pax-demons">
                  <span
                    v-for="ch in boatDemons"
                    :key="ch.id"
                    class="pax-char"
                    :class="{ 'pax-boarding': ch.animBoarding, 'pax-alighting': ch.animAlighting }"
                    @click="deboardChar('demon')"
                    title="↑ Xuống thuyền"
                    >👹<span class="pax-hint">↑</span></span
                  >
                </TransitionGroup>
                <span v-if="boatCount === 0" class="pax-empty">⛵</span>
              </div>

              <!-- Capacity dots -->
              <div class="cap-row">
                <span
                  v-for="i in level.capacity"
                  :key="i"
                  class="cap-dot"
                  :class="{ on: i <= boatCount }"
                ></span>
              </div>
            </div>

            <!-- Wake effect -->
            <div class="wake" :class="{ active: isCrossing }"></div>
          </div>

          <!-- Direction arrow -->
          <div class="dir-arrow" :class="boatSide === 'right' ? 'arr-left' : 'arr-right'">
            {{ boatSide === 'left' ? '⛵ →' : '← ⛵' }}
          </div>
        </div>

        <!-- BANKS -->
        <div class="banks">
          <!-- LEFT BANK -->
          <div class="bank" :class="{ 'bank-fail': hasFailed }">
            <div class="bank-hd">
              <span class="bank-name">🌲 Bờ Trái</span>
              <div class="bank-cnt">
                <span class="cnt-h">🧑×{{ leftHumans.length }}</span>
                <span class="cnt-d">👹×{{ leftDemons.length }}</span>
              </div>
            </div>

            <div class="chars-block">
              <!-- Humans left -->
              <div class="chars-row">
                <TransitionGroup name="char" tag="div" class="chars-inner">
                  <div
                    v-for="ch in leftHumans"
                    :key="ch.id"
                    class="char ch-human"
                    :class="{ 'ch-boarding': ch.animBoarding }"
                    @click="boardChar('human')"
                    title="↓ Lên thuyền"
                  >
                    <span class="ch-em">🧑</span>
                    <span class="ch-lbl">Người</span>
                    <span class="ch-hint">↓ Lên thuyền</span>
                  </div>
                </TransitionGroup>
              </div>
              <!-- Demons left -->
              <div class="chars-row">
                <TransitionGroup name="char" tag="div" class="chars-inner">
                  <div
                    v-for="ch in leftDemons"
                    :key="ch.id"
                    class="char ch-demon"
                    :class="{ 'ch-boarding': ch.animBoarding }"
                    @click="boardChar('demon')"
                    title="↓ Lên thuyền"
                  >
                    <span class="ch-em">👹</span>
                    <span class="ch-lbl">Quỷ</span>
                    <span class="ch-hint">↓ Lên thuyền</span>
                  </div>
                </TransitionGroup>
              </div>
            </div>
          </div>

          <!-- SPACER -->
          <div class="bank-gap"></div>

          <!-- RIGHT BANK -->
          <div class="bank bank-right" :class="{ 'bank-win': hasWon }">
            <div class="bank-hd">
              <span class="bank-name">🏰 Bờ Phải</span>
              <div class="bank-cnt">
                <span class="cnt-h">🧑×{{ rightHumans.length }}</span>
                <span class="cnt-d">👹×{{ rightDemons.length }}</span>
              </div>
            </div>

            <div class="chars-block">
              <div class="chars-row">
                <TransitionGroup name="char" tag="div" class="chars-inner">
                  <div
                    v-for="ch in rightHumans"
                    :key="ch.id"
                    class="char ch-human"
                    :class="{ 'ch-arriving': ch.animArriving, 'ch-boarding': ch.animBoarding }"
                    @click="boatSide === 'right' && boardChar('human')"
                    :title="boatSide === 'right' ? '↓ Lên thuyền' : ''"
                  >
                    <span class="ch-em">🧑</span>
                    <span class="ch-lbl">Người</span>
                    <span v-if="boatSide === 'right'" class="ch-hint">↓ Lên thuyền</span>
                  </div>
                </TransitionGroup>
              </div>
              <div class="chars-row">
                <TransitionGroup name="char" tag="div" class="chars-inner">
                  <div
                    v-for="ch in rightDemons"
                    :key="ch.id"
                    class="char ch-demon"
                    :class="{ 'ch-arriving': ch.animArriving, 'ch-boarding': ch.animBoarding }"
                    @click="boatSide === 'right' && boardChar('demon')"
                    :title="boatSide === 'right' ? '↓ Lên thuyền' : ''"
                  >
                    <span class="ch-em">👹</span>
                    <span class="ch-lbl">Quỷ</span>
                    <span v-if="boatSide === 'right'" class="ch-hint">↓ Lên thuyền</span>
                  </div>
                </TransitionGroup>
              </div>
            </div>
          </div>
        </div>

        <!-- PROGRESS -->
        <div class="prog-bar">
          <div class="prog-track">
            <div class="prog-fill" :style="{ width: progressPct + '%' }"></div>
          </div>
          <span class="prog-lbl">{{ progressPct }}% đã qua sông</span>
        </div>
      </div>

      <!-- CONTROLS -->
      <div class="card controls reveal" style="--d: 3">
        <div class="ctrl-stats">
          <div class="stat">
            <span class="stat-l">Vị trí thuyền</span
            ><span class="stat-v">{{ boatSide === 'left' ? '◀ Bờ Trái' : 'Bờ Phải ▶' }}</span>
          </div>
          <div class="stat">
            <span class="stat-l">Trên thuyền</span
            ><span class="stat-v">{{ boatCount }}/{{ level.capacity }}</span>
          </div>
          <div class="stat">
            <span class="stat-l">Số lượt</span><span class="stat-v steps-v">{{ steps }}</span>
          </div>
        </div>

        <button
          class="cross-btn ripple-cont"
          :disabled="!canCross"
          @click="
            (e) => {
              addRipple(e as MouseEvent)
              crossRiver()
            }
          "
        >
          <span v-if="!isCrossing">🚣 Qua Sông</span>
          <span v-else class="row-anim"
            >⛵ Đang chèo<span class="dots"><b>.</b><b>.</b><b>.</b></span></span
          >
          <span
            v-for="r in ripples"
            :key="r.id"
            class="ripple"
            :style="{ left: r.x + 'px', top: r.y + 'px' }"
          ></span>
        </button>

        <Transition name="fade">
          <div v-if="hasFailed" style="color: black" class="fail-msg">
            💀 Quỷ áp đảo người! Bấm <b>↺ Chơi lại</b> để thử lại.
          </div>
        </Transition>
      </div>
    </div>
    <!-- /page -->

    <!-- WIN OVERLAY -->
    <Transition name="overlay">
      <div v-if="showWin" class="win-overlay">
        <div class="win-box">
          <div class="win-fire">🎉🎆✨</div>
          <h2 class="win-title">Chiến Thắng!</h2>
          <p class="win-sub">
            Level <strong>{{ level.label }}</strong> — <strong>{{ steps }} lượt</strong>
          </p>
          <div class="win-parade">
            <span v-for="i in level.missionaries" :key="'h' + i">🧑</span>
            <span v-for="i in level.cannibals" :key="'d' + i">👹</span>
          </div>
          <div class="win-acts">
            <button class="btn btn-green" style="color: black" @click="initLevel(currentLevel)">
              ↺ Chơi lại
            </button>
            <button
              v-if="currentLevel !== 'hard'"
              class="btn btn-sky"
              style="color: black"
              @click="initLevel(currentLevel === 'easy' ? 'medium' : 'hard')"
            >
              Level tiếp →
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;900&family=Baloo+2:wght@500;700;800&display=swap');

:root {
  --c-human: #1d4ed8;
  --c-human-bg: #dbeafe;
  --c-human-br: #93c5fd;
  --c-demon: #b91c1c;
  --c-demon-bg: #fee2e2;
  --c-demon-br: #fca5a5;
  --c-gold: #b45309;
  --c-gold-bg: #fef3c7;
  --c-gold-br: #fcd34d;
  --c-green: #15803d;
  --c-green-bg: #dcfce7;
  --c-green-br: #86efac;
  --c-sky: #0369a1;
  --c-sky-bg: #e0f2fe;
  --c-sky-br: #7dd3fc;
  --text: #0f172a;
  --text2: #1e293b;
  --text3: #475569;
  --white: #fff;
  --r: 14px;
  --sh: 0 4px 24px rgba(0, 0, 0, 0.1);
}

*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.root {
  min-height: 100vh;
  background: linear-gradient(180deg, #e0f2fe 0%, #bae6fd 30%, #7dd3fc 60%, #38bdf8 100%);
  font-family: 'Nunito', sans-serif;
  color: var(--text);
  overflow-x: hidden;
  position: relative;
}

/* ── BACKGROUND ── */
.bg-sky {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 55%;
  background: linear-gradient(180deg, #0ea5e9 0%, #38bdf8 50%, #7dd3fc 100%);
  z-index: 0;
  pointer-events: none;
}

.sun {
  position: absolute;
  top: 24px;
  right: 10%;
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: radial-gradient(circle, #fff9c4, #fde047 40%, #facc15 100%);
  box-shadow:
    0 0 40px rgba(253, 224, 71, 0.7),
    0 0 80px rgba(253, 224, 71, 0.3);
  animation: glow 3s ease-in-out infinite alternate;
}

@keyframes glow {
  to {
    box-shadow:
      0 0 60px rgba(253, 224, 71, 0.9),
      0 0 110px rgba(253, 224, 71, 0.4);
  }
}

.cloud {
  position: absolute;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50px;
  animation: drift linear infinite;
}

.cloud::before,
.cloud::after {
  content: '';
  position: absolute;
  background: inherit;
  border-radius: 50%;
}

.c1 {
  width: 100px;
  height: 32px;
  top: 16px;
  left: 5%;
  animation-duration: 38s;
}

.c1::before {
  width: 54px;
  height: 44px;
  top: -20px;
  left: 14px;
}

.c1::after {
  width: 40px;
  height: 32px;
  top: -12px;
  left: 50px;
}

.c2 {
  width: 70px;
  height: 24px;
  top: 50px;
  left: 25%;
  animation-duration: 52s;
  animation-delay: -10s;
  opacity: 0.8;
}

.c2::before {
  width: 38px;
  height: 34px;
  top: -16px;
  left: 10px;
}

.c3 {
  width: 120px;
  height: 36px;
  top: 14px;
  left: 50%;
  animation-duration: 44s;
  animation-delay: -18s;
}

.c3::before {
  width: 64px;
  height: 52px;
  top: -24px;
  left: 20px;
}

.c3::after {
  width: 46px;
  height: 36px;
  top: -14px;
  left: 62px;
}

.c4 {
  width: 85px;
  height: 28px;
  top: 38px;
  left: 72%;
  animation-duration: 60s;
  animation-delay: -30s;
  opacity: 0.75;
}

.c4::before {
  width: 46px;
  height: 40px;
  top: -18px;
  left: 12px;
}

@keyframes drift {
  from {
    transform: translateX(-220px);
  }

  to {
    transform: translateX(calc(100vw + 220px));
  }
}

.bg-hills {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 220px;
  z-index: 0;
  pointer-events: none;
}

.hill-svg {
  width: 100%;
  height: 100%;
  display: block;
}

/* ── PAGE ── */
.page {
  position: relative;
  z-index: 1;
  max-width: 870px;
  margin: 0 auto;
  padding: 1.5rem 1rem 3rem;
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}

/* ── REVEAL ── */
.reveal {
  opacity: 0;
  transform: translateY(22px);
  transition:
    opacity 0.5s ease,
    transform 0.5s ease;
  transition-delay: calc(var(--d, 0) * 0.1s);
}

.mounted .reveal {
  opacity: 1;
  transform: translateY(0);
}

/* ── CARD ── */
.card {
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(14px);
  border: 1.5px solid rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  padding: 1.4rem 1.6rem;
  box-shadow: var(--sh);
}

/* ── HEADER ── */
.header-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  flex-wrap: wrap;
}

.badge {
  display: inline-block;
  background: var(--c-sky-bg);
  color: #075985;
  border: 1.5px solid var(--c-sky-br);
  border-radius: 20px;
  padding: 0.2em 0.9em;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  margin-bottom: 0.5rem;
}

.title {
  font-family: 'Baloo 2', cursive;
  font-size: clamp(1.7rem, 5vw, 2.7rem);
  font-weight: 800;
  line-height: 1.15;
  color: #0f172a;
}

.title em {
  color: #1d4ed8;
  font-style: normal;
}

.sub {
  color: #334155;
  font-size: 0.95rem;
  margin-top: 0.3rem;
  max-width: 400px;
  line-height: 1.65;
  font-weight: 600;
}

.hbtns {
  display: flex;
  gap: 0.55rem;
  flex-wrap: wrap;
  padding-top: 0.25rem;
}

/* ── BUTTONS ── */
.btn {
  padding: 0.55em 1.3em;
  border-radius: 10px;
  font-family: 'Baloo 2', cursive;
  font-size: 0.85rem;
  font-weight: 700;
  border: 2px solid;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 0.3em;
}

.btn-amber {
  background: var(--c-gold-bg);
  color: #92400e;
  border-color: var(--c-gold-br);
}

.btn-amber:hover {
  background: #fde68a;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(217, 119, 6, 0.25);
}

.btn-sky {
  background: var(--c-sky-bg);
  color: var(--c-sky);
  border-color: var(--c-sky-br);
}

.btn-sky:hover {
  background: #bae6fd;
  transform: translateY(-2px);
}

.btn-green {
  background: var(--c-green-bg);
  color: var(--c-green);
  border-color: var(--c-green-br);
}

.btn-green:hover {
  background: #bbf7d0;
  transform: translateY(-2px);
}

/* ── RULES ── */
.rules-panel {
  padding: 1.1rem;
}

.rules-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.65rem;
}

@media (max-width: 540px) {
  .rules-grid {
    grid-template-columns: 1fr;
  }
}

.rc {
  display: flex;
  gap: 0.65rem;
  align-items: flex-start;
  padding: 0.85rem;
  border-radius: 12px;
  border-left: 4px solid;
  font-size: 0.88rem;
  line-height: 1.65;
  color: #1e293b;
}

.rc h4 {
  font-family: 'Baloo 2', cursive;
  font-size: 0.9rem;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 0.2rem;
}

.rc ul,
.rc ol {
  padding-left: 1.1em;
  margin-top: 0.25em;
}

.rc li {
  margin-top: 0.2em;
}

.rc-ico {
  font-size: 1.45rem;
  flex-shrink: 0;
}

.rc-red {
  background: #fff1f2;
  border-color: #f87171;
}

.rc-green {
  background: #f0fdf4;
  border-color: #4ade80;
}

.rc-blue {
  background: #eff6ff;
  border-color: #60a5fa;
}

.rc-gold {
  background: #fffbeb;
  border-color: #fbbf24;
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.35s ease;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateY(-12px);
}

/* ── LEVELS ── */
.levels {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.55rem;
}

@media (max-width: 440px) {
  .levels {
    grid-template-columns: 1fr;
  }
}

.lvl {
  padding: 0.7rem 0.5rem;
  border-radius: 12px;
  border: 2.5px solid rgba(255, 255, 255, 0.6);
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(8px);
  cursor: pointer;
  text-align: center;
  transition: all 0.22s;
}

.lvl:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
}

.lvl-easy.active {
  background: var(--c-human-bg);
  border-color: var(--c-human);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.18);
}

.lvl-medium.active {
  background: var(--c-gold-bg);
  border-color: var(--c-gold);
  box-shadow: 0 0 0 3px rgba(217, 119, 6, 0.18);
}

.lvl-hard.active {
  background: var(--c-demon-bg);
  border-color: var(--c-demon);
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.18);
}

.lvl-name {
  display: block;
  font-family: 'Baloo 2', cursive;
  font-weight: 800;
  font-size: 0.95rem;
  color: #0f172a;
}

.lvl-info {
  display: block;
  font-size: 0.79rem;
  color: #334155;
  margin-top: 0.12rem;
  font-weight: 600;
}

/* ── RIVER SCENE ── */
.river-scene {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(12px);
  border: 1.5px solid rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  overflow: hidden;
  box-shadow: var(--sh);
}

/* RIVER ILLUS */
.river-illus {
  position: relative;
  height: 148px;
  overflow: hidden;
}

.illus-bank {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 26%;
  z-index: 3;
}

.illus-left {
  left: 0;
  background: linear-gradient(90deg, #4caf50, #66bb6a 80%, #81c784);
  border-right: 3px solid #2e7d32;
}

.illus-right {
  right: 0;
  background: linear-gradient(270deg, #4caf50, #66bb6a 80%, #81c784);
  border-left: 3px solid #2e7d32;
}

.itree {
  position: absolute;
  pointer-events: none;
}

.water {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, #0284c7 0%, #0ea5e9 40%, #38bdf8 100%);
}

.wv {
  position: absolute;
  width: 200%;
  height: 55px;
  border-radius: 40%;
  animation: wroll linear infinite;
}

.wv1 {
  background: rgba(255, 255, 255, 0.13);
  top: 15%;
  animation-duration: 7s;
}

.wv2 {
  background: rgba(255, 255, 255, 0.09);
  top: 44%;
  animation-duration: 10s;
  animation-direction: reverse;
}

.wv3 {
  background: rgba(255, 255, 255, 0.06);
  top: 70%;
  animation-duration: 8.5s;
}

@keyframes wroll {
  from {
    transform: translateX(-50%);
  }

  to {
    transform: translateX(0);
  }
}

.fish {
  position: absolute;
  font-size: 1rem;
  animation: swim linear infinite;
}

.f1 {
  bottom: 22%;
  animation-duration: 14s;
  animation-delay: -3s;
}

.f2 {
  bottom: 55%;
  animation-duration: 18s;
  animation-delay: -9s;
  transform: scaleX(-1);
}

@keyframes swim {
  from {
    left: -40px;
  }

  to {
    left: calc(100% + 40px);
  }
}

/* BOAT */
.boat-container {
  position: absolute;
  bottom: 10px;
  z-index: 10;
  width: 130px;
}

.to-left {
  left: calc(26% - 6px);
}

.to-right {
  left: calc(74% - 124px);
}

.boat {
  position: relative;
  filter: drop-shadow(0 5px 14px rgba(0, 0, 0, 0.28));
}

.hull {
  width: 130px;
  height: 58px;
  display: block;
}

.oar {
  position: absolute;
  bottom: 3px;
  right: -20px;
  font-size: 1.45rem;
  transform-origin: top center;
  transform: rotate(28deg);
}

.oar.rowing {
  animation: rowOar 0.5s ease-in-out infinite alternate;
}

@keyframes rowOar {
  from {
    transform: rotate(14deg);
  }

  to {
    transform: rotate(42deg);
  }
}

.rocking {
  animation: rock 0.95s ease-in-out;
}

@keyframes rock {
  0%,
  100% {
    transform: rotate(0);
  }

  25% {
    transform: rotate(-4deg) translateY(-4px);
  }

  70% {
    transform: rotate(3deg) translateY(-3px);
  }
}

.boat-pax {
  position: absolute;
  top: 5px;
  left: 8px;
  right: 26px;
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
  align-items: center;
  justify-content: center;
  min-height: 32px;
}

.pax-row {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
}

.pax-char {
  font-size: 1.3rem;
  cursor: pointer;
  user-select: none;
  position: relative;
  transition: transform 0.18s;
}

.pax-char:hover {
  transform: scale(1.3) translateY(-4px);
}

.pax-hint {
  position: absolute;
  top: -14px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.6rem;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  border-radius: 4px;
  padding: 1px 3px;
  opacity: 0;
  transition: opacity 0.2s;
  white-space: nowrap;
  pointer-events: none;
}

.pax-char:hover .pax-hint {
  opacity: 1;
}

.pax-empty {
  font-size: 1.05rem;
  opacity: 0.5;
}

.pax-boarding {
  animation: paxBoard 0.38s ease-in;
}

.pax-alighting {
  animation: paxAlight 0.35s ease-out;
}

@keyframes paxBoard {
  from {
    opacity: 0;
    transform: translateY(-12px) scale(0.7);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes paxAlight {
  from {
    opacity: 1;
    transform: scale(1);
  }

  to {
    opacity: 0;
    transform: translateY(14px) scale(0.5);
  }
}

/* TransitionGroup for pax */
.pax-enter-active {
  animation: paxIn 0.38s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.pax-leave-active {
  animation: paxOut 0.3s ease;
  position: absolute;
}

@keyframes paxIn {
  from {
    opacity: 0;
    transform: translateY(-14px) scale(0.6);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes paxOut {
  from {
    opacity: 1;
  }

  to {
    opacity: 0;
    transform: scale(0.4);
  }
}

.cap-row {
  display: flex;
  gap: 4px;
  justify-content: center;
  margin-top: 3px;
}

.cap-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  border: 1.5px solid rgba(255, 255, 255, 0.6);
  transition: all 0.25s;
}

.cap-dot.on {
  background: #fde047;
  border-color: #facc15;
  box-shadow: 0 0 7px rgba(253, 224, 71, 0.8);
}

.wake {
  height: 7px;
  margin-top: 2px;
  border-radius: 3px;
  transition: all 0.4s;
}

.wake.active {
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.65), transparent);
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.4);
}

.dir-arrow {
  position: absolute;
  top: 6px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.8rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.8);
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
  z-index: 5;
  pointer-events: none;
}

/* BANKS */
.banks {
  display: grid;
  grid-template-columns: 1fr 60px 1fr;
  padding: 0.8rem 0.75rem 0.5rem;
}

.bank {
  background: rgba(255, 255, 255, 0.6);
  border: 2px solid rgba(255, 255, 255, 0.8);
  border-radius: 14px;
  padding: 0.7rem 0.6rem;
  transition: all 0.35s;
}

.bank-right {
  background: rgba(240, 253, 244, 0.65);
  border-color: rgba(134, 239, 172, 0.4);
}

.bank-fail {
  background: rgba(254, 242, 242, 0.9) !important;
  border-color: #f87171 !important;
  animation: shake 0.3s ease;
}

@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }

  25% {
    transform: translateX(-5px);
  }

  75% {
    transform: translateX(5px);
  }
}

.bank-win {
  background: rgba(240, 253, 244, 0.95) !important;
  border-color: #4ade80 !important;
  box-shadow: 0 0 24px rgba(74, 222, 128, 0.3) !important;
}

.bank-gap {
  display: flex;
  align-items: center;
  justify-content: center;
}

.bank-hd {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.bank-name {
  font-family: 'Baloo 2', cursive;
  font-weight: 800;
  font-size: 0.85rem;
  color: #1e293b;
}

.bank-cnt {
  display: flex;
  gap: 0.35rem;
}

.cnt-h,
.cnt-d {
  font-family: 'Baloo 2', cursive;
  font-size: 0.8rem;
  font-weight: 800;
  padding: 0.1em 0.45em;
  border-radius: 6px;
}

.cnt-h {
  background: var(--c-human-bg);
  color: #1e40af;
}

.cnt-d {
  background: var(--c-demon-bg);
  color: #991b1b;
}

.chars-block {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  min-height: 80px;
}

.chars-inner {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
  min-height: 30px;
}

.char {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.28rem 0.28rem 0.16rem;
  border-radius: 10px;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  user-select: none;
}

.char:hover {
  transform: translateY(-5px) scale(1.12);
}

.ch-human {
  background: var(--c-human-bg);
  border-color: var(--c-human-br);
}

.ch-human:hover {
  background: #bfdbfe;
  border-color: var(--c-human);
}

.ch-demon {
  background: var(--c-demon-bg);
  border-color: var(--c-demon-br);
}

.ch-demon:hover {
  background: #fecaca;
  border-color: var(--c-demon);
}

.ch-em {
  font-size: 1.45rem;
  line-height: 1;
}

.ch-lbl {
  font-size: 0.58rem;
  font-weight: 800;
  color: #334155;
}

.ch-hint {
  position: absolute;
  bottom: -18px;
  left: 50%;
  transform: translateX(-50%);
  white-space: nowrap;
  font-size: 0.62rem;
  font-weight: 700;
  background: rgba(30, 41, 59, 0.75);
  color: #fff;
  border-radius: 6px;
  padding: 2px 5px;
  opacity: 0;
  transition: opacity 0.2s;
  pointer-events: none;
}

.char:hover .ch-hint {
  opacity: 1;
}

/* char boarding: jump down to boat */
.ch-boarding {
  animation: jumpDown 0.4s cubic-bezier(0.4, 0, 0.6, 1) forwards;
}

@keyframes jumpDown {
  0% {
    transform: translateY(0) scale(1);
    opacity: 1;
  }

  50% {
    transform: translateY(-16px) scale(1.15);
  }

  100% {
    transform: translateY(55px) scale(0.4);
    opacity: 0;
  }
}

/* char arriving: drop from boat */
.ch-arriving {
  animation: dropDown 0.45s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes dropDown {
  from {
    opacity: 0;
    transform: translateY(-24px) scale(0.6);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* TransitionGroup for chars */
.char-enter-active {
  animation: charIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.char-leave-active {
  animation: charOut 0.3s ease;
  position: absolute;
}

@keyframes charIn {
  from {
    opacity: 0;
    transform: translateY(-18px) scale(0.65);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes charOut {
  to {
    opacity: 0;
    transform: scale(0.4);
  }
}

/* PROGRESS */
.prog-bar {
  padding: 0.5rem 1rem 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.7rem;
}

.prog-track {
  flex: 1;
  height: 8px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  overflow: hidden;
}

.prog-fill {
  height: 100%;
  background: linear-gradient(90deg, #2563eb, #10b981);
  border-radius: 8px;
  transition: width 0.55s ease;
  box-shadow: 0 0 8px rgba(37, 99, 235, 0.4);
}

.prog-lbl {
  font-size: 0.82rem;
  font-weight: 800;
  color: #1e293b;
  white-space: nowrap;
}

/* ── CONTROLS ── */
.controls {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.ctrl-stats {
  display: flex;
  gap: 1.2rem;
  flex-wrap: wrap;
}

.stat {
  display: flex;
  flex-direction: column;
}

.stat-l {
  font-size: 0.72rem;
  font-weight: 800;
  color: #475569;
  letter-spacing: 0.07em;
  text-transform: uppercase;
}

.stat-v {
  font-family: 'Baloo 2', cursive;
  font-size: 1.1rem;
  font-weight: 800;
  color: #0f172a;
}

.steps-v {
  color: #92400e;
}

.cross-btn {
  position: relative;
  overflow: hidden;
  padding: 0.7em 2.2em;
  background: linear-gradient(135deg, #1d4ed8, #2563eb);
  color: white;
  border: none;
  border-radius: 14px;
  font-family: 'Baloo 2', cursive;
  font-size: 1.05rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.22s;
  box-shadow: 0 4px 16px rgba(37, 99, 235, 0.4);
  align-self: flex-start;
}

.cross-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #1e40af, #2563eb);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(37, 99, 235, 0.5);
}

.cross-btn:disabled {
  opacity: 0.38;
  cursor: not-allowed;
  transform: none;
}

.ripple {
  position: absolute;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
  transform: translate(-50%, -50%) scale(0);
  animation: rippleOut 0.75s ease-out forwards;
  pointer-events: none;
}

@keyframes rippleOut {
  to {
    transform: translate(-50%, -50%) scale(16);
    opacity: 0;
  }
}

.row-anim {
  display: flex;
  align-items: center;
  gap: 0.3em;
}

.dots b {
  animation: blink 1s step-start infinite;
}

.dots b:nth-child(2) {
  animation-delay: 0.2s;
}

.dots b:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes blink {
  50% {
    opacity: 0;
  }
}

.fail-msg {
  background: #fff1f2;
  border: 2px solid #f87171;
  border-radius: 12px;
  padding: 0.7rem 1rem;
  font-size: 0.88rem;
  color: #991b1b;
}

.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(6px);
}

/* ── WIN ── */
.win-overlay {
  position: fixed;
  inset: 0;
  background: rgba(2, 6, 23, 0.7);
  backdrop-filter: blur(10px);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
}

.overlay-enter-active,
.overlay-leave-active {
  transition: all 0.4s;
}

.overlay-enter-from,
.overlay-leave-to {
  opacity: 0;
}

.win-box {
  background: white;
  border-radius: 24px;
  padding: 2.4rem 3rem;
  text-align: center;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.3);
  animation: popIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  max-width: 360px;
  width: 90%;
}

@keyframes popIn {
  from {
    transform: scale(0.7);
    opacity: 0;
  }

  to {
    transform: scale(1);
    opacity: 1;
  }
}

.win-fire {
  font-size: 2.4rem;
  margin-bottom: 0.4rem;
  animation: spin 0.6s ease-out;
}

@keyframes spin {
  from {
    transform: rotate(-20deg) scale(0.8);
  }

  to {
    transform: rotate(0) scale(1);
  }
}

.win-title {
  font-family: 'Baloo 2', cursive;
  font-size: 2.2rem;
  font-weight: 800;
  color: #1d4ed8;
}

.win-sub {
  color: #1e293b;
  margin-top: 0.3rem;
  font-size: 0.95rem;
  font-weight: 600;
}

.win-sub strong {
  color: #92400e;
}

.win-parade {
  font-size: 1.6rem;
  margin: 0.8rem 0;
  letter-spacing: 0.18em;
  animation: parade 0.6s ease infinite alternate;
}

@keyframes parade {
  from {
    transform: translateY(0);
  }

  to {
    transform: translateY(-6px);
  }
}

.win-acts {
  display: flex;
  gap: 0.7rem;
  justify-content: center;
  margin-top: 1.2rem;
}
</style>
