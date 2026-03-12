<template>
  <transition name="fade">
    <div
      v-if="modelValue"
      class="fixed inset-0 z-[250] flex items-center justify-center bg-bg-deep/80 px-4 backdrop-blur-sm"
    >
      <div
        class="w-full max-w-md border-2 border-accent-sky bg-bg-surface p-6 shadow-[0_0_30px_rgba(56,189,248,0.15)] max-h-[80vh] overflow-y-auto"
      >
        <h2
          class="mb-6 font-display text-2xl font-bold uppercase tracking-widest text-text-primary text-center flex items-center justify-center gap-3"
        >
          <span class="text-accent-sky font-display text-sm tracking-widest">//</span>
          Luật Chơi
        </h2>

        <ul class="list-disc pl-5 space-y-3 text-text-secondary text-sm leading-relaxed">
          <li>
            Súng sẽ nạp một số đạn <strong class="text-red-500 font-bold">THẬT</strong> và
            <strong class="text-blue-500 font-bold">RỖNG</strong> ngẫu nhiên.
          </li>
          <li>
            Đến lượt bạn, chọn bắn
            <strong class="text-text-primary uppercase font-bold">Bản Thân</strong> hoặc
            <strong class="text-text-primary uppercase font-bold">Đối Thủ</strong>.
          </li>
          <li>
            Bắn <strong>BẢN THÂN</strong> bằng đạn
            <strong class="text-blue-500 font-bold">RỖNG</strong> sẽ được giữ lượt.
          </li>
          <li>
            Bắn <strong>ĐỐI THỦ</strong> bằng đạn
            <strong class="text-blue-500 font-bold">RỖNG</strong> sẽ mất lượt.
          </li>
          <li>Người hết sinh mạng trước cược thua mạng sống.</li>
        </ul>

        <h3
          class="mt-6 mb-4 font-display text-lg font-bold uppercase tracking-widest text-accent-amber flex items-center gap-2"
        >
          <span class="text-accent-amber text-sm">//</span>
          Vật Phẩm
        </h3>

        <ul class="space-y-2.5 text-text-secondary text-sm">
          <li class="flex items-start gap-2">
            <Icon icon="game-icons:cigarette" class="text-xl shrink-0 text-white/80" />
            <span
              ><strong class="text-text-primary">Thuốc lá:</strong> Hồi 1 HP cho người sử dụng (có
              thể tăng lên tới 5HP).</span
            >
          </li>
          <li class="flex items-start gap-2">
            <Icon icon="hugeicons:soda-can" class="text-xl shrink-0 text-white/80" />
            <span
              ><strong class="text-text-primary">Bia:</strong> Loại bỏ viên đạn hiện tại trong nòng
              súng ra ngoài mà không bắn.</span
            >
          </li>
          <li class="flex items-start gap-2">
            <Icon icon="noto:magnifying-glass-tilted-left" class="text-xl shrink-0 text-white/80" />
            <span
              ><strong class="text-text-primary">Kính lúp:</strong> Cho người chơi biết viên đạn
              tiếp theo là Thật hay Rỗng.</span
            >
          </li>
          <li class="flex items-start gap-2">
            <Icon icon="game-icons:handcuffs" class="text-xl shrink-0 text-white/80" />
            <span
              ><strong class="text-text-primary">Còng tay:</strong> Khiến đối thủ bị mất lượt tiếp
              theo.</span
            >
          </li>
          <li class="flex items-start gap-2">
            <Icon icon="twemoji:carpentry-saw" class="text-xl shrink-0 text-white/80" />
            <span
              ><strong class="text-text-primary">Cưa sắt:</strong> Cắt nòng súng. Nếu bắn trúng đạn
              thật sẽ gây x2 sát thương. Nếu đạn rỗng, hiệu ứng mất tác dụng.</span
            >
          </li>
        </ul>

        <button
          type="button"
          class="mt-6 w-full border-2 border-border-default bg-transparent px-4 py-3 text-lg font-display font-bold tracking-widest transition hover:bg-border-default hover:text-bg-deep cursor-pointer"
          @click="$emit('update:modelValue', false)"
        >
          ĐÓNG
        </button>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'

defineProps<{
  modelValue: boolean
}>()

defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()
</script>
