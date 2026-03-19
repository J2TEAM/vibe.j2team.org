<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { Icon } from '@iconify/vue'

defineProps<{
  canUndo: boolean
  canRedo: boolean
  zoom: number
}>()

const emit = defineEmits<{
  undo: []
  redo: []
  showImport: []
  showCode: []
  download: []
  exportPng: []
  clearAll: []
  zoomIn: []
  zoomOut: []
  zoomFit: []
}>()
</script>

<template>
  <header class="border-b border-border-default bg-bg-surface/95 backdrop-blur-sm px-4 py-2.5 flex items-center justify-between gap-4 animate-fade-up relative z-10">
    <div class="flex items-center gap-3">
      <RouterLink to="/" class="text-text-secondary hover:text-accent-coral transition-colors" title="Về trang chủ">
        <Icon icon="lucide:arrow-left" class="size-5" />
      </RouterLink>
      <div class="flex items-center gap-2">
        <div class="w-7 h-7 bg-gradient-to-br from-accent-coral to-accent-amber flex items-center justify-center">
          <Icon icon="lucide:pen-tool" class="size-4 text-bg-deep" />
        </div>
        <h1 class="font-display text-lg font-bold text-text-primary">
          SVG <span class="text-accent-coral">Editor</span>
        </h1>
      </div>
    </div>

    <div class="flex items-center gap-1.5">
      <button
        :disabled="!canUndo" title="Hoàn tác (⌘Z)" @click="emit('undo')"
        class="p-2 border border-border-default bg-bg-elevated text-text-secondary transition-all duration-200 hover:text-text-primary hover:border-accent-coral disabled:opacity-25 disabled:cursor-not-allowed"
      >
        <Icon icon="lucide:undo-2" class="size-4" />
      </button>
      <button
        :disabled="!canRedo" title="Làm lại (⌘⇧Z)" @click="emit('redo')"
        class="p-2 border border-border-default bg-bg-elevated text-text-secondary transition-all duration-200 hover:text-text-primary hover:border-accent-coral disabled:opacity-25 disabled:cursor-not-allowed"
      >
        <Icon icon="lucide:redo-2" class="size-4" />
      </button>

      <div class="w-px h-5 bg-border-default mx-1" />

      <button class="p-2 border border-border-default bg-bg-elevated text-text-secondary transition-all duration-200 hover:text-text-primary hover:border-accent-coral" title="Thu nhỏ" @click="emit('zoomOut')">
        <Icon icon="lucide:zoom-out" class="size-4" />
      </button>
      <button class="p-2 border border-border-default bg-bg-elevated text-text-secondary transition-all duration-200 hover:text-text-primary hover:border-accent-coral min-w-[48px] text-[10px] font-mono" title="Về 100%" @click="emit('zoomFit')">
        {{ Math.round(zoom * 100) }}%
      </button>
      <button class="p-2 border border-border-default bg-bg-elevated text-text-secondary transition-all duration-200 hover:text-text-primary hover:border-accent-coral" title="Phóng to" @click="emit('zoomIn')">
        <Icon icon="lucide:zoom-in" class="size-4" />
      </button>

      <div class="w-px h-5 bg-border-default mx-1" />

      <button class="p-2 border border-border-default bg-bg-elevated text-text-secondary transition-all duration-200 hover:text-accent-sky hover:border-accent-sky" title="Import SVG" @click="emit('showImport')">
        <Icon icon="lucide:upload" class="size-4" />
      </button>
      <button class="p-2 border border-border-default bg-bg-elevated text-text-secondary transition-all duration-200 hover:text-accent-amber hover:border-accent-amber" title="Xem mã SVG" @click="emit('showCode')">
        <Icon icon="lucide:code-2" class="size-4" />
      </button>
      <button class="p-2 border border-border-default bg-bg-elevated text-text-secondary transition-all duration-200 hover:text-accent-sky hover:border-accent-sky" title="Tải SVG" @click="emit('download')">
        <Icon icon="lucide:download" class="size-4" />
      </button>
      <button class="p-2 border border-border-default bg-bg-elevated text-text-secondary transition-all duration-200 hover:text-accent-amber hover:border-accent-amber" title="Xuất PNG" @click="emit('exportPng')">
        <Icon icon="lucide:image" class="size-4" />
      </button>
      <div class="w-px h-5 bg-border-default mx-1" />
      <button class="p-2 border border-border-default bg-bg-elevated text-text-secondary transition-all duration-200 hover:text-accent-coral hover:border-accent-coral" title="Xoá tất cả" @click="emit('clearAll')">
        <Icon icon="lucide:trash-2" class="size-4" />
      </button>
    </div>
  </header>
</template>
