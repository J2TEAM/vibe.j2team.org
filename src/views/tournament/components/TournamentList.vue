<script setup lang="ts">
import { Icon } from '@iconify/vue'
import type { Tournament, TournamentView } from '../types'
import { FORMAT_LABELS, STATUS_LABELS } from '../types'

defineProps<{
  tournaments: Tournament[]
}>()

const emit = defineEmits<{
  navigate: [view: TournamentView, id?: string]
  delete: [id: string]
}>()

function statusColor(status: string): string {
  if (status === 'setup') return 'text-accent-amber'
  if (status === 'in-progress') return 'text-accent-sky'
  return 'text-text-dim'
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('vi-VN')
}
</script>

<template>
  <div>
    <div class="mb-8 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <span class="font-display text-sm tracking-widest text-accent-coral">//</span>
        <h2 class="font-display text-2xl font-semibold text-text-primary">Danh sách giải đấu</h2>
      </div>
      <button
        class="inline-flex items-center gap-2 border border-accent-coral bg-accent-coral/10 px-5 py-2.5 text-sm font-semibold text-accent-coral transition hover:bg-accent-coral/20"
        @click="emit('navigate', 'create')"
      >
        <Icon icon="lucide:plus" class="size-4" />
        Tạo giải đấu
      </button>
    </div>

    <div
      v-if="tournaments.length === 0"
      class="border border-border-default bg-bg-surface p-12 text-center"
    >
      <Icon icon="lucide:trophy" class="mx-auto mb-4 size-12 text-text-dim" />
      <p class="text-text-secondary">Chưa có giải đấu nào</p>
      <p class="mt-1 text-sm text-text-dim">Nhấn "Tạo giải đấu" để bắt đầu</p>
    </div>

    <div v-else class="grid gap-4">
      <div
        v-for="t in tournaments"
        :key="t.id"
        class="group cursor-pointer border border-border-default bg-bg-surface p-5 transition hover:-translate-y-0.5 hover:border-accent-coral hover:bg-bg-elevated hover:shadow-lg hover:shadow-accent-coral/5"
        @click="emit('navigate', 'detail', t.id)"
      >
        <div class="flex items-start justify-between gap-4">
          <div class="min-w-0 flex-1">
            <h3 class="font-display text-lg font-semibold text-text-primary">
              {{ t.name }}
            </h3>
            <div class="mt-2 flex flex-wrap items-center gap-3 text-xs text-text-dim">
              <span class="inline-flex items-center gap-1">
                <Icon icon="lucide:gamepad-2" class="size-3.5" />
                {{ t.sport }}
              </span>
              <span class="inline-flex items-center gap-1">
                <Icon icon="lucide:git-branch" class="size-3.5" />
                {{ FORMAT_LABELS[t.format] }}
              </span>
              <span class="inline-flex items-center gap-1">
                <Icon icon="lucide:users" class="size-3.5" />
                {{ t.participants.length }} người tham gia
              </span>
              <span class="inline-flex items-center gap-1">
                <Icon icon="lucide:calendar" class="size-3.5" />
                {{ formatDate(t.createdAt) }}
              </span>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span :class="['text-xs font-semibold', statusColor(t.status)]">
              {{ STATUS_LABELS[t.status] }}
            </span>
            <button
              class="p-1.5 text-text-dim opacity-0 transition hover:text-accent-coral group-hover:opacity-100"
              title="Xóa giải đấu"
              @click.stop="emit('delete', t.id)"
            >
              <Icon icon="lucide:trash-2" class="size-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
