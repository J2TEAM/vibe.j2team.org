<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

// Danh sách màu để kiểm tra điểm chết
const colors = [
  { name: 'Đen', value: '#000000', text: 'white' },
  { name: 'Trắng', value: '#ffffff', text: 'black' },
  { name: 'Đỏ', value: '#ff0000', text: 'white' },
  { name: 'Xanh lá', value: '#00ff00', text: 'black' },
  { name: 'Xanh dương', value: '#0000ff', text: 'white' },
]

// Trạng thái hiện tại
const currentIndex = ref(0)
const isFullscreen = ref(false)
const brightness = ref(100) // 0–100

// Màu hiện tại
const currentColor = () => colors[currentIndex.value]!

// Bắt đầu kiểm tra: vào chế độ toàn màn hình
async function startTest() {
  try {
    await document.documentElement.requestFullscreen()
  } catch {
    // Trình duyệt không hỗ trợ fullscreen, vẫn hiển thị overlay
  }
  isFullscreen.value = true
  document.body.style.overflow = 'hidden' // Ẩn thanh cuộn khi fullscreen
}

// Thoát chế độ kiểm tra
async function exitTest() {
  isFullscreen.value = false
  document.body.style.overflow = '' // Khôi phục thanh cuộn khi thoát
  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen()
    }
  } catch {
    // ignore
  }
}

// Chuyển màu kế tiếp
function nextColor() {
  currentIndex.value = (currentIndex.value + 1) % colors.length
}

// Chuyển màu trước đó
function prevColor() {
  currentIndex.value = (currentIndex.value - 1 + colors.length) % colors.length
}

// Bắt phím khi đang ở chế độ toàn màn hình
function handleKeyDown(e: KeyboardEvent) {
  if (!isFullscreen.value) return
  e.preventDefault()
  if (e.key === 'ArrowRight') nextColor()
  if (e.key === 'ArrowLeft') prevColor()
  if (e.key === 'Escape') exitTest()
}

// Lắng nghe sự kiện thoát fullscreen bằng cách khác (e.g. phím ESC của trình duyệt)
function handleFullscreenChange() {
  if (!document.fullscreenElement) {
    isFullscreen.value = false
    document.body.style.overflow = '' // Khôi phục thanh cuộn
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
  document.addEventListener('fullscreenchange', handleFullscreenChange)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
})
</script>

<template>
  <div class="flex flex-col gap-8 w-full max-w-6xl mx-auto p-4 sm:p-6 mb-20 animate-fade-up">
    <!-- Mô tả -->
    <div class="bg-bg-surface border border-border-default p-6 shadow-sm">
      <h2 class="font-display text-xl font-bold text-text-primary mb-2">Kiểm tra màn hình</h2>
      <p class="text-sm text-text-secondary leading-relaxed">
        Hiển thị từng màu trên toàn màn hình để phát hiện điểm chết (dead pixel) hoặc điểm kẹt
        (stuck pixel)
      </p>
    </div>

    <!-- Chọn màu bắt đầu -->
    <div class="bg-bg-surface border border-border-default p-6 shadow-sm">
      <p class="text-[10px] text-text-dim uppercase tracking-widest font-display mb-4">
        Chọn màu bắt đầu
      </p>
      <div class="flex flex-wrap gap-3">
        <button
          v-for="(color, i) in colors"
          :key="color.value"
          class="flex flex-col items-center gap-2 group"
          @click="currentIndex = i"
        >
          <div
            class="w-16 h-16 border-2 transition-all duration-150"
            :style="{ backgroundColor: color.value }"
            :class="
              currentIndex === i
                ? 'border-accent-coral scale-110'
                : 'border-border-default group-hover:border-text-dim'
            "
          />
          <span
            class="text-[10px] font-display uppercase tracking-widest"
            :class="currentIndex === i ? 'text-accent-coral' : 'text-text-dim'"
          >
            {{ color.name }}
          </span>
        </button>
      </div>
    </div>

    <!-- Điều chỉnh độ sáng -->
    <div class="bg-bg-surface border border-border-default p-6 shadow-sm">
      <div class="flex items-center justify-between mb-3">
        <p class="text-[10px] text-text-dim uppercase tracking-widest font-display">
          Độ sáng màn hình
        </p>
        <span class="text-sm font-bold text-text-primary font-display">{{ brightness }}%</span>
      </div>
      <input
        v-model="brightness"
        type="range"
        min="10"
        max="100"
        step="5"
        class="w-full h-1.5 accent-accent-coral cursor-pointer"
      />
      <!-- <div class="flex justify-between mt-1">
        <span class="text-[10px] text-text-dim font-display">Tối</span>
        <span class="text-[10px] text-text-dim font-display">Sáng</span>
      </div> -->
      <p class="text-xs text-text-dim mt-3 leading-relaxed">
        Lưu ý: Thanh này điều chỉnh độ sáng của màu hiển thị trong ô kiểm tra, không phải độ sáng
        phần cứng màn hình
      </p>
    </div>

    <!-- Nút bắt đầu -->
    <div class="flex gap-4 items-center">
      <button
        class="px-8 py-3 font-display font-bold text-sm uppercase tracking-widest bg-accent-coral text-bg-deep border border-accent-coral hover:bg-accent-coral/80 transition-all"
        @click="startTest"
      >
        Bắt đầu kiểm tra
      </button>
      <p class="text-xs text-text-dim">Sẽ chuyển sang chế độ toàn màn hình</p>
    </div>

    <!-- Overlay toàn màn hình khi đang kiểm tra -->
    <Teleport to="body">
      <div
        v-if="isFullscreen"
        class="fixed inset-0 z-[9999] flex flex-col items-center justify-center cursor-pointer select-none"
        :style="{
          backgroundColor: currentColor().value,
          filter: `brightness(${brightness / 100})`,
        }"
        @click="nextColor"
      ></div>
    </Teleport>
  </div>
</template>
