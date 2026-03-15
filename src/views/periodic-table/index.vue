<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  elements,
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  type Element,
  type ElementCategory,
} from './elements'

const hoveredElement = ref<Element | null>(null)
const selectedElement = ref<Element | null>(null)
const activeCategory = ref<ElementCategory | null>(null)

const displayedElement = computed(() => selectedElement.value ?? hoveredElement.value)

function getCellOpacity(el: Element): number {
  if (activeCategory.value && el.category !== activeCategory.value) return 0.2
  return 1
}

let lastTouchTime = 0

function selectElement(el: Element) {
  selectedElement.value = selectedElement.value?.number === el.number ? null : el
}

function onTouchStart(el: Element) {
  lastTouchTime = Date.now()
  selectElement(el)
}

function onClick(el: Element) {
  if (Date.now() - lastTouchTime < 500) return
  selectElement(el)
}

function toggleCategory(cat: ElementCategory) {
  activeCategory.value = activeCategory.value === cat ? null : cat
}
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body px-4 py-8">
    <div class="max-w-[1280px] mx-auto">
      <!-- Header -->
      <h1 class="text-3xl md:text-4xl font-display font-bold text-center mb-2">
        <span class="text-accent-coral">//</span> Bảng Tuần Hoàn Các Nguyên Tố
      </h1>
      <p class="text-text-secondary text-center mb-6 text-sm">
        Di chuột lên nguyên tố để xem chi tiết
      </p>

      <!-- Hovered element info panel -->
      <div
        class="mb-6 border border-border-default bg-bg-surface p-4 min-h-[120px] flex items-center transition-all"
      >
        <template v-if="displayedElement">
          <div
            class="w-20 h-20 flex flex-col items-center justify-center border-2 shrink-0"
            :style="{
              borderColor: CATEGORY_COLORS[displayedElement.category],
              color: CATEGORY_COLORS[displayedElement.category],
            }"
          >
            <span class="text-[10px] leading-none opacity-70">{{ displayedElement.number }}</span>
            <span class="text-2xl font-display font-bold leading-tight">{{
              displayedElement.symbol
            }}</span>
            <span class="text-[9px] leading-none opacity-70">{{ displayedElement.mass }}</span>
          </div>
          <div class="ml-4 flex-1 min-w-0">
            <div class="flex items-baseline gap-2 flex-wrap">
              <span
                class="text-xl font-display font-bold"
                :style="{ color: CATEGORY_COLORS[displayedElement.category] }"
              >
                {{ displayedElement.name }}
              </span>
              <span class="text-text-secondary text-sm">({{ displayedElement.nameVi }})</span>
              <span
                class="text-[10px] px-1.5 py-0.5 border"
                :style="{
                  borderColor: CATEGORY_COLORS[displayedElement.category],
                  color: CATEGORY_COLORS[displayedElement.category],
                }"
              >
                {{ CATEGORY_LABELS[displayedElement.category] }}
              </span>
            </div>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1 mt-2 text-sm">
              <div v-if="displayedElement.electronConfig">
                <span class="text-text-dim">Cấu hình e⁻:</span>
                <span class="ml-1 text-text-primary">{{ displayedElement.electronConfig }}</span>
              </div>
              <div v-if="displayedElement.electronegativity">
                <span class="text-text-dim">Độ âm điện:</span>
                <span class="ml-1 text-text-primary">{{ displayedElement.electronegativity }}</span>
              </div>
              <div v-if="displayedElement.density">
                <span class="text-text-dim">Khối lượng riêng:</span>
                <span class="ml-1 text-text-primary">{{ displayedElement.density }}</span>
              </div>
              <div v-if="displayedElement.meltingPoint">
                <span class="text-text-dim">Nhiệt độ nóng chảy:</span>
                <span class="ml-1 text-text-primary">{{ displayedElement.meltingPoint }}</span>
              </div>
              <div v-if="displayedElement.boilingPoint">
                <span class="text-text-dim">Nhiệt độ sôi:</span>
                <span class="ml-1 text-text-primary">{{ displayedElement.boilingPoint }}</span>
              </div>
              <div v-if="displayedElement.yearDiscovered">
                <span class="text-text-dim">Năm phát hiện:</span>
                <span class="ml-1 text-text-primary">{{ displayedElement.yearDiscovered }}</span>
              </div>
            </div>
          </div>
        </template>
        <template v-else>
          <p class="text-text-dim text-center w-full">
            Di chuột lên một nguyên tố để xem thông tin chi tiết
          </p>
        </template>
      </div>

      <!-- Periodic Table Grid -->
      <div class="overflow-x-auto pb-4">
        <div class="periodic-grid">
          <div
            v-for="el in elements"
            :key="el.number"
            class="element-cell"
            :style="{
              gridRow: el.row,
              gridColumn: el.col,
              '--el-color': CATEGORY_COLORS[el.category],
              opacity: getCellOpacity(el),
            }"
            @mouseenter="hoveredElement = el"
            @mouseleave="hoveredElement = null"
            @click="onClick(el)"
            @touchstart.prevent="onTouchStart(el)"
          >
            <span class="el-number">{{ el.number }}</span>
            <span class="el-symbol">{{ el.symbol }}</span>
            <span class="el-mass">{{ el.mass }}</span>
          </div>

          <!-- Lanthanide / Actinide label placeholders -->
          <div class="element-cell lanthanide-placeholder" :style="{ gridRow: 6, gridColumn: 3 }">
            <span class="el-symbol text-[10px]">57-71</span>
          </div>
          <div class="element-cell actinide-placeholder" :style="{ gridRow: 7, gridColumn: 3 }">
            <span class="el-symbol text-[10px]">89-103</span>
          </div>
        </div>
      </div>

      <!-- Legend -->
      <div class="mt-6 flex flex-wrap gap-2 justify-center">
        <button
          v-for="(label, cat) in CATEGORY_LABELS"
          :key="cat"
          class="flex items-center gap-1.5 px-2.5 py-1 text-xs border transition-all cursor-pointer"
          :class="
            activeCategory === cat ? 'border-current' : 'border-border-default hover:border-current'
          "
          :style="{
            color: CATEGORY_COLORS[cat as ElementCategory],
            opacity: activeCategory && activeCategory !== cat ? 0.3 : 1,
          }"
          @click="toggleCategory(cat as ElementCategory)"
        >
          <span
            class="w-2.5 h-2.5 inline-block"
            :style="{ backgroundColor: CATEGORY_COLORS[cat as ElementCategory] }"
          />
          {{ label }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.periodic-grid {
  display: grid;
  grid-template-columns: repeat(18, minmax(48px, 1fr));
  grid-template-rows: repeat(7, auto) 16px auto auto;
  gap: 2px;
}

.element-cell {
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--el-color, #253549);
  background: #162232;
  cursor: pointer;
  transition: all 0.15s ease;
  position: relative;
  padding: 2px;
  touch-action: manipulation;
}

.element-cell:hover {
  background: color-mix(in srgb, var(--el-color) 25%, #162232);
  border-color: var(--el-color);
  transform: scale(1.15);
  z-index: 10;
  box-shadow: 0 0 12px color-mix(in srgb, var(--el-color) 40%, transparent);
}

.el-number {
  font-size: 9px;
  line-height: 1;
  color: #8b9db5;
}

.el-symbol {
  font-size: 18px;
  font-weight: 700;
  line-height: 1.2;
  color: var(--el-color);
  font-family: var(--font-display);
}

.el-mass {
  font-size: 8px;
  line-height: 1;
  color: #4a6180;
}

.lanthanide-placeholder,
.actinide-placeholder {
  border-style: dashed;
  border-color: #4a6180;
  background: transparent;
}

.lanthanide-placeholder .el-symbol,
.actinide-placeholder .el-symbol {
  color: #8b9db5;
}

@media (max-width: 640px) {
  .periodic-grid {
    grid-template-columns: repeat(18, 36px);
    width: fit-content;
  }

  .el-symbol {
    font-size: 14px;
  }
}
</style>
