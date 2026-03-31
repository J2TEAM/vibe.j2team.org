<script setup lang="ts">
import { RouterLink } from 'vue-router'
import type { PageInfo } from '@/types/page'
import { toAuthorSlug } from '@/data/authors'
import FavoriteButton from '@/components/FavoriteButton.vue'
import AuthorAvatar from '@/components/AuthorAvatar.vue'

defineProps<{
  page: PageInfo
  /** Always show the favorite button (e.g. on bookmarks page). Default: show on hover only. */
  alwaysVisibleFavorite?: boolean
  /** Use compact sizing for horizontal scroll layouts */
  compact?: boolean
  /** Render as inert div — no link, no hover effects, no favorite button (e.g. during drag-reorder) */
  disabled?: boolean
}>()
</script>

<template>
  <component
    :is="disabled ? 'div' : RouterLink"
    v-bind="disabled ? {} : { to: page.path }"
    class="group relative flex flex-col border border-border-default bg-bg-surface transition-all duration-300"
    :class="[
      compact ? 'p-4' : 'p-6',
      disabled
        ? 'select-none'
        : 'hover:-translate-y-1 hover:border-l-4 hover:border-l-accent-coral hover:bg-bg-elevated hover:shadow-lg hover:shadow-accent-coral/5',
    ]"
  >
    <FavoriteButton
      v-if="!disabled"
      :path="page.path"
      :class="compact ? 'top-2 right-2' : 'top-2 right-3'"
      :always-visible="alwaysVisibleFavorite"
    />

    <slot name="background" />

    <h3
      class="font-display font-semibold text-text-primary transition-colors"
      :class="[
        compact ? 'text-sm line-clamp-1' : 'text-lg',
        !disabled && 'group-hover:text-accent-coral',
      ]"
    >
      {{ page.name }}
    </h3>
    <p
      class="text-text-secondary line-clamp-2"
      :class="compact ? 'mt-1.5 text-xs' : 'mt-2 text-sm'"
      :title="page.description"
    >
      {{ page.description }}
    </p>
    <slot name="footer">
      <p
        class="mt-auto flex items-center gap-1.5 text-text-dim font-display tracking-wide"
        :class="compact ? 'pt-3 text-[10px]' : 'pt-4 text-xs'"
      >
        bởi
        <RouterLink
          :to="{ name: 'author', params: { slug: toAuthorSlug(page.author) } }"
          class="inline-flex items-center gap-1.5 text-accent-coral hover:underline"
          @click.stop
        >
          <AuthorAvatar :author="page.author" size="sm" />
          {{ page.author }}
        </RouterLink>
      </p>
    </slot>
  </component>
</template>
