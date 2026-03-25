<!-- KeyCap.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from '@iconify/vue'

interface KeyInfo {
  code: string
  label: string
  sub?: string
  width?: string
  height?: string
  gridArea?: string
  isIcon?: boolean
  isKnob?: boolean
  isDisabled?: boolean
}

const props = defineProps<{
  info: KeyInfo
  isPressed: boolean
  isRegistered: boolean
  os: string
  primaryColor: string
}>()

const gridAreaClasses = computed(() =>
  props.info.gridArea ? props.info.gridArea.split(' ').filter(Boolean) : [],
)

const displayLabel = computed(() => {
  if (props.os === 'MAC') {
    switch (props.info.code) {
      case 'MetaLeft':
      case 'MetaRight':
        return 'CMD'
      case 'AltLeft':
      case 'AltRight':
        return 'OPT'
      case 'Backspace':
        return 'DELETE'
      case 'Enter':
        return 'RETURN'
    }
  }
  return props.info.label
})

const iconMap: Record<string, string> = {
  Up: 'lucide:arrow-up',
  Down: 'lucide:arrow-down',
  Left: 'lucide:arrow-left',
  Right: 'lucide:arrow-right',
}
</script>

<template>
  <!-- Knob -->
  <div v-if="info.isKnob" :class="gridAreaClasses" class="flex justify-center w-12 h-12">
    <div
      class="size-10 rounded-full border-2 flex items-center justify-center transition-all duration-150"
      :style="{
        borderColor: primaryColor,
        boxShadow: `0 0 8px ${primaryColor}55`,
        background: `radial-gradient(circle at 40% 35%, #2a3a4a, #0d1a26)`,
      }"
    >
      <div class="size-2 rounded-full" :style="{ backgroundColor: primaryColor }" />
    </div>
  </div>

  <!-- Normal Key -->
  <div
    v-else
    :class="[
      ...gridAreaClasses,
      // Width: nếu không có gridArea (flex item) thì dùng w-10 mặc định
      !info.gridArea && !info.width ? 'w-10' : '',
      info.width ?? '',
      info.isDisabled ? 'opacity-30 cursor-not-allowed' : 'cursor-default',
    ]"
    class="relative select-none shrink-0"
  >
    <div
      class="relative w-full flex flex-col items-center justify-center border rounded-[3px] text-[10px] font-display tracking-wide uppercase transition-all duration-75 overflow-hidden"
      :class="[info.height === 'h-full' ? 'h-full' : 'h-10']"
      :style="
        isPressed
          ? {
              borderColor: primaryColor,
              backgroundColor: `color-mix(in srgb, ${primaryColor} 25%, #0d1a26)`,
              boxShadow: `0 0 12px ${primaryColor}88, inset 0 0 8px ${primaryColor}44`,
              color: primaryColor,
              transform: 'translateY(2px) scale(0.97)',
              filter: `drop-shadow(0 0 6px ${primaryColor})`,
            }
          : isRegistered
            ? {
                borderColor: `color-mix(in srgb, ${primaryColor} 60%, transparent)`,
                backgroundColor: `color-mix(in srgb, ${primaryColor} 8%, #111c2a)`,
                color: `color-mix(in srgb, ${primaryColor} 80%, #ffffff)`,
                boxShadow: `0 0 4px ${primaryColor}33`,
              }
            : {
                borderColor: '#2d4a63',
                backgroundColor: '#111c2a',
                color: '#aabbcc',
              }
      "
    >
      <!-- Glow overlay khi pressed -->
      <div
        v-if="isPressed"
        class="absolute inset-0 pointer-events-none rounded-[3px]"
        :style="{
          background: `radial-gradient(ellipse at center, ${primaryColor}33 0%, transparent 70%)`,
        }"
      />

      <!-- Sub label -->
      <span
        v-if="info.sub"
        class="absolute top-[3px] right-[5px] text-[8px] leading-none opacity-60"
      >
        {{ info.sub }}
      </span>

      <!-- Icon -->
      <Icon
        v-if="info.isIcon && iconMap[info.label]"
        :icon="iconMap[info.label] ?? ''"
        class="size-3.5"
      />

      <!-- Text label -->
      <span
        v-else-if="!info.isIcon"
        class="text-[10px] leading-none font-display tracking-wide px-1 text-center"
        :class="info.sub ? 'mt-1' : ''"
      >
        {{ displayLabel }}
      </span>
    </div>
  </div>
</template>
