<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body relative">
    <!-- Header -->
    <header
      class="w-full flex items-center justify-between px-6 py-4 border-b border-border-default animate-fade-up"
    >
      <RouterLink
        to="/"
        class="font-display text-sm tracking-widest text-text-secondary hover:text-accent-coral transition-colors"
      >
        HOME
      </RouterLink>
      <div
        class="bg-accent-coral text-bg-deep font-display font-bold text-xs tracking-widest px-3 py-1.5 rotate-3"
      >
        VOL.01 / 2026
      </div>
    </header>

    <main class="max-w-5xl mx-auto px-6 py-12">
      <!-- Tiêu đề chính -->
      <div class="text-center mb-12 animate-fade-up">
        <h1 class="font-display text-5xl md:text-7xl font-bold tracking-tight">
          <span class="text-accent-coral font-display text-sm tracking-widest block mb-2">//</span>
          <span class="text-text-primary">Excuse</span>
          <span class="text-accent-amber">_Generator</span>
        </h1>
        <p class="mt-4 text-text-secondary text-lg max-w-2xl mx-auto">
          Máy tạo lý do trễ Deadline — Vũ khí tối thượng của Developer chuyên nghiệp.
        </p>
        <p class="mt-1 text-text-dim text-sm italic">
          "Không có deadline nào bị trễ, chỉ có timeline chưa được update."
        </p>
      </div>

      <!-- Bộ chọn thể loại -->
      <div class="animate-fade-up animate-delay-1 mb-8">
        <div class="flex items-center gap-3 mb-4">
          <span class="text-accent-sky font-display text-sm tracking-widest">//</span>
          <h2 class="font-display text-lg font-semibold text-text-primary">Chọn thể loại</h2>
        </div>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="(label, key) in categoryLabels"
            :key="key"
            class="border px-4 py-2 text-sm font-display tracking-wide transition-all duration-300 cursor-pointer"
            :class="
              selectedCategory === key
                ? 'border-accent-coral bg-accent-coral/10 text-accent-coral'
                : 'border-border-default bg-bg-surface text-text-secondary hover:border-accent-amber hover:text-text-primary'
            "
            @click="toggleCategory(key)"
          >
            {{ label }}
          </button>
        </div>
      </div>

      <!-- Nút tạo lý do -->
      <div class="text-center animate-fade-up animate-delay-2 mb-10">
        <button
          class="relative border-2 border-accent-coral bg-bg-surface px-10 py-4 font-display text-lg tracking-widest text-accent-coral transition-all duration-300 hover:bg-accent-coral hover:text-bg-deep hover:shadow-lg hover:shadow-accent-coral/20 active:scale-95 cursor-pointer group"
          :class="{ 'animate-pulse-border': isGenerating }"
          :disabled="isGenerating"
          @click="generateExcuse"
        >
          <span v-if="!isGenerating" class="flex items-center gap-3"> 🎰 TẠO LÝ DO » </span>
          <span v-else class="flex items-center gap-3">
            <span
              class="inline-block w-4 h-4 border-2 border-accent-coral border-t-transparent rounded-full animate-spin"
            ></span>
            ĐANG XỬ LÝ...
          </span>
        </button>
        <p class="mt-2 text-text-dim text-xs">Đã tạo {{ totalGenerated }} lý do trong phiên này</p>
      </div>

      <!-- Kết quả -->
      <div v-if="currentExcuse" class="animate-fade-up animate-delay-3">
        <!-- Card lý do chính -->
        <div class="border border-border-default bg-bg-surface p-0 mb-6 relative overflow-hidden">
          <!-- Header card -->
          <div
            class="flex items-center justify-between px-6 py-3 border-b border-border-default bg-bg-elevated"
          >
            <div class="flex items-center gap-2">
              <span class="w-3 h-3 rounded-full bg-accent-coral"></span>
              <span class="w-3 h-3 rounded-full bg-accent-amber"></span>
              <span class="w-3 h-3 rounded-full bg-accent-sky"></span>
            </div>
            <span class="font-display text-xs tracking-widest text-text-dim">
              EXCUSE_OUTPUT.EXE
            </span>
            <span
              class="font-display text-xs tracking-widest px-2 py-0.5 border"
              :class="getCategoryColor(currentExcuse.category)"
            >
              {{ categoryLabels[currentExcuse.category] }}
            </span>
          </div>

          <!-- Nội dung -->
          <div class="p-6 md:p-8">
            <!-- Câu nói với sếp -->
            <div class="mb-6">
              <p class="font-display text-xs tracking-widest text-accent-sky mb-2">
                &gt; NÓI VỚI SẾP:
              </p>
              <p
                class="text-xl md:text-2xl font-display font-semibold text-text-primary leading-relaxed"
              >
                "{{ displayExcuse
                }}<span v-if="isTyping" class="animate-pulse text-accent-coral">▌</span>"
              </p>
            </div>

            <!-- Sự thật (ẩn/hiện) -->
            <div class="border-t border-border-default pt-4">
              <button
                class="flex items-center gap-2 text-text-dim text-sm hover:text-accent-coral transition-colors cursor-pointer"
                @click="showTruth = !showTruth"
              >
                <span class="font-display text-xs tracking-widest">
                  {{ showTruth ? '🔓 ẨN SỰ THẬT' : '🔒 XEM SỰ THẬT PHŨ PHÀNG' }}
                </span>
              </button>
              <Transition name="reveal">
                <div v-if="showTruth" class="mt-3 pl-4 border-l-2 border-accent-coral/30">
                  <p class="text-text-secondary italic text-sm">
                    💀 Thực ra: {{ currentExcuse.truth }}
                  </p>
                </div>
              </Transition>
            </div>
          </div>

          <!-- Stats bar -->
          <div
            class="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-0 justify-between px-6 py-4 border-t border-border-default bg-bg-deep/50"
          >
            <!-- Mức thuyết phục -->
            <div class="flex items-center gap-2">
              <span class="font-display text-xs tracking-widest text-text-dim">THUYẾT PHỤC:</span>
              <div class="flex gap-0.5">
                <span v-for="i in 5" :key="'c' + i" class="text-sm">
                  {{ i <= currentExcuse.convincingLevel ? '⭐' : '☆' }}
                </span>
              </div>
            </div>
            <!-- Mức rủi ro -->
            <div class="flex items-center gap-2">
              <span class="font-display text-xs tracking-widest text-text-dim">RỦI RO:</span>
              <div class="flex gap-0.5">
                <span v-for="i in 5" :key="'r' + i" class="text-sm">
                  {{ i <= currentExcuse.riskLevel ? '💀' : '○' }}
                </span>
              </div>
            </div>
            <!-- Số lần dùng -->
            <div class="flex items-center gap-2">
              <span class="font-display text-xs tracking-widest text-text-dim">DÙNG TỐI ĐA:</span>
              <span class="font-display text-sm text-accent-amber font-bold">
                {{ currentExcuse.maxUses }} lần
              </span>
            </div>
          </div>

          <!-- Số nền trang trí -->
          <span
            class="absolute top-12 right-4 font-display text-8xl font-bold text-accent-amber/5 select-none pointer-events-none"
          >
            {{ String(currentExcuse.id).padStart(2, '0') }}
          </span>
        </div>

        <!-- Nút hành động -->
        <div class="flex flex-wrap gap-3 justify-center">
          <button
            class="border border-border-default bg-bg-surface px-5 py-2.5 text-sm text-text-secondary font-display tracking-wide transition-all duration-300 hover:border-accent-sky hover:text-accent-sky cursor-pointer"
            @click="copyExcuse"
          >
            {{ copied ? '✅ ĐÃ COPY' : '📋 COPY LÝ DO' }}
          </button>
          <button
            class="border border-border-default bg-bg-surface px-5 py-2.5 text-sm text-text-secondary font-display tracking-wide transition-all duration-300 hover:border-accent-amber hover:text-accent-amber cursor-pointer"
            @click="generateExcuse"
          >
            🔄 TẠO CÁI KHÁC
          </button>
        </div>
      </div>

      <!-- Lịch sử lý do -->
      <div v-if="history.length > 0" class="mt-16 animate-fade-up">
        <div class="flex items-center gap-3 mb-6">
          <span class="text-accent-amber font-display text-sm tracking-widest">//</span>
          <h2 class="font-display text-lg font-semibold text-text-primary">Lịch sử lý do</h2>
          <span class="text-text-dim text-xs font-display">({{ history.length }})</span>
        </div>
        <div class="space-y-2">
          <div
            v-for="(item, index) in history"
            :key="index"
            class="border border-border-default bg-bg-surface px-5 py-3 flex items-start justify-between gap-4 transition-all duration-300 hover:border-accent-coral/30"
          >
            <div class="flex-1 min-w-0">
              <p class="text-sm text-text-primary truncate">"{{ item.excuse }}"</p>
              <p class="text-xs text-text-dim mt-1">
                {{ categoryLabels[item.category] }} · Thuyết phục {{ item.convincingLevel }}/5
              </p>
            </div>
            <span class="font-display text-xs text-text-dim whitespace-nowrap">
              #{{ String(history.length - index).padStart(2, '0') }}
            </span>
          </div>
        </div>
      </div>

      <!-- Chấm trang trí -->
      <div class="flex gap-1.5 justify-center mt-16 animate-fade-up animate-delay-4">
        <span v-for="n in 40" :key="n" class="w-1 h-1 rounded-full bg-border-default" />
      </div>

      <!-- Footer credit -->
      <div class="text-center mt-8 mb-12 animate-fade-up animate-delay-5">
        <p class="text-text-dim text-xs font-display tracking-widest">
          DISCLAIMER: DÙNG CÓ TRÁCH NHIỆM — TÁC GIẢ KHÔNG CHỊU TRÁCH NHIỆM NẾU BẠN BỊ ĐUỔI VIỆC
        </p>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { type Excuse, type ExcuseCategory, categoryLabels, excuses } from './data/excuses'

// Thể loại đang chọn (null = tất cả)
const selectedCategory = ref<ExcuseCategory | null>(null)

// Lý do hiện tại đang hiển thị
const currentExcuse = ref<Excuse | null>(null)

// Trạng thái UI
const isGenerating = ref(false)
const isTyping = ref(false)
const showTruth = ref(false)
const copied = ref(false)
const totalGenerated = ref(0)
const displayExcuse = ref('')

// Lịch sử các lý do đã tạo
const history = ref<Excuse[]>([])

// Chọn/bỏ chọn thể loại
const toggleCategory = (key: ExcuseCategory) => {
  selectedCategory.value = selectedCategory.value === key ? null : key
}

// Lấy màu cho thể loại
const getCategoryColor = (category: ExcuseCategory): string => {
  const colors: Record<ExcuseCategory, string> = {
    technical: 'border-accent-sky text-accent-sky',
    infrastructure: 'border-accent-amber text-accent-amber',
    process: 'border-accent-coral text-accent-coral',
    personal: 'border-text-secondary text-text-secondary',
    team: 'border-accent-sky text-accent-sky',
    external: 'border-accent-amber text-accent-amber',
    philosophical: 'border-accent-coral text-accent-coral',
  }
  return colors[category] || 'border-border-default text-text-dim'
}

// Hiệu ứng gõ chữ (typewriter)
const typewriterEffect = (text: string) => {
  displayExcuse.value = ''
  isTyping.value = true
  let index = 0

  const timer = setInterval(() => {
    if (index < text.length) {
      displayExcuse.value += text[index]
      index++
    } else {
      clearInterval(timer)
      isTyping.value = false
    }
  }, 35)
}

// Tạo lý do ngẫu nhiên
const generateExcuse = () => {
  if (isGenerating.value) return

  isGenerating.value = true
  showTruth.value = false
  copied.value = false
  displayExcuse.value = ''

  // Lọc theo thể loại nếu có chọn
  const pool = selectedCategory.value
    ? excuses.filter((e) => e.category === selectedCategory.value)
    : excuses

  // Random lý do, tránh trùng với cái trước
  if (pool.length === 0) return
  let randomExcuse: Excuse = pool[Math.floor(Math.random() * pool.length)]!
  while (pool.length > 1 && currentExcuse.value?.id === randomExcuse.id) {
    randomExcuse = pool[Math.floor(Math.random() * pool.length)]!
  }

  // Giả lập loading
  setTimeout(() => {
    currentExcuse.value = randomExcuse
    totalGenerated.value++
    history.value.unshift(randomExcuse)
    isGenerating.value = false
    typewriterEffect(randomExcuse.excuse)
  }, 800)
}

// Copy lý do vào clipboard
const copyExcuse = async () => {
  if (!currentExcuse.value) return
  try {
    await navigator.clipboard.writeText(currentExcuse.value.excuse)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch {
    // Fallback nếu clipboard API không hoạt động
    copied.value = false
  }
}
</script>

<style scoped>
/* Hiệu ứng hiện/ẩn sự thật */
.reveal-enter-active {
  transition: all 0.4s ease-out;
}

.reveal-leave-active {
  transition: all 0.3s ease-in;
}

.reveal-enter-from {
  opacity: 0;
  transform: translateY(-10px);
  max-height: 0;
}

.reveal-enter-to {
  opacity: 1;
  transform: translateY(0);
  max-height: 200px;
}

.reveal-leave-from {
  opacity: 1;
  max-height: 200px;
}

.reveal-leave-to {
  opacity: 0;
  max-height: 0;
}
</style>
