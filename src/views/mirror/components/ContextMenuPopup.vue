<script setup lang="ts">
import type { ProductItem } from './types'

defineProps<{
  show: boolean
  x: number
  y: number
  product: ProductItem | null
}>()

const emit = defineEmits<{
  close: []
}>()
</script>

<template>
  <div
    v-if="show && product"
    class="context-menu-popup fixed z-30 p-4 rounded-lg min-w-[200px]"
    :style="{
      backgroundColor: 'rgba(22, 34, 50, 0.95)',
      border: '1px solid #253549',
      left: x + 'px',
      top: y + 'px',
    }"
  >
    <button
      class="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full transition-colors hover:bg-white/10"
      style="color: #8b9db5"
      @click="emit('close')"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="w-4 h-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    </button>
    <h4 class="font-display text-base font-semibold text-[#F0EDE6] mb-2 pr-6">
      {{ product.name }}
    </h4>
    <p class="text-sm text-[#8B9DB5] mb-3">{{ product.description }}</p>
    <div class="space-y-2 text-sm">
      <div class="flex items-center gap-2">
        <span class="text-[#FF6B4A]">Category:</span>
        <span class="text-[#F0EDE6]">{{ product.category }}</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-[#FFB830]">Author:</span>
        <span class="text-[#F0EDE6]">{{ product.author }}</span>
      </div>
      <div class="flex gap-2 mt-2">
        <a
          :href="`https://vibe.j2team.org/${product.path}`"
          target="_blank"
          rel="noopener noreferrer"
          class="flex-1 py-1.5 px-3 rounded text-sm text-center transition-colors"
          style="background-color: #ff6b4a; color: #0f1923"
        >
          Open
        </a>
        <a
          v-if="product.facebook"
          :href="product.facebook"
          target="_blank"
          rel="noopener noreferrer"
          class="flex-1 py-1.5 px-3 rounded text-sm text-center transition-colors border"
          style="border-color: #253549; color: #8b9db5"
        >
          Facebook
        </a>
      </div>
    </div>
  </div>
</template>
