<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { Icon } from '@iconify/vue'
import { categories } from '@/data/categories'

const route = useRoute()
const isMobileMenuOpen = ref(false)

const navItems = [
  { to: '/', label: 'Trang chủ', icon: 'lucide:home' },
  { to: '/leaderboard', label: 'Xếp hạng', icon: 'lucide:trophy' },
  { to: '/bookmarks', label: 'Yêu thích', icon: 'lucide:heart' },
]

const communityItems = [
  { to: '/members', label: 'Thành viên', icon: 'lucide:users' },
  { to: '/contributors', label: 'Đóng góp', icon: 'lucide:globe' },
]

const isCategoryRoute = computed(() => route.path.startsWith('/category/'))
const isCommunityRoute = computed(() => communityItems.some((item) => route.path === item.to))

function useDropdown() {
  const isOpen = ref(false)
  const isMobileOpen = ref(false)
  let timeout: ReturnType<typeof setTimeout> | undefined

  function open() {
    clearTimeout(timeout)
    isOpen.value = true
  }

  function scheduleClose() {
    timeout = setTimeout(() => {
      isOpen.value = false
    }, 150)
  }

  return { isOpen, isMobileOpen, open, scheduleClose }
}

const categoryDropdown = useDropdown()
const communityDropdown = useDropdown()

watch(
  () => route.path,
  () => {
    isMobileMenuOpen.value = false
    categoryDropdown.isOpen.value = false
    categoryDropdown.isMobileOpen.value = false
    communityDropdown.isOpen.value = false
    communityDropdown.isMobileOpen.value = false
  },
)
</script>

<template>
  <nav
    class="fixed top-0 left-0 right-0 z-40 bg-bg-deep/80 backdrop-blur-md border-b border-border-default"
  >
    <div class="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
      <!-- Brand -->
      <RouterLink to="/" class="font-display font-bold text-lg text-text-primary tracking-tight">
        J2TEAM Community
      </RouterLink>

      <!-- Desktop nav -->
      <div class="hidden md:flex items-center gap-1">
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="inline-flex items-center gap-1.5 px-3 py-2 font-display text-sm leading-none tracking-wide text-text-secondary transition-colors duration-200 hover:text-text-primary"
          exact-active-class="!text-accent-coral"
          active-class=""
        >
          <Icon :icon="item.icon" class="w-4 h-4 shrink-0" />
          <span class="translate-y-px">{{ item.label }}</span>
        </RouterLink>

        <!-- Community dropdown -->
        <div
          class="relative"
          @mouseenter="communityDropdown.open"
          @mouseleave="communityDropdown.scheduleClose"
        >
          <button
            class="inline-flex items-center gap-1.5 px-3 py-2 font-display text-sm leading-none tracking-wide transition-colors duration-200 hover:text-text-primary"
            :class="isCommunityRoute ? '!text-accent-coral' : 'text-text-secondary'"
            @click="communityDropdown.isOpen.value = !communityDropdown.isOpen.value"
          >
            <Icon icon="lucide:users" class="w-4 h-4 shrink-0" />
            <span class="translate-y-px">Cộng đồng</span>
            <Icon
              icon="lucide:chevron-down"
              class="w-3 h-3 shrink-0 transition-transform duration-200"
              :class="{ 'rotate-180': communityDropdown.isOpen.value }"
            />
          </button>

          <Transition
            enter-active-class="transition-all duration-150 ease-out"
            enter-from-class="opacity-0 -translate-y-1 scale-95"
            enter-to-class="opacity-100 translate-y-0 scale-100"
            leave-active-class="transition-all duration-100 ease-in"
            leave-from-class="opacity-100 translate-y-0 scale-100"
            leave-to-class="opacity-0 -translate-y-1 scale-95"
          >
            <div
              v-if="communityDropdown.isOpen.value"
              class="absolute right-0 top-full mt-1 w-48 border border-border-default bg-bg-deep/95 backdrop-blur-md shadow-lg py-1.5"
              @mouseenter="communityDropdown.open"
              @mouseleave="communityDropdown.scheduleClose"
            >
              <RouterLink
                v-for="item in communityItems"
                :key="item.to"
                :to="item.to"
                class="flex items-center gap-2.5 px-3.5 py-2 text-sm text-text-secondary transition-colors duration-150 hover:text-text-primary hover:bg-bg-surface"
                active-class="!text-accent-coral bg-bg-surface"
              >
                <Icon :icon="item.icon" class="w-4 h-4 shrink-0" />
                <span>{{ item.label }}</span>
              </RouterLink>
            </div>
          </Transition>
        </div>

        <!-- Categories dropdown -->
        <div
          class="relative"
          @mouseenter="categoryDropdown.open"
          @mouseleave="categoryDropdown.scheduleClose"
        >
          <button
            class="inline-flex items-center gap-1.5 px-3 py-2 font-display text-sm leading-none tracking-wide transition-colors duration-200 hover:text-text-primary"
            :class="isCategoryRoute ? '!text-accent-coral' : 'text-text-secondary'"
            @click="categoryDropdown.isOpen.value = !categoryDropdown.isOpen.value"
          >
            <Icon icon="lucide:layout-grid" class="w-4 h-4 shrink-0" />
            <span class="translate-y-px">Danh mục</span>
            <Icon
              icon="lucide:chevron-down"
              class="w-3 h-3 shrink-0 transition-transform duration-200"
              :class="{ 'rotate-180': categoryDropdown.isOpen.value }"
            />
          </button>

          <Transition
            enter-active-class="transition-all duration-150 ease-out"
            enter-from-class="opacity-0 -translate-y-1 scale-95"
            enter-to-class="opacity-100 translate-y-0 scale-100"
            leave-active-class="transition-all duration-100 ease-in"
            leave-from-class="opacity-100 translate-y-0 scale-100"
            leave-to-class="opacity-0 -translate-y-1 scale-95"
          >
            <div
              v-if="categoryDropdown.isOpen.value"
              class="absolute right-0 top-full mt-1 w-56 border border-border-default bg-bg-deep/95 backdrop-blur-md shadow-lg py-1.5"
              @mouseenter="categoryDropdown.open"
              @mouseleave="categoryDropdown.scheduleClose"
            >
              <RouterLink
                v-for="cat in categories"
                :key="cat.id"
                :to="`/category/${cat.id}`"
                class="flex items-center gap-2.5 px-3.5 py-2 text-sm text-text-secondary transition-colors duration-150 hover:text-text-primary hover:bg-bg-surface"
                active-class="!text-accent-coral bg-bg-surface"
              >
                <Icon :icon="cat.icon" class="w-4 h-4 shrink-0" />
                <span>{{ cat.label }}</span>
              </RouterLink>
            </div>
          </Transition>
        </div>
      </div>

      <!-- Mobile hamburger -->
      <button
        class="md:hidden p-2 text-text-secondary transition-colors hover:text-text-primary"
        aria-label="Menu"
        :aria-expanded="isMobileMenuOpen"
        @click="isMobileMenuOpen = !isMobileMenuOpen"
      >
        <Icon :icon="isMobileMenuOpen ? 'lucide:x' : 'lucide:menu'" class="w-5 h-5" />
      </button>
    </div>

    <!-- Mobile menu -->
    <Transition
      enter-active-class="transition-all duration-200 ease-out"
      enter-from-class="opacity-0 -translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-all duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-2"
    >
      <div
        v-if="isMobileMenuOpen"
        class="md:hidden border-t border-border-default bg-bg-deep/95 backdrop-blur-md max-h-[calc(100dvh-3.5rem)] overflow-y-auto overscroll-contain"
      >
        <div class="max-w-5xl mx-auto px-4 py-2 flex flex-col gap-0.5">
          <RouterLink
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            class="inline-flex items-center gap-3 px-4 py-3 rounded-lg font-display text-sm leading-none tracking-wide text-text-secondary transition-colors duration-200 hover:text-text-primary hover:bg-bg-surface"
            exact-active-class="!text-accent-coral bg-bg-surface"
            active-class=""
          >
            <Icon :icon="item.icon" class="w-4 h-4 shrink-0" />
            <span class="translate-y-px">{{ item.label }}</span>
          </RouterLink>

          <!-- Mobile community -->
          <button
            class="inline-flex items-center gap-3 px-4 py-3 rounded-lg font-display text-sm leading-none tracking-wide transition-colors duration-200 hover:text-text-primary hover:bg-bg-surface"
            :class="isCommunityRoute ? '!text-accent-coral' : 'text-text-secondary'"
            @click="communityDropdown.isMobileOpen.value = !communityDropdown.isMobileOpen.value"
          >
            <Icon icon="lucide:users" class="w-4 h-4 shrink-0" />
            <span class="translate-y-px">Cộng đồng</span>
            <Icon
              icon="lucide:chevron-down"
              class="w-3.5 h-3.5 shrink-0 ml-auto transition-transform duration-200"
              :class="{ 'rotate-180': communityDropdown.isMobileOpen.value }"
            />
          </button>

          <div v-if="communityDropdown.isMobileOpen.value" class="flex flex-col gap-0.5 pl-4">
            <RouterLink
              v-for="item in communityItems"
              :key="item.to"
              :to="item.to"
              class="inline-flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-text-secondary transition-colors duration-200 hover:text-text-primary hover:bg-bg-surface"
              active-class="!text-accent-coral bg-bg-surface"
            >
              <Icon :icon="item.icon" class="w-4 h-4 shrink-0" />
              <span>{{ item.label }}</span>
            </RouterLink>
          </div>

          <!-- Mobile categories -->
          <button
            class="inline-flex items-center gap-3 px-4 py-3 rounded-lg font-display text-sm leading-none tracking-wide transition-colors duration-200 hover:text-text-primary hover:bg-bg-surface"
            :class="isCategoryRoute ? '!text-accent-coral' : 'text-text-secondary'"
            @click="categoryDropdown.isMobileOpen.value = !categoryDropdown.isMobileOpen.value"
          >
            <Icon icon="lucide:layout-grid" class="w-4 h-4 shrink-0" />
            <span class="translate-y-px">Danh mục</span>
            <Icon
              icon="lucide:chevron-down"
              class="w-3.5 h-3.5 shrink-0 ml-auto transition-transform duration-200"
              :class="{ 'rotate-180': categoryDropdown.isMobileOpen.value }"
            />
          </button>

          <div v-if="categoryDropdown.isMobileOpen.value" class="flex flex-col gap-0.5 pl-4">
            <RouterLink
              v-for="cat in categories"
              :key="cat.id"
              :to="`/category/${cat.id}`"
              class="inline-flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-text-secondary transition-colors duration-200 hover:text-text-primary hover:bg-bg-surface"
              active-class="!text-accent-coral bg-bg-surface"
            >
              <Icon :icon="cat.icon" class="w-4 h-4 shrink-0" />
              <span>{{ cat.label }}</span>
            </RouterLink>
          </div>
        </div>
      </div>
    </Transition>
  </nav>
</template>
