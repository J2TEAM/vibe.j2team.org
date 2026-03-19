<script setup lang="ts">
import type { GroupStanding, Tournament } from '../types'

const props = defineProps<{
  tournament: Tournament
  standings: GroupStanding[]
  title?: string
  highlightCount?: number
}>()

function getName(id: string): string {
  return props.tournament.participants.find((p) => p.id === id)?.name ?? '?'
}
</script>

<template>
  <div>
    <p v-if="title" class="mb-3 font-display text-sm font-semibold text-text-secondary">
      {{ title }}
    </p>
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-border-default text-left text-xs text-text-dim">
            <th class="px-3 py-2">#</th>
            <th class="px-3 py-2">Tên</th>
            <th class="px-3 py-2 text-center">Trận</th>
            <th class="px-3 py-2 text-center">T</th>
            <th class="px-3 py-2 text-center">H</th>
            <th class="px-3 py-2 text-center">B</th>
            <th class="px-3 py-2 text-center">HS</th>
            <th class="px-3 py-2 text-center font-semibold text-accent-amber">Đ</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(s, i) in standings"
            :key="s.participantId"
            :class="[
              'border-b border-border-default transition hover:bg-bg-elevated',
              highlightCount && i < highlightCount ? 'bg-accent-coral/5' : '',
            ]"
          >
            <td class="px-3 py-2 font-display text-xs text-text-dim">{{ i + 1 }}</td>
            <td class="px-3 py-2 font-semibold text-text-primary">
              {{ getName(s.participantId) }}
            </td>
            <td class="px-3 py-2 text-center text-text-secondary">{{ s.played }}</td>
            <td class="px-3 py-2 text-center text-accent-sky">{{ s.won }}</td>
            <td class="px-3 py-2 text-center text-text-dim">{{ s.drawn }}</td>
            <td class="px-3 py-2 text-center text-accent-coral">{{ s.lost }}</td>
            <td class="px-3 py-2 text-center text-text-secondary">
              {{ s.goalDifference > 0 ? '+' : '' }}{{ s.goalDifference }}
            </td>
            <td class="px-3 py-2 text-center font-display font-bold text-accent-amber">
              {{ s.points }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
