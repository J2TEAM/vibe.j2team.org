<script setup lang="ts">
import { computed, ref } from 'vue'
import { Icon } from '@iconify/vue'
import { RouterLink } from 'vue-router'

type MainTab = 'resistor-band' | 'resistor-smd' | 'capacitor-smd'
type BandMode = '4' | '5' | '6'

interface ColorBandOption {
  key: string
  label: string
  value?: number
  multiplier?: number
  tolerance?: string
  tempco?: string
  swatchClass: string
  textClass: string
}

const activeTab = ref<MainTab>('resistor-band')
const resistorBandMode = ref<BandMode>('4')

const resistorDigitColors: ColorBandOption[] = [
  {
    key: 'black',
    label: 'Đen',
    value: 0,
    multiplier: 1,
    swatchClass: 'bg-black',
    textClass: 'text-white',
  },
  {
    key: 'brown',
    label: 'Nâu',
    value: 1,
    multiplier: 10,
    tolerance: '±1%',
    tempco: '100 ppm/°C',
    swatchClass: 'bg-amber-900',
    textClass: 'text-white',
  },
  {
    key: 'red',
    label: 'Đỏ',
    value: 2,
    multiplier: 100,
    tolerance: '±2%',
    tempco: '50 ppm/°C',
    swatchClass: 'bg-red-500',
    textClass: 'text-white',
  },
  {
    key: 'orange',
    label: 'Cam',
    value: 3,
    multiplier: 1_000,
    tempco: '15 ppm/°C',
    swatchClass: 'bg-orange-500',
    textClass: 'text-white',
  },
  {
    key: 'yellow',
    label: 'Vàng',
    value: 4,
    multiplier: 10_000,
    tempco: '25 ppm/°C',
    swatchClass: 'bg-yellow-400',
    textClass: 'text-black',
  },
  {
    key: 'green',
    label: 'Lục',
    value: 5,
    multiplier: 100_000,
    tolerance: '±0.5%',
    swatchClass: 'bg-green-500',
    textClass: 'text-white',
  },
  {
    key: 'blue',
    label: 'Lam',
    value: 6,
    multiplier: 1_000_000,
    tolerance: '±0.25%',
    tempco: '10 ppm/°C',
    swatchClass: 'bg-blue-500',
    textClass: 'text-white',
  },
  {
    key: 'violet',
    label: 'Tím',
    value: 7,
    multiplier: 10_000_000,
    tolerance: '±0.1%',
    tempco: '5 ppm/°C',
    swatchClass: 'bg-violet-500',
    textClass: 'text-white',
  },
  {
    key: 'gray',
    label: 'Xám',
    value: 8,
    multiplier: 100_000_000,
    tolerance: '±0.05%',
    swatchClass: 'bg-gray-400',
    textClass: 'text-black',
  },
  {
    key: 'white',
    label: 'Trắng',
    value: 9,
    multiplier: 1_000_000_000,
    swatchClass: 'bg-white',
    textClass: 'text-black',
  },
]

const resistorMultiplierColors: ColorBandOption[] = [
  {
    key: 'silver',
    label: 'Bạc',
    multiplier: 0.01,
    swatchClass: 'bg-slate-300',
    textClass: 'text-black',
  },
  {
    key: 'gold',
    label: 'Vàng kim',
    multiplier: 0.1,
    swatchClass: 'bg-yellow-600',
    textClass: 'text-white',
  },
  ...resistorDigitColors,
]

const resistorToleranceColors: ColorBandOption[] = [
  {
    key: 'brown',
    label: 'Nâu',
    tolerance: '±1%',
    swatchClass: 'bg-amber-900',
    textClass: 'text-white',
  },
  { key: 'red', label: 'Đỏ', tolerance: '±2%', swatchClass: 'bg-red-500', textClass: 'text-white' },
  {
    key: 'green',
    label: 'Lục',
    tolerance: '±0.5%',
    swatchClass: 'bg-green-500',
    textClass: 'text-white',
  },
  {
    key: 'blue',
    label: 'Lam',
    tolerance: '±0.25%',
    swatchClass: 'bg-blue-500',
    textClass: 'text-white',
  },
  {
    key: 'violet',
    label: 'Tím',
    tolerance: '±0.1%',
    swatchClass: 'bg-violet-500',
    textClass: 'text-white',
  },
  {
    key: 'gray',
    label: 'Xám',
    tolerance: '±0.05%',
    swatchClass: 'bg-gray-400',
    textClass: 'text-black',
  },
  {
    key: 'gold',
    label: 'Vàng kim',
    tolerance: '±5%',
    swatchClass: 'bg-yellow-600',
    textClass: 'text-white',
  },
  {
    key: 'silver',
    label: 'Bạc',
    tolerance: '±10%',
    swatchClass: 'bg-slate-300',
    textClass: 'text-black',
  },
  {
    key: 'none',
    label: 'Không có',
    tolerance: '±20%',
    swatchClass: 'bg-transparent border border-dashed border-text-dim',
    textClass: 'text-text-secondary',
  },
]

const resistorTempcoColors: ColorBandOption[] = [
  {
    key: 'brown',
    label: 'Nâu',
    tempco: '100 ppm/°C',
    swatchClass: 'bg-amber-900',
    textClass: 'text-white',
  },
  {
    key: 'red',
    label: 'Đỏ',
    tempco: '50 ppm/°C',
    swatchClass: 'bg-red-500',
    textClass: 'text-white',
  },
  {
    key: 'orange',
    label: 'Cam',
    tempco: '15 ppm/°C',
    swatchClass: 'bg-orange-500',
    textClass: 'text-white',
  },
  {
    key: 'yellow',
    label: 'Vàng',
    tempco: '25 ppm/°C',
    swatchClass: 'bg-yellow-400',
    textClass: 'text-black',
  },
  {
    key: 'blue',
    label: 'Lam',
    tempco: '10 ppm/°C',
    swatchClass: 'bg-blue-500',
    textClass: 'text-white',
  },
  {
    key: 'violet',
    label: 'Tím',
    tempco: '5 ppm/°C',
    swatchClass: 'bg-violet-500',
    textClass: 'text-white',
  },
]

const selectedBand1 = ref('yellow')
const selectedBand2 = ref('violet')
const selectedBand3 = ref('black')
const selectedBand4 = ref('gold')
const selectedBand5 = ref('brown')
const selectedBand6 = ref('brown')

const resistorSmdCode = ref('472')
const capacitorSmdCode = ref('104')

const eia96BaseMap: Record<string, number> = {
  '01': 100,
  '02': 102,
  '03': 105,
  '04': 107,
  '05': 110,
  '06': 113,
  '07': 115,
  '08': 118,
  '09': 121,
  '10': 124,
  '11': 127,
  '12': 130,
  '13': 133,
  '14': 137,
  '15': 140,
  '16': 143,
  '17': 147,
  '18': 150,
  '19': 154,
  '20': 158,
  '21': 162,
  '22': 165,
  '23': 169,
  '24': 174,
  '25': 178,
  '26': 182,
  '27': 187,
  '28': 191,
  '29': 196,
  '30': 200,
  '31': 205,
  '32': 210,
  '33': 215,
  '34': 221,
  '35': 226,
  '36': 232,
  '37': 237,
  '38': 243,
  '39': 249,
  '40': 255,
  '41': 261,
  '42': 267,
  '43': 274,
  '44': 280,
  '45': 287,
  '46': 294,
  '47': 301,
  '48': 309,
  '49': 316,
  '50': 324,
  '51': 332,
  '52': 340,
  '53': 348,
  '54': 357,
  '55': 365,
  '56': 374,
  '57': 383,
  '58': 392,
  '59': 402,
  '60': 412,
  '61': 422,
  '62': 432,
  '63': 442,
  '64': 453,
  '65': 464,
  '66': 475,
  '67': 487,
  '68': 499,
  '69': 511,
  '70': 523,
  '71': 536,
  '72': 549,
  '73': 562,
  '74': 576,
  '75': 590,
  '76': 604,
  '77': 619,
  '78': 634,
  '79': 649,
  '80': 665,
  '81': 681,
  '82': 698,
  '83': 715,
  '84': 732,
  '85': 750,
  '86': 768,
  '87': 787,
  '88': 806,
  '89': 825,
  '90': 845,
  '91': 866,
  '92': 887,
  '93': 909,
  '94': 931,
  '95': 953,
  '96': 976,
}

const eia96MultiplierMap: Record<string, number> = {
  Z: 0.001,
  Y: 0.01,
  X: 0.1,
  A: 1,
  B: 10,
  C: 100,
  D: 1000,
  E: 10000,
  F: 100000,
}

function getBandOption(options: ColorBandOption[], key: string): ColorBandOption | undefined {
  return options.find((option) => option.key === key)
}

function formatOhm(value: number): string {
  if (value >= 1_000_000_000) return `${stripZero(value / 1_000_000_000)} GΩ`
  if (value >= 1_000_000) return `${stripZero(value / 1_000_000)} MΩ`
  if (value >= 1_000) return `${stripZero(value / 1_000)} kΩ`
  if (value >= 1) return `${stripZero(value)} Ω`
  if (value >= 0.001) return `${stripZero(value * 1_000)} mΩ`
  return `${value} Ω`
}

function formatCapacitanceFromPf(valuePf: number): string {
  if (valuePf >= 1_000_000) return `${stripZero(valuePf / 1_000_000)} µF`
  if (valuePf >= 1_000) return `${stripZero(valuePf / 1_000)} nF`
  return `${stripZero(valuePf)} pF`
}

function stripZero(value: number): string {
  return Number(value.toFixed(6)).toString()
}

const resistorBandResult = computed(() => {
  const band1 = getBandOption(resistorDigitColors, selectedBand1.value)
  const band2 = getBandOption(resistorDigitColors, selectedBand2.value)
  const band3 = getBandOption(resistorDigitColors, selectedBand3.value)
  const multiplier = getBandOption(resistorMultiplierColors, selectedBand4.value)
  const tolerance = getBandOption(resistorToleranceColors, selectedBand5.value)
  const tempco = getBandOption(resistorTempcoColors, selectedBand6.value)

  if (!band1 || !band2) {
    return {
      rawValue: 0,
      display: '—',
      tolerance: '—',
      tempco: '',
      formula: '—',
    }
  }

  if (resistorBandMode.value === '4') {
    const multiplier4 = getBandOption(resistorMultiplierColors, selectedBand3.value)
    const tolerance4 = getBandOption(resistorToleranceColors, selectedBand4.value)
    const rawValue = ((band1.value ?? 0) * 10 + (band2.value ?? 0)) * (multiplier4?.multiplier ?? 1)

    return {
      rawValue,
      display: formatOhm(rawValue),
      tolerance: tolerance4?.tolerance ?? '—',
      tempco: '',
      formula: `(${band1.value}${band2.value}) × ${multiplier4?.multiplier ?? 1}`,
    }
  }

  if (!band3 || !multiplier) {
    return {
      rawValue: 0,
      display: '—',
      tolerance: '—',
      tempco: '',
      formula: '—',
    }
  }

  const significant = (band1.value ?? 0) * 100 + (band2.value ?? 0) * 10 + (band3.value ?? 0)
  const rawValue = significant * (multiplier.multiplier ?? 1)

  return {
    rawValue,
    display: formatOhm(rawValue),
    tolerance: tolerance?.tolerance ?? '—',
    tempco: resistorBandMode.value === '6' ? (tempco?.tempco ?? '—') : '',
    formula: `(${band1.value}${band2.value}${band3.value}) × ${multiplier.multiplier ?? 1}`,
  }
})

const resistorBodyBands = computed(() => {
  if (resistorBandMode.value === '4') {
    return [selectedBand1.value, selectedBand2.value, selectedBand3.value, selectedBand4.value]
  }

  if (resistorBandMode.value === '5') {
    return [
      selectedBand1.value,
      selectedBand2.value,
      selectedBand3.value,
      selectedBand4.value,
      selectedBand5.value,
    ]
  }

  return [
    selectedBand1.value,
    selectedBand2.value,
    selectedBand3.value,
    selectedBand4.value,
    selectedBand5.value,
    selectedBand6.value,
  ]
})

function decodeResistorSmd(code: string): {
  normalized: string
  type: string
  value: string
  formula: string
  note: string
} {
  const normalized = code.trim().toUpperCase()

  if (!normalized) {
    return {
      normalized: '',
      type: '—',
      value: '—',
      formula: '—',
      note: 'Nhập mã điện trở SMD để giải mã',
    }
  }

  if (/^\dR\d$|^R\d+$|^\d+R\d+$|^\dR$|^0R0$/i.test(normalized)) {
    const ohmValue = Number(normalized.replace('R', '.'))
    return {
      normalized,
      type: 'R notation',
      value: formatOhm(ohmValue),
      formula: `${normalized.replace('R', '.')} Ω`,
      note: 'Chữ R đóng vai trò là dấu thập phân',
    }
  }

  if (/^\d{3}$/.test(normalized)) {
    const base = Number(normalized.slice(0, 2))
    const multiplier = Number(normalized[2])
    const rawValue = base * 10 ** multiplier
    return {
      normalized,
      type: '3 digit',
      value: formatOhm(rawValue),
      formula: `${base} × 10^${multiplier}`,
      note: '2 số đầu là trị số có nghĩa, số cuối là bậc nhân',
    }
  }

  if (/^\d{4}$/.test(normalized)) {
    const base = Number(normalized.slice(0, 3))
    const multiplier = Number(normalized[3])
    const rawValue = base * 10 ** multiplier
    return {
      normalized,
      type: '4 digit',
      value: formatOhm(rawValue),
      formula: `${base} × 10^${multiplier}`,
      note: 'Mã chính xác hơn, thường dùng cho resistor tolerance thấp',
    }
  }

  if (/^\d{2}[A-Z]$/.test(normalized)) {
    const baseCode = normalized.slice(0, 2)
    const multiplierCode = normalized.charAt(2)

    const base = eia96BaseMap[baseCode]
    const multiplier = eia96MultiplierMap[multiplierCode]

    if (base !== undefined && multiplier !== undefined) {
      const rawValue = base * multiplier
      return {
        normalized,
        type: 'EIA-96',
        value: formatOhm(rawValue),
        formula: `${base} × ${multiplier}`,
        note: 'Mã điện trở SMD 1% theo chuẩn EIA-96',
      }
    }
  }

  return {
    normalized,
    type: 'Không xác định',
    value: 'Không hỗ trợ',
    formula: '—',
    note: 'Hãy kiểm tra lại mã hoặc bổ sung quy tắc giải mã',
  }
}

function decodeCapacitorSmd(code: string): {
  normalized: string
  type: string
  value: string
  formula: string
  note: string
} {
  const normalized = code.trim().toUpperCase()

  if (!normalized) {
    return {
      normalized: '',
      type: '—',
      value: '—',
      formula: '—',
      note: 'Nhập mã tụ điện SMD để giải mã',
    }
  }

  if (/^\d+R\d+$/.test(normalized)) {
    const valuePf = Number(normalized.replace('R', '.'))
    return {
      normalized,
      type: 'R notation',
      value: formatCapacitanceFromPf(valuePf),
      formula: `${normalized.replace('R', '.')} pF`,
      note: 'Chữ R đóng vai trò là dấu thập phân',
    }
  }

  if (/^\d{3}$/.test(normalized)) {
    const base = Number(normalized.slice(0, 2))
    const multiplier = Number(normalized[2])
    const valuePf = base * 10 ** multiplier
    return {
      normalized,
      type: '3 digit',
      value: formatCapacitanceFromPf(valuePf),
      formula: `${base} × 10^${multiplier} pF`,
      note: 'Đơn vị mặc định của mã tụ SMD là pF',
    }
  }

  return {
    normalized,
    type: 'Không xác định',
    value: 'Không hỗ trợ',
    formula: '—',
    note: 'Nhiều tụ SMD nhỏ không in mã, cần BOM hoặc LCR meter để xác định',
  }
}

const resistorSmdResult = computed(() => decodeResistorSmd(resistorSmdCode.value))
const capacitorSmdResult = computed(() => decodeCapacitorSmd(capacitorSmdCode.value))

function getSwatchClass(colorKey: string): string {
  const option =
    getBandOption(resistorDigitColors, colorKey) ||
    getBandOption(resistorMultiplierColors, colorKey) ||
    getBandOption(resistorToleranceColors, colorKey) ||
    getBandOption(resistorTempcoColors, colorKey)

  return option?.swatchClass ?? 'bg-transparent border border-border-default'
}

function pickBand(target: 'b1' | 'b2' | 'b3' | 'b4' | 'b5' | 'b6', colorKey: string) {
  if (target === 'b1') selectedBand1.value = colorKey
  if (target === 'b2') selectedBand2.value = colorKey
  if (target === 'b3') selectedBand3.value = colorKey
  if (target === 'b4') selectedBand4.value = colorKey
  if (target === 'b5') selectedBand5.value = colorKey
  if (target === 'b6') selectedBand6.value = colorKey
}
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <header class="mb-12 text-center">
        <div
          class="inline-flex items-center gap-2 border border-border-default bg-bg-surface px-4 py-2 text-xs text-text-secondary"
        >
          <Icon icon="lucide:cpu" class="size-4 text-accent-coral" />

          Component Code Decoder by
          <a
            href="https://facebook.com/vnmh.mta"
            target="_blank"
            rel="noopener"
            class="text-accent-coral hover:underline"
          >
            Vu Nguyen Minh Hung
          </a>
        </div>

        <h1
          class="mt-6 font-display text-4xl min-[375px]:text-5xl sm:text-6xl font-bold text-accent-coral"
        >
          Resistor & Capacitor Decoder
        </h1>

        <p class="mt-4 text-text-secondary text-lg max-w-3xl mx-auto">
          Đọc nhanh giá trị điện trở vạch màu, điện trở SMD và tụ điện SMD trợ giúp cho kỹ sư điện -
          điện tử.
        </p>

        <p class="mt-3 text-text-dim text-sm">
          (Hỗ trợ 4/5/6 band, 3-digit, 4-digit, R notation và EIA-96)
        </p>

        <p class="mt-3 text-text-dim text-sm"></p>

        <div class="mb-6 flex items-center justify-between">
          <RouterLink
            to="/"
            class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border border-border-default rounded-lg bg-bg-elevated hover:border-accent-coral hover:text-accent-coral transition"
          >
            ← Back to Home
          </RouterLink>
        </div>
      </header>

      <section class="mb-10">
        <div
          class="border border-border-default bg-bg-surface p-2 grid grid-cols-1 sm:grid-cols-3 gap-2"
        >
          <button
            class="px-4 py-3 text-sm transition flex items-center justify-center gap-2 border"
            :class="
              activeTab === 'resistor-band'
                ? 'border-accent-coral bg-accent-coral/10 text-accent-coral'
                : 'border-border-default text-text-secondary hover:border-accent-coral hover:text-accent-coral'
            "
            @click="activeTab = 'resistor-band'"
          >
            <Icon icon="lucide:palette" class="size-4" />
            Điện trở vạch màu
          </button>

          <button
            class="px-4 py-3 text-sm transition flex items-center justify-center gap-2 border"
            :class="
              activeTab === 'resistor-smd'
                ? 'border-accent-amber bg-accent-amber/10 text-accent-amber'
                : 'border-border-default text-text-secondary hover:border-accent-amber hover:text-accent-amber'
            "
            @click="activeTab = 'resistor-smd'"
          >
            <Icon icon="lucide:scan-search" class="size-4" />
            Điện trở SMD
          </button>

          <button
            class="px-4 py-3 text-sm transition flex items-center justify-center gap-2 border"
            :class="
              activeTab === 'capacitor-smd'
                ? 'border-accent-sky bg-accent-sky/10 text-accent-sky'
                : 'border-border-default text-text-secondary hover:border-accent-sky hover:text-accent-sky'
            "
            @click="activeTab = 'capacitor-smd'"
          >
            <Icon icon="lucide:cable" class="size-4" />
            Tụ điện SMD
          </button>
        </div>
      </section>

      <section v-if="activeTab === 'resistor-band'" class="space-y-8">
        <div class="border border-border-default bg-bg-surface p-6">
          <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div>
              <h2 class="font-display text-2xl font-semibold flex items-center gap-3">
                <span class="text-accent-coral text-sm tracking-widest font-display">//</span>
                Điện trở vạch màu
              </h2>
              <p class="mt-2 text-sm text-text-secondary">
                Chọn 4, 5 hoặc 6 band rồi chọn màu từng vòng để tính nhanh giá trị điện trở.
              </p>
            </div>

            <div class="flex gap-2">
              <button
                class="border px-4 py-2 text-sm transition"
                :class="
                  resistorBandMode === '4'
                    ? 'border-accent-coral bg-accent-coral/10 text-accent-coral'
                    : 'border-border-default text-text-secondary hover:border-accent-coral hover:text-accent-coral'
                "
                @click="resistorBandMode = '4'"
              >
                4 band
              </button>
              <button
                class="border px-4 py-2 text-sm transition"
                :class="
                  resistorBandMode === '5'
                    ? 'border-accent-coral bg-accent-coral/10 text-accent-coral'
                    : 'border-border-default text-text-secondary hover:border-accent-coral hover:text-accent-coral'
                "
                @click="resistorBandMode = '5'"
              >
                5 band
              </button>
              <button
                class="border px-4 py-2 text-sm transition"
                :class="
                  resistorBandMode === '6'
                    ? 'border-accent-coral bg-accent-coral/10 text-accent-coral'
                    : 'border-border-default text-text-secondary hover:border-accent-coral hover:text-accent-coral'
                "
                @click="resistorBandMode = '6'"
              >
                6 band
              </button>
            </div>
          </div>

          <div class="border border-border-default bg-bg-elevated p-5 mb-6 overflow-x-auto">
            <div class="min-w-[520px] flex items-center gap-4">
              <div
                class="w-10 h-10 border border-border-default rotate-45 bg-bg-surface shrink-0"
              />
              <div
                class="flex-1 h-20 rounded-full bg-[#e9d5a1] relative border border-black/10 overflow-hidden"
              >
                <div
                  v-for="(band, index) in resistorBodyBands"
                  :key="`${band}-${index}`"
                  class="absolute top-0 h-full w-4 sm:w-5"
                  :class="getSwatchClass(band)"
                  :style="{
                    left: `${18 + index * (resistorBandMode === '4' ? 17 : resistorBandMode === '5' ? 14 : 12)}%`,
                  }"
                />
              </div>
              <div
                class="w-10 h-10 border border-border-default rotate-45 bg-bg-surface shrink-0"
              />
            </div>
          </div>

          <div class="grid grid-cols-1 xl:grid-cols-[1.4fr_1fr] gap-6">
            <div class="space-y-5">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="border border-border-default bg-bg-elevated p-4">
                  <label class="block text-text-dim text-xs mb-2">Band 1</label>
                  <select
                    v-model="selectedBand1"
                    class="w-full bg-bg-surface border border-border-default px-3 py-2 text-sm focus:border-accent-coral focus:outline-none"
                  >
                    <option
                      v-for="option in resistorDigitColors"
                      :key="option.key"
                      :value="option.key"
                    >
                      {{ option.label }}
                    </option>
                  </select>
                  <div class="mt-3 flex flex-wrap gap-2">
                    <button
                      v-for="option in resistorDigitColors"
                      :key="`b1-${option.key}`"
                      :class="[option.swatchClass, option.textClass]"
                      class="w-8 h-8 border border-white/10 text-[10px] font-bold"
                      :title="option.label"
                      @click="pickBand('b1', option.key)"
                    >
                      {{ option.value }}
                    </button>
                  </div>
                </div>

                <div class="border border-border-default bg-bg-elevated p-4">
                  <label class="block text-text-dim text-xs mb-2">Band 2</label>
                  <select
                    v-model="selectedBand2"
                    class="w-full bg-bg-surface border border-border-default px-3 py-2 text-sm focus:border-accent-coral focus:outline-none"
                  >
                    <option
                      v-for="option in resistorDigitColors"
                      :key="option.key"
                      :value="option.key"
                    >
                      {{ option.label }}
                    </option>
                  </select>
                  <div class="mt-3 flex flex-wrap gap-2">
                    <button
                      v-for="option in resistorDigitColors"
                      :key="`b2-${option.key}`"
                      :class="[option.swatchClass, option.textClass]"
                      class="w-8 h-8 border border-white/10 text-[10px] font-bold"
                      :title="option.label"
                      @click="pickBand('b2', option.key)"
                    >
                      {{ option.value }}
                    </button>
                  </div>
                </div>

                <div
                  v-if="resistorBandMode !== '4'"
                  class="border border-border-default bg-bg-elevated p-4"
                >
                  <label class="block text-text-dim text-xs mb-2">Band 3</label>
                  <select
                    v-model="selectedBand3"
                    class="w-full bg-bg-surface border border-border-default px-3 py-2 text-sm focus:border-accent-coral focus:outline-none"
                  >
                    <option
                      v-for="option in resistorDigitColors"
                      :key="option.key"
                      :value="option.key"
                    >
                      {{ option.label }}
                    </option>
                  </select>
                  <div class="mt-3 flex flex-wrap gap-2">
                    <button
                      v-for="option in resistorDigitColors"
                      :key="`b3-${option.key}`"
                      :class="[option.swatchClass, option.textClass]"
                      class="w-8 h-8 border border-white/10 text-[10px] font-bold"
                      :title="option.label"
                      @click="pickBand('b3', option.key)"
                    >
                      {{ option.value }}
                    </button>
                  </div>
                </div>

                <div class="border border-border-default bg-bg-elevated p-4">
                  <label class="block text-text-dim text-xs mb-2">
                    {{ resistorBandMode === '4' ? 'Multiplier (Band 3)' : 'Multiplier (Band 4)' }}
                  </label>

                  <select
                    v-if="resistorBandMode === '4'"
                    v-model="selectedBand3"
                    class="w-full bg-bg-surface border border-border-default px-3 py-2 text-sm focus:border-accent-coral focus:outline-none"
                  >
                    <option
                      v-for="option in resistorMultiplierColors"
                      :key="option.key"
                      :value="option.key"
                    >
                      {{ option.label }}
                    </option>
                  </select>

                  <select
                    v-else
                    v-model="selectedBand4"
                    class="w-full bg-bg-surface border border-border-default px-3 py-2 text-sm focus:border-accent-coral focus:outline-none"
                  >
                    <option
                      v-for="option in resistorMultiplierColors"
                      :key="option.key"
                      :value="option.key"
                    >
                      {{ option.label }}
                    </option>
                  </select>

                  <div class="mt-3 flex flex-wrap gap-2">
                    <button
                      v-for="option in resistorMultiplierColors"
                      :key="`mult-${option.key}`"
                      :class="[option.swatchClass, option.textClass]"
                      class="min-w-8 px-2 h-8 border border-white/10 text-[10px] font-bold"
                      :title="option.label"
                      @click="pickBand(resistorBandMode === '4' ? 'b3' : 'b4', option.key)"
                    >
                      ×{{ option.multiplier }}
                    </button>
                  </div>
                </div>

                <div class="border border-border-default bg-bg-elevated p-4">
                  <label class="block text-text-dim text-xs mb-2">
                    {{ resistorBandMode === '4' ? 'Tolerance (Band 4)' : 'Tolerance (Band 5)' }}
                  </label>

                  <select
                    v-if="resistorBandMode === '4'"
                    v-model="selectedBand4"
                    class="w-full bg-bg-surface border border-border-default px-3 py-2 text-sm focus:border-accent-coral focus:outline-none"
                  >
                    <option
                      v-for="option in resistorToleranceColors"
                      :key="option.key"
                      :value="option.key"
                    >
                      {{ option.label }}
                    </option>
                  </select>

                  <select
                    v-else
                    v-model="selectedBand5"
                    class="w-full bg-bg-surface border border-border-default px-3 py-2 text-sm focus:border-accent-coral focus:outline-none"
                  >
                    <option
                      v-for="option in resistorToleranceColors"
                      :key="option.key"
                      :value="option.key"
                    >
                      {{ option.label }}
                    </option>
                  </select>

                  <div class="mt-3 flex flex-wrap gap-2">
                    <button
                      v-for="option in resistorToleranceColors"
                      :key="`tol-${option.key}`"
                      :class="[option.swatchClass, option.textClass]"
                      class="min-w-8 px-2 h-8 border border-white/10 text-[10px] font-bold"
                      :title="option.label"
                      @click="pickBand(resistorBandMode === '4' ? 'b4' : 'b5', option.key)"
                    >
                      {{ option.tolerance }}
                    </button>
                  </div>
                </div>

                <div
                  v-if="resistorBandMode === '6'"
                  class="border border-border-default bg-bg-elevated p-4 md:col-span-2"
                >
                  <label class="block text-text-dim text-xs mb-2">Tempco (Band 6)</label>
                  <select
                    v-model="selectedBand6"
                    class="w-full bg-bg-surface border border-border-default px-3 py-2 text-sm focus:border-accent-coral focus:outline-none"
                  >
                    <option
                      v-for="option in resistorTempcoColors"
                      :key="option.key"
                      :value="option.key"
                    >
                      {{ option.label }}
                    </option>
                  </select>
                  <div class="mt-3 flex flex-wrap gap-2">
                    <button
                      v-for="option in resistorTempcoColors"
                      :key="`temp-${option.key}`"
                      :class="[option.swatchClass, option.textClass]"
                      class="min-w-8 px-2 h-8 border border-white/10 text-[10px] font-bold"
                      :title="option.label"
                      @click="pickBand('b6', option.key)"
                    >
                      {{ option.tempco }}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div class="space-y-4">
              <div class="border border-border-default bg-bg-elevated p-5">
                <div class="text-text-dim text-xs mb-2">Giá trị điện trở</div>
                <div
                  class="font-display text-4xl sm:text-5xl font-bold text-accent-coral break-words"
                >
                  {{ resistorBandResult.display }}
                </div>
                <div class="mt-4 grid grid-cols-1 gap-3 text-sm">
                  <div class="border border-border-default bg-bg-surface p-3">
                    <div class="text-text-dim text-xs mb-1">Tolerance</div>
                    <div class="font-mono text-text-primary">
                      {{ resistorBandResult.tolerance }}
                    </div>
                  </div>
                  <div
                    v-if="resistorBandMode === '6'"
                    class="border border-border-default bg-bg-surface p-3"
                  >
                    <div class="text-text-dim text-xs mb-1">Tempco</div>
                    <div class="font-mono text-text-primary">{{ resistorBandResult.tempco }}</div>
                  </div>
                  <div class="border border-border-default bg-bg-surface p-3">
                    <div class="text-text-dim text-xs mb-1">Công thức</div>
                    <div class="font-mono text-text-primary break-all">
                      {{ resistorBandResult.formula }}
                    </div>
                  </div>
                </div>
              </div>

              <div class="border border-border-default bg-bg-elevated p-5">
                <div class="text-text-dim text-xs mb-3">Quy tắc nhanh</div>
                <ul class="space-y-2 text-sm text-text-secondary">
                  <li>4 band = 2 số có nghĩa + multiplier + tolerance</li>
                  <li>5 band = 3 số có nghĩa + multiplier + tolerance</li>
                  <li>6 band = 5 band + tempco (ppm/°C)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section v-else-if="activeTab === 'resistor-smd'" class="space-y-8">
        <div class="border border-border-default bg-bg-surface p-6">
          <h2 class="font-display text-2xl font-semibold flex items-center gap-3 mb-2">
            <span class="text-accent-amber text-sm tracking-widest font-display">//</span>
            Điện trở SMD
          </h2>
          <p class="text-sm text-text-secondary mb-6">
            Hỗ trợ mã 3 digit, 4 digit, R notation và EIA-96.
          </p>

          <div class="grid grid-cols-1 xl:grid-cols-[1.15fr_1fr] gap-6">
            <div>
              <label class="block text-text-dim text-xs mb-2">Nhập mã điện trở SMD</label>
              <input
                v-model="resistorSmdCode"
                type="text"
                placeholder="Ví dụ: 472, 1001, 4R7, 01Y"
                class="w-full bg-bg-elevated border border-border-default px-4 py-3 text-lg font-mono text-text-primary placeholder:text-text-dim focus:border-accent-amber focus:outline-none transition"
              />

              <div class="mt-4 flex flex-wrap gap-2">
                <button
                  class="border border-border-default bg-bg-elevated px-3 py-2 text-sm text-text-secondary hover:border-accent-amber hover:text-accent-amber transition"
                  @click="resistorSmdCode = '472'"
                >
                  472
                </button>
                <button
                  class="border border-border-default bg-bg-elevated px-3 py-2 text-sm text-text-secondary hover:border-accent-amber hover:text-accent-amber transition"
                  @click="resistorSmdCode = '1001'"
                >
                  1001
                </button>
                <button
                  class="border border-border-default bg-bg-elevated px-3 py-2 text-sm text-text-secondary hover:border-accent-amber hover:text-accent-amber transition"
                  @click="resistorSmdCode = '4R7'"
                >
                  4R7
                </button>
                <button
                  class="border border-border-default bg-bg-elevated px-3 py-2 text-sm text-text-secondary hover:border-accent-amber hover:text-accent-amber transition"
                  @click="resistorSmdCode = '01Y'"
                >
                  01Y
                </button>
              </div>
            </div>

            <div class="border border-border-default bg-bg-elevated p-5">
              <div class="text-text-dim text-xs mb-2">Kết quả</div>
              <div class="font-display text-4xl font-bold text-accent-amber break-words">
                {{ resistorSmdResult.value }}
              </div>

              <div class="mt-4 space-y-3 text-sm">
                <div class="border border-border-default bg-bg-surface p-3">
                  <div class="text-text-dim text-xs mb-1">Loại mã</div>
                  <div class="font-mono">{{ resistorSmdResult.type }}</div>
                </div>
                <div class="border border-border-default bg-bg-surface p-3">
                  <div class="text-text-dim text-xs mb-1">Công thức</div>
                  <div class="font-mono break-all">{{ resistorSmdResult.formula }}</div>
                </div>
                <div class="border border-border-default bg-bg-surface p-3">
                  <div class="text-text-dim text-xs mb-1">Ghi chú</div>
                  <div class="text-text-secondary">{{ resistorSmdResult.note }}</div>
                </div>
              </div>
            </div>
          </div>

          <div class="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <div class="border border-border-default bg-bg-elevated p-4">
              <div class="text-text-dim text-xs mb-1">3 digit</div>
              <div class="font-mono text-sm text-text-secondary">XYM → (XY) × 10^M</div>
            </div>
            <div class="border border-border-default bg-bg-elevated p-4">
              <div class="text-text-dim text-xs mb-1">4 digit</div>
              <div class="font-mono text-sm text-text-secondary">XYZM → (XYZ) × 10^M</div>
            </div>
            <div class="border border-border-default bg-bg-elevated p-4">
              <div class="text-text-dim text-xs mb-1">R notation</div>
              <div class="font-mono text-sm text-text-secondary">4R7 = 4.7 Ω</div>
            </div>
            <div class="border border-border-default bg-bg-elevated p-4">
              <div class="text-text-dim text-xs mb-1">EIA-96</div>
              <div class="font-mono text-sm text-text-secondary">01Y = 100 × 0.01</div>
            </div>
          </div>
        </div>
      </section>

      <section v-else class="space-y-8">
        <div class="border border-border-default bg-bg-surface p-6">
          <h2 class="font-display text-2xl font-semibold flex items-center gap-3 mb-2">
            <span class="text-accent-sky text-sm tracking-widest font-display">//</span>
            Tụ điện SMD
          </h2>
          <p class="text-sm text-text-secondary mb-6">
            Giải mã mã tụ SMD phổ biến. Đơn vị mặc định của mã 3 chữ số là pF.
          </p>

          <div class="grid grid-cols-1 xl:grid-cols-[1.15fr_1fr] gap-6">
            <div>
              <label class="block text-text-dim text-xs mb-2">Nhập mã tụ điện SMD</label>
              <input
                v-model="capacitorSmdCode"
                type="text"
                placeholder="Ví dụ: 101, 104, 105, 4R7"
                class="w-full bg-bg-elevated border border-border-default px-4 py-3 text-lg font-mono text-text-primary placeholder:text-text-dim focus:border-accent-sky focus:outline-none transition"
              />

              <div class="mt-4 flex flex-wrap gap-2">
                <button
                  class="border border-border-default bg-bg-elevated px-3 py-2 text-sm text-text-secondary hover:border-accent-sky hover:text-accent-sky transition"
                  @click="capacitorSmdCode = '101'"
                >
                  101
                </button>
                <button
                  class="border border-border-default bg-bg-elevated px-3 py-2 text-sm text-text-secondary hover:border-accent-sky hover:text-accent-sky transition"
                  @click="capacitorSmdCode = '102'"
                >
                  102
                </button>
                <button
                  class="border border-border-default bg-bg-elevated px-3 py-2 text-sm text-text-secondary hover:border-accent-sky hover:text-accent-sky transition"
                  @click="capacitorSmdCode = '104'"
                >
                  104
                </button>
                <button
                  class="border border-border-default bg-bg-elevated px-3 py-2 text-sm text-text-secondary hover:border-accent-sky hover:text-accent-sky transition"
                  @click="capacitorSmdCode = '105'"
                >
                  105
                </button>
                <button
                  class="border border-border-default bg-bg-elevated px-3 py-2 text-sm text-text-secondary hover:border-accent-sky hover:text-accent-sky transition"
                  @click="capacitorSmdCode = '4R7'"
                >
                  4R7
                </button>
              </div>
            </div>

            <div class="border border-border-default bg-bg-elevated p-5">
              <div class="text-text-dim text-xs mb-2">Kết quả</div>
              <div class="font-display text-4xl font-bold text-accent-sky break-words">
                {{ capacitorSmdResult.value }}
              </div>

              <div class="mt-4 space-y-3 text-sm">
                <div class="border border-border-default bg-bg-surface p-3">
                  <div class="text-text-dim text-xs mb-1">Loại mã</div>
                  <div class="font-mono">{{ capacitorSmdResult.type }}</div>
                </div>
                <div class="border border-border-default bg-bg-surface p-3">
                  <div class="text-text-dim text-xs mb-1">Công thức</div>
                  <div class="font-mono break-all">{{ capacitorSmdResult.formula }}</div>
                </div>
                <div class="border border-border-default bg-bg-surface p-3">
                  <div class="text-text-dim text-xs mb-1">Ghi chú</div>
                  <div class="text-text-secondary">{{ capacitorSmdResult.note }}</div>
                </div>
              </div>
            </div>
          </div>

          <div class="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <div class="border border-border-default bg-bg-elevated p-4">
              <div class="text-text-dim text-xs mb-1">101</div>
              <div class="font-mono text-sm text-text-secondary">100 pF</div>
            </div>
            <div class="border border-border-default bg-bg-elevated p-4">
              <div class="text-text-dim text-xs mb-1">102</div>
              <div class="font-mono text-sm text-text-secondary">1 nF</div>
            </div>
            <div class="border border-border-default bg-bg-elevated p-4">
              <div class="text-text-dim text-xs mb-1">104</div>
              <div class="font-mono text-sm text-text-secondary">100 nF</div>
            </div>
            <div class="border border-border-default bg-bg-elevated p-4">
              <div class="text-text-dim text-xs mb-1">105</div>
              <div class="font-mono text-sm text-text-secondary">1 µF</div>
            </div>
          </div>
        </div>
      </section>

      <footer class="mt-14 pt-6 border-t border-border-default text-center">
        <p class="text-text-dim text-sm">Busan, South Korea, 2026</p>
      </footer>
    </div>
  </div>
</template>
