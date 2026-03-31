<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { ref, computed } from 'vue'
import { onClickOutside } from '@vueuse/core'
import type { League } from '../types'

const props = defineProps<{
  label: string
  icon: string
  leagues: League[]
  selectedLeagues: string[]
  hotSlugs?: Set<string>
}>()

const emit = defineEmits<{
  toggle: [leagueId: string]
  selectAllGroup: [leagueIds: string[]]
  deselectAllGroup: [leagueIds: string[]]
}>()

const open = ref(false)
const search = ref('')
const dropdownRef = ref<HTMLElement>()

onClickOutside(dropdownRef, () => {
  open.value = false
})

const filtered = computed(() => {
  const q = search.value.toLowerCase().trim()
  if (!q) return props.leagues
  return props.leagues.filter(
    (l) => l.nameVi.toLowerCase().includes(q) || l.name.toLowerCase().includes(q),
  )
})

const selectedCount = computed(() => {
  const ids = new Set(props.leagues.map((l) => l.id))
  return props.selectedLeagues.filter((id) => ids.has(id)).length
})

const allSelected = computed(() => selectedCount.value === props.leagues.length)

function toggleAll() {
  const ids = props.leagues.map((l) => l.id)
  if (allSelected.value) {
    emit('deselectAllGroup', ids)
  } else {
    emit('selectAllGroup', ids)
  }
}

function handleToggle(id: string) {
  emit('toggle', id)
}

function isHot(slug: string): boolean {
  return props.hotSlugs?.has(slug) ?? false
}
</script>

<template>
  <div ref="dropdownRef" class="relative isolate">
    <!-- Trigger button -->
    <button
      class="flex w-full items-center gap-2 border bg-bg-surface px-3 py-2.5 text-sm transition"
      :class="
        open
          ? 'border-accent-coral text-text-primary'
          : 'border-border-default text-text-secondary hover:border-accent-coral/50'
      "
      @click="open = !open"
    >
      <Icon :icon="icon" class="size-4 shrink-0 text-accent-amber" />
      <span class="flex-1 truncate text-left">{{ label }}</span>
      <span
        v-if="selectedCount > 0"
        class="shrink-0 bg-accent-coral/15 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-accent-coral"
      >
        {{ selectedCount }}/{{ leagues.length }}
      </span>
      <Icon
        icon="lucide:chevron-down"
        class="size-4 shrink-0 text-text-dim transition-transform"
        :class="open ? 'rotate-180' : ''"
      />
    </button>

    <!-- Dropdown panel -->
    <div
      v-if="open"
      class="absolute left-0 z-50 mt-1 w-full min-w-64 border border-border-default bg-bg-deep shadow-xl shadow-black/30"
    >
      <!-- Search -->
      <div class="border-b border-border-default p-2">
        <div
          class="flex items-center gap-2 border border-border-default bg-bg-surface px-2.5 py-1.5"
        >
          <Icon icon="lucide:search" class="size-3.5 text-text-dim" />
          <input
            v-model="search"
            type="text"
            placeholder="Tìm giải đấu..."
            class="w-full bg-transparent text-xs text-text-primary outline-none placeholder:text-text-dim"
          />
        </div>
      </div>

      <!-- Select all / deselect -->
      <div class="flex items-center justify-between border-b border-border-default/50 px-3 py-1.5">
        <button
          class="text-[11px] text-text-dim transition hover:text-accent-coral"
          @click="toggleAll"
        >
          {{ allSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả' }}
        </button>
        <span class="text-[10px] text-text-dim">{{ selectedCount }} đã chọn</span>
      </div>

      <!-- League list -->
      <div class="league-scrollbar max-h-60 overflow-y-auto overscroll-contain p-1">
        <div v-if="filtered.length === 0" class="px-3 py-4 text-center text-xs text-text-dim">
          Không tìm thấy giải đấu
        </div>

        <button
          v-for="league in filtered"
          :key="league.id"
          class="flex w-full items-center gap-2.5 px-2.5 py-2 text-left transition hover:bg-bg-elevated"
          @click="handleToggle(league.id)"
        >
          <!-- Checkbox -->
          <div
            class="flex size-4 shrink-0 items-center justify-center border transition"
            :class="
              selectedLeagues.includes(league.id)
                ? 'border-accent-coral bg-accent-coral'
                : 'border-border-default'
            "
          >
            <Icon
              v-if="selectedLeagues.includes(league.id)"
              icon="lucide:check"
              class="size-3 text-white"
            />
          </div>

          <!-- Logo -->
          <img
            v-if="league.logo"
            :src="league.logo"
            :alt="league.nameVi"
            class="size-5 shrink-0 object-contain"
            loading="lazy"
          />
          <div
            v-else
            class="flex size-5 shrink-0 items-center justify-center bg-bg-elevated text-[8px] text-text-dim"
          >
            <Icon
              :icon="league.group === 'national' ? 'lucide:flag' : 'lucide:trophy'"
              class="size-3"
            />
          </div>

          <!-- Name -->
          <div class="min-w-0 flex-1">
            <div
              class="truncate text-xs"
              :class="
                selectedLeagues.includes(league.id) ? 'text-text-primary' : 'text-text-secondary'
              "
            >
              {{ league.nameVi }}
            </div>
            <div v-if="league.country" class="truncate text-[10px] text-text-dim">
              {{ league.country }}
            </div>
          </div>

          <!-- Hot badge -->
          <span
            v-if="isHot(league.slug)"
            class="shrink-0 bg-accent-coral/15 px-1 py-0.5 text-[9px] font-bold text-accent-coral"
          >
            HOT
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.league-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: var(--color-border-default) transparent;
}

.league-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.league-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.league-scrollbar::-webkit-scrollbar-thumb {
  background-color: var(--color-border-default);
  border-radius: 3px;
}

.league-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: var(--color-text-dim);
}
</style>
