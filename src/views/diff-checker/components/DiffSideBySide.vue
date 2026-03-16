<script setup lang="ts">
import { useClipboard } from '@vueuse/core'
import type { TwoPanelData } from '../composables/useDiff'

const props = defineProps<{
  panels: TwoPanelData
  additions: number
  deletions: number
  oldText: string
  newText: string
}>()

const emit = defineEmits<{
  swap: []
}>()

const { copy: copyToClipboard } = useClipboard()

function leftTotalLines(): number {
  return props.oldText === '' ? 0 : props.oldText.split(/\r\n|\r|\n/).length
}

function rightTotalLines(): number {
  return props.newText === '' ? 0 : props.newText.split(/\r\n|\r|\n/).length
}
</script>

<template>
  <div>
    <!-- Panel headers -->
    <div class="flex items-stretch border border-border-default bg-bg-surface">
      <!-- Left header -->
      <div
        class="flex flex-1 items-center justify-between gap-3 border-r border-border-default px-4 py-2"
      >
        <span
          class="flex items-center gap-1.5 font-display text-sm font-semibold text-accent-coral"
        >
          <span class="text-base">−</span>
          {{ deletions }} removals
        </span>
        <span class="text-xs text-text-dim">{{ leftTotalLines() }} lines</span>
        <button
          type="button"
          class="border border-border-default px-2.5 py-1 text-xs text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
          @click="copyToClipboard(oldText)"
        >
          Copy
        </button>
      </div>

      <!-- Swap button -->
      <button
        type="button"
        class="flex items-center justify-center bg-bg-elevated px-3 text-text-dim transition hover:text-accent-coral"
        title="Swap"
        @click="emit('swap')"
      >
        ⇄
      </button>

      <!-- Right header -->
      <div class="flex flex-1 items-center justify-between gap-3 px-4 py-2">
        <span class="flex items-center gap-1.5 font-display text-sm font-semibold text-accent-sky">
          <span class="text-base">+</span>
          {{ additions }} additions
        </span>
        <span class="text-xs text-text-dim">{{ rightTotalLines() }} lines</span>
        <button
          type="button"
          class="border border-border-default px-2.5 py-1 text-xs text-text-secondary transition hover:border-accent-sky hover:text-text-primary"
          @click="copyToClipboard(newText)"
        >
          Copy
        </button>
      </div>
    </div>

    <!-- Aligned row table -->
    <div class="overflow-x-auto border border-t-0 border-border-default bg-bg-surface">
      <table class="w-full border-collapse font-mono text-sm">
        <tbody>
          <tr v-for="(row, idx) in panels.rows" :key="idx">
            <!-- Left line number -->
            <td
              class="w-10 select-none border-r border-border-default px-2 py-0.5 text-right text-text-dim"
              :class="{
                'bg-accent-coral/20': row.left?.type === 'delete' || row.left?.type === 'modified',
                'bg-bg-elevated': !row.left,
              }"
            >
              {{ row.left?.ln ?? '' }}
            </td>
            <!-- Left content -->
            <td
              class="w-1/2 px-3 py-0.5 whitespace-pre-wrap break-all"
              :class="{
                'bg-accent-coral/15': row.left?.type === 'delete' || row.left?.type === 'modified',
                'bg-bg-elevated': !row.left,
              }"
              v-html="row.left?.html || '&nbsp;'"
            />
            <!-- Right line number -->
            <td
              class="w-10 select-none border-l border-r border-border-default px-2 py-0.5 text-right text-text-dim"
              :class="{
                'bg-accent-sky/20': row.right?.type === 'insert' || row.right?.type === 'modified',
                'bg-bg-elevated': !row.right,
              }"
            >
              {{ row.right?.ln ?? '' }}
            </td>
            <!-- Right content -->
            <td
              class="w-1/2 px-3 py-0.5 whitespace-pre-wrap break-all"
              :class="{
                'bg-accent-sky/15': row.right?.type === 'insert' || row.right?.type === 'modified',
                'bg-bg-elevated': !row.right,
              }"
              v-html="row.right?.html || '&nbsp;'"
            />
          </tr>
          <tr v-if="panels.rows.length === 0">
            <td class="px-3 py-4 text-center text-text-dim" colspan="4">Không có sự khác biệt</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
:deep(.char-ins) {
  background-color: color-mix(in srgb, var(--color-accent-sky) 40%, transparent);
  border-radius: 3px;
}
:deep(.char-del) {
  background-color: color-mix(in srgb, var(--color-accent-coral) 40%, transparent);
  border-radius: 3px;
}
</style>
