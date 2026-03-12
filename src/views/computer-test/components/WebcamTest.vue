<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'

interface CameraOption {
  deviceId: string
  label: string
}

const cameraList = ref<CameraOption[]>([])
const selectedDeviceId = ref('')
const isLoading = ref(true)
const globalError = ref('')

// Trạng thái camera đang chọn
const stream = ref<MediaStream | null>(null)
const videoRef = ref<HTMLVideoElement | null>(null)
const camError = ref('')

// Quét danh sách camera
async function detectCameras() {
  isLoading.value = true
  globalError.value = ''

  try {
    // Yêu cầu quyền trước để lấy label
    const initialStream = await navigator.mediaDevices.getUserMedia({ video: true })
    initialStream.getTracks().forEach((t) => t.stop())

    const devices = await navigator.mediaDevices.enumerateDevices()
    const videoDevices = devices.filter((d) => d.kind === 'videoinput')

    if (videoDevices.length === 0) {
      globalError.value = 'Không tìm thấy camera nào trên thiết bị này'
      isLoading.value = false
      return
    }

    cameraList.value = videoDevices.map((d, i) => ({
      deviceId: d.deviceId,
      label: d.label || `Camera ${i + 1}`,
    }))

    // Mặc định chọn camera đầu tiên
    if (
      !selectedDeviceId.value ||
      !cameraList.value.find((c) => c.deviceId === selectedDeviceId.value)
    ) {
      selectedDeviceId.value = cameraList.value[0]!.deviceId
    }
  } catch {
    globalError.value = 'Không thể truy cập camera. Vui lòng cấp quyền camera trong trình duyệt'
  }

  isLoading.value = false
}

// Mở camera được chọn
async function openCamera(deviceId: string) {
  stopCurrentStream()
  camError.value = ''

  try {
    const s = await navigator.mediaDevices.getUserMedia({
      video: { deviceId: { exact: deviceId } },
    })
    stream.value = s

    // Gán stream vào video element
    if (videoRef.value) {
      videoRef.value.srcObject = s
    }
  } catch {
    stream.value = null
    camError.value = 'Không thể mở camera này'
  }
}

// Gán stream khi video ref sẵn sàng
function onVideoMounted(el: HTMLVideoElement | null) {
  videoRef.value = el
  if (el && stream.value) {
    el.srcObject = stream.value
  }
}

// Dừng stream hiện tại
function stopCurrentStream() {
  if (stream.value) {
    stream.value.getTracks().forEach((t) => t.stop())
    stream.value = null
  }
  if (videoRef.value) {
    videoRef.value.srcObject = null
  }
}

// Quét lại
function rescan() {
  stopCurrentStream()
  detectCameras()
}

// Khi đổi camera → mở camera mới
watch(selectedDeviceId, (newId) => {
  if (newId) openCamera(newId)
})

onMounted(async () => {
  await detectCameras()
  if (selectedDeviceId.value) {
    openCamera(selectedDeviceId.value)
  }
})

onUnmounted(() => {
  stopCurrentStream()
})
</script>

<template>
  <div class="flex flex-col gap-8 w-full max-w-6xl mx-auto p-4 sm:p-6 mb-20 animate-fade-up">
    <!-- Mô tả -->
    <div class="bg-bg-surface border border-border-default p-6 shadow-sm">
      <h2 class="font-display text-xl font-bold text-text-primary mb-2">Kiểm tra Webcam</h2>
      <p class="text-sm text-text-secondary leading-relaxed">
        Chọn camera và xem nó còn nhìn thấy bạn không?
      </p>
      <p class="text-sm text-text-secondary leading-relaxed">
        Nhớ kiểm tra xem bạn có tắt camera bằng phím bấm vật lý, hay có dán băng dính che camera
        không, đã gạt mở thanh trượt che camera chưa?
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
      <p class="text-sm text-text-secondary font-display">Đang quét camera</p>
    </div>

    <!-- Lỗi chung -->
    <div
      v-else-if="globalError && cameraList.length === 0"
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

    <!-- Nội dung chính -->
    <template v-else>
      <!-- Chọn camera -->
      <div class="bg-bg-surface border border-border-default p-6 shadow-sm">
        <p class="text-[10px] text-text-dim uppercase tracking-widest font-display mb-3">
          Chọn camera
        </p>
        <select
          v-model="selectedDeviceId"
          class="w-full bg-bg-deep border border-border-default text-text-primary text-sm font-display px-4 py-3 focus:outline-none focus:border-accent-coral transition-colors cursor-pointer"
        >
          <option v-for="cam in cameraList" :key="cam.deviceId" :value="cam.deviceId">
            {{ cam.label }}
          </option>
        </select>
      </div>

      <!-- Camera đang hoạt động -->
      <div class="bg-bg-surface border border-border-default shadow-sm overflow-hidden">
        <!-- Header -->
        <div class="flex items-center justify-between p-4 border-b border-border-default">
          <div class="flex items-center gap-2">
            <div
              class="w-2 h-2 rounded-full"
              :class="stream ? 'bg-green-500 animate-pulse' : 'bg-red-500'"
            />
            <span class="text-sm font-display text-text-primary truncate">
              {{ cameraList.find((c) => c.deviceId === selectedDeviceId)?.label || 'Camera' }}
            </span>
          </div>
          <span class="text-[10px] text-text-dim font-display uppercase tracking-widest">
            {{ stream ? 'Đang hoạt động' : 'Lỗi' }}
          </span>
        </div>

        <!-- Video feed -->
        <div class="aspect-video bg-bg-deep flex items-center justify-center">
          <video
            v-if="stream"
            :ref="(el) => onVideoMounted(el as HTMLVideoElement)"
            autoplay
            playsinline
            muted
            class="w-full h-full object-cover"
          />
          <p v-else class="text-sm text-text-dim">{{ camError || 'Không thể mở camera' }}</p>
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
