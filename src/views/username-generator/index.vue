<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useClipboard } from '@vueuse/core'

const username = ref('')

type StyleSet = {
  adj: string[]
  noun: string[]
}

const styles = {
  gaming: {
    adj: ['dark', 'shadow', 'killer', 'ghost', 'crazy'],
    noun: ['ninja', 'dragon', 'hunter', 'sniper'],
  },
  tech: {
    adj: ['cyber', 'quantum', 'pixel', 'neon'],
    noun: ['coder', 'dev', 'engineer', 'node'],
  },
  cute: {
    adj: ['sweet', 'tiny', 'happy', 'pink'],
    noun: ['kitty', 'bunny', 'cookie', 'panda'],
  },
  anime: {
    adj: ['kawaii', 'baka', 'sakura', 'neko'],
    noun: ['chan', 'kun', 'sensei', 'otaku'],
  },
  minimal: {
    adj: ['mono', 'void', 'silent', 'zero'],
    noun: ['user', 'core', 'unit', 'base'],
  },
} satisfies Record<string, StyleSet>

type StyleKey = keyof typeof styles

const style = ref<StyleKey>('gaming')

function generate() {
  const s = styles[style.value]

  const a = s.adj[Math.floor(Math.random() * s.adj.length)]
  const n = s.noun[Math.floor(Math.random() * s.noun.length)]
  const num = Math.floor(Math.random() * 999)

  username.value = `${a}_${n}${num}`
}

const { copy: clipboardCopy } = useClipboard()

async function copy() {
  await clipboardCopy(username.value)
  alert('Đã copy username!')
}
</script>

<template>
  <div
    class="min-h-screen bg-bg-deep text-text-primary font-body flex flex-col items-center justify-center px-4"
  >
    <h1 class="font-display text-4xl sm:text-6xl font-bold text-accent-coral animate-fade-up">
      Tạo Username ngẫu nhiên
    </h1>

    <p
      class="mt-4 text-text-secondary text-lg text-center max-w-md animate-fade-up animate-delay-2"
    >
      Tạo username độc đáo cho game, mạng xã hội hoặc lập trình.
    </p>

    <div
      class="mt-8 w-full max-w-md bg-bg-surface border border-border-default p-6 space-y-4 animate-fade-up animate-delay-3"
    >
      <select v-model="style" class="w-full p-2 bg-bg-deep border border-border-default">
        <option value="gaming">Gaming</option>
        <option value="tech">Tech</option>
        <option value="cute">Cute</option>
        <option value="anime">Anime</option>
        <option value="minimal">Minimal</option>
      </select>

      <button
        @click="generate"
        class="w-full bg-accent-coral py-2 transition hover:opacity-90 active:scale-95"
      >
        Tạo username
      </button>

      <div
        v-if="username"
        class="border border-border-default bg-bg-deep p-3 text-center text-lg font-mono animate-fade-up"
      >
        {{ username }}
      </div>

      <button
        v-if="username"
        @click="copy"
        class="w-full border border-border-default py-2 hover:border-accent-coral"
      >
        Copy username
      </button>
    </div>

    <RouterLink
      to="/"
      class="mt-8 inline-flex items-center gap-2 border border-border-default bg-bg-surface px-5 py-2.5 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary animate-fade-up animate-delay-3"
    >
      ← Về trang chủ
    </RouterLink>
  </div>
</template>
