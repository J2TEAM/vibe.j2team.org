<script setup lang="ts">
import { Icon } from '@iconify/vue'
</script>

<template>
  <section class="max-w-5xl mx-auto px-4 sm:px-6 pb-20 scroll-reveal">
    <h2 class="font-display text-2xl font-semibold text-text-primary mb-8 flex items-center gap-3">
      <span class="text-accent-sky font-display text-sm tracking-widest">//</span>
      Nhà tài trợ
    </h2>

    <div class="flex flex-wrap gap-6">
      <a
        href="mailto:junookyo@gmail.com?subject=Sponsorship%20Inquiry%20-%20vibe.j2team.org&body=Hi%2C%0A%0AI%20am%20interested%20in%20becoming%20a%20sponsor%20for%20vibe.j2team.org.%0A%0APlease%20let%20me%20know%20the%20available%20sponsorship%20tiers%20and%20benefits.%0A%0AThank%20you!"
        class="group flex flex-col items-center justify-center border border-dashed border-border-default px-8 py-5 transition-all duration-300 hover:-translate-y-1 hover:border-accent-sky hover:bg-bg-elevated animate-pulse-border"
      >
        <Icon icon="lucide:heart" class="w-5 h-5 text-accent-sky icon-filled" />
        <span
          class="text-xs text-text-dim font-display tracking-wide mt-1 group-hover:text-accent-sky transition-colors"
        >
          Trở thành nhà tài trợ
        </span>
      </a>
    </div>
  </section>
</template>

<style scoped>
.icon-filled :deep(path) {
  fill: currentColor;
}
</style>
