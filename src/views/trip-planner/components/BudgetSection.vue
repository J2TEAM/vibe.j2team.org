<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { ref } from 'vue'
import type { BudgetItem, Member } from '../types'

const props = defineProps<{
  budget: BudgetItem[]
  members: Member[]
  total: number
  perPerson: number
}>()

const emit = defineEmits<{
  add: [data: Omit<BudgetItem, 'id'>]
  remove: [id: string]
}>()

const showForm = ref(false)
const label = ref('')
const amount = ref<number>(0)
const paidBy = ref('')

function handleAdd() {
  if (!label.value.trim() || amount.value <= 0) return
  emit('add', {
    label: label.value.trim(),
    amount: amount.value,
    paidBy: paidBy.value,
  })
  label.value = ''
  amount.value = 0
  paidBy.value = ''
  showForm.value = false
}

function formatMoney(n: number): string {
  return n.toLocaleString('vi-VN') + 'đ'
}

function getMemberName(id: string): string {
  return props.members.find((m) => m.id === id)?.name ?? ''
}
</script>

<template>
  <div>
    <div class="mb-4 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <span class="font-display text-sm tracking-widest text-accent-coral">//</span>
        <h3 class="font-display text-lg font-semibold text-text-primary">Chi phí</h3>
      </div>
      <button
        class="inline-flex items-center gap-1.5 text-xs text-accent-sky transition hover:text-accent-sky/80"
        @click="showForm = !showForm"
      >
        <Icon :icon="showForm ? 'lucide:x' : 'lucide:plus'" class="size-3.5" />
        {{ showForm ? 'Đóng' : 'Thêm chi phí' }}
      </button>
    </div>

    <!-- Summary cards -->
    <div class="mb-4 grid grid-cols-2 gap-3">
      <div class="border border-border-default bg-bg-surface p-3 text-center">
        <p class="text-xs text-text-dim">Tổng chi phí</p>
        <p class="mt-1 font-display text-xl font-bold text-accent-coral">
          {{ formatMoney(total) }}
        </p>
      </div>
      <div class="border border-border-default bg-bg-surface p-3 text-center">
        <p class="text-xs text-text-dim">Mỗi người</p>
        <p class="mt-1 font-display text-xl font-bold text-accent-amber">
          {{ formatMoney(perPerson) }}
        </p>
      </div>
    </div>

    <!-- Add form -->
    <div v-if="showForm" class="mb-4 space-y-3 border border-border-default bg-bg-surface p-4">
      <div class="flex gap-3">
        <div class="flex-1">
          <label class="mb-1 block text-xs text-text-dim">Khoản chi *</label>
          <input
            v-model="label"
            type="text"
            placeholder="VD: Vé máy bay, Khách sạn..."
            class="w-full border border-border-default bg-bg-deep px-3 py-2 text-sm text-text-primary placeholder-text-dim outline-none focus:border-accent-coral"
          />
        </div>
        <div class="w-32">
          <label class="mb-1 block text-xs text-text-dim">Số tiền *</label>
          <input
            v-model.number="amount"
            type="number"
            min="0"
            placeholder="0"
            class="w-full border border-border-default bg-bg-deep px-3 py-2 text-sm text-text-primary outline-none focus:border-accent-coral"
          />
        </div>
      </div>

      <div v-if="members.length > 0">
        <label class="mb-1 block text-xs text-text-dim">Người trả</label>
        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="m in members"
            :key="m.id"
            type="button"
            :class="[
              'inline-flex items-center gap-1 border px-3 py-1.5 text-xs transition',
              paidBy === m.id
                ? 'border-accent-coral bg-accent-coral/10 text-accent-coral'
                : 'border-border-default text-text-dim hover:bg-bg-elevated',
            ]"
            @click="paidBy = paidBy === m.id ? '' : m.id"
          >
            {{ m.avatar }} {{ m.name }}
          </button>
        </div>
      </div>

      <button
        class="inline-flex items-center gap-2 border border-accent-coral bg-accent-coral/10 px-4 py-2 text-xs font-semibold text-accent-coral transition hover:bg-accent-coral/20"
        @click="handleAdd"
      >
        <Icon icon="lucide:plus" class="size-3.5" />
        Thêm chi phí
      </button>
    </div>

    <!-- Budget list -->
    <div v-if="budget.length === 0 && !showForm" class="py-4 text-center text-sm text-text-dim">
      Chưa có khoản chi nào
    </div>

    <div v-else class="space-y-1">
      <div
        v-for="item in budget"
        :key="item.id"
        class="group flex items-center justify-between gap-3 border border-border-default bg-bg-surface px-4 py-2.5 transition hover:bg-bg-elevated"
      >
        <div class="min-w-0 flex-1">
          <span class="text-sm text-text-primary">{{ item.label }}</span>
          <span v-if="item.paidBy && getMemberName(item.paidBy)" class="ml-2 text-xs text-text-dim">
            — {{ getMemberName(item.paidBy) }} trả
          </span>
        </div>
        <div class="flex items-center gap-2">
          <span class="font-display text-sm font-semibold text-accent-amber">{{
            formatMoney(item.amount)
          }}</span>
          <button
            class="p-1 text-text-dim opacity-0 transition hover:text-accent-coral group-hover:opacity-100"
            @click="emit('remove', item.id)"
          >
            <Icon icon="lucide:x" class="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
