<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router'
import { useHead, useSeoMeta } from '@unhead/vue'
import { computed } from 'vue'
import ErrorBoundary from '@/components/ErrorBoundary.vue'
import EdgeToolbar from '@/components/EdgeToolbar.vue'

const route = useRoute()

const SITE_NAME = 'vibe.j2team.org'
const SITE_URL = 'https://vibe.j2team.org'
const DEFAULT_TITLE = `${SITE_NAME} - J2TEAM Community Vibe Coding`
const DEFAULT_DESCRIPTION =
  'Cả nhóm J2TEAM Community vibe code cùng nhau! Mỗi thành viên tạo một trang con, vibe code thoải mái.'

const title = computed(() => route.meta.title || DEFAULT_TITLE)
const description = computed(() => route.meta.description || DEFAULT_DESCRIPTION)
const canonicalUrl = computed(() => `${SITE_URL}${route.path}`)

useHead({
  title,
  link: [{ rel: 'canonical', href: canonicalUrl }],
})

useSeoMeta({
  description,
  author: computed(() => route.meta.author as string | undefined),
  ogTitle: title,
  ogDescription: description,
  ogUrl: canonicalUrl,
  ogType: 'website',
  ogSiteName: SITE_NAME,
  twitterCard: 'summary',
  twitterTitle: title,
  twitterDescription: description,
})
</script>

<template>
  <RouterView v-slot="{ Component }">
    <ErrorBoundary>
      <component :is="Component" />
    </ErrorBoundary>
  </RouterView>
  <EdgeToolbar
    v-if="route.meta.pagePath && route.meta.showToolbar !== false"
    :page-path="route.meta.pagePath as string"
  />
</template>
