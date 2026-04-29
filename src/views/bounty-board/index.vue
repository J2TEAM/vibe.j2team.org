<script setup lang="ts">
import { ref, watch } from 'vue'
import { Icon } from '@iconify/vue'
import PlayerStatusBar from './components/PlayerStatusBar.vue'
import BountyCard from './components/BountyCard.vue'
import ActiveQuestCard from './components/ActiveQuestCard.vue'
import ShopModal from './components/ShopModal.vue'
import RankUpModal from './components/RankUpModal.vue'
import GameCompleteModal from './components/GameCompleteModal.vue'
import { useGameState, SHOP_ITEMS } from './composables/useGameState'
import { REFRESH_COST } from './constants'

const {
  player,
  boardQuests,
  activeQuests,
  notifications,
  rankUpEvent,
  clearRankUpEvent,
  refreshBoard,
  acceptQuest,
  randomAccept,
  completeQuest,
  skipQuest,
  buyItem,
  resetPlayer,
  expProgress,
  hpPercent,
  isGameComplete,
  isDataLoaded,
  initGameData,
} = useGameState()

initGameData()

type Tab = 'board' | 'shop'
const activeTab = ref<Tab>('board')

// Game complete modal — dismissed when user chooses "Chơi Tiếp"
const gameCompleteDismissed = ref(false)
watch(isGameComplete, (val) => {
  if (!val) gameCompleteDismissed.value = false
})

function handleRefreshBoard() {
  refreshBoard()
}

function handleRandomAccept() {
  randomAccept()
}

function handleAccept(uid: string) {
  acceptQuest(uid)
}

function handleComplete(uid: string) {
  completeQuest(uid)
}

function handleSkip(uid: string) {
  skipQuest(uid)
}

function handleBuy(itemId: string) {
  buyItem(itemId)
}

function handleReset() {
  resetPlayer()
  gameCompleteDismissed.value = false
}

function switchTab(tab: Tab) {
  activeTab.value = tab
}
</script>

<template>
  <div
    v-if="!isDataLoaded"
    class="flex min-h-screen items-center justify-center bg-bg-deep text-text-primary"
  >
    <Icon icon="lucide:loader-2" class="animate-spin size-8 text-accent-amber" />
    <span class="ml-2 font-display tracking-widest text-text-secondary"
      >Đang tải dữ liệu Hội Thợ Săn...</span
    >
  </div>

  <div v-else class="min-h-screen bg-bg-deep text-text-primary font-body">
    <!-- Player Status Bar (fixed top) -->
    <PlayerStatusBar :player="player" :exp-progress="expProgress" :hp-percent="hpPercent" />

    <!-- Rank-Up Popup -->
    <RankUpModal :event="rankUpEvent" @close="clearRankUpEvent" />

    <!-- Game Complete Popup -->
    <GameCompleteModal
      v-if="isGameComplete && !gameCompleteDismissed"
      :player="player"
      @continue="gameCompleteDismissed = true"
      @reset="handleReset"
    />

    <!-- Notifications -->
    <div class="fixed top-[60px] right-4 z-50 flex flex-col gap-2 w-72 pointer-events-none">
      <TransitionGroup name="notif">
        <div
          v-for="notif in notifications"
          :key="notif.id"
          class="border px-4 py-2.5 font-display text-xs tracking-wide shadow-lg pointer-events-auto"
          :class="{
            'border-accent-coral bg-accent-coral/10 text-accent-coral': notif.type === 'fail',
            'border-accent-amber bg-accent-amber/10 text-accent-amber':
              notif.type === 'warning' || notif.type === 'levelup',
            'border-green-500 bg-green-500/10 text-green-400': notif.type === 'success',
            'border-red-500 bg-red-500/10 text-red-400': notif.type === 'boss',
          }"
        >
          {{ notif.message }}
        </div>
      </TransitionGroup>
    </div>

    <!-- Main Content -->
    <div class="mx-auto max-w-5xl px-4 pt-28 sm:pt-32 pb-16">
      <!-- ── Page Header ── -->
      <header class="mb-8 text-center animate-fade-up">
        <!-- Board sign decoration -->
        <div class="relative inline-block mb-4">
          <div
            class="border-2 border-accent-amber bg-bg-surface px-8 py-4 shadow-lg shadow-accent-amber/10"
          >
            <div class="flex items-center gap-3 justify-center mb-1">
              <span class="flex gap-0.5">
                <span
                  v-for="n in 5"
                  :key="n"
                  class="block w-1 h-4 odd:bg-accent-amber/40 even:bg-bg-elevated"
                />
              </span>
              <span class="font-display text-[10px] tracking-[0.3em] text-accent-amber/60 uppercase"
                >Hệ thống người chơi</span
              >
              <span class="flex gap-0.5">
                <span
                  v-for="n in 5"
                  :key="n"
                  class="block w-1 h-4 odd:bg-accent-amber/40 even:bg-bg-elevated"
                />
              </span>
            </div>
            <h1
              class="font-display text-3xl sm:text-5xl font-bold text-accent-amber tracking-widest"
            >
              BẢNG NHIỆM VỤ
            </h1>
            <div class="flex items-center justify-center gap-2 mt-1">
              <div class="h-px flex-1 bg-accent-amber/30" />
              <span class="font-display text-[10px] tracking-[0.2em] text-text-dim"
                >BOUNTY BOARD</span
              >
              <div class="h-px flex-1 bg-accent-amber/30" />
            </div>
          </div>
          <!-- Corner screws -->
          <div class="absolute top-1.5 left-1.5 size-2 rounded-full bg-accent-amber/40" />
          <div class="absolute top-1.5 right-1.5 size-2 rounded-full bg-accent-amber/40" />
          <div class="absolute bottom-1.5 left-1.5 size-2 rounded-full bg-accent-amber/40" />
          <div class="absolute bottom-1.5 right-1.5 size-2 rounded-full bg-accent-amber/40" />
        </div>

        <p class="text-text-secondary text-sm animate-fade-up animate-delay-2">
          Hoàn thành nhiệm vụ thực tế mỗi ngày để nhận thưởng EXP và Vàng.
          <br class="hidden sm:block" />
          Mỗi lần <span class="text-accent-amber font-semibold">thăng cấp</span>, một Boss sẽ xuất
          hiện — đánh bại để nhận thưởng lớn!
        </p>
      </header>

      <!-- ── Tabs & Actions ── -->
      <div
        class="mb-6 flex items-center justify-between border-b border-border-default animate-fade-up animate-delay-3"
      >
        <div class="flex">
          <button
            v-for="tab in ['board', 'shop'] as Tab[]"
            :key="tab"
            class="flex items-center gap-2 border-b-2 px-4 py-3 sm:px-6 font-display text-sm tracking-wide transition-colors"
            style="margin-bottom: -1px"
            :class="
              activeTab === tab
                ? 'border-accent-coral text-accent-coral'
                : 'border-transparent text-text-dim hover:text-text-secondary'
            "
            @click="switchTab(tab)"
          >
            <Icon :icon="tab === 'board' ? 'lucide:scroll' : 'lucide:store'" class="size-4" />
            <span class="hidden sm:inline">{{
              tab === 'board' ? 'Bảng Nhiệm Vụ' : 'Cửa Hàng'
            }}</span>
            <span class="sm:hidden">{{ tab === 'board' ? 'Nhiệm Vụ' : 'Shop' }}</span>
          </button>
        </div>

        <button
          class="flex items-center gap-1.5 px-4 text-xs text-text-dim/60 transition hover:text-accent-coral"
          @click="handleReset"
        >
          <Icon icon="lucide:rotate-ccw" class="size-3" />
          <span class="hidden sm:inline">Reset nhân vật</span>
        </button>
      </div>

      <!-- ════════════════════════════════════════════════════════════════ -->
      <!-- TAB: BOARD -->
      <!-- ════════════════════════════════════════════════════════════════ -->
      <div v-if="activeTab === 'board'" class="space-y-8">
        <!-- ── Active Quests ── -->
        <section v-if="activeQuests.length > 0" class="animate-fade-up">
          <h2 class="mb-4 flex items-center gap-3 font-display text-lg font-semibold">
            <span class="text-accent-coral text-sm tracking-widest">//</span>
            Đang Thực Hiện
            <span
              class="border border-accent-coral/40 bg-accent-coral/10 px-2 py-0.5 font-display text-xs text-accent-coral"
            >
              {{ activeQuests.length }}
            </span>
          </h2>
          <div class="space-y-3">
            <ActiveQuestCard
              v-for="quest in activeQuests"
              :key="quest.uid"
              :quest="quest"
              @complete="handleComplete"
              @skip="handleSkip"
            />
          </div>
        </section>

        <!-- ── Board Actions ── -->
        <div
          class="flex flex-wrap items-center justify-between gap-3 animate-fade-up animate-delay-1"
        >
          <div class="flex flex-wrap items-center gap-2">
            <button
              class="flex items-center gap-2 border border-border-default bg-bg-surface px-4 py-2 font-display text-xs tracking-wide text-text-secondary transition hover:border-accent-amber hover:text-accent-amber"
              @click="handleRefreshBoard"
            >
              <Icon icon="lucide:refresh-cw" class="size-3.5" />
              Làm Mới Bảng ({{ REFRESH_COST }}G)
            </button>
            <button
              class="flex items-center gap-2 border border-border-default bg-bg-surface px-4 py-2 font-display text-xs tracking-wide text-text-secondary transition hover:border-accent-sky hover:text-accent-sky"
              @click="handleRandomAccept"
            >
              <Icon icon="lucide:dice-5" class="size-3.5" />
              Nhận Ngẫu Nhiên
            </button>
            <div
              class="ml-1 sm:ml-4 flex items-center gap-4 font-display text-[11px] tracking-widest text-text-dim"
            >
              <span class="flex items-center">
                HOÀN THÀNH:<span class="ml-1.5 font-bold text-accent-coral text-sm">{{
                  player.completedCount
                }}</span>
              </span>
              <span class="flex items-center">
                BỎ QUA:<span class="ml-1.5 font-bold text-accent-amber text-sm">{{
                  player.skippedCount ?? 0
                }}</span>
              </span>
              <span class="flex items-center">
                DIỆT BOSS:<span class="ml-1.5 font-bold text-red-500 text-sm">{{
                  player.bossesDefeated ?? 0
                }}</span>
              </span>
            </div>
          </div>

          <!-- Active boss indicator -->
          <div
            v-if="activeQuests.some((q) => q.isBoss)"
            class="flex items-center gap-2 text-xs font-display animate-pulse"
          >
            <Icon icon="lucide:skull" class="size-3.5 text-red-400" />
            <span class="text-red-400 font-bold">BOSS ĐANG CHờ!</span>
          </div>
        </div>

        <!-- ── Quest Board ── -->
        <section class="animate-fade-up animate-delay-2">
          <!-- Board background panel -->
          <div class="relative border border-accent-amber/20 bg-bg-surface/50 p-4 sm:p-6">
            <!-- Board texture dots -->
            <div
              class="absolute inset-0 opacity-5 pointer-events-none"
              style="
                background-image: radial-gradient(circle, #ffb830 1px, transparent 1px);
                background-size: 24px 24px;
              "
            />

            <h2 class="relative mb-6 flex items-center gap-3 font-display text-lg font-semibold">
              <span class="text-accent-amber text-sm tracking-widest">//</span>
              Nhiệm Vụ Có Sẵn
              <span class="ml-auto font-display text-xs tracking-widest text-text-dim">
                {{ boardQuests.length }} NHIỆM VỤ
              </span>
            </h2>

            <!-- Quest cards grid — styled like papers pinned on board -->
            <div class="relative grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <BountyCard
                v-for="quest in boardQuests"
                :key="quest.uid"
                :quest="quest"
                @accept="handleAccept"
              />
            </div>
          </div>
        </section>
      </div>

      <!-- ════════════════════════════════════════════════════════════════ -->
      <!-- TAB: SHOP -->
      <!-- ════════════════════════════════════════════════════════════════ -->
      <div v-if="activeTab === 'shop'" class="animate-fade-up">
        <!-- Shop header sign -->
        <div class="mb-6 text-center">
          <div
            class="inline-flex items-center gap-3 border border-accent-amber/40 bg-acc-amber/5 px-6 py-3"
          >
            <Icon icon="lucide:store" class="size-5 text-accent-amber" />
            <span class="font-display text-lg font-bold tracking-widest text-accent-amber">
              CỬA HÀNG VẬT PHẨM
            </span>
            <Icon icon="lucide:store" class="size-5 text-accent-amber" />
          </div>
        </div>

        <ShopModal :player="player" :items="SHOP_ITEMS" @buy="handleBuy" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.notif-enter-active,
.notif-leave-active {
  transition: all 0.3s ease;
}
.notif-enter-from {
  opacity: 0;
  transform: translateX(100%);
}
.notif-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style>
