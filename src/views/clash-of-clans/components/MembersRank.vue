<script setup lang="ts">
import { computed, ref } from 'vue'
import { Icon } from '@iconify/vue'
import type { ClanMember } from '../types'

const props = defineProps<{
  members: ClanMember[]
}>()

const sortField = ref<
  'rank' | 'name' | 'role' | 'townHall' | 'trophies' | 'donations' | 'activityScore'
>('activityScore')
const sortDirection = ref<'asc' | 'desc'>('desc')

const calculateScore = (m: ClanMember) => {
  const don = m.donations || 0
  const rec = m.donationsReceived || 0
  const trophies = m.trophies || 0
  return don + rec * 0.5 + trophies * 0.2
}

const sortedMembers = computed(() => {
  return [...props.members].sort((a, b) => {
    let valA: number | string = ''
    let valB: number | string = ''

    switch (sortField.value) {
      case 'rank':
        valA = a.clanRank
        valB = b.clanRank
        return sortDirection.value === 'asc' ? (valA > valB ? 1 : -1) : valA < valB ? 1 : -1
      case 'name':
        valA = a.name.toLowerCase()
        valB = b.name.toLowerCase()
        break
      case 'role':
        const roleOrder = { leader: 4, coLeader: 3, admin: 2, member: 1 }
        valA = roleOrder[a.role as keyof typeof roleOrder] || 0
        valB = roleOrder[b.role as keyof typeof roleOrder] || 0
        break
      case 'townHall':
        valA = a.townHallLevel || 0
        valB = b.townHallLevel || 0
        break
      case 'trophies':
        valA = a.trophies || 0
        valB = b.trophies || 0
        break
      case 'donations':
        valA = a.donations || 0
        valB = b.donations || 0
        break
      case 'activityScore':
        valA = calculateScore(a)
        valB = calculateScore(b)
        break
    }

    if (typeof valA === 'string' && typeof valB === 'string') {
      return sortDirection.value === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA)
    }

    return sortDirection.value === 'asc'
      ? (valA as number) - (valB as number)
      : (valB as number) - (valA as number)
  })
})

const handleSort = (field: typeof sortField.value) => {
  if (field === sortField.value) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortField.value = field
    sortDirection.value = 'desc'
  }
}

const getRoleBadgeClass = (role: string) => {
  switch (role) {
    case 'leader':
      return 'bg-red-900/50 text-red-400 border-red-900'
    case 'coLeader':
      return 'bg-bg-muted text-text-secondary border-border-default'
    case 'admin':
      return 'bg-bg-elevated text-text-secondary border-border-default'
    default:
      return 'bg-transparent text-text-muted border-none'
  }
}

const getRoleText = (role: string) => {
  switch (role) {
    case 'leader':
      return 'Thủ lĩnh'
    case 'coLeader':
      return 'Thủ lĩnh phụ'
    case 'admin':
      return 'Trưởng lão'
    default:
      return 'Thành viên'
  }
}
</script>

<template>
  <div class="space-y-4">
    <div
      class="flex flex-col sm:flex-row justify-between items-center bg-bg-surface p-4 rounded-xl border border-border-default shadow-lg"
    >
      <div class="mb-4 sm:mb-0">
        <h2 class="text-xl font-bold text-text-primary flex items-center">
          <Icon icon="lucide:users" class="mr-2 text-accent-amber" /> Bảng xếp hạng thành viên
        </h2>
        <div class="text-xs text-text-muted italic mt-1">
          Điểm cơ bản: Cho + (Nhận ÷ 2) + (Cúp ÷ 5)
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="bg-bg-surface border border-border-default rounded-xl shadow-lg overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-bg-elevated text-text-muted text-sm uppercase tracking-wider">
              <th
                class="p-4 cursor-pointer hover:bg-bg-muted whitespace-nowrap"
                @click="handleSort('rank')"
              >
                #
                <Icon
                  v-if="sortField === 'rank'"
                  icon="lucide:arrow-up-down"
                  class="inline text-accent-amber w-3 h-3"
                />
              </th>
              <th class="p-4 cursor-pointer hover:bg-bg-muted" @click="handleSort('name')">
                Tên
                <Icon
                  v-if="sortField === 'name'"
                  icon="lucide:arrow-up-down"
                  class="inline text-accent-amber w-3 h-3"
                />
              </th>
              <th class="p-4 cursor-pointer hover:bg-bg-muted" @click="handleSort('role')">
                Vai trò
                <Icon
                  v-if="sortField === 'role'"
                  icon="lucide:arrow-up-down"
                  class="inline text-accent-amber w-3 h-3"
                />
              </th>
              <th
                class="p-4 cursor-pointer hover:bg-bg-muted text-center whitespace-nowrap"
                @click="handleSort('townHall')"
              >
                TH
                <Icon
                  v-if="sortField === 'townHall'"
                  icon="lucide:arrow-up-down"
                  class="inline text-accent-amber w-3 h-3"
                />
              </th>
              <th
                class="p-4 cursor-pointer hover:bg-bg-muted text-right whitespace-nowrap"
                @click="handleSort('trophies')"
              >
                Cúp
                <Icon
                  v-if="sortField === 'trophies'"
                  icon="lucide:arrow-up-down"
                  class="inline text-accent-amber w-3 h-3"
                />
              </th>
              <th
                class="p-4 cursor-pointer hover:bg-bg-muted text-right"
                @click="handleSort('donations')"
              >
                Đã đóng góp
                <Icon
                  v-if="sortField === 'donations'"
                  icon="lucide:arrow-up-down"
                  class="inline text-accent-amber w-3 h-3"
                />
              </th>
              <th
                class="p-4 cursor-pointer hover:bg-bg-muted text-right whitespace-nowrap"
                @click="handleSort('activityScore')"
              >
                <div class="flex items-center justify-end">
                  Điểm
                  <Icon
                    v-if="sortField === 'activityScore'"
                    icon="lucide:arrow-up-down"
                    class="inline text-accent-amber w-3 h-3 ml-1"
                  />
                </div>
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-default">
            <tr
              v-for="member in sortedMembers"
              :key="member.tag"
              class="hover:bg-bg-muted/50 transition-colors"
            >
              <td class="p-4 font-mono text-text-muted">#{{ member.clanRank }}</td>
              <td class="p-4">
                <div class="flex items-center">
                  <div
                    class="w-10 h-10 mr-3 flex-shrink-0 flex items-center justify-center relative"
                  >
                    <img
                      :src="`https://www.clash.ninja/images/entities/1_${member.townHallLevel}.png`"
                      :alt="`TH${member.townHallLevel}`"
                      class="w-full h-full object-contain drop-shadow-md"
                      @error="
                        (e) => {
                          ;(e.target as HTMLImageElement).style.display = 'none'
                        }
                      "
                    />
                    <div
                      class="absolute -bottom-1 -right-1 bg-black/80 text-white text-[8px] font-bold px-1 rounded border border-border-default"
                    >
                      {{ member.townHallLevel }}
                    </div>
                  </div>
                  <div>
                    <div class="font-bold text-text-primary text-base">{{ member.name }}</div>
                    <div class="text-[10px] text-text-muted">{{ member.tag }}</div>
                  </div>
                </div>
              </td>
              <td class="p-4">
                <span
                  class="px-2 py-1 text-xs font-bold rounded border"
                  :class="getRoleBadgeClass(member.role)"
                >
                  {{ getRoleText(member.role) }}
                </span>
              </td>
              <td class="p-4 text-center font-mono text-text-primary">
                <span class="text-accent-coral font-bold">TH{{ member.townHallLevel }}</span>
              </td>
              <td class="p-4 text-right font-mono text-text-primary">
                <span class="text-purple-400 font-bold">{{
                  member.trophies.toLocaleString()
                }}</span>
              </td>
              <td class="p-4 text-right">
                <div class="text-green-400 font-mono font-bold">{{ member.donations }}</div>
                <div class="text-xs text-text-muted">Nhận: {{ member.donationsReceived }}</div>
              </td>
              <td class="p-4 text-right">
                <div
                  class="inline-block px-3 py-1 rounded-full font-mono font-bold border bg-bg-elevated border-border-default text-accent-amber"
                >
                  {{ Math.floor(calculateScore(member)).toLocaleString() }}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
