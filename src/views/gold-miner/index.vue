<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { Icon } from '@iconify/vue'
import { useGameLogic } from './composables/useGameLogic'
import { GAME_WIDTH, GAME_HEIGHT, TOP_BAR_HEIGHT } from './constants'

const {
  mode,
  level,
  lives,
  score,
  targetScore,
  timeLeft,
  isGameOver,
  isBroken,
  isStarted,
  showInstructions,
  isShowPenalty,
  hookAngle,
  hookLength,
  hookPos,
  items,
  caughtItem,
  shoot,
  retryLevel,
  selectMode,
  confirmStart,
  quitGame,
} = useGameLogic()

const container = ref<HTMLElement | null>(null)

function handleKeyDown(e: KeyboardEvent) {
  if (e.code === 'Space' || e.code === 'ArrowDown') {
    shoot()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body flex flex-col items-center py-8">
    <!-- Header/HUD -->
    <div class="w-full max-w-6xl flex justify-between items-end px-6 mb-4 animate-fade-up">
      <div class="flex items-center gap-4">
        <button
          v-if="isStarted"
          @click="quitGame"
          class="p-2 hover:bg-bg-elevated transition-colors border border-border-default cursor-pointer"
          title="Quay lại menu"
        >
          <Icon icon="lucide:arrow-left" class="size-6 text-text-secondary" />
        </button>
        <div>
          <h1 class="font-display text-2xl font-bold text-accent-coral uppercase tracking-tighter">
            // Game đào vàng
          </h1>
          <div
            v-if="isStarted"
            class="text-xs text-text-dim uppercase tracking-widest flex items-center gap-3"
          >
            <span>
              Mode: <span class="text-accent-amber">{{ mode }}</span>
              <span v-if="mode === 'level'" class="ml-2"
                >Level: <span class="text-accent-sky">{{ level }}</span></span
              >
            </span>
          </div>
        </div>
      </div>

      <div v-if="isStarted" class="flex gap-6 items-end font-display">
        <div v-if="mode === 'level'" class="flex flex-col items-end">
          <span class="text-[10px] text-text-dim tracking-widest uppercase">Target</span>
          <span class="text-lg font-bold text-text-primary tabular-nums">{{ targetScore }}</span>
        </div>
        <div class="flex flex-col items-end">
          <span class="text-[10px] text-text-dim tracking-widest uppercase">Score</span>
          <span class="text-3xl font-bold text-accent-amber tabular-nums">{{ score }}</span>
        </div>
        <div v-if="mode === 'level'" class="flex flex-col items-end relative">
          <span class="text-[10px] text-text-dim tracking-widest uppercase">Time</span>
          <span
            class="text-3xl font-bold text-accent-sky tabular-nums"
            :class="{ 'text-accent-coral animate-pulse': timeLeft < 10 }"
            >{{ timeLeft }}s</span
          >

          <!-- Penalty Indicator -->
          <Transition name="penalty">
            <div
              v-if="isShowPenalty"
              class="absolute -bottom-4 right-0 text-accent-coral font-display font-black text-xl pointer-events-none z-50 text-shadow-glow"
            >
              -2s
            </div>
          </Transition>
        </div>
        <div v-if="mode === 'level'" class="flex flex-col items-end h-[52px] justify-center ml-2">
          <div class="flex gap-1">
            <Icon
              v-for="n in 3"
              :key="n"
              icon="lucide:heart"
              class="size-5 transition-colors"
              :class="n <= lives ? 'text-accent-coral' : 'text-text-dim'"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Game Stage Area -->
    <div
      ref="container"
      class="relative border border-border-default bg-[#2d1b0d] overflow-hidden shadow-2xl animate-fade-up animate-delay-2"
      :style="{ width: `${GAME_WIDTH}px`, height: `${GAME_HEIGHT}px` }"
      @click="shoot"
    >
      <!-- Background/Sky area -->
      <div
        class="absolute top-0 w-full bg-[#87ceeb]/10 border-b border-white/5"
        :style="{ height: `${TOP_BAR_HEIGHT}px` }"
      >
        <!-- Miner visual simplified -->
        <div
          class="absolute bottom-0 left-1/2 -translate-x-1/2 mb-2 transition-transform"
          :class="{ 'scale-110': caughtItem }"
        >
          <Icon icon="lucide:user" class="size-16 text-accent-amber" />
        </div>
      </div>

      <!-- Konva Stage -->
      <v-stage :config="{ width: GAME_WIDTH, height: GAME_HEIGHT }">
        <v-layer>
          <!-- Items -->
          <v-group v-for="item in items" :key="item.id">
            <v-circle
              v-if="!item.isCollected || caughtItem?.id === item.id"
              :config="{
                x: item.x,
                y: item.y,
                radius: item.radius,
                fill:
                  item.type === 'gold'
                    ? '#ffd700'
                    : item.type === 'diamond'
                      ? '#b9f2ff'
                      : item.type === 'stone'
                        ? '#888'
                        : item.type === 'tnt'
                          ? '#ff4d4d'
                          : '#d2b48c',
                stroke: item.type === 'tnt' ? '#000' : 'rgba(0,0,0,0.5)',
                strokeWidth: item.type === 'tnt' ? 3 : 2,
                shadowColor: 'black',
                shadowBlur: 5,
                shadowOffset: { x: 2, y: 2 },
                shadowOpacity: 0.3,
              }"
            />
          </v-group>

          <!-- Hook/Line -->
          <v-line
            :config="{
              points: [
                hookPos.x,
                hookPos.y,
                hookPos.x + Math.sin(hookAngle) * hookLength,
                hookPos.y + Math.cos(hookAngle) * hookLength,
              ],
              stroke: isBroken ? 'transparent' : '#ccc',
              strokeWidth: 2,
              dash: isBroken ? [5, 5] : [],
            }"
          />

          <!-- Hook Head -->
          <v-circle
            :config="{
              x: hookPos.x + Math.sin(hookAngle) * hookLength,
              y: hookPos.y + Math.cos(hookAngle) * hookLength,
              radius: 8,
              fill: isBroken ? '#ff4d4d' : '#666',
              stroke: '#333',
              strokeWidth: 2,
            }"
          />
        </v-layer>
      </v-stage>

      <!-- Start Screen / Mode Selection -->
      <div
        v-if="!isStarted && !showInstructions"
        @click.stop
        class="absolute inset-0 bg-bg-deep/95 z-40 flex flex-col items-center justify-center p-8 text-center"
      >
        <div class="mb-12 animate-fade-up">
          <Icon icon="lucide:pickaxe" class="size-24 text-accent-amber mx-auto mb-6" />
          <h2
            class="font-display text-6xl font-black text-accent-coral tracking-tighter mb-2 italic text-slate-100"
          >
            GOLD MINER
          </h2>
          <p class="text-text-secondary uppercase tracking-[0.3em] font-display text-sm">
            J2TEAM COMMUNITY EDITION
          </p>
        </div>

        <div
          class="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl animate-fade-up animate-delay-2"
        >
          <button
            @click="selectMode('classic')"
            class="group relative border border-border-default bg-bg-surface p-8 transition-all hover:border-accent-amber hover:bg-bg-elevated cursor-pointer"
          >
            <span
              class="absolute top-2 right-4 text-accent-amber/10 text-4xl font-black italic select-none"
              >01</span
            >
            <h3
              class="font-display text-2xl font-bold text-accent-amber mb-2 group-hover:translate-x-1 transition-transform tracking-tight"
            >
              CLASSIC
            </h3>
            <p class="text-xs text-text-dim uppercase tracking-widest leading-relaxed">
              Vô tận, không giới hạn thời gian qua màn.
            </p>
          </button>
          <button
            @click="selectMode('level')"
            class="group relative border border-border-default bg-bg-surface p-8 transition-all hover:border-accent-sky hover:bg-bg-elevated cursor-pointer"
          >
            <span
              class="absolute top-2 right-4 text-accent-sky/10 text-4xl font-black italic select-none"
              >02</span
            >
            <h3
              class="font-display text-2xl font-bold text-accent-sky mb-2 group-hover:translate-x-1 transition-transform tracking-tight"
            >
              LEVEL
            </h3>
            <p class="text-xs text-text-dim uppercase tracking-widest leading-relaxed">
              Chế độ vượt ải. Tính mạng, thời gian và mục tiêu.
            </p>
          </button>
        </div>
      </div>

      <!-- Instruction Dialog -->
      <div
        v-if="showInstructions"
        @click.stop
        class="absolute inset-0 bg-bg-deep/95 z-40 flex items-center justify-center p-8 animate-fade-in"
      >
        <div
          class="w-full max-w-2xl border border-border-default bg-bg-surface p-10 relative overflow-hidden"
        >
          <div
            class="absolute -right-12 -top-12 border border-border-default/20 w-48 h-48 rotate-45 pointer-events-none"
          ></div>

          <div class="relative z-10 flex flex-col items-center">
            <h3
              class="font-display text-4xl font-black text-accent-amber italic tracking-tighter mb-8 self-start"
            >
              // HƯỚNG DẪN NHIỆM VỤ ({{ mode.toUpperCase() }})
            </h3>

            <div class="grid grid-cols-1 gap-6 mb-12">
              <div class="flex gap-4 group">
                <div
                  class="size-12 bg-accent-coral/10 border border-accent-coral/20 flex items-center justify-center flex-shrink-0 group-hover:bg-accent-coral group-hover:text-bg-deep transition-all duration-300"
                >
                  <Icon icon="lucide:zap" class="size-6" />
                </div>
                <div>
                  <h4
                    class="font-display font-bold text-accent-coral mb-1 uppercase tracking-tighter"
                  >
                    Cơ chế kéo mới
                  </h4>
                  <p class="text-sm text-text-secondary leading-snug">
                    Khác với bản gốc, bạn phải
                    <span class="text-accent-amber font-bold italic">click chuột liên tục</span> để
                    kéo vật phẩm nặng lên. Click càng nhanh, lực kéo càng mạnh!
                  </p>
                </div>
              </div>

              <div class="flex gap-4 group">
                <div
                  class="size-12 bg-accent-amber/10 border border-accent-amber/20 flex items-center justify-center flex-shrink-0 group-hover:bg-accent-amber group-hover:text-bg-deep transition-all duration-300"
                >
                  <Icon icon="lucide:anchor" class="size-6" />
                </div>
                <div>
                  <h4
                    class="font-display font-bold text-accent-amber mb-1 uppercase tracking-tighter"
                  >
                    Cẩn thận đứt dây
                  </h4>
                  <p class="text-sm text-text-secondary leading-snug">
                    Vật càng nặng thì áp lực lên dây càng lớn. Kéo quá nhanh hoặc vượt quá sức chịu
                    đựng sẽ làm <span class="text-accent-coral font-bold italic">đứt dây</span>.
                  </p>
                </div>
              </div>

              <div v-if="mode === 'level'" class="flex gap-4 group">
                <div
                  class="size-12 bg-accent-sky/10 border border-accent-sky/20 flex items-center justify-center flex-shrink-0 group-hover:bg-accent-sky group-hover:text-bg-deep transition-all duration-300"
                >
                  <Icon icon="lucide:target" class="size-6" />
                </div>
                <div>
                  <h4
                    class="font-display font-bold text-accent-sky mb-1 uppercase tracking-tighter"
                  >
                    Mục tiêu cấp độ
                  </h4>
                  <p class="text-sm text-text-secondary leading-snug">
                    Mỗi vật phẩm trượt sẽ bị
                    <span class="text-accent-coral font-bold italic">phạt -2 giây</span>. Hãy ngắm
                    bắn chính xác!
                  </p>
                </div>
              </div>

              <div v-else class="flex gap-4 group">
                <div
                  class="size-12 bg-accent-sky/10 border border-accent-sky/20 flex items-center justify-center flex-shrink-0 group-hover:bg-accent-sky group-hover:text-bg-deep transition-all duration-300"
                >
                  <Icon icon="lucide:infinite" class="size-6" />
                </div>
                <div>
                  <h4
                    class="font-display font-bold text-accent-sky mb-1 uppercase tracking-tighter"
                  >
                    Chế độ cổ điển
                  </h4>
                  <p class="text-sm text-text-secondary leading-snug">
                    Không giới hạn thời gian, không giới hạn mục tiêu. Chỉ có bạn và những thỏi vàng
                    khổng lồ!
                  </p>
                </div>
              </div>
            </div>

            <div class="flex gap-4 w-full">
              <button
                @click="confirmStart"
                class="flex-1 py-5 bg-accent-amber text-bg-deep font-display font-black text-2xl hover:bg-white transition-colors cursor-pointer tracking-widest italic"
              >
                BẮT ĐẦU CHƠI
              </button>
              <button
                @click="quitGame"
                class="px-8 border border-border-default hover:border-accent-coral hover:text-accent-coral transition-colors cursor-pointer"
              >
                HỦY
              </button>
            </div>
          </div>

          <!-- Decorative labels -->
          <div
            class="absolute bottom-4 right-6 text-[10px] text-text-dim/20 font-display tracking-[0.5em] uppercase pointer-events-none"
          >
            instruction_v2.0_stable
          </div>
        </div>
      </div>

      <!-- Game Overlay (Start/GameOver) -->
      <div
        v-if="isGameOver"
        @click.stop
        class="absolute inset-0 bg-bg-deep/90 flex flex-col items-center justify-center z-50 animate-fade-in"
      >
        <h2 class="font-display text-6xl font-black text-accent-coral mb-4 tracking-tighter">
          GAME OVER
        </h2>
        <div class="text-center mb-8">
          <p class="text-text-secondary text-sm uppercase tracking-widest mb-1">Final Score</p>
          <p class="text-5xl font-bold text-accent-amber tabular-nums">{{ score }}</p>
        </div>
        <div class="flex gap-4">
          <button
            class="px-10 py-4 bg-accent-amber text-bg-deep font-display font-black text-xl hover:scale-105 transition-transform cursor-pointer tracking-widest italic"
            @click="retryLevel"
          >
            CHƠI LẠI
          </button>
          <button
            class="px-10 py-4 border border-border-default text-text-primary font-display font-black text-xl hover:bg-bg-elevated transition-all cursor-pointer tracking-widest"
            @click="quitGame"
          >
            MENU CHÍNH
          </button>
        </div>
      </div>

      <!-- Broken Line Feedback -->
      <div
        v-if="isBroken"
        class="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-center pointer-events-none z-10 animate-bounce"
      >
        <div
          class="bg-accent-coral text-bg-deep font-display font-bold px-4 py-2 text-xl rotate-[-5deg] z-50 shadow-xl"
        >
          DÂY BỊ ĐỨT!!!
        </div>
      </div>

      <!-- Manual Pulling Prompt -->
      <div
        v-if="caughtItem && !isBroken"
        class="absolute inset-x-0 bottom-32 flex flex-col items-center justify-center pointer-events-none z-10 animate-pulse"
      >
        <div
          class="bg-bg-elevated/80 border border-accent-sky text-accent-sky px-4 py-2 font-display font-bold uppercase tracking-widest flex items-center gap-3 shadow-lg"
        >
          <Icon icon="lucide:mouse" class="size-6" />
          Click liên tục để kéo!
        </div>
        <div
          class="mt-2 text-[10px] text-text-dim uppercase tracking-tighter bg-bg-deep/50 px-2 py-1"
        >
          Trọng lượng: {{ caughtItem.weight }}x
        </div>
      </div>

      <div
        class="absolute bottom-4 right-4 text-text-dim text-[10px] font-display tracking-widest uppercase"
      >
        Space: Thả dây / Click liên tục: Kéo dây
      </div>
    </div>
  </div>
</template>

<style scoped>
:deep(.konvajs-content) {
  cursor: crosshair;
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.animate-fade-in {
  animation: fade-in 0.3s ease-out;
}
</style>
