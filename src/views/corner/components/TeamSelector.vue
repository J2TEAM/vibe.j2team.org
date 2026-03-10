<script setup lang="ts">
// Selector inline: Home | VS | Away + nút PREDICT
import { Icon } from '@iconify/vue'
import { storeToRefs } from 'pinia'
import { ref } from 'vue'
import { useCornerStore } from '../store/useCornerStore'

const store = useCornerStore()
const {
  filteredTeams,
  selectedHomeTeamId,
  selectedAwayTeamId,
  selectedHomeTeam,
  selectedAwayTeam,
  teamQuery,
  hasFullSelection,
  isPredicting,
} = storeToRefs(store)

// Toggle dropdown mở/đóng
const activeDropdown = ref<'home' | 'away' | null>(null)

function toggleDropdown(side: 'home' | 'away') {
  activeDropdown.value = activeDropdown.value === side ? null : side
}

function selectHome(id: string) {
  store.setHomeTeam(id)
  activeDropdown.value = null
}

function selectAway(id: string) {
  store.setAwayTeam(id)
  activeDropdown.value = null
}
</script>

<template>
  <section
    class="border border-border-default bg-bg-surface p-4 sm:p-6 transition-all duration-300 hover:border-accent-coral/40"
  >
    <!-- Tiêu đề -->
    <h2
      class="font-display text-sm font-semibold text-text-dim tracking-widest uppercase mb-4 flex items-center gap-2"
    >
      <span class="text-accent-coral">//</span>
      Chọn cặp đội
    </h2>

    <!-- Search bar -->
    <div class="relative mb-4">
      <Icon
        icon="lucide:search"
        class="size-3.5 text-text-dim absolute left-2.5 top-1/2 -translate-y-1/2"
      />
      <input
        :value="teamQuery"
        type="text"
        class="w-full bg-bg-elevated border border-border-default pl-7 pr-3 py-2 text-xs text-text-primary placeholder:text-text-dim focus:border-accent-coral focus:outline-none transition"
        placeholder="Tìm đội..."
        @input="store.setTeamQuery(($event.target as HTMLInputElement).value)"
      />
    </div>

    <!-- Layout chọn cặp đội: Home | VS | Away -->
    <div class="grid grid-cols-[1fr_auto_1fr] items-start gap-3 sm:gap-4">
      <!-- Home selector -->
      <div class="relative">
        <button
          type="button"
          class="w-full border bg-bg-elevated px-3 py-2.5 text-left flex items-center justify-between gap-2 transition text-sm"
          :class="
            selectedHomeTeamId
              ? 'border-accent-coral/60 text-text-primary'
              : 'border-border-default text-text-dim'
          "
          @click="toggleDropdown('home')"
        >
          <div class="flex items-center gap-2 min-w-0">
            <span class="size-2 bg-accent-coral shrink-0" />
            <span class="font-display truncate text-[13px]">
              {{ selectedHomeTeam?.name ?? 'Đội nhà' }}
            </span>
          </div>
          <Icon
            icon="lucide:chevron-down"
            class="size-3.5 text-text-dim shrink-0 transition-transform"
            :class="activeDropdown === 'home' && 'rotate-180'"
          />
        </button>
        <div
          class="text-[10px] text-text-dim mt-1 font-display tracking-widest uppercase text-center"
        >
          HOME
        </div>
        <!-- Dropdown list -->
        <div
          v-if="activeDropdown === 'home'"
          class="absolute z-20 top-full left-0 right-0 mt-1 max-h-48 overflow-auto border border-border-default bg-bg-elevated divide-y divide-border-default shadow-lg shadow-bg-deep/50"
        >
          <button
            v-for="team in filteredTeams"
            :key="'h-' + team.id"
            type="button"
            class="w-full text-left px-3 py-2 text-xs flex items-center justify-between gap-2 transition"
            :class="[
              selectedHomeTeamId === team.id
                ? 'bg-bg-surface border-l-2 border-l-accent-coral text-text-primary'
                : 'border-l-2 border-l-transparent hover:bg-bg-surface text-text-secondary hover:text-text-primary',
              selectedAwayTeamId === team.id ? 'opacity-30 pointer-events-none' : '',
            ]"
            @click="selectHome(team.id)"
          >
            <span class="font-display text-[13px]">{{ team.name }}</span>
            <span class="text-[10px] text-text-dim font-mono">{{ team.shortName }}</span>
          </button>
        </div>
      </div>

      <!-- VS badge ở giữa -->
      <div class="flex flex-col items-center justify-center pt-1">
        <div class="font-display text-xl sm:text-2xl font-bold text-text-dim tracking-tighter">
          VS
        </div>
      </div>

      <!-- Away selector -->
      <div class="relative">
        <button
          type="button"
          class="w-full border bg-bg-elevated px-3 py-2.5 text-left flex items-center justify-between gap-2 transition text-sm"
          :class="
            selectedAwayTeamId
              ? 'border-accent-amber/60 text-text-primary'
              : 'border-border-default text-text-dim'
          "
          @click="toggleDropdown('away')"
        >
          <div class="flex items-center gap-2 min-w-0">
            <span class="size-2 bg-accent-amber shrink-0" />
            <span class="font-display truncate text-[13px]">
              {{ selectedAwayTeam?.name ?? 'Đội khách' }}
            </span>
          </div>
          <Icon
            icon="lucide:chevron-down"
            class="size-3.5 text-text-dim shrink-0 transition-transform"
            :class="activeDropdown === 'away' && 'rotate-180'"
          />
        </button>
        <div
          class="text-[10px] text-text-dim mt-1 font-display tracking-widest uppercase text-center"
        >
          AWAY
        </div>
        <!-- Dropdown list -->
        <div
          v-if="activeDropdown === 'away'"
          class="absolute z-20 top-full left-0 right-0 mt-1 max-h-48 overflow-auto border border-border-default bg-bg-elevated divide-y divide-border-default shadow-lg shadow-bg-deep/50"
        >
          <button
            v-for="team in filteredTeams"
            :key="'a-' + team.id"
            type="button"
            class="w-full text-left px-3 py-2 text-xs flex items-center justify-between gap-2 transition"
            :class="[
              selectedAwayTeamId === team.id
                ? 'bg-bg-surface border-l-2 border-l-accent-amber text-text-primary'
                : 'border-l-2 border-l-transparent hover:bg-bg-surface text-text-secondary hover:text-text-primary',
              selectedHomeTeamId === team.id ? 'opacity-30 pointer-events-none' : '',
            ]"
            @click="selectAway(team.id)"
          >
            <span class="font-display text-[13px]">{{ team.name }}</span>
            <span class="text-[10px] text-text-dim font-mono">{{ team.shortName }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Nút PREDICT — CTA chính -->
    <button
      v-if="hasFullSelection"
      :disabled="isPredicting"
      class="mt-5 w-full border-2 border-accent-sky bg-accent-sky/10 text-accent-sky font-display font-bold text-sm tracking-widest uppercase px-5 py-3.5 transition-all duration-300 hover:bg-accent-sky hover:text-bg-deep hover:shadow-lg hover:shadow-accent-sky/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2.5"
      @click="store.predict()"
    >
      <template v-if="isPredicting">
        <svg
          class="animate-spin size-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          />
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
        <span>Đang phân tích...</span>
      </template>
      <template v-else>
        <Icon icon="lucide:zap" class="size-4" />
        <span>Predict</span>
      </template>
    </button>

    <!-- Hint khi chưa chọn đủ -->
    <div v-else class="mt-4 text-[11px] text-text-dim flex items-center justify-center gap-1.5">
      <Icon icon="lucide:info" class="size-3" />
      <span>Chọn cả 2 đội để dự đoán</span>
    </div>
  </section>
</template>
