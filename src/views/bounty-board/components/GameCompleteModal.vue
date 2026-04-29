<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { RouterLink } from 'vue-router'
import type { PlayerState } from '../types'

defineProps<{
  player: PlayerState
}>()

const emit = defineEmits<{
  continue: []
  reset: []
}>()
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-[300] flex items-center justify-center p-4"
      style="background: rgba(0, 0, 0, 0.93); backdrop-filter: blur(10px)"
    >
      <!-- Ambient glow -->
      <div
        class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none opacity-20"
        style="background: radial-gradient(circle, #ffb830 0%, transparent 70%)"
      />

      <div class="relative w-full max-w-2xl mx-auto text-center">
        <!-- Crown ornament -->
        <div class="flex items-center gap-4 justify-center mb-8">
          <div class="h-px flex-1 bg-gradient-to-r from-transparent via-accent-amber/60 to-accent-amber/60" />
          <Icon icon="lucide:crown" class="size-8 text-accent-amber" />
          <div class="h-px flex-1 bg-gradient-to-l from-transparent via-accent-amber/60 to-accent-amber/60" />
        </div>

        <!-- Badge -->
        <div class="font-display text-xs tracking-[0.5em] text-accent-amber/60 mb-4 uppercase">
          Ngươi đã làm điều không tưởng
        </div>

        <!-- Main title -->
        <h1
          class="font-display font-black tracking-widest leading-none mb-4"
          style="
            font-size: clamp(4rem, 18vw, 8rem);
            background: linear-gradient(135deg, #ffb830 0%, #ff6b35 50%, #ffb830 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          "
        >
          PHÁ ĐẢO
        </h1>

        <p class="font-display text-xl text-accent-amber tracking-widest mb-2">
          🏆 BẤT TỬ THẬT SỰ 🏆
        </p>
        <p class="text-text-secondary mb-10">
          Đạt <span class="text-accent-amber font-bold text-lg">3600 EXP</span> —
          Không có nhiều người làm được điều này.
        </p>

        <!-- Stats -->
        <div class="border border-accent-amber/30 bg-accent-amber/5 p-6 mb-8">
          <div class="font-display text-[10px] tracking-[0.3em] text-accent-amber/50 mb-5 text-center">
            — THÀNH TÍCH CỦA NGƯƠI —
          </div>
          <div class="grid grid-cols-4 gap-6">
            <div class="text-center">
              <div class="font-display text-3xl font-black text-accent-amber mb-1">{{ player.exp }}</div>
              <div class="text-[10px] text-text-dim font-display tracking-wider">TỔNG EXP</div>
            </div>
            <div class="text-center">
              <div class="font-display text-3xl font-black text-yellow-400 mb-1">{{ player.gold }}</div>
              <div class="text-[10px] text-text-dim font-display tracking-wider">VÀNG CÒN</div>
            </div>
            <div class="text-center">
              <div class="font-display text-3xl font-black text-accent-coral mb-1">{{ player.completedCount }}</div>
              <div class="text-[10px] text-text-dim font-display tracking-wider">NV HOÀN</div>
            </div>
            <div class="text-center">
              <div class="font-display text-3xl font-black text-red-400 mb-1">{{ player.maxHp }}</div>
              <div class="text-[10px] text-text-dim font-display tracking-wider">MÁU TỐI ĐA</div>
            </div>
          </div>
        </div>

        <!-- Action buttons -->
        <div class="grid grid-cols-2 gap-5 mb-4">
          <button
            class="flex flex-col items-center gap-3 border-2 border-accent-amber bg-accent-amber/10 px-6 py-7 font-display tracking-wide transition hover:bg-accent-amber/20 group"
            @click="emit('continue')"
          >
            <Icon
              icon="lucide:infinity"
              class="size-8 text-accent-amber group-hover:scale-125 transition-transform duration-300"
            />
            <span class="text-base text-accent-amber font-bold tracking-widest">CHƠI TIẾP</span>
            <span class="text-xs text-text-dim">Giữ lại nhân vật &amp; tiến độ</span>
          </button>

          <button
            class="flex flex-col items-center gap-3 border-2 border-accent-coral bg-accent-coral/10 px-6 py-7 font-display tracking-wide transition hover:bg-accent-coral/20 group"
            @click="emit('reset')"
          >
            <Icon
              icon="lucide:rotate-ccw"
              class="size-8 text-accent-coral group-hover:rotate-180 transition-transform duration-500"
            />
            <span class="text-base text-accent-coral font-bold tracking-widest">BẮT ĐẦU LẠI</span>
            <span class="text-xs text-text-dim">Reset toàn bộ từ đầu</span>
          </button>
        </div>

        <!-- Home button -->
        <RouterLink
          to="/"
          class="flex items-center justify-center gap-2 border border-border-default bg-bg-surface/30 px-6 py-3 font-display text-sm tracking-widest text-text-secondary transition hover:border-accent-amber/50 hover:text-accent-amber"
        >
          <Icon icon="lucide:home" class="size-4" />
          VỀ TRANG CHỦ
        </RouterLink>

        <!-- Bottom -->
        <div class="flex items-center gap-4 justify-center mt-8">
          <div class="h-px flex-1 bg-accent-amber/20" />
          <span class="font-display text-[10px] tracking-widest text-text-dim">SS RANK · BẤT TỬ · 3600 EXP</span>
          <div class="h-px flex-1 bg-accent-amber/20" />
        </div>
      </div>
    </div>
  </Teleport>
</template>
