import { useLocalStorage } from '@vueuse/core'
import { computed, ref } from 'vue'
import type { Activity, AppView, BudgetItem, TripPlan, TripType } from '../types'

function uid(): string {
  return Math.random().toString(36).slice(2, 10)
}

export function useTripPlanner() {
  const trips = useLocalStorage<TripPlan[]>('vibe-trip-plans', [])
  const currentView = ref<AppView>('list')
  const currentTripId = ref<string | null>(null)

  const currentTrip = computed(() => trips.value.find((t) => t.id === currentTripId.value) ?? null)

  function navigateTo(view: AppView, tripId?: string) {
    currentView.value = view
    if (tripId) currentTripId.value = tripId
  }

  // ── CRUD ──────────────────────────────────────────────
  function createTrip(data: {
    title: string
    description: string
    type: TripType
    date: string
    coverEmoji: string
  }): { ok: boolean; error?: string } {
    const title = data.title.trim()
    if (!title) return { ok: false, error: 'Tên kế hoạch không được để trống' }
    if (!data.date) return { ok: false, error: 'Vui lòng chọn ngày' }

    const trip: TripPlan = {
      id: uid(),
      title,
      description: data.description.trim(),
      type: data.type,
      date: data.date,
      coverEmoji: data.coverEmoji || '🏖️',
      members: [],
      activities: [],
      budget: [],
      checklist: [],
      createdAt: Date.now(),
    }
    trips.value.unshift(trip)
    navigateTo('detail', trip.id)
    return { ok: true }
  }

  function deleteTrip(id: string) {
    const idx = trips.value.findIndex((t) => t.id === id)
    if (idx !== -1) {
      trips.value.splice(idx, 1)
      if (currentTripId.value === id) navigateTo('list')
    }
  }

  // ── Members ───────────────────────────────────────────
  function addMember(tripId: string, name: string): { ok: boolean; error?: string } {
    const t = trips.value.find((x) => x.id === tripId)
    if (!t) return { ok: false, error: 'Không tìm thấy kế hoạch' }
    const trimmed = name.trim()
    if (!trimmed) return { ok: false, error: 'Tên không được để trống' }
    const dup = t.members.find((m) => m.name.toLowerCase() === trimmed.toLowerCase())
    if (dup) return { ok: false, error: 'Tên đã tồn tại' }

    const avatars = ['🧑', '👩', '👨', '🧒', '👧', '👦', '🐱', '🐶', '🦊', '🐻', '🐼', '🐸']
    t.members.push({
      id: uid(),
      name: trimmed,
      avatar: avatars[t.members.length % avatars.length]!,
    })
    return { ok: true }
  }

  function removeMember(tripId: string, memberId: string) {
    const t = trips.value.find((x) => x.id === tripId)
    if (!t) return
    t.members = t.members.filter((m) => m.id !== memberId)
  }

  // ── Activities ────────────────────────────────────────
  function addActivity(tripId: string, data: Omit<Activity, 'id' | 'done'>): { ok: boolean } {
    const t = trips.value.find((x) => x.id === tripId)
    if (!t) return { ok: false }
    t.activities.push({ ...data, id: uid(), done: false })
    t.activities.sort((a, b) => a.time.localeCompare(b.time))
    return { ok: true }
  }

  function updateActivity(tripId: string, activityId: string, data: Partial<Activity>) {
    const t = trips.value.find((x) => x.id === tripId)
    if (!t) return
    const act = t.activities.find((a) => a.id === activityId)
    if (act) Object.assign(act, data)
    if (data.time !== undefined) {
      t.activities.sort((a, b) => a.time.localeCompare(b.time))
    }
  }

  function removeActivity(tripId: string, activityId: string) {
    const t = trips.value.find((x) => x.id === tripId)
    if (!t) return
    t.activities = t.activities.filter((a) => a.id !== activityId)
  }

  function toggleActivity(tripId: string, activityId: string) {
    const t = trips.value.find((x) => x.id === tripId)
    if (!t) return
    const act = t.activities.find((a) => a.id === activityId)
    if (act) act.done = !act.done
  }

  // ── Budget ────────────────────────────────────────────
  function addBudgetItem(tripId: string, data: Omit<BudgetItem, 'id'>): { ok: boolean } {
    const t = trips.value.find((x) => x.id === tripId)
    if (!t) return { ok: false }
    t.budget.push({ ...data, id: uid() })
    return { ok: true }
  }

  function removeBudgetItem(tripId: string, itemId: string) {
    const t = trips.value.find((x) => x.id === tripId)
    if (!t) return
    t.budget = t.budget.filter((b) => b.id !== itemId)
  }

  function totalBudget(trip: TripPlan): number {
    return trip.budget.reduce((sum, b) => sum + b.amount, 0)
  }

  function perPersonBudget(trip: TripPlan): number {
    const count = Math.max(trip.members.length, 1)
    return Math.ceil(totalBudget(trip) / count)
  }

  // ── Checklist ─────────────────────────────────────────
  function addChecklistItem(tripId: string, text: string): { ok: boolean } {
    const t = trips.value.find((x) => x.id === tripId)
    if (!t) return { ok: false }
    const trimmed = text.trim()
    if (!trimmed) return { ok: false }
    t.checklist.push({ id: uid(), text: trimmed, checked: false })
    return { ok: true }
  }

  function toggleChecklistItem(tripId: string, itemId: string) {
    const t = trips.value.find((x) => x.id === tripId)
    if (!t) return
    const item = t.checklist.find((c) => c.id === itemId)
    if (item) item.checked = !item.checked
  }

  function removeChecklistItem(tripId: string, itemId: string) {
    const t = trips.value.find((x) => x.id === tripId)
    if (!t) return
    t.checklist = t.checklist.filter((c) => c.id !== itemId)
  }

  // ── Import shared ─────────────────────────────────────
  function importTrip(trip: TripPlan) {
    const existing = trips.value.find((t) => t.id === trip.id)
    if (existing) {
      Object.assign(existing, trip)
    } else {
      trips.value.unshift(trip)
    }
    navigateTo('detail', trip.id)
  }

  return {
    trips,
    currentView,
    currentTripId,
    currentTrip,
    navigateTo,
    createTrip,
    deleteTrip,
    addMember,
    removeMember,
    addActivity,
    updateActivity,
    removeActivity,
    toggleActivity,
    addBudgetItem,
    removeBudgetItem,
    totalBudget,
    perPersonBudget,
    addChecklistItem,
    toggleChecklistItem,
    removeChecklistItem,
    importTrip,
  }
}
