<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { CardSet, Folder } from '../../types'
import { getFolderById } from '../../services/folder-service'
import {
  getSetsByFolder,
  createSet,
  updateSet,
  removeSet,
  getSetLastStudied,
} from '../../services/set-service'
import { getCardsBySet } from '../../services/card-service'
import { useNavigation } from '../../composables/use-navigation'
import EmptyState from '../layout/EmptyState.vue'
import ConfirmDialog from '../layout/ConfirmDialog.vue'
import SetCard from './SetCard.vue'
import SetForm from './SetForm.vue'

const props = defineProps<{
  folderId?: string
}>()

const { goToEditor, goToStudyConfig } = useNavigation()

const folder = ref<Folder | undefined>()
const sets = ref<CardSet[]>([])
const cardCounts = ref<Record<string, number>>({})
const masteredCounts = ref<Record<string, number>>({})
const inProgressCounts = ref<Record<string, number>>({})
const newCounts = ref<Record<string, number>>({})
const lastStudiedMap = ref<Record<string, number | null>>({})
const showForm = ref(false)
const editingSet = ref<CardSet | undefined>()
const deletingSet = ref<CardSet | undefined>()
const deletingCardCount = ref(0)

async function loadData() {
  if (!props.folderId) return
  folder.value = await getFolderById(props.folderId)
  sets.value = await getSetsByFolder(props.folderId)

  const results = await Promise.all(
    sets.value.map(async (s) => {
      const [cards, studied] = await Promise.all([getCardsBySet(s.id), getSetLastStudied(s.id)])
      let mastered = 0
      let inProgress = 0
      let newCards = 0
      for (const c of cards) {
        if (c.level === 3) mastered++
        else if (c.level > 0) inProgress++
        else newCards++
      }
      return { id: s.id, count: cards.length, mastered, inProgress, newCards, studied }
    }),
  )
  const counts: Record<string, number> = {}
  const mastered: Record<string, number> = {}
  const inProgress: Record<string, number> = {}
  const newCards: Record<string, number> = {}
  const studied: Record<string, number | null> = {}
  for (const r of results) {
    counts[r.id] = r.count
    mastered[r.id] = r.mastered
    inProgress[r.id] = r.inProgress
    newCards[r.id] = r.newCards
    studied[r.id] = r.studied
  }
  cardCounts.value = counts
  masteredCounts.value = mastered
  inProgressCounts.value = inProgress
  newCounts.value = newCards
  lastStudiedMap.value = studied
}

onMounted(loadData)

function openCreate() {
  editingSet.value = undefined
  showForm.value = true
}

function openEdit(set: CardSet) {
  editingSet.value = set
  showForm.value = true
}

function openDelete(set: CardSet) {
  deletingCardCount.value = cardCounts.value[set.id] ?? 0
  deletingSet.value = set
}

async function handleSave(data: Pick<CardSet, 'name' | 'description'>) {
  if (editingSet.value) {
    await updateSet(editingSet.value.id, data)
  } else if (props.folderId) {
    await createSet({ ...data, folderId: props.folderId })
  }
  showForm.value = false
  editingSet.value = undefined
  await loadData()
}

async function handleDelete() {
  if (!deletingSet.value) return
  await removeSet(deletingSet.value.id)
  deletingSet.value = undefined
  await loadData()
}
</script>

<template>
  <div class="animate-fade-up animate-delay-1">
    <div class="flex items-center justify-between mb-8">
      <h2 class="font-display text-2xl font-semibold text-text-primary flex items-center gap-3">
        <span v-if="folder" class="text-2xl">{{ folder.icon }}</span>
        <span>{{ folder?.name ?? 'Bộ thẻ' }}</span>
      </h2>
      <div class="flex items-center gap-2">
        <button
          class="inline-flex items-center gap-2 border border-accent-coral bg-accent-coral/10 px-4 py-2 text-sm text-accent-coral font-semibold transition hover:bg-accent-coral hover:text-bg-deep"
          @click="openCreate"
        >
          + Tạo bộ thẻ
        </button>
      </div>
    </div>

    <EmptyState
      v-if="sets.length === 0"
      icon="🗂️"
      title="Chưa có bộ thẻ nào"
      description="Tạo bộ thẻ đầu tiên trong thư mục này"
      action-label="+ Tạo bộ thẻ"
      @action="openCreate"
    />

    <div v-else class="space-y-3">
      <SetCard
        v-for="s in sets"
        :key="s.id"
        :set="s"
        :card-count="cardCounts[s.id] ?? 0"
        :mastered-count="masteredCounts[s.id] ?? 0"
        :in-progress-count="inProgressCounts[s.id] ?? 0"
        :new-count="newCounts[s.id] ?? 0"
        :last-studied="lastStudiedMap[s.id] ?? null"
        @click="goToEditor(folderId!, s.id, undefined, s.name)"
        @study="goToStudyConfig(folderId!, s.id, undefined, s.name)"
        @edit="openEdit(s)"
        @delete="openDelete(s)"
      />
    </div>

    <SetForm v-if="showForm" :set="editingSet" @save="handleSave" @cancel="showForm = false" />

    <ConfirmDialog
      v-if="deletingSet"
      title="Xóa bộ thẻ"
      :message="`Bạn có chắc muốn xóa bộ thẻ '${deletingSet.name}'? Tất cả ${deletingCardCount} thẻ bên trong sẽ bị xóa vĩnh viễn.`"
      confirm-label="Xóa"
      @confirm="handleDelete"
      @cancel="deletingSet = undefined"
    />
  </div>
</template>
