<script setup lang="ts">
import { ref, watch, nextTick, useTemplateRef } from 'vue'

const props = defineProps<{
  show: boolean
  pagePath: string
}>()

const emit = defineEmits<{
  close: []
}>()

const containerRef = useTemplateRef('giscus-container')
const currentPath = ref('')

// Giscus config - same as GiscusModal.vue
const giscusAttrs: Record<string, string> = {
  src: 'https://giscus.app/client.js',
  'data-repo': 'J2TEAM/vibe.j2team.org',
  'data-repo-id': 'R_kgDORfTq5w',
  'data-category': 'General',
  'data-category-id': 'DIC_kwDORfTq984C4GSo',
  'data-mapping': 'specific',
  'data-strict': '0',
  'data-reactions-enabled': '1',
  'data-emit-metadata': '0',
  'data-input-position': 'top',
  'data-theme': 'preferred_color_scheme',
  'data-lang': 'vi',
  'data-loading': 'lazy',
  crossorigin: 'anonymous',
}

function loadGiscus(path: string) {
  const container = containerRef.value
  if (!container) return

  // Clear and reload for new path
  container.innerHTML = ''

  // Add pathname term and origin for proper communication
  const attrs = {
    ...giscusAttrs,
    'data-term': path,
    'data-origin': window.location.origin,
  }

  const script = document.createElement('script')
  for (const [key, value] of Object.entries(attrs)) {
    script.setAttribute(key, value)
  }
  script.async = true
  container.appendChild(script)
}

// Watch both show and pagePath to handle different posts
watch(
  () => [props.show, props.pagePath] as const,
  async ([visible, path]) => {
    if (!visible || !path) return

    await nextTick()

    // Always reload when opening for a different path
    if (path !== currentPath.value) {
      currentPath.value = path
      // Small delay to ensure DOM is ready
      setTimeout(() => loadGiscus(path), 100)
    }
  },
)
</script>

<template>
  <Teleport to="body">
    <div v-show="show" class="giscus-overlay" @click.self="emit('close')">
      <div class="giscus-modal">
        <div class="giscus-header">
          <span class="text-sm font-display font-semibold">Bình luận</span>
          <button class="giscus-close" aria-label="Đóng" @click="emit('close')">✕</button>
        </div>
        <div class="giscus-body">
          <div ref="giscus-container" class="giscus" />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.giscus-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.giscus-modal {
  width: 100%;
  max-width: 800px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-default);
  border-radius: 8px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
  overflow: hidden;
}

.giscus-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-border-default);
}

.giscus-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 1px solid var(--color-border-default);
  border-radius: 4px;
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.giscus-close:hover {
  color: var(--color-text-primary);
  border-color: var(--color-text-secondary);
}

.giscus-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  min-height: 400px;
}

.giscus-body :deep(.giscus) {
  width: 100% !important;
}

.giscus-body :deep(.giscus-frame) {
  width: 100%;
  border: none;
}

.giscus-body::-webkit-scrollbar {
  width: 6px;
}

.giscus-body::-webkit-scrollbar-track {
  background: transparent;
}

.giscus-body::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}
</style>
