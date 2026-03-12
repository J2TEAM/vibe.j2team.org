<template>
  <transition name="fade">
    <div
      v-if="isIntro"
      class="absolute inset-0 bg-bg-deep/95 flex flex-col items-center justify-start md:justify-center z-[200] backdrop-blur-md px-4 py-16 overflow-y-auto"
    >
      <div class="flex flex-col items-center justify-center min-h-full w-full py-10">
        <h1
          class="font-display text-4xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold mb-4 tracking-tight uppercase drop-shadow-[0_0_20px_rgba(255,107,74,0.3)] text-accent-coral animate-fade-up text-center px-2"
        >
          BUCKSHOT ROULETTE
        </h1>

        <div
          class="mb-10 text-text-primary text-sm md:text-base font-body max-w-lg mx-auto !leading-relaxed text-left animate-fade-up animate-delay-3 p-5 md:p-6 border border-border-default bg-bg-surface/80 shadow-2xl"
        >
          <h3
            class="text-text-primary font-display font-bold text-xl md:text-2xl text-center mb-4 md:mb-6 flex items-center justify-center gap-3"
          >
            <span class="text-accent-amber font-display text-sm tracking-widest">//</span>
            Luật Chơi
          </h3>
          <ul class="list-disc pl-5 space-y-2 md:space-y-3 text-text-secondary">
            <li>
              Súng sẽ nạp một số đạn <strong class="text-red-500 font-bold">THẬT</strong> và
              <strong class="text-blue-500 font-bold">RỖNG</strong> ngẫu nhiên.
            </li>
            <li>
              Đến lượt bạn, chọn bắn
              <strong class="text-text-primary uppercase font-bold text-xs md:text-sm"
                >Bản Thân</strong
              >
              hoặc
              <strong class="text-text-primary uppercase font-bold text-xs md:text-sm"
                >Đối Thủ</strong
              >.
            </li>
            <li>
              Bắn <strong>BẢN THÂN</strong> bằng đạn
              <strong class="text-blue-500 font-bold">RỖNG</strong> sẽ được giữ lượt.
            </li>
            <li>
              Bắn <strong>ĐỐI THỦ</strong> bằng đạn
              <strong class="text-blue-500 font-bold">RỖNG</strong> sẽ mất lượt.
            </li>
            <li>
              Sử dụng <strong class="text-accent-amber font-bold">VẬT PHẨM</strong> chiến thuật để
              tạo lợi thế: Thuốc lá, Bia, Kính lúp, Còng tay, Cưa sắt.
            </li>
            <li>Người hết sinh mạng trước cược thua mạng sống.</li>
          </ul>
        </div>

        <!-- Lựa chọn độ khó AI khi bắt đầu -->
        <div
          class="mb-8 w-full max-w-lg mx-auto flex flex-col items-center animate-fade-up animate-delay-3"
        >
          <p class="text-xs font-display tracking-widest text-text-dim mb-4 uppercase">
            CHỌN ĐỘ KHÓ AI
          </p>
          <div class="flex gap-2 w-full">
            <button
              v-for="opt in difficultyOptions"
              :key="'intro-' + opt.value"
              type="button"
              class="flex-1 border px-2 py-3 text-center font-display text-xs md:text-sm tracking-wider transition-all duration-300 cursor-pointer"
              :class="
                modelValue === opt.value
                  ? 'border-accent-amber bg-accent-amber/15 text-accent-amber shadow-[0_0_15px_rgba(255,184,48,0.15)]'
                  : 'border-border-default bg-bg-deep text-text-secondary hover:border-text-dim hover:text-text-primary'
              "
              @click="$emit('update:modelValue', opt.value)"
            >
              <span class="block font-bold uppercase">{{ opt.label }}</span>
            </button>
          </div>
        </div>

        <div class="flex gap-4 animate-fade-up animate-delay-4 shrink-0 pb-10">
          <button
            @click="$emit('enterGame')"
            class="group relative px-10 md:px-12 py-4 md:py-5 bg-transparent border-2 border-accent-coral text-accent-coral text-lg md:text-xl font-display font-bold transition-all duration-300 hover:bg-accent-coral hover:text-bg-deep hover:shadow-[0_0_30px_rgba(255,107,74,0.5)] tracking-widest cursor-pointer"
          >
            <span class="relative z-10">VÀO GAME</span>
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import type { AIDifficulty } from '../composables/useAI'

defineProps<{
  isIntro: boolean
  modelValue: AIDifficulty
  difficultyOptions: readonly {
    readonly value: AIDifficulty
    readonly label: string
    readonly desc: string
  }[]
}>()

defineEmits<{
  (e: 'update:modelValue', value: AIDifficulty): void
  (e: 'enterGame'): void
}>()
</script>
