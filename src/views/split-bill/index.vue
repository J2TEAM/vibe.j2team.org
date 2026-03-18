<script setup lang="ts">
import { ref, computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useLocalStorage } from '@vueuse/core'
import { Icon } from '@iconify/vue'
import { toPng } from 'html-to-image'

// ── Types ─────────────────────────────────────────────────────────

interface Expense {
  id: string
  name: string
  amount: number
  payerId: string
  participantIds: string[]
}

interface Settlement {
  from: string
  to: string
  amount: number
}

// ── Persistent State ───────────────────────────────────────────────

const tripTitle = useLocalStorage('split-bill:title', 'Buổi đi chơi')
const members = useLocalStorage<string[]>('split-bill:members', [])
const expenses = useLocalStorage<Expense[]>('split-bill:expenses', [])
const bankName = useLocalStorage('split-bill:bank-name', '')
const bankAccount = useLocalStorage('split-bill:bank-account', '')
const bankQrDataUrl = useLocalStorage<string | null>('split-bill:bank-qr', null)

// ── Member Management ──────────────────────────────────────────────

const newMemberName = ref('')

function addMember() {
  const name = newMemberName.value.trim()
  if (!name || members.value.includes(name)) return
  members.value = [...members.value, name]
  newMemberName.value = ''
}

function removeMember(name: string) {
  members.value = members.value.filter((m) => m !== name)
  expenseParticipants.value = expenseParticipants.value.filter((p) => p !== name)
  if (expensePayerId.value === name) {
    expensePayerId.value = members.value[0] ?? ''
  }
  expenses.value = expenses.value
    .filter((e) => e.payerId !== name)
    .map((e) => ({ ...e, participantIds: e.participantIds.filter((p) => p !== name) }))
    .filter((e) => e.participantIds.length > 0)
}

// ── Expense Form ───────────────────────────────────────────────────

const showExpenseForm = ref(false)
const expenseName = ref('')
const expenseAmount = ref('')
const expensePayerId = ref('')
const expenseParticipants = ref<string[]>([])

function openExpenseForm() {
  expenseName.value = ''
  expenseAmount.value = ''
  expensePayerId.value = members.value[0] ?? ''
  expenseParticipants.value = [...members.value]
  showExpenseForm.value = true
}

function toggleParticipant(name: string) {
  if (expenseParticipants.value.includes(name)) {
    expenseParticipants.value = expenseParticipants.value.filter((p) => p !== name)
  } else {
    expenseParticipants.value = [...expenseParticipants.value, name]
  }
}

const canSaveExpense = computed(
  () =>
    expenseName.value.trim() !== '' &&
    expenseAmount.value !== '' &&
    parseFloat(expenseAmount.value) > 0 &&
    expensePayerId.value !== '' &&
    expenseParticipants.value.length > 0,
)

function saveExpense() {
  if (!canSaveExpense.value) return
  const amount = parseFloat(expenseAmount.value)
  expenses.value = [
    ...expenses.value,
    {
      id: Date.now().toString(),
      name: expenseName.value.trim(),
      amount,
      payerId: expensePayerId.value,
      participantIds: [...expenseParticipants.value],
    },
  ]
  showExpenseForm.value = false
}

function removeExpense(id: string) {
  expenses.value = expenses.value.filter((e) => e.id !== id)
}

// ── Calculations ───────────────────────────────────────────────────

const totalExpense = computed(() => expenses.value.reduce((sum, e) => sum + e.amount, 0))

const memberStats = computed(() =>
  members.value.map((member) => {
    const paid = expenses.value
      .filter((e) => e.payerId === member)
      .reduce((sum, e) => sum + e.amount, 0)
    const owed = expenses.value
      .filter((e) => e.participantIds.includes(member))
      .reduce((sum, e) => sum + e.amount / e.participantIds.length, 0)
    return { name: member, paid, owed, balance: paid - owed }
  }),
)

const settlements = computed<Settlement[]>(() => {
  if (members.value.length === 0 || expenses.value.length === 0) return []

  const balances: Record<string, number> = {}
  members.value.forEach((m) => (balances[m] = 0))

  expenses.value.forEach((e) => {
    const share = e.amount / e.participantIds.length
    balances[e.payerId] = (balances[e.payerId] ?? 0) + e.amount
    e.participantIds.forEach((p) => {
      balances[p] = (balances[p] ?? 0) - share
    })
  })

  const creditors = Object.entries(balances)
    .filter(([, v]) => v > 0.01)
    .map(([id, amount]) => ({ id, amount }))
    .sort((a, b) => b.amount - a.amount)
  const debtors = Object.entries(balances)
    .filter(([, v]) => v < -0.01)
    .map(([id, amount]) => ({ id, amount: -amount }))
    .sort((a, b) => b.amount - a.amount)

  const result: Settlement[] = []
  let ci = 0
  let di = 0
  while (ci < creditors.length && di < debtors.length) {
    const c = creditors[ci]!
    const d = debtors[di]!
    const amount = Math.min(c.amount, d.amount)
    result.push({ from: d.id, to: c.id, amount: Math.round(amount) })
    c.amount -= amount
    d.amount -= amount
    if (c.amount < 0.01) ci++
    if (d.amount < 0.01) di++
  }

  return result
})

// ── QR Upload ──────────────────────────────────────────────────────

function handleQrUpload(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (e) => {
    bankQrDataUrl.value = e.target?.result as string
  }
  reader.readAsDataURL(file)
}

function removeQr() {
  bankQrDataUrl.value = null
}

// ── Export ─────────────────────────────────────────────────────────

const exportRef = ref<HTMLElement | null>(null)
const exporting = ref(false)

async function exportImage() {
  if (!exportRef.value) return
  exporting.value = true
  try {
    const dataUrl = await toPng(exportRef.value, { cacheBust: true, pixelRatio: 2 })
    const link = document.createElement('a')
    const dateStr = new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')
    link.download = `${tripTitle.value || 'chia-tien'}-${dateStr}.png`
    link.href = dataUrl
    link.click()
  } finally {
    exporting.value = false
  }
}

// ── Reset ──────────────────────────────────────────────────────────

const showResetConfirm = ref(false)

function confirmReset() {
  tripTitle.value = 'Buổi đi chơi'
  members.value = []
  expenses.value = []
  bankName.value = ''
  bankAccount.value = ''
  bankQrDataUrl.value = null
  showExpenseForm.value = false
  showResetConfirm.value = false
}

// ── Helpers ────────────────────────────────────────────────────────

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('vi-VN').format(Math.round(amount)) + '₫'
}

const today = new Date().toLocaleDateString('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})
</script>

<template>
  <div class="min-h-screen bg-bg-deep font-body text-text-primary">
    <!-- ── Header ───────────────────────────────────────────────── -->
    <div class="border-b border-border-default">
      <div class="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <RouterLink
          to="/"
          class="flex items-center gap-1.5 border border-border-default bg-bg-surface px-3 py-1.5 text-sm text-text-secondary transition-all hover:border-accent-coral hover:text-accent-coral"
        >
          <Icon icon="lucide:arrow-left" class="size-3.5" />
          <span>Trang chủ</span>
        </RouterLink>
        <h1 class="font-display text-lg font-black tracking-wider text-accent-coral">
          // CHIA TIỀN NHÓM
        </h1>
        <button
          title="Xoá toàn bộ"
          @click="showResetConfirm = true"
          class="text-text-dim transition-colors hover:text-accent-coral"
        >
          <Icon icon="lucide:rotate-ccw" class="size-4" />
        </button>
      </div>
    </div>

    <div class="mx-auto max-w-6xl px-4 py-6">
      <!-- ── Description & guide ──────────────────────────────── -->
      <div class="mb-8 animate-fade-up">
        <p class="mb-5 max-w-2xl text-sm leading-relaxed text-text-secondary">
          Chia tiền sau mỗi chuyến đi chơi thật dễ dàng — nhập thành viên, ghi lại từng khoản chi,
          ứng dụng sẽ tự tính ai nợ ai và tối ưu số giao dịch ít nhất. Xuất kết quả thành ảnh PNG để
          chia sẻ nhóm chat ngay.
        </p>
        <div class="flex flex-wrap gap-3">
          <div class="flex items-center gap-2 border border-border-default bg-bg-surface px-3 py-2">
            <span
              class="flex size-5 shrink-0 items-center justify-center border border-accent-coral font-display text-xs font-black text-accent-coral"
              >1</span
            >
            <span class="text-xs text-text-secondary"
              >Thêm <span class="font-semibold text-text-primary">thành viên</span> tham gia</span
            >
          </div>
          <div class="flex items-center gap-2 border border-border-default bg-bg-surface px-3 py-2">
            <span
              class="flex size-5 shrink-0 items-center justify-center border border-accent-amber font-display text-xs font-black text-accent-amber"
              >2</span
            >
            <span class="text-xs text-text-secondary"
              >Ghi lại từng <span class="font-semibold text-text-primary">khoản chi</span></span
            >
          </div>
          <div class="flex items-center gap-2 border border-border-default bg-bg-surface px-3 py-2">
            <span
              class="flex size-5 shrink-0 items-center justify-center border border-accent-sky font-display text-xs font-black text-accent-sky"
              >3</span
            >
            <span class="text-xs text-text-secondary"
              >Xem <span class="font-semibold text-text-primary">kết quả</span> &amp; tải ảnh
              PNG</span
            >
          </div>
        </div>
      </div>

      <!-- ── Trip title ────────────────────────────────────────── -->
      <div class="mb-6 animate-fade-up">
        <input
          v-model="tripTitle"
          placeholder="Tên buổi đi chơi..."
          class="w-full border-b-2 border-accent-coral/40 bg-transparent pb-2 font-display text-2xl font-black text-text-primary outline-none placeholder:text-text-dim focus:border-accent-coral sm:text-3xl"
        />
      </div>

      <!-- ── Two-column layout ─────────────────────────────────── -->
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
        <!-- Left column -->
        <div class="space-y-5">
          <!-- Members section -->
          <div
            class="animate-fade-up animate-delay-1 border border-border-default bg-bg-surface p-4"
          >
            <div class="mb-3 flex items-center gap-2">
              <span class="font-display text-xs font-black tracking-widest text-accent-coral"
                >//</span
              >
              <span
                class="font-display text-sm font-bold uppercase tracking-wider text-text-primary"
                >Thành viên</span
              >
              <span class="ml-auto text-xs text-text-dim">{{ members.length }} người</span>
            </div>

            <!-- Member chips -->
            <div class="mb-3 flex min-h-10 flex-wrap gap-2">
              <div
                v-for="member in members"
                :key="member"
                class="flex items-center gap-1.5 border border-border-default bg-bg-elevated px-3 py-1.5 text-sm text-text-primary"
              >
                <Icon icon="lucide:user" class="size-3 text-accent-sky" />
                <span>{{ member }}</span>
                <button
                  @click="removeMember(member)"
                  class="ml-1 text-text-dim transition-colors hover:text-accent-coral"
                >
                  <Icon icon="lucide:x" class="size-3" />
                </button>
              </div>
              <p v-if="members.length === 0" class="text-sm text-text-dim">
                Chưa có thành viên nào...
              </p>
            </div>

            <!-- Add member input -->
            <div class="flex gap-2">
              <input
                v-model="newMemberName"
                placeholder="Thêm thành viên..."
                @keydown.enter.prevent="addMember"
                class="flex-1 border border-border-default bg-bg-deep px-3 py-2 text-sm text-text-primary outline-none placeholder:text-text-dim focus:border-accent-coral"
              />
              <button
                :disabled="!newMemberName.trim()"
                @click="addMember"
                class="border border-accent-coral bg-accent-coral/10 px-4 py-2 text-accent-coral transition-all hover:bg-accent-coral hover:text-bg-deep disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Icon icon="lucide:user-plus" class="size-4" />
              </button>
            </div>
          </div>

          <!-- Expenses section -->
          <div
            class="animate-fade-up animate-delay-2 border border-border-default bg-bg-surface p-4"
          >
            <div class="mb-3 flex items-center gap-2">
              <span class="font-display text-xs font-black tracking-widest text-accent-coral"
                >//</span
              >
              <span
                class="font-display text-sm font-bold uppercase tracking-wider text-text-primary"
                >Chi tiêu</span
              >
              <span class="ml-auto text-xs text-text-dim"
                >{{ expenses.length }} khoản • {{ formatMoney(totalExpense) }}</span
              >
            </div>

            <!-- Expense list -->
            <div class="mb-4 space-y-2">
              <div
                v-for="expense in expenses"
                :key="expense.id"
                class="flex items-start gap-3 border border-border-default bg-bg-deep p-3 transition-all hover:border-border-default/80"
              >
                <div class="min-w-0 flex-1">
                  <div class="flex flex-wrap items-center gap-2">
                    <span class="text-sm font-semibold text-text-primary">{{ expense.name }}</span>
                    <span class="font-display text-sm font-black text-accent-amber">{{
                      formatMoney(expense.amount)
                    }}</span>
                  </div>
                  <div class="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-text-dim">
                    <Icon icon="lucide:credit-card" class="size-3 text-accent-sky" />
                    <span class="font-medium text-text-secondary">{{ expense.payerId }}</span>
                    <span>→</span>
                    <span>{{ expense.participantIds.join(', ') }}</span>
                  </div>
                </div>
                <button
                  @click="removeExpense(expense.id)"
                  class="shrink-0 text-text-dim transition-colors hover:text-accent-coral"
                >
                  <Icon icon="lucide:trash-2" class="size-4" />
                </button>
              </div>
              <p v-if="expenses.length === 0" class="py-4 text-center text-sm text-text-dim">
                Chưa có khoản chi nào...
              </p>
            </div>

            <!-- Add expense button -->
            <button
              v-if="!showExpenseForm"
              :disabled="members.length < 1"
              @click="openExpenseForm"
              class="flex w-full items-center justify-center gap-2 border border-dashed border-border-default py-3 text-sm text-text-dim transition-all hover:border-accent-coral hover:text-accent-coral disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Icon icon="lucide:plus-circle" class="size-4" />
              Thêm khoản chi
            </button>

            <!-- Inline expense form -->
            <div v-else class="space-y-3 border border-accent-coral/40 bg-bg-deep p-4">
              <div class="mb-1 flex items-center justify-between">
                <span class="text-sm font-bold text-accent-coral">Khoản chi mới</span>
                <button
                  @click="showExpenseForm = false"
                  class="text-text-dim transition-colors hover:text-text-primary"
                >
                  <Icon icon="lucide:x" class="size-4" />
                </button>
              </div>

              <!-- Name + amount -->
              <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <input
                  v-model="expenseName"
                  placeholder="Tên khoản chi (Pizza...)"
                  class="border border-border-default bg-bg-surface px-3 py-2 text-sm text-text-primary outline-none placeholder:text-text-dim focus:border-accent-coral"
                />
                <input
                  v-model="expenseAmount"
                  type="number"
                  min="0"
                  step="1000"
                  placeholder="Số tiền (VND)"
                  class="border border-border-default bg-bg-surface px-3 py-2 text-sm text-text-primary outline-none placeholder:text-text-dim focus:border-accent-coral"
                />
              </div>

              <!-- Payer -->
              <div>
                <label class="mb-1 block text-xs text-text-dim">Người trả tiền</label>
                <select
                  v-model="expensePayerId"
                  class="w-full border border-border-default bg-bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-accent-coral"
                >
                  <option v-for="m in members" :key="m" :value="m">{{ m }}</option>
                </select>
              </div>

              <!-- Participants -->
              <div>
                <label class="mb-2 block text-xs text-text-dim">Những ai tham gia khoản này?</label>
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="m in members"
                    :key="m"
                    @click="toggleParticipant(m)"
                    :class="[
                      'border px-3 py-1.5 text-xs font-semibold transition-all',
                      expenseParticipants.includes(m)
                        ? 'border-accent-coral bg-accent-coral/15 text-accent-coral'
                        : 'border-border-default text-text-dim hover:border-accent-coral/40 hover:text-text-secondary',
                    ]"
                  >
                    {{ m }}
                  </button>
                </div>
              </div>

              <button
                :disabled="!canSaveExpense"
                @click="saveExpense"
                class="w-full border border-accent-coral bg-accent-coral py-2.5 text-sm font-bold text-bg-deep transition-all hover:bg-accent-coral/90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Lưu khoản chi
              </button>
            </div>
          </div>
        </div>

        <!-- Right column: Results + Bank info -->
        <div class="space-y-4 animate-fade-up animate-delay-3">
          <!-- Export result card -->
          <div ref="exportRef" class="border border-border-default bg-bg-surface p-5">
            <!-- Card header -->
            <div class="mb-4 border-b border-border-default pb-4">
              <div class="flex items-start justify-between gap-2">
                <div>
                  <h2 class="font-display text-lg font-black leading-tight text-accent-coral">
                    {{ tripTitle || 'Buổi đi chơi' }}
                  </h2>
                  <p class="mt-0.5 text-xs text-text-dim">{{ today }}</p>
                </div>
                <Icon icon="lucide:receipt" class="mt-0.5 size-5 shrink-0 text-accent-sky" />
              </div>
            </div>

            <!-- Expense summary table -->
            <div class="mb-5">
              <div class="mb-2 flex items-center gap-1.5">
                <span class="font-display text-xs font-black tracking-widest text-accent-amber"
                  >//</span
                >
                <span class="text-xs font-bold uppercase tracking-wider text-text-secondary"
                  >Tóm tắt chi tiêu</span
                >
              </div>
              <div v-if="expenses.length > 0" class="space-y-1">
                <div
                  v-for="expense in expenses"
                  :key="expense.id"
                  class="flex items-start justify-between gap-2 text-xs"
                >
                  <div class="flex min-w-0 items-baseline gap-1.5">
                    <span class="shrink-0 text-text-dim">•</span>
                    <span class="text-text-primary">{{ expense.name }}</span>
                    <span class="shrink-0 text-text-dim">({{ expense.payerId }})</span>
                  </div>
                  <span class="shrink-0 font-bold text-accent-amber">{{
                    formatMoney(expense.amount)
                  }}</span>
                </div>
                <div
                  class="mt-2 flex items-center justify-between border-t border-border-default pt-2 text-xs"
                >
                  <span class="font-bold text-text-secondary">Tổng cộng</span>
                  <span class="font-display font-black text-accent-coral">{{
                    formatMoney(totalExpense)
                  }}</span>
                </div>
              </div>
              <p v-else class="text-xs text-text-dim">Chưa có khoản chi nào</p>
            </div>

            <!-- Member balances -->
            <div v-if="memberStats.length > 0" class="mb-5">
              <div class="mb-2 flex items-center gap-1.5">
                <span class="font-display text-xs font-black tracking-widest text-accent-sky"
                  >//</span
                >
                <span class="text-xs font-bold uppercase tracking-wider text-text-secondary"
                  >Số dư từng người</span
                >
              </div>
              <div class="space-y-1">
                <div
                  v-for="stat in memberStats"
                  :key="stat.name"
                  class="flex items-center justify-between text-xs"
                >
                  <span class="text-text-primary">{{ stat.name }}</span>
                  <div class="flex items-center gap-3">
                    <span class="text-text-dim">đã trả: {{ formatMoney(stat.paid) }}</span>
                    <span
                      :class="[
                        'w-24 text-right font-bold',
                        stat.balance > 0.5
                          ? 'text-accent-sky'
                          : stat.balance < -0.5
                            ? 'text-accent-coral'
                            : 'text-text-secondary',
                      ]"
                    >
                      {{ stat.balance > 0.5 ? '+' : '' }}{{ formatMoney(stat.balance) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Settlement instructions -->
            <div class="mb-4">
              <div class="mb-2 flex items-center gap-1.5">
                <span class="font-display text-xs font-black tracking-widest text-accent-coral"
                  >//</span
                >
                <span class="text-xs font-bold uppercase tracking-wider text-text-secondary"
                  >Cần chuyển khoản</span
                >
              </div>
              <div v-if="settlements.length > 0" class="space-y-2">
                <div
                  v-for="(s, i) in settlements"
                  :key="i"
                  class="flex items-center gap-2 border border-border-default bg-bg-deep p-2.5 text-xs"
                >
                  <Icon icon="lucide:user" class="size-3 shrink-0 text-accent-coral" />
                  <span class="font-semibold text-text-primary">{{ s.from }}</span>
                  <Icon icon="lucide:arrow-right" class="size-3 shrink-0 text-text-dim" />
                  <Icon icon="lucide:user" class="size-3 shrink-0 text-accent-sky" />
                  <span class="font-semibold text-text-primary">{{ s.to }}</span>
                  <span class="ml-auto font-display font-black text-accent-amber">{{
                    formatMoney(s.amount)
                  }}</span>
                </div>
              </div>
              <p
                v-else-if="expenses.length > 0 && members.length > 0"
                class="flex items-center gap-1.5 text-xs text-accent-sky"
              >
                <Icon icon="lucide:check-circle-2" class="size-3.5" />
                Mọi người đã hoàn toàn hạch toán!
              </p>
              <p v-else class="text-xs text-text-dim">Chưa có dữ liệu</p>
            </div>

            <!-- QR + bank info (shown in export) -->
            <div
              v-if="bankQrDataUrl || bankName || bankAccount"
              class="border-t border-border-default pt-4"
            >
              <div class="flex items-start gap-4">
                <img
                  v-if="bankQrDataUrl"
                  :src="bankQrDataUrl"
                  alt="QR ngân hàng"
                  class="size-24 shrink-0 border border-border-default bg-white object-contain"
                />
                <div class="flex-1 space-y-1 text-xs">
                  <p class="text-text-dim">Thông tin chuyển khoản:</p>
                  <p v-if="bankName" class="font-bold text-text-primary">{{ bankName }}</p>
                  <p v-if="bankAccount" class="font-display font-black text-accent-amber">
                    {{ bankAccount }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Bank info inputs -->
          <div class="border border-border-default bg-bg-surface p-4">
            <div class="mb-3 flex items-center gap-2">
              <span class="font-display text-xs font-black tracking-widest text-accent-coral"
                >//</span
              >
              <span
                class="font-display text-sm font-bold uppercase tracking-wider text-text-primary"
                >Ngân hàng</span
              >
            </div>

            <div class="space-y-3">
              <input
                v-model="bankName"
                placeholder="Tên ngân hàng (VD: Vietcombank)"
                class="w-full border border-border-default bg-bg-deep px-3 py-2 text-sm text-text-primary outline-none placeholder:text-text-dim focus:border-accent-coral"
              />
              <input
                v-model="bankAccount"
                placeholder="Số tài khoản"
                class="w-full border border-border-default bg-bg-deep px-3 py-2 text-sm text-text-primary outline-none placeholder:text-text-dim focus:border-accent-coral"
              />

              <!-- QR preview -->
              <div v-if="bankQrDataUrl" class="relative">
                <img
                  :src="bankQrDataUrl"
                  alt="QR preview"
                  class="h-32 w-full border border-border-default bg-white object-contain"
                />
                <button
                  @click="removeQr"
                  class="absolute right-2 top-2 border border-accent-coral/60 bg-bg-deep/90 p-1 text-accent-coral transition-all hover:bg-accent-coral hover:text-bg-deep"
                >
                  <Icon icon="lucide:x" class="size-3" />
                </button>
              </div>

              <!-- QR upload label -->
              <label
                class="flex cursor-pointer items-center justify-center gap-2 border border-dashed border-border-default py-2.5 text-sm text-text-dim transition-all hover:border-accent-coral hover:text-accent-coral"
              >
                <Icon icon="lucide:qr-code" class="size-4" />
                {{ bankQrDataUrl ? 'Đổi ảnh QR' : 'Upload ảnh QR ngân hàng' }}
                <input type="file" accept="image/*" class="hidden" @change="handleQrUpload" />
              </label>
            </div>
          </div>

          <!-- Export PNG button -->
          <button
            :disabled="exporting || expenses.length === 0"
            @click="exportImage"
            class="flex w-full items-center justify-center gap-2 border border-accent-sky bg-accent-sky/10 py-3 font-display font-bold text-accent-sky transition-all hover:bg-accent-sky hover:text-bg-deep disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Icon v-if="exporting" icon="lucide:loader-2" class="size-5 animate-spin" />
            <Icon v-else icon="lucide:download" class="size-5" />
            {{ exporting ? 'Đang xuất...' : 'Tải ảnh PNG kết quả' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ── Footer ───────────────────────────────────────────────── -->
    <div class="mx-auto max-w-6xl px-4 pb-8">
      <footer
        class="flex flex-wrap items-center justify-between gap-2 border-t border-border-default pt-4 text-xs text-text-dim"
      >
        <span>Được tạo bởi <span class="font-semibold text-text-primary">Hachi Tu</span></span>
        <div class="flex gap-3">
          <a
            href="https://github.com/hachitubg"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center gap-1 transition-colors hover:text-accent-coral"
          >
            <Icon icon="lucide:github" class="size-3.5" />
            GitHub
          </a>
          <a
            href="https://www.facebook.com/tuhachiz/"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center gap-1 transition-colors hover:text-accent-coral"
          >
            <Icon icon="lucide:facebook" class="size-3.5" />
            Facebook
          </a>
        </div>
      </footer>
    </div>

    <!-- ── Reset confirm modal ───────────────────────────────────── -->
    <Transition name="fade">
      <div
        v-if="showResetConfirm"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      >
        <div class="w-full max-w-sm border border-accent-coral bg-bg-surface p-6 text-center">
          <Icon icon="lucide:alert-triangle" class="mx-auto mb-3 size-8 text-accent-coral" />
          <h3 class="mb-2 font-display text-lg font-black text-text-primary">
            Xoá toàn bộ dữ liệu?
          </h3>
          <p class="mb-5 text-sm text-text-secondary">Thao tác này không thể hoàn tác.</p>
          <div class="flex gap-3">
            <button
              @click="showResetConfirm = false"
              class="flex-1 border border-border-default py-2 text-sm text-text-secondary transition-all hover:border-text-secondary hover:text-text-primary"
            >
              Huỷ
            </button>
            <button
              @click="confirmReset"
              class="flex-1 border border-accent-coral bg-accent-coral py-2 text-sm font-bold text-bg-deep transition-all hover:bg-accent-coral/90"
            >
              Xác nhận
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
