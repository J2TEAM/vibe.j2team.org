<script setup lang="ts">
import { useLanguage } from '../composables/useLanguage'

const { language, toggleLanguage } = useLanguage()
</script>

<template>
  <button
    @click="toggleLanguage"
    class="fixed top-4 right-4 z-50 bg-bg-surface border border-border-default px-3 py-1.5 text-sm font-display font-semibold text-text-secondary hover:text-accent-coral hover:border-accent-coral transition-all"
    :aria-label="language === 'vi' ? 'Switch to English' : 'Chuyển sang tiếng Việt'"
  >
    {{ language === 'vi' ? 'EN' : 'VN' }}
  </button>
</template>
