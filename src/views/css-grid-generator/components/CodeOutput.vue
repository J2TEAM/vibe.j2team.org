<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { useClipboard } from '@vueuse/core'

defineProps<{
  html: string
  css: string
}>()

const { copy: copyHtml, copied: htmlCopied } = useClipboard()
const { copy: copyCss, copied: cssCopied } = useClipboard()
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <!-- HTML Output -->
    <div class="border border-border-default bg-bg-surface p-4">
      <div class="flex items-center justify-between mb-3">
        <h2
          class="font-display text-sm font-semibold tracking-widest text-text-secondary uppercase flex items-center gap-2"
        >
          <Icon icon="lucide:code" class="size-4 text-accent-sky" />
          HTML
        </h2>
        <button
          class="border border-border-default bg-bg-elevated px-3 py-1.5 text-xs font-display tracking-wide transition-all duration-200 flex items-center gap-1.5"
          :class="
            htmlCopied
              ? 'border-green-500/50 text-green-400'
              : 'text-text-dim hover:border-accent-sky hover:text-accent-sky'
          "
          @click="copyHtml(html)"
        >
          <Icon :icon="htmlCopied ? 'lucide:check' : 'lucide:copy'" class="size-3" />
          {{ htmlCopied ? 'Đã copy!' : 'Copy' }}
        </button>
      </div>
      <pre
        class="bg-bg-deep border border-border-default p-3 text-xs font-mono text-text-secondary overflow-x-auto whitespace-pre leading-relaxed max-h-[300px] overflow-y-auto"
      ><code>{{ html }}</code></pre>
    </div>

    <!-- CSS Output -->
    <div class="border border-border-default bg-bg-surface p-4">
      <div class="flex items-center justify-between mb-3">
        <h2
          class="font-display text-sm font-semibold tracking-widest text-text-secondary uppercase flex items-center gap-2"
        >
          <Icon icon="lucide:paintbrush" class="size-4 text-accent-coral" />
          CSS
        </h2>
        <button
          class="border border-border-default bg-bg-elevated px-3 py-1.5 text-xs font-display tracking-wide transition-all duration-200 flex items-center gap-1.5"
          :class="
            cssCopied
              ? 'border-green-500/50 text-green-400'
              : 'text-text-dim hover:border-accent-coral hover:text-accent-coral'
          "
          @click="copyCss(css)"
        >
          <Icon :icon="cssCopied ? 'lucide:check' : 'lucide:copy'" class="size-3" />
          {{ cssCopied ? 'Đã copy!' : 'Copy' }}
        </button>
      </div>
      <pre
        class="bg-bg-deep border border-border-default p-3 text-xs font-mono text-text-secondary overflow-x-auto whitespace-pre leading-relaxed max-h-[300px] overflow-y-auto"
      ><code>{{ css }}</code></pre>
    </div>
  </div>
</template>
