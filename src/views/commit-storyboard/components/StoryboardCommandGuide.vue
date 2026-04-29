<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { useClipboard } from '@vueuse/core'
import { ref } from 'vue'

interface CommandPreset {
  command: string
  description: string
  id: string
  title: string
}

const commandPresets: CommandPreset[] = [
  {
    id: 'basic-oneline',
    title: 'Oneline cơ bản (30 commit gần nhất)',
    description: 'Dễ dùng nhất để dán trực tiếp vào Commit Storyboard.',
    command: 'git log --oneline -n 30',
  },
  {
    id: 'pretty-subject',
    title: 'Giữ đúng định dạng hash + subject',
    description: 'Ổn định hơn khi bạn muốn tránh dòng merge dài.',
    command: 'git log --pretty=format:"%h %s" --no-merges -n 50',
  },
  {
    id: 'last-tag',
    title: 'Log từ tag gần nhất đến HEAD',
    description: 'Phù hợp để tạo changelog cho một bản release.',
    command: 'git log $(git describe --tags --abbrev=0)..HEAD --oneline',
  },
  {
    id: 'by-author',
    title: 'Lọc theo tác giả',
    description: 'Dùng để kể story riêng cho một contributor.',
    command: 'git log --author="your-name" --oneline -n 50',
  },
]

const { copy, isSupported } = useClipboard()
const copiedCommandId = ref<string>('')

async function copyCommand(command: CommandPreset) {
  await copy(command.command)
  copiedCommandId.value = command.id
}
</script>

<template>
  <section class="border border-border-default bg-bg-surface p-6 animate-fade-up animate-delay-1">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h2 class="flex items-center gap-3 font-display text-2xl font-semibold text-text-primary">
          <span class="text-sm tracking-widest text-accent-sky">//</span>
          Quick Git Commands
        </h2>
        <p class="mt-2 text-sm text-text-secondary">
          Copy một lệnh bên dưới, chạy trong repo của bạn, rồi dán output vào ô Commit log để tạo storyboard.
        </p>
      </div>
      <p class="border border-border-default px-3 py-1 text-xs text-text-dim">CLI helper</p>
    </div>

    <ul class="mt-5 grid gap-3 lg:grid-cols-2">
      <li
        v-for="preset in commandPresets"
        :key="preset.id"
        class="border border-border-default bg-bg-deep p-4"
      >
        <p class="font-display text-base text-text-primary">{{ preset.title }}</p>
        <p class="mt-1 text-sm text-text-secondary">{{ preset.description }}</p>

        <div class="mt-3 border border-border-default bg-bg-surface px-3 py-2">
          <code class="block overflow-x-auto whitespace-nowrap font-mono text-xs text-accent-amber">
            {{ preset.command }}
          </code>
        </div>

        <button
          type="button"
          class="mt-3 inline-flex items-center gap-2 border border-border-default px-3 py-1.5 text-xs text-text-secondary transition-colors hover:border-accent-coral hover:text-text-primary"
          :disabled="!isSupported"
          @click="copyCommand(preset)"
        >
          <Icon icon="lucide:clipboard" class="size-4" />
          {{ copiedCommandId === preset.id ? 'Đã copy' : 'Copy command' }}
        </button>
      </li>
    </ul>

    <p class="mt-4 text-xs text-text-dim">
      Mẹo: Nếu log quá dài, thêm <span class="font-mono text-text-secondary">-n 30</span> để giới hạn số commit.
    </p>
  </section>
</template>
