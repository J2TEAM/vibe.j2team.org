<script setup lang="ts">
import { ref, watch } from 'vue'
import type { SolarTerm } from '../types'
import { getTermContent } from '../content'
import { getArticle } from '../articles'
import type { Article } from '../articles'
import ArticleReader from './ArticleReader.vue'
import SolarCardGenerator from './SolarCardGenerator.vue'

const props = defineProps<{
  term: SolarTerm | null
  show: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

// ===== Tab state =====
const activeTab = ref<'content' | 'share' | 'article'>('content')

// ===== Lazy-load nội dung HTML (iframe) =====
const modalContent = ref('')
const loadingContent = `
  <div style="background: #111; color: #fff; height: 100vh; display: flex; align-items: center; justify-content: center; font-family: sans-serif;">
    <h1>Đang tải nội dung...</h1>
  </div>
`
const fallbackContent = `
  <div style="background: #111; color: #fff; height: 100vh; display: flex; align-items: center; justify-content: center; font-family: sans-serif;">
    <h1>Nội dung đang được cập nhật...</h1>
  </div>
`

watch(
  () => props.term?.name,
  async (termName) => {
    if (!termName) {
      modalContent.value = ''
      return
    }
    modalContent.value = loadingContent
    const content = await getTermContent(termName)
    modalContent.value = content ?? fallbackContent
  },
)

// ===== Lazy-load article =====
const activeArticle = ref<Article | null>(null)
const loadingArticle = ref(false)

watch(
  () => activeTab.value === 'article' && props.term?.name,
  async (shouldLoad) => {
    if (!shouldLoad || !props.term) return
    if (activeArticle.value) return // Đã load rồi
    loadingArticle.value = true
    activeArticle.value = await getArticle(props.term.name)
    loadingArticle.value = false
  },
)

// ===== Reset khi mở modal mới =====
watch(
  () => props.show,
  (isOpen) => {
    if (isOpen) {
      activeTab.value = 'content'
      activeArticle.value = null
    }
  },
)

// ===== Đóng modal =====
const close = () => {
  emit('close')
}
</script>

<template>
  <Transition name="modal">
    <div
      v-if="show && term"
      class="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-12 overflow-hidden"
    >
      <!-- Overlay -->
      <div class="absolute inset-0 bg-black/90 backdrop-blur-3xl" @click="close"></div>

      <!-- Modal Container -->
      <div
        class="relative w-full h-full max-w-6xl bg-bg-deep rounded-none md:rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl flex flex-col scale-up"
      >
        <!-- Nút đóng -->
        <button
          @click="close"
          class="absolute top-4 right-4 md:top-6 md:right-8 z-[110] p-3 md:p-4 bg-black/50 backdrop-blur-xl rounded-full text-white/40 hover:text-white transition-all border border-white/10"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>

        <!-- Tabs -->
        <div class="flex border-b border-white/10 bg-black/20 overflow-x-auto scrollbar-hide">
          <button
            @click="activeTab = 'content'"
            :class="[
              'px-4 sm:px-8 py-4 sm:py-6 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] transition-all relative whitespace-nowrap',
              activeTab === 'content' ? 'text-accent-coral' : 'text-white/40 hover:text-white',
            ]"
          >
            Chi tiết
            <div
              v-if="activeTab === 'content'"
              class="absolute bottom-0 left-0 w-full h-0.5 bg-accent-coral"
            ></div>
          </button>
          <button
            @click="activeTab = 'article'"
            :class="[
              'px-4 sm:px-8 py-4 sm:py-6 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] transition-all relative whitespace-nowrap',
              activeTab === 'article' ? 'text-accent-coral' : 'text-white/40 hover:text-white',
            ]"
          >
            Khai tâm
            <div
              v-if="activeTab === 'article'"
              class="absolute bottom-0 left-0 w-full h-0.5 bg-accent-coral"
            ></div>
          </button>
          <button
            @click="activeTab = 'share'"
            :class="[
              'px-4 sm:px-8 py-4 sm:py-6 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] transition-all relative whitespace-nowrap',
              activeTab === 'share' ? 'text-accent-coral' : 'text-white/40 hover:text-white',
            ]"
          >
            Tạo thiệp
            <div
              v-if="activeTab === 'share'"
              class="absolute bottom-0 left-0 w-full h-0.5 bg-accent-coral"
            ></div>
          </button>
        </div>

        <!-- Tab Content -->
        <div class="flex-1 overflow-hidden relative bg-black/40">
          <Transition name="tab-fade" mode="out-in">
            <div :key="activeTab" class="absolute inset-0 overflow-y-auto custom-scrollbar">
              <!-- Tab: Chi tiết Tiết khí (iframe) -->
              <iframe
                v-if="activeTab === 'content'"
                :srcdoc="modalContent"
                class="w-full h-full border-none"
              ></iframe>

              <!-- Tab: Khai tâm (Article Reader) -->
              <div v-else-if="activeTab === 'article'" class="h-full">
                <div
                  v-if="loadingArticle"
                  class="h-full flex items-center justify-center text-white/30"
                >
                  <div class="flex flex-col items-center gap-4">
                    <div
                      class="w-6 h-6 border-2 border-white/20 border-t-accent-coral rounded-full animate-spin"
                    ></div>
                    <span class="text-[10px] uppercase tracking-widest">Đang tải bài luận...</span>
                  </div>
                </div>
                <ArticleReader v-else-if="activeArticle" :article="activeArticle" />
                <div v-else class="h-full flex items-center justify-center text-white/20 italic">
                  Đang cập nhật nội dung...
                </div>
              </div>

              <!-- Tab: Tạo thiệp chia sẻ -->
              <div
                v-else-if="activeTab === 'share'"
                class="p-4 sm:p-8 flex justify-center items-start sm:items-center h-full overflow-y-auto"
              >
                <SolarCardGenerator :term="term" />
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
/* Modal transitions */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.5s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

/* Tab transitions */
.tab-fade-enter-active,
.tab-fade-leave-active {
  transition:
    opacity 0.4s ease,
    transform 0.4s ease;
}
.tab-fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
.tab-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.scale-up {
  animation: scaleUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

@keyframes scaleUp {
  from {
    transform: scale(0.95) translateY(20px);
    opacity: 0;
  }
  to {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
}

/* Ẩn scrollbar cho tabs mobile */
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
