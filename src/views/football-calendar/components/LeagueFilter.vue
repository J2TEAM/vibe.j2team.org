<script setup lang="ts">
import type { League } from '../types'
import LeagueDropdown from './LeagueDropdown.vue'

defineProps<{
  nationalLeagues: League[]
  internationalLeagues: League[]
  selectedLeagues: string[]
  hotSlugs: Set<string>
}>()

const emit = defineEmits<{
  toggle: [leagueId: string]
  selectGroup: [leagueIds: string[]]
  deselectGroup: [leagueIds: string[]]
}>()
</script>

<template>
  <div class="grid gap-3 sm:grid-cols-2">
    <LeagueDropdown
      label="Giải quốc gia"
      icon="lucide:flag"
      :leagues="nationalLeagues"
      :selected-leagues="selectedLeagues"
      :hot-slugs="hotSlugs"
      @toggle="emit('toggle', $event)"
      @select-all-group="emit('selectGroup', $event)"
      @deselect-all-group="emit('deselectGroup', $event)"
    />
    <LeagueDropdown
      label="Giải quốc tế"
      icon="lucide:trophy"
      :leagues="internationalLeagues"
      :selected-leagues="selectedLeagues"
      :hot-slugs="hotSlugs"
      @toggle="emit('toggle', $event)"
      @select-all-group="emit('selectGroup', $event)"
      @deselect-all-group="emit('deselectGroup', $event)"
    />
  </div>
</template>
