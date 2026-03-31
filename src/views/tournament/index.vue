<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import type { TournamentFormat } from './types'
import TournamentCreate from './components/TournamentCreate.vue'
import TournamentDetail from './components/TournamentDetail.vue'
import TournamentList from './components/TournamentList.vue'
import { useShare } from './composables/useShare'
import { useTournament } from './composables/useTournament'

const {
  tournaments,
  currentView,
  currentTournament,
  navigateTo,
  createTournament,
  deleteTournament,
  addParticipant,
  addParticipantsBulk,
  removeParticipant,
  editParticipant,
  startTournament,
  submitMatchResult,
  startKnockoutStage,
} = useTournament()

const { getSharedTournament } = useShare()

onMounted(() => {
  const shared = getSharedTournament()
  if (shared) {
    const existing = tournaments.value.find((t) => t.id === shared.id)
    if (existing) {
      Object.assign(existing, shared)
    } else {
      tournaments.value.push(shared)
    }
    navigateTo('detail', shared.id)
  }
})

function handleCreate(name: string, sport: string, format: TournamentFormat) {
  const result = createTournament(name, sport, format)
  if (!result.ok) {
    alert(result.error)
  }
}

function handleDelete(id: string) {
  if (confirm('Bạn có chắc muốn xóa giải đấu này?')) {
    deleteTournament(id)
  }
}

function handleAddParticipant(name: string) {
  if (!currentTournament.value) return
  const result = addParticipant(currentTournament.value.id, name)
  if (!result.ok) alert(result.error)
}

function handleAddBulk(text: string) {
  if (!currentTournament.value) return
  const result = addParticipantsBulk(currentTournament.value.id, text)
  if (result.errors.length > 0) {
    alert(`Đã thêm ${result.added} người.\nLỗi:\n${result.errors.join('\n')}`)
  }
}

function handleRemoveParticipant(id: string) {
  if (!currentTournament.value) return
  removeParticipant(currentTournament.value.id, id)
}

function handleEditParticipant(id: string, name: string) {
  if (!currentTournament.value) return
  const result = editParticipant(currentTournament.value.id, id, name)
  if (!result.ok) alert(result.error)
}

function handleStart(randomize: boolean) {
  if (!currentTournament.value) return
  const result = startTournament(currentTournament.value.id, randomize)
  if (!result.ok) alert(result.error)
}

function handleSubmitResult(matchId: string, scoreA: number, scoreB: number) {
  if (!currentTournament.value) return
  const result = submitMatchResult(currentTournament.value.id, matchId, scoreA, scoreB)
  if (!result.ok) alert(result.error)
}

function handleStartKnockout() {
  if (!currentTournament.value) return
  const result = startKnockoutStage(currentTournament.value.id)
  if (!result.ok) alert(result.error)
}

function handleSetLegs(legs: 1 | 2) {
  if (!currentTournament.value || currentTournament.value.status !== 'setup') return
  currentTournament.value.roundRobinLegs = legs
}

function handleSetGroupCount(count: number | null) {
  if (!currentTournament.value || currentTournament.value.status !== 'setup') return
  currentTournament.value.groupCount = count
}

function handleSetAdvancePerGroup(count: number) {
  if (!currentTournament.value || currentTournament.value.status !== 'setup') return
  currentTournament.value.advancePerGroup = count
}
</script>

<template>
  <div class="min-h-screen bg-bg-deep">
    <div class="mx-auto max-w-5xl px-6 py-8">
      <!-- Back to home -->
      <RouterLink
        to="/"
        class="mb-8 inline-flex items-center gap-2 border border-border-default bg-bg-surface px-5 py-2.5 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
      >
        ← Về trang chủ
      </RouterLink>

      <!-- Title -->
      <div class="mb-10 animate-fade-up">
        <h1 class="font-display text-4xl font-bold tracking-tight text-text-primary md:text-5xl">
          Quản Lý <span class="text-accent-coral">Giải Đấu</span>
        </h1>
        <p class="mt-3 text-text-secondary">
          Tạo giải, chia bảng tự động, nhập kết quả và theo dõi tiến trình thi đấu.
        </p>
      </div>

      <!-- Views -->
      <div class="animate-fade-up animate-delay-2">
        <TournamentList
          v-if="currentView === 'list'"
          :tournaments="tournaments"
          @navigate="navigateTo"
          @delete="handleDelete"
        />

        <TournamentCreate
          v-else-if="currentView === 'create'"
          @create="handleCreate"
          @cancel="navigateTo('list')"
        />

        <TournamentDetail
          v-else-if="currentView === 'detail' && currentTournament"
          :tournament="currentTournament"
          @back="navigateTo('list')"
          @add-participant="handleAddParticipant"
          @add-participants-bulk="handleAddBulk"
          @remove-participant="handleRemoveParticipant"
          @edit-participant="handleEditParticipant"
          @start="handleStart"
          @submit-result="handleSubmitResult"
          @start-knockout="handleStartKnockout"
          @set-round-robin-legs="handleSetLegs"
          @set-group-count="handleSetGroupCount"
          @set-advance-per-group="handleSetAdvancePerGroup"
        />
      </div>

      <!-- ── Footer signature ────────────────────────────────── -->
      <footer class="mt-auto border-t border-border-default/50 bg-bg-surface/30">
        <div class="mx-auto flex max-w-2xl flex-wrap items-center justify-between gap-3 px-6 py-4">
          <div class="flex items-center gap-3">
            <span class="font-display text-xs tracking-widest text-text-dim">//</span>
            <div>
              <p class="font-display text-sm font-semibold text-text-secondary">Hachi Tu</p>
              <p class="text-xs text-text-dim">Tác giả</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <a
              href="https://github.com/hachitubg"
              target="_blank"
              rel="noopener noreferrer"
              class="flex items-center gap-1.5 border border-border-default px-3 py-1.5 text-xs text-text-dim transition hover:border-text-secondary hover:text-text-secondary"
            >
              <Icon icon="lucide:github" class="size-3.5" />
              GitHub
            </a>
            <a
              href="https://www.facebook.com/tuhachiz/"
              target="_blank"
              rel="noopener noreferrer"
              class="flex items-center gap-1.5 border border-border-default px-3 py-1.5 text-xs text-text-dim transition hover:border-accent-sky hover:text-accent-sky"
            >
              <Icon icon="lucide:facebook" class="size-3.5" />
              Facebook
            </a>
          </div>
        </div>
      </footer>
    </div>
  </div>
</template>
