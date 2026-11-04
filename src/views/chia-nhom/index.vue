<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { Icon } from '@iconify/vue'
import { useClipboard } from '@vueuse/core'
import { dealGroups, parseNames } from './groups'

const rawNames = ref('An\nBình\nChi\nDũng\nEm')
const groupCount = ref(2)
const groups = ref<string[][]>([])
const error = ref('')
const { copy, copied } = useClipboard()

const summary = computed(() => {
  if (groups.value.length === 0) return ''
  return groups.value.map((group, index) => `Nhóm ${index + 1}: ${group.join(', ')}`).join('\n')
})

function divide() {
  const names = parseNames(rawNames.value)
  if (names.length === 0) {
    groups.value = []
    error.value = 'Thêm ít nhất một tên, mỗi tên một dòng.'
    return
  }
  try {
    groups.value = dealGroups(names, groupCount.value)
    error.value = ''
  } catch (caught) {
    groups.value = []
    error.value = caught instanceof Error ? caught.message : 'Không chia được'
  }
}
</script>

<template>
  <main class="mx-auto min-h-screen max-w-xl bg-bg-deep px-4 py-8 text-text-primary">
    <RouterLink to="/" class="inline-flex items-center gap-1 text-sm text-accent-sky">
      <Icon icon="lucide:arrow-left" class="size-4" />
      Trang chủ
    </RouterLink>

    <h1 class="mt-4 font-display text-4xl text-accent-coral">Chia nhóm</h1>
    <p class="mt-2 text-text-secondary">
      Dán danh sách, xáo ngẫu nhiên, rồi chia đều. Các nhóm lệch nhau tối đa một người.
    </p>

    <label class="mt-6 block text-sm text-text-secondary" for="ten">Tên, mỗi người một dòng</label>
    <textarea
      id="ten"
      v-model="rawNames"
      rows="8"
      class="mt-2 w-full rounded-lg border border-border-default bg-bg-surface px-3 py-3 outline-none focus:border-accent-coral"
    />

    <label class="mt-4 block text-sm text-text-secondary" for="so-nhom">Số nhóm</label>
    <input
      id="so-nhom"
      v-model.number="groupCount"
      type="number"
      min="1"
      max="50"
      class="mt-2 w-28 rounded-lg border border-border-default bg-bg-surface px-3 py-2 outline-none focus:border-accent-coral"
    />

    <button
      type="button"
      class="mt-4 inline-flex items-center gap-2 rounded-lg bg-accent-coral px-4 py-2 font-semibold text-bg-deep"
      @click="divide"
    >
      <Icon icon="lucide:shuffle" class="size-4" />
      Xáo và chia
    </button>

    <p v-if="error" class="mt-4 text-accent-coral">{{ error }}</p>

    <div v-if="groups.length > 0" class="mt-6 grid gap-3">
      <section
        v-for="(group, index) in groups"
        :key="index"
        class="rounded-xl border border-border-default bg-bg-surface p-4"
      >
        <h2 class="font-display text-accent-amber">Nhóm {{ index + 1 }}</h2>
        <ul class="mt-2 space-y-1">
          <li v-for="(name, nameIndex) in group" :key="`${index}-${nameIndex}`">{{ name }}</li>
        </ul>
      </section>
      <button
        type="button"
        class="inline-flex w-fit items-center gap-2 rounded-lg border border-border-default px-4 py-2 text-text-secondary hover:border-accent-sky hover:text-accent-sky"
        @click="copy(summary)"
      >
        <Icon :icon="copied ? 'lucide:check' : 'lucide:copy'" class="size-4" />
        {{ copied ? 'Đã chép' : 'Chép kết quả' }}
      </button>
    </div>
  </main>
</template>
