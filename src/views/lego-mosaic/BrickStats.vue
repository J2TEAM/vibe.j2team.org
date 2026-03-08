<template>
  <div class="rounded-xl border border-border-default bg-bg-surface shadow p-4">
    <!-- Header -->
    <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
      <h2 class="text-base font-semibold text-text-primary">🧱 Thống kê gạch</h2>

      <div class="flex items-center gap-3 flex-wrap">
        <span class="text-sm text-text-secondary">
          Tổng số viên gạch:
          <strong class="text-text-primary">{{ totalBricks.toLocaleString('vi-VN') }}</strong>
          &mdash;
          <strong class="text-text-primary">{{ colorCount }}</strong> màu
        </span>

        <button
          class="rounded border border-border-default bg-bg-base px-3 py-1.5 text-xs font-medium text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
          title="Xuất danh sách gạch dưới dạng CSV để mua gạch dễ dàng"
          @click="exportCSV"
        >
          ↓ Xuất CSV
        </button>
      </div>
    </div>

    <!-- Color grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      <div
        v-for="stat in stats"
        :key="stat.color"
        class="flex items-center gap-3 rounded-lg border border-border-default bg-bg-base p-3"
      >
        <!-- Swatch -->
        <div
          class="h-8 w-8 flex-shrink-0 rounded border border-black/10"
          :style="{ background: stat.color }"
        ></div>

        <!-- Info -->
        <div class="min-w-0 flex-1">
          <div class="truncate text-xs text-text-secondary">{{ stat.name }}</div>
          <div class="text-sm font-semibold text-text-primary">
            {{ stat.count.toLocaleString('vi-VN') }} viên
          </div>
          <div class="mt-1 h-1 w-full overflow-hidden rounded-full bg-border-default">
            <div
              class="h-full rounded-full transition-all duration-300"
              :style="{ width: stat.percent + '%', background: stat.color }"
            ></div>
          </div>
          <div class="mt-0.5 text-xs text-text-secondary">{{ stat.percent.toFixed(1) }}%</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface BrickStat {
  color: string
  name: string
  count: number
  percent: number
}

const props = defineProps<{
  stats: BrickStat[]
  totalBricks: number
  colorCount: number
}>()

/** Export brick list as UTF-8 CSV (with BOM for Excel compatibility) */
function exportCSV() {
  const header = 'Màu LEGO,Mã màu RGB,Số viên,Tỷ lệ (%)'
  const rows = props.stats.map((s) => `${s.name},${s.color},${s.count},${s.percent.toFixed(2)}`)
  const csv = [header, ...rows].join('\n')

  // \ufeff = UTF-8 BOM — ensures Vietnamese characters display correctly in Excel
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = 'danh-sach-gach-lego.csv'
  a.click()

  URL.revokeObjectURL(url)
}
</script>
