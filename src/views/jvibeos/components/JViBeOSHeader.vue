<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { RouterLink } from 'vue-router'
import type { CategoryId } from '@/data/categories'
import { categories } from '@/data/categories'

const props = defineProps<{
  modelValue: string
  activeCategory: CategoryId | 'all'
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'update:activeCategory': [value: CategoryId | 'all']
}>()

const searchInput = ref(props.modelValue)
const showMobileMenu = ref(false)

// Sync searchInput with prop
watch(
  () => props.modelValue,
  (val) => {
    searchInput.value = val
  },
)

const handleSearch = () => {
  emit('update:modelValue', searchInput.value)
}

const handleCategoryClick = (category: CategoryId | 'all') => {
  emit('update:activeCategory', category)
  showMobileMenu.value = false
}

const navCategories = computed(() => [
  { id: 'all' as const, label: 'Home' },
  ...categories.slice(0, 6),
])

const allCategories = computed(() => [{ id: 'all' as const, label: 'Home' }, ...categories])
</script>

<template>
  <header class="jvibeos-header">
    <div class="header-content">
      <!-- Logo -->
      <RouterLink to="/jvibeos" class="logo">
        <span class="logo-icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <polygon points="5 3 19 12 5 21" />
          </svg>
        </span>
        <span class="logo-text">JViBeOS</span>
      </RouterLink>

      <!-- Search -->
      <div class="search-container">
        <input
          v-model="searchInput"
          type="text"
          placeholder="Tìm kiếm..."
          class="search-input"
          @keyup.enter="handleSearch"
        />
        <button class="search-btn" @click="handleSearch">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </button>
      </div>

      <!-- Mobile Menu Button -->
      <button class="mobile-menu-btn" @click="showMobileMenu = !showMobileMenu">
        <span class="hamburger" :class="{ open: showMobileMenu }">
          <span></span>
          <span></span>
          <span></span>
        </span>
      </button>

      <!-- Navigation - Desktop -->
      <nav class="nav-tabs desktop-nav">
        <button
          v-for="cat in navCategories"
          :key="cat.id"
          class="nav-tab"
          :class="{ active: activeCategory === cat.id }"
          @click="handleCategoryClick(cat.id)"
        >
          {{ cat.label }}
        </button>
        <RouterLink to="/jvibeos?ranking=1" class="ranking-btn"> Bảng Xếp Hạng </RouterLink>
      </nav>
    </div>

    <!-- Mobile Navigation Dropdown -->
    <nav v-if="showMobileMenu" class="mobile-nav">
      <button
        v-for="cat in allCategories"
        :key="cat.id"
        class="mobile-nav-tab"
        :class="{ active: activeCategory === cat.id }"
        @click="handleCategoryClick(cat.id)"
      >
        {{ cat.label }}
      </button>
      <RouterLink to="/jvibeos?ranking=1" class="mobile-nav-tab ranking-link">
        🏆 Bảng Xếp Hạng
      </RouterLink>
    </nav>
  </header>
</template>

<style scoped>
.jvibeos-header {
  background: #000;
  border-bottom: 1px solid #333;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  flex-shrink: 0;
}

.logo-icon {
  background: #ff0000;
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}

.logo-text {
  font-family: var(--font-display, sans-serif);
  font-size: 20px;
  font-weight: 700;
  color: #fff;
  letter-spacing: -0.5px;
}

.search-container {
  flex: 1;
  max-width: 400px;
  display: flex;
  background: #1a1a1a;
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid #333;
}

.search-input {
  flex: 1;
  background: transparent;
  border: none;
  padding: 8px 12px;
  color: #fff;
  font-size: 14px;
  outline: none;
  min-width: 0;
}

.search-input::placeholder {
  color: #666;
}

.search-btn {
  background: #ff0000;
  border: none;
  padding: 8px 12px;
  cursor: pointer;
  color: #fff;
  transition: background 0.2s;
  flex-shrink: 0;
}

.search-btn:hover {
  background: #cc0000;
}

.mobile-menu-btn {
  display: none;
  background: transparent;
  border: none;
  padding: 8px;
  cursor: pointer;
}

.hamburger {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 24px;
}

.hamburger span {
  display: block;
  height: 2px;
  background: #fff;
  border-radius: 2px;
  transition: all 0.3s;
}

.hamburger.open span:nth-child(1) {
  transform: rotate(45deg) translate(4px, 4px);
}

.hamburger.open span:nth-child(2) {
  opacity: 0;
}

.hamburger.open span:nth-child(3) {
  transform: rotate(-45deg) translate(5px, -5px);
}

.desktop-nav {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.nav-tab {
  background: transparent;
  border: none;
  color: #999;
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
  white-space: nowrap;
}

.nav-tab:hover {
  background: #222;
  color: #fff;
}

.nav-tab.active {
  background: #ff0000;
  color: #fff;
}

.ranking-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 12px;
  font-size: 16px;
  text-decoration: none;
  border-radius: 4px;
  transition: background 0.2s;
}

.ranking-btn:hover {
  background: #222;
}

.mobile-nav {
  display: none;
  padding: 8px 16px 16px;
  border-top: 1px solid #222;
}

.mobile-nav-tab {
  display: block;
  width: 100%;
  text-align: left;
  background: transparent;
  border: none;
  color: #999;
  padding: 10px 14px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
}

.mobile-nav-tab:hover {
  background: #222;
  color: #fff;
}

.mobile-nav-tab.active {
  background: #ff0000;
  color: #fff;
}

@media (max-width: 900px) {
  .desktop-nav {
    display: none;
  }

  .mobile-menu-btn {
    display: block;
  }

  .mobile-nav {
    display: block;
  }
}

@media (max-width: 600px) {
  .logo-text {
    display: none;
  }

  .search-container {
    max-width: none;
  }
}
</style>
