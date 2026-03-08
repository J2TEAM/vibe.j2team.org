<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { Card, CardSet } from '../../types'
import { getSetById } from '../../services/set-service'
import {
  getCardsBySet,
  createCard,
  updateCard,
  removeCard,
  reorderCard,
  bulkCreateCards,
} from '../../services/card-service'
import { useNavigation } from '../../composables/use-navigation'
import EmptyState from '../layout/EmptyState.vue'
import ConfirmDialog from '../layout/ConfirmDialog.vue'
import CardRow from './CardRow.vue'
import CardForm from './CardForm.vue'
import BulkImportModal from './BulkImportModal.vue'
import ImportExportBar from './ImportExportBar.vue'

const props = defineProps<{
  folderId?: string
  setId?: string
}>()

const { goToStudyConfig } = useNavigation()

const set = ref<CardSet | undefined>()
const cards = ref<Card[]>([])
const showAddForm = ref(false)
const editingCard = ref<Card | undefined>()
const deletingCard = ref<Card | undefined>()
const showBulkImport = ref(false)

async function loadData() {
  if (!props.setId) return
  set.value = await getSetById(props.setId)
  cards.value = await getCardsBySet(props.setId)
}

onMounted(loadData)

async function handleAddCard(data: { front: string; back: string }) {
  if (!props.setId) return
  await createCard({ setId: props.setId, ...data })
  await loadData()
}

async function handleEditCard(data: { front: string; back: string }) {
  if (!editingCard.value) return
  await updateCard(editingCard.value.id, cards.value, data)
  editingCard.value = undefined
  await loadData()
}

async function handleDeleteCard() {
  if (!deletingCard.value) return
  await removeCard(deletingCard.value.id)
  deletingCard.value = undefined
  await loadData()
}

async function handleReorder(cardId: string, direction: 'up' | 'down') {
  await reorderCard(cards.value, cardId, direction)
  await loadData()
}

async function handleBulkImport(items: { front: string; back: string }[]) {
  if (!props.setId) return
  await bulkCreateCards(props.setId, items)
  showBulkImport.value = false
  await loadData()
}

async function handleJsonImport(items: { front: string; back: string }[]) {
  if (!props.setId) return
  await bulkCreateCards(props.setId, items)
  await loadData()
}
</script>

<template>
  <div class="animate-fade-up animate-delay-1">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <h2 class="font-display text-2xl font-semibold text-text-primary">
        {{ set?.name ?? 'Bộ thẻ' }}
      </h2>
      <div class="flex items-center gap-2">
        <button
          v-if="cards.length > 0"
          class="px-3 py-2 text-sm border border-accent-sky bg-accent-sky/10 text-accent-sky font-semibold transition hover:bg-accent-sky hover:text-bg-deep"
          @click="goToStudyConfig(folderId!, setId!, undefined, set?.name)"
        >
          Học ngay
        </button>
      </div>
    </div>

    <!-- Toolbar -->
    <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
      <div class="flex items-center gap-2">
        <button
          class="inline-flex items-center gap-1 px-3 py-1.5 text-xs border border-accent-coral bg-accent-coral/10 text-accent-coral font-semibold transition hover:bg-accent-coral hover:text-bg-deep"
          @click="showAddForm = !showAddForm"
        >
          + Thêm thẻ
        </button>
        <button
          class="px-3 py-1.5 text-xs border border-accent-amber bg-accent-amber/10 text-accent-amber font-semibold transition hover:bg-accent-amber hover:text-bg-deep"
          @click="showBulkImport = true"
        >
          Nhập hàng loạt
        </button>
      </div>
      <ImportExportBar
        v-if="set && cards.length > 0"
        :set="set"
        :cards="cards"
        @imported="handleJsonImport"
      />
    </div>

    <!-- Add form -->
    <CardForm v-if="showAddForm" class="mb-4" @save="handleAddCard" @cancel="showAddForm = false" />

    <!-- Edit form -->
    <CardForm
      v-if="editingCard"
      :card="editingCard"
      class="mb-4"
      @save="handleEditCard"
      @cancel="editingCard = undefined"
    />

    <!-- Card list -->
    <EmptyState
      v-if="cards.length === 0 && !showAddForm"
      icon="🃏"
      title="Chưa có thẻ nào"
      description="Thêm thẻ đầu tiên hoặc nhập hàng loạt"
      action-label="+ Thêm thẻ"
      @action="showAddForm = true"
    />

    <div v-else class="space-y-2">
      <!-- Column headers -->
      <div
        v-if="cards.length > 0"
        class="flex items-center gap-3 px-4 py-2 text-xs text-text-dim font-display"
      >
        <div class="w-6 shrink-0" />
        <div class="flex-1 min-w-0 grid grid-cols-2 gap-4">
          <span>Mặt trước</span>
          <span>Mặt sau</span>
        </div>
        <span class="w-14 shrink-0 text-center">Mức độ</span>
        <div class="w-16 shrink-0" />
      </div>

      <CardRow
        v-for="(card, index) in cards"
        :key="card.id"
        :card="card"
        :is-first="index === 0"
        :is-last="index === cards.length - 1"
        @edit="editingCard = card"
        @delete="deletingCard = card"
        @move-up="handleReorder(card.id, 'up')"
        @move-down="handleReorder(card.id, 'down')"
      />
    </div>

    <!-- Bulk import modal -->
    <BulkImportModal
      v-if="showBulkImport"
      @import="handleBulkImport"
      @cancel="showBulkImport = false"
    />

    <!-- Delete confirmation -->
    <ConfirmDialog
      v-if="deletingCard"
      title="Xóa thẻ"
      :message="`Bạn có chắc muốn xóa thẻ '${deletingCard.front}'?`"
      confirm-label="Xóa"
      @confirm="handleDeleteCard"
      @cancel="deletingCard = undefined"
    />
  </div>
</template>
