<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import type { CategoryId } from '@/data/categories'
import { processPages, formatViews, type AppItem } from '../composables/useApps'

const route = useRoute()
const pagesData = ref<AppItem[]>([])
const isLoading = ref(true)

const authorName = computed(() => (route.query.author as string) || '')

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

const authorApps = computed(() => {
  if (!authorName.value) return []
  return pagesData.value.filter((app) => app.author === authorName.value)
})

const totalViews = computed(() => {
  return authorApps.value.reduce((sum, app) => sum + app.views, 0)
})

const avgRating = computed(() => {
  if (authorApps.value.length === 0) return 0
  const sum = authorApps.value.reduce((s, app) => s + app.rating, 0)
  return sum / authorApps.value.length
})

// Fake comments
const fakeComments = [
  {
    user: 'DevFan001',
    text: 'Tuyệt vời! Tác giả này rất tài năng 👏',
    likes: 42,
    time: '2 giờ trước',
  },
  {
    user: 'CodeLover',
    text: 'Mỗi video đều chất lượng, keep it up!',
    likes: 28,
    time: '5 giờ trước',
  },
  { user: 'J2Teamer', text: 'Siêu phẩm! Đã bookmark tất cả', likes: 56, time: '1 ngày trước' },
  { user: 'WebDevVN', text: 'Nội dung đẹp, xem mượt', likes: 15, time: '2 ngày trước' },
  {
    user: 'TechEnthusiast',
    text: 'Cảm ơn tác giả đã chia sẻ video hay!',
    likes: 33,
    time: '3 ngày trước',
  },
]
</script>

<template>
  <div class="author-page">
    <!-- Header -->
    <header class="author-header">
      <RouterLink to="/jvibeos" class="back-btn">
        <span class="back-icon">←</span>
        <span>Quay lại</span>
      </RouterLink>
    </header>

    <div v-if="isLoading" class="loading">Đang tải...</div>

    <div v-else-if="!authorName" class="not-found">
      <h2>Không tìm thấy tác giả</h2>
      <RouterLink to="/jvibeos" class="back-link">Về trang chủ</RouterLink>
    </div>

    <template v-else>
      <!-- Author Profile -->
      <div class="author-profile">
        <div class="profile-main">
          <div class="author-avatar">
            {{ authorName.charAt(0).toUpperCase() }}
          </div>
          <div class="author-info">
            <h1 class="author-name">{{ authorName }}</h1>
            <div class="author-stats">
              <span class="stat">
                <span class="stat-icon">📱</span>
                <span class="stat-value">{{ authorApps.length }}</span> ứng dụng
              </span>
              <span class="stat">
                <span class="stat-icon">👁️</span>
                <span class="stat-value">{{ formatViews(totalViews) }}</span> views
              </span>
              <span class="stat">
                <span class="stat-icon">⭐</span>
                <span class="stat-value">{{ avgRating.toFixed(1) }}</span> đánh giá
              </span>
            </div>
          </div>
        </div>

        <div class="profile-actions">
          <button class="follow-btn"><span>➕</span> Theo dõi</button>
          <button class="message-btn"><span>💬</span> Nhắn tin</button>
        </div>
      </div>

      <!-- Tabs -->
      <div class="tabs">
        <button class="tab active">Ứng dụng ({{ authorApps.length }})</button>
        <button class="tab">Bình luận</button>
        <button class="tab">Giới thiệu</button>
      </div>

      <!-- Apps Grid -->
      <div class="apps-section">
        <h2 class="section-title">Ứng dụng đã đăng</h2>

        <div v-if="authorApps.length > 0" class="apps-grid">
          <RouterLink
            v-for="(app, index) in authorApps"
            :key="app.path"
            :to="`/jvibeos?app=${encodeURIComponent(app.path.slice(1))}`"
            class="app-card"
            :style="{ animationDelay: `${index * 50}ms` }"
          >
            <div
              class="app-thumbnail"
              :style="{
                background: `linear-gradient(135deg, hsl(${app.name.charCodeAt(0) * 10}, 70%, 60%), hsl(${app.name.charCodeAt(1) * 10}, 70%, 50%))`,
              }"
            >
              <span class="app-duration"
                >{{ app.duration }}:{{
                  Math.floor(Math.random() * 60)
                    .toString()
                    .padStart(2, '0')
                }}</span
              >
            </div>
            <div class="app-info">
              <h3 class="app-title">{{ app.name }}</h3>
              <div class="app-meta">
                <span>{{ formatViews(app.views) }} views</span>
                <span>•</span>
                <span>⭐ {{ app.rating.toFixed(1) }}</span>
              </div>
            </div>
          </RouterLink>
        </div>

        <div v-else class="no-apps">
          <p>Tác giả chưa đăng ứng dụng nào</p>
        </div>
      </div>

      <!-- Comments Section -->
      <div class="comments-section">
        <h2 class="section-title">Bình luận gần đây</h2>

        <!-- Fake Input -->
        <div class="comment-input">
          <div class="user-avatar">You</div>
          <div class="input-wrapper">
            <textarea placeholder="Viết bình luận..." rows="2" class="comment-textarea" />
            <button class="submit-btn">Gửi</button>
          </div>
        </div>

        <!-- Comments -->
        <div class="comments-list">
          <div v-for="comment in fakeComments" :key="comment.user" class="comment-item">
            <div class="comment-avatar">
              {{ comment.user.charAt(0) }}
            </div>
            <div class="comment-content">
              <div class="comment-header">
                <span class="comment-user">{{ comment.user }}</span>
                <span class="comment-time">{{ comment.time }}</span>
              </div>
              <p class="comment-text">{{ comment.text }}</p>
              <div class="comment-actions">
                <button class="like-btn"><span>👍</span> {{ comment.likes }}</button>
                <button class="reply-btn">Trả lời</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.author-page {
  min-height: 100vh;
  background: #000;
}

.author-header {
  background: #000;
  border-bottom: 1px solid #222;
  padding: 12px 20px;
}

.back-btn {
  display: inline-flex;
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

.loading,
.not-found {
  text-align: center;
  padding: 60px 20px;
  color: #666;
}

.not-found h2 {
  color: #fff;
}

.author-profile {
  max-width: 1200px;
  margin: 0 auto;
  padding: 30px 20px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
  border-bottom: 1px solid #222;
}

.profile-main {
  display: flex;
  gap: 20px;
}

.author-avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 40px;
  font-weight: 700;
  flex-shrink: 0;
}

.author-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.author-name {
  font-size: 28px;
  font-weight: 700;
  color: #fff;
  margin: 0;
}

.author-stats {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.stat {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #999;
  font-size: 14px;
}

.stat-icon {
  font-size: 16px;
}

.stat-value {
  color: #fff;
  font-weight: 600;
}

.profile-actions {
  display: flex;
  gap: 10px;
}

.follow-btn,
.message-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.follow-btn {
  background: #ff0000;
  color: #fff;
}

.follow-btn:hover {
  background: #cc0000;
}

.message-btn {
  background: #222;
  color: #fff;
}

.message-btn:hover {
  background: #333;
}

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

.apps-section {
  max-width: 1200px;
  margin: 0 auto;
  padding: 30px 20px;
}

.section-title {
  font-size: 20px;
  color: #fff;
  margin: 0 0 20px;
}

.apps-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
}

.app-card {
  display: block;
  text-decoration: none;
  animation: fadeUp 0.4s ease-out forwards;
  opacity: 0;
}

@keyframes fadeUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
  from {
    opacity: 0;
    transform: translateY(20px);
  }
}

.app-thumbnail {
  aspect-ratio: 16/9;
  border-radius: 8px;
  position: relative;
  overflow: hidden;
}

.app-duration {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.8);
  color: #fff;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 12px;
}

.app-info {
  padding: 10px 0;
}

.app-title {
  font-size: 14px;
  color: #fff;
  margin: 0 0 6px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.app-meta {
  display: flex;
  gap: 6px;
  font-size: 12px;
  color: #999;
}

.no-apps {
  text-align: center;
  padding: 40px;
  color: #666;
}

/* Comments */
.comments-section {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px 60px;
}

.comment-input {
  display: flex;
  gap: 12px;
  margin-bottom: 30px;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #ff0000;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  flex-shrink: 0;
}

.input-wrapper {
  flex: 1;
}

.comment-textarea {
  width: 100%;
  background: #111;
  border: 1px solid #333;
  border-radius: 6px;
  padding: 12px;
  color: #fff;
  font-size: 14px;
  resize: none;
  outline: none;
}

.comment-textarea:focus {
  border-color: #ff0000;
}

.comment-textarea::placeholder {
  color: #666;
}

.submit-btn {
  margin-top: 8px;
  background: #ff0000;
  color: #fff;
  border: none;
  padding: 8px 20px;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
}

.submit-btn:hover {
  background: #cc0000;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.comment-item {
  display: flex;
  gap: 12px;
}

.comment-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #4facfe, #00f2fe);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  flex-shrink: 0;
}

.comment-content {
  flex: 1;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.comment-user {
  color: #fff;
  font-weight: 500;
  font-size: 14px;
}

.comment-time {
  color: #666;
  font-size: 12px;
}

.comment-text {
  color: #aaa;
  font-size: 14px;
  line-height: 1.5;
  margin: 0 0 8px;
}

.comment-actions {
  display: flex;
  gap: 12px;
}

.like-btn,
.reply-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  background: transparent;
  border: none;
  color: #666;
  font-size: 12px;
  cursor: pointer;
  padding: 4px 0;
}

.like-btn:hover,
.reply-btn:hover {
  color: #fff;
}

/* Responsive */
@media (max-width: 1200px) {
  .apps-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (max-width: 900px) {
  .apps-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .author-profile {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .profile-main {
    flex-direction: column;
    align-items: center;
  }

  .author-stats {
    justify-content: center;
  }
}

@media (max-width: 600px) {
  .apps-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .author-avatar {
    width: 80px;
    height: 80px;
    font-size: 32px;
  }

  .author-name {
    font-size: 22px;
  }

  .tabs {
    overflow-x: auto;
  }

  .tab {
    padding: 12px 16px;
    white-space: nowrap;
  }
}
</style>
