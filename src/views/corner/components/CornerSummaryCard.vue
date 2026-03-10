<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { storeToRefs } from 'pinia'
import { useCornerStore } from '../store/useCornerStore'

const store = useCornerStore()
const { selectedEntry, summaryForSelected, modelInfo } = storeToRefs(store)
</script>

<template>
  <section
    class="relative border border-border-default bg-bg-surface p-4 sm:p-5 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-accent-coral hover:bg-bg-elevated hover:shadow-lg hover:shadow-accent-coral/5"
  >
    <span
      class="absolute top-3 right-4 font-display text-5xl sm:text-6xl font-bold text-accent-amber/5 select-none pointer-events-none"
    >
      01
    </span>

    <h2 class="font-display text-lg font-semibold text-text-primary mb-3 flex items-center gap-2">
      <span class="text-accent-amber font-display text-sm tracking-widest">//</span>
      Tổng quan trận &amp; mô hình
    </h2>

    <div v-if="!selectedEntry" class="text-text-dim text-sm">
      Chọn một trận ở danh sách bên trái để xem chi tiết dự đoán phạt góc.
    </div>

    <div v-else class="relative space-y-3 text-sm">
      <div class="flex flex-wrap items-center gap-2">
        <div class="font-display text-base sm:text-lg">
          {{ selectedEntry.item.homeTeam }}
          <span class="text-text-dim text-xs sm:text-sm mx-1">vs</span>
          {{ selectedEntry.item.awayTeam }}
        </div>
        <span class="text-text-dim text-xs font-mono">
          {{ selectedEntry.item.date }}
        </span>
        <span
          v-if="selectedEntry.item.isFuture"
          class="inline-flex items-center gap-1 border border-accent-sky/40 bg-accent-sky/10 text-accent-sky text-[10px] font-display tracking-widest px-1.5 py-0.5 uppercase"
        >
          <span class="size-1.5 rounded-full bg-accent-sky" />
          Upcoming
        </span>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div class="border border-border-default bg-bg-elevated p-2.5">
          <div class="text-[11px] text-text-dim mb-0.5">Kèo chính</div>
          <div class="font-display text-sm text-accent-coral">
            {{ selectedEntry.item.prediction }}
          </div>
        </div>
        <div class="border border-border-default bg-bg-elevated p-2.5">
          <div class="text-[11px] text-text-dim mb-0.5">Kỳ vọng góc</div>
          <div class="font-mono text-sm">
            {{ selectedEntry.item.expectedCorners.toFixed(1) }}
          </div>
        </div>
        <div class="border border-border-default bg-bg-elevated p-2.5">
          <div class="text-[11px] text-text-dim mb-0.5">Confidence</div>
          <div
            class="font-display text-sm"
            :class="{
              'text-accent-coral': selectedEntry.item.confidence === 'High',
              'text-accent-amber': selectedEntry.item.confidence === 'Medium',
            }"
          >
            {{ selectedEntry.item.confidence }}
          </div>
        </div>
        <div class="border border-border-default bg-bg-elevated p-2.5">
          <div class="text-[11px] text-text-dim mb-0.5">Edge (kèo chính)</div>
          <div class="font-mono text-sm">{{ (selectedEntry.item.edge * 100).toFixed(1) }}%</div>
        </div>
      </div>

      <div v-if="summaryForSelected" class="grid grid-cols-3 gap-2">
        <div class="border border-border-default bg-bg-elevated p-2.5">
          <div class="text-[11px] text-text-dim mb-0.5">OVER</div>
          <div class="font-display text-lg text-accent-coral">
            {{ summaryForSelected.overCount }}
          </div>
        </div>
        <div class="border border-border-default bg-bg-elevated p-2.5">
          <div class="text-[11px] text-text-dim mb-0.5">UNDER</div>
          <div class="font-display text-lg text-accent-amber">
            {{ summaryForSelected.underCount }}
          </div>
        </div>
        <div class="border border-border-default bg-bg-elevated p-2.5">
          <div class="text-[11px] text-text-dim mb-0.5">NO BET</div>
          <div class="font-display text-lg text-text-secondary">
            {{ summaryForSelected.noBetCount }}
          </div>
        </div>
      </div>

      <div
        v-if="summaryForSelected"
        class="border border-border-default bg-bg-elevated p-3 flex items-center gap-3"
      >
        <Icon
          :icon="
            summaryForSelected.strongest.detail.recommendation === 'OVER'
              ? 'lucide:trending-up'
              : summaryForSelected.strongest.detail.recommendation === 'UNDER'
                ? 'lucide:shield'
                : 'lucide:circle-off'
          "
          class="size-6 text-accent-coral"
        />
        <div class="text-xs sm:text-sm">
          <div class="text-text-secondary">
            <span class="text-text-dim">Ngưỡng nổi bật:</span>
            <span class="ml-1 font-mono"> O/U {{ summaryForSelected.strongest.key }} </span>
          </div>
          <div class="mt-0.5">
            <span class="text-text-dim">Khuyến nghị:</span>
            <span
              class="ml-1 font-display text-xs uppercase tracking-widest"
              :class="{
                'text-accent-coral': summaryForSelected.strongest.detail.recommendation === 'OVER',
                'text-accent-amber': summaryForSelected.strongest.detail.recommendation === 'UNDER',
              }"
            >
              {{ summaryForSelected.strongest.detail.recommendation }}
            </span>
            <span class="ml-2 text-text-dim">
              (edge ~ {{ (summaryForSelected.strongest.detail.edge * 100).toFixed(1) }}%)
            </span>
          </div>
        </div>
      </div>

      <div
        v-if="modelInfo"
        class="pt-2 border-t border-border-default text-[11px] text-text-dim flex flex-wrap gap-x-4 gap-y-1"
      >
        <span class="inline-flex items-center gap-1">
          <Icon icon="lucide:cpu" class="size-3" />
          {{ modelInfo.type }}
        </span>
        <span class="inline-flex items-center gap-1">
          <Icon icon="lucide:layers" class="size-3" />
          {{ modelInfo.features }} features · window {{ modelInfo.window }}
        </span>
        <span class="inline-flex items-center gap-1">
          <Icon icon="lucide:activity" class="size-3" />
          RMSE {{ modelInfo.rmse }}
        </span>
      </div>
    </div>
  </section>
</template>
