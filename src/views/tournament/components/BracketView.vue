<script setup lang="ts">
import { computed } from 'vue'
import type { Match, Tournament } from '../types'
import { getRoundName } from '../composables/useBracket'
import MatchCard from './MatchCard.vue'

const props = defineProps<{
  tournament: Tournament
  matches: Match[]
  editable: boolean
  bracketLabel?: string
}>()

const emit = defineEmits<{
  submitResult: [matchId: string, scoreA: number, scoreB: number]
}>()

const totalRounds = computed(() => {
  if (props.matches.length === 0) return 0
  return Math.max(...props.matches.map((m) => m.roundIndex)) + 1
})

const rounds = computed(() => {
  const result: { name: string; matches: Match[] }[] = []
  for (let r = 0; r < totalRounds.value; r++) {
    const roundMatches = props.matches
      .filter((m) => m.roundIndex === r)
      .sort((a, b) => a.matchIndex - b.matchIndex)
    const bracket = roundMatches[0]?.bracket
    result.push({
      name: getRoundName(r, totalRounds.value, bracket),
      matches: roundMatches,
    })
  }
  return result
})

function getName(id: string | null): string {
  if (!id) return 'TBD'
  return props.tournament.participants.find((p) => p.id === id)?.name ?? 'TBD'
}
</script>

<template>
  <div>
    <p
      v-if="bracketLabel"
      class="mb-3 font-display text-sm font-semibold tracking-widest text-accent-amber"
    >
      {{ bracketLabel }}
    </p>
    <div class="flex gap-6 overflow-x-auto pb-4">
      <div v-for="(round, ri) in rounds" :key="ri" class="flex min-w-[220px] flex-col gap-3">
        <div
          class="border-b border-border-default pb-2 text-center text-xs font-semibold text-text-dim"
        >
          {{ round.name }}
        </div>
        <div class="flex flex-1 flex-col justify-around gap-3">
          <MatchCard
            v-for="m in round.matches"
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
</template>
