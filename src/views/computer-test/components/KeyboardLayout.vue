<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import KeyboardKey from './KeyboardKey.vue'
import {
  ROW_FUNCTION,
  ROW_1,
  ROW_2,
  ROW_3,
  ROW_4,
  ROW_5,
  ROW_NAVIGATION,
  ARROWS,
  NUMPAD,
} from '../constants/keyboard'
import { useKeyboardState } from '../composables/useKeyboardState'

const sound = ref(true)

const {
  keyStates,
  pressCount,
  activeKeys,
  lastKeyCode,
  mostPressed,
  lastInterval,
  keyHistory,
  currentCps,
  currentApm,
  reset,
} = useKeyboardState(sound)

const layoutSize = ref<'100' | '80' | '60'>('100')
const osType = ref<'Win' | 'Mac'>('Win')

const mouseStates = reactive<Record<'Left' | 'Middle' | 'Right', 'idle' | 'active' | 'pressed'>>({
  Left: 'idle',
  Middle: 'idle',
  Right: 'idle',
})

function onMouseDown(e: MouseEvent) {
  if (e.button === 0) mouseStates.Left = 'active'
  if (e.button === 1) mouseStates.Middle = 'active'
  if (e.button === 2) mouseStates.Right = 'active'
}

function onMouseUp(e: MouseEvent) {
  if (e.button === 0) mouseStates.Left = 'pressed'
  if (e.button === 1) mouseStates.Middle = 'pressed'
  if (e.button === 2) mouseStates.Right = 'pressed'
}

onMounted(() => {
  window.addEventListener('mousedown', onMouseDown)
  window.addEventListener('mouseup', onMouseUp)
})
onUnmounted(() => {
  window.removeEventListener('mousedown', onMouseDown)
  window.removeEventListener('mouseup', onMouseUp)
})

function getOsLabel(key: { code: string; label: string }) {
  if (osType.value === 'Mac') {
    if (key.code === 'AltLeft' || key.code === 'AltRight') return 'Opt'
    if (key.code === 'MetaLeft' || key.code === 'MetaRight') return 'Cmd'
  }
  return key.label
}

function handleReset() {
  reset()
  mouseStates.Left = 'idle'
  mouseStates.Middle = 'idle'
  mouseStates.Right = 'idle'
}

const estScanRate = computed(() => {
  if (!lastInterval.value) return 0
  return Math.round(1000 / lastInterval.value)
})

// Stats helper
const mostPressedDisplay = computed(() => {
  if (!mostPressed.value.code) return '-'
  // Display the nice label if possible, instead of the raw technical key code
  return `${mostPressed.value.label || mostPressed.value.code} (${mostPressed.value.count})`
})
</script>

<template>
  <div class="flex flex-col gap-8 w-full max-w-6xl mx-auto p-4 sm:p-6 mb-20 animate-fade-up">
    <!-- Toolbar -->
    <div
      class="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 bg-bg-surface border border-border-default p-4 shadow-sm"
    >
      <div class="flex flex-wrap sm:flex-nowrap gap-4 w-full sm:w-auto">
        <div class="flex flex-col gap-2 flex-1 sm:flex-none">
          <span class="text-[10px] text-text-dim uppercase tracking-widest font-display"
            >Bố cục</span
          >
          <div class="flex gap-1 w-full sm:w-[180px]">
            <button
              v-for="s in ['100', '80', '60'] as const"
              :key="s"
              class="flex-1 px-3 py-1.5 text-xs text-center border transition-colors font-display"
              :class="
                layoutSize === s
                  ? 'bg-accent-coral border-accent-coral text-bg-deep'
                  : 'border-border-default text-text-secondary hover:border-text-dim'
              "
              @click="layoutSize = s"
            >
              {{ s }}%
            </button>
          </div>
        </div>

        <div class="flex flex-col gap-2 flex-1 sm:flex-none">
          <span class="text-[10px] text-text-dim uppercase tracking-widest font-display"
            >Hệ điều hành</span
          >
          <div class="flex gap-1 w-full sm:w-[120px]">
            <button
              v-for="o in ['Win', 'Mac'] as const"
              :key="o"
              class="flex-1 px-3 py-1.5 text-xs text-center border transition-colors font-display"
              :class="
                osType === o
                  ? 'bg-accent-coral border-accent-coral text-bg-deep'
                  : 'border-border-default text-text-secondary hover:border-text-dim'
              "
              @click="osType = o"
            >
              {{ o }}
            </button>
          </div>
        </div>
      </div>

      <div class="flex gap-4 w-full sm:w-auto mt-2 sm:mt-0 justify-start sm:justify-end">
        <div class="flex flex-col gap-2">
          <span class="text-[10px] text-text-dim uppercase tracking-widest font-display"
            >Âm thanh</span
          >
          <button
            class="px-4 py-1.5 text-xs font-medium text-center border transition-colors font-display min-w-[72px]"
            :class="
              sound
                ? 'bg-green-500/20 border-green-500 text-green-400'
                : 'border-border-default text-text-secondary hover:border-text-dim'
            "
            @click="sound = !sound"
          >
            {{ sound ? 'BẬT' : 'TẮT' }}
          </button>
        </div>

        <div class="flex flex-col gap-2">
          <span class="text-[10px] text-text-dim uppercase tracking-widest font-display"
            >Thao tác</span
          >
          <button
            class="px-4 py-1.5 text-xs font-semibold text-center border border-accent-coral text-accent-coral hover:bg-accent-coral hover:text-bg-deep transition-colors font-display min-w-[72px]"
            @click="handleReset"
          >
            ĐẶT LẠI
          </button>
        </div>
      </div>
    </div>

    <!-- Key History Display -->
    <div
      class="bg-bg-surface border border-border-default flex items-center h-12 overflow-hidden relative shadow-sm"
    >
      <div
        v-if="keyHistory.length === 0"
        class="text-text-dim text-xs px-4 whitespace-nowrap w-full"
      >
        Nhấn phím bất kỳ để bắt đầu
      </div>
      <div v-else class="flex gap-1.5 items-center overflow-hidden w-full h-full px-4 pr-24">
        <div
          v-for="key in keyHistory"
          :key="key.id"
          class="flex-shrink-0 px-2.5 py-1 bg-accent-sky/10 border border-accent-sky/30 text-accent-sky text-[11px] font-display min-w-[32px] text-center animate-fade-in"
        >
          {{ key.label }}
        </div>
      </div>
      <div
        class="absolute right-3 top-1/2 -translate-y-1/2 bg-bg-deep/90 backdrop-blur-sm px-2.5 py-1 border border-border-default text-[10px] text-text-dim font-display uppercase tracking-widest pointer-events-none z-10"
      >
        {{ pressCount }} phím
      </div>
    </div>

    <!-- Keyboard Layout Container -->
    <div
      class="bg-bg-deep/50 border border-border-default p-4 sm:p-8 overflow-x-auto selection:bg-accent-coral/30"
    >
      <div class="flex flex-col items-center w-full min-w-fit">
        <div class="flex flex-col gap-1 transition-all duration-500">
          <!-- Row Function (Hide on 60%) -->
          <div v-if="layoutSize !== '60'" class="flex gap-1 mb-2">
            <KeyboardKey
              v-for="key in ROW_FUNCTION"
              :key="key.code"
              v-bind="key"
              :status="keyStates[key.code] || 'idle'"
            />
          </div>

          <div class="flex gap-6">
            <!-- Main Section -->
            <div class="flex flex-col gap-1 flex-shrink-0">
              <!-- Row 1: Replace first key with Esc on 60% layout -->
              <div class="flex gap-1">
                <template v-for="(key, index) in ROW_1" :key="key.code">
                  <KeyboardKey
                    v-if="index === 0 && layoutSize === '60'"
                    code="Escape"
                    label="Esc"
                    :status="keyStates['Escape'] || 'idle'"
                  />
                  <KeyboardKey v-else v-bind="key" :status="keyStates[key.code] || 'idle'" />
                </template>
              </div>
              <div class="flex gap-1">
                <KeyboardKey
                  v-for="key in ROW_2"
                  :key="key.code"
                  v-bind="key"
                  :status="keyStates[key.code] || 'idle'"
                />
              </div>
              <div class="flex gap-1">
                <KeyboardKey
                  v-for="key in ROW_3"
                  :key="key.code"
                  v-bind="key"
                  :status="keyStates[key.code] || 'idle'"
                />
              </div>
              <div class="flex gap-1">
                <KeyboardKey
                  v-for="key in ROW_4"
                  :key="key.code"
                  v-bind="key"
                  :status="keyStates[key.code] || 'idle'"
                />
              </div>
              <div class="flex gap-1">
                <KeyboardKey
                  v-for="key in ROW_5"
                  :key="key.code"
                  v-bind="key"
                  :label="getOsLabel(key)"
                  :status="keyStates[key.code] || 'idle'"
                />
              </div>
            </div>

            <!-- Navigation & Arrows (Hide on 60%) -->
            <div v-show="layoutSize !== '60'" class="flex flex-col gap-1 flex-shrink-0">
              <div class="grid grid-cols-3 gap-1 mb-2">
                <KeyboardKey
                  v-for="key in ROW_NAVIGATION"
                  :key="key.code"
                  v-bind="key"
                  :status="keyStates[key.code] || 'idle'"
                />
              </div>

              <div class="mt-auto flex flex-col gap-1 items-center">
                <KeyboardKey
                  v-if="ARROWS[0]"
                  v-bind="ARROWS[0]"
                  :code="ARROWS[0].code"
                  :label="ARROWS[0].label"
                  :status="keyStates[ARROWS[0].code] || 'idle'"
                />
                <div class="flex gap-1">
                  <KeyboardKey
                    v-for="key in ARROWS.slice(1)"
                    :key="key.code"
                    v-bind="key"
                    :status="keyStates[key.code] || 'idle'"
                  />
                </div>
              </div>
            </div>

            <!-- Numpad (Only 100%) -->
            <div
              v-show="layoutSize === '100'"
              class="grid grid-cols-4 grid-rows-5 gap-1 h-fit flex-shrink-0"
            >
              <KeyboardKey
                v-for="key in NUMPAD"
                :key="key.code"
                v-bind="key"
                :status="keyStates[key.code] || 'idle'"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Mouse Trackpad -->
      <div class="mt-4 flex gap-1 justify-center w-full max-w-[500px] mx-auto h-12">
        <KeyboardKey
          code="MouseLeft"
          label="Chuột trái"
          width="flex-1"
          height="h-full"
          :status="mouseStates.Left"
        />
        <KeyboardKey
          code="MouseMiddle"
          label="Chuột giữa"
          width="w-24"
          height="h-full"
          :status="mouseStates.Middle"
        />
        <KeyboardKey
          code="MouseRight"
          label="Chuột phải"
          width="flex-1"
          height="h-full"
          :status="mouseStates.Right"
        />
      </div>
    </div>

    <!-- Stats -->
    <div
      class="bg-bg-surface border border-border-default rounded-xl p-5 shadow-sm flex flex-col w-full"
    >
      <!-- <h3 class="text-sm font-semibold text-text-primary mb-4 font-display">Thống kê</h3> -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div class="bg-text-primary/5 rounded-lg p-3 flex flex-col justify-center">
          <span class="text-[10px] text-text-secondary font-display">Số phím đang nhấn</span>
          <span class="text-lg font-bold text-accent-sky font-display">{{
            activeKeys.length
          }}</span>
        </div>
        <div class="bg-text-primary/5 rounded-lg p-3 flex flex-col justify-center">
          <span class="text-[10px] text-text-secondary font-display">Tổng số phím đã nhấn</span>
          <span class="text-lg font-bold text-text-primary font-display">{{ pressCount }}</span>
        </div>
        <div class="bg-text-primary/5 rounded-lg p-3 flex flex-col justify-center">
          <span class="text-[10px] text-text-secondary font-display">Phím nhấn nhiều nhất</span>
          <span class="text-lg font-bold text-text-primary font-display truncate">{{
            mostPressedDisplay
          }}</span>
        </div>
        <div class="bg-text-primary/5 rounded-lg p-3 flex flex-col justify-center">
          <span class="text-[10px] text-text-secondary font-display">Mã phím cuối</span>
          <span class="text-lg font-bold text-text-primary font-display truncate">{{
            lastKeyCode || '-'
          }}</span>
        </div>
        <div class="bg-text-primary/5 rounded-lg p-3 flex flex-col justify-center">
          <span class="text-[10px] text-text-secondary font-display">Tốc độ quét (Hz)</span>
          <span class="text-lg font-bold text-text-primary font-display">{{ estScanRate }} Hz</span>
        </div>
        <div class="bg-text-primary/5 rounded-lg p-3 flex flex-col justify-center">
          <span class="text-[10px] text-text-secondary font-display">Khoảng cách phím (ms)</span>
          <span class="text-lg font-bold text-text-primary font-display"
            >{{ lastInterval }} ms</span
          >
        </div>
        <div class="bg-text-primary/5 rounded-lg p-3 flex flex-col justify-center">
          <span class="text-[10px] text-text-secondary font-display">Nhấn / giây</span>
          <span class="text-lg font-bold text-accent-sky font-display">{{ currentCps }}</span>
        </div>
        <div class="bg-text-primary/5 rounded-lg p-3 flex flex-col justify-center">
          <span class="text-[10px] text-text-secondary font-display">Nhấn / phút</span>
          <span class="text-lg font-bold text-accent-sky font-display">{{ currentApm }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Ensure keys don't shrink too much */
:deep(.w-12) {
  min-width: 3rem;
}
</style>
