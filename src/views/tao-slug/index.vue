<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { Icon } from '@iconify/vue'
import { useClipboard } from '@vueuse/core'
import { toSlug } from './slug'

const input = ref('Xin chào Việt Nam')
const { copy, copied } = useClipboard()
const slug = computed(() => toSlug(input.value))
</script>

<template>
  <main class="mx-auto min-h-screen max-w-xl bg-bg-deep px-4 py-8 text-text-primary">
    <RouterLink to="/" class="inline-flex items-center gap-1 text-sm text-accent-sky">
      <Icon icon="lucide:arrow-left" class="size-4" />
      Trang chủ
    </RouterLink>

    <h1 class="mt-4 font-display text-4xl text-accent-coral">Tạo slug</h1>
    <p class="mt-2 text-text-secondary">
      Bỏ dấu tiếng Việt, đổi “đ” thành “d”, viết thường và nối bằng gạch ngang.
    </p>

    <label class="mt-6 block text-sm text-text-secondary" for="cau">Câu gốc</label>
    <textarea
      id="cau"
      v-model="input"
      rows="4"
      class="mt-2 w-full rounded-lg border border-border-default bg-bg-surface px-3 py-3 outline-none focus:border-accent-coral"
      placeholder="Đường Đỗ, bánh & trà"
    />

    <section class="mt-6 rounded-xl border border-border-default bg-bg-surface p-4">
      <p class="break-all font-display text-2xl text-accent-amber">
        {{ slug || 'Slug trống' }}
      </p>
      <button
        type="button"
        class="mt-4 inline-flex items-center gap-2 rounded-lg bg-accent-coral px-4 py-2 font-semibold text-bg-deep disabled:opacity-40"
        :disabled="!slug"
        @click="copy(slug)"
      >
        <Icon :icon="copied ? 'lucide:check' : 'lucide:copy'" class="size-4" />
        {{ copied ? 'Đã chép' : 'Chép' }}
      </button>
    </section>
  </main>
</template>
