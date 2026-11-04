<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { Icon } from '@iconify/vue'
import { useClipboard } from '@vueuse/core'
import { readNumber } from './read-number'

const input = ref('1001000')
const withCurrency = ref(true)
const { copy, copied } = useClipboard()

const samples = ['15', '101', '1001', '1001000', '2100000000']

const result = computed(() => {
  try {
    return { text: readNumber(input.value, withCurrency.value), error: '' }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Không đọc được số này'
    return { text: '', error: message }
  }
})

function readSample(sample: string) {
  input.value = sample
}
</script>

<template>
  <main class="mx-auto min-h-screen max-w-xl bg-bg-deep px-4 py-8 text-text-primary">
    <RouterLink to="/" class="inline-flex items-center gap-1 text-sm text-accent-sky">
      <Icon icon="lucide:arrow-left" class="size-4" />
      Trang chủ
    </RouterLink>

    <h1 class="mt-4 font-display text-4xl text-accent-coral">Đọc số</h1>
    <p class="mt-2 text-text-secondary">
      Đọc số nguyên thành chữ trên giấy tờ: đủ “trăm”, “linh”, “mốt”, “tư” và “lăm”.
    </p>

    <label class="mt-6 block text-sm text-text-secondary" for="so">Số cần đọc</label>
    <input
      id="so"
      v-model="input"
      inputmode="numeric"
      autocomplete="off"
      class="mt-2 w-full rounded-lg border border-border-default bg-bg-surface px-3 py-3 font-display text-2xl outline-none focus:border-accent-coral"
      placeholder="1.001.000"
    />

    <label class="mt-4 flex items-center gap-2 text-sm text-text-secondary">
      <input v-model="withCurrency" type="checkbox" class="accent-accent-coral" />
      Thêm chữ “đồng”
    </label>

    <div class="mt-4 flex flex-wrap gap-2">
      <button
        v-for="sample in samples"
        :key="sample"
        type="button"
        class="rounded-full border border-border-default px-3 py-1 text-sm text-text-secondary hover:border-accent-amber hover:text-accent-amber"
        @click="readSample(sample)"
      >
        {{ sample }}
      </button>
    </div>

    <p v-if="result.error" class="mt-6 text-accent-coral">{{ result.error }}</p>
    <section v-else class="mt-6 rounded-xl border border-border-default bg-bg-surface p-4">
      <p class="text-lg leading-relaxed">{{ result.text }}</p>
      <button
        type="button"
        class="mt-4 inline-flex items-center gap-2 rounded-lg bg-accent-coral px-4 py-2 font-semibold text-bg-deep"
        @click="copy(result.text)"
      >
        <Icon :icon="copied ? 'lucide:check' : 'lucide:copy'" class="size-4" />
        {{ copied ? 'Đã chép' : 'Chép' }}
      </button>
    </section>
  </main>
</template>
