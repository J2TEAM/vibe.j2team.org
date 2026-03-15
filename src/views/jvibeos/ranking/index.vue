<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import type { CategoryId } from '@/data/categories'
import { processPages, formatViews, type AppItem } from '../composables/useApps'

const pagesData = ref<AppItem[]>([])
const isLoading = ref(true)
const activeTab = ref<'views' | 'apps' | 'rating'>('apps')

onMounted(async () => {
  const pagesResponse = await fetch('/data/pages.json')
  const rawPages = (await pagesResponse.json()) as {
    name: string
    description: string
    author: string
    path: string
    category: CategoryId
  }[]
  pagesData.value = processPages(rawPages)
  isLoading.value = false
})

interface AuthorStats {
  name: string
  avatar: string
  appsCount: number
  totalViews: number
  avgRating: number
  likes: number
  followers: number
}

const authorStats = computed((): AuthorStats[] => {
  const authorMap = new Map<string, AuthorStats>()

  pagesData.value.forEach((app) => {
    const existing = authorMap.get(app.author)
    if (existing) {
      existing.appsCount++
      existing.totalViews += app.views
      existing.avgRating =
        (existing.avgRating * (existing.appsCount - 1) + app.rating) / existing.appsCount
    } else {
      authorMap.set(app.author, {
        name: app.author,
        avatar: app.author.charAt(0).toUpperCase(),
        appsCount: 1,
        totalViews: app.views,
        avgRating: app.rating,
        likes: Math.floor(Math.random() * 5000) + 100,
        followers: Math.floor(Math.random() * 2000) + 50,
      })
    }
  })

  return Array.from(authorMap.values())
})

const sortedAuthors = computed(() => {
  const sorted = [...authorStats.value]

  if (activeTab.value === 'views') {
    sorted.sort((a, b) => b.totalViews - a.totalViews)
  } else if (activeTab.value === 'apps') {
    sorted.sort((a, b) => b.appsCount - a.appsCount)
  } else {
    sorted.sort((a, b) => b.avgRating - a.avgRating)
  }

  return sorted.slice(0, 50)
})

const top3Authors = computed(() => sortedAuthors.value.slice(0, 3))
</script>

<template>
  <div class="ranking-page">
    <!-- Header -->
    <header class="ranking-header">
      <RouterLink to="/jvibeos" class="back-btn">
        <span class="back-icon">←</span>
        <span>Quay lại</span>
      </RouterLink>
      <h1 class="page-title">Bảng xếp hạng tác giả</h1>
    </header>

    <div v-if="isLoading" class="loading">Đang tải...</div>

    <template v-else>
      <!-- Top 3 Podium -->
      <div class="podium-section">
        <div class="podium">
          <!-- 2nd -->
          <div class="podium-item second">
            <RouterLink
              :to="`/jvibeos?author=${encodeURIComponent(top3Authors[1]?.name || '')}`"
              class="podium-link"
            >
              <div
                class="podium-avatar"
                :style="{ background: 'linear-gradient(135deg, #c0c0c0, #808080)' }"
              >
                {{ top3Authors[1]?.avatar }}
              </div>
              <div class="podium-name">{{ top3Authors[1]?.name }}</div>
              <div class="podium-stats">
                <span>{{ top3Authors[1]?.appsCount }} videos</span>
                <span>{{ formatViews(top3Authors[1]?.totalViews || 0) }} views</span>
              </div>
            </RouterLink>
            <div class="podium-stand">2</div>
          </div>

          <!-- 1st -->
          <div class="podium-item first">
            <RouterLink
              :to="`/jvibeos?author=${encodeURIComponent(top3Authors[0]?.name || '')}`"
              class="podium-link"
            >
              <div class="crown">👑</div>
              <div
                class="podium-avatar"
                :style="{ background: 'linear-gradient(135deg, #ffd700, #ffaa00)' }"
              >
                {{ top3Authors[0]?.avatar }}
              </div>
              <div class="podium-name">{{ top3Authors[0]?.name }}</div>
              <div class="podium-stats">
                <span>{{ top3Authors[0]?.appsCount }} apps</span>
                <span>{{ formatViews(top3Authors[0]?.totalViews || 0) }} views</span>
              </div>
            </RouterLink>
            <div class="podium-stand">1</div>
          </div>

          <!-- 3rd -->
          <div class="podium-item third">
            <RouterLink
              :to="`/jvibeos?author=${encodeURIComponent(top3Authors[2]?.name || '')}`"
              class="podium-link"
            >
              <div
                class="podium-avatar"
                :style="{ background: 'linear-gradient(135deg, #cd7f32, #8b4513)' }"
              >
                {{ top3Authors[2]?.avatar }}
              </div>
              <div class="podium-name">{{ top3Authors[2]?.name }}</div>
              <div class="podium-stats">
                <span>{{ top3Authors[2]?.appsCount }} apps</span>
                <span>{{ formatViews(top3Authors[2]?.totalViews || 0) }} views</span>
              </div>
            </RouterLink>
            <div class="podium-stand">3</div>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="tabs">
        <!-- <button
          class="tab"
          :class="{ active: activeTab === 'views' }"
          @click="activeTab = 'views'"
        >
          Lượt xem
        </button>-->
        <button class="tab" :class="{ active: activeTab === 'apps' }" @click="activeTab = 'apps'">
          Số videos
        </button>
        <button
          class="tab"
          :class="{ active: activeTab === 'rating' }"
          @click="activeTab = 'rating'"
        >
          Đánh giá
        </button>
      </div>

      <!-- Ranking List -->
      <div class="ranking-list">
        <div
          v-for="(author, index) in sortedAuthors"
          :key="author.name"
          class="ranking-item"
          :class="{ top3: index < 3 }"
        >
          <div class="rank-number">{{ index + 1 }}</div>

          <RouterLink
            :to="`/jvibeos?author=${encodeURIComponent(author.name)}`"
            class="author-link"
          >
            <div class="author-avatar">
              {{ author.avatar }}
            </div>
            <div class="author-info">
              <div class="author-name">{{ author.name }}</div>
              <div class="author-stats">
                <span>📱 {{ author.appsCount }} videos</span>
                <span>👁️ {{ formatViews(author.totalViews) }}</span>
              </div>
            </div>
          </RouterLink>

          <div class="author-rating">
            <span class="stars">
              <span
                v-for="s in 5"
                :key="s"
                class="star"
                :class="{ filled: s <= Math.round(author.avgRating) }"
                >★</span
              >
            </span>
            <span class="rating-value">{{ author.avgRating.toFixed(1) }}</span>
          </div>

          <div class="author-actions">
            <button class="follow-btn-small">➕ Theo dõi</button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.ranking-page {
  min-height: 100vh;
  background: #000;
}

.ranking-header {
  background: #000;
  border-bottom: 1px solid #222;
  padding: 12px 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  position: sticky;
  top: 0;
  z-index: 100;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #ff0000;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
}

.back-btn:hover {
  text-decoration: underline;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: #fff;
  margin: 0;
}

.loading {
  text-align: center;
  padding: 60px;
  color: #666;
}

/* Podium */
.podium-section {
  background: linear-gradient(180deg, #111 0%, #000 100%);
  padding: 40px 20px 60px;
}

.podium {
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  justify-content: center;
  align-items: flex-end;
  gap: 20px;
}

.podium-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.podium-link {
  text-decoration: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: transform 0.2s;
}

.podium-link:hover {
  transform: scale(1.05);
}

.crown {
  font-size: 32px;
  margin-bottom: -10px;
  z-index: 1;
}

.podium-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 32px;
  font-weight: 700;
  border: 4px solid;
}

.podium-item.first .podium-avatar {
  width: 100px;
  height: 100px;
  font-size: 40px;
}

.podium-item.first {
  order: 2;
}

.podium-item.second {
  order: 1;
}

.podium-item.third {
  order: 3;
}

.podium-name {
  margin-top: 12px;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  text-align: center;
  max-width: 120px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.podium-stats {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 11px;
  color: #999;
  text-align: center;
}

.podium-stand {
  width: 100px;
  height: 60px;
  background: linear-gradient(180deg, #333 0%, #1a1a1a 100%);
  border-radius: 8px 8px 0 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 700;
  color: #fff;
  margin-top: 16px;
}

.podium-item.first .podium-stand {
  height: 80px;
  background: linear-gradient(180deg, #ffd700 0%, #cc9900 100%);
}

.podium-item.second .podium-stand {
  background: linear-gradient(180deg, #c0c0c0 0%, #808080 100%);
}

.podium-item.third .podium-stand {
  background: linear-gradient(180deg, #cd7f32 0%, #8b4513 100%);
}

/* Tabs */
.tabs {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  gap: 4px;
  padding: 0 20px;
  border-bottom: 1px solid #222;
}

.tab {
  background: transparent;
  border: none;
  color: #999;
  padding: 14px 20px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}

.tab:hover {
  color: #fff;
}

.tab.active {
  color: #fff;
  border-bottom-color: #ff0000;
}

/* Ranking List */
.ranking-list {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.ranking-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #111;
  border-radius: 8px;
  margin-bottom: 10px;
  transition: background 0.2s;
}

.ranking-item:hover {
  background: #1a1a1a;
}

.ranking-item.top3 {
  background: linear-gradient(90deg, #1a1a1a 0%, #111 100%);
}

.rank-number {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 700;
  color: #fff;
  background: #222;
  border-radius: 8px;
}

.ranking-item.top3 .rank-number {
  background: #ff0000;
}

.ranking-item:nth-child(1) .rank-number {
  background: #ffd700;
  color: #000;
}

.ranking-item:nth-child(2) .rank-number {
  background: #c0c0c0;
  color: #000;
}

.ranking-item:nth-child(3) .rank-number {
  background: #cd7f32;
  color: #000;
}

.author-link {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
}

.author-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 20px;
  font-weight: 600;
  flex-shrink: 0;
}

.author-info {
  min-width: 0;
}

.author-name {
  font-size: 15px;
  font-weight: 600;
  color: #fff;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.author-stats {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #999;
}

.author-rating {
  display: flex;
  align-items: center;
  gap: 6px;
}

.stars {
  display: flex;
}

.star {
  color: #444;
  font-size: 14px;
}

.star.filled {
  color: #ffa500;
}

.rating-value {
  color: #ffa500;
  font-weight: 500;
  font-size: 14px;
}

.author-actions {
  flex-shrink: 0;
}

.follow-btn-small {
  background: #222;
  border: none;
  color: #fff;
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.2s;
}

.follow-btn-small:hover {
  background: #ff0000;
}

/* Responsive */
@media (max-width: 768px) {
  .podium {
    gap: 10px;
  }

  .podium-avatar {
    width: 60px;
    height: 60px;
    font-size: 24px;
  }

  .podium-item.first .podium-avatar {
    width: 80px;
    height: 80px;
    font-size: 32px;
  }

  .podium-stand {
    width: 80px;
    height: 50px;
    font-size: 20px;
  }

  .podium-item.first .podium-stand {
    height: 60px;
  }

  .podium-name {
    font-size: 12px;
    max-width: 100px;
  }

  .ranking-item {
    flex-wrap: wrap;
    gap: 12px;
  }

  .author-link {
    flex: 1 1 calc(100% - 80px);
  }

  .author-rating {
    order: 4;
    width: 100%;
    justify-content: flex-start;
    padding-left: 66px;
  }

  .author-actions {
    display: none;
  }
}
</style>
