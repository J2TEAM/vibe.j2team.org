<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { Folder, CardSet } from '../../types'
import {
  getAllFolders,
  getFolderById,
  createFolder,
  updateFolder,
  removeFolder,
  getFolderSetCount,
} from '../../services/folder-service'
import { getSetById, getSetsByFolder, createSet } from '../../services/set-service'
import { getCardsBySet, bulkCreateCards } from '../../services/card-service'
import { getAllSessions } from '../../services/session-service'
import { useNavigation } from '../../composables/use-navigation'
import { formatDate } from '../../composables/format'
import EmptyState from '../layout/EmptyState.vue'
import ConfirmDialog from '../layout/ConfirmDialog.vue'
import FolderCard from './FolderCard.vue'
import FolderForm from './FolderForm.vue'

const { goToSets, goToEditor, goToStudyConfig } = useNavigation()

interface RecentSetInfo {
  set: CardSet
  folderName: string
  folderIcon: string
  cardCount: number
  masteredCount: number
  inProgressCount: number
  newCount: number
  lastStudied: number
}

const folders = ref<Folder[]>([])
const setCounts = ref<Record<string, number>>({})
const recentSets = ref<RecentSetInfo[]>([])
const showForm = ref(false)
const editingFolder = ref<Folder | undefined>()
const deletingFolder = ref<Folder | undefined>()
const deletingSetCount = ref(0)

async function loadFolders() {
  folders.value = await getAllFolders()
  const entries = await Promise.all(
    folders.value.map(async (f) => [f.id, await getFolderSetCount(f.id)] as const),
  )
  setCounts.value = Object.fromEntries(entries)
}

async function loadRecentSets() {
  const sessions = await getAllSessions()
  // Sort by most recent, deduplicate by setId
  sessions.sort((a, b) => b.startedAt - a.startedAt)
  const seen = new Set<string>()
  const topSetIds: { setId: string; lastStudied: number }[] = []
  for (const s of sessions) {
    if (seen.has(s.setId)) continue
    seen.add(s.setId)
    topSetIds.push({ setId: s.setId, lastStudied: s.startedAt })
    if (topSetIds.length >= 3) break
  }

  if (topSetIds.length === 0) return

  const results = await Promise.all(
    topSetIds.map(async ({ setId, lastStudied }) => {
      const [set, cards] = await Promise.all([getSetById(setId), getCardsBySet(setId)])
      if (!set) return null
      const folder = await getFolderById(set.folderId)
      if (!folder) return null
      let masteredCount = 0
      let inProgressCount = 0
      let newCount = 0
      for (const c of cards) {
        if (c.level === 3) masteredCount++
        else if (c.level > 0) inProgressCount++
        else newCount++
      }
      return {
        set,
        folderName: folder.name,
        folderIcon: folder.icon,
        cardCount: cards.length,
        masteredCount,
        inProgressCount,
        newCount,
        lastStudied,
      } satisfies RecentSetInfo
    }),
  )

  recentSets.value = results.filter((r): r is RecentSetInfo => r !== null)
}

onMounted(() => Promise.all([loadFolders(), loadRecentSets()]))

function openCreate() {
  editingFolder.value = undefined
  showForm.value = true
}

function openEdit(folder: Folder) {
  editingFolder.value = folder
  showForm.value = true
}

async function openDelete(folder: Folder) {
  deletingSetCount.value = setCounts.value[folder.id] ?? 0
  deletingFolder.value = folder
}

async function handleSave(data: Pick<Folder, 'name' | 'description' | 'color' | 'icon'>) {
  if (editingFolder.value) {
    await updateFolder(editingFolder.value.id, data)
  } else {
    await createFolder(data)
  }
  showForm.value = false
  editingFolder.value = undefined
  await loadFolders()
}

async function handleDelete() {
  if (!deletingFolder.value) return
  await removeFolder(deletingFolder.value.id)
  deletingFolder.value = undefined
  await loadFolders()
}

// --- Folder export/import ---
const importFileInput = ref<HTMLInputElement | null>(null)

async function handleExportFolder(folder: Folder) {
  const sets = await getSetsByFolder(folder.id)
  const setsWithCards = await Promise.all(
    sets.map(async (s) => {
      const cards = await getCardsBySet(s.id)
      return {
        name: s.name,
        description: s.description,
        cards: cards.map((c) => ({ front: c.front, back: c.back, order: c.order })),
      }
    }),
  )
  const data = {
    folder: {
      name: folder.name,
      description: folder.description,
      color: folder.color,
      icon: folder.icon,
    },
    sets: setsWithCards,
    exportedAt: new Date().toISOString(),
  }
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${folder.name.replace(/[^a-zA-Z0-9\u00C0-\u1EF9]/g, '_')}.json`
  a.click()
  URL.revokeObjectURL(url)
}

interface FolderExportData {
  folder: { name?: string; description?: string; color?: string; icon?: string }
  sets?: {
    name?: string
    description?: string
    cards?: { front?: string; back?: string; order?: number }[]
  }[]
}

async function handleImportFolder(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = async () => {
    try {
      const data = JSON.parse(reader.result as string) as FolderExportData
      if (!data.folder?.name) return

      const folder = await createFolder({
        name: data.folder.name,
        description: data.folder.description ?? '',
        color: data.folder.color ?? '#FF6B6B',
        icon: data.folder.icon ?? '📁',
      })

      if (Array.isArray(data.sets)) {
        for (const setData of data.sets) {
          if (!setData.name) continue
          const set = await createSet({
            folderId: folder.id,
            name: setData.name,
            description: setData.description ?? '',
          })
          const validCards = (setData.cards ?? [])
            .filter(
              (c): c is { front: string; back: string; order?: number } =>
                typeof c.front === 'string' &&
                typeof c.back === 'string' &&
                c.front.trim() !== '' &&
                c.back.trim() !== '',
            )
            .map((c) => ({ front: c.front.trim(), back: c.back.trim() }))
          if (validCards.length > 0) {
            await bulkCreateCards(set.id, validCards)
          }
        }
      }

      await Promise.all([loadFolders(), loadRecentSets()])
    } catch {
      // Invalid JSON — silently ignore
    }
    input.value = ''
  }
  reader.readAsText(file)
}
</script>

<template>
  <div class="animate-fade-up animate-delay-1">
    <!-- Recent sets -->
    <div v-if="recentSets.length > 0" class="mb-10">
      <h2 class="font-display text-lg font-semibold text-text-primary flex items-center gap-3 mb-4">
        <span class="text-accent-sky font-display text-sm tracking-widest">//</span>
        Học gần đây
      </h2>
      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="r in recentSets"
          :key="r.set.id"
          class="border border-border-default bg-bg-surface p-4 transition-all duration-300 hover:-translate-y-1 hover:border-accent-sky hover:bg-bg-elevated hover:shadow-lg hover:shadow-accent-sky/5 cursor-pointer group"
          @click="goToEditor(r.set.folderId, r.set.id, r.folderName, r.set.name)"
        >
          <div class="flex items-center justify-between gap-2 mb-2">
            <h3
              class="font-display text-base font-semibold text-text-primary group-hover:text-accent-sky transition-colors truncate"
            >
              {{ r.set.name }}
            </h3>
            <button
              v-if="r.cardCount > 0"
              class="px-2.5 py-1 text-xs border border-accent-sky bg-accent-sky/10 text-accent-sky font-semibold transition hover:bg-accent-sky hover:text-bg-deep shrink-0"
              aria-label="Học bộ thẻ"
              @click.stop="goToStudyConfig(r.set.folderId, r.set.id, r.folderName, r.set.name)"
            >
              Học
            </button>
          </div>
          <p class="text-text-dim text-xs mb-2">{{ r.folderIcon }} {{ r.folderName }}</p>
          <!-- Progress bar -->
          <div class="flex items-center gap-2">
            <div class="flex-1 h-1.5 bg-bg-elevated overflow-hidden flex">
              <div
                class="h-full bg-accent-sky transition-all"
                :style="{
                  width: r.cardCount > 0 ? `${(r.masteredCount / r.cardCount) * 100}%` : '0%',
                }"
              />
              <div
                class="h-full bg-accent-amber transition-all"
                :style="{
                  width: r.cardCount > 0 ? `${(r.inProgressCount / r.cardCount) * 100}%` : '0%',
                }"
              />
              <div
                class="h-full bg-text-dim/30 transition-all"
                :style="{ width: r.cardCount > 0 ? `${(r.newCount / r.cardCount) * 100}%` : '0%' }"
              />
            </div>
            <span class="text-text-dim text-xs font-display whitespace-nowrap">
              {{ r.cardCount > 0 ? Math.round((r.masteredCount / r.cardCount) * 100) : 0 }}%
            </span>
          </div>
          <p class="text-text-dim text-xs mt-2">{{ formatDate(r.lastStudied) }}</p>
        </div>
      </div>
    </div>

    <div class="flex items-center justify-between mb-8">
      <h2 class="font-display text-2xl font-semibold text-text-primary flex items-center gap-3">
        <span class="text-accent-coral font-display text-sm tracking-widest">//</span>
        Thư mục
      </h2>
      <div class="flex items-center gap-2">
        <button
          class="px-3 py-2 text-sm border border-border-default text-text-secondary hover:text-accent-sky hover:border-accent-sky transition"
          @click="importFileInput?.click()"
        >
          Nhập thư mục
        </button>
        <button
          class="inline-flex items-center gap-2 border border-accent-coral bg-accent-coral/10 px-4 py-2 text-sm text-accent-coral font-semibold transition hover:bg-accent-coral hover:text-bg-deep"
          @click="openCreate"
        >
          + Tạo thư mục
        </button>
      </div>
      <input
        ref="importFileInput"
        type="file"
        accept=".json"
        class="hidden"
        @change="handleImportFolder"
      />
    </div>

    <!-- Empty state -->
    <EmptyState
      v-if="folders.length === 0"
      icon="📚"
      title="Chưa có thư mục nào"
      description="Tạo thư mục đầu tiên để bắt đầu học"
      action-label="+ Tạo thư mục"
      @action="openCreate"
    />

    <!-- Folder grid -->
    <div v-else class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      <FolderCard
        v-for="folder in folders"
        :key="folder.id"
        :folder="folder"
        :set-count="setCounts[folder.id] ?? 0"
        @click="goToSets(folder.id, folder.name)"
        @export="handleExportFolder(folder)"
        @edit="openEdit(folder)"
        @delete="openDelete(folder)"
      />
    </div>

    <!-- Create/Edit form -->
    <FolderForm
      v-if="showForm"
      :folder="editingFolder"
      @save="handleSave"
      @cancel="showForm = false"
    />

    <!-- Delete confirmation -->
    <ConfirmDialog
      v-if="deletingFolder"
      title="Xóa thư mục"
      :message="`Bạn có chắc muốn xóa thư mục '${deletingFolder.name}'? Tất cả ${deletingSetCount} bộ thẻ và các thẻ bên trong sẽ bị xóa vĩnh viễn.`"
      confirm-label="Xóa"
      @confirm="handleDelete"
      @cancel="deletingFolder = undefined"
    />
  </div>
</template>
