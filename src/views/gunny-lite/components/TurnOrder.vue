<script setup lang="ts">
import { ref } from 'vue'
import { Icon } from '@iconify/vue'
import type { Character } from '../types'

const props = defineProps<{
  turnOrder: Character[]
  activeCharId: number
}>()

const showHelp = ref(false)
</script>

<template>
  <div
    class="flex justify-center items-center gap-1 px-2 py-1 bg-bg-surface border border-border-default"
  >
    <div
      v-for="char in props.turnOrder"
      :key="char.id"
      class="flex items-center gap-1 px-2 py-1 border transition-all duration-300"
      :class="
        char.id === props.activeCharId
          ? 'border-accent-coral bg-bg-elevated text-text-primary'
          : 'border-border-default text-text-secondary'
      "
    >
      <span class="w-3 h-3 inline-block" :style="{ backgroundColor: char.color }" />
      <span class="font-display text-xs">{{ char.name }}</span>
      <span class="font-display text-xs text-text-dim tabular-nums">
        {{ Math.round(char.delayAccum - (props.turnOrder[0]?.delayAccum ?? 0)) }}
      </span>
    </div>

    <button class="cursor-pointer relative" @click="showHelp = !showHelp">
      <Icon
        icon="mdi:question-mark-circle"
        class="text-text-secondary hover:text-text-primary transition-colors"
      />
    </button>

    <Transition name="popup">
      <div
        v-if="showHelp"
        class="absolute right-1/2 top-18 translate-x-1/2 z-50 w-72 bg-bg-elevated border border-border-default p-3 text-left shadow-lg"
        @click.stop
      >
        <button
          class="absolute top-2 right-2 text-text-dim hover:text-text-primary transition-colors"
          @click="showHelp = false"
        >
          <Icon icon="lucide:x" class="size-3.5" />
        </button>

        <p class="font-display text-xs font-bold text-accent-coral mb-2">// Thứ tự lượt</p>
        <p class="text-xs text-text-secondary mb-3">
          Nhân vật có <span class="text-text-primary font-semibold">chỉ số trễ (delay)</span> thấp
          nhất sẽ hành động trước. Sau mỗi lượt, delay của nhân vật đó tăng lên và danh sách được
          sắp xếp lại.
        </p>

        <p class="font-display text-xs font-bold text-accent-amber mb-2">// Công thức tính delay</p>
        <div
          class="bg-bg-surface border border-border-default p-2 mb-2 font-mono text-xs text-text-primary"
        >
          Delay = (D<sub>vũ khí</sub> + D<sub>vật phẩm</sub>) × (1 − AGI / 500)
        </div>
        <ul class="text-xs text-text-secondary space-y-1">
          <li>
            <span class="text-text-primary">D vũ khí</span> — delay cơ bản của vũ khí đang dùng
          </li>
          <li>
            <span class="text-text-primary">D vật phẩm</span> — tổng delay cộng thêm từ buff đã chọn
          </li>
          <li><span class="text-text-primary">AGI</span> — nhanh nhẹn; AGI = 250 giảm 50% delay</li>
        </ul>

        <p class="font-display text-xs font-bold text-accent-sky mt-3 mb-1">// Số hiển thị</p>
        <p class="text-xs text-text-secondary">
          Con số bên cạnh tên là <span class="text-text-primary">khoảng cách delay</span> so với
          nhân vật đứng đầu (= 0). Số càng to thì càng phải chờ lâu hơn.
        </p>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.popup-enter-active,
.popup-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}
.popup-enter-from,
.popup-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
