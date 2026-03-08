<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useWebrtcFileTransfer, formatBytes } from './use-webrtc-file-transfer'
import PeerDropGuidelineModal from './peer-drop-guideline-modal.vue'

const route = useRoute()

const {
  state,
  errorMessage,
  isLoading,
  offerSdp,
  answerSdp,
  selectedFiles,
  sendProgress,
  totalBytes,
  incomingFiles,
  receiveProgress,
  bytesReceived,
  receiveTotalBytes,
  downloadReady,
  selectFiles,
  removeFile,
  createOffer,
  joinWithOffer,
  acceptAnswer,
  downloadFiles,
  disconnect,
} = useWebrtcFileTransfer()

const pastedAnswer = ref('')
const pastedOffer = ref('')
const copied = ref(false)
const linkCopied = ref(false)
const hasOfferFromUrl = ref(false)
const showGuideline = ref(false)
const isDragOver = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

// Rotating loading messages
const loadingMessages = [
  'Đang tạo mã kết nối...',
  'Đang tìm đường kết nối tốt nhất...',
  'Đang chuẩn bị kết nối...',
  'Sắp xong rồi...',
]
const loadingMsgIndex = ref(0)
let loadingInterval: ReturnType<typeof setInterval> | null = null

// Watch loading state for rotating messages
import { watchEffect } from 'vue'
watchEffect(() => {
  if (isLoading.value) {
    loadingMsgIndex.value = 0
    loadingInterval = setInterval(() => {
      loadingMsgIndex.value = (loadingMsgIndex.value + 1) % loadingMessages.length
    }, 2500)
  } else if (loadingInterval) {
    clearInterval(loadingInterval)
    loadingInterval = null
  }
})

// File metadata encoded in URL for receiver preview
const filesMeta = computed(() => {
  const hash = window.location.hash
  if (!hash.includes('&files=')) return null
  try {
    const filesParam = hash.split('&files=')[1] ?? ''
    return JSON.parse(decodeURIComponent(filesParam))
  } catch {
    return null
  }
})

// Auto-detect offer from URL hash
onMounted(() => {
  const hash = window.location.hash
  if (hash.startsWith('#offer=')) {
    try {
      const offerPart = hash.split('&files=')[0] ?? ''
      const encoded = offerPart.slice('#offer='.length)
      pastedOffer.value = decodeURIComponent(encoded)
      hasOfferFromUrl.value = true
    } catch {
      // Invalid hash, ignore
    }
  }
})

/** Generate shareable link with offer + file metadata */
function generateShareLink(base64Sdp: string): string {
  const meta = selectedFiles.value.map((f) => ({
    name: f.name,
    size: f.size,
  }))
  const filesParam = encodeURIComponent(JSON.stringify(meta))
  return `${window.location.origin}${route.path}#offer=${encodeURIComponent(base64Sdp)}&files=${filesParam}`
}

async function safeCopy(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

async function copyShareLink() {
  const link = generateShareLink(offerSdp.value)
  linkCopied.value = await safeCopy(link)
  if (linkCopied.value) setTimeout(() => (linkCopied.value = false), 2000)
}

async function handleCreateOffer() {
  const sdp = await createOffer()
  if (sdp) {
    const link = generateShareLink(sdp)
    linkCopied.value = await safeCopy(link)
    if (linkCopied.value) setTimeout(() => (linkCopied.value = false), 3000)
  }
}

async function handleJoin() {
  if (window.location.hash) {
    history.replaceState(null, '', route.path)
  }
  const answer = await joinWithOffer(pastedOffer.value)
  if (answer) {
    copied.value = await safeCopy(answer)
    if (copied.value) setTimeout(() => (copied.value = false), 3000)
  }
}

async function handleAcceptAnswer() {
  await acceptAnswer(pastedAnswer.value)
}

async function copyToClipboard(text: string) {
  copied.value = await safeCopy(text)
  if (copied.value) setTimeout(() => (copied.value = false), 2000)
}

// Drag and drop handlers
function onDragOver(e: DragEvent) {
  e.preventDefault()
  isDragOver.value = true
}

function onDragLeave() {
  isDragOver.value = false
}

function onDrop(e: DragEvent) {
  e.preventDefault()
  isDragOver.value = false
  const files = Array.from(e.dataTransfer?.files || [])
  if (files.length > 0) {
    selectFiles([...selectedFiles.value, ...files])
  }
}

function onFileSelect(e: Event) {
  const input = e.target as HTMLInputElement
  const files = Array.from(input.files || [])
  if (files.length > 0) {
    selectFiles([...selectedFiles.value, ...files])
  }
  input.value = ''
}

function triggerFileInput() {
  fileInput.value?.click()
}
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body px-4 py-8">
    <div class="mx-auto max-w-3xl">
      <!-- Header -->
      <div class="mb-10 animate-fade-up">
        <div class="flex items-center gap-3 mb-2">
          <h1 class="font-display text-4xl sm:text-5xl font-bold text-accent-coral">Peer Drop</h1>
          <button
            class="border border-border-default bg-bg-surface px-3 py-1 text-xs font-display text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
            @click="showGuideline = true"
          >
            ? Hướng dẫn
          </button>
        </div>
        <p class="text-text-secondary text-lg">
          Gửi file P2P trực tiếp qua trình duyệt — không cần server.
        </p>
      </div>

      <!-- Error -->
      <div
        v-if="errorMessage"
        class="mb-6 border border-accent-coral/40 bg-accent-coral/10 p-4 text-sm text-accent-coral animate-fade-up"
      >
        {{ errorMessage }}
      </div>

      <!-- STATE: IDLE — File picker + drag-drop -->
      <div
        v-if="state === 'idle' || state === 'files-ready'"
        class="space-y-6 animate-fade-up animate-delay-2"
      >
        <!-- Receiver from URL (has offer) -->
        <div v-if="hasOfferFromUrl && state === 'idle'" class="space-y-6">
          <h2 class="font-display text-2xl font-semibold flex items-center gap-3">
            <span class="text-accent-sky font-display text-sm tracking-widest">//</span>
            Nhận file
          </h2>

          <!-- File preview from URL -->
          <div v-if="filesMeta" class="border border-border-default bg-bg-surface p-4">
            <p class="text-xs text-text-dim mb-3">Bạn sắp nhận:</p>
            <div class="space-y-2">
              <div
                v-for="(file, i) in filesMeta"
                :key="i"
                class="flex items-center justify-between text-sm border border-border-default bg-bg-deep px-3 py-2"
              >
                <span class="text-text-primary truncate mr-3">{{ file.name }}</span>
                <span class="text-text-dim text-xs whitespace-nowrap">{{
                  formatBytes(file.size)
                }}</span>
              </div>
            </div>
          </div>

          <button
            :disabled="!pastedOffer.trim()"
            class="w-full border border-accent-sky bg-accent-sky/10 px-4 py-3 text-sm font-display text-accent-sky transition hover:bg-accent-sky/20 disabled:opacity-30 disabled:cursor-not-allowed"
            @click="handleJoin"
          >
            Nhận file
          </button>
        </div>

        <!-- Sender flow -->
        <template v-if="!hasOfferFromUrl">
          <h2 class="font-display text-2xl font-semibold flex items-center gap-3">
            <span class="text-accent-coral font-display text-sm tracking-widest">//</span>
            Chọn file để gửi
          </h2>

          <!-- Drop zone -->
          <div
            class="border-2 border-dashed p-8 text-center transition-all duration-300 cursor-pointer"
            :class="
              isDragOver
                ? 'border-accent-coral bg-accent-coral/5'
                : 'border-border-default bg-bg-surface hover:border-accent-coral/50'
            "
            @dragover="onDragOver"
            @dragleave="onDragLeave"
            @drop="onDrop"
            @click="triggerFileInput"
          >
            <input ref="fileInput" type="file" multiple class="hidden" @change="onFileSelect" />
            <div class="space-y-2">
              <svg
                class="mx-auto w-12 h-12 text-text-dim"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="1.5"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                />
              </svg>
              <p class="text-text-secondary text-sm">
                Kéo thả file vào đây hoặc <span class="text-accent-coral">bấm để chọn</span>
              </p>
              <p class="text-text-dim text-xs">Hỗ trợ nhiều file cùng lúc</p>
            </div>
          </div>

          <!-- Selected files list -->
          <div v-if="selectedFiles.length > 0" class="space-y-3">
            <div class="flex items-center justify-between">
              <p class="text-xs text-text-dim font-display tracking-wide">
                // {{ selectedFiles.length }} file — {{ formatBytes(totalBytes) }}
              </p>
              <button
                class="text-xs text-text-dim hover:text-accent-coral transition"
                @click="triggerFileInput"
              >
                + Thêm file
              </button>
            </div>
            <div class="space-y-2">
              <div
                v-for="(file, i) in selectedFiles"
                :key="i"
                class="flex items-center justify-between border border-border-default bg-bg-surface px-4 py-2.5"
              >
                <div class="flex-1 min-w-0 mr-3">
                  <p class="text-sm text-text-primary truncate">{{ file.name }}</p>
                  <p class="text-xs text-text-dim">{{ formatBytes(file.size) }}</p>
                </div>
                <button
                  class="text-text-dim hover:text-accent-coral transition text-xs"
                  @click="removeFile(i)"
                >
                  Xoá
                </button>
              </div>
            </div>

            <!-- Create offer button -->
            <button
              class="w-full border border-accent-coral bg-accent-coral/10 px-4 py-3 text-sm font-display text-accent-coral transition hover:bg-accent-coral/20"
              @click="handleCreateOffer"
            >
              Tạo link mời
            </button>
          </div>

          <!-- Manual join section -->
          <div class="border border-border-default bg-bg-surface p-6 mt-4">
            <p class="font-display text-lg font-semibold text-text-primary mb-2">Nhận file</p>
            <p class="text-sm text-text-secondary mb-3">Dán mã kết nối từ người gửi.</p>
            <textarea
              v-model="pastedOffer"
              placeholder="Dán mã mời tại đây..."
              class="w-full bg-bg-deep border border-border-default p-3 text-xs text-text-primary placeholder:text-text-dim resize-none h-24 focus:border-accent-sky focus:outline-none"
            />
            <button
              :disabled="!pastedOffer.trim()"
              class="mt-3 w-full border border-accent-sky bg-accent-sky/10 px-4 py-2 text-sm font-display text-accent-sky transition hover:bg-accent-sky/20 disabled:opacity-30 disabled:cursor-not-allowed"
              @click="handleJoin"
            >
              Kết nối
            </button>
          </div>
        </template>
      </div>

      <!-- STATE: CREATING-OFFER / WAITING-ANSWER -->
      <div
        v-if="state === 'creating-offer' || state === 'waiting-answer'"
        class="space-y-6 animate-fade-up"
      >
        <h2 class="font-display text-2xl font-semibold flex items-center gap-3">
          <span class="text-accent-amber font-display text-sm tracking-widest">//</span>
          Bước 1: Gửi link này cho người nhận
        </h2>

        <div class="border border-border-default bg-bg-surface p-4">
          <p v-if="isLoading" class="text-sm text-text-dim py-4 text-center animate-pulse">
            {{ loadingMessages[loadingMsgIndex] }}
          </p>
          <template v-else>
            <p class="text-xs text-text-dim mb-3">
              Gửi link cho người muốn nhận file. Họ mở link sẽ thấy danh sách file bạn gửi.
            </p>
            <button
              :disabled="!offerSdp"
              class="w-full border border-accent-coral bg-accent-coral/10 px-4 py-3 text-sm font-display text-accent-coral transition hover:bg-accent-coral/20 disabled:opacity-30 disabled:cursor-not-allowed"
              @click="copyShareLink"
            >
              {{ linkCopied ? 'Đã copy link!' : 'Copy link mời' }}
            </button>

            <details class="mt-3">
              <summary
                class="text-xs text-text-dim cursor-pointer hover:text-text-secondary transition"
              >
                Hoặc copy mã thủ công
              </summary>
              <textarea
                :value="offerSdp"
                readonly
                class="mt-2 w-full bg-bg-deep border border-border-default p-3 text-xs text-text-secondary resize-none h-28 focus:outline-none"
              />
              <button
                :disabled="!offerSdp"
                class="mt-2 border border-border-default bg-bg-surface px-4 py-2 text-xs font-display text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
                @click="copyToClipboard(offerSdp)"
              >
                {{ copied ? 'Đã copy!' : 'Copy mã mời' }}
              </button>
            </details>
          </template>
        </div>

        <!-- Files being sent -->
        <div class="border border-border-default bg-bg-surface p-4">
          <p class="text-xs text-text-dim mb-2">File đang chờ gửi:</p>
          <div class="space-y-1">
            <div
              v-for="(file, i) in selectedFiles"
              :key="i"
              class="flex items-center justify-between text-xs px-2 py-1.5"
            >
              <span class="text-text-secondary truncate mr-2">{{ file.name }}</span>
              <span class="text-text-dim whitespace-nowrap">{{ formatBytes(file.size) }}</span>
            </div>
          </div>
        </div>

        <h2 class="font-display text-2xl font-semibold flex items-center gap-3 mt-8">
          <span class="text-accent-amber font-display text-sm tracking-widest">//</span>
          Bước 2: Dán mã trả lời từ người nhận
        </h2>

        <div class="border border-border-default bg-bg-surface p-4">
          <p class="text-xs text-text-dim mb-2">
            Sau khi người nhận bấm "Nhận file", họ sẽ nhận được mã trả lời. Dán mã đó vào đây.
          </p>
          <textarea
            v-model="pastedAnswer"
            placeholder="Dán mã trả lời tại đây..."
            class="w-full bg-bg-deep border border-border-default p-3 text-xs text-text-primary placeholder:text-text-dim resize-none h-28 focus:border-accent-amber focus:outline-none"
          />
          <button
            :disabled="!pastedAnswer.trim()"
            class="mt-3 border border-accent-coral bg-accent-coral/10 px-4 py-2 text-sm font-display text-accent-coral transition hover:bg-accent-coral/20 disabled:opacity-30 disabled:cursor-not-allowed"
            @click="handleAcceptAnswer"
          >
            Kết nối & Gửi file
          </button>
        </div>
      </div>

      <!-- STATE: JOINING (Receiver) — Show answer for copy back -->
      <div v-if="state === 'joining'" class="space-y-6 animate-fade-up">
        <h2 class="font-display text-2xl font-semibold flex items-center gap-3">
          <span class="text-accent-sky font-display text-sm tracking-widest">//</span>
          Gửi mã trả lời cho người gửi
        </h2>

        <div class="border border-border-default bg-bg-surface p-4">
          <p v-if="isLoading" class="text-sm text-text-dim py-4 text-center animate-pulse">
            {{ loadingMessages[loadingMsgIndex] }}
          </p>
          <template v-else>
            <p class="text-xs text-accent-sky mb-2">
              Mã trả lời đã tự động copy! Gửi lại cho người gửi — họ dán vào ô "Bước 2".
            </p>
            <textarea
              :value="answerSdp"
              readonly
              class="w-full bg-bg-deep border border-border-default p-3 text-xs text-text-secondary resize-none h-28 focus:outline-none"
            />
            <button
              :disabled="!answerSdp"
              class="mt-3 border border-accent-sky bg-accent-sky/10 px-4 py-2 text-sm font-display text-accent-sky transition hover:bg-accent-sky/20 disabled:opacity-30 disabled:cursor-not-allowed"
              @click="copyToClipboard(answerSdp)"
            >
              {{ copied ? 'Đã copy!' : 'Copy mã trả lời' }}
            </button>
          </template>
        </div>

        <p class="text-xs text-text-dim text-center">
          Đang chờ người gửi kết nối... File sẽ được chuyển tự động khi kết nối thành công.
        </p>
      </div>

      <!-- STATE: TRANSFERRING -->
      <div v-if="state === 'transferring'" class="space-y-6 animate-fade-up">
        <h2 class="font-display text-2xl font-semibold flex items-center gap-3">
          <span class="text-accent-amber font-display text-sm tracking-widest">//</span>
          Đang chuyển file...
        </h2>

        <!-- Sender progress -->
        <div
          v-if="selectedFiles.length > 0"
          class="border border-border-default bg-bg-surface p-4 space-y-3"
        >
          <div class="flex items-center justify-between text-sm">
            <span class="text-text-secondary">Đang gửi...</span>
            <span class="text-accent-coral font-display">{{ sendProgress }}%</span>
          </div>
          <div class="w-full h-2 bg-bg-deep border border-border-default overflow-hidden">
            <div
              class="h-full bg-accent-coral transition-all duration-300"
              :style="{ width: sendProgress + '%' }"
            />
          </div>
          <p class="text-xs text-text-dim">{{ formatBytes(totalBytes) }} tổng cộng</p>
        </div>

        <!-- Receiver progress -->
        <div
          v-if="incomingFiles.length > 0"
          class="border border-border-default bg-bg-surface p-4 space-y-3"
        >
          <div class="flex items-center justify-between text-sm">
            <span class="text-text-secondary">Đang nhận...</span>
            <span class="text-accent-sky font-display">{{ receiveProgress }}%</span>
          </div>
          <div class="w-full h-2 bg-bg-deep border border-border-default overflow-hidden">
            <div
              class="h-full bg-accent-sky transition-all duration-300"
              :style="{ width: receiveProgress + '%' }"
            />
          </div>
          <p class="text-xs text-text-dim">
            {{ formatBytes(bytesReceived) }} / {{ formatBytes(receiveTotalBytes) }}
          </p>
          <div class="space-y-1 mt-2">
            <div
              v-for="(file, i) in incomingFiles"
              :key="i"
              class="flex items-center justify-between text-xs px-2 py-1"
            >
              <span class="text-text-secondary truncate mr-2">{{ file.name }}</span>
              <span class="text-text-dim">{{ formatBytes(file.size) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- STATE: COMPLETE -->
      <div v-if="state === 'complete'" class="space-y-6 animate-fade-up">
        <h2 class="font-display text-2xl font-semibold flex items-center gap-3">
          <span class="text-accent-coral font-display text-sm tracking-widest">//</span>
          Hoàn tất!
        </h2>

        <!-- Sender complete -->
        <div
          v-if="selectedFiles.length > 0 && !downloadReady"
          class="border border-accent-coral/30 bg-accent-coral/5 p-6 text-center"
        >
          <p class="text-lg text-accent-coral font-display font-semibold mb-2">
            Đã gửi thành công!
          </p>
          <p class="text-sm text-text-secondary">
            {{ selectedFiles.length }} file ({{ formatBytes(totalBytes) }}) đã được gửi.
          </p>
        </div>

        <!-- Receiver complete -->
        <div
          v-if="downloadReady"
          class="border border-accent-sky/30 bg-accent-sky/5 p-6 text-center space-y-4"
        >
          <p class="text-lg text-accent-sky font-display font-semibold mb-2">Đã nhận thành công!</p>
          <p class="text-sm text-text-secondary">
            {{ incomingFiles.length }} file ({{ formatBytes(receiveTotalBytes) }})
          </p>
          <button
            class="w-full border border-accent-sky bg-accent-sky/10 px-4 py-3 text-sm font-display text-accent-sky transition hover:bg-accent-sky/20"
            @click="downloadFiles"
          >
            Tải file về máy
          </button>
        </div>

        <button
          class="w-full border border-border-default bg-bg-surface px-4 py-2.5 text-sm font-display text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
          @click="disconnect"
        >
          Gửi/nhận file khác
        </button>
      </div>

      <!-- Back link -->
      <RouterLink
        to="/"
        class="mt-10 inline-flex items-center gap-2 border border-border-default bg-bg-surface px-5 py-2.5 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary animate-fade-up animate-delay-3"
      >
        &larr; Về trang chủ
      </RouterLink>
    </div>

    <!-- Guideline modal -->
    <PeerDropGuidelineModal :open="showGuideline" @close="showGuideline = false" />
  </div>
</template>
