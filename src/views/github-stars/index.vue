<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Icon } from '@iconify/vue'

interface GitHubRepo {
  id: number
  name: string
  full_name: string
  html_url: string
  description: string
  stargazers_count: number
  language: string
  owner: {
    avatar_url: string
    login: string
  }
}

const isLoading = ref(true)
const repos = ref<GitHubRepo[]>([])
const errorMsg = ref('')

function formatStars(count: number): string {
  if (count >= 1000) {
    return (count / 1000).toFixed(1) + 'k'
  }
  return count.toString()
}

// Colors for top languages
function getLanguageColor(lang: string | null): string {
  if (!lang) return 'bg-gray-500'
  const colors: Record<string, string> = {
    JavaScript: 'bg-yellow-400',
    TypeScript: 'bg-blue-500',
    Python: 'bg-blue-600',
    Java: 'bg-green-600',
    'C++': 'bg-pink-600',
    C: 'bg-gray-800',
    'C#': 'bg-purple-600',
    Ruby: 'bg-green-700',
    Go: 'bg-cyan-500',
    Rust: 'bg-orange-500',
    HTML: 'bg-red-500',
    CSS: 'bg-indigo-500',
    Vue: 'bg-emerald-500',
  }
  return colors[lang] || 'bg-gray-400'
}

async function fetchRepos() {
  isLoading.value = true
  errorMsg.value = ''

  try {
    const res = await fetch(
      'https://api.github.com/search/repositories?q=stars:>10000&sort=stars&order=desc&per_page=30',
    )
    if (!res.ok) {
      if (res.status === 403) {
        throw new Error(
          'Tính năng này đang bị giới hạn bởi GitHub API (Rate Limit). Vui lòng thử lại sau.',
        )
      }
      throw new Error('Không thể lấy dữ liệu từ GitHub.')
    }

    const json = await res.json()
    if (json.items && Array.isArray(json.items)) {
      repos.value = json.items
    }
  } catch (e: unknown) {
    errorMsg.value = e instanceof Error ? e.message : 'Lỗi mạng không xác định'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchRepos()
})
</script>

<template>
  <div class="min-h-screen bg-bg-deep p-6 text-text-primary font-body">
    <div class="mx-auto max-w-6xl space-y-8 animate-fade-up">
      <!-- Navigation -->
      <nav class="flex items-center">
        <RouterLink
          to="/"
          class="group flex w-fit items-center gap-2 rounded-xl bg-bg-surface px-4 py-2 text-sm font-medium text-text-secondary ring-1 ring-border-default transition-all hover:bg-bg-elevated hover:text-white"
        >
          <Icon
            icon="lucide:arrow-left"
            class="size-4 transition-transform group-hover:-translate-x-1"
          />
          <span>Về trang chủ</span>
        </RouterLink>
      </nav>

      <!-- Header -->
      <header class="flex flex-col gap-4">
        <div class="flex flex-col md:flex-row md:items-center gap-5">
          <div
            class="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-bg-surface shadow-[0_4px_16px_rgba(255,255,255,0.1)] ring-1 ring-border-default/50"
          >
            <Icon icon="lucide:github" class="size-7 text-white" />
          </div>
          <div>
            <h1
              class="font-display text-3xl font-bold tracking-tight text-white md:text-4xl drop-shadow-sm"
            >
              Top GitHub Repositories
            </h1>
            <p class="text-text-secondary mt-1 max-w-xl">
              Bảng xếp hạng 30 dự án mã nguồn mở được cộng đồng đánh giá cao nhất trên toàn thế
              giới.
            </p>
          </div>
        </div>
      </header>

      <!-- Error State -->
      <div
        v-if="!isLoading && errorMsg"
        class="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center text-red-400 max-w-2xl mx-auto"
      >
        <Icon icon="lucide:alert-triangle" class="size-10 mx-auto mb-3 opacity-80" />
        <p class="text-lg">{{ errorMsg }}</p>
        <button
          @click="fetchRepos"
          class="mt-4 rounded-xl bg-red-500/20 px-6 py-2 hover:bg-red-500/30 transition-colors font-medium text-sm"
        >
          Thử lại
        </button>
      </div>

      <!-- Loading State -->
      <div v-else-if="isLoading" class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="i in 9"
          :key="i"
          class="rounded-2xl bg-bg-surface border border-border-default/50 p-5 animate-pulse flex flex-col h-full"
        >
          <div class="flex items-center gap-3 mb-4">
            <div class="size-10 rounded-full bg-border-default/30 shrink-0"></div>
            <div class="space-y-2 flex-1">
              <div class="h-4 bg-border-default/40 rounded w-3/4"></div>
              <div class="h-3 bg-border-default/30 rounded w-1/2"></div>
            </div>
          </div>
          <div class="space-y-2 mb-6">
            <div class="h-3 bg-border-default/30 rounded w-full"></div>
            <div class="h-3 bg-border-default/30 rounded w-5/6"></div>
          </div>
          <div class="mt-auto flex items-center justify-between">
            <div class="h-4 bg-border-default/40 rounded w-16"></div>
            <div class="h-4 bg-border-default/40 rounded w-12"></div>
          </div>
        </div>
      </div>

      <!-- Repos Grid -->
      <main
        v-else-if="repos.length > 0"
        class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 items-stretch"
      >
        <a
          v-for="(repo, index) in repos"
          :key="repo.id"
          :href="repo.html_url"
          target="_blank"
          rel="noopener noreferrer"
          class="group flex flex-col rounded-2xl bg-bg-surface p-5 border border-border-default shadow-sm ring-1 ring-border-default/50 hover:ring-border-default hover:bg-bg-elevated hover:shadow-lg hover:-translate-y-1 transition-all duration-300 h-full"
          :style="`animation-delay: ${index * 30}ms`"
        >
          <!-- Owner & Title -->
          <div class="flex items-start gap-4 mb-3">
            <img
              :src="repo.owner.avatar_url"
              :alt="repo.owner.login"
              class="size-12 rounded-full border border-border-default shadow-sm bg-bg-deep shrink-0"
              loading="lazy"
            />
            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium text-text-secondary truncate">
                {{ repo.owner.login }}
              </p>
              <h2
                class="font-display text-lg font-bold text-white truncate group-hover:text-accent-sky transition-colors"
              >
                {{ repo.name }}
              </h2>
            </div>
          </div>

          <!-- Description -->
          <p class="text-sm text-text-secondary line-clamp-3 mb-6 flex-1 leading-relaxed">
            {{ repo.description || 'Không có mô tả cho dự án này.' }}
          </p>

          <!-- Footer Stats -->
          <div
            class="mt-auto flex items-center text-xs font-medium pt-4 border-t border-border-default/50"
          >
            <!-- Language -->
            <div class="flex items-center gap-1.5 flex-1 min-w-0" v-if="repo.language">
              <span class="size-2.5 rounded-full" :class="getLanguageColor(repo.language)"></span>
              <span class="text-text-secondary truncate">{{ repo.language }}</span>
            </div>
            <div v-else class="flex-1"></div>

            <!-- Stars -->
            <div
              class="flex items-center gap-1 text-accent-amber shrink-0 ml-4 py-1 px-2.5 rounded-full bg-accent-amber/10 border border-accent-amber/20 shadow-[0_0_8px_rgba(251,191,36,0.15)] group-hover:bg-accent-amber/20 transition-colors"
            >
              <Icon icon="lucide:star" class="size-3.5 fill-current" />
              <span>{{ formatStars(repo.stargazers_count) }}</span>
            </div>
          </div>
        </a>
      </main>

      <!-- Empty State -->
      <div v-else class="flex flex-col items-center justify-center py-20 text-center">
        <Icon icon="lucide:github" class="size-16 text-text-secondary/30 mb-4" />
        <p class="text-text-secondary text-lg">Không tìm thấy dữ liệu Repository nào.</p>
      </div>

      <!-- Footer -->
      <footer
        class="mt-12 text-center text-sm text-text-secondary pb-8 border-t border-border-default/50 pt-8 max-w-md mx-auto"
      >
        <p>Designed by mtdes23</p>
        <a
          href="https://www.mtdes23.id.vn"
          target="_blank"
          rel="noopener noreferrer"
          class="hover:text-accent-amber focus:outline-none transition-colors"
          >www.mtdes23.id.vn</a
        >
      </footer>
    </div>
  </div>
</template>
