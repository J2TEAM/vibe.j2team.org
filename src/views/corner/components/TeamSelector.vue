<script setup lang="ts">
// Component chọn đội Home & Away
import { Icon } from '@iconify/vue'
import { storeToRefs } from 'pinia'
import { useCornerStore } from '../store/useCornerStore'

const store = useCornerStore()
const { filteredTeams, selectedHomeTeamId, selectedAwayTeamId, teamQuery } = storeToRefs(store)
</script>

<template>
  <section
    class="border border-border-default bg-bg-surface p-4 sm:p-5 transition-all duration-300 hover:-translate-y-1 hover:border-accent-coral hover:bg-bg-elevated hover:shadow-lg hover:shadow-accent-coral/5"
  >
    <h2 class="font-display text-lg font-semibold text-text-primary mb-3 flex items-center gap-2">
      <span class="text-accent-coral font-display text-sm tracking-widest">//</span>
      Chọn cặp đội
    </h2>

    <!-- Tìm kiếm đội -->
    <div class="relative mb-4">
      <Icon
        icon="lucide:search"
        class="size-3.5 text-text-dim absolute left-2.5 top-1/2 -translate-y-1/2"
      />
      <input
        :value="teamQuery"
        type="text"
        class="w-full bg-bg-elevated border border-border-default pl-7 pr-3 py-1.5 text-xs text-text-primary placeholder:text-text-dim focus:border-accent-coral focus:outline-none transition"
        placeholder="Tìm theo tên đội..."
        @input="store.setTeamQuery(($event.target as HTMLInputElement).value)"
      />
    </div>

    <!-- Chọn đội nhà (Home) -->
    <div class="mb-4">
      <div
        class="text-[11px] text-text-dim font-display tracking-widest uppercase mb-2 flex items-center gap-1.5"
      >
        <span class="size-2 bg-accent-coral" />
        Đội nhà (Home)
      </div>
      <div
        class="max-h-36 overflow-auto border border-border-default bg-bg-elevated divide-y divide-border-default"
      >
        <button
          v-for="team in filteredTeams"
          :key="'home-' + team.id"
          type="button"
          class="w-full text-left px-3 py-2 text-xs flex items-center justify-between gap-2 transition group"
          :class="[
            selectedHomeTeamId === team.id
              ? 'bg-bg-surface border-l-2 border-l-accent-coral text-text-primary'
              : 'border-l-2 border-l-transparent hover:bg-bg-surface text-text-secondary hover:text-text-primary',
            selectedAwayTeamId === team.id ? 'opacity-30 pointer-events-none' : '',
          ]"
          @click="store.setHomeTeam(team.id)"
        >
          <span class="font-display text-[13px]">{{ team.name }}</span>
          <span class="text-[10px] text-text-dim font-mono">{{ team.shortName }}</span>
        </button>
      </div>
    </div>

    <!-- Chọn đội khách (Away) -->
    <div>
      <div
        class="text-[11px] text-text-dim font-display tracking-widest uppercase mb-2 flex items-center gap-1.5"
      >
        <span class="size-2 bg-accent-amber" />
        Đội khách (Away)
      </div>
      <div
        class="max-h-36 overflow-auto border border-border-default bg-bg-elevated divide-y divide-border-default"
      >
        <button
          v-for="team in filteredTeams"
          :key="'away-' + team.id"
          type="button"
          class="w-full text-left px-3 py-2 text-xs flex items-center justify-between gap-2 transition group"
          :class="[
            selectedAwayTeamId === team.id
              ? 'bg-bg-surface border-l-2 border-l-accent-amber text-text-primary'
              : 'border-l-2 border-l-transparent hover:bg-bg-surface text-text-secondary hover:text-text-primary',
            selectedHomeTeamId === team.id ? 'opacity-30 pointer-events-none' : '',
          ]"
          @click="store.setAwayTeam(team.id)"
        >
          <span class="font-display text-[13px]">{{ team.name }}</span>
          <span class="text-[10px] text-text-dim font-mono">{{ team.shortName }}</span>
        </button>
      </div>
    </div>

    <!-- Hint khi chưa chọn đủ -->
    <div
      v-if="!selectedHomeTeamId || !selectedAwayTeamId"
      class="mt-3 text-[11px] text-text-dim flex items-center gap-1.5"
    >
      <Icon icon="lucide:info" class="size-3" />
      <span>Chọn cả 2 đội để xem thống kê đối đầu</span>
    </div>
  </section>
</template>
