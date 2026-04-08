<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useLocalStorage, useDraggable } from '@vueuse/core'
import { Icon } from '@iconify/vue'

const notesContent = useLocalStorage('study-space-notes', '')
const isExpanded = ref(true)

const el = ref<HTMLElement | null>(null)
const dragHandle = ref<HTMLElement | null>(null)

// Default position
const { x, y, style } = useDraggable(el, {
  initialValue: { x: typeof window !== 'undefined' ? window.innerWidth - 350 : 800, y: 350 },
  handle: dragHandle,
})

onMounted(() => {
  if (typeof window !== 'undefined' && x.value === window.innerWidth - 350 && y.value === 350) {
    x.value = window.innerWidth - 350
    y.value = 350
  }
})
</script>

<template>
  <div ref="el" class="fixed z-40" :style="style">
    <!-- Mini display -->
    <div
      v-if="!isExpanded"
      ref="dragHandle"
      class="flex cursor-move items-center gap-2 border border-white/20 bg-black/50 px-4 py-2.5 text-white/80 backdrop-blur-md transition-all hover:border-white/40 hover:bg-black/60 hover:text-white"
      @dblclick="isExpanded = true"
    >
      <button class="flex items-center gap-2" @click="isExpanded = true">
        <Icon icon="lucide:sticky-note" class="size-5" />
        <span class="text-sm hidden sm:inline">Ghi chú</span>
      </button>
      <Icon icon="lucide:grip-vertical" class="size-4 ml-1 opacity-50" />
    </div>

    <!-- Expanded panel -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 translate-y-4 scale-95"
      enter-to-class="opacity-100 translate-y-0 scale-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0 scale-100"
      leave-to-class="opacity-0 translate-y-4 scale-95"
    >
      <div
        v-if="isExpanded"
        class="flex w-72 flex-col border border-white/20 bg-black/70 backdrop-blur-xl sm:w-80"
      >
        <!-- Header -->
        <div
          ref="dragHandle"
          class="flex cursor-move items-center justify-between border-b border-white/10 px-4 py-3"
        >
          <h3 class="font-display flex items-center text-sm font-semibold tracking-wide text-white">
            <Icon icon="lucide:grip-vertical" class="mr-1.5 size-4 opacity-50" />
            <Icon icon="lucide:sticky-note" class="mr-1.5 inline size-4" />
            Ghi chú
          </h3>
          <button class="text-white/50 transition hover:text-white" @click="isExpanded = false">
            <Icon icon="lucide:x" class="size-4" />
          </button>
        </div>

        <!-- Content -->
        <div class="h-64 p-3">
          <textarea
            v-model="notesContent"
            class="size-full resize-none bg-transparent font-body text-sm text-white placeholder-white/30 outline-none"
            placeholder="Viết ghi chú của bạn ở đây..."
          ></textarea>
        </div>
      </div>
    </Transition>
  </div>
</template>
