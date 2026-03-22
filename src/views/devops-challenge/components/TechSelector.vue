<script setup lang="ts">
import { ref, computed } from 'vue'
import { Icon } from '@iconify/vue'
import type { TechCategory, TechProfile } from '../types'
import { CATEGORY_LABELS, CATEGORY_ICONS, CATEGORY_DESCRIPTIONS } from '../types'
import { techsByCategory, ALL_CATEGORIES } from '../data/technologies'

const props = defineProps<{
  selectedTechs: Map<TechCategory, string>
  requiredCategories: TechCategory[]
}>()

const emit = defineEmits<{
  select: [category: TechCategory, techId: string]
  deselect: [category: TechCategory]
}>()

const activeCategory = ref<TechCategory>('frontend')

const activeTechs = computed<TechProfile[]>(() => {
  return techsByCategory[activeCategory.value] ?? []
})

function isSelected(techId: string): boolean {
  return props.selectedTechs.get(activeCategory.value) === techId
}

function isRequired(category: TechCategory): boolean {
  return props.requiredCategories.includes(category)
}

function isCategoryFilled(category: TechCategory): boolean {
  return props.selectedTechs.has(category)
}

function handleTechClick(tech: TechProfile) {
  if (isSelected(tech.id)) {
    emit('deselect', tech.category)
  } else {
    emit('select', tech.category, tech.id)
  }
}

function complexityBar(level: number): { filled: number; total: number } {
  return { filled: level, total: 5 }
}
</script>

<template>
  <div>
    <!-- Category tabs - horizontal scrollable -->
    <div class="relative">
      <div class="flex gap-1.5 overflow-x-auto pb-2 scrollbar-thin">
        <button
          v-for="cat in ALL_CATEGORIES"
          :key="cat"
          class="group flex shrink-0 items-center gap-1.5 border px-2.5 sm:px-3 py-2 text-[11px] sm:text-xs font-display transition-all duration-200 active:scale-95"
          :class="[
            activeCategory === cat
              ? 'border-accent-coral bg-accent-coral/10 text-accent-coral shadow-sm shadow-accent-coral/10'
              : isCategoryFilled(cat)
                ? 'border-green-500/40 bg-green-500/10 text-green-400'
                : isRequired(cat)
                  ? 'border-accent-amber/30 bg-accent-amber/5 text-accent-amber hover:bg-accent-amber/10'
                  : 'border-border-default bg-bg-surface text-text-dim hover:border-text-dim hover:text-text-secondary hover:bg-bg-elevated',
          ]"
          @click="activeCategory = cat"
        >
          <Icon :icon="CATEGORY_ICONS[cat]" class="size-3.5" />
          <span class="hidden sm:inline">{{ CATEGORY_LABELS[cat] }}</span>
          <span class="sm:hidden">{{ CATEGORY_LABELS[cat].split(' ')[0] }}</span>
          <Icon v-if="isCategoryFilled(cat)" icon="lucide:check" class="size-3 text-green-400" />
          <span
            v-else-if="isRequired(cat) && activeCategory !== cat"
            class="size-1.5 bg-accent-amber"
          />
        </button>
      </div>
    </div>

    <!-- Category info bar -->
    <div class="mt-3 flex items-center gap-2 border border-border-default bg-bg-surface px-3 py-2">
      <Icon :icon="CATEGORY_ICONS[activeCategory]" class="size-4 text-accent-sky" />
      <span class="flex-1 text-xs text-text-secondary">{{
        CATEGORY_DESCRIPTIONS[activeCategory]
      }}</span>
      <span
        v-if="isRequired(activeCategory)"
        class="border border-accent-amber/30 bg-accent-amber/5 px-1.5 py-0.5 text-[10px] font-display text-accent-amber"
      >
        Bắt buộc
      </span>
      <span v-else class="text-[10px] text-text-dim"> Tùy chọn </span>
    </div>

    <!-- Tech cards grid -->
    <div class="mt-3 grid gap-3 grid-cols-1 sm:grid-cols-2">
      <button
        v-for="tech in activeTechs"
        :key="tech.id"
        class="group relative border p-3 sm:p-4 text-left transition-all duration-300 overflow-hidden"
        :class="
          isSelected(tech.id)
            ? 'border-accent-coral bg-accent-coral/5 shadow-md shadow-accent-coral/5'
            : 'border-border-default bg-bg-surface hover:-translate-y-0.5 hover:border-text-dim hover:bg-bg-elevated hover:shadow-md active:scale-[0.99]'
        "
        @click="handleTechClick(tech)"
      >
        <!-- Selected indicator -->
        <div
          v-if="isSelected(tech.id)"
          class="absolute left-0 top-0 h-full w-0.5 bg-accent-coral"
        />

        <div class="flex items-start gap-3">
          <!-- Icon -->
          <div
            class="flex size-10 sm:size-11 shrink-0 items-center justify-center border transition-colors"
            :class="
              isSelected(tech.id)
                ? 'border-accent-coral/30 bg-accent-coral/10'
                : 'border-border-default bg-bg-deep group-hover:border-text-dim/30'
            "
          >
            <Icon :icon="tech.icon" class="size-5" />
          </div>

          <div class="min-w-0 flex-1">
            <!-- Name + tags -->
            <div class="flex flex-wrap items-center gap-1.5">
              <h4 class="font-display text-sm font-bold text-text-primary">
                {{ tech.nameVi }}
              </h4>
              <span
                v-if="tech.tags.includes('hot')"
                class="border border-accent-coral/30 bg-accent-coral/10 px-1 py-0.5 text-[9px] font-display font-bold text-accent-coral"
              >
                HOT
              </span>
              <span
                v-if="tech.tags.includes('advanced')"
                class="border border-accent-amber/30 bg-accent-amber/10 px-1 py-0.5 text-[9px] font-display text-accent-amber"
              >
                PRO
              </span>
              <span
                v-if="tech.tags.includes('beginner-friendly')"
                class="border border-green-500/30 bg-green-500/10 px-1 py-0.5 text-[9px] font-display text-green-400"
              >
                EZ
              </span>
            </div>

            <!-- Description -->
            <p class="mt-1 text-[11px] sm:text-xs text-text-secondary leading-relaxed line-clamp-2">
              {{ tech.description }}
            </p>

            <!-- Stats row -->
            <div class="mt-2 flex items-center gap-3 text-[11px] text-text-dim">
              <!-- Complexity dots -->
              <span class="flex items-center gap-0.5" title="Độ phức tạp">
                <span
                  v-for="d in complexityBar(tech.complexity).total"
                  :key="d"
                  class="inline-block size-1.5"
                  :class="
                    d <= complexityBar(tech.complexity).filled
                      ? 'bg-accent-amber'
                      : 'bg-text-dim/20'
                  "
                />
              </span>
              <span class="text-border-default">|</span>
              <span v-if="tech.metrics.cost > 0" class="tabular-nums">
                ${{ tech.metrics.cost }}/th
              </span>
              <span v-else class="text-green-400">Free</span>
            </div>
          </div>

          <!-- Check indicator -->
          <div
            v-if="isSelected(tech.id)"
            class="flex size-6 shrink-0 items-center justify-center border border-accent-coral bg-accent-coral/20"
          >
            <Icon icon="lucide:check" class="size-3.5 text-accent-coral" />
          </div>
        </div>
      </button>
    </div>
  </div>
</template>
