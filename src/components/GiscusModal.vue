<script setup lang="ts">
import { ref, watch, useTemplateRef } from 'vue'
import { useRoute } from 'vue-router'
import { Icon } from '@iconify/vue'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const route = useRoute()
const containerRef = useTemplateRef('giscus-container')
const scriptLoaded = ref(false)
let lastPath = ''

// Giscus config — these values are public identifiers, not secrets.
// See: https://giscus.app
const giscusAttrs: Record<string, string> = {
  src: 'https://giscus.app/client.js',
  'data-repo': 'J2TEAM/vibe.j2team.org',
  'data-repo-id': 'R_kgDORfTq5w',
  'data-category': 'General',
  'data-category-id': 'DIC_kwDORfTq984C4GSo',
  'data-mapping': 'pathname',
  'data-strict': '0',
  'data-reactions-enabled': '1',
  'data-emit-metadata': '0',
  'data-input-position': 'top',
  'data-theme': 'preferred_color_scheme',
  'data-lang': 'vi',
  'data-loading': 'lazy',
  crossorigin: 'anonymous',
}

function loadGiscus() {
  const container = containerRef.value
  if (!container) return

  // Clear previous iframe and inject a fresh script so Giscus
  // re-reads the current pathname for the new page.
  container.innerHTML = ''
  const script = document.createElement('script')
  for (const [key, value] of Object.entries(giscusAttrs)) {
    script.setAttribute(key, value)
  }
  script.async = true
  container.appendChild(script)
}

watch(
  () => props.show,
  (visible) => {
    if (!visible) return
    const currentPath = route.path
    if (!scriptLoaded.value || currentPath !== lastPath) {
      scriptLoaded.value = true
      lastPath = currentPath
      loadGiscus()
    }
  },
)
</script>

<template>
  <Teleport to="body">
    <div v-show="show" class="giscus-overlay" @click.self="emit('close')">
      <div class="giscus-modal">
        <div class="giscus-header">
          <Icon icon="lucide:message-square" class="w-5 h-5" />
          <h2 class="giscus-title">Bình luận</h2>
          <button class="giscus-close" aria-label="Đóng" @click="emit('close')">
            <Icon icon="lucide:x" class="w-4 h-4" />
          </button>
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
  max-width: 640px;
  max-height: 80vh;
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
  gap: 8px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-border-default);
  color: var(--color-text-primary);
}

.giscus-title {
  flex: 1;
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text-primary);
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
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
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

.giscus-body::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}
</style>
