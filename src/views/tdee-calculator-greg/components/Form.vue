<template>
  <div class="flex flex-col gap-4 animate-fade-up animate-delay-3">
    <!-- ── Input card ─────────────────────────────────────────────────── -->
    <div class="border border-border-default bg-bg-surface p-6 h-full">
      <h3
        class="font-display text-lg font-semibold mb-8 uppercase tracking-widest text-accent-coral flex justify-between"
      >
        THEO DÕI CÂN NẶNG
      </h3>

      <!-- Overwrite confirmation -->
      <transition name="slide-down">
        <div
          v-if="showOverwriteAlert"
          class="mb-6 border border-accent-amber bg-bg-elevated p-4 border-l-4 border-l-accent-amber"
        >
          <p class="font-display text-[10px] text-accent-amber uppercase tracking-widest mb-1">
            // Dữ liệu đã tồn tại
          </p>
          <p class="text-xs text-text-secondary mb-4">
            Ngày <span class="text-text-primary font-bold">{{ form.date }}</span> đã có log. Bạn có
            muốn ghi đè không?
          </p>
          <div class="flex gap-3">
            <button
              @click="confirmOverwrite"
              class="flex-1 border border-accent-amber text-accent-amber font-display text-[10px] uppercase tracking-widest py-2 hover:bg-accent-amber hover:text-bg-deep transition-all"
            >
              Ghi đè
            </button>
            <button
              @click="showOverwriteAlert = false"
              class="flex-1 border border-border-default text-text-dim font-display text-[10px] uppercase tracking-widest py-2 hover:border-accent-coral hover:text-accent-coral transition-all"
            >
              Huỷ
            </button>
          </div>
        </div>
      </transition>

      <form @submit.prevent="handleSubmit" class="space-y-6">
        <div class="grid grid-cols-2 gap-4">
          <div class="group">
            <label
              class="block text-[10px] text-text-dim font-display tracking-[0.2em] uppercase mb-2 group-focus-within:text-accent-coral transition-colors"
              >Ngày đo</label
            >
            <input
              v-model="form.date"
              type="date"
              required
              class="w-full bg-bg-deep border border-border-default p-3 font-display focus:border-accent-coral outline-none text-text-primary text-sm transition-all"
            />
          </div>
          <div class="group">
            <label
              class="block text-[10px] text-text-dim font-display tracking-[0.2em] uppercase mb-2 group-focus-within:text-accent-coral transition-colors"
              >Cân nặng (kg)</label
            >
            <input
              v-model="form.weight"
              type="number"
              step="0.1"
              required
              class="w-full bg-bg-deep border border-border-default p-3 font-display focus:border-accent-coral outline-none text-text-primary text-sm transition-all"
            />
          </div>
        </div>

        <div class="group">
          <label
            class="block text-[10px] text-text-dim font-display tracking-[0.2em] uppercase mb-2 group-focus-within:text-accent-coral transition-colors"
            >Lượng Calories nạp vào (kcal)</label
          >
          <input
            v-model="form.calories"
            type="number"
            required
            class="w-full bg-bg-deep border border-border-default p-3 font-display focus:border-accent-coral outline-none text-text-primary text-sm transition-all"
          />
          <a
            href="https://www.myfitnesspal.com/"
            target="_blank"
            rel="noopener noreferrer"
            class="text-[10px] text-accent-sky mt-2 block uppercase tracking-widest hover:opacity-80 link-underline w-fit"
          >
            → MyFitnessPal Link
          </a>
        </div>

        <!-- Activity level buttons -->
        <div>
          <label
            class="block text-[10px] text-text-dim font-display tracking-[0.2em] uppercase mb-3"
            >Cường độ hoạt động hôm nay</label
          >
          <div class="grid grid-cols-3 gap-2">
            <button
              v-for="opt in activityOptions"
              :key="opt.value"
              type="button"
              @click="form.activityFactor = opt.value"
              :class="activityBtnClass(opt.value)"
              class="border p-3 text-center transition-all duration-200 relative"
            >
              <span class="block text-lg mb-1 leading-none">{{ opt.icon }}</span>
              <span class="block font-display text-[9px] uppercase tracking-wide leading-tight">{{
                opt.label
              }}</span>
              <span class="block font-display text-[8px] text-text-dim mt-1">×{{ opt.value }}</span>
              <span
                v-if="form.activityFactor === opt.value"
                class="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-accent-coral"
              />
            </button>
          </div>
          <p class="text-[9px] text-text-dim font-display mt-2 tracking-wide">
            Hệ số: <span class="text-text-secondary">{{ selectedActivityLabel }}</span>
          </p>
        </div>

        <button
          type="submit"
          class="w-full bg-accent-coral text-bg-deep font-display font-bold py-4 hover:bg-white transition-all duration-500 uppercase tracking-widest mt-4 group relative overflow-hidden"
        >
          <span class="relative z-10">Ghi sổ dữ liệu</span>
          <div
            class="absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 transition-transform duration-300"
          ></div>
        </button>
      </form>

      <!-- Success toast -->
      <transition name="slide-down">
        <div
          v-if="showSuccess"
          class="mt-4 border border-accent-sky bg-bg-elevated p-3 border-l-4 border-l-accent-sky flex items-center gap-3"
        >
          <span class="text-accent-sky font-display text-xs">✓</span>
          <p class="text-xs font-display text-text-secondary tracking-wide">
            Đã lưu dữ liệu ngày <span class="text-text-primary">{{ lastSavedDate }}</span>
          </p>
        </div>
      </transition>
    </div>

    <!-- ── Log history card ───────────────────────────────────────────── -->
    <div class="border border-border-default bg-bg-surface p-6">
      <!-- Header -->
      <div class="flex items-center justify-between mb-4">
        <h3
          class="font-display text-sm font-semibold uppercase tracking-widest text-text-primary flex items-center gap-2"
        >
          <span class="text-accent-amber">// </span>LỊCH SỬ DỮ LIỆU
        </h3>
        <span class="font-display text-[9px] text-text-dim tracking-widest">
          {{ filteredLogs.length }}/{{ totalLogs }} ngày
        </span>
      </div>

      <!-- Date filter -->
      <div class="flex gap-2 mb-4 flex-wrap items-center">
        <div class="flex items-center gap-1.5 flex-1 min-w-0">
          <label class="text-[8px] font-display tracking-widest text-text-dim uppercase shrink-0"
            >Từ</label
          >
          <input
            type="date"
            v-model="filterStart"
            :max="filterEnd || undefined"
            class="flex-1 min-w-0 bg-bg-deep border border-border-default text-text-primary text-[10px] font-display px-2 py-1.5 focus:outline-none focus:border-accent-amber transition-colors"
          />
        </div>
        <div class="flex items-center gap-1.5 flex-1 min-w-0">
          <label class="text-[8px] font-display tracking-widest text-text-dim uppercase shrink-0"
            >Đến</label
          >
          <input
            type="date"
            v-model="filterEnd"
            :min="filterStart || undefined"
            class="flex-1 min-w-0 bg-bg-deep border border-border-default text-text-primary text-[10px] font-display px-2 py-1.5 focus:outline-none focus:border-accent-amber transition-colors"
          />
        </div>
        <button
          v-if="filterStart || filterEnd"
          @click="clearFilter"
          class="border border-border-default text-text-dim font-display text-[8px] uppercase tracking-widest px-2 py-1.5 hover:border-accent-coral hover:text-accent-coral transition-all shrink-0"
          title="Xoá bộ lọc"
        >
          ✕
        </button>
      </div>

      <!-- Empty state -->
      <p
        v-if="filteredLogs.length === 0"
        class="text-[10px] text-text-dim font-display tracking-widest text-center py-6"
      >
        {{ totalLogs === 0 ? 'CHƯA CÓ DỮ LIỆU NÀO' : 'KHÔNG CÓ KẾT QUẢ' }}
      </p>

      <!-- Log rows -->
      <div v-else class="space-y-1.5 max-h-72 overflow-y-auto pr-1">
        <div
          v-for="log in filteredLogs"
          :key="log.date"
          class="group flex items-center gap-3 border border-border-default bg-bg-deep px-3 py-2.5 hover:border-border-default/80 transition-all"
        >
          <!-- Date -->
          <span class="font-display text-[10px] text-text-dim tracking-widest w-24 shrink-0">{{
            log.date
          }}</span>

          <!-- Stats -->
          <div class="flex gap-3 flex-1 min-w-0">
            <span class="font-display text-xs text-accent-sky shrink-0">
              {{ Number(log.weight).toFixed(1) }}<span class="text-[8px] text-text-dim">kg</span>
            </span>
            <span class="font-display text-xs text-text-secondary shrink-0">
              {{ log.calories }}<span class="text-[8px] text-text-dim">kcal</span>
            </span>
            <span class="font-display text-[9px] text-text-dim shrink-0">
              {{ activityLabel(log.activityFactor) }}
            </span>
          </div>

          <!-- Delete button — visible on hover -->
          <button
            @click="requestDelete(log.date)"
            class="shrink-0 border border-transparent text-text-dim font-display text-[9px] uppercase tracking-widest px-2 py-1 opacity-0 group-hover:opacity-100 transition-all hover:border-accent-coral hover:text-accent-coral"
            title="Xoá ngày này"
          >
            ✕
          </button>
        </div>
      </div>

      <!-- Per-row delete confirmation -->
      <transition name="slide-down">
        <div
          v-if="deleteTarget"
          class="mt-4 border border-accent-coral bg-bg-elevated p-4 border-l-4 border-l-accent-coral"
        >
          <p class="font-display text-[10px] text-accent-coral uppercase tracking-widest mb-1">
            // Xác nhận xoá
          </p>
          <p class="text-xs text-text-secondary mb-4">
            Xoá dữ liệu ngày <span class="text-text-primary font-bold">{{ deleteTarget }}</span
            >? Hành động này không thể hoàn tác.
          </p>
          <div class="flex gap-3">
            <button
              @click="confirmDelete"
              class="flex-1 border border-accent-coral text-accent-coral font-display text-[10px] uppercase tracking-widest py-2 hover:bg-accent-coral hover:text-bg-deep transition-all"
            >
              Xoá
            </button>
            <button
              @click="clearDeleteTarget"
              class="flex-1 border border-border-default text-text-dim font-display text-[10px] uppercase tracking-widest py-2 hover:border-accent-sky hover:text-accent-sky transition-all"
            >
              Huỷ
            </button>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed } from 'vue'
import { useTdeeStore } from '../store'

defineOptions({ name: 'TdeeForm' })

const store = useTdeeStore()

// ─── Activity options ─────────────────────────────────────────────────────────

const activityOptions = [
  { value: 1.2, icon: '🪑', label: 'Ngồi không' },
  { value: 1.375, icon: '🚶', label: 'Vận động nhẹ' },
  { value: 1.725, icon: '🏋️', label: 'Vận động mạnh' },
] as const

function activityLabel(factor: number): string {
  if (factor <= 1.2) return '🪑 Ngồi không'
  if (factor < 1.6) return '🚶 Vận động nhẹ'
  return '🏋️ Vận động mạnh'
}

function activityBtnClass(value: number): string {
  return form.activityFactor === value
    ? 'border-accent-coral bg-accent-coral/10 text-text-primary'
    : 'border-border-default text-text-dim hover:border-accent-coral/50 hover:text-text-secondary'
}

// ─── Form state ───────────────────────────────────────────────────────────────

const today: string = new Date().toISOString().split('T')[0] ?? ''

const form = reactive({
  weight: 70,
  calories: 2000,
  activityFactor: 1.375 as number,
  date: today,
})

const showOverwriteAlert = ref(false)
const showSuccess = ref(false)
const lastSavedDate = ref('')

const selectedActivityLabel = computed(() => {
  const opt = activityOptions.find((o) => o.value === form.activityFactor)
  return opt ? `${opt.label} (×${opt.value})` : `×${form.activityFactor}`
})

function handleSubmit() {
  const exists = store.logs.some((l) => l.date === form.date)
  if (exists) {
    showOverwriteAlert.value = true
  } else {
    saveLog()
  }
}

function confirmOverwrite() {
  showOverwriteAlert.value = false
  saveLog()
}

function saveLog() {
  store.addLog({
    date: form.date,
    weight: form.weight,
    calories: form.calories,
    activityFactor: form.activityFactor,
  })
  lastSavedDate.value = form.date
  showSuccess.value = true
  setTimeout(() => {
    showSuccess.value = false
  }, 3000)
}

// ─── Log history ──────────────────────────────────────────────────────────────

const filterStart = ref('')
const filterEnd = ref('')

const allLogsSorted = computed(() =>
  [...store.logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
)

const totalLogs = computed(() => allLogsSorted.value.length)

const filteredLogs = computed(() => {
  let result = allLogsSorted.value
  if (filterStart.value) {
    const start = new Date(filterStart.value)
    result = result.filter((l) => new Date(l.date) >= start)
  }
  if (filterEnd.value) {
    const end = new Date(filterEnd.value)
    result = result.filter((l) => new Date(l.date) <= end)
  }
  return result.slice(0, 14)
})

function clearFilter() {
  filterStart.value = ''
  filterEnd.value = ''
}

// ─── Per-row delete ───────────────────────────────────────────────────────────

const deleteTarget = ref<string | null>(null)

function requestDelete(date: string) {
  deleteTarget.value = date
}

function confirmDelete() {
  if (deleteTarget.value) {
    store.deleteLog(deleteTarget.value)
    deleteTarget.value = null
  }
}

function clearDeleteTarget() {
  deleteTarget.value = null
}
</script>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.2s ease;
}
.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

/* Thin scrollbar for the log list */
.overflow-y-auto::-webkit-scrollbar {
  width: 3px;
}
.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}
.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #253549;
}
.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #ff6b4a;
}
</style>
