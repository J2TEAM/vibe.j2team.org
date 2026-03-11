<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

interface CameraDevice {
  deviceId: string
  label: string
  stream: MediaStream | null
  error: string | null
}

const cameras = ref<CameraDevice[]>([])
const isLoading = ref(true)
const globalError = ref('')

// Lấy danh sách webcam và mở từng cái
async function detectCameras() {
  isLoading.value = true
  globalError.value = ''

  try {
    // Yêu cầu quyền truy cập camera trước để lấy label
    const initialStream = await navigator.mediaDevices.getUserMedia({ video: true })
    // Dừng stream tạm này
    initialStream.getTracks().forEach((t) => t.stop())

    // Lấy danh sách thiết bị video
    const devices = await navigator.mediaDevices.enumerateDevices()
    const videoDevices = devices.filter((d) => d.kind === 'videoinput')

    if (videoDevices.length === 0) {
      globalError.value = 'Không tìm thấy webcam nào trên thiết bị này'
      isLoading.value = false
      return
    }

    // Tạo danh sách camera ban đầu
    cameras.value = videoDevices.map((d, i) => ({
      deviceId: d.deviceId,
      label: d.label || `Camera ${i + 1}`,
      stream: null,
      error: null,
    }))

    // Mở từng camera
    for (const cam of cameras.value) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: { exact: cam.deviceId } },
        })
        cam.stream = stream
      } catch {
        cam.error = 'Không thể mở camera này'
      }
    }
  } catch {
    globalError.value = 'Không thể truy cập camera. Vui lòng cấp quyền camera trong trình duyệt'
  }

  isLoading.value = false
}

// Gán stream vào video element khi render
function setVideoRef(el: HTMLVideoElement | null, cam: CameraDevice) {
  if (el && cam.stream) {
    el.srcObject = cam.stream
  }
}

// Dừng tất cả stream khi unmount
function stopAllStreams() {
  for (const cam of cameras.value) {
    if (cam.stream) {
      cam.stream.getTracks().forEach((t) => t.stop())
      cam.stream = null
    }
  }
}

// Quét lại từ đầu
function rescan() {
  stopAllStreams()
  detectCameras()
}

onMounted(() => {
  detectCameras()
})

onUnmounted(() => {
  stopAllStreams()
})
</script>

<template>
  <div class="flex flex-col gap-8 w-full max-w-6xl mx-auto p-4 sm:p-6 mb-20 animate-fade-up">
    <!-- Mô tả -->
    <div class="bg-bg-surface border border-border-default p-6 shadow-sm">
      <h2 class="font-display text-xl font-bold text-text-primary mb-2">Kiểm tra Webcam</h2>
      <p class="text-sm text-text-secondary leading-relaxed">
        Quét và hiển thị tất cả webcam đang kết nối với máy tính
      </p>
    </div>

    <!-- Loading -->
    <div
      v-if="isLoading"
      class="flex flex-col items-center justify-center py-20 bg-bg-surface border border-border-default"
    >
      <div
        class="w-8 h-8 border-2 border-accent-coral border-t-transparent rounded-full animate-spin mb-4"
      />
      <p class="text-sm text-text-secondary font-display">Đang quét webcam</p>
    </div>

    <!-- Lỗi chung -->
    <div
      v-else-if="globalError"
      class="flex flex-col items-center justify-center py-20 bg-bg-surface border border-border-default"
    >
      <p class="text-accent-coral font-display text-lg mb-2">⚠️</p>
      <p class="text-sm text-text-secondary text-center px-4">{{ globalError }}</p>
      <button
        class="mt-6 px-6 py-2 font-display text-sm uppercase tracking-widest bg-accent-coral text-bg-deep border border-accent-coral hover:bg-accent-coral/80 transition-all"
        @click="detectCameras"
      >
        Thử lại
      </button>
    </div>

    <!-- Danh sách camera -->
    <template v-else>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div
          v-for="cam in cameras"
          :key="cam.deviceId"
          class="bg-bg-surface border border-border-default shadow-sm overflow-hidden"
        >
          <!-- Header -->
          <div class="flex items-center justify-between p-4 border-b border-border-default">
            <div class="flex items-center gap-2">
              <div
                class="w-2 h-2 rounded-full"
                :class="cam.stream ? 'bg-green-500 animate-pulse' : 'bg-red-500'"
              />
              <span class="text-sm font-display text-text-primary truncate">{{ cam.label }}</span>
            </div>
            <span class="text-[10px] text-text-dim font-display uppercase tracking-widest">
              {{ cam.stream ? 'Đang hoạt động' : 'Lỗi' }}
            </span>
          </div>

          <!-- Video hoặc lỗi -->
          <div class="aspect-video bg-bg-deep flex items-center justify-center">
            <video
              v-if="cam.stream"
              :ref="(el) => setVideoRef(el as HTMLVideoElement, cam)"
              autoplay
              playsinline
              muted
              class="w-full h-full object-cover"
            />
            <p v-else class="text-sm text-text-dim">{{ cam.error || 'Không thể mở camera' }}</p>
          </div>
        </div>
      </div>

      <!-- Nút quét lại -->
      <div class="flex justify-center">
        <button
          class="px-6 py-2 font-display text-sm uppercase tracking-widest border border-accent-coral text-accent-coral hover:bg-accent-coral hover:text-bg-deep transition-all"
          @click="rescan"
        >
          Quét lại
        </button>
      </div>
    </template>
  </div>
</template>
