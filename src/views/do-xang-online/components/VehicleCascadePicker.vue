<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Icon } from '@iconify/vue'
import {
  DEFAULT_VEHICLE_ID,
  EMPTY_VEHICLE_ID,
  VEHICLE_CATALOG,
  getVehicleById,
  previewSrcForBodyType,
} from '../data/vehicleCatalog'

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [id: string]
}>()

const selectedBrandId = ref('')
const selectedModelId = ref('')

function syncFromVehicleId(id: string) {
  if (id === EMPTY_VEHICLE_ID || !id) {
    return
  }
  const v = getVehicleById(id)
  if (!v) return
  selectedBrandId.value = v.brandId
  selectedModelId.value = v.modelId
}

watch(
  () => props.modelValue,
  (id) => {
    syncFromVehicleId(id)
  },
  { immediate: true },
)

const currentBrand = computed(() => VEHICLE_CATALOG.find((b) => b.id === selectedBrandId.value))

const currentModels = computed(() => currentBrand.value?.models ?? [])

const currentModel = computed(() => currentModels.value.find((m) => m.id === selectedModelId.value))

const currentVariants = computed(() => currentModel.value?.variants ?? [])

const stepHint = computed(() => {
  if (!selectedBrandId.value) return 'Bước 1: chọn hãng xe.'
  if (!selectedModelId.value) return 'Bước 2: chọn dòng xe trong hãng.'
  return 'Bước 3: chọn phiên bản / đời xe.'
})

function selectBrand(brandId: string) {
  selectedBrandId.value = brandId
  selectedModelId.value = ''
  emit('update:modelValue', EMPTY_VEHICLE_ID)
}

function selectModel(modelId: string) {
  selectedModelId.value = modelId
  emit('update:modelValue', EMPTY_VEHICLE_ID)
}

function selectVariant(variantId: string) {
  emit('update:modelValue', variantId)
}

function resetToDefault() {
  emit('update:modelValue', DEFAULT_VEHICLE_ID)
  syncFromVehicleId(DEFAULT_VEHICLE_ID)
}
</script>

<template>
  <section class="mb-6" aria-labelledby="vehicle-heading">
    <div class="flex flex-wrap items-end justify-between gap-3 mb-3">
      <h2
        id="vehicle-heading"
        class="font-display text-base min-[400px]:text-lg font-semibold flex items-center gap-2 sm:gap-3 text-text-primary min-w-0"
      >
        <span class="text-accent-coral text-sm tracking-widest font-display">//</span>
        Phương tiện
      </h2>
      <button
        type="button"
        class="min-h-11 px-3 text-xs font-display tracking-widest uppercase border border-border-default bg-bg-surface text-text-secondary hover:border-accent-coral hover:text-text-primary transition-colors cursor-pointer"
        @click="resetToDefault"
      >
        Mặc định
      </button>
    </div>

    <p class="text-sm text-text-secondary mb-4 leading-relaxed">
      {{ stepHint }}
    </p>
    <p class="text-xs text-text-dim mb-4 leading-relaxed border-l-2 border-accent-amber/50 pl-3">
      Phiên bản minh họa đến
      <span class="text-text-secondary font-medium">2026</span>
      trong danh sách. Ô tô:
      <span class="text-text-secondary">VinFast, Toyota, Kia</span>
      · xe máy: Honda, Yamaha, Suzuki, SYM…
    </p>

    <div class="mb-5">
      <div class="font-display text-xs tracking-widest text-accent-amber mb-2">1 · Hãng xe</div>
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-2" role="listbox" aria-label="Chọn hãng xe">
        <button
          v-for="b in VEHICLE_CATALOG"
          :key="b.id"
          type="button"
          role="option"
          :aria-selected="selectedBrandId === b.id"
          class="min-h-11 border px-3 py-2.5 text-left transition-all duration-200 cursor-pointer flex items-center gap-2"
          :class="
            selectedBrandId === b.id
              ? 'border-accent-coral bg-bg-elevated shadow-[inset_0_0_0_1px_rgba(255,107,74,0.35)]'
              : 'border-border-default bg-bg-surface hover:border-accent-coral/60 hover:bg-bg-elevated'
          "
          @click="selectBrand(b.id)"
        >
          <Icon :icon="b.icon" class="size-5 shrink-0 text-accent-amber" aria-hidden="true" />
          <span class="font-display text-sm font-bold text-text-primary truncate">
            {{ b.name }}
          </span>
        </button>
      </div>
    </div>

    <div v-if="selectedBrandId" class="mb-5 animate-fade-up">
      <div class="font-display text-xs tracking-widest text-accent-amber mb-2">
        2 · Dòng xe ({{ currentBrand?.name }})
      </div>
      <div
        class="grid grid-cols-1 sm:grid-cols-2 gap-2"
        role="listbox"
        :aria-label="`Dòng xe ${currentBrand?.name}`"
      >
        <button
          v-for="m in currentModels"
          :key="m.id"
          type="button"
          role="option"
          :aria-selected="selectedModelId === m.id"
          class="min-h-[3.25rem] border px-3 py-2.5 text-left transition-all duration-200 cursor-pointer flex items-start gap-3"
          :class="
            selectedModelId === m.id
              ? 'border-accent-coral bg-bg-elevated shadow-[inset_0_0_0_1px_rgba(255,107,74,0.35)]'
              : 'border-border-default bg-bg-surface hover:border-accent-coral/60 hover:bg-bg-elevated'
          "
          @click="selectModel(m.id)"
        >
          <Icon
            :icon="m.icon"
            class="size-5 shrink-0 text-accent-amber mt-0.5"
            aria-hidden="true"
          />
          <span class="min-w-0">
            <span class="block font-display text-sm font-bold text-text-primary">
              {{ m.name }}
            </span>
            <span class="block text-[11px] text-text-dim mt-0.5">
              {{ m.variants.length }} phiên bản
            </span>
          </span>
        </button>
      </div>
    </div>

    <div v-if="selectedBrandId && selectedModelId" class="animate-fade-up">
      <div class="font-display text-xs tracking-widest text-accent-amber mb-2">
        3 · Phiên bản / đời ({{ currentModel?.name }})
      </div>
      <div
        class="flex flex-col gap-2"
        role="listbox"
        :aria-label="`Phiên bản ${currentModel?.name}`"
      >
        <button
          v-for="v in currentVariants"
          :key="v.id"
          type="button"
          role="option"
          :aria-selected="modelValue === v.id"
          class="min-h-[3.25rem] w-full border px-3 py-2.5 text-left transition-all duration-200 cursor-pointer flex gap-3 items-start"
          :class="
            modelValue === v.id
              ? 'border-accent-coral bg-bg-elevated shadow-[inset_0_0_0_1px_rgba(255,107,74,0.35)]'
              : 'border-border-default bg-bg-surface hover:border-accent-coral/60 hover:bg-bg-elevated'
          "
          @click="selectVariant(v.id)"
        >
          <img
            v-if="currentModel"
            :src="previewSrcForBodyType(currentModel.bodyType)"
            alt=""
            width="56"
            height="36"
            class="shrink-0 w-14 h-9 object-contain opacity-90 bg-bg-deep/50 border border-border-default/80"
            loading="lazy"
            decoding="async"
          />
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-baseline justify-between gap-2">
              <span class="font-display text-sm font-bold text-text-primary">
                {{ v.yearLabel }}
              </span>
              <span class="text-[11px] text-text-dim font-display tabular-nums">
                {{ v.capacityLiters }}L
              </span>
            </div>
            <p class="text-xs text-text-secondary mt-1 leading-relaxed">
              {{ v.description }}
            </p>
            <p class="text-[10px] text-text-dim mt-1.5 leading-snug">
              Gợi ý ảnh:
              <span class="text-text-secondary">{{ v.imageSearchHint }}</span>
            </p>
          </div>
        </button>
      </div>
    </div>

    <p
      v-if="modelValue && modelValue !== EMPTY_VEHICLE_ID"
      class="mt-4 text-xs text-text-secondary leading-relaxed border-t border-border-default pt-4"
    >
      <span class="font-display font-semibold text-accent-coral">Đang chọn:</span>
      {{ getVehicleById(modelValue)?.name }}
    </p>
    <p
      v-else-if="modelValue === EMPTY_VEHICLE_ID"
      class="mt-4 text-xs text-accent-amber leading-relaxed border-t border-border-default pt-4"
    >
      Chọn phiên bản ở bước 3 để cập nhật khu vực bơm bên phải.
    </p>
  </section>
</template>
