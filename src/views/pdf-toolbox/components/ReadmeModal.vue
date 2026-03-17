<script setup lang="ts">
import { ref, watch } from 'vue'
import { Icon } from '@iconify/vue'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const content = ref('')
const isLoading = ref(false)

const loadReadme = async () => {
  isLoading.value = true
  try {
    // In a real build, we'd fetch this. For now, since it's a static file in the same dir structure,
    // we'll try to fetch it from the public path or relative path if possible.
    // However, for vibe-j2team, we can assume it's served or we can just embed the text for simplicity
    // and reliability since we just created it.
    // Simplified fetch logic
    // Better way: Since we are in the same project, we can just hardcode or fetch the actual file.
    // Given Vite's behavior, we'll try to fetch the raw file.
    const url = new URL('../README.md', import.meta.url).href
    const res = await fetch(url)
    if (res.ok) {
      content.value = await res.text()
    } else {
      content.value = 'Không thể tải nội dung README.md. Vui lòng kiểm tra lại cấu trúc tệp tin.'
    }
  } catch (error) {
    console.error('Lỗi tải README:', error)
    content.value = 'Lỗi hệ thống khi tải tài liệu.'
  } finally {
    isLoading.value = false
  }
}

watch(
  () => props.show,
  (newVal) => {
    if (newVal && !content.value) {
      loadReadme()
    }
  },
)

// Quick markdown-ish formatter (very basic)
const formatMarkdown = (text: string) => {
  return text
    .replace(
      /^# (.*$)/gim,
      '<h1 class="text-3xl font-black uppercase italic text-accent-coral mb-6 mt-8 border-b border-border-default pb-2">$1</h1>',
    )
    .replace(
      /^## (.*$)/gim,
      '<h2 class="text-xl font-bold uppercase italic text-accent-sky mb-4 mt-8 border-l-4 border-accent-sky pl-4 bg-accent-sky/5 py-1">$1</h2>',
    )
    .replace(
      /^### (.*$)/gim,
      '<h3 class="text-base font-bold uppercase text-text-primary mb-3 mt-6">$1</h3>',
    )
    .replace(/^- (.*$)/gim, '<li class="ml-4 mb-2 text-text-secondary list-disc">$1</li>')
    .replace(/\*\*(.*)\*\*/gim, '<strong class="text-text-primary">$1</strong>')
    .replace(
      /\[(.*)\]\((.*)\)/gim,
      '<a href="$2" target="_blank" class="text-accent-sky underline hover:text-white">$1</a>',
    )
}
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-500 ease-out"
      enter-from-class="opacity-0 translate-y-8"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-300 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-8"
    >
      <div v-if="show" class="fixed inset-0 z-100 flex items-center justify-center p-4 sm:p-12">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-bg-deep/95 backdrop-blur-xl" @click="emit('close')"></div>

        <!-- Modal Content -->
        <div
          class="relative w-full max-w-5xl bg-bg-surface border border-border-default shadow-[0_0_100px_rgba(0,0,0,0.5)] flex flex-col max-h-[85vh] overflow-hidden"
        >
          <!-- Scanline Effect -->
          <div class="absolute inset-0 pointer-events-none bg-scanlines opacity-5"></div>

          <!-- Header -->
          <div
            class="flex items-center justify-between p-6 border-b border-border-default bg-bg-elevated relative z-10"
          >
            <div class="flex items-center gap-4">
              <div class="p-2 bg-accent-coral/10 border border-accent-coral/20">
                <Icon icon="lucide:file-text" class="size-6 text-accent-coral" />
              </div>
              <div>
                <h3
                  class="font-display font-black text-lg sm:text-xl tracking-widest uppercase italic leading-none"
                >
                  Project <span class="text-accent-coral">Specifications</span>
                </h3>
                <p
                  class="text-[10px] font-display font-bold text-text-dim uppercase tracking-[0.2em] mt-1"
                >
                  vibe-j2team / pdf-toolbox / v1.0.0
                </p>
              </div>
            </div>

            <button
              @click="emit('close')"
              class="flex items-center gap-2 px-4 py-2 border border-border-default hover:border-accent-coral hover:text-accent-coral transition-all font-display text-[10px] font-bold tracking-widest uppercase"
            >
              Close [ESC]
              <Icon icon="lucide:x" class="size-4" />
            </button>
          </div>

          <!-- Body -->
          <div class="flex-1 overflow-y-auto p-8 sm:p-12 font-body relative z-10 custom-scrollbar">
            <div v-if="isLoading" class="flex flex-col items-center justify-center py-20 gap-4">
              <Icon icon="lucide:loader-2" class="size-12 text-accent-sky animate-spin" />
              <p
                class="font-display text-[10px] font-bold tracking-[0.3em] uppercase animate-pulse"
              >
                Initializing Data Stream...
              </p>
            </div>

            <div v-else class="max-w-3xl mx-auto prose prose-invert prose-sm sm:prose-base">
              <div v-html="formatMarkdown(content)" class="markdown-body"></div>

              <!-- Footer Decorative Section -->
              <div
                class="mt-20 pt-12 border-t border-border-default flex flex-col sm:flex-row justify-between items-center gap-6 opacity-40"
              >
                <div class="text-[10px] font-display uppercase tracking-widest">
                  End of Transmission // PDF_TOOLBOX_DOCS
                </div>
                <div class="flex gap-2">
                  <span
                    v-for="n in 8"
                    :key="n"
                    class="w-1.5 h-1.5 bg-border-default rounded-full"
                  ></span>
                </div>
              </div>
            </div>
          </div>

          <!-- Decorative Bottom Bar -->
          <div class="h-1 w-full flex relative z-10">
            <div class="h-full bg-accent-sky flex-1"></div>
            <div class="h-full bg-accent-coral w-1/4"></div>
            <div class="h-full bg-accent-amber w-1/6"></div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: var(--color-border-default);
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: var(--color-accent-sky);
}

.markdown-body :deep(li) {
  position: relative;
  padding-left: 1rem;
}

.markdown-body :deep(li)::before {
  content: '»';
  position: absolute;
  left: 0;
  color: var(--color-accent-sky);
  font-weight: bold;
}
</style>
