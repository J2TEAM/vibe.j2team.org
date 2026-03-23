<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'
import { Icon } from '@iconify/vue'
import { useClipboard } from '@vueuse/core'

// ── Types ──────────────────────────────────────────────────────────────────

interface Preset {
  label: string
  name: string
  icon: string
  keyframes: string
}

// ── Presets ────────────────────────────────────────────────────────────────

const presets: Preset[] = [
  {
    label: 'Bounce',
    name: 'bounce',
    icon: 'lucide:arrow-up-down',
    keyframes: `@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-40px);
  }
}`,
  },
  {
    label: 'Shake',
    name: 'shake',
    icon: 'lucide:zap',
    keyframes: `@keyframes shake {
  0%, 100% {
    transform: translateX(0);
  }
  15%, 45%, 75% {
    transform: translateX(-12px);
  }
  30%, 60%, 90% {
    transform: translateX(12px);
  }
}`,
  },
  {
    label: 'Pulse',
    name: 'pulse',
    icon: 'lucide:activity',
    keyframes: `@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.3);
    opacity: 0.75;
  }
}`,
  },
  {
    label: 'Spin',
    name: 'spin',
    icon: 'lucide:refresh-cw',
    keyframes: `@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}`,
  },
  {
    label: 'Slide In',
    name: 'slide-in',
    icon: 'lucide:arrow-right-from-line',
    keyframes: `@keyframes slide-in {
  0% {
    transform: translateX(-80px);
    opacity: 0;
  }
  100% {
    transform: translateX(0);
    opacity: 1;
  }
}`,
  },
  {
    label: 'Fade In/Out',
    name: 'fade-in-out',
    icon: 'lucide:sun-moon',
    keyframes: `@keyframes fade-in-out {
  0%, 100% {
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
}`,
  },
]

// ── State ──────────────────────────────────────────────────────────────────

const keyframesCode = ref(presets[0]!.keyframes)
const activePresetName = ref<string>(presets[0]!.name)
const animationKey = ref(0)

const duration = ref(1)
const timingFunction = ref('ease')
const iterationCount = ref('infinite')
const direction = ref('normal')
const fillMode = ref('none')

const timingOptions = [
  'linear',
  'ease',
  'ease-in',
  'ease-out',
  'ease-in-out',
  'cubic-bezier(0.68, -0.55, 0.27, 1.55)',
]

const iterationOptions = ['1', '2', '3', 'infinite']
const directionOptions = ['normal', 'reverse', 'alternate', 'alternate-reverse']
const fillModeOptions = ['none', 'forwards', 'backwards', 'both']

// ── Animation name extraction ──────────────────────────────────────────────

const animationName = computed(() => {
  const match = keyframesCode.value.match(/@keyframes\s+([\w-]+)/)
  return match?.[1] ?? 'unknown'
})

// ── Animation shorthand ────────────────────────────────────────────────────

const animationShorthand = computed(() => {
  return `${animationName.value} ${duration.value}s ${timingFunction.value} ${iterationCount.value} ${direction.value} ${fillMode.value}`
})

const previewStyle = computed(() => ({
  animation: animationShorthand.value,
}))

// ── CSS injection ──────────────────────────────────────────────────────────

function getOrCreateStyleEl(): HTMLStyleElement {
  const existing = document.getElementById('css-animation-playground-style')
  if (existing instanceof HTMLStyleElement) return existing
  const el = document.createElement('style')
  el.id = 'css-animation-playground-style'
  document.head.appendChild(el)
  return el
}

function applyAnimation() {
  const el = getOrCreateStyleEl()
  el.textContent = keyframesCode.value
  animationKey.value++
}

watch(keyframesCode, applyAnimation, { immediate: true })

onUnmounted(() => {
  document.getElementById('css-animation-playground-style')?.remove()
})

// ── Preset loading ─────────────────────────────────────────────────────────

function loadPreset(preset: Preset) {
  keyframesCode.value = preset.keyframes
  activePresetName.value = preset.name
}

// ── Replay ────────────────────────────────────────────────────────────────

function replayAnimation() {
  animationKey.value++
}

// ── Copy CSS ───────────────────────────────────────────────────────────────

const fullCss = computed(() => {
  return `${keyframesCode.value}\n\n.element {\n  animation: ${animationShorthand.value};\n}`
})

const { copy, copied } = useClipboard({ source: fullCss })

function copyCSS() {
  copy(fullCss.value)
}
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <!-- Header -->
      <header class="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="font-display text-3xl sm:text-4xl font-bold text-accent-coral">
            CSS Animation Playground
          </h1>
          <p class="mt-1 text-text-secondary text-sm">
            Viết keyframes, tinh chỉnh tham số và xem kết quả ngay lập tức.
          </p>
        </div>
        <RouterLink
          to="/"
          class="inline-flex items-center gap-2 border border-border-default bg-bg-surface px-4 py-2 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary self-start sm:self-auto"
        >
          <Icon icon="lucide:arrow-left" class="size-4" />
          Về trang chủ
        </RouterLink>
      </header>

      <!-- Main split layout -->
      <div class="flex flex-col lg:flex-row gap-6">
        <!-- ═══ LEFT PANEL ════════════════════════════════════════════════ -->
        <div class="flex flex-col gap-6 lg:w-[420px] lg:flex-shrink-0">
          <!-- Preset Templates -->
          <section>
            <h2 class="font-display text-base font-semibold flex items-center gap-2 mb-3">
              <span class="text-accent-amber text-xs tracking-widest font-display">//</span>
              Preset Templates
            </h2>
            <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-2">
              <button
                v-for="preset in presets"
                :key="preset.name"
                class="flex items-center gap-2.5 border px-3 py-2.5 text-sm transition text-left"
                :class="
                  activePresetName === preset.name
                    ? 'border-accent-coral bg-accent-coral/10 text-accent-coral'
                    : 'border-border-default bg-bg-surface text-text-secondary hover:border-accent-amber hover:text-text-primary'
                "
                @click="loadPreset(preset)"
              >
                <Icon :icon="preset.icon" class="size-4 flex-shrink-0" />
                <span class="font-medium">{{ preset.label }}</span>
              </button>
            </div>
          </section>

          <!-- Code Editor -->
          <section class="flex flex-col gap-3">
            <h2 class="font-display text-base font-semibold flex items-center gap-2">
              <span class="text-accent-coral text-xs tracking-widest font-display">//</span>
              @keyframes Editor
            </h2>
            <div class="border border-border-default bg-bg-surface">
              <div
                class="flex items-center justify-between px-3 py-2 border-b border-border-default bg-bg-elevated"
              >
                <div class="flex items-center gap-2 text-text-muted text-xs font-mono">
                  <Icon icon="lucide:code" class="size-3.5" />
                  style.css
                </div>
                <span
                  class="text-[10px] font-mono px-2 py-0.5 border"
                  :class="
                    animationName !== 'unknown'
                      ? 'border-accent-sky/30 text-accent-sky bg-accent-sky/5'
                      : 'border-border-default text-text-muted'
                  "
                >
                  @keyframes {{ animationName }}
                </span>
              </div>
              <textarea
                v-model="keyframesCode"
                spellcheck="false"
                class="w-full bg-bg-surface text-text-primary font-mono text-sm px-4 py-3 resize-none focus:outline-none leading-relaxed"
                style="min-height: 220px; tab-size: 2"
                placeholder="Nhập @keyframes CSS ở đây..."
              />
            </div>
            <p class="text-text-muted text-xs">CSS được áp dụng tự động khi bạn chỉnh sửa.</p>
          </section>

          <!-- Copy CSS -->
          <button
            class="flex items-center justify-center gap-2 border px-4 py-2.5 text-sm font-medium transition w-full"
            :class="
              copied
                ? 'border-accent-sky/50 bg-accent-sky/10 text-accent-sky'
                : 'border-border-default bg-bg-surface text-text-secondary hover:border-accent-sky hover:text-text-primary'
            "
            @click="copyCSS"
          >
            <Icon :icon="copied ? 'lucide:check' : 'lucide:copy'" class="size-4" />
            {{ copied ? 'Đã copy CSS!' : 'Copy CSS' }}
          </button>
        </div>

        <!-- ═══ RIGHT PANEL ═══════════════════════════════════════════════ -->
        <div class="flex flex-col gap-6 flex-1 min-w-0">
          <!-- Preview Box -->
          <section>
            <h2 class="font-display text-base font-semibold flex items-center gap-2 mb-3">
              <span class="text-accent-sky text-xs tracking-widest font-display">//</span>
              Preview
            </h2>
            <div
              class="border border-border-default bg-bg-surface flex flex-col items-center justify-center relative"
              style="min-height: 280px"
            >
              <!-- Replay button -->
              <button
                class="absolute top-3 right-3 flex items-center gap-1.5 border border-border-default bg-bg-elevated px-2.5 py-1.5 text-xs text-text-secondary transition hover:border-accent-amber hover:text-text-primary"
                @click="replayAnimation"
              >
                <Icon icon="lucide:rotate-ccw" class="size-3.5" />
                Replay
              </button>

              <!-- Animated element -->
              <div
                :key="animationKey"
                class="size-16 rounded bg-accent-coral flex items-center justify-center"
                :style="previewStyle"
              >
                <Icon icon="lucide:star" class="size-8 text-white" />
              </div>

              <!-- Animation label -->
              <p class="mt-6 text-text-muted text-xs font-mono text-center px-4">
                animation:
                <span class="text-accent-coral break-all">{{ animationShorthand }}</span>
              </p>
            </div>
          </section>

          <!-- Controls -->
          <section>
            <h2 class="font-display text-base font-semibold flex items-center gap-2 mb-3">
              <span class="text-accent-amber text-xs tracking-widest font-display">//</span>
              Tham số Animation
            </h2>
            <div
              class="border border-border-default bg-bg-surface p-4 grid grid-cols-1 sm:grid-cols-2 gap-5"
            >
              <!-- Duration -->
              <div>
                <label class="block text-text-secondary text-xs font-medium mb-2">
                  Duration
                  <span class="text-accent-coral font-mono ml-1">{{ duration }}s</span>
                </label>
                <input
                  v-model.number="duration"
                  type="range"
                  min="0.1"
                  max="5"
                  step="0.1"
                  class="w-full h-1.5 cursor-pointer"
                />
                <div class="flex justify-between text-text-muted text-[10px] font-mono mt-1">
                  <span>0.1s</span>
                  <span>5s</span>
                </div>
              </div>

              <!-- Timing Function -->
              <div>
                <label class="block text-text-secondary text-xs font-medium mb-2">
                  Timing Function
                </label>
                <select
                  v-model="timingFunction"
                  class="w-full bg-bg-elevated border border-border-default px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-amber transition"
                >
                  <option v-for="opt in timingOptions" :key="opt" :value="opt">
                    {{ opt }}
                  </option>
                </select>
              </div>

              <!-- Iteration Count -->
              <div>
                <label class="block text-text-secondary text-xs font-medium mb-2">
                  Iteration Count
                </label>
                <div class="flex gap-2">
                  <button
                    v-for="opt in iterationOptions"
                    :key="opt"
                    class="flex-1 border py-1.5 text-xs font-mono transition"
                    :class="
                      iterationCount === opt
                        ? 'border-accent-amber bg-accent-amber/10 text-accent-amber'
                        : 'border-border-default text-text-secondary hover:border-accent-amber hover:text-text-primary'
                    "
                    @click="iterationCount = opt"
                  >
                    {{ opt }}
                  </button>
                </div>
              </div>

              <!-- Direction -->
              <div>
                <label class="block text-text-secondary text-xs font-medium mb-2">
                  Direction
                </label>
                <select
                  v-model="direction"
                  class="w-full bg-bg-elevated border border-border-default px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-sky transition"
                >
                  <option v-for="opt in directionOptions" :key="opt" :value="opt">
                    {{ opt }}
                  </option>
                </select>
              </div>

              <!-- Fill Mode -->
              <div class="sm:col-span-2">
                <label class="block text-text-secondary text-xs font-medium mb-2">
                  Fill Mode
                </label>
                <div class="flex gap-2">
                  <button
                    v-for="opt in fillModeOptions"
                    :key="opt"
                    class="flex-1 border py-1.5 text-xs font-mono transition"
                    :class="
                      fillMode === opt
                        ? 'border-accent-sky bg-accent-sky/10 text-accent-sky'
                        : 'border-border-default text-text-secondary hover:border-accent-sky hover:text-text-primary'
                    "
                    @click="fillMode = opt"
                  >
                    {{ opt }}
                  </button>
                </div>
              </div>
            </div>
          </section>

          <!-- Generated CSS output -->
          <section>
            <h2 class="font-display text-base font-semibold flex items-center gap-2 mb-3">
              <span class="text-accent-coral text-xs tracking-widest font-display">//</span>
              CSS được tạo ra
            </h2>
            <div class="border border-border-default bg-bg-surface">
              <div
                class="flex items-center justify-between px-3 py-2 border-b border-border-default bg-bg-elevated"
              >
                <span class="text-text-muted text-xs font-mono">output.css</span>
                <button
                  class="flex items-center gap-1 text-[10px] text-text-muted hover:text-text-primary transition"
                  @click="copyCSS"
                >
                  <Icon :icon="copied ? 'lucide:check' : 'lucide:copy'" class="size-3" />
                  {{ copied ? 'Đã copy' : 'Copy' }}
                </button>
              </div>
              <pre
                class="px-4 py-3 font-mono text-xs text-text-secondary leading-relaxed overflow-x-auto whitespace-pre-wrap"
                >{{ fullCss }}</pre
              >
            </div>
          </section>
        </div>
      </div>
    </div>
  </div>
</template>
