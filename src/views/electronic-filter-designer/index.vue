<script setup lang="ts">
import { computed, ref } from 'vue'
import { Icon } from '@iconify/vue'
import { RouterLink } from 'vue-router'
import { useLocalStorage } from '@vueuse/core'

import BodePlot from './components/BodePlot.vue'
import FilterSchematic from './components/FilterSchematic.vue'
import type { ComponentField, FilterParams, FilterTopology, TopologyInfo } from './types'
import { buildFilter, solveSecondComponent } from './utils/filterMath'
import { eSeriesErrorPercent, nearestESeriesValue, type ESeriesName } from './utils/eSeries'
import { formatFrequency, formatSiValue, parseSiNumber } from './utils/siFormat'

interface PerTopologyInputs {
  R: string
  C: string
  L: string
  Q: string
}

const TOPOLOGIES: ReadonlyArray<TopologyInfo> = [
  {
    id: 'rc-lpf',
    shortLabel: 'RC LPF',
    fullLabel: 'RC Low-Pass (1st order)',
    vietnameseName: 'Thông thấp RC bậc 1',
    order: 1,
    fields: ['R', 'C'],
    formulaTex: 'H(s) = 1 / (1 + sRC)',
    cutoffFormulaTex: 'f_c = 1 / (2π · R · C)',
    schematicNote: 'R nối tiếp tín hiệu, C nối từ ngõ ra xuống đất.',
  },
  {
    id: 'rc-hpf',
    shortLabel: 'RC HPF',
    fullLabel: 'RC High-Pass (1st order)',
    vietnameseName: 'Thông cao RC bậc 1',
    order: 1,
    fields: ['R', 'C'],
    formulaTex: 'H(s) = sRC / (1 + sRC)',
    cutoffFormulaTex: 'f_c = 1 / (2π · R · C)',
    schematicNote: 'C nối tiếp tín hiệu, R nối từ ngõ ra xuống đất.',
  },
  {
    id: 'rl-lpf',
    shortLabel: 'RL LPF',
    fullLabel: 'RL Low-Pass (1st order)',
    vietnameseName: 'Thông thấp RL bậc 1',
    order: 1,
    fields: ['R', 'L'],
    formulaTex: 'H(s) = 1 / (1 + s · L/R)',
    cutoffFormulaTex: 'f_c = R / (2π · L)',
    schematicNote: 'L nối tiếp tín hiệu, R nối từ ngõ ra xuống đất.',
  },
  {
    id: 'rl-hpf',
    shortLabel: 'RL HPF',
    fullLabel: 'RL High-Pass (1st order)',
    vietnameseName: 'Thông cao RL bậc 1',
    order: 1,
    fields: ['R', 'L'],
    formulaTex: 'H(s) = sL / (R + sL)',
    cutoffFormulaTex: 'f_c = R / (2π · L)',
    schematicNote: 'R nối tiếp tín hiệu, L nối từ ngõ ra xuống đất.',
  },
  {
    id: 'rlc-bp',
    shortLabel: 'RLC BP',
    fullLabel: 'RLC Band-Pass (series, 2nd order)',
    vietnameseName: 'Thông dải RLC nối tiếp',
    order: 2,
    fields: ['R', 'L', 'C'],
    formulaTex: 'H(s) = (s·ω₀/Q) / (s² + s·ω₀/Q + ω₀²)',
    cutoffFormulaTex: 'f₀ = 1 / (2π·√(LC)),  Q = (1/R)·√(L/C)',
    schematicNote: 'R, L, C nối tiếp; ngõ ra lấy trên R.',
  },
  {
    id: 'sk-lpf',
    shortLabel: 'Sallen-Key LPF',
    fullLabel: 'Sallen-Key LPF (equal R, equal C)',
    vietnameseName: 'Sallen-Key thông thấp bậc 2',
    order: 2,
    fields: ['R', 'C', 'Q'],
    formulaTex: 'H(s) = K / (s²/ω₀² + s/(Q·ω₀) + 1)',
    cutoffFormulaTex: 'f₀ = 1/(2π·R·C),  Q = 1/(3 - K)',
    schematicNote: 'Op-amp non-inverting, 2 R bằng nhau, 2 C bằng nhau, gain K = 1 + Ra/Rb.',
  },
]

const DEFAULT_INPUTS: Record<FilterTopology, PerTopologyInputs> = {
  'rc-lpf': { R: '10k', C: '100n', L: '', Q: '' },
  'rc-hpf': { R: '10k', C: '100n', L: '', Q: '' },
  'rl-lpf': { R: '100', C: '', L: '1m', Q: '' },
  'rl-hpf': { R: '100', C: '', L: '1m', Q: '' },
  'rlc-bp': { R: '10', C: '100n', L: '100u', Q: '' },
  'sk-lpf': { R: '10k', C: '10n', L: '', Q: '0.7071' },
}

const Q_PRESETS: ReadonlyArray<{ label: string; value: string; note: string }> = [
  { label: 'Butterworth', value: '0.7071', note: 'Maximally flat passband (Q = 1/√2)' },
  { label: 'Bessel', value: '0.5774', note: 'Maximally flat group delay (Q = 1/√3)' },
  { label: 'Critically damped', value: '0.5', note: 'Q = 0.5 — không vọt lố' },
]

const E_SERIES: ReadonlyArray<ESeriesName> = ['E12', 'E24']

const activeTopology = useLocalStorage<FilterTopology>(
  'electronic-filter-designer:topology',
  'rc-lpf',
)

const inputs = useLocalStorage<Record<FilterTopology, PerTopologyInputs>>(
  'electronic-filter-designer:inputs',
  structuredClone(DEFAULT_INPUTS),
  { mergeDefaults: true },
)

const targetFc = useLocalStorage<string>('electronic-filter-designer:target-fc', '1k')
const eSeriesChoice = useLocalStorage<ESeriesName>('electronic-filter-designer:e-series', 'E24')

const FALLBACK_TOPOLOGY: TopologyInfo = TOPOLOGIES[0] ?? {
  id: 'rc-lpf',
  shortLabel: 'RC LPF',
  fullLabel: 'RC Low-Pass (1st order)',
  vietnameseName: 'Thông thấp RC bậc 1',
  order: 1,
  fields: ['R', 'C'],
  formulaTex: 'H(s) = 1 / (1 + sRC)',
  cutoffFormulaTex: 'f_c = 1 / (2π · R · C)',
  schematicNote: 'R nối tiếp tín hiệu, C nối từ ngõ ra xuống đất.',
}

function getDefaults(t: FilterTopology): PerTopologyInputs {
  const v = DEFAULT_INPUTS[t]
  return v === undefined ? { R: '', C: '', L: '', Q: '' } : { ...v }
}

const activeInfo = computed<TopologyInfo>(() => {
  const found = TOPOLOGIES.find((t) => t.id === activeTopology.value)
  return found === undefined ? FALLBACK_TOPOLOGY : found
})

function ensureTopologyInputs(topology: FilterTopology) {
  if (inputs.value[topology] !== undefined) return
  inputs.value = {
    ...inputs.value,
    [topology]: getDefaults(topology),
  }
}

ensureTopologyInputs(activeTopology.value)

const activeInputs = computed<PerTopologyInputs>(() => {
  const stored = inputs.value[activeTopology.value]
  return stored ?? getDefaults(activeTopology.value)
})

const parsedParams = computed<FilterParams>(() => {
  const r = parseSiNumber(activeInputs.value.R)
  const c = parseSiNumber(activeInputs.value.C)
  const l = parseSiNumber(activeInputs.value.L)
  const q = parseSiNumber(activeInputs.value.Q)
  return {
    R: r ?? Number.NaN,
    C: c ?? Number.NaN,
    L: l ?? Number.NaN,
    Q: q ?? Number.NaN,
  }
})

const filterResult = computed(() => buildFilter(activeTopology.value, parsedParams.value))

function unitOf(field: ComponentField): string {
  switch (field) {
    case 'R':
      return 'Ω'
    case 'C':
      return 'F'
    case 'L':
      return 'H'
    case 'Q':
      return ''
  }
}

function labelOf(field: ComponentField): string {
  switch (field) {
    case 'R':
      return 'Điện trở R'
    case 'C':
      return 'Tụ C'
    case 'L':
      return 'Cuộn cảm L'
    case 'Q':
      return 'Quality factor Q'
  }
}

function placeholderOf(field: ComponentField): string {
  switch (field) {
    case 'R':
      return 'ví dụ: 10k, 4.7k, 100Ω'
    case 'C':
      return 'ví dụ: 100n, 2.2u, 47p'
    case 'L':
      return 'ví dụ: 1m, 100u, 47n'
    case 'Q':
      return 'ví dụ: 0.7071'
  }
}

function setQuickQ(value: string) {
  inputs.value[activeTopology.value] = {
    ...activeInputs.value,
    Q: value,
  }
}

function selectTopology(id: FilterTopology) {
  ensureTopologyInputs(id)
  activeTopology.value = id
}

const formattedParsed = computed(() => {
  const p = parsedParams.value
  return {
    R: Number.isFinite(p.R) ? formatSiValue(p.R, 'Ω', 4) : '—',
    C: Number.isFinite(p.C) ? formatSiValue(p.C, 'F', 4) : '—',
    L: Number.isFinite(p.L) ? formatSiValue(p.L, 'H', 4) : '—',
    Q: Number.isFinite(p.Q) ? p.Q.toFixed(4) : '—',
  }
})

const inverseHint = computed(() => {
  const target = parseSiNumber(targetFc.value)
  if (target === null || target <= 0) return null
  const topology = activeTopology.value

  const params = parsedParams.value
  // Pick the larger of R/L/C as the "given" side, derive the other.
  if (topology === 'rc-lpf' || topology === 'rc-hpf' || topology === 'sk-lpf') {
    if (Number.isFinite(params.R) && params.R > 0) {
      const other = solveSecondComponent(topology, { name: 'R', value: params.R }, target)
      if (other === null) return null
      const snapped = nearestESeriesValue(other.value, eSeriesChoice.value)
      return {
        givenName: 'R',
        givenValue: formatSiValue(params.R, 'Ω', 3),
        deriveName: other.name,
        ideal: formatSiValue(other.value, unitOf(other.name), 4),
        snapped: formatSiValue(snapped, unitOf(other.name), 3),
        errorPct: eSeriesErrorPercent(other.value, snapped),
      }
    }
  }

  if (topology === 'rl-lpf' || topology === 'rl-hpf') {
    if (Number.isFinite(params.R) && params.R > 0) {
      const other = solveSecondComponent(topology, { name: 'R', value: params.R }, target)
      if (other === null) return null
      const snapped = nearestESeriesValue(other.value, eSeriesChoice.value)
      return {
        givenName: 'R',
        givenValue: formatSiValue(params.R, 'Ω', 3),
        deriveName: other.name,
        ideal: formatSiValue(other.value, unitOf(other.name), 4),
        snapped: formatSiValue(snapped, unitOf(other.name), 3),
        errorPct: eSeriesErrorPercent(other.value, snapped),
      }
    }
  }
  return null
})

// Reset to topology defaults
function resetTopology() {
  inputs.value[activeTopology.value] = getDefaults(activeTopology.value)
}

const dirtyError = ref<string | null>(null)
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body">
    <div class="mx-auto max-w-5xl px-6 py-12">
      <div class="mb-6 flex items-start justify-between gap-3 animate-fade-up">
        <a
          href="https://www.facebook.com/vnmh.mta/"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-2 text-sm text-text-secondary transition hover:text-text-primary"
        >
          <span class="text-accent-coral font-display text-xs tracking-widest">//</span>
          by Vu Nguyen Minh Hung
        </a>
        <RouterLink
          to="/"
          class="inline-flex items-center gap-2 border border-border-default bg-bg-surface px-3 py-1.5 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
        >
          <Icon icon="lucide:house" class="size-4" />
          Về trang chủ
        </RouterLink>
      </div>

      <!-- Header -->
      <header class="animate-fade-up">
        <div class="font-display text-xs tracking-widest text-accent-coral mb-3">
          // ELECTRONIC FILTER DESIGNER
        </div>
        <h1 class="font-display text-4xl md:text-5xl font-bold tracking-tight">
          Electronic Filter Designer
        </h1>
        <p class="mt-3 text-text-secondary text-base max-w-2xl">
          Thiết kế mạch lọc RC / RL / RLC / Sallen-Key bậc 2 và xem Bode plot biên độ + pha trực
          tiếp. Công thức lấy từ giáo trình (Sedra-Smith, TI SBOA055A) — không có hằng số tự bịa.
        </p>
      </header>

      <!-- Topology picker -->
      <h2
        class="font-display text-2xl font-semibold text-text-primary mt-12 mb-6 flex items-center gap-3 animate-fade-up animate-delay-2"
      >
        <span class="text-accent-coral font-display text-sm tracking-widest">//</span>
        Chọn topology
      </h2>
      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 animate-fade-up animate-delay-2">
        <button
          v-for="topo in TOPOLOGIES"
          :key="topo.id"
          type="button"
          class="text-left border bg-bg-surface p-4 transition-all duration-200 hover:-translate-y-0.5 hover:bg-bg-elevated"
          :class="
            topo.id === activeTopology
              ? 'border-accent-coral'
              : 'border-border-default hover:border-accent-coral'
          "
          @click="selectTopology(topo.id)"
        >
          <div class="flex items-center justify-between">
            <span class="font-display font-semibold text-base text-text-primary">
              {{ topo.shortLabel }}
            </span>
            <span
              class="font-display text-xs tracking-widest"
              :class="topo.order === 1 ? 'text-accent-sky' : 'text-accent-amber'"
            >
              {{ topo.order === 1 ? '1st' : '2nd' }}
            </span>
          </div>
          <div class="mt-1 text-xs text-text-secondary">
            {{ topo.vietnameseName }}
          </div>
        </button>
      </div>

      <FilterSchematic
        :topology="activeTopology"
        :title="activeInfo.fullLabel"
        :note="activeInfo.schematicNote"
        class="mt-8"
      />

      <!-- Parameter inputs -->
      <h2
        class="font-display text-2xl font-semibold text-text-primary mt-12 mb-6 flex items-center gap-3 animate-fade-up animate-delay-3"
      >
        <span class="text-accent-coral font-display text-sm tracking-widest">//</span>
        Thông số linh kiện
      </h2>

      <div class="border border-border-default bg-bg-surface p-6 animate-fade-up animate-delay-3">
        <div class="text-sm text-text-secondary mb-4">
          {{ activeInfo.fullLabel }} — {{ activeInfo.schematicNote }}
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div v-for="field in activeInfo.fields" :key="field">
            <label class="block text-xs font-display tracking-widest text-text-dim mb-1">
              {{ labelOf(field) }} ({{ field }})
            </label>
            <input
              v-model="activeInputs[field]"
              type="text"
              inputmode="text"
              class="w-full bg-bg-deep border border-border-default px-3 py-2 text-text-primary outline-none transition focus:border-accent-coral font-mono"
              :placeholder="placeholderOf(field)"
            />
            <div class="mt-1 text-xs text-text-dim">= {{ formattedParsed[field] }}</div>
          </div>
        </div>

        <div
          v-if="activeInfo.fields.includes('Q')"
          class="mt-5 pt-5 border-t border-border-default"
        >
          <div class="text-xs font-display tracking-widest text-text-dim mb-2">
            Q presets (Sallen-Key 2nd-order)
          </div>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="preset in Q_PRESETS"
              :key="preset.label"
              type="button"
              class="border border-border-default bg-bg-deep px-3 py-1.5 text-xs font-display tracking-wide text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
              :title="preset.note"
              @click="setQuickQ(preset.value)"
            >
              {{ preset.label }} (Q = {{ preset.value }})
            </button>
          </div>
        </div>

        <div class="mt-5 flex items-center justify-end">
          <button
            type="button"
            class="inline-flex items-center gap-2 border border-border-default bg-bg-deep px-3 py-1.5 text-xs font-display tracking-wide text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
            @click="resetTopology"
          >
            <Icon icon="lucide:rotate-ccw" class="size-3.5" />
            Reset
          </button>
        </div>
      </div>

      <!-- Result -->
      <h2
        class="font-display text-2xl font-semibold text-text-primary mt-12 mb-6 flex items-center gap-3 animate-fade-up animate-delay-4"
      >
        <span class="text-accent-amber font-display text-sm tracking-widest">//</span>
        Kết quả
      </h2>

      <div class="animate-fade-up animate-delay-4">
        <div v-if="filterResult.ok" class="grid gap-4 sm:grid-cols-3 mb-6">
          <div class="border border-border-default bg-bg-surface p-4">
            <div class="text-xs font-display tracking-widest text-text-dim">
              {{ activeInfo.order === 2 ? 'f₀ (resonant)' : 'f_c (-3 dB)' }}
            </div>
            <div class="font-display text-2xl text-accent-coral mt-1">
              {{ formatFrequency(filterResult.description.fc, 4) }}
            </div>
          </div>
          <div
            v-if="filterResult.description.q !== null"
            class="border border-border-default bg-bg-surface p-4"
          >
            <div class="text-xs font-display tracking-widest text-text-dim">Quality factor Q</div>
            <div class="font-display text-2xl text-accent-amber mt-1">
              {{ filterResult.description.q.toFixed(3) }}
            </div>
          </div>
          <div
            v-if="filterResult.description.extras.K !== undefined"
            class="border border-border-default bg-bg-surface p-4"
          >
            <div class="text-xs font-display tracking-widest text-text-dim">Op-amp gain K</div>
            <div class="font-display text-2xl text-accent-sky mt-1">
              {{ filterResult.description.extras.K.toFixed(3) }}
              <span class="text-text-dim text-sm ml-2">
                ({{ (20 * Math.log10(filterResult.description.extras.K)).toFixed(2) }} dB)
              </span>
            </div>
          </div>
        </div>

        <div
          v-else
          class="border border-accent-coral/40 bg-bg-surface p-4 mb-6 text-sm text-accent-coral font-display"
        >
          <Icon icon="lucide:triangle-alert" class="inline-block size-4 mr-1 align-text-bottom" />
          {{ filterResult.error }}
        </div>

        <BodePlot v-if="filterResult.ok" :filter="filterResult.description" />
      </div>

      <!-- Inverse design hint -->
      <h2
        class="font-display text-2xl font-semibold text-text-primary mt-12 mb-6 flex items-center gap-3 animate-fade-up animate-delay-5"
      >
        <span class="text-accent-sky font-display text-sm tracking-widest">//</span>
        Gợi ý theo tần số mục tiêu
      </h2>

      <div class="border border-border-default bg-bg-surface p-6 animate-fade-up animate-delay-5">
        <div class="text-sm text-text-secondary mb-4">
          Cố định một linh kiện hiện tại, nhập tần số mục tiêu, tool sẽ tính linh kiện còn lại và
          snap về giá trị E12 / E24 gần nhất. (Chỉ áp dụng cho topology bậc 1 và Sallen-Key.)
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label class="block text-xs font-display tracking-widest text-text-dim mb-1">
              Target frequency
            </label>
            <input
              v-model="targetFc"
              type="text"
              class="w-full bg-bg-deep border border-border-default px-3 py-2 text-text-primary outline-none transition focus:border-accent-coral font-mono"
              placeholder="ví dụ: 1k, 10k, 100"
            />
          </div>
          <div>
            <label class="block text-xs font-display tracking-widest text-text-dim mb-1">
              Bộ giá trị chuẩn
            </label>
            <div class="flex gap-2">
              <button
                v-for="series in E_SERIES"
                :key="series"
                type="button"
                class="flex-1 border bg-bg-deep px-3 py-2 text-sm font-display tracking-wide transition"
                :class="
                  series === eSeriesChoice
                    ? 'border-accent-coral text-text-primary'
                    : 'border-border-default text-text-secondary hover:border-accent-coral'
                "
                @click="eSeriesChoice = series"
              >
                {{ series }}
              </button>
            </div>
          </div>
        </div>

        <div v-if="inverseHint !== null" class="mt-5 pt-5 border-t border-border-default text-sm">
          <div class="text-text-secondary">
            Với
            <span class="text-text-primary font-mono"
              >{{ inverseHint.givenName }} = {{ inverseHint.givenValue }}</span
            >
            và target
            <span class="text-text-primary font-mono"
              >f = {{ formatFrequency(parseSiNumber(targetFc) ?? 0, 4) }}</span
            >:
          </div>
          <div class="mt-2 grid gap-2 sm:grid-cols-2">
            <div>
              <span class="text-text-dim text-xs font-display tracking-widest">Lý tưởng</span>
              <div class="font-mono text-text-primary">
                {{ inverseHint.deriveName }} = {{ inverseHint.ideal }}
              </div>
            </div>
            <div>
              <span class="text-text-dim text-xs font-display tracking-widest">
                {{ eSeriesChoice }} gần nhất
              </span>
              <div class="font-mono text-accent-amber">
                {{ inverseHint.deriveName }} ≈ {{ inverseHint.snapped }}
                <span class="text-text-dim text-xs ml-1">
                  ({{ inverseHint.errorPct.toFixed(2) }} %)
                </span>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="mt-5 text-xs text-text-dim">
          Topology hiện tại chưa hỗ trợ (RLC band-pass cần thêm ràng buộc Q).
        </div>
      </div>

      <!-- Formula reference -->
      <h2
        class="font-display text-2xl font-semibold text-text-primary mt-12 mb-6 flex items-center gap-3 animate-fade-up animate-delay-6"
      >
        <span class="text-accent-amber font-display text-sm tracking-widest">//</span>
        Công thức tham chiếu
      </h2>

      <div
        class="border border-border-default bg-bg-surface p-6 animate-fade-up animate-delay-6 font-mono text-sm leading-relaxed"
      >
        <div class="text-text-secondary mb-2">
          <span class="text-text-dim">Transfer function:</span>
          <span class="text-text-primary ml-2">{{ activeInfo.formulaTex }}</span>
        </div>
        <div class="text-text-secondary mb-2">
          <span class="text-text-dim">Characteristic frequency:</span>
          <span class="text-text-primary ml-2">{{ activeInfo.cutoffFormulaTex }}</span>
        </div>
        <div v-if="activeTopology === 'sk-lpf'" class="text-text-secondary text-xs mt-3">
          <span class="text-text-dim">Lưu ý:</span>
          K = 3 - 1/Q phải nằm trong (0, 3) để mạch ổn định. Q càng cao ⇒ K càng gần 3 ⇒ rất nhạy
          với sai số linh kiện và open-loop gain của op-amp.
        </div>
        <div v-if="activeTopology === 'rlc-bp'" class="text-text-secondary text-xs mt-3">
          <span class="text-text-dim">Lưu ý:</span>
          Mô hình lý tưởng (R, L, C không tổn hao trừ R). Cuộn cảm thực luôn có ESR và
          self-resonance, kéo Q thực thấp hơn giá trị tính.
        </div>
      </div>

      <!-- Hidden error for future use -->
      <div v-if="dirtyError !== null" class="hidden">{{ dirtyError }}</div>

      <!-- Footer -->
      <footer
        class="mt-16 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-t border-border-default pt-6 text-text-secondary text-sm animate-fade-up animate-delay-7"
      >
        <span class="font-display text-xs tracking-widest text-text-dim">
          VOL.01 / 2026 · J2TEAM Vibe
        </span>
      </footer>
    </div>
  </div>
</template>
