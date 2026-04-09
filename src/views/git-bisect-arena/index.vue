<script setup lang="ts">
import { computed } from 'vue'
import { useHead } from '@unhead/vue'
import { Icon } from '@iconify/vue'
import { useBisectArena } from './composables/useBisectArena'
import type { CommitStatus, Difficulty } from './types'
import metaData from './meta'

useHead({
  title: `${metaData.name} - Vibe Coding`,
  meta: [{ name: 'description', content: metaData.description }],
})

const {
  levels,
  levelIndex,
  currentLevel,
  currentPar,
  maxUnlockedIndex,
  canGoPrev,
  canGoNext,
  hasNextLevel,
  selectedCommit,
  attempts,
  solved,
  stars,
  candidateStart,
  candidateEnd,
  logs,
  remainingCandidates,
  testedCommitsCount,
  suggestedCommit,
  bestAttemptForCurrent,
  bestStarsForCurrent,
  getStatus,
  testCommit,
  accuseSelectedCommit,
  goToLevel,
  nextLevel,
  prevLevel,
  resetLevel,
  resetProgress,
  formatCommit,
} = useBisectArena()

const commitIndices = computed(() =>
  Array.from({ length: currentLevel.value.commitCount }, (_, index) => index + 1),
)

const selectedCommitLabel = computed(() => {
  if (selectedCommit.value === null) return 'Chưa chọn'
  return formatCommit(selectedCommit.value)
})

const selectedCommitStatus = computed<CommitStatus>(() => {
  if (selectedCommit.value === null) return 'unknown'
  return getStatus(selectedCommit.value)
})

const filledStars = computed(() =>
  Array.from({ length: 3 }, (_, index) => index < stars.value),
)

const statusLabels: Record<CommitStatus, string> = {
  unknown: 'Chưa test',
  pass: 'PASS',
  fail: 'FAIL',
  skip: 'SKIP',
}

const statusClasses: Record<CommitStatus, string> = {
  unknown: 'border-border-default bg-bg-surface text-text-secondary hover:border-accent-sky/70',
  pass: 'border-accent-sky bg-accent-sky/15 text-accent-sky',
  fail: 'border-accent-coral bg-accent-coral/15 text-accent-coral',
  skip: 'border-accent-amber bg-accent-amber/15 text-accent-amber',
}

const statusBadgeClasses: Record<CommitStatus, string> = {
  unknown: 'border-border-default bg-bg-deep/60 text-text-secondary',
  pass: 'border-accent-sky/50 bg-accent-sky/15 text-accent-sky',
  fail: 'border-accent-coral/50 bg-accent-coral/15 text-accent-coral',
  skip: 'border-accent-amber/50 bg-accent-amber/15 text-accent-amber',
}

const difficultyClasses: Record<Difficulty, string> = {
  easy: 'border-accent-sky/40 bg-accent-sky/10 text-accent-sky',
  medium: 'border-accent-amber/40 bg-accent-amber/10 text-accent-amber',
  hard: 'border-accent-coral/40 bg-accent-coral/10 text-accent-coral',
}

const difficultyLabels: Record<Difficulty, string> = {
  easy: 'Dễ',
  medium: 'Trung bình',
  hard: 'Khó',
}

function difficultyPillClass(difficulty: Difficulty) {
  return `border px-3 py-1 text-[10px] font-display tracking-[0.2em] uppercase ${difficultyClasses[difficulty]}`
}

function isLevelUnlocked(index: number) {
  return index <= maxUnlockedIndex.value
}

function levelButtonClass(index: number) {
  const unlocked = isLevelUnlocked(index)
  const active = index === levelIndex.value
  const base =
    'border px-3 py-2 text-left text-xs font-display tracking-widest transition-all min-h-[62px] flex flex-col justify-center gap-1'

  if (!unlocked) return `${base} border-border-default/40 text-text-dim/70 cursor-not-allowed`
  if (active) return `${base} border-accent-coral bg-accent-coral/10 text-accent-coral`
  return `${base} border-border-default text-text-secondary hover:border-accent-sky hover:text-text-primary`
}

function commitButtonClass(index: number) {
  const status = getStatus(index)
  const inRange = index >= candidateStart.value && index <= candidateEnd.value
  const selected = selectedCommit.value === index
  const base = 'h-11 border text-[11px] font-mono tracking-wide transition-all duration-200'
  let classes = `${base} ${statusClasses[status]}`
  if (!inRange && status === 'unknown') classes += ' opacity-45'
  if (selected) classes += ' ring-2 ring-accent-amber ring-offset-2 ring-offset-bg-deep'
  return classes
}

function onChooseLevel(index: number) {
  goToLevel(index)
}

function onSelectCommit(index: number) {
  testCommit(index)
}

function onUseSuggestion() {
  if (suggestedCommit.value === null) return
  testCommit(suggestedCommit.value)
}

function onAccuseSelected() {
  accuseSelectedCommit()
}

function onPrevLevel() {
  prevLevel()
}

function onNextLevel() {
  nextLevel()
}

function onResetLevel() {
  resetLevel()
}

function onResetProgress() {
  resetProgress()
}
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body">
    <div class="mx-auto max-w-[1500px] px-4 py-10 sm:px-6 xl:px-8">
      <header
        class="mb-8 border-b border-border-default pb-8 animate-fade-up flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"
      >
        <div>
          <div class="mb-3 flex items-center gap-3 text-accent-coral font-display text-sm tracking-widest">
            <Icon icon="lucide:git-branch" class="size-4" />
            // GIT DEBUG ARENA
          </div>
          <h1 class="font-display text-4xl md:text-5xl font-bold tracking-tight">
            Đấu Trường <span class="text-accent-coral italic">Git Bisect</span>
          </h1>
          <p class="mt-3 max-w-2xl text-sm md:text-base text-text-secondary">
            Luyện tư duy chia đôi để truy tìm commit đầu tiên gây lỗi. Chơi từ level dễ đến khó,
            mỗi lượt test đều phải làm thu hẹp dải nghi vấn.
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-3 animate-fade-up animate-delay-2">
          <div :class="difficultyPillClass(currentLevel.difficulty)">
            {{ difficultyLabels[currentLevel.difficulty] }} / {{ currentLevel.difficulty }}
          </div>
          <div class="border border-border-default px-3 py-1 text-[10px] font-display tracking-[0.2em] text-text-secondary uppercase">
            level {{ currentLevel.id }}/{{ levels.length }}
          </div>
          <RouterLink
            to="/"
            class="inline-flex items-center gap-2 border border-border-default px-3 py-1 text-xs text-text-secondary transition hover:border-accent-sky hover:text-text-primary"
          >
            <Icon icon="lucide:home" class="size-4" />
            Home
          </RouterLink>
        </div>
      </header>

      <main class="grid gap-8 xl:gap-10 lg:grid-cols-12">
        <section class="space-y-6 lg:col-span-4 2xl:col-span-3">
          <article class="border border-border-default bg-bg-surface p-6 animate-fade-up animate-delay-2">
            <h2 class="mb-4 font-display text-xl font-semibold flex items-center gap-3">
              <span class="text-accent-sky text-sm tracking-widest">//</span>
              Cách chơi nhanh
            </h2>

            <div class="space-y-4 text-sm text-text-secondary">
              <div>
                <p class="mb-2 font-display text-xs tracking-widest uppercase text-text-primary">
                  Cách chơi
                </p>
                <ol class="space-y-2 list-decimal pl-5">
                  <li>Chọn một commit trong Commit Arena để chạy test.</li>
                  <li>PASS nghĩa là lỗi nằm bên phải commit đó, FAIL nghĩa là lỗi ở commit đó hoặc bên trái.</li>
                  <li>SKIP nghĩa là commit không test được, hãy chọn commit khác để tiếp tục khoanh vùng.</li>
                  <li>Khi đủ tự tin, bấm Tố cáo commit đang chọn.</li>
                </ol>
              </div>

              <div class="border-t border-border-default/60 pt-4">
                <p class="mb-2 font-display text-xs tracking-widest uppercase text-accent-coral">
                  Điều kiện qua màn
                </p>
                <ul class="space-y-2 list-disc pl-5">
                  <li>Chỉ qua màn khi tố cáo đúng commit đầu tiên gây lỗi.</li>
                  <li>Tố cáo sai sẽ không thua ngay, nhưng tốn thêm lượt thao tác.</li>
                  <li>Thắng màn sẽ mở khóa level tiếp theo và được chấm sao theo số lượt dùng.</li>
                </ul>
              </div>
            </div>
          </article>

          <article class="border border-border-default bg-bg-surface p-6 animate-fade-up animate-delay-3">
            <h2 class="mb-4 font-display text-xl font-semibold flex items-center gap-3">
              <span class="text-accent-amber text-sm tracking-widest">//</span>
              Git Bisect CLI
            </h2>

            <div class="space-y-3 text-xs">
              <div class="border border-border-default/60 bg-bg-deep/50 px-3 py-2">
                <p class="font-display tracking-widest text-accent-sky mb-1">Bắt đầu bisect</p>
                <p class="font-mono text-text-primary">git bisect start</p>
              </div>
              <div class="border border-border-default/60 bg-bg-deep/50 px-3 py-2">
                <p class="font-display tracking-widest text-accent-sky mb-1">Đánh dấu mốc tốt/xấu</p>
                <p class="font-mono text-text-primary">git bisect good &lt;commit&gt;</p>
                <p class="font-mono text-text-primary">git bisect bad &lt;commit&gt;</p>
              </div>
              <div class="border border-border-default/60 bg-bg-deep/50 px-3 py-2">
                <p class="font-display tracking-widest text-accent-sky mb-1">Trong khi test</p>
                <p class="font-mono text-text-primary">git bisect good</p>
                <p class="font-mono text-text-primary">git bisect bad</p>
                <p class="font-mono text-text-primary">git bisect skip</p>
              </div>
              <div class="border border-border-default/60 bg-bg-deep/50 px-3 py-2">
                <p class="font-display tracking-widest text-accent-sky mb-1">Kết thúc</p>
                <p class="font-mono text-text-primary">git bisect reset</p>
              </div>
            </div>
          </article>

          <article class="border border-border-default bg-bg-surface p-6 animate-fade-up animate-delay-2">
            <h2 class="mb-4 font-display text-xl font-semibold flex items-center gap-3">
              <span class="text-accent-coral text-sm tracking-widest">//</span>
              Mục tiêu level
            </h2>
            <p class="text-sm text-text-secondary leading-relaxed">{{ currentLevel.description }}</p>
            <div class="mt-4 border-l-4 border-accent-amber bg-bg-deep/60 p-3 text-xs text-accent-amber">
              Gợi ý: {{ currentLevel.hint }}
            </div>
          </article>

          <article class="border border-border-default bg-bg-surface p-6 animate-fade-up animate-delay-3">
            <h2 class="mb-4 font-display text-xl font-semibold flex items-center gap-3">
              <span class="text-accent-amber text-sm tracking-widest">//</span>
              Trạng thái truy vết
            </h2>
            <div class="space-y-3 text-sm">
              <div class="flex items-center justify-between border-b border-border-default/60 pb-2">
                <span class="text-text-secondary">Phạm vi nghi vấn</span>
                <strong class="font-mono text-accent-sky">
                  {{ formatCommit(candidateStart) }} -> {{ formatCommit(candidateEnd) }}
                </strong>
              </div>
              <div class="flex items-center justify-between border-b border-border-default/60 pb-2">
                <span class="text-text-secondary">Commit đã test</span>
                <strong class="font-display text-text-primary">{{ testedCommitsCount }}</strong>
              </div>
              <div class="flex items-center justify-between border-b border-border-default/60 pb-2">
                <span class="text-text-secondary">Commit còn nghi vấn</span>
                <strong class="font-display text-accent-coral">{{ remainingCandidates }}</strong>
              </div>
              <div class="flex items-center justify-between border-b border-border-default/60 pb-2">
                <span class="text-text-secondary">Số lượt đã dùng</span>
                <strong class="font-display text-text-primary">{{ attempts }}</strong>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-text-secondary">PAR tối ưu</span>
                <strong class="font-display text-accent-amber">{{ currentPar }}</strong>
              </div>
            </div>
          </article>

          <article class="border border-border-default bg-bg-surface p-6 animate-fade-up animate-delay-4">
            <h2 class="mb-4 font-display text-xl font-semibold flex items-center gap-3">
              <span class="text-accent-sky text-sm tracking-widest">//</span>
              Thành tích
            </h2>
            <div class="space-y-3 text-sm">
              <div class="flex items-center justify-between">
                <span class="text-text-secondary">Best attempts</span>
                <strong class="font-display text-text-primary">{{ bestAttemptForCurrent ?? '-' }}</strong>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-text-secondary">Best stars</span>
                <div class="flex items-center gap-1">
                  <Icon
                    v-for="(filled, index) in Array.from({ length: 3 }, (_, i) => i < bestStarsForCurrent)"
                    :key="`best-${index}`"
                    icon="lucide:star"
                    class="size-4"
                    :class="filled ? 'text-accent-amber fill-current' : 'text-border-default'"
                  />
                </div>
              </div>
            </div>
          </article>
        </section>

        <section class="space-y-6 lg:col-span-8 2xl:col-span-9">
          <article class="border border-border-default bg-bg-surface p-6 animate-fade-up animate-delay-2">
            <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 class="font-display text-xl font-semibold flex items-center gap-3">
                <span class="text-accent-coral text-sm tracking-widest">//</span>
                Commit Arena
              </h2>
              <div class="flex flex-wrap items-center gap-2 text-xs">
                <span class="border border-accent-sky/40 bg-accent-sky/10 px-2 py-1 text-accent-sky">PASS</span>
                <span class="border border-accent-coral/40 bg-accent-coral/10 px-2 py-1 text-accent-coral">FAIL</span>
                <span class="border border-accent-amber/40 bg-accent-amber/10 px-2 py-1 text-accent-amber">SKIP</span>
              </div>
            </div>

            <p class="mb-4 text-sm text-text-secondary">
              Chạm vào commit để test. Khi đủ tự tin, bấm tố cáo commit đã chọn để chốt culprit.
            </p>

            <div class="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              <div class="border border-border-default/70 bg-bg-deep/50 px-3 py-2 text-xs">
                <p class="text-text-dim mb-1">Commit đang chọn</p>
                <div class="flex items-center justify-between gap-2">
                  <strong class="font-mono text-accent-amber">{{ selectedCommitLabel }}</strong>
                  <span
                    :class="`border px-2 py-1 text-[10px] font-display tracking-widest uppercase ${statusBadgeClasses[selectedCommitStatus]}`"
                  >
                    {{ statusLabels[selectedCommitStatus] }}
                  </span>
                </div>
              </div>

              <div class="border border-border-default/70 bg-bg-deep/50 px-3 py-2 text-xs">
                <p class="text-text-dim mb-1">Gợi ý lần test tiếp theo</p>
                <strong class="font-mono text-accent-sky">
                  {{ suggestedCommit ? formatCommit(suggestedCommit) : 'Không khả dụng' }}
                </strong>
              </div>

              <div class="border border-border-default/70 bg-bg-deep/50 px-3 py-2 text-xs sm:col-span-2 lg:col-span-1">
                <p class="text-text-dim mb-1">Nhịp độ hiện tại</p>
                <strong class="font-display text-text-primary">{{ attempts }} lượt / PAR {{ currentPar }}</strong>
              </div>
            </div>

            <div class="grid grid-cols-[repeat(auto-fill,minmax(3.1rem,1fr))] gap-2 sm:gap-2.5 max-h-[520px] overflow-y-auto pr-2">
              <button
                v-for="commit in commitIndices"
                :key="commit"
                :class="commitButtonClass(commit)"
                :title="`Test ${formatCommit(commit)}`"
                @click="onSelectCommit(commit)"
              >
                {{ commit.toString().padStart(3, '0') }}
              </button>
            </div>

            <div class="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <button
                class="border border-border-default px-4 py-3 text-xs font-display tracking-widest text-text-secondary transition hover:border-accent-sky hover:text-accent-sky disabled:opacity-50 disabled:cursor-not-allowed"
                :disabled="suggestedCommit === null"
                @click="onUseSuggestion"
              >
                Test gợi ý {{ suggestedCommit ? formatCommit(suggestedCommit) : '' }}
              </button>
              <button
                class="border border-accent-coral px-4 py-3 text-xs font-display tracking-widest text-accent-coral transition hover:bg-accent-coral/10 disabled:opacity-50 disabled:cursor-not-allowed"
                :disabled="selectedCommit === null || solved"
                @click="onAccuseSelected"
              >
                Tố cáo {{ selectedCommitLabel }}
              </button>
              <button
                class="border border-border-default px-4 py-3 text-xs font-display tracking-widest text-text-secondary transition hover:border-accent-amber hover:text-accent-amber"
                @click="onResetLevel"
              >
                Reset level
              </button>
              <button
                class="border border-border-default px-4 py-3 text-xs font-display tracking-widest text-text-secondary transition hover:border-accent-coral hover:text-accent-coral"
                @click="onResetProgress"
              >
                Reset progress
              </button>
            </div>

            <div
              v-if="solved"
              class="mt-6 border border-accent-amber bg-accent-amber/10 p-4 animate-fade-up"
            >
              <div class="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p class="font-display text-lg text-accent-amber">Hoàn thành level {{ currentLevel.id }}!</p>
                  <p class="text-sm text-text-secondary">
                    Bạn chốt đúng culprit với {{ attempts }} lượt thao tác.
                  </p>
                </div>
                <div class="flex items-center gap-1">
                  <Icon
                    v-for="(filled, index) in filledStars"
                    :key="`solved-${index}`"
                    icon="lucide:star"
                    class="size-5"
                    :class="filled ? 'text-accent-amber fill-current' : 'text-border-default'"
                  />
                </div>
              </div>
              <button
                v-if="hasNextLevel && canGoNext"
                class="mt-4 border border-accent-sky px-4 py-2 text-xs font-display tracking-widest text-accent-sky transition hover:bg-accent-sky/10"
                @click="onNextLevel"
              >
                Sang level tiếp theo
              </button>
            </div>
          </article>

          <article class="border border-border-default bg-bg-surface p-6 animate-fade-up animate-delay-3">
            <h2 class="mb-4 font-display text-xl font-semibold flex items-center gap-3">
              <span class="text-accent-amber text-sm tracking-widest">//</span>
              Mission Log
            </h2>
            <ul class="space-y-2 text-xs font-mono text-text-secondary max-h-56 overflow-y-auto pr-2">
              <li v-for="(line, index) in logs" :key="`${line}-${index}`">
                {{ line }}
              </li>
            </ul>
          </article>

          <article class="border border-border-default bg-bg-surface p-6 animate-fade-up animate-delay-4">
            <div class="mb-4 flex items-center justify-between gap-4">
              <h2 class="font-display text-xl font-semibold flex items-center gap-3">
                <span class="text-accent-sky text-sm tracking-widest">//</span>
                Level Select
              </h2>
              <div class="flex items-center gap-2">
                <button
                  class="border border-border-default px-3 py-2 text-xs text-text-secondary transition hover:border-accent-sky hover:text-accent-sky disabled:opacity-40 disabled:cursor-not-allowed"
                  :disabled="!canGoPrev"
                  @click="onPrevLevel"
                >
                  <Icon icon="lucide:chevron-left" class="size-4" />
                </button>
                <button
                  class="border border-border-default px-3 py-2 text-xs text-text-secondary transition hover:border-accent-sky hover:text-accent-sky disabled:opacity-40 disabled:cursor-not-allowed"
                  :disabled="!canGoNext"
                  @click="onNextLevel"
                >
                  <Icon icon="lucide:chevron-right" class="size-4" />
                </button>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              <button
                v-for="(level, index) in levels"
                :key="level.id"
                :class="levelButtonClass(index)"
                :disabled="!isLevelUnlocked(index)"
                @click="onChooseLevel(index)"
              >
                <span class="text-text-primary">L{{ level.id }} · {{ difficultyLabels[level.difficulty] }}</span>
                <span class="text-[10px] text-text-dim normal-case tracking-normal">{{ level.name }}</span>
              </button>
            </div>
          </article>
        </section>
      </main>
    </div>
  </div>
</template>
