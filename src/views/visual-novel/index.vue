<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import VnEngine from './VnEngine.vue'
import story from './story'

const started = ref(false)

function start() {
  started.value = true
}
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body">
    <!-- Title screen -->
    <div v-if="!started" class="min-h-screen flex flex-col items-center justify-center px-4">
      <p class="font-display text-xs tracking-widest text-accent-amber mb-4 animate-fade-up">
        // VISUAL NOVEL
      </p>
      <h1
        class="font-display text-4xl sm:text-6xl font-bold text-accent-coral text-center animate-fade-up animate-delay-1"
      >
        {{ story.title }}
      </h1>
      <p
        class="mt-4 text-text-secondary text-lg text-center max-w-md animate-fade-up animate-delay-2"
      >
        Một câu chuyện ngắn tương tác. Lựa chọn của bạn sẽ thay đổi kết cục.
      </p>
      <div class="mt-4 text-text-dim text-sm animate-fade-up animate-delay-3">
        {{ story.characters.length }} nhân vật &middot;
        {{ story.scenes.filter((s) => s.isEnding).length }} kết thúc
      </div>

      <button
        class="mt-10 border border-border-default bg-bg-surface px-8 py-3 font-display text-sm tracking-widest text-text-primary transition-all duration-300 hover:border-accent-coral hover:bg-bg-elevated hover:shadow-lg hover:shadow-accent-coral/10 animate-fade-up animate-delay-4"
        @click="start"
      >
        BẮT ĐẦU
      </button>

      <RouterLink
        to="/"
        class="mt-6 inline-flex items-center gap-2 text-sm text-text-dim transition hover:text-text-secondary animate-fade-up animate-delay-5"
      >
        &larr; Về trang chủ
      </RouterLink>
    </div>

    <!-- Game screen -->
    <div v-else class="h-screen w-screen relative">
      <VnEngine :story="story" />

      <!-- Back to title overlay button -->
      <RouterLink
        to="/"
        class="absolute top-4 left-4 z-30 border border-border-default/50 bg-bg-deep/70 px-3 py-1.5 text-xs text-text-dim transition hover:border-accent-coral hover:text-text-secondary backdrop-blur-sm"
      >
        &larr; Trang chủ
      </RouterLink>
    </div>
  </div>
</template>
