<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { Icon } from '@iconify/vue'

interface BreadcrumbItem {
  label: string
  to?: string
}

defineProps<{
  items: BreadcrumbItem[]
}>()
</script>

<template>
  <nav
    aria-label="Breadcrumb"
    class="flex items-center gap-1.5 text-sm font-display leading-none tracking-wide"
  >
    <RouterLink
      to="/"
      class="inline-flex items-center gap-1.5 text-text-dim transition-colors hover:text-accent-coral"
    >
      <Icon icon="lucide:home" class="w-4 h-4 shrink-0" />
      <span class="translate-y-px">Trang chủ</span>
    </RouterLink>
    <template v-for="(item, index) in items" :key="index">
      <span class="text-text-dim/50">/</span>
      <RouterLink
        v-if="item.to"
        :to="item.to"
        class="text-text-dim transition-colors hover:text-accent-coral"
      >
        {{ item.label }}
      </RouterLink>
      <span v-else class="text-text-secondary">{{ item.label }}</span>
    </template>
  </nav>
</template>
