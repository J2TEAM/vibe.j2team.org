<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { ref } from 'vue'
import type { Match } from '../types'

const props = defineProps<{
  match: Match
  nameA: string
  nameB: string
  editable: boolean
  allowDraw: boolean
}>()

const emit = defineEmits<{
  submit: [matchId: string, scoreA: number, scoreB: number]
}>()

const isEditing = ref(false)
const scoreA = ref(props.match.scoreA ?? 0)
const scoreB = ref(props.match.scoreB ?? 0)
const error = ref('')

function openEdit() {
  scoreA.value = props.match.scoreA ?? 0
  scoreB.value = props.match.scoreB ?? 0
  isEditing.value = true
  error.value = ''
}

function submit() {
  error.value = ''
  if (scoreA.value < 0 || scoreB.value < 0) {
    error.value = 'Điểm >= 0'
    return
  }
  if (!props.allowDraw && scoreA.value === scoreB.value) {
    error.value = 'Không được hòa'
    return
  }
  emit('submit', props.match.id, scoreA.value, scoreB.value)
  isEditing.value = false
}

function cancel() {
  isEditing.value = false
}
</script>

<template>
  <div
    :class="[
      'border bg-bg-surface p-3 transition',
      match.isBye
        ? 'border-border-default opacity-50'
        : 'border-border-default hover:border-accent-coral/50',
    ]"
  >
    <div v-if="match.isBye" class="text-center text-xs text-text-dim">{{ nameA }} — BYE</div>
    <template v-else>
      <div v-if="!isEditing" class="space-y-1.5">
        <div class="flex items-center justify-between gap-2">
          <span
            :class="[
              'flex-1 truncate text-sm',
              match.winner === match.participantA
                ? 'font-semibold text-accent-coral'
                : 'text-text-primary',
            ]"
          >
            {{ nameA }}
          </span>
          <span
            v-if="match.status === 'done'"
            class="min-w-[2rem] text-center font-display text-sm font-semibold text-text-primary"
          >
            {{ match.scoreA }}
          </span>
        </div>
        <div class="flex items-center justify-between gap-2">
          <span
            :class="[
              'flex-1 truncate text-sm',
              match.winner === match.participantB
                ? 'font-semibold text-accent-coral'
                : 'text-text-primary',
            ]"
          >
            {{ nameB }}
          </span>
          <span
            v-if="match.status === 'done'"
            class="min-w-[2rem] text-center font-display text-sm font-semibold text-text-primary"
          >
            {{ match.scoreB }}
          </span>
        </div>
        <div class="flex items-center justify-between pt-1">
          <span v-if="match.status === 'done' && !match.winner" class="text-xs text-accent-amber"
            >Hòa</span
          >
          <span v-else-if="match.status === 'pending'" class="text-xs text-text-dim">Chưa đấu</span>
          <span v-else />
          <button
            v-if="editable && match.participantA && match.participantB"
            class="inline-flex items-center gap-1 text-xs text-accent-sky transition hover:text-accent-sky/80"
            @click="openEdit"
          >
            <Icon icon="lucide:edit-3" class="size-3" />
            {{ match.status === 'done' ? 'Sửa' : 'Nhập điểm' }}
          </button>
        </div>
      </div>

      <div v-else class="space-y-2">
        <div class="flex items-center gap-2">
          <span class="flex-1 truncate text-xs text-text-secondary">{{ nameA }}</span>
          <input
            v-model.number="scoreA"
            type="number"
            min="0"
            class="w-14 border border-border-default bg-bg-deep px-2 py-1 text-center text-sm text-text-primary outline-none focus:border-accent-coral"
          />
        </div>
        <div class="flex items-center gap-2">
          <span class="flex-1 truncate text-xs text-text-secondary">{{ nameB }}</span>
          <input
            v-model.number="scoreB"
            type="number"
            min="0"
            class="w-14 border border-border-default bg-bg-deep px-2 py-1 text-center text-sm text-text-primary outline-none focus:border-accent-coral"
          />
        </div>
        <p v-if="error" class="text-xs text-accent-coral">
          {{ error }}
        </p>
        <div class="flex gap-2">
          <button
            class="flex-1 border border-accent-coral bg-accent-coral/10 py-1.5 text-xs font-semibold text-accent-coral transition hover:bg-accent-coral/20"
            @click="submit"
          >
            Lưu
          </button>
          <button
            class="flex-1 border border-border-default py-1.5 text-xs text-text-dim transition hover:bg-bg-elevated"
            @click="cancel"
          >
            Hủy
          </button>
        </div>
      </div>
    </template>
  </div>
</template>
