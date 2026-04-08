<template>
  <div
    class="min-h-screen bg-bg-deep text-text-primary font-body flex flex-col items-center py-8 px-4"
  >
    <!-- Header -->
    <header class="w-full max-w-2xl flex justify-between items-center mb-8 animate-fade-up">
      <div>
        <h1
          class="font-display text-3xl sm:text-4xl font-bold text-text-primary flex items-center gap-3"
        >
          <span class="text-accent-coral font-display text-lg tracking-widest">//</span>
          Nhật Ký Huyết Áp
        </h1>
        <p class="text-text-secondary text-sm mt-1">
          Theo dõi huyết áp & nhịp tim — phân loại theo WHO
        </p>
      </div>
      <RouterLink
        to="/"
        class="inline-flex items-center gap-2 border border-border-default bg-bg-surface px-4 py-2 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
      >
        &larr; Trang chủ
      </RouterLink>
    </header>

    <!-- Tab Navigation -->
    <div
      class="w-full max-w-2xl flex border-b border-border-default mb-6 animate-fade-up animate-delay-1"
    >
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="flex items-center gap-2 px-4 py-3 text-sm font-display tracking-wide transition-colors border-b-2 -mb-px"
        :class="
          activeTab === tab.id
            ? 'border-accent-coral text-accent-coral'
            : 'border-transparent text-text-dim hover:text-text-secondary'
        "
        @click="activeTab = tab.id"
      >
        <Icon :icon="tab.icon" class="size-4" />
        {{ tab.label }}
      </button>
    </div>

    <div class="w-full max-w-2xl animate-fade-up animate-delay-2">
      <!-- Add Reading Tab -->
      <div v-if="activeTab === 'add'">
        <div class="border border-border-default bg-bg-surface p-6">
          <h2 class="font-display text-lg font-semibold mb-6 flex items-center gap-2">
            <Icon icon="lucide:plus-circle" class="size-5 text-accent-coral" />
            Ghi chỉ số mới
          </h2>

          <!-- Date & Time -->
          <div class="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label class="text-text-dim text-xs font-display tracking-wide mb-1.5 block"
                >NGÀY</label
              >
              <input
                v-model="form.date"
                type="date"
                class="w-full bg-bg-deep border border-border-default px-3 py-2.5 text-text-primary text-sm focus:outline-none focus:border-accent-coral transition-colors"
              />
            </div>
            <div>
              <label class="text-text-dim text-xs font-display tracking-wide mb-1.5 block"
                >GIỜ</label
              >
              <input
                v-model="form.time"
                type="time"
                class="w-full bg-bg-deep border border-border-default px-3 py-2.5 text-text-primary text-sm focus:outline-none focus:border-accent-coral transition-colors"
              />
            </div>
          </div>

          <!-- BP Values -->
          <div class="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label class="text-text-dim text-xs font-display tracking-wide mb-1.5 block"
                >TÂM THU (mmHg)</label
              >
              <input
                v-model.number="form.systolic"
                type="number"
                min="50"
                max="300"
                placeholder="120"
                class="w-full bg-bg-deep border border-border-default px-3 py-2.5 text-text-primary text-sm text-center font-display text-lg focus:outline-none focus:border-accent-coral transition-colors"
              />
            </div>
            <div>
              <label class="text-text-dim text-xs font-display tracking-wide mb-1.5 block"
                >TÂM TRƯƠNG (mmHg)</label
              >
              <input
                v-model.number="form.diastolic"
                type="number"
                min="30"
                max="200"
                placeholder="80"
                class="w-full bg-bg-deep border border-border-default px-3 py-2.5 text-text-primary text-sm text-center font-display text-lg focus:outline-none focus:border-accent-coral transition-colors"
              />
            </div>
            <div>
              <label class="text-text-dim text-xs font-display tracking-wide mb-1.5 block"
                >NHỊP TIM (bpm)</label
              >
              <input
                v-model.number="form.heartRate"
                type="number"
                min="30"
                max="250"
                placeholder="72"
                class="w-full bg-bg-deep border border-border-default px-3 py-2.5 text-text-primary text-sm text-center font-display text-lg focus:outline-none focus:border-accent-coral transition-colors"
              />
            </div>
          </div>

          <!-- Live Classification -->
          <div
            v-if="liveCategory"
            class="mb-4 p-4 border flex items-center gap-3"
            :style="{
              borderColor: liveCategory.color + '60',
              backgroundColor: liveCategory.color + '10',
            }"
          >
            <div class="w-3 h-3 shrink-0" :style="{ backgroundColor: liveCategory.color }" />
            <div>
              <div
                class="text-sm font-display font-semibold"
                :style="{ color: liveCategory.color }"
              >
                {{ liveCategory.label }}
              </div>
              <div class="text-xs text-text-secondary mt-0.5">{{ liveCategory.description }}</div>
            </div>
          </div>

          <!-- Note -->
          <div class="mb-6">
            <label class="text-text-dim text-xs font-display tracking-wide mb-1.5 block"
              >GHI CHÚ</label
            >
            <textarea
              v-model="form.note"
              rows="2"
              placeholder="Vd: Sau bữa sáng, uống thuốc..."
              class="w-full bg-bg-deep border border-border-default px-3 py-2.5 text-text-primary text-sm resize-none focus:outline-none focus:border-accent-coral transition-colors placeholder:text-text-dim/50"
            />
          </div>

          <!-- Save Button -->
          <button
            class="w-full py-3 font-display font-semibold tracking-wide text-sm transition-all"
            :class="
              canSave
                ? 'bg-accent-coral text-bg-deep hover:bg-accent-coral/90'
                : 'bg-bg-elevated text-text-dim cursor-not-allowed'
            "
            :disabled="!canSave"
            @click="handleSave"
          >
            <Icon icon="lucide:save" class="size-4 inline mr-2" />
            LƯU CHỈ SỐ
          </button>

          <div
            v-if="saveSuccess"
            class="mt-3 text-center text-xs text-accent-sky font-display tracking-wide"
          >
            ✓ Đã lưu thành công!
          </div>
        </div>
      </div>

      <!-- History Tab -->
      <div v-if="activeTab === 'history'">
        <!-- Stats Summary -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div class="border border-border-default bg-bg-surface p-3 text-center">
            <div class="font-display text-xl font-bold text-accent-coral">
              {{ stats7d.count > 0 ? `${stats7d.avgSystolic}/${stats7d.avgDiastolic}` : '—' }}
            </div>
            <div class="text-text-dim text-xs font-display tracking-wide mt-1">TB 7 NGÀY</div>
          </div>
          <div class="border border-border-default bg-bg-surface p-3 text-center">
            <div class="font-display text-xl font-bold text-accent-amber">
              {{ stats30d.count > 0 ? `${stats30d.avgSystolic}/${stats30d.avgDiastolic}` : '—' }}
            </div>
            <div class="text-text-dim text-xs font-display tracking-wide mt-1">TB 30 NGÀY</div>
          </div>
          <div class="border border-border-default bg-bg-surface p-3 text-center">
            <div class="font-display text-xl font-bold text-accent-sky">
              {{ stats7d.count > 0 ? stats7d.avgHeartRate : '—' }}
            </div>
            <div class="text-text-dim text-xs font-display tracking-wide mt-1">NHỊP TIM TB</div>
          </div>
          <div class="border border-border-default bg-bg-surface p-3 text-center">
            <div class="font-display text-xl font-bold text-text-primary">
              {{ sortedReadings.length }}
            </div>
            <div class="text-text-dim text-xs font-display tracking-wide mt-1">TỔNG SỐ ĐO</div>
          </div>
        </div>

        <!-- Chart -->
        <div class="border border-border-default bg-bg-surface p-6 mb-4">
          <div class="flex items-center justify-between mb-4">
            <h2 class="font-display text-base font-semibold flex items-center gap-2">
              <Icon icon="lucide:trending-up" class="size-5 text-accent-coral" />
              Biểu đồ
            </h2>
            <div class="flex gap-2">
              <button
                v-for="p in chartPeriods"
                :key="p.value"
                class="px-2 py-1 text-xs font-display border transition-all"
                :class="
                  chartPeriod === p.value
                    ? 'border-accent-coral text-accent-coral'
                    : 'border-border-default text-text-dim hover:text-text-secondary'
                "
                @click="chartPeriod = p.value"
              >
                {{ p.label }}
              </button>
            </div>
          </div>

          <div v-if="chartData.length >= 2" class="relative h-48">
            <canvas ref="chartCanvas" class="w-full h-full" />
          </div>
          <p v-else class="text-text-dim text-sm text-center py-8">
            Cần ít nhất 2 lần đo để vẽ biểu đồ
          </p>

          <!-- Legend -->
          <div v-if="chartData.length >= 2" class="flex gap-4 mt-3 justify-center">
            <span class="flex items-center gap-1.5 text-xs text-text-dim">
              <span class="w-3 h-0.5 bg-accent-coral inline-block" /> Tâm thu
            </span>
            <span class="flex items-center gap-1.5 text-xs text-text-dim">
              <span class="w-3 h-0.5 bg-accent-sky inline-block" /> Tâm trương
            </span>
            <span class="flex items-center gap-1.5 text-xs text-text-dim">
              <span class="w-3 h-0.5 bg-accent-amber inline-block" /> Nhịp tim
            </span>
          </div>
        </div>

        <!-- Readings List -->
        <div class="border border-border-default bg-bg-surface p-6">
          <h2 class="font-display text-base font-semibold mb-4 flex items-center gap-2">
            <Icon icon="lucide:list" class="size-5 text-accent-amber" />
            Lịch sử đo
          </h2>

          <div v-if="sortedReadings.length > 0" class="space-y-3">
            <div
              v-for="reading in sortedReadings.slice(0, showCount)"
              :key="reading.id"
              class="p-4 border border-border-default bg-bg-deep hover:border-accent-coral/30 transition-colors"
            >
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-3">
                  <div
                    class="w-2.5 h-2.5 shrink-0"
                    :style="{ backgroundColor: getCategoryInfo(reading.category).color }"
                  />
                  <span class="text-xs text-text-dim font-display tracking-wide">
                    {{ reading.date.split('-').reverse().join('/') }} — {{ reading.time }}
                  </span>
                </div>
                <button
                  class="text-text-dim hover:text-accent-coral transition-colors"
                  @click="handleDelete(reading.id)"
                >
                  <Icon icon="lucide:trash-2" class="size-3.5" />
                </button>
              </div>
              <div class="flex items-center gap-6">
                <div>
                  <span class="font-display text-xl font-bold text-accent-coral">{{
                    reading.systolic
                  }}</span>
                  <span class="text-text-dim">/</span>
                  <span class="font-display text-xl font-bold text-accent-sky">{{
                    reading.diastolic
                  }}</span>
                  <span class="text-text-dim text-xs ml-1">mmHg</span>
                </div>
                <div>
                  <Icon icon="lucide:heart" class="size-3.5 text-accent-amber inline" />
                  <span class="font-display text-lg font-bold text-accent-amber ml-1">{{
                    reading.heartRate
                  }}</span>
                  <span class="text-text-dim text-xs ml-1">bpm</span>
                </div>
                <span
                  class="text-xs font-display ml-auto"
                  :style="{ color: getCategoryInfo(reading.category).color }"
                >
                  {{ getCategoryInfo(reading.category).label }}
                </span>
              </div>
              <p v-if="reading.note" class="text-text-secondary text-xs mt-2 italic">
                {{ reading.note }}
              </p>
            </div>

            <button
              v-if="sortedReadings.length > showCount"
              class="w-full py-2 text-xs text-accent-sky hover:text-accent-coral font-display tracking-wide transition-colors"
              @click="showCount += 10"
            >
              Xem thêm ({{ sortedReadings.length - showCount }} còn lại)
            </button>
          </div>
          <p v-else class="text-text-dim text-sm text-center py-8">
            Chưa có dữ liệu — hãy ghi chỉ số huyết áp đầu tiên!
          </p>
        </div>
      </div>

      <!-- Knowledge Tab -->
      <div v-if="activeTab === 'knowledge'">
        <!-- BP Classification Table -->
        <div class="border border-border-default bg-bg-surface p-6 mb-4">
          <h2 class="font-display text-lg font-semibold mb-6 flex items-center gap-2">
            <Icon icon="lucide:info" class="size-5 text-accent-sky" />
            Phân loại huyết áp (WHO)
          </h2>
          <div class="space-y-2">
            <div
              v-for="cat in BP_CATEGORIES"
              :key="cat.key"
              class="flex items-center gap-3 p-3 border border-border-default bg-bg-deep"
            >
              <div class="w-3 h-3 shrink-0" :style="{ backgroundColor: cat.color }" />
              <div class="flex-1 min-w-0">
                <div class="text-sm font-display font-semibold" :style="{ color: cat.color }">
                  {{ cat.label }}
                </div>
                <div class="text-xs text-text-dim mt-0.5">
                  Tâm thu: {{ cat.systolicRange }} | Tâm trương: {{ cat.diastolicRange }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Knowledge Cards -->
        <div
          v-for="section in BP_KNOWLEDGE"
          :key="section.title"
          class="border border-border-default bg-bg-surface p-6 mb-4"
        >
          <h2 class="font-display text-base font-semibold mb-4 flex items-center gap-2">
            <Icon icon="lucide:book-open" class="size-5 text-accent-amber" />
            {{ section.title }}
          </h2>
          <ul class="space-y-2">
            <li
              v-for="(item, i) in section.items"
              :key="i"
              class="flex gap-3 text-sm text-text-secondary"
            >
              <span class="text-accent-coral text-xs mt-0.5">▸</span>
              {{ item }}
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onUnmounted } from 'vue'
import { Icon } from '@iconify/vue'
import { BP_CATEGORIES, BP_KNOWLEDGE, classifyBP, getCategoryInfo } from './types'
import { useBPStore } from './composables/useBPStore'

const store = useBPStore()
const { sortedReadings, addReading, deleteReading, getStats, getChartData } = store

// === Tabs ===
const tabs = [
  { id: 'add' as const, label: 'Ghi chỉ số', icon: 'lucide:plus-circle' },
  { id: 'history' as const, label: 'Lịch sử', icon: 'lucide:history' },
  { id: 'knowledge' as const, label: 'Kiến thức', icon: 'lucide:book-open' },
]
type TabId = 'add' | 'history' | 'knowledge'
const activeTab = ref<TabId>('add')

// === Add Reading ===
const now = new Date()
const form = ref({
  date: now.toISOString().split('T')[0]!,
  time: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
  systolic: null as number | null,
  diastolic: null as number | null,
  heartRate: null as number | null,
  note: '',
})

const saveSuccess = ref(false)

const liveCategory = computed(() => {
  if (form.value.systolic && form.value.diastolic) {
    const cat = classifyBP(form.value.systolic, form.value.diastolic)
    return getCategoryInfo(cat)
  }
  return null
})

const canSave = computed(() => {
  const f = form.value
  return (
    f.systolic && f.diastolic && f.heartRate && f.systolic > 0 && f.diastolic > 0 && f.heartRate > 0
  )
})

function handleSave() {
  if (!canSave.value) return
  addReading(
    form.value.systolic!,
    form.value.diastolic!,
    form.value.heartRate!,
    form.value.note,
    form.value.date,
    form.value.time,
  )
  saveSuccess.value = true
  setTimeout(() => {
    saveSuccess.value = false
  }, 2000)
  form.value.systolic = null
  form.value.diastolic = null
  form.value.heartRate = null
  form.value.note = ''
}

// === History ===
const showCount = ref(10)

const stats7d = computed(() => getStats(7))
const stats30d = computed(() => getStats(30))

function handleDelete(id: string) {
  if (confirm('Xóa lần đo này?')) {
    deleteReading(id)
  }
}

// === Chart ===
const chartPeriod = ref(30)
const chartPeriods = [
  { value: 7, label: '7 ngày' },
  { value: 30, label: '30 ngày' },
  { value: 90, label: '90 ngày' },
]

const chartCanvas = ref<HTMLCanvasElement | null>(null)
const chartData = computed(() => getChartData(chartPeriod.value))

let resizeObserver: ResizeObserver | null = null

function drawChart() {
  const canvas = chartCanvas.value
  if (!canvas || chartData.value.length < 2) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const dpr = window.devicePixelRatio || 1
  const rect = canvas.getBoundingClientRect()
  canvas.width = rect.width * dpr
  canvas.height = rect.height * dpr
  ctx.scale(dpr, dpr)

  const w = rect.width
  const h = rect.height
  const pad = { top: 10, right: 10, bottom: 25, left: 35 }
  const plotW = w - pad.left - pad.right
  const plotH = h - pad.top - pad.bottom

  const data = chartData.value
  const allVals = data.flatMap((d) => [d.systolic, d.diastolic, d.heartRate])
  const minVal = Math.min(...allVals) - 10
  const maxVal = Math.max(...allVals) + 10
  const range = maxVal - minVal

  ctx.clearRect(0, 0, w, h)

  // Grid lines
  ctx.strokeStyle = '#253549'
  ctx.lineWidth = 0.5
  for (let i = 0; i <= 4; i++) {
    const y = pad.top + (plotH / 4) * i
    ctx.beginPath()
    ctx.moveTo(pad.left, y)
    ctx.lineTo(w - pad.right, y)
    ctx.stroke()

    const val = Math.round(maxVal - (range / 4) * i)
    ctx.fillStyle = '#4A6180'
    ctx.font = '10px monospace'
    ctx.textAlign = 'right'
    ctx.fillText(String(val), pad.left - 5, y + 3)
  }

  function drawLine(values: number[], color: string) {
    ctx!.beginPath()
    ctx!.strokeStyle = color
    ctx!.lineWidth = 2
    for (let i = 0; i < values.length; i++) {
      const x = pad.left + (plotW / (values.length - 1)) * i
      const y = pad.top + plotH - ((values[i]! - minVal) / range) * plotH
      if (i === 0) ctx!.moveTo(x, y)
      else ctx!.lineTo(x, y)
    }
    ctx!.stroke()

    // Dots
    for (let i = 0; i < values.length; i++) {
      const x = pad.left + (plotW / (values.length - 1)) * i
      const y = pad.top + plotH - ((values[i]! - minVal) / range) * plotH
      ctx!.beginPath()
      ctx!.arc(x, y, 3, 0, Math.PI * 2)
      ctx!.fillStyle = color
      ctx!.fill()
    }
  }

  drawLine(
    data.map((d) => d.systolic),
    '#FF6B4A',
  )
  drawLine(
    data.map((d) => d.diastolic),
    '#38BDF8',
  )
  drawLine(
    data.map((d) => d.heartRate),
    '#FFB830',
  )

  // X axis labels
  const step = Math.max(1, Math.floor(data.length / 6))
  ctx.fillStyle = '#4A6180'
  ctx.font = '9px monospace'
  ctx.textAlign = 'center'
  for (let i = 0; i < data.length; i += step) {
    const x = pad.left + (plotW / (data.length - 1)) * i
    const parts = data[i]!.date.split('-')
    ctx.fillText(`${parts[2]}/${parts[1]}`, x, h - 5)
  }
}

watch([chartData, activeTab], () => {
  if (activeTab.value === 'history') {
    nextTick(() => drawChart())
  }
})

watch(chartCanvas, (canvas) => {
  if (canvas) {
    resizeObserver = new ResizeObserver(() => drawChart())
    resizeObserver.observe(canvas)
    nextTick(() => drawChart())
  }
})

onUnmounted(() => {
  resizeObserver?.disconnect()
})
</script>
