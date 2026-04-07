<script setup lang="ts">
import { computed } from 'vue'
import { useMediaQuery } from '@vueuse/core'
import { Icon } from '@iconify/vue'
import { route02 } from '../utils/route-data'

const props = defineProps<{
  currentStopIndex: number
  layout?: 'auto' | 'horizontal' | 'vertical'
}>()

const stops = computed(() => route02)
const currentStop = computed(() => stops.value[props.currentStopIndex])

const isLg = useMediaQuery('(min-width: 1024px)')

const isVertical = computed(() => {
  if (props.layout === 'horizontal') return false
  if (props.layout === 'vertical') return true
  return isLg.value
})

// For horizontal layout: split into two rows for U-shape
const topRow = computed(() => stops.value.slice(0, 10))
const bottomRow = computed(() => stops.value.slice(10, 20))
const bottomRowReversed = computed(() => [...bottomRow.value].reverse())
</script>

<template>
  <div class="w-full px-3 py-3">
    <!-- Current stop name — prominent -->
    <div class="mb-3" :class="isVertical ? 'text-left' : 'text-center'">
      <span class="text-text-dim font-display text-xs tracking-wider uppercase">
        Điểm dừng {{ currentStopIndex + 1 }}/{{ stops.length }}
      </span>
      <p
        class="font-display text-accent-coral mt-0.5 text-lg font-bold leading-tight tracking-tight lg:text-xl"
      >
        {{ currentStop?.name }}
      </p>
    </div>

    <!-- ========== VERTICAL LAYOUT (sidebar) ========== -->
    <div v-if="isVertical" class="relative max-h-[calc(100vh-200px)] overflow-y-auto pr-1">
      <div class="relative ml-3 border-l-2 border-dashed border-border-default pb-2">
        <div
          v-for="(stop, i) in stops"
          :key="stop.id"
          class="relative flex items-center gap-3 py-1.5 pl-4 transition-all duration-300"
          :class="i === currentStopIndex ? 'pl-3' : ''"
        >
          <!-- Node dot -->
          <div
            class="absolute -left-[7px] rounded-full border-2 transition-all duration-300"
            :class="[
              i < currentStopIndex
                ? 'bg-accent-coral border-accent-coral size-2.5'
                : i === currentStopIndex
                  ? 'border-accent-coral bg-accent-coral size-4 shadow-[0_0_10px_rgba(255,107,74,0.6)]'
                  : 'border-border-default bg-bg-elevated size-2',
            ]"
          />

          <!-- Stop info -->
          <div class="min-w-0 flex-1">
            <div
              class="flex items-center gap-1.5 text-xs transition-all duration-200"
              :class="[
                i < currentStopIndex
                  ? 'text-text-dim'
                  : i === currentStopIndex
                    ? 'text-accent-coral font-display font-semibold text-sm'
                    : 'text-text-secondary',
              ]"
            >
              <span
                class="font-display tabular-nums w-5 shrink-0 text-center text-[10px] opacity-50"
              >
                {{ stop.id }}
              </span>
              <span class="truncate">{{ stop.name }}</span>
              <Icon
                v-if="i === currentStopIndex"
                icon="lucide:map-pin"
                class="text-accent-coral size-3.5 shrink-0 animate-bounce"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ========== HORIZONTAL LAYOUT (mobile / bottom) ========== -->
    <div v-else class="mx-auto max-w-lg">
      <!-- Top row: stops 1-10 (left → right) -->
      <div class="relative flex items-center justify-between px-1">
        <!-- Connection line -->
        <div class="bg-border-default absolute top-1/2 right-1 left-1 h-0.5 -translate-y-1/2" />
        <div
          v-for="(stop, i) in topRow"
          :key="stop.id"
          class="relative z-10 flex flex-col items-center"
        >
          <div
            class="rounded-full border-2 transition-all duration-300"
            :class="[
              i < currentStopIndex
                ? 'bg-accent-coral border-accent-coral size-2.5'
                : i === currentStopIndex
                  ? 'border-accent-coral bg-accent-coral size-4 shadow-[0_0_10px_rgba(255,107,74,0.6)]'
                  : 'border-border-default bg-bg-elevated size-2',
            ]"
          />
          <!-- Label for first stop -->
          <span
            v-if="i === 0"
            class="text-text-dim absolute -bottom-4 text-[7px] leading-tight whitespace-nowrap"
          >
            Bác Cổ
          </span>
        </div>
      </div>

      <!-- Right connector (vertical line between stop 10 and 11) -->
      <div class="flex justify-end px-1">
        <div
          class="h-6 w-0.5"
          :class="currentStopIndex >= 10 ? 'bg-accent-coral' : 'bg-border-default'"
        />
      </div>

      <!-- Bottom row: stops 11-20 (right → left, displayed reversed) -->
      <div class="relative flex items-center justify-between px-1">
        <!-- Connection line -->
        <div class="bg-border-default absolute top-1/2 right-1 left-1 h-0.5 -translate-y-1/2" />
        <div
          v-for="(stop, i) in bottomRowReversed"
          :key="stop.id"
          class="relative z-10 flex flex-col items-center"
        >
          <!-- Actual index in the full route (reversed: leftmost = stop 20, rightmost = stop 11) -->
          <div
            class="rounded-full border-2 transition-all duration-300"
            :class="[
              19 - i < currentStopIndex
                ? 'bg-accent-coral border-accent-coral size-2.5'
                : 19 - i === currentStopIndex
                  ? 'border-accent-coral bg-accent-coral size-4 shadow-[0_0_10px_rgba(255,107,74,0.6)]'
                  : 'border-border-default bg-bg-elevated size-2',
            ]"
          />
          <!-- Label for last stop -->
          <span
            v-if="i === 0"
            class="text-text-dim absolute -bottom-4 text-[7px] leading-tight whitespace-nowrap"
          >
            BX Yên Nghĩa
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
