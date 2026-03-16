<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { Icon } from '@iconify/vue'
import { useLocalStorage } from '@vueuse/core'
import type { WingParams, Part } from './types'
import { useCgCalculator } from './composables/use-cg-calculator'
import WingVisualizer from './components/WingVisualizer.vue'
import { toPng } from 'html-to-image'

// Initial state
const defaultParams: WingParams = {
  span: 920,
  rootChord: 350,
  tipChord: 280,
  sweep: 280,
  fuseWidth: 160,
  chassisCog: 220,
  chassisWeight: 200,
  targetCgPercent: 20,
}

// State
const params = useLocalStorage<WingParams>('cg-calc-params', defaultParams)
const parts = useLocalStorage<Part[]>('cg-calc-parts', [])

const { results } = useCgCalculator(params, parts)
const mainArea = ref<HTMLElement | null>(null)

const cgOptions = [
  { label: '15% - Cho người mới', value: 15 },
  { label: '20% - Phổ thông', value: 20 },
  { label: '25% - Chuyên gia', value: 25 },
]

function addPart() {
  const newPart: Part = {
    id: crypto.randomUUID(),
    name: 'Phụ kiện mới',
    width: 20,
    length: 50,
    weight: 10,
    x: (params.value.rootChord ?? 0) / 2,
    y: 0,
    rotation: 0,
    color: '#FFB830',
  }
  parts.value.push(newPart)
}

function removePart(id: string) {
  parts.value = parts.value.filter((p) => p.id !== id)
}

async function captureImage() {
  if (!mainArea.value) return
  try {
    const dataUrl = await toPng(mainArea.value, {
      backgroundColor: '#0F1923',
      pixelRatio: 2,
    })
    const link = document.createElement('a')
    link.download = `cg-calculator-${Date.now()}.png`
    link.href = dataUrl
    link.click()
  } catch (err) {
    console.error('Failed to capture image', err)
  }
}

function resetParams() {
  params.value = { ...defaultParams }
  parts.value = []
}
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <!-- Header -->
      <header class="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 class="font-display text-4xl font-bold text-accent-coral flex items-center gap-3">
            <Icon icon="lucide:plane" class="size-8" />
            Flying Wing CG Calculator
          </h1>
          <p class="text-text-secondary mt-2">
            Công cụ tính toán trọng tâm và phân bổ trọng lượng máy bay cánh bằng
          </p>
        </div>
        <div class="flex gap-3">
          <button
            @click="captureImage"
            class="px-4 py-2 border border-accent-sky text-accent-sky hover:bg-accent-sky/10 transition text-sm flex items-center gap-2"
          >
            <Icon icon="lucide:camera" class="size-4" />
            Chụp ảnh
          </button>
          <button
            @click="resetParams"
            class="px-4 py-2 border border-border-default hover:border-accent-amber transition text-sm flex items-center gap-2"
          >
            <Icon icon="lucide:rotate-ccw" class="size-4" />
            Cài lại
          </button>
          <RouterLink
            to="/"
            class="px-4 py-2 border border-border-default hover:border-accent-coral transition text-sm flex items-center gap-2"
          >
            <Icon icon="lucide:arrow-left" class="size-4" />
            Trang chủ
          </RouterLink>
        </div>
      </header>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <!-- Sidebar: Inputs -->
        <aside class="lg:col-span-4 space-y-6">
          <!-- Geometric Parameters -->
          <div class="border border-border-default bg-bg-surface p-6 shadow-sm">
            <h2 class="font-display text-xl font-semibold mb-6 flex items-center gap-3">
              <span class="text-accent-coral font-display text-sm tracking-widest">//</span>
              THÔNG SỐ CÁNH
            </h2>
            <div class="space-y-4">
              <div
                v-for="(val, key) in {
                  span: 'Sải cánh (mm)',
                  rootChord: 'Dây cung gốc (mm)',
                  tipChord: 'Dây cung đầu cánh (mm)',
                  sweep: 'Độ quét (mm)',
                  fuseWidth: 'Chiều rộng thân (mm)',
                }"
                :key="key"
              >
                <label class="block text-text-dim text-xs mb-1 uppercase tracking-wider">{{
                  val
                }}</label>
                <input
                  v-model.number="params[key as keyof WingParams]"
                  type="number"
                  class="w-full bg-bg-elevated border border-border-default px-3 py-2 text-sm text-text-primary focus:border-accent-coral focus:outline-none transition"
                />
              </div>
            </div>
          </div>

          <!-- CG Options -->
          <div class="border border-border-default bg-bg-surface p-6 shadow-sm">
            <h2 class="font-display text-xl font-semibold mb-6 flex items-center gap-3">
              <span class="text-accent-amber font-display text-sm tracking-widest">//</span>
              VỊ TRÍ TRỌNG TÂM
            </h2>
            <div class="space-y-3">
              <label
                v-for="opt in cgOptions"
                :key="opt.value"
                class="flex items-center gap-3 p-3 border cursor-pointer transition"
                :class="
                  params.targetCgPercent === opt.value
                    ? 'border-accent-amber bg-accent-amber/5'
                    : 'border-border-default hover:bg-bg-elevated'
                "
              >
                <input
                  type="radio"
                  :value="opt.value"
                  v-model="params.targetCgPercent"
                  class="sr-only"
                />
                <div
                  class="size-4 border border-accent-amber rounded-full flex items-center justify-center"
                >
                  <div
                    v-if="params.targetCgPercent === opt.value"
                    class="size-2 bg-accent-amber rounded-full"
                  ></div>
                </div>
                <span class="text-sm">{{ opt.label }}</span>
              </label>

              <div class="pt-2">
                <label class="block text-text-dim text-xs mb-1 uppercase tracking-wider"
                  >Khác (%)</label
                >
                <input
                  v-model.number="params.targetCgPercent"
                  type="number"
                  step="0.1"
                  class="w-full bg-bg-elevated border border-border-default px-3 py-2 text-sm text-text-primary focus:border-accent-amber focus:outline-none transition"
                />
              </div>
            </div>
          </div>

          <!-- Chassis Stats -->
          <div class="border border-border-default bg-bg-surface p-6 shadow-sm">
            <h2 class="font-display text-xl font-semibold mb-6 flex items-center gap-3">
              <span class="text-accent-sky font-display text-sm tracking-widest">//</span>
              KHUNG MÁY BAY
            </h2>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-text-dim text-xs mb-1">TRỌNG LƯỢNG (g)</label>
                <input
                  v-model.number="params.chassisWeight"
                  type="number"
                  class="w-full bg-bg-elevated border border-border-default px-3 py-2 text-sm text-text-primary focus:border-accent-sky focus:outline-none transition"
                />
              </div>
              <div>
                <label class="block text-text-dim text-xs mb-1">CG KHUNG (mm)</label>
                <input
                  v-model.number="params.chassisCog"
                  type="number"
                  class="w-full bg-bg-elevated border border-border-default px-3 py-2 text-sm text-text-primary focus:border-accent-sky focus:outline-none transition"
                />
              </div>
            </div>
          </div>
        </aside>

        <!-- Main Content: Visualization & Results -->
        <main class="lg:col-span-8 space-y-6">
          <!-- Visualization -->
          <div
            class="border border-border-default bg-bg-surface p-6 shadow-sm min-h-[500px] flex flex-col items-center justify-center relative overflow-hidden"
          >
            <WingVisualizer :params="params" :parts="parts" :results="results" />

            <!-- Floating Badge -->
            <div
              class="absolute top-4 right-4 bg-accent-coral text-bg-deep font-display font-bold text-xs tracking-widest px-3 py-1.5 rotate-3"
            >
              BẢN V3.0
            </div>
          </div>

          <!-- Outputs -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="border border-border-default bg-bg-surface p-5 text-center">
              <div class="text-text-dim text-xs mb-1">DIỆN TÍCH CÁNH</div>
              <div class="font-display text-3xl font-bold text-accent-coral">
                {{ results.wingAreaLabel }} <span class="text-lg font-normal">dm²</span>
              </div>
            </div>
            <div class="border border-border-default bg-bg-surface p-5 text-center">
              <div class="text-text-dim text-xs mb-1">TẢI TRỌNG CÁNH</div>
              <div class="font-display text-3xl font-bold text-accent-amber">
                {{ results.wingLoading }} <span class="text-lg font-normal">g/dm²</span>
              </div>
            </div>
            <div class="border border-border-default bg-bg-surface p-5 text-center">
              <div class="text-text-dim text-xs mb-1">TỐC ĐỘ THẤT TỐC</div>
              <div class="font-display text-3xl font-bold text-accent-sky">
                ~{{ results.stallSpeed }} <span class="text-lg font-normal">km/h</span>
              </div>
            </div>
          </div>

          <!-- Detailed Results -->
          <div class="border border-border-default bg-bg-surface p-6 shadow-sm">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div class="text-text-dim text-[10px] uppercase font-bold">Vị trí MAC (Y)</div>
                <div class="text-lg font-semibold">{{ results.macDistance }} mm</div>
              </div>
              <div>
                <div class="text-text-dim text-[10px] uppercase font-bold">Chiều dài MAC</div>
                <div class="text-lg font-semibold">{{ results.macLength }} mm</div>
              </div>
              <div>
                <div class="text-text-dim text-[10px] uppercase font-bold">CG Mục tiêu (X)</div>
                <div
                  class="text-lg font-semibold text-accent-amber border-b-2 border-accent-amber/30 inline-block"
                >
                  {{ results.targetCgDist }} mm
                </div>
              </div>
              <div>
                <div class="text-text-dim text-[10px] uppercase font-bold">CG Thực tế (X)</div>
                <div
                  class="text-lg font-semibold text-accent-coral border-b-2 border-accent-coral/30 inline-block"
                >
                  {{ results.actualCgDist }} mm
                </div>
              </div>
            </div>
          </div>

          <!-- Parts List -->
          <div class="border border-border-default bg-bg-surface p-6 shadow-sm">
            <div class="flex items-center justify-between mb-6">
              <h2 class="font-display text-xl font-semibold flex items-center gap-3">
                <span class="text-accent-amber font-display text-sm tracking-widest">//</span>
                DANH SÁCH LINH KIỆN
              </h2>
              <button
                @click="addPart"
                class="bg-accent-amber text-bg-deep px-4 py-2 text-sm font-bold hover:bg-white transition flex items-center gap-2"
              >
                <Icon icon="lucide:plus" class="size-4" />
                THÊM LINH KIỆN
              </button>
            </div>

            <div
              v-if="parts.length === 0"
              class="text-center py-12 text-text-dim border border-dashed border-border-default"
            >
              Chưa có linh kiện nào. Thêm pin, ESC, hoặc motor để tính toán CG thực tế.
            </div>

            <div v-else class="space-y-4">
              <div
                v-for="part in parts"
                :key="part.id"
                class="grid grid-cols-2 md:grid-cols-6 gap-3 items-end bg-bg-elevated/50 p-4 border border-border-default hover:border-accent-amber transition group"
              >
                <div class="col-span-2 md:col-span-1">
                  <label class="block text-text-dim text-[10px] mb-1">TÊN</label>
                  <input
                    v-model="part.name"
                    class="w-full bg-bg-deep border border-border-default px-2 py-1 text-xs"
                  />
                </div>
                <div>
                  <label class="block text-text-dim text-[10px] mb-1">NẶNG(g)</label>
                  <input
                    v-model.number="part.weight"
                    type="number"
                    class="w-full bg-bg-deep border border-border-default px-2 py-1 text-xs"
                  />
                </div>
                <div>
                  <label class="block text-text-dim text-[10px] mb-1">VỊ TRÍ X(mm)</label>
                  <input
                    v-model.number="part.x"
                    type="number"
                    class="w-full bg-bg-deep border border-border-default px-2 py-1 text-xs"
                  />
                </div>
                <div class="hidden md:block">
                  <label class="block text-text-dim text-[10px] mb-1">RỘNG(mm)</label>
                  <input
                    v-model.number="part.width"
                    type="number"
                    class="w-full bg-bg-deep border border-border-default px-2 py-1 text-xs"
                  />
                </div>
                <div class="hidden md:block">
                  <label class="block text-text-dim text-[10px] mb-1">DÀI(mm)</label>
                  <input
                    v-model.number="part.length"
                    type="number"
                    class="w-full bg-bg-deep border border-border-default px-2 py-1 text-xs"
                  />
                </div>
                <div class="flex justify-end">
                  <button
                    @click="removePart(part.id)"
                    class="text-text-dim hover:text-accent-coral p-1"
                  >
                    <Icon icon="lucide:trash-2" class="size-4" />
                  </button>
                </div>
              </div>

              <div class="pt-4 flex justify-between items-center border-t border-border-default">
                <div class="text-sm text-text-secondary">
                  Tổng trọng lượng:
                  <span class="font-bold text-text-primary">{{ results.totalWeight }}g</span>
                </div>
                <div class="text-xs text-text-dim">X pos tính từ mũi (LE center)</div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Chrome-style number input hiding arrows */
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  appearance: none;
  margin: 0;
}
input[type='number'] {
  -webkit-appearance: none;
  -moz-appearance: textfield;
  appearance: none;
}
</style>
