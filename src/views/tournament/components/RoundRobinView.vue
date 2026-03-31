<script setup lang="ts">
import { computed } from 'vue'
import type { Tournament } from '../types'
import { calcRoundRobinStandings } from '../composables/useRoundRobin'
import MatchCard from './MatchCard.vue'
import StandingTable from './StandingTable.vue'

const props = defineProps<{
  tournament: Tournament
  editable: boolean
}>()

const emit = defineEmits<{
  submitResult: [matchId: string, scoreA: number, scoreB: number]
}>()

const standings = computed(() =>
  calcRoundRobinStandings(
    props.tournament.participants.map((p) => p.id),
    props.tournament.matches,
  ),
)

const leg1Matches = computed(() => props.tournament.matches.filter((m) => m.roundIndex === 0))

const leg2Matches = computed(() => props.tournament.matches.filter((m) => m.roundIndex === 1))

function getName(id: string | null): string {
  if (!id) return 'TBD'
  return props.tournament.participants.find((p) => p.id === id)?.name ?? 'TBD'
}
</script>

<template>
  <div class="space-y-8">
    <div>
      <span class="font-display text-sm tracking-widest text-accent-amber">//</span>
      <span class="ml-2 font-display text-lg font-semibold text-text-primary">Bảng xếp hạng</span>
    </div>

    <StandingTable :tournament="tournament" :standings="standings" />

    <div>
      <div class="mb-4">
        <span class="font-display text-sm tracking-widest text-accent-coral">//</span>
        <span class="ml-2 font-display text-lg font-semibold text-text-primary">
          {{ tournament.roundRobinLegs === 2 ? 'Lượt đi' : 'Danh sách trận đấu' }}
        </span>
      </div>
      <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <MatchCard
          v-for="m in leg1Matches"
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

    <div v-if="leg2Matches.length > 0">
      <div class="mb-4">
        <span class="font-display text-sm tracking-widest text-accent-coral">//</span>
        <span class="ml-2 font-display text-lg font-semibold text-text-primary">Lượt về</span>
      </div>
      <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <MatchCard
          v-for="m in leg2Matches"
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
</template>
