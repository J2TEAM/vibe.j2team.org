<script setup lang="ts">
import type { CSSProperties } from 'vue'

const props = defineProps<{
  open: boolean
  creditsTransformStyle: CSSProperties
}>()

const emit = defineEmits<{
  close: []
  'start-boost': []
  'stop-boost': []
  'bind:container': [value: HTMLElement | null]
  'bind:content': [value: HTMLElement | null]
}>()
</script>

<template>
  <section
    v-if="props.open"
    class="absolute inset-0 z-[70] flex items-center justify-center bg-bg-deep/85 p-4"
  >
    <div class="w-full max-w-lg overflow-hidden border border-border-default bg-bg-surface p-5">
      <h2 class="font-display text-xl font-semibold text-accent-coral">Credit</h2>
      <div
        :ref="(el) => emit('bind:container', el as HTMLElement | null)"
        class="relative mt-4 h-56 overflow-hidden border border-border-default bg-bg-elevated"
        @mousedown="emit('start-boost')"
        @mouseup="emit('stop-boost')"
        @mouseleave="emit('stop-boost')"
        @touchstart="emit('start-boost')"
        @touchend="emit('stop-boost')"
        @touchcancel="emit('stop-boost')"
      >
        <div
          :ref="(el) => emit('bind:content', el as HTMLElement | null)"
          class="credits-scroll px-4 py-3 text-center text-sm text-text-primary"
          :style="props.creditsTransformStyle"
        >
          <p class="font-display text-accent-amber">// Vẽ bùa giải hạn</p>
          <p class="mt-80 text-text-dim">Giữ chuột/chạm để tăng tốc chạy credit</p>
          <p class="mt-4 text-accent-coral">Ý tưởng</p>
          <p>XWasNotDeclared (Tôi)</p>
          <p class="mt-4 text-accent-coral">Coding</p>
          <p>CodeX</p>
          <p class="mt-4 text-accent-coral">Thiết kế</p>
          <p>Gemini</p>
          <p class="mt-4 text-text-dim">Cảm ơn bạn đã trải nghiệm.</p>
          <p class="mt-56 text-text-dim">An yên, thuận lợi, vạn sự hanh thông.</p>
          <p class="mt-56 text-text-dim">Vạn sự như ý.</p>
        </div>
      </div>

      <button
        type="button"
        class="mt-4 w-full border border-border-default px-3 py-2 text-sm transition hover:border-accent-coral"
        @click="emit('close')"
      >
        Đóng
      </button>
    </div>
  </section>
</template>

<style scoped>
.credits-scroll {
  will-change: transform;
}
</style>
