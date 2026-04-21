<script setup lang="ts">
import { onMounted } from 'vue'

import MockHostPanel from './components/MockHostPanel.vue'
import RequestPreviewPanel from './components/RequestPreviewPanel.vue'
import RequestSimulatorPanel from './components/RequestSimulatorPanel.vue'
import ResponsePanel from './components/ResponsePanel.vue'
import RulebookPanel from './components/RulebookPanel.vue'
import StudioHeader from './components/StudioHeader.vue'
import { provideMockStudioContext } from './composables/useMockStudioContext'

provideMockStudioContext()

onMounted(() => {
  if (typeof window === 'undefined') {
    return
  }

  if (window.location.pathname === '/api-mock-studio-lite') {
    const nextUrl = `/api-mock-studio-lite/${window.location.search}${window.location.hash}`
    window.location.replace(nextUrl)
  }
})
</script>

<template>
  <div class="min-h-screen bg-bg-deep px-3 py-8 text-text-primary sm:px-4 xl:px-6">
    <div class="mx-auto w-full max-w-[1700px] space-y-6">
      <StudioHeader />

      <section class="animate-fade-up animate-delay-1">
        <MockHostPanel />
      </section>

      <section class="grid gap-6 2xl:grid-cols-[1.12fr_1fr]">
        <RequestSimulatorPanel />
        <RulebookPanel />
      </section>

      <section class="grid gap-6 xl:grid-cols-[1fr_1.1fr] animate-fade-up animate-delay-4">
        <RequestPreviewPanel />
        <ResponsePanel />
      </section>
    </div>
  </div>
</template>
