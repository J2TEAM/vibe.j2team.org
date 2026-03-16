<script setup lang="ts">
import { ref, watchEffect, onMounted } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useClipboard } from '@vueuse/core'
import { useWebrtcPeerConnection } from './use-webrtc-peer-connection'
import PeerCallGuidelineModal from './peer-call-guideline-modal.vue'

const route = useRoute()

const {
  localStream,
  remoteStream,
  connectionState,
  errorMessage,
  isLoading,
  isMuted,
  isCameraOff,
  offerSdp,
  answerSdp,
  createOffer,
  joinWithOffer,
  acceptAnswer,
  toggleMute,
  toggleCamera,
  disconnect,
} = useWebrtcPeerConnection()

// Refs for video elements
const localVideo = ref<HTMLVideoElement | null>(null)
const remoteVideo = ref<HTMLVideoElement | null>(null)

// Bind streams to video elements
watchEffect(() => {
  if (localVideo.value && localStream.value) {
    localVideo.value.srcObject = localStream.value
  }
})
watchEffect(() => {
  if (remoteVideo.value && remoteStream.value) {
    remoteVideo.value.srcObject = remoteStream.value
  }
})

// UI state for the join flow
const pastedOffer = ref('')
const pastedAnswer = ref('')
const copied = ref(false)
const linkCopied = ref(false)
const hasOfferFromUrl = ref(false)

// Rotating loading messages
const loadingMessages = [
  'Đang tạo mã kết nối...',
  'Đang tìm đường kết nối tốt nhất...',
  'Đang chuẩn bị kết nối...',
  'Sắp xong rồi...',
]
const loadingMsgIndex = ref(0)
let loadingInterval: ReturnType<typeof setInterval> | null = null

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

// Auto-detect offer from URL hash on page load
onMounted(() => {
  const hash = window.location.hash
  if (hash.startsWith('#offer=')) {
    try {
      const encoded = hash.slice('#offer='.length)
      pastedOffer.value = decodeURIComponent(encoded)
      hasOfferFromUrl.value = true
    } catch {
      // Invalid hash, ignore
    }
  }
})

/** Generate a shareable link with offer (already base64) encoded in URL hash */
function generateShareLink(base64Sdp: string): string {
  return `${window.location.origin}${route.path}#offer=${encodeURIComponent(base64Sdp)}`
}

const { copy: clipboardCopy } = useClipboard()

async function safeCopy(text: string): Promise<boolean> {
  try {
    await clipboardCopy(text)
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
  // Auto-copy share link when offer is ready
  if (sdp) {
    const link = generateShareLink(sdp)
    linkCopied.value = await safeCopy(link)
    if (linkCopied.value) setTimeout(() => (linkCopied.value = false), 3000)
  }
}

async function handleJoin() {
  // Clear URL hash after joining to avoid re-triggering on refresh
  if (window.location.hash) {
    history.replaceState(null, '', route.path)
  }
  const answer = await joinWithOffer(pastedOffer.value)
  // Auto-copy answer SDP for Person B
  if (answer) {
    copied.value = await safeCopy(answer)
    if (copied.value) setTimeout(() => (copied.value = false), 3000)
  }
}

async function handleAcceptAnswer() {
  await acceptAnswer(pastedAnswer.value)
}

function enterCall() {
  connectionState.value = 'connected'
}

const showGuideline = ref(false)

async function copyToClipboard(text: string) {
  copied.value = await safeCopy(text)
  if (copied.value) setTimeout(() => (copied.value = false), 2000)
}
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body px-4 py-8">
    <div class="mx-auto max-w-3xl">
      <!-- Header -->
      <div class="mb-10 animate-fade-up">
        <div class="flex items-center gap-3 mb-2">
          <h1 class="font-display text-4xl sm:text-5xl font-bold text-accent-coral">Peer Call</h1>
          <button
            class="border border-border-default bg-bg-surface px-3 py-1 text-xs font-display text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
            @click="showGuideline = true"
          >
            ? Hướng dẫn
          </button>
        </div>
        <p class="text-text-secondary text-lg">
          Gọi video P2P trực tiếp qua trình duyệt — không cần server.
        </p>
      </div>

      <!-- Error message -->
      <div
        v-if="errorMessage"
        class="mb-6 border border-accent-coral/40 bg-accent-coral/10 p-4 text-sm text-accent-coral animate-fade-up"
      >
        {{ errorMessage }}
      </div>

      <!-- IDLE: Choose role -->
      <div v-if="connectionState === 'idle'" class="space-y-6 animate-fade-up animate-delay-2">
        <h2 class="font-display text-2xl font-semibold flex items-center gap-3">
          <span class="text-accent-coral font-display text-sm tracking-widest">//</span>
          Bắt đầu
        </h2>

        <div class="grid gap-5 sm:grid-cols-2">
          <!-- Create offer -->
          <button
            class="border border-border-default bg-bg-surface p-6 text-left transition-all duration-300 hover:-translate-y-1 hover:border-accent-coral hover:bg-bg-elevated hover:shadow-lg hover:shadow-accent-coral/5"
            @click="handleCreateOffer"
          >
            <p class="font-display text-lg font-semibold text-text-primary mb-2">Tạo phòng</p>
            <p class="text-sm text-text-secondary">Tạo mã kết nối và gửi cho người kia.</p>
          </button>

          <!-- Join -->
          <div
            class="border bg-bg-surface p-6 transition-all duration-300"
            :class="
              hasOfferFromUrl
                ? 'border-accent-sky bg-bg-elevated'
                : 'border-border-default hover:border-accent-sky hover:bg-bg-elevated'
            "
          >
            <p class="font-display text-lg font-semibold text-text-primary mb-2">Tham gia</p>
            <p v-if="hasOfferFromUrl" class="text-sm text-accent-sky mb-3">
              Đã nhận mã mời từ link. Bấm "Kết nối" để bắt đầu.
            </p>
            <p v-else class="text-sm text-text-secondary mb-3">
              Dán mã kết nối từ người tạo phòng.
            </p>
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
        </div>
      </div>

      <!-- CREATING OFFER: Show offer SDP for copying -->
      <div v-if="connectionState === 'creating-offer'" class="space-y-6 animate-fade-up">
        <h2 class="font-display text-2xl font-semibold flex items-center gap-3">
          <span class="text-accent-amber font-display text-sm tracking-widest">//</span>
          Bước 1: Gửi mã này cho người kia
        </h2>

        <div class="border border-border-default bg-bg-surface p-4">
          <p v-if="isLoading" class="text-sm text-text-dim py-4 text-center animate-pulse">
            {{ loadingMessages[loadingMsgIndex] }}
          </p>
          <template v-else>
            <p class="text-xs text-text-dim mb-3">
              Gửi link hoặc mã cho người muốn gọi. Họ mở link sẽ tự động vào trang tham gia.
            </p>

            <!-- Share link (recommended) -->
            <button
              :disabled="!offerSdp"
              class="w-full border border-accent-coral bg-accent-coral/10 px-4 py-3 text-sm font-display text-accent-coral transition hover:bg-accent-coral/20 disabled:opacity-30 disabled:cursor-not-allowed"
              @click="copyShareLink"
            >
              {{ linkCopied ? 'Đã copy link!' : 'Copy link mời' }}
            </button>

            <!-- Manual copy (fallback) -->
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

        <h2 class="font-display text-2xl font-semibold flex items-center gap-3 mt-8">
          <span class="text-accent-amber font-display text-sm tracking-widest">//</span>
          Bước 2: Dán mã trả lời từ người kia
        </h2>

        <div class="border border-border-default bg-bg-surface p-4">
          <p class="text-xs text-text-dim mb-2">
            Sau khi người kia dán mã mời của bạn, họ sẽ nhận được mã trả lời. Hãy dán mã trả lời đó
            vào đây.
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
            Kết nối
          </button>
        </div>
      </div>

      <!-- JOINING: Show answer SDP for copying back -->
      <div v-if="connectionState === 'joining'" class="space-y-6 animate-fade-up">
        <h2 class="font-display text-2xl font-semibold flex items-center gap-3">
          <span class="text-accent-sky font-display text-sm tracking-widest">//</span>
          Gửi mã trả lời cho người tạo phòng
        </h2>

        <div class="border border-border-default bg-bg-surface p-4">
          <p v-if="isLoading" class="text-sm text-text-dim py-4 text-center animate-pulse">
            {{ loadingMessages[loadingMsgIndex] }}
          </p>
          <template v-else>
            <p class="text-xs text-accent-sky mb-2">
              Mã trả lời đã tự động copy! Gửi lại cho người tạo phòng — họ dán vào ô "Bước 2".
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
        <button
          :disabled="!answerSdp"
          class="mt-2 w-full border border-accent-sky bg-accent-sky/10 px-4 py-3 text-sm font-display text-accent-sky transition hover:bg-accent-sky/20 disabled:opacity-30 disabled:cursor-not-allowed"
          @click="enterCall"
        >
          Đã gửi mã trả lời — Vào cuộc gọi
        </button>
      </div>

      <!-- CONNECTED: Video call UI -->
      <div v-if="connectionState === 'connected'" class="space-y-6 animate-fade-up">
        <h2 class="font-display text-2xl font-semibold flex items-center gap-3">
          <span class="text-accent-coral font-display text-sm tracking-widest">//</span>
          Đang gọi
        </h2>

        <!-- Video container -->
        <div
          class="relative w-full aspect-video bg-bg-surface border border-border-default overflow-hidden"
        >
          <!-- Remote video (full) -->
          <video ref="remoteVideo" autoplay playsinline class="w-full h-full object-cover" />
          <!-- Local video (PiP corner) -->
          <video
            ref="localVideo"
            autoplay
            playsinline
            muted
            class="absolute bottom-3 right-3 w-32 sm:w-40 aspect-video object-cover border border-border-default bg-bg-deep"
          />
        </div>

        <!-- Controls -->
        <div class="flex justify-center gap-4">
          <button
            class="border px-5 py-2.5 text-sm font-display transition"
            :class="
              isMuted
                ? 'border-accent-coral bg-accent-coral/20 text-accent-coral'
                : 'border-border-default bg-bg-surface text-text-secondary hover:border-accent-coral hover:text-text-primary'
            "
            @click="toggleMute"
          >
            {{ isMuted ? 'Bật mic' : 'Tắt mic' }}
          </button>
          <button
            class="border px-5 py-2.5 text-sm font-display transition"
            :class="
              isCameraOff
                ? 'border-accent-amber bg-accent-amber/20 text-accent-amber'
                : 'border-border-default bg-bg-surface text-text-secondary hover:border-accent-amber hover:text-text-primary'
            "
            @click="toggleCamera"
          >
            {{ isCameraOff ? 'Bật camera' : 'Tắt camera' }}
          </button>
          <button
            class="border border-accent-coral bg-accent-coral px-5 py-2.5 text-sm font-display text-bg-deep font-bold transition hover:bg-accent-coral/80"
            @click="disconnect"
          >
            Kết thúc
          </button>
        </div>
      </div>

      <!-- Local video preview (visible during setup states, not when connected) -->
      <div v-if="localStream && connectionState !== 'connected'" class="mt-8 animate-fade-up">
        <p class="text-xs text-text-dim font-display tracking-wide mb-2">// Preview</p>
        <video
          ref="localVideo"
          autoplay
          playsinline
          muted
          class="w-full max-w-sm aspect-video object-cover border border-border-default bg-bg-surface"
        />
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
    <PeerCallGuidelineModal :open="showGuideline" @close="showGuideline = false" />
  </div>
</template>
