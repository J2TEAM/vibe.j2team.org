<script setup lang="ts">
import { ref, computed } from 'vue'
import { RouterLink } from 'vue-router'
import { Icon } from '@iconify/vue'
import { useClipboard } from '@vueuse/core'

// ─── Types ────────────────────────────────────────────────────────────────

interface PaletteColor {
  hex: string
  h: number
  s: number
  l: number
  name: string
  locked: boolean
}

interface Theme {
  id: string
  name: string
  nameVi: string
  description: string
  icon: string
  harmony: string
  generate: (existing?: PaletteColor[]) => PaletteColor[]
}

// ─── Color Utilities ──────────────────────────────────────────────────────

function hslToHex(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360
  const sl = Math.max(0, Math.min(1, s / 100))
  const ll = Math.max(0, Math.min(1, l / 100))
  const a = sl * Math.min(ll, 1 - ll)
  const f = (n: number): string => {
    const k = (n + h / 30) % 12
    const v = ll - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))
    return Math.round(255 * v)
      .toString(16)
      .padStart(2, '0')
  }
  return `#${f(0)}${f(8)}${f(4)}`.toUpperCase()
}

function r(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

function colorLabel(h: number, s: number, l: number): string {
  if (s < 8) {
    if (l < 15) return 'Ebony'
    if (l < 30) return 'Charcoal'
    if (l < 50) return 'Pewter'
    if (l < 70) return 'Silver'
    return 'Pearl'
  }
  const hues: Array<[number, string]> = [
    [10, 'Red'],
    [22, 'Vermillion'],
    [38, 'Amber'],
    [52, 'Gold'],
    [68, 'Yellow'],
    [83, 'Lime'],
    [130, 'Green'],
    [158, 'Emerald'],
    [180, 'Teal'],
    [210, 'Cerulean'],
    [245, 'Blue'],
    [270, 'Violet'],
    [295, 'Magenta'],
    [340, 'Rose'],
    [360, 'Red'],
  ]
  const entry = hues.find(([max]) => h <= max)
  const base = entry?.[1] ?? 'Red'
  if (l < 22) return `Deep ${base}`
  if (l > 78) return `Light ${base}`
  if (s > 80) return `Vivid ${base}`
  return base
}

function mkColor(h: number, s: number, l: number): PaletteColor {
  return { hex: hslToHex(h, s, l), h, s, l, name: colorLabel(h, s, l), locked: false }
}

function applyLocks(fresh: PaletteColor[], existing?: PaletteColor[]): PaletteColor[] {
  if (!existing) return fresh
  return fresh.map((col, i) => {
    const ex = existing[i]
    if (ex && ex.locked) return { ...ex }
    return col
  })
}

// ─── Themes ───────────────────────────────────────────────────────────────
// Each theme uses a named color harmony scheme from color theory:
// • Analogous      – adjacent hues (±30°), cohesive and natural
// • Triadic        – hues 120° apart, vibrant and balanced
// • Tetradic       – four hues 90° apart, rich and complex
// • Split-Comp     – base + two hues adjacent to its complement
// • Monochromatic  – single hue at varying lightness / saturation

const THEMES: Theme[] = [
  {
    id: 'elegant',
    name: 'Elegant',
    nameVi: 'Sang Trọng',
    description: 'Vàng kim, navy, trắng ngà — tinh tế, trang nhã',
    icon: 'lucide:crown',
    harmony: 'Split-Comp',
    generate: (ex) => {
      const bh = r(30, 55)
      return applyLocks(
        [
          mkColor(bh, r(65, 82), r(44, 60)),
          mkColor((bh + 180) % 360, r(22, 38), r(10, 22)),
          mkColor((bh + 180) % 360, r(12, 25), r(26, 38)),
          mkColor(bh, r(10, 22), r(84, 94)),
          mkColor((bh + 165) % 360, r(6, 18), r(50, 65)),
        ],
        ex,
      )
    },
  },
  {
    id: 'vibrant',
    name: 'Vibrant',
    nameVi: 'Rực Rỡ',
    description: 'Bộ màu tam giác — bão hòa cao, năng động, tươi sáng',
    icon: 'lucide:sparkles',
    harmony: 'Triadic',
    generate: (ex) => {
      const bh = r(0, 360)
      return applyLocks(
        [
          mkColor(bh % 360, r(82, 100), r(48, 62)),
          mkColor((bh + 120) % 360, r(78, 100), r(48, 62)),
          mkColor((bh + 240) % 360, r(78, 100), r(48, 62)),
          mkColor((bh + 60) % 360, r(72, 95), r(56, 70)),
          mkColor((bh + 180) % 360, r(68, 92), r(40, 54)),
        ],
        ex,
      )
    },
  },
  {
    id: 'pastel',
    name: 'Pastel',
    nameVi: 'Pastel',
    description: 'Nhẹ nhàng, mơ màng — sáng và bão hòa thấp',
    icon: 'lucide:cloud',
    harmony: 'Analogous',
    generate: (ex) => {
      const bh = r(0, 360)
      return applyLocks(
        [
          mkColor(bh % 360, r(42, 62), r(78, 90)),
          mkColor((bh + 28) % 360, r(38, 60), r(80, 92)),
          mkColor((bh + 55) % 360, r(38, 58), r(82, 93)),
          mkColor((bh + 82) % 360, r(34, 55), r(83, 94)),
          mkColor((bh + 110) % 360, r(32, 50), r(84, 95)),
        ],
        ex,
      )
    },
  },
  {
    id: 'earthy',
    name: 'Earthy',
    nameVi: 'Đất',
    description: 'Nâu, be, ô liu, rêu — gần gũi với thiên nhiên',
    icon: 'lucide:leaf',
    harmony: 'Analogous',
    generate: (ex) => {
      const bh = r(20, 100)
      return applyLocks(
        [
          mkColor(bh, r(32, 55), r(20, 36)),
          mkColor((bh + 18) % 360, r(36, 52), r(36, 50)),
          mkColor((bh + 35) % 360, r(26, 46), r(50, 64)),
          mkColor((bh - 12 + 360) % 360, r(20, 40), r(64, 78)),
          mkColor((bh + 45) % 360, r(14, 28), r(76, 88)),
        ],
        ex,
      )
    },
  },
  {
    id: 'nordic',
    name: 'Nordic',
    nameVi: 'Bắc Âu',
    description: 'Lạnh lẽo, tối giản — xanh băng và xám trắng Scandinavia',
    icon: 'lucide:snowflake',
    harmony: 'Monochromatic',
    generate: (ex) => {
      const bh = r(190, 240)
      return applyLocks(
        [
          mkColor(bh, r(20, 40), r(11, 21)),
          mkColor((bh + r(-8, 8) + 360) % 360, r(25, 45), r(26, 38)),
          mkColor((bh + r(-12, 12) + 360) % 360, r(20, 35), r(50, 65)),
          mkColor((bh + r(-15, 15) + 360) % 360, r(14, 28), r(72, 82)),
          mkColor((bh + r(-8, 8) + 360) % 360, r(8, 18), r(88, 96)),
        ],
        ex,
      )
    },
  },
  {
    id: 'sunset',
    name: 'Sunset',
    nameVi: 'Hoàng Hôn',
    description: 'Rực rỡ khi chiều tàn — cam, đỏ, hồng, tím chuyển sắc',
    icon: 'lucide:sun',
    harmony: 'Analogous',
    generate: (ex) => {
      return applyLocks(
        [
          mkColor(r(15, 32), r(80, 100), r(55, 68)),
          mkColor(r(340, 360), r(76, 96), r(50, 65)),
          mkColor(r(310, 335), r(62, 86), r(44, 59)),
          mkColor(r(278, 312), r(52, 76), r(34, 51)),
          mkColor(r(22, 48), r(72, 92), r(65, 78)),
        ],
        ex,
      )
    },
  },
  {
    id: 'ocean',
    name: 'Ocean',
    nameVi: 'Đại Dương',
    description: 'Mát như sóng biển — xanh dương, lam ngọc, xanh sâu',
    icon: 'lucide:droplets',
    harmony: 'Analogous',
    generate: (ex) => {
      const bh = r(170, 220)
      return applyLocks(
        [
          mkColor((bh - 22 + 360) % 360, r(55, 80), r(65, 80)),
          mkColor(bh, r(60, 86), r(48, 62)),
          mkColor((bh + 22) % 360, r(62, 86), r(34, 49)),
          mkColor((bh + 38) % 360, r(52, 76), r(21, 35)),
          mkColor((bh - 38 + 360) % 360, r(40, 65), r(78, 90)),
        ],
        ex,
      )
    },
  },
  {
    id: 'forest',
    name: 'Forest',
    nameVi: 'Rừng Xanh',
    description: 'Xanh lá, rêu, nâu đất — mát mẻ như đại ngàn',
    icon: 'lucide:trees',
    harmony: 'Analogous',
    generate: (ex) => {
      const bh = r(90, 145)
      return applyLocks(
        [
          mkColor(bh, r(46, 72), r(15, 28)),
          mkColor((bh + 18) % 360, r(42, 66), r(26, 40)),
          mkColor((bh - 18 + 360) % 360, r(36, 62), r(36, 50)),
          mkColor((bh + 32) % 360, r(26, 48), r(50, 64)),
          mkColor((bh - 32 + 360) % 360, r(20, 40), r(62, 76)),
        ],
        ex,
      )
    },
  },
  {
    id: 'retro',
    name: 'Retro',
    nameVi: 'Hoài Cổ',
    description: 'Vintage 70-80s — màu mờ, ấm áp, gợi nhớ thập niên cũ',
    icon: 'lucide:clock',
    harmony: 'Tetradic',
    generate: (ex) => {
      const bh = r(15, 55)
      return applyLocks(
        [
          mkColor(bh, r(35, 55), r(42, 58)),
          mkColor((bh + 90) % 360, r(30, 50), r(42, 56)),
          mkColor((bh + 180) % 360, r(25, 48), r(38, 55)),
          mkColor((bh + 270) % 360, r(28, 48), r(44, 60)),
          mkColor((bh + 45) % 360, r(14, 28), r(74, 86)),
        ],
        ex,
      )
    },
  },
  {
    id: 'neon',
    name: 'Neon',
    nameVi: 'Neon',
    description: 'Đèn neon cyberpunk — màu rực nổi bật trên nền tối',
    icon: 'lucide:zap',
    harmony: 'Triadic',
    generate: (ex) => {
      const bh = r(0, 360)
      return applyLocks(
        [
          mkColor(bh % 360, r(95, 100), r(52, 62)),
          mkColor((bh + 120) % 360, r(90, 100), r(52, 62)),
          mkColor((bh + 240) % 360, r(90, 100), r(55, 65)),
          mkColor(0, r(0, 10), r(8, 15)),
          mkColor(0, r(0, 8), r(92, 98)),
        ],
        ex,
      )
    },
  },
  {
    id: 'monochrome',
    name: 'Monochrome',
    nameVi: 'Đơn Sắc',
    description: 'Từ tối đến sáng — một màu chủ đạo ở nhiều cấp độ',
    icon: 'lucide:circle-half-stroke',
    harmony: 'Monochromatic',
    generate: (ex) => {
      const bh = r(0, 360)
      const bs = r(44, 82)
      return applyLocks(
        [
          mkColor(bh, bs * 0.5, r(9, 19)),
          mkColor(bh, bs * 0.75, r(27, 39)),
          mkColor(bh, bs, r(48, 58)),
          mkColor(bh, bs * 0.85, r(64, 74)),
          mkColor(bh, bs * 0.5, r(82, 92)),
        ],
        ex,
      )
    },
  },
  {
    id: 'autumn',
    name: 'Autumn',
    nameVi: 'Mùa Thu',
    description: 'Lá vàng rơi — đỏ cam, vàng nâu đất đặc trưng mùa thu',
    icon: 'lucide:tree-pine',
    harmony: 'Analogous',
    generate: (ex) => {
      return applyLocks(
        [
          mkColor(r(8, 25), r(65, 90), r(42, 58)),
          mkColor(r(25, 45), r(70, 95), r(50, 65)),
          mkColor(r(40, 60), r(62, 86), r(48, 62)),
          mkColor(r(5, 20), r(45, 70), r(26, 42)),
          mkColor(r(340, 360), r(55, 80), r(38, 55)),
        ],
        ex,
      )
    },
  },
]

// ─── State & Logic ────────────────────────────────────────────────────────

const activeThemeId = ref<string | null>(null)
const palette = ref<PaletteColor[]>([])
const copiedIdx = ref<number | null>(null)
const copiedAll = ref(false)

const { copy } = useClipboard()

const activeTheme = computed(() => THEMES.find((t) => t.id === activeThemeId.value))

function selectTheme(theme: Theme): void {
  activeThemeId.value = theme.id
  palette.value = theme.generate()
}

function regenerate(): void {
  if (!activeTheme.value) return
  palette.value = activeTheme.value.generate(palette.value)
}

function toggleLock(i: number): void {
  const col = palette.value[i]
  if (col) col.locked = !col.locked
}

async function copyHex(hex: string, i: number): Promise<void> {
  await copy(hex)
  copiedIdx.value = i
  setTimeout(() => {
    copiedIdx.value = null
  }, 1400)
}

async function copyAllHex(): Promise<void> {
  await copy(palette.value.map((c) => c.hex).join(', '))
  copiedAll.value = true
  setTimeout(() => {
    copiedAll.value = false
  }, 1800)
}

async function exportCSSVars(): Promise<void> {
  const vars = palette.value.map((c, i) => `  --color-${i + 1}: ${c.hex};`).join('\n')
  await copy(`:root {\n${vars}\n}`)
  copiedAll.value = true
  setTimeout(() => {
    copiedAll.value = false
  }, 1800)
}

/** Returns a contrasting text color (#dark or #light) for a given hex background */
function contrastText(hex: string): string {
  const R = parseInt(hex.slice(1, 3), 16)
  const G = parseInt(hex.slice(3, 5), 16)
  const B = parseInt(hex.slice(5, 7), 16)
  return (0.299 * R + 0.587 * G + 0.114 * B) / 255 > 0.55 ? '#1a1a1a' : '#f0ede6'
}
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body">
    <!-- ── Header ── -->
    <header class="border-b border-border-default">
      <div class="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
        <RouterLink
          to="/"
          class="inline-flex items-center gap-2 text-sm text-text-secondary transition hover:text-text-primary"
        >
          <Icon icon="lucide:arrow-left" class="size-4" />
          Trang chủ
        </RouterLink>
        <span class="font-display text-xs tracking-widest text-text-dim uppercase">
          Color Palette
        </span>
      </div>
    </header>

    <main class="max-w-5xl mx-auto px-6 py-10 space-y-12">
      <!-- ── Hero ── -->
      <div class="animate-fade-up animate-delay-1">
        <h1 class="font-display text-4xl md:text-5xl font-bold text-text-primary mb-3">
          <span class="text-accent-coral">Random</span> Color Palette
        </h1>
        <p class="text-text-secondary text-base max-w-lg">
          Tạo bộ màu ngẫu nhiên theo lý thuyết màu sắc. Chọn chủ đề và khám phá vô vàn tổ hợp màu!
        </p>
      </div>

      <!-- ── Active Palette ── -->
      <section v-if="palette.length > 0" class="animate-fade-up animate-delay-2 space-y-2">
        <!-- Swatches -->
        <div class="flex h-44 sm:h-60 overflow-hidden">
          <div
            v-for="(color, i) in palette"
            :key="i"
            class="relative flex-1 group cursor-pointer transition-all duration-200 select-none"
            :style="{ backgroundColor: color.hex }"
            @click="copyHex(color.hex, i)"
          >
            <!-- Lock toggle (hover-visible, always visible when locked) -->
            <button
              class="absolute top-2 right-2 p-1 transition-opacity z-10"
              :class="color.locked ? 'opacity-70' : 'opacity-0 group-hover:opacity-100'"
              :style="{ color: contrastText(color.hex) }"
              :title="color.locked ? 'Mở khóa màu' : 'Khóa màu này'"
              @click.stop="toggleLock(i)"
            >
              <Icon :icon="color.locked ? 'lucide:lock' : 'lucide:lock-open'" class="size-4" />
            </button>

            <!-- Copied flash overlay -->
            <div
              v-if="copiedIdx === i"
              class="absolute inset-0 flex items-center justify-center bg-black/20"
            >
              <Icon
                icon="lucide:check"
                class="size-6"
                :style="{ color: contrastText(color.hex) }"
              />
            </div>
          </div>
        </div>

        <!-- Hex code row (always visible, clickable to copy) -->
        <div class="flex">
          <button
            v-for="(color, i) in palette"
            :key="i"
            class="flex-1 border border-border-default bg-bg-surface hover:bg-bg-elevated transition-colors py-2.5 px-1 text-center group"
            :class="{ 'border-accent-coral': copiedIdx === i }"
            :title="`Click để copy ${color.hex}`"
            @click="copyHex(color.hex, i)"
          >
            <div
              class="font-display text-[10px] sm:text-xs text-text-dim group-hover:text-text-secondary transition-colors tracking-wider truncate px-1"
            >
              {{ copiedIdx === i ? '✓ Copied' : color.hex }}
            </div>
            <div class="hidden sm:block text-[10px] text-text-dim/60 mt-0.5 truncate px-1">
              {{ color.name }}
            </div>
          </button>
        </div>

        <!-- Action bar -->
        <div class="flex flex-wrap items-center gap-3 pt-1">
          <!-- Theme name + harmony badge -->
          <div class="flex items-center gap-2 flex-1 min-w-0">
            <span class="font-display text-sm font-semibold text-accent-coral truncate">
              {{ activeTheme?.nameVi }}
            </span>
            <span
              class="font-display text-xs text-text-dim tracking-wide px-2 py-0.5 border border-border-default whitespace-nowrap shrink-0"
            >
              {{ activeTheme?.harmony }}
            </span>
          </div>

          <!-- Action buttons -->
          <div class="flex gap-2 shrink-0">
            <button
              class="inline-flex items-center gap-1.5 border border-border-default bg-bg-surface px-3 py-2 text-xs text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
              @click="regenerate"
            >
              <Icon icon="lucide:refresh-cw" class="size-3.5" />
              <span class="font-display">Tạo lại</span>
            </button>
            <button
              class="inline-flex items-center gap-1.5 border border-border-default bg-bg-surface px-3 py-2 text-xs text-text-secondary transition hover:border-accent-amber hover:text-text-primary"
              @click="copyAllHex"
            >
              <Icon :icon="copiedAll ? 'lucide:check' : 'lucide:copy'" class="size-3.5" />
              <span class="font-display">{{ copiedAll ? 'Copied!' : 'Copy HEX' }}</span>
            </button>
            <button
              class="inline-flex items-center gap-1.5 border border-border-default bg-bg-surface px-3 py-2 text-xs text-text-secondary transition hover:border-accent-sky hover:text-text-primary"
              :title="'Copy as CSS custom properties'"
              @click="exportCSSVars"
            >
              <Icon icon="lucide:code-2" class="size-3.5" />
              <span class="font-display hidden sm:inline">CSS Vars</span>
            </button>
          </div>
        </div>

        <!-- Hint -->
        <p class="text-[11px] text-text-dim flex items-center gap-1.5 pt-0.5">
          <Icon icon="lucide:info" class="size-3 shrink-0" />
          Hover vào ô màu → click
          <Icon icon="lucide:lock" class="size-3 inline" />
          để giữ màu khi tạo lại · Click ô màu hoặc HEX để copy
        </p>
      </section>

      <!-- ── Empty state ── -->
      <div v-else class="text-center py-16 animate-fade-up animate-delay-2">
        <Icon icon="lucide:palette" class="size-14 text-text-dim mx-auto mb-4" />
        <p class="text-text-secondary">Chọn một chủ đề bên dưới để tạo bộ màu đầu tiên!</p>
      </div>

      <!-- ── Theme Grid ── -->
      <section class="animate-fade-up animate-delay-3">
        <h2
          class="font-display text-xl font-semibold text-text-primary mb-6 flex items-center gap-3"
        >
          <span class="text-accent-coral font-display text-sm tracking-widest">//</span>
          Chọn chủ đề
        </h2>

        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <button
            v-for="theme in THEMES"
            :key="theme.id"
            class="relative border bg-bg-surface p-4 sm:p-5 text-left transition-all duration-300 hover:-translate-y-1 hover:bg-bg-elevated hover:shadow-lg hover:shadow-accent-coral/5"
            :class="
              activeThemeId === theme.id
                ? 'border-accent-coral'
                : 'border-border-default hover:border-accent-coral'
            "
            @click="selectTheme(theme)"
          >
            <div class="flex items-start gap-3">
              <span class="text-accent-coral mt-0.5 shrink-0">
                <Icon :icon="theme.icon" class="size-5" />
              </span>
              <div class="min-w-0">
                <div
                  class="font-display text-sm font-semibold text-text-primary mb-1 flex items-center gap-1.5 flex-wrap"
                >
                  {{ theme.nameVi }}
                  <span class="text-text-dim font-body font-normal text-xs">{{ theme.name }}</span>
                </div>
                <div class="text-xs text-text-secondary leading-relaxed">
                  {{ theme.description }}
                </div>
                <div class="mt-2 text-[11px] text-text-dim font-display tracking-wider">
                  {{ theme.harmony }}
                </div>
              </div>
            </div>
            <!-- Active indicator dot -->
            <div
              v-if="activeThemeId === theme.id"
              class="absolute top-3 right-3 size-2 rounded-full bg-accent-coral"
            />
          </button>
        </div>
      </section>
    </main>
  </div>
</template>
