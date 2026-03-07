<script setup lang="ts">
import type { UnifiedLine } from '../composables/useDiff'
import { highlight } from '../composables/useHighlight'

defineProps<{
  lines: UnifiedLine[]
  language?: string
}>()
</script>

<template>
  <div class="overflow-x-auto border border-border-default bg-bg-surface">
    <table class="diff-table w-full border-collapse font-mono text-sm tab-size-4">
      <tbody>
        <tr
          v-for="(row, idx) in lines"
          :key="idx"
          :class="{
            'diff-ctx': row.type === 'equal',
            'diff-del': row.type === 'delete',
            'diff-ins': row.type === 'insert',
          }"
        >
          <!-- Gutter: - / + / space for accessibility -->
          <td
            class="w-6 select-none border-r border-border-default bg-bg-surface px-1 py-0.5 text-center text-text-dim"
            :class="{
              'bg-accent-coral/20 text-accent-coral': row.type === 'delete',
              'bg-accent-sky/20 text-accent-sky': row.type === 'insert',
            }"
          >
            {{ row.type === 'delete' ? '−' : row.type === 'insert' ? '+' : ' ' }}
          </td>
          <td
            class="ln select-none border-r border-border-default bg-bg-surface px-2 py-0.5 text-right text-text-dim"
            :class="{
              'bg-accent-coral/20': row.type === 'delete',
              'bg-accent-sky/20': row.type === 'insert',
            }"
          >
            {{ row.oldLn ?? '' }}
          </td>
          <td
            class="ln select-none border-r border-border-default bg-bg-surface px-2 py-0.5 text-right text-text-dim"
            :class="{
              'bg-accent-coral/20': row.type === 'delete',
              'bg-accent-sky/20': row.type === 'insert',
            }"
          >
            {{ row.newLn ?? '' }}
          </td>
          <td
            class="code min-w-[300px] px-2 py-0.5"
            :class="{
              'bg-accent-coral/20 text-accent-coral': row.type === 'delete',
              'bg-accent-sky/20 text-accent-sky': row.type === 'insert',
            }"
          >
            <span v-html="highlight(row.value, language ?? 'javascript')" />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
:deep(.hl-comment) {
  color: var(--color-text-dim);
}
:deep(.hl-string) {
  color: var(--color-accent-amber);
}
:deep(.hl-number) {
  color: var(--color-accent-amber);
}
:deep(.hl-keyword) {
  color: var(--color-accent-sky);
}
:deep(.hl-constant) {
  color: var(--color-accent-amber);
}
:deep(.hl-type) {
  color: var(--color-accent-coral);
}
</style>
