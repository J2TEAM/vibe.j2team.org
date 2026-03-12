<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

interface BatteryInfo {
  level: number // 0-1
  charging: boolean
  chargingTime: number // giây, Infinity nếu đang xả
  dischargingTime: number // giây, Infinity nếu đang sạc
}

const battery = ref<BatteryInfo | null>(null)

// Phát hiện máy bàn / không có pin:
// level = 1, charging = true, dischargingTime = Infinity thường là dấu hiệu AC power không có pin
const noBattery = computed(() => {
  if (!battery.value) return false
  return (
    battery.value.level === 1 &&
    battery.value.charging &&
    !isFinite(battery.value.dischargingTime) &&
    !isFinite(battery.value.chargingTime)
  )
})
const isSupported = ref(true)
const copied = ref(false)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let batteryManager: any = null

// Cập nhật thông tin pin
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function updateBattery(b: any) {
  battery.value = {
    level: b.level,
    charging: b.charging,
    chargingTime: b.chargingTime,
    dischargingTime: b.dischargingTime,
  }
}

const handleBatteryChange = () => {
  if (batteryManager) updateBattery(batteryManager)
}

// Định dạng thời gian từ giây
function formatTime(seconds: number): string {
  if (!isFinite(seconds)) return '—'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m} phút`
}

// Màu thanh pin
function batteryColor(level: number, charging: boolean): string {
  if (charging) return 'bg-accent-sky'
  if (level > 0.5) return 'bg-green-500'
  if (level > 0.2) return 'bg-accent-amber'
  return 'bg-accent-coral'
}

// Copy lệnh PowerShell
async function copyCommand() {
  try {
    await navigator.clipboard.writeText('irm j2c.cc/batterycheck | iex')
    copied.value = true
    setTimeout(() => (copied.value = false), 2000)
  } catch {
    // fallback
  }
}

onMounted(async () => {
  if (!('getBattery' in navigator)) {
    isSupported.value = false
    return
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    batteryManager = await (navigator as any).getBattery()
    updateBattery(batteryManager)

    // Lắng nghe các sự kiện thay đổi
    batteryManager.addEventListener('levelchange', handleBatteryChange)
    batteryManager.addEventListener('chargingchange', handleBatteryChange)
    batteryManager.addEventListener('chargingtimechange', handleBatteryChange)
    batteryManager.addEventListener('dischargingtimechange', handleBatteryChange)
  } catch {
    isSupported.value = false
  }
})

onUnmounted(() => {
  if (batteryManager) {
    batteryManager.removeEventListener('levelchange', handleBatteryChange)
    batteryManager.removeEventListener('chargingchange', handleBatteryChange)
    batteryManager.removeEventListener('chargingtimechange', handleBatteryChange)
    batteryManager.removeEventListener('dischargingtimechange', handleBatteryChange)
  }
})
</script>

<template>
  <div class="flex flex-col gap-8 w-full max-w-6xl mx-auto p-4 sm:p-6 mb-20 animate-fade-up">
    <!-- Mô tả -->
    <div class="bg-bg-surface border border-border-default p-6 shadow-sm">
      <h2 class="font-display text-xl font-bold text-text-primary mb-2">Kiểm tra Pin</h2>
      <p class="text-sm text-text-secondary leading-relaxed">
        Xem thông tin hiện tại của pin (nếu có hoặc còn sống)
      </p>
    </div>

    <!-- Phát hiện không có pin (máy bàn / cắm nguồn trực tiếp / pin hỏng) -->
    <div
      v-if="isSupported && battery && noBattery"
      class="bg-bg-surface border border-accent-amber/50 p-6 shadow-sm"
    >
      <div class="flex items-start gap-4 mb-4">
        <span class="text-3xl">⚠️</span>
        <div>
          <p class="font-display text-base font-semibold text-text-primary mb-1">
            Không đọc được thông tin pin
          </p>
          <p class="text-sm text-text-secondary">
            Trình duyệt không nhận diện được pin. Có thể do một trong các nguyên nhân sau:
          </p>
        </div>
      </div>
      <ul class="space-y-2 text-sm text-text-secondary ml-4 list-none">
        <li class="flex items-start gap-2">
          <span class="text-text-dim mt-0.5">🖥️</span>
          <span
            ><strong class="text-text-primary">Máy bàn (PC)</strong> — không có pin, đang cắm nguồn
            AC trực tiếp</span
          >
        </li>
        <li class="flex items-start gap-2">
          <span class="text-text-dim mt-0.5">🔌</span>
          <span
            ><strong class="text-text-primary">Laptop đang tháo pin</strong> — đang dùng nguồn AC mà
            không có pin gắn vào</span
          >
        </li>
        <li class="flex items-start gap-2">
          <span class="text-text-dim mt-0.5">🔋</span>
          <span
            ><strong class="text-text-primary">Pin hỏng hoàn toàn</strong> — laptop nhận nguồn nhưng
            pin không còn phản hồi</span
          >
        </li>
        <li class="flex items-start gap-2">
          <span class="text-text-dim mt-0.5">🔒</span>
          <span
            ><strong class="text-text-primary">Trình duyệt chặn API</strong> — Chrome desktop đã tắt
            Battery API vì lý do riêng tư</span
          >
        </li>
      </ul>
    </div>

    <!-- Battery API Info -->
    <template v-if="isSupported && battery && !noBattery">
      <!-- Thanh pin lớn -->
      <div class="bg-bg-surface border border-border-default p-6 shadow-sm">
        <div class="flex items-center justify-between mb-4">
          <p class="text-[10px] text-text-dim uppercase tracking-widest font-display">
            Dung lượng hiện tại
          </p>
          <div class="flex items-center gap-2">
            <span
              v-if="battery.charging"
              class="text-xs text-accent-sky font-display uppercase tracking-widest"
            >
              ⚡ Đang sạc
            </span>
            <span class="text-2xl font-bold font-display text-text-primary">
              {{ Math.round(battery.level * 100) }}%
            </span>
          </div>
        </div>

        <!-- Thanh pin hình dạng pin -->
        <div class="relative w-full h-10 flex items-center gap-1">
          <div
            class="flex-1 h-full bg-bg-deep border border-border-default overflow-hidden relative"
          >
            <div
              class="h-full transition-all duration-500"
              :class="batteryColor(battery.level, battery.charging)"
              :style="{ width: `${battery.level * 100}%` }"
            />
            <!-- Nhãn phần trăm -->
            <span
              class="absolute inset-0 flex items-center justify-center text-xs font-bold font-display"
              :class="battery.level > 0.15 ? 'text-bg-deep' : 'text-text-primary'"
            >
              {{ Math.round(battery.level * 100) }}%
            </span>
          </div>
          <!-- Đầu pin -->
          <div class="w-2 h-5 bg-border-default rounded-r-sm flex-shrink-0" />
        </div>

        <!-- Icon sạc chạy khi đang sạc -->
        <div v-if="battery.charging" class="mt-3 flex items-center gap-2">
          <div class="w-2 h-2 rounded-full bg-accent-sky animate-ping" />
          <p class="text-xs text-accent-sky font-display">
            Đang sạc
            <span v-if="isFinite(battery.chargingTime)">
              — đầy sau {{ formatTime(battery.chargingTime) }}
            </span>
          </p>
        </div>
        <div v-else-if="isFinite(battery.dischargingTime)" class="mt-3">
          <p class="text-xs text-text-dim font-display">
            Còn khoảng
            <strong class="text-text-secondary">{{ formatTime(battery.dischargingTime) }}</strong>
            sử dụng
          </p>
        </div>
      </div>

      <!-- Thông tin chi tiết -->
      <div class="grid grid-cols-3 gap-4">
        <div class="bg-bg-surface border border-border-default p-4 shadow-sm text-center">
          <p class="text-[10px] text-text-dim uppercase tracking-widest font-display mb-2">
            Trạng thái
          </p>
          <p
            class="text-lg font-bold font-display"
            :class="battery.charging ? 'text-accent-sky' : 'text-green-400'"
          >
            {{ battery.charging ? '⚡ Sạc' : '🔋 Xả' }}
          </p>
        </div>
        <div class="bg-bg-surface border border-border-default p-4 shadow-sm text-center">
          <p class="text-[10px] text-text-dim uppercase tracking-widest font-display mb-2">
            Mức pin
          </p>
          <p class="text-lg font-bold font-display text-text-primary">
            {{ Math.round(battery.level * 100) }}%
          </p>
        </div>
        <div class="bg-bg-surface border border-border-default p-4 shadow-sm text-center">
          <p class="text-[10px] text-text-dim uppercase tracking-widest font-display mb-2">
            Thời gian xả ước tính
          </p>
          <p class="text-lg font-bold font-display text-text-primary">
            {{ formatTime(battery.dischargingTime) }}
          </p>
        </div>
      </div>

      <!-- Cảnh báo pin yếu -->
      <div
        v-if="!battery.charging && battery.level <= 0.2"
        class="bg-accent-coral/10 border border-accent-coral p-4"
      >
        <p class="text-sm text-accent-coral font-display">
          ⚠️ Pin yếu ({{ Math.round(battery.level * 100) }}%) — cắm sạc ngay!
        </p>
      </div>
    </template>

    <!-- Không hỗ trợ Battery API -->
    <div v-else-if="!isSupported" class="bg-bg-surface border border-border-default p-6 shadow-sm">
      <p class="text-sm text-accent-amber font-display mb-1">
        ⚠️ Trình duyệt không hỗ trợ Battery API
      </p>
    </div>

    <!-- Phân tách -->
    <div class="border-t border-border-default" />

    <!-- Script PowerShell kiểm tra pin Windows -->
    <div class="bg-bg-surface border border-border-default p-6 shadow-sm space-y-4">
      <div>
        <h3
          class="font-display text-base font-semibold text-text-primary flex items-center gap-2 mb-1"
        >
          Kiểm tra nhanh độ chai pin của máy tính Windows
        </h3>
        <p class="text-sm text-text-secondary">Chạy lệnh PowerShell bên dưới để xem sức khỏe pin</p>
      </div>

      <!-- Command box -->
      <div class="flex items-center gap-3 bg-bg-deep border border-border-default p-4 group">
        <code class="flex-1 font-display text-sm text-accent-sky select-all">
          irm j2c.cc/batterycheck | iex
        </code>
        <button
          class="flex-shrink-0 px-3 py-1.5 text-xs font-display uppercase tracking-widest border transition-all"
          :class="
            copied
              ? 'bg-green-500 border-green-500 text-bg-deep'
              : 'border-border-default text-text-dim hover:border-accent-coral hover:text-accent-coral'
          "
          @click="copyCommand"
        >
          {{ copied ? '✓ Đã sao chép' : 'Sao chép' }}
        </button>
      </div>

      <!-- Hướng dẫn -->
      <div class="space-y-2 text-sm text-text-secondary">
        <p class="font-display text-[10px] uppercase tracking-widest text-text-dim">Cách chạy</p>
        <p>
          1. Nhấn
          <kbd
            class="px-1.5 py-0.5 bg-bg-deep border border-border-default text-text-dim text-xs font-display"
            >Win</kbd
          >
          +
          <kbd
            class="px-1.5 py-0.5 bg-bg-deep border border-border-default text-text-dim text-xs font-display"
            >R</kbd
          >, gõ <code class="text-accent-sky">powershell</code> rồi nhấn Enter
        </p>
        <p>2. Dán lệnh trên vào cửa sổ PowerShell và nhấn Enter</p>
        <p>3. Chờ script tải và hiển thị báo cáo chi tiết</p>
      </div>
    </div>
  </div>
</template>
