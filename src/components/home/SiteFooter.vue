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
    <p class="mt-3 text-xs text-text-dim flex items-center justify-center gap-2 flex-wrap">
      <RouterLink
        to="/content-policy"
        class="text-text-dim hover:text-text-secondary transition-colors link-underline"
      >
        Chính sách nội dung
      </RouterLink>
      <span class="text-border-default">·</span>
      <RouterLink
        to="/terms"
        class="text-text-dim hover:text-text-secondary transition-colors link-underline"
      >
        Điều khoản sử dụng
      </RouterLink>
      <span class="text-border-default">·</span>
      <RouterLink
        to="/privacy"
        class="text-text-dim hover:text-text-secondary transition-colors link-underline"
      >
        Chính sách bảo mật
      </RouterLink>
    </p>
  </footer>
</template>
