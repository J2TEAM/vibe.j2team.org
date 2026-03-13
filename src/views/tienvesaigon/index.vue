<script setup lang="ts">
import CreditsSection from './components/credits-section.vue'
import CustomIcon from './components/custom-icon.vue'
import DescriptionSection from './components/description-section.vue'
import InteractiveSection from './components/interactive-section.vue'
import ReloadButton from './components/reload-button.vue'
import ResultModal from './components/result-modal.vue'
import StatsSection from './components/stats-section.vue'
</script>

<template>
  <main class="w-dvw h-dvh bg-background overflow-hidden font-sans">
    <section class="w-full h-full border-[#dbdada] overflow-hidden border-[1.5px] relative">
      <InteractiveSection />
      <StatsSection />
      <DescriptionSection />
      <CreditsSection />
      <ReloadButton />
      <ResultModal />
      <CustomIcon />
    </section>
  </main>
</template>
