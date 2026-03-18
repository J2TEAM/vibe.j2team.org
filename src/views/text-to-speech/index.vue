<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import { Icon } from '@iconify/vue'

// ─── Types ──────────────────────────────────────────────────────────────────
interface HistoryEntry {
  id: string
  text: string
  voiceName: string
  savedAt: number
}

type PlayState = 'idle' | 'playing' | 'paused'

// ─── Speech API check ────────────────────────────────────────────────────────
const supported = 'speechSynthesis' in window

// ─── State ───────────────────────────────────────────────────────────────────
const text = ref('')
const voices = ref<SpeechSynthesisVoice[]>([])
const selectedVoiceURI = useLocalStorage('tts-voice-uri', '')
const rate = useLocalStorage('tts-rate', 1)
const pitch = useLocalStorage('tts-pitch', 1)
const volume = useLocalStorage('tts-volume', 1)
const playState = ref<PlayState>('idle')
const history = useLocalStorage<HistoryEntry[]>('tts-history', [])
const activeTab = ref<'main' | 'history'>('main')
const highlightedWordIndex = ref(-1)
const showClearHistoryConfirm = ref(false)

// ─── Voices ──────────────────────────────────────────────────────────────────
function loadVoices() {
  voices.value = window.speechSynthesis.getVoices()
  if (voices.value.length > 0 && !selectedVoiceURI.value) {
    const viet = voices.value.find((v) => v.lang.startsWith('vi'))
    selectedVoiceURI.value = (viet ?? voices.value[0])?.voiceURI ?? ''
  }
}

onMounted(() => {
  if (!supported) return
  loadVoices()
  window.speechSynthesis.addEventListener('voiceschanged', loadVoices)
})

onUnmounted(() => {
  if (!supported) return
  window.speechSynthesis.cancel()
  window.speechSynthesis.removeEventListener('voiceschanged', loadVoices)
})

// ─── Computed ────────────────────────────────────────────────────────────────
const viVoices = computed(() => voices.value.filter((v) => v.lang.startsWith('vi')))
const enVoices = computed(() => voices.value.filter((v) => v.lang.startsWith('en')))
const otherVoices = computed(() =>
  voices.value.filter((v) => !v.lang.startsWith('vi') && !v.lang.startsWith('en')),
)

const selectedVoice = computed(
  () => voices.value.find((v) => v.voiceURI === selectedVoiceURI.value) ?? null,
)

const charCount = computed(() => text.value.length)
const wordCount = computed(() => (text.value.trim() ? text.value.trim().split(/\s+/).length : 0))
const words = computed(() => text.value.split(/(\s+)/))

// ─── Playback ────────────────────────────────────────────────────────────────
let utterance: SpeechSynthesisUtterance | null = null

function buildUtterance(t: string): SpeechSynthesisUtterance {
  const u = new SpeechSynthesisUtterance(t)
  if (selectedVoice.value) u.voice = selectedVoice.value
  u.rate = rate.value
  u.pitch = pitch.value
  u.volume = volume.value
  u.onboundary = (e) => {
    if (e.name !== 'word') return
    let pos = 0
    let idx = 0
    for (const seg of words.value) {
      if (/^\s+$/.test(seg)) {
        idx++
        continue
      }
      if (pos >= e.charIndex) {
        highlightedWordIndex.value = idx
        break
      }
      pos += seg.length + 1
      idx++
    }
  }
  u.onend = () => {
    playState.value = 'idle'
    highlightedWordIndex.value = -1
    utterance = null
  }
  u.onerror = () => {
    playState.value = 'idle'
    highlightedWordIndex.value = -1
    utterance = null
  }
  return u
}

function speak() {
  if (!supported || !text.value.trim()) return
  window.speechSynthesis.cancel()
  highlightedWordIndex.value = -1
  utterance = buildUtterance(text.value)
  playState.value = 'playing'
  window.speechSynthesis.speak(utterance)
  saveToHistory()
}

function pause() {
  if (playState.value !== 'playing') return
  window.speechSynthesis.pause()
  playState.value = 'paused'
}

function resume() {
  if (playState.value !== 'paused') return
  window.speechSynthesis.resume()
  playState.value = 'playing'
}

function stop() {
  window.speechSynthesis.cancel()
  playState.value = 'idle'
  highlightedWordIndex.value = -1
  utterance = null
}

function togglePlay() {
  if (playState.value === 'idle') speak()
  else if (playState.value === 'playing') pause()
  else resume()
}

// ─── History ─────────────────────────────────────────────────────────────────
function saveToHistory() {
  const trimmed = text.value.trim()
  if (!trimmed || history.value.find((h) => h.text === trimmed)) return
  history.value.unshift({
    id: crypto.randomUUID(),
    text: trimmed,
    voiceName: selectedVoice.value?.name ?? '',
    savedAt: Date.now(),
  })
  if (history.value.length > 30) history.value = history.value.slice(0, 30)
}

function loadFromHistory(entry: HistoryEntry) {
  text.value = entry.text
  const v = voices.value.find((v) => v.name === entry.voiceName)
  if (v) selectedVoiceURI.value = v.voiceURI
  activeTab.value = 'main'
}

function removeHistory(id: string) {
  history.value = history.value.filter((h) => h.id !== id)
}

function clearHistory() {
  history.value = []
  showClearHistoryConfirm.value = false
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatDate(ts: number) {
  return new Date(ts).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const VI_PRESETS = [
  'Xin chào! Đây là công cụ chuyển văn bản thành giọng nói.',
  'Hôm nay trời đẹp, hãy cùng nhau học lập trình nào.',
  'Chào mừng bạn đến với J2TEAM Community.',
]

const EN_PRESETS = [
  'Hello! This is a text to speech demo.',
  'The quick brown fox jumps over the lazy dog.',
  'Welcome to the J2TEAM Community project.',
]

function resetControls() {
  rate.value = 1
  pitch.value = 1
  volume.value = 1
}

watch(selectedVoiceURI, () => {
  if (playState.value !== 'idle') stop()
})
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-base font-mono">
    <div
      v-if="!supported"
      class="flex items-center gap-3 border border-accent-coral/50 bg-accent-coral/10 p-4 text-accent-coral"
    >
      <Icon icon="lucide:alert-triangle" class="size-5 shrink-0" />
      <span>Trình duyệt không hỗ trợ Web Speech API. Hãy dùng Chrome, Edge hoặc Safari.</span>
    </div>

    <div class="mx-auto max-w-3xl px-4 py-8 space-y-6">
      <!-- Back button -->
      <RouterLink
        to="/"
        class="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 border border-border hover:border-accent-coral/60 hover:text-accent-coral transition-colors"
      >
        <Icon icon="lucide:arrow-left" class="size-3.5" />
        Trang chủ
      </RouterLink>

      <!-- Header -->
      <div class="space-y-1">
        <div class="flex items-center gap-3">
          <Icon icon="lucide:mic" class="size-7 text-accent-coral" />
          <h1 class="text-2xl font-bold tracking-tight uppercase">Text to Speech</h1>
        </div>
        <p class="text-text-muted text-sm">
          Chuyển văn bản thành giọng nói — không cần API, chạy thẳng trên trình duyệt
        </p>
      </div>

      <!-- Tabs -->
      <div class="flex border-b border-border">
        <button
          v-for="tab in [
            { id: 'main', label: 'Soạn thảo', icon: 'lucide:type' },
            { id: 'history', label: 'Lịch sử', icon: 'lucide:history' },
          ]"
          :key="tab.id"
          class="flex items-center gap-2 px-4 py-2 text-sm transition-colors border-b-2 -mb-px"
          :class="
            activeTab === tab.id
              ? 'border-accent-coral text-accent-coral'
              : 'border-transparent text-text-muted hover:text-text-base'
          "
          @click="activeTab = tab.id as 'main' | 'history'"
        >
          <Icon :icon="tab.icon" class="size-4" />
          {{ tab.label }}
          <span
            v-if="tab.id === 'history' && history.length > 0"
            class="text-xs bg-accent-coral/20 text-accent-coral px-1.5 py-0.5"
            >{{ history.length }}</span
          >
        </button>
      </div>

      <!-- ─── MAIN TAB ──────────────────────────────────────────────────────── -->
      <div v-if="activeTab === 'main'" class="space-y-5">
        <!-- Text area + word highlight -->
        <div class="space-y-1">
          <div class="flex items-center justify-between text-xs text-text-muted mb-1">
            <span>Văn bản</span>
            <span>{{ charCount }} ký tự · {{ wordCount }} từ</span>
          </div>
          <textarea
            v-model="text"
            placeholder="Nhập văn bản cần đọc..."
            rows="5"
            :disabled="playState === 'playing'"
            class="w-full resize-y bg-bg-surface border border-border p-3 text-sm text-text-base placeholder:text-text-muted focus:outline-none focus:border-accent-coral/60 transition-colors disabled:opacity-60"
          />
          <div
            v-if="playState !== 'idle' && text.trim()"
            class="w-full bg-bg-surface border border-border p-3 text-sm leading-relaxed select-none"
          >
            <template v-for="(seg, i) in words" :key="i">
              <span
                v-if="!/^\s+$/.test(seg)"
                class="transition-colors duration-100"
                :class="i === highlightedWordIndex ? 'bg-accent-coral text-bg-deep px-0.5' : ''"
                >{{ seg }}</span
              >
              <span v-else>{{ seg }}</span>
            </template>
          </div>
        </div>

        <!-- Preset texts — Vietnamese + English side by side -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <!-- Vietnamese presets -->
          <div class="border border-border bg-bg-surface p-3 space-y-2">
            <div
              class="flex items-center gap-1.5 text-[11px] text-accent-coral uppercase tracking-widest font-semibold"
            >
              <Icon icon="lucide:flag" class="size-3" />
              Tiếng Việt
            </div>
            <div class="space-y-1">
              <button
                v-for="preset in VI_PRESETS"
                :key="preset"
                class="w-full text-left text-xs text-text-muted hover:text-accent-coral transition-colors py-1 line-clamp-1 truncate"
                @click="text = preset"
              >
                {{ preset }}
              </button>
            </div>
          </div>
          <!-- English presets -->
          <div class="border border-border bg-bg-surface p-3 space-y-2">
            <div
              class="flex items-center gap-1.5 text-[11px] text-accent-sky uppercase tracking-widest font-semibold"
            >
              <Icon icon="lucide:flag" class="size-3" />
              English
            </div>
            <div class="space-y-1">
              <button
                v-for="preset in EN_PRESETS"
                :key="preset"
                class="w-full text-left text-xs text-text-muted hover:text-accent-sky transition-colors py-1 line-clamp-1 truncate"
                @click="text = preset"
              >
                {{ preset }}
              </button>
            </div>
          </div>
        </div>

        <!-- Voice selector -->
        <div class="border border-border bg-bg-surface p-4 space-y-3">
          <div class="flex items-center gap-2 text-xs text-text-muted uppercase tracking-widest">
            <Icon icon="lucide:user-round" class="size-3.5" />
            Giọng đọc
          </div>

          <!-- Selected voice badge -->
          <div
            v-if="selectedVoice"
            class="flex items-center gap-2 px-3 py-2 border text-sm"
            :class="
              selectedVoice.lang.startsWith('vi')
                ? 'border-accent-coral/40 bg-accent-coral/5 text-accent-coral'
                : selectedVoice.lang.startsWith('en')
                  ? 'border-accent-sky/40 bg-accent-sky/5 text-accent-sky'
                  : 'border-border text-text-base'
            "
          >
            <Icon icon="lucide:volume-2" class="size-3.5 shrink-0" />
            <span class="font-medium truncate">{{ selectedVoice.name }}</span>
            <span class="ml-auto text-xs opacity-60 shrink-0">{{ selectedVoice.lang }}</span>
          </div>

          <!-- Grouped select -->
          <select
            v-model="selectedVoiceURI"
            class="w-full bg-bg-deep border border-border px-3 py-2 text-sm text-text-base focus:outline-none focus:border-accent-coral/60"
          >
            <optgroup v-if="viVoices.length > 0" label="🇻🇳 Tiếng Việt">
              <option v-for="v in viVoices" :key="v.voiceURI" :value="v.voiceURI">
                {{ v.name }}{{ v.localService ? ' ✓' : '' }}
              </option>
            </optgroup>
            <optgroup v-if="enVoices.length > 0" label="🇺🇸 English">
              <option v-for="v in enVoices" :key="v.voiceURI" :value="v.voiceURI">
                {{ v.name }} ({{ v.lang }}){{ v.localService ? ' ✓' : '' }}
              </option>
            </optgroup>
            <optgroup v-if="otherVoices.length > 0" label="🌐 Ngôn ngữ khác">
              <option v-for="v in otherVoices" :key="v.voiceURI" :value="v.voiceURI">
                {{ v.name }} ({{ v.lang }}){{ v.localService ? ' ✓' : '' }}
              </option>
            </optgroup>
          </select>

          <p v-if="voices.length === 0" class="text-xs text-text-muted">
            Đang tải danh sách giọng... Nếu không thấy hãy thử Chrome hoặc Edge.
          </p>
          <p
            v-else-if="viVoices.length === 0"
            class="text-xs text-text-muted flex items-center gap-1.5"
          >
            <Icon icon="lucide:info" class="size-3.5 shrink-0" />
            Không thấy giọng Tiếng Việt. Cài thêm voice pack trong cài đặt hệ thống.
          </p>
        </div>

        <!-- Controls: rate / pitch / volume -->
        <div class="border border-border bg-bg-surface p-4 space-y-4">
          <div class="flex items-center gap-2 text-xs text-text-muted uppercase tracking-widest">
            <Icon icon="lucide:sliders-horizontal" class="size-3.5" />
            Điều chỉnh
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div class="space-y-1.5">
              <div class="flex justify-between text-xs">
                <span class="text-text-muted">Tốc độ</span>
                <span class="text-accent-amber font-bold">{{ rate.toFixed(1) }}x</span>
              </div>
              <input
                v-model.number="rate"
                type="range"
                min="0.1"
                max="3"
                step="0.1"
                class="w-full accent-amber-400"
              />
              <div class="flex justify-between text-[10px] text-text-muted">
                <span>0.1x</span><span>3x</span>
              </div>
            </div>
            <div class="space-y-1.5">
              <div class="flex justify-between text-xs">
                <span class="text-text-muted">Cao độ</span>
                <span class="text-accent-sky font-bold">{{ pitch.toFixed(1) }}</span>
              </div>
              <input
                v-model.number="pitch"
                type="range"
                min="0"
                max="2"
                step="0.1"
                class="w-full accent-sky-400"
              />
              <div class="flex justify-between text-[10px] text-text-muted">
                <span>0</span><span>2</span>
              </div>
            </div>
            <div class="space-y-1.5">
              <div class="flex justify-between text-xs">
                <span class="text-text-muted">Âm lượng</span>
                <span class="text-accent-coral font-bold">{{ Math.round(volume * 100) }}%</span>
              </div>
              <input
                v-model.number="volume"
                type="range"
                min="0"
                max="1"
                step="0.05"
                class="w-full accent-orange-400"
              />
              <div class="flex justify-between text-[10px] text-text-muted">
                <span>0%</span><span>100%</span>
              </div>
            </div>
          </div>
          <button
            class="text-xs text-text-muted hover:text-accent-coral transition-colors flex items-center gap-1"
            @click="resetControls"
          >
            <Icon icon="lucide:rotate-ccw" class="size-3" />
            Đặt lại mặc định
          </button>
        </div>

        <!-- Playback buttons -->
        <div class="flex flex-wrap gap-3 items-center">
          <button
            :disabled="!supported || !text.trim() || voices.length === 0"
            class="flex items-center gap-2 px-5 py-2.5 font-bold text-sm uppercase tracking-wider transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            :class="
              playState === 'idle'
                ? 'bg-accent-coral text-bg-deep hover:bg-accent-coral/80'
                : 'bg-accent-amber text-bg-deep hover:bg-accent-amber/80'
            "
            @click="togglePlay"
          >
            <Icon :icon="playState === 'playing' ? 'lucide:pause' : 'lucide:play'" class="size-4" />
            {{ playState === 'playing' ? 'Tạm dừng' : playState === 'paused' ? 'Tiếp tục' : 'Đọc' }}
          </button>
          <button
            v-if="playState !== 'idle'"
            class="flex items-center gap-2 px-4 py-2.5 text-sm border border-border hover:border-accent-coral/60 hover:text-accent-coral transition-colors"
            @click="stop"
          >
            <Icon icon="lucide:square" class="size-4" />
            Dừng
          </button>
        </div>
      </div>

      <!-- ─── HISTORY TAB ───────────────────────────────────────────────────── -->
      <div v-else-if="activeTab === 'history'" class="space-y-4">
        <div v-if="history.length === 0" class="text-center py-16 text-text-muted space-y-2">
          <Icon icon="lucide:history" class="size-10 mx-auto opacity-30" />
          <p class="text-sm">Chưa có lịch sử nào</p>
          <p class="text-xs">Mỗi văn bản được đọc sẽ tự động lưu vào đây</p>
        </div>
        <template v-else>
          <div class="flex justify-end">
            <button
              class="text-xs text-text-muted hover:text-accent-coral transition-colors flex items-center gap-1"
              @click="showClearHistoryConfirm = true"
            >
              <Icon icon="lucide:trash-2" class="size-3.5" />
              Xoá tất cả
            </button>
          </div>
          <div class="space-y-2">
            <div
              v-for="entry in history"
              :key="entry.id"
              class="border border-border bg-bg-surface p-3 space-y-2 hover:border-accent-coral/40 transition-colors"
            >
              <p class="text-sm text-text-base line-clamp-2">{{ entry.text }}</p>
              <div class="flex items-center justify-between text-xs text-text-muted">
                <span class="flex items-center gap-1">
                  <Icon icon="lucide:user-round" class="size-3" />
                  {{ entry.voiceName || 'Giọng mặc định' }}
                </span>
                <span>{{ formatDate(entry.savedAt) }}</span>
              </div>
              <div class="flex gap-2 pt-1">
                <button
                  class="text-xs flex items-center gap-1 text-text-muted hover:text-accent-coral transition-colors"
                  @click="loadFromHistory(entry)"
                >
                  <Icon icon="lucide:corner-up-left" class="size-3" />
                  Dùng lại
                </button>
                <button
                  class="text-xs flex items-center gap-1 text-text-muted hover:text-accent-coral transition-colors"
                  @click="removeHistory(entry.id)"
                >
                  <Icon icon="lucide:x" class="size-3" />
                  Xoá
                </button>
              </div>
            </div>
          </div>
        </template>
      </div>

      <!-- Footer -->
      <footer
        class="border-t border-border pt-4 text-xs text-text-muted flex flex-wrap items-center justify-between gap-2"
      >
        <span>Được tạo bởi <span class="text-text-base font-semibold">Hachi Tu</span></span>
        <div class="flex gap-3">
          <a
            href="https://github.com/hachitubg"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center gap-1 hover:text-accent-coral transition-colors"
          >
            <Icon icon="lucide:github" class="size-3.5" />
            GitHub
          </a>
          <a
            href="https://www.facebook.com/tuhachiz/"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center gap-1 hover:text-accent-coral transition-colors"
          >
            <Icon icon="lucide:facebook" class="size-3.5" />
            Facebook
          </a>
        </div>
      </footer>
    </div>

    <!-- Clear history confirm overlay -->
    <div
      v-if="showClearHistoryConfirm"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      @click.self="showClearHistoryConfirm = false"
    >
      <div class="bg-bg-surface border border-border p-6 w-80 space-y-4 shadow-xl">
        <div class="flex items-center gap-2 text-accent-coral">
          <Icon icon="lucide:trash-2" class="size-5" />
          <span class="font-bold uppercase tracking-wide text-sm">Xoá lịch sử</span>
        </div>
        <p class="text-sm text-text-muted">
          Xoá toàn bộ {{ history.length }} mục lịch sử? Không thể hoàn tác.
        </p>
        <div class="flex gap-3">
          <button
            class="flex-1 py-2 text-sm border border-border hover:border-accent-coral/50 transition-colors"
            @click="showClearHistoryConfirm = false"
          >
            Huỷ
          </button>
          <button
            class="flex-1 py-2 text-sm bg-accent-coral text-bg-deep font-bold hover:bg-accent-coral/80 transition-colors"
            @click="clearHistory"
          >
            Xoá
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
