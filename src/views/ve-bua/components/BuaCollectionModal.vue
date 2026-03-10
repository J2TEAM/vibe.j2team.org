<script setup lang="ts">
import type { BuaDrawingPayloadV2, DrawingStats } from '../types/drawing'
import type { BuaDrawingPayloadV1, BuaStylePayloadV1 } from '../types/payloads'
type CollectionPreview = {
  id: string
  name: string
  createdAt: string
  stylePayload: BuaStylePayloadV1
  drawingPayload: BuaDrawingPayloadV1 | BuaDrawingPayloadV2
  previewSrc: string | null
  stats: DrawingStats | null
}

const props = defineProps<{
  open: boolean
  items: CollectionPreview[]
}>()

const emit = defineEmits<{
  close: []
  remove: [id: string]
  load: [item: CollectionPreview, mode: 'style' | 'drawing' | 'both']
}>()

function previewStyle(payload: CollectionPreview['stylePayload']): Record<string, string> {
  return {
    backgroundColor: payload.style.paperTint,
    borderColor: payload.style.frameTint,
  }
}

function previewDrawingStyle(payload: CollectionPreview['stylePayload']): Record<string, string> {
  const box = payload.style.drawableBox
  return {
    left: `${box.x * 100}%`,
    top: `${box.y * 100}%`,
    width: `${box.width * 100}%`,
    height: `${box.height * 100}%`,
  }
}
</script>

<template>
  <section v-if="props.open" class="absolute inset-0 z-50 bg-bg-deep p-4 sm:p-6">
    <div class="mx-auto flex h-full w-full max-w-6xl flex-col gap-4">
      <div
        class="flex items-center justify-between border border-border-default bg-bg-surface px-4 py-3"
      >
        <h2 class="font-display text-sm uppercase tracking-wider text-text-primary">
          Bộ sưu tập bùa
        </h2>
        <button
          class="border border-border-default px-3 py-2 text-xs text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
          @click="emit('close')"
        >
          Đóng
        </button>
      </div>

      <div
        v-if="props.items.length === 0"
        class="border border-border-default bg-bg-surface p-6 text-sm text-text-secondary"
      >
        Bộ sưu tập trống.
      </div>

      <div
        v-else
        class="grid flex-1 grid-cols-2 gap-3 overflow-auto pr-1 sm:grid-cols-3 lg:grid-cols-4"
      >
        <article
          v-for="item in props.items"
          :key="item.id"
          class="border border-border-default bg-bg-surface p-2"
        >
          <button class="block w-full text-left" @click="emit('load', item, 'both')">
            <div
              class="relative mx-auto aspect-[3/5] w-full border-4"
              :style="previewStyle(item.stylePayload)"
            >
              <img
                v-if="item.previewSrc"
                class="absolute object-contain"
                :style="previewDrawingStyle(item.stylePayload)"
                :src="item.previewSrc"
                alt="Ảnh bùa đã lưu"
              />
            </div>
            <p class="mt-2 truncate text-sm text-text-primary">{{ item.name }}</p>
            <p v-if="item.stats" class="text-[11px] text-text-dim">
              Kích thước: {{ Math.round(item.stats.canvasWidth) }}×{{
                Math.round(item.stats.canvasHeight)
              }}px · Nét:
              {{ item.stats.strokeCount }}
            </p>
            <p class="text-[11px] text-text-dim">
              {{ new Date(item.createdAt).toLocaleString('vi-VN') }}
            </p>
          </button>
          <div class="mt-2 grid grid-cols-3 gap-2">
            <button
              class="border border-border-default px-2 py-1 text-left text-[11px] text-text-secondary transition hover:border-accent-sky hover:bg-bg-elevated hover:text-text-primary"
              @click="emit('load', item, 'style')"
            >
              Nạp style
            </button>
            <button
              class="border border-border-default px-2 py-1 text-left text-[11px] text-text-secondary transition hover:border-accent-amber hover:bg-bg-elevated hover:text-text-primary"
              @click="emit('load', item, 'drawing')"
            >
              Nạp nét
            </button>
            <button
              class="border border-border-default px-2 py-1 text-left text-[11px] text-text-secondary transition hover:border-accent-coral hover:bg-bg-elevated hover:text-text-primary"
              @click="emit('load', item, 'both')"
            >
              Nạp cả 2
            </button>
          </div>
          <button
            class="mt-2 w-full border border-border-default px-2 py-1 text-left text-xs text-text-secondary transition hover:border-accent-coral hover:bg-bg-elevated hover:text-text-primary"
            @click="emit('remove', item.id)"
          >
            Xóa
          </button>
        </article>
      </div>
    </div>
  </section>
</template>
