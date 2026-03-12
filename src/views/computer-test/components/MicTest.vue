<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'

interface MicOption {
  deviceId: string
  label: string
}

const micList = ref<MicOption[]>([])
const selectedDeviceId = ref('')
const isLoading = ref(true)
const globalError = ref('')

// Trạng thái micro đang chọn
const stream = ref<MediaStream | null>(null)
const analyser = ref<AnalyserNode | null>(null)
const volume = ref(0)
const gainLevel = ref(100) // 0-100%, mặc định 100%
const isRecording = ref(false)
const audioUrl = ref<string | null>(null)
let recorder: MediaRecorder | null = null
let chunks: Blob[] = []
let animationId: number | null = null
let audioCtx: AudioContext | null = null
let gainNode: GainNode | null = null

// Quét danh sách micro
async function detectMics() {
  isLoading.value = true
  globalError.value = ''

  try {
    // Yêu cầu quyền truy cập micro trước để lấy label
    const initialStream = await navigator.mediaDevices.getUserMedia({ audio: true })
    initialStream.getTracks().forEach((t) => t.stop())

    const devices = await navigator.mediaDevices.enumerateDevices()
    const audioDevices = devices.filter((d) => d.kind === 'audioinput')

    if (audioDevices.length === 0) {
      globalError.value = 'Không tìm thấy micro nào trên thiết bị này'
      isLoading.value = false
      return
    }

    micList.value = audioDevices.map((d, i) => ({
      deviceId: d.deviceId,
      label: d.label || `Micro ${i + 1}`,
    }))

    // Ưu tiên chọn micro có label chứa "Default"
    if (
      !selectedDeviceId.value ||
      !micList.value.find((m) => m.deviceId === selectedDeviceId.value)
    ) {
      const defaultMic = micList.value.find(
        (m) => m.label.toLowerCase().includes('default') || m.deviceId === 'default',
      )
      selectedDeviceId.value = defaultMic ? defaultMic.deviceId : micList.value[0]!.deviceId
    }
  } catch {
    globalError.value = 'Không thể truy cập micro. Vui lòng cấp quyền micro trong trình duyệt'
  }

  isLoading.value = false
}

// Mở micro được chọn
async function openMic(deviceId: string) {
  // Dừng micro cũ
  stopCurrentMic()

  try {
    const s = await navigator.mediaDevices.getUserMedia({
      audio: { deviceId: { exact: deviceId } },
    })
    stream.value = s

    // Tạo analyser và gain node để đo/điều chỉnh âm lượng
    audioCtx = new AudioContext()
    const source = audioCtx.createMediaStreamSource(s)
    gainNode = audioCtx.createGain()
    gainNode.gain.value = gainLevel.value / 100
    const a = audioCtx.createAnalyser()
    a.fftSize = 256
    // Chuỗi: source → gain → analyser
    source.connect(gainNode)
    gainNode.connect(a)
    analyser.value = a

    // Bắt đầu cập nhật âm lượng
    startVolumeMonitor()
  } catch {
    stream.value = null
    globalError.value = 'Không thể mở micro này'
  }
}

// Theo dõi âm lượng realtime
function startVolumeMonitor() {
  if (!analyser.value) return
  const dataArray = new Uint8Array(analyser.value.frequencyBinCount)

  function update() {
    if (!analyser.value) return
    analyser.value.getByteFrequencyData(dataArray)
    let sum = 0
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i]!
    }
    volume.value = Math.round((sum / dataArray.length / 255) * 100)
    animationId = requestAnimationFrame(update)
  }
  update()
}

// Bắt đầu thu âm
function startRecording() {
  if (!stream.value) return
  audioUrl.value = null
  chunks = []

  recorder = new MediaRecorder(stream.value)
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data)
  }
  recorder.onstop = () => {
    const blob = new Blob(chunks, { type: 'audio/webm' })
    audioUrl.value = URL.createObjectURL(blob)
  }
  recorder.start()
  isRecording.value = true
}

// Dừng thu âm
function stopRecording() {
  if (recorder && recorder.state !== 'inactive') {
    recorder.stop()
  }
  isRecording.value = false
}

// Dừng micro hiện tại
function stopCurrentMic() {
  if (animationId) {
    cancelAnimationFrame(animationId)
    animationId = null
  }
  if (recorder && recorder.state !== 'inactive') {
    recorder.stop()
  }
  recorder = null
  isRecording.value = false
  if (stream.value) {
    stream.value.getTracks().forEach((t) => t.stop())
    stream.value = null
  }
  if (audioCtx) {
    audioCtx.close()
    audioCtx = null
  }
  gainNode = null
  analyser.value = null
  volume.value = 0
  if (audioUrl.value) {
    URL.revokeObjectURL(audioUrl.value)
    audioUrl.value = null
  }
}

// Khi đổi mức gain -> cập nhật GainNode
watch(gainLevel, (val) => {
  if (gainNode) {
    gainNode.gain.value = val / 100
  }
})

// Màu thanh âm lượng
function volumeColor(vol: number): string {
  if (vol > 70) return 'bg-red-500'
  if (vol > 40) return 'bg-accent-amber'
  return 'bg-green-500'
}

// Khi đổi micro -> mở micro mới
watch(selectedDeviceId, (newId) => {
  if (newId) openMic(newId)
})

onMounted(async () => {
  await detectMics()
  // Mở micro mặc định sau khi quét xong
  if (selectedDeviceId.value) {
    openMic(selectedDeviceId.value)
  }
})

onUnmounted(() => {
  stopCurrentMic()
})
</script>

<template>
  <div class="flex flex-col gap-8 w-full max-w-6xl mx-auto p-4 sm:p-6 mb-20 animate-fade-up">
    <!-- Mô tả -->
    <div class="bg-bg-surface border border-border-default p-6 shadow-sm">
      <h2 class="font-display text-xl font-bold text-text-primary mb-2">Kiểm tra Micro</h2>
      <p class="text-sm text-text-secondary leading-relaxed">
        Chọn micro và kiểm tra xem micro còn nghe bạn nói không?
      </p>
      <p class="text-sm text-text-secondary leading-relaxed">
        Nhớ kiểm tra xem bạn có tắt micro bằng phím bấm vật lý, hay có dán băng dính che micro
        không?
      </p>
      <p class="text-sm text-text-secondary leading-relaxed">
        Micro trên laptop Windows thường ở gần camera, còn trên MacBook thường ở phía trên bàn phím,
        gần touchbar (nếu có)
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
      <p class="text-sm text-text-secondary font-display">Đang quét micro</p>
    </div>

    <!-- Lỗi chung -->
    <div
      v-else-if="globalError && micList.length === 0"
      class="flex flex-col items-center justify-center py-20 bg-bg-surface border border-border-default"
    >
      <p class="text-accent-coral font-display text-lg mb-2">⚠️</p>
      <p class="text-sm text-text-secondary text-center px-4">{{ globalError }}</p>
      <button
        class="mt-6 px-6 py-2 font-display text-sm uppercase tracking-widest bg-accent-coral text-bg-deep border border-accent-coral hover:bg-accent-coral/80 transition-all"
        @click="detectMics"
      >
        Thử lại
      </button>
    </div>

    <!-- Nội dung chính -->
    <template v-else>
      <!-- Chọn micro -->
      <div class="bg-bg-surface border border-border-default p-6 shadow-sm">
        <p class="text-[10px] text-text-dim uppercase tracking-widest font-display mb-3">
          Chọn micro
        </p>
        <select
          v-model="selectedDeviceId"
          class="w-full bg-bg-deep border border-border-default text-text-primary text-sm font-display px-4 py-3 focus:outline-none focus:border-accent-coral transition-colors cursor-pointer"
        >
          <option v-for="mic in micList" :key="mic.deviceId" :value="mic.deviceId">
            {{ mic.label }}
          </option>
        </select>
      </div>

      <!-- Micro đang hoạt động -->
      <div class="bg-bg-surface border border-border-default shadow-sm overflow-hidden">
        <!-- Header -->
        <div class="flex items-center justify-between p-4 border-b border-border-default">
          <div class="flex items-center gap-2">
            <div
              class="w-2 h-2 rounded-full"
              :class="stream ? 'bg-green-500 animate-pulse' : 'bg-red-500'"
            />
            <span class="text-sm font-display text-text-primary truncate">
              {{ micList.find((m) => m.deviceId === selectedDeviceId)?.label || 'Micro' }}
            </span>
          </div>
          <span class="text-[10px] text-text-dim font-display uppercase tracking-widest">
            {{ stream ? 'Đang hoạt động' : 'Lỗi' }}
          </span>
        </div>

        <!-- Nội dung -->
        <div class="p-6 space-y-5">
          <template v-if="stream">
            <!-- Thanh âm lượng -->
            <div>
              <div class="flex items-center justify-between mb-2">
                <span class="text-[10px] text-text-dim font-display uppercase tracking-widest">
                  Âm thanh
                </span>
                <span class="text-xs font-bold font-display text-text-primary">{{ volume }}%</span>
              </div>
              <div class="w-full h-4 bg-bg-deep rounded-full overflow-hidden">
                <div
                  class="h-full rounded-full transition-all duration-75"
                  :class="volumeColor(volume)"
                  :style="{ width: `${volume}%` }"
                />
              </div>
            </div>

            <!-- Điều chỉnh âm lượng -->
            <div>
              <div class="flex items-center justify-between mb-2">
                <span class="text-[10px] text-text-dim uppercase tracking-widest"> Âm lượng </span>
                <span class="text-xs font-bold font-display text-text-primary">
                  {{ gainLevel }}%
                </span>
              </div>
              <input
                v-model.number="gainLevel"
                type="range"
                min="0"
                max="100"
                step="5"
                class="w-full h-1.5 accent-accent-coral cursor-pointer"
              />
            </div>
            <div class="flex gap-3">
              <button
                v-if="!isRecording"
                class="flex-1 px-4 py-3 text-xs font-display font-semibold uppercase tracking-widest bg-accent-coral text-bg-deep border border-accent-coral hover:bg-accent-coral/80 transition-all"
                @click="startRecording"
              >
                🎙 Thu âm
              </button>
              <button
                v-else
                class="flex-1 px-4 py-3 text-xs font-display font-semibold uppercase tracking-widest bg-red-500 text-white border border-red-500 hover:bg-red-600 transition-all animate-pulse"
                @click="stopRecording"
              >
                ⏹ Dừng thu
              </button>
            </div>

            <!-- Phát lại -->
            <div v-if="audioUrl" class="space-y-2">
              <span class="text-[10px] text-text-dim font-display uppercase tracking-widest"
                >Phát lại bản ghi</span
              >
              <audio :src="audioUrl" controls class="w-full h-10" />
            </div>
          </template>

          <!-- Lỗi micro -->
          <p v-else class="text-sm text-text-dim text-center py-6">Không thể mở micro này</p>
        </div>
      </div>
    </template>
  </div>
</template>
