<script setup lang="ts">
defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  close: []
}>()
</script>

<template>
  <div
    v-if="show"
    class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 p-6 rounded-lg max-w-sm"
    style="background-color: rgba(22, 34, 50, 0.95); border: 1px solid #253549"
  >
    <h3 class="font-display text-lg font-semibold text-[#F0EDE6] mb-4">Easter Egg</h3>
    <p class="text-sm text-[#8B9DB5] mb-4">Welcome to the universe of vibe.j2team.org!</p>
    <div class="space-y-3 text-sm text-[#8B9DB5]">
      <div class="flex items-start gap-2">
        <span class="text-[#FF6B4A]">•</span>
        <p>Lines connect projects of the same <span class="text-[#FF6B4A]">category</span></p>
      </div>
      <div class="flex items-start gap-2">
        <span class="text-[#FFB830]">•</span>
        <p>Lines connect projects by the same <span class="text-[#FFB830]">author</span></p>
      </div>
      <div class="flex items-start gap-2">
        <span class="text-[#8B9DB5]">•</span>
        <p>Drag to move planets around</p>
      </div>
      <div class="flex items-start gap-2">
        <span class="text-[#8B9DB5]">•</span>
        <p>Right-click for more info</p>
      </div>
      <div class="flex items-start gap-2">
        <span class="text-[#8B9DB5]">•</span>
        <p>Double-click to open in new tab</p>
      </div>
    </div>
    <a
      href="https://gachbong.yellowstudio.vn"
      target="_blank"
      rel="noopener noreferrer"
      class="group mt-4 block text-center text-sm"
      style="color: #4a6180"
    >
      Easter Egg from
      <span class="text-[#FF6B4A] group-hover:underline">gachbong.yellowstudio.vn</span>
    </a>
    <button
      class="mt-3 w-full py-2 px-4 rounded text-sm font-display transition-colors"
      style="background-color: #ff6b4a; color: #0f1923"
      @click="emit('close')"
    >
      Got it!
    </button>
  </div>
</template>
