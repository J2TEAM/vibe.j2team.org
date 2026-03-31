<script setup lang="ts">
import { ref, computed } from 'vue'
import { Icon } from '@iconify/vue'
import { useInventory } from './composables/useInventory'
import { RARITY_COLORS, OE_ICON, type HextechDrop, type ItemDefinition, type Rarity } from './data'

const {
  orangeEssence,
  shards,
  permanents,
  openChest,
  disenchant,
  upgrade,
  reroll,
  getCost,
  ownsItem,
  ITEMS,
} = useInventory()

// State
const activeTab = ref<'skins' | 'wards' | 'permanents' | 'collection'>('skins')
const selectedForReroll = ref<string[]>([])
const recentDrop = ref<HextechDrop | null>(null)
const selectedCollectionItem = ref<ItemDefinition | null>(null)
const isOpening = ref(false)

const handleOpenChest = () => {
  if (isOpening.value) return
  isOpening.value = true
  recentDrop.value = null

  // Fake delay for animation
  setTimeout(() => {
    recentDrop.value = openChest()
    isOpening.value = false
  }, 800)
}

const toggleRerollSelection = (uid: string) => {
  const idx = selectedForReroll.value.indexOf(uid)
  if (idx > -1) {
    selectedForReroll.value.splice(idx, 1)
  } else if (selectedForReroll.value.length < 3) {
    selectedForReroll.value.push(uid)
  }
}

const executeReroll = () => {
  if (selectedForReroll.value.length === 3) {
    const newSkin = reroll([
      selectedForReroll.value[0] as string,
      selectedForReroll.value[1] as string,
      selectedForReroll.value[2] as string,
    ])
    selectedForReroll.value = []
    if (newSkin) {
      recentDrop.value = { type: 'Skin', item: newSkin }
    }
  }
}

const handleDisenchant = (uid: string) => {
  disenchant(uid)
  // Remove from reroll if selected
  const idx = selectedForReroll.value.indexOf(uid)
  if (idx > -1) selectedForReroll.value.splice(idx, 1)
}

const handleUpgrade = (uid: string) => {
  upgrade(uid)
  // Remove from reroll if selected
  const idx = selectedForReroll.value.indexOf(uid)
  if (idx > -1) selectedForReroll.value.splice(idx, 1)
}

const skinsShards = computed(() => shards.value.filter((s) => s.item.type === 'Skin'))
const wardsShards = computed(() => shards.value.filter((s) => s.item.type === 'Ward'))

const displayList = computed(() => {
  if (activeTab.value === 'skins') return skinsShards.value
  if (activeTab.value === 'wards') return wardsShards.value
  return permanents.value // collection doesn't use this directly
})

const getRarityText = (rarity: string) => {
  const vnMap: Record<string, string> = {
    Common: 'Thường',
    Rare: 'Hiếm',
    Epic: 'Sử Thi',
    Legendary: 'Huyền Thoại',
    Ultimate: 'Tối Thượng',
  }
  return vnMap[rarity] || rarity
}

const skinsCollection = computed(() => ITEMS.filter((i) => i.type === 'Skin'))
const wardsCollection = computed(() => ITEMS.filter((i) => i.type === 'Ward'))

const ownedSkinsCount = computed(() => skinsCollection.value.filter((i) => ownsItem(i.id)).length)
const ownedWardsCount = computed(() => wardsCollection.value.filter((i) => ownsItem(i.id)).length)
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body pb-20">
    <!-- Header -->
    <header class="sticky top-0 z-10 border-b border-border-default bg-bg-surface/80 backdrop-blur">
      <div class="container mx-auto px-4 h-16 flex items-center justify-between">
        <div class="flex items-center gap-4">
          <RouterLink
            to="/"
            class="flex items-center gap-2 text-text-secondary hover:text-accent-coral transition-colors"
          >
            <Icon icon="lucide:arrow-left" class="size-5" />
            <span class="font-display font-bold">Trang chủ</span>
          </RouterLink>
          <div class="h-6 w-px bg-border-default mx-2"></div>
          <h1 class="font-display font-bold text-xl tracking-tight flex items-center gap-2">
            <Icon icon="lucide:box" class="text-accent-coral size-6" />
            Hextech Opener
          </h1>
        </div>

        <div class="flex items-center gap-2 bg-bg-deep border border-border-default px-4 py-2">
          <Icon :icon="OE_ICON" class="text-orange-400 size-5" />
          <span class="font-bold font-display text-orange-400">{{ orangeEssence }}</span>
        </div>
      </div>
    </header>

    <main class="container mx-auto px-4 py-8 space-y-12">
      <!-- Chest Opening Area -->
      <section
        class="flex flex-col items-center justify-center py-12 border border-border-default bg-bg-surface animate-fade-up"
      >
        <h2 class="font-display text-2xl font-bold mb-8">
          <span class="text-accent-coral mr-2">//</span>
          Mở rương Hextech
        </h2>

        <div class="relative group cursor-pointer" @click="handleOpenChest">
          <div
            class="absolute -inset-4 bg-accent-coral/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          ></div>
          <div
            class="w-32 h-32 bg-bg-elevated border border-border-default flex items-center justify-center relative z-10 hover:border-accent-coral transition-colors duration-300"
            :class="{ 'animate-pulse': isOpening }"
          >
            <Icon icon="lucide:package-open" class="size-16 text-accent-coral" v-if="!isOpening" />
            <Icon icon="lucide:loader-2" class="size-10 text-accent-coral animate-spin" v-else />
          </div>
        </div>
        <p class="mt-4 text-text-secondary font-display text-sm">
          Nhấn để mở rương (Tỉ lệ: 60% Trang phục, 20% Mẫu Mắt, 20% Tinh Hoa Cam)
        </p>

        <!-- Drop Result -->
        <div
          v-if="recentDrop"
          class="mt-8 p-6 border border-accent-amber/30 bg-accent-amber/5 animate-fade-up flex flex-col items-center text-center"
        >
          <p class="text-text-secondary text-sm mb-2 uppercase font-bold tracking-widest">
            Bạn nhận được
          </p>
          <template v-if="recentDrop.type === 'OrangeEssence'">
            <div class="flex items-center justify-center gap-3">
              <Icon :icon="OE_ICON" class="size-10 text-orange-400" />
              <span class="font-display text-4xl font-bold text-orange-400"
                >+{{ recentDrop.amount }} Tinh Hoa</span
              >
            </div>
          </template>
          <template v-else-if="recentDrop.item">
            <div class="w-full max-w-sm">
              <div
                class="h-48 bg-gradient-to-br flex items-center justify-center border border-border-default overflow-hidden relative"
                :class="RARITY_COLORS[recentDrop.item.rarity]"
              >
                <Icon
                  :icon="recentDrop.item.type === 'Skin' ? 'lucide:shirt' : 'lucide:eye'"
                  class="size-16 text-white/40 absolute z-0 group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              <div class="p-4 border border-t-0 border-border-default bg-bg-deep">
                <h3 class="font-display font-bold text-xl">{{ recentDrop.item.name }}</h3>
                <p class="text-text-secondary text-sm">
                  {{ recentDrop.item.type === 'Skin' ? 'Trang Phục' : 'Mẫu Mắt' }}
                  {{ getRarityText(recentDrop.item.rarity) }}
                </p>
              </div>
            </div>
          </template>
        </div>
      </section>

      <!-- Inventory Section -->
      <section class="animate-fade-up animate-delay-2">
        <div class="flex items-center justify-between mb-6">
          <h2 class="font-display text-2xl font-bold">
            <span class="text-accent-coral mr-2">//</span>
            Kho Đồ
          </h2>
          <div class="flex border border-border-default p-1 bg-bg-surface">
            <button
              @click="activeTab = 'skins'"
              class="px-4 py-2 font-display font-bold text-sm transition-colors"
              :class="
                activeTab === 'skins'
                  ? 'bg-bg-elevated text-accent-coral border border-border-default'
                  : 'text-text-secondary hover:text-text-primary'
              "
            >
              Mảnh Trang Phục ({{ skinsShards.length }})
            </button>
            <button
              @click="activeTab = 'wards'"
              class="px-4 py-2 font-display font-bold text-sm transition-colors"
              :class="
                activeTab === 'wards'
                  ? 'bg-bg-elevated text-accent-coral border border-border-default'
                  : 'text-text-secondary hover:text-text-primary'
              "
            >
              Mảnh Mẫu Mắt ({{ wardsShards.length }})
            </button>
            <button
              @click="activeTab = 'permanents'"
              class="px-4 py-2 font-display font-bold text-sm transition-colors border-l border-border-default"
              :class="
                activeTab === 'permanents'
                  ? 'bg-bg-elevated text-accent-coral border border-border-default'
                  : 'text-text-secondary hover:text-text-primary'
              "
            >
              Đã Sở Hữu ({{ permanents.length }})
            </button>
            <button
              @click="activeTab = 'collection'"
              class="px-4 py-2 font-display font-bold text-sm transition-colors border-l border-border-default flex items-center gap-1"
              :class="
                activeTab === 'collection'
                  ? 'bg-bg-elevated text-accent-coral border border-border-default'
                  : 'text-text-secondary hover:text-text-primary'
              "
            >
              <Icon icon="lucide:library" class="size-4" /> Bách Khoa
            </button>
          </div>
        </div>

        <!-- Collection View -->
        <div v-if="activeTab === 'collection'" class="space-y-12">
          <!-- Skins -->
          <div class="space-y-4">
            <div class="flex items-center justify-between border-b border-border-default pb-2">
              <h3 class="font-display text-xl font-bold flex items-center gap-2">
                <Icon icon="lucide:shirt" class="text-accent-coral" />
                Tất Cả Trang Phục
              </h3>
              <span class="text-text-secondary"
                >Đã sở hữu:
                <strong class="text-text-primary"
                  >{{ ownedSkinsCount }} / {{ skinsCollection.length }}</strong
                ></span
              >
            </div>
            <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
              <div
                v-for="item in skinsCollection"
                :key="item.id"
                class="border bg-bg-surface flex flex-col overflow-hidden relative group transition-colors cursor-pointer hover:border-accent-coral"
                :class="
                  ownsItem(item.id)
                    ? 'border-accent-coral'
                    : 'border-border-default opacity-60 grayscale hover:grayscale-0 hover:opacity-100'
                "
                @click="selectedCollectionItem = item"
              >
                <!-- Visual -->
                <div
                  class="h-28 bg-gradient-to-br flex items-center justify-center relative overflow-hidden"
                  :class="RARITY_COLORS[item.rarity]"
                >
                  <Icon
                    icon="lucide:shirt"
                    class="size-10 text-white/40 absolute z-0 group-hover:scale-110 transition-transform duration-500"
                  />
                  <!-- Locked / Unowned overlay -->
                  <div
                    v-if="!ownsItem(item.id)"
                    class="absolute inset-0 bg-bg-deep/50 flex items-center justify-center z-20 backdrop-blur-[1px]"
                  >
                    <Icon icon="lucide:lock" class="size-8 text-text-secondary/50" />
                  </div>
                </div>
                <!-- Info -->
                <div class="p-3 text-center">
                  <h3 class="font-display font-bold text-xs truncate" :title="item.name">
                    {{ item.name }}
                  </h3>
                  <p
                    class="text-text-secondary text-[10px] uppercase tracking-wider mt-1"
                    :class="ownsItem(item.id) ? 'text-accent-coral' : ''"
                  >
                    {{ ownsItem(item.id) ? 'Đã sở hữu' : getRarityText(item.rarity) }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Wards -->
          <div class="space-y-4">
            <div class="flex items-center justify-between border-b border-border-default pb-2">
              <h3 class="font-display text-xl font-bold flex items-center gap-2">
                <Icon icon="lucide:eye" class="text-accent-coral" />
                Tất Cả Mẫu Mắt
              </h3>
              <span class="text-text-secondary"
                >Đã sở hữu:
                <strong class="text-text-primary"
                  >{{ ownedWardsCount }} / {{ wardsCollection.length }}</strong
                ></span
              >
            </div>
            <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
              <div
                v-for="item in wardsCollection"
                :key="item.id"
                class="border bg-bg-surface flex flex-col overflow-hidden relative group transition-colors cursor-pointer hover:border-accent-amber"
                :class="
                  ownsItem(item.id)
                    ? 'border-accent-amber'
                    : 'border-border-default opacity-60 grayscale hover:grayscale-0 hover:opacity-100'
                "
                @click="selectedCollectionItem = item"
              >
                <!-- Visual -->
                <div
                  class="h-28 bg-gradient-to-br flex items-center justify-center relative overflow-hidden"
                  :class="RARITY_COLORS[item.rarity]"
                >
                  <Icon
                    icon="lucide:eye"
                    class="size-10 text-white/40 absolute z-0 group-hover:scale-110 transition-transform duration-500"
                  />
                  <!-- Locked / Unowned overlay -->
                  <div
                    v-if="!ownsItem(item.id)"
                    class="absolute inset-0 bg-bg-deep/50 flex items-center justify-center z-20 backdrop-blur-[1px]"
                  >
                    <Icon icon="lucide:lock" class="size-8 text-text-secondary/50" />
                  </div>
                </div>
                <!-- Info -->
                <div class="p-3 text-center">
                  <h3 class="font-display font-bold text-xs truncate" :title="item.name">
                    {{ item.name }}
                  </h3>
                  <p
                    class="text-text-secondary text-[10px] uppercase tracking-wider mt-1"
                    :class="ownsItem(item.id) ? 'text-accent-amber' : ''"
                  >
                    {{ ownsItem(item.id) ? 'Đã sở hữu' : getRarityText(item.rarity) }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty Shards/Permanents View -->
        <div
          v-else-if="displayList.length === 0"
          class="text-center py-20 border border-border-default bg-bg-surface text-text-secondary"
        >
          <Icon icon="lucide:inbox" class="size-12 mx-auto mb-4 opacity-50" />
          <p>Không có vật phẩm nào trong mục này.</p>
        </div>

        <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div
            v-for="shard in displayList"
            :key="shard.uid"
            class="border border-border-default bg-bg-surface flex flex-col overflow-hidden relative group transition-colors"
            :class="{
              'border-accent-coral bg-accent-coral/5': selectedForReroll.includes(shard.uid),
            }"
          >
            <!-- Visual -->
            <div
              class="h-40 bg-gradient-to-br flex items-center justify-center relative overflow-hidden group-hover:opacity-90 transition-opacity"
              :class="RARITY_COLORS[shard.item.rarity]"
            >
              <Icon
                :icon="shard.item.type === 'Skin' ? 'lucide:shirt' : 'lucide:eye'"
                class="size-16 text-white/40 absolute z-0 group-hover:scale-110 transition-transform duration-500"
              />
              <!-- Selection overlay -->
              <div
                v-if="selectedForReroll.includes(shard.uid)"
                class="absolute inset-0 bg-accent-coral/50 flex items-center justify-center z-20 backdrop-blur-sm"
              >
                <Icon icon="lucide:check-circle-2" class="size-16 text-white" />
              </div>
            </div>

            <!-- Info -->
            <div class="p-4 flex-1 flex flex-col">
              <h3 class="font-display font-bold truncate" :title="shard.item.name">
                {{ shard.item.name }}
              </h3>
              <p class="text-text-secondary text-xs uppercase tracking-wider mb-4">
                {{ getRarityText(shard.item.rarity) }}
              </p>

              <!-- Actions for shards -->
              <div v-if="!shard.isPermanent" class="mt-auto space-y-2">
                <div class="flex gap-2">
                  <button
                    @click="handleDisenchant(shard.uid)"
                    class="flex-1 py-1 px-2 border border-border-default bg-bg-deep hover:bg-bg-elevated text-xs flex justify-center items-center gap-1 transition-colors"
                  >
                    <Icon icon="lucide:hammer" class="size-3" />
                    +{{ getCost(shard.item, 'disenchant') }}
                  </button>
                  <button
                    @click="handleUpgrade(shard.uid)"
                    class="flex-1 py-1 px-2 border border-orange-500/30 text-orange-400 hover:bg-orange-500/10 text-xs flex justify-center items-center gap-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    :disabled="orangeEssence < getCost(shard.item, 'upgrade')"
                  >
                    <Icon icon="lucide:arrow-up-circle" class="size-3" />
                    -{{ getCost(shard.item, 'upgrade') }}
                  </button>
                </div>
                <button
                  v-if="shard.item.type === 'Skin'"
                  @click="toggleRerollSelection(shard.uid)"
                  class="w-full py-1.5 border flex justify-center items-center gap-2 text-xs transition-colors"
                  :class="
                    selectedForReroll.includes(shard.uid)
                      ? 'bg-accent-coral border-accent-coral text-white'
                      : 'border-border-default hover:bg-bg-elevated'
                  "
                >
                  <Icon icon="lucide:dices" class="size-3" />
                  {{ selectedForReroll.includes(shard.uid) ? 'Bỏ chọn' : 'Chọn ghép' }}
                </button>
              </div>
              <div
                v-else
                class="mt-auto pt-2 border-t border-border-default/50 text-xs text-text-secondary flex items-center gap-2"
              >
                <Icon icon="lucide:lock" class="size-3" /> Thuộc sở hữu
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Floating Reroll Action Bar -->
      <div
        v-if="selectedForReroll.length > 0"
        class="fixed bottom-0 left-0 right-0 p-4 bg-bg-surface/90 backdrop-blur border-t border-accent-coral/30 flex items-center justify-center gap-6 z-20 animate-fade-up"
      >
        <div class="flex items-center gap-2">
          <span class="font-display font-bold">Ghép trang phục:</span>
          <span class="text-accent-coral font-bold">{{ selectedForReroll.length }} / 3 mảnh</span>
        </div>
        <button
          @click="executeReroll"
          :disabled="selectedForReroll.length !== 3"
          class="px-6 py-2 bg-accent-coral text-white font-bold font-display disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 hover:bg-accent-coral/90 transition-colors"
        >
          <Icon icon="lucide:sparkles" class="size-4" />
          Ghép thành Trang phục vĩnh viễn ngẫu nhiên
        </button>
        <button
          @click="selectedForReroll = []"
          class="text-text-secondary hover:text-text-primary text-sm underline"
        >
          Hủy
        </button>
      </div>

      <!-- Collection Item Details Modal -->
      <div
        v-if="selectedCollectionItem"
        class="fixed inset-0 bg-bg-deep/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
        @click.self="selectedCollectionItem = null"
      >
        <div
          class="w-full max-w-md bg-bg-deep border border-border-default shadow-2xl overflow-hidden animate-fade-up"
        >
          <!-- Visual Header -->
          <div
            class="h-64 bg-gradient-to-br flex items-center justify-center relative"
            :class="RARITY_COLORS[selectedCollectionItem.rarity as Rarity]"
          >
            <button
              @click="selectedCollectionItem = null"
              class="absolute top-2 right-2 p-2 bg-black/30 hover:bg-black/50 text-white rounded-full transition-colors z-20 backdrop-blur-md"
            >
              <Icon icon="lucide:x" class="size-5" />
            </button>
            <Icon
              :icon="selectedCollectionItem.type === 'Skin' ? 'lucide:shirt' : 'lucide:eye'"
              class="size-32 text-white/40 absolute z-0"
            />
          </div>

          <!-- Details Body -->
          <div class="p-6 space-y-6">
            <div>
              <div class="flex items-start justify-between mb-2">
                <h2 class="font-display font-bold text-2xl pr-4">
                  {{ selectedCollectionItem.name }}
                </h2>
                <div
                  class="shrink-0 px-2 py-1 text-xs font-bold uppercase tracking-wider border"
                  :class="
                    ownsItem(selectedCollectionItem.id)
                      ? 'border-accent-coral text-accent-coral bg-accent-coral/10'
                      : 'border-border-default text-text-secondary'
                  "
                >
                  {{ ownsItem(selectedCollectionItem.id) ? 'Đã Sở Hữu' : 'Chưa Sở Hữu' }}
                </div>
              </div>
              <p class="text-text-secondary flex items-center gap-2">
                <span
                  class="w-2 h-2 rounded-full"
                  :class="
                    RARITY_COLORS[selectedCollectionItem.rarity as Rarity]
                      ?.split(' ')[0]
                      ?.replace('from-', 'bg-')
                  "
                ></span>
                {{ getRarityText(selectedCollectionItem.rarity) }}
                {{ selectedCollectionItem.type === 'Skin' ? 'Trang Phục' : 'Mẫu Mắt' }}
              </p>
            </div>

            <div class="grid grid-cols-2 gap-4 border-t border-border-default pt-4">
              <div class="space-y-1">
                <p class="text-text-secondary text-xs uppercase tracking-wider">Giá Nâng Cấp</p>
                <div class="flex items-center gap-1.5">
                  <Icon :icon="OE_ICON" class="text-orange-400 size-4" />
                  <span class="font-display font-bold text-orange-400">{{
                    getCost(selectedCollectionItem, 'upgrade')
                  }}</span>
                </div>
              </div>
              <div class="space-y-1">
                <p class="text-text-secondary text-xs uppercase tracking-wider">Giá Phân Rã</p>
                <div class="flex items-center gap-1.5">
                  <Icon :icon="OE_ICON" class="text-accent-amber size-4" />
                  <span class="font-display font-bold text-accent-amber">{{
                    getCost(selectedCollectionItem, 'disenchant')
                  }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
