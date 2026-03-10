<script setup lang="ts">
// Bảng chi tiết các trận H2H
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { useCornerStore } from '../store/useCornerStore'

const store = useCornerStore()
const { h2hForSelection, allTeams } = storeToRefs(store)

// Tìm tên đội từ id
const teamName = (id: string): string => {
  return allTeams.value.find((t) => t.id === id)?.name ?? id
}

// Sắp xếp trận theo ngày mới nhất trước
const sortedMatches = computed(() => {
  if (!h2hForSelection.value) return []
  return [...h2hForSelection.value.h2hTotals].reverse()
})
</script>

<template>
  <section
    class="border border-border-default bg-bg-surface p-4 sm:p-5 transition-all duration-300 hover:-translate-y-1 hover:border-accent-coral hover:bg-bg-elevated hover:shadow-lg hover:shadow-accent-coral/5"
  >
    <h2 class="font-display text-lg font-semibold text-text-primary mb-3 flex items-center gap-2">
      <span class="text-accent-coral font-display text-sm tracking-widest">//</span>
      Lịch sử Đối đầu
    </h2>

    <div v-if="!h2hForSelection" class="text-text-dim text-sm">
      Chọn cặp đội để xem lịch sử đối đầu.
    </div>

    <div v-else class="overflow-x-auto">
      <table class="w-full text-xs">
        <thead>
          <tr
            class="border-b border-border-default text-text-dim text-[10px] font-display tracking-wider uppercase"
          >
            <th class="text-left py-2 pr-2">Ngày</th>
            <th class="text-left py-2 pr-2">Trận đấu</th>
            <th class="text-right py-2">Phạt góc</th>
            <th class="text-right py-2 pl-2">Tổng</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="match in sortedMatches"
            :key="match.date"
            class="border-b border-border-default/50 hover:bg-bg-elevated/50 transition"
          >
            <td class="py-2 pr-2 font-mono text-text-dim whitespace-nowrap">
              {{ match.date }}
            </td>
            <td class="py-2 pr-2 text-text-secondary">
              <span class="text-text-primary">{{ teamName(match.homeId) }}</span>
              <span class="text-text-dim mx-1">vs</span>
              <span class="text-text-primary">{{ teamName(match.awayId) }}</span>
            </td>
            <td class="py-2 text-right font-mono">
              <span class="text-accent-coral">{{ match.homeCorners }}</span>
              <span class="text-text-dim mx-0.5">-</span>
              <span class="text-accent-amber">{{ match.awayCorners }}</span>
            </td>
            <td class="py-2 pl-2 text-right font-mono text-text-primary font-semibold">
              {{ match.homeCorners + match.awayCorners }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
