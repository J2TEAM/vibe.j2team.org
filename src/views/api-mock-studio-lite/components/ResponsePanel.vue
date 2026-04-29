<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { computed } from 'vue'

import { useMockStudioContext } from '../composables/useMockStudioContext'

const {
  activeRule,
  simulationResult,
  statusToneClass,
  responseHeadersPreview,
  responseBodyPreview,
  copiedTarget,
  copyResponsePreview,
} = useMockStudioContext()

const activeRuleStatusKeys = computed(() => activeRule.value?.statusMap.map((entry) => entry.key).filter(Boolean) ?? [])
</script>

<template>
  <article class="space-y-4 border border-border-default bg-bg-surface p-5">
    <h2 class="font-display text-xl font-semibold"><span class="mr-2 text-accent-coral">//</span>Mock Response</h2>

    <div class="border border-border-default bg-bg-deep p-3 text-xs text-text-secondary">
      <p>
        Rule đang mở để chỉnh chưa chắc là rule được chạy.
        Engine sẽ duyệt toàn bộ Rulebook từ trên xuống và lấy rule khớp đầu tiên.
      </p>
      <p v-if="activeRule && activeRuleStatusKeys.length" class="mt-1">
        Status keys của rule đang chỉnh: <span class="text-text-primary">{{ activeRuleStatusKeys.join(', ') }}</span>
      </p>
    </div>

    <div
      v-if="simulationResult"
      class="grid gap-2 text-sm md:grid-cols-3"
    >
      <div class="border border-border-default bg-bg-deep px-3 py-2">
        <p class="font-display text-[11px] tracking-wide text-text-dim">Matched Rule</p>
        <p class="mt-1 text-text-primary">{{ simulationResult.matchedRuleName ?? 'none' }}</p>
      </div>
      <div class="border border-border-default bg-bg-deep px-3 py-2">
        <p class="font-display text-[11px] tracking-wide text-text-dim">Latency</p>
        <p class="mt-1 text-text-primary">{{ simulationResult.latencyMs }} ms</p>
      </div>
      <div class="border px-3 py-2" :class="statusToneClass">
        <p class="font-display text-[11px] tracking-wide">Status {{ simulationResult.status }}</p>
        <p class="mt-1 text-xs">Key: {{ simulationResult.statusKey }}</p>
      </div>
    </div>

    <p v-if="simulationResult" class="text-xs text-text-secondary">{{ simulationResult.reason }}</p>

    <div
      v-if="simulationResult && !simulationResult.matchedRuleName"
      class="border border-accent-amber/40 bg-accent-amber/10 px-3 py-2 text-xs text-accent-amber"
    >
      Không match rule nào. Kiểm tra lại Method/Endpoint, bật Rule enabled, hoặc đưa rule cần test lên trên bằng Move up.
    </div>

    <div
      v-if="simulationResult && simulationResult.diagnostics && simulationResult.diagnostics.length > 0"
      class="space-y-2 border border-border-default bg-bg-deep p-3"
    >
      <p class="font-display text-xs tracking-wide text-text-secondary">Match diagnostics</p>
      <p
        v-for="(line, index) in simulationResult.diagnostics"
        :key="`${line}-${index}`"
        class="font-mono text-[11px] text-text-dim"
      >
        {{ line }}
      </p>
    </div>

    <div v-if="simulationResult" class="space-y-3">
      <pre class="overflow-x-auto border border-border-default bg-bg-deep p-3 font-mono text-xs text-text-secondary">{{ responseHeadersPreview }}</pre>
      <pre class="overflow-x-auto border border-border-default bg-bg-deep p-3 font-mono text-xs text-text-primary">{{ responseBodyPreview }}</pre>
      <button
        type="button"
        class="inline-flex items-center gap-2 border border-border-default px-3 py-1.5 text-xs text-text-secondary hover:border-accent-coral hover:text-text-primary"
        @click="copyResponsePreview"
      >
        <Icon icon="lucide:copy" class="size-3.5" />
        {{ copiedTarget === 'response' ? 'Copied' : 'Copy body' }}
      </button>
    </div>
  </article>
</template>
