<script setup lang="ts">
import { ref } from 'vue'
import { useDropZone } from '@vueuse/core'
import { Icon } from '@iconify/vue'
import { RouterLink } from 'vue-router'
import ImageCanvas from './components/ImageCanvas.vue'
import EffectPanel from './components/EffectPanel.vue'
import { useImageProcessor } from './composables/use-image-processor'
import type { EffectId } from './types'

const {
  originalData,
  processedData,
  selectedEffect,
  effectParams,
  isProcessing,
  imageSize,
  loadImage,
  exportImage,
} = useImageProcessor()

const dropZoneRef = ref<HTMLDivElement | null>(null)
const showOriginal = ref(false)
const hasImage = ref(false)

function onDrop(files: File[] | null) {
  if (files?.[0]) handleFile(files[0])
}

const { isOverDropZone } = useDropZone(dropZoneRef, { onDrop })

function handleFile(file: File) {
  if (!file.type.startsWith('image/')) return
  hasImage.value = true
  loadImage(file)
}

function onFileInput(event: Event) {
  const input = event.target as HTMLInputElement
  if (input.files?.[0]) handleFile(input.files[0])
}

function updateParam(effectId: EffectId, key: string, value: number) {
  effectParams.value[effectId] = { ...effectParams.value[effectId], [key]: value }
}
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body">
    <div class="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <!-- Header -->
      <header class="mb-8 animate-fade-up">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="font-display text-3xl font-bold text-accent-coral sm:text-4xl">
              Yud Pixel Lab
            </h1>
            <p class="mt-1 text-sm text-text-secondary">
              Áp dụng hiệu ứng lo-fi lên ảnh của bạn
            </p>
          </div>
          <RouterLink
            to="/"
            class="inline-flex items-center gap-2 border border-border-default bg-bg-surface px-4 py-2 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
          >
            <Icon icon="lucide:arrow-left" class="size-4" />
            <span class="hidden sm:inline">Trang chủ</span>
          </RouterLink>
        </div>
      </header>

      <!-- Upload zone (when no image) -->
      <div
        v-if="!hasImage"
        ref="dropZoneRef"
        class="animate-fade-up animate-delay-2"
      >
        <label
          class="flex cursor-pointer flex-col items-center justify-center border-2 border-dashed py-20 transition-all duration-300"
          :class="
            isOverDropZone
              ? 'border-accent-coral bg-accent-coral/5'
              : 'border-border-default bg-bg-surface hover:border-accent-coral/50'
          "
        >
          <Icon
            icon="lucide:image-plus"
            class="size-12 text-text-dim mb-4"
          />
          <span class="font-display text-lg font-semibold text-text-secondary">
            Kéo thả ảnh vào đây
          </span>
          <span class="mt-1 text-sm text-text-dim">
            hoặc nhấn để chọn file (.jpg, .png, .webp)
          </span>
          <input
            type="file"
            accept="image/*"
            class="hidden"
            @change="onFileInput"
          />
        </label>
      </div>

      <!-- Main workspace (when image loaded) -->
      <div v-else class="grid gap-6 lg:grid-cols-[1fr_280px]">
        <!-- Canvas area -->
        <div class="space-y-4 animate-fade-up animate-delay-1">
          <ImageCanvas
            :image-data="processedData"
            :original-data="originalData"
            :show-original="showOriginal"
          />

          <!-- Controls bar -->
          <div class="flex flex-wrap items-center gap-3">
            <button
              class="inline-flex items-center gap-2 border border-border-default bg-bg-surface px-3 py-2 text-xs font-display tracking-wide text-text-secondary transition hover:border-accent-amber hover:text-text-primary"
              @mousedown="showOriginal = true"
              @mouseup="showOriginal = false"
              @mouseleave="showOriginal = false"
              @touchstart.prevent="showOriginal = true"
              @touchend="showOriginal = false"
            >
              <Icon icon="lucide:eye" class="size-3.5" />
              Giữ xem gốc
            </button>

            <label
              class="inline-flex cursor-pointer items-center gap-2 border border-border-default bg-bg-surface px-3 py-2 text-xs font-display tracking-wide text-text-secondary transition hover:border-accent-sky hover:text-text-primary"
            >
              <Icon icon="lucide:replace" class="size-3.5" />
              Đổi ảnh
              <input
                type="file"
                accept="image/*"
                class="hidden"
                @change="onFileInput"
              />
            </label>

            <button
              class="ml-auto inline-flex items-center gap-2 border border-accent-coral bg-accent-coral/10 px-4 py-2 text-xs font-display font-semibold tracking-wide text-accent-coral transition hover:bg-accent-coral hover:text-bg-deep"
              :disabled="!processedData || isProcessing"
              @click="exportImage('png')"
            >
              <Icon icon="lucide:download" class="size-3.5" />
              Tải xuống PNG
            </button>
          </div>

          <!-- Image info -->
          <div
            v-if="imageSize.width"
            class="text-xs text-text-dim font-display tracking-wide"
          >
            {{ imageSize.width }} × {{ imageSize.height }}px
            <span v-if="isProcessing" class="ml-2 text-accent-amber">
              Đang xử lý...
            </span>
          </div>
        </div>

        <!-- Effect panel sidebar -->
        <aside
          ref="dropZoneRef"
          class="animate-fade-up animate-delay-2"
        >
          <EffectPanel
            :selected-effect="selectedEffect"
            :effect-params="effectParams"
            :disabled="!hasImage || isProcessing"
            @update:selected-effect="selectedEffect = $event"
            @update:param="updateParam"
          />
        </aside>
      </div>
    </div>
  </div>
</template>
