<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import type { Activity, BudgetItem, TripType } from './types'
import TripCreate from './components/TripCreate.vue'
import TripDetail from './components/TripDetail.vue'
import TripList from './components/TripList.vue'
import { useShare } from './composables/useShare'
import { useTripPlanner } from './composables/useTripPlanner'

const {
  trips,
  currentView,
  currentTrip,
  navigateTo,
  createTrip,
  deleteTrip,
  addMember,
  removeMember,
  addActivity,
  toggleActivity,
  removeActivity,
  addBudgetItem,
  removeBudgetItem,
  totalBudget,
  perPersonBudget,
  addChecklistItem,
  toggleChecklistItem,
  removeChecklistItem,
  importTrip,
} = useTripPlanner()

const { getSharedTrip } = useShare()

onMounted(() => {
  const shared = getSharedTrip()
  if (shared) importTrip(shared)
})

function handleCreate(data: {
  title: string
  description: string
  type: TripType
  date: string
  coverEmoji: string
}) {
  const result = createTrip(data)
  if (!result.ok) alert(result.error)
}

function handleDelete(id: string) {
  if (confirm('Bạn có chắc muốn xóa kế hoạch này?')) deleteTrip(id)
}

function handleAddMember(name: string) {
  if (!currentTrip.value) return
  const result = addMember(currentTrip.value.id, name)
  if (!result.ok) alert(result.error)
}

function handleAddActivity(data: Omit<Activity, 'id' | 'done'>) {
  if (!currentTrip.value) return
  addActivity(currentTrip.value.id, data)
}

function handleAddBudget(data: Omit<BudgetItem, 'id'>) {
  if (!currentTrip.value) return
  addBudgetItem(currentTrip.value.id, data)
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

      <!-- ── Hero ──────────────────────────────────────── -->
      <div class="mb-10 animate-fade-up">
        <h1 class="font-display text-4xl font-bold tracking-tight text-text-primary md:text-5xl">
          Lập Kế Hoạch <span class="text-accent-coral">Đi Chơi</span>
        </h1>
        <p class="mt-3 max-w-2xl text-text-secondary">
          Lên lịch trình, chia chi phí, chuẩn bị checklist — tất cả trong một. Chia sẻ link hoặc
          xuất ảnh gửi cho cả nhóm.
        </p>
      </div>

      <!-- ── Feature highlights (only on list view) ──── -->
      <div
        v-if="currentView === 'list'"
        class="mb-10 grid animate-fade-up animate-delay-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <div
          class="border border-border-default bg-bg-surface p-4 transition hover:-translate-y-0.5 hover:border-accent-coral/50"
        >
          <Icon icon="lucide:calendar-clock" class="mb-2 size-5 text-accent-coral" />
          <p class="font-display text-sm font-semibold text-text-primary">Lịch trình chi tiết</p>
          <p class="mt-1 text-xs text-text-dim">
            Sắp xếp hoạt động theo giờ với timeline trực quan
          </p>
        </div>
        <div
          class="border border-border-default bg-bg-surface p-4 transition hover:-translate-y-0.5 hover:border-accent-amber/50"
        >
          <Icon icon="lucide:wallet" class="mb-2 size-5 text-accent-amber" />
          <p class="font-display text-sm font-semibold text-text-primary">Chia chi phí</p>
          <p class="mt-1 text-xs text-text-dim">
            Ghi nhận chi tiêu, tự động tính chia đều mỗi người
          </p>
        </div>
        <div
          class="border border-border-default bg-bg-surface p-4 transition hover:-translate-y-0.5 hover:border-accent-sky/50"
        >
          <Icon icon="lucide:list-checks" class="mb-2 size-5 text-accent-sky" />
          <p class="font-display text-sm font-semibold text-text-primary">Checklist</p>
          <p class="mt-1 text-xs text-text-dim">Không quên mang gì với danh sách chuẩn bị</p>
        </div>
        <div
          class="border border-border-default bg-bg-surface p-4 transition hover:-translate-y-0.5 hover:border-accent-coral/50"
        >
          <Icon icon="lucide:share-2" class="mb-2 size-5 text-accent-coral" />
          <p class="font-display text-sm font-semibold text-text-primary">Chia sẻ dễ dàng</p>
          <p class="mt-1 text-xs text-text-dim">Xuất ảnh hoặc copy link gửi cho cả nhóm</p>
        </div>
      </div>

      <!-- ── Views ─────────────────────────────────────── -->
      <div class="animate-fade-up animate-delay-2">
        <TripList
          v-if="currentView === 'list'"
          :trips="trips"
          @navigate="navigateTo"
          @delete="handleDelete"
        />

        <TripCreate
          v-else-if="currentView === 'create'"
          @create="handleCreate"
          @cancel="navigateTo('list')"
        />

        <TripDetail
          v-else-if="currentView === 'detail' && currentTrip"
          :trip="currentTrip"
          :total="totalBudget(currentTrip)"
          :per-person="perPersonBudget(currentTrip)"
          @back="navigateTo('list')"
          @add-member="handleAddMember"
          @remove-member="(id) => removeMember(currentTrip!.id, id)"
          @add-activity="handleAddActivity"
          @toggle-activity="(id) => toggleActivity(currentTrip!.id, id)"
          @remove-activity="(id) => removeActivity(currentTrip!.id, id)"
          @add-budget="handleAddBudget"
          @remove-budget="(id) => removeBudgetItem(currentTrip!.id, id)"
          @add-checklist="(text) => addChecklistItem(currentTrip!.id, text)"
          @toggle-checklist="(id) => toggleChecklistItem(currentTrip!.id, id)"
          @remove-checklist="(id) => removeChecklistItem(currentTrip!.id, id)"
        />
      </div>

      <!-- ── Footer signature ────────────────────────── -->
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
