<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'

import faviconUrl from '../assets/favicon.png'

let linkEl: HTMLLinkElement | null = null
let originalHref: string | null = null

onMounted(() => {
  linkEl = document.querySelector('link[rel="icon"]')
  if (linkEl) {
    originalHref = linkEl.getAttribute('href')
    linkEl.href = faviconUrl
    linkEl.type = 'image/png'
  } else {
    linkEl = document.createElement('link')
    linkEl.rel = 'icon'
    linkEl.href = faviconUrl
    linkEl.type = 'image/png'
    document.head.appendChild(linkEl)
  }
})

onUnmounted(() => {
  if (!linkEl) return
  if (originalHref !== null) {
    linkEl.href = originalHref
    linkEl.type = 'image/x-icon'
  } else if (linkEl.parentNode) {
    linkEl.parentNode.removeChild(linkEl)
  }
})
</script>

<template>
  <img :src="faviconUrl" alt="Tiến Về Sài Gòn" class="inline-block shrink-0 object-contain" />
</template>
