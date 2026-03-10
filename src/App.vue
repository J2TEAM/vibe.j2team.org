<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router'
import { useHead } from '@unhead/vue'
import { computed } from 'vue'
import ErrorBoundary from '@/components/ErrorBoundary.vue'

const route = useRoute()

const DEFAULT_TITLE = 'vibe.j2team.org - J2TEAM Community Vibe Coding'
const DEFAULT_DESCRIPTION =
  'Cả nhóm J2TEAM Community vibe code cùng nhau! Mỗi thành viên tạo một trang con, vibe code thoải mái.'

useHead({
  title: computed(() => route.meta.title || DEFAULT_TITLE),
  meta: [
    {
      name: 'description',
      content: computed(() => route.meta.description || DEFAULT_DESCRIPTION),
    },
  ],
})
</script>

<template>
  <RouterView v-slot="{ Component }">
    <ErrorBoundary>
      <component :is="Component" />
    </ErrorBoundary>
  </RouterView>
</template>
