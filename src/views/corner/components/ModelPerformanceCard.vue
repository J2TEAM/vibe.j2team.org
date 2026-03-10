<script setup lang="ts">
// Card hiệu suất mô hình: regression metrics + performance theo ngưỡng
import { Icon } from '@iconify/vue'
import metrics from '../data/model_metrics.json'
</script>

<template>
  <section
    class="border border-border-default bg-bg-surface p-4 sm:p-5 transition-all duration-300 hover:-translate-y-1 hover:border-accent-coral hover:bg-bg-elevated hover:shadow-lg hover:shadow-accent-coral/5"
  >
    <h2 class="font-display text-lg font-semibold text-text-primary mb-3 flex items-center gap-2">
      <span class="text-accent-sky font-display text-sm tracking-widest">//</span>
      Hiệu suất Mô hình
    </h2>

    <!-- Regression summary -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
      <div class="border border-border-default bg-bg-elevated p-2">
        <div class="text-[10px] text-text-dim mb-0.5">RMSE</div>
        <div class="font-mono text-sm text-accent-coral">{{ metrics.regression.rmse }}</div>
      </div>
      <div class="border border-border-default bg-bg-elevated p-2">
        <div class="text-[10px] text-text-dim mb-0.5">MAE</div>
        <div class="font-mono text-sm text-accent-amber">{{ metrics.regression.mae }}</div>
      </div>
      <div class="border border-border-default bg-bg-elevated p-2">
        <div class="text-[10px] text-text-dim mb-0.5">R²</div>
        <div class="font-mono text-sm text-text-secondary">{{ metrics.regression.r2 }}</div>
      </div>
      <div class="border border-border-default bg-bg-elevated p-2">
        <div class="text-[10px] text-text-dim mb-0.5">Tương quan</div>
        <div class="font-mono text-sm text-text-secondary">{{ metrics.regression.corr }}</div>
      </div>
    </div>

    <!-- Bảng performance theo ngưỡng -->
    <div
      class="text-[11px] text-text-dim font-display tracking-widest uppercase mb-2 flex items-center gap-1.5"
    >
      <span class="text-accent-coral">//</span>
      Kiểm thử (Backtest) · {{ metrics.testSeason }} · {{ metrics.testSize }} trận
    </div>

    <div class="overflow-x-auto">
      <table class="w-full text-xs">
        <thead>
          <tr
            class="border-b border-border-default text-text-dim text-[10px] font-display tracking-wider uppercase"
          >
            <th class="text-left py-2 pr-2">T/X</th>
            <th class="text-right py-2 px-1">C.Xác</th>
            <th class="text-right py-2 px-1">Tỷ lệ Thắng</th>
            <th class="text-right py-2 px-1">ROI</th>
            <th class="text-right py-2 pl-1">Lợi nhuận</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="t in metrics.thresholds"
            :key="t.threshold"
            class="border-b border-border-default/50 hover:bg-bg-elevated/50 transition"
          >
            <td class="py-2 pr-2 font-mono text-text-secondary">{{ t.threshold }}</td>
            <td class="py-2 px-1 text-right font-mono">{{ (t.accuracy * 100).toFixed(1) }}%</td>
            <td class="py-2 px-1 text-right font-mono">{{ (t.winRate * 100).toFixed(1) }}%</td>
            <td
              class="py-2 px-1 text-right font-mono font-semibold"
              :class="t.roi >= 0 ? 'text-accent-coral' : 'text-accent-amber'"
            >
              {{ t.roi >= 0 ? '+' : '' }}{{ (t.roi * 100).toFixed(1) }}%
            </td>
            <td
              class="py-2 pl-1 text-right font-mono"
              :class="t.profit >= 0 ? 'text-accent-coral' : 'text-accent-amber'"
            >
              {{ t.profit >= 0 ? '+' : '' }}{{ t.profit.toFixed(1) }}u
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Footer note -->
    <div class="mt-2 text-[10px] text-text-dim flex items-center gap-1">
      <Icon icon="lucide:info" class="size-3" />
      <span>Kết quả backtest trên dữ liệu test, không đảm bảo tương lai</span>
    </div>
  </section>
</template>
