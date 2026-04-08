<template>
  <div
    class="min-h-screen bg-bg-deep text-text-primary font-body flex flex-col items-center py-8 px-4"
  >
    <!-- Header -->
    <header class="w-full max-w-3xl flex justify-between items-center mb-8 animate-fade-up">
      <div>
        <h1
          class="font-display text-3xl sm:text-4xl font-bold text-text-primary flex items-center gap-3"
        >
          <span class="text-accent-sky font-display text-lg tracking-widest">//</span>
          Chỉ Số Đường Huyết
        </h1>
        <p class="text-text-secondary text-sm mt-1">
          Tra cứu GI/GL thực phẩm Việt Nam — so sánh và gợi ý thay thế
        </p>
      </div>
      <RouterLink
        to="/"
        class="inline-flex items-center gap-2 border border-border-default bg-bg-surface px-4 py-2 text-sm text-text-secondary transition hover:border-accent-sky hover:text-text-primary"
      >
        &larr; Trang chủ
      </RouterLink>
    </header>

    <!-- Loading -->
    <div v-if="loading" class="text-text-dim text-sm py-20">Đang tải dữ liệu...</div>

    <template v-else>
      <!-- GI Scale Info -->
      <div class="w-full max-w-3xl grid grid-cols-3 gap-3 mb-6 animate-fade-up animate-delay-1">
        <div class="border border-border-default bg-bg-surface p-3 text-center">
          <div class="text-sm font-display font-semibold" style="color: #22c55e">GI ≤ 55</div>
          <div class="text-text-dim text-xs mt-1">Thấp — An toàn</div>
        </div>
        <div class="border border-border-default bg-bg-surface p-3 text-center">
          <div class="text-sm font-display font-semibold" style="color: #ffb830">GI 56–69</div>
          <div class="text-text-dim text-xs mt-1">Trung bình</div>
        </div>
        <div class="border border-border-default bg-bg-surface p-3 text-center">
          <div class="text-sm font-display font-semibold" style="color: #ff6b4a">GI ≥ 70</div>
          <div class="text-text-dim text-xs mt-1">Cao — Hạn chế</div>
        </div>
      </div>

      <!-- Tab Navigation -->
      <div
        class="w-full max-w-3xl flex border-b border-border-default mb-6 animate-fade-up animate-delay-2"
      >
        <button
          v-for="tab in tabs"
          :key="tab.id"
          class="flex items-center gap-2 px-4 py-3 text-sm font-display tracking-wide transition-colors border-b-2 -mb-px"
          :class="
            activeTab === tab.id
              ? 'border-accent-sky text-accent-sky'
              : 'border-transparent text-text-dim hover:text-text-secondary'
          "
          @click="activeTab = tab.id"
        >
          <Icon :icon="tab.icon" class="size-4" />
          {{ tab.label }}
        </button>
      </div>

      <div class="w-full max-w-3xl animate-fade-up animate-delay-3">
        <!-- Search Tab -->
        <div v-if="activeTab === 'search'">
          <!-- Search + Filter -->
          <div class="border border-border-default bg-bg-surface p-4 mb-4">
            <div class="flex gap-3 mb-4">
              <div class="flex-1 relative">
                <Icon
                  icon="lucide:search"
                  class="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-dim"
                />
                <input
                  v-model="searchQuery"
                  type="text"
                  placeholder="Tìm thực phẩm..."
                  class="w-full bg-bg-deep border border-border-default pl-10 pr-3 py-2.5 text-text-primary text-sm focus:outline-none focus:border-accent-sky transition-colors placeholder:text-text-dim/50"
                />
              </div>
              <select
                v-model="filterGI"
                class="bg-bg-deep border border-border-default px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent-sky"
              >
                <option value="all">Tất cả GI</option>
                <option value="low">GI thấp</option>
                <option value="medium">GI TB</option>
                <option value="high">GI cao</option>
              </select>
            </div>

            <!-- Group Filter -->
            <div class="flex flex-wrap gap-2">
              <button
                class="px-2.5 py-1.5 text-xs font-display border transition-all"
                :class="
                  filterGroup === 'all'
                    ? 'border-accent-sky text-accent-sky bg-bg-elevated'
                    : 'border-border-default text-text-dim hover:text-text-secondary'
                "
                @click="filterGroup = 'all'"
              >
                Tất cả
              </button>
              <button
                v-for="g in FOOD_GROUPS"
                :key="g.key"
                class="flex items-center gap-1 px-2.5 py-1.5 text-xs font-display border transition-all"
                :class="
                  filterGroup === g.key
                    ? 'border-accent-sky text-accent-sky bg-bg-elevated'
                    : 'border-border-default text-text-dim hover:text-text-secondary'
                "
                @click="filterGroup = g.key"
              >
                <Icon :icon="g.icon" class="size-3" />
                {{ g.label }}
              </button>
            </div>
          </div>

          <!-- Results -->
          <div class="text-text-dim text-xs font-display tracking-wide mb-3">
            {{ filteredFoods.length }} kết quả
          </div>

          <div class="space-y-2">
            <div
              v-for="food in filteredFoods"
              :key="food.name"
              class="border border-border-default bg-bg-surface p-4 hover:border-accent-sky/30 transition-colors cursor-pointer"
              @click="toggleCompare(food)"
            >
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-2">
                  <span class="font-display text-sm font-semibold">{{ food.name }}</span>
                  <span class="text-xs text-text-dim">({{ getGroupLabel(food.group) }})</span>
                </div>
                <div class="flex items-center gap-3">
                  <div
                    class="px-2 py-0.5 text-xs font-display font-bold"
                    :style="{
                      color: getGIColor(food.gi),
                      backgroundColor: getGIColor(food.gi) + '15',
                    }"
                  >
                    GI {{ food.gi }}
                  </div>
                  <button
                    class="text-xs transition-colors"
                    :class="
                      isFavorite(food.name)
                        ? 'text-accent-amber'
                        : 'text-text-dim hover:text-accent-amber'
                    "
                    @click.stop="toggleFavorite(food.name)"
                  >
                    <Icon
                      :icon="isFavorite(food.name) ? 'lucide:star' : 'lucide:star'"
                      class="size-4"
                      :class="isFavorite(food.name) ? 'fill-accent-amber' : ''"
                    />
                  </button>
                </div>
              </div>

              <div class="flex items-center gap-4 text-xs text-text-dim">
                <span>Carbs: {{ food.carbs }}g / {{ food.serving }}g</span>
                <span
                  >GL:
                  <span :style="{ color: getGLColor(calcGL(food.gi, food.carbs)) }">{{
                    calcGL(food.gi, food.carbs)
                  }}</span>
                  ({{ getGLLabel(calcGL(food.gi, food.carbs)) }})</span
                >
                <span v-if="food.alt" class="text-accent-sky"> → Thay bằng: {{ food.alt }} </span>
              </div>

              <!-- GL Calculator inline -->
              <div
                v-if="expandedFood === food.name"
                class="mt-3 pt-3 border-t border-border-default"
                @click.stop
              >
                <label class="text-text-dim text-xs font-display tracking-wide mb-1.5 block">
                  TÍNH GL THEO KHẨU PHẦN (gram):
                </label>
                <div class="flex items-center gap-3">
                  <input
                    v-model.number="customServing"
                    type="number"
                    min="1"
                    class="w-24 bg-bg-deep border border-border-default px-3 py-1.5 text-text-primary text-sm text-center focus:outline-none focus:border-accent-sky"
                  />
                  <span class="text-text-secondary text-sm">
                    GL =
                    <span
                      class="font-display font-bold"
                      :style="{ color: getGLColor(calcCustomGL(food)) }"
                    >
                      {{ calcCustomGL(food) }}
                    </span>
                    ({{ getGLLabel(calcCustomGL(food)) }})
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Compare Tab -->
        <div v-if="activeTab === 'compare'">
          <div
            v-if="compareList.length < 2"
            class="border border-border-default bg-bg-surface p-8 text-center"
          >
            <Icon icon="lucide:git-compare-arrows" class="size-8 text-text-dim mx-auto mb-3" />
            <p class="text-text-secondary text-sm mb-2">Chọn 2–3 thực phẩm để so sánh</p>
            <p class="text-text-dim text-xs">
              Click vào thực phẩm trong tab Tra cứu để thêm vào so sánh
            </p>
          </div>

          <div v-else>
            <div class="flex gap-2 mb-4 flex-wrap">
              <span
                v-for="name in compareList"
                :key="name"
                class="flex items-center gap-1.5 px-3 py-1.5 border border-accent-sky/30 bg-accent-sky/5 text-accent-sky text-xs font-display"
              >
                {{ name }}
                <button
                  class="hover:text-accent-coral transition-colors"
                  @click="removeCompare(name)"
                >
                  <Icon icon="lucide:x" class="size-3" />
                </button>
              </span>
              <button
                class="text-xs text-text-dim hover:text-accent-coral transition-colors font-display"
                @click="compareList = []"
              >
                Xóa tất cả
              </button>
            </div>

            <!-- Comparison Table -->
            <div class="border border-border-default bg-bg-surface overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="border-b border-border-default">
                    <th class="text-left p-3 text-text-dim font-display text-xs tracking-wide">
                      CHỈ SỐ
                    </th>
                    <th
                      v-for="name in compareList"
                      :key="name"
                      class="p-3 text-center font-display text-sm font-semibold text-text-primary"
                    >
                      {{ name }}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr class="border-b border-border-default">
                    <td class="p-3 text-text-dim text-xs font-display">GI</td>
                    <td
                      v-for="name in compareList"
                      :key="name"
                      class="p-3 text-center font-display font-bold text-lg"
                      :style="{ color: getGIColor(getFood(name)?.gi ?? 0) }"
                    >
                      {{ getFood(name)?.gi ?? '—' }}
                    </td>
                  </tr>
                  <tr class="border-b border-border-default">
                    <td class="p-3 text-text-dim text-xs font-display">PHÂN LOẠI</td>
                    <td
                      v-for="name in compareList"
                      :key="name"
                      class="p-3 text-center text-xs font-display"
                      :style="{ color: getGIColor(getFood(name)?.gi ?? 0) }"
                    >
                      {{ getGILabel(getFood(name)?.gi ?? 0) }}
                    </td>
                  </tr>
                  <tr class="border-b border-border-default">
                    <td class="p-3 text-text-dim text-xs font-display">CARBS (g)</td>
                    <td
                      v-for="name in compareList"
                      :key="name"
                      class="p-3 text-center text-text-secondary"
                    >
                      {{ getFood(name)?.carbs ?? '—' }}g
                    </td>
                  </tr>
                  <tr class="border-b border-border-default">
                    <td class="p-3 text-text-dim text-xs font-display">KHẨU PHẦN (g)</td>
                    <td
                      v-for="name in compareList"
                      :key="name"
                      class="p-3 text-center text-text-secondary"
                    >
                      {{ getFood(name)?.serving ?? '—' }}g
                    </td>
                  </tr>
                  <tr class="border-b border-border-default">
                    <td class="p-3 text-text-dim text-xs font-display">GL</td>
                    <td
                      v-for="name in compareList"
                      :key="name"
                      class="p-3 text-center font-display font-bold"
                      :style="{
                        color: getGLColor(
                          calcGL(getFood(name)?.gi ?? 0, getFood(name)?.carbs ?? 0),
                        ),
                      }"
                    >
                      {{ calcGL(getFood(name)?.gi ?? 0, getFood(name)?.carbs ?? 0) }}
                    </td>
                  </tr>
                  <tr>
                    <td class="p-3 text-text-dim text-xs font-display">THAY THẾ</td>
                    <td
                      v-for="name in compareList"
                      :key="name"
                      class="p-3 text-center text-accent-sky text-xs"
                    >
                      {{ getFood(name)?.alt || '—' }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Favorites Tab -->
        <div v-if="activeTab === 'favorites'">
          <div v-if="favoriteFoods.length > 0" class="space-y-2">
            <div
              v-for="food in favoriteFoods"
              :key="food.name"
              class="border border-border-default bg-bg-surface p-4 hover:border-accent-amber/30 transition-colors"
            >
              <div class="flex items-center justify-between mb-1">
                <span class="font-display text-sm font-semibold">{{ food.name }}</span>
                <div class="flex items-center gap-2">
                  <span
                    class="px-2 py-0.5 text-xs font-display font-bold"
                    :style="{
                      color: getGIColor(food.gi),
                      backgroundColor: getGIColor(food.gi) + '15',
                    }"
                  >
                    GI {{ food.gi }}
                  </span>
                  <button
                    class="text-accent-amber hover:text-accent-coral transition-colors"
                    @click="toggleFavorite(food.name)"
                  >
                    <Icon icon="lucide:star-off" class="size-4" />
                  </button>
                </div>
              </div>
              <div class="text-xs text-text-dim">
                Carbs: {{ food.carbs }}g | GL: {{ calcGL(food.gi, food.carbs) }}
                <span v-if="food.alt"> | Thay: {{ food.alt }}</span>
              </div>
            </div>
          </div>
          <div v-else class="border border-border-default bg-bg-surface p-8 text-center">
            <Icon icon="lucide:star" class="size-8 text-text-dim mx-auto mb-3" />
            <p class="text-text-secondary text-sm">Chưa có thực phẩm yêu thích</p>
            <p class="text-text-dim text-xs mt-1">Nhấn ★ trong tab Tra cứu để lưu</p>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import { Icon } from '@iconify/vue'
import type { FoodItem, FoodGroup } from './types'
import {
  FOOD_GROUPS,
  getGIColor,
  getGILabel,
  calcGL,
  getGLLabel,
  getGLColor,
  getGILevel,
} from './types'

// === Data ===
const foods = ref<FoodItem[]>([])
const loading = ref(true)

onMounted(async () => {
  try {
    const res = await fetch('/glycemic-index/foods.json')
    foods.value = await res.json()
  } catch {
    foods.value = []
  }
  loading.value = false
})

// === Tabs ===
const tabs = [
  { id: 'search' as const, label: 'Tra cứu', icon: 'lucide:search' },
  { id: 'compare' as const, label: 'So sánh', icon: 'lucide:git-compare-arrows' },
  { id: 'favorites' as const, label: 'Yêu thích', icon: 'lucide:star' },
]
type TabId = 'search' | 'compare' | 'favorites'
const activeTab = ref<TabId>('search')

// === Search ===
const searchQuery = ref('')
const filterGI = ref<'all' | 'low' | 'medium' | 'high'>('all')
const filterGroup = ref<FoodGroup | 'all'>('all')
const expandedFood = ref('')
const customServing = ref(100)

const filteredFoods = computed(() => {
  let result = foods.value

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter((f) => f.name.toLowerCase().includes(q))
  }

  if (filterGI.value !== 'all') {
    result = result.filter((f) => getGILevel(f.gi) === filterGI.value)
  }

  if (filterGroup.value !== 'all') {
    result = result.filter((f) => f.group === filterGroup.value)
  }

  return result.sort((a, b) => a.gi - b.gi)
})

function toggleCompare(food: FoodItem) {
  if (expandedFood.value === food.name) {
    expandedFood.value = ''
    return
  }
  expandedFood.value = food.name
  customServing.value = food.serving

  if (compareList.value.includes(food.name)) return
  if (compareList.value.length >= 3) {
    compareList.value.shift()
  }
  compareList.value.push(food.name)
}

function calcCustomGL(food: FoodItem): number {
  const carbsForCustom = (food.carbs / food.serving) * customServing.value
  return Math.round((food.gi * carbsForCustom) / 100)
}

function getGroupLabel(group: FoodGroup): string {
  return FOOD_GROUPS.find((g) => g.key === group)?.label ?? group
}

// === Compare ===
const compareList = ref<string[]>([])

function removeCompare(name: string) {
  compareList.value = compareList.value.filter((n) => n !== name)
}

function getFood(name: string): FoodItem | undefined {
  return foods.value.find((f) => f.name === name)
}

// === Favorites ===
const favorites = useLocalStorage<string[]>('glycemic-index-favorites', [])

function isFavorite(name: string): boolean {
  return favorites.value.includes(name)
}

function toggleFavorite(name: string) {
  if (isFavorite(name)) {
    favorites.value = favorites.value.filter((n) => n !== name)
  } else {
    favorites.value = [...favorites.value, name]
  }
}

const favoriteFoods = computed(() => {
  return foods.value.filter((f) => favorites.value.includes(f.name))
})
</script>
