<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <footer class="border-t-2 border-accent-coral py-8 text-center">
    <p class="text-sm text-text-dim font-display tracking-wide">
      <span class="text-text-secondary">//</span>
      Made with vibe by
      <a
        href="https://www.facebook.com/groups/j2team.community/"
        target="_blank"
        rel="noopener noreferrer nofollow"
        class="text-text-primary link-underline"
      >
        J2TEAM Community
      </a>
    </p>
    <p class="mt-3 text-xs text-text-dim">
      <RouterLink
        to="/content-policy"
        class="text-text-dim hover:text-text-secondary transition-colors link-underline"
      >
        Chính sách nội dung
      </RouterLink>
    </p>
  </footer>
</template>
