<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useHead, useSeoMeta } from '@unhead/vue'
import { Icon } from '@iconify/vue'
import { getAllAuthors } from '@/data/authors'
import { isLikelyGitHubUsername, generateInitialAvatar } from '@/composables/useGithubAvatar'
import { useGithubContributors } from '@/composables/useGithubContributors'
import DomeGallery from '@/components/DomeGallery.vue'

useHead({ title: 'Cộng đồng đóng góp - vibe.j2team.org' })
useSeoMeta({
  description: 'Khám phá cộng đồng những người đóng góp trên vibe.j2team.org qua không gian 3D.',
  ogTitle: 'Cộng đồng đóng góp - vibe.j2team.org',
  ogDescription: 'Khám phá cộng đồng những người đóng góp trên vibe.j2team.org qua không gian 3D.',
})

const { contributors } = useGithubContributors()

const contributorData = computed(() => {
  const ghLogins = new Set(contributors.value.map((c) => c.login.toLowerCase()))

  const ghImages = contributors.value.map((c) => ({
    src: c.avatar_url,
    alt: c.login,
  }))

  const localAuthors = Array.from(getAllAuthors().values())
    .filter((a) => !ghLogins.has(a.author.toLowerCase()))
    .map((a) => ({
      src: isLikelyGitHubUsername(a.author)
        ? `https://github.com/${a.author}.png`
        : generateInitialAvatar(a.author),
      alt: a.author,
    }))

  return {
    images: [...ghImages, ...localAuthors],
    total: contributors.value.length + localAuthors.length,
  }
})

const avatarImages = computed(() => contributorData.value.images)
const totalMembers = computed(() => contributorData.value.total)
</script>

<template>
  <div class="fixed inset-0 bg-[#060010] flex flex-col">
    <!-- Top bar -->
    <div class="relative z-10 flex items-center justify-between px-4 sm:px-6 py-3">
      <RouterLink
        to="/members"
        class="inline-flex items-center gap-2 text-sm font-display text-text-secondary hover:text-text-primary transition-colors"
      >
        <Icon icon="lucide:arrow-left" class="w-4 h-4 shrink-0" />
        <span class="translate-y-px">Thành viên</span>
      </RouterLink>

      <div class="text-center">
        <h1 class="font-display text-sm sm:text-base font-bold text-text-primary tracking-tight">
          Cộng đồng đóng góp
        </h1>
        <p class="text-[11px] text-text-dim font-display">{{ totalMembers }} thành viên</p>
      </div>

      <RouterLink
        to="/"
        class="inline-flex items-center gap-2 text-sm font-display text-text-secondary hover:text-text-primary transition-colors"
      >
        <Icon icon="lucide:home" class="w-4 h-4" />
      </RouterLink>
    </div>

    <!-- Dome Gallery -->
    <div class="flex-1 min-h-0">
      <DomeGallery
        :images="avatarImages"
        :segments="35"
        :grayscale="false"
        overlay-blur-color="#060010"
        image-border-radius="50%"
        opened-image-border-radius="50%"
        opened-image-width="280px"
        opened-image-height="280px"
      />
    </div>
  </div>
</template>
