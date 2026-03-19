<script setup lang="ts">
import { Icon } from '@iconify/vue'
import type { Tournament } from '../types'
import MatchCard from './MatchCard.vue'
import StandingTable from './StandingTable.vue'

const props = defineProps<{
  tournament: Tournament
  editable: boolean
}>()

const emit = defineEmits<{
  submitResult: [matchId: string, scoreA: number, scoreB: number]
  startKnockout: []
}>()

function getName(id: string | null): string {
  if (!id) return 'TBD'
  return props.tournament.participants.find((p) => p.id === id)?.name ?? 'TBD'
}

function isGroupComplete(): boolean {
  return props.tournament.groups.every((g) => g.matches.every((m) => m.status === 'done'))
}
</script>

<template>
  <div class="space-y-8">
    <div v-if="!tournament.knockoutStage">
      <div class="mb-6 flex items-center justify-between">
        <div>
          <span class="font-display text-sm tracking-widest text-accent-amber">//</span>
          <span class="ml-2 font-display text-lg font-semibold text-text-primary">Vòng bảng</span>
        </div>
        <button
          v-if="editable && isGroupComplete()"
          class="inline-flex items-center gap-2 border border-accent-coral bg-accent-coral/10 px-4 py-2 text-xs font-semibold text-accent-coral transition hover:bg-accent-coral/20"
          @click="emit('startKnockout')"
        >
          <Icon icon="lucide:arrow-right" class="size-3.5" />
          Bắt đầu vòng Knockout
        </button>
      </div>

      <div v-for="(group, gi) in tournament.groups" :key="gi" class="mb-8">
        <h4 class="mb-3 font-display text-base font-semibold text-accent-sky">
          {{ group.name }}
        </h4>

        <StandingTable
          :tournament="tournament"
          :standings="group.standings"
          :highlight-count="tournament.advancePerGroup"
          class="mb-4"
        />

        <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <MatchCard
            v-for="m in group.matches"
            :key="m.id"
            :match="m"
            :name-a="getName(m.participantA)"
            :name-b="getName(m.participantB)"
            :editable="editable"
            :allow-draw="true"
            @submit="(id, a, b) => emit('submitResult', id, a, b)"
          />
        </div>
      </div>
    </div>

    <div v-if="tournament.knockoutStage">
      <div class="mb-4">
        <span class="font-display text-sm tracking-widest text-accent-coral">//</span>
        <span class="ml-2 font-display text-lg font-semibold text-text-primary">Vòng Knockout</span>
      </div>

      <div class="flex gap-6 overflow-x-auto pb-4">
        <div
          v-for="r in tournament.knockoutStage.rounds"
          :key="r"
          class="flex min-w-[220px] flex-col gap-3"
        >
          <div
            class="border-b border-border-default pb-2 text-center text-xs font-semibold text-text-dim"
          >
            {{
              r === tournament.knockoutStage!.rounds
                ? 'Chung kết'
                : r === tournament.knockoutStage!.rounds - 1
                  ? 'Bán kết'
                  : `Vòng ${r}`
            }}
          </div>
          <div class="flex flex-1 flex-col justify-around gap-3">
            <MatchCard
              v-for="m in tournament
                .knockoutStage!.matches.filter((m) => m.roundIndex === r - 1)
                .sort((a, b) => a.matchIndex - b.matchIndex)"
              :key="m.id"
              :match="m"
              :name-a="getName(m.participantA)"
              :name-b="getName(m.participantB)"
              :editable="editable"
              :allow-draw="false"
              @submit="(id, a, b) => emit('submitResult', id, a, b)"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
