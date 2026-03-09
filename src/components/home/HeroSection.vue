<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { Icon } from '@iconify/vue'
import { REPO_URL } from '@/data/constants'
</script>

<template>
  <header class="relative max-w-5xl mx-auto px-4 sm:px-6 pt-20 pb-16">
    <!-- Issue badge -->
    <div
      class="absolute top-8 right-4 sm:right-6 bg-accent-coral text-bg-deep font-display font-bold text-xs tracking-widest px-3 py-1.5 rotate-3 animate-fade-up animate-delay-2"
    >
      VOL.01 / 2026
    </div>

    <!-- Main title -->
    <h1
      class="font-display text-[2rem] min-[375px]:text-[2.5rem] min-[425px]:text-5xl sm:text-7xl md:text-8xl font-bold tracking-tight text-text-primary -rotate-1 animate-fade-up"
    >
      vibe<span class="text-accent-coral">.</span>j2team<span class="text-accent-coral">.</span>org
    </h1>

    <!-- Subtitle with coral left border -->
    <div class="mt-8 border-l-4 border-accent-coral pl-5 max-w-2xl animate-fade-up animate-delay-3">
      <p class="text-base sm:text-lg text-text-secondary leading-relaxed">
        Sẽ thế nào nếu cả nhóm
        <a
          href="https://www.facebook.com/groups/j2team.community/"
          target="_blank"
          rel="noopener noreferrer nofollow"
          class="text-accent-coral link-underline"
        >
          J2TEAM Community
        </a>
        vibe code cùng nhau?
      </p>
      <p class="mt-2 text-sm text-text-dim">
        Mỗi thành viên tạo một trang con — có thể là một ứng dụng nhỏ hoặc trò chơi nhỏ trên nền
        web, vibe code thoải mái, rồi thêm link vào đây.
      </p>
    </div>

    <!-- CTA -->
    <div class="mt-8 flex flex-wrap items-center gap-4 animate-fade-up animate-delay-4">
      <a
        href="#cach-tham-gia"
        class="inline-block border border-accent-coral bg-accent-coral/10 px-6 py-3 font-display font-semibold text-accent-coral tracking-wide transition-all duration-300 hover:bg-accent-coral hover:text-bg-deep"
      >
        <Icon icon="lucide:rocket" class="inline w-4 h-4 -mt-0.5" />
        Tham gia ngay
      </a>
      <RouterLink
        to="/leaderboard"
        class="inline-flex items-center gap-2 border border-accent-sky bg-accent-sky/10 px-6 py-3 font-display font-semibold text-accent-sky tracking-wide transition-all duration-300 hover:bg-accent-sky hover:text-bg-deep"
      >
        <Icon icon="lucide:trophy" class="w-4 h-4" />
        Top đóng góp
      </RouterLink>
      <a
        :href="REPO_URL"
        target="_blank"
        rel="noopener noreferrer nofollow"
        class="star-btn relative overflow-hidden transition-transform duration-300 hover:scale-105"
      >
        <span class="star-shimmer" aria-hidden="true"></span>
        <img
          alt="GitHub Repo stars"
          src="https://img.shields.io/github/stars/J2TEAM/vibe.j2team.org?style=for-the-badge&logo=github&label=Stars"
          loading="lazy"
          class="relative h-[46px]"
        />
      </a>
    </div>

    <!-- Dot divider -->
    <div class="mt-12 flex flex-wrap gap-1.5 animate-fade-up animate-delay-5">
      <span v-for="n in 40" :key="n" class="w-1 h-1 rounded-full bg-border-default" />
    </div>
  </header>
</template>

<style scoped>
@keyframes shimmer {
  0% {
    transform: translateX(-100%) skewX(-15deg);
  }
  100% {
    transform: translateX(200%) skewX(-15deg);
  }
}

.star-shimmer {
  position: absolute;
  inset: 0;
  z-index: 1;
  background: linear-gradient(
    105deg,
    transparent 40%,
    rgba(255, 255, 255, 0.2) 45%,
    rgba(255, 255, 255, 0.35) 50%,
    rgba(255, 255, 255, 0.2) 55%,
    transparent 60%
  );
  animation: shimmer 3s ease-in-out 2s infinite backwards;
  pointer-events: none;
}
</style>
