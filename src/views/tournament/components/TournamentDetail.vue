<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { computed, ref } from 'vue'
import type { Tournament, TournamentFormat } from '../types'
import { FORMAT_LABELS, STATUS_LABELS } from '../types'
import { useShare } from '../composables/useShare'
import BracketView from './BracketView.vue'
import GroupStageView from './GroupStageView.vue'
import ParticipantManager from './ParticipantManager.vue'
import RoundRobinView from './RoundRobinView.vue'

const props = defineProps<{
  tournament: Tournament
}>()

const emit = defineEmits<{
  back: []
  addParticipant: [name: string]
  addParticipantsBulk: [text: string]
  removeParticipant: [id: string]
  editParticipant: [id: string, name: string]
  start: [randomize: boolean]
  submitResult: [matchId: string, scoreA: number, scoreB: number]
  startKnockout: []
  updateTournament: [data: { name?: string; sport?: string; format?: TournamentFormat }]
  setRoundRobinLegs: [legs: 1 | 2]
  setGroupCount: [count: number | null]
  setAdvancePerGroup: [count: number]
}>()

const { exporting, sharing, exportImage, copyShareLink } = useShare()

const isSetup = computed(() => props.tournament.status === 'setup')
const isInProgress = computed(() => props.tournament.status === 'in-progress')
const isFinished = computed(() => props.tournament.status === 'finished')

const randomize = ref(true)
const error = ref('')
const shareMsg = ref('')

const showSettings = ref(false)
const tournamentContentRef = ref<HTMLElement | null>(null)

const wbMatches = computed(() => props.tournament.matches.filter((m) => m.bracket === 'winners'))
const lbMatches = computed(() => props.tournament.matches.filter((m) => m.bracket === 'losers'))
const gfMatches = computed(() =>
  props.tournament.matches.filter((m) => m.bracket === 'grand-final'),
)

function statusColor(status: string): string {
  if (status === 'setup') return 'text-accent-amber'
  if (status === 'in-progress') return 'text-accent-sky'
  return 'text-text-dim'
}

function handleStart() {
  error.value = ''
  emit('start', randomize.value)
}

async function handleExportImage() {
  if (!tournamentContentRef.value) return
  await exportImage(tournamentContentRef.value, props.tournament.name)
}

async function handleCopyShareLink() {
  shareMsg.value = ''
  const isUrl = await copyShareLink(props.tournament)
  if (isUrl) {
    shareMsg.value = 'Đã sao chép link chia sẻ!'
  } else {
    shareMsg.value =
      'Dữ liệu quá lớn, đã sao chép mã giải đấu. Gửi mã này cho người khác để import.'
  }
  setTimeout(() => {
    shareMsg.value = ''
  }, 3000)
}

function getChampionName(): string {
  if (props.tournament.status !== 'finished') return ''
  const matches = props.tournament.knockoutStage
    ? props.tournament.knockoutStage.matches
    : props.tournament.matches
  const nonBye = matches.filter((m) => !m.isBye)
  if (nonBye.length === 0) return ''

  if (props.tournament.format === 'round-robin') {
    return ''
  }

  const finalMatch = nonBye.reduce((a, b) => (a.roundIndex > b.roundIndex ? a : b))
  if (!finalMatch?.winner) return ''
  return props.tournament.participants.find((p) => p.id === finalMatch.winner)?.name ?? ''
}
</script>

<template>
  <div>
    <button
      class="mb-6 inline-flex items-center gap-2 text-sm text-text-secondary transition hover:text-text-primary"
      @click="emit('back')"
    >
      <Icon icon="lucide:arrow-left" class="size-4" />
      Quay lại danh sách
    </button>

    <!-- Header -->
    <div class="mb-8 border border-border-default bg-bg-surface p-6">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h2 class="font-display text-2xl font-bold text-text-primary">
            {{ tournament.name }}
          </h2>
          <div class="mt-2 flex flex-wrap items-center gap-3 text-xs text-text-dim">
            <span class="inline-flex items-center gap-1">
              <Icon icon="lucide:gamepad-2" class="size-3.5" />
              {{ tournament.sport }}
            </span>
            <span class="inline-flex items-center gap-1">
              <Icon icon="lucide:git-branch" class="size-3.5" />
              {{ FORMAT_LABELS[tournament.format] }}
            </span>
            <span class="inline-flex items-center gap-1">
              <Icon icon="lucide:users" class="size-3.5" />
              {{ tournament.participants.length }} người tham gia
            </span>
          </div>
        </div>
        <span :class="['border px-3 py-1 text-xs font-semibold', statusColor(tournament.status)]">
          {{ STATUS_LABELS[tournament.status] }}
        </span>
      </div>

      <!-- Share / Export -->
      <div v-if="isInProgress || isFinished" class="mt-4 flex flex-wrap items-center gap-2">
        <button
          class="inline-flex items-center gap-1.5 border border-border-default px-3 py-1.5 text-xs text-text-dim transition hover:border-accent-sky hover:text-accent-sky disabled:opacity-50"
          :disabled="exporting"
          @click="handleExportImage"
        >
          <Icon icon="lucide:image-down" class="size-3.5" />
          {{ exporting ? 'Đang xuất...' : 'Xuất ảnh' }}
        </button>
        <button
          class="inline-flex items-center gap-1.5 border border-border-default px-3 py-1.5 text-xs text-text-dim transition hover:border-accent-amber hover:text-accent-amber disabled:opacity-50"
          :disabled="sharing"
          @click="handleCopyShareLink"
        >
          <Icon icon="lucide:share-2" class="size-3.5" />
          Chia sẻ link
        </button>
        <span v-if="shareMsg" class="text-xs text-accent-sky">{{ shareMsg }}</span>
      </div>

      <!-- Champion banner -->
      <div
        v-if="isFinished && getChampionName()"
        class="mt-4 border border-accent-amber/30 bg-accent-amber/5 p-4 text-center"
      >
        <Icon icon="lucide:trophy" class="mx-auto mb-2 size-8 text-accent-amber" />
        <p class="font-display text-lg font-bold text-accent-amber">Nhà vô địch</p>
        <p class="mt-1 font-display text-2xl font-bold text-text-primary">
          {{ getChampionName() }}
        </p>
      </div>
    </div>

    <!-- Setup phase -->
    <div v-if="isSetup" class="space-y-6">
      <ParticipantManager
        :participants="tournament.participants"
        :is-setup="true"
        @add="(name) => emit('addParticipant', name)"
        @add-bulk="(text) => emit('addParticipantsBulk', text)"
        @remove="(id) => emit('removeParticipant', id)"
        @edit="(id, name) => emit('editParticipant', id, name)"
      />

      <!-- Settings for specific formats -->
      <div v-if="tournament.format === 'round-robin' || tournament.format === 'group-knockout'">
        <button
          class="mb-3 inline-flex items-center gap-2 text-sm text-accent-sky transition hover:text-accent-sky/80"
          @click="showSettings = !showSettings"
        >
          <Icon icon="lucide:settings" class="size-4" />
          Cài đặt thêm
          <Icon
            :icon="showSettings ? 'lucide:chevron-up' : 'lucide:chevron-down'"
            class="size-3.5"
          />
        </button>

        <div v-if="showSettings" class="space-y-4 border border-border-default bg-bg-surface p-4">
          <div v-if="tournament.format === 'round-robin'">
            <label class="mb-2 block text-sm text-text-secondary">Số lượt đấu</label>
            <div class="flex gap-2">
              <button
                :class="[
                  'border px-4 py-2 text-sm transition',
                  tournament.roundRobinLegs === 1
                    ? 'border-accent-coral bg-accent-coral/10 text-accent-coral'
                    : 'border-border-default text-text-dim hover:bg-bg-elevated',
                ]"
                @click="emit('setRoundRobinLegs', 1)"
              >
                1 lượt
              </button>
              <button
                :class="[
                  'border px-4 py-2 text-sm transition',
                  tournament.roundRobinLegs === 2
                    ? 'border-accent-coral bg-accent-coral/10 text-accent-coral'
                    : 'border-border-default text-text-dim hover:bg-bg-elevated',
                ]"
                @click="emit('setRoundRobinLegs', 2)"
              >
                2 lượt (lượt đi - lượt về)
              </button>
            </div>
          </div>

          <div v-if="tournament.format === 'group-knockout'">
            <label class="mb-2 block text-sm text-text-secondary">Số bảng</label>
            <input
              :value="tournament.groupCount"
              type="number"
              min="2"
              class="w-24 border border-border-default bg-bg-deep px-3 py-2 text-sm text-text-primary outline-none focus:border-accent-coral"
              placeholder="Tự động"
              @input="
                emit(
                  'setGroupCount',
                  ($event.target as HTMLInputElement).value
                    ? Number(($event.target as HTMLInputElement).value)
                    : null,
                )
              "
            />
            <p class="mt-1 text-xs text-text-dim">Để trống để tự động tính</p>
          </div>

          <div v-if="tournament.format === 'group-knockout'">
            <label class="mb-2 block text-sm text-text-secondary">Số đội đi tiếp mỗi bảng</label>
            <input
              :value="tournament.advancePerGroup"
              type="number"
              min="1"
              max="4"
              class="w-24 border border-border-default bg-bg-deep px-3 py-2 text-sm text-text-primary outline-none focus:border-accent-coral"
              @input="
                emit('setAdvancePerGroup', Number(($event.target as HTMLInputElement).value) || 2)
              "
            />
          </div>
        </div>
      </div>

      <!-- Start button -->
      <div class="border border-border-default bg-bg-surface p-6">
        <div class="mb-4 flex items-center gap-3">
          <label class="flex cursor-pointer items-center gap-2 text-sm text-text-secondary">
            <input v-model="randomize" type="checkbox" class="accent-accent-coral" />
            Bốc thăm ngẫu nhiên
          </label>
        </div>
        <button
          class="inline-flex items-center gap-2 border border-accent-coral bg-accent-coral px-6 py-3 text-sm font-semibold text-bg-deep transition hover:bg-accent-coral/90 disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="tournament.participants.length < 2"
          @click="handleStart"
        >
          <Icon icon="lucide:play" class="size-4" />
          Bắt đầu giải đấu
        </button>
        <p v-if="error" class="mt-2 text-xs text-accent-coral">
          {{ error }}
        </p>
        <p v-if="tournament.participants.length < 2" class="mt-2 text-xs text-text-dim">
          Cần ít nhất 2 người tham gia
        </p>
      </div>
    </div>

    <!-- In-progress / Finished -->
    <div v-if="isInProgress || isFinished" ref="tournamentContentRef">
      <!-- Single Elimination -->
      <BracketView
        v-if="tournament.format === 'single-elimination'"
        :tournament="tournament"
        :matches="tournament.matches"
        :editable="isInProgress"
        @submit-result="(id, a, b) => emit('submitResult', id, a, b)"
      />

      <!-- Double Elimination -->
      <div v-else-if="tournament.format === 'double-elimination'" class="space-y-8">
        <BracketView
          :tournament="tournament"
          :matches="wbMatches"
          :editable="isInProgress"
          bracket-label="WINNERS BRACKET"
          @submit-result="(id, a, b) => emit('submitResult', id, a, b)"
        />
        <BracketView
          :tournament="tournament"
          :matches="lbMatches"
          :editable="isInProgress"
          bracket-label="LOSERS BRACKET"
          @submit-result="(id, a, b) => emit('submitResult', id, a, b)"
        />
        <BracketView
          v-if="gfMatches.length > 0"
          :tournament="tournament"
          :matches="gfMatches"
          :editable="isInProgress"
          bracket-label="GRAND FINAL"
          @submit-result="(id, a, b) => emit('submitResult', id, a, b)"
        />
      </div>

      <!-- Group Stage + Knockout -->
      <GroupStageView
        v-else-if="tournament.format === 'group-knockout'"
        :tournament="tournament"
        :editable="isInProgress"
        @submit-result="(id, a, b) => emit('submitResult', id, a, b)"
        @start-knockout="emit('startKnockout')"
      />

      <!-- Round Robin -->
      <RoundRobinView
        v-else-if="tournament.format === 'round-robin'"
        :tournament="tournament"
        :editable="isInProgress"
        @submit-result="(id, a, b) => emit('submitResult', id, a, b)"
      />
    </div>
  </div>
</template>
