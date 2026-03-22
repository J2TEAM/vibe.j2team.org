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

function complexityDots(level: number): string {
  return '●'.repeat(level) + '○'.repeat(5 - level)
}
</script>

<template>
  <div>
    <!-- Category tabs -->
    <div class="flex gap-1 overflow-x-auto pb-2 scrollbar-thin">
      <button
        v-for="cat in ALL_CATEGORIES"
        :key="cat"
        class="flex shrink-0 items-center gap-1.5 border px-3 py-2 text-xs font-display transition-all"
        :class="[
          activeCategory === cat
            ? 'border-accent-coral bg-accent-coral/10 text-accent-coral'
            : isCategoryFilled(cat)
              ? 'border-green-500/30 bg-green-500/10 text-green-400'
              : isRequired(cat)
                ? 'border-accent-amber/30 bg-accent-amber/5 text-accent-amber'
                : 'border-border-default bg-bg-surface text-text-secondary hover:border-text-dim hover:text-text-primary',
        ]"
        @click="activeCategory = cat"
      >
        <Icon :icon="CATEGORY_ICONS[cat]" class="size-3.5" />
        <span class="hidden sm:inline">{{ CATEGORY_LABELS[cat] }}</span>
        <span class="sm:hidden">{{ CATEGORY_LABELS[cat].split(' ')[0] }}</span>
        <Icon v-if="isCategoryFilled(cat)" icon="lucide:check" class="size-3 text-green-400" />
      </button>
    </div>

    <!-- Category description -->
    <div class="mt-3 flex items-center gap-2 text-xs text-text-dim">
      <Icon :icon="CATEGORY_ICONS[activeCategory]" class="size-4" />
      <span>{{ CATEGORY_DESCRIPTIONS[activeCategory] }}</span>
      <span v-if="isRequired(activeCategory)" class="text-accent-amber"> (bắt buộc) </span>
    </div>

    <!-- Tech cards grid -->
    <div class="mt-3 grid gap-3 grid-cols-1 sm:grid-cols-2">
      <button
        v-for="tech in activeTechs"
        :key="tech.id"
        class="group border p-4 text-left transition-all duration-300"
        :class="
          isSelected(tech.id)
            ? 'border-accent-coral bg-accent-coral/5'
            : 'border-border-default bg-bg-surface hover:-translate-y-0.5 hover:border-text-dim hover:bg-bg-elevated'
        "
        @click="handleTechClick(tech)"
      >
        <div class="flex items-start gap-3">
          <!-- Icon -->
          <div
            class="flex size-10 shrink-0 items-center justify-center border"
            :class="
              isSelected(tech.id)
                ? 'border-accent-coral/30 bg-accent-coral/10'
                : 'border-border-default bg-bg-deep'
            "
          >
            <Icon :icon="tech.icon" class="size-5" />
          </div>

          <div class="min-w-0 flex-1">
            <!-- Name + tags -->
            <div class="flex items-center gap-2">
              <h4 class="font-display text-sm font-semibold text-text-primary">
                {{ tech.nameVi }}
              </h4>
              <span
                v-if="tech.tags.includes('hot')"
                class="border border-accent-coral/30 bg-accent-coral/10 px-1 py-0.5 text-[10px] text-accent-coral"
              >
                HOT
              </span>
              <span
                v-if="tech.tags.includes('advanced')"
                class="border border-accent-amber/30 bg-accent-amber/10 px-1 py-0.5 text-[10px] text-accent-amber"
              >
                Nâng cao
              </span>
              <span
                v-if="tech.tags.includes('beginner-friendly')"
                class="border border-accent-sky/30 bg-accent-sky/10 px-1 py-0.5 text-[10px] text-accent-sky"
              >
                Dễ học
              </span>
            </div>

            <!-- Description -->
            <p class="mt-1 text-xs text-text-secondary leading-relaxed">
              {{ tech.description }}
            </p>

            <!-- Complexity + cost -->
            <div class="mt-2 flex items-center gap-4 text-xs text-text-dim">
              <span title="Độ phức tạp">
                {{ complexityDots(tech.complexity) }}
              </span>
              <span v-if="tech.metrics.cost > 0"> ${{ tech.metrics.cost }}/tháng </span>
              <span v-else class="text-green-400">Miễn phí</span>
            </div>
          </div>

          <!-- Check indicator -->
          <div v-if="isSelected(tech.id)" class="shrink-0">
            <Icon icon="lucide:check-circle" class="size-5 text-accent-coral" />
          </div>
        </div>
      </button>
    </div>
  </div>
</template>
