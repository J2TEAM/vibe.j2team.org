<script setup lang="ts">
import { ref } from 'vue'
import { useHead } from '@unhead/vue'
import { Icon } from '@iconify/vue'
import { useGitEngine } from './composables/useGitEngine'
import GitGraph from './components/GitGraph.vue'
import GitTerminal from './components/GitTerminal.vue'
import metaData from './meta'

useHead({
  title: `${metaData.name} - Vibe Coding`,
  meta: [{ name: 'description', content: metaData.description }],
})

const {
  state,
  history,
  currentLevel,
  executeCommand,
  resetLevel,
  nextLevel,
  goToLevel,
  isWin,
  hasNextLevel,
  allLevels,
} = useGitEngine()

const showMenu = ref(false)

const selectLevel = (idx: number) => {
  goToLevel(idx)
  showMenu.value = false
}

const onCommand = (cmd: string) => {
  const result = executeCommand(cmd)
  history.value.push(`${cmd}`)
  if (!result.success) {
    history.value.push(`Error: ${result.message}`)
  } else {
    history.value.push(`${result.message}`)
  }
}
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body">
    <div class="max-w-5xl mx-auto px-6 py-12">
      <!-- Header -->
      <header
        class="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 overflow-hidden border-b border-border-default pb-8"
      >
        <div class="animate-fade-up">
          <div
            class="flex items-center gap-3 text-accent-sky font-display text-sm tracking-widest mb-2"
          >
            <Icon icon="lucide:git-pull-request" class="size-4" />
            VIBE GIT ACADEMY
          </div>
          <h1 class="font-display text-5xl font-bold tracking-tight">
            Git Rebase <span class="text-accent-sky italic">Master</span>
          </h1>
        </div>

        <div class="flex items-center gap-6">
          <div class="text-right animate-fade-up animate-delay-2">
            <div class="text-[10px] text-text-dim uppercase tracking-widest font-display mb-1">
              Màn
            </div>
            <div class="text-xl font-display font-bold text-accent-sky">
              0{{ currentLevel?.id }}
            </div>
          </div>
          <button
            @click="showMenu = true"
            class="animate-fade-up animate-delay-3 flex items-center gap-2 text-text-secondary hover:text-accent-sky transition-colors text-xs font-display tracking-widest uppercase border border-border-default px-4 py-2 hover:border-accent-sky/50"
          >
            <Icon icon="lucide:list" class="size-4" />
            Levels
          </button>
          <RouterLink
            to="/"
            class="animate-fade-up animate-delay-4 flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors text-xs font-display tracking-widest uppercase"
          >
            <Icon icon="lucide:home" class="size-4" />
            Home
          </RouterLink>
        </div>
      </header>

      <main class="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <!-- Goal Section -->
        <section class="lg:col-span-1 space-y-6 animate-fade-up animate-delay-2">
          <div class="bg-bg-surface border border-border-default p-8 shadow-sm">
            <h2
              class="font-display text-2xl font-semibold text-text-primary mb-6 flex items-center gap-3"
            >
              <span class="text-accent-coral font-display text-sm tracking-widest">//</span>
              Mục tiêu
            </h2>
            <p class="text-text-secondary leading-relaxed mb-6 text-sm">
              {{ currentLevel?.description }}
            </p>
            <div class="bg-bg-deep/50 p-4 border-l-4 border-accent-sky">
              <p class="text-xs font-mono text-accent-sky">
                {{ currentLevel?.goalDescription }}
              </p>
            </div>
          </div>

          <div class="bg-bg-surface border border-border-default p-8 shadow-sm">
            <h3
              class="font-display text-2xl font-semibold text-text-primary mb-6 flex items-center gap-3"
            >
              <span class="text-accent-amber font-display text-sm tracking-widest">//</span>
              Command Guide
            </h3>
            <ul class="space-y-4 text-sm font-mono">
              <li class="flex items-start gap-2">
                <span class="text-accent-coral">/</span>
                <span>git checkout [branch]</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="text-accent-coral">/</span>
                <span>git rebase [branch]</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="text-accent-coral">/</span>
                <span>git commit -m "msg"</span>
              </li>
            </ul>
          </div>

          <button
            @click="resetLevel"
            class="w-full flex items-center justify-center gap-2 py-4 border border-border-default hover:border-accent-coral hover:bg-accent-coral/5 transition-all text-xs font-display tracking-widest uppercase text-text-dim hover:text-accent-coral"
          >
            <Icon icon="lucide:refresh-cw" class="size-4" />
            Reset Level
          </button>
        </section>

        <!-- Visual & Console Section -->
        <section class="lg:col-span-2 space-y-8 animate-fade-up animate-delay-3">
          <!-- Graph Display -->
          <div class="relative bg-bg-surface border border-border-default p-4 shadow-sm">
            <div
              class="absolute top-6 left-6 z-10 px-3 py-1 bg-bg-deep/80 border border-border-default text-[10px] uppercase font-display tracking-[0.2em] text-accent-sky backdrop-blur-sm shadow-sm flex items-center gap-2"
            >
              <span class="text-accent-sky font-display tracking-widest">//</span>
              Visualizer / History
            </div>
            <GitGraph :state="state" />
          </div>

          <!-- Terminal -->
          <GitTerminal
            :history="history"
            @command="onCommand"
            class="animate-fade-up animate-delay-4"
          />
        </section>
      </main>

      <!-- Win Modal Overlay -->
      <Transition
        enter-active-class="transition-opacity duration-300"
        enter-from-class="opacity-0"
        leave-active-class="transition-opacity duration-300"
        leave-to-class="opacity-0"
      >
        <div
          v-if="isWin"
          class="fixed inset-0 z-50 flex items-center justify-center p-6 bg-bg-deep/80 backdrop-blur-md text-text-primary"
        >
          <div
            class="bg-bg-surface border border-accent-sky p-12 max-w-md w-full text-center shadow-2xl shadow-accent-sky/20 transition-all duration-500 animate-fade-up"
          >
            <Icon icon="lucide:party-popper" class="size-16 text-accent-sky mx-auto mb-6" />
            <h2 class="font-display text-4xl font-bold mb-4 uppercase italic">Hoàn thành!</h2>
            <p class="text-text-secondary mb-8">
              Tuyệt vời! Bạn đã làm chủ được kỹ năng Git trong màn chơi này.
            </p>
            <div class="flex flex-col gap-4">
              <button
                v-if="hasNextLevel"
                @click="nextLevel"
                class="bg-accent-sky hover:bg-white text-bg-deep px-8 py-4 font-display font-bold text-sm tracking-widest uppercase transition-all"
              >
                Màn tiếp theo &rarr;
              </button>
              <div
                v-else
                class="bg-bg-deep/50 text-text-dim px-8 py-4 font-display font-bold text-sm tracking-widest uppercase border border-border-default"
              >
                Bạn đã phá đảo! (Coming Soon)
              </div>
              <button
                @click="
                  showMenu = true
                  isWin = false
                "
                class="border border-border-default hover:border-accent-sky px-8 py-4 font-display font-bold text-sm tracking-widest uppercase transition-all text-text-dim hover:text-accent-sky"
              >
                Chọn màn khác
              </button>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Level Selection Menu -->
      <Transition
        enter-active-class="transition-all duration-500 ease-out"
        enter-from-class="opacity-0 scale-95"
        enter-to-class="opacity-100 scale-100"
        leave-active-class="transition-all duration-400 ease-in"
        leave-from-class="opacity-100 scale-100"
        leave-to-class="opacity-0 scale-95"
      >
        <div
          v-if="showMenu"
          class="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-bg-deep/95 backdrop-blur-xl text-text-primary"
        >
          <div class="max-w-6xl w-full max-h-[90vh] flex flex-col">
            <div class="flex items-center justify-between mb-12">
              <div>
                <div class="text-accent-sky font-display text-sm tracking-[0.3em] mb-2 uppercase">
                  // Mission Select
                </div>
                <h2 class="font-display text-5xl font-bold tracking-tight">
                  Cấp độ <span class="text-accent-sky italic">Huấn luyện</span>
                </h2>
              </div>
              <button
                @click="showMenu = false"
                class="p-4 border border-border-default hover:border-accent-coral text-text-dim hover:text-accent-coral transition-all"
              >
                <Icon icon="lucide:x" class="size-8" />
              </button>
            </div>

            <div
              class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto pr-4 scrollbar-thin min-h-0 py-4"
            >
              <div
                v-for="(level, idx) in allLevels"
                :key="level.id"
                @click="selectLevel(idx)"
                class="group relative h-64 bg-bg-surface border border-border-default p-8 cursor-pointer transition-all duration-500 hover:-translate-y-2 hover:border-accent-sky hover:bg-bg-elevated overflow-hidden"
                :class="{
                  'border-accent-sky border-2 bg-accent-sky/5': currentLevel?.id === level.id,
                }"
              >
                <!-- Large Background Number -->
                <span
                  class="absolute -top-4 -right-2 font-display text-8xl font-bold text-white/10 select-none pointer-events-none group-hover:text-accent-sky/20 transition-colors"
                >
                  {{ (idx + 1).toString().padStart(2, '0') }}
                </span>

                <div class="relative z-10">
                  <div class="flex items-center justify-between mb-6">
                    <Icon
                      icon="lucide:git-commit"
                      class="size-8 transition-transform duration-500 group-hover:rotate-90"
                      :class="
                        currentLevel?.id === level.id ? 'text-accent-sky' : 'text-text-secondary'
                      "
                    />
                    <div
                      v-if="currentLevel?.id === level.id"
                      class="px-2 py-1 bg-accent-sky text-bg-deep text-[10px] font-display font-bold tracking-widest"
                    >
                      ACTIVE
                    </div>
                  </div>

                  <h3
                    class="font-display text-2xl font-bold mb-3 group-hover:text-accent-sky transition-colors text-text-primary"
                  >
                    {{ level.title }}
                  </h3>
                  <p
                    class="text-text-secondary group-hover:text-text-primary text-sm leading-relaxed mb-6 line-clamp-3 transition-colors"
                  >
                    {{ level.description }}
                  </p>

                  <div
                    class="flex items-center justify-between text-[10px] font-display tracking-widest uppercase"
                  >
                    <span class="text-text-dim"
                      >Difficulty: {{ idx < 3 ? 'Basic' : idx < 7 ? 'Advanced' : 'Expert' }}</span
                    >
                    <span
                      class="text-accent-sky opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all font-bold"
                    >
                      Deploy &rarr;
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.scrollbar-thin::-webkit-scrollbar {
  width: 4px;
}
.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}
.scrollbar-thin::-webkit-scrollbar-thumb {
  background: var(--color-border-default);
}
</style>
